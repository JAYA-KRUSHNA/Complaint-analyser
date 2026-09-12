"""
CiviSense AI — API v1 Router

Aggregates all v1 route modules into a single router
that gets mounted on the FastAPI app at /api/v1.
"""

from fastapi import APIRouter  # type: ignore

from app.api.v1.auth import router as auth_router  # type: ignore
from app.api.v1.complaints import router as complaints_router  # type: ignore
from app.api.v1.analysis import router as analysis_router  # type: ignore
from app.api.v1.dashboard import router as dashboard_router  # type: ignore
from app.api.v1.ml_routes import router as ml_router  # type: ignore
from app.api.v1.analytics import router as analytics_router  # type: ignore

v1_router = APIRouter(prefix="/api/v1")

# ─── Mount route modules ──────────────────────────────────────
v1_router.include_router(auth_router)
v1_router.include_router(complaints_router)
v1_router.include_router(analysis_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(ml_router)
v1_router.include_router(analytics_router)
