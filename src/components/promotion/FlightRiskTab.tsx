import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, ArrowRight, ChevronDown, ChevronUp, Sparkles, Info, Zap, Shield, ChevronRight } from 'lucide-react';
import {
  getFlightRiskPeople,
  DEPT_COLORS,
  LEVEL_DEFINITIONS,
  type FlightRisk,
  type FlightRiskPerson,
  type Department,
} from '../../data/promotionData';
import { MostExpensiveToLose } from '../MostExpensiveToLose';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';

type RiskFilter = 'all' | 'high' | 'medium';

type RecPriority = 'critical' | 'high' | 'medium';
interface FlightRec { id: string; priority: RecPriority; title: string; rationale: string; actions: string[]; timeframe: string; }

const REC_PRIORITY_CFG: Record<RecPriority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-500'  },
  high:     { label: 'High',     color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  medium:   { label: 'Medium',   color: 'text-sky-700',   bg: 'bg-sky-50',   border: 'border-sky-200',   dot: 'bg-sky-500'  },
};

function buildFlightRecs(entries: FlightRiskPerson[]): FlightRec[] {
  const recs: FlightRec[] = [];
  const high   = entries.filter(e => e.flightRisk === 'high');
  const medium = entries.filter(e => e.flightRisk === 'medium');
  const withOpp = entries.filter(e => e.hasInternalOpportunity);

  if (high.length > 0) {
    const names = high.map(e => e.person.name.split(' ')[0]).slice(0, 3).join(', ');
    recs.push({
      id: 'high-risk',
      priority: 'critical',
      title: `Immediate retention action needed for ${high.length === 1 ? names : `${high.length} high-risk employees`}`,
      rationale: `${names}${high.length > 3 ? ' and others' : ''} show high flight-risk signals. Acting this week significantly increases the chance of retention.`,
      timeframe: 'This week',
      actions: [
        `Schedule stay interviews with ${names}${high.length > 3 ? ' and others' : ''} to surface unmet needs`,
        'Review compensation and title against current market benchmarks',
        'Identify one stretch project or visibility opportunity to offer immediately',
        'Loop in their manager with specific retention talking points',
      ],
    });
  }

  if (medium.length > 0) {
    const names = medium.map(e => e.person.name.split(' ')[0]).slice(0, 3).join(', ');
    recs.push({
      id: 'medium-risk',
      priority: 'high',
      title: `Proactively engage ${medium.length} medium-risk employee${medium.length > 1 ? 's' : ''} before signals escalate`,
      rationale: `${names}${medium.length > 3 ? ' and others' : ''} carry medium flight-risk signals. Early engagement prevents escalation to high risk.`,
      timeframe: 'This month',
      actions: [
        'Add a career-growth conversation to the next monthly 1:1',
        'Confirm their promotion timeline is clear and documented',
        'Identify one concrete milestone they can hit in the next 30 days',
        'Check in on workload and team dynamics — often an early warning sign',
      ],
    });
  }

  if (withOpp.length > 0) {
    const names = withOpp.map(e => e.person.name.split(' ')[0]).slice(0, 3).join(', ');
    recs.push({
      id: 'internal-opp',
      priority: 'medium',
      title: `${withOpp.length} at-risk employee${withOpp.length > 1 ? 's' : ''} have an internal mobility match — act before they look externally`,
      rationale: `${names}${withOpp.length > 3 ? ' and others' : ''} are flight risks with an available internal opportunity. Internal moves are one of the most effective retention levers.`,
      timeframe: 'Next 2 weeks',
      actions: [
        'Surface the internal opportunity as a career conversation, not a directive',
        'Involve the potential receiving manager early to gauge fit',
        'Move quickly — flight-risk windows are short',
        'Document the internal move as a win in your retention data',
      ],
    });
  }

  return recs;
}

function FlightRecCard({ rec }: { rec: FlightRec }) {
  const [expanded, setExpanded] = useState(false);
  const pc = REC_PRIORITY_CFG[rec.priority];
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

function FlightRecsPanel({ recs }: { recs: FlightRec[] }) {
  const [open, setOpen] = useState(true);
  if (recs.length === 0) return null;
  const criticalCount = recs.filter(r => r.priority === 'critical').length;
  const highCount     = recs.filter(r => r.priority === 'high').length;
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-900">Recommendations</span>
          {criticalCount > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              {highCount} high
            </span>
          )}
        </div>
        <ChevronRight size={15} className={`text-gray-300 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {recs.map(rec => <FlightRecCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  );
}

const RISK_CONFIG: Record<FlightRisk, { label: string; dot: string; bg: string; border: string; text: string; badgeBg: string }> = {
  high:   { label: 'High',   dot: 'bg-red-500',    bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700',    badgeBg: 'bg-red-100' },
  medium: { label: 'Medium', dot: 'bg-amber-400',  bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-700',  badgeBg: 'bg-amber-100' },
  low:    { label: 'Low',    dot: 'bg-emerald-400', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', badgeBg: 'bg-emerald-100' },
};

function levelLabel(levelId: string): string {
  return LEVEL_DEFINITIONS.find(l => l.id === levelId)?.shortLabel ?? levelId;
}

function CheckInAgo({ days }: { days: number }) {
  const color = days > 60 ? 'text-red-600' : days > 30 ? 'text-amber-600' : 'text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${color}`}>
      <Clock size={10} />
      {days}d since check-in
    </span>
  );
}

