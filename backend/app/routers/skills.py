from fastapi import APIRouter
from typing import List
from app.services.data_service import data_service
from app.models import Skill

router = APIRouter()


@router.get("/skills", response_model=List[Skill])
async def get_skills():
    return data_service.get_skills()