# EmpSkil
### Employee Skill Intelligence

---

## Overview

EmpSkil is an HR/L&D Skill Intelligence Platform that analyzes employee skills against target job-role requirements. It provides:

- Employee skill profiles
- Role matching
- Skill gap analysis
- Role readiness scoring
- Learning recommendations
- Recommendation explanations
- Personalized learning paths
- Estimated learning time
- Individual reports
- Organizational skill-gap analytics
- HR training priorities

## Problem Statement

Organizations struggle to identify workforce skill gaps and recommend development paths. Existing solutions are often expensive, complex, or require proprietary enterprise data. EmpSkil demonstrates how HR/L&D teams can perform skill intelligence analysis using a single synthetic dataset.

## Solution

EmpSkil provides a complete skill intelligence pipeline:

```
empskil_dataset.csv → Data Loader → Employee Skill Profile → Target Role
→ Role Matching → Skill Gap Analysis → Readiness Score → Recommendation Engine
→ Personalized Learning Path → Individual/Organizational Reports → HR Dashboard
```

Every stage uses actual dataset values and real calculations.

## Features

### Employee Intelligence
- Employee directory with search, filter, sort
- Employee skill profiles with proficiency visualization
- Skill extraction from profile text

### Role Intelligence
- Dynamic role catalog from dataset
- Role requirements with proficiency and importance weights
- Role matching with weighted scoring

### Learning Intelligence
- Skill gap analysis with severity classification
- Weighted readiness scoring (proprietary formula)
- Recommendation engine with explainable scoring
- Prerequisite-aware learning path generation
- Learning time estimation

### HR Intelligence
- Executive dashboard with key metrics
- Organizational skill gap analytics
- Readiness distributions
- Training priority identification
- Individual and organizational reports
- Export capabilities

## Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for visualizations
- React Router for navigation

**Backend:**
- Python + FastAPI
- Pandas for data processing
- scikit-learn for skill extraction (TF-IDF + cosine similarity)
- Pydantic for validation

**Data:**
- Single CSV dataset (empskil_dataset.csv)

### Project Structure

```
EmpSkil/
├── empskil_dataset.csv          # Single source of truth
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── models/              # Pydantic models
│   │   ├── schemas/             # Request/response schemas
│   │   ├── routers/             # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript types
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── README.md
├── .env.example
└── .gitignore
```

## Master Dataset

The entire application uses a single dataset: `empskil_dataset.csv`

### Dataset Structure

The CSV is intentionally denormalized. Each row represents a relationship between:
- Employee
- Skill
- Target Role
- Learning Resource

**Fields:**
- `employee_id`, `employee_name`, `current_role`, `profile_text`
- `skill_id`, `skill_name`, `skill_category`, `proficiency`, `skill_source`
- `target_role_id`, `target_role`, `required_proficiency`, `importance_weight`
- `resource_id`, `resource_title`, `resource_type`, `difficulty`, `duration_hours`
- `resource_skill_ids`, `prerequisite_resource_ids`

### Dataset Statistics (Discovered Dynamically)

- 30 synthetic employees
- 36 skills across 13 categories
- 10 target roles
- 37 learning resources

## Data Processing

The backend reconstructs logical entities from the denormalized CSV:

1. **Employees** - Grouped by `employee_id` with their skills
2. **Skills** - Unique skills from `skill_id`
3. **Roles** - Target roles with required skills from `target_role_id`
4. **Resources** - Learning resources from `resource_id` with prerequisites

## Skill Extraction

Skills are extracted from employee `profile_text` using:
1. Direct skill name matching (exact + aliases)
2. TF-IDF + cosine similarity for fuzzy matching

Structured skill data from the dataset remains authoritative for proficiency.

## Role Matching

```
Role Match = (Matched Skills / Total Required Skills) × 100
```

Where a skill is "matched" if employee proficiency ≥ required proficiency.

## Skill Gap Analysis

```
Gap = max(required_proficiency - employee_proficiency, 0)
```

If employee has no record for a required skill: `employee_proficiency = 0`

**Severity Classification:**
- 0 → No Gap
- 1 → Minor Gap
- 2 → Moderate Gap
- 3+ → Major Gap

## Readiness Formula

**Weighted Readiness Score:**

```
Readiness Score = Σ(min(employee_proficiency, required_proficiency) × importance_weight) 
                 / Σ(required_proficiency × importance_weight) × 100
```

**Categories:**
- 80-100 → Ready
- 60-79 → Near Ready
- 40-59 → Developing
- 0-39 → Needs Significant Development

## Recommendation Engine

Recommendations are ranked using a weighted scoring model:

```
Score = 0.30 × Gap Priority + 0.25 × Role Importance + 0.20 × Resource Relevance
      + 0.15 × Difficulty Fit + 0.10 × Learning Efficiency
```

Each recommendation includes an explanation generated from actual data values.

## Learning Path

Learning paths are generated by:
1. Filtering recommendations to relevant skills
2. Topological sort respecting prerequisites
3. Ordering by dependency and gap priority
4. Calculating total duration from resource hours

## Dashboard Analytics

- **Skill Gap Distribution** - No Gap / Minor / Moderate / Major
- **Readiness Distribution** - Ready / Near Ready / Developing / Needs Dev
- **Top Organizational Skill Gaps** - Aggregated across all employees
- **Readiness by Role** - Average readiness per target role
- **Training Priorities** - High-impact skills with large gaps

## API Endpoints

```
GET  /api/v1/health
GET  /api/v1/employees
GET  /api/v1/employees/{id}
GET  /api/v1/skills
GET  /api/v1/roles
GET  /api/v1/roles/{id}
GET  /api/v1/resources
POST /api/v1/analysis
GET  /api/v1/dashboard
GET  /api/v1/analytics/organization
GET  /api/v1/reports/employee/{id}
GET  /api/v1/reports/organization
```

## Frontend Routes

```
/dashboard          - Executive dashboard
/employees          - Employee directory
/employees/:id      - Employee profile
/roles              - Roles & skills catalog
/analysis           - Skill analysis workspace
/learning-paths     - Learning path generator
/reports            - Individual & organizational reports
```

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running Locally

### Start Backend (Terminal 1)

```bash
cd backend
# Activate virtual environment first
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

The frontend proxies API calls to the backend automatically.

## Demo Workflow

1. Open http://localhost:5173 → **Dashboard**
2. Navigate to **Employees** → Click "View Profile" on any employee
3. Go to **Skill Analysis** → Select Employee + Target Role → Click "Analyze Skills"
4. Review: Role Match → Readiness Score → Skill Gaps → Recommendations → Learning Path
5. Check **Reports** → Individual Report for detailed export
6. Check **Reports** → Organizational Report for HR analytics
7. Explore **Dashboard** for organizational overview

## Testing

### Backend Tests

```bash
cd backend
python test_backend.py
```

### Frontend Build

```bash
cd frontend
npm run build
```

## Future Enhancements

- [ ] PDF report export
- [ ] Real-time collaboration features
- [ ] Integration with HRIS systems
- [ ] Advanced ML for skill extraction
- [ ] Career pathing recommendations
- [ ] Team-level analytics
- [ ] Custom role creation UI
- [ ] Resource content management
- [ ] Multi-language support
- [ ] Mobile app

---

**EmpSkil** — Employee Skill Intelligence  
Built for hackathon demonstration with synthetic data only.