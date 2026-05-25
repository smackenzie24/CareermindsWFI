import { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, LayoutGrid, Info, ArrowLeft, PanelRightClose, PanelRightOpen, CalendarX, Users, AlertTriangle, Target } from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import {
  SKILLS_DATA,
  LEVELS,
  DEPT_COLORS,
  type Department,
  type Location,
  type Level,
  type SkillGapEntry,
} from '../data/mockData';
import { PEOPLE } from '../data/promotionData';
import { MANAGERS, type Manager } from '../data/managerData';
import { HeatmapCell } from './HeatmapCell';
import { DrilldownPanel } from './DrilldownPanel';
import { DepartmentOverview } from './DepartmentOverview';
import { UpsellBanner } from './UpsellBanner';
import { FeedbackBanner } from './feedback/FeedbackBanner';

const TODAY_CHECKIN = new Date('2026-04-29');
function daysSince(dateStr: string) {
  return Math.floor((TODAY_CHECKIN.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function CheckInPanel({ department }: { department: Department }) {
  const people = PEOPLE.filter(p => p.department === department);
  const flagged = people
    .filter(p => p.lastCheckIn)
    .map(p => ({ person: p, days: daysSince(p.lastCheckIn!) }))
    .filter(f => f.days > 30)
    .sort((a, b) => b.days - a.days);
  const critical = flagged.filter(f => f.days >= 90);
  const overdue = flagged.filter(f => f.days < 90);
  const coveragePct = Math.round(((people.length - flagged.length) / people.length) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Engagement</p>
          <h2 className="text-xl font-bold text-gray-900">Check-in Coverage</h2>
          <p className="text-sm text-gray-500 mt-0.5">{department}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
          flagged.length === 0 ? 'bg-emerald-50 text-emerald-600' :
          critical.length > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {flagged.length === 0 ? 'All current' : critical.length > 0 ? 'Critical' : 'Overdue'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-gray-100">
        <div className="bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
          <div className="flex items-center gap-1 mb-0.5">
            <Users size={11} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Team size</span>
          </div>
          <p className="text-base font-bold text-gray-900">{people.length}</p>
        </div>
        <div className={`rounded-lg px-2.5 py-2 border ${flagged.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-center gap-1 mb-0.5">
            <CalendarX size={11} className={flagged.length === 0 ? 'text-emerald-400' : 'text-red-300'} />
            <span className={`text-[10px] font-medium ${flagged.length === 0 ? 'text-emerald-600' : 'text-red-500'}`}>Not checked in</span>
          </div>
          <p className={`text-base font-bold ${flagged.length === 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {flagged.length}<span className="text-xs font-normal ml-0.5 opacity-60">/ {people.length}</span>
          </p>
        </div>
        <div className="bg-red-50 rounded-lg px-2.5 py-2 border border-red-100">
          <div className="flex items-center gap-1 mb-0.5">
            <AlertTriangle size={11} className="text-red-300" />
            <span className="text-[10px] text-red-500 font-medium">Critical 90d+</span>
          </div>
          <p className={`text-base font-bold ${critical.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>{critical.length}</p>
        </div>
        <div className={`rounded-lg px-2.5 py-2 border ${coveragePct >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-1 mb-0.5">
            <Target size={11} className={coveragePct >= 80 ? 'text-emerald-400' : 'text-amber-400'} />
            <span className={`text-[10px] font-medium ${coveragePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>Coverage</span>
          </div>
          <p className={`text-base font-bold ${coveragePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{coveragePct}%</p>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
            <div className="h-full bg-emerald-400" style={{ width: `${coveragePct}%` }} />
            {overdue.length > 0 && <div className="h-full bg-amber-300" style={{ width: `${Math.round((overdue.length / people.length) * 100)}%` }} />}
            {critical.length > 0 && <div className="h-full bg-red-300" style={{ width: `${Math.round((critical.length / people.length) * 100)}%` }} />}
          </div>
          <span className="text-xs font-bold text-gray-600 w-9 text-right">{coveragePct}%</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />Current ({people.length - flagged.length})</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />Overdue ({overdue.length})</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />Critical ({critical.length})</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6">
        {flagged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
              <CalendarX size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700 mb-1">Everyone is up to date</p>
            <p className="text-xs text-gray-400">All {people.length} members checked in within 30 days.</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {flagged.length} people need follow-up
            </p>
            <div className="space-y-2">
              {flagged.map(({ person, days }) => {
                const isCritical = days >= 90;
                const initials = person.name.split(' ').map((n: string) => n[0]).join('');
                return (
                  <div key={person.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isCritical ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCritical ? 'text-red-700' : 'text-amber-800'}`}>{person.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{person.team}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${isCritical ? 'text-red-500' : 'text-amber-600'}`}>{days}d</p>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                        {isCritical ? 'Critical' : 'Overdue'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <p className="text-xs text-gray-500 mb-3">Suggested actions</p>
        <div className="space-y-2">
          <button className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Send reminder to overdue members &rarr;
          </button>
          <button className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Export check-in report &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

type GroupBy = 'manager' | 'department';

function FilterPill({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium pl-3 pr-8 py-2 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors cursor-pointer"
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function LegendItem({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded ${colorClass} border`} />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

interface DrilldownPanelWrapperProps {
  skill: string;
  entries: SkillGapEntry[];
  groupBy: 'manager' | 'department';
  department?: Department;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToPerson?: (personId: string, department: string) => void;
  onAskAI?: (question: string) => void;
}

function DrilldownPanelWrapper(props: DrilldownPanelWrapperProps) {
  const { collapsed, onToggleCollapse, skill, department } = props;
  const label = skill === '__checkins__' ? 'Check-ins' : skill;

  return (
    <div className={`fixed top-0 right-0 h-full z-40 flex transition-all duration-300 ${collapsed ? 'w-10' : 'w-[420px]'}`}>
      {/* Collapse toggle rail */}
      <button
        onClick={onToggleCollapse}
        className="flex-shrink-0 w-10 h-full bg-white border-l border-gray-100 shadow-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors group"
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? (
          <>
            <PanelRightOpen size={15} className="text-gray-400 group-hover:text-gray-600" />
            <span
              className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-600 tracking-wider"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              {label}
            </span>
          </>
        ) : (
          <PanelRightClose size={15} className="text-gray-400 group-hover:text-gray-600" />
        )}
      </button>

      {/* Panel body */}
      {!collapsed && (
        <div className="flex-1 bg-white border-l border-gray-100 overflow-y-auto flex flex-col">
          {skill === '__checkins__' && department
            ? <CheckInPanel department={department} />
            : <DrilldownPanel {...props} />
          }
        </div>
      )}
    </div>
  );
}

function CheckInRow({ department, selected, onSelect, colCount }: { department: Department; selected: boolean; onSelect: () => void; colCount: number }) {
  const people = PEOPLE.filter(p => p.department === department);
  const hasData = people.some(p => p.lastCheckIn);

  if (!hasData) {
    return (
      <div
        className="grid border-b border-gray-100 cursor-default"
        style={{ gridTemplateColumns: `220px 52px repeat(${colCount}, 1fr)` }}
      >
        <div className="px-4 py-3 flex items-center gap-2">
          <CalendarX size={12} className="text-gray-300" />
          <span className="text-sm font-medium text-gray-400">Check-in Coverage</span>
        </div>
        <div className="px-2 py-3 flex items-center justify-center border-l border-gray-50" />
        <div className="px-4 py-3 flex items-center" style={{ gridColumn: `3 / span ${colCount}` }}>
          <div className="flex-1 h-6 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center px-2.5 gap-1.5">
            <span className="text-[10px] text-gray-400 font-medium">No check-ins yet</span>
          </div>
        </div>
      </div>
    );
  }

  const flagged = people.filter(p => p.lastCheckIn && daysSince(p.lastCheckIn) > 30);
  const critical = flagged.filter(p => p.lastCheckIn && daysSince(p.lastCheckIn) >= 90);
  const coveragePct = Math.round(((people.length - flagged.length) / people.length) * 100);
  const hasCritical = critical.length > 0;
  const hasOverdue = flagged.length > 0;

  return (
    <div
      className={`grid border-b border-gray-100 cursor-pointer transition-colors ${selected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
      style={{ gridTemplateColumns: `220px 52px repeat(${colCount}, 1fr)` }}
      onClick={onSelect}
    >
      <div className="px-4 py-3 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <CalendarX size={12} className={hasCritical ? 'text-red-400' : hasOverdue ? 'text-amber-400' : 'text-emerald-400'} />
          <span className="text-sm font-semibold text-gray-800">Check-in Coverage</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-400">Engagement</span>
          {hasCritical && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">CRITICAL</span>}
        </div>
      </div>
      <div className="px-2 py-3 flex items-center justify-center border-l border-gray-50" />
      <div className="px-4 py-3 flex items-center gap-4" style={{ gridColumn: `3 / span ${colCount}` }}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
              <div className="h-full bg-emerald-400" style={{ width: `${coveragePct}%` }} />
              {flagged.length - critical.length > 0 && <div className="h-full bg-amber-300" style={{ width: `${Math.round(((flagged.length - critical.length) / people.length) * 100)}%` }} />}
              {critical.length > 0 && <div className="h-full bg-red-300" style={{ width: `${Math.round((critical.length / people.length) * 100)}%` }} />}
            </div>
            <span className={`text-xs font-bold w-9 text-right ${hasCritical ? 'text-red-500' : hasOverdue ? 'text-amber-500' : 'text-emerald-500'}`}>{coveragePct}%</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>{people.length - flagged.length} current</span>
            {hasOverdue && <span className="text-amber-500">{flagged.length - critical.length} overdue</span>}
            {hasCritical && <span className="text-red-400">{critical.length} critical</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeptHeatmapProps {
  department: Department;
  onBack: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToPerson?: (personId: string, department: string) => void;
  onAskAI?: (question: string) => void;
  tourActive?: boolean;
}

function DeptHeatmap({ department, onBack, onNavigateToPipeline, onNavigateToPerson, onAskAI, tourActive }: DeptHeatmapProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('manager');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null); // '__checkins__' for check-in panel
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const filtered = useMemo(() => {
    return SKILLS_DATA.filter((d) => {
      if (d.department !== department) return false;
      if (filterLevel && d.level !== filterLevel) return false;
      return true;
    });
  }, [department, filterLevel]);

  const skills = useMemo(() => {
    return Array.from(new Set(filtered.map((d) => d.skill)));
  }, [filtered]);

  // Auto-open first skill when tour is active so drilldown panel anchors are in the DOM
  useEffect(() => {
    if (tourActive && skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0]);
    }
  }, [tourActive, skills, selectedSkill]);

  const deptManagers = useMemo(
    () => MANAGERS.filter((m) => m.department === department),
    [department]
  );

  const groupKeys = useMemo((): string[] => {
    if (groupBy === 'manager') {
      return deptManagers.map((m) => m.name);
    }
    return [department];
  }, [groupBy, department, deptManagers]);

  const cellData = useMemo(() => {
    const map: Record<string, Record<string, SkillGapEntry[]>> = {};
    for (const skill of skills) {
      map[skill] = {};
      for (const key of groupKeys) {
        map[skill][key] = filtered.filter((d) => {
          if (d.skill !== skill) return false;
          if (groupBy === 'manager') {
            const mgr = deptManagers.find((m) => m.name === key);
            return mgr ? mgr.teams.includes(d.team) : false;
          }
          return d.department === key;
        });
      }
    }
    return map;
  }, [skills, groupKeys, filtered, groupBy, deptManagers]);

  function aggregateCell(entries: SkillGapEntry[]): {
    skill: string;
    department: string;
    averageActual: number;
    expectedLevel: number;
    headcount: number;
    belowTarget: number;
    team?: string;
  } | null {
    if (!entries.length) return null;
    const totalHead = entries.reduce((s, e) => s + e.headcount, 0);
    const totalBelow = entries.reduce((s, e) => s + e.belowTarget, 0);
    const avgActual = entries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / totalHead;
    const expectedLevel = entries[0].expectedLevel;
    return {
      skill: entries[0].skill,
      department: entries[0].department,
      averageActual: parseFloat(avgActual.toFixed(2)),
      expectedLevel,
      headcount: totalHead,
      belowTarget: totalBelow,
    };
  }

  const drilldownEntries = useMemo(() => {
    if (!selectedSkill) return [];
    return filtered.filter((d) => d.skill === selectedSkill);
  }, [selectedSkill, filtered]);

  const overallStats = useMemo(() => {
    const totalHead = filtered.reduce((s, e) => s + e.headcount, 0);
    const totalBelow = filtered.reduce((s, e) => s + e.belowTarget, 0);
    const avgGap =
      skills.length > 0
        ? filtered.reduce((s, e) => s + Math.max(0, e.expectedLevel - e.averageActual) * e.headcount, 0) /
          Math.max(1, totalHead)
        : 0;
    return { totalHead, totalBelow, avgGap };
  }, [filtered, skills]);

  const criticalSkills = useMemo(() => {
    const bySkill: Record<string, { below: number; head: number }> = {};
    for (const e of filtered) {
      if (!bySkill[e.skill]) bySkill[e.skill] = { below: 0, head: 0 };
      bySkill[e.skill].below += e.belowTarget;
      bySkill[e.skill].head += e.headcount;
    }
    return Object.entries(bySkill)
      .map(([skill, { below, head }]) => ({ skill, pct: Math.round((below / head) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [filtered]);

  const deptColor = DEPT_COLORS[department];

  function buildExportContent(): string {
    const lines: string[] = [
      `${department.toUpperCase()} — SKILLS GAP HEATMAP`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `People below target: ${overallStats.totalHead > 0 ? Math.round((overallStats.totalBelow / overallStats.totalHead) * 100) : 0}% (${overallStats.totalBelow} of ${overallStats.totalHead})`,
      `Avg skill gap: ${overallStats.avgGap.toFixed(1)}`,
      `Skills tracked: ${skills.length}`,
      '',
      'SKILLS BREAKDOWN',
      '-'.repeat(50),
    ];
    for (const skill of skills) {
      const entries = filtered.filter(e => e.skill === skill);
      const head = entries.reduce((s, e) => s + e.headcount, 0);
      const below = entries.reduce((s, e) => s + e.belowTarget, 0);
      const pct = head > 0 ? Math.round((below / head) * 100) : 0;
      lines.push(`${skill}: ${pct}% below target (${below} of ${head} people)`);
    }
    return lines.join('\n');
  }

  function csvRow(...cells: (string | number)[]): string {
    return cells.map(c => {
      const s = String(c);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',');
  }

  function buildCsvContent(): string {
    const rows: string[] = [
      csvRow('Department', 'Skill', 'Category', 'Level', 'Team', 'Headcount', 'Below_Target_Count', 'Below_Target_Pct', 'Avg_Actual', 'Expected_Level', 'Gap_Score', 'Status'),
    ];
    for (const skill of skills) {
      const entries = filtered.filter(e => e.skill === skill);
      const teams = Array.from(new Set(entries.map(e => e.team)));
      for (const team of teams) {
        const teamEntries = entries.filter(e => e.team === team);
        const head = teamEntries.reduce((s, e) => s + e.headcount, 0);
        const below = teamEntries.reduce((s, e) => s + e.belowTarget, 0);
        const avgActual = head > 0 ? teamEntries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / head : 0;
        const expected = teamEntries[0].expectedLevel;
        const gap = Math.max(0, expected - avgActual);
        const pct = head > 0 ? Math.round((below / head) * 100) : 0;
        const status = avgActual > expected ? 'Exceeding' : pct < 30 ? 'On Track' : pct < 50 ? 'Developing' : pct < 70 ? 'At Risk' : 'Critical';
        rows.push(csvRow(
          department,
          skill,
          teamEntries[0].category,
          teamEntries[0].level,
          team,
          head,
          below,
          pct,
          avgActual.toFixed(2),
          expected,
          gap.toFixed(2),
          status,
        ));
      }
    }
    return rows.join('\n');
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${selectedSkill ? (panelCollapsed ? 'mr-10' : 'mr-96') : ''}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 pt-3 pb-4 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              All departments
            </button>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: deptColor }}>
                {department[0]}
              </div>
              <span className="text-sm font-semibold text-gray-900">{department}</span>
            </div>
          </div>

          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none">{department} · Skills Gap</h1>
                <p className="text-xs text-gray-400 mt-0.5">Skills Gap Heatmap &bull; Progression</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ExportButtons title={`${department} — Skills Gap`} buildContent={buildExportContent} />
            <div className="flex items-center gap-5" data-tour="heatmap-header-stats">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Below target</p>
                <p className="text-sm font-bold text-red-600">
                  {overallStats.totalHead > 0 ? Math.round((overallStats.totalBelow / overallStats.totalHead) * 100) : 0}%
                  <span className="text-xs font-normal text-gray-400 ml-1">({overallStats.totalBelow}/{overallStats.totalHead})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Avg gap</p>
                <p className="text-sm font-bold text-orange-400">{overallStats.avgGap.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Skills</p>
                <p className="text-sm font-bold text-gray-900">{skills.length}</p>
              </div>
            </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Filter size={14} />
              <span>Filter</span>
            </div>
            <FilterPill label="Level" options={LEVELS} value={filterLevel} onChange={setFilterLevel} />

            <div className="flex-1" />

            {/* Group by toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setGroupBy('manager')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  groupBy === 'manager' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users size={13} />
                By Manager
              </button>
              <button
                onClick={() => setGroupBy('department')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  groupBy === 'department' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={13} />
                Department
              </button>
            </div>
          </div>
        </header>

        {/* Alert bar */}
        {criticalSkills.length > 0 && (
          <div className="bg-red-50 border-b border-red-100 px-8 py-3 flex-shrink-0" data-tour="heatmap-alert-bar">
            <div className="flex items-center gap-2 flex-wrap">
              <Info size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 flex-1">
                <span className="font-semibold text-red-700">Critical gaps detected:</span>{' '}
                {criticalSkills.map((s, i) => (
                  <span key={s.skill}>
                    <button
                      onClick={() => { setSelectedSkill(s.skill); setPanelCollapsed(false); }}
                      className="font-semibold underline hover:no-underline cursor-pointer"
                    >
                      {s.skill}
                    </button>
                    {' '}({s.pct}% below target)
                    {i < criticalSkills.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        {/* Heatmap grid */}
        <div className="flex-1 overflow-auto p-8" data-tour="heatmap-grid">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm font-semibold text-gray-600">
                No data{filterLevel ? ` for ${filterLevel}` : ''} in {department}
              </p>
              <p className="text-xs text-gray-400 max-w-xs text-center">
                No employees match this filter combination. Try adjusting your filters.
              </p>
              <button
                onClick={() => setFilterLevel('')}
                className="text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Check-in row — above column headers so it doesn't read as a skill row */}
              <CheckInRow department={department} selected={selectedSkill === '__checkins__'} onSelect={() => { setSelectedSkill(selectedSkill === '__checkins__' ? null : '__checkins__'); setPanelCollapsed(false); }} colCount={groupKeys.length} />

              {/* Column headers */}
              <div
                className="grid border-b border-gray-100 bg-gray-50/80"
                style={{ gridTemplateColumns: `220px 52px repeat(${groupKeys.length}, 1fr)` }}
              >
                <div className="px-4 py-3 flex items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Skill</span>
                </div>
                <div className="px-2 py-3 flex items-center justify-center border-l border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Req</span>
                </div>
                {groupKeys.map((key) => {
                  const mgr = groupBy === 'manager' ? deptManagers.find((m) => m.name === key) : undefined;
                  return (
                    <div key={key} className="px-3 py-3 text-center border-l border-gray-50 flex flex-col items-center justify-center gap-0.5">
                      <span className="text-xs font-semibold text-gray-700 leading-tight break-words">{key}</span>
                      {mgr && <span className="text-[10px] text-gray-400 leading-tight">{mgr.teams.join(', ')}</span>}
                    </div>
                  );
                })}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50" data-tour="heatmap-skill-col">
                {skills.map((skill) => {
                  const skillEntries = filtered.filter((d) => d.skill === skill);
                  const totalHead = skillEntries.reduce((s, e) => s + e.headcount, 0);
                  const totalBelow = skillEntries.reduce((s, e) => s + e.belowTarget, 0);
                  const pctBelow = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
                  const category = skillEntries[0]?.category;
                  const expectedLevel = skillEntries[0]?.expectedLevel;

                  return (
                    <div
                      key={skill}
                      className={`grid transition-colors ${selectedSkill === skill ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                      style={{ gridTemplateColumns: `220px 52px repeat(${groupKeys.length}, 1fr)` }}
                    >
                      <div
                        className="px-4 py-3 flex flex-col justify-center cursor-pointer"
                        onClick={() => { const next = skill === selectedSkill ? null : skill; setSelectedSkill(next); if (next) setPanelCollapsed(false); }}
                      >
                        <span className="text-sm font-semibold text-gray-800 leading-tight">{skill}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400">{category}</span>
                          {pctBelow >= 60 && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">HIGH RISK</span>
                          )}
                        </div>
                      </div>

                      <div className="px-2 py-3 flex items-center justify-center border-l border-gray-50">
                        {expectedLevel != null && (
                          <span className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-xs font-semibold text-gray-600 bg-white">
                            {expectedLevel}
                          </span>
                        )}
                      </div>

                      {groupKeys.map((key) => {
                        const entries = cellData[skill]?.[key] || [];
                        const agg = aggregateCell(entries);
                        return (
                          <div key={key} className="px-2 py-2 border-l border-gray-50">
                            <HeatmapCell
                              data={agg}
                              selected={selectedSkill === skill}
                              groupBy={groupBy}
                              onClick={() => { const next = skill === selectedSkill ? null : skill; setSelectedSkill(next); if (next) setPanelCollapsed(false); }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend — §3.4: 6 cell colour levels */}
          <div className="mt-4 flex items-center gap-1.5 flex-wrap" data-tour="heatmap-legend">
            <span className="text-xs text-gray-400 mr-2">Gap severity:</span>
            <LegendItem label="Exceeding target" colorClass="bg-emerald-100 border-emerald-200" />
            <LegendItem label="On track (<30%)" colorClass="bg-emerald-50 border-emerald-100" />
            <LegendItem label="Mild (30–49%)" colorClass="bg-amber-50 border-amber-100" />
            <LegendItem label="Moderate (50–69%)" colorClass="bg-orange-100 border-orange-200" />
            <LegendItem label="Severe (70–84%)" colorClass="bg-red-100 border-red-200" />
            <LegendItem label="Critical (85%+)" colorClass="bg-red-200 border-red-300" />
          </div>

          <UpsellBanner variant="talent-development" className="mt-6" />
          <FeedbackBanner context="Skills Heatmap" className="mt-4" />
        </div>
      </div>

      {/* Drilldown panel */}
      {selectedSkill && (
        <DrilldownPanelWrapper
          skill={selectedSkill}
          entries={drilldownEntries}
          groupBy={groupBy}
          department={department}
          onClose={() => { setSelectedSkill(null); setPanelCollapsed(false); }}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed(c => !c)}
          onNavigateToPipeline={onNavigateToPipeline}
          onNavigateToPerson={onNavigateToPerson}
          onAskAI={onAskAI}
        />
      )}
    </div>
  );
}

interface SkillsGapHeatmapProps {
  onNavigateToPipeline?: () => void;
  onNavigateToPerson?: (personId: string, department: string) => void;
  onAskAI?: (question: string) => void;
  tourActive?: boolean;
  initialDepartment?: Department;
}

export function SkillsGapHeatmap({ onNavigateToPipeline, onNavigateToPerson, onAskAI, tourActive, initialDepartment }: SkillsGapHeatmapProps) {
  const [selectedDept, setSelectedDept] = useState<Department | null>(initialDepartment ?? null);

  if (selectedDept) {
    return (
      <DeptHeatmap
        department={selectedDept}
        onBack={() => setSelectedDept(null)}
        onNavigateToPipeline={onNavigateToPipeline}
        onNavigateToPerson={onNavigateToPerson}
        onAskAI={onAskAI}
        tourActive={tourActive}
      />
    );
  }

  return <DepartmentOverview onSelectDepartment={setSelectedDept} />;
}
