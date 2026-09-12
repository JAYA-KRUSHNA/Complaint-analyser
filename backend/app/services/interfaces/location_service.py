"""
CiviSense AI — Location Service Interface

Abstract interface for location extraction and geocoding.
Implementations:
  Phase 1: BasicLocationService (coordinate passthrough, basic extraction)
  Future: Nominatim/Google Maps geocoding integration
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class Coordinates:
    latitude: float
    longitude: float


@dataclass
class LocationResult:
    """Result of location extraction/geocoding."""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    confidence: float = 0.0


class LocationService(ABC):
    """
    Interface for location processing.
    
    Must not lock the application to one geocoding provider (Section 13).
    """

    @abstractmethod
    async def extract_location(self, text: str) -> Optional[LocationResult]:
        """Extract location information from complaint text."""
        raise NotImplementedError

    @abstractmethod
    async def geocode_address(self, address: str) -> Optional[Coordinates]:
        """Convert an address string to coordinates."""
        raise NotImplementedError

    @abstractmethod
    async def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """Convert coordinates to a human-readable address."""
        raise NotImplementedError

    @abstractmethod
    async def calculate_distance(
        self, point1: Coordinates, point2: Coordinates
    ) -> float:
        """Calculate distance between two points in meters."""
        raise NotImplementedError
