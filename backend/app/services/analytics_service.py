from typing import List, Dict
from collections import Counter
from app.services.data_service import data_service
from app.services.analysis_service import gap_analysis_service, role_matching_service, readiness_service
from app.services.recommendation_service import recommendation_service
from app.services.learning_path_service import learning_path_service
from app.models import (
    DashboardMetrics,
    OrganizationAnalytics,
    GapDistribution,
    ReadinessDistribution,
    TopSkillGap,
    RoleReadiness,
    TrainingPriority,
    Employee,
    SkillGap,
    RoleSkillRequirement,
    ReadinessCategory,
    GapSeverity,
)
from app.config import settings


class AnalyticsService:
    def get_dashboard_metrics(self) -> DashboardMetrics:
        employees = data_service.get_employees()
        roles = data_service.get_roles()
        skills = data_service.get_skills()
        resources = data_service.get_resources()

        total_readiness = 0.0
        employees_needing_dev = 0

        for emp in employees:
            role_requirements = data_service.get_role_requirements(emp.current_role)
            if not role_requirements:
                for role in roles:
                    role_requirements = data_service.get_role_requirements(role.target_role_id)
                    if role_requirements:
                        break

            if role_requirements:
                emp_skill_map = data_service.get_employee_skill_map(emp.employee_id)
                readiness_result = readiness_service.calculate_readiness(
                    emp_skill_map, role_requirements, []
                )
                total_readiness += readiness_result.readiness_score
                if readiness_result.category in [ReadinessCategory.DEVELOPING, ReadinessCategory.NEEDS_SIGNIFICANT_DEVELOPMENT]:
                    employees_needing_dev += 1

        avg_readiness = total_readiness / len(employees) if employees else 0

        return DashboardMetrics(
            total_employees=len(employees),
            total_roles=len(roles),
            total_skills=len(skills),
            total_resources=len(resources),
            average_readiness=round(avg_readiness, 1),
            employees_needing_development=employees_needing_dev
        )

    def get_organization_analytics(self) -> OrganizationAnalytics:
        employees = data_service.get_employees()
        roles = data_service.get_roles()

        all_skill_gaps: List[SkillGap] = []
        readiness_scores: List[float] = []
        role_readiness_map: Dict[str, List[float]] = {}

        for emp in employees:
            for role in roles:
                role_reqs = data_service.get_role_requirements(role.target_role_id)
                if not role_reqs:
                    continue

                emp_skill_map = data_service.get_employee_skill_map(emp.employee_id)
                gaps = gap_analysis_service.analyze_gaps(emp_skill_map, role_reqs)
                all_skill_gaps.extend(gaps)

                readiness = readiness_service.calculate_readiness(emp_skill_map, role_reqs, gaps)
                readiness_scores.append(readiness.readiness_score)

                if role.target_role_id not in role_readiness_map:
                    role_readiness_map[role.target_role_id] = []
                role_readiness_map[role.target_role_id].append(readiness.readiness_score)

        gap_distribution = self._calculate_gap_distribution(all_skill_gaps)
        readiness_distribution = self._calculate_readiness_distribution(readiness_scores)
        top_skill_gaps = self._calculate_top_skill_gaps(all_skill_gaps)
        role_readiness_list = self._calculate_role_readiness(role_readiness_map, roles)
        training_priorities = self._calculate_training_priorities(top_skill_gaps, all_skill_gaps)

        return OrganizationAnalytics(
            employees_analyzed=len(employees),
            average_readiness=round(sum(readiness_scores) / len(readiness_scores), 1) if readiness_scores else 0,
            gap_distribution=gap_distribution,
            readiness_distribution=readiness_distribution,
            top_skill_gaps=top_skill_gaps[:10],
            role_readiness=role_readiness_list,
            training_priorities=training_priorities[:10]
        )

    def _calculate_gap_distribution(self, skill_gaps: List[SkillGap]) -> GapDistribution:
        counts = Counter(g.severity for g in skill_gaps)
        return GapDistribution(
            no_gap=counts.get(GapSeverity.NO_GAP, 0),
            minor=counts.get(GapSeverity.MINOR, 0),
            moderate=counts.get(GapSeverity.MODERATE, 0),
            major=counts.get(GapSeverity.MAJOR, 0)
        )

    def _calculate_readiness_distribution(self, scores: List[float]) -> ReadinessDistribution:
        dist = Counter()
        for score in scores:
            if score >= settings.READINESS_THRESHOLDS["ready"]:
                dist[ReadinessCategory.READY] += 1
            elif score >= settings.READINESS_THRESHOLDS["near_ready"]:
                dist[ReadinessCategory.NEAR_READY] += 1
            elif score >= settings.READINESS_THRESHOLDS["developing"]:
                dist[ReadinessCategory.DEVELOPING] += 1
            else:
                dist[ReadinessCategory.NEEDS_SIGNIFICANT_DEVELOPMENT] += 1

        return ReadinessDistribution(
            ready=dist.get(ReadinessCategory.READY, 0),
            near_ready=dist.get(ReadinessCategory.NEAR_READY, 0),
            developing=dist.get(ReadinessCategory.DEVELOPING, 0),
            needs_significant_development=dist.get(ReadinessCategory.NEEDS_SIGNIFICANT_DEVELOPMENT, 0)
        )

    def _calculate_top_skill_gaps(self, skill_gaps: List[SkillGap]) -> List[TopSkillGap]:
        gap_map: Dict[str, Dict] = {}

        for gap in skill_gaps:
            if gap.gap <= 0:
                continue
            if gap.skill_id not in gap_map:
                gap_map[gap.skill_id] = {
                    "skill_name": gap.skill_name,
                    "category": gap.category,
                    "total_gap": 0,
                    "affected_employees": 0,
                    "importance_sum": 0.0,
                    "count": 0
                }
            gap_map[gap.skill_id]["total_gap"] += gap.gap
            gap_map[gap.skill_id]["affected_employees"] += 1
            gap_map[gap.skill_id]["importance_sum"] += gap.importance_weight
            gap_map[gap.skill_id]["count"] += 1

        results = []
        for skill_id, data in gap_map.items():
            results.append(TopSkillGap(
                skill_id=skill_id,
                skill_name=data["skill_name"],
                category=data["category"],
                total_gap=data["total_gap"],
                affected_employees=data["affected_employees"],
                avg_importance=round(data["importance_sum"] / data["count"], 2)
            ))

        results.sort(key=lambda x: (x.total_gap, x.affected_employees, x.avg_importance), reverse=True)
        return results

    def _calculate_role_readiness(
        self,
        role_readiness_map: Dict[str, List[float]],
        roles: List
    ) -> List[RoleReadiness]:
        results = []
        role_map = {r.target_role_id: r for r in roles}

        for role_id, scores in role_readiness_map.items():
            if not scores:
                continue
            role = role_map.get(role_id)
            results.append(RoleReadiness(
                target_role_id=role_id,
                target_role=role.target_role if role else role_id,
                avg_readiness=round(sum(scores) / len(scores), 1),
                employee_count=len(scores)
            ))

        results.sort(key=lambda x: x.avg_readiness)
        return results

    def _calculate_training_priorities(
        self,
        top_skill_gaps: List[TopSkillGap],
        all_skill_gaps: List[SkillGap]
    ) -> List[TrainingPriority]:
        results = []
        for gap in top_skill_gaps:
            priority_score = (
                gap.total_gap * 0.4 +
                gap.affected_employees * 10 * 0.3 +
                gap.avg_importance * 20 * 0.3
            )
            results.append(TrainingPriority(
                skill_id=gap.skill_id,
                skill_name=gap.skill_name,
                category=gap.category,
                total_gap=gap.total_gap,
                affected_employees=gap.affected_employees,
                avg_importance=gap.avg_importance,
                priority_score=round(priority_score, 1)
            ))

        results.sort(key=lambda x: x.priority_score, reverse=True)
        return results


analytics_service = AnalyticsService()