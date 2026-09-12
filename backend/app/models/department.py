"""
CiviSense AI — Department Model

Government departments responsible for handling different complaint categories.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text  # type: ignore
from sqlalchemy.dialects.postgresql import UUID  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship  # type: ignore

from app.database import Base  # type: ignore


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    head_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    complaints = relationship("Complaint", back_populates="department", lazy="selectin")
    category_mappings = relationship(
        "CategoryDepartmentMapping", back_populates="department", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Department {self.name}>"


class CategoryDepartmentMapping(Base):
    """
    Maps categories to their responsible departments.

    Separated into its own table so the routing engine is independent
    of the classifier, as required by the prompt (Section 12).
    Admins can reconfigure routing without touching classification logic.
    """
    __tablename__ = "category_department_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ─────────────────────────────────────
    category = relationship("Category", back_populates="department_mappings")
    department = relationship("Department", back_populates="category_mappings")

    def __repr__(self) -> str:
        return f"<CategoryDeptMapping category={self.category_id} -> dept={self.department_id}>"
