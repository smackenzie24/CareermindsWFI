import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, MapPin, ExternalLink, ChevronDown, CheckCircle, AlertCircle, CalendarDays, Sparkles, Lightbulb, ChevronRight, UserX, Users, AlertTriangle } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { FlightRiskTab } from './FlightRiskTab';
import { HiddenTalent } from './HiddenTalent';
import { getFlightRiskPeople, getCrossDeptFitCandidates } from '../../data/promotionData';
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
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            {(result.flightRisk === 'high' || result.flightRisk === 'medium') && (
              <span
                title={`${result.flightRisk === 'high' ? 'High' : 'Medium'} flight risk${result.flightRiskDrivers[0] ? ': ' + result.flightRiskDrivers[0] : ''}`}
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${result.flightRisk === 'high' ? 'bg-red-500' : 'bg-amber-400'}`}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{result.person.name}</p>
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

type RecPriority = 'critical' | 'high' | 'medium';
interface PipelineRec {
  id: string;
  priority: RecPriority;
  title: string;
  rationale: string;
  timeframe: string;
  actions: string[];
}

const PRIORITY_CFG: Record<RecPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500'  },
  high:     { label: 'High',     color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  medium:   { label: 'Medium',   color: 'text-sky-700',   bg: 'bg-sky-50',   border: 'border-sky-200',   dot: 'bg-sky-500'  },
};

function buildRecommendations(results: ReadinessResult[], department: string): PipelineRec[] {
  const recs: PipelineRec[] = [];
  const highRisk  = results.filter(r => r.flightRisk === 'high');
  const medRisk   = results.filter(r => r.flightRisk === 'medium');
  const nearReady = results.filter(r => r.readinessPct >= 90);
  const stalled   = results.filter(r => r.readinessPct < 50);
  const total     = results.length;

  if (highRisk.length > 0) {
    const names = highRisk.map(r => r.person.name.split(' ')[0]).join(', ');
    recs.push({
      id: 'flight-high',
      priority: 'critical',
      title: `Immediate retention action needed for ${highRisk.length === 1 ? names : `${highRisk.length} high-risk employees`}`,
      rationale: `${names} ${highRisk.length === 1 ? 'shows' : 'show'} high flight-risk signals. Losing near-ready or progressing talent stalls the ${department} pipeline and drives up replacement costs.`,
      timeframe: 'This week',
      actions: [
        `Schedule 1:1 stay interviews with ${names} to surface unmet needs`,
        'Review compensation and title against market benchmarks',
        'Identify and accelerate one stretch project or visibility opportunity',
        'Loop in their manager with specific retention talking points',
      ],
    });
  }

  if (medRisk.length > 0) {
    const names = medRisk.map(r => r.person.name.split(' ')[0]).slice(0, 3).join(', ');
    recs.push({
      id: 'flight-medium',
      priority: 'high',
      title: `Monitor and engage ${medRisk.length} at-risk employee${medRisk.length > 1 ? 's' : ''} in ${department}`,
      rationale: `${names}${medRisk.length > 3 ? ' and others' : ''} carry medium flight-risk signals. Early engagement prevents escalation to high risk.`,
      timeframe: 'This month',
      actions: [
        'Add a career-growth conversation to the next monthly 1:1',
        'Confirm their promotion timeline is clear and documented',
        'Identify one concrete milestone they can hit in the next 30 days',
      ],
    });
  }

  if (nearReady.length > 0) {
    const names = nearReady.map(r => r.person.name.split(' ')[0]).slice(0, 3).join(', ');
    recs.push({
      id: 'near-ready',
      priority: nearReady.length >= 3 ? 'high' : 'medium',
      title: `${nearReady.length} near-ready employee${nearReady.length > 1 ? 's' : ''} ready to promote in ${department}`,
      rationale: `${names}${nearReady.length > 3 ? ' and others are' : nearReady.length === 1 ? ' is' : ' are'} at 90%+ readiness. Delaying promotion risks disengagement and flight risk.`,
      timeframe: 'Next 30 days',
      actions: [
        `Open promotion cases for ${names}${nearReady.length > 3 ? ' and others' : ''} in the next review cycle`,
        'Confirm leveling committee has visibility into their readiness data',
        'Prepare a promotion narrative with specific criteria evidence',
        nearReady.length > 1 ? 'Avoid promoting in a cluster — stagger by 1–2 weeks to preserve team dynamics' : 'Communicate timeline to the individual to keep them engaged',
      ],
    });
  }

  if (stalled.length > 0 && total > 3) {
    recs.push({
      id: 'stalled',
      priority: 'medium',
      title: `${stalled.length} employee${stalled.length > 1 ? 's' : ''} in early stage — structured development needed`,
      rationale: `${Math.round((stalled.length / total) * 100)}% of ${department} is below 50% readiness. Without a development plan, this creates a long-term pipeline bottleneck.`,
      timeframe: 'Next quarter',
      actions: [
        'Assign each early-stage employee a senior mentor or buddy',
        'Build individual development plans (IDPs) with quarterly skill milestones',
        'Identify 1–2 cross-functional projects to accelerate skill breadth',
        'Review in 90 days to track progress and adjust plans',
      ],
    });
  }

  return recs;
}

function RecCard({ rec }: { rec: PipelineRec }) {
  const [expanded, setExpanded] = useState(false);
  const pc = PRIORITY_CFG[rec.priority];
  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm ${pc.border}`}>
      <button className="w-full text-left px-5 py-4 flex items-start gap-4" onClick={() => setExpanded(e => !e)}>
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.border} ${pc.color}`}>
              {pc.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{rec.title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.rationale}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className="text-[10px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <Clock size={10} />{rec.timeframe}
          </span>
          <ChevronRight size={14} className={`text-gray-300 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-0 border-t border-gray-50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-3 mb-2">Action plan</p>
          <ol className="space-y-2">
            {rec.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-gray-600 leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function RecommendationsPanel({ recs }: { recs: PipelineRec[] }) {
  const [open, setOpen] = useState(true);
  if (recs.length === 0) return null;
  const criticalCount = recs.filter(r => r.priority === 'critical').length;
  const highCount     = recs.filter(r => r.priority === 'high').length;
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Lightbulb size={15} className="text-amber-400" />
          <span className="text-sm font-bold text-gray-900">Recommendations</span>
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">{criticalCount} critical</span>
            )}
            {highCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">{highCount} high priority</span>
            )}
            {criticalCount === 0 && highCount === 0 && (
              <span className="text-[10px] text-gray-400">{recs.length} suggestions</span>
            )}
          </div>
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 bg-white border-t border-gray-100 space-y-3">
          {recs.map(rec => <RecCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  );
}

