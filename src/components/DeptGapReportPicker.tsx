import { useMemo } from 'react';
import { ChevronRight, AlertTriangle, TrendingDown, Users } from 'lucide-react';
import { FeedbackBanner } from './feedback/FeedbackBanner';
import { SKILLS_DATA, DEPARTMENTS, DEPT_COLORS, type Department } from '../data/mockData';

function getSeverity(pct: number): 'critical' | 'risk' | 'developing' | 'good' {
  if (pct >= 65) return 'critical';
  if (pct >= 45) return 'risk';
  if (pct >= 25) return 'developing';
  return 'good';
}

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', ring: 'focus:ring-red-300' },
  risk:     { label: 'At Risk',  badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400', ring: 'focus:ring-orange-300' },
  developing: { label: 'Developing', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', ring: 'focus:ring-amber-300' },
  good:     { label: 'On Track', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400', ring: 'focus:ring-emerald-300' },
};

interface Props {
  onSelect: (dept: Department) => void;
}

export function DeptGapReportPicker({ onSelect }: Props) {
  const summaries = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const entries = SKILLS_DATA.filter(e => e.department === dept);
      const skills = Array.from(new Set(entries.map(e => e.skill)));
      const totalHead = entries.reduce((s, e) => s + e.headcount, 0);
      const totalBelow = entries.reduce((s, e) => s + e.belowTarget, 0);
      const belowPct = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
      const criticalSkills = skills.filter(skill => {
        const se = entries.filter(e => e.skill === skill);
        const sh = se.reduce((s, e) => s + e.headcount, 0);
        const sb = se.reduce((s, e) => s + e.belowTarget, 0);
        return sh > 0 && Math.round((sb / sh) * 100) >= 60;
      }).length;
      let topGapSkill = '';
      let topGapPct = 0;
      for (const skill of skills) {
        const se = entries.filter(e => e.skill === skill);
        const sh = se.reduce((s, e) => s + e.headcount, 0);
        const sb = se.reduce((s, e) => s + e.belowTarget, 0);
        const pct = sh > 0 ? Math.round((sb / sh) * 100) : 0;
        if (pct > topGapPct) { topGapPct = pct; topGapSkill = skill; }
      }
      return { dept, totalHead, totalBelow, belowPct, criticalSkills, skillCount: skills.length, topGapSkill, topGapPct };
    });
  }, []);

  const orgTotals = useMemo(() => {
    const head = summaries.reduce((s, d) => s + d.totalHead, 0);
    const below = summaries.reduce((s, d) => s + d.totalBelow, 0);
    const critical = summaries.reduce((s, d) => s + d.criticalSkills, 0);
    return { head, below, pct: head > 0 ? Math.round((below / head) * 100) : 0, critical };
  }, [summaries]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Workforce Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900">Areas to Improve</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select a department to explore its full skills gap breakdown, team-level detail, and promotion pipeline impact.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Acme Corp
          </div>
        </div>

        {/* Org-level summary */}
        <div className="mt-5 grid grid-cols-4 gap-4" data-tour="gap-report-org-stats">
          {[
            { label: 'Total headcount', value: orgTotals.head, sub: 'across all departments', color: 'text-gray-900', icon: <Users size={14} className="text-gray-400" /> },
            { label: 'Below target (org)', value: `${orgTotals.pct}%`, sub: `${orgTotals.below} people`, color: 'text-red-600', icon: <TrendingDown size={14} className="text-red-400" /> },
            { label: 'Skills below target', value: orgTotals.critical, sub: '60%+ of team below expected', color: 'text-orange-600', icon: <AlertTriangle size={14} className="text-orange-400" /> },
            { label: 'Departments', value: DEPARTMENTS.length, sub: 'with gap data', color: 'text-gray-900', icon: <Users size={14} className="text-gray-400" /> },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <p className="text-sm text-gray-500 mb-6">Select a department to open its full skills gap report</p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-tour="gap-report-picker">
          {summaries.map(({ dept, totalHead, totalBelow, belowPct, criticalSkills, skillCount, topGapSkill, topGapPct }) => {
            const severity = getSeverity(belowPct);
            const cfg = SEVERITY_CONFIG[severity];
            const color = DEPT_COLORS[dept];

            return (
              <button
                key={dept}
                onClick={() => onSelect(dept)}
                className={`text-left rounded-2xl border border-gray-200 bg-white p-6 group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${cfg.ring}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{dept}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{totalHead} people · {skillCount} skills tracked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Below-target bar */}
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-xs text-gray-500 font-medium">Staff below target</span>
                    <span className="text-2xl font-bold text-gray-900">{belowPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${belowPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-gray-800">{totalBelow}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Below target</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className={`text-base font-bold ${criticalSkills > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{criticalSkills}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Below expected</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-base font-bold text-gray-800">{skillCount}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Skills</p>
                  </div>
                </div>

                {topGapSkill && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <TrendingDown size={11} className="text-gray-400 flex-shrink-0" />
                    <span>Biggest gap: <span className="font-semibold text-gray-800">{topGapSkill}</span> ({topGapPct}% below)</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <FeedbackBanner context="Areas to Improve" className="mt-4" />
      </main>
    </div>
  );
}
