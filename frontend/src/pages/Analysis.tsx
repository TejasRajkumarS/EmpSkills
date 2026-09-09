import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { employeeApi, roleApi, analysisApi } from '../services/api';
import type { Employee, Role, AnalysisResponse, SkillGap, Recommendation } from '../types';

const severityColors: Record<string, string> = {
  'No Gap': 'badge-success',
  'Minor Gap': 'badge-warning',
  'Moderate Gap': 'badge-info',
  'Major Gap': 'badge-danger',
};

const readinessColors: Record<string, string> = {
  'Ready': 'bg-green-100 text-green-800',
  'Near Ready': 'bg-blue-100 text-blue-800',
  'Developing': 'bg-yellow-100 text-yellow-800',
  'Needs Significant Development': 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  'Matched': 'badge-success',
  'Partial': 'badge-warning',
  'Missing': 'badge-danger',
};

export function Analysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get('employee') || '');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
        if (!selectedRoleId && roleRes.data.length > 0) {
          setSelectedRoleId(roleRes.data[0].target_role_id);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedEmployeeId || !selectedRoleId) return;
    setAnalyzing(true);
    try {
      const res = await analysisApi.analyze(selectedEmployeeId, selectedRoleId);
      setAnalysis(res.data);
      setSearchParams({ employee: selectedEmployeeId, role: selectedRoleId });
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

  const selectedEmployee = employees.find(e => e.employee_id === selectedEmployeeId);
  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Analysis</h1>
        <p className="text-gray-600 mt-1">Analyze employee skills against target role requirements</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Select Employee & Role</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            onClick={handleAnalyze}
            disabled={!selectedEmployeeId || !selectedRoleId || analyzing}
            className="btn-primary"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Skills'}
          </button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEmployee?.employee_name} → {selectedRole?.target_role}
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${readinessColors[analysis.readiness.category]}`}>
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
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Current</th>
                        <th className="pb-3 font-medium">Required</th>
                        <th className="pb-3 font-medium">Gap</th>
                        <th className="pb-3 font-medium">Importance</th>
                        <th className="pb-3 font-medium">Severity</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analysis.readiness.skill_gaps.map((gap: SkillGap) => (
                        <tr key={gap.skill_id} className="hover:bg-gray-50">
                          <td className="py-3 text-gray-900">{gap.skill_name}</td>
                          <td className="py-3">
                            <span className="badge badge-gray">{gap.category}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{gap.current_proficiency}/5</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-primary-600 h-1.5 rounded-full"
                                  style={{ width: `${(gap.current_proficiency / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{gap.required_proficiency}/5</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-gray-400 h-1.5 rounded-full"
                                  style={{ width: `${(gap.required_proficiency / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-medium text-gray-900">
                            {gap.gap > 0 ? `+${gap.gap}` : '0'}
                          </td>
                          <td className="py-3 text-gray-600">{gap.importance_weight}</td>
                          <td className="py-3">
                            <span className={`badge ${severityColors[gap.severity] || 'badge-gray'}`}>
                              {gap.severity}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${statusColors[gap.status] || 'badge-gray'}`}>
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

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Learning Recommendations</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {analysis.recommendations.map((rec: Recommendation) => (
                  <div key={rec.resource_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900">{rec.resource_title}</span>
                          <span className="badge badge-gray">{rec.resource_type}</span>
                          <span className="badge badge-gray">{rec.difficulty}</span>
                          <span className="text-sm text-gray-500">{rec.duration_hours}h</span>
                          <span className="text-sm font-medium text-primary-600">Score: {rec.score.toFixed(2)}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{rec.reason}</p>
                        {rec.skills_addressed.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Skills: {rec.skills_addressed.join(', ')}
                          </p>
                        )}
                        {rec.prerequisites.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Prerequisites: {rec.prerequisites.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.recommendations.length === 0 && (
                <p className="text-gray-600 text-center py-8">No recommendations found for the identified gaps.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Learning Path</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.learning_path.total_duration_hours} hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Steps</p>
                  <p className="text-2xl font-bold text-gray-900">{analysis.learning_path.total_steps}</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.learning_path.steps.map((step: any) => (
                  <div key={step.step_number} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                          {step.step_number}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{step.resource_title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {step.resource_type} • {step.difficulty} • {step.duration_hours}h
                          </p>
                          <p className="text-sm text-gray-600 mt-2">{step.reason}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {step.skills_addressed.map((skillId: string) => (
                              <span key={skillId} className="badge badge-gray text-xs">{skillId}</span>
                            ))}
                          </div>
                          {step.prerequisites.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Prerequisites: {step.prerequisites.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Current: {step.current_proficiency}/5</span>
                        <span>Target: {step.target_proficiency}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {analysis.learning_path.steps.length === 0 && (
                <p className="text-gray-600 text-center py-8">No learning path required - all skills meet requirements!</p>
              )}
            </div>
          </div>
        </>
      )}

      {!analysis && selectedEmployeeId && selectedRoleId && (
        <div className="card text-center py-12">
          <p className="text-gray-600">Click "Analyze Skills" to generate the skill gap analysis and learning recommendations.</p>
        </div>
      )}
    </div>
  );
}