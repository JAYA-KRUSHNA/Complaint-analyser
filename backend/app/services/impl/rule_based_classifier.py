"""
CiviSense AI — Rule-Based Text Classifier

Phase 1 implementation of TextClassificationService.
Uses weighted keyword matching to predict complaint categories.

Design:
  - Each category has a curated set of keywords with weights.
  - Multi-word phrases are matched first (higher specificity).
  - The system scores each category and picks the highest.
  - Confidence is derived from the score gap between top-2 predictions.
  - If no keywords match, falls back to "OTHER" with low confidence.

This serves as:
  1. An immediate baseline requiring no training data.
  2. A fallback when ML models are unavailable.
  3. A comparison baseline for research mode (Phase 2/3).
"""

import re
from typing import Dict, List, Optional, Tuple

from app.core.constants import ComplaintCategory  # type: ignore
from app.services.interfaces.text_classification import (  # type: ignore
    ClassificationResult,
    TextClassificationService,
)

# ─── Keyword Dictionaries ──────────────────────────────────────
# Each category maps to a list of (keyword_or_phrase, weight) tuples.
# Phrases are matched as whole units; single words as word boundaries.
# Weights reflect how strongly a keyword indicates the category.

CATEGORY_KEYWORDS: Dict[str, List[Tuple[str, float]]] = {
    ComplaintCategory.WATER_SUPPLY.value: [
        # High-specificity phrases
        ("water supply", 3.0),
        ("water pipe", 3.0),
        ("pipe burst", 3.5),
        ("water leak", 3.0),
        ("water shortage", 3.0),
        ("no water", 3.5),
        ("water tanker", 2.5),
        ("low pressure", 2.0),
        ("water pressure", 2.5),
        ("contaminated water", 3.5),
        ("dirty water", 3.0),
        ("brown water", 3.0),
        ("water connection", 2.5),
        ("water meter", 2.0),
        ("bore well", 2.0),
        ("borewell", 2.0),
        ("water wastage", 2.5),
        ("tap water", 2.0),
        ("pipeline", 2.0),
        ("water main", 2.5),
        # Single keywords (lower weight — more ambiguous)
        ("water", 1.0),
        ("pipe", 0.8),
        ("leak", 0.7),
        ("flooding", 1.0),
        ("overflow", 0.8),
    ],

    ComplaintCategory.ELECTRICITY.value: [
        ("power outage", 3.5),
        ("power cut", 3.5),
        ("no electricity", 3.5),
        ("electric shock", 3.5),
        ("power failure", 3.0),
        ("electric pole", 3.0),
        ("electricity bill", 2.0),
        ("transformer", 3.0),
        ("high tension", 2.5),
        ("low voltage", 2.5),
        ("voltage fluctuation", 2.5),
        ("power line", 2.5),
        ("electric wire", 2.5),
        ("hanging wire", 3.0),
        ("exposed wire", 3.0),
        ("electricity", 1.5),
        ("power", 0.8),
        ("voltage", 1.5),
        ("current", 0.5),
    ],

    ComplaintCategory.ROAD_DAMAGE.value: [
        ("road damage", 3.5),
        ("road repair", 3.0),
        ("pothole", 3.5),
        ("pot hole", 3.5),
        ("road cave", 3.0),
        ("road crack", 3.0),
        ("bad road", 3.0),
        ("damaged road", 3.0),
        ("broken road", 3.0),
        ("road condition", 2.5),
        ("road construction", 2.0),
        ("speed breaker", 2.0),
        ("road surface", 2.0),
        ("asphalt", 2.0),
        ("road", 0.8),
        ("potholed", 3.0),
        ("footpath", 1.5),
        ("pavement", 1.2),
    ],

    ComplaintCategory.SEWAGE.value: [
        ("sewage overflow", 3.5),
        ("sewage leak", 3.5),
        ("sewage water", 3.0),
        ("open sewer", 3.0),
        ("sewer block", 3.0),
        ("sewage line", 3.0),
        ("manhole", 2.5),
        ("open manhole", 3.5),
        ("sewage smell", 2.5),
        ("foul smell", 2.0),
        ("sewage", 2.0),
        ("sewer", 1.8),
        ("septic", 1.5),
        ("waste water", 2.0),
    ],

    ComplaintCategory.GARBAGE.value: [
        ("garbage collection", 3.5),
        ("garbage not collected", 3.5),
        ("garbage dump", 3.0),
        ("garbage pile", 3.0),
        ("waste collection", 3.0),
        ("garbage truck", 2.5),
        ("garbage bin", 2.5),
        ("overflowing bin", 3.0),
        ("waste management", 2.5),
        ("garbage burning", 2.5),
        ("solid waste", 2.5),
        ("garbage", 2.0),
        ("trash", 1.8),
        ("rubbish", 1.5),
        ("waste", 0.8),
        ("litter", 1.5),
        ("dustbin", 2.0),
    ],

    ComplaintCategory.STREETLIGHT.value: [
        ("street light", 3.5),
        ("streetlight", 3.5),
        ("street lamp", 3.0),
        ("light not working", 3.0),
        ("dark road", 2.5),
        ("dark street", 2.5),
        ("no light", 2.5),
        ("broken light", 2.5),
        ("lamp post", 2.5),
        ("faulty light", 2.5),
        ("led light", 1.5),
        ("bulb", 1.0),
    ],

    ComplaintCategory.TRAFFIC.value: [
        ("traffic signal", 3.5),
        ("traffic jam", 3.0),
        ("traffic congestion", 3.0),
        ("traffic violation", 2.5),
        ("signal not working", 3.0),
        ("broken signal", 3.0),
        ("traffic police", 2.0),
        ("road sign", 2.0),
        ("zebra crossing", 2.0),
        ("parking issue", 2.0),
        ("illegal parking", 2.5),
        ("traffic", 1.5),
        ("signal", 0.8),
        ("congestion", 1.5),
    ],

    ComplaintCategory.PUBLIC_SAFETY.value: [
        ("safety hazard", 3.5),
        ("public safety", 3.5),
        ("dangerous", 2.5),
        ("life threatening", 3.5),
        ("gas leak", 3.5),
        ("fire hazard", 3.5),
        ("building collapse", 3.5),
        ("wall collapse", 3.0),
        ("unsafe structure", 3.0),
        ("falling tree", 3.0),
        ("tree fell", 2.5),
        ("tree fall", 2.5),
        ("abandoned building", 2.0),
        ("electric hazard", 3.0),
        ("threat", 1.5),
        ("danger", 1.5),
        ("emergency", 2.0),
        ("accident", 1.5),
        ("unsafe", 2.0),
        ("collapse", 2.0),
    ],

    ComplaintCategory.ANIMAL_CONTROL.value: [
        ("stray dog", 3.5),
        ("stray dogs", 3.5),
        ("dog bite", 3.5),
        ("stray animal", 3.0),
        ("stray cattle", 3.0),
        ("stray cow", 3.0),
        ("animal menace", 3.0),
        ("rabid dog", 3.5),
        ("snake", 2.0),
        ("monkey", 2.0),
        ("pig", 1.5),
        ("wild animal", 2.5),
        ("stray", 1.5),
        ("animal", 1.0),
    ],

    ComplaintCategory.DRAINAGE.value: [
        ("drainage block", 3.5),
        ("drainage problem", 3.0),
        ("blocked drain", 3.5),
        ("drain overflow", 3.0),
        ("storm drain", 2.5),
        ("drain cleaning", 2.5),
        ("waterlogging", 3.0),
        ("water logging", 3.0),
        ("clogged drain", 3.0),
        ("drainage", 2.0),
        ("drain", 1.5),
        ("clogged", 1.0),
    ],

    ComplaintCategory.ILLEGAL_DUMPING.value: [
        ("illegal dumping", 3.5),
        ("construction debris", 3.0),
        ("construction waste", 3.0),
        ("illegal construction", 2.5),
        ("encroachment", 3.0),
        ("land encroachment", 3.0),
        ("unauthorized construction", 3.0),
        ("dumping", 2.0),
        ("debris", 1.5),
        ("encroach", 2.0),
    ],
}

