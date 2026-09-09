from pydantic import BaseModel
from typing import List


class LearningResource(BaseModel):
    resource_id: str
    resource_title: str
    resource_type: str
    difficulty: str
    duration_hours: float
    resource_skill_ids: List[str] = []
    prerequisite_resource_ids: List[str] = []