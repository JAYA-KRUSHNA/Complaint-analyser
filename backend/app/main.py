"""
CiviSense AI — FastAPI Application Entry Point

Sets up the FastAPI application with:
- CORS middleware
- Exception handlers
- Health check endpoint
- API router mounting (v1)

This is the single entry point: `uvicorn app.main:app`
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.middleware.gzip import GZipMiddleware  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from sqlalchemy import text  # type: ignore

from app.config import settings  # type: ignore
from app.database import engine  # type: ignore
from app.core.exceptions import (  # type: ignore
    CiviSenseException,
    DuplicateException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)

# Import all models so SQLAlchemy registers them
import app.models  # noqa: F401

# Import API routers
from app.api.v1.router import v1_router  # type: ignore


# ─── Application Lifespan ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown events.

    Startup: Log configuration, verify database connection.
    Shutdown: Clean up resources.
    """
    # ── Startup ────────────────────────────────────────────
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📍 Environment: {settings.ENVIRONMENT}")
    print(f"🗄️  Database: {'configured' if settings.DATABASE_URL else 'NOT configured'}")
    print(f"🔒 CORS Origins: {settings.cors_origins_list}")
    yield
    # ── Shutdown ───────────────────────────────────────────
    print(f"🛑 Shutting down {settings.APP_NAME}")


# ─── Create FastAPI App ───────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc
    lifespan=lifespan,
)


# ─── Middleware ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ─── Exception Handlers ──────────────────────────────────────
@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=404,
        content={"error": exc.message, "details": exc.details},
    )


@app.exception_handler(DuplicateException)
async def duplicate_handler(request: Request, exc: DuplicateException):
    return JSONResponse(
        status_code=409,
        content={"error": exc.message, "details": exc.details},
    )


@app.exception_handler(UnauthorizedException)
async def unauthorized_handler(request: Request, exc: UnauthorizedException):
    return JSONResponse(
        status_code=401,
        content={"error": exc.message},
    )


@app.exception_handler(ForbiddenException)
async def forbidden_handler(request: Request, exc: ForbiddenException):
    return JSONResponse(
        status_code=403,
        content={"error": exc.message},
    )


@app.exception_handler(ValidationException)
async def validation_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=422,
        content={"error": exc.message, "details": exc.details},
    )


@app.exception_handler(CiviSenseException)
async def general_handler(request: Request, exc: CiviSenseException):
    return JSONResponse(
        status_code=500,
        content={"error": exc.message, "details": exc.details},
    )


# ─── Mount API Routers ────────────────────────────────────────
app.include_router(v1_router)


# ─── Health Check ─────────────────────────────────────────────
@app.get(
    "/api/health",
    tags=["Health"],
    summary="Health Check",
    description="Returns the health status of the CiviSense API and database connection.",
)
async def health_check():
    db_status = "unknown"
    db_latency_ms = None
    start_time = time.time()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - start_time) * 1000, 2)
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": {
            "status": db_status,
            "latency_ms": db_latency_ms,
        },
    }


# ─── Root ─────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/api/health",
    }
