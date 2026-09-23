"""
CiviSense AI — Email OTP Service

Handles OTP generation, secure storage, email delivery via Gmail SMTP,
and verification with rate limiting and brute-force protection.
"""

import hashlib
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy import select, and_, desc  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.config import settings  # type: ignore
from app.models.email_otp import EmailOTP  # type: ignore


class EmailService:
    """Handles email OTP generation, delivery, and verification."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── OTP Generation ────────────────────────────────────────

    @staticmethod
    def generate_otp() -> str:
        """Generate a cryptographically secure 6-digit OTP."""
        return f"{secrets.randbelow(900000) + 100000}"

    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash OTP with SHA-256 for secure database storage."""
        return hashlib.sha256(otp.encode()).hexdigest()

    # ─── Cooldown Check ────────────────────────────────────────

    async def _check_cooldown(self, email: str) -> None:
        """Enforce 60-second cooldown between OTP requests for same email."""
        result = await self.db.execute(
            select(EmailOTP)
            .where(
                and_(
                    EmailOTP.email == email,
                    EmailOTP.is_verified == False,  # noqa: E712
                )
            )
            .order_by(desc(EmailOTP.created_at))
            .limit(1)
        )
        recent = result.scalar_one_or_none()

        if recent:
            elapsed = (datetime.now(timezone.utc) - recent.created_at).total_seconds()
            if elapsed < 60:
                remaining = int(60 - elapsed)
                raise ValueError(
                    f"Please wait {remaining} seconds before requesting a new OTP"
                )

    # ─── Send OTP ──────────────────────────────────────────────

    async def send_otp(self, email: str) -> int:
        """
        Generate OTP, store hashed version in DB, and send via Gmail SMTP.

        Returns:
            expires_in_seconds: Number of seconds until OTP expires.

        Raises:
            ValueError: If cooldown period hasn't elapsed.
            RuntimeError: If SMTP is not configured.
        """
        # Check cooldown
        await self._check_cooldown(email)

        # Generate OTP
        otp = self.generate_otp()
        otp_hash = self.hash_otp(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRY_MINUTES
        )

        # Store in database
        record = EmailOTP(
            email=email,
            otp_hash=otp_hash,
            expires_at=expires_at,
            attempts=0,
            is_verified=False,
        )
        self.db.add(record)
        await self.db.commit()

        # Send email
        await self._send_email(email, otp)

        return settings.OTP_EXPIRY_MINUTES * 60

    # ─── Verify OTP ────────────────────────────────────────────

    async def verify_otp(self, email: str, code: str) -> bool:
        """
        Verify the OTP code against the most recent record for this email.

        Returns:
            True if verification succeeded.

        Raises:
            ValueError: If OTP is invalid, expired, or max attempts reached.
        """
        result = await self.db.execute(
            select(EmailOTP)
            .where(
                and_(
                    EmailOTP.email == email,
                    EmailOTP.is_verified == False,  # noqa: E712
                )
            )
            .order_by(desc(EmailOTP.created_at))
            .limit(1)
        )
        record = result.scalar_one_or_none()

        if not record:
            raise ValueError("No OTP found for this email. Please request a new one.")

        # Check max attempts
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            raise ValueError(
                "Maximum verification attempts reached. Please request a new OTP."
            )

        # Check expiry
        if datetime.now(timezone.utc) > record.expires_at:
            raise ValueError("OTP has expired. Please request a new one.")

        # Increment attempts
        record.attempts += 1

        # Verify hash
        if self.hash_otp(code) != record.otp_hash:
            await self.db.commit()
            remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
            raise ValueError(
                f"Invalid OTP code. {remaining} attempt(s) remaining."
            )

        # Mark as verified
        record.is_verified = True
        await self.db.commit()
        return True

    # ─── Email Delivery ────────────────────────────────────────

    async def _send_email(self, to_email: str, otp: str) -> None:
        """Send OTP via Gmail SMTP."""
        if not settings.SMTP_USER or not settings.SMTP_PASS:
            # Development fallback: log to console
            print(f"[DEV EMAIL OTP] To: {to_email} | Code: {otp}")
            return

        msg = MIMEMultipart("alternative")
        msg["From"] = f"CiviSense AI <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = f"🔐 CiviSense AI — Your Verification Code: {otp}"

        # Plain text fallback
        text_content = (
            f"Your CiviSense AI verification code is: {otp}\n\n"
            f"This code is valid for {settings.OTP_EXPIRY_MINUTES} minutes.\n"
            f"Do not share this code with anyone.\n\n"
            f"If you didn't request this code, please ignore this email."
        )

        # Rich HTML email
        html_content = f"""
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #4338CA, #6366F1); padding: 12px 16px; border-radius: 16px;">
                    <span style="color: white; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">🛡️ CiviSense AI</span>
                </div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center;">
                <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 8px 0;">Email Verification</h2>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0;">Enter this code to verify your email address</p>
                <div style="background: linear-gradient(135deg, #4338CA, #6366F1); color: white; font-size: 32px; font-weight: 800; letter-spacing: 8px; padding: 16px 24px; border-radius: 12px; display: inline-block; margin-bottom: 24px;">
                    {otp}
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    Valid for {settings.OTP_EXPIRY_MINUTES} minutes • Do not share this code
                </p>
            </div>
            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 24px;">
                If you didn't request this code, please ignore this email.
                <br/>© CiviSense AI — Engineered by Jaya Krushna & Keerthi
            </p>
        </div>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        except Exception as e:
            # Fallback: log OTP to console so dev is never blocked
            print(f"[SMTP FAILED] To: {to_email} | Code: {otp} | Error: {e}")
            raise RuntimeError(f"Failed to send verification email: {str(e)}")
