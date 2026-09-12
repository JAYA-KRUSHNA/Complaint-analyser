"""
CiviSense AI — Models Package

Imports all models so that:
1. Alembic can discover them for auto-generating migrations
2. SQLAlchemy relationships resolve correctly
3. Single import point for the entire data layer
"""

from app.models.user import User
from app.models.category import Category
from app.models.department import Department, CategoryDepartmentMapping
from app.models.complaint import Complaint
from app.models.complaint_image import ComplaintImage
from app.models.incident import Incident
from app.models.complaint_similarity import ComplaintSimilarity
from app.models.priority_explanation import PriorityExplanation
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.prediction_audit import PredictionAudit
from app.models.priority_config import PriorityConfig

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
]
