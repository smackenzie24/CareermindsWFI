import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Clock, MapPin, ExternalLink } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import {
  getAllReadiness,
  TIER_CONFIG,
  TIER_RANGES,
  getReadinessTier,
  type ReadinessResult,
  type Department,
  DEPT_COLORS,
} from '../../data/promotionData';
import { PersonPanel } from './PersonPanel';

interface Props {
  department: Department;
  onBack: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToManagers?: (managerId?: string) => void;
  onAskAI?: (question: string) => void;
}

function CandidateCard({ result, onClick }: { result: ReadinessResult; onClick: () => void }) {
  const tier = getReadinessTier(result.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = result.person.name.split(' ').map(n => n[0]).join('');

  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border ${cfg.border} ${cfg.bg} p-4 group hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{result.person.name}</p>
            <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{result.person.team}</p>
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
  );
}

interface Selection {
  result: ReadinessResult;
  peers: ReadinessResult[];
  index: number;
}

export function DeptPipelineView({ department, onBack, onNavigateToGapReport, onNavigateToManagers, onAskAI }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);

  function buildExportContent(): string {
    const lines: string[] = [
      `${department.toUpperCase()} — PROMOTION PIPELINE`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `People tracked: ${deptResults.length} across ${transitions.length} level transitions`,
      '',
    ];
    for (const t of transitions) {
      lines.push(`${t.currentLabel} → ${t.nextLabel.split('·')[1]?.trim() ?? t.nextLabel} (${t.results.length} people)`);
      for (const r of t.results) {
        const tier = r.readinessPct >= 90 ? 'Near Ready' : r.readinessPct >= 70 ? 'Progressing' : r.readinessPct >= 50 ? 'Developing' : 'Early';
        lines.push(`  ${r.person.name} — ${r.readinessPct}% (${tier}) | ${r.criteriaMet}/${r.criteriaTotal} criteria`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  function openPerson(result: ReadinessResult, peers: ReadinessResult[]) {
    setSelection({ result, peers, index: peers.indexOf(result) });
  }

  function navigateTo(index: number) {
    if (!selection) return;
    const result = selection.peers[index];
    if (result) setSelection({ ...selection, result, index });
  }

  const allResults = useMemo(() => getAllReadiness(), []);

  const deptResults = useMemo(
    () => allResults.filter(r => r.person.department === department),
    [allResults, department]
  );

  // Group by transition (current level → next level)
  const transitions = useMemo(() => {
    const map = new Map<string, { label: string; currentLabel: string; nextLabel: string; results: ReadinessResult[] }>();
    for (const r of deptResults) {
      const key = `${r.person.currentLevelId}→${r.targetLevelId}`;
      if (!map.has(key)) {
        const currentLabel = r.person.currentLevelId.split('-').slice(1).join('-').toUpperCase();
        map.set(key, { label: key, currentLabel, nextLabel: r.targetLevelLabel, results: [] });
      }
      map.get(key)!.results.push(r);
    }
    // Sort results within each transition by readiness desc
    for (const t of map.values()) {
      t.results.sort((a, b) => b.readinessPct - a.readinessPct);
    }
    return Array.from(map.values());
  }, [deptResults]);

  const deptColor = DEPT_COLORS[department];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0" data-tour="pipeline-dept-header">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: deptColor }}>
              {department[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{department} · Promotion Pipeline</h1>
              <p className="text-xs text-gray-400 mt-0.5">{deptResults.length} people tracked across {transitions.length} level transitions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons title={`${department} — Promotion Pipeline`} buildContent={buildExportContent} />
            {/* Cross-links */}
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
            {/* Tier summary pills */}
            {(Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tier, cfg]) => {
              const count = deptResults.filter(r => getReadinessTier(r.readinessPct) === tier).length;
              if (count === 0) return null;
              return (
                <div key={tier} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${cfg.badge} text-xs font-semibold`}>
                  <span className="text-base font-black leading-none">{count}</span>
                  {cfg.label}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Swimlanes */}
      <main className="flex-1 overflow-auto p-8">
        <div className="space-y-10" data-tour="pipeline-dept-swimlanes">
          {transitions.map(({ currentLabel, nextLabel, results }) => {
            const buckets = results.reduce<Record<string, ReadinessResult[]>>(
              (acc, r) => { acc[getReadinessTier(r.readinessPct)].push(r); return acc; },
              { 'near-ready': [], 'progressing': [], 'developing': [], 'early': [] }
            );
            const nearReady = buckets['near-ready'];
            const progressing = buckets['progressing'];
            const developing = buckets['developing'];
            const early = buckets['early'];

            return (
              <div key={`${currentLabel}-${nextLabel}`}>
                {/* Transition header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">{currentLabel}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-900 bg-gray-900 text-white px-3 py-1 rounded-full">
                      {nextLabel.split('·')[1]?.trim() ?? nextLabel}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{results.length} people</span>
                </div>

                {/* Four tier columns */}
                <div className="grid grid-cols-4 gap-4" data-tour="pipeline-dept-columns">
                  {[
                    { tier: 'near-ready' as const, items: nearReady },
                    { tier: 'progressing' as const, items: progressing },
                    { tier: 'developing' as const, items: developing },
                    { tier: 'early' as const, items: early },
                  ].map(({ tier, items }) => {
                    const cfg = TIER_CONFIG[tier];
                    return (
                      <div key={tier}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${cfg.badge}`}>{items.length}</span>
                          <span className="text-[11px] text-gray-400">
                            {TIER_RANGES[tier]}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {items.map(result => (
                            <CandidateCard
                              key={result.person.id}
                              result={result}
                              onClick={() => openPerson(result, items)}
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
              </div>
            );
          })}
        </div>
      </main>

      {selection && (
        <PersonPanel
          result={selection.result}
          onClose={() => setSelection(null)}
          peers={selection.peers}
          currentIndex={selection.index}
          onPrev={() => navigateTo(selection.index - 1)}
          onNext={() => navigateTo(selection.index + 1)}
          onAskAI={onAskAI}
        />
      )}
    </div>
  );
}
