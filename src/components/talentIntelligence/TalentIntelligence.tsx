import { useState } from 'react';
import {
  Zap, TrendingUp, DollarSign, Star, Award, BookOpen, GitBranch,
  Lightbulb, ChevronRight, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Minus, Users, BarChart3, Activity,
} from 'lucide-react';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import {
  ROLE_DEMAND, FLIGHT_RISK, COMP_POSITIONING, PRESTIGE_DATA,
  PROMOTION_RATES, SKILL_SIGNALS, CAREER_PATH_NODES, TALENT_INTEL_RECS,
  REVELIO_DEPTS,
  type RevelioDept, type TalentIntelRec, type CareerPathNode, type RoleDemandRow,
} from '../../data/revelioData';

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, badge }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-wider flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

function PriorityDot({ p }: { p: TalentIntelRec['priority'] }) {
  const cls = p === 'critical' ? 'bg-red-500' : p === 'high' ? 'bg-amber-400' : 'bg-sky-400';
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cls}`} />;
}

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
      <ArrowUpRight size={9} />Rising
    </span>
  );
  if (trend === 'falling') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
      <ArrowDownRight size={9} />Falling
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
      <Minus size={9} />Stable
    </span>
  );
}

function CompTierBadge({ tier }: { tier: 'extreme' | 'high' | 'moderate' | 'low' }) {
  const map = {
    extreme: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-amber-100 text-amber-700 border-amber-200',
    moderate: 'bg-sky-100 text-sky-700 border-sky-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${map[tier]}`}>
      {tier}
    </span>
  );
}

function PercentileBar({ value, label }: { value: number; label?: string }) {
  const color = value >= 50 ? 'bg-emerald-400' : value >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
      {label && <span className="text-[11px] text-gray-500 w-12 text-right flex-shrink-0">{label}</span>}
    </div>
  );
}

// ── Panel 1: Talent Supply & Demand ──────────────────────────────────────────

// Quadrant config: X = demand growth (high = scarcer over time), Y = supply scarcity (100 - talentSupply)
const QUADRANTS = [
  {
    id: 'act-now',
    label: 'Act Now',
    desc: 'Rising demand, scarce supply',
    x: 'high', y: 'high',
    bg: 'bg-red-50', border: 'border-red-200', labelColor: 'text-red-700', dotColor: 'bg-red-400',
  },
  {
    id: 'monitor',
    label: 'Monitor',
    desc: 'Demand growing but supply adequate',
    x: 'high', y: 'low',
    bg: 'bg-amber-50', border: 'border-amber-200', labelColor: 'text-amber-700', dotColor: 'bg-amber-400',
  },
  {
    id: 'protect',
    label: 'Protect',
    desc: 'Hard to find but demand stabilising',
    x: 'low', y: 'high',
    bg: 'bg-sky-50', border: 'border-sky-200', labelColor: 'text-sky-700', dotColor: 'bg-sky-400',
  },
  {
    id: 'advantage',
    label: 'Advantage',
    desc: 'Plentiful talent, stable demand',
    x: 'low', y: 'low',
    bg: 'bg-emerald-50', border: 'border-emerald-200', labelColor: 'text-emerald-700', dotColor: 'bg-emerald-400',
  },
] as const;

type QuadrantId = typeof QUADRANTS[number]['id'];

function getQuadrant(row: RoleDemandRow): QuadrantId {
  const scarcity = 100 - row.talentSupply; // high = scarce
  const growthHigh = row.demandGrowthPct >= 14;
  const scarce = scarcity >= 55;
  if (growthHigh && scarce) return 'act-now';
  if (growthHigh && !scarce) return 'monitor';
  if (!growthHigh && scarce) return 'protect';
  return 'advantage';
}

