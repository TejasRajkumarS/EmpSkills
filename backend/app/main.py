from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, employees, skills, roles, resources, analysis, dashboard, analytics, reports, progress, assignments

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(employees.router, prefix=settings.API_V1_STR, tags=["employees"])
app.include_router(skills.router, prefix=settings.API_V1_STR, tags=["skills"])
app.include_router(roles.router, prefix=settings.API_V1_STR, tags=["roles"])
app.include_router(resources.router, prefix=settings.API_V1_STR, tags=["resources"])
app.include_router(analysis.router, prefix=settings.API_V1_STR, tags=["analysis"])
app.include_router(dashboard.router, prefix=settings.API_V1_STR, tags=["dashboard"])
app.include_router(analytics.router, prefix=settings.API_V1_STR, tags=["analytics"])
app.include_router(reports.router, prefix=settings.API_V1_STR, tags=["reports"])
app.include_router(progress.router, prefix=settings.API_V1_STR, tags=["progress"])
app.include_router(assignments.router, prefix=settings.API_V1_STR, tags=["assignments"])


@app.on_event("startup")
async def startup_event():
    from app.services.data_service import data_service
    data_service.load_dataset()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)