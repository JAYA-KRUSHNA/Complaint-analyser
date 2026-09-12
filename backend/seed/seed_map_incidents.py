"""
CiviSense AI — Seed Geospatial Map Complaints & Incidents
Populates realistic coordinates across civic zones for the Map Dashboard.
"""

import asyncio
import random
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import select  # type: ignore
from app.database import async_session_factory  # type: ignore
from app.models.user import User  # type: ignore
from app.models.category import Category  # type: ignore
from app.models.complaint import Complaint  # type: ignore
from app.models.incident import Incident  # type: ignore
from app.core.constants import ComplaintStatus, IncidentStatus, PriorityLevel, SeverityLevel, UrgencyLevel  # type: ignore

SAMPLE_LOCATIONS = [
    {"name": "Near Charminar Heritage Zone, Old City", "lat": 17.3616, "lng": 78.4747},
    {"name": "Cyber Towers Junction, Hitec City", "lat": 17.4504, "lng": 78.3808},
    {"name": "Road No. 12, Banjara Hills", "lat": 17.4156, "lng": 78.4350},
    {"name": "Secunderabad Railway Station Approach", "lat": 17.4399, "lng": 78.4983},
    {"name": "Abids Commercial Circle, Koti", "lat": 17.3894, "lng": 78.4760},
    {"name": "Dilsukhnagar Bus Depot Area", "lat": 17.3688, "lng": 78.5307},
    {"name": "Kukatpally Y-Junction Main Road", "lat": 17.4933, "lng": 78.3914},
    {"name": "Jubilee Hills Check Post", "lat": 17.4319, "lng": 78.4073},
    {"name": "Mehdipatnam Rythu Bazar Road", "lat": 17.3916, "lng": 78.4398},
    {"name": "Begumpet Airport Flyover", "lat": 17.4447, "lng": 78.4664},
    {"name": "Ameerpet Metro Station Pillar 1042", "lat": 17.4375, "lng": 78.4482},
    {"name": "Gachibowli Stadium Road", "lat": 17.4401, "lng": 78.3489},
]

COMPLAINT_TEMPLATES = [
    # P1 Critical
    {
        "title": "Live 11kV transformer sparking and oil leaking near primary school",
        "desc": "High voltage transformer sparks continuously with smoke. Children and pedestrians in immediate danger.",
        "priority": "P1", "score": 96, "severity": "CRITICAL", "sev_score": 9.5, "urgency": "CRITICAL",
        "cat": "ELECTRICITY",
    },
    {
        "title": "Major potable water main burst causing 4-foot deep street cave-in",
        "desc": "Fresh water flooding entire lane, road collapsed. Two vehicles partially trapped.",
        "priority": "P1", "score": 92, "severity": "CRITICAL", "sev_score": 9.0, "urgency": "HIGH",
        "cat": "WATER_SUPPLY",
    },
    {
        "title": "Raw sewage overflowing into drinking water sump in residential block",
        "desc": "Severe public health hazard, foul odor and contaminated tap water across 40 houses.",
        "priority": "P1", "score": 90, "severity": "HIGH", "sev_score": 8.5, "urgency": "CRITICAL",
        "cat": "DRAINAGE",
    },
    {
        "title": "Open high-voltage junction box submerged in water puddle",
        "desc": "Electrocution hazard on pedestrian walkway right next to bus stop.",
        "priority": "P1", "score": 88, "severity": "CRITICAL", "sev_score": 8.8, "urgency": "HIGH",
        "cat": "ELECTRICITY",
    },
    # P2 High
    {
        "title": "Deep dangerous pothole crater causing two-wheeler skids",
        "desc": "Over 2 feet wide crater in middle of traffic lane after rainfall.",
        "priority": "P2", "score": 78, "severity": "HIGH", "sev_score": 7.4, "urgency": "HIGH",
        "cat": "ROAD_DAMAGE",
    },
    {
        "title": "Non-functioning traffic signals causing major gridlock and near-misses",
        "desc": "4-way intersection signals turned black since morning. High risk of accidents.",
        "priority": "P2", "score": 75, "severity": "HIGH", "sev_score": 7.0, "urgency": "HIGH",
        "cat": "TRAFFIC",
    },
    {
        "title": "Uncovered drainage manhole in poorly lit residential road",
        "desc": "Concrete slab broken, open manhole left without warning barricade.",
        "priority": "P2", "score": 74, "severity": "HIGH", "sev_score": 7.2, "urgency": "MEDIUM",
        "cat": "DRAINAGE",
    },
    {
        "title": "Low hanging optic-fiber and electricity cables tangling vehicles",
        "desc": "Heavy vehicle snapped pole support, wire bundle dangling at head height.",
        "priority": "P2", "score": 71, "severity": "MEDIUM", "sev_score": 6.5, "urgency": "HIGH",
        "cat": "ELECTRICITY",
    },
    # P3 Medium
    {
        "title": "Community garbage bin overflowing across pedestrian footpath",
        "desc": "Municipal bin hasn't been cleared for 4 days. Stray animals scattering waste.",
        "priority": "P3", "score": 58, "severity": "MEDIUM", "sev_score": 5.4, "urgency": "MEDIUM",
        "cat": "GARBAGE",
    },
    {
        "title": "Streetlights off for 3 consecutive nights along 500m lane",
        "desc": "Entire stretch dark, women commuters feel unsafe walking from metro station.",
        "priority": "P3", "score": 54, "severity": "MEDIUM", "sev_score": 5.0, "urgency": "MEDIUM",
        "cat": "STREETLIGHTS",
    },
    {
        "title": "Broken storm water drain grating causing tire punctures",
        "desc": "Iron grate dislodged, exposing sharp edges to passing traffic.",
        "priority": "P3", "score": 51, "severity": "MEDIUM", "sev_score": 4.8, "urgency": "LOW",
        "cat": "DRAINAGE",
    },
    {
        "title": "Construction debris dumped on public road blocking half carriageway",
        "desc": "Private builders dumped gravel and sand bags on main transit lane.",
        "priority": "P3", "score": 48, "severity": "MEDIUM", "sev_score": 4.5, "urgency": "LOW",
        "cat": "ENCROACHMENT",
    },
    # P4 Low
    {
        "title": "Damaged seating benches and broken swings in children park",
        "desc": "Park infrastructure needs repair and repainting before monsoon.",
        "priority": "P4", "score": 34, "severity": "LOW", "sev_score": 3.0, "urgency": "LOW",
        "cat": "PUBLIC_PARKS",
    },
    {
        "title": "Faded pedestrian zebra crossing markings near hospital",
        "desc": "Paint worn off, request repainting reflective thermoplastic markers.",
        "priority": "P4", "score": 28, "severity": "LOW", "sev_score": 2.5, "urgency": "LOW",
        "cat": "TRAFFIC",
    },
    {
        "title": "Tree branches obscuring directional road signboard",
        "desc": "Overgrown foliage blocking overhead signage on highway bypass.",
        "priority": "P4", "score": 22, "severity": "LOW", "sev_score": 2.0, "urgency": "LOW",
        "cat": "GENERAL",
    },
]

