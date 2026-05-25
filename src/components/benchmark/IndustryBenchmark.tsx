import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Users, DollarSign,
  BarChart3, Globe, Star, AlertTriangle, ChevronDown, ChevronUp, Info,
  LogOut, Calendar, Building2, Lightbulb, Clock, ChevronRight,
  UserX, MessageSquareOff, TrendingUp as LevelStall, Banknote, RefreshCw,
  ArrowRight, Briefcase, Zap,
} from 'lucide-react';

import { ExportButtons } from '../ExportButtons';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { MostExpensiveToLose } from '../MostExpensiveToLose';
import {
  getOverviewRecommendations,
  getSkillsRecommendations,
  getCompRecommendations,
  getCompositionRecommendations,
  getTalentFlowRecommendations,
  CATEGORY_LABEL,
  type Recommendation,
  type RecommendationPriority,
} from '../../data/benchmarkRecommendations';
import {
  getOverallBenchmarkSummary,
  getDeptSkillBenchmarks,
  getDeptCompBenchmarks,
  getDeptSizeBenchmarks,
  getOrgBenchmarks,
  getTopDestinations,
  getAttritionTrend,
  computeAttritionScore,
  ATTRITION_RECORDS,
  ACME_TOTAL_HEADCOUNT,
  QUARTILE_CONFIG,
  PEER_COMPANIES,
  SIMILAR_PEERS,
  getCategoryBenchmarks,
  ACME_SKILL_COMPETENCY,
  type CategoryBenchmark,
  type DeptBenchmark,
  type QuartilePosition,
  type PeerCompany,
  type AttritionRecord,
  type HireChannel,
} from '../../data/benchmarkData';
import { DEPT_COLORS, SKILLS_DATA, type Department } from '../../data/mockData';

function fmtK(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

function QuartileBadge({ pos }: { pos: QuartilePosition }) {
  const cfg = QUARTILE_CONFIG[pos];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function DeltaChip({ delta, unit = '', higherIsBetter = true }: { delta: number; unit?: string; higherIsBetter?: boolean }) {
  const positive = higherIsBetter ? delta > 0 : delta < 0;
  const neutral = Math.abs(delta) < 0.05;
  if (neutral) return <span className="text-xs text-gray-400 flex items-center gap-1"><Minus size={11} />At median</span>;
  return (
    <span className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {positive ? '+' : ''}{typeof delta === 'number' && Math.abs(delta) < 10 ? delta.toFixed(1) : Math.round(delta)}{unit} vs median
    </span>
  );
}

function DistributionBar({ benchmark, formatValue }: {
  benchmark: DeptBenchmark;
  formatValue: (v: number) => string;
}) {
  const { quartiles, acmeValue } = benchmark;
  const { min, max, p25, p50, p75 } = quartiles;
  const range = max - min || 1;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <div className="relative h-5 flex items-center mt-1">
      <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
      <div className="absolute h-3 bg-gray-200 rounded-sm" style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }} />
      <div className="absolute h-4 w-0.5 bg-gray-500 rounded-full" style={{ left: `${pct(p50)}%` }} />
      <div
        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md z-10 -translate-x-1/2"
        style={{ left: `${Math.min(Math.max(pct(acmeValue), 2), 98)}%`, background: '#0ea5e9' }}
        title={`Acme: ${formatValue(acmeValue)}`}
      />
      <span className="absolute -bottom-4 left-0 text-[9px] text-gray-400">{formatValue(min)}</span>
      <span className="absolute -bottom-4 right-0 text-[9px] text-gray-400">{formatValue(max)}</span>
    </div>
  );
}

