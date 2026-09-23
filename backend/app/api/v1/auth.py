"""
CiviSense AI — Authentication API Routes

Endpoints:
  POST /api/v1/auth/register      — Citizen self-registration
  POST /api/v1/auth/login         — Login (returns JWT pair)
  POST /api/v1/auth/refresh       — Refresh access token
  GET  /api/v1/auth/me            — Get current user profile
  PUT  /api/v1/auth/me            — Update profile
  POST /api/v1/auth/change-password — Change password
  POST /api/v1/auth/create-user   — Admin creates user (officer/admin)
"""

from fastapi import APIRouter, Depends, status  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import get_current_active_user, require_admin  # type: ignore
from app.models.user import User  # type: ignore
from app.schemas.auth import (  # type: ignore
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services.auth_service import AuthService  # type: ignore

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Registration ──────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account",
)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new citizen account.

    Citizens self-register through this endpoint.
    Officers and admins are created via the /create-user endpoint.
    """
    service = AuthService(db)
    user = await service.register_citizen(data)
    return user


# ─── Login ─────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT tokens",
)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate with email and password.

    Returns:
        access_token: Short-lived token (30 min) for API access.
        refresh_token: Long-lived token (7 days) for obtaining new access tokens.
    """
    service = AuthService(db)
    result = await service.login(data)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


# ─── Token Refresh ─────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Use a valid refresh token to obtain a new token pair."""
    service = AuthService(db)
    result = await service.refresh_token(data.refresh_token)
    return TokenResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        user=UserResponse.model_validate(result["user"]),
    )


# ─── Profile ──────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    """Get the authenticated user's profile."""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update profile",
)
async def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile (name, phone, language)."""
    service = AuthService(db)
    updated = await service.update_profile(current_user, data)
    return updated


# ─── Password ─────────────────────────────────────────────────

@router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Change password",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password (requires current password verification)."""
    service = AuthService(db)
    await service.change_password(current_user, data)


# ─── Admin: Create User ───────────────────────────────────────

@router.post(
    "/create-user",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create a new user",
)
async def admin_create_user(
    data: AdminCreateUserRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin creates a new user (department officer, admin, or citizen).

    Requires ADMIN or SUPER_ADMIN role.
    Department officers must have a department_id assigned.
    """
    service = AuthService(db)
    user = await service.create_user(data)
    return user


# ─── Email OTP Verification ──────────────────────────────────

from app.schemas.otp import (  # type: ignore
    SendEmailOTPRequest,
    VerifyEmailOTPRequest,
    OTPResponse,
    OTPVerifyResponse,
)
from app.services.email_service import EmailService  # type: ignore


@router.post(
    "/otp/send-email",
    response_model=OTPResponse,
    summary="Send OTP to email address",
)
async def send_email_otp(
    data: SendEmailOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a 6-digit OTP to the specified email address.

    Rate limited: 60-second cooldown between requests per email.
    OTP expires after 5 minutes.
    """
    service = EmailService(db)
    try:
        expires_in = await service.send_otp(data.email)
        return OTPResponse(
            message="Verification code sent to your email",
            expires_in_seconds=expires_in,
        )
    except ValueError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={"detail": str(e)},
        )
    except RuntimeError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)},
        )


@router.post(
    "/otp/verify-email",
    response_model=OTPVerifyResponse,
    summary="Verify email OTP code",
)
async def verify_email_otp(
    data: VerifyEmailOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the 6-digit OTP code sent to the email.

    Max 3 attempts per OTP. After that, a new OTP must be requested.
    """
    service = EmailService(db)
    try:
        await service.verify_otp(data.email, data.code)
        return OTPVerifyResponse(
            verified=True,
            message="Email verified successfully",
        )
    except ValueError as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=400,
            content={"detail": str(e), "verified": False},
        )
