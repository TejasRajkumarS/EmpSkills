from pydantic import BaseModel
from typing import List


class Recommendation(BaseModel):
    resource_id: str
    resource_title: str
    resource_type: str
    difficulty: str
    duration_hours: float
    skills_addressed: List[str]
    score: float
    reason: str
    prerequisites: List[str] = []