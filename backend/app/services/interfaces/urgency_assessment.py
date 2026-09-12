"""
CiviSense AI — Urgency Assessment Interface

Abstract interface for complaint urgency classification.
Implementations:
  Phase 1: RuleBasedUrgency (configurable rules)
  Phase 2: MLUrgencyClassifier (trained model)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class UrgencyResult:
    """Result of an urgency assessment."""
    level: str                # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float         # 0.0 to 1.0
    model_version: str
    reasoning: Optional[str] = None  # Why this urgency level


class UrgencyAssessmentService(ABC):
    """
    Interface for complaint urgency assessment.
    
    Urgency measures how quickly the issue needs attention,
    independent of severity (a low-severity issue can be urgent).
    """

    @abstractmethod
    async def assess(
        self,
        text: str,
        category: Optional[str] = None,
        severity_score: Optional[float] = None,
        duration_hours: Optional[float] = None,
        safety_risk: bool = False,
        language: str = "en",
    ) -> UrgencyResult:
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
