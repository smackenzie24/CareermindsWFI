import { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, LayoutGrid, Map, Info, ArrowLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';
import {
  SKILLS_DATA,
  LOCATIONS,
  LEVELS,
  DEPT_COLORS,
  type Department,
  type Location,
  type Level,
  type SkillGapEntry,
} from '../data/mockData';
import { HeatmapCell } from './HeatmapCell';
import { DrilldownPanel } from './DrilldownPanel';
import { DepartmentOverview } from './DepartmentOverview';
import { UpsellBanner } from './UpsellBanner';
import { FeedbackBanner } from './feedback/FeedbackBanner';

type GroupBy = 'department' | 'location';

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
  groupBy: 'department' | 'location';
  department?: string;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToPipeline?: () => void;
}

function DrilldownPanelWrapper(props: DrilldownPanelWrapperProps) {
  const { collapsed, onToggleCollapse } = props;

  return (
    <div className={`fixed top-0 right-0 h-full z-40 flex transition-all duration-300 ${collapsed ? 'w-10' : 'w-96'}`}>
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
              {props.skill}
            </span>
          </>
        ) : (
          <PanelRightClose size={15} className="text-gray-400 group-hover:text-gray-600" />
        )}
      </button>

      {/* Panel body */}
      {!collapsed && (
        <div className="flex-1 bg-white border-l border-gray-100 overflow-y-auto flex flex-col">
          <DrilldownPanel {...props} />
        </div>
      )}
    </div>
  );
}

interface DeptHeatmapProps {
  department: Department;
  onBack: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  tourActive?: boolean;
}

