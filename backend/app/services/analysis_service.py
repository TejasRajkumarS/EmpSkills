from typing import List, Dict
from app.services.data_service import data_service
from app.models import (
    SkillGap,
    RoleMatch,
    ReadinessResult,
    GapSeverity,
    MatchStatus,
    ReadinessCategory,
    RoleSkillRequirement,
    EmployeeSkill,
)
from app.config import settings


class GapAnalysisService:
    def analyze_gaps(
        self,
        employee_skills: Dict[str, EmployeeSkill],
        role_requirements: List[RoleSkillRequirement]
    ) -> List[SkillGap]:
        gaps = []
        for req in role_requirements:
            emp_skill = employee_skills.get(req.skill_id)
            current_prof = emp_skill.proficiency if emp_skill else 0
            gap = max(req.required_proficiency - current_prof, 0)

            severity = self._classify_severity(gap)
            status = self._classify_status(current_prof, req.required_proficiency)

            gaps.append(SkillGap(
                skill_id=req.skill_id,
                skill_name=req.skill_name,
                category=req.category,
                current_proficiency=current_prof,
                required_proficiency=req.required_proficiency,
                importance_weight=req.importance_weight,
                gap=gap,
                severity=severity,
                status=status
            ))
        return gaps

    def _classify_severity(self, gap: int) -> GapSeverity:
        thresholds = settings.GAP_THRESHOLDS
        if gap <= thresholds["no_gap"]:
            return GapSeverity.NO_GAP
        elif gap <= thresholds["minor"]:
            return GapSeverity.MINOR
        elif gap <= thresholds["moderate"]:
            return GapSeverity.MODERATE
        else:
            return GapSeverity.MAJOR

    def _classify_status(self, current: int, required: int) -> MatchStatus:
        if current >= required:
            return MatchStatus.MATCHED
        elif current > 0:
            return MatchStatus.PARTIAL
        else:
            return MatchStatus.MISSING


class RoleMatchingService:
    def calculate_match(
        self,
        employee_skills: Dict[str, EmployeeSkill],
        role_requirements: List[RoleSkillRequirement]
    ) -> RoleMatch:
        matched = 0
        partial = 0
        missing = 0

        for req in role_requirements:
            emp_skill = employee_skills.get(req.skill_id)
            current_prof = emp_skill.proficiency if emp_skill else 0

            if current_prof >= req.required_proficiency:
                matched += 1
            elif current_prof > 0:
                partial += 1
            else:
                missing += 1

        total = len(role_requirements)
        match_percentage = (matched / total * 100) if total > 0 else 0

        return RoleMatch(
            target_role_id="",
            target_role="",
            match_percentage=round(match_percentage, 1),
            matched_skills=matched,
            partial_skills=partial,
            missing_skills=missing,
            total_required_skills=total
        )


class ReadinessService:
    def calculate_readiness(
        self,
        employee_skills: Dict[str, EmployeeSkill],
        role_requirements: List[RoleSkillRequirement],
        skill_gaps: List[SkillGap]
    ) -> ReadinessResult:
        numerator = 0.0
        denominator = 0.0

        for req in role_requirements:
            emp_skill = employee_skills.get(req.skill_id)
            current_prof = emp_skill.proficiency if emp_skill else 0
            numerator += min(current_prof, req.required_proficiency) * req.importance_weight
            denominator += req.required_proficiency * req.importance_weight

        readiness_score = (numerator / denominator * 100) if denominator > 0 else 0
        category = self._categorize_readiness(readiness_score)
        explanation = self._generate_explanation(readiness_score, category, skill_gaps, role_requirements)

        return ReadinessResult(
            employee_id="",
            target_role_id="",
            target_role="",
            readiness_score=round(readiness_score, 1),
            category=category,
            explanation=explanation,
            skill_gaps=skill_gaps,
            role_match=RoleMatch(
                target_role_id="",
                target_role="",
                match_percentage=0,
                matched_skills=0,
                partial_skills=0,
                missing_skills=0,
                total_required_skills=0
            )
        )

    def _categorize_readiness(self, score: float) -> ReadinessCategory:
        thresholds = settings.READINESS_THRESHOLDS
        if score >= thresholds["ready"]:
            return ReadinessCategory.READY
        elif score >= thresholds["near_ready"]:
            return ReadinessCategory.NEAR_READY
        elif score >= thresholds["developing"]:
            return ReadinessCategory.DEVELOPING
        else:
            return ReadinessCategory.NEEDS_SIGNIFICANT_DEVELOPMENT

    def _generate_explanation(
        self,
        score: float,
        category: ReadinessCategory,
        skill_gaps: List[SkillGap],
        role_requirements: List[RoleSkillRequirement]
    ) -> str:
        major_gaps = [g for g in skill_gaps if g.severity == GapSeverity.MAJOR]
        moderate_gaps = [g for g in skill_gaps if g.severity == GapSeverity.MODERATE]
        minor_gaps = [g for g in skill_gaps if g.severity == GapSeverity.MINOR]

        matched_count = sum(1 for g in skill_gaps if g.status == MatchStatus.MATCHED)

        if category == ReadinessCategory.READY:
            base = f"The employee is Ready for the selected role with a readiness score of {score:.1f}%."
            if matched_count == len(role_requirements):
                return base + " They meet all required skill proficiencies."
            return base + f" They meet {matched_count} of {len(role_requirements)} required skills."

        elif category == ReadinessCategory.NEAR_READY:
            base = f"The employee is Near Ready for the selected role with a readiness score of {score:.1f}%."
            if major_gaps:
                gap_names = ", ".join([g.skill_name for g in major_gaps[:3]])
                return base + f" They have significant gaps in {gap_names}."
            elif moderate_gaps:
                gap_names = ", ".join([g.skill_name for g in moderate_gaps[:3]])
                return base + f" They have moderate gaps in {gap_names}."
            return base + " They meet most high-priority requirements."

        elif category == ReadinessCategory.DEVELOPING:
            base = f"The employee is Developing for the selected role with a readiness score of {score:.1f}%."
            all_gaps = major_gaps + moderate_gaps
            if all_gaps:
                gap_names = ", ".join([g.skill_name for g in all_gaps[:4]])
                return base + f" Key gaps include {gap_names}."
            return base + " Multiple skill areas need development."

        else:
            base = f"The employee Needs Significant Development for the selected role with a readiness score of {score:.1f}%."
            if major_gaps:
                gap_names = ", ".join([g.skill_name for g in major_gaps[:4]])
                return base + f" Major gaps exist in {gap_names}."
            return base + " Most required skills are missing or below required proficiency."


gap_analysis_service = GapAnalysisService()
role_matching_service = RoleMatchingService()
readiness_service = ReadinessService()