# ─── Inherently essential service categories ───────────────────
ESSENTIAL_SERVICE_CATEGORIES = {
    ComplaintCategory.WATER_SUPPLY.value,
    ComplaintCategory.ELECTRICITY.value,
    ComplaintCategory.SEWAGE.value,
    ComplaintCategory.DRAINAGE.value,
}

# ─── Safety-related keywords ──────────────────────────────────
SAFETY_KEYWORDS = [
    "dangerous", "life threatening", "death", "accident", "collapse",
    "electric shock", "gas leak", "fire", "flooding", "unsafe",
    "injury", "injured", "killed", "casualty", "emergency",
    "children", "school", "hospital", "elderly", "disabled",
    "pregnant", "blind", "wheelchair",
]

# ─── Vulnerable population keywords ──────────────────────────
VULNERABLE_KEYWORDS = [
    "children", "school", "elderly", "old age", "senior citizen",
    "disabled", "handicapped", "pregnant", "women", "slum",
    "blind", "wheelchair", "orphanage", "hospital", "clinic",
]


class RuleBasedClassifier(TextClassificationService):
    """
    Rule-based text classifier using weighted keyword matching.

    Algorithm:
    1. Normalize input text (lowercase, basic cleaning).
    2. For each category, compute a score by matching keywords.
    3. Multi-word phrases are matched first for higher specificity.
    4. Category with highest score wins.
    5. Confidence = normalized score gap between top-1 and top-2.
    """

    MODEL_VERSION = "rule_based_v1.0"

    async def predict(self, text: str, language: str = "en") -> ClassificationResult:
        """Predict category from complaint text using keyword matching."""
        normalized = self._normalize(text)
        scores = self._compute_scores(normalized)

        # Sort by score descending
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        if not ranked or ranked[0][1] == 0:
            # No keywords matched — fall back to OTHER
            return ClassificationResult(
                category=ComplaintCategory.OTHER.value,
                confidence=0.15,
                model_version=self.MODEL_VERSION,
                alternatives=[],
            )

        top_category = ranked[0][0]
        top_score = ranked[0][1]
        second_score = ranked[1][1] if len(ranked) > 1 else 0

        # Confidence: how much the top category dominates
        total_score = sum(s for _, s in ranked if s > 0)
        if total_score > 0:
            confidence = min(0.95, (top_score / total_score) * 0.8 + 0.2)
            # Boost confidence if gap between top-1 and top-2 is large
            if second_score > 0:
                gap_ratio = (top_score - second_score) / top_score
                confidence = min(0.95, confidence + gap_ratio * 0.1)
        else:
            confidence = 0.15

        # Build alternatives list (top 3)
        alternatives = [
            {"category": cat, "score": round(score, 2)}
            for cat, score in ranked[1:4]
            if score > 0
        ]

        return ClassificationResult(
            category=top_category,
            confidence=round(confidence, 3),
            model_version=self.MODEL_VERSION,
            alternatives=alternatives,
        )

    def get_model_version(self) -> str:
        return self.MODEL_VERSION

    # ─── Helper Methods ────────────────────────────────────

    def _normalize(self, text: str) -> str:
        """Lowercase, collapse whitespace, remove special chars."""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def _compute_scores(self, text: str) -> Dict[str, float]:
        """Compute a weighted score for each category."""
        scores: Dict[str, float] = {}

        for category, keywords in CATEGORY_KEYWORDS.items():
            score = 0.0
            for keyword, weight in keywords:
                if ' ' in keyword:
                    # Phrase match — search as substring
                    count = text.count(keyword)
                    if count > 0:
                        score += weight * count
                else:
                    # Word boundary match
                    pattern = rf'\b{re.escape(keyword)}\b'
                    matches = re.findall(pattern, text)
                    if matches:
                        score += weight * len(matches)

            scores[category] = score

        return scores


# ─── Utility Functions (used by analysis pipeline) ─────────────

def detect_safety_risk(text: str) -> bool:
    """Check if the complaint text indicates a safety risk."""
    normalized = text.lower()
    return any(kw in normalized for kw in SAFETY_KEYWORDS)


def detect_vulnerable_population(text: str) -> bool:
    """Check if the complaint mentions vulnerable populations."""
    normalized = text.lower()
    return any(kw in normalized for kw in VULNERABLE_KEYWORDS)


def detect_essential_service(category: str) -> bool:
    """Check if the category is an essential service."""
    return category in ESSENTIAL_SERVICE_CATEGORIES
