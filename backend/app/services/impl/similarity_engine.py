"""
CiviSense AI — Complaint Similarity & Incident Clustering

Groups related complaints into "Incidents" using TF-IDF cosine similarity.

Flow:
  1. When a new complaint is analyzed, compute similarity with recent complaints.
  2. If similarity > threshold, link to existing incident or create cluster.
  3. Incidents track geographic hotspots and complaint patterns.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
from sklearn.metrics.pairwise import cosine_similarity  # type: ignore

from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.models.complaint import Complaint  # type: ignore
from app.models.incident import Incident  # type: ignore
from app.models.complaint_similarity import ComplaintSimilarity  # type: ignore
from app.core.constants import IncidentStatus  # type: ignore


# ─── Configuration ─────────────────────────────────────────────

SIMILARITY_THRESHOLD = 0.20
INCIDENT_THRESHOLD = 0.30
MIN_CLUSTER_SIZE = 2
LOOKBACK_DAYS = 30


class SimilarityEngine:
    """Computes text similarity and clusters complaints into incidents."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_similar(
        self,
        complaint_id: uuid.UUID,
        top_n: int = 5,
    ) -> List[Dict[str, Any]]:
        """Find complaints similar to the given complaint."""
        target_result = await self.db.execute(
            select(Complaint).where(Complaint.id == complaint_id)
        )
        target = target_result.scalar_one_or_none()
        if not target:
            return []

        target_text = f"{target.title}. {target.description}"

        # Load recent complaints (exclude target)
        cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
        candidates_result = await self.db.execute(
            select(Complaint)
            .where(
                Complaint.id != complaint_id,
                Complaint.created_at >= cutoff,
            )
            .order_by(Complaint.created_at.desc())
            .limit(200)
        )
        candidates = candidates_result.scalars().all()

        if not candidates:
            return []

        # Build corpus and compute similarity
        texts = [target_text] + [
            f"{c.title}. {c.description}" for c in candidates
        ]

        vectorizer = TfidfVectorizer(
            max_features=3000, ngram_range=(1, 2), stop_words="english"
        )
        tfidf_matrix = vectorizer.fit_transform(texts)
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

        # Rank and filter
        ranked = sorted(
            zip(candidates, similarities),
            key=lambda x: x[1],
            reverse=True,
        )

        results: List[Dict[str, Any]] = []
        for candidate, sim_score in ranked[:top_n]:
            if sim_score < SIMILARITY_THRESHOLD:
                break

            # Store similarity in DB
            existing = await self.db.execute(
                select(ComplaintSimilarity).where(
                    ComplaintSimilarity.complaint_id == complaint_id,
                    ComplaintSimilarity.similar_complaint_id == candidate.id,
                )
            )
            if not existing.scalar_one_or_none():
                record = ComplaintSimilarity(
                    id=uuid.uuid4(),
                    complaint_id=complaint_id,
                    similar_complaint_id=candidate.id,
                    similarity_score=round(float(sim_score), 4),
                    is_duplicate=sim_score >= 0.85,
                )
                self.db.add(record)

            results.append({
                "complaint_id": str(candidate.id),
                "complaint_number": candidate.complaint_number,
                "title": candidate.title,
                "similarity_score": round(float(sim_score), 4),
                "status": candidate.status,
            })

        await self.db.commit()
        return results

    async def cluster_into_incidents(self) -> List[Dict[str, Any]]:
        """
        Cluster recent similar complaints into incidents.
        Groups by category, computes pairwise similarity, greedy clusters.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)

        result = await self.db.execute(
            select(Complaint)
            .where(
                Complaint.created_at >= cutoff,
                Complaint.status.notin_(["RESOLVED", "CLOSED", "REJECTED"]),
            )
            .order_by(Complaint.created_at.desc())
            .limit(500)
        )
        complaints = result.scalars().all()

        if len(complaints) < MIN_CLUSTER_SIZE:
            return []

        # Group by category_id
        by_category: Dict[str, List[Complaint]] = {}
        for c in complaints:
            key = str(c.category_id) if c.category_id else "other"
            by_category.setdefault(key, []).append(c)

        created_incidents: List[Dict[str, Any]] = []

        for cat_key, cat_complaints in by_category.items():
            if len(cat_complaints) < MIN_CLUSTER_SIZE:
                continue

            texts = [f"{c.title}. {c.description}" for c in cat_complaints]
            vectorizer = TfidfVectorizer(
                max_features=2000, ngram_range=(1, 2), stop_words="english"
            )
            tfidf_matrix = vectorizer.fit_transform(texts)
            sim_matrix = cosine_similarity(tfidf_matrix)

            # Greedy clustering
            visited: set = set()
            for i in range(len(cat_complaints)):
                if i in visited:
                    continue

                cluster = [i]
                visited.add(i)

                for j in range(i + 1, len(cat_complaints)):
                    if j in visited:
                        continue
                    if sim_matrix[i][j] >= INCIDENT_THRESHOLD:
                        cluster.append(j)
                        visited.add(j)

                if len(cluster) >= MIN_CLUSTER_SIZE:
                    cluster_complaints = [cat_complaints[idx] for idx in cluster]
                    incident_info = await self._create_or_update_incident(
                        cluster_complaints
                    )
                    if incident_info:
                        created_incidents.append(incident_info)

        await self.db.commit()
        return created_incidents

    async def _create_or_update_incident(
        self, complaints: List[Complaint]
    ) -> Optional[Dict[str, Any]]:
        """Create or update an incident from a cluster."""
        if not complaints:
            return None

        # Check if any complaint already belongs to an incident
        existing_incident_id = None
        for c in complaints:
            if c.incident_id:
                existing_incident_id = c.incident_id
                break

        incident: Any = None

        if existing_incident_id:
            inc_result = await self.db.execute(
                select(Incident).where(Incident.id == existing_incident_id)
            )
            incident = inc_result.scalar_one_or_none()
            if incident:
                incident.complaint_count = len(complaints)
                incident.updated_at = datetime.now(timezone.utc)
        
        if not incident:
            # Average coordinates
            lats = [c.latitude for c in complaints if c.latitude]
            lngs = [c.longitude for c in complaints if c.longitude]

            # Get category name from first complaint
            cat_name = None
            if complaints[0].category:
                cat_name = complaints[0].category.name

            incident = Incident(
                id=uuid.uuid4(),
                title=f"Cluster: {complaints[0].title[:100]}",
                category=cat_name,
                description=f"Incident cluster of {len(complaints)} related complaints",
                latitude=sum(lats) / len(lats) if lats else None,
                longitude=sum(lngs) / len(lngs) if lngs else None,
                complaint_count=len(complaints),
                status=IncidentStatus.ACTIVE.value,
            )
            self.db.add(incident)

            # Link complaints to incident
            for c in complaints:
                c.incident_id = incident.id

        return {
            "incident_id": str(incident.id),
            "title": incident.title,
            "complaint_count": len(complaints),
            "complaints": [c.complaint_number for c in complaints],
        }
