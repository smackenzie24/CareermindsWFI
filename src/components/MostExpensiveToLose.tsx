import { useState } from 'react';
import {
  DollarSign, AlertTriangle, Clock, Users, Zap,
  TrendingDown, ShieldAlert, ChevronDown,
} from 'lucide-react';
import {
  getTopReplacementCosts,
  type ReplacementEntry,
  type CostBreakdown,
} from '../data/replacementCost';
import { DEPT_COLORS, type Department } from '../data/mockData';

// ── Score ring SVG ────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r      = 20;
  const circ   = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color  = score >= 75 ? '#ef4444' : score >= 55 ? '#f59e0b' : '#0ea5e9';

  return (
    <svg width={50} height={50} viewBox="0 0 50 50" className="flex-shrink-0">
      <circle cx={25} cy={25} r={r} fill="none" stroke="#f3f4f6" strokeWidth={4.5} />
      <circle
        cx={25} cy={25} r={r}
        fill="none" stroke={color} strokeWidth={4.5}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text
        x={25} y={25} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fontWeight={800} fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Breakdown bars ────────────────────────────────────────────────────────

const DIMS: { key: keyof CostBreakdown; label: string; icon: React.ReactNode; bar: string; tip: string }[] = [
  {
    key:   'seniorityCost',
    label: 'Replacement cost',
    icon:  <DollarSign size={10} />,
    bar:   'bg-sky-400',
    tip:   'Recruiter fee + salary burn during ramp-up period',
  },
  {
    key:   'knowledgeRisk',
    label: 'Knowledge scarcity',
    icon:  <Zap size={10} />,
    bar:   'bg-amber-400',
    tip:   'Skills they hold at a high level with little backup coverage on the team',
  },
  {
    key:   'pipelineStake',
    label: 'Pipeline investment',
    icon:  <TrendingDown size={10} />,
    bar:   'bg-emerald-400',
    tip:   'Near-ready = leadership pipeline about to pay off. Losing them forfeits that ROI',
  },
  {
    key:   'peerGapWeight',
    label: 'Peer gap amplifier',
    icon:  <ShieldAlert size={10} />,
    bar:   'bg-rose-400',
    tip:   'Strong in skill categories where Acme already trails industry benchmarks',
  },
  {
    key:   'flightUrgency',
    label: 'Flight risk urgency',
    icon:  <AlertTriangle size={10} />,
    bar:   'bg-orange-400',
    tip:   'Probability-weighted: flight risk × total cost = urgency to act',
  },
];

function BreakdownBars({ breakdown }: { breakdown: CostBreakdown }) {
  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
        Score breakdown  <span className="font-normal text-gray-300">(each dimension 0–20)</span>
      </p>
      {DIMS.map(d => {
        const val = breakdown[d.key];
        return (
          <div key={d.key} className="group relative flex items-center gap-2">
            <span className="text-gray-400 w-3 flex-shrink-0">{d.icon}</span>
            <span className="text-[10px] text-gray-500 w-28 flex-shrink-0 truncate">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${d.bar}`} style={{ width: `${(val / 20) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-600 w-5 text-right">{val}</span>
            {/* Tooltip */}
            <div className="absolute left-32 bottom-full mb-1 z-20 hidden group-hover:block pointer-events-none">
              <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 w-52 leading-relaxed shadow-lg">
                {d.tip}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Flight risk pill ──────────────────────────────────────────────────────

const RISK_CFG = {
  high:   { label: 'High flight risk',   cls: 'bg-red-50 border-red-200 text-red-700'     },
  medium: { label: 'Medium flight risk', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  low:    { label: 'Low flight risk',    cls: 'bg-gray-100 border-gray-200 text-gray-500'  },
};

// ── Single person row / card ──────────────────────────────────────────────

function EntryCard({
  entry, rank, expanded, onToggle,
}: {
  entry: ReplacementEntry;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const riskCfg   = RISK_CFG[entry.flightRisk];
  const deptColor = DEPT_COLORS[entry.department] ?? '#6b7280';
  const scoreColor =
    entry.totalScore >= 75 ? '#ef4444' :
    entry.totalScore >= 55 ? '#f59e0b' : '#0ea5e9';
  const borderColor =
    entry.totalScore >= 75 ? 'border-red-200 hover:border-red-300' :
    entry.totalScore >= 55 ? 'border-amber-200 hover:border-amber-300' :
    'border-gray-100 hover:border-gray-200';

  return (
    <div className={`rounded-xl border bg-white overflow-hidden transition-all ${borderColor}`}>
      {/* Summary row — always visible */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        onClick={onToggle}
      >
        {/* Rank badge */}
        <span
          className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center flex-shrink-0"
          style={{ background: rank === 1 ? scoreColor : '#f3f4f6', color: rank === 1 ? '#fff' : '#9ca3af' }}
        >
          {rank}
        </span>

        {/* Dept colour stripe */}
        <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: deptColor }} />

        {/* Name / role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-gray-800 truncate">{entry.name}</span>
            {entry.isManager && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide flex-shrink-0">
                Manager
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 flex-wrap">
            <span className="truncate max-w-[140px]">{entry.role}</span>
            <span className="text-gray-200">·</span>
            <span style={{ color: deptColor }}>{entry.department}</span>
            {entry.isManager && entry.reportCount != null && (
              <>
                <span className="text-gray-200">·</span>
                <span className="flex items-center gap-0.5"><Users size={9} />{entry.reportCount} reports</span>
              </>
            )}
          </div>
        </div>

        {/* Cost + ramp */}
        <div className="text-right flex-shrink-0 hidden sm:block mr-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">Est. cost</p>
          <p className="text-xs font-black text-gray-700 mt-0.5">
            ${Math.round(entry.estimatedCostUsd / 1000)}K+
          </p>
          <p className="text-[9px] text-gray-400 flex items-center gap-0.5 justify-end mt-0.5">
            <Clock size={8} />{entry.rampMonths}m ramp
          </p>
        </div>

        {/* Score ring */}
        <ScoreRing score={entry.totalScore} />

        <ChevronDown
          size={13}
          className={`text-gray-300 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {/* Flight risk + cost mobile */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskCfg.cls}`}>
              <AlertTriangle size={9} />
              {riskCfg.label}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 sm:hidden">
              Est. ${Math.round(entry.estimatedCostUsd / 1000)}K+ · <Clock size={8} className="mx-0.5" />{entry.rampMonths}m ramp
            </span>
          </div>

          {/* Reasons */}
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Why they're expensive to lose
            </p>
            <ul className="space-y-1.5">
              {entry.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: deptColor }}
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <BreakdownBars breakdown={entry.breakdown} />
        </div>
      )}
    </div>
  );
}

// ── Methodology callout ───────────────────────────────────────────────────

function MethodologyBar() {
  return (
    <div className="flex items-start gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
        <span className="font-semibold text-gray-500">Score  =</span>
        {DIMS.map((d, i) => (
          <span key={d.key} className="flex items-center gap-1">
            <span className="text-gray-300">{i > 0 ? '+' : ''}</span>
            <span className="text-gray-400">{d.icon}</span>
            <span>{d.label}</span>
            <span className="text-gray-300">(0–20)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Score legend ──────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 flex-wrap text-[10px]">
      {[
        { range: '75–100', label: 'Critical',  color: 'text-red-600',   dot: 'bg-red-400'   },
        { range: '55–74',  label: 'High',      color: 'text-amber-600', dot: 'bg-amber-400' },
        { range: '0–54',   label: 'Standard',  color: 'text-sky-600',   dot: 'bg-sky-400'   },
      ].map(s => (
        <span key={s.range} className={`flex items-center gap-1 font-medium ${s.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.range} {s.label}
        </span>
      ))}
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────

interface Props {
  department?: Department;
  limit?: number;
  showMethodology?: boolean;
  className?: string;
}

export function MostExpensiveToLose({
  department,
  limit = 5,
  showMethodology = true,
  className = '',
}: Props) {
  const entries = getTopReplacementCosts(limit, department);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const top = entries[0];

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={15} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Most Expensive to Lose</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
              Composite retention cost score across five independent risk dimensions. People at the top represent the highest financial, knowledge, and strategic exposure if they leave.
            </p>
          </div>

          {/* Highest-risk callout */}
          {top && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Highest exposure</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">{top.name}</p>
              <p
                className="text-xs font-bold mt-0.5"
                style={{ color: top.totalScore >= 75 ? '#ef4444' : '#f59e0b' }}
              >
                Score {top.totalScore} / 100
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Methodology strip */}
      {showMethodology && <MethodologyBar />}

      {/* Cards */}
      <div className="p-4 space-y-2">
        {entries.map((entry, i) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            rank={i + 1}
            expanded={expandedId === entry.id}
            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <Legend />
      </div>
    </div>
  );
}
