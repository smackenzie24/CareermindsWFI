import { useState } from 'react';
import {
  AlertTriangle, TrendingUp, DollarSign, Users, ChevronRight,
  Sparkles, ArrowRight, Clock, BarChart2, Activity,
  ArrowUpRight, ChevronDown, ChevronUp,
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

// ── Derive the attention list from real data ──────────────────────────────────

interface AttentionItem {
  id: string;
  urgency: 'critical' | 'high' | 'medium';
  icon: React.ReactNode;
  headline: string;
  why: string;
  people?: string[];          // named people where relevant
  peopleCount?: number;
  dept?: RevelioDept;
  primaryCta: string;
  primaryAction: 'pipeline' | 'dept' | 'ai';
  aiQuestion?: string;
}

function buildAttentionList(onSelectDept: (d: RevelioDept) => void): AttentionItem[] {
  const items: AttentionItem[] = [];

  // 1. High-flight-risk named people who haven't been checked in on
  const highRiskPeople = PEOPLE.filter(p => p.flightRisk === 'high');
  if (highRiskPeople.length > 0) {
    items.push({
      id: 'flight-risk-named',
      urgency: 'critical',
      icon: <TrendingUp size={14} />,
      headline: `${highRiskPeople.length} people are likely to leave`,
      why: highRiskPeople[0].flightRiskDrivers?.[0] ?? 'Revelio signals indicate active job-searching behaviour.',
      people: highRiskPeople.map(p => p.name),
      peopleCount: highRiskPeople.length,
      dept: highRiskPeople[0].department as RevelioDept,
      primaryCta: "See who's at risk",
      primaryAction: 'pipeline',
    });
  }

  // 2. Departments with comp below P50 and named at-risk roles
  const compAtRisk = COMP_POSITIONING.filter(c => c.percentilePosition < 50 && c.atRiskRoles.length > 0);
  if (compAtRisk.length > 0) {
    const depts = compAtRisk.map(c => c.dept).join(', ');
    const roles = compAtRisk.flatMap(c => c.atRiskRoles).slice(0, 3);
    const worstDept = compAtRisk.sort((a, b) => a.percentilePosition - b.percentilePosition)[0];
    items.push({
      id: 'comp-below-market',
      urgency: 'critical',
      icon: <DollarSign size={14} />,
      headline: `${roles.join(', ')} are paid below market`,
      why: `${worstDept.dept} sits at P${worstDept.percentilePosition} — competitors are offering ~$${Math.round((worstDept.marketP50 - worstDept.acmeMedian) / 1000)}k more for the same roles.`,
      dept: worstDept.dept,
      primaryCta: `Review ${worstDept.dept} comp`,
      primaryAction: 'dept',
    });
  }

  // 3. Engineering promo bottleneck — Senior → Staff with tenure data
  const engPromo = PROMOTION_RATES.find(r => r.dept === 'Engineering');
  if (engPromo?.bottleneckedLevel) {
    const stalledPeople = PEOPLE.filter(
      p => p.department === 'Engineering' && p.currentLevelId === 'eng-ic3' && p.tenure >= 20
    );
    if (stalledPeople.length > 0) {
      items.push({
        id: 'promo-bottleneck-eng',
        urgency: 'high',
        icon: <BarChart2 size={14} />,
        headline: `${stalledPeople.length} Senior Engineers have been stuck for 20+ months`,
        why: `The ${engPromo.bottleneckedLevel} transition takes ${engPromo.avgMonthsToPromotion}mo at Acme vs ${engPromo.marketAvgMonths}mo at peers. Without a visible path, they'll find one externally.`,
        people: stalledPeople.map(p => p.name),
        peopleCount: stalledPeople.length,
        dept: 'Engineering',
        primaryCta: 'Review promotion pipeline',
        primaryAction: 'pipeline',
      });
    }
  }

  // 4. Extreme-competition hiring roles — hard to backfill
  const extremeRoles = ROLE_DEMAND.filter(r => r.competitionTier === 'extreme');
  if (extremeRoles.length > 0) {
    const hardest = extremeRoles.sort((a, b) => a.talentSupply - b.talentSupply)[0];
    items.push({
      id: 'extreme-hiring',
      urgency: 'high',
      icon: <Users size={14} />,
      headline: `${hardest.role} takes ${hardest.medianDaysToFill} days to fill — market demand up ${hardest.demandGrowthPct}%`,
      why: `Only ${hardest.talentSupply}/100 candidates available market-wide. If you lose someone in this role you won't replace them quickly.`,
      dept: hardest.dept,
      primaryCta: `View ${hardest.dept} talent signals`,
      primaryAction: 'dept',
    });
  }

  // 5. Fast-growing skills with low Acme coverage
  const urgentSkills = SKILL_SIGNALS
    .filter(s => s.trending === 'rising' && s.acmeHasPct < s.marketHasPct && s.scarcityScore > 70)
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 1);
  if (urgentSkills.length > 0) {
    const sk = urgentSkills[0];
    items.push({
      id: 'skill-gap-urgent',
      urgency: 'high',
      icon: <Activity size={14} />,
      headline: `${sk.skill} demand grew ${sk.growthPct}% — only ${sk.acmeHasPct}% of Acme has it`,
      why: `Market average is ${sk.marketHasPct}%. Scarcity score is ${sk.scarcityScore}/100 — you can't hire your way out of this gap easily.`,
      dept: sk.relevantDepts[0],
      primaryCta: 'Ask AI who to upskill',
      primaryAction: 'ai',
      aiQuestion: `Who in Engineering or Data should we prioritise for LLM upskilling?`,
    });
  }

  // Sort: critical first, then high
  return items.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return order[a.urgency] - order[b.urgency];
  });
}

