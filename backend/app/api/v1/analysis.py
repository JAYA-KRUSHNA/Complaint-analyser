"""
CiviSense AI — Analysis API Routes

Endpoints:
  POST /api/v1/analysis/{complaint_id}/analyze    — Run full AI analysis
  GET  /api/v1/analysis/{complaint_id}/explanation — Get priority explanation
"""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_officer
from app.models.user import User
from app.schemas.complaint import ComplaintDetailResponse
from app.services.impl.analysis_pipeline import AnalysisPipeline
from app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])


# ─── Trigger Analysis ──────────────────────────────────────────

@router.post(
    "/{complaint_id}/analyze",
    response_model=ComplaintDetailResponse,
    summary="Run AI analysis on a complaint",
)
async def analyze_complaint(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run the full AI analysis pipeline on a complaint.
    
    This will:
    - Classify the complaint into a category
    - Route to the appropriate department
    - Assess severity and urgency
    - Compute the Civic Impact Score (priority)
    - Generate priority explanations (XAI)
    - Estimate resolution time
    
    Can be run multiple times (re-analysis) — previous results
    are overwritten and a new prediction audit is created.
    """
    pipeline = AnalysisPipeline(db)
    complaint = await pipeline.analyze(complaint_id)

    # Reload with relationships for response
    service = ComplaintService(db)
    complaint = await service.get_complaint(complaint.id)

    # Use the same mapper from complaints route
    from app.api.v1.complaints import _to_detail_response
    return _to_detail_response(complaint)


# ─── Get Explanation ───────────────────────────────────────────

@router.get(
    "/{complaint_id}/explanation",
    summary="Get priority explanation factors",
)
async def get_explanation(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the XAI explanation for a complaint's priority score.
    
    Returns the factor breakdown showing how each factor
    contributed to the final Civic Impact Score.
    """
    service = ComplaintService(db)
    complaint = await service.get_complaint(complaint_id)

    return {
        "complaint_id": str(complaint.id),
        "complaint_number": complaint.complaint_number,
        "priority_score": complaint.priority_score,
        "priority_level": complaint.priority_level,
        "factors": [
            {
                "factor": exp.factor,
                "contribution": exp.contribution,
                "description": exp.description,
            }
            for exp in (complaint.priority_explanations or [])
        ],
    }
