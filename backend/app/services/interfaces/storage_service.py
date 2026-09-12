"""
CiviSense AI — Storage Service Interface

Abstract interface for file storage.
Implementations:
  Phase 1: LocalFileStorageService (saves to /uploads/)
  Cloud: S3StorageService, CloudinaryStorageService, SupabaseStorageService
"""

from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class StorageService(ABC):
    """
    Interface for file storage operations.
    
    Designed so the storage backend can be swapped via a single
    environment variable change (Section 4).
    """

    @abstractmethod
    async def upload(
        self,
        file: BinaryIO,
        path: str,
        content_type: Optional[str] = None,
    ) -> str:
        """
        Upload a file and return a storage key.
        
        The key is stored in the database and can be used
        to retrieve the file later via get_url().
        """
        raise NotImplementedError

    @abstractmethod
    async def get_url(self, path: str) -> str:
        """Get a publicly accessible URL for a stored file."""
        raise NotImplementedError

    @abstractmethod
    async def delete(self, path: str) -> None:
        """Delete a file from storage."""
        raise NotImplementedError

    @abstractmethod
    async def exists(self, path: str) -> bool:
        """Check if a file exists in storage."""
        raise NotImplementedError
