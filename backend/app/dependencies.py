"""
CiviSense AI — FastAPI Dependencies

Dependency injection functions for:
- Database sessions
- Current user extraction from JWT
- Role-based access control
"""

import uuid
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import get_token_data
from app.core.constants import UserRole
from app.models.user import User

# ─── Bearer Token Extraction ──────────────────────────────────
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate the current user from the JWT token.
    
    This is the core authentication dependency.
    Raises 401 if token is missing, invalid, or user not found.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = get_token_data(credentials.credentials, token_type="access")
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


# ─── Role-Based Access Control ────────────────────────────────

def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory that restricts access to specific roles.
    
    Usage:
        @router.get("/admin-only")
        async def admin_endpoint(
            user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))
        ):
            ...
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        user_role = UserRole(current_user.role)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    return role_checker


# ─── Convenience Dependencies ─────────────────────────────────

# Any authenticated user
require_auth = get_current_active_user

# Citizens only
require_citizen = require_roles(UserRole.CITIZEN)

# Department officers and above
require_officer = require_roles(
    UserRole.DEPARTMENT_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN
)

# Admins and above
require_admin = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)

# Super admin only
require_super_admin = require_roles(UserRole.SUPER_ADMIN)
