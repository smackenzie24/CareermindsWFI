import { useState } from 'react';
import {
  Sparkles, ArrowRight, AlertTriangle, UserPlus, BookOpen,
  RefreshCw, Eye, Zap, Scale, AlertCircle, CheckCircle2,
  MinusCircle, ExternalLink, Users, TrendingUp, MoveRight,
  CircleDot, Check, Pencil, ChevronRight, X, Linkedin, Info,
} from 'lucide-react';
import {
  type ChatMessage,
  type QueryResult,
  type PersonResult,
  type SkillGapResult,
  type DeptSummaryResult,
  type RecommendationResult,
  type ScenarioResult,
  type ReductionAnalysis,
  type DeptReductionImpact,
  type ClarificationResult,
  type ActionType,
  type ActionNavTarget,
  type DecisionFrame,
  type CommitmentPrompt,
  type PartnerRecommendation,
} from '../../data/chatEngine';
import { type CrossDeptFitResult, DEPT_COLORS as PROMO_DEPT_COLORS } from '../../data/promotionData';
import { DEPT_COLORS } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

// ── Badges & small helpers ────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  'Near Ready': 'bg-emerald-100 text-emerald-800',
  'Progressing': 'bg-sky-100 text-sky-800',
  'Developing': 'bg-amber-100 text-amber-800',
  'Early Stage': 'bg-gray-100 text-gray-600',
};

function ReadinessBadge({ tier, pct }: { tier: string; pct: number }) {
  const cls = TIER_COLORS[tier] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {pct}%
    </span>
  );
}

// ── Person cards ──────────────────────────────────────────────────────

export function PersonCard({ item }: { item: PersonResult }) {
  const color = DEPT_COLORS[item.department] ?? '#6b7280';
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
        {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
          <ReadinessBadge tier={item.tier} pct={item.readinessPct} />
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {item.department} · {item.targetLevel}
          {item.topGap && <> · gap: <span className="text-rose-500">{item.topGap}</span></>}
        </p>
      </div>
      <div className="text-[10px] text-gray-300 flex-shrink-0 text-right">
        <div>{item.location}</div>
        <div>{item.tenure}m tenure</div>
      </div>
    </div>
  );
}

export function ChurnCard({ item }: { item: PersonResult }) {
  const color = DEPT_COLORS[item.department] ?? '#6b7280';
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-100 hover:border-rose-200 transition-all">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
        {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
          <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">{item.tenure}m in role</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {item.department} · {item.readinessPct}% ready · {item.location}
        </p>
      </div>
      <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
    </div>
  );
}

// ── Skill gap ─────────────────────────────────────────────────────────

export function SkillGapRow({ item }: { item: SkillGapResult }) {
  const fillPct = Math.round((item.avgActual / item.expected) * 100);
  return (
    <div className="py-2 px-3 rounded-xl bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-800">{item.skill}</span>
        <span className="text-[11px] text-rose-500 font-bold">{item.belowTarget} below target</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-400 transition-all" style={{ width: `${Math.min(fillPct, 100)}%` }} />
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{item.avgActual} / {item.expected}</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">{item.department}</p>
    </div>
  );
}

// ── Dept summary ──────────────────────────────────────────────────────

export function DeptSummaryRow({ item }: { item: DeptSummaryResult }) {
  const color = DEPT_COLORS[item.department as keyof typeof DEPT_COLORS] ?? '#6b7280';
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white border border-gray-100">
      <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">{item.department}</span>
          <span className="text-xs font-bold text-gray-700">{item.avgReadiness}% avg</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-gray-400">{item.total} tracked</span>
          {item.nearReady > 0 && (
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
              {item.nearReady} near ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat cards ────────────────────────────────────────────────────────

export function StatCardGrid({ items }: { items: Array<{ label: string; value: string; note: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((c, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-black text-gray-900">{c.value}</p>
          <p className="text-[10px] font-semibold text-gray-500 mt-0.5">{c.label}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">{c.note}</p>
        </div>
      ))}
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  hire: { icon: <UserPlus size={12} />, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  upskill: { icon: <BookOpen size={12} />, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  restructure: { icon: <RefreshCw size={12} />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  retain: { icon: <Zap size={12} />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  monitor: { icon: <Eye size={12} />, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  reduce: { icon: <MinusCircle size={12} />, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

const URGENCY_CONFIG = {
  critical: { label: 'Critical', dot: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-50 border-red-200' },
  high:     { label: 'High Priority', dot: 'bg-orange-400', text: 'text-orange-700', badge: 'bg-orange-50 border-orange-200' },
  medium:   { label: 'Medium', dot: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
  low:      { label: 'Low', dot: 'bg-gray-300', text: 'text-gray-500', badge: 'bg-gray-50 border-gray-200' },
};

export function RecommendationCard({ item, onNavigate }: { item: RecommendationResult; onNavigate?: (target: ActionNavTarget) => void }) {
  const urgency = URGENCY_CONFIG[item.urgency];
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-800">{item.title}</span>
        <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${urgency.badge} ${urgency.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
          {urgency.label}
        </span>
      </div>
      <div className="px-4 py-2.5 border-b border-gray-50">
        <p className="text-xs text-gray-500 leading-relaxed">{item.context}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {item.actions.map((action, i) => {
          const cfg = ACTION_CONFIG[action.type];
          return (
            <div key={i} className="px-4 py-3 flex gap-3">
              <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className={`text-xs font-semibold ${cfg.color} leading-snug`}>{action.label}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{action.timeframe}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{action.detail}</p>
                {action.navTarget && onNavigate && (
                  <button
                    onClick={() => onNavigate(action.navTarget!)}
                    className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`}
                  >
                    <ExternalLink size={9} />
                    {action.navTarget.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scenario card ─────────────────────────────────────────────────────

const SCENARIO_RISK_CONFIG = {
  high:   { bar: 'bg-red-400', text: 'text-red-700', badge: 'bg-red-50 border-red-200' },
  medium: { bar: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
  low:    { bar: 'bg-emerald-400', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
};

export function ScenarioCard({ item }: { item: ScenarioResult }) {
  const risk = SCENARIO_RISK_CONFIG[item.risk];
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-800">{item.scenario}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${risk.badge} ${risk.text}`}>
          {item.risk.charAt(0).toUpperCase() + item.risk.slice(1)} Risk
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Current</p>
            <p className="text-xs text-gray-600 leading-relaxed">{item.current}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Projected</p>
            <p className={`text-xs ${risk.text} leading-relaxed font-medium`}>{item.projected}</p>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mitigations</p>
          <div className="space-y-1">
            {item.mitigations.map((m, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ArrowRight size={9} className="text-gray-300 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reduction analysis card ───────────────────────────────────────────

const CAPABILITY_RISK_CONFIG = {
  critical: { label: 'Critical Risk', bar: 'bg-red-500',     text: 'text-red-700',    badge: 'bg-red-50 border-red-200',       dot: 'bg-red-500' },
  high:     { label: 'High Risk',     bar: 'bg-orange-400',  text: 'text-orange-700', badge: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  medium:   { label: 'Medium Risk',   bar: 'bg-amber-400',   text: 'text-amber-700',  badge: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  low:      { label: 'Low Risk',      bar: 'bg-emerald-400', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400' },
};

function DeptImpactRow({ item }: { item: DeptReductionImpact }) {
  const cfg = CAPABILITY_RISK_CONFIG[item.capabilityRisk];
  const color = DEPT_COLORS[item.department] ?? '#6b7280';
  const remainingPct = Math.round(((item.currentHeadcount - item.targetReduction) / item.currentHeadcount) * 100);
  return (
    <div className="py-2.5 px-4 flex gap-3 items-start">
      <div className="w-1.5 min-h-[40px] rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-800">{item.department}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge} ${cfg.text} flex-shrink-0`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${cfg.bar} transition-all`} style={{ width: `${100 - remainingPct}%` }} />
          </div>
          <span className="text-[10px] text-gray-500 flex-shrink-0 font-medium">-{item.targetReduction} of {item.currentHeadcount}</span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {item.voluntaryLikely > 0 && <span className="text-[10px] text-emerald-600">{item.voluntaryLikely} likely voluntary</span>}
          {item.nearReadyLost > 0 && <span className="text-[10px] text-orange-600">{item.nearReadyLost} promotion-ready at risk</span>}
          {item.criticalSkillsAtRisk.length > 0 && <span className="text-[10px] text-red-500">gaps: {item.criticalSkillsAtRisk.join(', ')}</span>}
          {item.benchmarkDelta > 0.2 && <span className="text-[10px] text-gray-400">-{item.benchmarkDelta.toFixed(1)}pt vs peers</span>}
        </div>
      </div>
    </div>
  );
}

export function ReductionAnalysisCard({ analysis }: { analysis: ReductionAnalysis }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'process' | 'legal'>('overview');
  const absorbedByVoluntary = Math.min(analysis.voluntaryBuffer, analysis.reductionTarget);
  const absorbedPct = Math.round((absorbedByVoluntary / analysis.reductionTarget) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 bg-gray-900 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Scale size={13} className="text-gray-400" />
            <span className="text-sm font-bold text-white">Headcount Reduction Analysis</span>
          </div>
          <p className="text-xs text-gray-400">{analysis.reductionPct}% reduction · {analysis.reductionTarget} people from {analysis.totalHeadcount} total</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-black text-white">{analysis.reductionTarget}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">target</p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b border-gray-100">
        <div className="px-4 py-2.5 text-center border-r border-gray-100">
          <p className="text-lg font-black text-emerald-600">{analysis.voluntaryBuffer}</p>
          <p className="text-[9px] text-gray-400 leading-tight mt-0.5">may leave voluntarily</p>
        </div>
        <div className="px-4 py-2.5 text-center border-r border-gray-100">
          <p className="text-lg font-black text-orange-600">{analysis.netForcedReduction}</p>
          <p className="text-[9px] text-gray-400 leading-tight mt-0.5">forced if no alternatives</p>
        </div>
        <div className="px-4 py-2.5 text-center">
          <p className="text-lg font-black text-gray-700">{absorbedPct}%</p>
          <p className="text-[9px] text-gray-400 leading-tight mt-0.5">buffer via attrition</p>
        </div>
      </div>
      <div className="flex border-b border-gray-100">
        {(['overview', 'dept', 'process', 'legal'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab ? 'text-gray-900 border-b-2 border-gray-900 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab === 'overview' ? 'Alternatives' : tab === 'dept' ? 'By Dept' : tab === 'process' ? 'Process' : 'Legal'}
          </button>
        ))}
      </div>
      <div className="px-4 py-4">
        {activeTab === 'overview' && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Exhaust these before forcing redundancies</p>
            {analysis.alternativeSavings.map((alt, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">{alt}</p>
              </div>
            ))}
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex gap-2">
                <AlertCircle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  This tool does not recommend specific individuals for redundancy. Individual selection decisions must be made by HR and legal, using objective role-based criteria, and reviewed against protected characteristics data you hold separately.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'dept' && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Capability risk by department (proportional split)</p>
            <div className="divide-y divide-gray-50 -mx-4">
              {analysis.deptImpacts.map((item, i) => <DeptImpactRow key={i} item={item} />)}
            </div>
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <MinusCircle size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">Proportional splits are illustrative. Actual reduction targets per department should reflect role redundancy and strategic priorities, not uniform percentages.</p>
            </div>
          </div>
        )}
        {activeTab === 'process' && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Recommended process</p>
            {analysis.processSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-[10px] font-black text-gray-400 w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-600 leading-relaxed">{step.replace(/^Step \d+ — /, '')}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'legal' && (
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Legal obligations & flags</p>
            {analysis.legalFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle size={12} className={`flex-shrink-0 mt-0.5 ${i === 0 ? 'text-red-500' : 'text-amber-500'}`} />
                <p className="text-xs text-gray-600 leading-relaxed">{flag}</p>
              </div>
            ))}
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700 leading-relaxed font-medium">This is not legal advice. Always consult qualified employment counsel before beginning any reduction programme.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Clarification card ────────────────────────────────────────────────

export function ClarificationCard({ data, onChipClick }: { data: ClarificationResult; onChipClick: (text: string) => void }) {
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function pick(qIdx: number, chip: string) {
    if (submitted) return;
    const next = { ...answered };
    if (next[qIdx] === chip) { delete next[qIdx]; setAnswered(next); return; }
    next[qIdx] = chip;
    setAnswered(next);
    if (Object.keys(next).length === data.questions.length) {
      setSubmitted(true);
      let composed: string;
      if (data.composeKey === 'careerminds') {
        composed = [
          next[0] ? `Challenge: ${next[0]}` : '',
          next[1] ? `Scale: ${next[1]}` : '',
          next[2] ? `Timeline: ${next[2]}` : '',
        ].filter(Boolean).join(', ');
        setTimeout(() => onChipClick(`Careerminds support — ${composed}`), 150);
      } else {
        composed = [
          next[0] ? `Savings target: ${next[0]}` : '',
          next[1] && next[1] !== 'Not sure yet — explore options' ? `Target reduction: ${next[1]}` : 'Target reduction: explore options',
          next[2] ? `Timeline: ${next[2]}` : '',
        ].filter(Boolean).join(', ');
        setTimeout(() => onChipClick(`Headcount reduction plan — ${composed}`), 150);
      }
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mt-1">
      <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
        <p className="text-sm text-gray-700 leading-relaxed">{data.intro}</p>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 border border-sky-100">
          <Eye size={12} className="text-sky-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-sky-700 leading-relaxed font-medium">{data.reasoning}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {data.questions.map((q, qIdx) => {
          const picked = answered[qIdx];
          return (
            <div key={qIdx} className={`px-4 py-3 transition-colors ${picked ? 'bg-gray-50/60' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  <span className="text-gray-400 mr-1">{qIdx + 1}.</span>{q.question}
                </p>
                {picked && !submitted && (
                  <button onClick={() => pick(qIdx, picked)} className="text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors flex-shrink-0 ml-2">change</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {q.chips.map(chip => (
                  <button key={chip} onClick={() => pick(qIdx, chip)} disabled={submitted}
                    className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                      submitted
                        ? picked === chip ? 'bg-gray-900 text-white border-gray-900 opacity-60' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : picked === chip ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                    }`}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {submitted && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Running analysis based on your answers...</p>
        </div>
      )}
    </div>
  );
}

// ── Decision frame card ───────────────────────────────────────────────

const DECISION_ICON_MAP: Record<DecisionFrame['options'][0]['icon'], React.ReactNode> = {
  upskill: <BookOpen size={14} />,
  hire: <UserPlus size={14} />,
  move: <MoveRight size={14} />,
  monitor: <Eye size={14} />,
  retain: <CircleDot size={14} />,
  restructure: <RefreshCw size={14} />,
};

const DECISION_ACCENT: Record<DecisionFrame['options'][0]['accent'], { border: string; bg: string; text: string; hoverBorder: string; hoverBg: string; badge: string }> = {
  sky:     { border: 'border-sky-100',     bg: 'bg-sky-50/60',     text: 'text-sky-700',     hoverBorder: 'hover:border-sky-300',     hoverBg: 'hover:bg-sky-50',     badge: 'bg-sky-100 text-sky-700' },
  emerald: { border: 'border-emerald-100', bg: 'bg-emerald-50/60', text: 'text-emerald-700', hoverBorder: 'hover:border-emerald-300', hoverBg: 'hover:bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  amber:   { border: 'border-amber-100',   bg: 'bg-amber-50/60',   text: 'text-amber-700',   hoverBorder: 'hover:border-amber-300',   hoverBg: 'hover:bg-amber-50',   badge: 'bg-amber-100 text-amber-700' },
  rose:    { border: 'border-rose-100',    bg: 'bg-rose-50/60',    text: 'text-rose-700',    hoverBorder: 'hover:border-rose-300',    hoverBg: 'hover:bg-rose-50',    badge: 'bg-rose-100 text-rose-700' },
  teal:    { border: 'border-teal-100',    bg: 'bg-teal-50/60',    text: 'text-teal-700',    hoverBorder: 'hover:border-teal-300',    hoverBg: 'hover:bg-teal-50',    badge: 'bg-teal-100 text-teal-700' },
};

function DecisionFrameCard({ frame, onSend }: { frame: DecisionFrame; onSend?: (text: string) => void }) {
  const [chosen, setChosen] = useState<string | null>(null);

  function choose(opt: DecisionFrame['options'][0]) {
    if (chosen) return;
    setChosen(opt.id);
    onSend?.(opt.prompt);
  }

  return (
    <div className="mt-1 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap size={11} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Decision point</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{frame.situation}</p>
          <p className="text-xs text-gray-500 mt-0.5">{frame.question}</p>
        </div>
      </div>
      <div className="p-3 grid grid-cols-1 gap-2">
        {frame.options.map(opt => {
          const ac = DECISION_ACCENT[opt.accent];
          const isChosen = chosen === opt.id;
          const isDisabled = chosen !== null && !isChosen;
          return (
            <button
              key={opt.id}
              onClick={() => choose(opt)}
              disabled={!!chosen}
              className={`group relative w-full text-left rounded-xl border px-3.5 py-3 transition-all flex items-center gap-3 ${
                isChosen
                  ? `${ac.border} ${ac.bg} ring-1 ring-offset-0 ring-current ${ac.text}`
                  : isDisabled
                  ? 'border-gray-100 bg-gray-50/60 opacity-40 cursor-not-allowed'
                  : `border-gray-150 bg-white ${ac.hoverBorder} ${ac.hoverBg} cursor-pointer`
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isChosen ? `${ac.badge}` : `bg-gray-100 text-gray-500 group-hover:${ac.badge}`
              }`}>
                {isChosen ? <Check size={13} /> : DECISION_ICON_MAP[opt.icon]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug ${isChosen ? ac.text : 'text-gray-800'}`}>{opt.label}</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5 truncate">{opt.description}</p>
              </div>
              {!chosen && <ChevronRight size={14} className="text-gray-300 flex-shrink-0 group-hover:text-gray-500 transition-colors" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Commitment capture card ───────────────────────────────────────────

function CommitmentCaptureCard({ data }: { data: CommitmentPrompt }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function save() {
    if (!text.trim() || status !== 'idle') return;
    setStatus('saving');
    await supabase.from('commitments').insert({
      text: text.trim(),
      context: data.insightSummary,
      insight_kind: data.insightKind,
      department: data.department ?? null,
      source_query: data.sourceQuery ?? null,
      status: 'open',
    });
    setStatus('saved');
  }

  return (
    <div className="mt-1 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Pencil size={10} className="text-white" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">What will you do about this?</p>
          <p className="text-xs text-gray-500 mt-0.5">{data.insightSummary}</p>
        </div>
      </div>
      <div className="p-3">
        {status === 'saved' ? (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">Commitment logged — you'll see it in your Decisions journal.</p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
              placeholder="e.g. Schedule promotion reviews for the 4 near-ready people in Engineering this week"
              rows={2}
              className="flex-1 text-sm text-gray-800 placeholder:text-gray-300 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-emerald-300 focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all leading-relaxed"
            />
            <button
              onClick={save}
              disabled={!text.trim() || status === 'saving'}
              className="flex-shrink-0 h-10 px-3.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-400 transition-all flex items-center gap-1.5"
            >
              {status === 'saving' ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
              Log it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Partner recommendation card ───────────────────────────────────────

const PARTNER_SERVICE_CONFIG: Record<PartnerRecommendation['service'], { accent: string; border: string; bg: string; badgeBg: string; badgeText: string; icon: React.ReactNode }> = {
  'outplacement':       { accent: 'text-rose-700',    border: 'border-rose-200',    bg: 'bg-rose-50',    badgeBg: 'bg-rose-100',    badgeText: 'text-rose-700',    icon: <ArrowRight size={14} /> },
  'talent-development': { accent: 'text-teal-700',    border: 'border-teal-200',    bg: 'bg-teal-50',    badgeBg: 'bg-teal-100',    badgeText: 'text-teal-700',    icon: <BookOpen size={14} /> },
  'leadership-dev':     { accent: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', icon: <TrendingUp size={14} /> },
  'manager-coaching':   { accent: 'text-sky-700',     border: 'border-sky-200',     bg: 'bg-sky-50',     badgeBg: 'bg-sky-100',     badgeText: 'text-sky-700',     icon: <Users size={14} /> },
  'comp-review':        { accent: 'text-amber-700',   border: 'border-amber-200',   bg: 'bg-amber-50',   badgeBg: 'bg-amber-100',   badgeText: 'text-amber-700',   icon: <Sparkles size={14} /> },
};

function PartnerRecommendationCard({ data }: { data: PartnerRecommendation }) {
  const cfg = PARTNER_SERVICE_CONFIG[data.service];
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.badgeBg} ${cfg.accent}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} uppercase tracking-wider`}>
                <Sparkles size={9} />
                {data.provider}
              </span>
            </div>
            <p className={`text-sm font-bold leading-snug ${cfg.accent} mb-1.5`}>{data.headline}</p>
            <div className={`mb-3 flex items-start gap-1.5 px-3 py-2 rounded-lg border ${cfg.border} bg-white/60`}>
              <Zap size={10} className={`${cfg.accent} mt-0.5 flex-shrink-0`} />
              <p className={`text-[11px] font-medium leading-relaxed ${cfg.accent}`}>{data.why}</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{data.body}</p>
            <button className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full ${cfg.badgeBg} ${cfg.accent} border ${cfg.border} hover:opacity-80 transition-opacity`}>
              <ExternalLink size={10} />
              {data.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline upsell strip ───────────────────────────────────────────────

type InlineUpsellVariant = 'outplacement' | 'talent-development' | 'leadership-dev' | 'manager-coaching';

interface InlineUpsellConfig {
  provider: string;
  headline: string;
  cta: string;
  accent: string;
  iconBg: string;
  icon: React.ReactNode;
}

const INLINE_UPSELL_CONFIGS: Record<InlineUpsellVariant, InlineUpsellConfig> = {
  'outplacement': {
    provider: 'Careerminds',
    headline: 'Need support managing this transition? Careerminds places 95% of affected employees.',
    cta: 'Learn about Outplacement',
    accent: 'text-rose-700',
    iconBg: 'bg-rose-50 border-rose-200',
    icon: <ArrowRight size={11} />,
  },
  'talent-development': {
    provider: 'Careerminds',
    headline: 'Want to close these gaps faster? Careerminds builds role-specific learning tracks aligned to your framework.',
    cta: 'Explore Talent Development',
    accent: 'text-teal-700',
    iconBg: 'bg-teal-50 border-teal-200',
    icon: <BookOpen size={11} />,
  },
  'leadership-dev': {
    provider: 'Keystone Partners',
    headline: 'Ready to accelerate your bench? Keystone provides 1:1 coaching tailored to each candidate\'s readiness profile.',
    cta: 'Explore Leadership Development',
    accent: 'text-emerald-700',
    iconBg: 'bg-emerald-50 border-emerald-200',
    icon: <TrendingUp size={11} />,
  },
  'manager-coaching': {
    provider: 'Keystone Partners',
    headline: 'Struggling manager? Keystone\'s coaching programme improves team velocity and reduces attrition.',
    cta: 'Explore Manager Coaching',
    accent: 'text-sky-700',
    iconBg: 'bg-sky-50 border-sky-200',
    icon: <Users size={11} />,
  },
};

function InlineUpsell({ variant }: { variant: InlineUpsellVariant }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const cfg = INLINE_UPSELL_CONFIGS[variant];
  return (
    <div className={`mt-3 flex items-start gap-3 px-3.5 py-3 rounded-xl border bg-white group`} style={{ borderColor: 'rgb(229 231 235)' }}>
      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconBg} ${cfg.accent}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Need support? — {cfg.provider}</p>
        <p className="text-xs text-gray-600 leading-relaxed">{cfg.headline}</p>
        <button className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${cfg.accent} hover:underline underline-offset-2 transition-colors`}>
          <ExternalLink size={9} />
          {cfg.cta}
        </button>
      </div>
      <button onClick={() => setDismissed(true)} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors">
        <X size={11} />
      </button>
    </div>
  );
}

// ── Role fit card ──────────────────────────────────────────────────────

function RoleFitCard({ result }: { result: CrossDeptFitResult }) {
  const [expanded, setExpanded] = useState(false);
  const currentColor = PROMO_DEPT_COLORS[result.currentDept] ?? '#6b7280';
  const suggestedColor = PROMO_DEPT_COLORS[result.suggestedDept] ?? '#6b7280';
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: currentColor }}>
            {result.person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{result.person.name}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: currentColor, background: `${currentColor}18` }}>{result.currentDept}</span>
              <ArrowRight size={10} className="text-gray-300" />
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: suggestedColor, background: `${suggestedColor}18` }}>{result.suggestedDept}</span>
              <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">+{result.delta}%</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              {result.currentReadinessPct}% fit in {result.currentDept} → {result.fitPct}% fit in {result.suggestedDept} · {result.matchedCriteria}/{result.totalCriteria} criteria met
            </p>
            {result.topInferredSignals[0] && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <Linkedin size={10} className="text-[#0A66C2] mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-400 leading-relaxed">{result.topInferredSignals[0].source}</p>
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0">
            <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
        {expanded && result.linkedInSignals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
            {result.linkedInSignals.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#0A66C2] flex-shrink-0" />
                <span className="text-[10px] text-gray-500">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Results block — renders any QueryResult[] ─────────────────────────

function pickUpsell(results: QueryResult[]): InlineUpsellVariant | null {
  if (results.some(r => r.kind === 'partner-recommendation')) return null;
  for (const r of results) {
    if (r.kind === 'reduction') return 'outplacement';
    if (r.kind === 'churn-risk-list' && r.items.length >= 3) return 'outplacement';
    if (r.kind === 'labeled-people' && r.isChurn && r.items.length >= 3) return 'outplacement';
    if (r.kind === 'skill-gap-list' && r.items.length >= 3) return 'talent-development';
    if (r.kind === 'scenario' && r.items.some(s => s.risk === 'high')) return 'outplacement';
    if (r.kind === 'recommendation') {
      const hasRestructure = r.items.some(rec =>
        rec.actions.some(a => a.type === 'restructure') &&
        (rec.urgency === 'critical' || rec.urgency === 'high')
      );
      if (hasRestructure) return 'outplacement';
      const hasUpskill = r.items.some(rec => rec.actions.some(a => a.type === 'upskill'));
      if (hasUpskill) return 'talent-development';
    }
  }
  return null;
}

export function ResultsBlock({ results, onSend, onNavigate, wide }: { results: QueryResult[]; onSend?: (text: string) => void; onNavigate?: (target: ActionNavTarget) => void; wide?: boolean }) {
  const upsellVariant = pickUpsell(results);
  return (
    <div className={`mt-3 space-y-3 ${wide ? 'grid grid-cols-1 gap-3' : ''}`}>
      {results.map((r, i) => {
        if (r.kind === 'person-list' || r.kind === 'churn-risk-list') {
          const isChurn = r.kind === 'churn-risk-list';
          return (
            <div key={i} className={wide ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
              {r.items.map((item, j) =>
                isChurn ? <ChurnCard key={j} item={item} /> : <PersonCard key={j} item={item} />
              )}
            </div>
          );
        }
        if (r.kind === 'skill-gap-list') {
          return (
            <div key={i} className={wide ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
              {r.items.map((item, j) => <SkillGapRow key={j} item={item} />)}
            </div>
          );
        }
        if (r.kind === 'dept-summary') {
          return (
            <div key={i} className={wide ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
              {r.items.map((item, j) => <DeptSummaryRow key={j} item={item} />)}
            </div>
          );
        }
        if (r.kind === 'stat-cards') return <StatCardGrid key={i} items={r.items} />;
        if (r.kind === 'recommendation') {
          return (
            <div key={i} className={wide ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
              {r.items.map((item, j) => <RecommendationCard key={j} item={item} onNavigate={onNavigate} />)}
            </div>
          );
        }
        if (r.kind === 'scenario') {
          return (
            <div key={i} className={wide ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
              {r.items.map((item, j) => <ScenarioCard key={j} item={item} />)}
            </div>
          );
        }
        if (r.kind === 'reduction') return <ReductionAnalysisCard key={i} analysis={r.analysis} />;
        if (r.kind === 'clarification') return <ClarificationCard key={i} data={r.data} onChipClick={onSend ?? (() => {})} />;
        if (r.kind === 'decision') return <DecisionFrameCard key={i} frame={r.frame} onSend={onSend} />;
        if (r.kind === 'commitment-prompt') return <CommitmentCaptureCard key={i} data={r.data} />;
        if (r.kind === 'partner-recommendation') return <PartnerRecommendationCard key={i} data={r.data} />;
        if (r.kind === 'role-fit-list') {
          return (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-sky-500" />
                <span className="text-xs font-semibold text-sky-700">Hidden Talent — LinkedIn-inferred</span>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 ml-auto">
                  <Info size={10} className="text-amber-500" />
                  <span className="text-[10px] text-amber-700 font-medium">For managers only</span>
                </div>
              </div>
              {r.items.map((item, j) => <RoleFitCard key={j} result={item} />)}
            </div>
          );
        }
        if (r.kind === 'labeled-people') {
          return (
            <div key={i}>
              <div className="flex items-start gap-2.5 mb-3 mt-1">
                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${r.isChurn ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <Users size={10} className={r.isChurn ? 'text-rose-500' : 'text-emerald-500'} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${r.isChurn ? 'text-rose-700' : 'text-emerald-700'}`}>{r.label}</p>
                  {r.subLabel && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{r.subLabel}</p>}
                </div>
              </div>
              <div className={wide ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'}>
                {r.items.map((item, j) =>
                  r.isChurn ? <ChurnCard key={j} item={item} /> : <PersonCard key={j} item={item} />
                )}
              </div>
            </div>
          );
        }
        return null;
      })}
      {upsellVariant && <InlineUpsell variant={upsellVariant} />}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────

export function MessageBubble({ msg, onSend, onNavigate, wide }: { msg: ChatMessage; onSend: (text: string) => void; onNavigate?: (target: ActionNavTarget) => void; wide?: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full`}>
      {isUser ? (
        <div className={`bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm ${wide ? 'max-w-2xl' : 'max-w-[85%]'}`}>
          {msg.text}
        </div>
      ) : (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Progression AI</span>
          </div>
          <div className={`text-sm text-gray-700 leading-relaxed ${wide ? 'pl-9' : 'pl-9'}`}>{msg.text}</div>
          {msg.results && msg.results.length > 0 && (
            <div className="pl-9">
              <ResultsBlock results={msg.results} onSend={onSend} onNavigate={onNavigate} wide={wide} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center flex-shrink-0">
        <Sparkles size={12} className="text-white" />
      </div>
      <div className="flex gap-1 px-3 py-2.5 bg-gray-100 rounded-2xl rounded-tl-sm">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}
