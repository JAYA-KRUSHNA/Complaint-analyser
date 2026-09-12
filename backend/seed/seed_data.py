"""
CiviSense AI — Database Seed Data

Populates the database with:
- Default categories (from prompt Section 6)
- Default departments (from prompt Section 6)
- Category-department mappings (from prompt Section 12)
- Default priority configuration (from prompt Section 9)
- A SUPER_ADMIN user for initial access

All seed data is clearly marked as system-generated.
Run with: python -m seed.seed_data
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.database import async_session_factory, engine, Base  # type: ignore
from app.models import (  # type: ignore
    User,
    Category,
    Department,
    CategoryDepartmentMapping,
    PriorityConfig,
)
from app.core.constants import (  # type: ignore
    ComplaintCategory,
    UserRole,
    DEFAULT_PRIORITY_WEIGHTS,
    CATEGORY_DEPARTMENT_MAP,
)


# ─── Seed Categories ──────────────────────────────────────────
CATEGORIES = [
    {"name": "WATER_SUPPLY", "display_name": "Water Supply"},
    {"name": "ELECTRICITY", "display_name": "Electricity"},
    {"name": "ROAD_DAMAGE", "display_name": "Road Damage"},
    {"name": "SEWAGE", "display_name": "Sewage"},
    {"name": "GARBAGE", "display_name": "Garbage Collection"},
    {"name": "STREETLIGHT", "display_name": "Streetlight"},
    {"name": "TRAFFIC", "display_name": "Traffic"},
    {"name": "PUBLIC_SAFETY", "display_name": "Public Safety"},
    {"name": "ANIMAL_CONTROL", "display_name": "Animal Control"},
    {"name": "DRAINAGE", "display_name": "Drainage"},
    {"name": "ILLEGAL_DUMPING", "display_name": "Illegal Dumping"},
    {"name": "OTHER", "display_name": "Other"},
]

# ─── Seed Departments ─────────────────────────────────────────
DEPARTMENTS = [
    {
        "name": "Water Department",
        "description": "Handles water supply, pipelines, and water quality complaints.",
    },
    {
        "name": "Electricity Department",
        "description": "Handles power outages, streetlights, and electrical hazards.",
    },
    {
        "name": "Public Works",
        "description": "Handles road damage, construction, and public infrastructure.",
    },
    {
        "name": "Sanitation Department",
        "description": "Handles garbage collection, waste management, and illegal dumping.",
    },
    {
        "name": "Drainage Department",
        "description": "Handles sewage, drainage blockages, and flooding issues.",
    },
    {
        "name": "Traffic Department",
        "description": "Handles traffic signals, road markings, and traffic management.",
    },
    {
        "name": "Animal Control",
        "description": "Handles stray animals, animal nuisance, and wildlife concerns.",
    },
    {
        "name": "Emergency Services",
        "description": "Handles emergencies, public safety threats, and urgent situations.",
    },
]


async def seed_database():
    """Seed the database with initial data."""

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(select(Category).limit(1))
        if result.scalar_one_or_none():
            print("⚠️  Database already seeded. Skipping.")
            return

        print("🌱 Seeding database...")

        # ── Categories ─────────────────────────────────────
        category_map = {}
        for cat_data in CATEGORIES:
            category = Category(
                id=uuid.uuid4(),
                name=cat_data["name"],
                display_name=cat_data["display_name"],
                is_active=True,
            )
            session.add(category)
            category_map[cat_data["name"]] = category
        print(f"  ✅ Created {len(CATEGORIES)} categories")

        # ── Departments ────────────────────────────────────
        dept_map = {}
        for dept_data in DEPARTMENTS:
            department = Department(
                id=uuid.uuid4(),
                name=dept_data["name"],
                description=dept_data["description"],
                is_active=True,
            )
            session.add(department)
            dept_map[dept_data["name"]] = department
        print(f"  ✅ Created {len(DEPARTMENTS)} departments")

        # ── Category-Department Mappings ───────────────────
        mapping_count = 0
        for cat_enum, dept_name in CATEGORY_DEPARTMENT_MAP.items():
            cat_name = cat_enum.value
            if cat_name in category_map and dept_name in dept_map:
                mapping = CategoryDepartmentMapping(
                    id=uuid.uuid4(),
                    category_id=category_map[cat_name].id,
                    department_id=dept_map[dept_name].id,
                    is_primary=True,
                )
                session.add(mapping)
                mapping_count += 1
        print(f"  ✅ Created {mapping_count} category-department mappings")

        # ── Default Priority Config ────────────────────────
        priority_config = PriorityConfig(
            id=uuid.uuid4(),
            name="Default Configuration",
            weights=DEFAULT_PRIORITY_WEIGHTS,
            is_active=True,
        )
        session.add(priority_config)
        print("  ✅ Created default priority configuration")

        # ── Super Admin User ───────────────────────────────
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        admin = User(
            id=uuid.uuid4(),
            name="System Administrator",
            email="admin@civisense.ai",
            password_hash=pwd_context.hash("admin123"),  # Change in production!
            role=UserRole.SUPER_ADMIN.value,
            is_active=True,
        )
        session.add(admin)
        print("  ✅ Created super admin user (admin@civisense.ai / admin123)")

        # ── Commit ─────────────────────────────────────────
        await session.commit()
        print("\n🎉 Database seeded successfully!")
        print("\n📋 Default credentials:")
        print("   Email: admin@civisense.ai")
        print("   Password: admin123")
        print("   ⚠️  Change these in production!")


if __name__ == "__main__":
    asyncio.run(seed_database())
