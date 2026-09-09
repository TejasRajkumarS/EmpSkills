from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.data_service import data_service
from app.models import LearningResource

router = APIRouter()


@router.get("/resources", response_model=List[LearningResource])
async def get_resources(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    skill: Optional[str] = Query(None, description="Filter by skill ID")
):
    resources = data_service.get_resources()

    if difficulty:
        resources = [r for r in resources if r.difficulty.lower() == difficulty.lower()]

    if resource_type:
        resources = [r for r in resources if r.resource_type.lower() == resource_type.lower()]

    if skill:
        resource_skill_map = data_service.get_resource_skill_map()
        resources = [r for r in resources if skill in resource_skill_map.get(r.resource_id, [])]

    return resources


@router.get("/resources/{resource_id}", response_model=LearningResource)
async def get_resource(resource_id: str):
    resource = data_service.get_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found")
    return resource