import { useState } from 'react';
import {
  AlertTriangle, TrendingUp, DollarSign, Users, ChevronRight,
  Sparkles, ArrowRight, BarChart2, Activity, ArrowUpRight,
  ChevronDown, ChevronUp, Shield, Clock, Star,
} from 'lucide-react';
import {
  REVELIO_DEPTS, FLIGHT_RISK, COMP_POSITIONING, TALENT_INTEL_RECS,
  ROLE_DEMAND, SKILL_SIGNALS, PROMOTION_RATES,
  type RevelioDept,
} from '../../data/revelioData';
import { PEOPLE } from '../../data/promotionData';

interface Props {
  onSelectDept: (dept: RevelioDept) => void;
  onAskAI: (question?: string) => void;
  onNavigateToPipeline: () => void;
}

// ── Attention items derived from real data ────────────────────────────────────

interface AttentionItem {
  id: string;
  urgency: 'critical' | 'high' | 'medium';
  icon: React.ReactNode;
  headline: string;
  why: string;
  people?: string[];
  dept?: RevelioDept;
  primaryCta: string;
  primaryAction: 'pipeline' | 'dept' | 'ai';
  aiQuestion?: string;
}

function buildAttentionList(): AttentionItem[] {
  const items: AttentionItem[] = [];

  const highRiskPeople = PEOPLE.filter(p => p.flightRisk === 'high');
  if (highRiskPeople.length > 0) {
    items.push({
      id: 'flight-risk-named',
      urgency: 'critical',
      icon: <TrendingUp size={13} />,
      headline: `${highRiskPeople.length} people are likely to leave`,
      why: highRiskPeople[0].flightRiskDrivers?.[0] ?? 'Revelio signals indicate active job-searching behaviour.',
      people: highRiskPeople.map(p => p.name),
      dept: highRiskPeople[0].department as RevelioDept,
      primaryCta: "See who's at risk",
      primaryAction: 'pipeline',
    });
  }

  const compAtRisk = COMP_POSITIONING
    .filter(c => c.percentilePosition < 50 && c.atRiskRoles.length > 0)
    .sort((a, b) => a.percentilePosition - b.percentilePosition);
  if (compAtRisk.length > 0) {
    const worst = compAtRisk[0];
    const roles = compAtRisk.flatMap(c => c.atRiskRoles).slice(0, 3);
    items.push({
      id: 'comp-below-market',
      urgency: 'critical',
      icon: <DollarSign size={13} />,
      headline: `${roles.join(' & ')} paid below market`,
      why: `${worst.dept} is at P${worst.percentilePosition} — peers pay ~$${Math.round((worst.marketP50 - worst.acmeMedian) / 1000)}k more for the same roles. Risk compounds with flight signals above.`,
      dept: worst.dept,
      primaryCta: `Review ${worst.dept} comp`,
      primaryAction: 'dept',
    });
  }

  const engPromo = PROMOTION_RATES.find(r => r.dept === 'Engineering');
  const stalledEngineers = PEOPLE.filter(
    p => p.department === 'Engineering' && p.currentLevelId === 'eng-ic3' && p.tenure >= 20
  );
  if (stalledEngineers.length > 0 && engPromo) {
    items.push({
      id: 'promo-bottleneck-eng',
      urgency: 'high',
      icon: <BarChart2 size={13} />,
      headline: `${stalledEngineers.length} Senior Engineers stuck for 20+ months`,
      why: `Senior→Staff takes ${engPromo.avgMonthsToPromotion}mo at Acme vs ${engPromo.marketAvgMonths}mo at peers. Without a visible path, they'll find one elsewhere.`,
      people: stalledEngineers.map(p => p.name),
      dept: 'Engineering',
      primaryCta: 'Review promotion pipeline',
      primaryAction: 'pipeline',
    });
  }

  const extremeRoles = ROLE_DEMAND.filter(r => r.competitionTier === 'extreme')
    .sort((a, b) => a.talentSupply - b.talentSupply);
  if (extremeRoles.length > 0) {
    const hardest = extremeRoles[0];
    items.push({
      id: 'extreme-hiring',
      urgency: 'high',
      icon: <Users size={13} />,
      headline: `${hardest.role} takes ${hardest.medianDaysToFill} days to fill — demand up ${hardest.demandGrowthPct}%`,
      why: `Talent supply index is ${hardest.talentSupply}/100 market-wide. ${extremeRoles.length - 1} other roles are also in extreme competition.`,
      dept: hardest.dept,
      primaryCta: `View ${hardest.dept} talent signals`,
      primaryAction: 'dept',
    });
  }

  const urgentSkills = SKILL_SIGNALS
    .filter(s => s.trending === 'rising' && s.acmeHasPct < s.marketHasPct && s.scarcityScore > 70)
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 1);
  if (urgentSkills.length > 0) {
    const sk = urgentSkills[0];
    items.push({
      id: 'skill-gap-urgent',
      urgency: 'high',
      icon: <Activity size={13} />,
      headline: `${sk.skill} demand grew ${sk.growthPct}% — Acme coverage ${sk.acmeHasPct}%`,
      why: `Market average coverage is ${sk.marketHasPct}%. Scarcity is ${sk.scarcityScore}/100 — hard to hire in. Identify upskilling candidates now.`,
      dept: sk.relevantDepts[0],
      primaryCta: 'Find upskilling candidates',
      primaryAction: 'ai',
      aiQuestion: `Who in Engineering or Data should we prioritise for LLM upskilling?`,
    });
  }

  const mediumRiskPeople = PEOPLE.filter(p => p.flightRisk === 'medium');
  if (mediumRiskPeople.length > 0) {
    items.push({
      id: 'flight-risk-medium',
      urgency: 'medium',
      icon: <Shield size={13} />,
      headline: `${mediumRiskPeople.length} people showing early warning signs`,
      why: mediumRiskPeople[0].flightRiskDrivers?.[0] ?? 'Passive job-search signals detected. No immediate action required but worth a check-in.',
      people: mediumRiskPeople.map(p => p.name),
      dept: mediumRiskPeople[0].department as RevelioDept,
      primaryCta: 'Review at-risk profiles',
      primaryAction: 'pipeline',
    });
  }

  return items.sort((a, b) => {
    const o = { critical: 0, high: 1, medium: 2 };
    return o[a.urgency] - o[b.urgency];
  });
}

