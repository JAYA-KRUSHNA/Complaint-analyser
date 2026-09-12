# ─── Production Python Base ────────────────────────────────────
FROM python:3.12-slim AS base

# Set environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

WORKDIR /app

# Install build dependencies and curl for health check
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root application user for container security
RUN groupadd -r civisense && useradd -r -g civisense -d /app -s /sbin/nologin civisense

# Copy application code
COPY . .

# Create uploads and model directories with correct permissions
RUN mkdir -p /app/uploads /app/app/services/ml/saved_models && \
    chown -R civisense:civisense /app

# Switch to non-root user
USER civisense

# Expose port
EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run with production Uvicorn configuration
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers"]
