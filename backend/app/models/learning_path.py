from pydantic import BaseModel
from typing import List


class LearningPathStep(BaseModel):
    step_number: int
    resource_id: str
    resource_title: str
    resource_type: str
    difficulty: str
    duration_hours: float
    skills_addressed: List[str]
    current_proficiency: int
    target_proficiency: int
    reason: str
    prerequisites: List[str] = []


class LearningPath(BaseModel):
    employee_id: str
    target_role_id: str
    target_role: str
    steps: List[LearningPathStep]
    total_duration_hours: float
    total_steps: int