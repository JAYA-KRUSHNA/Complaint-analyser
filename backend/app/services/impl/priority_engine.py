"""
CiviSense AI — Priority Scoring Engine (Civic Impact Score)

Combines all assessment outputs into a single 0-100 priority score.
This is the core intelligence that determines complaint ordering.

Formula (from research prompt):
  CIS = w1×Severity + w2×Urgency + w3×SafetyRisk + w4×AffectedPop
      + w5×EssentialService + w6×VulnerablePop + w7×Duration + w8×Recurrence

Default weights (configurable by admin via PriorityConfig):
  severity:             0.25
  urgency:              0.20
  safety_risk:          0.15
  affected_population:  0.15
  essential_service:    0.10
  vulnerable_population: 0.05
  duration:             0.05
  recurrence:           0.05

Score → Level mapping:
  90-100: P1 (CRITICAL) — Immediate action
  70-89:  P2 (HIGH)     — Urgent attention
  40-69:  P3 (MEDIUM)   — Standard processing
  0-39:   P4 (LOW)      — Routine handling
"""

from dataclasses import dataclass
from typing import Dict, List, Optional

from app.core.constants import DEFAULT_PRIORITY_WEIGHTS, get_priority_level
from app.services.interfaces.explanation_service import (
    ExplanationFactor,
    ExplanationResult,
    ExplanationService,
)


@dataclass
class PriorityInput:
    """All inputs needed to compute the Civic Impact Score."""
    severity_score: float = 0.0          # 0-10
    severity_level: str = "LOW"
    urgency_level: str = "LOW"
    safety_risk: bool = False
    essential_service: bool = False
    vulnerable_population: bool = False
    affected_population: str = "LOW"     # LOW, MEDIUM, HIGH
    duration_hours: float = 0.0
    recurrence_count: int = 0            # How many similar complaints


