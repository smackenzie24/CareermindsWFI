import { useState } from 'react';
import {
  Zap, TrendingUp, DollarSign, Star, BookOpen, GitBranch,
  Lightbulb, ChevronRight, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Minus, Users, Activity, ArrowLeft,
} from 'lucide-react';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import {
  ROLE_DEMAND, FLIGHT_RISK, COMP_POSITIONING, PRESTIGE_DATA,
  PROMOTION_RATES, SKILL_SIGNALS, CAREER_PATH_NODES, TALENT_INTEL_RECS,
  REVELIO_DEPTS,
  type RevelioDept, type TalentIntelRec, type CareerPathNode, type RoleDemandRow,
} from '../../data/revelioData';

// ── Helpers ───────────────────────────────────────────────────────────────────

const INDUSTRY_BENCHMARK_DAYS = 38;

function demandToSupplyRatio(row: RoleDemandRow): number {
  return parseFloat((row.openPostings / Math.max(row.talentSupply, 1)).toFixed(1));
}

function tierConfig(tier: RoleDemandRow['competitionTier']) {
  return {
    extreme: { bar: 'bg-red-300',    text: 'text-red-500',    badge: 'bg-red-50 text-red-600 border-red-100',     label: 'Extreme' },
    high:    { bar: 'bg-amber-300',  text: 'text-amber-600',  badge: 'bg-amber-50 text-amber-600 border-amber-100', label: 'High' },
    moderate:{ bar: 'bg-sky-200',    text: 'text-sky-600',    badge: 'bg-sky-50 text-sky-600 border-sky-100',     label: 'Moderate' },
    low:     { bar: 'bg-emerald-200',text: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Low' },
  }[tier];
}

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
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

function PriorityDot({ p }: { p: TalentIntelRec['priority'] }) {
  const cls = p === 'critical' ? 'bg-red-400' : p === 'high' ? 'bg-amber-400' : 'bg-sky-400';
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cls}`} />;
}

// ── Per-dept signal scoring ───────────────────────────────────────────────────

interface DeptSignals {
  dept: RevelioDept;
  extremeRoles: number;
  highRoles: number;
  hardestToFill: number;
  flightRiskScore: number;
  flightRiskVsMarket: number;
  flightTrend: 'rising' | 'stable' | 'falling';
  compPercentile: number;
  atRiskRoles: string[];
  promotionRate: number;
  marketPromoRate: number;
  bottleneck: string | null;
  topRisingSkill: string | null;
  overallSignal: 'critical' | 'warning' | 'watch' | 'healthy';
}

function buildDeptSignals(dept: RevelioDept): DeptSignals {
  const demand = ROLE_DEMAND.filter(r => r.dept === dept);
  const flight = FLIGHT_RISK.find(r => r.dept === dept);
  const comp = COMP_POSITIONING.find(r => r.dept === dept);
  const promo = PROMOTION_RATES.find(r => r.dept === dept);
  const topSkill = SKILL_SIGNALS
    .filter(s => s.relevantDepts.includes(dept) && s.trending === 'rising')
    .sort((a, b) => b.growthPct - a.growthPct)[0] ?? null;

  const extremeRoles = demand.filter(r => r.competitionTier === 'extreme').length;
  const highRoles = demand.filter(r => r.competitionTier === 'high').length;
  const hardestToFill = demand.length ? Math.max(...demand.map(r => r.medianDaysToFill)) : 0;
  const flightRiskScore = flight?.flightRiskScore ?? 0;
  const flightRiskVsMarket = flight ? flight.flightRiskScore - flight.marketAvgScore : 0;
  const flightTrend = flight?.trend ?? 'stable';
  const compPercentile = comp?.percentilePosition ?? 50;
  const atRiskRoles = comp?.atRiskRoles ?? [];
  const promotionRate = promo?.acmePromotionRatePct ?? 0;
  const marketPromoRate = promo?.marketMedianPct ?? 0;
  const bottleneck = promo?.bottleneckedLevel ?? null;

  let score = 0;
  if (extremeRoles > 0) score += 2;
  if (flightRiskVsMarket > 10) score += 2;
  else if (flightRiskVsMarket > 0) score += 1;
  if (compPercentile < 45) score += 2;
  else if (compPercentile < 50) score += 1;
  if (bottleneck) score += 1;
  if (promotionRate < marketPromoRate) score += 1;

  const overallSignal: DeptSignals['overallSignal'] =
    score >= 5 ? 'critical' : score >= 3 ? 'warning' : score >= 1 ? 'watch' : 'healthy';

  return {
    dept, extremeRoles, highRoles, hardestToFill,
    flightRiskScore, flightRiskVsMarket, flightTrend,
    compPercentile, atRiskRoles, promotionRate, marketPromoRate,
    bottleneck, topRisingSkill: topSkill?.skill ?? null,
    overallSignal,
  };
}

const SIGNAL_CONFIG = {
  critical: { label: 'Critical', badge: 'bg-red-50 text-red-600 border-red-100',      border: 'border-red-100' },
  warning:  { label: 'Warning',  badge: 'bg-amber-50 text-amber-600 border-amber-100', border: 'border-amber-100' },
  watch:    { label: 'Watch',    badge: 'bg-sky-50 text-sky-600 border-sky-100',        border: 'border-gray-100' },
  healthy:  { label: 'Healthy',  badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', border: 'border-gray-100' },
};

// ── Entry grid ────────────────────────────────────────────────────────────────

function DeptCard({ signals, onClick }: { signals: DeptSignals; onClick: () => void }) {
  const cfg = SIGNAL_CONFIG[signals.overallSignal];

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border bg-white p-5 group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none ${cfg.border}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-tight">{signals.dept}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {signals.extremeRoles + signals.highRoles} competitive roles
            {signals.hardestToFill > 0 && ` · up to ${signals.hardestToFill}d to fill`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
          <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5"><Zap size={11} className="text-gray-400" />Hiring competition</span>
          <div className="flex items-center gap-1">
            {signals.extremeRoles > 0 && (
              <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">{signals.extremeRoles} extreme</span>
            )}
            {signals.highRoles > 0 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">{signals.highRoles} high</span>
            )}
            {signals.extremeRoles === 0 && signals.highRoles === 0 && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">Low</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5"><Activity size={11} className="text-gray-400" />Flight risk</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${signals.flightRiskVsMarket > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {signals.flightRiskScore}/100
            </span>
            <TrendBadge trend={signals.flightTrend} />
            {signals.flightRiskVsMarket > 0 && (
              <span className="text-[10px] text-red-400">+{signals.flightRiskVsMarket} vs mkt</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5"><DollarSign size={11} className="text-gray-400" />Comp position</span>
          <span className={`text-[10px] font-bold ${signals.compPercentile < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            p{signals.compPercentile} market
            {signals.compPercentile < 50 && signals.atRiskRoles.length > 0 && (
              <span className="ml-1 text-gray-400 font-normal">· {signals.atRiskRoles.length} at risk</span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1.5"><TrendingUp size={11} className="text-gray-400" />Promotion rate</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${signals.promotionRate < signals.marketPromoRate ? 'text-amber-600' : 'text-emerald-600'}`}>
              {signals.promotionRate}% <span className="font-normal text-gray-400">vs {signals.marketPromoRate}% mkt</span>
            </span>
            {signals.bottleneck && (
              <span className="text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded">bottleneck</span>
            )}
          </div>
        </div>
      </div>

      {signals.topRisingSkill && (
        <div className="mt-3.5 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[10px] text-gray-500">
          <BookOpen size={10} className="text-gray-400 flex-shrink-0" />
          Rising skill: <strong className="text-gray-700 ml-0.5">{signals.topRisingSkill}</strong>
        </div>
      )}
    </button>
  );
}

// ── Dept detail panels ────────────────────────────────────────────────────────

function PanelShell({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 flex-shrink-0">{icon}</div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 uppercase tracking-wider flex-shrink-0">Revelio Labs</span>
      </div>
      {children}
    </div>
  );
}

function DeptSupplyDemand({ dept }: { dept: RevelioDept }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const rows = ROLE_DEMAND.filter(r => r.dept === dept);
  const TIER_ORDER = { extreme: 0, high: 1, moderate: 2, low: 3 };
  const sorted = [...rows].sort((a, b) =>
    TIER_ORDER[a.competitionTier] - TIER_ORDER[b.competitionTier] ||
    b.medianDaysToFill - a.medianDaysToFill
  );
  const maxDays = sorted.length ? Math.max(...sorted.map(r => r.medianDaysToFill)) : INDUSTRY_BENCHMARK_DAYS + 10;

  if (sorted.length === 0) return null;

  return (
    <PanelShell icon={<Zap size={15} />} title="Hiring Competition" subtitle={`Time to fill vs industry median of ${INDUSTRY_BENCHMARK_DAYS} days`}>
      <div className="space-y-2.5">
        {sorted.map(r => {
          const cfg = tierConfig(r.competitionTier);
          const ratio = demandToSupplyRatio(r);
          const barPct = (r.medianDaysToFill / (maxDays + 10)) * 100;
          const benchmarkPct = (INDUSTRY_BENCHMARK_DAYS / (maxDays + 10)) * 100;
          const isSelected = selectedRole === r.role;

          return (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role === selectedRole ? null : r.role)}
              className={`w-full text-left rounded-xl border p-3.5 transition-all hover:shadow-sm ${
                isSelected ? 'border-gray-300 bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 truncate">{r.role}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                    <span>{r.openPostings}K open roles</span>
                    <span className={`font-semibold ${r.demandGrowthPct > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                      {r.demandGrowthPct > 0 ? <ArrowUpRight size={9} className="inline" /> : <ArrowDownRight size={9} className="inline" />}
                      {Math.abs(r.demandGrowthPct)}% YoY
                    </span>
                    <span>Supply: {r.talentSupply}/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-lg font-extrabold ${cfg.text}`}>{ratio}x</div>
                    <div className="text-[9px] text-gray-400">demand/supply</div>
                  </div>
                  <div className={`rounded-lg px-2.5 py-1 text-center border ${
                    r.medianDaysToFill > INDUSTRY_BENCHMARK_DAYS + 10 ? 'bg-red-50 border-red-100'
                    : r.medianDaysToFill > INDUSTRY_BENCHMARK_DAYS ? 'bg-amber-50 border-amber-100'
                    : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <div className={`text-base font-extrabold leading-none ${
                      r.medianDaysToFill > INDUSTRY_BENCHMARK_DAYS + 10 ? 'text-red-500'
                      : r.medianDaysToFill > INDUSTRY_BENCHMARK_DAYS ? 'text-amber-600'
                      : 'text-emerald-600'
                    }`}>{r.medianDaysToFill}d</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">to fill</div>
                  </div>
                </div>
              </div>

              <div className="relative h-2">
                <div className="absolute inset-0 bg-gray-100 rounded-full" />
                <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${barPct}%` }} />
                <div className="absolute inset-y-0 w-px bg-gray-400" style={{ left: `${benchmarkPct}%` }} />
              </div>

              {isSelected && (
                <div className={`mt-3.5 rounded-xl p-3 border text-xs leading-relaxed ${
                  r.competitionTier === 'extreme' ? 'bg-red-50 border-red-100 text-red-700'
                  : r.competitionTier === 'high' ? 'bg-amber-50 border-amber-100 text-amber-700'
                  : r.competitionTier === 'moderate' ? 'bg-sky-50 border-sky-100 text-sky-700'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {r.competitionTier === 'extreme' && `${r.openPostings}K open postings, demand up ${r.demandGrowthPct}% YoY, supply only ${r.talentSupply}/100. Retention of current ${r.role}s is the highest-leverage action.`}
                  {r.competitionTier === 'high' && `Demand growing with tightening supply (${r.talentSupply}/100). At ${r.medianDaysToFill} days to fill — ${r.medianDaysToFill - INDUSTRY_BENCHMARK_DAYS} days above industry average — open pipelines now.`}
                  {r.competitionTier === 'moderate' && `Manageable conditions (supply ${r.talentSupply}/100, +${r.demandGrowthPct}% YoY). Monitor for acceleration past 15%.`}
                  {r.competitionTier === 'low' && `Healthy supply (${r.talentSupply}/100). At ${r.medianDaysToFill} days, ${INDUSTRY_BENCHMARK_DAYS - r.medianDaysToFill} days below industry average — low urgency.`}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-4 pt-3 border-t border-gray-50">
        <span className="inline-block w-4 border-t border-dashed border-gray-400" />
        Industry median ({INDUSTRY_BENCHMARK_DAYS}d)
        <span className="ml-auto">Ratio = open postings (K) ÷ supply index</span>
      </div>
    </PanelShell>
  );
}

function DeptFlightRisk({ dept }: { dept: RevelioDept }) {
  const row = FLIGHT_RISK.find(r => r.dept === dept);
  if (!row) return null;
  const aboveMarket = row.flightRiskScore > row.marketAvgScore;

  return (
    <PanelShell icon={<Activity size={15} />} title="Flight Risk Index" subtitle="LinkedIn activity signals indicating likelihood to leave">
      <div className={`rounded-xl border p-5 ${aboveMarket ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-gray-50/40'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-extrabold text-gray-900">{row.flightRiskScore}</div>
              <div className="text-[10px] text-gray-400">risk score / 100</div>
            </div>
            <div className="space-y-1">
              <TrendBadge trend={row.trend} />
              {aboveMarket && (
                <span className="block text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                  +{row.flightRiskScore - row.marketAvgScore} above market
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>Market avg: <strong className="text-gray-600">{row.marketAvgScore}</strong></div>
            <div className="mt-0.5">Avg tenure: <strong className="text-gray-600">{Math.round(row.avgTenureMonths / 12 * 10) / 10}yr</strong></div>
          </div>
        </div>

        <div className="relative h-2 bg-gray-200 rounded-full overflow-visible mb-4">
          <div
            className={`h-full rounded-full ${row.flightRiskScore >= 70 ? 'bg-red-300' : row.flightRiskScore >= 55 ? 'bg-amber-300' : 'bg-emerald-200'}`}
            style={{ width: `${row.flightRiskScore}%` }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-gray-500" style={{ left: `${row.marketAvgScore}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-xl p-3 border border-white">
            <div className="text-lg font-extrabold text-gray-800">{row.pctLookingPassively}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5">passive signals</div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 border border-white">
            <div className="text-lg font-extrabold text-gray-800">{row.pctLookingActively}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5">active signals</div>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function DeptCompPositioning({ dept }: { dept: RevelioDept }) {
  const r = COMP_POSITIONING.find(c => c.dept === dept);
  if (!r) return null;
  const belowMedian = r.percentilePosition < 50;
  const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;
  const min = r.marketP25 * 0.92;
  const max = r.marketP90 * 1.04;
  const range = max - min;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <PanelShell icon={<DollarSign size={15} />} title="Compensation Positioning" subtitle="Where Acme sits on the market pay distribution">
      <div className={`rounded-xl border p-5 ${belowMedian ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/20'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`text-3xl font-extrabold ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>p{r.percentilePosition}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">market percentile</div>
          </div>
          <div className="text-right text-xs text-gray-500">
            Acme median: <strong className="text-gray-800">{fmtK(r.acmeMedian)}</strong>
            <div className={`text-[11px] font-semibold mt-0.5 ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>
              {belowMedian ? `${fmtK(r.marketP50 - r.acmeMedian)} below market median` : `${fmtK(r.acmeMedian - r.marketP50)} above market median`}
            </div>
          </div>
        </div>

        <div className="relative h-7 flex items-center mb-2">
          <div className="absolute inset-x-0 h-1.5 bg-gray-100 rounded-full" />
          <div className="absolute h-3.5 bg-gray-200 rounded-sm" style={{ left: `${pct(r.marketP25)}%`, width: `${pct(r.marketP75) - pct(r.marketP25)}%` }} />
          <div className="absolute h-5 w-px bg-gray-400" style={{ left: `${pct(r.marketP50)}%` }} />
          <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md bg-sky-400 -translate-x-1/2 z-10" style={{ left: `${pct(r.acmeMedian)}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>p25 {fmtK(r.marketP25)}</span>
          <span>p50 {fmtK(r.marketP50)}</span>
          <span>p75 {fmtK(r.marketP75)}</span>
          <span>p90 {fmtK(r.marketP90)}</span>
        </div>

        {r.atRiskRoles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/60">
            <div className="text-[10px] font-semibold text-gray-500 mb-1.5">Roles below market median</div>
            <div className="flex flex-wrap gap-1.5">
              {r.atRiskRoles.map(role => (
                <span key={role} className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">{role}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function DeptPrestige({ dept }: { dept: RevelioDept }) {
  const r = PRESTIGE_DATA.find(p => p.dept === dept);
  if (!r) return null;
  const aboveMarket = r.acmePrestigeScore > r.marketMedianScore;
  const delta = r.acmePrestigeScore - r.marketMedianScore;

  return (
    <PanelShell icon={<Star size={15} />} title="Talent Prestige & Pedigree" subtitle="Quality of talent backgrounds based on prior companies and education">
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">{r.acmePrestigeScore}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">prestige score / 100</div>
          </div>
          <div className="text-right">
            {aboveMarket
              ? <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><ArrowUpRight size={9} />+{delta} vs market</span>
              : <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full"><ArrowDownRight size={9} />{delta} vs market</span>
            }
            <div className="text-[10px] text-gray-400 mt-1.5 text-right">Market median: {r.marketMedianScore}</div>
          </div>
        </div>

        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full ${aboveMarket ? 'bg-emerald-300' : 'bg-amber-300'}`} style={{ width: `${r.acmePrestigeScore}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-[10px]">
          <div>
            <div className="text-gray-400 font-semibold mb-1.5">Top prior employers</div>
            <div className="flex flex-wrap gap-1">
              {r.topPreviousEmployers.slice(0, 4).map(e => (
                <span key={e} className="bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{e}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-400 font-semibold mb-1.5">Top schools</div>
            <div className="flex flex-wrap gap-1">
              {r.topSchools.slice(0, 3).map(s => (
                <span key={s} className="bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-gray-500">
          <span><strong className="text-gray-700">{r.topTierPct}%</strong> top-tier backgrounds</span>
          <span><strong className={r.risingPrestigePct >= 10 ? 'text-emerald-600' : 'text-gray-700'}>+{r.risingPrestigePct}pts</strong> rising hire prestige</span>
        </div>
      </div>
    </PanelShell>
  );
}

function DeptPromotionRate({ dept }: { dept: RevelioDept }) {
  const r = PROMOTION_RATES.find(p => p.dept === dept);
  if (!r) return null;
  const belowMedian = r.acmePromotionRatePct < r.marketMedianPct;
  const slowerThanMarket = r.avgMonthsToPromotion > r.marketAvgMonths;

  return (
    <PanelShell icon={<TrendingUp size={15} />} title="Promotion Rate vs Market" subtitle="Internal promotion velocity compared to industry peers">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`rounded-xl border p-4 ${belowMedian ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/20'}`}>
          <div className={`text-3xl font-extrabold ${belowMedian ? 'text-amber-600' : 'text-emerald-600'}`}>{r.acmePromotionRatePct}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Acme promotion rate</div>
          <div className="text-[10px] text-gray-500 mt-1">Market median: <strong>{r.marketMedianPct}%</strong></div>
        </div>
        <div className={`rounded-xl border p-4 ${slowerThanMarket ? 'border-red-100 bg-red-50/30' : 'border-emerald-100 bg-emerald-50/20'}`}>
          <div className={`text-3xl font-extrabold ${slowerThanMarket ? 'text-red-500' : 'text-emerald-600'}`}>{r.avgMonthsToPromotion}mo</div>
          <div className="text-[10px] text-gray-400 mt-0.5">avg months to promote</div>
          <div className="text-[10px] text-gray-500 mt-1">Market avg: <strong>{r.marketAvgMonths}mo</strong></div>
        </div>
      </div>

      {r.bottleneckedLevel ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/30 px-4 py-3 flex items-center gap-2.5">
          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
          <div className="text-xs text-amber-700"><strong>Bottleneck:</strong> {r.bottleneckedLevel} — people stall here longer than market peers.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 px-4 py-3 flex items-center gap-2.5">
          <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
          <div className="text-xs text-emerald-700">No promotion bottleneck detected — progression velocity is healthy.</div>
        </div>
      )}
    </PanelShell>
  );
}

function DeptSkillsMarket({ dept }: { dept: RevelioDept }) {
  const [filter, setFilter] = useState<'all' | 'rising' | 'declining' | 'maturing'>('all');
  const deptSkills = SKILL_SIGNALS.filter(s => s.relevantDepts.includes(dept));
  const filtered = filter === 'all' ? deptSkills : deptSkills.filter(s => s.trending === filter);

  const TREND_STYLES: Record<string, string> = {
    rising:   'bg-sky-50 border-sky-100',
    peak:     'bg-amber-50 border-amber-100',
    maturing: 'bg-gray-50 border-gray-100',
    declining:'bg-red-50 border-red-100',
  };

  if (deptSkills.length === 0) return null;

  return (
    <PanelShell icon={<BookOpen size={15} />} title="Skills Market Signals" subtitle={`Fastest-growing and declining skills relevant to ${dept}`}>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'rising', 'declining', 'maturing'] as const).map(f => {
          const count = f === 'all' ? deptSkills.length : deptSkills.filter(s => s.trending === f).length;
          if (f !== 'all' && count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all capitalize ${
                filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f} ({count})
            </button>
          );
        })}
      </div>
      <div className="space-y-2.5">
        {filtered.map(s => {
          const gapVsMarket = s.acmeHasPct - s.marketHasPct;
          return (
            <div key={s.skill} className={`rounded-xl border p-4 ${TREND_STYLES[s.trending] ?? 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-bold text-gray-900">{s.skill}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.cluster}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-extrabold ${s.growthPct >= 50 ? 'text-sky-600' : s.growthPct < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {s.growthPct > 0 ? '+' : ''}{s.growthPct}% YoY
                  </span>
                  <span className="text-[10px] text-gray-400">scarcity {s.scarcityScore}/100</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Acme: <strong className="text-gray-700">{s.acmeHasPct}%</strong></span>
                <span>Market: <strong className="text-gray-700">{s.marketHasPct}%</strong></span>
                <span className={`font-semibold ${gapVsMarket < -3 ? 'text-red-500' : gapVsMarket > 3 ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {gapVsMarket > 0 ? '+' : ''}{gapVsMarket}pp vs market
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

function DeptCareerPaths({ dept }: { dept: RevelioDept }) {
  const deptNodes = CAREER_PATH_NODES.filter(n => n.dept === dept);
  const [selectedNode, setSelectedNode] = useState<string | null>(deptNodes[0]?.role ?? null);
  const activeNode = deptNodes.find(n => n.role === selectedNode) ?? deptNodes[0] ?? null;

  const LEVEL_COLORS: Record<CareerPathNode['level'], string> = {
    junior:   'bg-sky-50 border-sky-200 text-sky-700',
    mid:      'bg-emerald-50 border-emerald-200 text-emerald-700',
    senior:   'bg-amber-50 border-amber-200 text-amber-700',
    lead:     'bg-orange-50 border-orange-200 text-orange-700',
    director: 'bg-rose-50 border-rose-200 text-rose-700',
    vp:       'bg-gray-100 border-gray-300 text-gray-700',
  };

  if (deptNodes.length === 0) return null;

  return (
    <PanelShell icon={<GitBranch size={15} />} title="Actual Career Paths" subtitle={`How people really move through roles in ${dept}`}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {deptNodes.map(n => (
            <button
              key={n.role}
              onClick={() => setSelectedNode(n.role)}
              className={`w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm ${
                activeNode?.role === n.role ? 'border-gray-300 bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">{n.role}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${LEVEL_COLORS[n.level]}`}>{n.level}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                <span><Users size={9} className="inline mr-0.5" />{n.headcount}</span>
                <span><Clock size={9} className="inline mr-0.5" />{n.avgTenureMonths}mo tenure</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-2.5">
          {activeNode && (
            <>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Where people go after <span className="text-gray-700">{activeNode.role}</span>
              </div>
              {activeNode.outflows.sort((a, b) => b.pct - a.pct).map((o, i) => {
                const isInternal = !o.crossCompany;
                return (
                  <div
                    key={`${o.to}-${o.crossCompany}-${i}`}
                    className={`rounded-xl border p-3.5 ${
                      isInternal ? (o.crossDept ? 'border-emerald-100 bg-emerald-50/30' : 'border-sky-100 bg-sky-50/30') : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">{o.to}</span>
                          {o.crossDept && isInternal && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full">Cross-dept: {o.toDept}</span>
                          )}
                          {!isInternal && (
                            <span className="text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <ArrowUpRight size={8} />External
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Median {o.medianMonths} months before transition</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xl font-extrabold ${isInternal ? 'text-sky-600' : 'text-gray-400'}`}>{o.pct}%</div>
                        <div className="text-[9px] text-gray-400">of people</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/80 rounded-full overflow-hidden border border-white/50">
                      <div className={`h-full rounded-full ${isInternal ? (o.crossDept ? 'bg-emerald-300' : 'bg-sky-300') : 'bg-gray-200'}`} style={{ width: `${o.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </PanelShell>
  );
}

function DeptRecommendations({ dept }: { dept: RevelioDept }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const recs = TALENT_INTEL_RECS.filter(r => !r.dept || r.dept === dept);
  if (recs.length === 0) return null;

  const PRIORITY_CONFIG = {
    critical: { bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-50 text-red-600 border-red-100', label: 'Critical' },
    high:     { bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-50 text-amber-600 border-amber-100', label: 'High' },
    medium:   { bg: 'bg-sky-50',   border: 'border-sky-100',   badge: 'bg-sky-50 text-sky-600 border-sky-100',   label: 'Medium' },
  };
  const AREA_LABELS: Record<TalentIntelRec['area'], string> = {
    'supply-demand': 'Hiring', 'flight-risk': 'Retention', 'compensation': 'Comp',
    'prestige': 'Prestige', 'promotion': 'Promotion', 'skills': 'Skills', 'career-paths': 'Career',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Lightbulb size={15} /></div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recommendations</h3>
          <p className="text-xs text-gray-400 mt-0.5">Prioritised actions for {dept} based on all signals</p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{recs.length} actions</span>
      </div>
      <div className="space-y-2">
        {recs.map(rec => {
          const cfg = PRIORITY_CONFIG[rec.priority];
          const isOpen = expanded === rec.id;
          return (
            <div key={rec.id} className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
              <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : rec.id)}>
                <PriorityDot p={rec.priority} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                    <span className="text-[10px] text-gray-400">{AREA_LABELS[rec.area]}</span>
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

// ── Dept detail view ──────────────────────────────────────────────────────────

function DeptDetailView({ dept, onBack }: { dept: RevelioDept; onBack: () => void }) {
  const signals = buildDeptSignals(dept);
  const cfg = SIGNAL_CONFIG[signals.overallSignal];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors mb-3">
            <ArrowLeft size={13} />All departments
          </button>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl font-extrabold text-gray-900">{dept}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 uppercase tracking-wider">Revelio Labs</span>
              </div>
              <p className="text-sm text-gray-500">Market intelligence across hiring, retention, compensation, promotion, and skills</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {signals.extremeRoles > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center">
                  <div className="text-lg font-extrabold text-red-500">{signals.extremeRoles}</div>
                  <div className="text-[9px] text-gray-500 whitespace-nowrap">extreme competition</div>
                </div>
              )}
              {signals.flightRiskVsMarket > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-center">
                  <div className="text-lg font-extrabold text-amber-600">+{signals.flightRiskVsMarket}</div>
                  <div className="text-[9px] text-gray-500 whitespace-nowrap">flight risk vs market</div>
                </div>
              )}
              {signals.compPercentile < 50 && (
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-center">
                  <div className="text-lg font-extrabold text-sky-600">p{signals.compPercentile}</div>
                  <div className="text-[9px] text-gray-500 whitespace-nowrap">comp percentile</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DeptSupplyDemand dept={dept} />
            <div className="space-y-5">
              <DeptFlightRisk dept={dept} />
              <DeptCompPositioning dept={dept} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DeptPromotionRate dept={dept} />
            <DeptPrestige dept={dept} />
          </div>
          <DeptSkillsMarket dept={dept} />
          <DeptCareerPaths dept={dept} />
          <DeptRecommendations dept={dept} />
          <UpsellBanner variant="comp-review" />
          <FeedbackBanner context="Talent Intelligence" className="mt-2" />
        </div>
      </div>
    </div>
  );
}

// ── Entry grid ────────────────────────────────────────────────────────────────

function EntryGrid({ onSelect }: { onSelect: (dept: RevelioDept) => void }) {
  const allSignals = REVELIO_DEPTS.map(buildDeptSignals);
  const criticalCount = TALENT_INTEL_RECS.filter(r => r.priority === 'critical').length;
  const highFlightRisk = FLIGHT_RISK.filter(r => r.flightRiskScore > r.marketAvgScore).length;
  const belowMedianComp = COMP_POSITIONING.filter(r => r.percentilePosition < 50).length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-gray-900">Talent Intelligence</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 uppercase tracking-wider">Revelio Labs</span>
              </div>
              <p className="text-sm text-gray-500">
                External market intelligence from 1.1 billion LinkedIn profiles — hiring, retention, compensation, prestige, promotion, and career trajectories.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: 'Critical signals', value: criticalCount, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                { label: 'Above flight risk avg', value: highFlightRisk, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Below market comp', value: belowMedianComp, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
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

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Select a department to explore its full intelligence profile</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allSignals.map(signals => (
              <DeptCard key={signals.dept} signals={signals} onClick={() => onSelect(signals.dept)} />
            ))}
          </div>
          <div className="mt-5 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 mr-2">Overall signal:</span>
            {(['healthy', 'watch', 'warning', 'critical'] as const).map(s => (
              <span key={s} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SIGNAL_CONFIG[s].badge}`}>{SIGNAL_CONFIG[s].label}</span>
            ))}
          </div>
          <FeedbackBanner context="Talent Intelligence" className="mt-5" />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TalentIntelligence() {
  const [selectedDept, setSelectedDept] = useState<RevelioDept | null>(null);

  if (selectedDept) {
    return <DeptDetailView dept={selectedDept} onBack={() => setSelectedDept(null)} />;
  }
  return <EntryGrid onSelect={setSelectedDept} />;
}
