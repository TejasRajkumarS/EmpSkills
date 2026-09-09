from pydantic import BaseModel
from typing import List, Optional
from app.models import (
    Employee,
    Skill,
    Role,
    LearningResource,
    SkillGap,
    RoleMatch,
    ReadinessResult,
    Recommendation,
    LearningPath,
    DashboardMetrics,
    OrganizationAnalytics,
)


class AnalysisRequest(BaseModel):
    employee_id: str
    target_role_id: str


class AnalysisResponse(BaseModel):
    employee_id: str
    employee_name: str
    current_role: str
    target_role_id: str
    target_role: str
    readiness: ReadinessResult
    recommendations: List[Recommendation]
    learning_path: LearningPath


class LearningPathRequest(BaseModel):
    employee_id: str
    target_role_id: str


class RecommendationRequest(BaseModel):
    employee_id: str
    target_role_id: str