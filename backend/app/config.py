import os
from pathlib import Path
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

    # Kept as a plain string: pydantic-settings JSON-decodes complex (list/dict)
    # env values, which crashes on comma-separated values like .env's
    # CORS_ORIGINS=http://localhost:5173,http://localhost:3000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if raw.startswith("["):
            # Tolerate JSON array format too
            import json
            try:
                return [str(o) for o in json.loads(raw)]
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in raw.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