function DeptHeatmap({ department, onBack, onNavigateToPipeline, onNavigateToGapReport, tourActive }: DeptHeatmapProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('location');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const filtered = useMemo(() => {
    return SKILLS_DATA.filter((d) => {
      if (d.department !== department) return false;
      if (filterLocation && d.location !== filterLocation) return false;
      if (filterLevel && d.level !== filterLevel) return false;
      return true;
    });
  }, [department, filterLocation, filterLevel]);

  const skills = useMemo(() => {
    return Array.from(new Set(filtered.map((d) => d.skill)));
  }, [filtered]);

  // Auto-open first skill when tour is active so drilldown panel anchors are in the DOM
  useEffect(() => {
    if (tourActive && skills.length > 0 && !selectedSkill) {
      setSelectedSkill(skills[0]);
    }
  }, [tourActive, skills, selectedSkill]);

  const groupKeys = useMemo((): string[] => {
    if (groupBy === 'location') {
      return filterLocation
        ? [filterLocation]
        : LOCATIONS.filter((l) => filtered.some((e) => e.location === l));
    } else {
      return [department];
    }
  }, [groupBy, filtered, filterLocation, department]);

  const cellData = useMemo(() => {
    const map: Record<string, Record<string, SkillGapEntry[]>> = {};
    for (const skill of skills) {
      map[skill] = {};
      for (const key of groupKeys) {
        map[skill][key] = filtered.filter((d) => {
          const groupMatch = groupBy === 'location' ? d.location === key : d.department === key;
          return d.skill === skill && groupMatch;
        });
      }
    }
    return map;
  }, [skills, groupKeys, filtered, groupBy]);

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

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${selectedSkill ? (panelCollapsed ? 'mr-10' : 'mr-96') : ''}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-5">
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

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: deptColor }}>
                {department[0]}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none">{department} · Skills Gap</h1>
                <p className="text-xs text-gray-400 mt-0.5">Skills Gap Heatmap &bull; Progression</p>
              </div>
            </div>
            <div className="flex items-center gap-6" data-tour="heatmap-header-stats">
              <div className="text-right">
                <p className="text-xs text-gray-400">People below target</p>
                <p className="text-xl font-bold text-red-600">
                  {overallStats.totalHead > 0 ? Math.round((overallStats.totalBelow / overallStats.totalHead) * 100) : 0}%
                  <span className="text-sm font-normal text-gray-400 ml-1">({overallStats.totalBelow} of {overallStats.totalHead})</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Avg skill gap</p>
                <p className="text-xl font-bold text-orange-500">{overallStats.avgGap.toFixed(1)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Skills tracked</p>
                <p className="text-xl font-bold text-gray-900">{skills.length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Filter size={14} />
              <span>Filter</span>
            </div>
            <FilterPill label="Location" options={LOCATIONS} value={filterLocation} onChange={setFilterLocation} />
            <FilterPill label="Level" options={LEVELS} value={filterLevel} onChange={setFilterLevel} />

            <div className="flex-1" />

            {/* Group by toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setGroupBy('location')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  groupBy === 'location' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Map size={13} />
                By Location
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
              <Info size={13} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 flex-1">
                <span className="font-semibold">Critical gaps detected:</span>{' '}
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
              {onNavigateToGapReport && (
                <button
                  onClick={() => onNavigateToGapReport(department)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                >
                  Full gap report →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Heatmap grid */}
        <div className="flex-1 overflow-auto p-8" data-tour="heatmap-grid">
          {skills.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              No data matches your filters.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Column headers */}
              <div
                className="grid border-b border-gray-100 bg-gray-50/80"
                style={{ gridTemplateColumns: `220px repeat(${groupKeys.length}, 1fr)` }}
              >
                <div className="px-4 py-3 flex items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Skill</span>
                </div>
                {groupKeys.map((key) => (
                  <div key={key} className="px-3 py-3 text-center border-l border-gray-50">
                    <span className="text-xs font-semibold text-gray-600">{key}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50" data-tour="heatmap-skill-col">
                {skills.map((skill) => {
                  const skillEntries = filtered.filter((d) => d.skill === skill);
                  const totalHead = skillEntries.reduce((s, e) => s + e.headcount, 0);
                  const totalBelow = skillEntries.reduce((s, e) => s + e.belowTarget, 0);
                  const pctBelow = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
                  const category = skillEntries[0]?.category;

                  return (
                    <div
                      key={skill}
                      className={`grid transition-colors ${selectedSkill === skill ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                      style={{ gridTemplateColumns: `220px repeat(${groupKeys.length}, 1fr)` }}
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

                      {groupKeys.map((key) => {
                        const entries = cellData[skill]?.[key] || [];
                        const agg = aggregateCell(entries);
                        return (
                          <div key={key} className="px-2 py-2 border-l border-gray-50">
                            <HeatmapCell
                              data={agg}
                              selected={selectedSkill === skill}
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

          {/* Legend */}
          <div className="mt-4 flex items-center gap-1.5 flex-wrap" data-tour="heatmap-legend">
            <span className="text-xs text-gray-400 mr-2">Gap severity:</span>
            <LegendItem label="Exceeding target" colorClass="bg-sky-500 border-sky-600" />
            <LegendItem label="On track (<30%)" colorClass="bg-emerald-100 border-emerald-200" />
            <LegendItem label="Mild (30–49%)" colorClass="bg-amber-100 border-amber-200" />
            <LegendItem label="Moderate (50–69%)" colorClass="bg-orange-200 border-orange-300" />
            <LegendItem label="Severe (70–84%)" colorClass="bg-red-300 border-red-400" />
            <LegendItem label="Critical (85%+)" colorClass="bg-red-500 border-red-600" />
          </div>

          {/* Careerminds upsell — talent development */}
          <UpsellBanner variant="talent-development" className="mt-6" />
          <FeedbackBanner context="Skills Heatmap" className="mt-4" />
        </div>
      </div>

      {/* Drilldown panel */}
      {selectedSkill && (
        <DrilldownPanelWrapper
          skill={selectedSkill}
          entries={drilldownEntries}
          groupBy={groupBy === 'location' ? 'location' : 'department'}
          department={department}
          onClose={() => { setSelectedSkill(null); setPanelCollapsed(false); }}
          collapsed={panelCollapsed}
          onToggleCollapse={() => setPanelCollapsed(c => !c)}
          onNavigateToPipeline={onNavigateToPipeline}
        />
      )}
    </div>
  );
}

interface SkillsGapHeatmapProps {
  onNavigateToPipeline?: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  tourActive?: boolean;
}

export function SkillsGapHeatmap({ onNavigateToPipeline, onNavigateToGapReport, tourActive }: SkillsGapHeatmapProps) {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Auto-select first department when tour is active so DeptHeatmap is mounted
  useEffect(() => {
    if (tourActive && !selectedDept) {
      setSelectedDept('Engineering');
    }
  }, [tourActive, selectedDept]);

  if (selectedDept) {
    return (
      <DeptHeatmap
        department={selectedDept}
        onBack={() => setSelectedDept(null)}
        onNavigateToPipeline={onNavigateToPipeline}
        onNavigateToGapReport={onNavigateToGapReport}
        tourActive={tourActive}
      />
    );
  }

  return <DepartmentOverview onSelectDepartment={setSelectedDept} />;
}
