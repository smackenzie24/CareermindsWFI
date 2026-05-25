import { useMemo, useState } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Star, AlertTriangle, Clock, ChevronRight, MapPin, BarChart3, Filter } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { getAllManagerMetrics, type ManagerMetrics } from '../../data/managerData';
import { DEPT_COLORS, type Department } from '../../data/mockData';
import { DEPARTMENTS } from '../../data/mockData';
import { ManagerDetail } from './ManagerDetail';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { MostExpensiveToLose } from '../MostExpensiveToLose';

type SortKey = 'readiness' | 'stalled' | 'teamSize' | 'completionRate';

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' }) {
  if (trend === 'up') return <TrendingUp size={13} className="text-emerald-500" />;
  if (trend === 'down') return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-gray-400" />;
}

function effectivenessScore(m: ManagerMetrics): number {
  // Composite 0–100: weights readiness (40%), completion (30%), penalise stalls (30%)
  const stallPenalty = m.reports.length > 0 ? (m.stalledCount / m.reports.length) * 100 : 0;
  return Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - stallPenalty) * 0.3);
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-sky-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-100';
  if (score >= 55) return 'bg-sky-50 border-sky-100';
  if (score >= 40) return 'bg-amber-50 border-amber-100';
  return 'bg-red-50 border-red-100';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'High Impact';
  if (score >= 55) return 'Effective';
  if (score >= 40) return 'Developing';
  return 'Needs Support';
}

