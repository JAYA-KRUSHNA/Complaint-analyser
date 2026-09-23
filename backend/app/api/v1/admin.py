"""
CiviSense AI — Admin User Management API Routes

Endpoints (ADMIN / SUPER_ADMIN only):
  GET    /api/v1/admin/users          — List all users (with filters)
  GET    /api/v1/admin/users/:id      — Get user details
  PUT    /api/v1/admin/users/:id/role — Change user role
  PUT    /api/v1/admin/users/:id/status — Activate/deactivate user
  DELETE /api/v1/admin/users/:id      — Delete user
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from sqlalchemy import select, func, or_  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from pydantic import BaseModel, Field  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import require_admin, require_super_admin  # type: ignore
from app.models.user import User  # type: ignore
from app.schemas.auth import UserResponse  # type: ignore
from app.core.constants import UserRole  # type: ignore

router = APIRouter(prefix="/admin", tags=["Admin - User Management"])


# ─── Schemas ───────────────────────────────────────────────────

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    page_size: int


class ChangeRoleRequest(BaseModel):
    role: str = Field(..., description="New role for the user")

    def validate_role(self):
        allowed = [r.value for r in UserRole]
        if self.role not in allowed:
            raise ValueError(f"Role must be one of: {allowed}")


class ChangeStatusRequest(BaseModel):
    is_active: bool = Field(..., description="Activate or deactivate user")


# ─── List All Users ───────────────────────────────────────────

@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users (Admin only)",
)
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with optional filters. Requires ADMIN or SUPER_ADMIN role."""
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply filters
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


# ─── Get User Details ─────────────────────────────────────────

@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user details (Admin only)",
)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found"})
    return UserResponse.model_validate(user)


# ─── Change User Role ─────────────────────────────────────────

@router.put(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role (Admin only)",
)
async def change_user_role(
    user_id: uuid.UUID,
    data: ChangeRoleRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Change a user's role.

    Rules:
    - ADMIN can change CITIZEN ↔ DEPARTMENT_OFFICER roles
    - Only SUPER_ADMIN can promote/demote to ADMIN or SUPER_ADMIN
    - Cannot change your own role
    """
    # Validate role
    try:
        data.validate_role()
    except ValueError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})

    # Cannot change own role
    if user_id == current_user.id:
        return JSONResponse(status_code=400, content={"detail": "Cannot change your own role"})

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    # Only SUPER_ADMIN can manage ADMIN/SUPER_ADMIN roles
    admin_roles = [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    if data.role in admin_roles or user.role in admin_roles:
        if current_user.role != UserRole.SUPER_ADMIN.value:
            return JSONResponse(
                status_code=403,
                content={"detail": "Only SUPER_ADMIN can manage admin roles"},
            )

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


# ─── Activate / Deactivate User ───────────────────────────────

@router.put(
    "/users/{user_id}/status",
    response_model=UserResponse,
    summary="Activate or deactivate user (Admin only)",
)
async def change_user_status(
    user_id: uuid.UUID,
    data: ChangeStatusRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account."""
    if user_id == current_user.id:
        return JSONResponse(status_code=400, content={"detail": "Cannot deactivate yourself"})

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    # Cannot deactivate SUPER_ADMIN unless you are SUPER_ADMIN
    if user.role == UserRole.SUPER_ADMIN.value and current_user.role != UserRole.SUPER_ADMIN.value:
        return JSONResponse(
            status_code=403,
            content={"detail": "Cannot modify SUPER_ADMIN status"},
        )

    user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


# ─── Delete User ──────────────────────────────────────────────

@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user (Admin only)",
)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a user.

    Rules:
    - Cannot delete yourself
    - Only SUPER_ADMIN can delete other admins
    """
    if user_id == current_user.id:
        return JSONResponse(status_code=400, content={"detail": "Cannot delete yourself"})

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    # Only SUPER_ADMIN can delete admins
    admin_roles = [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
    if user.role in admin_roles and current_user.role != UserRole.SUPER_ADMIN.value:
        return JSONResponse(
            status_code=403,
            content={"detail": "Only SUPER_ADMIN can delete admin users"},
        )

    await db.delete(user)
    await db.commit()