class PriorityEngine:
    """
    Computes the Civic Impact Score (0-100) from multi-factor inputs.
    
    Each factor is normalized to a 0-100 sub-score, then combined
    with configurable weights. The engine also produces a detailed
    factor breakdown for explainability (XAI).
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        """
        Initialize with custom weights or use defaults.
        
        Args:
            weights: Optional custom weights (from PriorityConfig table).
                     Falls back to DEFAULT_PRIORITY_WEIGHTS if None.
        """
        self.weights = weights or DEFAULT_PRIORITY_WEIGHTS.copy()

    def compute(self, inputs: PriorityInput) -> ExplanationResult:
        """
        Compute the Civic Impact Score and generate explanation.
        
        Returns:
            ExplanationResult with score, level, and factor breakdown.
        """
        factors: List[ExplanationFactor] = []

        # ── Factor 1: Severity (0-100) ────────────────────
        severity_sub = (inputs.severity_score / 10.0) * 100
        severity_contribution = severity_sub * self.weights["severity"]
        factors.append(ExplanationFactor(
            factor="severity",
            contribution=round(severity_contribution, 1),
            description=f"Severity {inputs.severity_level} ({inputs.severity_score}/10) "
                       f"→ {severity_contribution:.1f} points",
        ))

        # ── Factor 2: Urgency (0-100) ─────────────────────
        urgency_map = {"LOW": 20, "MEDIUM": 50, "HIGH": 80, "CRITICAL": 100}
        urgency_sub = urgency_map.get(inputs.urgency_level, 20)
        urgency_contribution = urgency_sub * self.weights["urgency"]
        factors.append(ExplanationFactor(
            factor="urgency",
            contribution=round(urgency_contribution, 1),
            description=f"Urgency {inputs.urgency_level} "
                       f"→ {urgency_contribution:.1f} points",
        ))

        # ── Factor 3: Safety Risk (0 or 100) ──────────────
        safety_sub = 100 if inputs.safety_risk else 0
        safety_contribution = safety_sub * self.weights["safety_risk"]
        if inputs.safety_risk:
            factors.append(ExplanationFactor(
                factor="safety_risk",
                contribution=round(safety_contribution, 1),
                description=f"Safety risk detected → +{safety_contribution:.1f} points",
            ))

        # ── Factor 4: Affected Population (0-100) ─────────
        pop_map = {"LOW": 20, "MEDIUM": 60, "HIGH": 100}
        pop_sub = pop_map.get(inputs.affected_population.upper(), 20)
        pop_contribution = pop_sub * self.weights["affected_population"]
        factors.append(ExplanationFactor(
            factor="affected_population",
            contribution=round(pop_contribution, 1),
            description=f"Affected population {inputs.affected_population} "
                       f"→ {pop_contribution:.1f} points",
        ))

        # ── Factor 5: Essential Service (0 or 100) ────────
        essential_sub = 100 if inputs.essential_service else 0
        essential_contribution = essential_sub * self.weights["essential_service"]
        if inputs.essential_service:
            factors.append(ExplanationFactor(
                factor="essential_service",
                contribution=round(essential_contribution, 1),
                description=f"Essential service category → +{essential_contribution:.1f} points",
            ))

        # ── Factor 6: Vulnerable Population (0 or 100) ────
        vuln_sub = 100 if inputs.vulnerable_population else 0
        vuln_contribution = vuln_sub * self.weights["vulnerable_population"]
        if inputs.vulnerable_population:
            factors.append(ExplanationFactor(
                factor="vulnerable_population",
                contribution=round(vuln_contribution, 1),
                description=f"Vulnerable population mentioned → +{vuln_contribution:.1f} points",
            ))

        # ── Factor 7: Duration (0-100) ────────────────────
        duration_sub = self._duration_score(inputs.duration_hours)
        duration_contribution = duration_sub * self.weights["duration"]
        if duration_sub > 0:
            factors.append(ExplanationFactor(
                factor="duration",
                contribution=round(duration_contribution, 1),
                description=f"Issue persisting {inputs.duration_hours:.0f}h "
                           f"→ {duration_contribution:.1f} points",
            ))

        # ── Factor 8: Recurrence (0-100) ──────────────────
        recurrence_sub = min(100, inputs.recurrence_count * 25)
        recurrence_contribution = recurrence_sub * self.weights["recurrence"]
        if recurrence_sub > 0:
            factors.append(ExplanationFactor(
                factor="recurrence",
                contribution=round(recurrence_contribution, 1),
                description=f"{inputs.recurrence_count} similar complaints "
                           f"→ {recurrence_contribution:.1f} points",
            ))

        # ── Total Score ────────────────────────────────────
        total = (
            severity_contribution
            + urgency_contribution
            + safety_contribution
            + pop_contribution
            + essential_contribution
            + vuln_contribution
            + duration_contribution
            + recurrence_contribution
        )

        # Clamp to 0-100
        score = int(min(100, max(0, round(total))))
        level = get_priority_level(score)

        return ExplanationResult(
            priority_score=score,
            priority_level=level.value,
            factors=factors,
            model_version="civic_impact_score_v1.0",
        )

    def _duration_score(self, hours: float) -> float:
        """Convert duration hours to a 0-100 sub-score."""
        if hours <= 0:
            return 0
        elif hours >= 168:     # 7+ days
            return 100
        elif hours >= 72:      # 3+ days
            return 75
        elif hours >= 24:      # 1+ day
            return 50
        elif hours >= 6:       # 6+ hours
            return 30
        else:
            return 10


# ─── Explanation Service Implementation ───────────────────────

class RuleBasedExplanation(ExplanationService):
    """
    Phase 1 explanation generator.
    
    Since the rule-based engine already produces factor breakdowns,
    this service simply formats and structures them.
    """

    async def generate_explanation(
        self,
        complaint_data: Dict,
        priority_score: int,
        priority_level: str,
    ) -> ExplanationResult:
        """Generate explanation from pre-computed factors."""
        # In rule-based mode, the factors are already computed
        # by PriorityEngine. This method wraps them.
        factors = complaint_data.get("factors", [])
        return ExplanationResult(
            priority_score=priority_score,
            priority_level=priority_level,
            factors=factors,
            model_version="rule_based_explanation_v1.0",
        )
