"""
CiviSense AI — Email OTP Model

Stores hashed OTP codes for email-based verification.
OTPs expire after a configurable time and are limited to max attempts.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (  # type: ignore
    Boolean,
    DateTime,
    Integer,
    String,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID  # type: ignore
from sqlalchemy.orm import Mapped, mapped_column  # type: ignore

from app.database import Base  # type: ignore


class EmailOTP(Base):
    __tablename__ = "email_otps"

    # ─── Primary Key ───────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ─── OTP Data ──────────────────────────────────────────
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    # ─── State ─────────────────────────────────────────────
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ─── Timestamps ────────────────────────────────────────
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Table Configuration ───────────────────────────────
    __table_args__ = (
        Index("ix_email_otps_email_created", "email", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<EmailOTP {self.email} verified={self.is_verified}>"
