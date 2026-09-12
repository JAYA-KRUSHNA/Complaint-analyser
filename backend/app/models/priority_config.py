"""
CiviSense AI — Priority Config Model

Stores admin-configurable weights for the Civic Impact Score calculation.
Only one active configuration at a time. Historical configs are preserved
for auditability (you can see what weights were active when a complaint was scored).

Section 9 of the prompt: "Make the weights configurable by administrators."
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PriorityConfig(Base):
    __tablename__ = "priority_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ─── Configuration ─────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # JSONB: the weight configuration
    # Example: {"severity": 0.25, "urgency": 0.20, "safety_risk": 0.15, ...}
    weights: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Only one config can be active at a time
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )

    # ─── Audit ─────────────────────────────────────────────
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        status = "ACTIVE" if self.is_active else "INACTIVE"
        return f"<PriorityConfig {self.name} [{status}]>"
