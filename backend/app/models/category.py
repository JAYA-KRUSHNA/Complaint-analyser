"""
CiviSense AI — Category Model

Predefined civic complaint categories.
Stored in DB (not just enum) so admins can add new ones in the future.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaints = relationship("Complaint", back_populates="category", lazy="selectin")
    department_mappings = relationship(
        "CategoryDepartmentMapping", back_populates="category", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category {self.name}>"
