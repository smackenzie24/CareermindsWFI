import { useMemo } from 'react';
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, AlertTriangle, Star,
  Clock, MapPin, CheckCircle2, XCircle, ChevronRight, Minus, ExternalLink,
} from 'lucide-react';
import { type ManagerMetrics } from '../../data/managerData';
import { DEPT_COLORS, type Department } from '../../data/mockData';
import { getReadinessTier, TIER_CONFIG, type ReadinessResult } from '../../data/promotionData';

function effectivenessScore(m: ManagerMetrics): number {
  const stallPenalty = m.reports.length > 0 ? (m.stalledCount / m.reports.length) * 100 : 0;
  return Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - stallPenalty) * 0.3);
}

function scoreColor(score: number) {
  if (score >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500' };
  if (score >= 55) return { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', bar: 'bg-sky-500' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-400' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-400' };
}

function scoreLabel(score: number) {
  if (score >= 75) return 'High Impact';
  if (score >= 55) return 'Effective';
  if (score >= 40) return 'Developing';
  return 'Needs Support';
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' }) {
  if (trend === 'up') return <TrendingUp size={13} className="text-emerald-500" />;
  if (trend === 'down') return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-gray-400" />;
}

function ReportRow({ result }: { result: ReadinessResult }) {
  const tier = getReadinessTier(result.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = result.person.name.split(' ').map(n => n[0]).join('');
  const nextTitle = result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel;
  const isStalled = result.person.tenure > 24 && result.readinessPct < 50;

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-800 truncate">{result.person.name}</p>
          {isStalled && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">Stalled</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{result.person.team}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={8} />{result.person.location}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} />{result.person.tenure}m</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2 justify-end mb-1">
          <span className="text-[10px] text-gray-500">→ {nextTitle}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <div className="w-20 bg-white/70 rounded-full h-1.5 overflow-hidden border border-black/5">
            <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${result.readinessPct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-600">{result.readinessPct}%</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">{result.criteriaMet}/{result.criteriaTotal} criteria</p>
      </div>
    </div>
  );
}

interface Props {
  metrics: ManagerMetrics;
  onBack: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToHeatmap?: () => void;
  onNavigateToPipeline?: (dept?: Department) => void;
}

export function ManagerDetail({ metrics, onBack, onNavigateToGapReport, onNavigateToHeatmap, onNavigateToPipeline }: Props) {
  const {
    manager, reports, readinessResults,
    avgReadiness, nearReadyCount, progressingCount,
    avgTenure, avgFrameworkCompletion, blockedCount,
    topBlockingSkill, topBlockingSkillCount,
    promotionReadyCount, stalledCount,
    strongSkillCount, totalSkillCriteria,
    trend, trendLabel,
  } = metrics;

  const score = effectivenessScore(metrics);
  const sc = scoreColor(score);
  const deptColor = DEPT_COLORS[manager.department];
  const initials = manager.name.split(' ').map(n => n[0]).join('');

  // Sort reports: near-ready first, then by readiness desc
  const sortedResults = useMemo(
    () => [...readinessResults].sort((a, b) => b.readinessPct - a.readinessPct),
    [readinessResults]
  );

  // Top blocking skills ranked
  const blockingRanked = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of readinessResults) {
      for (const gap of r.gapSkills) {
        map.set(gap.skillName, (map.get(gap.skillName) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [readinessResults]);

  // Skill strength: avg team rating vs required per criterion
  const skillStrengths = useMemo(() => {
    const criteriaMap = new Map<string, { name: string; required: number; actuals: number[] }>();
    for (const r of readinessResults) {
      const allCriteria = [...r.metSkills.map(s => ({ ...s, actualRating: r.person.skills[s.skillId] ?? 0 })), ...r.gapSkills];
      for (const c of allCriteria) {
        if (!criteriaMap.has(c.skillId)) {
          criteriaMap.set(c.skillId, { name: c.skillName, required: c.requiredRating, actuals: [] });
        }
        criteriaMap.get(c.skillId)!.actuals.push(r.person.skills[c.skillId] ?? 0);
      }
    }
    return Array.from(criteriaMap.values())
      .map(({ name, required, actuals }) => {
        const avg = actuals.length > 0 ? actuals.reduce((s, a) => s + a, 0) / actuals.length : 0;
        return { name, required, avg: parseFloat(avg.toFixed(1)), gap: Math.max(0, required - avg) };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [readinessResults]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0" data-tour="managers-detail-header">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            All managers
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{manager.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: deptColor }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{manager.name}</h1>
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{manager.title}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={11} />{manager.location}</span>
                <span className="flex items-center gap-1"><Users size={11} />{reports.length} direct reports</span>
                <span className="flex items-center gap-1"><Clock size={11} />{manager.tenure}m in role</span>
                <span className="flex items-center gap-1"
                  style={{ color: deptColor }}>
                  {manager.department}
                </span>
                <span className="flex items-center gap-1 ml-1"><TrendIcon trend={trend} />{trendLabel}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Teams: {manager.teams.join(', ')}</p>
            </div>
          </div>

          {/* Score badge */}
          <div className={`rounded-2xl border ${sc.bg} ${sc.border} px-5 py-3 text-center min-w-[100px]`}>
            <p className={`text-4xl font-black leading-none ${sc.text}`}>{score}</p>
            <p className={`text-xs font-bold mt-1 ${sc.text}`}>{scoreLabel(score)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Effectiveness score</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* KPI grid */}
          <div className="grid grid-cols-4 gap-4" data-tour="managers-detail-kpis">
            {[
              { label: 'Avg readiness', value: `${avgReadiness}%`, sub: 'across all reports', color: 'text-gray-900', icon: <TrendingUp size={14} className="text-sky-400" /> },
              { label: 'Near ready (≥90%)', value: nearReadyCount, sub: `${progressingCount} more progressing`, color: 'text-emerald-600', icon: <Star size={14} className="text-emerald-400" /> },
              { label: 'Stalled reports', value: stalledCount, sub: '24m+ in level, <50% ready', color: stalledCount > 0 ? 'text-red-600' : 'text-gray-400', icon: <AlertTriangle size={14} className={stalledCount > 0 ? 'text-red-400' : 'text-gray-300'} /> },
              { label: 'Framework completion', value: `${avgFrameworkCompletion}%`, sub: `${strongSkillCount}/${totalSkillCriteria} skills at target`, color: 'text-gray-900', icon: <CheckCircle2 size={14} className="text-sky-400" /> },
            ].map(({ label, value, sub, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Avg tenure in level</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{avgTenure}m</p>
              <p className="text-xs text-gray-400 mt-1">{avgTenure > 20 ? 'Above average — check blockers' : 'Healthy velocity'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-500">Promotion ready</span>
              </div>
              <p className="text-3xl font-black text-emerald-600">{promotionReadyCount}</p>
              <p className="text-xs text-gray-400 mt-1">≥90% ready + ≥18m tenure</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs text-gray-500">Reports with gaps</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{blockedCount}</p>
              <p className="text-xs text-gray-400 mt-1">have ≥1 blocking skill gap</p>
            </div>
          </div>

          {/* Two column: blocking skills + skill strengths */}
          <div className="grid grid-cols-2 gap-6" data-tour="managers-detail-skills">
            {/* Blocking skills */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle size={14} className="text-red-400" />
                <h3 className="text-sm font-bold text-gray-900">Top blocking skills</h3>
                <span className="text-xs text-gray-400 ml-auto">{blockingRanked.length} skills with gaps</span>
              </div>
              {blockingRanked.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No blocking skill gaps — excellent!</p>
              ) : (
                <div className="space-y-3">
                  {blockingRanked.map(([skill, count]) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{skill}</span>
                        <span className="text-xs text-gray-500">{count} of {readinessResults.length} reports</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all"
                          style={{ width: `${(count / readinessResults.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {topBlockingSkill !== '—' && (
                <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700">Coaching priority</p>
                  <p className="text-sm font-bold text-red-800 mt-0.5">{topBlockingSkill}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">Blocking {topBlockingSkillCount} of {readinessResults.length} reports</p>
                  <div className="flex gap-2 mt-2">
                    {onNavigateToGapReport && (
                      <button
                        onClick={() => onNavigateToGapReport(manager.department)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={9} />Dept gap report
                      </button>
                    )}
                    {onNavigateToHeatmap && (
                      <button
                        onClick={onNavigateToHeatmap}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={9} />Skills heatmap
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skill strengths vs gaps */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 size={14} className="text-sky-400" />
                <h3 className="text-sm font-bold text-gray-900">Skill profile — team avg vs target</h3>
              </div>
              <div className="space-y-2.5">
                {skillStrengths.slice(0, 8).map(({ name, required, avg, gap }) => {
                  const atTarget = avg >= required;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-700 truncate pr-2">{name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {atTarget
                            ? <CheckCircle2 size={11} className="text-emerald-500" />
                            : <XCircle size={11} className="text-red-400" />
                          }
                          <span className={`text-[11px] font-bold ${atTarget ? 'text-emerald-600' : 'text-red-500'}`}>
                            {avg.toFixed(1)} / {required}
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${atTarget ? 'bg-emerald-400' : 'bg-red-400'} transition-all`}
                          style={{ width: `${Math.min((avg / required) * 100, 100)}%` }}
                        />
                        {/* Target marker */}
                        <div className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50" style={{ left: '100%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Direct reports */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="managers-detail-reports">
            <div className="flex items-center gap-3 mb-5">
              <Users size={14} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Direct reports</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reports.length}</span>
              {stalledCount > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full ml-auto">
                  {stalledCount} stalled
                </span>
              )}
            </div>
            {sortedResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No promotion pipeline data for this team</p>
            ) : (
              <div className="space-y-2">
                {sortedResults.map(result => (
                  <ReportRow key={result.person.id} result={result} />
                ))}
              </div>
            )}
          </div>

          {/* Coaching suggestions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="managers-detail-coaching">
            <div className="flex items-center gap-2 mb-5">
              <ChevronRight size={14} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Coaching suggestions</h3>
            </div>
            <div className="space-y-2">
              {promotionReadyCount > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <Star size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-800">{promotionReadyCount} report{promotionReadyCount !== 1 ? 's' : ''} ready to promote</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Review these individuals for formal promotion consideration in the next cycle.</p>
                    {onNavigateToPipeline && (
                      <button
                        onClick={() => onNavigateToPipeline(manager.department)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        <ExternalLink size={9} />View in promotion pipeline
                      </button>
                    )}
                  </div>
                </div>
              )}
              {stalledCount > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">{stalledCount} report{stalledCount !== 1 ? 's' : ''} showing stall signals</p>
                    <p className="text-[11px] text-red-600 mt-0.5">High tenure + low readiness. Schedule 1:1 coaching conversations and review blockers.</p>
                  </div>
                </div>
              )}
              {topBlockingSkill !== '—' && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Team-wide gap: {topBlockingSkill}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Blocking {topBlockingSkillCount} reports. Consider a team workshop or shared learning resource.</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-100">
                <TrendingUp size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-sky-800">Framework completion at {avgFrameworkCompletion}%</p>
                  <p className="text-[11px] text-sky-600 mt-0.5">
                    {avgFrameworkCompletion >= 70
                      ? 'Strong coverage — keep reinforcing career conversations.'
                      : 'Below 70%. Prioritise structured development plans with each report.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
