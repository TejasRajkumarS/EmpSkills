import { useEffect, useState } from 'react';
import { employeeApi, roleApi, analysisApi } from '../../services/api';
import type { Employee, Role } from '../../types';

const readinessColors: Record<string, string> = {
  'Ready': 'badge-success',
  'Near Ready': 'badge-info',
  'Developing': 'badge-warning',
  'Needs Significant Development': 'badge-danger',
};

export function WorkforceStaffing() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [readinessData, setReadinessData] = useState<Record<string, { score: number; category: string; match: number }>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, roleRes] = await Promise.all([
          employeeApi.getAll(),
          roleApi.getAll(),
        ]);
        setEmployees(empRes.data);
        setRoles(roleRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAnalyzeRole = async () => {
    if (!selectedRoleId) return;
    setAnalyzing(true);
    try {
      const results: Record<string, { score: number; category: string; match: number }> = {};
      for (const emp of employees) {
        const res = await analysisApi.analyze(emp.employee_id, selectedRoleId);
        results[emp.employee_id] = {
          score: res.data.readiness.readiness_score,
          category: res.data.readiness.category,
          match: res.data.readiness.role_match.match_percentage,
        };
      }
      setReadinessData(results);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);

  const employeesWithReadiness = employees.map(emp => ({
    ...emp,
    readiness: readinessData[emp.employee_id] || null,
  })).sort((a, b) => {
    if (!a.readiness && !b.readiness) return 0;
    if (!a.readiness) return 1;
    if (!b.readiness) return -1;
    return b.readiness.score - a.readiness.score;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Workforce Staffing</h1>
        <p className="text-gray-600 mt-1">Find the best internal candidates for open roles</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Analyze Role Candidates</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="select"
              >
                <option value="">Select a role to staff...</option>
                {roles.map(r => (
                  <option key={r.target_role_id} value={r.target_role_id}>
                    {r.target_role} ({r.required_skills.length} skills)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyzeRole}
              disabled={!selectedRoleId || analyzing}
              className="btn-primary whitespace-nowrap"
            >
              {analyzing ? 'Analyzing All Employees...' : 'Analyze Candidates'}
            </button>
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Candidates for {selectedRole.target_role}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {employees.length} employees analyzed • {Object.keys(readinessData).length} with scores
                </p>
              </div>
            </div>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-100">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Current Role</th>
                  <th className="pb-3 font-medium">Readiness</th>
                  <th className="pb-3 font-medium">Role Match</th>
                  <th className="pb-3 font-medium">Skills</th>
                  <th className="pb-3 font-medium">Avg Proficiency</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeesWithReadiness.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{emp.employee_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{emp.employee_id}</div>
                    </td>
                    <td className="py-3 text-gray-600">{emp.current_role}</td>
                    <td className="py-3">
                      {emp.readiness ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${readinessColors[emp.readiness.category]}`}>
                              {emp.readiness.category}
                            </span>
                            <span className="font-bold text-gray-900">{emp.readiness.score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                emp.readiness.score >= 80 ? 'bg-green-500' :
                                emp.readiness.score >= 60 ? 'bg-blue-500' :
                                emp.readiness.score >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${emp.readiness.score}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Not analyzed</span>
                      )}
                    </td>
                    <td className="py-3">
                      {emp.readiness ? (
                        <span className="font-medium text-gray-900">{emp.readiness.match}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-900">{emp.skill_count ?? 0}</td>
                    <td className="py-3 text-gray-900">{(emp.average_proficiency ?? 0).toFixed(1)}</td>
                    <td className="py-3">
                      {emp.readiness && (
                        <button
                          onClick={() => window.open(`/reports/employee/${emp.employee_id}?role=${selectedRoleId}`, '_blank')}                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(readinessData).length === 0 && (
              <div className="text-center py-12 text-gray-600">
                Select a role and click "Analyze Candidates" to see readiness scores
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Role Requirements</h2>
        </div>
        <div className="card-body">
          {selectedRole ? (
            <div className="space-y-3">
              {selectedRole.required_skills.map((skill) => (
                <div key={skill.skill_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-gray">{skill.category}</span>
                    <span className="font-medium text-gray-900">{skill.skill_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Required: {skill.required_proficiency}/5</span>
                    <span>Weight: {skill.importance_weight}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Select a role to view requirements</p>
          )}
        </div>
      </div>
    </div>
  );
}