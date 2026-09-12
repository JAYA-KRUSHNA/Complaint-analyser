"""
CiviSense AI — Authentication Schemas

Pydantic models for auth request/response validation.
Strict validation ensures clean data at the API boundary.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Registration ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Citizen self-registration request."""
    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars)")
    preferred_language: str = Field("en", description="Preferred language (en, te, hi)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class AdminCreateUserRequest(BaseModel):
    """Admin creating officers/admins."""
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., description="User role")
    department_id: Optional[uuid.UUID] = Field(None, description="Department for officers")
    preferred_language: str = Field("en")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = ["CITIZEN", "DEPARTMENT_OFFICER", "ADMIN", "SUPER_ADMIN"]
        if v not in allowed:
            raise ValueError(f"Role must be one of: {allowed}")
        return v


# ─── Login ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str


# ─── User Response ─────────────────────────────────────────────

class UserResponse(BaseModel):
    """Public user information (never exposes password_hash)."""
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    preferred_language: str
    department_id: Optional[uuid.UUID] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """Profile update request (limited fields)."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    preferred_language: Optional[str] = Field(None)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip() if v else v


class ChangePasswordRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v
