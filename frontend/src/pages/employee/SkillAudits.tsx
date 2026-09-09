import { useEffect, useState } from 'react';
import { employeeApi, roleApi, analysisApi } from '../../services/api';
import { CURRENT_EMPLOYEE_ID } from '../../context/AuthContext';
import type { Employee, Role, AnalysisResponse } from '../../types';

export function SkillAudits() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, roleRes] = await Promise.all([
          employeeApi.getById(CURRENT_EMPLOYEE_ID),
          roleApi.getAll(),
        ]);
        setCurrentEmployee(empRes.data);
        setRoles(roleRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedRoleId) return;
    setAnalyzing(true);
    try {
      const res = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, selectedRoleId);
      setAnalysis(res.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Audits</h1>
        <p className="text-gray-600 mt-1">Analyze your skills against target role requirements</p>
      </div>

      {currentEmployee && (
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">My Skill Profile</h2>
              <p className="text-sm text-gray-600">
                {currentEmployee.employee_name} • {currentEmployee.current_role} • {currentEmployee.skill_count} skills • avg {currentEmployee.average_proficiency.toFixed(1)}/5
              </p>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {currentEmployee.skills.map(skill => (
                <div key={skill.skill_id}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{skill.skill_name}</span>
                    <span className="text-sm text-gray-600">{skill.proficiency}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Run Skill Audit</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signed In As</label>
              <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 select">
                {currentEmployee ? `${currentEmployee.employee_name} (${currentEmployee.employee_id})` : 'Loading…'}
              </div>
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
            onClick={handleAnalyze}
            disabled={!selectedRoleId || analyzing}
            className="btn-primary"
          >
            {analyzing ? 'Analyzing...' : 'Run Skill Audit'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Audit Results</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentEmployee?.employee_name} → {selectedRole?.target_role}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Role Match</p>
                  <p className="text-4xl font-bold text-primary-600 mt-1">{analysis.readiness.role_match.match_percentage}%</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {analysis.readiness.role_match.matched_skills} matched •
                    {analysis.readiness.role_match.partial_skills} partial •
                    {analysis.readiness.role_match.missing_skills} missing
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Readiness Score</p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">{analysis.readiness.readiness_score}%</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    analysis.readiness.category === 'Ready' ? 'bg-green-100 text-green-800' :
                    analysis.readiness.category === 'Near Ready' ? 'bg-blue-100 text-blue-800' :
                    analysis.readiness.category === 'Developing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {analysis.readiness.category}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Explanation</p>
                  <p className="text-gray-900 mt-2">{analysis.readiness.explanation}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Gaps</h3>
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
                      {analysis.readiness.skill_gaps.map((gap) => (
                        <tr key={gap.skill_id} className="hover:bg-gray-50">
                          <td className="py-3 text-gray-900">{gap.skill_name}</td>
                          <td className="py-3">{gap.current_proficiency}/5</td>
                          <td className="py-3">{gap.required_proficiency}/5</td>
                          <td className="py-3 font-medium text-gray-900">{gap.gap > 0 ? `+${gap.gap}` : '0'}</td>
                          <td className="py-3">
                            <span className={`badge ${
                              gap.severity === 'No Gap' ? 'badge-success' :
                              gap.severity === 'Minor Gap' ? 'badge-warning' :
                              gap.severity === 'Moderate Gap' ? 'badge-info' :
                              'badge-danger'
                            }`}>
                              {gap.severity}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${
                              gap.status === 'Matched' ? 'badge-success' :
                              gap.status === 'Partial' ? 'badge-warning' :
                              'badge-danger'
                            }`}>
                              {gap.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}