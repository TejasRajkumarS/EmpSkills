from pydantic import BaseModel


class Skill(BaseModel):
    skill_id: str
    skill_name: str
    category: str