function NoCheckInCollapsible({ items, expandedId, onToggle, onViewCheckIn, onAskAI }: {
  items: ReadinessResult[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onViewCheckIn?: () => void;
  onAskAI?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <UserX size={12} className="text-gray-400 flex-shrink-0" />
        <span className="text-[11px] text-gray-400 group-hover:text-gray-600 flex-1 text-left">
          {items.length} with no check-in data
        </span>
        <ChevronDown size={12} className={`text-gray-300 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1.5 space-y-2.5 border-l-2 border-dashed border-gray-200 pl-3 ml-2">
          {items.map(result => (
            <CandidateCard
              key={result.person.id}
              result={result}
              expanded={expandedId === result.person.id}
              onToggle={() => onToggle(result.person.id)}
              onViewCheckIn={onViewCheckIn}
              onAskAI={onAskAI}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// A person has "no check-in data" if they have no lastCheckIn OR zero criteria met
function hasNoCheckIn(r: ReadinessResult): boolean {
  return !r.person.lastCheckIn || r.criteriaMet === 0;
}

type DeptTab = 'pipeline' | 'flight-risk' | 'hidden-talent';

export function DeptPipelineView({ department, onBack, onNavigateToGapReport, onNavigateToManagers, onViewCheckIn, onAskAI, initialPersonId }: Props) {
  const [activeTab, setActiveTab] = useState<DeptTab>('pipeline');

  const allResults = useMemo(() => getAllReadiness(), []);
  const deptResults = useMemo(
    () => allResults.filter(r => r.person.department === department),
    [allResults, department]
  );

  const deptFlightRiskCount = useMemo(
    () => getFlightRiskPeople('medium').filter(e => e.person.department === department).length,
    [department]
  );
  const deptHiddenTalentCount = useMemo(
    () => getCrossDeptFitCandidates().filter(r => r.currentDept === department || r.suggestedDept === department).length,
    [department]
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

  const recommendations = useMemo(
    () => buildRecommendations(deptResults, department),
    [deptResults, department]
  );

  const buckets = useMemo(() => sortedDeptResults.reduce<Record<string, ReadinessResult[]>>(
    (acc, r) => { acc[getReadinessTier(r.readinessPct)].push(r); return acc; },
    { 'ready': [], 'near-ready': [], 'progressing': [], 'developing': [], 'building': [] }
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
          <span className="text-sm font-semibold text-gray-900">{department}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Promotion Pipeline</p>
              <h1 className="text-xl font-bold text-gray-900">{department}</h1>
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

      {/* Dept-level tab bar */}
      <div className="bg-white border-b border-gray-100 px-8 flex items-center gap-0">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pipeline'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Users size={13} />
          Pipeline
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'pipeline' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400'}`}>
            {deptResults.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('flight-risk')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'flight-risk'
              ? 'border-red-400 text-red-700'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <AlertTriangle size={13} />
          Flight Risk
          {deptFlightRiskCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'flight-risk' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
              {deptFlightRiskCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('hidden-talent')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'hidden-talent'
              ? 'border-sky-400 text-sky-700'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Sparkles size={13} />
          Hidden Talent
          {deptHiddenTalentCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'hidden-talent' ? 'bg-sky-50 text-sky-600' : 'bg-gray-100 text-gray-400'}`}>
              {deptHiddenTalentCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-auto p-8">
        {activeTab === 'flight-risk' && (
          <FlightRiskTab
            department={department}
            onSwitchToHiddenTalent={() => setActiveTab('hidden-talent')}
          />
        )}
        {activeTab === 'hidden-talent' && (
          <HiddenTalent filterDept={department} />
        )}
        {activeTab === 'pipeline' && (
        <>
        <div className="grid grid-cols-5 gap-4" data-tour="pipeline-dept-columns">
          {(['ready', 'near-ready', 'progressing', 'developing', 'building'] as const).map(tier => {
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
                  {(() => {
                    const withCheckIn = items.filter(r => !hasNoCheckIn(r));
                    const noCheckIn   = items.filter(r => hasNoCheckIn(r));
                    return (
                      <>
                        {withCheckIn.map(result => (
                          <CandidateCard
                            key={result.person.id}
                            result={result}
                            expanded={expandedId === result.person.id}
                            onToggle={() => togglePerson(result.person.id)}
                            onViewCheckIn={onViewCheckIn}
                            onAskAI={onAskAI}
                          />
                        ))}
                        {withCheckIn.length === 0 && noCheckIn.length === 0 && (
                          <div className="h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-300">None</span>
                          </div>
                        )}
                        <NoCheckInCollapsible
                          items={noCheckIn}
                          expandedId={expandedId}
                          onToggle={togglePerson}
                          onViewCheckIn={onViewCheckIn}
                          onAskAI={onAskAI}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {recommendations.length > 0 && (
          <div className="mt-6">
            <RecommendationsPanel recs={recommendations} />
            {onAskAI && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => onAskAI(`What are the biggest risks and opportunities in the ${department} promotion pipeline?`)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 hover:border-sky-300 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow"
                >
                  <Sparkles size={14} className="text-sky-400" />
                  Ask AI about this pipeline
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <UpsellBanner variant="leadership-dev" />
          <FeedbackBanner context="Promotion Pipeline" />
        </div>
        </>
        )}
      </main>
    </div>
  );
}
