import { useState, useMemo, useRef } from 'react';
import {
  AlertTriangle, TrendingUp, DollarSign, Users, ChevronRight, ChevronLeft,
  Sparkles, ArrowRight, BarChart2, Activity, ArrowUpRight,
  ChevronDown, ChevronUp, Shield, Download,
} from 'lucide-react';
import {
  REVELIO_DEPTS, FLIGHT_RISK, COMP_POSITIONING, TALENT_INTEL_RECS,
  ROLE_DEMAND, SKILL_SIGNALS, PROMOTION_RATES,
  type RevelioDept,
} from '../../data/revelioData';
import { PEOPLE, getAllReadiness } from '../../data/promotionData';
import { SKILLS_DATA, type Department } from '../../data/mockData';

interface Props {
  onSelectDept: (dept: RevelioDept) => void;
  onAskAI: (question?: string) => void;
  onNavigateToPipeline: () => void;
  onNavigate: (view: string) => void;
}

// ── Computed KPI snapshot (from real data) ────────────────────────────────────

function computeKpis() {
  const allReadiness = getAllReadiness();

  // People mapped to a position = everyone in PEOPLE (they all have a level)
  const totalPeople = PEOPLE.length;
  const stalledCount = allReadiness.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length;

  // Skill gaps = total individual gap instances across all SKILLS_DATA rows
  const totalSkillGaps = SKILLS_DATA.reduce((sum, row) => sum + row.belowTarget, 0);
  const criticalGapSkills = new Set(
    SKILLS_DATA.filter(row => row.headcount > 0 && (row.belowTarget / row.headcount) >= 0.7).map(r => r.skill)
  ).size;

  // People above requirement = readiness >= 90%
  const nearReadyCount = allReadiness.filter(r => r.readinessPct >= 90).length;
  const readyCount     = allReadiness.filter(r => r.readinessPct >= 100).length;

  // Key-person risks = distinct skills held by ≤2 people across the org
  // Use headcount from SKILLS_DATA — skills where total headcount is ≤2
  const skillHeadcounts: Record<string, number> = {};
  for (const row of SKILLS_DATA) {
    skillHeadcounts[row.skill] = (skillHeadcounts[row.skill] ?? 0) + row.headcount;
  }
  const keyPersonRisks = Object.values(skillHeadcounts).filter(n => n <= 2).length;

  return { totalPeople, stalledCount, totalSkillGaps, criticalGapSkills, nearReadyCount, readyCount, keyPersonRisks };
}

// ── Per-dept snapshot (from real internal data) ───────────────────────────────

interface DeptSnapshot {
  dept: Department;
  headcount: number;
  avgReadinessPct: number;
  topGapSkill: string;
  topGapDelta: number;
}

function computeDeptSnapshots(): DeptSnapshot[] {
  const allReadiness = getAllReadiness();

  return (REVELIO_DEPTS as unknown as Department[]).map(dept => {
    const deptReadiness = allReadiness.filter(r => r.person.department === dept);
    const avgReadinessPct = deptReadiness.length > 0
      ? Math.round(deptReadiness.reduce((s, r) => s + r.readinessPct, 0) / deptReadiness.length)
      : 0;

    const deptSkills = SKILLS_DATA.filter(row => row.department === dept);
    // Top gap: skill with the biggest absolute gap (expectedLevel - averageActual), weighted by belowTarget
    const topGap = deptSkills
      .map(row => ({ skill: row.skill, delta: row.expectedLevel - row.averageActual, below: row.belowTarget }))
      .sort((a, b) => b.delta * b.below - a.delta * a.below)[0];

    return {
      dept,
      headcount: PEOPLE.filter(p => p.department === dept).length,
      avgReadinessPct,
      topGapSkill: topGap?.skill ?? '—',
      topGapDelta: topGap ? -Math.round(topGap.delta * 10) / 10 : 0,
    };
  });
}

// ── KPI card (matches screenshot style) ──────────────────────────────────────

interface KpiDef {
  value: number | string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  sublabelColor: string;
  onClick: () => void;
}

