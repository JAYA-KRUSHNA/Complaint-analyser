"""
CiviSense AI — Explanation Service Interface

Abstract interface for generating priority explanations.
Implementations:
  Phase 1: RuleBasedExplanation (direct factor breakdown from scoring engine)
  Phase 2+: SHAPExplanation (SHAP values from ML models)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class ExplanationFactor:
    """A single factor contributing to the priority."""
    factor: str              # e.g., "severity", "safety_risk"
    contribution: float       # Score contribution (e.g., +25)
    description: str          # Human-readable explanation


@dataclass
class ExplanationResult:
    """Complete explanation for a priority decision."""
    priority_score: int
    priority_level: str
    factors: List[ExplanationFactor]
    model_version: str


class ExplanationService(ABC):
    """
    Interface for generating priority explanations.
    
    Every prediction must have an explanation (Section 18).
    """

    @abstractmethod
    async def generate_explanation(
        self,
        complaint_data: Dict,
        priority_score: int,
        priority_level: str,
    ) -> ExplanationResult:
        raise NotImplementedError