INCIDENT_CLUSTERS = [
    {
        "title": "Charminar Heritage Ward Drainage & Water Contamination Cluster",
        "category": "DRAINAGE",
        "description": "Cluster of 7 interconnected sewage overflow and contaminated water grievances in Old City.",
        "lat": 17.3620,
        "lng": 78.4750,
        "radius": 550.0,
        "count": 7,
        "priority_score": 91,
        "severity_score": 8.8,
        "affected_pop": "HIGH",
        "status": "ACTIVE",
    },
    {
        "title": "Hitec City Cyber Towers Junction Traffic & Road Cave-In Hazard",
        "category": "ROAD_DAMAGE",
        "description": "Multiple reports of major road cave-in and broken signals affecting IT corridor traffic.",
        "lat": 17.4498,
        "lng": 78.3815,
        "radius": 450.0,
        "count": 5,
        "priority_score": 85,
        "severity_score": 8.1,
        "affected_pop": "HIGH",
        "status": "INVESTIGATING",
    },
    {
        "title": "Secunderabad Station Approach Power & Streetlight Outage",
        "category": "ELECTRICITY",
        "description": "Sub-station failure causing widespread darkness and dangling wire hazards near terminal.",
        "lat": 17.4405,
        "lng": 78.4975,
        "radius": 600.0,
        "count": 4,
        "priority_score": 79,
        "severity_score": 7.3,
        "affected_pop": "MEDIUM",
        "status": "ACTIVE",
    },
]


async def seed_map():
    async with async_session_factory() as session:
        # Get admin user
        user_res = await session.execute(select(User).limit(1))
        user = user_res.scalars().first()
        if not user:
            print("❌ No user found, run seed_data first")
            return

        # Get categories
        cat_res = await session.execute(select(Category))
        categories = cat_res.scalars().all()
        cat_map = {c.name: c for c in categories}
        fallback_cat = categories[0] if categories else None

        print("🗺️  Seeding 18 mapped complaints across Hyderabad civic zones...")
        base_num = random.randint(3000, 7000)

        for i, t in enumerate(COMPLAINT_TEMPLATES):
            loc = SAMPLE_LOCATIONS[i % len(SAMPLE_LOCATIONS)]
            # Add slight jitter for realistic spread
            lat = loc["lat"] + (random.random() - 0.5) * 0.008
            lng = loc["lng"] + (random.random() - 0.5) * 0.008

            cat_obj = cat_map.get(t["cat"], fallback_cat)
            complaint_num = f"CMP-2026-{base_num + i:05d}"

            complaint = Complaint(
                id=uuid.uuid4(),
                complaint_number=complaint_num,
                user_id=user.id,
                category_id=cat_obj.id if cat_obj else None,
                title=t["title"],
                description=t["desc"],
                status=random.choice([ComplaintStatus.SUBMITTED.value, ComplaintStatus.IN_PROGRESS.value, ComplaintStatus.UNDER_REVIEW.value]),
                latitude=round(lat, 6),
                longitude=round(lng, 6),
                location_text=f"{loc['name']}, Hyderabad",
                priority_level=t["priority"],
                priority_score=t["score"],
                severity_level=t["severity"],
                severity_score=t["sev_score"],
                urgency_level=t["urgency"],
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(2, 72)),
            )
            session.add(complaint)

        print("🚨 Seeding 3 active incident cluster hotspots...")
        for cluster in INCIDENT_CLUSTERS:
            incident = Incident(
                id=uuid.uuid4(),
                title=cluster["title"],
                category=cluster["category"],
                description=cluster["description"],
                latitude=cluster["lat"],
                longitude=cluster["lng"],
                radius=cluster["radius"],
                complaint_count=cluster["count"],
                priority_score=cluster["priority_score"],
                severity_score=cluster["severity_score"],
                urgency_level="HIGH",
                affected_population=cluster["affected_pop"],
                status=cluster["status"],
            )
            session.add(incident)

        await session.commit()
        print("✅ Successfully seeded map grievances and incidents!")


if __name__ == "__main__":
    asyncio.run(seed_map())
