import { useMemo, useState, useCallback } from 'react';
import { ChevronRight, Users, TrendingDown, AlertTriangle, CalendarCheck, RefreshCw } from 'lucide-react';
import { SKILLS_DATA, DEPARTMENTS, DEPT_COLORS, type Department } from '../data/mockData';
import { PEOPLE } from '../data/promotionData';
import { FeedbackBanner } from './feedback/FeedbackBanner';
import { ExportButtons } from './ExportButtons';

const DEPT_SALARIES: Record<Department, number> = {
  Engineering: 128000,
  Product: 118000,
  Design: 102000,
  Data: 122000,
  Marketing: 88000,
  Sales: 95000,
  'People Ops': 90000,
};

const CHECKIN_CUTOFF = new Date('2026-04-29');
function computeOrgSummary() {
  const deptCounts = new Map<Department, number>();
  for (const dept of DEPARTMENTS) deptCounts.set(dept, 0);
  for (const p of PEOPLE) deptCounts.set(p.department, (deptCounts.get(p.department) ?? 0) + 1);

  let totalCost = 0;
  for (const p of PEOPLE) totalCost += DEPT_SALARIES[p.department];

  const headcount = PEOPLE.length;
  const avgSalary = Math.round(totalCost / headcount);
  const deptBreakdown = DEPARTMENTS
    .map(d => ({ dept: d, count: deptCounts.get(d) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const checkedIn = PEOPLE.filter(p =>
    Math.floor((CHECKIN_CUTOFF.getTime() - new Date(p.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)) <= 30
  ).length;
  const checkInCoverage = Math.round((checkedIn / headcount) * 100);

  return { headcount, totalCost, avgSalary, deptBreakdown, checkInCoverage };
}

const ORG_SUMMARY = computeOrgSummary();

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}


interface DeptSummary {
  department: Department;
  color: string;
  headcount: number;
  belowTarget: number;
  belowTargetPct: number;
  medianGap: number;
  criticalSkills: number;
  topGapSkill: string;
  topGapPct: number;
  skillCount: number;
  // skill counts by severity bucket
  skillsGood: number;
  skillsDeveloping: number;
  skillsRisk: number;
  skillsCritical: number;
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getSeverity(pct: number): 'critical' | 'risk' | 'developing' | 'good' {
  if (pct >= 65) return 'critical';
  if (pct >= 45) return 'risk';
  if (pct >= 25) return 'developing';
  return 'good';
}

const SEVERITY_CONFIG = {
  critical:   { label: 'Critical',   badge: 'bg-red-100 text-red-700',     bar: 'bg-red-500',    tile: 'bg-red-50',     tileColor: 'text-red-600'    },
  risk:       { label: 'At Risk',    badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400', tile: 'bg-orange-50',  tileColor: 'text-orange-600' },
  developing: { label: 'Developing', badge: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-400',  tile: 'bg-amber-50',   tileColor: 'text-amber-700'  },
  good:       { label: 'On Track',   badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400', tile: 'bg-emerald-50', tileColor: 'text-emerald-600' },
};

interface Props {
  onSelectDepartment: (dept: Department) => void;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DepartmentOverview({ onSelectDepartment }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setLastRefreshed(new Date());
      setRefreshing(false);
    }, 600);
  }, []);

  function buildExportContent(): string {
    const lines: string[] = [
      'SKILLS GAP HEATMAP — ACME CORP',
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
    ];
    const totalHead = summaries.reduce((s, d) => s + d.headcount, 0);
    const totalBelow = summaries.reduce((s, d) => s + d.belowTarget, 0);
    const pct = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
    lines.push('ORG SUMMARY');
    lines.push(`Total headcount: ${totalHead}`);
    lines.push(`Below target: ${pct}% (${totalBelow} people)`);
    lines.push('');
    lines.push('DEPARTMENT BREAKDOWN');
    lines.push('-'.repeat(50));
    for (const d of summaries) {
      lines.push(`${d.department}`);
      lines.push(`  Headcount: ${d.headcount}  |  Below target: ${d.belowTargetPct}%`);
      lines.push(`  Critical skills: ${d.criticalSkills}  |  Median gap: ${d.medianGap}`);
      if (d.topGapSkill) lines.push(`  Biggest gap: ${d.topGapSkill} (${d.topGapPct}%)`);
      lines.push('');
    }
    return lines.join('\n');
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const summaries = useMemo((): DeptSummary[] => {
    void refreshKey;
    return DEPARTMENTS.map(dept => {
      const entries = SKILLS_DATA.filter(e => e.department === dept);
      const skills = Array.from(new Set(entries.map(e => e.skill)));

      const headcount = entries.reduce((s, e) => s + e.headcount, 0);
      const belowTarget = entries.reduce((s, e) => s + e.belowTarget, 0);
      const belowTargetPct = headcount > 0 ? Math.round((belowTarget / headcount) * 100) : 0;

      // Median gap across skill-level gaps (weighted by headcount)
      const gapValues: number[] = [];
      for (const skill of skills) {
        const skillEntries = entries.filter(e => e.skill === skill);
        const sh = skillEntries.reduce((s, e) => s + e.headcount, 0);
        const sa = skillEntries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / sh;
        const exp = skillEntries[0].expectedLevel;
        gapValues.push(Math.max(0, exp - sa));
      }
      const medianGap = Math.round(medianOf(gapValues) * 10) / 10;

      // Per-skill severity buckets
      let criticalSkills = 0;
      let topGapSkill = '';
      let topGapPct = 0;
      let skillsGood = 0, skillsDeveloping = 0, skillsRisk = 0, skillsCritical = 0;
      for (const skill of skills) {
        const skillEntries = entries.filter(e => e.skill === skill);
        const sh = skillEntries.reduce((s, e) => s + e.headcount, 0);
        const sb = skillEntries.reduce((s, e) => s + e.belowTarget, 0);
        const pct = sh > 0 ? Math.round((sb / sh) * 100) : 0;
        const sev = getSeverity(pct);
        if (sev === 'critical') { criticalSkills++; skillsCritical++; }
        else if (sev === 'risk') skillsRisk++;
        else if (sev === 'developing') skillsDeveloping++;
        else skillsGood++;
        if (pct > topGapPct) { topGapPct = pct; topGapSkill = skill; }
      }

      return {
        department: dept,
        color: DEPT_COLORS[dept],
        headcount,
        belowTarget,
        belowTargetPct,
        medianGap,
        criticalSkills,
        topGapSkill,
        topGapPct,
        skillCount: skills.length,
        skillsGood,
        skillsDeveloping,
        skillsRisk,
        skillsCritical,
      };
    });
  }, []);

  const orgStats = useMemo(() => {
    const totalHead = summaries.reduce((s, d) => s + d.headcount, 0);
    const totalBelow = summaries.reduce((s, d) => s + d.belowTarget, 0);
    const pct = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
    const critical = summaries.reduce((s, d) => s + d.criticalSkills, 0);
    const medGap = Math.round(medianOf(summaries.map(d => d.medianGap)) * 10) / 10;
    return { totalHead, pct, critical, medGap };
  }, [summaries]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Workforce Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Skills Gap Heatmap</h1>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons title="Skills Gap Heatmap" buildContent={buildExportContent} />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Acme Corp
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                Updated {formatTimestamp(lastRefreshed)}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-60"
                title="Refresh data"
              >
                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Org-level summary strip */}
        <div className="mt-5 grid grid-cols-4 gap-4" data-tour="heatmap-header-stats">
          {[
            { label: 'Total headcount', value: orgStats.totalHead, sub: 'across all depts', color: 'text-gray-900', icon: <Users size={14} className="text-gray-400" /> },
            { label: 'Below target (org)', value: `${orgStats.pct}%`, sub: 'of workforce', color: 'text-red-600', icon: <TrendingDown size={14} className="text-red-400" /> },
            { label: 'Skills below target', value: orgStats.critical, sub: '60%+ of team below expected', color: 'text-orange-600', icon: <AlertTriangle size={14} className="text-orange-400" /> },
            { label: 'Check-in Coverage', value: `${ORG_SUMMARY.checkInCoverage}%`, sub: 'checked in (30d)', color: ORG_SUMMARY.checkInCoverage >= 80 ? 'text-emerald-600' : 'text-amber-600', icon: <CalendarCheck size={14} className={ORG_SUMMARY.checkInCoverage >= 80 ? 'text-emerald-500' : 'text-amber-500'} /> },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

      </header>

      {/* Department cards */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6" data-tour="heatmap-alert-bar">
          <h2 className="text-sm font-semibold text-gray-500">
            Click a department to explore its full skills gap heatmap
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-tour="heatmap-grid">
          {summaries.map((dept) => {
            const severity = getSeverity(dept.belowTargetPct);
            const cfg = SEVERITY_CONFIG[severity];
            const total = dept.skillCount;

            return (
              <button
                key={dept.department}
                onClick={() => onSelectDepartment(dept.department)}
                className="text-left rounded-2xl border border-gray-200 bg-white p-6 group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                {/* Dept header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: dept.color }}
                    >
                      {dept.department[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{dept.department}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{dept.headcount} people · {dept.skillCount} skills</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Segmented skill breakdown bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Staff below target</span>
                    <span className="text-2xl font-bold text-gray-900">{dept.belowTargetPct}%</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-100">
                    {dept.skillsCritical > 0 && (
                      <div className="bg-red-500 transition-all" style={{ width: `${(dept.skillsCritical / total) * 100}%` }} title={`${dept.skillsCritical} critical`} />
                    )}
                    {dept.skillsRisk > 0 && (
                      <div className="bg-orange-400 transition-all" style={{ width: `${(dept.skillsRisk / total) * 100}%` }} title={`${dept.skillsRisk} at risk`} />
                    )}
                    {dept.skillsDeveloping > 0 && (
                      <div className="bg-amber-400 transition-all" style={{ width: `${(dept.skillsDeveloping / total) * 100}%` }} title={`${dept.skillsDeveloping} developing`} />
                    )}
                    {dept.skillsGood > 0 && (
                      <div className="bg-gray-200 transition-all" style={{ width: `${(dept.skillsGood / total) * 100}%` }} title={`${dept.skillsGood} on track`} />
                    )}
                  </div>
                </div>

                {/* Stat tiles — 4 buckets */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {([
                    { key: 'critical',   count: dept.skillsCritical,  label: 'Critical'    },
                    { key: 'risk',       count: dept.skillsRisk,       label: 'At Risk'     },
                    { key: 'developing', count: dept.skillsDeveloping, label: 'Developing'  },
                    { key: 'good',       count: dept.skillsGood,       label: 'On Track'    },
                  ] as const).map(({ key, count, label }) => {
                    const tileCfg = SEVERITY_CONFIG[key];
                    return (
                      <div key={key} className={`rounded-lg p-2 text-center ${tileCfg.tile}`}>
                        <p className={`text-lg font-black leading-none ${tileCfg.tileColor}`}>{count}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Biggest gap callout */}
                {dept.topGapSkill && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <TrendingDown size={11} className="text-gray-400 flex-shrink-0" />
                    <span>Biggest gap: <strong className="text-gray-800">{dept.topGapSkill}</strong> ({dept.topGapPct}% below)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center gap-1.5 flex-wrap" data-tour="heatmap-legend">
          <span className="text-xs text-gray-400 mr-2">Severity key:</span>
          {[
            { label: 'On Track', badge: 'bg-emerald-100 text-emerald-700' },
            { label: 'Developing', badge: 'bg-amber-100 text-amber-700' },
            { label: 'At Risk', badge: 'bg-orange-100 text-orange-700' },
            { label: 'Critical', badge: 'bg-red-100 text-red-700' },
          ].map(({ label, badge }) => (
            <span key={label} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
          ))}
        </div>
        <FeedbackBanner context="Skills Overview" className="mt-4" />
      </main>
    </div>
  );
}
