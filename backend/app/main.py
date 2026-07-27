from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import create_db_and_tables
from app.routers import auth, emergency, hospitals, inventory, predictions, redistribution

app = FastAPI(
    title="BloodBridge AI API",
    version="1.0.0",
    description="Explainable AI intelligence layer for hospital blood supply optimization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, error: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={"success": False, "data": None, "message": "Request failed", "error": {"code": "HTTP_ERROR", "detail": str(error.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, error: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"success": False, "data": None, "message": "Validation failed", "error": {"code": "VALIDATION_ERROR", "detail": str(error.errors())}},
    )


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "bloodbridge-ai"}


@app.get("/", tags=["System"])
def root() -> dict:
    return {
        "success": True,
        "message": "BloodBridge AI API is running",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }


api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(hospitals.router, prefix=api_prefix)
app.include_router(inventory.router, prefix=api_prefix)
app.include_router(predictions.router, prefix=api_prefix)
app.include_router(redistribution.router, prefix=api_prefix)
app.include_router(emergency.router, prefix=api_prefix)

