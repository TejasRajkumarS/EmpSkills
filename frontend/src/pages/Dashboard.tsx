import { useEffect, useState } from 'react';
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
import { dashboardApi } from '../services/api';
import { analyticsApi } from '../services/api';
import type { DashboardMetrics, OrganizationAnalytics } from '../types';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4'];

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, analyticsRes] = await Promise.all([
          dashboardApi.getMetrics(),
          analyticsApi.getOrganization(),
        ]);
        setMetrics(metricsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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
        { name: 'Minor', value: analytics.gap_distribution.minor, color: COLORS[4] },
        { name: 'Moderate', value: analytics.gap_distribution.moderate, color: COLORS[2] },
        { name: 'Major', value: analytics.gap_distribution.major, color: COLORS[3] },
      ]
    : [];

  const readinessChartData = analytics?.readiness_distribution
    ? [
        { name: 'Ready', value: analytics.readiness_distribution.ready, color: COLORS[1] },
        { name: 'Near Ready', value: analytics.readiness_distribution.near_ready, color: COLORS[4] },
        { name: 'Developing', value: analytics.readiness_distribution.developing, color: COLORS[2] },
        { name: 'Needs Dev', value: analytics.readiness_distribution.needs_significant_development, color: COLORS[3] },
      ]
    : [];

  const topGapsChartData = analytics?.top_skill_gaps.slice(0, 8).map((g, i) => ({
    name: g.skill_name.length > 15 ? g.skill_name.substring(0, 15) + '...' : g.skill_name,
    value: g.total_gap,
    color: COLORS[i % COLORS.length],
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Employee Skill Intelligence Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Employees</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metrics?.total_employees ?? 0}</p>
          </div>
        </div>
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Roles</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metrics?.total_roles ?? 0}</p>
          </div>
        </div>
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Skills</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metrics?.total_skills ?? 0}</p>
          </div>
        </div>
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Learning Resources</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metrics?.total_resources ?? 0}</p>
          </div>
        </div>
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Avg Readiness</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{metrics?.average_readiness ?? 0}%</p>
          </div>
        </div>
        <div className="card col-span-1">
          <div className="card-body">
            <p className="text-sm text-gray-600">Need Development</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{metrics?.employees_needing_development ?? 0}</p>
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
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gapChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'gaps']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
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
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {readinessChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'employees']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
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
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'total gap']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="value">
                  {topGapsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
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
                <YAxis dataKey="target_role" type="category" width={150} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'avg readiness']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="avg_readiness" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                <th className="pb-3 font-medium">Affected Employees</th>
                <th className="pb-3 font-medium">Avg Importance</th>
                <th className="pb-3 font-medium">Priority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.training_priorities.slice(0, 10).map((tp, index) => (
                <tr key={tp.skill_id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-primary-600">#{index + 1}</td>
                  <td className="py-3 text-gray-900">{tp.skill_name}</td>
                  <td className="py-3 text-gray-600">{tp.category}</td>
                  <td className="py-3 text-gray-900">{tp.total_gap}</td>
                  <td className="py-3 text-gray-600">{tp.affected_employees}</td>
                  <td className="py-3 text-gray-600">{tp.avg_importance}</td>
                  <td className="py-3 font-medium text-gray-900">{tp.priority_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}