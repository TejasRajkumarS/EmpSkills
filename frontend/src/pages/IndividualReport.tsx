import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { roleApi, reportApi } from '../services/api';
import { CURRENT_EMPLOYEE_ID } from '../context/AuthContext';
import type { Role, EmployeeReport } from '../types';

const severityColors: Record<string, string> = {
  'No Gap': 'badge-success',
  'Minor Gap': 'badge-warning',
  'Moderate Gap': 'badge-info',
  'Major Gap': 'badge-danger',
};

const statusColors: Record<string, string> = {
  'Matched': 'badge-success',
  'Partial': 'badge-warning',
  'Missing': 'badge-danger',
};

const categoryColors: Record<string, string> = {
  'Ready': 'bg-green-100 text-green-800',
  'Near Ready': 'bg-blue-100 text-blue-800',
  'Developing': 'bg-yellow-100 text-yellow-800',
  'Needs Significant Development': 'bg-red-100 text-red-800',
};

export function IndividualReport() {
  const { employeeId: paramEmployeeId } = useParams<{ employeeId?: string }>();
  const [searchParams] = useSearchParams();
  const employeeId = paramEmployeeId || CURRENT_EMPLOYEE_ID;
  const isSelfView = !paramEmployeeId;

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState(searchParams.get('role') || '');
  const [report, setReport] = useState<EmployeeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await roleApi.getAll();
        setRoles(res.data);
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    async function generate() {
      if (!selectedRoleId) return;
      setGenerating(true);
      setError('');
      try {
        const res = await reportApi.getEmployee(employeeId, selectedRoleId);
        setReport(res.data);
      } catch (err) {
        console.error('Failed to generate report:', err);
        setError('Failed to generate report. Please try again.');
        setReport(null);
      } finally {
        setGenerating(false);
      }
    }
    generate();
  }, [employeeId, selectedRoleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSelfView ? 'My Skill Report' : 'Individual Skill Report'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isSelfView
              ? 'Your complete skill audit, readiness and learning plan'
              : 'Employee skill audit, readiness and learning plan'}
          </p>
        </div>
        {report && (
          <button onClick={() => window.print()} className="btn-secondary whitespace-nowrap">
            Print / Export PDF
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
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
        </div>
      </div>

      {error && (
        <div className="card">
          <div className="card-body text-center text-red-600">{error}</div>
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent" />
        </div>
      )}

      {report && !generating && (
        <div className="space-y-6">
          {/* Report header */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {report.employee.employee_name}
                    <span className="text-gray-400 font-mono text-sm ml-2">{report.employee.employee_id}</span>
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {report.employee.current_role} → <span className="font-medium">{report.target_role.target_role}</span>
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryColors[report.readiness.category]}`}>
                  {report.readiness.category}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Role Match</p>
                  <p className="text-3xl font-bold text-primary-600 mt-1">{report.role_match.match_percentage}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {report.role_match.matched_skills} matched • {report.role_match.partial_skills} partial • {report.role_match.missing_skills} missing
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Readiness Score</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{report.readiness.readiness_score}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Learning Time</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{report.learning_path.total_duration_hours}h</p>
                  <p className="text-xs text-gray-500 mt-1">{report.learning_path.total_steps} steps</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Skills to Develop</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{report.skill_gaps.filter(g => g.gap > 0).length}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600">Readiness Explanation</p>
                <p className="text-gray-900 mt-1">{report.readiness.explanation}</p>
              </div>
            </div>
          </div>

          {/* Skill gaps */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Skill Gap Analysis</h2>
            </div>
            <div className="card-body overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b border-gray-100">
                    <th className="pb-3 font-medium">Skill</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Current</th>
                    <th className="pb-3 font-medium">Required</th>
                    <th className="pb-3 font-medium">Gap</th>
                    <th className="pb-3 font-medium">Severity</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.skill_gaps.map(gap => (
                    <tr key={gap.skill_id} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-900">{gap.skill_name}</td>
                      <td className="py-3"><span className="badge badge-gray">{gap.category}</span></td>
                      <td className="py-3">{gap.current_proficiency}/5</td>
                      <td className="py-3">{gap.required_proficiency}/5</td>
                      <td className="py-3 font-medium text-gray-900">{gap.gap > 0 ? `+${gap.gap}` : '0'}</td>
                      <td className="py-3">
                        <span className={`badge ${severityColors[gap.severity]}`}>{gap.severity}</span>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${statusColors[gap.status]}`}>{gap.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Learning path */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recommended Learning Path</h2>
            </div>
            <div className="card-body">
              {report.learning_path.steps.length > 0 ? (
                <div className="space-y-3">
                  {report.learning_path.steps.map(step => (
                    <div key={step.step_number} className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                        {step.step_number}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.resource_title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {step.resource_type} • {step.difficulty} • {step.duration_hours}h
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{step.reason}</p>
                      </div>
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {step.current_proficiency}/5 → {step.target_proficiency}/5
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-600 font-medium">No training needed — all role requirements are met.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
