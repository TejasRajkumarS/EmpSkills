from fastapi import APIRouter
from app.services.analytics_service import analytics_service
from app.models import DashboardMetrics

router = APIRouter()


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    return analytics_service.get_dashboard_metrics()