function PersonCard({ entry, onViewOpportunity }: { entry: FlightRiskPerson; onViewOpportunity?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[entry.flightRisk];
  const deptColor = DEPT_COLORS[entry.person.department] ?? '#6b7280';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${entry.flightRisk === 'high' ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: deptColor }}
              >
                {entry.person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              {entry.flightRisk === 'high' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none">{entry.person.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: deptColor, background: `${deptColor}18` }}
                >
                  {entry.person.department}
                </span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[11px] text-gray-500">{levelLabel(entry.person.currentLevelId)}</span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[11px] text-gray-500">{entry.person.team}</span>
              </div>
            </div>
          </div>

          {/* Right: risk badge + expand */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label} risk
            </span>
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Key signals row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <CheckInAgo days={entry.daysSinceCheckIn} />
          <span className="text-[11px] text-gray-400">·</span>
          <span className="text-[11px] text-gray-500">{entry.person.tenure}m at level · {entry.person.location}</span>
          {entry.hasInternalOpportunity && (
            <>
              <span className="text-[11px] text-gray-400">·</span>
              <button
                onClick={onViewOpportunity}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 transition-colors"
              >
                <Sparkles size={10} />
                Internal opportunity available
                <ArrowRight size={10} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded drivers */}
      {expanded && (
        <div className={`border-t px-5 py-4 space-y-3 ${cfg.bg} ${cfg.border}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>
            Revelio Labs · Risk drivers
          </p>
          <div className="space-y-2">
            {entry.flightRiskDrivers.map((driver, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                <span className="text-xs text-gray-700">{driver}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 bg-white/70 border border-white rounded-xl p-3 mt-1">
            <Info size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Suggested action: schedule a growth conversation, review comp against market, and explore internal mobility if applicable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  onSwitchToHiddenTalent?: () => void;
  department?: Department;
}

export function FlightRiskTab({ onSwitchToHiddenTalent, department }: Props) {
  const [filter, setFilter] = useState<RiskFilter>('all');
  const allGlobal = useMemo(() => getFlightRiskPeople('medium'), []);
  const all = useMemo(
    () => department ? allGlobal.filter(e => e.person.department === department) : allGlobal,
    [allGlobal, department]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return all;
    return all.filter(e => e.flightRisk === filter);
  }, [all, filter]);

  const highCount = all.filter(e => e.flightRisk === 'high').length;
  const mediumCount = all.filter(e => e.flightRisk === 'medium').length;
  const withOpportunity = all.filter(e => e.hasInternalOpportunity).length;
  const recs = useMemo(() => buildFlightRecs(all), [all]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-base font-bold text-gray-900">Flight Risk</h2>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Revelio Labs
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-xl">
            Employees flagged by Revelio Labs' job-switching propensity model. Sorted by risk level and days since last check-in.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-shrink-0">
          <Shield size={13} className="text-amber-500" />
          <p className="text-[11px] text-amber-700 font-medium">For managers only · Confidential</p>
        </div>
      </div>

      {/* Summary stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-red-600">{highCount}</p>
          <p className="text-xs text-red-500 font-medium mt-0.5">High risk</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-amber-600">{mediumCount}</p>
          <p className="text-xs text-amber-500 font-medium mt-0.5">Medium risk</p>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <div>
            <p className="text-2xl font-black text-sky-600">{withOpportunity}</p>
            <p className="text-xs text-sky-500 font-medium mt-0.5">Internal match available</p>
          </div>
          {withOpportunity > 0 && (
            <button
              onClick={onSwitchToHiddenTalent}
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 transition-colors flex-shrink-0"
            >
              <Sparkles size={10} />
              View
              <ArrowRight size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {(['all', 'high', 'medium'] as RiskFilter[]).map(f => {
          const count = f === 'all' ? all.length : f === 'high' ? highCount : mediumCount;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'
              }`}
            >
              {f === 'all' ? 'All' : `${f.charAt(0).toUpperCase() + f.slice(1)} risk`} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <Zap size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No flight risk signals detected</p>
          <p className="text-xs text-gray-400 mt-1">Connect Revelio Labs to surface real-time job-switching propensity data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(entry => (
            <PersonCard
              key={entry.person.id}
              entry={entry}
              onViewOpportunity={onSwitchToHiddenTalent}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <Info size={12} />
          <span>
            Flight risk scored by Revelio Labs job-switching propensity model. Factors include LinkedIn activity, tenure plateau, compensation gap, and engagement signals. For internal retention use only.
          </span>
        </div>
      )}

      <MostExpensiveToLose limit={5} showMethodology department={department} />
      <FlightRecsPanel recs={recs} />
      <UpsellBanner variant="outplacement" />
      <FeedbackBanner context="Talent Signals" />
    </div>
  );
}
