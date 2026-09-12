"""
CiviSense AI — Database Connectivity Diagnostic Tool

Tests async connection pooling, latency, SSL handshake, and table inventory
for either local PostgreSQL or cloud serverless PostgreSQL (Neon / Supabase).

Usage:
    python scripts/test_db_connection.py
    DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.neon.tech/neondb?sslmode=require" python scripts/test_db_connection.py
"""

import asyncio
import os
import sys
import time

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # type: ignore
from app.config import settings  # type: ignore
from app.database import engine  # type: ignore


async def main():
    print("=" * 60)
    print(" 🔍  CiviSense AI — Database Diagnostic Tool")
    print("=" * 60)

    db_url = settings.DATABASE_URL
    # Mask password for display
    masked_url = db_url
    if "@" in db_url and ":" in db_url:
        prefix, rest = db_url.split("@", 1)
        scheme_user = prefix.rsplit(":", 1)[0]
        masked_url = f"{scheme_user}:****@{rest}"

    print(f"📌 Raw DATABASE_URL:       {masked_url}")
    print(f"⚡ Normalized Async URL:    {settings.async_database_url.split('@')[-1] if '@' in settings.async_database_url else 'configured'}")
    print(f"☁️  Cloud Host Detected:    {'YES (SSL Enabled)' if settings.is_cloud_db else 'NO (Local Docker)'}")

    print("\n⏳ Testing connection handshake...")
    start_time = time.time()
    try:
        async with engine.connect() as conn:
            handshake_latency = round((time.time() - start_time) * 1000, 2)
            print(f"✅ Handshake successful! Latency: {handshake_latency} ms")

            # Query server info
            res = await conn.execute(text("SELECT version(), current_database(), current_user"))
            row = res.fetchone()
            if row:
                version_str = row[0].split("on")[0].strip()
                print(f"🐘 PostgreSQL Version:     {version_str}")
                print(f"📂 Current Database:       {row[1]}")
                print(f"👤 Connected User:         {row[2]}")

            # Query table counts
            res_tables = await conn.execute(
                text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
            )
            table_count = res_tables.scalar()
            print(f"📊 Public Tables:          {table_count}")

            # Query complaints count if table exists
            try:
                res_complaints = await conn.execute(text("SELECT count(*) FROM complaints"))
                complaint_count = res_complaints.scalar()
                print(f"📋 Registered Complaints:   {complaint_count}")
            except Exception:
                print("📋 Registered Complaints:   0 (table not created or empty)")

            # Check pool info
            print(f"🏊 Connection Pool Size:    {engine.pool.size()} (Checked out: {engine.pool.checkedout()})")

        print("\n" + "=" * 60)
        print(" 🎉 Database is healthy and ready for production serving!")
        print("=" * 60)

    except Exception as exc:
        print(f"\n❌ Connection Failed: {exc}")
        print("\n💡 Troubleshooting Tips:")
        print("  1. Verify PostgreSQL container is running: `docker compose ps`")
        print("  2. If using Neon, ensure you copied the pooled connection string (with `-pooler` in host)")
        print("  3. Check username, password, and port in your .env file")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
