"""
CiviSense AI — Clustering & Analytics API Routes

Endpoints:
  POST /api/v1/analytics/cluster               — Run clustering on recent complaints
  GET  /api/v1/analytics/similar/{complaint_id} — Find similar complaints
  GET  /api/v1/analytics/incidents              — List incident clusters
  GET  /api/v1/analytics/heatmap                — Complaint location heatmap data
"""

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query  # type: ignore
from sqlalchemy import desc, func, select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import get_current_active_user, require_officer  # type: ignore
from app.models.user import User  # type: ignore
from app.models.complaint import Complaint  # type: ignore
from app.models.incident import Incident  # type: ignore

router = APIRouter(prefix="/analytics", tags=["Analytics & Clustering"])


# ─── Find Similar Complaints ──────────────────────────────────

@router.get(
    "/similar/{complaint_id}",
    summary="Find similar complaints",
)
async def find_similar(
    complaint_id: uuid.UUID,
    top_n: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Find complaints similar to the given one using TF-IDF cosine similarity."""
    from app.services.impl.similarity_engine import SimilarityEngine  # type: ignore

    engine = SimilarityEngine(db)
    results = await engine.find_similar(complaint_id, top_n=top_n)

    return {
        "complaint_id": str(complaint_id),
        "similar_count": len(results),
        "similar_complaints": results,
    }


# ─── Run Clustering ───────────────────────────────────────────

@router.post("/cluster", summary="Run incident clustering")
async def run_clustering(
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Run the clustering algorithm on recent complaints.
    Groups related complaints into incidents.
    Requires OFFICER/ADMIN role.
    """
    from app.services.impl.similarity_engine import SimilarityEngine  # type: ignore

    engine = SimilarityEngine(db)
    incidents = await engine.cluster_into_incidents()

    return {
        "status": "success",
        "incidents_created": len(incidents),
        "incidents": incidents,
    }


# ─── List Incidents ───────────────────────────────────────────

@router.get("/incidents", summary="List incident clusters")
async def list_incidents(
    status_filter: str = Query("", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """List all incident clusters with their linked complaints."""
    query = select(Incident).options(selectinload(Incident.complaints))

    if status_filter:
        query = query.where(Incident.status == status_filter)

    # Count
    count_q = select(func.count(Incident.id))
    if status_filter:
        count_q = count_q.where(Incident.status == status_filter)
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    query = query.order_by(desc(Incident.complaint_count)).offset(
        (page - 1) * page_size
    ).limit(page_size)

    result = await db.execute(query)
    incidents = result.scalars().all()

    from math import ceil
    items = []
    for inc in incidents:
        items.append({
            "id": str(inc.id),
            "title": inc.title,
            "category": inc.category,
            "status": inc.status,
            "complaint_count": inc.complaint_count,
            "severity_score": inc.severity_score,
            "priority_score": inc.priority_score,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "complaints": [
                {
                    "id": str(c.id),
                    "complaint_number": c.complaint_number,
                    "title": c.title,
                    "status": c.status,
                    "priority_score": c.priority_score,
                }
                for c in (inc.complaints or [])[:10]
            ],
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "total_pages": ceil(total / page_size) if total > 0 else 0,
    }


# ─── Heatmap Data ─────────────────────────────────────────────

@router.get("/heatmap", summary="Complaint location heatmap data")
async def get_heatmap_data(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get complaint locations with severity for heatmap visualization.
    Returns coordinates + weight (priority score) for each complaint.
    """
    result = await db.execute(
        select(
            Complaint.latitude,
            Complaint.longitude,
            Complaint.priority_score,
            Complaint.severity_level,
            Complaint.title,
            Complaint.complaint_number,
            Complaint.priority_level,
            Complaint.id,
        )
        .where(
            Complaint.latitude.isnot(None),
            Complaint.longitude.isnot(None),
        )
        .limit(1000)
    )
    rows = result.all()

    points = []
    for row in rows:
        points.append({
            "lat": row[0],
            "lng": row[1],
            "weight": row[2] or 50,
            "severity": row[3],
            "title": row[4],
            "number": row[5],
            "priority_level": row[6] or "P3",
            "id": str(row[7]),
        })

    return {
        "total_points": len(points),
        "points": points,
    }


# ─── Category Analytics ───────────────────────────────────────

@router.get("/category-trends", summary="Complaint trends by category")
async def category_trends(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Get complaint analytics aggregated by category."""
    from app.models.category import Category  # type: ignore

    result = await db.execute(
        select(
            Category.display_name,
            func.count(Complaint.id).label("total"),
            func.avg(Complaint.priority_score).label("avg_priority"),
            func.avg(Complaint.severity_score).label("avg_severity"),
        )
        .join(Category, Complaint.category_id == Category.id)
        .group_by(Category.display_name)
        .order_by(desc("total"))
    )
    rows = result.all()

    return [
        {
            "category": row[0],
            "total_complaints": row[1],
            "avg_priority_score": round(float(row[2]), 1) if row[2] else None,
            "avg_severity_score": round(float(row[3]), 1) if row[3] else None,
        }
        for row in rows
    ]
