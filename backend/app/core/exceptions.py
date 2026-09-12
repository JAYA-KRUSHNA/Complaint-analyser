"""
CiviSense AI — Custom Exception Classes

Structured exception hierarchy for clean error handling.
FastAPI exception handlers convert these into proper HTTP responses.
"""

from typing import Any


class CiviSenseException(Exception):
    """Base exception for all CiviSense errors."""
    def __init__(self, message: str = "An error occurred", details: Any = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class NotFoundException(CiviSenseException):
    """Resource not found (404)."""
    def __init__(self, resource: str = "Resource", identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with id '{identifier}' not found"
        super().__init__(message=message)


class DuplicateException(CiviSenseException):
    """Resource already exists (409)."""
    def __init__(self, resource: str = "Resource", field: str = ""):
        message = f"{resource} already exists"
        if field:
            message = f"{resource} with this {field} already exists"
        super().__init__(message=message)


class UnauthorizedException(CiviSenseException):
    """Authentication required (401)."""
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message)


class ForbiddenException(CiviSenseException):
    """Insufficient permissions (403)."""
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message=message)


class ValidationException(CiviSenseException):
    """Input validation failed (422)."""
    def __init__(self, message: str = "Validation failed", details: Any = None):
        super().__init__(message=message, details=details)


class ServiceException(CiviSenseException):
    """Internal service error (500)."""
    def __init__(self, message: str = "Internal service error", details: Any = None):
        super().__init__(message=message, details=details)
