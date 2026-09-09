import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Any
from functools import lru_cache

from app.config import settings
from app.models import (
    Employee,
    EmployeeSkill,
    Skill,
    Role,
    RoleSkillRequirement,
    LearningResource,
)


class DataService:
    _instance = None
    _df: Optional[pd.DataFrame] = None
    _employees: Dict[str, Employee] = {}
    _skills: Dict[str, Skill] = {}
    _roles: Dict[str, Role] = {}
    _resources: Dict[str, LearningResource] = {}
    _employee_skills: Dict[str, List[EmployeeSkill]] = {}
    _role_requirements: Dict[str, List[RoleSkillRequirement]] = {}
    _resource_skills: Dict[str, List[str]] = {}
    _prerequisites: Dict[str, List[str]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_dataset(self) -> pd.DataFrame:
        if self._df is not None:
            return self._df

        dataset_path = Path(settings.DATASET_PATH)
        if not dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found at {dataset_path}")

        self._df = pd.read_csv(dataset_path)
        self._validate_dataset()
        self._build_entities()
        return self._df

    def _validate_dataset(self) -> None:
        required_columns = [
            "employee_id", "employee_name", "current_role", "profile_text",
            "skill_id", "skill_name", "skill_category", "proficiency", "skill_source",
            "target_role_id", "target_role", "required_proficiency", "importance_weight",
            "resource_id", "resource_title", "resource_type", "difficulty",
            "duration_hours", "resource_skill_ids", "prerequisite_resource_ids"
        ]

        missing = [col for col in required_columns if col not in self._df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

        df = self._df

        # Validate proficiency ranges
        if "proficiency" in df.columns:
            invalid_prof = df[~df["proficiency"].between(0, 5)]
            if len(invalid_prof) > 0:
                raise ValueError(f"Invalid proficiency values (must be 0-5): {len(invalid_prof)} rows")

        if "required_proficiency" in df.columns:
            invalid_req = df[~df["required_proficiency"].between(0, 5)]
            if len(invalid_req) > 0:
                raise ValueError(f"Invalid required_proficiency values (must be 0-5): {len(invalid_req)} rows")

        # Validate importance_weight positive when skill required
        req_rows = df[df["required_proficiency"] > 0]
        invalid_weight = req_rows[req_rows["importance_weight"] <= 0]
        if len(invalid_weight) > 0:
            raise ValueError(f"Importance weight must be positive for required skills: {len(invalid_weight)} rows")

        # Validate duration_hours
        resource_rows = df[df["resource_id"].notna() & (df["resource_id"] != "")]
        invalid_duration = resource_rows[~resource_rows["duration_hours"].apply(lambda x: isinstance(x, (int, float)) and x >= 0)]
        if len(invalid_duration) > 0:
            raise ValueError(f"Invalid duration_hours: {len(invalid_duration)} rows")

        # Validate prerequisite resource IDs exist
        all_resource_ids = set(resource_rows["resource_id"].unique())
        for _, row in resource_rows.iterrows():
            prereqs = str(row["prerequisite_resource_ids"]).split(";") if pd.notna(row["prerequisite_resource_ids"]) else []
            for prereq in prereqs:
                prereq = prereq.strip()
                if prereq and prereq not in all_resource_ids:
                    raise ValueError(f"Prerequisite resource {prereq} not found for resource {row['resource_id']}")

        # Validate resource_skill_ids exist
        all_skill_ids = set(df["skill_id"].unique())
        for _, row in resource_rows.iterrows():
            res_skills = str(row["resource_skill_ids"]).split(";") if pd.notna(row["resource_skill_ids"]) else []
            for rs in res_skills:
                rs = rs.strip()
                if rs and rs not in all_skill_ids:
                    raise ValueError(f"Resource skill {rs} not found for resource {row['resource_id']}")

        # Validate each employee has required fields
        for emp_id in df["employee_id"].unique():
            emp_data = df[df["employee_id"] == emp_id].iloc[0]
            if pd.isna(emp_data["employee_name"]) or pd.isna(emp_data["current_role"]) or pd.isna(emp_data["profile_text"]):
                raise ValueError(f"Employee {emp_id} missing required fields")

        # Validate each skill has required fields
        for skill_id in df["skill_id"].unique():
            skill_data = df[df["skill_id"] == skill_id].iloc[0]
            if pd.isna(skill_data["skill_name"]) or pd.isna(skill_data["skill_category"]):
                raise ValueError(f"Skill {skill_id} missing required fields")

        # Validate each role has required fields
        for role_id in df["target_role_id"].unique():
            role_data = df[df["target_role_id"] == role_id].iloc[0]
            if pd.isna(role_data["target_role"]):
                raise ValueError(f"Role {role_id} missing target_role")

    def _build_entities(self) -> None:
        df = self._df

        # Build skills
        for skill_id in df["skill_id"].unique():
            skill_data = df[df["skill_id"] == skill_id].iloc[0]
            self._skills[skill_id] = Skill(
                skill_id=skill_id,
                skill_name=skill_data["skill_name"],
                category=skill_data["skill_category"]
            )

        # Build employees
        for emp_id in df["employee_id"].unique():
            emp_data = df[df["employee_id"] == emp_id].iloc[0]
            emp_skills = []
            emp_skill_rows = df[df["employee_id"] == emp_id].drop_duplicates(subset=["skill_id"])
            for _, row in emp_skill_rows.iterrows():
                if pd.notna(row["skill_id"]) and row["skill_id"] != "":
                    emp_skills.append(EmployeeSkill(
                        skill_id=row["skill_id"],
                        skill_name=row["skill_name"],
                        category=row["skill_category"],
                        proficiency=int(row["proficiency"]),
                        source=row["skill_source"]
                    ))
            self._employee_skills[emp_id] = emp_skills
            self._employees[emp_id] = Employee(
                employee_id=emp_id,
                employee_name=emp_data["employee_name"],
                current_role=emp_data["current_role"],
                profile_text=emp_data["profile_text"],
                skills=emp_skills
            )

        # Build roles
        for role_id in df["target_role_id"].unique():
            role_data = df[df["target_role_id"] == role_id].iloc[0]
            req_skills = []
            role_skill_rows = df[df["target_role_id"] == role_id].drop_duplicates(subset=["skill_id"])
            for _, row in role_skill_rows.iterrows():
                if pd.notna(row["skill_id"]) and row["skill_id"] != "" and row["required_proficiency"] > 0:
                    req_skills.append(RoleSkillRequirement(
                        skill_id=row["skill_id"],
                        skill_name=row["skill_name"],
                        category=row["skill_category"],
                        required_proficiency=int(row["required_proficiency"]),
                        importance_weight=float(row["importance_weight"])
                    ))
            self._role_requirements[role_id] = req_skills
            self._roles[role_id] = Role(
                target_role_id=role_id,
                target_role=role_data["target_role"],
                required_skills=req_skills
            )

        # Build resources
        resource_rows = df[df["resource_id"].notna() & (df["resource_id"] != "")].drop_duplicates(subset=["resource_id"])
        for _, row in resource_rows.iterrows():
            res_skills = []
            if pd.notna(row["resource_skill_ids"]):
                res_skills = [s.strip() for s in str(row["resource_skill_ids"]).split(";") if s.strip()]

            prereqs = []
            if pd.notna(row["prerequisite_resource_ids"]):
                prereqs = [p.strip() for p in str(row["prerequisite_resource_ids"]).split(";") if p.strip()]

            self._resource_skills[row["resource_id"]] = res_skills
            self._prerequisites[row["resource_id"]] = prereqs

            self._resources[row["resource_id"]] = LearningResource(
                resource_id=row["resource_id"],
                resource_title=row["resource_title"],
                resource_type=row["resource_type"] if pd.notna(row["resource_type"]) else "",
                difficulty=row["difficulty"] if pd.notna(row["difficulty"]) else "",
                duration_hours=float(row["duration_hours"]) if pd.notna(row["duration_hours"]) else 0.0,
                resource_skill_ids=res_skills,
                prerequisite_resource_ids=prereqs
            )

    # Learning progress integration
    def apply_completion(self, employee_id: str, skill_gains: Dict[str, int]) -> Dict[str, int]:
        """Apply a completed learning resource for ONE employee.

        skill_gains maps skill_id -> points gained. Proficiency is capped at 5.
        Returns {skill_id: new_level} for the skills that were touched.
        """
        emp_skills = self._employee_skills.get(employee_id, [])
        by_id = {es.skill_id: es for es in emp_skills}

        updated: Dict[str, int] = {}
        for skill_id, gain in skill_gains.items():
            es = by_id.get(skill_id)
            if es is None:
                # Employee never had this skill — add it (learned from scratch)
                skill_def = self._skills.get(skill_id)
                if skill_def is None:
                    continue
                new_level = min(5, gain)
                new_skill = EmployeeSkill(
                    skill_id=skill_id,
                    skill_name=skill_def.skill_name,
                    category=skill_def.category,
                    proficiency=new_level,
                    source="Learning",
                )
                emp_skills.append(new_skill)  # same list object as Employee.skills
                by_id[skill_id] = new_skill
                updated[skill_id] = new_level

                # Add a matching dataset row so rebuilds keep the new skill
                if self._df is not None:
                    emp_rows = self._df[self._df["employee_id"] == employee_id]
                    if not emp_rows.empty:
                        new_row = emp_rows.iloc[0].to_dict()
                        new_row.update({
                            "skill_id": skill_id,
                            "skill_name": skill_def.skill_name,
                            "skill_category": skill_def.category,
                            "proficiency": new_level,
                            "skill_source": "Learning",
                        })
                        self._df = pd.concat(
                            [self._df, pd.DataFrame([new_row])], ignore_index=True
                        )
                continue

            new_level = min(5, es.proficiency + gain)
            es.proficiency = new_level
            updated[skill_id] = new_level

        # Keep the cached DataFrame consistent so entity rebuilds see the gains
        if self._df is not None:
            df_mask = self._df["employee_id"] == employee_id
            for skill_id, gain in skill_gains.items():
                if skill_id not in by_id:
                    continue
                m = df_mask & (self._df["skill_id"] == skill_id)
                new_level = updated.get(skill_id)
                if new_level is not None:
                    self._df.loc[m, "proficiency"] = new_level

        return updated

    # Getter methods
    def get_employees(self) -> List[Employee]:
        self.load_dataset()
        return list(self._employees.values())

    def get_employee(self, employee_id: str) -> Optional[Employee]:
        self.load_dataset()
        return self._employees.get(employee_id)

    def get_employee_skills(self, employee_id: str) -> List[EmployeeSkill]:
        self.load_dataset()
        return self._employee_skills.get(employee_id, [])

    def get_skills(self) -> List[Skill]:
        self.load_dataset()
        return list(self._skills.values())

    def get_skill(self, skill_id: str) -> Optional[Skill]:
        self.load_dataset()
        return self._skills.get(skill_id)

    def get_roles(self) -> List[Role]:
        self.load_dataset()
        return list(self._roles.values())

    def get_role(self, role_id: str) -> Optional[Role]:
        self.load_dataset()
        return self._roles.get(role_id)

    def get_role_requirements(self, role_id: str) -> List[RoleSkillRequirement]:
        self.load_dataset()
        return self._role_requirements.get(role_id, [])

    def get_resources(self) -> List[LearningResource]:
        self.load_dataset()
        return list(self._resources.values())

    def get_resource(self, resource_id: str) -> Optional[LearningResource]:
        self.load_dataset()
        return self._resources.get(resource_id)

    def get_resource_skills(self, resource_id: str) -> List[str]:
        self.load_dataset()
        return self._resource_skills.get(resource_id, [])

    def get_prerequisites(self, resource_id: str) -> List[str]:
        self.load_dataset()
        return self._prerequisites.get(resource_id, [])

    def get_all_prerequisites(self) -> Dict[str, List[str]]:
        self.load_dataset()
        return self._prerequisites.copy()

    def get_employee_skill_map(self, employee_id: str) -> Dict[str, EmployeeSkill]:
        skills = self.get_employee_skills(employee_id)
        return {s.skill_id: s for s in skills}

    def get_resource_skill_map(self) -> Dict[str, List[str]]:
        self.load_dataset()
        return self._resource_skills.copy()


data_service = DataService()