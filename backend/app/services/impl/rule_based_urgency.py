"""
CiviSense AI — Rule-Based Urgency Assessment

Phase 1 implementation of UrgencyAssessmentService.
Evaluates how quickly a complaint needs attention.

Key distinction from severity:
  - Severity = how BAD is the damage/harm
  - Urgency = how FAST does it need attention

Example: A small pothole (low severity) near a school zone during
peak hours is HIGH urgency due to time-sensitivity.

Factors:
  1. Time-pressure keywords (immediate, emergency, urgent, etc.)
  2. Duration persistence (longer duration = more urgent)
  3. Safety risk flag
  4. Severity cross-reference (high severity often implies urgency)
  5. Category-specific urgency baselines
"""

from typing import Optional

from app.core.constants import UrgencyLevel  # type: ignore
from app.services.interfaces.urgency_assessment import (  # type: ignore
    UrgencyAssessmentService,
    UrgencyResult,
)


# ─── Urgency Keyword Tiers ─────────────────────────────────────

URGENCY_CRITICAL_KEYWORDS = [
    "immediately", "right now", "emergency", "urgent",
    "life threatening", "life at risk", "dying",
    "gas leak", "fire", "electrocuted", "drowning",
    "building collapse", "bridge collapse",
    "flood", "flooding right now",
    "children trapped", "people trapped",
]

URGENCY_HIGH_KEYWORDS = [
    "as soon as possible", "asap", "quickly", "hurry",
    "very urgent", "serious", "critical",
    "no water since", "no electricity since",
    "sewage entering", "sewage inside",
    "road blocked", "completely blocked",
    "accident", "injured", "injury",
    "dog bite", "snake", "rabid",
    "open manhole", "exposed wire",
    "still not fixed", "keep complaining",
]

URGENCY_MEDIUM_KEYWORDS = [
    "days", "since last week", "for days",
    "not resolved", "pending", "waiting",
    "please fix", "kindly", "when will",
    "overflow", "leaking", "broken",
    "bad condition", "getting worse",
    "multiple complaints", "many times",
]

# ─── Category Urgency Baselines ────────────────────────────────
CATEGORY_URGENCY_BASELINE = {
    "PUBLIC_SAFETY":    "HIGH",
    "ELECTRICITY":      "MEDIUM",
    "WATER_SUPPLY":     "MEDIUM",
    "SEWAGE":           "MEDIUM",
    "DRAINAGE":         "MEDIUM",
    "ROAD_DAMAGE":      "LOW",
    "GARBAGE":          "LOW",
    "STREETLIGHT":      "LOW",
    "TRAFFIC":          "MEDIUM",
    "ANIMAL_CONTROL":   "MEDIUM",
    "ILLEGAL_DUMPING":  "LOW",
    "OTHER":            "LOW",
}

# Numeric mapping for comparisons
URGENCY_NUMERIC = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}


class RuleBasedUrgency(UrgencyAssessmentService):
    """
    Rule-based urgency assessment using keyword matching,
    duration analysis, and severity cross-reference.

    Algorithm:
    1. Start with category baseline urgency.
    2. Check keyword tiers — upgrade if keywords indicate higher urgency.
    3. Check duration — prolonged issues get urgency boost.
    4. If safety risk flag is set, ensure at least HIGH urgency.
    5. Cross-reference with severity — very high severity implies high urgency.
    6. Final level is the maximum of all signals.
    """

    MODEL_VERSION = "rule_based_urgency_v1.0"

    async def assess(
        self,
        text: str,
        category: Optional[str] = None,
        severity_score: Optional[float] = None,
        duration_hours: Optional[float] = None,
        safety_risk: bool = False,
        language: str = "en",
    ) -> UrgencyResult:
        """Assess urgency from multiple signals."""
        normalized = text.lower().strip()
        reasoning_parts = []

        # ── Signal 1: Category Baseline ────────────────────
        baseline = CATEGORY_URGENCY_BASELINE.get(category or "", "LOW")
        best_level = baseline
        reasoning_parts.append(f"Category baseline: {baseline}")

        # ── Signal 2: Keyword Detection ────────────────────
        keyword_level = self._keyword_urgency(normalized)
        if URGENCY_NUMERIC.get(keyword_level, 0) > URGENCY_NUMERIC.get(best_level, 0):
            best_level = keyword_level
            reasoning_parts.append(f"Keywords indicate: {keyword_level}")

        # ── Signal 3: Duration Escalation ──────────────────
        if duration_hours is not None:
            duration_level = self._duration_urgency(duration_hours)
            if URGENCY_NUMERIC.get(duration_level, 0) > URGENCY_NUMERIC.get(best_level, 0):
                best_level = duration_level
                reasoning_parts.append(
                    f"Issue persisting {duration_hours:.0f}h → {duration_level}"
                )

        # ── Signal 4: Safety Risk ──────────────────────────
        if safety_risk:
            if URGENCY_NUMERIC.get(best_level, 0) < URGENCY_NUMERIC["HIGH"]:
                best_level = "HIGH"
            reasoning_parts.append("Safety risk detected → at least HIGH")

        # ── Signal 5: Severity Cross-Reference ─────────────
        if severity_score is not None and severity_score >= 8.0:
            if URGENCY_NUMERIC.get(best_level, 0) < URGENCY_NUMERIC["HIGH"]:
                best_level = "HIGH"
            reasoning_parts.append(
                f"Severity {severity_score}/10 → urgency boost"
            )

        # ── Confidence ─────────────────────────────────────
        signal_count = len(reasoning_parts)
        confidence = min(0.90, 0.45 + (signal_count * 0.10))

        return UrgencyResult(
            level=best_level,
            confidence=round(confidence, 2),
            model_version=self.MODEL_VERSION,
            reasoning="; ".join(reasoning_parts),
        )

    def get_model_version(self) -> str:
        return self.MODEL_VERSION

    # ─── Helpers ───────────────────────────────────────────

    def _keyword_urgency(self, text: str) -> str:
        """Determine urgency level from keywords."""
        for kw in URGENCY_CRITICAL_KEYWORDS:
            if kw in text:
                return "CRITICAL"

        for kw in URGENCY_HIGH_KEYWORDS:
            if kw in text:
                return "HIGH"

        for kw in URGENCY_MEDIUM_KEYWORDS:
            if kw in text:
                return "MEDIUM"

        return "LOW"

    def _duration_urgency(self, hours: float) -> str:
        """Map duration to urgency level."""
        if hours >= 168:       # 7+ days
            return "HIGH"
        elif hours >= 72:      # 3+ days
            return "MEDIUM"
        elif hours >= 24:      # 1+ day
            return "MEDIUM"
        else:
            return "LOW"
