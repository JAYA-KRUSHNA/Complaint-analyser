"""
CiviSense AI — Authentication Service

Business logic for user registration, login, and profile management.
Separated from the API layer for clean architecture and testability.
"""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.exceptions import (
    DuplicateException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_token_data,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UserUpdateRequest,
)


class AuthService:
    """Handles all authentication and user management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Registration ──────────────────────────────────────

    async def register_citizen(self, data: RegisterRequest) -> User:
        """
        Register a new citizen account.
        
        Citizens self-register. Officers/admins are created by admins.
        """
        # Check for duplicate email
        existing = await self._get_user_by_email(data.email)
        if existing:
            raise DuplicateException("User", "email")

        user = User(
            id=uuid.uuid4(),
            name=data.name,
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=UserRole.CITIZEN.value,
            preferred_language=data.preferred_language,
            is_active=True,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def create_user(self, data: AdminCreateUserRequest) -> User:
        """
        Admin creates a new user (officer, admin, or citizen).
        """
        existing = await self._get_user_by_email(data.email)
        if existing:
            raise DuplicateException("User", "email")

        # Officers must have a department
        if data.role == UserRole.DEPARTMENT_OFFICER.value and not data.department_id:
            raise ValidationException(
                "Department ID is required for department officers"
            )

        user = User(
            id=uuid.uuid4(),
            name=data.name,
            email=data.email,
            phone=data.phone,
            password_hash=hash_password(data.password),
            role=data.role,
            department_id=data.department_id,
            preferred_language=data.preferred_language,
            is_active=True,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    # ─── Login ─────────────────────────────────────────────

    async def login(self, data: LoginRequest) -> dict:
        """
        Authenticate user and return JWT token pair.
        
        Returns:
            Dict with access_token, refresh_token, and user data.
        """
        user = await self._get_user_by_email(data.email)
        if not user:
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        # Create token pair
        token_data = {
            "sub": str(user.id),
            "role": user.role,
            "email": user.email,
        }

        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "user": user,
        }

    # ─── Token Refresh ─────────────────────────────────────

    async def refresh_token(self, refresh_token: str) -> dict:
        """
        Use a refresh token to obtain a new access token.
        """
        payload = get_token_data(refresh_token, token_type="refresh")
        if payload is None:
            raise UnauthorizedException("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise UnauthorizedException("Invalid user ID in token")

        result = await self.db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        token_data = {
            "sub": str(user.id),
            "role": user.role,
            "email": user.email,
        }

        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "user": user,
        }

    # ─── Profile Management ────────────────────────────────

    async def update_profile(
        self, user: User, data: UserUpdateRequest
    ) -> User:
        """Update user profile fields."""
        if data.name is not None:
            user.name = data.name
        if data.phone is not None:
            user.phone = data.phone
        if data.preferred_language is not None:
            user.preferred_language = data.preferred_language

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(
        self, user: User, data: ChangePasswordRequest
    ) -> None:
        """Change user password (requires current password)."""
        if not verify_password(data.current_password, user.password_hash):
            raise UnauthorizedException("Current password is incorrect")

        user.password_hash = hash_password(data.new_password)
        await self.db.commit()

    # ─── Internal Helpers ──────────────────────────────────

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Look up a user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
