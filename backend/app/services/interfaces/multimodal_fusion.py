"""
CiviSense AI — Multimodal Fusion Interface

Abstract interface for combining text, image, and context features.
Implementations:
  Phase 1: NoOpMultimodalFusion (text-only features)
  Phase 3: TransformerMultimodalFusion (text + image + location embeddings)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class FusionResult:
    """Result of multimodal fusion."""
    combined_features: Dict       # Fused feature vector/dict
    modalities_used: List[str]    # ["text", "image", "location"]
    model_version: str


class MultimodalFusionService(ABC):
    """
    Interface for multimodal feature fusion.
    
    Phase 3 will combine:
    - Text embeddings (BERT/RoBERTa)
    - Image embeddings (CNN/ViT)
    - Location/context features
    into a unified representation for priority prediction.
    """

    @abstractmethod
    async def fuse(
        self,
        text_features: Optional[Dict] = None,
        image_features: Optional[Dict] = None,
        context_features: Optional[Dict] = None,
    ) -> FusionResult:
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
