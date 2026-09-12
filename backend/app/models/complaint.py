"""
CiviSense AI — Complaint Model

The central entity of the system. Stores citizen grievances with all
AI-computed fields (category, severity, urgency, priority, location, etc.).

Design notes:
- Uses SMALLINT for score fields to save storage on Neon free tier
- VARCHAR with proper limits prevents unbounded growth
- Composite indexes on (status, priority_score) for fast priority queue queries
- All AI-computed fields are nullable (populated after analysis pipeline runs)
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (  # type: ignore
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship  # type: ignore

from app.database import Base  # type: ignore
from app.core.constants import ComplaintStatus, Language  # type: ignore


class Complaint(Base):
    __tablename__ = "complaints"

    # ─── Primary Key ───────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ─── Complaint Identity ────────────────────────────────
    complaint_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )

    # ─── Citizen Reference ─────────────────────────────────
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Complaint Content ─────────────────────────────────
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default=Language.ENGLISH.value,
    )
    # Store original text before any normalization/translation
    original_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── AI-Computed: Classification ───────────────────────
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,  # Nullable: AI predicts this, or citizen optionally selects
    )
    category_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ─── AI-Computed: Department Routing ───────────────────
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,  # Set by routing engine after classification
    )
    department_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ─── AI-Computed: Severity ─────────────────────────────
    severity_score: Mapped[float | None] = mapped_column(
        Float, nullable=True  # 0.0 - 10.0
    )
    severity_level: Mapped[str | None] = mapped_column(
        String(20), nullable=True  # LOW, MEDIUM, HIGH, CRITICAL
    )
    severity_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ─── AI-Computed: Urgency ──────────────────────────────
    urgency_level: Mapped[str | None] = mapped_column(
        String(20), nullable=True  # LOW, MEDIUM, HIGH, CRITICAL
    )
    urgency_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ─── AI-Computed: Priority ─────────────────────────────
    priority_level: Mapped[str | None] = mapped_column(
        String(5), nullable=True, index=True  # P1, P2, P3, P4
    )
    priority_score: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True  # 0-100 (Civic Impact Score)
    )

    # ─── Status ────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ComplaintStatus.SUBMITTED.value,
        index=True,
    )

    # ─── Location ──────────────────────────────────────────
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── Civic Impact Factors ──────────────────────────────
    affected_population_estimate: Mapped[str | None] = mapped_column(
        String(20), nullable=True  # LOW, MEDIUM, HIGH
    )
    vulnerable_population_flag: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    essential_service_flag: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    safety_risk_flag: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    duration_hours: Mapped[float | None] = mapped_column(
        Float, nullable=True  # How long the issue has persisted
    )

    # ─── Incident Linkage ──────────────────────────────────
    incident_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ─── Resolution Prediction ─────────────────────────────
    predicted_resolution_hours: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    prediction_confidence: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )

    # ─── Assigned Officer ──────────────────────────────────
    assigned_officer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # ─── Timestamps ────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ─── Relationships ─────────────────────────────────────
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    category = relationship("Category", back_populates="complaints")
    department = relationship("Department", back_populates="complaints")
    incident = relationship("Incident", back_populates="complaints")
    images = relationship(
        "ComplaintImage", back_populates="complaint", lazy="selectin",
        cascade="all, delete-orphan",
    )
    status_history = relationship(
        "ComplaintStatusHistory", back_populates="complaint", lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ComplaintStatusHistory.created_at",
    )
    priority_explanations = relationship(
        "PriorityExplanation", back_populates="complaint", lazy="selectin",
        cascade="all, delete-orphan",
    )
    similarities = relationship(
        "ComplaintSimilarity",
        back_populates="complaint",
        foreign_keys="ComplaintSimilarity.complaint_id",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    prediction_audits = relationship(
        "PredictionAudit", back_populates="complaint", lazy="selectin",
        cascade="all, delete-orphan",
    )

    # ─── Indexes ───────────────────────────────────────────
    __table_args__ = (
        # Fast priority queue: filter by status, sort by score
        Index("ix_complaints_status_priority", "status", "priority_score"),
        # Dashboard: complaints by category
        Index("ix_complaints_category", "category_id"),
        # Dashboard: complaints by department
        Index("ix_complaints_department", "department_id"),
        # Time-based queries
        Index("ix_complaints_created_at", "created_at"),
        # Geospatial filtering (basic — PostGIS would be better for production)
        Index("ix_complaints_location", "latitude", "longitude"),
    )

    def __repr__(self) -> str:
        return f"<Complaint {self.complaint_number} [{self.status}]>"
