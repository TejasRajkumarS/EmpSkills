from pydantic import BaseModel
from typing import List, Optional


class EmployeeSkill(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    proficiency: int
    source: str


class Employee(BaseModel):
    employee_id: str
    employee_name: str
    current_role: str
    profile_text: str
    skills: List[EmployeeSkill] = []

    @property
    def average_proficiency(self) -> float:
        if not self.skills:
            return 0.0
        return sum(s.proficiency for s in self.skills) / len(self.skills)

    @property
    def skill_count(self) -> int:
        return len(self.skills)