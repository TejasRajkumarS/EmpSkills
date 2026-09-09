import { useEffect, useMemo, useState } from 'react';
import { employeeApi, roleApi, skillApi, analysisApi, assignmentApi } from '../../services/api';
import type { Employee, Role, SkillAssignment, Skill, AnalysisResponse } from '../../types';

const readinessColors: Record<string, string> = {
  'Ready': 'badge-success',
  'Near Ready': 'badge-info',
  'Developing': 'badge-warning',
  'Needs Significant Development': 'badge-danger',
};

interface AssignTarget {
  employee: Employee;
}

export function WorkforceStaffing() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [readinessData, setReadinessData] = useState<Record<string, { score: number; category: string; match: number }>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [assignments, setAssignments] = useState<SkillAssignment[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<Map<string, string>>(new Map());
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [assignPathway, setAssignPathway] = useState<AnalysisResponse | null>(null);
  const [assignPathwayLoading, setAssignPathwayLoading] = useState(false);
  const [assignSkillId, setAssignSkillId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, roleRes] = await Promise.all([
          employeeApi.getAll(),
          roleApi.getAll(),
        ]);
        setEmployees(empRes.data);
        setRoles(roleRes.data);
        const [assignRes, skillRes] = await Promise.all([
          assignmentApi.getAll(),
          skillApi.getAll(),
        ]);
        setAssignments(assignRes.data);
        setSkillCatalog(new Map(skillRes.data.map((s: Skill) => [s.skill_id, s.skill_name])));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAnalyzeRole = async () => {
    if (!selectedRoleId) return;
    setAnalyzing(true);
    try {
      const results: Record<string, { score: number; category: string; match: number }> = {};
      for (const emp of employees) {
        const res = await analysisApi.analyze(emp.employee_id, selectedRoleId);
        results[emp.employee_id] = {
          score: res.data.readiness.readiness_score,
          category: res.data.readiness.category,
          match: res.data.readiness.role_match.match_percentage,
        };
      }
      setReadinessData(results);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);

  const employeesWithReadiness = employees.map(emp => ({
    ...emp,
    readiness: readinessData[emp.employee_id] || null,
  })).sort((a, b) => {
    if (!a.readiness && !b.readiness) return 0;
    if (!a.readiness) return 1;
    if (!b.readiness) return -1;
    return b.readiness.score - a.readiness.score;
  });

  const openAssignModal = (emp: Employee) => {
    setAssignTarget({ employee: emp });
    setAssignSkillId('');
    setAssignNote('');
    setAssignError('');
    setAssignPathway(null);
    if (!selectedRoleId) return;
    // Single source of truth: the employee's generated training pathway —
    // the exact data the Training Pathways page renders.
    setAssignPathwayLoading(true);
    analysisApi.analyze(emp.employee_id, selectedRoleId)
      .then(res => setAssignPathway(res.data))
      .catch(err => {
        console.error('Failed to compute pathway for assignment:', err);
        setAssignError('Could not compute this employee\'s training pathway.');
      })
      .finally(() => setAssignPathwayLoading(false));
  };

  const closeModal = () => setAssignTarget(null);

  const handleAssign = async () => {
    if (!assignTarget || !assignSkillId || !selectedRoleId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const res = await assignmentApi.create({
        employee_id: assignTarget.employee.employee_id,
        skill_id: assignSkillId,
        target_role_id: selectedRoleId,
        note: assignNote,
      });
      setAssignments(prev => [...prev, res.data]);
      setToast(`Skill audit assigned to ${assignTarget.employee.employee_name}`);
      setTimeout(() => setToast(''), 4000);
      closeModal();
    } catch (err: any) {
      console.error('Assignment failed:', err);
      setAssignError(err?.response?.data?.detail || 'Failed to create assignment. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const modalSkills = useMemo(() => {
    if (!assignPathway) return [];
    // Skills that appear in the employee's training pathway (i.e. skills the
    // learning catalog can actually develop), weakest gap first — identical
    // to what the Training Pathways timeline shows for this employee/role.
    const gapById = new Map(assignPathway.readiness.skill_gaps.map(g => [g.skill_id, g]));
    const seen = new Set<string>();
    const options = [];
    for (const step of assignPathway.learning_path.steps) {
      for (const skillId of step.skills_addressed) {
        if (seen.has(skillId)) continue;
        seen.add(skillId);
        const gap = gapById.get(skillId);
        if (gap && gap.current_proficiency < gap.required_proficiency) {
          options.push({
            skill_id: skillId,
            skill_name: skillCatalog.get(skillId) || gap.skill_name,
            current: gap.current_proficiency,
            required: gap.required_proficiency,
          });
        }
      }
    }
    return options.sort((a, b) => (b.required - b.current) - (a.required - a.current));
  }, [assignPathway, skillCatalog]);

  const pendingByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assignments) {
      if (a.status === 'pending') map.set(a.employee_id, (map.get(a.employee_id) || 0) + 1);
    }
    return map;
  }, [assignments]);

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
        <h1 className="text-2xl font-bold text-gray-900">Workforce Staffing</h1>
        <p className="text-gray-600 mt-1">Find the best internal candidates for open roles and assign skill audits</p>
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Analyze Role Candidates</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="select"
              >
                <option value="">Select a role to staff...</option>
                {roles.map(r => (
                  <option key={r.target_role_id} value={r.target_role_id}>
                    {r.target_role} ({r.required_skills.length} skills)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyzeRole}
              disabled={!selectedRoleId || analyzing}
              className="btn-primary whitespace-nowrap"
            >
              {analyzing ? 'Analyzing All Employees...' : 'Analyze Candidates'}
            </button>
          </div>
        </div>
      </div>

      {selectedRole && (
        <div className="card">
          <div className="card-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Candidates for {selectedRole.target_role}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {employees.length} employees analyzed • {Object.keys(readinessData).length} with scores
                </p>
              </div>
            </div>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-100">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Current Role</th>
                  <th className="pb-3 font-medium">Readiness</th>
                  <th className="pb-3 font-medium">Role Match</th>
                  <th className="pb-3 font-medium">Skills</th>
                  <th className="pb-3 font-medium">Avg Proficiency</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeesWithReadiness.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{emp.employee_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{emp.employee_id}</div>
                      {(pendingByEmployee.get(emp.employee_id) || 0) > 0 && (
                        <span className="badge badge-warning mt-1">
                          {pendingByEmployee.get(emp.employee_id)} audit{(pendingByEmployee.get(emp.employee_id) || 0) > 1 ? 's' : ''} pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-600">{emp.current_role}</td>
                    <td className="py-3">
                      {emp.readiness ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${readinessColors[emp.readiness.category]}`}>
                              {emp.readiness.category}
                            </span>
                            <span className="font-bold text-gray-900">{emp.readiness.score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                emp.readiness.score >= 80 ? 'bg-green-500' :
                                emp.readiness.score >= 60 ? 'bg-blue-500' :
                                emp.readiness.score >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${emp.readiness.score}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Not analyzed</span>
                      )}
                    </td>
                    <td className="py-3">
                      {emp.readiness ? (
                        <span className="font-medium text-gray-900">{emp.readiness.match}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-900">{emp.skill_count ?? 0}</td>
                    <td className="py-3 text-gray-900">{(emp.average_proficiency ?? 0).toFixed(1)}</td>
                    <td className="py-3">
                      {emp.readiness && (
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <button
                            onClick={() => openAssignModal(emp)}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            Assign Audit
                          </button>
                          <button
                            onClick={() => window.open(`/reports/employee/${emp.employee_id}?role=${selectedRoleId}`, '_blank')}
                            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                          >
                            View Report
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(readinessData).length === 0 && (
              <div className="text-center py-12 text-gray-600">
                Select a role and click "Analyze Candidates" to see readiness scores
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Role Requirements</h2>
        </div>
        <div className="card-body">
          {selectedRole ? (
            <div className="space-y-3">
              {selectedRole.required_skills.map((skill) => (
                <div key={skill.skill_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="badge badge-gray">{skill.category}</span>
                    <span className="font-medium text-gray-900">{skill.skill_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Required: {skill.required_proficiency}/5</span>
                    <span>Weight: {skill.importance_weight}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Select a role to view requirements</p>
          )}
        </div>
      </div>

      {/* ── Assign Skill Audit modal ─────────────────────────── */}
      {assignTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-gray-100 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Assign Skill Audit</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {assignTarget.employee.employee_name} ({assignTarget.employee.employee_id})
                {selectedRole ? ` → ${selectedRole.target_role}` : ''}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill to Audit</label>
                {assignPathwayLoading ? (
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    Computing the employee's training pathway…
                  </div>
                ) : modalSkills.length > 0 ? (
                  <>
                    <select
                      value={assignSkillId}
                      onChange={(e) => setAssignSkillId(e.target.value)}
                      className="select"
                    >
                      <option value="">Select a skill...</option>
                      {modalSkills.map(s => (
                        <option key={s.skill_id} value={s.skill_id}>
                          {s.skill_name} — current L{s.current}, required L{s.required}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      Matches the employee's Training Pathway — weakest gap first.
                    </p>
                  </>
                ) : (
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    No trainable gaps — this employee's pathway for this role is empty (all requirements met or no resources cover the remaining gaps).
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note for the employee (optional)</label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Please review this skill before the Q3 staffing round."
                  className="input resize-none"
                />
              </div>
              {assignError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  {assignError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeModal} className="btn-secondary">Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!assignSkillId || assigning}
                className="btn-primary"
              >
                {assigning ? 'Assigning…' : 'Assign Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
