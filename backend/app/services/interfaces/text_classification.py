"""
CiviSense AI — Text Classification Interface

Abstract interface for complaint category prediction.
Implementations:
  Phase 1: RuleBasedClassifier (keyword matching)
  Phase 2: ClassicalMLClassifier (TF-IDF + LR/SVM/RF)
  Phase 3: BERTClassifier, IndicBERTClassifier, RoBERTaClassifier
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ClassificationResult:
    """Result of a text classification prediction."""
    category: str                    # Predicted category name
    confidence: float                # 0.0 to 1.0
    model_version: str               # e.g., "rule_based_v1", "tfidf_lr_v1.0"
    alternatives: Optional[List[dict]] = None  # Top-N alternative predictions


class TextClassificationService(ABC):
    """
    Interface for complaint text classification.
    
    Implementations must predict the complaint category from text.
    The interface is identical regardless of whether the backend
    is rule-based, classical ML, or deep learning.
    """

    @abstractmethod
    async def predict(self, text: str, language: str = "en") -> ClassificationResult:
        """
        Predict the category of a complaint from its text.
        
        Args:
            text: The complaint text (title + description).
            language: ISO language code (en, te, hi, mixed).
        
        Returns:
            ClassificationResult with category, confidence, and model version.
        """
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        """Return the current model version string."""
        raise NotImplementedError
