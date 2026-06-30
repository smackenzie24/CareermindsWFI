import { useState, useEffect } from 'react';
import {
  AlertTriangle, TrendingUp, DollarSign, Users, ChevronRight,
  Sparkles, ArrowRight, BarChart2, Activity, ArrowUpRight,
  ChevronDown, ChevronUp, Shield, Star, CheckCircle2,
  Globe, LogOut, CalendarX,
} from 'lucide-react';
import {
  REVELIO_DEPTS, FLIGHT_RISK, COMP_POSITIONING, TALENT_INTEL_RECS,
  ROLE_DEMAND, SKILL_SIGNALS, PROMOTION_RATES,
  type RevelioDept,
} from '../../data/revelioData';
import { PEOPLE } from '../../data/promotionData';
import { computeExecSummaryAsync, type ExecSummary } from '../../data/execSummaryData';
import { Download } from 'lucide-react';

interface Props {
  onSelectDept: (dept: RevelioDept) => void;
  onAskAI: (question?: string) => void;
  onNavigateToPipeline: () => void;
  onNavigate: (view: string) => void;
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

interface KpiItem {
  icon: React.ReactNode;
  iconColor: string;
  value: string;
  suffix?: string;
  note?: string;
  noteColor?: string;
  label: string;
  valueColor: string;
  onClick: () => void;
}

function KpiCard({ item }: { item: KpiItem }) {
  return (
    <button
      onClick={item.onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-px transition-all text-left px-5 py-4 flex flex-col gap-3 min-w-0"
    >
      <div className="flex items-center justify-between">
        <span className={item.iconColor}>{item.icon}</span>
        <ArrowRight size={13} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={`text-3xl font-black leading-none tracking-tight ${item.valueColor}`}>{item.value}</span>
        {item.suffix && <span className="text-sm font-semibold text-gray-400">{item.suffix}</span>}
        {item.note && <span className={`text-xs font-semibold ${item.noteColor ?? 'text-gray-400'}`}>{item.note}</span>}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">{item.label}</p>
    </button>
  );
}

function ordinal(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildKpis(summary: ExecSummary, nav: Props): KpiItem[] {
  const totalFlagged = summary.overdueCheckIns + summary.criticalCheckIns;
  const healthColor = summary.orgHealthScore >= 75 ? 'text-emerald-600' : summary.orgHealthScore >= 55 ? 'text-amber-500' : 'text-red-600';
  const gapColor = summary.peopleWithSkillGaps === 0 ? 'text-emerald-600' : summary.peopleWithSkillGaps <= 10 ? 'text-amber-500' : 'text-red-600';
  const readyColor = summary.totalNearReady >= 5 ? 'text-emerald-600' : summary.totalNearReady >= 2 ? 'text-amber-500' : 'text-orange-500';
  const stalledColor = summary.totalStalled === 0 ? 'text-gray-500' : 'text-gray-700';
  const mgrColor = summary.managersNeedingSupport === 0 ? 'text-emerald-600' : summary.managersNeedingSupport === 1 ? 'text-amber-500' : 'text-orange-500';
  const rankColor = summary.benchmarkRank <= Math.ceil(summary.benchmarkTotal / 2) ? 'text-emerald-600' : 'text-red-600';
  const attrColor = summary.attritionScore.score >= 70 ? 'text-red-600' : summary.attritionScore.score >= 45 ? 'text-amber-500' : 'text-emerald-600';
  const checkInColor = totalFlagged === 0 ? 'text-emerald-600' : summary.criticalCheckIns > 0 ? 'text-red-600' : 'text-amber-500';

  return [
    {
      icon: <Shield size={18} />, iconColor: 'text-orange-400',
      value: String(summary.orgHealthScore), suffix: '/100',
      valueColor: healthColor, label: 'Org Health',
      onClick: () => nav.onNavigate('heatmap'),
    },
    {
      icon: <AlertTriangle size={18} />, iconColor: 'text-red-400',
      value: String(summary.peopleWithSkillGaps), note: 'people',
      valueColor: gapColor, label: 'Below Expected Level',
      onClick: () => nav.onNavigate('heatmap'),
    },
    {
      icon: <TrendingUp size={18} />, iconColor: 'text-emerald-500',
      value: String(summary.totalNearReady), note: 'ready',
      valueColor: readyColor, label: 'Promotable Now',
      onClick: () => nav.onNavigateToPipeline(),
    },
    {
      icon: <CheckCircle2 size={18} />, iconColor: 'text-gray-400',
      value: String(summary.totalStalled), note: 'stalled',
      valueColor: stalledColor, label: 'Stalled 24M+',
      onClick: () => nav.onNavigateToPipeline(),
    },
    {
      icon: <Users size={18} />, iconColor: 'text-amber-400',
      value: String(summary.managersNeedingSupport), note: 'flagged',
      valueColor: mgrColor, label: 'Managers',
      onClick: () => nav.onNavigate('managers'),
    },
    {
      icon: <Globe size={18} />, iconColor: 'text-orange-400',
      value: ordinal(summary.benchmarkRank), note: `of ${summary.benchmarkTotal}`,
      valueColor: rankColor, label: 'Industry Rank',
      onClick: () => nav.onNavigate('benchmark'),
    },
    {
      icon: <LogOut size={18} />, iconColor: attrColor,
      value: String(summary.attritionScore.score), suffix: '/100',
      note: summary.attritionScore.riskLabel, noteColor: attrColor,
      valueColor: attrColor, label: 'Attrition Risk',
      onClick: () => nav.onNavigate('benchmark'),
    },
    {
      icon: <CalendarX size={18} />, iconColor: totalFlagged === 0 ? 'text-emerald-400' : summary.criticalCheckIns > 0 ? 'text-red-400' : 'text-amber-400',
      value: String(totalFlagged), suffix: totalFlagged > 0 ? `/ ${summary.totalHeadcount}` : undefined,
      note: totalFlagged === 0 ? 'all current' : undefined,
      valueColor: checkInColor, label: 'No Check-In',
      onClick: () => nav.onNavigateToPipeline(),
    },
  ];
}

// ── Attention items ────────────────────────────────────────────────────────────

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
      id: 'flight-risk-named', urgency: 'critical',
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
      id: 'comp-below-market', urgency: 'critical',
      icon: <DollarSign size={13} />,
      headline: `${roles.join(' & ')} paid below market`,
      why: `${worst.dept} is at P${worst.percentilePosition} — peers pay ~$${Math.round((worst.marketP50 - worst.acmeMedian) / 1000)}k more for the same roles. Risk compounds with the flight signals above.`,
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
      id: 'promo-bottleneck-eng', urgency: 'high',
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
      id: 'extreme-hiring', urgency: 'high',
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
      id: 'skill-gap-urgent', urgency: 'high',
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
      id: 'flight-risk-medium', urgency: 'medium',
      icon: <Shield size={13} />,
      headline: `${mediumRiskPeople.length} people showing early warning signs`,
      why: mediumRiskPeople[0].flightRiskDrivers?.[0] ?? 'Passive job-search signals detected. Worth scheduling a check-in.',
      people: mediumRiskPeople.map(p => p.name),
      dept: mediumRiskPeople[0].department as RevelioDept,
      primaryCta: 'Review at-risk profiles',
      primaryAction: 'pipeline',
    });
  }

  return items.sort((a, b) => ({ critical: 0, high: 1, medium: 2 }[a.urgency] - { critical: 0, high: 1, medium: 2 }[b.urgency]));
}

