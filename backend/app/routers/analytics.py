from fastapi import APIRouter
from app.services.analytics_service import analytics_service
from app.models import OrganizationAnalytics

router = APIRouter()


@router.get("/analytics/organization", response_model=OrganizationAnalytics)
async def get_organization_analytics():
    return analytics_service.get_organization_analytics()