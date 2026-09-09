import { useEffect, useState } from 'react';
import { roleApi } from '../services/api';
import type { Role, RoleSkillRequirement } from '../types';

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

export function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await roleApi.getAll();
        setRoles(res.data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredRoles = roles.filter(r =>
    r.target_role.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Roles & Skills</h1>
          <p className="text-gray-600 mt-1">Explore target roles and their skill requirements</p>
        </div>
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div key={role.target_role_id} className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">{role.target_role}</h3>
              <p className="text-sm text-gray-600 mt-1">{role.required_skills.length} required skills</p>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {role.required_skills.map((skill: RoleSkillRequirement) => (
                  <div key={skill.skill_id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${categoryColors[skill.category] || 'badge-gray'}`}>
                          {skill.category}
                        </span>
                        <span className="font-medium text-gray-900">{skill.skill_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Req: {skill.required_proficiency}/5</span>
                        <span className="text-gray-500">Weight: {skill.importance_weight}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-primary-600 h-1.5 rounded-full"
                        style={{ width: `${(skill.required_proficiency / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No roles found matching your search.</p>
        </div>
      )}
    </div>
  );
}