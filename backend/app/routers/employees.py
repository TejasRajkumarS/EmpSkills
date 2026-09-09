from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.data_service import data_service
from app.models import Employee

router = APIRouter()


@router.get("/employees", response_model=List[Employee])
async def get_employees(
    search: Optional[str] = Query(None, description="Search by name or ID"),
    role: Optional[str] = Query(None, description="Filter by current role"),
    sort_by: Optional[str] = Query("employee_id", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order")
):
    employees = data_service.get_employees()

    if search:
        search_lower = search.lower()
        employees = [
            e for e in employees
            if search_lower in e.employee_id.lower() or search_lower in e.employee_name.lower()
        ]

    if role:
        employees = [e for e in employees if role.lower() in e.current_role.lower()]

    reverse = sort_order.lower() == "desc"
    if sort_by == "employee_id":
        employees.sort(key=lambda e: e.employee_id, reverse=reverse)
    elif sort_by == "employee_name":
        employees.sort(key=lambda e: e.employee_name, reverse=reverse)
    elif sort_by == "current_role":
        employees.sort(key=lambda e: e.current_role, reverse=reverse)
    elif sort_by == "skill_count":
        employees.sort(key=lambda e: e.skill_count, reverse=reverse)
    elif sort_by == "average_proficiency":
        employees.sort(key=lambda e: e.average_proficiency, reverse=reverse)

    return employees


@router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str):
    employee = data_service.get_employee(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return employee