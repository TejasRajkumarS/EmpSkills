import { useEffect, useState } from 'react';
import { employeeApi, roleApi, analysisApi } from '../../services/api';
import { CURRENT_EMPLOYEE_ID } from '../../context/AuthContext';
import type { Employee, Role, AnalysisResponse } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function RoleReadiness() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResponse>>({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

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

  const handleCheckRole = async (roleId: string) => {
    if (!roleId) return;
    setChecking(roleId);
    try {
      const res = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, roleId);
      setAnalyses(prev => ({ ...prev, [roleId]: res.data }));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setChecking(null);
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
        <h1 className="text-2xl font-bold text-gray-900">Role Readiness</h1>
        <p className="text-gray-600 mt-1">Check your readiness for different roles</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Signed In As</h2>
        </div>
        <div className="card-body">
          <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 select max-w-md">
            {currentEmployee ? `${currentEmployee.employee_name} (${currentEmployee.employee_id})` : 'Loading…'}
          </div>
        </div>
      </div>

      {currentEmployee && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Your Role Readiness</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-6">Click on a role to check your readiness score</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => {
                const analysis = analyses[role.target_role_id];
                return (
                  <div
                    key={role.target_role_id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                      analysis ? 'bg-gray-50 border-primary-200' : 'border-gray-200'
                    }`}
                    onClick={() => handleCheckRole(role.target_role_id)}
                  >
                    <h3 className="font-medium text-gray-900">{role.target_role}</h3>
                    <p className="text-sm text-gray-500 mt-1">{role.required_skills.length} required skills</p>

                    {analysis && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Readiness</span>
                          <span className={`font-bold ${
                            analysis.readiness.readiness_score >= 80 ? 'text-green-600' :
                            analysis.readiness.readiness_score >= 60 ? 'text-blue-600' :
                            analysis.readiness.readiness_score >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {analysis.readiness.readiness_score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              analysis.readiness.readiness_score >= 80 ? 'bg-green-500' :
                              analysis.readiness.readiness_score >= 60 ? 'bg-blue-500' :
                              analysis.readiness.readiness_score >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${analysis.readiness.readiness_score}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Match: {analysis.readiness.role_match.match_percentage}%</span>
                          <span className={`font-medium ${
                            analysis.readiness.category === 'Ready' ? 'text-green-600' :
                            analysis.readiness.category === 'Near Ready' ? 'text-blue-600' :
                            analysis.readiness.category === 'Developing' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {analysis.readiness.category}
                          </span>
                        </div>
                      </div>
                    )}

                    {!analysis && checking !== role.target_role_id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCheckRole(role.target_role_id); }}
                        className="mt-4 w-full btn-secondary text-sm"
                      >
                        Check Readiness
                      </button>
                    )}

                    {checking === role.target_role_id && (
                      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent mr-2" />
                        Analyzing...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {Object.keys(analyses).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Readiness Comparison</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Readiness Scores</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analyses).map(([roleId, a]) => ({
                    role: roles.find(r => r.target_role_id === roleId)?.target_role || roleId,
                    readiness: a.readiness.readiness_score,
                    match: a.readiness.role_match.match_percentage,
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="role" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="readiness" fill="#0ea5e9" name="Readiness" />
                    <Bar dataKey="match" fill="#22c55e" name="Role Match" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Skill Categories Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analyses).flatMap(([, a]) =>
                      a.readiness.skill_gaps.map(g => ({
                        category: g.category,
                        current: (g.current_proficiency / 5) * 100,
                        required: (g.required_proficiency / 5) * 100,
                      }))
                    )}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="current" fill="#0ea5e9" name="Your Proficiency" />
                    <Bar dataKey="required" fill="#22c55e" name="Required" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}