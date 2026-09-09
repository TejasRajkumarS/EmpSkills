from fastapi import APIRouter, HTTPException
from typing import List
from app.services.data_service import data_service
from app.models import Role

router = APIRouter()


@router.get("/roles", response_model=List[Role])
async def get_roles():
    return data_service.get_roles()


@router.get("/roles/{role_id}", response_model=Role)
async def get_role(role_id: str):
    role = data_service.get_role(role_id)
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {role_id} not found")
    return role