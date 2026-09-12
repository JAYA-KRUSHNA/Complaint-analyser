"""
CiviSense AI — User Model

Represents citizens, department officers, admins, and super admins.
Soft-delete via is_active flag. PII fields kept separate for privacy.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (  # type: ignore
    Boolean,
    DateTime,
    String,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column, relationship  # type: ignore

from app.database import Base  # type: ignore
from app.core.constants import UserRole, Language  # type: ignore


class User(Base):
    __tablename__ = "users"

    # ─── Primary Key ───────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ─── Identity ──────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)

    # ─── Authorization ─────────────────────────────────────
    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=UserRole.CITIZEN.value,
        index=True,
    )

    # ─── Preferences ───────────────────────────────────────
    preferred_language: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default=Language.ENGLISH.value,
    )

    # ─── State ─────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )

    # ─── Department assignment (for DEPARTMENT_OFFICER) ────
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
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

    # ─── Relationships ─────────────────────────────────────
    complaints = relationship(
        "Complaint",
        back_populates="user",
        foreign_keys="Complaint.user_id",
        lazy="selectin",
    )

    # ─── Table Configuration ───────────────────────────────
    __table_args__ = (
        Index("ix_users_role_active", "role", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<User {self.name} ({self.role})>"
