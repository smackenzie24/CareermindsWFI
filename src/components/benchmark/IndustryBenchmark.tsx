import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Users, DollarSign,
  BarChart3, Globe, Star, AlertTriangle, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import {
  getOverallBenchmarkSummary,
  getDeptSkillBenchmarks,
  getDeptCompBenchmarks,
  getDeptSizeBenchmarks,
  getCategoryBenchmarks,
  getOrgBenchmarks,
  QUARTILE_CONFIG,
  PEER_COMPANIES,
  SIMILAR_PEERS,
  ACME_TOTAL_HEADCOUNT,
  ACME_DEPT_PCT,
  ACME_FRAMEWORK_MATURITY,
  ACME_PROMOTION_VELOCITY,
  type DeptBenchmark,
  type CategoryBenchmark,
  type QuartilePosition,
  type PeerCompany,
} from '../../data/benchmarkData';
import { DEPT_COLORS, type Department } from '../../data/mockData';

type TabId = 'overview' | 'skills' | 'compensation' | 'team-size' | 'categories';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Overview',          icon: <Globe size={13} /> },
  { id: 'skills',       label: 'Skill Competency',  icon: <BarChart3 size={13} /> },
  { id: 'compensation', label: 'Compensation',       icon: <DollarSign size={13} /> },
  { id: 'team-size',    label: 'Team Composition',   icon: <Users size={13} /> },
  { id: 'categories',   label: 'Skill Categories',  icon: <Star size={13} /> },
];

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

// Inline box-plot style bar showing where Acme sits in peer distribution
function DistributionBar({ benchmark, formatValue }: {
  benchmark: DeptBenchmark | CategoryBenchmark;
  formatValue: (v: number) => string;
}) {
  const { quartiles, acmeValue } = benchmark;
  const { min, max, p25, p50, p75 } = quartiles;
  const range = max - min || 1;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <div className="relative h-5 flex items-center mt-1">
      {/* Track */}
      <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
      {/* IQR box */}
      <div
        className="absolute h-3 bg-gray-200 rounded-sm"
        style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }}
      />
      {/* Median line */}
      <div
        className="absolute h-4 w-0.5 bg-gray-500 rounded-full"
        style={{ left: `${pct(p50)}%` }}
      />
      {/* Acme dot */}
      <div
        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md z-10 -translate-x-1/2"
        style={{ left: `${Math.min(Math.max(pct(acmeValue), 2), 98)}%`, background: '#0ea5e9' }}
        title={`Acme: ${formatValue(acmeValue)}`}
      />
      {/* Labels */}
      <span className="absolute -bottom-4 left-0 text-[9px] text-gray-400">{formatValue(min)}</span>
      <span className="absolute -bottom-4 right-0 text-[9px] text-gray-400">{formatValue(max)}</span>
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────────────

function OverviewTab({ peers }: { peers: PeerCompany[] }) {
  const summary = useMemo(() => getOverallBenchmarkSummary(peers), [peers]);
  const cfg = QUARTILE_CONFIG[summary.overallPosition];
  const orgBenchmarks = useMemo(() => getOrgBenchmarks(peers), [peers]);

  return (
    <div className="space-y-8">
      {/* Overall position card */}
      <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`} data-tour="benchmark-overview-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Overall benchmark position</p>
            <h2 className={`text-3xl font-black ${cfg.color}`}>{cfg.label}</h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              Across skill competency, compensation, and org structure, Acme Corp ranks in the <strong>{cfg.label.toLowerCase()}</strong> compared to {peers.length} similar-sized SaaS and tech companies.
            </p>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${cfg.color} bg-white/50 border ${cfg.border}`}>
            {({ top: '1st', 'above-median': '2nd', 'below-median': '3rd', bottom: '4th' })[summary.overallPosition]}
            <span className="text-xs">Q</span>
          </div>
        </div>

        {/* Insight callouts */}
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

      {/* Org-level benchmarks */}
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
    </div>
  );
}

// ── Dept benchmark table ────────────────────────────────────────────────

function DeptBenchmarkRow({
  bench,
  formatValue,
  label,
  onNavigateToGapReport,
}: {
  bench: DeptBenchmark;
  formatValue: (v: number) => string;
  label: string;
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
          <DeltaChip delta={bench.delta} unit={label === 'comp' ? '' : ''} />
        </div>
        <div className="mt-2 mb-5">
          <DistributionBar benchmark={bench} formatValue={formatValue} />
        </div>
        <p className="text-[10px] text-gray-400 mt-5">Peer median: {formatValue(bench.peerMedian)} · Range: {formatValue(bench.quartiles.min)}–{formatValue(bench.quartiles.max)}</p>
      </div>
    </div>
  );
}

type TabProps = { peers: PeerCompany[]; onNavigateToGapReport?: (dept: import('../../data/mockData').Department) => void };

function SkillsTab({ peers, onNavigateToGapReport }: TabProps) {
  const benchmarks = useMemo(() => getDeptSkillBenchmarks(peers), [peers]);
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
        <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-sky-700">Average skill competency rating (1–5 scale) per department, compared to peer companies. Departments below median link directly to the skill gap report.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {benchmarks.map(b => (
          <DeptBenchmarkRow key={b.department} bench={b} formatValue={v => v.toFixed(1)} label="skill" onNavigateToGapReport={onNavigateToGapReport} />
        ))}
      </div>
    </div>
  );
}

function CompensationTab({ peers, onNavigateToGapReport }: TabProps) {
  const benchmarks = useMemo(() => getDeptCompBenchmarks(peers), [peers]);
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
        <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-sky-700">Average annual compensation (USD) per department. Peer data is anonymized and aggregated. Departments below market link to skill gap context.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {benchmarks.map(b => (
          <DeptBenchmarkRow key={b.department} bench={b} formatValue={v => fmtK(v)} label="comp" onNavigateToGapReport={onNavigateToGapReport} />
        ))}
      </div>
    </div>
  );
}