function ManagerCard({ metrics, onClick }: { metrics: ManagerMetrics; onClick: () => void }) {
  const score = effectivenessScore(metrics);
  const { manager, avgReadiness, avgFrameworkCompletion, stalledCount, nearReadyCount, reports, trendLabel, trend } = metrics;
  const deptColor = DEPT_COLORS[manager.department];
  const initials = manager.name.split(' ').map(n => n[0]).join('');

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-2xl border border-gray-200 p-5 group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: deptColor }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{manager.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{manager.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded-lg border px-2.5 py-1 text-center ${scoreBg(score)}`}>
            <p className={`text-base font-black leading-none ${scoreColor(score)}`}>{score}</p>
            <p className={`text-[9px] font-semibold mt-0.5 ${scoreColor(score)}`}>{scoreLabel(score)}</p>
          </div>
          <ChevronRight size={15} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><MapPin size={9} />{manager.location}</span>
        <span className="flex items-center gap-1"><Users size={9} />{reports.length} reports</span>
        <span className="flex items-center gap-1"><Clock size={9} />{manager.tenure}m in role</span>
        <span className="ml-auto flex items-center gap-1"><TrendIcon trend={trend} />{trendLabel}</span>
      </div>

      {/* Key metrics bar row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className="text-base font-black text-gray-900">{avgReadiness}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Avg readiness</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <p className={`text-base font-black ${nearReadyCount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{nearReadyCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Near ready</p>
        </div>
        <div className={`rounded-xl p-2.5 text-center ${stalledCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-base font-black ${stalledCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stalledCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Stalled</p>
        </div>
      </div>

      {/* Completion bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500 font-medium">Framework completion</span>
          <span className="text-[10px] font-bold text-gray-700">{avgFrameworkCompletion}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-700"
            style={{ width: `${avgFrameworkCompletion}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function OrgStat({ label, value, sub, icon, color }: { label: string; value: string | number; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

interface Props {
  initialManagerId?: string;
  selectedManager?: ManagerMetrics | null;
  onSelectManager?: (m: ManagerMetrics | null) => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToHeatmap?: () => void;
  onNavigateToPipeline?: (dept?: Department) => void;
}

export function ManagerEffectiveness({ initialManagerId, selectedManager: selectedManagerProp, onSelectManager, onNavigateToGapReport, onNavigateToHeatmap, onNavigateToPipeline }: Props) {
  const allMetrics = useMemo(() => getAllManagerMetrics(), []);
  const [internalManager, setInternalManager] = useState<ManagerMetrics | null>(
    () => initialManagerId ? (allMetrics.find(m => m.manager.id === initialManagerId) ?? null) : null
  );
  const selectedManager = selectedManagerProp !== undefined ? selectedManagerProp : internalManager;
  const setSelectedManager = (m: ManagerMetrics | null) => {
    setInternalManager(m);
    onSelectManager?.(m);
  };
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('readiness');

  const orgStats = useMemo(() => {
    const withReports = allMetrics.filter(m => m.reports.length > 0);
    const n = withReports.length;
    const avgScore = n > 0 ? Math.round(withReports.reduce((s, m) => s + effectivenessScore(m), 0) / n) : 0;
    const highImpact = withReports.filter(m => effectivenessScore(m) >= 75).length;
    const needsSupport = withReports.filter(m => effectivenessScore(m) < 40).length;
    const totalStalled = withReports.reduce((s, m) => s + m.stalledCount, 0);
    const totalNearReady = withReports.reduce((s, m) => s + m.nearReadyCount, 0);
    return { total: n, avgScore, highImpact, needsSupport, totalStalled, totalNearReady };
  }, [allMetrics]);

  const filtered = useMemo(() => {
    let result = allMetrics.filter(m => m.reports.length > 0);
    if (deptFilter !== 'all') result = result.filter(m => m.manager.department === deptFilter);
    switch (sortKey) {
      case 'readiness': return [...result].sort((a, b) => effectivenessScore(b) - effectivenessScore(a));
      case 'stalled': return [...result].sort((a, b) => b.stalledCount - a.stalledCount);
      case 'teamSize': return [...result].sort((a, b) => b.reports.length - a.reports.length);
      case 'completionRate': return [...result].sort((a, b) => b.avgFrameworkCompletion - a.avgFrameworkCompletion);
    }
  }, [allMetrics, deptFilter, sortKey]);

  function buildExportContent(): string {
    const lines: string[] = [
      'MANAGER EFFECTIVENESS — ACME CORP',
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `Managers tracked: ${orgStats.total}`,
      `High impact (75+): ${orgStats.highImpact}`,
      `Reports near promotion: ${orgStats.totalNearReady}`,
      `Stalled reports: ${orgStats.totalStalled}`,
      `Avg score: ${orgStats.avgScore}`,
      '',
      'MANAGER BREAKDOWN',
      '-'.repeat(50),
    ];
    for (const m of allMetrics.filter(m => m.reports.length > 0)) {
      const score = Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - (m.stalledCount / m.reports.length) * 100) * 0.3);
      lines.push(`${m.manager.name} (${m.manager.title})`);
      lines.push(`  Score: ${score} | Team: ${m.reports.length} reports | Near-ready: ${m.nearReadyCount} | Stalled: ${m.stalledCount}`);
      lines.push(`  Avg readiness: ${m.avgReadiness}% | Framework completion: ${m.avgFrameworkCompletion}%`);
      lines.push('');
    }
    return lines.join('\n');
  }

  if (selectedManager) {
    return (
      <ManagerDetail
        metrics={selectedManager}
        onBack={() => setSelectedManager(null)}
        onNavigateToGapReport={onNavigateToGapReport}
        onNavigateToHeatmap={onNavigateToHeatmap}
        onNavigateToPipeline={onNavigateToPipeline}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Workforce Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900">Manager Effectiveness</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Aggregate progression velocity and framework completion rates by manager. Identify whose teams are growing fastest — and who needs coaching support.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons title="Manager Effectiveness" buildContent={buildExportContent} />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Acme Corp
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4" data-tour="managers-org-stats">
          <OrgStat
            label="Managers tracked"
            value={orgStats.total}
            sub="with active direct reports"
            icon={<BarChart3 size={14} className="text-gray-400" />}
            color="text-gray-900"
          />
          <OrgStat
            label="High impact managers"
            value={orgStats.highImpact}
            sub="score ≥ 75 — teams growing fast"
            icon={<Star size={14} className="text-emerald-400" />}
            color="text-emerald-600"
          />
          <OrgStat
            label="Reports near promotion"
            value={orgStats.totalNearReady}
            sub="across all manager teams"
            icon={<TrendingUp size={14} className="text-sky-400" />}
            color="text-sky-600"
          />
          <OrgStat
            label="Stalled reports"
            value={orgStats.totalStalled}
            sub="24m+ in level, <50% ready"
            icon={<AlertTriangle size={14} className="text-red-400" />}
            color="text-red-600"
          />
        </div>
      </header>

      {/* Score legend */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-6">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Effectiveness score:</span>
        {[
          { label: 'High Impact', range: '75–100', color: 'bg-emerald-500' },
          { label: 'Effective', range: '55–74', color: 'bg-sky-500' },
          { label: 'Developing', range: '40–54', color: 'bg-amber-400' },
          { label: 'Needs Support', range: '<40', color: 'bg-red-400' },
        ].map(({ label, range, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-600 font-medium">{label}</span>
            <span className="text-xs text-gray-400">{range}</span>
          </div>
        ))}
        <p className="text-xs text-gray-400 ml-auto">Score = readiness (40%) + framework completion (30%) + stall penalty (30%)</p>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Department:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDeptFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${deptFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${deptFilter === dept ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort by:</span>
          {([
            ['readiness', 'Effectiveness score'],
            ['completionRate', 'Framework completion'],
            ['stalled', 'Stalled reports'],
            ['teamSize', 'Team size'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${sortKey === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <main className="flex-1 overflow-auto p-8">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No managers match the current filter</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-tour="managers-card-grid">
              {filtered.map(metrics => (
                <ManagerCard
                  key={metrics.manager.id}
                  metrics={metrics}
                  onClick={() => setSelectedManager(metrics)}
                />
              ))}
            </div>
            {/* Keystone upsell — manager coaching */}
            <MostExpensiveToLose limit={5} showMethodology className="mt-8" />
            <UpsellBanner variant="manager-coaching" className="mt-8" />
            <FeedbackBanner context="Manager Effectiveness" className="mt-4" />
          </>
        )}
      </main>
    </div>
  );
}
