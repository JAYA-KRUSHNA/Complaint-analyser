"""
CiviSense AI — Resolution Prediction Interface

Abstract interface for predicting complaint resolution time.
Implementations:
  Phase 1: HistoricalAverageService (category-based averages)
  Phase 2: MLResolutionPredictionService (trained regression model)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ResolutionPrediction:
    """Predicted resolution time for a complaint."""
    predicted_hours: float
    confidence: float
    model_version: str
    reasoning: Optional[str] = None


class ResolutionPredictionService(ABC):
    """
    Interface for predicting complaint resolution time.
    """

    @abstractmethod
    async def predict(
        self,
        category: Optional[str] = None,
        severity_score: Optional[float] = None,
        urgency_level: Optional[str] = None,
        department: Optional[str] = None,
    ) -> ResolutionPrediction:
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
