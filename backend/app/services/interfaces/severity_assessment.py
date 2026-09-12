"""
CiviSense AI — Severity Assessment Interface

Abstract interface for complaint severity prediction.
Implementations:
  Phase 1: RuleBasedSeverity (keyword scoring + category + context)
  Phase 2: MLSeverityPredictor (trained regression model)
  Phase 3: TransformerSeverityPredictor
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class SeverityResult:
    """Result of a severity assessment."""
    score: float              # 0.0 to 10.0
    level: str                # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float         # 0.0 to 1.0
    model_version: str
    factors: Optional[Dict[str, float]] = field(default_factory=dict)  # Factor breakdown


class SeverityAssessmentService(ABC):
    """
    Interface for complaint severity assessment.
    
    Severity measures the potential harm or damage caused by the issue.
    The score is one input to the Civic Impact Score (priority engine).
    """

    @abstractmethod
    async def assess(
        self,
        text: str,
        category: Optional[str] = None,
        duration_hours: Optional[float] = None,
        affected_population: Optional[str] = None,
        language: str = "en",
    ) -> SeverityResult:
        """
        Assess the severity of a complaint.
        
        Args:
            text: Complaint text.
            category: Predicted or selected category.
            duration_hours: How long the issue has persisted.
            affected_population: Estimated affected population (LOW/MEDIUM/HIGH).
            language: ISO language code.
        
        Returns:
            SeverityResult with score, level, confidence, and factor breakdown.
        """
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
