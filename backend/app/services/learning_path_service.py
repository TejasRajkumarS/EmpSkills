from typing import List, Dict, Set, Deque
from collections import deque
from app.services.data_service import data_service
from app.services.recommendation_service import recommendation_service
from app.models import (
    LearningPath,
    LearningPathStep,
    Recommendation,
    SkillGap,
    EmployeeSkill,
    RoleSkillRequirement,
)


class LearningPathService:
    def generate_learning_path(
        self,
        employee_id: str,
        target_role_id: str,
        recommendations: List[Recommendation],
        skill_gaps: List[SkillGap],
        employee_skills: Dict[str, EmployeeSkill],
        role_requirements: List[RoleSkillRequirement]
    ) -> LearningPath:
        prerequisites = data_service.get_all_prerequisites()
        resource_skill_map = data_service.get_resource_skill_map()

        gap_skills = {g.skill_id for g in skill_gaps if g.gap > 0}
        role_skills = {r.skill_id for r in role_requirements}

        relevant_recs = [
            r for r in recommendations
            if any(s in gap_skills or s in role_skills for s in r.skills_addressed)
        ]

        ordered_recs = self._topological_sort(relevant_recs, prerequisites)

        steps = []
        step_number = 1
        covered_skills: Set[str] = set()

        for rec in ordered_recs:
            new_skills = [s for s in rec.skills_addressed if s not in covered_skills]
            if not new_skills and not any(s in gap_skills for s in rec.skills_addressed):
                continue

            primary_skill = new_skills[0] if new_skills else rec.skills_addressed[0]
            gap = next((g for g in skill_gaps if g.skill_id == primary_skill), None)
            req = next((r for r in role_requirements if r.skill_id == primary_skill), None)

            current_prof = 0
            if primary_skill in employee_skills:
                current_prof = employee_skills[primary_skill].proficiency

            target_prof = req.required_proficiency if req else (gap.required_proficiency if gap else 0)

            steps.append(LearningPathStep(
                step_number=step_number,
                resource_id=rec.resource_id,
                resource_title=rec.resource_title,
                resource_type=rec.resource_type,
                difficulty=rec.difficulty,
                duration_hours=rec.duration_hours,
                skills_addressed=rec.skills_addressed,
                current_proficiency=current_prof,
                target_proficiency=target_prof,
                reason=rec.reason,
                prerequisites=rec.prerequisites
            ))

            for s in rec.skills_addressed:
                covered_skills.add(s)
            step_number += 1

        total_duration = sum(s.duration_hours for s in steps)

        role = data_service.get_role(target_role_id)

        return LearningPath(
            employee_id=employee_id,
            target_role_id=target_role_id,
            target_role=role.target_role if role else "",
            steps=steps,
            total_duration_hours=round(total_duration, 1),
            total_steps=len(steps)
        )

    def _topological_sort(
        self,
        recommendations: List[Recommendation],
        prerequisites: Dict[str, List[str]]
    ) -> List[Recommendation]:
        rec_map = {r.resource_id: r for r in recommendations}
        rec_ids = set(rec_map.keys())

        in_degree = {rid: 0 for rid in rec_ids}
        adj_list = {rid: [] for rid in rec_ids}

        for rec in recommendations:
            for prereq in rec.prerequisites:
                if prereq in rec_ids:
                    adj_list[prereq].append(rec.resource_id)
                    in_degree[rec.resource_id] += 1

        queue: Deque[str] = deque([rid for rid in rec_ids if in_degree[rid] == 0])
        result = []

        while queue:
            current = queue.popleft()
            result.append(rec_map[current])

            for neighbor in adj_list[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(rec_ids):
            remaining = [rid for rid in rec_ids if rid not in [r.resource_id for r in result]]
            for rid in remaining:
                result.append(rec_map[rid])

        return result

    def validate_prerequisites(self) -> List[str]:
        prerequisites = data_service.get_all_prerequisites()
        all_resource_ids = set(prerequisites.keys())

        errors = []
        for resource_id, prereqs in prerequisites.items():
            for prereq in prereqs:
                if prereq not in all_resource_ids:
                    errors.append(f"Resource {resource_id} references non-existent prerequisite {prereq}")

        if self._has_cycles(prerequisites, all_resource_ids):
            errors.append("Circular dependency detected in prerequisites")

        return errors

    def _has_cycles(self, prerequisites: Dict[str, List[str]], all_ids: Set[str]) -> bool:
        visited = set()
        rec_stack = set()

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)

            for neighbor in prerequisites.get(node, []):
                if neighbor not in all_ids:
                    continue
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        for node in all_ids:
            if node not in visited:
                if dfs(node):
                    return True

        return False


learning_path_service = LearningPathService()