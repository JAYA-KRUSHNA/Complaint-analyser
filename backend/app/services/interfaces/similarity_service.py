"""
CiviSense AI — Similarity Service Interface

Abstract interface for complaint duplicate detection.
Implementations:
  Phase 1: TFIDFSimilarityService (TF-IDF + cosine similarity)
  Phase 3: SentenceBERTSimilarityService (semantic similarity)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class SimilarityMatch:
    """A single similarity match result."""
    complaint_id: str
    similarity_score: float    # 0.0 to 1.0
    is_duplicate: bool         # True if score > duplicate threshold


@dataclass
class SimilarityResult:
    """Result of a similarity search."""
    possible_duplicate: bool
    matches: List[SimilarityMatch]
    model_version: str


class SimilarityService(ABC):
    """
    Interface for complaint similarity detection.
    
    Compares a new complaint against existing complaints
    to find duplicates and related submissions.
    """

    @abstractmethod
    async def find_similar(
        self,
        text: str,
        category: Optional[str] = None,
        limit: int = 10,
        threshold: float = 0.5,
    ) -> SimilarityResult:
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
