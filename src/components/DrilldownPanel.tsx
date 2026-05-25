import { X, TrendingDown, Target, AlertTriangle, TrendingUp, Star, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SkillGapEntry } from '../data/mockData';
import {
  getCandidatesForSkill,
  getBlockedCandidatesForSkill,
  getReadinessTier,
  TIER_CONFIG,
  type SkillCandidateMatch,
} from '../data/promotionData';

interface DrilldownPanelProps {
  skill: string;
  entries: SkillGapEntry[];
  groupBy: 'department' | 'manager';
  department?: string; // present when viewing a specific dept heatmap
  onClose: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToPerson?: (personId: string, department: string) => void;
  onAskAI?: (question: string) => void;
}

function getBarColor(pct: number): string {
  if (pct < 30) return 'bg-emerald-400';
  if (pct < 50) return 'bg-amber-400';
  if (pct < 70) return 'bg-orange-400';
  return 'bg-red-500';
}

function getBadgeColor(pct: number): string {
  if (pct < 30) return 'bg-emerald-100 text-emerald-700';
  if (pct < 50) return 'bg-amber-100 text-amber-700';
  if (pct < 70) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function CandidateChip({ match, variant, onNavigateToPerson }: { match: SkillCandidateMatch; variant: 'met' | 'blocked'; onNavigateToPerson?: (personId: string, department: string) => void }) {
  const tier = getReadinessTier(match.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = match.person.name.split(' ').map(n => n[0]).join('');
  const nextTitle = match.targetLevelLabel.split('·')[1]?.trim() ?? match.targetLevelLabel;

  return (
    <button
      onClick={() => onNavigateToPerson?.(match.person.id, match.person.department)}
      className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${variant === 'met' ? 'bg-teal-50 border-teal-100 hover:bg-teal-100 hover:border-teal-200' : 'bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200'} ${onNavigateToPerson ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{match.person.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{match.person.team} · {nextTitle}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
          {match.readinessPct}%
        </span>
        {variant === 'met' ? (
          <span className="text-[10px] font-semibold text-teal-600">{match.actualRating}/{match.requiredRating}</span>
        ) : (
          <span className="text-[10px] font-semibold text-red-500">{match.actualRating}/{match.requiredRating}</span>
        )}
      </div>
    </button>
  );
}

export function DrilldownPanel({ skill, entries, groupBy, department, onClose, onNavigateToPipeline, onNavigateToPerson, onAskAI }: DrilldownPanelProps) {
  const [pipelineCollapsed, setPipelineCollapsed] = useState(false);

  const sorted = [...entries].sort((a, b) => {
    const gapA = (a.belowTarget / a.headcount) || 0;
    const gapB = (b.belowTarget / b.headcount) || 0;
    return gapB - gapA;
  });

  const totalHeadcount = entries.reduce((s, e) => s + e.headcount, 0);
  const totalBelow = entries.reduce((s, e) => s + e.belowTarget, 0);
  const avgActual = entries.length ? entries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / totalHeadcount : 0;
  const worstEntry = sorted[0];
  const isOverall = totalHeadcount > 0 && avgActual > (entries[0]?.expectedLevel ?? 0);

  // Pipeline bridge data
  const promoCandidates = getCandidatesForSkill(skill, department);
  const blockedCandidates = getBlockedCandidatesForSkill(skill, department);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-100" data-tour="drilldown-header">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Skill drill-down</p>
          <h2 className="text-xl font-bold text-gray-900">{skill}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Across {entries.length} {groupBy === 'manager' ? 'teams' : 'departments'}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-gray-100" data-tour="drilldown-stats">
        {isOverall ? (
          <div className="bg-brand-blue-bg4 rounded-lg px-2.5 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp size={11} className="text-brand-blue" />
              <span className="text-[10px] text-brand-blue font-medium">Exceeding</span>
            </div>
            <p className="text-base font-bold text-brand-blue">
              +{(avgActual - (entries[0]?.expectedLevel ?? 0)).toFixed(1)}
            </p>
          </div>
        ) : (
          <div className="bg-red-50 rounded-lg px-2.5 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown size={11} className="text-red-400" />
              <span className="text-[10px] text-red-500 font-medium">Below</span>
            </div>
            <p className="text-base font-bold text-red-600">
              {totalHeadcount > 0 ? Math.round((totalBelow / totalHeadcount) * 100) : 0}%
              <span className="text-xs font-normal text-red-400 ml-0.5">({totalBelow})</span>
            </p>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Target size={11} className="text-gray-400" />
            <span className="text-[10px] text-gray-500 font-medium">Avg level</span>
          </div>
          <p className="text-base font-bold text-gray-900">
            {avgActual.toFixed(1)}
            <span className="text-xs font-normal text-gray-400 ml-0.5">/ {entries[0]?.expectedLevel}</span>
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <AlertTriangle size={11} className="text-amber-400" />
            <span className="text-[10px] text-amber-600 font-medium">Worst area</span>
          </div>
          <p className="text-xs font-bold text-amber-700 leading-tight">
            {worstEntry ? (groupBy === 'manager' ? worstEntry.team : worstEntry.department) : '—'}
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Promotion pipeline bridge */}
        {(promoCandidates.length > 0 || blockedCandidates.length > 0) && (
          <div className="border-b border-gray-100" data-tour="drilldown-pipeline">
            {/* Section header — always visible, toggles body */}
            <button
              onClick={() => setPipelineCollapsed(c => !c)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Promotion pipeline
                </p>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {promoCandidates.length + blockedCandidates.length}
                </span>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {pipelineCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </span>
            </button>

            {!pipelineCollapsed && (
              <div className="px-6 pb-5">
                {/* People who already meet this skill for their next level */}
                {promoCandidates.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Star size={12} className="text-teal-500" />
                      <span className="text-xs font-semibold text-teal-700">
                        {promoCandidates.length} {promoCandidates.length === 1 ? 'person meets' : 'people meet'} next-level criteria
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {promoCandidates.map(m => (
                        <CandidateChip key={m.person.id} match={m} variant="met" onNavigateToPerson={onNavigateToPerson} />
                      ))}
                    </div>
                  </div>
                )}

                {/* People blocked on this skill for their next level */}
                {blockedCandidates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <AlertTriangle size={12} className="text-red-400" />
                      <span className="text-xs font-semibold text-red-600">
                        {blockedCandidates.length} {blockedCandidates.length === 1 ? 'person is' : 'people are'} blocked by this skill
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {blockedCandidates.map(m => (
                        <CandidateChip key={m.person.id} match={m} variant="blocked" onNavigateToPerson={onNavigateToPerson} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Breakdown bars — §5.7 */}
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Breakdown by {groupBy === 'manager' ? 'team' : 'department'}
          </p>
          <div className="space-y-4">
            {sorted.map((entry, i) => {
              const pct = entry.headcount > 0 ? Math.round((entry.belowTarget / entry.headcount) * 100) : 0;
              const isEntryExceeding = entry.averageActual > entry.expectedLevel;
              const label = groupBy === 'manager' ? entry.team : entry.department;
              const surplus = isEntryExceeding ? parseFloat((entry.averageActual - entry.expectedLevel).toFixed(1)) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-gray-700 truncate">{label}</span>
                      {groupBy === 'manager' && (
                        <span className="text-[10px] text-gray-400 truncate">{entry.team}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      {isEntryExceeding ? (
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">+{surplus}</span>
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400">{entry.belowTarget}/{entry.headcount}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getBadgeColor(pct)}`}>{pct}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                    {isEntryExceeding ? (
                      <div className="absolute inset-0 bg-sky-200 rounded-full" />
                    ) : (
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${getBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Actual: {entry.averageActual.toFixed(1)}</span>
                    <span>Expected: {entry.expectedLevel}.0</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0" data-tour="drilldown-actions">
        <p className="text-xs text-gray-500 mb-3">Suggested actions</p>
        <div className="space-y-2">
          {promoCandidates.length > 0 ? (
            <button
              onClick={onNavigateToPipeline}
              className="w-full text-left text-sm text-brand-blue bg-brand-blue-bg4 border border-brand-blue-bg2 rounded-lg px-3 py-2.5 hover:bg-brand-blue-bg3 hover:border-brand-blue-bg transition-colors font-medium"
            >
              View {promoCandidates.length} promotion-ready in pipeline &rarr;
            </button>
          ) : (
            <button className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              Find mentors with this skill &rarr;
            </button>
          )}
          <button
            onClick={() => onAskAI?.(`What should we do about the ${skill} skill gap${department ? ` in ${department}` : ''}?`)}
            className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Sparkles size={13} className="text-gray-400 flex-shrink-0" />
            Ask AI about this skill gap &rarr;
          </button>
          <button className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Export gap report &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
