"""
CiviSense AI — Constants & Enumerations

All business-logic enums and constants used across the application.
These are NOT hardcoded throughout the codebase — they live here
and are referenced everywhere else.
"""

from enum import Enum


# ─── User Roles ────────────────────────────────────────────────
class UserRole(str, Enum):
    """
    Four-tier role hierarchy for access control.
    
    CITIZEN: Submit & track complaints.
    DEPARTMENT_OFFICER: Manage assigned department's complaints.
    ADMIN: Full dashboard, override AI, manage system.
    SUPER_ADMIN: Everything + manage admins, configure priority weights.
    """
    CITIZEN = "CITIZEN"
    DEPARTMENT_OFFICER = "DEPARTMENT_OFFICER"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


# ─── Complaint Status ─────────────────────────────────────────
class ComplaintStatus(str, Enum):
    """
    Complaint lifecycle states.
    
    Flow: SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
    Any state → REJECTED (with reason)
    ASSIGNED/IN_PROGRESS → ESCALATED
    """
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


# ─── Complaint Categories ─────────────────────────────────────
class ComplaintCategory(str, Enum):
    """
    Predefined civic complaint categories.
    
    The system can predict these via AI, or citizens can optionally select one.
    Extensible by admin in future modules.
    """
    WATER_SUPPLY = "WATER_SUPPLY"
    ELECTRICITY = "ELECTRICITY"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    SEWAGE = "SEWAGE"
    GARBAGE = "GARBAGE"
    STREETLIGHT = "STREETLIGHT"
    TRAFFIC = "TRAFFIC"
    PUBLIC_SAFETY = "PUBLIC_SAFETY"
    ANIMAL_CONTROL = "ANIMAL_CONTROL"
    DRAINAGE = "DRAINAGE"
    ILLEGAL_DUMPING = "ILLEGAL_DUMPING"
    OTHER = "OTHER"


# ─── Priority Levels ──────────────────────────────────────────
class PriorityLevel(str, Enum):
    """
    Four-tier priority system derived from Civic Impact Score.
    
    P1 (90-100): CRITICAL — Immediate action required
    P2 (70-89):  HIGH     — Urgent attention needed
    P3 (40-69):  MEDIUM   — Standard processing
    P4 (0-39):   LOW      — Routine handling
    """
    P1_CRITICAL = "P1"
    P2_HIGH = "P2"
    P3_MEDIUM = "P3"
    P4_LOW = "P4"


# ─── Severity Levels ──────────────────────────────────────────
class SeverityLevel(str, Enum):
    """Severity assessment output from the severity engine."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# ─── Urgency Levels ───────────────────────────────────────────
class UrgencyLevel(str, Enum):
    """
    Urgency assessment output from the urgency engine.
    
    LOW:      Broken streetlight
    MEDIUM:   Garbage not collected for several days
    HIGH:     Sewage entering houses
    CRITICAL: Gas leak near a school
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ─── Incident Status ──────────────────────────────────────────
class IncidentStatus(str, Enum):
    """Status of a civic incident (cluster of related complaints)."""
    ACTIVE = "ACTIVE"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# ─── Image Analysis Status ────────────────────────────────────
class ImageAnalysisStatus(str, Enum):
    """Processing status for uploaded complaint images."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"  # When image analysis is disabled (Phase 1)


# ─── Supported Languages ──────────────────────────────────────
class Language(str, Enum):
    """Languages supported for complaint input."""
    ENGLISH = "en"
    TELUGU = "te"
    HINDI = "hi"
    CODE_MIXED = "mixed"  # e.g., Hinglish, Tenglish


# ─── Prediction Source ─────────────────────────────────────────
class PredictionSource(str, Enum):
    """
    Tracks which engine produced a prediction.
    Important for research mode and auditability.
    """
    RULE_BASED = "RULE_BASED"
    CLASSICAL_ML = "CLASSICAL_ML"
    DEEP_LEARNING = "DEEP_LEARNING"
    HUMAN_OVERRIDE = "HUMAN_OVERRIDE"


# ─── Priority Score Thresholds ─────────────────────────────────
PRIORITY_THRESHOLDS = {
    PriorityLevel.P1_CRITICAL: (90, 100),
    PriorityLevel.P2_HIGH: (70, 89),
    PriorityLevel.P3_MEDIUM: (40, 69),
    PriorityLevel.P4_LOW: (0, 39),
}


def get_priority_level(score: float) -> PriorityLevel:
    """Convert a numeric priority score (0-100) to a priority level."""
    if score >= 90:
        return PriorityLevel.P1_CRITICAL
    elif score >= 70:
        return PriorityLevel.P2_HIGH
    elif score >= 40:
        return PriorityLevel.P3_MEDIUM
    else:
        return PriorityLevel.P4_LOW


# ─── Default Civic Impact Score Weights ────────────────────────
# These are the initial weights, configurable by admin via PriorityConfig
DEFAULT_PRIORITY_WEIGHTS = {
    "severity": 0.25,
    "urgency": 0.20,
    "safety_risk": 0.15,
    "affected_population": 0.15,
    "essential_service": 0.10,
    "vulnerable_population": 0.05,
    "duration": 0.05,
    "recurrence": 0.05,
}

# ─── Default Resolution Time Estimates (hours) ────────────────
DEFAULT_RESOLUTION_HOURS = {
    ComplaintCategory.WATER_SUPPLY: 12,
    ComplaintCategory.ELECTRICITY: 8,
    ComplaintCategory.ROAD_DAMAGE: 48,
    ComplaintCategory.SEWAGE: 24,
    ComplaintCategory.GARBAGE: 24,
    ComplaintCategory.STREETLIGHT: 36,
    ComplaintCategory.TRAFFIC: 12,
    ComplaintCategory.PUBLIC_SAFETY: 4,
    ComplaintCategory.ANIMAL_CONTROL: 24,
    ComplaintCategory.DRAINAGE: 36,
    ComplaintCategory.ILLEGAL_DUMPING: 48,
    ComplaintCategory.OTHER: 48,
}

# ─── Category → Department Default Mapping ─────────────────────
CATEGORY_DEPARTMENT_MAP = {
    ComplaintCategory.WATER_SUPPLY: "Water Department",
    ComplaintCategory.ELECTRICITY: "Electricity Department",
    ComplaintCategory.ROAD_DAMAGE: "Public Works",
    ComplaintCategory.SEWAGE: "Drainage Department",
    ComplaintCategory.GARBAGE: "Sanitation Department",
    ComplaintCategory.STREETLIGHT: "Electricity Department",
    ComplaintCategory.TRAFFIC: "Traffic Department",
    ComplaintCategory.PUBLIC_SAFETY: "Emergency Services",
    ComplaintCategory.ANIMAL_CONTROL: "Animal Control",
    ComplaintCategory.DRAINAGE: "Drainage Department",
    ComplaintCategory.ILLEGAL_DUMPING: "Sanitation Department",
    ComplaintCategory.OTHER: "Public Works",
}
