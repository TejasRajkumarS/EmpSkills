from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "EmpSkil API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    DATASET_PATH: str = str(Path(__file__).parent.parent.parent / "empskil_dataset.csv")

    READINESS_THRESHOLDS: dict = {
        "ready": 80,
        "near_ready": 60,
        "developing": 40,
    }

    GAP_THRESHOLDS: dict = {
        "no_gap": 0,
        "minor": 1,
        "moderate": 2,
        "major": 3,
    }

    RECOMMENDATION_WEIGHTS: dict = {
        "gap_priority": 0.30,
        "role_importance": 0.25,
        "resource_relevance": 0.20,
        "difficulty_fit": 0.15,
        "learning_efficiency": 0.10,
    }

    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v):
        # Accept both "http://a,http://b" and JSON array formats
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()