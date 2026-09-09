"""Skill-audit assignments: HR/L&D assigns an audit to a specific employee.

Storage: JSON file at ``app/data/skill_assignments.json`` (same pattern as the
learning-progress store) so data survives restarts. Swap for a Supabase table
later without touching callers.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional


class AssignmentService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._store: Dict[str, List[Dict]] = {}
            cls._instance._loaded = False
        return cls._instance

    def __init__(self):
        self.storage_path = Path(__file__).parent / "data" / "skill_assignments.json"

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

    def create(
        self,
        employee_id: str,
        skill_id: str,
        skill_name: str,
        target_role_id: str,
        target_role: str,
        assigned_by: str,
        note: str = "",
    ) -> Dict:
        self._ensure_loaded()
        assignment = {
            "assignment_id": uuid.uuid4().hex[:12],
            "employee_id": employee_id,
            "skill_id": skill_id,
            "skill_name": skill_name,
            "target_role_id": target_role_id,
            "target_role": target_role,
            "assigned_by": assigned_by,
            "note": note,
            "status": "pending",  # pending | completed
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
        }
        self._store.setdefault(employee_id, []).append(assignment)
        self._persist()
        return assignment

    def get_for_employee(self, employee_id: str) -> List[Dict]:
        self._ensure_loaded()
        return list(self._store.get(employee_id, []))

    def get_all(self) -> List[Dict]:
        self._ensure_loaded()
        return [a for assignments in self._store.values() for a in assignments]

    def complete(self, employee_id: str, assignment_id: str, skill_gains: Optional[Dict[str, int]] = None) -> Optional[Dict]:
        self._ensure_loaded()
        for a in self._store.get(employee_id, []):
            if a["assignment_id"] == assignment_id:
                if skill_gains is not None:
                    a["skill_gains"] = skill_gains
                a["status"] = "completed"
                a["completed_at"] = datetime.now(timezone.utc).isoformat()
                self._persist()
                return a
        return None


assignment_service = AssignmentService()
