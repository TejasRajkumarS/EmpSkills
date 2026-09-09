import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { roleApi, skillApi, resourceApi, analysisApi, progressApi } from '../../services/api';
import { CURRENT_EMPLOYEE_ID } from '../../context/AuthContext';
import type { AnalysisResponse, LearningPathStep, LearningProgress, Role, Skill, LearningResource, CompletionResponse } from '../../types';

// ─────────────────────────────────────────────────────────────
// Small presentational helpers
// ─────────────────────────────────────────────────────────────

const resourceTypeIcons: Record<string, string> = {
  Course: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  Book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  Certification: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  Workshop: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  Video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
};

function resourceIconPath(resourceType: string): string {
  const key = Object.keys(resourceTypeIcons).find(k =>
    resourceType.toLowerCase().includes(k.toLowerCase())
  );
  return resourceTypeIcons[key || 'Course'];
}

function SkillIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

/**
 * Merge completed steps from the previous pathway with the freshly generated
 * steps so completed milestones stay visible (spec: "Do NOT remove completed
 * steps"). Fresh steps win when a resource appears in both.
 */
function mergeSteps(prev: LearningPathStep[], fresh: LearningPathStep[], completedIds: Set<string>): LearningPathStep[] {
  const freshIds = new Set(fresh.map(s => s.resource_id));
  const kept = prev.filter(s => completedIds.has(s.resource_id) && !freshIds.has(s.resource_id));
  const seen = new Set<string>();
  return [...kept, ...fresh].filter(s => {
    if (seen.has(s.resource_id)) return false;
    seen.add(s.resource_id);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Skeleton card (resembles the real timeline card)
// ─────────────────────────────────────────────────────────────

function SkeletonCard({ cardClass }: { cardClass: string }) {
  return (
    <div className={cardClass}>
      <div className="card animate-pulse">
        <div className="card-body space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-40 bg-gray-100 rounded" />
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-5/6 bg-gray-100 rounded" />
          </div>
          <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export function TrainingPathways() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<Map<string, string>>(new Map());
  const [resourceCatalog, setResourceCatalog] = useState<Map<string, string>>(new Map());
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [steps, setSteps] = useState<LearningPathStep[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completingAll, setCompletingAll] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const stepsRef = useRef<LearningPathStep[]>([]);

  const loadProgress = useCallback(async (): Promise<LearningProgress | null> => {
    try {
      const res = await progressApi.get(CURRENT_EMPLOYEE_ID);
      setProgress(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to load progress:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const [roleRes, skillRes, resourceRes] = await Promise.all([
          roleApi.getAll(),
          skillApi.getAll(),
          resourceApi.getAll(),
        ]);
        setRoles(roleRes.data);
        setSkillCatalog(new Map(skillRes.data.map((s: Skill) => [s.skill_id, s.skill_name])));
        setResourceCatalog(new Map(resourceRes.data.map((r: LearningResource) => [r.resource_id, r.resource_title])));
        await loadProgress();
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError('Unable to load your training pathway.');
      } finally {
        setPageLoading(false);
      }
    }
    fetchInitial();
  }, [loadProgress]);

  const generatePathway = useCallback(async (roleId: string) => {
    if (!roleId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, roleId);
      setAnalysis(res.data);
      stepsRef.current = res.data.learning_path.steps;
      setSteps(res.data.learning_path.steps);
    } catch (err) {
      console.error('Failed to generate pathway:', err);
      setError('Unable to load your training pathway.');
      setAnalysis(null);
      setSteps([]);
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleComplete = async (resourceId: string) => {
    setCompletingId(resourceId);
    try {
      const res = await progressApi.complete(CURRENT_EMPLOYEE_ID, resourceId, selectedRoleId);
      const data: CompletionResponse = res.data;
      setToast(data.message);
      setTimeout(() => setToast(''), 4000);

      const freshProgress = await loadProgress();
      const completedIds = new Set(freshProgress?.completed_resources.map(c => c.resource_id) || []);

      // Re-run analysis: refreshes readiness/gaps/duration, then merge so
      // completed milestones remain on the timeline
      if (selectedRoleId) {
        const refreshed = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, selectedRoleId);
        setAnalysis(refreshed.data);
        const merged = mergeSteps(stepsRef.current, refreshed.data.learning_path.steps, completedIds);
        stepsRef.current = merged;
        setSteps(merged);
      }
    } catch (err: any) {
      console.error('Failed to mark complete:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Please try again.';
      setError(`Failed to mark course as complete: ${detail}`);
    } finally {
      setCompletingId(null);
    }
  };

  const handleCompleteAll = async () => {
    if (!selectedRoleId) return;
    setCompletingAll(true);
    try {
      const res = await progressApi.completeAll(CURRENT_EMPLOYEE_ID, selectedRoleId);
      setToast(res.data.message);
      setTimeout(() => setToast(''), 4000);
      await loadProgress();
      const refreshed = await analysisApi.analyze(CURRENT_EMPLOYEE_ID, selectedRoleId);
      setAnalysis(refreshed.data);
      stepsRef.current = refreshed.data.learning_path.steps;
      setSteps(refreshed.data.learning_path.steps);
    } catch (err: any) {
      console.error('Failed to mark all complete:', err);
      const detail = err?.response?.data?.detail || err?.message || 'Please try again.';
      setError(`Failed to mark courses as complete: ${detail}`);
    } finally {
      setCompletingAll(false);
    }
  };

  const selectedRole = roles.find(r => r.target_role_id === selectedRoleId);
  const completedIds = useMemo(
    () => new Set(progress?.completed_resources.map(c => c.resource_id) || []),
    [progress]
  );

  const pathwayCompleted = steps.filter(s => completedIds.has(s.resource_id)).length;
  const pathwayProgressPct = steps.length > 0 ? Math.round((pathwayCompleted / steps.length) * 100) : 0;
  const gapCount = analysis ? analysis.readiness.skill_gaps.filter(g => g.gap > 0).length : 0;

  const skillName = useCallback(
    (id: string) => skillCatalog.get(id) || id,
    [skillCatalog]
  );

  const resourceTitle = useCallback(
    (id: string) => resourceCatalog.get(id) || id,
    [resourceCatalog]
  );

  const nextIncompleteIndex = steps.findIndex(s => !completedIds.has(s.resource_id));

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse"><div className="card-body h-20" /></div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gray-200 md:-translate-x-1/2" />
          <div className="space-y-8">
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]"><SkeletonCard cardClass="md:col-start-3" /></div>
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]"><SkeletonCard cardClass="md:col-start-1" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Pathway</h1>
        <p className="text-gray-600 mt-1">
          Your personalized learning journey to close the skill gaps for your target role.
        </p>
      </div>

      {/* ── Compact summary (all values from backend) ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Role</p>
            <p className="text-lg font-bold text-gray-900 mt-1 truncate">
              {analysis?.target_role || selectedRole?.target_role || '—'}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Readiness</p>
            <p className="text-lg font-bold text-primary-600 mt-1">
              {analysis ? `${analysis.readiness.readiness_score}%` : '—'}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Skill Gaps</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{analysis ? gapCount : '—'}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Time</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {analysis ? `${analysis.learning_path.total_duration_hours} hrs` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Learning progress ───────────────────────────────── */}
      {steps.length > 0 && (
        <div className="card">
          <div className="card-body py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Learning Progress</span>
              <span className="text-gray-600">{pathwayCompleted} / {steps.length} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${pathwayProgressPct === 100 ? 'bg-green-500' : 'bg-primary-600'}`}
                style={{ width: `${pathwayProgressPct}%` }}
              />
            </div>
            <p className={`text-xs mt-1 text-right font-medium ${pathwayProgressPct === 100 ? 'text-green-600' : 'text-primary-600'}`}>
              {pathwayProgressPct}%
            </p>
          </div>
        </div>
      )}

      {/* ── Role selection ──────────────────────────────────── */}
      <div className="card">
        <div className="card-body py-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  setAnalysis(null);
                  setSteps([]);
                  stepsRef.current = [];
                }}
                className="select"
              >
                <option value="">Select a target role...</option>
                {roles.map(r => (
                  <option key={r.target_role_id} value={r.target_role_id}>{r.target_role}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => generatePathway(selectedRoleId)}
                disabled={!selectedRoleId || generating}
                className="btn-primary whitespace-nowrap"
              >
                {generating ? 'Analyzing…' : 'Analyze My Skills'}
              </button>
              {steps.length > 0 && !error && (
                <button
                  onClick={handleCompleteAll}
                  disabled={completingAll || generating}
                  className="btn-secondary whitespace-nowrap"
                >
                  {completingAll ? 'Marking All…' : 'Mark All as Completed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
          {toast}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────── */}
      {error && !generating && (
        <div className="card">
          <div className="card-body text-center py-12">
            <svg className="mx-auto h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-3 text-lg font-medium text-gray-900">{error}</h3>
            <p className="text-sm text-gray-500 mt-1">Please try again in a moment.</p>
            <button
              onClick={() => (selectedRoleId ? generatePathway(selectedRoleId) : window.location.reload())}
              className="btn-primary mt-5"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state (no pathway yet) ────────────────────── */}
      {!error && !generating && !analysis && (
        <div className="card">
          <div className="card-body text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No Training Pathway Yet</h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Run Skill Analysis to identify your skill gaps and generate your personalized learning pathway.
            </p>
            <button
              onClick={() => generatePathway(selectedRoleId)}
              disabled={!selectedRoleId}
              className="btn-primary mt-6"
            >
              Analyze My Skills
            </button>
          </div>
        </div>
      )}

      {/* ── Skeleton while generating ───────────────────────── */}
      {generating && (
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gray-200 md:-translate-x-1/2" />
          <div className="space-y-8">
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]"><SkeletonCard cardClass="md:col-start-3" /></div>
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]"><SkeletonCard cardClass="md:col-start-1" /></div>
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]"><SkeletonCard cardClass="md:col-start-3" /></div>
          </div>
        </div>
      )}

      {/* ── Alternating timeline ────────────────────────────── */}
      {!error && !generating && steps.length > 0 && (
        <div className="relative">
          {/* Continuous vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gray-200 md:-translate-x-1/2" aria-hidden />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const done = completedIds.has(step.resource_id);
              const isRight = index % 2 === 0; // Step 1 → RIGHT, Step 2 → LEFT …
              const gapLevels = Math.max(0, step.target_proficiency - step.current_proficiency);
              const primarySkillId = step.skills_addressed[0] ?? '';
              const primarySkillName = skillName(primarySkillId);
              const extraSkills = step.skills_addressed.slice(1);
              const isNext = index === nextIncompleteIndex;

              const node = (
                <span
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border-2 shadow-sm transition-colors ${
                    done
                      ? 'bg-green-500 border-green-500 text-white'
                      : isNext
                        ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  {done ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
              );

              const card = (
                <div className={`card h-full transition-colors ${done ? 'border-green-200 bg-green-50/40' : ''}`}>
                  <div className="card-body">
                    {/* Skill gap header */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Skill Gap:</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <h3 className={`text-lg font-bold ${done ? 'text-green-800' : 'text-gray-900'}`}>
                          {primarySkillName}
                        </h3>
                        {gapLevels > 0 ? (
                          <span className="badge badge-warning">Δ {gapLevels} level{gapLevels > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="badge badge-success">Closed</span>
                        )}
                        {done && <span className="badge badge-success">Completed</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Current: L{step.current_proficiency}
                        <span className="mx-1 text-gray-300">→</span>
                        Required: L{step.target_proficiency}
                      </p>
                      {extraSkills.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          + {extraSkills.map(skillName).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Nested resource panel */}
                    <div className={`rounded-lg border p-4 mt-4 ${done ? 'bg-white/70 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={resourceIconPath(step.resource_type)} />
                          </svg>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{step.resource_title}</p>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mt-2">
                            <dt className="text-gray-400">Type</dt>
                            <dd className="text-gray-700">{step.resource_type}</dd>
                            <dt className="text-gray-400">Difficulty</dt>
                            <dd className="text-gray-700">{step.difficulty}</dd>
                            <dt className="text-gray-400">Duration</dt>
                            <dd className="text-gray-700">{step.duration_hours} hrs</dd>
                            <dt className="text-gray-400">Skills</dt>
                            <dd className="text-gray-700">{step.skills_addressed.map(skillName).join(', ')}</dd>
                            {step.prerequisites.length > 0 && (
                              <>
                                <dt className="text-gray-400">Prerequisites</dt>
                                <dd className="text-gray-700">{step.prerequisites.map(resourceTitle).join(', ')}</dd>
                              </>
                            )}
                          </dl>
                          <span className="badge badge-info mt-3">L&amp;D APPROVED</span>
                        </div>
                      </div>
                    </div>

                    {/* AI recommendation match — body comes from the backend reason */}
                    <div className="border border-primary-100 bg-primary-50/50 rounded-lg p-3 mt-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                        <SkillIcon /> AI Recommendation Match
                      </p>
                      <p className="text-sm text-gray-700 mt-1.5">{step.reason}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(step.resource_title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Open Resource <span aria-hidden>↗</span>
                      </a>
                      <button
                        onClick={() => handleComplete(step.resource_id)}
                        disabled={done || completingId === step.resource_id}
                        className={done ? 'btn-secondary opacity-60 cursor-default' : 'btn-primary'}
                      >
                        {done
                          ? 'Completed ✓'
                          : completingId === step.resource_id
                            ? 'Saving…'
                            : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>
                </div>
              );

              return (
                <div key={step.resource_id} className="relative pl-12 md:pl-0 md:grid md:grid-cols-[1fr_72px_1fr]">
                  {/* Connector from line to card (desktop) */}
                  <div
                    aria-hidden
                    className={`hidden md:block absolute top-[18px] h-px w-9 bg-gray-300 ${isRight ? 'left-1/2' : 'right-1/2'}`}
                  />
                  {/* Node + step label */}
                  <div className="absolute left-6 -translate-x-1/2 top-1 z-10 flex items-center gap-2 md:static md:translate-x-0 md:flex-col md:gap-1.5 md:col-start-2 md:row-start-1 md:justify-self-center">
                    {node}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Step {index + 1}
                    </span>
                  </div>
                  {/* Card alternates around the center line */}
                  <div className={`md:row-start-1 ${isRight ? 'md:col-start-3' : 'md:col-start-1'}`}>
                    {card}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Journey terminus */}
          <div className="relative pl-12 md:pl-0 mt-10">
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 top-1.5 z-10">
              <span className={`flex items-center justify-center w-9 h-9 rounded-full border-2 shadow-sm ${
                pathwayProgressPct === 100
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {pathwayProgressPct === 100 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )}
              </span>
            </div>
            <div className={`hidden md:block absolute top-[18px] h-px w-9 ${pathwayProgressPct === 100 ? 'bg-green-300' : 'bg-gray-300'} right-1/2`} />
            <div className="md:grid md:grid-cols-[1fr_72px_1fr]">
              <div className="ml-3 md:ml-0 md:col-start-1 md:row-start-1 md:text-right">
                <p className={`text-sm font-semibold ${pathwayProgressPct === 100 ? 'text-green-700' : 'text-gray-500'}`}>
                  {pathwayProgressPct === 100 ? 'Role Ready 🎉' : 'Role Ready'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Complete all steps to reach full readiness</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── No training needed state ────────────────────────── */}
      {!error && !generating && analysis && steps.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-16">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">No Training Needed!</h3>
            <p className="text-gray-600 mt-1">You already meet all requirements for this role.</p>
          </div>
        </div>
      )}
    </div>
  );
}
