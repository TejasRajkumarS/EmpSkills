from app.services.data_service import data_service
from app.services.analysis_service import gap_analysis_service, role_matching_service, readiness_service

print("Testing EmpSkil backend...")

# Load dataset
df = data_service.load_dataset()
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")

# Test entities
employees = data_service.get_employees()
print(f"Employees: {len(employees)}")

skills = data_service.get_skills()
print(f"Skills: {len(skills)}")

roles = data_service.get_roles()
print(f"Roles: {len(roles)}")

resources = data_service.get_resources()
print(f"Resources: {len(resources)}")

# Test employee
emp = data_service.get_employee("E001")
print(f"\nEmployee E001: {emp.employee_name}, Role: {emp.current_role}")
print(f"Skills: {emp.skill_count}, Avg Proficiency: {emp.average_proficiency:.1f}")

# Test role
role = data_service.get_role("R001")
print(f"\nRole R001: {role.target_role}")
print(f"Required skills: {len(role.required_skills)}")

# Test analysis
emp_skills = data_service.get_employee_skill_map("E001")
role_reqs = data_service.get_role_requirements("R001")

gaps = gap_analysis_service.analyze_gaps(emp_skills, role_reqs)
print(f"\nSkill gaps for E001 -> R001: {len(gaps)}")
for gap in gaps[:5]:
    print(f"  {gap.skill_name}: current={gap.current_proficiency}, required={gap.required_proficiency}, gap={gap.gap}, severity={gap.severity}")

match = role_matching_service.calculate_match(emp_skills, role_reqs)
match.target_role_id = "R001"
match.target_role = "Software Developer"
print(f"\nRole match: {match.match_percentage}% (matched={match.matched_skills}, partial={match.partial_skills}, missing={match.missing_skills})")

readiness = readiness_service.calculate_readiness(emp_skills, role_reqs, gaps)
readiness.employee_id = "E001"
readiness.target_role_id = "R001"
readiness.target_role = "Software Developer"
readiness.role_match = match
print(f"Readiness: {readiness.readiness_score}% - {readiness.category}")
print(f"Explanation: {readiness.explanation}")

print("\nAll tests passed!")