function SupplyDemandPanel() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Sort by urgency: extreme first, then by days to fill desc
  const TIER_ORDER = { extreme: 0, high: 1, moderate: 2, low: 3 };
  const sorted = [...ROLE_DEMAND].sort((a, b) =>
    TIER_ORDER[a.competitionTier] - TIER_ORDER[b.competitionTier] ||
    b.medianDaysToFill - a.medianDaysToFill
  );

  const selected = sorted.find(r => r.role === selectedRole) ?? sorted[0];

  // Group into quadrants
  const byQuadrant = QUADRANTS.map(q => ({
    ...q,
    roles: sorted.filter(r => getQuadrant(r) === q.id),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<Zap size={16} />}
        title="Talent Supply & Demand"
        subtitle="Where each role sits on the market pressure map — rising demand vs shrinking supply"
        badge="Revelio Labs"
      />

      {/* Quadrant map */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {byQuadrant.map(q => (
          <div key={q.id} className={`rounded-xl border ${q.border} ${q.bg} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${q.dotColor}`} />
              <span className={`text-xs font-extrabold ${q.labelColor}`}>{q.label}</span>
              <span className="text-[10px] text-gray-400 ml-auto">{q.roles.length} role{q.roles.length !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">{q.desc}</p>
            <div className="space-y-1.5">
              {q.roles.length === 0
                ? <span className="text-[11px] text-gray-300 italic">None</span>
                : q.roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => setSelectedRole(r.role === selectedRole ? null : r.role)}
                      className={`w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                        selected?.role === r.role
                          ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                          : 'hover:bg-white/70 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{r.role}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{r.dept}</span>
                    </button>
                  ))
              }
            </div>
          </div>
        ))}
      </div>

      {/* Axis legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-5 px-1">
        <span>← Demand growth: low</span>
        <span className="font-semibold text-gray-500">Supply vs Demand Quadrant</span>
        <span>Demand growth: high →</span>
      </div>

      {/* Role detail strip — shows for selected role */}
      {selected && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-base font-extrabold text-gray-900">{selected.role}</h4>
                <CompTierBadge tier={selected.competitionTier} />
              </div>
              <span className="text-xs text-gray-500">{selected.dept}</span>
            </div>
            <div className={`rounded-xl px-4 py-2 text-center flex-shrink-0 ${
              selected.medianDaysToFill >= 55 ? 'bg-red-100 border border-red-200' :
              selected.medianDaysToFill >= 40 ? 'bg-amber-100 border border-amber-200' :
              'bg-emerald-100 border border-emerald-200'
            }`}>
              <div className={`text-2xl font-extrabold ${
                selected.medianDaysToFill >= 55 ? 'text-red-700' :
                selected.medianDaysToFill >= 40 ? 'text-amber-700' : 'text-emerald-700'
              }`}>{selected.medianDaysToFill}d</div>
              <div className="text-[10px] text-gray-500">median to fill</div>
            </div>
          </div>

          {/* Supply vs Demand visual */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">Market Demand</span>
                <span>{selected.openPostings}K open postings &nbsp;·&nbsp;
                  <span className={selected.demandGrowthPct > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                    {selected.demandGrowthPct > 0 ? '+' : ''}{selected.demandGrowthPct}% YoY
                  </span>
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-500"
                  style={{ width: `${Math.min((selected.openPostings / 90) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">Talent Supply</span>
                <span>Supply index: <strong className={selected.talentSupply < 35 ? 'text-red-600' : selected.talentSupply < 55 ? 'text-amber-600' : 'text-emerald-600'}>{selected.talentSupply}/100</strong></span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selected.talentSupply < 35 ? 'bg-red-400' :
                    selected.talentSupply < 55 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${selected.talentSupply}%` }}
                />
              </div>
            </div>

            {/* Gap callout */}
            <div className={`rounded-xl p-3 text-xs leading-relaxed ${
              selected.competitionTier === 'extreme' ? 'bg-red-50 border border-red-100 text-red-700' :
              selected.competitionTier === 'high' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
              selected.competitionTier === 'moderate' ? 'bg-sky-50 border border-sky-100 text-sky-700' :
              'bg-emerald-50 border border-emerald-100 text-emerald-700'
            }`}>
              {selected.competitionTier === 'extreme' &&
                `High demand (${selected.openPostings}K postings, +${selected.demandGrowthPct}% YoY) meets very low supply (${selected.talentSupply}/100). Every competitor is fishing in the same small pool — retention of existing ${selected.role}s is the highest-leverage action.`
              }
              {selected.competitionTier === 'high' &&
                `Demand is growing and supply is tightening. You have a window to hire before conditions worsen. Average time to fill is ${selected.medianDaysToFill} days — start pipelines early.`
              }
              {selected.competitionTier === 'moderate' &&
                `Market conditions are manageable for ${selected.role} right now. Monitor demand growth (${selected.demandGrowthPct > 0 ? '+' : ''}${selected.demandGrowthPct}% YoY) — if it accelerates, act sooner.`
              }
              {selected.competitionTier === 'low' &&
                `Healthy talent supply (${selected.talentSupply}/100) and stable demand. This is a low-urgency hire — take time to find the right fit.`
              }
            </div>
          </div>
        </div>
      )}

      {/* All roles sorted by urgency */}
      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">All roles by urgency</div>
        <div className="space-y-2">
          {sorted.map(r => {
            const scarcity = 100 - r.talentSupply;
            const qid = getQuadrant(r);
            const q = QUADRANTS.find(q => q.id === qid)!;
            const isSelected = selected?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role === selectedRole ? null : r.role)}
                className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm ${
                  isSelected ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Quadrant dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${q.dotColor}`} />

                  {/* Role info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gray-900 truncate">{r.role}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{r.dept}</span>
                      <CompTierBadge tier={r.competitionTier} />
                    </div>

                    {/* Demand bar */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div>
                        <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                          <span>Demand</span>
                          <span>{r.openPostings}K {r.demandGrowthPct > 0 ? `+${r.demandGrowthPct}%` : `${r.demandGrowthPct}%`}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((r.openPostings / 90) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                          <span>Supply</span>
                          <span>{r.talentSupply}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.talentSupply < 35 ? 'bg-red-400' : r.talentSupply < 55 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${r.talentSupply}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Days to fill */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-sm font-extrabold ${r.medianDaysToFill >= 55 ? 'text-red-600' : r.medianDaysToFill >= 40 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {r.medianDaysToFill}d
                    </div>
                    <div className="text-[9px] text-gray-400">to fill</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Extreme competition', value: ROLE_DEMAND.filter(r => r.competitionTier === 'extreme').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'High competition', value: ROLE_DEMAND.filter(r => r.competitionTier === 'high').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Hardest to fill', value: `${Math.max(...ROLE_DEMAND.map(r => r.medianDaysToFill))}d`, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Fastest growing demand', value: `+${Math.max(...ROLE_DEMAND.map(r => r.demandGrowthPct))}%`, color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
            <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 2: Flight Risk Index ────────────────────────────────────────────────

function FlightRiskPanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<Activity size={16} />}
        title="Flight Risk Index"
        subtitle="LinkedIn activity signals indicating likelihood to leave, by department"
        badge="Revelio Labs"
      />

      <div className="space-y-3">
        {FLIGHT_RISK.sort((a, b) => b.flightRiskScore - a.flightRiskScore).map(r => {
          const aboveMarket = r.flightRiskScore > r.marketAvgScore;
          return (
            <div key={r.dept} className={`rounded-xl border p-4 transition-colors ${aboveMarket ? 'border-red-100 bg-red-50/40' : 'border-gray-100 bg-gray-50/40'}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-gray-900">{r.dept}</span>
                  <TrendBadge trend={r.trend} />
                  {aboveMarket && (
                    <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full border border-red-200">
                      Above market
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-gray-900">{r.flightRiskScore}</div>
                    <div className="text-[10px] text-gray-400">risk score</div>
                  </div>
                </div>
              </div>

              <div className="relative h-2 bg-gray-200 rounded-full overflow-visible mb-3">
                <div
                  className={`h-full rounded-full ${r.flightRiskScore >= 70 ? 'bg-red-400' : r.flightRiskScore >= 55 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${r.flightRiskScore}%` }}
                />
                {/* market avg marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-gray-500"
                  style={{ left: `${r.marketAvgScore}%` }}
                  title={`Market avg: ${r.marketAvgScore}`}
                />
              </div>

              <div className="flex gap-4 text-[11px] text-gray-500">
                <span><strong className="text-gray-700">{r.pctLookingPassively}%</strong> passive signals</span>
                <span><strong className="text-gray-700">{r.pctLookingActively}%</strong> active signals</span>
                <span><strong className="text-gray-700">{Math.round(r.avgTenureMonths / 12 * 10) / 10}yr</strong> avg tenure</span>
                <span className="ml-auto text-gray-400">Market avg: {r.marketAvgScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel 3: Compensation Positioning ────────────────────────────────────────

function CompPositioningPanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<DollarSign size={16} />}
        title="Compensation Positioning"
        subtitle="Where Acme sits on the market pay distribution, by department"
        badge="Revelio Labs"
      />

      <div className="space-y-4">
        {COMP_POSITIONING.sort((a, b) => a.percentilePosition - b.percentilePosition).map(r => {
          const belowMedian = r.percentilePosition < 50;
          const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;
          return (
            <div key={r.dept} className={`rounded-xl border p-4 ${belowMedian ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/20'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-bold text-gray-900">{r.dept}</span>
                  {r.atRiskRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.atRiskRoles.map(role => (
                        <span key={role} className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">
                          {role} at risk
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-base font-extrabold ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>
                    p{r.percentilePosition}
                  </div>
                  <div className="text-[10px] text-gray-400">market position</div>
                </div>
              </div>

              {/* Distribution bar: p25–p75 box + acme marker */}
              <div className="relative h-6 flex items-center mb-2">
                {(() => {
                  const min = r.marketP25 * 0.92;
                  const max = r.marketP90 * 1.04;
                  const range = max - min;
                  const pct = (v: number) => ((v - min) / range) * 100;
                  return (
                    <>
                      <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
                      <div className="absolute h-3 bg-gray-200 rounded-sm" style={{ left: `${pct(r.marketP25)}%`, width: `${pct(r.marketP75) - pct(r.marketP25)}%` }} />
                      <div className="absolute h-4 w-px bg-gray-500" style={{ left: `${pct(r.marketP50)}%` }} />
                      <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md bg-sky-500 -translate-x-1/2 z-10"
                        style={{ left: `${pct(r.acmeMedian)}%` }} />
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>p25 {fmtK(r.marketP25)}</span>
                <span>p50 {fmtK(r.marketP50)}</span>
                <span>p75 {fmtK(r.marketP75)}</span>
                <span>p90 {fmtK(r.marketP90)}</span>
              </div>

              <div className="mt-2 text-[11px] text-gray-500">
                Acme median: <strong className="text-gray-700">{fmtK(r.acmeMedian)}</strong>
                <span className={`ml-2 font-semibold ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {belowMedian
                    ? `${fmtK(r.marketP50 - r.acmeMedian)} below market median`
                    : `${fmtK(r.acmeMedian - r.marketP50)} above market median`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel 4: Talent Prestige ──────────────────────────────────────────────────

function PrestigePanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<Star size={16} />}
        title="Talent Prestige & Pedigree"
        subtitle="Quality of talent backgrounds based on prior companies and education"
        badge="Revelio Labs"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {PRESTIGE_DATA.sort((a, b) => b.acmePrestigeScore - a.acmePrestigeScore).map(r => {
          const aboveMarket = r.acmePrestigeScore > r.marketMedianScore;
          const delta = r.acmePrestigeScore - r.marketMedianScore;
          return (
            <div key={r.dept} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-white hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">{r.dept}</span>
                <div className="flex items-center gap-2">
                  {aboveMarket
                    ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ArrowUpRight size={9} />+{delta}</span>
                    : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ArrowDownRight size={9} />{delta}</span>
                  }
                  <span className="text-lg font-extrabold text-gray-900">{r.acmePrestigeScore}</span>
                </div>
              </div>

              <PercentileBar value={r.acmePrestigeScore} label={`mkt: ${r.marketMedianScore}`} />

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <div className="text-gray-400 font-medium mb-1">Top employers</div>
                  <div className="flex flex-wrap gap-1">
                    {r.topPreviousEmployers.slice(0, 3).map(e => (
                      <span key={e} className="bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{e}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 font-medium mb-1">Top schools</div>
                  <div className="flex flex-wrap gap-1">
                    {r.topSchools.slice(0, 2).map(s => (
                      <span key={s} className="bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 text-[10px] text-gray-500">
                <span className="font-semibold text-gray-700">{r.topTierPct}%</span> top-tier backgrounds &nbsp;·&nbsp;
                <span className={`font-semibold ${r.risingPrestigePct >= 10 ? 'text-emerald-600' : 'text-gray-700'}`}>+{r.risingPrestigePct}pts</span> rising hire prestige
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel 5: Promotion Rate vs Market ────────────────────────────────────────

function PromotionRatePanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<TrendingUp size={16} />}
        title="Promotion Rate vs Market"
        subtitle="Internal promotion velocity compared to industry peers"
        badge="Revelio Labs"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[11px] font-semibold text-gray-400 pb-2 pr-4">Department</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 pb-2 pr-4">Acme Rate</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 pb-2 pr-4">Market Median</th>
              <th className="text-right text-[11px] font-semibold text-gray-400 pb-2 pr-4">Avg Months</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 pb-2">Bottleneck</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PROMOTION_RATES.map(r => {
              const belowMedian = r.acmePromotionRatePct < r.marketMedianPct;
              const slowerThanMarket = r.avgMonthsToPromotion > r.marketAvgMonths;
              return (
                <tr key={r.dept} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-gray-900 text-xs">{r.dept}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-sm font-extrabold ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {r.acmePromotionRatePct}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-xs text-gray-500">{r.marketMedianPct}%</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`text-xs font-semibold ${slowerThanMarket ? 'text-red-600' : 'text-emerald-600'}`}>
                      {r.avgMonthsToPromotion}mo
                      <span className="text-gray-400 font-normal ml-1">(mkt {r.marketAvgMonths}mo)</span>
                    </span>
                  </td>
                  <td className="py-3">
                    {r.bottleneckedLevel
                      ? <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">{r.bottleneckedLevel}</span>
                      : <span className="text-[10px] text-gray-400 flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" />No bottleneck</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Depts below market rate', value: PROMOTION_RATES.filter(r => r.acmePromotionRatePct < r.marketMedianPct).length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Depts with bottlenecks', value: PROMOTION_RATES.filter(r => r.bottleneckedLevel).length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Depts ahead of market', value: PROMOTION_RATES.filter(r => r.acmePromotionRatePct >= r.marketP75Pct).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.bg}`}>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel 6: Skills Market Signals ───────────────────────────────────────────

function SkillsMarketPanel() {
  const [filter, setFilter] = useState<'all' | 'rising' | 'declining' | 'maturing'>('all');
  const filtered = filter === 'all' ? SKILL_SIGNALS : SKILL_SIGNALS.filter(s => s.trending === filter);

  const TREND_STYLES = {
    rising:   'bg-sky-50 border-sky-200 text-sky-700',
    peak:     'bg-amber-50 border-amber-200 text-amber-700',
    maturing: 'bg-gray-100 border-gray-200 text-gray-600',
    declining:'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<BookOpen size={16} />}
        title="Skills Market Signals"
        subtitle="Fastest-growing and declining skills across 1.1bn LinkedIn profiles"
        badge="Revelio Labs"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'rising', 'declining', 'maturing'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize ${
              filter === f ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600'
            }`}
          >
            {f === 'all' ? 'All signals' : f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(s => {
          const gapVsMarket = s.acmeHasPct - s.marketHasPct;
          return (
            <div key={s.skill} className={`rounded-xl border p-4 ${TREND_STYLES[s.trending]}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold text-gray-900">{s.skill}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.cluster}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-extrabold ${s.growthPct >= 50 ? 'text-sky-700' : s.growthPct < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    {s.growthPct > 0 ? '+' : ''}{s.growthPct}% YoY
                  </span>
                  <span className="text-[10px] text-gray-400">scarcity {s.scarcityScore}/100</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                <span>Acme coverage: <strong className="text-gray-700">{s.acmeHasPct}%</strong></span>
                <span>Market: <strong className="text-gray-700">{s.marketHasPct}%</strong></span>
                <span className={`font-semibold ${gapVsMarket < -3 ? 'text-red-600' : gapVsMarket > 3 ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {gapVsMarket > 0 ? '+' : ''}{gapVsMarket}pp vs market
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {s.relevantDepts.map(d => (
                  <span key={d} className="text-[9px] bg-white/70 border border-current/20 px-1.5 py-0.5 rounded-md font-medium opacity-80">{d}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel 7: Career Paths ─────────────────────────────────────────────────────

function CareerPathsPanel() {
  const [selectedDept, setSelectedDept] = useState<RevelioDept>('Engineering');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const deptNodes = CAREER_PATH_NODES.filter(n => n.dept === selectedDept);
  const activeNode = deptNodes.find(n => n.role === selectedNode) ?? deptNodes[0] ?? null;

  const LEVEL_COLORS: Record<CareerPathNode['level'], string> = {
    junior:   'bg-sky-100 border-sky-300 text-sky-800',
    mid:      'bg-emerald-100 border-emerald-300 text-emerald-800',
    senior:   'bg-amber-100 border-amber-300 text-amber-800',
    lead:     'bg-orange-100 border-orange-300 text-orange-800',
    director: 'bg-rose-100 border-rose-300 text-rose-800',
    vp:       'bg-gray-200 border-gray-400 text-gray-800',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <SectionHeader
        icon={<GitBranch size={16} />}
        title="Actual Career Paths"
        subtitle="How people really move through roles — based on Revelio's LinkedIn career trajectory data"
        badge="Revelio Labs"
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {REVELIO_DEPTS.map(d => {
          const hasData = CAREER_PATH_NODES.some(n => n.dept === d);
          return (
            <button
              key={d}
              onClick={() => { setSelectedDept(d); setSelectedNode(null); }}
              disabled={!hasData}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                selectedDept === d
                  ? 'bg-sky-600 text-white border-sky-600'
                  : hasData
                    ? 'bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600'
                    : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {deptNodes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          No career path data available for this department yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Node list */}
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Select a role</div>
            {deptNodes.map(n => (
              <button
                key={n.role}
                onClick={() => setSelectedNode(n.role)}
                className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm ${
                  (activeNode?.role === n.role)
                    ? 'border-sky-300 bg-sky-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{n.role}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${LEVEL_COLORS[n.level]}`}>
                    {n.level}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                  <span><Users size={9} className="inline mr-0.5" />{n.headcount} people</span>
                  <span><Clock size={9} className="inline mr-0.5" />{n.avgTenureMonths}mo avg tenure</span>
                </div>
              </button>
            ))}
          </div>

          {/* Outflows */}
          <div className="lg:col-span-3">
            {activeNode && (
              <>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Where people go after <span className="text-sky-600">{activeNode.role}</span>
                </div>

                <div className="space-y-3">
                  {activeNode.outflows
                    .sort((a, b) => b.pct - a.pct)
                    .map((o, i) => {
                      const isInternal = !o.crossCompany;
                      const isCrossDept = o.crossDept;
                      return (
                        <div
                          key={`${o.to}-${o.crossCompany}-${i}`}
                          className={`rounded-xl border p-3.5 ${
                            isInternal
                              ? isCrossDept
                                ? 'border-emerald-100 bg-emerald-50/40'
                                : 'border-sky-100 bg-sky-50/40'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-gray-900">{o.to}</span>
                                {isCrossDept && isInternal && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                    Cross-dept: {o.toDept}
                                  </span>
                                )}
                                {!isInternal && (
                                  <span className="text-[9px] font-bold bg-gray-200 text-gray-600 border border-gray-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <ArrowUpRight size={8} /> External
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Median {o.medianMonths} months before transition
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className={`text-xl font-extrabold ${isInternal ? 'text-sky-700' : 'text-gray-500'}`}>{o.pct}%</div>
                              <div className="text-[9px] text-gray-400">of people</div>
                            </div>
                          </div>

                          <div className="mt-2 h-1.5 bg-white/80 rounded-full overflow-hidden border border-white/50">
                            <div
                              className={`h-full rounded-full ${isInternal ? (isCrossDept ? 'bg-emerald-400' : 'bg-sky-400') : 'bg-gray-300'}`}
                              style={{ width: `${o.pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    {
                      label: 'Stay internal',
                      value: `${activeNode.outflows.filter(o => !o.crossCompany).reduce((s, o) => s + o.pct, 0)}%`,
                      color: 'text-sky-600',
                      bg: 'bg-sky-50',
                    },
                    {
                      label: 'Leave company',
                      value: `${activeNode.outflows.filter(o => o.crossCompany).reduce((s, o) => s + o.pct, 0)}%`,
                      color: 'text-gray-600',
                      bg: 'bg-gray-50',
                    },
                    {
                      label: 'Cross-dept move',
                      value: `${activeNode.outflows.filter(o => o.crossDept && !o.crossCompany).reduce((s, o) => s + o.pct, 0)}%`,
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50',
                    },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg p-2.5 ${s.bg} border border-white`}>
                      <div className={`text-base font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-gray-500 leading-tight mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
                  Based on Revelio Labs career trajectory analysis of {activeNode.role.toLowerCase()} roles across comparable companies. Percentages show proportion of individuals who made each transition.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recommendations ───────────────────────────────────────────────────────────

function RecommendationsSection() {
  const [expanded, setExpanded] = useState<string | null>('ti-1');
  const AREA_LABELS: Record<TalentIntelRec['area'], string> = {
    'supply-demand': 'Supply & Demand',
    'flight-risk': 'Flight Risk',
    'compensation': 'Compensation',
    'prestige': 'Prestige',
    'promotion': 'Promotion',
    'skills': 'Skills Market',
    'career-paths': 'Career Paths',
  };

  const PRIORITY_CONFIG = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
    high:     { bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'High' },
    medium:   { bg: 'bg-sky-50',   border: 'border-sky-100',   badge: 'bg-sky-100 text-sky-700 border-sky-200',   label: 'Medium' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
          <Lightbulb size={16} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">AI-Generated Recommendations</h3>
          <p className="text-xs text-gray-500 mt-0.5">Prioritised actions based on your Revelio intelligence signals</p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">
          {TALENT_INTEL_RECS.length} actions
        </span>
      </div>

      <div className="space-y-2">
        {TALENT_INTEL_RECS.map(rec => {
          const cfg = PRIORITY_CONFIG[rec.priority];
          const isOpen = expanded === rec.id;
          return (
            <div key={rec.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:brightness-[0.98] transition-all"
                onClick={() => setExpanded(isOpen ? null : rec.id)}
              >
                <PriorityDot p={rec.priority} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{AREA_LABELS[rec.area]}</span>
                    {rec.dept && <span className="text-[10px] text-gray-400">{rec.dept}</span>}
                    <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-0.5"><Clock size={9} />{rec.timeframe}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 leading-snug">{rec.title}</span>
                </div>
                <ChevronRight size={14} className={`text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">{rec.rationale}</p>
                  <ul className="space-y-1.5">
                    {rec.actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500 flex-shrink-0">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type TITab = 'supply-demand' | 'flight-risk' | 'compensation' | 'prestige' | 'promotion' | 'skills' | 'career-paths';

const TABS: { id: TITab; label: string; icon: React.ReactNode }[] = [
  { id: 'supply-demand', label: 'Supply & Demand',  icon: <Zap size={13} /> },
  { id: 'flight-risk',   label: 'Flight Risk',      icon: <Activity size={13} /> },
  { id: 'compensation',  label: 'Compensation',     icon: <DollarSign size={13} /> },
  { id: 'prestige',      label: 'Prestige',         icon: <Star size={13} /> },
  { id: 'promotion',     label: 'Promotion Rates',  icon: <TrendingUp size={13} /> },
  { id: 'skills',        label: 'Skills Signals',   icon: <BookOpen size={13} /> },
  { id: 'career-paths',  label: 'Career Paths',     icon: <GitBranch size={13} /> },
];

export function TalentIntelligence() {
  const [activeTab, setActiveTab] = useState<TITab>('supply-demand');

  const criticalCount = TALENT_INTEL_RECS.filter(r => r.priority === 'critical').length;
  const highFlightRisk = FLIGHT_RISK.filter(r => r.flightRiskScore > r.marketAvgScore).length;
  const belowMedianComp = COMP_POSITIONING.filter(r => r.percentilePosition < 50).length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-gray-900">Talent Intelligence</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 uppercase tracking-wider">
                  Revelio Labs
                </span>
              </div>
              <p className="text-sm text-gray-500">
                External market intelligence derived from 1.1 billion LinkedIn profiles — skills, flight risk, compensation, prestige, promotion velocity, and career trajectories.
              </p>
            </div>

            {/* Top-level signal strip */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: 'Critical signals', value: criticalCount, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                { label: 'Depts above flight risk avg', value: highFlightRisk, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Depts below market comp', value: belowMedianComp, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border px-3 py-2 text-center ${s.bg}`}>
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 whitespace-nowrap">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div className="bg-white border-b border-gray-100 px-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'supply-demand'  && <SupplyDemandPanel />}
          {activeTab === 'flight-risk'    && <FlightRiskPanel />}
          {activeTab === 'compensation'   && <CompPositioningPanel />}
          {activeTab === 'prestige'       && <PrestigePanel />}
          {activeTab === 'promotion'      && <PromotionRatePanel />}
          {activeTab === 'skills'         && <SkillsMarketPanel />}
          {activeTab === 'career-paths'   && <CareerPathsPanel />}

          <RecommendationsSection />

          <UpsellBanner variant="comp-review" />
          <FeedbackBanner context="Talent Intelligence" className="mt-2" />
        </div>
      </div>
    </div>
  );
}
