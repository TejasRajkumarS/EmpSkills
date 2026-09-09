from fastapi import APIRouter, HTTPException
from app.schemas import AnalysisRequest, AnalysisResponse
from app.services.data_service import data_service
from app.services.analysis_service import (
    gap_analysis_service,
    role_matching_service,
    readiness_service,
)
from app.services.recommendation_service import recommendation_service
from app.services.learning_path_service import learning_path_service

router = APIRouter()


@router.post("/analysis", response_model=AnalysisResponse)
async def analyze_employee_role(request: AnalysisRequest):
    employee = data_service.get_employee(request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {request.employee_id} not found")

    role = data_service.get_role(request.target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {request.target_role_id} not found")

    employee_skills = data_service.get_employee_skill_map(request.employee_id)
    role_requirements = data_service.get_role_requirements(request.target_role_id)

    if not role_requirements:
        raise HTTPException(status_code=400, detail=f"No requirements defined for role {request.target_role_id}")

    skill_gaps = gap_analysis_service.analyze_gaps(employee_skills, role_requirements)
    role_match = role_matching_service.calculate_match(employee_skills, role_requirements)
    role_match.target_role_id = request.target_role_id
    role_match.target_role = role.target_role

    readiness = readiness_service.calculate_readiness(employee_skills, role_requirements, skill_gaps)
    readiness.employee_id = request.employee_id
    readiness.target_role_id = request.target_role_id
    readiness.target_role = role.target_role
    readiness.role_match = role_match

    recommendations = recommendation_service.generate_recommendations(
        request.employee_id,
        request.target_role_id,
        skill_gaps,
        employee_skills,
        role_requirements
    )

    learning_path = learning_path_service.generate_learning_path(
        request.employee_id,
        request.target_role_id,
        recommendations,
        skill_gaps,
        employee_skills,
        role_requirements
    )

    return AnalysisResponse(
        employee_id=employee.employee_id,
        employee_name=employee.employee_name,
        current_role=employee.current_role,
        target_role_id=request.target_role_id,
        target_role=role.target_role,
        readiness=readiness,
        recommendations=recommendations,
        learning_path=learning_path
    )


@router.post("/recommendations")
async def get_recommendations(request: AnalysisRequest):
    employee = data_service.get_employee(request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {request.employee_id} not found")

    role = data_service.get_role(request.target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {request.target_role_id} not found")

    employee_skills = data_service.get_employee_skill_map(request.employee_id)
    role_requirements = data_service.get_role_requirements(request.target_role_id)
    skill_gaps = gap_analysis_service.analyze_gaps(employee_skills, role_requirements)

    recommendations = recommendation_service.generate_recommendations(
        request.employee_id,
        request.target_role_id,
        skill_gaps,
        employee_skills,
        role_requirements
    )

    return {"recommendations": recommendations}


@router.post("/learning-path")
async def get_learning_path(request: AnalysisRequest):
    employee = data_service.get_employee(request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {request.employee_id} not found")

    role = data_service.get_role(request.target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {request.target_role_id} not found")

    employee_skills = data_service.get_employee_skill_map(request.employee_id)
    role_requirements = data_service.get_role_requirements(request.target_role_id)
    skill_gaps = gap_analysis_service.analyze_gaps(employee_skills, role_requirements)

    recommendations = recommendation_service.generate_recommendations(
        request.employee_id,
        request.target_role_id,
        skill_gaps,
        employee_skills,
        role_requirements
    )

    learning_path = learning_path_service.generate_learning_path(
        request.employee_id,
        request.target_role_id,
        recommendations,
        skill_gaps,
        employee_skills,
        role_requirements
    )

    return {"learning_path": learning_path}