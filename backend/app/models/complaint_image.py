"""
CiviSense AI — Complaint Image Model

Stores metadata for images uploaded with complaints.
Actual files are handled by StorageService (local FS or cloud).

Phase 1: image_analysis_status defaults to SKIPPED (no image analysis yet).
Future: YOLO/CNN will populate detected_objects and image_severity_score.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text  # type: ignore
from sqlalchemy.dialects.postgresql import UUID, JSONB  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship  # type: ignore

from app.database import Base  # type: ignore
from app.core.constants import ImageAnalysisStatus  # type: ignore


class ComplaintImage(Base):
    __tablename__ = "complaint_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── File Info ─────────────────────────────────────────
    # Storage key (works for both local path and S3 key)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # ─── AI Analysis (Phase 3) ─────────────────────────────
    image_analysis_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ImageAnalysisStatus.SKIPPED.value,
    )
    # JSONB: flexible storage for detected objects from various models
    # Example: [{"label": "pothole", "confidence": 0.92, "bbox": [x,y,w,h]}]
    detected_objects: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    image_severity_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ─── Timestamps ────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaint = relationship("Complaint", back_populates="images")

    def __repr__(self) -> str:
        return f"<ComplaintImage {self.original_filename}>"
