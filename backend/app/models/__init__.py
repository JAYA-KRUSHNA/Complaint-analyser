"""
CiviSense AI — Models Package

Imports all models so that:
1. Alembic can discover them for auto-generating migrations
2. SQLAlchemy relationships resolve correctly
3. Single import point for the entire data layer
"""

from app.models.user import User  # type: ignore
from app.models.category import Category  # type: ignore
from app.models.department import Department, CategoryDepartmentMapping  # type: ignore
from app.models.complaint import Complaint  # type: ignore
from app.models.complaint_image import ComplaintImage  # type: ignore
from app.models.incident import Incident  # type: ignore
from app.models.complaint_similarity import ComplaintSimilarity  # type: ignore
from app.models.priority_explanation import PriorityExplanation  # type: ignore
from app.models.complaint_status_history import ComplaintStatusHistory  # type: ignore
from app.models.prediction_audit import PredictionAudit  # type: ignore
from app.models.priority_config import PriorityConfig  # type: ignore
from app.models.email_otp import EmailOTP  # type: ignore

__all__ = [
    "User",
    "Category",
    "Department",
    "CategoryDepartmentMapping",
    "Complaint",
    "ComplaintImage",
    "Incident",
    "ComplaintSimilarity",
    "PriorityExplanation",
    "ComplaintStatusHistory",
    "PredictionAudit",
    "PriorityConfig",
    "EmailOTP",
]
