import { useEffect, useState } from 'react';
import { employeeApi, roleApi, reportApi, analyticsApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Employee, Role, EmployeeReport, OrganizationReport } from '../types';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4'];

const readinessColors: Record<string, string> = {
  'Ready': 'badge-success',
  'Near Ready': 'badge-info',
  'Developing': 'badge-warning',
  'Needs Significant Development': 'badge-danger',
};

const severityColors: Record<string, string> = {
  'No Gap': 'badge-success',
  'Minor Gap': 'badge-warning',
  'Moderate Gap': 'badge-info',
  'Major Gap': 'badge-danger',
};

export function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [employeeReport, setEmployeeReport] = useState<EmployeeReport | null>(null);
  const [orgReport, setOrgReport] = useState<OrganizationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'organizational'>('individual');

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, roleRes, orgRes] = await Promise.all([
          employeeApi.getAll(),
          roleApi.getAll(),
          analyticsApi.getOrganization(),
        ]);
        setEmployees(empRes.data);
        setRoles(roleRes.data);
        setOrgReport({ analytics: orgRes.data });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerateEmployeeReport = async () => {
    if (!selectedEmployeeId || !selectedRoleId) return;
    setGenerating(true);
    try {
      const res = await reportApi.getEmployee(selectedEmployeeId, selectedRoleId);
      setEmployeeReport(res.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate individual and organizational skill reports</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual Report
            </button>
            <button
              onClick={() => setActiveTab('organizational')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'organizational'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Organizational Report
            </button>
          </div>
        </div>
        <div className="card-body">
          {activeTab === 'individual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="select"
                  >
                    <option value="">Select an employee...</option>
                    {employees.map(e => (
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.employee_name} ({e.employee_id}) - {e.current_role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="select"
                  >
                    <option value="">Select a target role...</option>
                    {roles.map(r => (
                      <option key={r.target_role_id} value={r.target_role_id}>
                        {r.target_role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateEmployeeReport}
                disabled={!selectedEmployeeId || !selectedRoleId || generating}
                className="btn-primary"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>

              {employeeReport && (
                <div className="border-t border-gray-100 pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600">Employee</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{employeeReport.employee.employee_name}</p>
                      <p className="text-sm text-gray-600">{employeeReport.employee.employee_id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600">Target Role</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{employeeReport.target_role.target_role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-sm text-gray-600">Readiness</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{employeeReport.readiness.readiness_score}%</p>
                      <span className={`badge mt-2 ${readinessColors[employeeReport.readiness.category]}`}>
                        {employeeReport.readiness.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Role Match</h3>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary-600">{employeeReport.role_match.match_percentage}%</p>
                        <p className="text-sm text-gray-600">Match</p>
                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-success w-20">Matched</span>
                          <span className="text-gray-900">{employeeReport.role_match.matched_skills}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-warning w-20">Partial</span>
                          <span className="text-gray-900">{employeeReport.role_match.partial_skills}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-danger w-20">Missing</span>
                          <span className="text-gray-900">{employeeReport.role_match.missing_skills}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Skill Gaps</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b border-gray-100">
                            <th className="pb-3 font-medium">Skill</th>
                            <th className="pb-3 font-medium">Current</th>
                            <th className="pb-3 font-medium">Required</th>
                            <th className="pb-3 font-medium">Gap</th>
                            <th className="pb-3 font-medium">Severity</th>
                            <th className="pb-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {employeeReport.skill_gaps.map((gap) => (
                            <tr key={gap.skill_id} className="hover:bg-gray-50">
                              <td className="py-3 text-gray-900">{gap.skill_name}</td>
                              <td className="py-3">{gap.current_proficiency}/5</td>
                              <td className="py-3">{gap.required_proficiency}/5</td>
                              <td className="py-3 font-medium text-gray-900">{gap.gap > 0 ? `+${gap.gap}` : '0'}</td>
                              <td className="py-3"><span className={`badge ${severityColors[gap.severity]}`}>{gap.severity}</span></td>
                              <td className="py-3"><span className={`badge ${severityColors[gap.status]}`}>{gap.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Path ({employeeReport.learning_path.total_steps} steps, {employeeReport.learning_path.total_duration_hours}h)</h3>
                    <div className="space-y-3">
                      {employeeReport.learning_path.steps.map((step) => (
                        <div key={step.step_number} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                              {step.step_number}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{step.resource_title}</h4>
                              <p className="text-sm text-gray-500">{step.resource_type} • {step.difficulty} • {step.duration_hours}h</p>
                              <p className="text-xs text-gray-500 mt-1">Skills: {step.skills_addressed.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'organizational' && orgReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Employees Analyzed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{orgReport.analytics.employees_analyzed}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Avg Readiness</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{orgReport.analytics.average_readiness}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Top Skill Gaps</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{orgReport.analytics.top_skill_gaps.length}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Training Priorities</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{orgReport.analytics.training_priorities.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-semibold text-gray-900">Gap Distribution</h2>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'No Gap', value: orgReport.analytics.gap_distribution.no_gap, color: COLORS[1] },
                            { name: 'Minor', value: orgReport.analytics.gap_distribution.minor, color: COLORS[4] },
                            { name: 'Moderate', value: orgReport.analytics.gap_distribution.moderate, color: COLORS[2] },
                            { name: 'Major', value: orgReport.analytics.gap_distribution.major, color: COLORS[3] },
                          ]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {['No Gap', 'Minor', 'Moderate', 'Major'].map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v.toLocaleString(), 'gaps']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-semibold text-gray-900">Readiness Distribution</h2>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Ready', value: orgReport.analytics.readiness_distribution.ready, color: COLORS[1] },
                            { name: 'Near Ready', value: orgReport.analytics.readiness_distribution.near_ready, color: COLORS[4] },
                            { name: 'Developing', value: orgReport.analytics.readiness_distribution.developing, color: COLORS[2] },
                            { name: 'Needs Dev', value: orgReport.analytics.readiness_distribution.needs_significant_development, color: COLORS[3] },
                          ]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {['Ready', 'Near Ready', 'Developing', 'Needs Dev'].map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v.toLocaleString(), 'employees']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Top Organizational Skill Gaps</h2>
                </div>
                <div className="card-body overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-100">
                        <th className="pb-3 font-medium">Rank</th>
                        <th className="pb-3 font-medium">Skill</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Total Gap</th>
                        <th className="pb-3 font-medium">Affected Employees</th>
                        <th className="pb-3 font-medium">Avg Importance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orgReport.analytics.top_skill_gaps.slice(0, 15).map((gap, index) => (
                        <tr key={gap.skill_id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-primary-600">#{index + 1}</td>
                          <td className="py-3 text-gray-900">{gap.skill_name}</td>
                          <td className="py-3"><span className="badge badge-gray">{gap.category}</span></td>
                          <td className="py-3 text-gray-900">{gap.total_gap}</td>
                          <td className="py-3 text-gray-600">{gap.affected_employees}</td>
                          <td className="py-3 text-gray-600">{gap.avg_importance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Training Priorities</h2>
                </div>
                <div className="card-body overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-100">
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Skill</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Total Gap</th>
                        <th className="pb-3 font-medium">Affected</th>
                        <th className="pb-3 font-medium">Avg Importance</th>
                        <th className="pb-3 font-medium">Priority Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orgReport.analytics.training_priorities.slice(0, 15).map((tp, index) => (
                        <tr key={tp.skill_id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-primary-600">#{index + 1}</td>
                          <td className="py-3 text-gray-900">{tp.skill_name}</td>
                          <td className="py-3"><span className="badge badge-gray">{tp.category}</span></td>
                          <td className="py-3 text-gray-900">{tp.total_gap}</td>
                          <td className="py-3 text-gray-600">{tp.affected_employees}</td>
                          <td className="py-3 text-gray-600">{tp.avg_importance}</td>
                          <td className="py-3 font-bold text-gray-900">{tp.priority_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Readiness by Role</h2>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={orgReport.analytics.role_readiness} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="target_role" type="category" width={150} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'avg readiness']} />
                      <Bar dataKey="avg_readiness" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}