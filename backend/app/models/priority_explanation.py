"""
CiviSense AI — Priority Explanation Model

Factor-by-factor breakdown of why a complaint received its priority score.
This is the core of the Explainable AI (XAI) requirement (Section 18).

Example records for a P1 complaint:
  Safety Risk     | +25 | High safety risk: fire detected near residential area
  Essential Svc   | +20 | Electricity is an essential service
  Incident Size   | +18 | 3 related complaints in the same area
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text  # type: ignore
from sqlalchemy.dialects.postgresql import UUID  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship  # type: ignore

from app.database import Base  # type: ignore


class PriorityExplanation(Base):
    __tablename__ = "priority_explanations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    factor: Mapped[str] = mapped_column(
        String(50), nullable=False  # e.g., "severity", "safety_risk"
    )
    contribution: Mapped[float] = mapped_column(
        Float, nullable=False  # Score contribution (e.g., +25)
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False  # Human-readable explanation
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaint = relationship("Complaint", back_populates="priority_explanations")

    def __repr__(self) -> str:
        return f"<PriorityExplanation {self.factor}: +{self.contribution}>"
