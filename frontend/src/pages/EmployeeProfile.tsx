import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { employeeApi } from '../services/api';
import type { Employee } from '../types';

const categoryColors: Record<string, string> = {
  'Programming': 'bg-blue-100 text-blue-800',
  'Web': 'bg-purple-100 text-purple-800',
  'Data': 'bg-green-100 text-green-800',
  'Cloud & DevOps': 'bg-orange-100 text-orange-800',
  'Systems': 'bg-red-100 text-red-800',
  'Tools': 'bg-gray-100 text-gray-800',
  'Architecture': 'bg-indigo-100 text-indigo-800',
  'AI & ML': 'bg-pink-100 text-pink-800',
  'Cybersecurity': 'bg-yellow-100 text-yellow-800',
  'Design': 'bg-rose-100 text-rose-800',
  'QA': 'bg-teal-100 text-teal-800',
  'Management': 'bg-amber-100 text-amber-800',
  'Soft Skills': 'bg-lime-100 text-lime-800',
};

export function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const res = await employeeApi.getById(id);
        setEmployee(res.data);
      } catch (error) {
        console.error('Failed to fetch employee:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Employee not found</h2>
        <Link to="/employees" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const proficiencyLabels = ['None', 'Basic', 'Developing', 'Intermediate', 'Advanced', 'Expert'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/employees" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.employee_name}</h1>
            <p className="text-gray-600">{employee.employee_id} • {employee.current_role}</p>
          </div>
        </div>
        <Link to={`/analysis?employee=${employee.employee_id}`} className="btn-primary">
          Analyze Skills
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Skills</p>
                <p className="text-2xl font-bold text-gray-900">{employee.skill_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Proficiency</p>
                <p className="text-2xl font-bold text-gray-900">{employee.average_proficiency.toFixed(1)} / 5</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Current Role</p>
                <p className="text-lg font-medium text-gray-900">{employee.current_role}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="text-lg font-mono text-gray-900">{employee.employee_id}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700">Profile</h3>
              <p className="text-gray-600 mt-2 whitespace-pre-wrap">{employee.profile_text}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Skill Breakdown</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {employee.skills.map((skill) => (
                <div key={skill.skill_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${categoryColors[skill.category] || 'badge-gray'}`}>
                        {skill.category}
                      </span>
                      <span className="font-medium text-gray-900">{skill.skill_name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{skill.proficiency}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{proficiencyLabels[skill.proficiency]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">All Skills</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-100">
                <th className="pb-3 font-medium">Skill</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Proficiency</th>
                <th className="pb-3 font-medium">Level</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employee.skills.map((skill) => (
                <tr key={skill.skill_id} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{skill.skill_name}</td>
                  <td className="py-3">
                    <span className={`badge ${categoryColors[skill.category] || 'badge-gray'}`}>
                      {skill.category}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{skill.proficiency}/5</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{proficiencyLabels[skill.proficiency]}</td>
                  <td className="py-3 text-gray-600">{skill.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}