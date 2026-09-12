"""
CiviSense AI — Application Configuration

Loads settings from environment variables with validation.
Uses pydantic-settings for type-safe configuration management.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore


class Settings(BaseSettings):
    """
    Application-wide settings loaded from environment variables.

    All settings have sensible defaults for local development.
    Production values are set via environment variables or .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ───────────────────────────────────────────
    APP_NAME: str = "CiviSense AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Explainable Multilingual Multimodal Public Grievance "
        "Prioritization and Civic Response System"
    )
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ─── Database ──────────────────────────────────────────────
    DATABASE_URL: str = (
        "postgresql+asyncpg://civisense:civisense_dev_2024@localhost:5433/civisense_db"
    )
    DATABASE_URL_SYNC: str = (
        "postgresql://civisense:civisense_dev_2024@localhost:5433/civisense_db"
    )
    DB_ECHO: bool = False  # Set True to log all SQL queries

    # ─── Security ──────────────────────────────────────────────
    SECRET_KEY: str = "dev-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ─── Storage ───────────────────────────────────────────────
    STORAGE_BACKEND: str = "local"  # "local", "s3", "cloudinary"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    MAX_IMAGES_PER_COMPLAINT: int = 5

    # ─── Rate Limiting ─────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 100
    LOGIN_RATE_LIMIT_PER_MINUTE: int = 5

    # ─── ML Configuration ──────────────────────────────────────
    CLASSIFIER_BACKEND: str = "rule_based"  # "rule_based" or "ml"
    ML_MODEL_DIR: str = "./ml/registry/models"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


# Singleton settings instance
settings = Settings()