// ── Urgency config ────────────────────────────────────────────────────────────

const URGENCY = {
  critical: {
    border:  'border-red-200',
    bg:      'bg-red-50',
    iconBg:  'bg-red-100',
    iconColor: 'text-red-500',
    badge:   'bg-red-100 text-red-600 border-red-200',
    label:   'Needs attention now',
    bar:     'bg-red-400',
  },
  high: {
    border:  'border-amber-200',
    bg:      'bg-amber-50',
    iconBg:  'bg-amber-100',
    iconColor: 'text-amber-600',
    badge:   'bg-amber-100 text-amber-700 border-amber-200',
    label:   'Act this month',
    bar:     'bg-amber-400',
  },
  medium: {
    border:  'border-sky-200',
    bg:      'bg-sky-50',
    iconBg:  'bg-sky-100',
    iconColor: 'text-sky-600',
    badge:   'bg-sky-100 text-sky-700 border-sky-200',
    label:   'Monitor',
    bar:     'bg-sky-400',
  },
};

// ── Dept mini-card for secondary section ─────────────────────────────────────

const DEPT_HEADCOUNTS: Record<RevelioDept, number> = {
  Engineering: 52, Product: 15, Design: 8, Data: 17, Marketing: 7, Sales: 11, 'People Ops': 4,
};

