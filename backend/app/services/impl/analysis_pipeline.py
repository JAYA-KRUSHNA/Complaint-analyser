"""
CiviSense AI — Complaint Analysis Pipeline

Orchestrates the full AI analysis of a complaint:
  1. Text Classification  → category prediction
  2. Department Routing    → auto-assign department from category
  3. Severity Assessment   → severity score + level
  4. Urgency Assessment    → urgency level
  5. Context Detection     → safety risk, vulnerable pop, essential service
  6. Priority Scoring      → Civic Impact Score (0-100)
  7. Explanation Generation → factor breakdown for XAI
  8. Resolution Prediction → estimated hours to resolve
  9. Persist Results       → update complaint record + save explanations

This pipeline is called after a complaint is submitted.
It can also be re-run when models are upgraded (for research comparison).
"""

import uuid
from typing import Optional

from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.core.constants import (  # type: ignore
    CATEGORY_DEPARTMENT_MAP,
    DEFAULT_RESOLUTION_HOURS,
    ComplaintCategory,
)
from app.models.complaint import Complaint  # type: ignore
from app.models.department import Department  # type: ignore
from app.models.prediction_audit import PredictionAudit  # type: ignore
from app.models.priority_explanation import PriorityExplanation  # type: ignore
from app.services.impl.rule_based_classifier import (  # type: ignore
    RuleBasedClassifier,
    detect_essential_service,
    detect_safety_risk,
    detect_vulnerable_population,
)
from app.services.impl.rule_based_severity import RuleBasedSeverity  # type: ignore
from app.services.impl.rule_based_urgency import RuleBasedUrgency  # type: ignore
from app.services.impl.priority_engine import PriorityEngine, PriorityInput  # type: ignore


