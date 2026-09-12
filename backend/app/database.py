"""
CiviSense AI — Database Engine & Session Management

Provides async SQLAlchemy engine and session factory.
Designed to work with both local Docker PostgreSQL and cloud Neon PostgreSQL.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ─── Async Engine ──────────────────────────────────────────────
# Connection pooling configured for both local dev and Neon free tier.
# Neon free tier limits: 20 connections. We keep pool small to stay safe.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_size=5,             # Base pool connections
    max_overflow=10,         # Extra connections under load
    pool_pre_ping=True,      # Verify connections before use (handles Neon auto-suspend)
    pool_recycle=300,         # Recycle connections every 5 min (handles Neon timeouts)
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