// ── Urgency config ─────────────────────────────────────────────────────────────

const URGENCY_CFG = {
  critical: {
    leftBar: 'bg-red-400', iconBg: 'bg-red-100', iconColor: 'text-red-500',
    badge: 'bg-red-50 text-red-600 border-red-200', label: 'Act now',
    cta: 'bg-red-500 hover:bg-red-600 text-white',
  },
  high: {
    leftBar: 'bg-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'This month',
    cta: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  medium: {
    leftBar: 'bg-sky-400', iconBg: 'bg-sky-100', iconColor: 'text-sky-600',
    badge: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Monitor',
    cta: 'bg-sky-500 hover:bg-sky-600 text-white',
  },
};

const DEPT_HEADCOUNTS: Record<RevelioDept, number> = {
  Engineering: 52, Product: 15, Design: 8, Data: 17, Marketing: 7, Sales: 11, 'People Ops': 4,
};

// ── Compact attention card ─────────────────────────────────────────────────────

function AttentionCard({
  item, onSelectDept, onAskAI, onNavigateToPipeline,
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
        <div className={`w-1 flex-shrink-0 ${cfg.leftBar}`} />
        <div className="flex-1 p-4">
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

          {item.people && item.people.length > 0 && (
            <div className="mt-2.5 ml-10">
              {showPeople ? (
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {item.people.map(name => {
                      const initials = name.split(' ').map(n => n[0]).join('');
                      return (
                        <span key={name} className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5 text-[11px] text-gray-700 font-medium">
                          <span className="w-4 h-4 rounded bg-brand-navy text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">{initials}</span>
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
                <button onClick={() => setShowPeople(true)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                  <ChevronDown size={9} />
                  {item.people.length} {item.people.length === 1 ? 'person' : 'people'}: {item.people.slice(0, 2).join(', ')}{item.people.length > 2 ? ` +${item.people.length - 2}` : ''}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 ml-10">
            <button onClick={handleCta} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${cfg.cta}`}>
              {item.primaryCta} <ArrowRight size={10} />
            </button>
            {item.dept && item.primaryAction !== 'dept' && (
              <button onClick={() => onSelectDept(item.dept!)} className="text-[11px] text-gray-400 hover:text-brand-blue transition-colors flex items-center gap-0.5">
                {item.dept} signals <ArrowUpRight size={9} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dept card (right column) ───────────────────────────────────────────────────

function DeptCard({ dept, onClick }: { dept: RevelioDept; onClick: () => void }) {
  const fr    = FLIGHT_RISK.find(r => r.dept === dept)!;
  const comp  = COMP_POSITIONING.find(r => r.dept === dept)!;
  const promo = PROMOTION_RATES.find(r => r.dept === dept)!;
  const recs  = TALENT_INTEL_RECS.filter(r => r.dept === dept && r.priority === 'critical');
  const extreme = ROLE_DEMAND.filter(r => r.dept === dept && r.competitionTier === 'extreme');

  const riskColor = fr.flightRiskScore >= 70 ? 'text-red-500' : fr.flightRiskScore >= 60 ? 'text-amber-600' : 'text-emerald-600';
  const riskBg    = fr.flightRiskScore >= 70 ? 'bg-red-400'   : fr.flightRiskScore >= 60 ? 'bg-amber-400'   : 'bg-emerald-400';

  return (
    <button onClick={onClick} className="group bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-brand-blue/30 hover:shadow-sm transition-all w-full">
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
      <div className="mb-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-gray-400">Flight risk</span>
          <span className={`text-[11px] font-bold ${riskColor}`}>
            {fr.flightRiskScore}
            {fr.trend === 'rising'  && <span className="text-[9px] text-red-400 ml-0.5">↑</span>}
            {fr.trend === 'falling' && <span className="text-[9px] text-emerald-500 ml-0.5">↓</span>}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div className={`h-full rounded-full ${riskBg}`} style={{ width: `${fr.flightRiskScore}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Comp</p>
          <p className={`text-xs font-bold ${comp.percentilePosition < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>P{comp.percentilePosition}</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Promo</p>
          <p className={`text-xs font-bold ${promo.acmePromotionRatePct < promo.marketMedianPct ? 'text-amber-600' : 'text-emerald-600'}`}>{promo.acmePromotionRatePct}%</p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">Hiring</p>
          <p className={`text-xs font-bold ${extreme.length > 0 ? 'text-red-500' : 'text-gray-500'}`}>{extreme.length > 0 ? `${extreme.length} hard` : 'OK'}</p>
        </div>
      </div>
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function DeptHome({ onSelectDept, onAskAI, onNavigateToPipeline, onNavigate }: Props) {
  const [input, setInput]       = useState('');
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [summary, setSummary]   = useState<ExecSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeExecSummaryAsync().then(r => { if (!cancelled) setSummary(r); });
    return () => { cancelled = true; };
  }, []);

  const attentionItems = buildAttentionList();
  const criticalCount  = attentionItems.filter(i => i.urgency === 'critical').length;

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
    setInput('');
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const kpis  = summary ? buildKpis(summary, { onSelectDept, onAskAI, onNavigateToPipeline, onNavigate }) : [];

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{today}</p>
              <h1 className="text-lg font-bold text-gray-900 mt-0.5">Workforce Health Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Acme Corp · 114 people · Click any card to investigate</p>
            </div>
            <div className="flex-shrink-0 mt-1">
              <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
                <Download size={12} />
                Export report
              </button>
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
              placeholder="Ask anything about your workforce…"
              className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
            />
            <button onClick={() => submit()} disabled={!input.trim()} className="px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue-text disabled:opacity-30 text-white text-[11px] font-semibold transition-all flex-shrink-0">
              Ask
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {['Who should I talk to this week?', "Where should we adjust comp before next review?", 'Which roles are hardest to backfill?'].map(q => (
              <button key={q} onClick={() => submit(q)} className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-brand-blue/40 hover:text-brand-blue transition-colors">{q}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-5 space-y-6">

        {/* KPI strip */}
        {summary && (
          <div>
            <div className="grid grid-cols-4 gap-3">
              {kpis.slice(0, 4).map(k => <KpiCard key={k.label} item={k} />)}
            </div>
            {kpiExpanded && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {kpis.slice(4).map(k => <KpiCard key={k.label} item={k} />)}
              </div>
            )}
            <div className="flex justify-center mt-2.5">
              <button onClick={() => setKpiExpanded(e => !e)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {kpiExpanded
                  ? <><ChevronUp size={12} />Hide managers, rank, attrition &amp; check-ins</>
                  : <><ChevronDown size={12} />Show managers, rank, attrition &amp; check-ins</>}
              </button>
            </div>
          </div>
        )}

        {/* Wins strip */}
        {summary && summary.wins.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star size={11} className="text-amber-400" /> Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {summary.wins.map((win, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">{win.title}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">{win.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two-column: alerts + depts */}
        <div className="flex gap-6 items-start">

          {/* Left: Priorities */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priorities requiring attention</h2>
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={9} />{criticalCount} critical
                </span>
              )}
            </div>
            <div className="space-y-2.5">
              {attentionItems.map(item => (
                <AttentionCard key={item.id} item={item} onSelectDept={onSelectDept} onAskAI={onAskAI} onNavigateToPipeline={onNavigateToPipeline} />
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


