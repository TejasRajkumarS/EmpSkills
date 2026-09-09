from pydantic import BaseModel
from typing import List, Dict


class DashboardMetrics(BaseModel):
    total_employees: int
    total_roles: int
    total_skills: int
    total_resources: int
    average_readiness: float
    employees_needing_development: int


class GapDistribution(BaseModel):
    no_gap: int
    minor: int
    moderate: int
    major: int


class ReadinessDistribution(BaseModel):
    ready: int
    near_ready: int
    developing: int
    needs_significant_development: int


class TopSkillGap(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    total_gap: int
    affected_employees: int
    avg_importance: float


class RoleReadiness(BaseModel):
    target_role_id: str
    target_role: str
    avg_readiness: float
    employee_count: int


class TrainingPriority(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    total_gap: int
    affected_employees: int
    avg_importance: float
    priority_score: float


class OrganizationAnalytics(BaseModel):
    employees_analyzed: int
    average_readiness: float
    gap_distribution: GapDistribution
    readiness_distribution: ReadinessDistribution
    top_skill_gaps: List[TopSkillGap]
    role_readiness: List[RoleReadiness]
    training_priorities: List[TrainingPriority]