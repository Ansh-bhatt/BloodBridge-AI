"""Smoke-test the documented FastAPI endpoint surface against local seeded data."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import asyncio

import httpx

from app.main import app


def assert_ok(response, expected_status: int = 200) -> dict:
    assert response.status_code == expected_status, response.text
    body = response.json()
    assert body.get("success") is True, body
    return body


async def main() -> None:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://bloodbridge.local") as client:
        assert (await client.get("/docs")).status_code == 200
        hospitals = assert_ok(await client.get("/api/v1/hospitals"))["data"]
        assert len(hospitals) == 5
        hospital_id = hospitals[0]["id"]
        peer_hospital_id = hospitals[1]["id"]

        assert_ok(await client.get(f"/api/v1/hospitals/{hospital_id}"))
        inventory = assert_ok(await client.get("/api/v1/inventory"))["data"]
        assert inventory
        assert_ok(await client.get(f"/api/v1/inventory/{hospital_id}"))
        updated = assert_ok(await client.put(f"/api/v1/inventory/{inventory[0]['id']}", json={"units_reserved": 1}))["data"]
        assert updated["units_reserved"] == 1

        prediction_response = assert_ok(await client.post("/api/v1/predictions/refresh"))["data"]
        assert prediction_response and "explanation" in prediction_response[0]
        assert_ok(await client.get(f"/api/v1/predictions/{hospital_id}"))

        transfer_payload = {
            "source_hospital_id": hospital_id,
            "target_hospital_id": peer_hospital_id,
            "blood_group": inventory[0]["blood_group"],
            "component": inventory[0]["component"],
            "units": 1,
        }
        transfer = assert_ok(await client.post("/api/v1/redistribution", json=transfer_payload), 201)["data"]
        assert_ok(await client.get("/api/v1/redistribution"))
        assert_ok(await client.put(f"/api/v1/redistribution/{transfer['id']}/approve"))

        emergency_payload = {
            "requesting_hospital_id": hospital_id,
            "blood_group": "O-",
            "component": "RBC",
            "units_needed": 3,
            "priority": "CRITICAL",
        }
        emergency = assert_ok(await client.post("/api/v1/emergency", json=emergency_payload), 201)["data"]
        assert_ok(await client.get("/api/v1/emergency/active"))
        assert_ok(
            await client.put(
                f"/api/v1/emergency/{emergency['id']}/respond",
                json={"responding_hospital_id": peer_hospital_id, "units_available": 3, "note": "Driver dispatched"},
            )
        )

        user = assert_ok(
            await client.post(
                "/api/v1/auth/register",
                json={"email": "demo@bloodbridge.ai", "full_name": "Demo Manager", "password": "SecureDemoPass123", "hospital_id": hospital_id},
            ),
            201,
        )["data"]
        assert user["email"] == "demo@bloodbridge.ai"
        token = assert_ok(await client.post("/api/v1/auth/login", json={"email": "demo@bloodbridge.ai", "password": "SecureDemoPass123"}))["data"]["access_token"]
        assert_ok(await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}))

    print("All documented API endpoints passed local Swagger-app smoke tests.")


if __name__ == "__main__":
    asyncio.run(main())
