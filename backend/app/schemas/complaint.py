"""
CiviSense AI — Complaint Schemas

Pydantic models for complaint submission, listing, detail view, and status updates.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator  # type: ignore


# ─── Complaint Submission ──────────────────────────────────────

class ComplaintCreateRequest(BaseModel):
    """Citizen submits a new complaint."""
    title: str = Field(..., min_length=5, max_length=300, description="Brief title")
    description: str = Field(..., min_length=10, description="Detailed description")
    category_name: Optional[str] = Field(
        None, description="Optional category (AI predicts if not provided)"
    )
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_text: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = Field(None)
    language: str = Field("en", description="Language code: en, te, hi, mixed")
    duration_hours: Optional[float] = Field(
        None, ge=0, description="How long the issue has persisted (hours)"
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Description cannot be empty")
        return v.strip()


class ComplaintUpdateRequest(BaseModel):
    """Update complaint (limited fields for citizens)."""
    title: Optional[str] = Field(None, min_length=5, max_length=300)
    description: Optional[str] = Field(None, min_length=10)
    location_text: Optional[str] = Field(None, max_length=500)
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)


# ─── Status Management ────────────────────────────────────────

class StatusUpdateRequest(BaseModel):
    """Admin/officer updates complaint status."""
    status: str = Field(..., description="New status")
    comment: Optional[str] = Field(None, description="Reason for status change")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = [
            "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS",
            "ESCALATED", "RESOLVED", "REJECTED", "CLOSED",
        ]
        if v not in allowed:
            raise ValueError(f"Status must be one of: {allowed}")
        return v


class AssignRequest(BaseModel):
    """Assign complaint to department/officer."""
    department_id: Optional[uuid.UUID] = None
    officer_id: Optional[uuid.UUID] = None
    comment: Optional[str] = None


class OverrideRequest(BaseModel):
    """Admin overrides an AI decision."""
    field: str = Field(..., description="Field to override: category, severity, urgency, priority, department")
    new_value: str = Field(..., description="New value")
    reason: str = Field(..., min_length=5, description="Reason for override")

    @field_validator("field")
    @classmethod
    def validate_field(cls, v: str) -> str:
        allowed = ["category", "severity_level", "urgency_level", "priority_level", "department"]
        if v not in allowed:
            raise ValueError(f"Override field must be one of: {allowed}")
        return v


# ─── Response Models ───────────────────────────────────────────

class StatusHistoryResponse(BaseModel):
    """Single status change record."""
    id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by: Optional[uuid.UUID] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriorityExplanationResponse(BaseModel):
    """Single priority factor explanation."""
    factor: str
    contribution: float
    description: str

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    """Compact complaint for list views."""
    id: uuid.UUID
    complaint_number: str
    title: str
    status: str
    priority_level: Optional[str] = None
    priority_score: Optional[int] = None
    severity_level: Optional[str] = None
    urgency_level: Optional[str] = None
    category_name: Optional[str] = None
    department_name: Optional[str] = None
    location_text: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplaintDetailResponse(BaseModel):
    """Full complaint detail view."""
    id: uuid.UUID
    complaint_number: str
    user_id: uuid.UUID

    # Content
    title: str
    description: str
    language: str
    original_text: Optional[str] = None

    # Classification
    category_name: Optional[str] = None
    category_confidence: Optional[float] = None
    department_name: Optional[str] = None
    department_confidence: Optional[float] = None

    # Severity & Urgency
    severity_score: Optional[float] = None
    severity_level: Optional[str] = None
    severity_confidence: Optional[float] = None
    urgency_level: Optional[str] = None
    urgency_confidence: Optional[float] = None

    # Priority
    priority_level: Optional[str] = None
    priority_score: Optional[int] = None

    # Status
    status: str

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_text: Optional[str] = None
    address: Optional[str] = None

    # Impact
    affected_population_estimate: Optional[str] = None
    vulnerable_population_flag: bool = False
    essential_service_flag: bool = False
    safety_risk_flag: bool = False
    duration_hours: Optional[float] = None

    # Incident
    incident_id: Optional[uuid.UUID] = None

    # Resolution
    predicted_resolution_hours: Optional[float] = None
    prediction_confidence: Optional[float] = None

    # Assignment
    assigned_officer_id: Optional[uuid.UUID] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    # Nested
    status_history: List[StatusHistoryResponse] = []
    priority_explanations: List[PriorityExplanationResponse] = []

    model_config = {"from_attributes": True}


# ─── Pagination ────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    """Paginated list response wrapper."""
    items: List[ComplaintListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
