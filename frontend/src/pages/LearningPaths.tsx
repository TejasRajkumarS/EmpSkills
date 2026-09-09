import { useEffect, useState } from 'react';
import { employeeApi, roleApi, analysisApi } from '../services/api';
import type { Employee, Role, AnalysisResponse } from '../types';

export function LearningPaths() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedEmployeeId || !selectedRoleId) return;
    setGenerating(true);
    try {
      const res = await analysisApi.analyze(selectedEmployeeId, selectedRoleId);
      setAnalysis(res.data);
    } catch (error) {
      console.error('Failed to generate learning path:', error);
      alert('Failed to generate learning path. Please try again.');
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

  const selectedEmployee = employees.find(e => e.employee_id === selectedEmployeeId);
  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
        <p className="text-gray-600 mt-1">Generate personalized learning paths for employees</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Generate Learning Path</h2>
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
            onClick={handleGenerate}
            disabled={!selectedEmployeeId || !selectedRoleId || generating}
            className="btn-primary"
          >
            {generating ? 'Generating...' : 'Generate Learning Path'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Learning Path</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedEmployee?.employee_name} → {selectedRole?.target_role}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analysis.learning_path.total_duration_hours} hours</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-sm text-gray-600">Total Steps</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analysis.learning_path.total_steps}</p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.learning_path.steps.map((step) => (
                  <div key={step.step_number} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                          {step.step_number}
                        </div>
                        <div className="flex-1">
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

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recommendations Summary</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={rec.resource_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{rec.resource_title}</p>
                        <p className="text-sm text-gray-500">
                          {rec.resource_type} • {rec.difficulty} • {rec.duration_hours}h
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Score: {rec.score.toFixed(2)}</span>
                      <span>{rec.skills_addressed.length} skills</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}