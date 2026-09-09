"""Persistent learning progress store.

Tracks completed learning resources per employee. When a resource is completed,
the employee's proficiency in the skills that resource addresses increases and
all downstream analysis (gap analysis, readiness, reports) reflects the gain.

Storage: JSON file at ``backend/data/learning_progress.json`` so data survives
server restarts without needing a database. When the Supabase connection is
fixed, this store can be swapped for a table without touching callers.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from app.config import settings


class LearningProgressService:
    """Singleton store of completed resources per employee."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._store: Dict[str, Dict] = {}
            cls._instance._loaded = False
        return cls._instance

    def __init__(self):
        self.storage_path = Path(__file__).parent.parent / "data" / "learning_progress.json"

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            if self.storage_path.exists():
                try:
                    self._store = json.loads(self.storage_path.read_text(encoding="utf-8"))
                except (json.JSONDecodeError, OSError):
                    self._store = {}
            self._loaded = True

    def _persist(self) -> None:
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.storage_path.write_text(
            json.dumps(self._store, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def get_completed(self, employee_id: str) -> List[Dict]:
        self._ensure_loaded()
        record = self._store.get(employee_id, {})
        return list(record.get("completed", []))

    def is_completed(self, employee_id: str, resource_id: str) -> bool:
        return any(c["resource_id"] == resource_id for c in self.get_completed(employee_id))

    def mark_complete(
        self,
        employee_id: str,
        resource_id: str,
        resource_title: str,
        skill_gains: Dict[str, int],
        duration_hours: float,
    ) -> Dict:
        """Record a completion. Returns (record, created) where created is False
        if the resource was already completed."""

        self._ensure_loaded()

        record = self._store.setdefault(employee_id, {"completed": []})
        completed = record.setdefault("completed", [])

        existing = next((c for c in completed if c["resource_id"] == resource_id), None)
        if existing:
            return existing, False

        entry = {
            "resource_id": resource_id,
            "resource_title": resource_title,
            "skill_gains": skill_gains,
            "duration_hours": duration_hours,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
        completed.append(entry)
        self._persist()
        return entry, True

    def reset(self, employee_id: Optional[str] = None) -> None:
        self._ensure_loaded()
        if employee_id is None:
            self._store = {}
        else:
            self._store.pop(employee_id, None)
        self._persist()


learning_progress_service = LearningProgressService()