class AnalysisPipeline:
    """
    Orchestrates the full analysis pipeline for a complaint.

    This class coordinates all rule-based services and updates
    the complaint record with AI-computed fields.

    In future phases, the service implementations can be swapped
    (e.g., RuleBasedClassifier → MLClassifier) without changing
    this pipeline — only the instantiation changes.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        # Phase 1: Rule-based implementations
        self.classifier = RuleBasedClassifier()
        self.severity_engine = RuleBasedSeverity()
        self.urgency_engine = RuleBasedUrgency()
        self.priority_engine = PriorityEngine()

    async def analyze(self, complaint_id: uuid.UUID) -> Complaint:
        """
        Run the full analysis pipeline on a complaint.

        Steps:
        1. Load complaint from DB
        2. Classify text → category
        3. Route to department
        4. Assess severity
        5. Assess urgency
        6. Detect context flags (safety, vulnerable, essential)
        7. Compute Civic Impact Score
        8. Save explanations
        9. Estimate resolution time
        10. Save prediction audit
        11. Persist all results

        Returns:
            Updated Complaint object with all AI fields populated.
        """
        # ── Step 1: Load complaint ─────────────────────────
        result = await self.db.execute(
            select(Complaint).where(Complaint.id == complaint_id)
        )
        complaint = result.scalar_one_or_none()
        if not complaint:
            raise ValueError(f"Complaint {complaint_id} not found")

        full_text = f"{complaint.title}. {complaint.description}"

        # ── Step 2: Text Classification ────────────────────
        classification = await self.classifier.predict(
            full_text, complaint.language
        )

        # If citizen already selected a category, keep it but still record
        # AI prediction for research comparison
        ai_category = classification.category
        if complaint.category_id is None:
            # No citizen selection — use AI prediction
            category_obj = await self._resolve_category(ai_category)
            if category_obj:
                complaint.category_id = category_obj.id
        complaint.category_confidence = classification.confidence

        # Determine the effective category for downstream analysis
        effective_category = ai_category

        # ── Step 3: Department Routing ─────────────────────
        if complaint.department_id is None:
            department = await self._route_to_department(effective_category)
            if department:
                complaint.department_id = department.id
                complaint.department_confidence = classification.confidence

        # ── Step 4: Context Detection ──────────────────────
        safety_risk = detect_safety_risk(full_text)
        vulnerable_pop = detect_vulnerable_population(full_text)
        essential_svc = detect_essential_service(effective_category)

        complaint.safety_risk_flag = safety_risk
        complaint.vulnerable_population_flag = vulnerable_pop
        complaint.essential_service_flag = essential_svc

        # Estimate affected population from text signals
        affected_pop = self._estimate_affected_population(full_text)
        complaint.affected_population_estimate = affected_pop

        # ── Step 5: Severity Assessment ────────────────────
        severity = await self.severity_engine.assess(
            text=full_text,
            category=effective_category,
            duration_hours=complaint.duration_hours,
            affected_population=affected_pop,
            language=complaint.language,
        )
        complaint.severity_score = severity.score
        complaint.severity_level = severity.level
        complaint.severity_confidence = severity.confidence

        # ── Step 6: Urgency Assessment ─────────────────────
        urgency = await self.urgency_engine.assess(
            text=full_text,
            category=effective_category,
            severity_score=severity.score,
            duration_hours=complaint.duration_hours,
            safety_risk=safety_risk,
            language=complaint.language,
        )
        complaint.urgency_level = urgency.level
        complaint.urgency_confidence = urgency.confidence

        # ── Step 7: Priority Score (Civic Impact Score) ────
        priority_input = PriorityInput(
            severity_score=severity.score,
            severity_level=severity.level,
            urgency_level=urgency.level,
            safety_risk=safety_risk,
            essential_service=essential_svc,
            vulnerable_population=vulnerable_pop,
            affected_population=affected_pop,
            duration_hours=complaint.duration_hours or 0.0,
            recurrence_count=0,  # Will be computed in M7 (clustering)
        )
        priority_result = self.priority_engine.compute(priority_input)

        complaint.priority_score = priority_result.priority_score
        complaint.priority_level = priority_result.priority_level

        # ── Step 8: Save Priority Explanations ─────────────
        # Clear existing explanations (in case of re-analysis)
        existing_explanations = await self.db.execute(
            select(PriorityExplanation).where(
                PriorityExplanation.complaint_id == complaint_id
            )
        )
        for exp in existing_explanations.scalars().all():
            await self.db.delete(exp)

        for factor in priority_result.factors:
            explanation = PriorityExplanation(
                id=uuid.uuid4(),
                complaint_id=complaint_id,
                factor=factor.factor,
                contribution=factor.contribution,
                description=factor.description,
            )
            self.db.add(explanation)

        # ── Step 9: Resolution Time Estimate ───────────────
        resolution_hours = self._estimate_resolution(effective_category)
        complaint.predicted_resolution_hours = resolution_hours
        complaint.prediction_confidence = 0.5  # Rule-based estimate

        # ── Step 10: Prediction Audit ──────────────────────
        audit = PredictionAudit(
            id=uuid.uuid4(),
            complaint_id=complaint_id,
            prediction_type="FULL_ANALYSIS",
            model_version=classification.model_version,
            prediction_source="RULE_BASED",
            input_text=full_text[:500],  # Truncate for storage
            input_features={
                "text_length": len(full_text),
                "language": complaint.language,
                "duration_hours": complaint.duration_hours,
                "has_location": bool(complaint.latitude),
            },
            predicted_value=f"{ai_category}|{priority_result.priority_level}",
            confidence=classification.confidence,
            prediction_details={
                "category": ai_category,
                "category_confidence": classification.confidence,
                "severity_score": severity.score,
                "severity_level": severity.level,
                "urgency_level": urgency.level,
                "priority_score": priority_result.priority_score,
                "priority_level": priority_result.priority_level,
                "safety_risk": safety_risk,
                "essential_service": essential_svc,
                "vulnerable_population": vulnerable_pop,
            },
        )
        self.db.add(audit)

        # ── Step 11: Persist ───────────────────────────────
        await self.db.commit()
        await self.db.refresh(complaint)

        return complaint

    # ─── Helper Methods ────────────────────────────────────

    async def _resolve_category(self, category_name: str):
        """Look up Category record by enum name."""
        from app.models.category import Category

        result = await self.db.execute(
            select(Category).where(Category.name == category_name)
        )
        return result.scalar_one_or_none()

    async def _route_to_department(self, category_name: str) -> Optional[Department]:
        """Route complaint to department based on category mapping."""
        dept_name = CATEGORY_DEPARTMENT_MAP.get(
            ComplaintCategory(category_name) if category_name in [c.value for c in ComplaintCategory] else None,
            "Public Works",
        )
        if dept_name:
            result = await self.db.execute(
                select(Department).where(Department.name == dept_name)
            )
            return result.scalar_one_or_none()
        return None

    def _estimate_affected_population(self, text: str) -> str:
        """Estimate affected population from text signals."""
        normalized = text.lower()

        high_indicators = [
            "entire area", "whole colony", "all residents",
            "many people", "thousands", "hundreds",
            "main road", "highway", "market",
            "colony", "apartment", "society",
        ]
        medium_indicators = [
            "several", "many", "neighborhood", "street",
            "block", "lane", "nearby", "surrounding",
            "people", "residents", "families",
        ]

        for indicator in high_indicators:
            if indicator in normalized:
                return "HIGH"

        for indicator in medium_indicators:
            if indicator in normalized:
                return "MEDIUM"

        return "LOW"

    def _estimate_resolution(self, category_name: str) -> float:
        """Estimate resolution time based on category defaults."""
        try:
            cat = ComplaintCategory(category_name)
            return float(DEFAULT_RESOLUTION_HOURS.get(cat, 48))
        except ValueError:
            return 48.0
