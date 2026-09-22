"""
CiviSense AI — Complaint API Routes

Endpoints:
  POST   /api/v1/complaints              — Submit complaint
  GET    /api/v1/complaints              — List complaints (filtered by role)
  GET    /api/v1/complaints/{id}         — Get complaint details
  PUT    /api/v1/complaints/{id}         — Update complaint
  DELETE /api/v1/complaints/{id}         — Delete complaint (SUBMITTED only)
  PUT    /api/v1/complaints/{id}/status  — Update status (admin/officer)
  GET    /api/v1/complaints/{id}/status-history — Get status timeline
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import get_current_active_user, require_officer  # type: ignore
from app.models.user import User  # type: ignore
from app.schemas.complaint import (  # type: ignore
    ComplaintCreateRequest,
    ComplaintDetailResponse,
    ComplaintListResponse,
    ComplaintUpdateRequest,
    PaginatedResponse,
    PriorityExplanationResponse,
    StatusHistoryResponse,
    StatusUpdateRequest,
)
from app.services.complaint_service import ComplaintService  # type: ignore

router = APIRouter(prefix="/complaints", tags=["Complaints"])


# ─── Submit Complaint ──────────────────────────────────────────

@router.post(
    "",
    response_model=ComplaintDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new complaint",
)
async def create_complaint(
    data: ComplaintCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a new complaint.

    - Category is optional — the AI will predict it during analysis.
    - Location can be coordinates, address text, or both.
    - Auto-triggers AI analysis (classification, severity, urgency, priority).
    - Returns the fully analyzed complaint.
    """
    service = ComplaintService(db)
    complaint = await service.create_complaint(data, current_user.id)

    # Auto-trigger AI analysis
    try:
        from app.services.impl.analysis_pipeline import AnalysisPipeline
        pipeline = AnalysisPipeline(db)
        await pipeline.analyze(complaint.id)
    except Exception as e:
        # Analysis failure should not block complaint creation
        print(f"⚠️ Auto-analysis failed for {complaint.complaint_number}: {e}")

    # Reload with relationships
    complaint = await service.get_complaint(complaint.id)
    return _to_detail_response(complaint)


# ─── List Complaints ───────────────────────────────────────────

@router.get(
    "",
    response_model=PaginatedResponse,
    summary="List complaints",
)
async def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List complaints with filtering and pagination.

    Citizens see only their own complaints.
    Officers see their department's complaints.
    Admins see all complaints.
    """
    service = ComplaintService(db)
    result = await service.list_complaints(
        user_id=current_user.id,
        user_role=current_user.role,
        status_filter=status_filter,
        category_filter=category,
        priority_filter=priority,
        department_id=current_user.department_id,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    return PaginatedResponse(
        items=[_to_list_response(c) for c in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


# ─── Get Complaint Detail ─────────────────────────────────────

@router.get(
    "/{complaint_id}",
    response_model=ComplaintDetailResponse,
    summary="Get complaint details",
)
async def get_complaint(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full complaint details including analysis, explanation, and status history."""
    service = ComplaintService(db)
    complaint = await service.get_complaint(complaint_id)
    return _to_detail_response(complaint)


# ─── Update Complaint ─────────────────────────────────────────

@router.put(
    "/{complaint_id}",
    response_model=ComplaintDetailResponse,
    summary="Update complaint",
)
async def update_complaint(
    complaint_id: uuid.UUID,
    data: ComplaintUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update complaint (citizens can only edit SUBMITTED complaints)."""
    service = ComplaintService(db)
    complaint = await service.update_complaint(
        complaint_id, data, current_user.id
    )
    complaint = await service.get_complaint(complaint.id)
    return _to_detail_response(complaint)


# ─── Delete Complaint ─────────────────────────────────────────

@router.delete(
    "/{complaint_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete complaint",
)
async def delete_complaint(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete complaint (citizens can only delete SUBMITTED complaints)."""
    service = ComplaintService(db)
    await service.delete_complaint(complaint_id, current_user.id)


# ─── Update Status ────────────────────────────────────────────

@router.put(
    "/{complaint_id}/status",
    response_model=ComplaintDetailResponse,
    summary="Update complaint status",
)
async def update_status(
    complaint_id: uuid.UUID,
    data: StatusUpdateRequest,
    current_user: User = Depends(require_officer),
    db: AsyncSession = Depends(get_db),
):
    """
    Update complaint status (officer/admin only).
    Every transition is recorded in the status history audit trail.
    """
    service = ComplaintService(db)
    complaint = await service.update_status(
        complaint_id, data, current_user.id
    )
    complaint = await service.get_complaint(complaint.id)
    return _to_detail_response(complaint)


# ─── Status History ───────────────────────────────────────────

@router.get(
    "/{complaint_id}/status-history",
    response_model=list[StatusHistoryResponse],
    summary="Get complaint status timeline",
)
async def get_status_history(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the full status change timeline for a complaint."""
    service = ComplaintService(db)
    complaint = await service.get_complaint(complaint_id)
    return complaint.status_history


# ─── Response Mappers ──────────────────────────────────────────

def _to_list_response(complaint) -> ComplaintListResponse:
    """Map Complaint ORM model to list response schema."""
    return ComplaintListResponse(
        id=complaint.id,
        complaint_number=complaint.complaint_number,
        title=complaint.title,
        status=complaint.status,
        priority_level=complaint.priority_level,
        priority_score=complaint.priority_score,
        severity_level=complaint.severity_level,
        urgency_level=complaint.urgency_level,
        category_name=complaint.category.display_name if complaint.category else None,
        department_name=complaint.department.name if complaint.department else None,
        location_text=complaint.location_text,
        created_at=complaint.created_at,
    )


def _to_detail_response(complaint) -> ComplaintDetailResponse:
    """Map Complaint ORM model to full detail response schema."""
    return ComplaintDetailResponse(
        id=complaint.id,
        complaint_number=complaint.complaint_number,
        user_id=complaint.user_id,
        title=complaint.title,
        description=complaint.description,
        language=complaint.language,
        original_text=complaint.original_text,
        category_name=complaint.category.display_name if complaint.category else None,
        category_confidence=complaint.category_confidence,
        department_name=complaint.department.name if complaint.department else None,
        department_confidence=complaint.department_confidence,
        severity_score=complaint.severity_score,
        severity_level=complaint.severity_level,
        severity_confidence=complaint.severity_confidence,
        urgency_level=complaint.urgency_level,
        urgency_confidence=complaint.urgency_confidence,
        priority_level=complaint.priority_level,
        priority_score=complaint.priority_score,
        status=complaint.status,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        location_text=complaint.location_text,
        address=complaint.address,
        affected_population_estimate=complaint.affected_population_estimate,
        vulnerable_population_flag=complaint.vulnerable_population_flag,
        essential_service_flag=complaint.essential_service_flag,
        safety_risk_flag=complaint.safety_risk_flag,
        duration_hours=complaint.duration_hours,
        incident_id=complaint.incident_id,
        predicted_resolution_hours=complaint.predicted_resolution_hours,
        prediction_confidence=complaint.prediction_confidence,
        assigned_officer_id=complaint.assigned_officer_id,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at,
        status_history=[
            StatusHistoryResponse.model_validate(h)
            for h in (complaint.status_history or [])
        ],
        priority_explanations=[
            PriorityExplanationResponse.model_validate(exp)
            for exp in (complaint.priority_explanations or [])
        ],
    )
