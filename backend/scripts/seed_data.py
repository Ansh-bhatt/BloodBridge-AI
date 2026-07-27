"""Seed BloodBridge AI with deterministic demo hospitals, demand, and inventory."""

from datetime import date, timedelta
from pathlib import Path
import random
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models import BloodComponent, BloodGroup, BloodInventory, HistoricalDemand, Hospital

HOSPITALS = [
    ("CityCare Hospital Delhi", "DEL-001", "Saket", "Delhi", 28.5245, 77.2066),
    ("Harborview Medical Centre", "MUM-001", "Andheri East", "Mumbai", 19.1197, 72.8468),
    ("Namma Health Institute", "BLR-001", "Indiranagar", "Bangalore", 12.9784, 77.6408),
    ("Marina General Hospital", "CHE-001", "Mylapore", "Chennai", 13.0339, 80.2676),
    ("Deccan Lifeline Hospital", "HYD-001", "Banjara Hills", "Hyderabad", 17.4156, 78.4347),
]

GROUP_MULTIPLIERS = {
    BloodGroup.O_POS: 1.45,
    BloodGroup.B_POS: 1.15,
    BloodGroup.A_POS: 1.0,
    BloodGroup.AB_POS: 0.48,
    BloodGroup.O_NEG: 0.36,
    BloodGroup.B_NEG: 0.24,
    BloodGroup.A_NEG: 0.21,
    BloodGroup.AB_NEG: 0.11,
}


def main() -> None:
    create_db_and_tables()
    randomizer = random.Random(2026)
    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=181)

    with Session(engine) as session:
        if session.exec(select(Hospital)).first():
            print("Database already contains hospitals; seed skipped.")
            return

        hospitals = []
        for name, code, address, city, latitude, longitude in HOSPITALS:
            hospital = Hospital(
                name=name,
                code=code,
                address=address,
                city=city,
                state={"Delhi": "Delhi", "Mumbai": "Maharashtra", "Bangalore": "Karnataka", "Chennai": "Tamil Nadu", "Hyderabad": "Telangana"}[city],
                latitude=latitude,
                longitude=longitude,
                contact_phone="+91-11-5550-0100",
                contact_email=f"bloodbank@{code.lower()}.bloodbridge.demo",
            )
            session.add(hospital)
            hospitals.append(hospital)
        session.commit()
        for hospital in hospitals:
            session.refresh(hospital)

        for hospital_index, hospital in enumerate(hospitals):
            for blood_group, multiplier in GROUP_MULTIPLIERS.items():
                for component_index, component in enumerate(BloodComponent):
                    component_multiplier = [0.45, 1.0, 0.34, 0.3, 0.12][component_index]
                    for day_offset in range((end_date - start_date).days + 1):
                        demand_date = start_date + timedelta(days=day_offset)
                        weekend_boost = 1.18 if demand_date.weekday() >= 5 else 1.0
                        festival_boost = 1.25 if demand_date.month in {10, 11} else 1.0
                        hospital_boost = 0.9 + hospital_index * 0.06
                        base = 9 * multiplier * component_multiplier * weekend_boost * festival_boost * hospital_boost
                        units_used = max(1, round(base + randomizer.gauss(0, 1.5)))
                        session.add(
                            HistoricalDemand(
                                hospital_id=hospital.id,
                                blood_group=blood_group,
                                component=component,
                                units_used=units_used,
                                date=demand_date,
                                is_emergency=randomizer.random() < 0.04,
                                department=randomizer.choice(["Trauma", "Surgery", "Oncology", "Emergency"]),
                            )
                        )

                    stock_baseline = round(45 * multiplier * (1.2 if component == BloodComponent.RBC else 0.7))
                    if blood_group == BloodGroup.O_NEG and hospital_index in {0, 3}:
                        stock_baseline = randomizer.randint(2, 7)
                    for batch_index in range(2):
                        session.add(
                            BloodInventory(
                                hospital_id=hospital.id,
                                blood_group=blood_group,
                                component=component,
                                units_available=max(1, stock_baseline // 2 + randomizer.randint(-4, 6)),
                                units_reserved=randomizer.randint(0, 4),
                                expiry_date=date.today() + timedelta(days=randomizer.randint(2, 35)),
                                donation_date=date.today() - timedelta(days=randomizer.randint(1, 20)),
                                batch_id=f"{hospital.code}-{blood_group.value.replace('+', 'P').replace('-', 'N')}-{component_index}-{batch_index}",
                            )
                        )
        session.commit()

    print("Seeded 5 hospitals, 6 months of demand history, and active inventory.")


if __name__ == "__main__":
    main()
