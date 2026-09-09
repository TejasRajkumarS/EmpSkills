import axios from 'axios';
import type {
  Employee,
  Skill,
  Role,
  LearningResource,
  AnalysisResponse,
  DashboardMetrics,
  OrganizationAnalytics,
  EmployeeReport,
  OrganizationReport,
  LearningProgress,
  CompletionResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const employeeApi = {
  getAll: (params?: { search?: string; role?: string; sort_by?: string; sort_order?: string }) =>
    api.get<Employee[]>('/employees', { params }),

  getById: (id: string) =>
    api.get<Employee>(`/employees/${id}`),
};

export const skillApi = {
  getAll: () =>
    api.get<Skill[]>('/skills'),
};

export const roleApi = {
  getAll: () =>
    api.get<Role[]>('/roles'),

  getById: (id: string) =>
    api.get<Role>(`/roles/${id}`),
};

export const resourceApi = {
  getAll: (params?: { difficulty?: string; resource_type?: string; skill?: string }) =>
    api.get<LearningResource[]>('/resources', { params }),

  getById: (id: string) =>
    api.get<LearningResource>(`/resources/${id}`),
};

export const analysisApi = {
  analyze: (employeeId: string, targetRoleId: string) =>
    api.post<AnalysisResponse>('/analysis', { employee_id: employeeId, target_role_id: targetRoleId }),
};

export const dashboardApi = {
  getMetrics: () =>
    api.get<DashboardMetrics>('/dashboard'),
};

export const analyticsApi = {
  getOrganization: () =>
    api.get<OrganizationAnalytics>('/analytics/organization'),
};

export const progressApi = {
  get: (employeeId: string) =>
    api.get<LearningProgress>(`/progress/${employeeId}`),

  complete: (employeeId: string, resourceId: string, targetRoleId: string) =>
    api.post<CompletionResponse>(`/progress/${employeeId}/complete/${resourceId}`, null, {
      params: { target_role_id: targetRoleId },
    }),
};

export const reportApi = {
  getEmployee: (employeeId: string, targetRoleId: string) =>
    api.get<EmployeeReport>(`/reports/employee/${employeeId}`, { params: { target_role_id: targetRoleId } }),

  getOrganization: () =>
    api.get<OrganizationReport>('/reports/organization'),
};

export default api;