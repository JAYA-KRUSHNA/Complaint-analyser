"""
CiviSense AI — OTP Verification Schemas

Pydantic models for email OTP send/verify request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field  # type: ignore


# ─── Email OTP ─────────────────────────────────────────────────

class SendEmailOTPRequest(BaseModel):
    """Request to send a 6-digit OTP to an email address."""
    email: EmailStr = Field(..., description="Email address to send OTP to")


class VerifyEmailOTPRequest(BaseModel):
    """Request to verify a 6-digit OTP code."""
    email: EmailStr = Field(..., description="Email address that received OTP")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class OTPResponse(BaseModel):
    """Response after sending or verifying OTP."""
    message: str
    expires_in_seconds: int = 0


class OTPVerifyResponse(BaseModel):
    """Response after successful OTP verification."""
    verified: bool
    message: str