function DeptBenchmarkRow({
  bench,
  formatValue,
  onNavigateToGapReport,
}: {
  bench: DeptBenchmark;
  formatValue: (v: number) => string;
  onNavigateToGapReport?: (dept: import('../../data/mockData').Department) => void;
}) {
  const cfg = QUARTILE_CONFIG[bench.position];
  const showGapLink = (bench.position === 'bottom' || bench.position === 'below-median') && onNavigateToGapReport;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: DEPT_COLORS[bench.department] }}
      >
        {bench.department[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold text-gray-800">{bench.department}</span>
          <div className="flex items-center gap-2">
            <QuartileBadge pos={bench.position} />
            {showGapLink && (
              <button
                onClick={() => onNavigateToGapReport!(bench.department)}
                className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-sky-50 transition-colors border border-sky-100"
              >
                View gaps →
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-black ${cfg.color}`}>{formatValue(bench.acmeValue)}</span>
          <DeltaChip delta={bench.delta} />
        </div>
        <div className="mt-2 mb-5">
          <DistributionBar benchmark={bench} formatValue={formatValue} />
        </div>
        <p className="text-[10px] text-gray-400 mt-5">Peer median: {formatValue(bench.peerMedian)} · Range: {formatValue(bench.quartiles.min)}–{formatValue(bench.quartiles.max)}</p>
      </div>
    </div>
  );
}

// ── Recommendations panel ───────────────────────────────────────────────

const PRIORITY_CONFIG: Record<RecommendationPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
  high:     { label: 'High',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  medium:   { label: 'Medium',   color: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200',    dot: 'bg-sky-500'    },
};

const CATEGORY_COLOR: Record<string, string> = {
  upskilling:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  retention:    'text-red-700 bg-red-50 border-red-200',
  compensation: 'text-amber-700 bg-amber-50 border-amber-200',
  hiring:       'text-sky-700 bg-sky-50 border-sky-200',
  'org-design': 'text-gray-700 bg-gray-100 border-gray-200',
  process:      'text-gray-700 bg-gray-100 border-gray-200',
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(false);
  const pc = PRIORITY_CONFIG[rec.priority];
  const catCls = CATEGORY_COLOR[rec.category] ?? 'text-gray-600 bg-gray-50 border-gray-200';

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm ${pc.border}`}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pc.bg} ${pc.border} ${pc.color}`}>
              {pc.label}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catCls}`}>
              {CATEGORY_LABEL[rec.category]}
            </span>
            {rec.department && (
              <span className="text-[10px] text-gray-400 font-medium">{rec.department}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{rec.title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.rationale}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className="text-[10px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <Clock size={10} />{rec.timeframe}
          </span>
          <ChevronRight
            size={14}
            className={`text-gray-300 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
          />
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

function RecommendationsPanel({ recs, defaultOpen = false }: { recs: Recommendation[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                {criticalCount} critical
              </span>
            )}
            {highCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                {highCount} high priority
              </span>
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
          {recs.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  );
}

const DESTINATION_TYPE_CONFIG: Record<AttritionRecord['destinationType'], { color: string; bg: string; border: string; dot: string }> = {
  'Big Tech':   { color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200',    dot: 'bg-sky-500'    },
  'Scaleup':    { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Startup':    { color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  dot: 'bg-amber-400'  },
  'Enterprise': { color: 'text-gray-700',    bg: 'bg-gray-100',   border: 'border-gray-200',   dot: 'bg-gray-500'   },
  'Competitor': { color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500'    },
  'Unknown':    { color: 'text-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200',   dot: 'bg-gray-300'   },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Source of hire panel ───────────────────────────────────────────────

const HIRE_CHANNEL_LABELS: Record<HireChannel, string> = {
  referral:            'Referral',
  recruiter:           'Recruiter',
  inbound:             'Inbound',
  agency:              'Agency',
  'internal-transfer': 'Internal transfer',
};

const HIRE_CHANNEL_COLORS: Record<HireChannel, { dot: string; bar: string; text: string; bg: string; border: string }> = {
  referral:            { dot: 'bg-emerald-500', bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  recruiter:           { dot: 'bg-sky-500',     bar: 'bg-sky-400',     text: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200'     },
  inbound:             { dot: 'bg-amber-500',   bar: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  agency:              { dot: 'bg-red-400',     bar: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'     },
  'internal-transfer': { dot: 'bg-gray-400',    bar: 'bg-gray-400',    text: 'text-gray-600',    bg: 'bg-gray-100',   border: 'border-gray-200'    },
};

function SourceOfHirePanel({ records }: { records: AttritionRecord[] }) {
  const n = records.length;
  if (n === 0) return null;

  // Source type breakdown (where they came from)
  const sourceTypeCounts = new Map<string, number>();
  const sourceCompanyCounts = new Map<string, { count: number; type: string }>();
  for (const r of records) {
    if (r.sourceType) sourceTypeCounts.set(r.sourceType, (sourceTypeCounts.get(r.sourceType) ?? 0) + 1);
    if (r.sourcePreviousCompany) {
      const existing = sourceCompanyCounts.get(r.sourcePreviousCompany);
      sourceCompanyCounts.set(r.sourcePreviousCompany, {
        count: (existing?.count ?? 0) + 1,
        type: r.sourceType ?? 'Unknown',
      });
    }
  }
  const topSources = Array.from(sourceCompanyCounts.entries())
    .map(([company, v]) => ({ company, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Hire channel breakdown
  const channelCounts = new Map<HireChannel, { count: number; avgTenure: number; tenureSum: number }>();
  for (const r of records) {
    if (r.hireChannel) {
      const existing = channelCounts.get(r.hireChannel);
      channelCounts.set(r.hireChannel, {
        count: (existing?.count ?? 0) + 1,
        tenureSum: (existing?.tenureSum ?? 0) + r.tenureMonths,
        avgTenure: 0,
      });
    }
  }
  const channels = Array.from(channelCounts.entries())
    .map(([channel, v]) => ({ channel, count: v.count, avgTenure: Math.round(v.tenureSum / v.count) }))
    .sort((a, b) => b.count - a.count);

  // Hire-to-leave flow: did people return to where they came from?
  const returnedToOrigin = records.filter(r =>
    r.sourceType && r.destinationType && r.sourceType === r.destinationType
  ).length;
  const returnedToOriginPct = n > 0 ? Math.round((returnedToOrigin / n) * 100) : 0;

  // Avg tenure by source type
  const tenureBySource = new Map<string, number[]>();
  for (const r of records) {
    if (r.sourceType) {
      if (!tenureBySource.has(r.sourceType)) tenureBySource.set(r.sourceType, []);
      tenureBySource.get(r.sourceType)!.push(r.tenureMonths);
    }
  }
  const avgTenureBySource = Array.from(tenureBySource.entries())
    .map(([type, tenures]) => ({
      type,
      avg: Math.round(tenures.reduce((s, t) => s + t, 0) / tenures.length),
      count: tenures.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Briefcase size={15} className="text-gray-400" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">Where they came from</h3>
          <p className="text-xs text-gray-400 mt-0.5">Previous employers, hire channels, and how source background correlates with tenure</p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {/* Top previous companies */}
        <div className="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Previous employers</p>
          <div className="space-y-2.5">
            {topSources.map((s, i) => {
              const cfg = DESTINATION_TYPE_CONFIG[s.type as AttritionRecord['destinationType']] ?? DESTINATION_TYPE_CONFIG['Unknown'];
              const barW = Math.round((s.count / topSources[0].count) * 100);
              return (
                <div key={s.company}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-xs font-medium text-gray-700 truncate">{s.company}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-600 ml-2 flex-shrink-0">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${barW}%` }} />
                  </div>
                  {i === topSources.length - 1 && sourceCompanyCounts.size > 6 && (
                    <p className="text-[10px] text-gray-400 mt-2">+{sourceCompanyCounts.size - 6} more</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hire channel breakdown */}
        <div className="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Hire channel</p>
          <div className="space-y-3">
            {channels.map(ch => {
              const cfg = HIRE_CHANNEL_COLORS[ch.channel];
              const pct = Math.round((ch.count / n) * 100);
              return (
                <div key={ch.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {HIRE_CHANNEL_LABELS[ch.channel]}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-700">{ch.count}</span>
                      <span className="text-[10px] text-gray-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 w-14 text-right">avg {ch.avgTenure}m</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">Avg tenure shown per channel — longer tenure = better hiring ROI for that source.</p>
          </div>
        </div>

        {/* Hire-to-leave insights */}
        <div className="p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Origin vs destination</p>

          {/* Return rate */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight size={12} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Returned to origin type</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black ${returnedToOriginPct >= 40 ? 'text-amber-600' : 'text-gray-700'}`}>
                {returnedToOriginPct}%
              </span>
              <span className="text-xs text-gray-400">of leavers</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
              {returnedToOrigin} of {n} people left to the same category of company they came from.
            </p>
          </div>

          {/* Tenure by source type */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Avg tenure by source</p>
          <div className="space-y-2">
            {avgTenureBySource.map(s => {
              const cfg = DESTINATION_TYPE_CONFIG[s.type as AttritionRecord['destinationType']] ?? DESTINATION_TYPE_CONFIG['Unknown'];
              const maxAvg = avgTenureBySource[0]?.avg || 1;
              return (
                <div key={s.type} className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold w-20 flex-shrink-0 flex items-center gap-1 ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    {s.type}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${(s.avg / maxAvg) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 flex-shrink-0 w-8 text-right">{s.avg}m</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">Hires from Big Tech tend to have shorter tenure — they leave for familiar pay levels sooner.</p>
        </div>
      </div>
    </div>
  );
}

// ── Retention signal chips & commonalities ─────────────────────────────

interface SignalChipProps {
  label: string;
  icon: React.ReactNode;
  variant: 'red' | 'amber' | 'sky' | 'gray';
}

function SignalChip({ label, icon, variant }: SignalChipProps) {
  const cls = {
    red:   'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    sky:   'bg-sky-50 border-sky-200 text-sky-700',
    gray:  'bg-gray-100 border-gray-200 text-gray-500',
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cls}`}>
      <span className="w-3 h-3 flex items-center justify-center">{icon}</span>
      {label}
    </span>
  );
}

function getSignalChips(r: AttritionRecord): SignalChipProps[] {
  const chips: SignalChipProps[] = [];
  if (r.monthsAtLevel !== undefined && r.monthsAtLevel >= 24) {
    chips.push({ label: `${r.monthsAtLevel}m at level`, icon: <LevelStall size={9} />, variant: 'amber' });
  }
  if (r.monthsSinceLastCheckIn !== null && r.monthsSinceLastCheckIn !== undefined && r.monthsSinceLastCheckIn >= 90) {
    chips.push({ label: `${r.monthsSinceLastCheckIn}d no check-in`, icon: <MessageSquareOff size={9} />, variant: 'red' });
  } else if (r.monthsSinceLastCheckIn !== null && r.monthsSinceLastCheckIn !== undefined && r.monthsSinceLastCheckIn >= 30) {
    chips.push({ label: `${r.monthsSinceLastCheckIn}d no check-in`, icon: <MessageSquareOff size={9} />, variant: 'amber' });
  } else if (r.monthsSinceLastCheckIn === null) {
    chips.push({ label: 'No check-in record', icon: <MessageSquareOff size={9} />, variant: 'gray' });
  }
  if (r.skillStagnant) {
    chips.push({ label: 'Skill plateau', icon: <UserX size={9} />, variant: 'amber' });
  }
  if (r.inferredPayGapPct !== undefined && r.inferredPayGapPct >= 20) {
    chips.push({ label: `+${r.inferredPayGapPct}% pay uplift`, icon: <Banknote size={9} />, variant: 'red' });
  } else if (r.inferredPayGapPct !== undefined && r.inferredPayGapPct >= 10) {
    chips.push({ label: `+${r.inferredPayGapPct}% pay uplift`, icon: <Banknote size={9} />, variant: 'amber' });
  } else if (r.inferredPayGapPct !== undefined && r.inferredPayGapPct > 0) {
    chips.push({ label: `+${r.inferredPayGapPct}% pay uplift`, icon: <Banknote size={9} />, variant: 'sky' });
  }
  if (r.recentManagerChange) {
    chips.push({ label: 'Manager change', icon: <RefreshCw size={9} />, variant: 'sky' });
  }
  return chips;
}

interface CommonalityItem {
  label: string;
  count: number;
  pct: number;
  description: string;
  icon: React.ReactNode;
  variant: 'red' | 'amber' | 'sky';
}

function buildCommonalities(records: AttritionRecord[]): CommonalityItem[] {
  const n = records.length;
  if (n === 0) return [];

  const stalledAtLevel = records.filter(r => r.monthsAtLevel !== undefined && r.monthsAtLevel >= 24).length;
  const overdueCheckIn = records.filter(r => r.monthsSinceLastCheckIn != null && r.monthsSinceLastCheckIn >= 90).length;
  const noCheckIn      = records.filter(r => r.monthsSinceLastCheckIn === null).length;
  const skillPlateau   = records.filter(r => r.skillStagnant).length;
  const bigPayGap      = records.filter(r => r.inferredPayGapPct !== undefined && r.inferredPayGapPct >= 20).length;
  const anyPayGap      = records.filter(r => r.inferredPayGapPct !== undefined && r.inferredPayGapPct >= 10).length;
  const managerChange  = records.filter(r => r.recentManagerChange).length;
  const avgPayGap      = records.filter(r => r.inferredPayGapPct !== undefined).reduce((s, r) => s + (r.inferredPayGapPct ?? 0), 0) / (records.filter(r => r.inferredPayGapPct !== undefined).length || 1);

  const items: CommonalityItem[] = [];

  if (stalledAtLevel > 0) {
    items.push({
      label: 'Stalled in level',
      count: stalledAtLevel,
      pct: Math.round((stalledAtLevel / n) * 100),
      description: `Had been in the same level for 24+ months — promotion pathway was unclear or blocked.`,
      icon: <LevelStall size={14} />,
      variant: 'amber',
    });
  }
  if (overdueCheckIn + noCheckIn > 0) {
    const total = overdueCheckIn + noCheckIn;
    items.push({
      label: 'Neglected 1-on-1s',
      count: total,
      pct: Math.round((total / n) * 100),
      description: `Had gone 90+ days without a manager check-in or had no recorded 1:1 at all before departing.`,
      icon: <MessageSquareOff size={14} />,
      variant: 'red',
    });
  }
  if (skillPlateau > 0) {
    items.push({
      label: 'Skill plateau',
      count: skillPlateau,
      pct: Math.round((skillPlateau / n) * 100),
      description: `Showed no measurable skill growth in the 6 months prior to departure — no development path was activated.`,
      icon: <UserX size={14} />,
      variant: 'amber',
    });
  }
  if (anyPayGap > 0) {
    items.push({
      label: 'Market pay gap',
      count: anyPayGap,
      pct: Math.round((anyPayGap / n) * 100),
      description: `Estimated ${Math.round(avgPayGap)}% avg pay uplift at destination — Acme comp was materially below market for their role and level.`,
      icon: <Banknote size={14} />,
      variant: bigPayGap > anyPayGap / 2 ? 'red' : 'amber',
    });
  }
  if (managerChange > 0) {
    items.push({
      label: 'Recent manager change',
      count: managerChange,
      pct: Math.round((managerChange / n) * 100),
      description: `Experienced a manager change within 6 months of leaving — disruption in the manager relationship correlates with elevated flight risk.`,
      icon: <RefreshCw size={14} />,
      variant: 'sky',
    });
  }

  return items.sort((a, b) => b.pct - a.pct);
}

function CommonalitiesPanel({ records }: { records: AttritionRecord[] }) {
  const items = buildCommonalities(records);
  if (items.length === 0) return null;

  const variantCls = {
    red:   { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-700',   bar: 'bg-red-400',   dot: 'bg-red-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-400', dot: 'bg-amber-500' },
    sky:   { bg: 'bg-sky-50',   border: 'border-sky-200',   text: 'text-sky-700',   bar: 'bg-sky-400',   dot: 'bg-sky-500' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <AlertTriangle size={15} className="text-amber-400" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">Leaver commonalities</h3>
          <p className="text-xs text-gray-400 mt-0.5">Signals shared by people who left — use these to shape retention and hiring plans</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map(item => {
          const cls = variantCls[item.variant];
          return (
            <div key={item.label} className="px-6 py-4 flex items-center gap-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls.bg} border ${cls.border}`}>
                <span className={cls.text}>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-gray-800">{item.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cls.bg} ${cls.border} ${cls.text}`}>
                    {item.pct}% of leavers
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${cls.bar}`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-600 flex-shrink-0">{item.count} / {records.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

type PeerFilter = 'all' | 'similar' | 'saas' | 'scaleup';
type DeptMetric = 'skills' | 'compensation' | 'team-size';

const PEER_FILTER_LABELS: Record<PeerFilter, string> = {
  all:     'All peers',
  similar: 'Similar size',
  saas:    'B2B SaaS only',
  scaleup: 'Scaleups',
};

const DEPT_METRIC_OPTIONS: { id: DeptMetric; label: string; icon: React.ReactNode }[] = [
  { id: 'skills',       label: 'Skill Competency', icon: <BarChart3 size={12} /> },
  { id: 'compensation', label: 'Compensation',      icon: <DollarSign size={12} /> },
  { id: 'team-size',    label: 'Team Composition',  icon: <Users size={12} /> },
];

interface Props {
  onNavigateToGapReport?: (dept: import('../../data/mockData').Department) => void;
}

export function IndustryBenchmark({ onNavigateToGapReport }: Props) {
  const [peerFilter, setPeerFilter] = useState<PeerFilter>('similar');
  const [deptMetric, setDeptMetric] = useState<DeptMetric>('skills');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [showAllRecords, setShowAllRecords] = useState(false);

  const peers = useMemo<PeerCompany[]>(() => {
    switch (peerFilter) {
      case 'all':     return PEER_COMPANIES;
      case 'similar': return SIMILAR_PEERS;
      case 'saas':    return PEER_COMPANIES.filter(p => p.industry === 'B2B SaaS');
      case 'scaleup': return PEER_COMPANIES.filter(p => p.size === 'Scaleup');
    }
  }, [peerFilter]);

  // Overview data
  const summary = useMemo(() => getOverallBenchmarkSummary(peers), [peers]);
  const overallCfg = QUARTILE_CONFIG[summary.overallPosition];
  const orgBenchmarks = useMemo(() => getOrgBenchmarks(peers), [peers]);

  // Dept benchmark data
  const skillBenchmarks    = useMemo(() => getDeptSkillBenchmarks(peers), [peers]);
  const compBenchmarks     = useMemo(() => getDeptCompBenchmarks(peers), [peers]);
  const sizeBenchmarks     = useMemo(() => getDeptSizeBenchmarks(peers), [peers]);

  const deptBenchmarks = deptMetric === 'skills' ? skillBenchmarks
    : deptMetric === 'compensation' ? compBenchmarks
    : sizeBenchmarks;

  const deptFormatValue = deptMetric === 'skills' ? (v: number) => v.toFixed(1)
    : deptMetric === 'compensation' ? (v: number) => fmtK(v)
    : (v: number) => `${v.toFixed(1)}%`;

  // Category skill gap benchmarks
  const categoryBenchmarks = useMemo(() => getCategoryBenchmarks(peers), [peers]);

  // Per-dept, per-category Acme competency (for the heatmap)
  const deptCategoryMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    for (const entry of SKILLS_DATA) {
      const dept = entry.department as string;
      const cat  = entry.category;
      if (!matrix[dept]) matrix[dept] = {};
      if (!matrix[dept][cat]) matrix[dept][cat] = 0;
      // weighted mean
      if (!matrix[dept][`${cat}__w`]) matrix[dept][`${cat}__w`] = 0;
      matrix[dept][cat]         += entry.averageActual * entry.headcount;
      matrix[dept][`${cat}__w`] += entry.headcount;
    }
    const result: Record<string, Record<string, number>> = {};
    for (const [dept, cats] of Object.entries(matrix)) {
      result[dept] = {};
      for (const key of Object.keys(cats)) {
        if (key.endsWith('__w')) continue;
        const w = cats[`${key}__w`] ?? 1;
        result[dept][key] = parseFloat((cats[key] / w).toFixed(2));
      }
    }
    return result;
  }, []);

  // Recommendations
  const overviewRecs     = useMemo(() => getOverviewRecommendations(peers),     [peers]);
  const skillsRecs       = useMemo(() => getSkillsRecommendations(peers),       [peers]);
  const compRecs         = useMemo(() => getCompRecommendations(peers),         [peers]);
  const compositionRecs  = useMemo(() => getCompositionRecommendations(peers),  [peers]);
  const talentFlowRecs   = useMemo(() => getTalentFlowRecommendations(),        []);
  const attritionScore   = useMemo(() => computeAttritionScore(ATTRITION_RECORDS, ACME_TOTAL_HEADCOUNT), []);

  const deptMetricRecs = deptMetric === 'skills' ? skillsRecs
    : deptMetric === 'compensation' ? compRecs
    : compositionRecs;

  // Talent flow data
  const attritionDepts = useMemo(
    () => ['All', ...Array.from(new Set(ATTRITION_RECORDS.map(r => r.department))).sort()],
    [],
  );
  const filteredAttrition = useMemo(() =>
    ATTRITION_RECORDS.filter(r => deptFilter === 'All' || r.department === deptFilter)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [deptFilter],
  );
  const topDestinations = useMemo(() => getTopDestinations(filteredAttrition), [filteredAttrition]);
  const trend = useMemo(() => getAttritionTrend(filteredAttrition), [filteredAttrition]);
  const maxTrend = Math.max(...trend.map(t => t.count), 1);
  const visibleRecords = showAllRecords ? filteredAttrition : filteredAttrition.slice(0, 8);
  const totalLeavers = filteredAttrition.length;
  const avgTenure = totalLeavers > 0
    ? Math.round(filteredAttrition.reduce((s, r) => s + r.tenureMonths, 0) / totalLeavers)
    : 0;
  const competitorCount = filteredAttrition.filter(r => r.destinationType === 'Competitor').length;
  const bigTechCount = filteredAttrition.filter(r => r.destinationType === 'Big Tech').length;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Workforce Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900">Industry Benchmarks</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Compare Acme Corp's skill maturity, compensation, and team composition against {PEER_COMPANIES.length} similar SaaS and tech companies. Data aggregated anonymously with customer consent.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <ExportButtons title="Industry Benchmarks" buildContent={() => {
              const cfg = QUARTILE_CONFIG[summary.overallPosition];
              const lines: string[] = [
                'INDUSTRY BENCHMARKS — ACME CORP',
                `Generated: ${new Date().toLocaleDateString()}`,
                '='.repeat(50),
                '',
                `Overall position: ${cfg.label}`,
                `Compared against: ${peers.length} peers`,
                '',
                'STRENGTHS',
                ...summary.topDepts.map(b => `  ${b.department}: ${QUARTILE_CONFIG[b.position].label}`),
                '',
                'AREAS TO IMPROVE',
                ...summary.gapDepts.map(b => `  ${b.department}: ${QUARTILE_CONFIG[b.position].label}`),
              ];
              return lines.join('\n');
            }} />
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-600">Acme Corp</span>
              <span className="text-xs text-gray-400">vs {peers.length} peers</span>
            </div>
          </div>
        </div>

        {/* Peer filter */}
        <div className="flex items-center gap-2" data-tour="benchmark-peer-filter">
          <span className="text-xs font-medium text-gray-500">Compare against:</span>
          <div className="flex items-center gap-1">
            {(Object.entries(PEER_FILTER_LABELS) as [PeerFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeerFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${peerFilter === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-2">{peers.length} companies selected</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* ── Section 1: Overview ──────────────────────────────── */}
          <section className="space-y-6" data-tour="benchmark-overview-card">
            <div className="flex items-center gap-3">
              <Globe size={15} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">Overview</h2>
            </div>

            {/* Overall position */}
            <div className={`rounded-2xl border p-6 ${overallCfg.bg} ${overallCfg.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Overall benchmark position</p>
                  <h2 className={`text-3xl font-black ${overallCfg.color}`}>{overallCfg.label}</h2>
                  <p className="text-sm text-gray-600 mt-2 max-w-xl">
                    Across skill competency, compensation, and org structure, Acme Corp ranks in the <strong>{overallCfg.label.toLowerCase()}</strong> compared to {peers.length} similar-sized SaaS and tech companies.
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${overallCfg.color} bg-white/50 border ${overallCfg.border}`}>
                  {({ top: '1st', 'above-median': '2nd', 'below-median': '3rd', bottom: '4th' })[summary.overallPosition]}
                  <span className="text-xs">Q</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="bg-white/60 rounded-xl p-4 border border-white">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><Star size={11} className="text-emerald-500" />Strengths</p>
                  {summary.topDepts.length > 0 ? (
                    <div className="space-y-1">
                      {summary.topDepts.slice(0, 3).map(b => (
                        <div key={b.department} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">{b.department}</span>
                          <QuartileBadge pos={b.position} />
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">No top-quartile departments yet</p>}
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-white">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><AlertTriangle size={11} className="text-red-400" />Areas to close</p>
                  {summary.gapDepts.length > 0 ? (
                    <div className="space-y-1">
                      {summary.gapDepts.slice(0, 3).map(b => (
                        <div key={b.department} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">{b.department}</span>
                          <QuartileBadge pos={b.position} />
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">All departments at or above median</p>}
                </div>
              </div>
            </div>

            {/* Org-level benchmark cards */}
            <div className="grid grid-cols-2 gap-5" data-tour="benchmark-dist-grid">
              {orgBenchmarks.map(bench => {
                const bCfg = QUARTILE_CONFIG[bench.position];
                return (
                  <div key={bench.label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">{bench.label}</p>
                    <div className="flex items-end gap-3 mb-1">
                      <span className={`text-3xl font-black ${bCfg.color}`}>{bench.acmeValue}{bench.unit}</span>
                      <div className="pb-1 space-y-0.5">
                        <QuartileBadge pos={bench.position} />
                        <DeltaChip delta={bench.delta} unit={bench.unit.includes('months') ? 'm' : ''} higherIsBetter={bench.higherIsBetter} />
                      </div>
                    </div>
                    <div className="mt-4 mb-6">
                      <DistributionBar benchmark={{ ...bench, peerValues: bench.peerValues, quartiles: bench.quartiles, acmeValue: bench.acmeValue, category: '', position: bench.position, peerMedian: bench.peerMedian, delta: bench.delta } as any} formatValue={v => `${v}${bench.unit}`} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-6">Peer range: {bench.quartiles.min}–{bench.quartiles.max}{bench.unit} · Median: {bench.quartiles.p50}{bench.unit}</p>
                  </div>
                );
              })}
            </div>

            {/* Top/bottom skill categories */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" />Strongest skill categories</h3>
                <div className="space-y-3">
                  {summary.topCategories.map(b => (
                    <div key={b.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{b.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{b.acmeValue.toFixed(1)}</span>
                          <DeltaChip delta={b.delta} />
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(b.acmeValue / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown size={14} className="text-red-400" />Largest skill gaps vs peers</h3>
                <div className="space-y-3">
                  {summary.gapCategories.map(b => (
                    <div key={b.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{b.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{b.acmeValue.toFixed(1)}</span>
                          <DeltaChip delta={b.delta} />
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${(b.acmeValue / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peer company cards */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Peer group ({peers.length} companies)</h3>
              <div className="grid grid-cols-4 gap-3">
                {peers.map(peer => (
                  <div key={peer.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-bold text-gray-800 truncate">{peer.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{peer.size} · {peer.industry}</p>
                    <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Headcount</span>
                        <span className="text-[10px] font-semibold text-gray-600">{peer.totalHeadcount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">Framework</span>
                        <span className="text-[10px] font-semibold text-gray-600">{peer.frameworkMaturity}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <RecommendationsPanel recs={overviewRecs} />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* ── Section 2: By Department ─────────────────────────── */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={15} className="text-gray-400" />
                <h2 className="text-base font-bold text-gray-900">By Department</h2>
              </div>
              {/* Metric toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1" data-tour="benchmark-tabs">
                {DEPT_METRIC_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setDeptMetric(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      deptMetric === opt.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span className={deptMetric === opt.id ? 'text-sky-500' : 'text-gray-400'}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context blurb */}
            <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
              <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-sky-700">
                {deptMetric === 'skills' && 'Average skill competency rating (1–5 scale) per department, compared to peer companies. Departments below median link directly to the skill gap report.'}
                {deptMetric === 'compensation' && 'Average annual compensation (USD) per department. Peer data is anonymized and aggregated. Departments below market link to skill gap context.'}
                {deptMetric === 'team-size' && <>Department headcount as a <strong>percentage of total company size</strong>. Acme total: <strong>{ACME_TOTAL_HEADCOUNT}</strong>. Reveals structural differences — e.g. whether you are engineering-heavy or sales-light relative to peers.</>}
              </p>
            </div>

            {/* Composition bar (team-size only) */}
            {deptMetric === 'team-size' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-3">Acme Corp team composition</p>
                <div className="flex h-8 rounded-xl overflow-hidden gap-px mb-3">
                  {sizeBenchmarks.map(b => (
                    <div
                      key={b.department}
                      className="flex items-center justify-center text-white text-[9px] font-bold overflow-hidden"
                      style={{ width: `${b.acmeValue}%`, background: DEPT_COLORS[b.department] }}
                      title={`${b.department}: ${b.acmeValue}%`}
                    >
                      {b.acmeValue > 6 ? `${b.acmeValue}%` : ''}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizeBenchmarks.map(b => (
                    <div key={b.department} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: DEPT_COLORS[b.department] }} />
                      <span className="text-[10px] text-gray-500">{b.department} <strong>{b.acmeValue}%</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {deptBenchmarks.map(b => (
                <DeptBenchmarkRow
                  key={b.department}
                  bench={b}
                  formatValue={deptFormatValue}
                  onNavigateToGapReport={onNavigateToGapReport}
                />
              ))}
            </div>

            <RecommendationsPanel recs={deptMetricRecs} />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* ── Section 3: Skill Gaps vs Peers ──────────────────── */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap size={15} className="text-gray-400" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Skill Gaps vs Peers</h2>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
              <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-sky-700">
                Acme's average skill competency per category compared to the peer median. Categories below median are ranked by gap size — these represent the areas where competitors have a tangible talent advantage and where targeted hiring or upskilling will have the most impact.
              </p>
            </div>

            {/* Gap callout cards — worst 4 categories */}
            {(() => {
              const gaps = categoryBenchmarks.filter(b => b.delta < 0).slice(0, 4);
              if (gaps.length === 0) return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <p className="text-sm font-bold text-emerald-700">No categories below peer median</p>
                  <p className="text-xs text-emerald-600 mt-1">Acme is at or above median across all skill categories for the selected peer group.</p>
                </div>
              );
              return (
                <div className="grid grid-cols-2 gap-4">
                  {gaps.map((b, i) => {
                    const isWorst = i === 0;
                    const severity = b.delta < -0.5 ? 'critical' : b.delta < -0.25 ? 'high' : 'medium';
                    const sev = {
                      critical: { bg: 'bg-red-50',   border: 'border-red-200',   color: 'text-red-700',   bar: 'bg-red-400',   badge: 'bg-red-100 border-red-200 text-red-700',   label: 'Critical gap' },
                      high:     { bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700', bar: 'bg-amber-400', badge: 'bg-amber-100 border-amber-200 text-amber-700', label: 'High priority' },
                      medium:   { bg: 'bg-sky-50',   border: 'border-sky-200',   color: 'text-sky-700',   bar: 'bg-sky-400',   badge: 'bg-sky-100 border-sky-200 text-sky-700',   label: 'Moderate gap' },
                    }[severity];

                    // Find which depts are weakest in this category
                    const deptScores = Object.entries(deptCategoryMatrix)
                      .filter(([, cats]) => cats[b.category] !== undefined)
                      .map(([dept, cats]) => ({ dept: dept as Department, score: cats[b.category] }))
                      .sort((a, c) => a.score - c.score)
                      .slice(0, 3);

                    return (
                      <div key={b.category} className={`rounded-2xl border p-5 ${sev.bg} ${sev.border}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {isWorst && <AlertTriangle size={13} className={sev.color} />}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}>{sev.label}</span>
                            </div>
                            <h3 className={`text-base font-black ${sev.color}`}>{b.category}</h3>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black leading-none ${sev.color}`}>{b.acmeValue.toFixed(1)}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Acme avg / 5</p>
                          </div>
                        </div>

                        {/* Gap bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-500">Peer median: <strong>{b.peerMedian.toFixed(1)}</strong></span>
                            <span className={`text-[10px] font-bold ${sev.color}`}>{b.delta.toFixed(2)} behind</span>
                          </div>
                          <div className="relative h-3 bg-white/60 rounded-full overflow-hidden border border-white">
                            <div className="absolute h-full bg-gray-200 rounded-full" style={{ width: `${(b.peerMedian / 5) * 100}%` }} />
                            <div className={`absolute h-full rounded-full ${sev.bar}`} style={{ width: `${(b.acmeValue / 5) * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                            <span>0</span><span>5.0</span>
                          </div>
                        </div>

                        {/* Weakest depts */}
                        {deptScores.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Weakest in this category</p>
                            <div className="flex flex-wrap gap-1.5">
                              {deptScores.map(d => (
                                <span
                                  key={d.dept}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                                  style={{ background: DEPT_COLORS[d.dept] }}
                                >
                                  {d.dept} · {d.score.toFixed(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Full category ranking table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">All skill categories ranked by gap</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{categoryBenchmarks.filter(b => b.delta < 0).length} categories below peer median · {categoryBenchmarks.filter(b => b.delta >= 0).length} at or above</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Below median</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Above median</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {categoryBenchmarks.map((b) => {
                  const isAbove = b.delta >= 0;
                  const absGap  = Math.abs(b.delta);
                  const maxGap  = Math.max(...categoryBenchmarks.map(c => Math.abs(c.delta)), 0.01);
                  // Depts present in this category
                  const deptsWithCat = Object.entries(deptCategoryMatrix)
                    .filter(([, cats]) => cats[b.category] !== undefined)
                    .map(([dept]) => dept as Department);

                  return (
                    <div key={b.category} className="flex items-center gap-4 px-6 py-3">
                      {/* Category name + dept dots */}
                      <div className="w-36 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{b.category}</p>
                        <div className="flex gap-0.5 mt-1">
                          {deptsWithCat.map(d => (
                            <span key={d} className="w-2 h-2 rounded-full" style={{ background: DEPT_COLORS[d] }} title={d} />
                          ))}
                        </div>
                      </div>

                      {/* Acme score */}
                      <div className="w-10 text-right flex-shrink-0">
                        <span className={`text-sm font-black ${isAbove ? 'text-emerald-600' : 'text-red-600'}`}>{b.acmeValue.toFixed(1)}</span>
                      </div>

                      {/* Gap bar — centered on peer median */}
                      <div className="flex-1 relative flex items-center" style={{ height: 20 }}>
                        {/* Baseline tick (peer median) */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                        {isAbove ? (
                          <div
                            className="absolute h-3 bg-emerald-400 rounded-r-full"
                            style={{
                              left: '50%',
                              width: `${Math.min((absGap / maxGap) * 45, 45)}%`,
                            }}
                          />
                        ) : (
                          <div
                            className={`absolute h-3 rounded-l-full ${absGap > 0.5 ? 'bg-red-400' : absGap > 0.25 ? 'bg-amber-400' : 'bg-amber-300'}`}
                            style={{
                              right: '50%',
                              width: `${Math.min((absGap / maxGap) * 45, 45)}%`,
                            }}
                          />
                        )}
                      </div>

                      {/* Peer median */}
                      <div className="w-10 text-left flex-shrink-0">
                        <span className="text-xs text-gray-400">{b.peerMedian.toFixed(1)}</span>
                      </div>

                      {/* Delta chip */}
                      <div className="w-20 text-right flex-shrink-0">
                        <span className={`text-xs font-bold ${isAbove ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isAbove ? '+' : ''}{b.delta.toFixed(2)}
                        </span>
                      </div>

                      {/* Quartile badge */}
                      <div className="w-24 flex-shrink-0 flex justify-end">
                        <QuartileBadge pos={b.position} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-[10px] text-gray-400">
                <span>Dept dots show which teams contribute to each category</span>
                <span className="ml-auto">Acme score · ← Peer median → · Delta vs median · Quartile</span>
              </div>
            </div>

            {/* Dept × Category mini-heatmap */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Department × skill category heatmap</h3>
                <p className="text-xs text-gray-400 mt-0.5">Each cell shows Acme's average competency for that dept/category combination. Red cells are below the peer median for that category.</p>
              </div>
              <div className="overflow-x-auto">
                {(() => {
                  const depts = Object.keys(deptCategoryMatrix) as Department[];
                  // Only show categories that appear in at least one dept
                  const cats = categoryBenchmarks.filter(b =>
                    depts.some(d => deptCategoryMatrix[d]?.[b.category] !== undefined)
                  );

                  return (
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-2 text-gray-400 font-semibold w-28 sticky left-0 bg-white z-10">Category</th>
                          {depts.map(d => (
                            <th key={d} className="px-2 py-2 text-center font-bold min-w-[68px]">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black" style={{ background: DEPT_COLORS[d] }}>{d[0]}</div>
                                <span className="text-gray-500 leading-tight text-[9px]">{d.split(' ')[0]}</span>
                              </div>
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center text-gray-400 font-semibold min-w-[60px]">Peer<br/>median</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cats.map((b, ri) => (
                          <tr key={b.category} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                            <td className="px-4 py-2 font-semibold text-gray-700 sticky left-0 bg-inherit z-10 whitespace-nowrap">{b.category}</td>
                            {depts.map(d => {
                              const val = deptCategoryMatrix[d]?.[b.category];
                              if (val === undefined) return (
                                <td key={d} className="px-2 py-2 text-center text-gray-200">—</td>
                              );
                              const belowMedian = val < b.peerMedian;
                              const gap = val - b.peerMedian;
                              const intensity = Math.min(Math.abs(gap) / 1.2, 1);
                              const bgStyle = belowMedian
                                ? `rgba(239,68,68,${0.08 + intensity * 0.22})`
                                : `rgba(16,185,129,${0.08 + intensity * 0.18})`;
                              return (
                                <td key={d} className="px-2 py-2 text-center" style={{ background: bgStyle }}>
                                  <span className={`font-bold ${belowMedian ? 'text-red-700' : 'text-emerald-700'}`}>{val.toFixed(1)}</span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center font-semibold text-gray-500">{b.peerMedian.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.25)' }} />Below peer median</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.2)' }} />At or above peer median</span>
                <span className="ml-auto">— = category not assessed for this department</span>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* ── Section 4: Talent Flow ───────────────────────────── */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <LogOut size={15} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-900">Talent Flow</h2>
            </div>

            <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
              <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-sky-700">
                Shows employees who left Acme Corp in the last 12 months and the companies they joined.
                Data sourced from exit interviews and publicly available LinkedIn signals.
              </p>
            </div>

            {/* Attrition score card */}
            <div className={`rounded-2xl border p-6 ${attritionScore.riskBg} ${attritionScore.riskBorder}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Attrition Risk Score</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className={`text-5xl font-black leading-none ${attritionScore.riskColor}`}>
                      {attritionScore.score}
                    </span>
                    <div>
                      <span className={`text-base font-bold ${attritionScore.riskColor}`}>/100</span>
                      <span className={`ml-2 text-sm font-bold ${attritionScore.riskColor}`}>{attritionScore.riskLabel} risk</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 max-w-xl">{attritionScore.headline}</p>
                </div>
                {/* Score bar */}
                <div className="flex-shrink-0 w-40">
                  <div className="relative h-3 bg-white/60 rounded-full overflow-hidden border border-white mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        attritionScore.score >= 70 ? 'bg-red-400' :
                        attritionScore.score >= 45 ? 'bg-amber-400' :
                        attritionScore.score >= 25 ? 'bg-sky-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${attritionScore.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Low</span><span>High</span>
                  </div>
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Annualised rate', value: `${attritionScore.annualisedRate}%`, sub: `Peer median: ${attritionScore.peerMedianRate}%`, warn: attritionScore.annualisedRate > attritionScore.peerMedianRate },
                  { label: 'To competitors',  value: `${attritionScore.competitorPct}%`,  sub: 'of leavers',                                      warn: attritionScore.competitorPct >= 20 },
                  { label: 'Comp-driven',     value: `${attritionScore.compDrivenPct}%`,  sub: 'cited pay as reason',                             warn: attritionScore.compDrivenPct >= 40 },
                  { label: 'Avg tenure exit', value: `${attritionScore.avgTenureMonths}m`,sub: 'months at exit',                                   warn: attritionScore.avgTenureMonths < 18 },
                ].map(m => (
                  <div key={m.label} className="bg-white/60 rounded-xl px-4 py-3 border border-white">
                    <p className={`text-xl font-black leading-none ${m.warn ? attritionScore.riskColor : 'text-gray-700'}`}>{m.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1.5">{m.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dept filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Department:</span>
              <div className="flex flex-wrap gap-1">
                {attritionDepts.map(d => (
                  <button
                    key={d}
                    onClick={() => setDeptFilter(d)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${deptFilter === d ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total leavers',      value: String(totalLeavers),   sub: 'last 12 months',                                                                                icon: <LogOut size={16} />,    color: 'text-gray-700',  iconColor: 'text-gray-400' },
                { label: 'Avg tenure at exit', value: `${avgTenure}m`,        sub: 'months in role',                                                                               icon: <Calendar size={16} />,  color: 'text-amber-600', iconColor: 'text-amber-400' },
                { label: 'Went to Big Tech',   value: String(bigTechCount),   sub: `${totalLeavers > 0 ? Math.round((bigTechCount    / totalLeavers) * 100) : 0}% of leavers`,    icon: <Building2 size={16} />, color: bigTechCount    > 4 ? 'text-amber-600' : 'text-gray-700', iconColor: bigTechCount    > 4 ? 'text-amber-400' : 'text-gray-400' },
                { label: 'Went to competitors',value: String(competitorCount),sub: `${totalLeavers > 0 ? Math.round((competitorCount / totalLeavers) * 100) : 0}% of leavers`,    icon: <Building2 size={16} />, color: competitorCount > 3 ? 'text-red-600'    : 'text-gray-700', iconColor: competitorCount > 3 ? 'text-red-400'    : 'text-gray-400' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className={`mb-2 ${kpi.iconColor}`}>{kpi.icon}</div>
                  <p className={`text-2xl font-black leading-none ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{kpi.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_320px] gap-6">
              {/* Top destinations */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Top destinations</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Companies that received the most Acme alumni</p>
                </div>
                <div>
                  {topDestinations.length === 0 ? (
                    <div className="px-6 py-10 text-center text-xs text-gray-400">No departures match the current filters.</div>
                  ) : topDestinations.map((dest, i) => {
                    const cfg = DESTINATION_TYPE_CONFIG[dest.type];
                    const barWidth = Math.round((dest.count / topDestinations[0].count) * 100);
                    return (
                      <div key={dest.company} className={`flex items-center gap-4 px-6 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="w-6 flex-shrink-0 text-center">
                          <span className={`text-sm font-black ${i === 0 ? 'text-gray-800' : 'text-gray-400'}`}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-800 truncate">{dest.company}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                              {dest.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {dest.departments.map(d => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{d}</span>
                            ))}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${cfg.dot}`} style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-black text-gray-800">{dest.count}</p>
                          <p className="text-[10px] text-gray-400">{dest.count === 1 ? 'person' : 'people'}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Avg tenure: <span className="font-semibold text-gray-600">{dest.avgTenureMonths}m</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly trend + destination breakdown */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Monthly departures</h3>
                  <p className="text-xs text-gray-400 mb-4">Last 12 months</p>
                  <div className="flex items-end gap-1.5 h-28">
                    {trend.map(t => {
                      const h = Math.round((t.count / maxTrend) * 100);
                      return (
                        <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                          <span className="text-[9px] font-semibold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{t.count}</span>
                          <div
                            className="w-full rounded-t-sm bg-gray-200 group-hover:bg-sky-400 transition-colors"
                            style={{ height: `${Math.max(h, 4)}%` }}
                          />
                          <span className="text-[8px] text-gray-400 rotate-45 origin-left w-4 block mt-0.5 truncate">{t.month.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">By destination type</h3>
                  <div className="space-y-2.5">
                    {(Object.keys(DESTINATION_TYPE_CONFIG) as AttritionRecord['destinationType'][]).map(type => {
                      const count = filteredAttrition.filter(r => r.destinationType === type).length;
                      if (count === 0) return null;
                      const cfg = DESTINATION_TYPE_CONFIG[type];
                      const pct = Math.round((count / totalLeavers) * 100);
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold flex items-center gap-1.5 ${cfg.color}`}>
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              {type}
                            </span>
                            <span className="text-xs font-bold text-gray-700">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Source of hire */}
            <SourceOfHirePanel records={filteredAttrition} />

            {/* Leaver commonalities */}
            <CommonalitiesPanel records={filteredAttrition} />

            {/* Departure log */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Departure log</h3>
                <p className="text-xs text-gray-400 mt-0.5">{filteredAttrition.length} records · sorted by most recent</p>
              </div>
              <div className="grid grid-cols-[130px_150px_100px_140px_140px_70px_1fr] gap-3 px-6 py-2.5 border-b border-gray-100 bg-gray-50">
                {['Date', 'Person', 'Dept', 'Came from', 'Went to', 'Tenure', 'Risk signals'].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
                ))}
              </div>
              {visibleRecords.map((r, i) => {
                const typeCfg = DESTINATION_TYPE_CONFIG[r.destinationType];
                const srcCfg  = DESTINATION_TYPE_CONFIG[(r.sourceType ?? 'Unknown') as AttritionRecord['destinationType']];
                const chips = getSignalChips(r);
                return (
                  <div
                    key={`${r.name}-${r.date}`}
                    className={`grid grid-cols-[130px_150px_100px_140px_140px_70px_1fr] gap-3 px-6 py-3 items-start ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <span className="text-xs text-gray-500 pt-0.5">{fmtDate(r.date)}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{r.level}{r.hireChannel ? ` · via ${HIRE_CHANNEL_LABELS[r.hireChannel]}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-500 pt-0.5">{r.department}</span>
                    <div className="flex items-start gap-1.5 min-w-0 pt-0.5">
                      {r.sourcePreviousCompany ? (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${srcCfg.dot}`} />
                          <div>
                            <span className="text-xs font-medium text-gray-700 truncate block">{r.sourcePreviousCompany}</span>
                            <span className={`text-[10px] ${srcCfg.color}`}>{r.sourceType}</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 min-w-0 pt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${typeCfg.dot}`} />
                      <div>
                        <span className="text-xs font-medium text-gray-700 truncate block">{r.destination}</span>
                        <span className={`text-[10px] ${typeCfg.color}`}>{r.destinationType}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 pt-0.5">{r.tenureMonths}m</span>
                    <div className="flex flex-wrap gap-1">
                      {chips.length > 0
                        ? chips.map((chip, ci) => <SignalChip key={ci} {...chip} />)
                        : <span className="text-[10px] text-gray-300">—</span>
                      }
                    </div>
                  </div>
                );
              })}
              {filteredAttrition.length > 8 && (
                <div className="px-6 py-3 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => setShowAllRecords(s => !s)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showAllRecords ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showAllRecords ? 'Show fewer' : `Show all ${filteredAttrition.length} departures`}
                  </button>
                </div>
              )}
            </div>

            <RecommendationsPanel recs={talentFlowRecs} />
          </section>

          <MostExpensiveToLose limit={5} showMethodology className="mt-8" />
          <UpsellBanner variant="talent-development" className="mt-4" />
          <FeedbackBanner context="Industry Benchmarks" className="mt-4" />
        </div>
      </main>
    </div>
  );
}