function OverviewCard({ kpi }: { kpi: KpiDef }) {
  return (
    <button
      onClick={kpi.onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-px transition-all text-left px-5 py-5 flex flex-col gap-2 min-w-0"
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl font-black text-gray-900 leading-none">{kpi.value}</span>
        <span className="text-gray-300 group-hover:text-gray-400 transition-colors mt-0.5">{kpi.icon}</span>
      </div>
      <p className="text-xs text-gray-500 leading-snug">{kpi.label}</p>
      <p className={`text-[11px] font-semibold ${kpi.sublabelColor}`}>{kpi.sublabel}</p>
    </button>
  );
}

// ── Teams at a glance card ─────────────────────────────────────────────────────

function TeamCard({ snap, onClick }: { snap: DeptSnapshot; onClick: () => void }) {
  const readinessColor = snap.avgReadinessPct >= 85 ? 'bg-emerald-500' : snap.avgReadinessPct >= 65 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:-translate-y-px transition-all w-full h-full shadow-sm"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{snap.dept}</p>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-blue transition-colors" />
      </div>
      <p className="text-[11px] text-gray-400 mb-4">{snap.headcount} people</p>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400">Readiness</span>
          <span className="font-bold text-gray-700">{snap.avgReadinessPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${readinessColor}`} style={{ width: `${snap.avgReadinessPct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400">Top gap</span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
          {snap.topGapSkill} {snap.topGapDelta}
        </span>
      </div>
    </button>
  );
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

// ── Main ───────────────────────────────────────────────────────────────────────

export function DeptHome({ onSelectDept, onAskAI, onNavigateToPipeline, onNavigate }: Props) {
  const [input, setInput] = useState('');
  const teamsScrollRef = useRef<HTMLDivElement>(null);

  const kpis        = useMemo(() => computeKpis(), []);
  const deptSnaps   = useMemo(() => computeDeptSnapshots(), []);
  const attentionItems = useMemo(() => buildAttentionList(), []);
  const criticalCount  = attentionItems.filter(i => i.urgency === 'critical').length;

  const overviewCards: KpiDef[] = [
    {
      value: kpis.totalPeople,
      icon: <Users size={18} />,
      label: 'People mapped to a position',
      sublabel: kpis.stalledCount > 0 ? `${kpis.stalledCount} stalled 24M+` : 'all progressing',
      sublabelColor: kpis.stalledCount > 0 ? 'text-amber-500' : 'text-emerald-600',
      onClick: () => onNavigateToPipeline(),
    },
    {
      value: kpis.totalSkillGaps,
      icon: <AlertTriangle size={18} />,
      label: 'Skill gaps below requirement',
      sublabel: kpis.criticalGapSkills > 0 ? `${kpis.criticalGapSkills} skills need attention` : 'no critical gaps',
      sublabelColor: kpis.criticalGapSkills > 0 ? 'text-red-500' : 'text-emerald-600',
      onClick: () => onNavigate('heatmap'),
    },
    {
      value: kpis.nearReadyCount,
      icon: <TrendingUp size={18} />,
      label: 'People above requirement',
      sublabel: kpis.readyCount > 0 ? `${kpis.readyCount} fully ready · promotion-ready / under-used` : 'promotion-ready / under-used',
      sublabelColor: 'text-emerald-600',
      onClick: () => onNavigateToPipeline(),
    },
    {
      value: kpis.keyPersonRisks,
      icon: <AlertTriangle size={18} />,
      label: 'Key-person risks',
      sublabel: kpis.keyPersonRisks > 0 ? 'held by ≤2 people' : 'no single points of failure',
      sublabelColor: kpis.keyPersonRisks > 0 ? 'text-red-500' : 'text-emerald-600',
      onClick: () => onNavigate('heatmap'),
    },
  ];

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
    setInput('');
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{today}</p>
              <h1 className="text-lg font-bold text-gray-900 mt-0.5">Workforce Health Dashboard</h1>
              <p className="text-xs text-gray-500 mt-0.5">Acme Corp · {kpis.totalPeople} people · Click any card to investigate</p>
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
            {['Who should I talk to this week?', 'Where should we adjust comp before next review?', 'Which roles are hardest to backfill?'].map(q => (
              <button key={q} onClick={() => submit(q)} className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500 hover:border-brand-blue/40 hover:text-brand-blue transition-colors">{q}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-5 space-y-6">

        {/* Overview KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {overviewCards.map(k => <OverviewCard key={k.label} kpi={k} />)}
        </div>

        {/* Teams at a glance */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Teams at a glance</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Average readiness against role requirements, with each team's biggest gap.</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-2">{deptSnaps.length} teams</span>
              <button
                onClick={() => { teamsScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' }); }}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors bg-white shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => { teamsScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' }); }}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors bg-white shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div ref={teamsScrollRef} className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
            {deptSnaps.map(snap => (
              <div key={snap.dept} className="flex-shrink-0 w-56">
                <TeamCard
                  snap={snap}
                  onClick={() => onSelectDept(snap.dept as unknown as RevelioDept)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Priorities + side column */}
        <div className="flex gap-6 items-start">

          {/* Left: Priority alerts */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">Priorities requiring attention</h2>
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

          {/* Right: Quick links */}
          <div className="w-64 flex-shrink-0 space-y-3">
            <h2 className="text-sm font-bold text-gray-900">Quick access</h2>
            {([
              { label: 'Skills heatmap', sub: 'All gaps by team & level', view: 'heatmap', color: 'bg-blue-50 border-blue-100 hover:border-blue-200' },
              { label: 'Talent pipeline', sub: 'Promotions & flight risk', view: 'pipeline', color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-200' },
              { label: 'Manager effectiveness', sub: 'Team health by manager', view: 'managers', color: 'bg-amber-50 border-amber-100 hover:border-amber-200' },
              { label: 'Industry benchmarks', sub: 'Comp & talent vs peers', view: 'benchmark', color: 'bg-purple-50 border-purple-100 hover:border-purple-200' },
            ] as const).map(item => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${item.color}`}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{item.sub}</p>
                </div>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}


