"""
CiviSense AI — Complaint Service

Business logic for complaint lifecycle:
- Create with auto-generated complaint number
- List with filtering, sorting, pagination
- Status transitions with audit trail
- Admin overrides with prediction audit
"""

import uuid
from datetime import datetime, timezone
from math import ceil
from typing import Optional

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import ComplaintStatus, UserRole
from app.core.exceptions import (
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.complaint import Complaint
from app.models.complaint_status_history import ComplaintStatusHistory
from app.models.category import Category
from app.models.department import Department
from app.schemas.complaint import (
    ComplaintCreateRequest,
    ComplaintUpdateRequest,
    StatusUpdateRequest,
)


class ComplaintService:
    """Handles all complaint operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ─── Create ────────────────────────────────────────────

    async def create_complaint(
        self, data: ComplaintCreateRequest, user_id: uuid.UUID
    ) -> Complaint:
        """
        Create a new complaint.
        
        - Auto-generates complaint_number (CMP-XXXXX)
        - Looks up category by name if provided
        - Sets initial status to SUBMITTED
        - Records status creation in history
        """
        # Generate unique complaint number
        complaint_number = await self._generate_complaint_number()

        # Resolve category if provided
        category_id = None
        if data.category_name:
            category = await self._get_category_by_name(data.category_name)
            if category:
                category_id = category.id

        complaint = Complaint(
            id=uuid.uuid4(),
            complaint_number=complaint_number,
            user_id=user_id,
            title=data.title,
            description=data.description,
            original_text=data.description,  # Preserve original text
            language=data.language,
            category_id=category_id,
            status=ComplaintStatus.SUBMITTED.value,
            latitude=data.latitude,
            longitude=data.longitude,
            location_text=data.location_text,
            address=data.address,
            duration_hours=data.duration_hours,
        )

        self.db.add(complaint)

        # Record initial status in history
        history = ComplaintStatusHistory(
            id=uuid.uuid4(),
            complaint_id=complaint.id,
            old_status=None,
            new_status=ComplaintStatus.SUBMITTED.value,
            changed_by=user_id,
            comment="Complaint submitted",
        )
        self.db.add(history)

        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    # ─── Read ──────────────────────────────────────────────

    async def get_complaint(self, complaint_id: uuid.UUID) -> Complaint:
        """Get a complaint by ID with all relationships loaded."""
        result = await self.db.execute(
            select(Complaint)
            .options(
                selectinload(Complaint.category),
                selectinload(Complaint.department),
                selectinload(Complaint.status_history),
                selectinload(Complaint.priority_explanations),
            )
            .where(Complaint.id == complaint_id)
        )
        complaint = result.scalar_one_or_none()
        if not complaint:
            raise NotFoundException("Complaint", complaint_id)
        return complaint

    async def get_complaint_by_number(self, complaint_number: str) -> Complaint:
        """Get a complaint by its CMP-XXXXX number."""
        result = await self.db.execute(
            select(Complaint)
            .options(
                selectinload(Complaint.category),
                selectinload(Complaint.department),
                selectinload(Complaint.status_history),
                selectinload(Complaint.priority_explanations),
            )
            .where(Complaint.complaint_number == complaint_number)
        )
        complaint = result.scalar_one_or_none()
        if not complaint:
            raise NotFoundException("Complaint", complaint_number)
        return complaint

    async def list_complaints(
        self,
        user_id: Optional[uuid.UUID] = None,
        user_role: Optional[str] = None,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        department_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """
        List complaints with filtering, sorting, and pagination.
        
        Citizens see only their own complaints.
        Officers see their department's complaints.
        Admins see all complaints.
        """
        query = select(Complaint).options(
            selectinload(Complaint.category),
            selectinload(Complaint.department),
        )

        # Role-based filtering
        if user_role == UserRole.CITIZEN.value and user_id:
            query = query.where(Complaint.user_id == user_id)
        elif user_role == UserRole.DEPARTMENT_OFFICER.value and department_id:
            query = query.where(Complaint.department_id == department_id)
        # Admins see all — no filter needed

        # Apply filters
        if status_filter:
            query = query.where(Complaint.status == status_filter)
        if category_filter:
            cat_result = await self.db.execute(
                select(Category.id).where(Category.name == category_filter)
            )
            cat_id = cat_result.scalar_one_or_none()
            if cat_id:
                query = query.where(Complaint.category_id == cat_id)
        if priority_filter:
            query = query.where(Complaint.priority_level == priority_filter)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        sort_column = getattr(Complaint, sort_by, Complaint.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        complaints = result.scalars().all()

        return {
            "items": complaints,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": ceil(total / page_size) if total > 0 else 0,
        }

    # ─── Update ────────────────────────────────────────────

    async def update_complaint(
        self,
        complaint_id: uuid.UUID,
        data: ComplaintUpdateRequest,
        user_id: uuid.UUID,
    ) -> Complaint:
        """Update complaint fields (citizen can only update SUBMITTED complaints)."""
        complaint = await self.get_complaint(complaint_id)

        # Citizens can only edit their own SUBMITTED complaints
        if complaint.user_id != user_id:
            raise ForbiddenException("You can only edit your own complaints")
        if complaint.status != ComplaintStatus.SUBMITTED.value:
            raise ValidationException(
                "Can only edit complaints with SUBMITTED status"
            )

        if data.title is not None:
            complaint.title = data.title
        if data.description is not None:
            complaint.description = data.description
        if data.location_text is not None:
            complaint.location_text = data.location_text
        if data.address is not None:
            complaint.address = data.address
        if data.latitude is not None:
            complaint.latitude = data.latitude
        if data.longitude is not None:
            complaint.longitude = data.longitude

        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    # ─── Status Management ─────────────────────────────────

    async def update_status(
        self,
        complaint_id: uuid.UUID,
        data: StatusUpdateRequest,
        changed_by: uuid.UUID,
    ) -> Complaint:
        """
        Update complaint status with audit trail.
        Every status change is recorded in ComplaintStatusHistory.
        """
        complaint = await self.get_complaint(complaint_id)
        old_status = complaint.status

        # Validate transition
        self._validate_status_transition(old_status, data.status)

        # Update status
        complaint.status = data.status

        # Set resolved_at if resolving
        if data.status == ComplaintStatus.RESOLVED.value:
            complaint.resolved_at = datetime.now(timezone.utc)

        # Record in history
        history = ComplaintStatusHistory(
            id=uuid.uuid4(),
            complaint_id=complaint.id,
            old_status=old_status,
            new_status=data.status,
            changed_by=changed_by,
            comment=data.comment,
        )
        self.db.add(history)

        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    # ─── Delete ────────────────────────────────────────────

    async def delete_complaint(
        self, complaint_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """Soft delete — citizens can only delete SUBMITTED complaints."""
        complaint = await self.get_complaint(complaint_id)

        if complaint.user_id != user_id:
            raise ForbiddenException("You can only delete your own complaints")
        if complaint.status != ComplaintStatus.SUBMITTED.value:
            raise ValidationException(
                "Can only delete complaints with SUBMITTED status"
            )

        await self.db.delete(complaint)
        await self.db.commit()

    # ─── Helpers ───────────────────────────────────────────

    async def _generate_complaint_number(self) -> str:
        """Generate unique complaint number: CMP-XXXXX."""
        result = await self.db.execute(
            select(func.count()).select_from(Complaint)
        )
        count = (result.scalar() or 0) + 1
        return f"CMP-{count:05d}"

    async def _get_category_by_name(self, name: str) -> Optional[Category]:
        """Look up category by name."""
        result = await self.db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()

    def _validate_status_transition(self, old_status: str, new_status: str) -> None:
        """
        Validate complaint status transitions.
        
        SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
        Any → REJECTED
        ASSIGNED/IN_PROGRESS → ESCALATED
        """
        valid_transitions = {
            ComplaintStatus.SUBMITTED.value: [
                ComplaintStatus.UNDER_REVIEW.value,
                ComplaintStatus.REJECTED.value,
            ],
            ComplaintStatus.UNDER_REVIEW.value: [
                ComplaintStatus.ASSIGNED.value,
                ComplaintStatus.REJECTED.value,
            ],
            ComplaintStatus.ASSIGNED.value: [
                ComplaintStatus.IN_PROGRESS.value,
                ComplaintStatus.ESCALATED.value,
                ComplaintStatus.REJECTED.value,
            ],
            ComplaintStatus.IN_PROGRESS.value: [
                ComplaintStatus.RESOLVED.value,
                ComplaintStatus.ESCALATED.value,
                ComplaintStatus.REJECTED.value,
            ],
            ComplaintStatus.ESCALATED.value: [
                ComplaintStatus.IN_PROGRESS.value,
                ComplaintStatus.RESOLVED.value,
                ComplaintStatus.REJECTED.value,
            ],
            ComplaintStatus.RESOLVED.value: [
                ComplaintStatus.CLOSED.value,
            ],
            ComplaintStatus.REJECTED.value: [],
            ComplaintStatus.CLOSED.value: [],
        }

        allowed = valid_transitions.get(old_status, [])
        if new_status not in allowed:
            raise ValidationException(
                f"Cannot transition from {old_status} to {new_status}. "
                f"Allowed transitions: {allowed}"
            )
