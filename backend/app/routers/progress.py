from fastapi import APIRouter, HTTPException
from typing import Dict, List

from app.config import settings
from app.services.data_service import data_service
from app.services.learning_progress_service import learning_progress_service
from app.services.learning_path_service import learning_path_service
from app.services.recommendation_service import recommendation_service
from app.services.analysis_service import gap_analysis_service

router = APIRouter()


def _compute_skill_gains(resource, current_skills: Dict[str, int], target_role_id: str) -> Dict[str, int]:
    """How many proficiency points each addressed skill gains from completing
    this resource, capped so a skill never exceeds its role target level."""
    gains: Dict[str, int] = {}
    targets = {}
    if target_role_id:
        for req in data_service.get_role_requirements(target_role_id):
            targets[req.skill_id] = req.required_proficiency

    for skill_id in resource.resource_skill_ids:
        current = current_skills.get(skill_id, 0)  # 0 = skill not yet tracked → learnable from scratch
        cap = min(5, targets.get(skill_id, 5))
        gain = max(1, min(2, cap - current))  # +1 or +2 points per resource, never past the target
        if gain <= 0 or current >= cap:
            continue  # already at/above target — course teaches nothing new
        gains[skill_id] = gain
    return gains


@router.post("/progress/{employee_id}/complete-all")
async def complete_all(employee_id: str, target_role_id: str = ""):
    """Mark every learning-path step for this role as completed in one call."""
    employee = data_service.get_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    role = data_service.get_role(target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {target_role_id} not found")

    employee_skills = {s.skill_id: s for s in employee.skills}
    role_requirements = data_service.get_role_requirements(target_role_id)
    skill_gaps = gap_analysis_service.analyze_gaps(employee_skills, role_requirements)
    recommendations = recommendation_service.generate_recommendations(
        employee_id, target_role_id, skill_gaps, employee_skills, role_requirements
    )
    path_steps = learning_path_service.generate_learning_path(
        employee_id,
        target_role_id,
        recommendations,
        skill_gaps,
        employee_skills,
        role_requirements,
    )

    completed = 0
    already = 0
    for step in path_steps.steps:
        resource = data_service.get_resource(step.resource_id)
        if resource is None:
            continue
        if learning_progress_service.is_completed(employee_id, step.resource_id):
            already += 1
            continue
        current_skills = {s.skill_id: s.proficiency for s in data_service.get_employee_skills(employee_id)}
        skill_gains = _compute_skill_gains(resource, current_skills, target_role_id)
        learning_progress_service.mark_complete(
            employee_id=employee_id,
            resource_id=step.resource_id,
            resource_title=resource.resource_title,
            skill_gains=skill_gains,
            duration_hours=resource.duration_hours,
        )
        if skill_gains:
            data_service.apply_completion(employee_id, skill_gains)
        completed += 1

    return {
        "message": f"Marked {completed} course(s) as completed" + (f" ({already} already done)" if already else ""),
        "newly_completed": completed,
        "already_completed": already,
        "completed_count": len(learning_progress_service.get_completed(employee_id)),
    }


@router.get("/progress/{employee_id}")
async def get_progress(employee_id: str):
    employee = data_service.get_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    completed = learning_progress_service.get_completed(employee_id)
    total_hours = sum(c.get("duration_hours", 0) for c in completed)
    skills_improved = set()
    for c in completed:
        skills_improved.update(c.get("skill_gains", {}).keys())

    return {
        "employee_id": employee_id,
        "completed_resources": completed,
        "completed_count": len(completed),
        "total_learning_hours": total_hours,
        "skills_improved": sorted(skills_improved),
    }


@router.post("/progress/{employee_id}/complete/{resource_id}")
async def complete_resource(employee_id: str, resource_id: str, target_role_id: str = ""):
    employee = data_service.get_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    resource = data_service.get_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")

    if learning_progress_service.is_completed(employee_id, resource_id):
        return {
            "already_completed": True,
            "message": "Resource already completed",
            "updated_skills": {},
        }

    # Current proficiency map for this employee
    current_skills = {s.skill_id: s.proficiency for s in employee.skills}

    skill_gains = _compute_skill_gains(resource, current_skills, target_role_id)

    # Record completion FIRST, then apply gains. Zero-gain completions are
    # still recorded: the employee may finish a course whose skills are
    # already at the required level, and that must succeed, not 400.
    learning_progress_service.mark_complete(
        employee_id=employee_id,
        resource_id=resource_id,
        resource_title=resource.resource_title,
        skill_gains=skill_gains,
        duration_hours=resource.duration_hours,
    )

    if skill_gains:
        updated = data_service.apply_completion(employee_id, skill_gains)
        message = f"Completed '{resource.resource_title}' — proficiency improved in {len(updated)} skill(s)"
    else:
        updated = {}
        message = f"Completed '{resource.resource_title}' — skills already at the required level for this role"

    return {
        "already_completed": False,
        "message": message,
        "skill_gains": skill_gains,
        "updated_skills": updated,
        "completed_count": len(learning_progress_service.get_completed(employee_id)),
    }
