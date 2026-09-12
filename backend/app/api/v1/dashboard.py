"""
CiviSense AI — Dashboard API Routes

Endpoints:
  GET /api/v1/dashboard/stats          — Overview statistics
  GET /api/v1/dashboard/priority-queue — Priority-sorted complaint queue
  GET /api/v1/dashboard/by-status      — Complaint counts by status
  GET /api/v1/dashboard/by-category    — Complaint counts by category
  GET /api/v1/dashboard/by-department  — Complaint counts by department
  GET /api/v1/dashboard/recent-activity — Latest status changes
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query  # type: ignore
from sqlalchemy import desc, func, select, case  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import get_current_active_user, require_officer  # type: ignore
from app.models.user import User  # type: ignore
from app.models.complaint import Complaint  # type: ignore
from app.models.category import Category  # type: ignore
from app.models.department import Department  # type: ignore
from app.models.complaint_status_history import ComplaintStatusHistory  # type: ignore
from app.core.constants import ComplaintStatus  # type: ignore

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ─── Overview Statistics ───────────────────────────────────────

@router.get("/stats", summary="Dashboard overview statistics")
async def get_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard overview statistics.

    Citizens see their own stats.
    Officers see their department stats.
    Admins see system-wide stats.
    """
    # Build WHERE conditions based on role
    conditions = []
    if current_user.role == "CITIZEN":
        conditions.append(Complaint.user_id == current_user.id)
    elif current_user.role == "DEPARTMENT_OFFICER" and current_user.department_id:
        conditions.append(Complaint.department_id == current_user.department_id)

    # Total
    total_q = select(func.count(Complaint.id))
    for c in conditions:
        total_q = total_q.where(c)
    total = (await db.execute(total_q)).scalar() or 0

    # Status counts (single query with GROUP BY)
    status_q = select(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status)
    for c in conditions:
        status_q = status_q.where(c)
    status_rows = (await db.execute(status_q)).all()
    status_counts = {row[0]: row[1] for row in status_rows if row[1] > 0}

    # Priority counts (single query with GROUP BY)
    priority_q = (
        select(Complaint.priority_level, func.count(Complaint.id))
        .where(Complaint.priority_level.isnot(None))
        .group_by(Complaint.priority_level)
    )
    for c in conditions:
        priority_q = priority_q.where(c)
    priority_rows = (await db.execute(priority_q)).all()
    priority_counts = {row[0]: row[1] for row in priority_rows if row[1] > 0}

    # Average priority score
    avg_q = select(func.avg(Complaint.priority_score)).where(Complaint.priority_score.isnot(None))
    for c in conditions:
        avg_q = avg_q.where(c)
    avg_priority = (await db.execute(avg_q)).scalar()

    # Derived counts
    active_statuses = [
        ComplaintStatus.SUBMITTED.value,
        ComplaintStatus.UNDER_REVIEW.value,
        ComplaintStatus.ASSIGNED.value,
        ComplaintStatus.IN_PROGRESS.value,
        ComplaintStatus.ESCALATED.value,
    ]
    pending = sum(status_counts.get(s, 0) for s in active_statuses)
    resolved = (
        status_counts.get(ComplaintStatus.RESOLVED.value, 0)
        + status_counts.get(ComplaintStatus.CLOSED.value, 0)
    )
    critical = priority_counts.get("P1", 0)

    return {
        "total": total,
        "pending": pending,
        "resolved": resolved,
        "critical_active": critical,
        "avg_priority_score": round(avg_priority, 1) if avg_priority else None,
        "by_status": status_counts,
        "by_priority": priority_counts,
    }


# ─── Priority Queue ───────────────────────────────────────────

@router.get("/priority-queue", summary="Priority-sorted complaint queue")
async def get_priority_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    department_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    """
    Get complaints sorted by priority score (highest first).

    This is the main admin/officer work queue.
    Only accessible to officers, admins, and super admins.
    """
    query = (
        select(Complaint)
        .options(
            selectinload(Complaint.category),
            selectinload(Complaint.department),
        )
        .where(Complaint.priority_score.isnot(None))
    )

    # Officer sees only their department
    if current_user.role == "DEPARTMENT_OFFICER" and current_user.department_id:
        query = query.where(Complaint.department_id == current_user.department_id)

    # Filters
    if status_filter:
        query = query.where(Complaint.status == status_filter)
    if priority_filter:
        query = query.where(Complaint.priority_level == priority_filter)
    if department_id:
        query = query.where(Complaint.department_id == department_id)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort by priority score descending (highest priority first)
    query = query.order_by(
        desc(Complaint.priority_score),
        Complaint.created_at,
    )

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    complaints = result.scalars().all()

    from math import ceil
    items = []
    for c in complaints:
        items.append({
            "id": str(c.id),
            "complaint_number": c.complaint_number,
            "title": c.title,
            "status": c.status,
            "priority_level": c.priority_level,
            "priority_score": c.priority_score,
            "severity_level": c.severity_level,
            "urgency_level": c.urgency_level,
            "category_name": c.category.display_name if c.category else None,
            "department_name": c.department.name if c.department else None,
            "location_text": c.location_text,
            "safety_risk": c.safety_risk_flag,
            "essential_service": c.essential_service_flag,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": ceil(total / page_size) if total > 0 else 0,
    }


# ─── Counts by Category ───────────────────────────────────────

@router.get("/by-category", summary="Complaint counts by category")
async def get_by_category(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complaint distribution by category for charts."""
    query = (
        select(
            Category.display_name,
            func.count(Complaint.id).label("count"),
        )
        .join(Category, Complaint.category_id == Category.id, isouter=True)
        .group_by(Category.display_name)
    )

    if current_user.role == "CITIZEN":
        query = query.where(Complaint.user_id == current_user.id)
    elif current_user.role == "DEPARTMENT_OFFICER" and current_user.department_id:
        query = query.where(Complaint.department_id == current_user.department_id)

    result = await db.execute(query)
    rows = result.all()

    return [
        {"category": row[0] or "Uncategorized", "count": row[1]}
        for row in rows
        if row[1] > 0
    ]


# ─── Counts by Department ─────────────────────────────────────

@router.get("/by-department", summary="Complaint counts by department")
async def get_by_department(
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    """Get complaint distribution by department for charts."""
    result = await db.execute(
        select(
            Department.name,
            func.count(Complaint.id).label("count"),
        )
        .join(Department, Complaint.department_id == Department.id, isouter=True)
        .group_by(Department.name)
    )
    rows = result.all()

    return [
        {"department": row[0] or "Unassigned", "count": row[1]}
        for row in rows
        if row[1] > 0
    ]


# ─── Recent Activity ──────────────────────────────────────────

@router.get("/recent-activity", summary="Recent status changes")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest status change activity across all complaints."""
    query = (
        select(ComplaintStatusHistory)
        .join(Complaint, ComplaintStatusHistory.complaint_id == Complaint.id)
        .options(selectinload(ComplaintStatusHistory.complaint))
        .order_by(desc(ComplaintStatusHistory.created_at))
        .limit(limit)
    )

    if current_user.role == "DEPARTMENT_OFFICER" and current_user.department_id:
        query = query.where(Complaint.department_id == current_user.department_id)

    result = await db.execute(query)
    activities = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "complaint_id": str(a.complaint_id),
            "complaint_number": a.complaint.complaint_number if a.complaint else None,
            "old_status": a.old_status,
            "new_status": a.new_status,
            "comment": a.comment,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activities
    ]
