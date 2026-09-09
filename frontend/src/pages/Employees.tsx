import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../services/api';
import type { Employee } from '../types';

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState<'employee_id' | 'employee_name' | 'current_role' | 'skill_count' | 'average_proficiency'>('employee_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await employeeApi.getAll({ search, role: roleFilter, sort_by: sortBy, sort_order: sortOrder });
        setEmployees(res.data);
        const uniqueRoles = [...new Set(res.data.map(e => e.current_role))].sort();
        setRoles(uniqueRoles);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [search, roleFilter, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <span className="text-gray-400 ml-1">⇅</span>;
    return <span className="text-primary-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Browse and search employee skill profiles</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="select max-w-xs"
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('employee_id')}>
                  Employee <SortIcon field="employee_id" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('employee_name')}>
                  Name <SortIcon field="employee_name" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('current_role')}>
                  Current Role <SortIcon field="current_role" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('skill_count')}>
                  Skills <SortIcon field="skill_count" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('average_proficiency')}>
                  Avg Proficiency <SortIcon field="average_proficiency" />
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-900">{emp.employee_id}</td>
                  <td className="px-6 py-4 text-gray-900">{emp.employee_name}</td>
                  <td className="px-6 py-4 text-gray-600">{emp.current_role}</td>
                  <td className="px-6 py-4 text-gray-900">{emp.skill_count}</td>
                  <td className="px-6 py-4 text-gray-900">{emp.average_proficiency.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/employees/${emp.employee_id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="card-body text-center text-gray-600 py-12">
            No employees found matching your criteria.
          </div>
        )}
        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
          Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}