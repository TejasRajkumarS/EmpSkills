from fastapi import APIRouter, HTTPException
from app.services.data_service import data_service
from app.services.analytics_service import analytics_service
from app.services.analysis_service import (
    gap_analysis_service,
    role_matching_service,
    readiness_service,
)
from app.services.recommendation_service import recommendation_service
from app.services.learning_path_service import learning_path_service

router = APIRouter()


@router.get("/reports/employee/{employee_id}")
async def get_employee_report(employee_id: str, target_role_id: str):
    employee = data_service.get_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    role = data_service.get_role(target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {target_role_id} not found")

    employee_skills = data_service.get_employee_skill_map(employee_id)
    role_requirements = data_service.get_role_requirements(target_role_id)

    skill_gaps = gap_analysis_service.analyze_gaps(employee_skills, role_requirements)
    role_match = role_matching_service.calculate_match(employee_skills, role_requirements)
    role_match.target_role_id = target_role_id
    role_match.target_role = role.target_role

    readiness = readiness_service.calculate_readiness(employee_skills, role_requirements, skill_gaps)
    readiness.employee_id = employee_id
    readiness.target_role_id = target_role_id
    readiness.target_role = role.target_role
    readiness.role_match = role_match

    recommendations = recommendation_service.generate_recommendations(
        employee_id, target_role_id, skill_gaps, employee_skills, role_requirements
    )

    learning_path = learning_path_service.generate_learning_path(
        employee_id, target_role_id, recommendations, skill_gaps, employee_skills, role_requirements
    )

    return {
        "employee": employee,
        "target_role": role,
        "role_match": role_match,
        "readiness": readiness,
        "skill_gaps": skill_gaps,
        "recommendations": recommendations,
        "learning_path": learning_path
    }


@router.get("/reports/organization")
async def get_organization_report():
    analytics = analytics_service.get_organization_analytics()
    return {"analytics": analytics}