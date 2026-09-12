"""
CiviSense AI — ML Management API Routes

Endpoints:
  POST /api/v1/ml/train                — Train all ML models
  GET  /api/v1/ml/models               — List available models & comparison
  POST /api/v1/ml/compare/{complaint_id} — Compare rule-based vs ML on a complaint
"""

import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, status  # type: ignore
from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.database import get_db  # type: ignore
from app.dependencies import require_admin, get_current_active_user  # type: ignore
from app.models.user import User  # type: ignore
from app.models.complaint import Complaint  # type: ignore

router = APIRouter(prefix="/ml", tags=["ML Pipeline"])


# ─── Train Models ──────────────────────────────────────────────

@router.post("/train", summary="Train ML classifiers")
async def train_models(
    current_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    """
    Train all classical ML classifiers (LR, SVM, RF).

    - Generates synthetic training data (600 samples)
    - Trains 3 models with 5-fold cross-validation
    - Saves the best model for use
    - Returns comparison report

    Requires ADMIN role.
    """
    from app.services.ml.classifier_pipeline import train_and_save  # type: ignore

    results = train_and_save()

    # Clean results for API response
    clean_results: Dict[str, Any] = {}
    for name, result in results.items():
        clean_results[name] = {
            "display_name": result["display_name"],
            "accuracy": result["accuracy"],
            "f1_weighted": result["f1_weighted"],
            "cv_mean": result["cv_mean"],
            "cv_std": result["cv_std"],
            "train_time_seconds": result["train_time_seconds"],
            "sample_count": result["sample_count"],
        }

    best = max(clean_results.items(), key=lambda x: x[1]["f1_weighted"])

    return {
        "status": "success",
        "message": f"Trained 3 models. Best: {best[1]['display_name']}",
        "best_model": best[0],
        "models": clean_results,
    }


# ─── List Models ───────────────────────────────────────────────

@router.get("/models", summary="List available models")
async def list_models(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Get information about available ML models."""
    import json
    from pathlib import Path

    model_dir = Path(__file__).parent / "../../services/ml/saved_models"
    metadata_path = model_dir / "model_metadata.json"
    report_path = model_dir / "comparison_report.json"

    models: Dict[str, Any] = {
        "rule_based": {
            "name": "Rule-Based Classifier",
            "version": "rule_based_v1.0",
            "type": "keyword_matching",
            "status": "always_available",
        }
    }

    if metadata_path.exists():
        with open(metadata_path) as f:
            metadata = json.load(f)
        models["ml_best"] = {
            "name": metadata.get("display_name", "ML Classifier"),
            "version": metadata.get("model_version", "unknown"),
            "type": "tfidf_sklearn",
            "accuracy": metadata.get("accuracy"),
            "f1_weighted": metadata.get("f1_weighted"),
            "features": metadata.get("tfidf_features"),
            "samples": metadata.get("sample_count"),
            "status": "available",
        }

    comparison = None
    if report_path.exists():
        with open(report_path) as f:
            comparison = json.load(f)

    return {
        "models": models,
        "comparison": comparison,
    }


# ─── Compare Models on a Complaint ────────────────────────────

@router.post(
    "/compare/{complaint_id}",
    summary="Compare rule-based vs ML classification",
)
async def compare_models(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Run both rule-based and ML classifiers on the same complaint
    and return a side-by-side comparison.
    """
    # Load complaint
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        return {"error": "Complaint not found"}

    full_text: str = f"{complaint.title}. {complaint.description}"

    # Rule-based prediction
    from app.services.impl.rule_based_classifier import RuleBasedClassifier  # type: ignore

    rule_based = RuleBasedClassifier()
    rb_result = await rule_based.predict(full_text, complaint.language)

    comparison: Dict[str, Any] = {
        "complaint_id": str(complaint_id),
        "complaint_number": complaint.complaint_number,
        "title": complaint.title,
        "rule_based": {
            "category": rb_result.category,
            "confidence": rb_result.confidence,
            "model_version": rb_result.model_version,
            "alternatives": rb_result.alternatives,
        },
        "ml": None,
    }

    try:
        from app.services.ml.ml_classifier import MLClassifier  # type: ignore

        ml = MLClassifier()
        if ml.is_loaded():
            ml_result = await ml.predict(full_text, complaint.language)
            comparison["ml"] = {
                "category": ml_result.category,
                "confidence": ml_result.confidence,
                "model_version": ml_result.model_version,
                "alternatives": ml_result.alternatives,
            }
            comparison["agreement"] = rb_result.category == ml_result.category
        else:
            comparison["ml"] = {
                "error": "Model not trained yet. POST /api/v1/ml/train first."
            }
    except Exception as e:
        comparison["ml"] = {"error": str(e)}

    return comparison
