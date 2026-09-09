import { useEffect, useState } from 'react';
import { analyticsApi, employeeApi, roleApi, analysisApi } from '../../services/api';
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
import type { OrganizationAnalytics, Employee, Role } from '../../types';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export function HRAnalyticsPortal() {
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleReadinessDetails, setRoleReadinessDetails] = useState<Record<string, { avg: number; distribution: Record<string, number> }>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, empRes, roleRes] = await Promise.all([
          analyticsApi.getOrganization(),
          employeeApi.getAll(),
          roleApi.getAll(),
        ]);
        setAnalytics(analyticsRes.data);
        setEmployees(empRes.data);
        setRoles(roleRes.data);

        // Fetch detailed readiness for each role
        for (const role of roleRes.data) {
          const readinessScores: number[] = [];
          for (const emp of empRes.data) {
            const res = await analysisApi.analyze(emp.employee_id, role.target_role_id);
            readinessScores.push(res.data.readiness.readiness_score);
          }
          const avg = readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length;
          const dist = {
            'Ready': readinessScores.filter(s => s >= 80).length,
            'Near Ready': readinessScores.filter(s => s >= 60 && s < 80).length,
            'Developing': readinessScores.filter(s => s >= 40 && s < 60).length,
            'Needs Significant Development': readinessScores.filter(s => s < 40).length,
          };
          setRoleReadinessDetails(prev => ({
            ...prev,
            [role.target_role_id]: { avg, distribution: dist },
          }));
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const gapChartData = analytics?.gap_distribution
    ? [
        { name: 'No Gap', value: analytics.gap_distribution.no_gap, color: COLORS[1] },
        { name: 'Minor', value: analytics.gap_distribution.minor, color: COLORS[2] },
        { name: 'Moderate', value: analytics.gap_distribution.moderate, color: COLORS[3] },
        { name: 'Major', value: analytics.gap_distribution.major, color: COLORS[0] },
      ]
    : [];

  const readinessChartData = analytics?.readiness_distribution
    ? [
        { name: 'Ready', value: analytics.readiness_distribution.ready, color: COLORS[1] },
        { name: 'Near Ready', value: analytics.readiness_distribution.near_ready, color: COLORS[2] },
        { name: 'Developing', value: analytics.readiness_distribution.developing, color: COLORS[3] },
        { name: 'Needs Dev', value: analytics.readiness_distribution.needs_significant_development, color: COLORS[0] },
      ]
    : [];

  const topGapsChartData = analytics?.top_skill_gaps.slice(0, 10).map((g, i) => ({
    name: g.skill_name.length > 15 ? g.skill_name.substring(0, 15) + '...' : g.skill_name,
    value: g.total_gap,
    color: COLORS[i % COLORS.length],
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Enterprise Analytics Portal</h1>
        <p className="text-gray-600 mt-1">Organizational skill intelligence and workforce analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.employees_analyzed ?? 0}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Avg Readiness</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.average_readiness ?? 0}%</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Top Skill Gaps</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.top_skill_gaps.length ?? 0}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Training Priorities</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{analytics?.training_priorities.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Skill Gap Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gapChartData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gapChartData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
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
                  data={readinessChartData}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {readinessChartData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'employees']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Top Organizational Skill Gaps</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topGapsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'total gap']} />
                <Bar dataKey="value">
                  {topGapsChartData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Readiness by Role</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics?.role_readiness || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="target_role" type="category" width={160} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'avg readiness']} />
                <Bar dataKey="avg_readiness" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {analytics?.training_priorities.slice(0, 15).map((tp, index) => (
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
            <h2 className="text-lg font-semibold text-gray-900">Readiness Distribution by Role</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={roles.map(r => {
                  const detail = roleReadinessDetails[r.target_role_id];
                  return {
                    role: r.target_role,
                    Ready: detail?.distribution['Ready'] || 0,
                    'Near Ready': detail?.distribution['Near Ready'] || 0,
                    Developing: detail?.distribution['Developing'] || 0,
                    'Needs Dev': detail?.distribution['Needs Significant Development'] || 0,
                  };
                })}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="role" type="category" width={160} />
                <Tooltip />
                <Bar dataKey="Ready" fill="#22c55e" name="Ready" stackId="a" />
                <Bar dataKey="Near Ready" fill="#0ea5e9" name="Near Ready" stackId="a" />
                <Bar dataKey="Developing" fill="#eab308" name="Developing" stackId="a" />
                <Bar dataKey="Needs Dev" fill="#ef4444" name="Needs Dev" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Role Readiness Detail</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-100">
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Avg Readiness</th>
                <th className="pb-3 font-medium">Employees</th>
                <th className="pb-3 font-medium">Ready</th>
                <th className="pb-3 font-medium">Near Ready</th>
                <th className="pb-3 font-medium">Developing</th>
                <th className="pb-3 font-medium">Needs Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map(role => {
                const detail = roleReadinessDetails[role.target_role_id];
                return (
                  <tr key={role.target_role_id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{role.target_role}</td>
                    <td className="py-3 font-bold text-gray-900">{detail?.avg.toFixed(1) ?? 0}%</td>
                    <td className="py-3 text-gray-600">{employees.length}</td>
                    <td className="py-3"><span className="badge badge-success">{detail?.distribution['Ready'] ?? 0}</span></td>
                    <td className="py-3"><span className="badge badge-info">{detail?.distribution['Near Ready'] ?? 0}</span></td>
                    <td className="py-3"><span className="badge badge-warning">{detail?.distribution['Developing'] ?? 0}</span></td>
                    <td className="py-3"><span className="badge badge-danger">{detail?.distribution['Needs Significant Development'] ?? 0}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}