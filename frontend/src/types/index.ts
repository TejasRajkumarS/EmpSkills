export interface EmployeeSkill {
  skill_id: string;
  skill_name: string;
  category: string;
  proficiency: number;
  source: string;
}

export interface Employee {
  employee_id: string;
  employee_name: string;
  current_role: string;
  profile_text: string;
  skills: EmployeeSkill[];
  average_proficiency: number;
  skill_count: number;
}

export interface Skill {
  skill_id: string;
  skill_name: string;
  category: string;
}

export interface RoleSkillRequirement {
  skill_id: string;
  skill_name: string;
  category: string;
  required_proficiency: number;
  importance_weight: number;
}

export interface Role {
  target_role_id: string;
  target_role: string;
  required_skills: RoleSkillRequirement[];
}

export interface LearningResource {
  resource_id: string;
  resource_title: string;
  resource_type: string;
  difficulty: string;
  duration_hours: number;
  resource_skill_ids: string[];
  prerequisite_resource_ids: string[];
}

export type GapSeverity = 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Major Gap';
export type MatchStatus = 'Matched' | 'Partial' | 'Missing';

export interface SkillGap {
  skill_id: string;
  skill_name: string;
  category: string;
  current_proficiency: number;
  required_proficiency: number;
  importance_weight: number;
  gap: number;
  severity: GapSeverity;
  status: MatchStatus;
}

export interface RoleMatch {
  target_role_id: string;
  target_role: string;
  match_percentage: number;
  matched_skills: number;
  partial_skills: number;
  missing_skills: number;
  total_required_skills: number;
}

export type ReadinessCategory = 'Ready' | 'Near Ready' | 'Developing' | 'Needs Significant Development';

export interface ReadinessResult {
  employee_id: string;
  target_role_id: string;
  target_role: string;
  readiness_score: number;
  category: ReadinessCategory;
  explanation: string;
  skill_gaps: SkillGap[];
  role_match: RoleMatch;
}

export interface Recommendation {
  resource_id: string;
  resource_title: string;
  resource_type: string;
  difficulty: string;
  duration_hours: number;
  skills_addressed: string[];
  score: number;
  reason: string;
  prerequisites: string[];
}

export interface LearningPathStep {
  step_number: number;
  resource_id: string;
  resource_title: string;
  resource_type: string;
  difficulty: string;
  duration_hours: number;
  skills_addressed: string[];
  current_proficiency: number;
  target_proficiency: number;
  reason: string;
  prerequisites: string[];
}

export interface LearningPath {
  employee_id: string;
  target_role_id: string;
  target_role: string;
  steps: LearningPathStep[];
  total_duration_hours: number;
  total_steps: number;
}

export interface DashboardMetrics {
  total_employees: number;
  total_roles: number;
  total_skills: number;
  total_resources: number;
  average_readiness: number;
  employees_needing_development: number;
}

export interface GapDistribution {
  no_gap: number;
  minor: number;
  moderate: number;
  major: number;
}

export interface ReadinessDistribution {
  ready: number;
  near_ready: number;
  developing: number;
  needs_significant_development: number;
}

export interface TopSkillGap {
  skill_id: string;
  skill_name: string;
  category: string;
  total_gap: number;
  affected_employees: number;
  avg_importance: number;
}

export interface RoleReadiness {
  target_role_id: string;
  target_role: string;
  avg_readiness: number;
  employee_count: number;
}

export interface TrainingPriority {
  skill_id: string;
  skill_name: string;
  category: string;
  total_gap: number;
  affected_employees: number;
  avg_importance: number;
  priority_score: number;
}

export interface OrganizationAnalytics {
  employees_analyzed: number;
  average_readiness: number;
  gap_distribution: GapDistribution;
  readiness_distribution: ReadinessDistribution;
  top_skill_gaps: TopSkillGap[];
  role_readiness: RoleReadiness[];
  training_priorities: TrainingPriority[];
}

export interface AnalysisResponse {
  employee_id: string;
  employee_name: string;
  current_role: string;
  target_role_id: string;
  target_role: string;
  readiness: ReadinessResult;
  recommendations: Recommendation[];
  learning_path: LearningPath;
}

export interface EmployeeReport {
  employee: Employee;
  target_role: Role;
  role_match: RoleMatch;
  readiness: ReadinessResult;
  skill_gaps: SkillGap[];
  recommendations: Recommendation[];
  learning_path: LearningPath;
}

export interface OrganizationReport {
  analytics: OrganizationAnalytics;
}

export interface CompletedResource {
  resource_id: string;
  resource_title: string;
  skill_gains: Record<string, number>;
  duration_hours: number;
  completed_at: string;
}

export interface LearningProgress {
  employee_id: string;
  completed_resources: CompletedResource[];
  completed_count: number;
  total_learning_hours: number;
  skills_improved: string[];
}

export interface CompletionResponse {
  already_completed: boolean;
  message: string;
  skill_gains?: Record<string, number>;
  updated_skills?: Record<string, number>;
  completed_count?: number;
}

export interface SkillAssignment {
  assignment_id: string;
  employee_id: string;
  skill_id: string;
  skill_name: string;
  target_role_id: string;
  target_role: string;
  assigned_by: string;
  note: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
  // Present on the complete-assignment response only
  skill_gains?: Record<string, number>;
  updated_skills?: Record<string, number>;
  message?: string;
}