"""
Alembic Environment Configuration

Configures Alembic to:
1. Use the database URL from app settings
2. Import all models so autogenerate works
3. Support both online (connected) and offline (SQL script) migrations
"""

import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool  # type: ignore
from alembic import context  # type: ignore

# Add the backend directory to sys.path so we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # type: ignore
from app.database import Base  # type: ignore

# Import all models — required for autogenerate to detect them
import app.models  # noqa: F401

# Alembic Config object
config = context.config

# Override sqlalchemy.url with our app settings (sync URL for Alembic)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_SYNC)

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    Generates SQL scripts without connecting to the database.
    Useful for reviewing migration SQL before applying.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    Connects to the database and applies migrations directly.
    Supports SSL for cloud databases (Supabase, Neon, etc.).
    """
    section = config.get_section(config.config_ini_section, {})

    # Enable SSL for cloud database connections
    connect_args = {}
    db_url = section.get("sqlalchemy.url", "")
    if any(cloud in db_url for cloud in ["supabase.com", "neon.tech", "render.com", "railway.app", "amazonaws.com"]):
        connect_args["sslmode"] = "require"

    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
