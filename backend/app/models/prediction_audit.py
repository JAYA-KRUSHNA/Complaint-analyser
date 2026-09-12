"""
CiviSense AI — Prediction Audit Model

Records every AI prediction for research mode (Section 35) and auditability (Section 25).
Stores the complete prediction context so experiments can later analyze:
- Model accuracy across versions
- Priority prediction quality
- Routing accuracy
- Human override patterns
- Multilingual performance differences
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PredictionAudit(Base):
    __tablename__ = "prediction_audits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Prediction Context ────────────────────────────────
    prediction_type: Mapped[str] = mapped_column(
        String(50), nullable=False  # "category", "severity", "urgency", "priority", "department"
    )
    model_version: Mapped[str] = mapped_column(
        String(50), nullable=False  # e.g., "rule_based_v1", "tfidf_lr_v1.0"
    )
    prediction_source: Mapped[str] = mapped_column(
        String(30), nullable=False  # From PredictionSource enum
    )

    # ─── Input ─────────────────────────────────────────────
    input_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSONB: stores all input features used for this prediction
    input_features: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ─── Output ────────────────────────────────────────────
    predicted_value: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    # JSONB: full prediction output (scores, alternatives, etc.)
    prediction_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ─── Human Override (Section 36) ───────────────────────
    was_overridden: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
    overridden_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    override_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    overridden_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ─── Final Outcome (for accuracy measurement) ──────────
    final_value: Mapped[str | None] = mapped_column(
        String(100), nullable=True  # What the value ended up being after any overrides
    )

    # ─── Timestamps ────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaint = relationship("Complaint", back_populates="prediction_audits")

    def __repr__(self) -> str:
        return f"<PredictionAudit {self.prediction_type}: {self.predicted_value}>"
