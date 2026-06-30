import { useState } from 'react';
import {
  ArrowLeft, Activity, DollarSign, TrendingUp, Users, BookOpen,
  GitBranch, Lightbulb, ArrowUpRight, ArrowDownRight, Minus,
  AlertTriangle, CheckCircle, Clock, ChevronRight, Star,
} from 'lucide-react';
import {
  FLIGHT_RISK, COMP_POSITIONING, SKILL_SIGNALS, ROLE_DEMAND,
  CAREER_PATH_NODES, TALENT_INTEL_RECS, PROMOTION_RATES,
  type RevelioDept, type TalentIntelRec,
} from '../../data/revelioData';

interface Props {
  dept: RevelioDept;
  onBack: () => void;
  onAskAI: (question: string) => void;
}

type Tab = 'overview' | 'flight-risk' | 'comp' | 'skills' | 'talent-supply' | 'career-paths' | 'recommendations';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',        icon: <Activity size={12} /> },
  { id: 'flight-risk',    label: 'Flight Risk',      icon: <TrendingUp size={12} /> },
  { id: 'comp',           label: 'Compensation',     icon: <DollarSign size={12} /> },
  { id: 'skills',         label: 'Skills Market',    icon: <BookOpen size={12} /> },
  { id: 'talent-supply',  label: 'Talent Supply',    icon: <Users size={12} /> },
  { id: 'career-paths',   label: 'Career Paths',     icon: <GitBranch size={12} /> },
  { id: 'recommendations',label: 'Recommendations',  icon: <Lightbulb size={12} /> },
];

// ── Small reusable pieces ─────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising') return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
      <ArrowUpRight size={8} />Rising
    </span>
  );
  if (trend === 'falling') return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
      <ArrowDownRight size={8} />Falling
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
      <Minus size={8} />Stable
    </span>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: 'red' | 'amber' | 'green' | 'blue' }) {
  const colors = {
    red:   'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-emerald-50 border-emerald-200',
    blue:  'bg-brand-blue-bg4 border-brand-blue-bg2',
  };
  const valueColors = {
    red: 'text-red-600', amber: 'text-amber-700', green: 'text-emerald-700', blue: 'text-brand-blue',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent ? colors[accent] : 'bg-white border-gray-200'}`}>
      <p className="text-[10px] text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? valueColors[accent] : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function PriorityPill({ p }: { p: TalentIntelRec['priority'] }) {
  const cfg = {
    critical: 'bg-red-50 text-red-600 border-red-200',
    high:     'bg-amber-50 text-amber-700 border-amber-200',
    medium:   'bg-sky-50 text-sky-600 border-sky-200',
  }[p];
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border capitalize ${cfg}`}>{p}</span>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────

