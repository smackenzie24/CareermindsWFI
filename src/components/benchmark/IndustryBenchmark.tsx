import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Users, DollarSign,
  BarChart3, Globe, Star, AlertTriangle, ChevronDown, ChevronUp, Info,
  LogOut, Calendar, Building2,
} from 'lucide-react';

import { ExportButtons } from '../ExportButtons';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import {
  getOverallBenchmarkSummary,
  getDeptSkillBenchmarks,
  getDeptCompBenchmarks,
  getDeptSizeBenchmarks,
  getOrgBenchmarks,
  getTopDestinations,
  getAttritionTrend,
  ATTRITION_RECORDS,
  QUARTILE_CONFIG,
  PEER_COMPANIES,
  SIMILAR_PEERS,
  ACME_TOTAL_HEADCOUNT,
  type DeptBenchmark,
  type QuartilePosition,
  type PeerCompany,
  type AttritionRecord,
} from '../../data/benchmarkData';
import { DEPT_COLORS } from '../../data/mockData';

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
          </section>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* ── Section 3: Talent Flow ───────────────────────────── */}
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

            {/* Departure log */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Departure log</h3>
                <p className="text-xs text-gray-400 mt-0.5">{filteredAttrition.length} records · sorted by most recent</p>
              </div>
              <div className="grid grid-cols-[160px_1fr_120px_120px_110px] gap-3 px-6 py-2.5 border-b border-gray-100 bg-gray-50">
                {['Date', 'Person', 'Department', 'Destination', 'Tenure'].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</span>
                ))}
              </div>
              {visibleRecords.map((r, i) => {
                const typeCfg = DESTINATION_TYPE_CONFIG[r.destinationType];
                return (
                  <div
                    key={`${r.name}-${r.date}`}
                    className={`grid grid-cols-[160px_1fr_120px_120px_110px] gap-3 px-6 py-3 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <span className="text-xs text-gray-500">{fmtDate(r.date)}</span>
                    <span className="text-xs font-semibold text-gray-800">{r.name}</span>
                    <span className="text-xs text-gray-500">{r.department}</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeCfg.dot}`} />
                      <span className="text-xs font-medium text-gray-700 truncate">{r.destination}</span>
                    </div>
                    <span className="text-xs text-gray-500">{r.tenureMonths}m</span>
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
          </section>

          <UpsellBanner variant="talent-development" className="mt-4" />
          <FeedbackBanner context="Industry Benchmarks" className="mt-4" />
        </div>
      </main>
    </div>
  );
}