// ── Config ────────────────────────────────────────────────────────────────────

const URGENCY_CFG = {
  critical: {
    leftBar:   'bg-red-400',
    iconBg:    'bg-red-100',
    iconColor: 'text-red-500',
    badge:     'bg-red-50 text-red-600 border-red-200',
    label:     'Act now',
    cta:       'bg-red-500 hover:bg-red-600 text-white',
  },
  high: {
    leftBar:   'bg-amber-400',
    iconBg:    'bg-amber-100',
    iconColor: 'text-amber-600',
    badge:     'bg-amber-50 text-amber-700 border-amber-200',
    label:     'This month',
    cta:       'bg-amber-500 hover:bg-amber-600 text-white',
  },
  medium: {
    leftBar:   'bg-sky-400',
    iconBg:    'bg-sky-100',
    iconColor: 'text-sky-600',
    badge:     'bg-sky-50 text-sky-700 border-sky-200',
    label:     'Monitor',
    cta:       'bg-sky-500 hover:bg-sky-600 text-white',
  },
};

const DEPT_HEADCOUNTS: Record<RevelioDept, number> = {
  Engineering: 52, Product: 15, Design: 8, Data: 17, Marketing: 7, Sales: 11, 'People Ops': 4,
};

// ── Compact attention card ────────────────────────────────────────────────────

