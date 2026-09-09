from typing import List, Dict, Set
from app.services.data_service import data_service
from app.services.analysis_service import gap_analysis_service, role_matching_service, readiness_service
from app.models import (
    Recommendation,
    SkillGap,
    EmployeeSkill,
    RoleSkillRequirement,
    LearningResource,
)
from app.config import settings


class RecommendationService:
    def generate_recommendations(
        self,
        employee_id: str,
        target_role_id: str,
        skill_gaps: List[SkillGap],
        employee_skills: Dict[str, EmployeeSkill],
        role_requirements: List[RoleSkillRequirement]
    ) -> List[Recommendation]:
        resources = data_service.get_resources()
        resource_skill_map = data_service.get_resource_skill_map()
        all_prerequisites = data_service.get_all_prerequisites()

        role_req_map = {r.skill_id: r for r in role_requirements}
        gap_map = {g.skill_id: g for g in skill_gaps}

        scored_resources = []

        for resource in resources:
            res_skills = resource_skill_map.get(resource.resource_id, [])
            if not res_skills:
                continue

            relevance = self._calculate_relevance(res_skills, gap_map, role_req_map)
            if relevance == 0:
                continue

            gap_priority = self._calculate_gap_priority(res_skills, gap_map)
            role_importance = self._calculate_role_importance(res_skills, role_req_map)
            difficulty_fit = self._calculate_difficulty_fit(resource, employee_skills, res_skills)
            learning_efficiency = self._calculate_learning_efficiency(resource, res_skills, gap_map)

            weights = settings.RECOMMENDATION_WEIGHTS
            score = (
                weights["gap_priority"] * gap_priority +
                weights["role_importance"] * role_importance +
                weights["resource_relevance"] * relevance +
                weights["difficulty_fit"] * difficulty_fit +
                weights["learning_efficiency"] * learning_efficiency
            )

            reason = self._generate_reason(
                resource, res_skills, gap_map, role_req_map,
                employee_skills, gap_priority, role_importance
            )

            prerequisites = all_prerequisites.get(resource.resource_id, [])

            scored_resources.append(Recommendation(
                resource_id=resource.resource_id,
                resource_title=resource.resource_title,
                resource_type=resource.resource_type,
                difficulty=resource.difficulty,
                duration_hours=resource.duration_hours,
                skills_addressed=res_skills,
                score=round(score, 3),
                reason=reason,
                prerequisites=prerequisites
            ))

        scored_resources.sort(key=lambda x: x.score, reverse=True)
        return scored_resources

    def _calculate_relevance(
        self,
        res_skills: List[str],
        gap_map: Dict[str, SkillGap],
        role_req_map: Dict[str, RoleSkillRequirement]
    ) -> float:
        relevant = 0
        total = len(res_skills)
        if total == 0:
            return 0.0

        for skill_id in res_skills:
            if skill_id in gap_map and gap_map[skill_id].gap > 0:
                relevant += 1
            elif skill_id in role_req_map:
                relevant += 0.5

        return relevant / total

    def _calculate_gap_priority(
        self,
        res_skills: List[str],
        gap_map: Dict[str, SkillGap]
    ) -> float:
        if not res_skills:
            return 0.0

        total_priority = 0.0
        for skill_id in res_skills:
            if skill_id in gap_map:
                gap = gap_map[skill_id]
                total_priority += gap.gap * gap.importance_weight

        max_possible = len(res_skills) * 5 * 5
        return min(total_priority / max_possible if max_possible > 0 else 0, 1.0)

    def _calculate_role_importance(
        self,
        res_skills: List[str],
        role_req_map: Dict[str, RoleSkillRequirement]
    ) -> float:
        if not res_skills:
            return 0.0

        total_importance = 0.0
        count = 0
        for skill_id in res_skills:
            if skill_id in role_req_map:
                total_importance += role_req_map[skill_id].importance_weight
                count += 1

        if count == 0:
            return 0.0

        avg_importance = total_importance / count
        return min(avg_importance / 5.0, 1.0)

    def _calculate_difficulty_fit(
        self,
        resource: LearningResource,
        employee_skills: Dict[str, EmployeeSkill],
        res_skills: List[str]
    ) -> float:
        if not res_skills:
            return 0.5

        avg_prof = 0.0
        count = 0
        for skill_id in res_skills:
            if skill_id in employee_skills:
                avg_prof += employee_skills[skill_id].proficiency
                count += 1

        if count == 0:
            avg_prof = 0

        difficulty_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
        resource_diff = difficulty_map.get(resource.difficulty, 2)

        if avg_prof >= 4:
            ideal_diff = 3
        elif avg_prof >= 2:
            ideal_diff = 2
        else:
            ideal_diff = 1

        diff = abs(resource_diff - ideal_diff)
        return max(1.0 - diff * 0.3, 0.2)

    def _calculate_learning_efficiency(
        self,
        resource: LearningResource,
        res_skills: List[str],
        gap_map: Dict[str, SkillGap]
    ) -> float:
        gap_skills = sum(1 for s in res_skills if s in gap_map and gap_map[s].gap > 0)
        if gap_skills == 0:
            return 0.3

        skills_per_hour = gap_skills / resource.duration_hours if resource.duration_hours > 0 else 0
        return min(skills_per_hour * 2, 1.0)

    def _generate_reason(
        self,
        resource: LearningResource,
        res_skills: List[str],
        gap_map: Dict[str, SkillGap],
        role_req_map: Dict[str, RoleSkillRequirement],
        employee_skills: Dict[str, EmployeeSkill],
        gap_priority: float,
        role_importance: float
    ) -> str:
        parts = []

        gap_skills = [s for s in res_skills if s in gap_map and gap_map[s].gap > 0]
        if gap_skills:
            skill_details = []
            for skill_id in gap_skills[:2]:
                gap = gap_map[skill_id]
                emp_skill = employee_skills.get(skill_id)
                current = emp_skill.proficiency if emp_skill else 0
                skill_details.append(
                    f"{gap.skill_name} (current: {current}, required: {gap.required_proficiency}, gap: {gap.gap})"
                )
            parts.append(f"This resource addresses {', '.join(skill_details)}")

        role_skills = [s for s in res_skills if s in role_req_map]
        if role_skills and not gap_skills:
            skill_names = [role_req_map[s].skill_name for s in role_skills[:2]]
            parts.append(f"This resource covers {', '.join(skill_names)} which are required for the target role")

        if resource.difficulty == "Beginner":
            parts.append("Suitable for building foundational knowledge")
        elif resource.difficulty == "Intermediate":
            parts.append("Appropriate for advancing existing skills")
        elif resource.difficulty == "Advanced":
            parts.append("Designed for deepening expertise")

        return ". ".join(parts) + "."


recommendation_service = RecommendationService()