function TeamSizeTab({ peers, onNavigateToGapReport }: TabProps) {
  const benchmarks = useMemo(() => getDeptSizeBenchmarks(peers), [peers]);
  const acmeTotalHC = ACME_TOTAL_HEADCOUNT;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
        <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-sky-700">
          Department headcount as a <strong>percentage of total company size</strong>. Acme total: <strong>{acmeTotalHC}</strong>.
          This reveals structural differences — e.g. whether you are engineering-heavy or sales-light relative to peers.
        </p>
      </div>

      {/* Visual composition bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 mb-3">Acme Corp team composition</p>
        <div className="flex h-8 rounded-xl overflow-hidden gap-px mb-3">
          {benchmarks.map(b => (
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
          {benchmarks.map(b => (
            <div key={b.department} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: DEPT_COLORS[b.department] }} />
              <span className="text-[10px] text-gray-500">{b.department} <strong>{b.acmeValue}%</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {benchmarks.map(b => (
          <DeptBenchmarkRow key={b.department} bench={b} formatValue={v => `${v.toFixed(1)}%`} label="size" onNavigateToGapReport={onNavigateToGapReport} />
        ))}
      </div>
    </div>
  );
}

function CategoriesTab({ peers }: { peers: PeerCompany[] }) {
  const benchmarks = useMemo(() => getCategoryBenchmarks(peers), [peers]);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? benchmarks : benchmarks.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-4">
        <Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-sky-700">Average competency by skill category across all departments, sorted by gap to peer median. Sorted worst gaps first.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_80px_80px_160px_120px] gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Acme</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Median</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peer distribution</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Position</span>
        </div>
        {visible.map((b, i) => {
          const cfg = QUARTILE_CONFIG[b.position];
          return (
            <div
              key={b.category}
              className={`grid grid-cols-[1fr_80px_80px_160px_120px] gap-3 px-5 py-3 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
            >
              <span className="text-xs font-medium text-gray-700">{b.category}</span>
              <span className={`text-sm font-black text-center ${cfg.color}`}>{b.acmeValue.toFixed(1)}</span>
              <span className="text-xs font-semibold text-gray-500 text-center">{b.peerMedian.toFixed(1)}</span>
              <div className="relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
                {(() => {
                  const { min, max, p25, p75, p50 } = b.quartiles;
                  const range = max - min || 1;
                  const pct = (v: number) => ((v - min) / range) * 100;
                  return (
                    <>
                      <div className="absolute h-3 bg-gray-200 rounded-sm" style={{ left: `${pct(p25)}%`, width: `${pct(p75) - pct(p25)}%` }} />
                      <div className="absolute h-4 w-0.5 bg-gray-400" style={{ left: `${pct(p50)}%` }} />
                      <div
                        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 -translate-x-1/2"
                        style={{ left: `${Math.min(Math.max(pct(b.acmeValue), 2), 98)}%`, background: '#0ea5e9' }}
                      />
                    </>
                  );
                })()}
              </div>
              <div className="text-right">
                <QuartileBadge pos={b.position} />
                <DeltaChip delta={b.delta} />
              </div>
            </div>
          );
        })}
      </div>
      {benchmarks.length > 12 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mx-auto"
        >
          {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showAll ? 'Show fewer' : `Show all ${benchmarks.length} categories`}
        </button>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────

type PeerFilter = 'all' | 'similar' | 'saas' | 'scaleup';

const PEER_FILTER_LABELS: Record<PeerFilter, string> = {
  all:     'All peers',
  similar: 'Similar size',
  saas:    'B2B SaaS only',
  scaleup: 'Scaleups',
};

interface Props {
  initialTab?: TabId;
  onNavigateToGapReport?: (dept: import('../../data/mockData').Department) => void;
}

export function IndustryBenchmark({ initialTab, onNavigateToGapReport }: Props) {
  const [tab, setTab] = useState<TabId>(initialTab ?? 'overview');
  const [peerFilter, setPeerFilter] = useState<PeerFilter>('similar');

  const peers = useMemo<PeerCompany[]>(() => {
    switch (peerFilter) {
      case 'all':     return PEER_COMPANIES;
      case 'similar': return SIMILAR_PEERS;
      case 'saas':    return PEER_COMPANIES.filter(p => p.industry === 'B2B SaaS');
      case 'scaleup': return PEER_COMPANIES.filter(p => p.size === 'Scaleup');
    }
  }, [peerFilter]);

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
              const summary = getOverallBenchmarkSummary(peers);
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

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-8" data-tour="benchmark-tabs">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              <span className={tab === t.id ? 'text-sky-500' : 'text-gray-400'}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {tab === 'overview'     && <OverviewTab peers={peers} />}
          {tab === 'skills'       && <SkillsTab peers={peers} onNavigateToGapReport={onNavigateToGapReport} />}
          {tab === 'compensation' && <CompensationTab peers={peers} onNavigateToGapReport={onNavigateToGapReport} />}
          {tab === 'team-size'    && <TeamSizeTab peers={peers} onNavigateToGapReport={onNavigateToGapReport} />}
          {tab === 'categories'   && <CategoriesTab peers={peers} />}
          {/* Careerminds upsell — contextual to compensation tab, general otherwise */}
          <UpsellBanner
            variant={tab === 'compensation' ? 'comp-review' : 'talent-development'}
            className="mt-8"
          />
          <FeedbackBanner context="Industry Benchmarks" className="mt-4" />
        </div>
      </main>
    </div>
  );
}
