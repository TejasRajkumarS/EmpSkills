import { useCallback, useEffect, useState } from 'react';
import { employeeApi, roleApi, analysisApi, progressApi } from '../../services/api';
import { CURRENT_EMPLOYEE_ID } from '../../context/AuthContext';
import type { Employee, Role, AnalysisResponse, LearningPathStep, LearningProgress, CompletionResponse } from '../../types';

export function TrainingPathways() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadProgress = useCallback(async () => {
    try {
      const res = await progressApi.get(CURRENT_EMPLOYEE_ID);
      setProgress(res.data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, roleRes] = await Promise.all([
          employeeApi.getById(CURRENT_EMPLOYEE_ID),
          roleApi.getAll(),
        ]);
        setCurrentEmployee(empRes.data);
        setRoles(roleRes.data);
        await loadProgress();
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [loadProgress]);

  const handleGenerate = async () => {
    if (!selectedRoleId) return;
    setGenerating(true);
    try {
      const res = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, selectedRoleId);
      setAnalysis(res.data);
    } catch (error) {
      console.error('Failed to generate pathway:', error);
      alert('Failed to generate training pathway. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (resourceId: string) => {
    setCompletingId(resourceId);
    try {
      const res = await progressApi.complete(CURRENT_EMPLOYEE_ID, resourceId, selectedRoleId);
      const data: CompletionResponse = res.data;
      setToast(data.message);
      setTimeout(() => setToast(''), 4000);
      await loadProgress();

      // Refresh the analysis so readiness/gaps reflect the new skills
      if (selectedRoleId) {
        const refreshed = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, selectedRoleId);
        setAnalysis(refreshed.data);
        const empRes = await employeeApi.getById(CURRENT_EMPLOYEE_ID);
        setCurrentEmployee(empRes.data);
      }
    } catch (error) {
      console.error('Failed to mark complete:', error);
      alert('Failed to mark course as complete. Please try again.');
    } finally {
      setCompletingId(null);
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
  const completedIds = new Set(progress?.completed_resources.map(c => c.resource_id) || []);

  const difficultyColors: Record<string, string> = {
    'Beginner': 'bg-green-100 text-green-800',
    'Intermediate': 'bg-yellow-100 text-yellow-800',
    'Advanced': 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Pathways</h1>
          <p className="text-gray-600 mt-1">Generate personalized learning paths for your career growth</p>
        </div>
        {progress && progress.completed_count > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="bg-green-50 text-green-700 rounded-lg px-4 py-2">
              <span className="font-bold">{progress.completed_count}</span> courses completed
            </div>
            <div className="bg-primary-50 text-primary-700 rounded-lg px-4 py-2">
              <span className="font-bold">{progress.total_learning_hours.toFixed(1)}h</span> learned
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Create Training Pathway</h2>
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
            onClick={handleGenerate}
            disabled={!selectedRoleId || generating}
            className="btn-primary"
          >
            {generating ? 'Generating Pathway...' : 'Generate Training Pathway'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Training Pathway</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentEmployee?.employee_name} → {selectedRole?.target_role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Readiness</p>
                  <p className="text-2xl font-bold text-primary-600">{analysis.readiness.readiness_score}%</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Total Duration</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analysis.learning_path.total_duration_hours} hours</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Learning Steps</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analysis.learning_path.total_steps}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">Skills to Develop</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {new Set(analysis.learning_path.steps.flatMap(s => s.skills_addressed)).size}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {analysis.learning_path.steps.map((step: LearningPathStep) => {
                  const done = completedIds.has(step.resource_id);
                  return (
                    <div
                      key={step.step_number}
                      className={`border rounded-lg p-4 ${done ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${done ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600'}`}>
                            {done ? '✓' : step.step_number}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-medium ${done ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                              {step.resource_title}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`badge ${difficultyColors[step.difficulty] || 'badge-gray'}`}>
                                {step.difficulty}
                              </span>
                              <span className="badge badge-gray">{step.resource_type}</span>
                              <span className="badge badge-gray">{step.duration_hours}h</span>
                              {done && <span className="badge badge-success">Completed</span>}
                            </div>
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
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Current: {step.current_proficiency}/5</span>
                            <span>Target: {step.target_proficiency}/5</span>
                          </div>
                          <button
                            onClick={() => handleComplete(step.resource_id)}
                            disabled={done || completingId === step.resource_id}
                            className={done ? 'btn-secondary opacity-60 cursor-default' : 'btn-primary'}
                          >
                            {done
                              ? 'Completed ✓'
                              : completingId === step.resource_id
                                ? 'Saving...'
                                : 'Mark as Complete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {analysis.learning_path.steps.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No Training Needed!</h3>
                  <p className="mt-1 text-gray-600">You already meet all requirements for this role.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recommended Resources</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analysis.recommendations.map((rec, index) => {
                  const done = completedIds.has(rec.resource_id);
                  return (
                    <div key={rec.resource_id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg ${done ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${done ? 'bg-green-500 text-white' : 'bg-primary-100 text-primary-600'}`}>
                          {done ? '✓' : index + 1}
                        </span>
                        <div>
                          <p className={`font-medium ${done ? 'text-green-800' : 'text-gray-900'}`}>{rec.resource_title}</p>
                          <p className="text-sm text-gray-500">
                            {rec.resource_type} • {rec.difficulty} • {rec.duration_hours}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Score: {rec.score.toFixed(2)}</span>
                        <span>{rec.skills_addressed.length} skills</span>
                        <button
                          onClick={() => handleComplete(rec.resource_id)}
                          disabled={done || completingId === rec.resource_id}
                          className={done ? 'btn-secondary opacity-60 cursor-default text-sm' : 'btn-secondary text-sm'}
                        >
                          {done ? 'Completed ✓' : completingId === rec.resource_id ? 'Saving...' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {analysis.recommendations.length === 0 && (
                <p className="text-gray-600 text-center py-8">No additional recommendations.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
