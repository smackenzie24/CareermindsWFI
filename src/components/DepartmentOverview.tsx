import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Users, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Building2 } from 'lucide-react';
import { SKILLS_DATA, DEPARTMENTS, DEPT_COLORS, type Department } from '../data/mockData';
import { PEOPLE } from '../data/promotionData';
import { FeedbackBanner } from './feedback/FeedbackBanner';

const DEPT_SALARIES: Record<Department, number> = {
  Engineering: 128000,
  Product: 118000,
  Design: 102000,
  Data: 122000,
  Marketing: 88000,
  Sales: 95000,
  'People Ops': 90000,
};

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

  return { headcount, totalCost, avgSalary, deptBreakdown };
}

const ORG_SUMMARY = computeOrgSummary();

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function OrgExpandedCards() {
  const max = ORG_SUMMARY.deptBreakdown[0]?.count ?? 1;
  return (
    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100 mt-4">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Users size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Org Size</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{ORG_SUMMARY.headcount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">total employees</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Est. Total Cost</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{fmtCurrency(ORG_SUMMARY.totalCost)}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">annual salaries</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <DollarSign size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Avg Salary</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{fmtCurrency(ORG_SUMMARY.avgSalary)}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">per employee</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Team Headcount</span>
        </div>
        <div className="space-y-2 mt-1">
          {ORG_SUMMARY.deptBreakdown.map(({ dept, count }) => (
            <div key={dept}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-500 truncate pr-2">{dept}</span>
                <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">{count}</span>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(count / max) * 100}%`, background: DEPT_COLORS[dept] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  critical: { label: 'Critical', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
  risk: { label: 'At Risk', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' },
  developing: { label: 'Developing', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' },
  good: { label: 'On Track', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400' },
};

interface Props {
  onSelectDepartment: (dept: Department) => void;
}

export function DepartmentOverview({ onSelectDepartment }: Props) {
  const [orgExpanded, setOrgExpanded] = useState(false);

  const summaries = useMemo((): DeptSummary[] => {
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

      // Critical skills = skills where >60% below target
      let criticalSkills = 0;
      let topGapSkill = '';
      let topGapPct = 0;
      for (const skill of skills) {
        const skillEntries = entries.filter(e => e.skill === skill);
        const sh = skillEntries.reduce((s, e) => s + e.headcount, 0);
        const sb = skillEntries.reduce((s, e) => s + e.belowTarget, 0);
        const pct = sh > 0 ? Math.round((sb / sh) * 100) : 0;
        if (pct >= 60) criticalSkills++;
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
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Acme Corp
          </div>
        </div>

        {/* Org-level summary strip */}
        <div className="mt-5 grid grid-cols-4 gap-4" data-tour="heatmap-header-stats">
          {[
            { label: 'Total headcount', value: orgStats.totalHead, sub: 'across all depts', color: 'text-gray-900', icon: <Users size={14} className="text-gray-400" /> },
            { label: 'Below target (org)', value: `${orgStats.pct}%`, sub: 'of workforce', color: 'text-red-600', icon: <TrendingDown size={14} className="text-red-400" /> },
            { label: 'Critical skill gaps', value: orgStats.critical, sub: 'skills ≥60% below target', color: 'text-orange-600', icon: <AlertTriangle size={14} className="text-orange-400" /> },
            { label: 'Median gap score', value: orgStats.medGap, sub: 'across org (0–5)', color: 'text-gray-900', icon: <CheckCircle size={14} className="text-gray-400" /> },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {orgExpanded && <OrgExpandedCards />}

        <div className="flex justify-center mt-4">
          <button
            onClick={() => setOrgExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors group"
          >
            {orgExpanded ? <ChevronUp size={13} className="group-hover:text-gray-600" /> : <ChevronDown size={13} className="group-hover:text-gray-600" />}
            {orgExpanded ? 'Hide org summary' : 'Show org summary'}
          </button>
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

            return (
              <button
                key={dept.department}
                onClick={() => onSelectDepartment(dept.department)}
                className={`text-left rounded-2xl border ${cfg.border} ${cfg.bg} p-6 group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`}
              >
                {/* Dept header */}
                <div className="flex items-start justify-between mb-4">
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

                {/* Main metric */}
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Staff below target</span>
                    <span className="text-2xl font-bold text-gray-900">{dept.belowTargetPct}%</span>
                  </div>
                  <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-black/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${dept.belowTargetPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-gray-800">{dept.medianGap}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Median gap</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <p className={`text-base font-bold ${dept.criticalSkills > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{dept.criticalSkills}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Critical skills</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-gray-800">{dept.belowTarget}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">People at risk</p>
                  </div>
                </div>

                {/* Top gap callout */}
                {dept.topGapSkill && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <TrendingDown size={11} className="text-gray-400 flex-shrink-0" />
                    <span>Biggest gap: <span className="font-semibold text-gray-800">{dept.topGapSkill}</span> ({dept.topGapPct}% below)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <FeedbackBanner context="Skills Overview" className="mt-6" />
      </main>
    </div>
  );
}
