"""
CiviSense AI — Image Analysis Interface

Abstract interface for complaint image analysis.
Implementations:
  Phase 1: NoOpImageAnalysisService (stores metadata only)
  Phase 3: YOLOImageAnalysisService (object detection)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class DetectedObject:
    """A single detected object in an image."""
    label: str               # e.g., "pothole", "garbage", "flooding"
    confidence: float         # 0.0 to 1.0
    bbox: Optional[List[float]] = None  # [x, y, width, height]


@dataclass
class ImageAnalysisResult:
    """Result of image analysis."""
    detected_objects: List[DetectedObject]
    severity_score: Optional[float] = None  # Image-derived severity
    model_version: str = "none"
    metadata: Optional[Dict] = field(default_factory=dict)


class ImageAnalysisService(ABC):
    """
    Interface for complaint image analysis.
    
    Phase 1: No-op (images stored but not analyzed).
    Future: YOLO/CNN detects garbage, potholes, flooding, etc.
    """

    @abstractmethod
    async def analyze(self, image_path: str) -> ImageAnalysisResult:
        raise NotImplementedError

    @abstractmethod
    def get_model_version(self) -> str:
        raise NotImplementedError
