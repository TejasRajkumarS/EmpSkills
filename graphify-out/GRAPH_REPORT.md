# Graph Report - EmpSkills  (2026-09-09)

## Corpus Check
- Corpus is ~16,306 words - fits in a single context window. You may not need a graph.

## Summary
- 373 nodes · 657 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Dashboard & Analysis UI
- Config & Pydantic Models
- Frontend Dependencies
- App Shell, Routing & Auth
- Data Service (CSV Loader)
- TypeScript Config
- Gap & Readiness Services
- Org Analytics Service
- Recommendation Engine
- Analysis API Routes
- Learning Path Service
- Vite Build Config
- Platform Concepts (Docs)
- Skill Extraction (TF-IDF)
- Employees API
- Reports API
- Resources API
- Roles API
- FastAPI App Entry
- Analytics API
- Dashboard API
- Health API

## God Nodes (most connected - your core abstractions)
1. `DataService` - 20 edges
2. `compilerOptions` - 18 edges
3. `Employee` - 12 edges
4. `employeeApi` - 11 edges
5. `Role` - 11 edges
6. `roleApi` - 10 edges
7. `SkillGap` - 8 edges
8. `EmployeeSkill` - 8 edges
9. `RoleSkillRequirement` - 8 edges
10. `AnalyticsService` - 8 edges

## Surprising Connections (you probably didn't know these)
- `PrivateRoute()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/context/AuthContext.tsx
- `RoleBasedRoutes()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/context/AuthContext.tsx
- `analyze_employee_role()` --references--> `AnalysisRequest`  [EXTRACTED]
  backend/app/routers/analysis.py → backend/app/schemas/__init__.py
- `analyze_employee_role()` --calls--> `AnalysisResponse`  [EXTRACTED]
  backend/app/routers/analysis.py → backend/app/schemas/__init__.py
- `get_recommendations()` --references--> `AnalysisRequest`  [EXTRACTED]
  backend/app/routers/analysis.py → backend/app/schemas/__init__.py

## Import Cycles
- None detected.

## Communities (27 total, 5 thin omitted)

### Community 0 - "Dashboard & Analysis UI"
Cohesion: 0.07
Nodes (49): readinessColors, severityColors, statusColors, COLORS, RoleReadiness(), SkillAudits(), categoryColors, Employees() (+41 more)

### Community 1 - "Config & Pydantic Models"
Cohesion: 0.09
Nodes (37): Config, Settings, GapSeverity, MatchStatus, BaseModel, ReadinessCategory, ReadinessResult, RoleMatch (+29 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (38): autoprefixer, axios, dependencies, axios, react, react-dom, react-router-dom, recharts (+30 more)

### Community 3 - "App Shell, Routing & Auth"
Cohesion: 0.08
Nodes (21): App(), PrivateRoute(), RoleBasedRoutes(), employeeNavigation, hrNavigation, Layout(), sharedNavigation, AuthContext (+13 more)

### Community 4 - "Data Service (CSV Loader)"
Cohesion: 0.15
Nodes (8): DataService, EmployeeSkill, LearningResource, RoleSkillRequirement, Skill, DataFrame, Employee, Role

### Community 5 - "TypeScript Config"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 6 - "Gap & Readiness Services"
Cohesion: 0.18
Nodes (11): GapAnalysisService, EmployeeSkill, RoleSkillRequirement, SkillGap, ReadinessService, RoleMatchingService, GapSeverity, MatchStatus (+3 more)

### Community 7 - "Org Analytics Service"
Cohesion: 0.19
Nodes (9): AnalyticsService, SkillGap, DashboardMetrics, GapDistribution, OrganizationAnalytics, ReadinessDistribution, RoleReadiness, TopSkillGap (+1 more)

### Community 8 - "Recommendation Engine"
Cohesion: 0.37
Nodes (6): EmployeeSkill, LearningResource, Recommendation, RoleSkillRequirement, SkillGap, RecommendationService

### Community 9 - "Analysis API Routes"
Cohesion: 0.36
Nodes (9): analyze_employee_role(), get_learning_path(), get_recommendations(), AnalysisRequest, AnalysisResponse, LearningPathRequest, BaseModel, RecommendationRequest (+1 more)

### Community 10 - "Learning Path Service"
Cohesion: 0.27
Nodes (6): LearningPathService, EmployeeSkill, Recommendation, RoleSkillRequirement, SkillGap, LearningPath

### Community 11 - "Vite Build Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.ts

### Community 12 - "Platform Concepts (Docs)"
Cohesion: 0.25
Nodes (8): empskil_dataset.csv, EmpSkil Skill Intelligence Platform, HR Executive Dashboard, Prerequisite-aware Learning Paths, Weighted Readiness Scoring, Explainable Recommendation Engine, TF-IDF Skill Extraction, Skill Intelligence Pipeline

### Community 14 - "Employees API"
Cohesion: 0.67
Nodes (3): get_employee(), get_employees(), get

### Community 15 - "Reports API"
Cohesion: 0.67
Nodes (3): get_employee_report(), get_organization_report(), get

### Community 16 - "Resources API"
Cohesion: 0.67
Nodes (3): get_resource(), get_resources(), get

### Community 17 - "Roles API"
Cohesion: 0.67
Nodes (3): get_role(), get_roles(), get

## Knowledge Gaps
- **81 isolated node(s):** `Config`, `name`, `private`, `version`, `type` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataService` connect `Data Service (CSV Loader)` to `Config & Pydantic Models`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `AnalyticsService` connect `Org Analytics Service` to `Config & Pydantic Models`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `RecommendationService` connect `Recommendation Engine` to `Config & Pydantic Models`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `Config`, `name`, `private` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard & Analysis UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06829488919041157 - nodes in this community are weakly interconnected._
- **Should `Config & Pydantic Models` be split into smaller, more focused modules?**
  _Cohesion score 0.08892921960072596 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._