function OverviewTab({ dept }: { dept: RevelioDept }) {
  const fr      = FLIGHT_RISK.find(r => r.dept === dept)!;
  const comp    = COMP_POSITIONING.find(r => r.dept === dept)!;
  const promo   = PROMOTION_RATES.find(r => r.dept === dept)!;
  const recs    = TALENT_INTEL_RECS.filter(r => r.dept === dept || (!r.dept && r.priority !== 'medium'));
  const extreme = ROLE_DEMAND.filter(r => r.dept === dept && r.competitionTier === 'extreme');
  const wins    = [
    comp.percentilePosition >= 50 && `Comp at P${comp.percentilePosition} — above market median`,
    promo.acmePromotionRatePct >= promo.marketMedianPct && `Promotion rate (${promo.acmePromotionRatePct}%) matches or beats peers`,
    fr.flightRiskScore < fr.marketAvgScore && `Flight risk (${fr.flightRiskScore}) below market average`,
  ].filter(Boolean) as string[];
  const risks = [
    fr.flightRiskScore >= fr.marketAvgScore && `Flight risk ${fr.flightRiskScore} — ${fr.flightRiskScore - fr.marketAvgScore > 0 ? `+${fr.flightRiskScore - fr.marketAvgScore}` : fr.flightRiskScore - fr.marketAvgScore} vs market`,
    comp.percentilePosition < 50 && `Comp at P${comp.percentilePosition} — below market median`,
    extreme.length > 0 && `${extreme.length} role${extreme.length > 1 ? 's' : ''} with extreme hiring competition`,
    promo.bottleneckedLevel && `Promotion bottleneck at ${promo.bottleneckedLevel}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Flight Risk Score"
          value={fr.flightRiskScore}
          sub={`Market avg: ${fr.marketAvgScore}`}
          accent={fr.flightRiskScore >= 70 ? 'red' : fr.flightRiskScore >= 60 ? 'amber' : 'green'}
        />
        <StatCard
          label="Comp Percentile"
          value={`P${comp.percentilePosition}`}
          sub={comp.percentilePosition < 50 ? `${comp.atRiskRoles.length} role${comp.atRiskRoles.length !== 1 ? 's' : ''} below P50` : 'Above market median'}
          accent={comp.percentilePosition >= 50 ? 'green' : 'amber'}
        />
        <StatCard
          label="Promotion Rate"
          value={`${promo.acmePromotionRatePct}%`}
          sub={`Market median: ${promo.marketMedianPct}%`}
          accent={promo.acmePromotionRatePct >= promo.marketMedianPct ? 'green' : 'amber'}
        />
        <StatCard
          label="Extreme Hiring Roles"
          value={extreme.length || 'None'}
          sub={extreme.length ? extreme.map(r => r.role).join(', ') : 'All roles fillable'}
          accent={extreme.length > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Risks & wins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-red-500" />
              <h4 className="text-xs font-bold text-red-700">Risks</h4>
            </div>
            <ul className="space-y-2">
              {risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {wins.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={13} className="text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-700">Strengths</h4>
            </div>
            <ul className="space-y-2">
              {wins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Top recs preview */}
      {recs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top actions needed</h4>
          <div className="space-y-2">
            {recs.slice(0, 3).map(rec => (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                <PriorityPill p={rec.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{rec.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlightRiskTab({ dept }: { dept: RevelioDept }) {
  const fr = FLIGHT_RISK.find(r => r.dept === dept)!;
  const delta = fr.flightRiskScore - fr.marketAvgScore;

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Flight Risk Score" value={fr.flightRiskScore} sub={`0 = safe, 100 = highest risk`} accent={fr.flightRiskScore >= 70 ? 'red' : fr.flightRiskScore >= 60 ? 'amber' : 'green'} />
        <StatCard label="vs Market Average" value={delta > 0 ? `+${delta}` : delta} sub={`Market avg: ${fr.marketAvgScore}`} accent={delta > 5 ? 'red' : delta > 0 ? 'amber' : 'green'} />
        <StatCard label="Avg Tenure" value={`${fr.avgTenureMonths}mo`} sub="Before departure" />
        <StatCard label="Profile Activity" value={fr.profileActivityIndex} sub="LinkedIn activity index" accent={fr.profileActivityIndex >= 75 ? 'amber' : undefined} />
      </div>

      {/* Trend banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${fr.trend === 'rising' ? 'bg-red-50 border-red-200' : fr.trend === 'falling' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
        <TrendBadge trend={fr.trend} />
        <p className="text-sm font-medium text-gray-800">
          Flight risk is <strong>{fr.trend}</strong> in {dept}.
          {fr.trend === 'rising' && ' Action recommended before it compounds.'}
          {fr.trend === 'falling' && ' Positive signal — recent retention efforts appear effective.'}
          {fr.trend === 'stable' && ' Monitor for changes in the next quarter.'}
        </p>
      </div>

      {/* Signal breakdown */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Signal breakdown</h4>
        <div className="space-y-3">
          {[
            { label: 'Passively looking', value: fr.pctLookingPassively, desc: '% showing passive job-search signals', color: 'bg-amber-400' },
            { label: 'Actively looking', value: fr.pctLookingActively, desc: '% with active open-to-work signals', color: 'bg-red-400' },
            { label: 'Profile activity', value: fr.profileActivityIndex, desc: 'Normalised LinkedIn endorsements + posts', color: 'bg-sky-400' },
          ].map(row => (
            <div key={row.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{row.label}</p>
                  <p className="text-[10px] text-gray-400">{row.desc}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{row.value}{row.label !== 'Profile activity' ? '%' : ''}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(row.value, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompTab({ dept }: { dept: RevelioDept }) {
  const comp = COMP_POSITIONING.find(r => r.dept === dept)!;
  const range = comp.marketP90 - comp.marketP25;
  const acmePct = ((comp.acmeMedian - comp.marketP25) / range) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Acme Median" value={`$${(comp.acmeMedian / 1000).toFixed(0)}k`} sub={`P${comp.percentilePosition} vs market`} accent={comp.percentilePosition >= 50 ? 'green' : 'amber'} />
        <StatCard label="Market Median (P50)" value={`$${(comp.marketP50 / 1000).toFixed(0)}k`} sub="Peer companies" />
        <StatCard label="Market P75" value={`$${(comp.marketP75 / 1000).toFixed(0)}k`} sub="Top quartile pay" />
      </div>

      {/* Band visual */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Market pay band</h4>
        <div className="relative h-8 mb-6">
          {/* Band */}
          <div className="absolute inset-y-2 left-0 right-0 bg-gray-100 rounded-full" />
          {/* P25–P75 band */}
          <div
            className="absolute inset-y-1 bg-sky-100 border border-sky-200 rounded-full"
            style={{ left: '25%', right: '25%' }}
          />
          {/* Median marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: '50%' }} />
          {/* Acme marker */}
          <div
            className="absolute top-0 bottom-0 w-1 rounded-full bg-brand-blue shadow"
            style={{ left: `${Math.max(2, Math.min(98, acmePct))}%` }}
          />
          {/* Labels */}
          <div className="absolute top-full mt-1 left-0 text-[9px] text-gray-400">P25 ${(comp.marketP25 / 1000).toFixed(0)}k</div>
          <div className="absolute top-full mt-1 text-[9px] text-gray-400 -translate-x-1/2" style={{ left: '50%' }}>P50</div>
          <div className="absolute top-full mt-1 right-0 text-[9px] text-gray-400">P90 ${(comp.marketP90 / 1000).toFixed(0)}k</div>
        </div>

        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
            <span className="text-[11px] text-gray-600">Acme (P{comp.percentilePosition})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-200" />
            <span className="text-[11px] text-gray-600">Market P25–P75</span>
          </div>
        </div>
      </div>

      {/* At-risk roles */}
      {comp.atRiskRoles.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Roles below P50 (flight risk)</h4>
          <div className="space-y-2">
            {comp.atRiskRoles.map(role => (
              <div key={role} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-800">{role}</span>
                </div>
                <span className="text-[11px] text-amber-600 font-medium">Below market median</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-600" />
          <span className="text-xs text-emerald-700 font-medium">All roles are at or above market median — no immediate comp risk.</span>
        </div>
      )}
    </div>
  );
}

function SkillsTab({ dept }: { dept: RevelioDept }) {
  const skills = SKILL_SIGNALS.filter(s => s.relevantDepts.includes(dept))
    .sort((a, b) => b.growthPct - a.growthPct);

  const trendConfig = {
    rising:   { badge: 'bg-red-50 text-red-600 border-red-200',       bar: 'bg-red-300' },
    peak:     { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-300' },
    maturing: { badge: 'bg-sky-50 text-sky-700 border-sky-200',       bar: 'bg-sky-300' },
    declining:{ badge: 'bg-gray-100 text-gray-500 border-gray-200',   bar: 'bg-gray-300' },
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Skill demand signals from Revelio Labs — based on YoY change in LinkedIn job postings and profile adoption rates.</p>
      {skills.map(skill => {
        const cfg = trendConfig[skill.trending];
        const acmeVsMarket = skill.acmeHasPct - skill.marketHasPct;
        return (
          <div key={skill.skill} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900">{skill.skill}</p>
                  <span className="text-[10px] text-gray-400">{skill.cluster}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge} capitalize`}>{skill.trending}</span>
                  <span className={`text-[11px] font-bold ${skill.growthPct > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {skill.growthPct > 0 ? `+${skill.growthPct}%` : `${skill.growthPct}%`} YoY demand
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-gray-900">{skill.scarcityScore}</p>
                <p className="text-[10px] text-gray-400">scarcity</p>
              </div>
            </div>
            {/* Coverage bars */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>Acme coverage</span>
                  <span className={acmeVsMarket < 0 ? 'text-red-500' : 'text-emerald-600'}>
                    {skill.acmeHasPct}% {acmeVsMarket !== 0 && `(${acmeVsMarket > 0 ? '+' : ''}${acmeVsMarket}% vs market)`}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5">
                  <div className="h-full rounded-full bg-brand-blue" style={{ width: `${skill.acmeHasPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>Market avg</span>
                  <span>{skill.marketHasPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full rounded-full bg-gray-300" style={{ width: `${skill.marketHasPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TalentSupplyTab({ dept }: { dept: RevelioDept }) {
  const roles = ROLE_DEMAND.filter(r => r.dept === dept).sort((a, b) => {
    const order = { extreme: 0, high: 1, moderate: 2, low: 3 };
    return order[a.competitionTier] - order[b.competitionTier];
  });

  const tierConfig = {
    extreme:  { badge: 'bg-red-50 text-red-600 border-red-200',       bar: 'bg-red-400' },
    high:     { badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-400' },
    moderate: { badge: 'bg-sky-50 text-sky-600 border-sky-200',       bar: 'bg-sky-400' },
    low:      { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
  };

  if (roles.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No role demand data for this department.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Market-wide open postings and talent supply data from Revelio Labs.</p>
      {roles.map(role => {
        const cfg = tierConfig[role.competitionTier];
        return (
          <div key={role.role} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{role.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>{role.competitionTier} competition</span>
                  {role.demandGrowthPct !== 0 && (
                    <span className={`text-[10px] font-semibold ${role.demandGrowthPct > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {role.demandGrowthPct > 0 ? `+${role.demandGrowthPct}%` : `${role.demandGrowthPct}%`} demand YoY
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-gray-900">{role.medianDaysToFill}d</p>
                <p className="text-[10px] text-gray-400">median to fill</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Talent supply (0–100)</p>
                <div className="h-1.5 bg-gray-100 rounded-full mb-0.5">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${role.talentSupply}%` }} />
                </div>
                <p className="text-[10px] text-gray-500">{role.talentSupply} / 100</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Open postings (000s)</p>
                <p className="text-sm font-bold text-gray-900">{role.openPostings}k</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CareerPathsTab({ dept }: { dept: RevelioDept }) {
  const nodes = CAREER_PATH_NODES.filter(n => n.dept === dept);
  const promo = PROMOTION_RATES.find(r => r.dept === dept)!;

  if (nodes.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No career path data for this department.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Promo context */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Promotion Rate" value={`${promo.acmePromotionRatePct}%`} sub={`Market: ${promo.marketMedianPct}%`} accent={promo.acmePromotionRatePct >= promo.marketMedianPct ? 'green' : 'amber'} />
        <StatCard label="Avg Time to Promotion" value={`${promo.avgMonthsToPromotion}mo`} sub={`Market: ${promo.marketAvgMonths}mo`} accent={promo.avgMonthsToPromotion <= promo.marketAvgMonths ? 'green' : 'amber'} />
        {promo.bottleneckedLevel && (
          <StatCard label="Bottleneck Level" value={promo.bottleneckedLevel} sub="Slower than market" accent="amber" />
        )}
      </div>

      {/* Per-role outflow cards */}
      {nodes.map(node => {
        const internalStay = node.outflows.filter(o => !o.crossCompany);
        const attrition    = node.outflows.filter(o => o.crossCompany);
        return (
          <div key={node.role} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">{node.role}</p>
                <p className="text-[10px] text-gray-400">{node.headcount} people &middot; avg {node.avgTenureMonths}mo tenure</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium capitalize">{node.level}</span>
            </div>

            <div className="space-y-3">
              {internalStay.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-700 mb-1.5">Internal moves ({internalStay.reduce((s, o) => s + o.pct, 0)}%)</p>
                  {internalStay.map((o, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <ChevronRight size={10} className="text-emerald-500" />
                        <span className="text-xs text-gray-700">{o.to}</span>
                        {o.crossDept && <span className="text-[9px] bg-sky-50 text-sky-600 border border-sky-100 px-1 py-0.5 rounded">cross-dept</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Clock size={9} />
                        {o.medianMonths}mo
                        <span className="font-semibold text-gray-700">{o.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {attrition.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-red-600 mb-1.5">External attrition ({attrition.reduce((s, o) => s + o.pct, 0)}%)</p>
                  {attrition.map((o, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight size={10} className="text-red-400" />
                        <span className="text-xs text-gray-700">{o.to} (external)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Clock size={9} />
                        {o.medianMonths}mo
                        <span className="font-semibold text-red-500">{o.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsTab({ dept, onAskAI }: { dept: RevelioDept; onAskAI: (q: string) => void }) {
  const recs = TALENT_INTEL_RECS.filter(r => r.dept === dept || !r.dept);

  if (recs.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No recommendations available.</p>;
  }

  return (
    <div className="space-y-3">
      {recs.map(rec => (
        <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityPill p={rec.priority} />
              <span className="text-[10px] text-gray-400 capitalize">{rec.area.replace('-', ' ')}</span>
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
              <Clock size={9} />
              {rec.timeframe}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1.5">{rec.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{rec.rationale}</p>
          <div className="space-y-1.5">
            {rec.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <Star size={10} className="text-amber-400 mt-0.5 flex-shrink-0" />
                {action}
              </div>
            ))}
          </div>
          <button
            onClick={() => onAskAI(`Tell me more about: ${rec.title}`)}
            className="mt-3 text-[11px] text-brand-blue font-medium hover:underline"
          >
            Ask AI for more detail &rarr;
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DeptDetail({ dept, onBack, onAskAI }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const fr = FLIGHT_RISK.find(r => r.dept === dept);
  const criticalCount = TALENT_INTEL_RECS.filter(r => (r.dept === dept || !r.dept) && r.priority === 'critical').length;

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft size={12} />
            All departments
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{dept}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Talent intelligence &middot; Powered by Revelio Labs
                {fr && (
                  <span className="ml-2">
                    Flight risk <strong className={fr.flightRiskScore >= 70 ? 'text-red-500' : fr.flightRiskScore >= 60 ? 'text-amber-600' : 'text-emerald-600'}>{fr.flightRiskScore}</strong>
                    {' '}· <TrendBadge trend={fr.trend} />
                  </span>
                )}
              </p>
            </div>
            {criticalCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl">
                <AlertTriangle size={11} />
                {criticalCount} critical action{criticalCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === 'overview'        && <OverviewTab dept={dept} />}
        {activeTab === 'flight-risk'     && <FlightRiskTab dept={dept} />}
        {activeTab === 'comp'            && <CompTab dept={dept} />}
        {activeTab === 'skills'          && <SkillsTab dept={dept} />}
        {activeTab === 'talent-supply'   && <TalentSupplyTab dept={dept} />}
        {activeTab === 'career-paths'    && <CareerPathsTab dept={dept} />}
        {activeTab === 'recommendations' && <RecommendationsTab dept={dept} onAskAI={onAskAI} />}
      </div>
    </div>
  );
}
