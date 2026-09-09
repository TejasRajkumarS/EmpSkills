from pydantic import BaseModel
from typing import List, Literal
from enum import Enum


class GapSeverity(str, Enum):
    NO_GAP = "No Gap"
    MINOR = "Minor Gap"
    MODERATE = "Moderate Gap"
    MAJOR = "Major Gap"


class MatchStatus(str, Enum):
    MATCHED = "Matched"
    PARTIAL = "Partial"
    MISSING = "Missing"


class SkillGap(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    current_proficiency: int
    required_proficiency: int
    importance_weight: float
    gap: int
    severity: GapSeverity
    status: MatchStatus


class RoleMatch(BaseModel):
    target_role_id: str
    target_role: str
    match_percentage: float
    matched_skills: int
    partial_skills: int
    missing_skills: int
    total_required_skills: int


class ReadinessCategory(str, Enum):
    READY = "Ready"
    NEAR_READY = "Near Ready"
    DEVELOPING = "Developing"
    NEEDS_SIGNIFICANT_DEVELOPMENT = "Needs Significant Development"


class ReadinessResult(BaseModel):
    employee_id: str
    target_role_id: str
    target_role: str
    readiness_score: float
    category: ReadinessCategory
    explanation: str
    skill_gaps: List[SkillGap]
    role_match: RoleMatch