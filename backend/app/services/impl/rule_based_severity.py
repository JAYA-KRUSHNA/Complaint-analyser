"""
CiviSense AI — Rule-Based Severity Assessment

Phase 1 implementation of SeverityAssessmentService.
Evaluates complaint severity using multi-factor scoring:

Factors:
  1. Keyword severity (what words indicate serious harm?)
  2. Category baseline (some categories are inherently more severe)
  3. Duration escalation (longer issues = more severe)
  4. Population context (vulnerable groups, affected count)
  5. Safety signals (danger/threat keywords)

Output: Score 0-10, mapped to LOW/MEDIUM/HIGH/CRITICAL levels.
"""

import re
from typing import Dict, List, Optional, Tuple

from app.core.constants import SeverityLevel
from app.services.interfaces.severity_assessment import (
    SeverityAssessmentService,
    SeverityResult,
)


# ─── Severity Keyword Tiers ───────────────────────────────────
# Each tier represents a different level of harm/damage.
# Matching against any keyword in a tier adds its base score.

SEVERITY_TIERS: List[Tuple[float, List[str]]] = [
    # Tier 1: CRITICAL indicators (base +8)
    (8.0, [
        "death", "killed", "casualty", "fatality",
        "building collapse", "wall collapse", "bridge collapse",
        "gas leak", "electrocuted", "electric shock",
        "fire", "explosion", "flood", "drowning",
        "life threatening", "life at risk",
    ]),

    # Tier 2: HIGH severity (base +6)
    (6.0, [
        "injury", "injured", "accident", "dangerous",
        "contaminated", "toxic", "poisonous",
        "sewage overflow", "sewage entering",
        "collapse", "falling", "cave in",
        "blocked road", "road cave",
        "no water", "no electricity", "power outage",
        "flooding", "waterlogging",
        "stray dog", "dog bite", "rabid",
    ]),

    # Tier 3: MEDIUM severity (base +4)
    (4.0, [
        "unsafe", "broken", "damaged", "leaking",
        "overflow", "burst", "blocked",
        "foul smell", "bad smell", "stink",
        "pothole", "crack", "exposed wire",
        "hanging wire", "open manhole",
        "not working", "not functioning",
        "frequent", "repeated", "recurring",
    ]),

    # Tier 4: LOW severity (base +2)
    (2.0, [
        "complaint", "issue", "problem", "concern",
        "request", "suggestion", "maintenance",
        "minor", "small", "routine",
        "slow", "delay", "pending",
    ]),
]

# ─── Category Baseline Severity ───────────────────────────────
# Some categories are inherently more severe regardless of keywords.
CATEGORY_SEVERITY_BASELINE: Dict[str, float] = {
    "PUBLIC_SAFETY":    6.0,
    "ELECTRICITY":      4.5,
    "WATER_SUPPLY":     4.0,
    "SEWAGE":           4.5,
    "DRAINAGE":         3.5,
    "ROAD_DAMAGE":      3.5,
    "GARBAGE":          2.5,
    "STREETLIGHT":      2.5,
    "TRAFFIC":          3.0,
    "ANIMAL_CONTROL":   3.5,
    "ILLEGAL_DUMPING":  2.5,
    "OTHER":            2.0,
}


class RuleBasedSeverity(SeverityAssessmentService):
    """
    Rule-based severity assessment using multi-factor scoring.
    
    Algorithm:
    1. Start with category baseline score.
    2. Match keywords in severity tiers — take highest matching tier.
    3. Apply duration escalation bonus.
    4. Apply population/vulnerability modifiers.
    5. Normalize to 0-10 scale and classify into severity level.
    """

    MODEL_VERSION = "rule_based_severity_v1.0"

    async def assess(
        self,
        text: str,
        category: Optional[str] = None,
        duration_hours: Optional[float] = None,
        affected_population: Optional[str] = None,
        language: str = "en",
    ) -> SeverityResult:
        """Assess severity from text, category, and contextual signals."""
        normalized = text.lower().strip()
        factors: Dict[str, float] = {}

        # ── Factor 1: Category Baseline ────────────────────
        category_base = CATEGORY_SEVERITY_BASELINE.get(category or "", 2.0)
        factors["category_baseline"] = category_base

        # ── Factor 2: Keyword Severity ─────────────────────
        keyword_score = self._keyword_severity(normalized)
        factors["keyword_severity"] = keyword_score

        # ── Factor 3: Duration Escalation ──────────────────
        duration_bonus = 0.0
        if duration_hours is not None:
            if duration_hours >= 168:        # 7+ days
                duration_bonus = 2.0
            elif duration_hours >= 72:       # 3+ days
                duration_bonus = 1.5
            elif duration_hours >= 24:       # 1+ day
                duration_bonus = 1.0
            elif duration_hours >= 6:        # 6+ hours
                duration_bonus = 0.5
        factors["duration_escalation"] = duration_bonus

        # ── Factor 4: Population Impact ────────────────────
        population_bonus = 0.0
        if affected_population:
            population_map = {"LOW": 0.0, "MEDIUM": 0.5, "HIGH": 1.5}
            population_bonus = population_map.get(affected_population.upper(), 0.0)
        factors["population_impact"] = population_bonus

        # ── Compute Final Score ────────────────────────────
        # Take the higher of (keyword_score, category_baseline) and add modifiers
        base = max(keyword_score, category_base)
        raw_score = base + duration_bonus + population_bonus

        # Clamp to 0-10
        score = min(10.0, max(0.0, raw_score))
        score = round(score, 1)

        # ── Determine Level ────────────────────────────────
        level = self._score_to_level(score)

        # ── Confidence ─────────────────────────────────────
        # Higher confidence when multiple factors agree
        active_factors = sum(1 for v in factors.values() if v > 0)
        confidence = min(0.90, 0.50 + (active_factors * 0.10))

        return SeverityResult(
            score=score,
            level=level.value,
            confidence=round(confidence, 2),
            model_version=self.MODEL_VERSION,
            factors=factors,
        )

    def get_model_version(self) -> str:
        return self.MODEL_VERSION

    # ─── Helpers ───────────────────────────────────────────

    def _keyword_severity(self, text: str) -> float:
        """Find the highest matching severity tier score."""
        max_score = 0.0
        for tier_score, keywords in SEVERITY_TIERS:
            for kw in keywords:
                if kw in text:
                    max_score = max(max_score, tier_score)
                    break  # One match per tier is enough
        return max_score

    def _score_to_level(self, score: float) -> SeverityLevel:
        """Map numeric score to severity level."""
        if score >= 8.0:
            return SeverityLevel.CRITICAL
        elif score >= 5.5:
            return SeverityLevel.HIGH
        elif score >= 3.0:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW
