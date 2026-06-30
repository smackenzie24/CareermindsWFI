import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, TrendingUp, DollarSign, Users, ChevronRight, Sparkles, Activity } from 'lucide-react';
import {
  REVELIO_DEPTS, FLIGHT_RISK, COMP_POSITIONING, TALENT_INTEL_RECS,
  ROLE_DEMAND, SKILL_SIGNALS, PROMOTION_RATES,
  type RevelioDept,
} from '../../data/revelioData';

interface Props {
  onSelectDept: (dept: RevelioDept) => void;
  onAskAI: (question?: string) => void;
}

function getRiskLevel(score: number, marketAvg: number): 'critical' | 'high' | 'moderate' | 'low' {
  const delta = score - marketAvg;
  if (score >= 70) return 'critical';
  if (score >= 60 || delta >= 10) return 'high';
  if (score >= 50) return 'moderate';
  return 'low';
}

const RISK_CONFIG = {
  critical: { bar: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200',     label: 'Critical',  dot: 'bg-red-400' },
  high:     { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'High',     dot: 'bg-amber-400' },
  moderate: { bar: 'bg-sky-300',     badge: 'bg-sky-50 text-sky-700 border-sky-200',       label: 'Moderate', dot: 'bg-sky-400' },
  low:      { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Low', dot: 'bg-emerald-400' },
};

function TrendIcon({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising')  return <ArrowUpRight size={10} className="text-red-500" />;
  if (trend === 'falling') return <ArrowDownRight size={10} className="text-emerald-500" />;
  return <Minus size={10} className="text-gray-400" />;
}

function CompBar({ pct, p25, p50, p75 }: { pct: number; p25: number; p50: number; p75: number }) {
  const clamp = Math.max(0, Math.min(100, pct));
  const color = pct >= 50 ? 'bg-emerald-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="relative h-1.5 bg-gray-100 rounded-full mt-1">
      <div className="absolute left-[25%] top-0 bottom-0 w-px bg-gray-300 opacity-60" />
      <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gray-300 opacity-60" />
      <div className="absolute left-[75%] top-0 bottom-0 w-px bg-gray-300 opacity-60" />
      <div
        className={`absolute top-0 left-0 h-full rounded-full ${color}`}
        style={{ width: `${clamp}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2 border-gray-400 shadow-sm"
        style={{ left: `calc(${clamp}% - 4px)` }}
      />
    </div>
  );
}

interface DeptCardData {
  dept: RevelioDept;
  flightRisk: number;
  flightTrend: 'rising' | 'stable' | 'falling';
  flightVsMarket: number;
  compPct: number;
  atRiskRoles: string[];
  extremeRoles: number;
  criticalRecs: number;
  topSkillGrowth: string;
  promotionBottleneck: string | null;
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
}

function buildDeptCard(dept: RevelioDept): DeptCardData {
  const fr = FLIGHT_RISK.find(r => r.dept === dept)!;
  const comp = COMP_POSITIONING.find(r => r.dept === dept)!;
  const recs = TALENT_INTEL_RECS.filter(r => r.dept === dept || !r.dept);
  const criticalRecs = recs.filter(r => r.priority === 'critical').length;
  const extreme = ROLE_DEMAND.filter(r => r.dept === dept && r.competitionTier === 'extreme');
  const deptSkills = SKILL_SIGNALS.filter(s => s.relevantDepts.includes(dept) && s.trending === 'rising').sort((a, b) => b.growthPct - a.growthPct);
  const promo = PROMOTION_RATES.find(r => r.dept === dept)!;
  return {
    dept,
    flightRisk: fr.flightRiskScore,
    flightTrend: fr.trend,
    flightVsMarket: fr.flightRiskScore - fr.marketAvgScore,
    compPct: comp.percentilePosition,
    atRiskRoles: comp.atRiskRoles,
    extremeRoles: extreme.length,
    criticalRecs,
    topSkillGrowth: deptSkills[0]?.skill ?? '—',
    promotionBottleneck: promo.bottleneckedLevel,
    riskLevel: getRiskLevel(fr.flightRiskScore, fr.marketAvgScore),
  };
}

const DEPT_HEADCOUNTS: Record<RevelioDept, number> = {
  Engineering: 52, Product: 15, Design: 8, Data: 17, Marketing: 7, Sales: 11, 'People Ops': 4,
};

function DeptCard({ data, onClick }: { data: DeptCardData; onClick: () => void }) {
  const riskCfg = RISK_CONFIG[data.riskLevel];
  const comp = COMP_POSITIONING.find(r => r.dept === data.dept)!;

  return (
    <button
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-brand-blue/30 hover:shadow-md transition-all duration-200 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-gray-900">{data.dept}</h3>
            <span className="text-[10px] text-gray-400 font-medium">{DEPT_HEADCOUNTS[data.dept]} people</span>
          </div>
          {data.criticalRecs > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
              <AlertTriangle size={8} />
              {data.criticalRecs} critical action{data.criticalRecs > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskCfg.badge} flex-shrink-0`}>
          {riskCfg.label}
        </span>
      </div>

      {/* Signals */}
      <div className="space-y-3">
        {/* Flight risk */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-gray-400" />
              <span className="text-[11px] text-gray-500 font-medium">Flight risk</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon trend={data.flightTrend} />
              <span className="text-[11px] font-bold text-gray-800">{data.flightRisk}</span>
              <span className="text-[10px] text-gray-400">
                {data.flightVsMarket > 0 ? `+${data.flightVsMarket}` : data.flightVsMarket} vs market
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div
              className={`h-full rounded-full ${riskCfg.bar}`}
              style={{ width: `${data.flightRisk}%` }}
            />
          </div>
        </div>

        {/* Comp position */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <DollarSign size={10} className="text-gray-400" />
              <span className="text-[11px] text-gray-500 font-medium">Comp position</span>
            </div>
            <span className={`text-[11px] font-bold ${data.compPct >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
              P{data.compPct}
            </span>
          </div>
          <CompBar pct={data.compPct} p25={25} p50={50} p75={75} />
          {data.atRiskRoles.length > 0 && (
            <p className="text-[10px] text-amber-600 mt-1 truncate">
              Below P50: {data.atRiskRoles.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom signals row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Hiring</p>
          <p className="text-[11px] font-semibold text-gray-700">
            {data.extremeRoles > 0 ? (
              <span className="text-red-500">{data.extremeRoles} extreme</span>
            ) : (
              <span className="text-emerald-600">Moderate</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Promo gap</p>
          <p className="text-[11px] font-semibold text-gray-700 leading-tight">
            {data.promotionBottleneck ? (
              <span className="text-amber-600 text-[10px]">{data.promotionBottleneck.split('→')[0].trim()}</span>
            ) : (
              <span className="text-emerald-600">On track</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Top skill</p>
          <p className="text-[11px] font-semibold text-gray-700 truncate">{data.topSkillGrowth}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-[11px] text-brand-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          View department
        </span>
        <ChevronRight size={13} className="text-gray-300 group-hover:text-brand-blue transition-colors ml-auto" />
      </div>
    </button>
  );
}

const ORG_STATS = (() => {
  const avgFlight = Math.round(FLIGHT_RISK.reduce((s, r) => s + r.flightRiskScore, 0) / FLIGHT_RISK.length);
  const avgComp   = Math.round(COMP_POSITIONING.reduce((s, r) => s + r.percentilePosition, 0) / COMP_POSITIONING.length);
  const extremeCount = ROLE_DEMAND.filter(r => r.competitionTier === 'extreme').length;
  const critCount = TALENT_INTEL_RECS.filter(r => r.priority === 'critical').length;
  return { avgFlight, avgComp, extremeCount, critCount };
})();

export function DeptHome({ onSelectDept, onAskAI }: Props) {
  const cards = REVELIO_DEPTS.map(buildDeptCard);
  const [input, setInput] = useState('');

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
  }

  const QUICK_QUESTIONS = [
    'Who is at risk of leaving?',
    'Where are our biggest skills gaps?',
    'Which roles are hardest to hire?',
    'Where is comp below market?',
  ];

  return (
    <div className="h-full overflow-y-auto bg-brand-bg-light">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Workforce Intelligence</h1>
            <p className="text-sm text-gray-500 mt-0.5">Acme Corp &mdash; 114 people across 7 departments &middot; Powered by Revelio Labs market data</p>
          </div>

          {/* Org-level stat pills */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={11} className="text-red-500" />
              <span className="text-[11px] font-semibold text-red-600">{ORG_STATS.critCount} critical actions</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
              <TrendingUp size={11} className="text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">Avg flight risk {ORG_STATS.avgFlight}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${ORG_STATS.avgComp >= 50 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <DollarSign size={11} className={ORG_STATS.avgComp >= 50 ? 'text-emerald-600' : 'text-amber-600'} />
              <span className={`text-[11px] font-semibold ${ORG_STATS.avgComp >= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>Avg comp P{ORG_STATS.avgComp}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
              <Users size={11} className="text-red-500" />
              <span className="text-[11px] font-semibold text-red-600">{ORG_STATS.extremeCount} extreme hiring roles</span>
            </div>
          </div>
        </div>

        {/* AI bar */}
        <div className="max-w-6xl mx-auto mt-4">
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
            <button
              onClick={() => submit()}
              disabled={!input.trim()}
              className="px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue-text disabled:opacity-30 text-white text-[11px] font-semibold transition-all flex-shrink-0"
            >
              Ask
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-brand-blue/40 hover:text-brand-blue transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department grid */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Departments</h2>
          <span className="text-[11px] text-gray-400">Click a card to drill into signals</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map(card => (
            <DeptCard key={card.dept} data={card} onClick={() => onSelectDept(card.dept)} />
          ))}
        </div>
      </div>
    </div>
  );
}