function AttentionCard({
  item,
  onSelectDept,
  onAskAI,
  onNavigateToPipeline,
}: {
  item: AttentionItem;
  onSelectDept: (d: RevelioDept) => void;
  onAskAI: (q?: string) => void;
  onNavigateToPipeline: () => void;
}) {
  const cfg = URGENCY_CFG[item.urgency];
  const [showPeople, setShowPeople] = useState(false);

  function handleCta() {
    if (item.primaryAction === 'pipeline') onNavigateToPipeline();
    else if (item.primaryAction === 'dept' && item.dept) onSelectDept(item.dept);
    else onAskAI(item.aiQuestion);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex">
        {/* Left urgency bar */}
        <div className={`w-1 flex-shrink-0 ${cfg.leftBar}`} />

        <div className="flex-1 p-4">
          {/* Top row */}
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconBg} ${cfg.iconColor}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-bold text-gray-900 leading-snug">{item.headline}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{item.why}</p>
            </div>
          </div>

          {/* People list */}
          {item.people && item.people.length > 0 && (
            <div className="mt-2.5 ml-10">
              {showPeople ? (
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {item.people.map(name => {
                      const initials = name.split(' ').map(n => n[0]).join('');
                      return (
                        <span key={name} className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-700 font-medium">
                          <span className="w-4 h-4 rounded bg-brand-navy text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                            {initials}
                          </span>
                          {name}
                        </span>
                      );
                    })}
                  </div>
                  <button onClick={() => setShowPeople(false)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                    <ChevronUp size={9} /> Hide
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPeople(true)}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <ChevronDown size={9} />
                  {item.people.length} {item.people.length === 1 ? 'person' : 'people'}: {item.people.slice(0, 2).join(', ')}{item.people.length > 2 ? ` +${item.people.length - 2}` : ''}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3 ml-10">
            <button
              onClick={handleCta}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${cfg.cta}`}
            >
              {item.primaryCta} <ArrowRight size={10} />
            </button>
            {item.dept && item.primaryAction !== 'dept' && (
              <button
                onClick={() => onSelectDept(item.dept!)}
                className="text-[11px] text-gray-400 hover:text-brand-blue transition-colors flex items-center gap-0.5"
              >
                {item.dept} signals <ArrowUpRight size={9} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dept card (right column) ──────────────────────────────────────────────────

function DeptCard({ dept, onClick }: { dept: RevelioDept; onClick: () => void }) {
  const fr    = FLIGHT_RISK.find(r => r.dept === dept)!;
  const comp  = COMP_POSITIONING.find(r => r.dept === dept)!;
  const promo = PROMOTION_RATES.find(r => r.dept === dept)!;
  const recs  = TALENT_INTEL_RECS.filter(r => r.dept === dept && r.priority === 'critical');
  const extreme = ROLE_DEMAND.filter(r => r.dept === dept && r.competitionTier === 'extreme');

  const riskColor =
    fr.flightRiskScore >= 70 ? 'text-red-500' :
    fr.flightRiskScore >= 60 ? 'text-amber-600' :
    'text-emerald-600';
  const riskBg =
    fr.flightRiskScore >= 70 ? 'bg-red-400' :
    fr.flightRiskScore >= 60 ? 'bg-amber-400' :
    'bg-emerald-400';

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-brand-blue/30 hover:shadow-sm transition-all w-full"
    >
      {/* Name row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{dept}</p>
          <p className="text-[10px] text-gray-400">{DEPT_HEADCOUNTS[dept]} people</p>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {recs.length > 0 && <AlertTriangle size={11} className="text-red-400" />}
          <ChevronRight size={12} className="text-gray-300 group-hover:text-brand-blue transition-colors" />
        </div>
      </div>

      {/* Flight risk bar */}
      <div className="mb-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-gray-400">Flight risk</span>
          <span className={`text-[11px] font-bold ${riskColor}`}>
            {fr.flightRiskScore}
            {fr.trend === 'rising' && <span className="text-[9px] text-red-400 ml-0.5">↑</span>}
            {fr.trend === 'falling' && <span className="text-[9px] text-emerald-500 ml-0.5">↓</span>}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div className={`h-full rounded-full ${riskBg}`} style={{ width: `${fr.flightRiskScore}%` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Comp</p>
          <p className={`text-xs font-bold ${comp.percentilePosition < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            P{comp.percentilePosition}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Promo</p>
          <p className={`text-xs font-bold ${promo.acmePromotionRatePct < promo.marketMedianPct ? 'text-amber-600' : 'text-emerald-600'}`}>
            {promo.acmePromotionRatePct}%
          </p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Hiring</p>
          <p className={`text-xs font-bold ${extreme.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {extreme.length > 0 ? `${extreme.length} hard` : 'OK'}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Org stat strip ────────────────────────────────────────────────────────────

function OrgStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'red' | 'amber' | 'green' | 'blue' }) {
  const cfg = {
    red:   'bg-red-50 border-red-200 text-red-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue:  'bg-brand-blue-bg4 border-brand-blue-bg2 text-brand-blue',
  }[color];
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${cfg}`}>
      <span className="font-bold">{value}</span>
      <span className="font-medium opacity-70">{label}</span>
      {sub && <span className="opacity-50 font-normal">{sub}</span>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DeptHome({ onSelectDept, onAskAI, onNavigateToPipeline }: Props) {
  const [input, setInput] = useState('');
  const attentionItems = buildAttentionList();
  const criticalCount  = attentionItems.filter(i => i.urgency === 'critical').length;

  const avgFlight  = Math.round(FLIGHT_RISK.reduce((s, r) => s + r.flightRiskScore, 0) / FLIGHT_RISK.length);
  const avgComp    = Math.round(COMP_POSITIONING.reduce((s, r) => s + r.percentilePosition, 0) / COMP_POSITIONING.length);
  const extremeCnt = ROLE_DEMAND.filter(r => r.competitionTier === 'extreme').length;
  const highRiskCnt = PEOPLE.filter(p => p.flightRisk === 'high').length;

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
    setInput('');
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{today}</p>
              <h1 className="text-lg font-bold text-gray-900 mt-0.5">
                {criticalCount > 0
                  ? `${criticalCount} issue${criticalCount > 1 ? 's' : ''} need your attention`
                  : 'Workforce overview'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Acme Corp · 114 people · Revelio Labs market data</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <OrgStat value={String(highRiskCnt)} label="at flight risk" color="red" />
              <OrgStat value={`${avgFlight}`} label="avg flight score" color={avgFlight >= 60 ? 'amber' : 'green'} />
              <OrgStat value={`P${avgComp}`} label="avg comp" color={avgComp >= 50 ? 'green' : 'amber'} />
              <OrgStat value={String(extremeCnt)} label="extreme hiring roles" color="red" />
            </div>
          </div>

          {/* AI bar */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-brand-blue focus-within:bg-white transition-all">
            <Sparkles size={13} className="text-brand-blue flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Ask anything — who should I have a retention conversation with this week?"
              className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              className="px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue-text disabled:opacity-30 text-white text-[11px] font-semibold transition-all flex-shrink-0"
            >
              Ask
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {[
              'Who should I talk to this week?',
              'Where should we adjust comp before next review?',
              'Which roles are hardest to backfill?',
              'Build a 30-day retention plan for Engineering',
            ].map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-brand-blue/40 hover:text-brand-blue transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body — two columns */}
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex gap-6 items-start">

          {/* Left: Priorities */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priorities</h2>
              <div className="flex items-center gap-1.5">
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={9} />{criticalCount} critical
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2.5">
              {attentionItems.map(item => (
                <AttentionCard
                  key={item.id}
                  item={item}
                  onSelectDept={onSelectDept}
                  onAskAI={onAskAI}
                  onNavigateToPipeline={onNavigateToPipeline}
                />
              ))}
            </div>
          </div>

          {/* Right: Dept grid */}
          <div className="w-72 flex-shrink-0">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Departments</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {REVELIO_DEPTS.map(dept => (
                <DeptCard key={dept} dept={dept} onClick={() => onSelectDept(dept)} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
