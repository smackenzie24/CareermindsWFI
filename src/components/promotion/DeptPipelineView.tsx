import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, MapPin, ExternalLink, ChevronDown, CheckCircle, AlertCircle, CalendarDays, Sparkles, TrendingDown } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import {
  getAllReadiness,
  TIER_CONFIG,
  TIER_RANGES,
  getReadinessTier,
  LEVEL_DEFINITIONS,
  type ReadinessResult,
  type Department,
  DEPT_COLORS,
} from '../../data/promotionData';

interface Props {
  department: Department;
  onBack: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToManagers?: (managerId?: string) => void;
  onViewCheckIn?: () => void;
  onAskAI?: (question: string) => void;
  initialPersonId?: string;
}

function RatingDots({ actual, required }: { actual: number; required: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full border transition-all ${
            i < actual
              ? i < required
                ? 'bg-sky-500 border-sky-600'
                : 'bg-emerald-500 border-emerald-600'
              : i < required
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-gray-100'
          }`}
        />
      ))}
    </div>
  );
}

function CandidateCard({
  result,
  expanded,
  onToggle,
  onViewCheckIn,
  onAskAI,
}: {
  result: ReadinessResult;
  expanded: boolean;
  onToggle: () => void;
  onViewCheckIn?: () => void;
  onAskAI?: (question: string) => void;
}) {
  const tier = getReadinessTier(result.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = result.person.name.split(' ').map(n => n[0]).join('');
  const levelLabel = LEVEL_DEFINITIONS.find(l => l.id === result.person.currentLevelId)?.label ?? '';
  const jobTitle = levelLabel.split('·')[1]?.trim() ?? levelLabel;
  const shortLabel = LEVEL_DEFINITIONS.find(l => l.id === result.person.currentLevelId)?.shortLabel;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-shadow duration-150 ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      {/* Collapsed header — always visible */}
      <button
        onClick={onToggle}
        className="text-left w-full p-4 group focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{result.person.name}</p>
                {(result.flightRisk === 'high' || result.flightRisk === 'medium') && (
                  <span
                    title={result.flightRiskDrivers[0] ?? 'Flight risk'}
                    className={`flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${result.flightRisk === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                  >
                    <TrendingDown size={9} />
                    {result.flightRisk === 'high' ? 'High risk' : 'At risk'}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                {shortLabel}
              </span>
              <p className="text-[11px] font-medium text-gray-600 truncate">{jobTitle}</p>
            </div>
            <p className="text-[11px] text-gray-400 truncate">{result.person.team}</p>
          </div>
        </div>

        {/* Readiness bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[11px] font-bold text-gray-700">{result.readinessPct}%</span>
          </div>
          <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden border border-black/5">
            <div
              className={`h-full rounded-full ${cfg.barColor}`}
              style={{ width: `${result.readinessPct}%` }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><MapPin size={10} />{result.person.location}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{result.person.tenure}m</span>
          <span className="ml-auto">{result.criteriaMet}/{result.criteriaTotal} criteria</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-black/5 bg-white/60">
          {/* Target level */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Targeting</p>
            <p className="text-xs font-semibold text-gray-700">{result.targetLevelLabel}</p>
          </div>

          {/* Criteria met */}
          {result.metSkills.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={12} className="text-emerald-500" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Meeting ({result.metSkills.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {result.metSkills.map(skill => {
                  const actual = result.person.skills[skill.skillId] ?? 0;
                  return (
                    <div key={skill.skillId} className="flex items-center justify-between py-1.5 px-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="min-w-0 mr-2">
                        <p className="text-xs font-medium text-gray-800 truncate">{skill.skillName}</p>
                        <p className="text-[10px] text-gray-400">{skill.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <RatingDots actual={actual} required={skill.requiredRating} />
                        <span className="text-[10px] text-emerald-700 font-semibold w-8 text-right">{actual}/{skill.requiredRating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gaps */}
          {result.gapSkills.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={12} className="text-red-400" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Gaps ({result.gapSkills.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {[...result.gapSkills].sort((a, b) => b.gap - a.gap).map(skill => (
                  <div key={skill.skillId} className="flex items-center justify-between py-1.5 px-2.5 bg-red-50 rounded-lg border border-red-100">
                    <div className="min-w-0 mr-2">
                      <p className="text-xs font-medium text-gray-800 truncate">{skill.skillName}</p>
                      <p className="text-[10px] text-gray-400">{skill.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <RatingDots actual={skill.actualRating} required={skill.requiredRating} />
                      <span className="text-[10px] text-red-600 font-semibold w-8 text-right">{skill.actualRating}/{skill.requiredRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 pt-1 flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <CalendarDays size={11} className="text-gray-400" />
              Check-in
            </button>
            <button
              onClick={e => { e.stopPropagation(); onAskAI?.(`Tell me about ${result.person.name}'s promotion readiness and what they need to work on`); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 hover:border-sky-200 hover:bg-sky-100 transition-colors"
            >
              <Sparkles size={11} className="text-sky-400" />
              Ask AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeptPipelineView({ department, onBack, onNavigateToGapReport, onNavigateToManagers, onViewCheckIn, onAskAI, initialPersonId }: Props) {
  const allResults = useMemo(() => getAllReadiness(), []);
  const deptResults = useMemo(
    () => allResults.filter(r => r.person.department === department),
    [allResults, department]
  );

  const [expandedId, setExpandedId] = useState<string | null>(() => initialPersonId ?? null);

  function togglePerson(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function buildExportContent(): string {
    const lines: string[] = [
      `${department.toUpperCase()} — PROMOTION PIPELINE`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `People tracked: ${deptResults.length}`,
      '',
    ];
    for (const [tier, items] of Object.entries(buckets) as [keyof typeof TIER_CONFIG, ReadinessResult[]][]) {
      if (items.length === 0) continue;
      lines.push(TIER_CONFIG[tier].label.toUpperCase());
      for (const r of items) {
        lines.push(`  ${r.person.name} — ${r.readinessPct}% | ${r.criteriaMet}/${r.criteriaTotal} criteria`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  const sortedDeptResults = useMemo(
    () => [...deptResults].sort((a, b) => b.readinessPct - a.readinessPct),
    [deptResults]
  );

  const buckets = useMemo(() => sortedDeptResults.reduce<Record<string, ReadinessResult[]>>(
    (acc, r) => { acc[getReadinessTier(r.readinessPct)].push(r); return acc; },
    { 'near-ready': [], 'progressing': [], 'developing': [], 'early': [] }
  ), [sortedDeptResults]);

  const deptColor = DEPT_COLORS[department];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0" data-tour="pipeline-dept-header">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: deptColor }}>
              {department[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{department} · Promotion Pipeline</h1>
              <p className="text-xs text-gray-400 mt-0.5">{deptResults.length} people tracked</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons title={`${department} — Promotion Pipeline`} buildContent={buildExportContent} />
            {onNavigateToGapReport && (
              <button
                onClick={() => onNavigateToGapReport(department)}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink size={11} />Skill gap report
              </button>
            )}
            {onNavigateToManagers && (
              <button
                onClick={() => onNavigateToManagers()}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink size={11} />Manager view
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Kanban */}
      <main className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-4 gap-4" data-tour="pipeline-dept-columns">
          {(['near-ready', 'progressing', 'developing', 'early'] as const).map(tier => {
            const cfg = TIER_CONFIG[tier];
            const items = buckets[tier];
            return (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${cfg.badge}`}>{items.length}</span>
                  <span className="text-[11px] text-gray-400">{TIER_RANGES[tier]}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map(result => (
                    <CandidateCard
                      key={result.person.id}
                      result={result}
                      expanded={expandedId === result.person.id}
                      onToggle={() => togglePerson(result.person.id)}
                      onViewCheckIn={onViewCheckIn}
                      onAskAI={onAskAI}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-300">None</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
