from pydantic import BaseModel
from typing import List


class RoleSkillRequirement(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    required_proficiency: int
    importance_weight: float


class Role(BaseModel):
    target_role_id: str
    target_role: str
    required_skills: List[RoleSkillRequirement] = []