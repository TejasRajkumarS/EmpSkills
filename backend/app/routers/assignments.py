from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.services.data_service import data_service
from app.services.assignment_service import assignment_service

router = APIRouter()


class CreateAssignmentRequest(BaseModel):
    employee_id: str
    skill_id: str
    target_role_id: str
    assigned_by: str = "HR & L&D"
    note: str = ""


@router.post("/assignments")
async def create_assignment(request: CreateAssignmentRequest):
    employee = data_service.get_employee(request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {request.employee_id} not found")

    role = data_service.get_role(request.target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {request.target_role_id} not found")

    skill = data_service.get_skill(request.skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill {request.skill_id} not found")

    # Skill must actually be required by the role being staffed
    required_skill_ids = {r.skill_id for r in role.required_skills}
    if request.skill_id not in required_skill_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Skill {skill.skill_name} is not required for role {role.target_role}",
        )

    assignment = assignment_service.create(
        employee_id=request.employee_id,
        skill_id=request.skill_id,
        skill_name=skill.skill_name,
        target_role_id=request.target_role_id,
        target_role=role.target_role,
        assigned_by=request.assigned_by,
        note=request.note,
    )
    return assignment


@router.get("/assignments")
async def list_assignments(employee_id: Optional[str] = None):
    if employee_id:
        if not data_service.get_employee(employee_id):
            raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
        return assignment_service.get_for_employee(employee_id)
    return assignment_service.get_all()


@router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: str):
    for a in assignment_service.get_all():
        if a["assignment_id"] == assignment_id:
            return a
    raise HTTPException(status_code=404, detail=f"Assignment {assignment_id} not found")


@router.post("/assignments/{assignment_id}/complete")
async def complete_assignment(assignment_id: str, employee_id: str):
    """Mark an assigned audit complete: audited skill proficiency +1 (capped at
    the role requirement), recorded on the assignment, and applied to the
    employee's profile so 'My Skill Profile' reflects it."""
    assignment = next(
        (a for a in assignment_service.get_for_employee(employee_id) if a["assignment_id"] == assignment_id),
        None,
    )
    if not assignment:
        raise HTTPException(status_code=404, detail=f"Assignment {assignment_id} not found")

    if assignment["status"] == "completed":
        return assignment  # idempotent — no double gains

    skill_id = assignment["skill_id"]
    target_role_id = assignment.get("target_role_id", "")

    # Cap: never push past what the audited role requires
    cap = 5
    for req in data_service.get_role_requirements(target_role_id):
        if req.skill_id == skill_id:
            cap = req.required_proficiency
            break

    employee = data_service.get_employee(employee_id)
    current = next((s.proficiency for s in (employee.skills if employee else []) if s.skill_id == skill_id), 0)

    skill_gains = {}
    updated_skills = {}
    if current < cap:
        skill_gains = {skill_id: 1}
        updated_skills = data_service.apply_completion(employee_id, skill_gains)

    assignment_service.complete(employee_id, assignment_id, skill_gains=skill_gains)

    return {
        **assignment,
        "skill_gains": skill_gains,
        "updated_skills": updated_skills,
        "message": (
            f"Audit complete — {assignment['skill_name']} proficiency is now L{current + 1}"
            if skill_gains else
            f"Audit complete — {assignment['skill_name']} already at the required level"
        ),
    }
