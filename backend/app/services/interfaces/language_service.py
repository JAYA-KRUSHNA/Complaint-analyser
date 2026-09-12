"""
CiviSense AI — Language Service Interface

Abstract interface for language detection and processing.
Implementations:
  Phase 1: BasicLanguageService (simple heuristics)
  Phase 3: TransformerLanguageService (multilingual models)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class LanguageDetectionResult:
    """Result of language detection."""
    language: str             # ISO code: en, te, hi, mixed
    confidence: float
    script: Optional[str] = None  # Detected script (Latin, Telugu, Devanagari)


class LanguageService(ABC):
    """
    Interface for language detection and text normalization.
    
    Must never destroy the original complaint text (Section 17).
    """

    @abstractmethod
    async def detect_language(self, text: str) -> LanguageDetectionResult:
        raise NotImplementedError

    @abstractmethod
    async def normalize_text(self, text: str, source_lang: str) -> str:
        """Normalize text for processing (lowercase, remove noise, etc.)."""
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
