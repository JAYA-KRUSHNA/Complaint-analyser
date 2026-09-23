"""
CiviSense AI — Database Engine & Session Management

Provides async SQLAlchemy engine and session factory.
Designed to work with both local Docker PostgreSQL and cloud Neon PostgreSQL.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (  # type: ignore
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase  # type: ignore

from app.config import settings  # type: ignore

import ssl as _ssl

# ─── Async Engine ──────────────────────────────────────────────
# Connection pooling configured for both local dev and cloud PostgreSQL (Supabase/Neon).
# Cloud free tiers limit connections (~20). We keep pool small and resilient.
connect_args = {}
if settings.is_cloud_db:
    # asyncpg requires an explicit SSLContext for cloud databases
    _ssl_ctx = _ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl.CERT_NONE
    connect_args["ssl"] = _ssl_ctx

# Disable prepared statement cache for Supabase pgbouncer (transaction mode)
# Without this, asyncpg throws "prepared statement already exists" errors
if "pooler.supabase.com" in settings.async_database_url:
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DB_ECHO,
    pool_size=5,             # Base pool connections (safe for Neon 20-conn limit)
    max_overflow=10,         # Extra connections under load
    pool_pre_ping=True,      # Verify connections before use (handles Neon auto-suspend)
    pool_recycle=300,        # Recycle connections every 5 min (handles Neon timeouts)
    connect_args=connect_args,
)

# ─── Session Factory ──────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-load issues after commit
)


# ─── Base Model ───────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.

    All models inherit from this to share:
    - Common metadata
    - Migration support via Alembic
    """
    pass


# ─── Dependency ───────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.

    Usage in route handlers:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the request completes.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
