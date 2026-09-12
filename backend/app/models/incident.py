"""
CiviSense AI — Incident Model

An incident represents a real-world civic problem that may have multiple complaints.
Example: "Gandhi Nagar Water Supply Failure" with 183 linked complaints.

Incidents are created by the clustering engine when related complaints
(same category + nearby location + close timestamps + high text similarity)
are detected.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Float,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.core.constants import IncidentStatus


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ─── Identity ──────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ─── Location ──────────────────────────────────────────
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    radius: Mapped[float | None] = mapped_column(
        Float, nullable=True  # Radius in meters
    )

    # ─── Aggregated Statistics ─────────────────────────────
    complaint_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    severity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    priority_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    affected_population: Mapped[str | None] = mapped_column(
        String(20), nullable=True  # LOW, MEDIUM, HIGH
    )

    # ─── Status ────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=IncidentStatus.ACTIVE.value,
        index=True,
    )

    # ─── Timestamps ────────────────────────────────────────
    first_reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaints = relationship("Complaint", back_populates="incident", lazy="selectin")

    # ─── Indexes ───────────────────────────────────────────
    __table_args__ = (
        Index("ix_incidents_status_priority", "status", "priority_score"),
        Index("ix_incidents_location", "latitude", "longitude"),
        Index("ix_incidents_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<Incident {self.title} ({self.complaint_count} complaints)>"
