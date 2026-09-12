"""
CiviSense AI — Complaint Similarity Model

Records similarity scores between complaints for duplicate detection.
Both directions are stored (A→B and B→A) for fast lookup.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ComplaintSimilarity(Base):
    __tablename__ = "complaint_similarities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
    )
    similar_complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaint = relationship(
        "Complaint",
        back_populates="similarities",
        foreign_keys=[complaint_id],
    )
    similar_complaint = relationship(
        "Complaint",
        foreign_keys=[similar_complaint_id],
    )

    # ─── Indexes ───────────────────────────────────────────
    __table_args__ = (
        Index("ix_similarity_complaint", "complaint_id"),
        Index("ix_similarity_similar", "similar_complaint_id"),
        Index("ix_similarity_pair", "complaint_id", "similar_complaint_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Similarity {self.complaint_id}↔{self.similar_complaint_id} = {self.similarity_score:.2f}>"