function DeptMiniCard({ dept, onClick }: { dept: RevelioDept; onClick: () => void }) {
  const fr   = FLIGHT_RISK.find(r => r.dept === dept)!;
  const comp = COMP_POSITIONING.find(r => r.dept === dept)!;
  const recs = TALENT_INTEL_RECS.filter(r => r.dept === dept && r.priority === 'critical');
  const isRisky = fr.flightRiskScore >= 60 || comp.percentilePosition < 48;

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-brand-blue/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{dept}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{DEPT_HEADCOUNTS[dept]} people</p>
        </div>
        <div className="flex items-center gap-1">
          {recs.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Critical actions" />
          )}
          <ChevronRight size={12} className="text-gray-300 group-hover:text-brand-blue transition-colors" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
            <span>Flight risk</span>
            <span className={fr.flightRiskScore >= 70 ? 'text-red-500 font-semibold' : fr.flightRiskScore >= 60 ? 'text-amber-600 font-semibold' : 'text-gray-500'}>{fr.flightRiskScore}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full">
            <div
              className={`h-full rounded-full ${fr.flightRiskScore >= 70 ? 'bg-red-400' : fr.flightRiskScore >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${fr.flightRiskScore}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400">Comp</span>
          <span className={comp.percentilePosition < 50 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>P{comp.percentilePosition}</span>
        </div>
      </div>
    </button>
  );
}

// ── Attention card ────────────────────────────────────────────────────────────

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
  const cfg = URGENCY[item.urgency];
  const [expanded, setExpanded] = useState(false);

  function handleCta() {
    if (item.primaryAction === 'pipeline') onNavigateToPipeline();
    else if (item.primaryAction === 'dept' && item.dept) onSelectDept(item.dept);
    else if (item.primaryAction === 'ai') onAskAI(item.aiQuestion);
  }

  return (
    <div className={`border rounded-2xl overflow-hidden ${cfg.border}`}>
      {/* Urgency bar */}
      <div className={`h-0.5 ${cfg.bar}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ${cfg.iconColor} mt-0.5`}>
            {item.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.headline}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.why}</p>

            {/* Named people — collapsed by default if >2 */}
            {item.people && item.people.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {expanded ? 'Hide' : `Show ${item.people.length} people`}
                </button>
                {expanded && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.people.map(name => {
                      const initials = name.split(' ').map(n => n[0]).join('');
                      return (
                        <div key={name} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-[11px] text-gray-700 font-medium">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCta}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-blue hover:bg-brand-blue-text px-3 py-1.5 rounded-lg transition-colors"
              >
                {item.primaryCta}
                <ArrowRight size={11} />
              </button>
              {item.dept && item.primaryAction !== 'dept' && (
                <button
                  onClick={() => onSelectDept(item.dept!)}
                  className="text-xs text-gray-400 hover:text-brand-blue transition-colors flex items-center gap-1"
                >
                  View {item.dept} <ArrowUpRight size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function DeptHome({ onSelectDept, onAskAI, onNavigateToPipeline }: Props) {
  const [input, setInput] = useState('');
  const [deptsExpanded, setDeptsExpanded] = useState(false);

  const attentionItems = buildAttentionList(onSelectDept);
  const criticalCount = attentionItems.filter(i => i.urgency === 'critical').length;

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
    setInput('');
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-[11px] text-gray-400 font-medium mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {criticalCount > 0
              ? `You have ${criticalCount} critical item${criticalCount > 1 ? 's' : ''} to address`
              : 'Your workforce is in good shape'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acme Corp &middot; 114 people &middot; Powered by Revelio Labs market intelligence</p>
        </div>

        {/* AI bar */}
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-blue flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Ask anything — who should I talk to this week? Where are we losing talent?"
              className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              className="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-text disabled:opacity-30 text-white text-[11px] font-semibold transition-all flex-shrink-0"
            >
              Ask
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {[
              'Who should I have a retention conversation with this week?',
              'Which roles are we most at risk of not being able to backfill?',
              'Where should we adjust comp before the next review cycle?',
            ].map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:border-brand-blue/40 hover:text-brand-blue transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Attention list */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800">Priorities</h2>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={9} />
                  {criticalCount} critical
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3">
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

        {/* Dept grid — secondary, collapsible */}
        <div>
          <button
            onClick={() => setDeptsExpanded(e => !e)}
            className="w-full flex items-center justify-between mb-3 group"
          >
            <h2 className="text-sm font-bold text-gray-800 group-hover:text-gray-900 transition-colors">All departments</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">
              <Clock size={11} />
              <span>Click any for full signals</span>
              {deptsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </button>

          {deptsExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {REVELIO_DEPTS.map(dept => (
                <DeptMiniCard key={dept} dept={dept} onClick={() => onSelectDept(dept)} />
              ))}
            </div>
          )}

          {!deptsExpanded && (
            <div className="flex gap-2 flex-wrap">
              {REVELIO_DEPTS.map(dept => {
                const fr = FLIGHT_RISK.find(r => r.dept === dept)!;
                const isCritical = fr.flightRiskScore >= 70;
                return (
                  <button
                    key={dept}
                    onClick={() => onSelectDept(dept)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-sm ${
                      isCritical
                        ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-300'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-brand-blue/30 hover:text-brand-blue'
                    }`}
                  >
                    {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                    {dept}
                    <ChevronRight size={11} className="opacity-40" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
