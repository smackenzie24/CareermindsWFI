import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AlertTriangle, CheckCircle2, TrendingUp, Users, BarChart3, Globe, Star, ArrowRight, Zap, Shield, Clock, CalendarX, Sparkles, SendHorizontal as SendHorizonal, RefreshCw, LogOut } from 'lucide-react';
import {
  computeExecSummaryAsync,
  type ExecSummary,
  type OrgRisk,
  type DeptHealthSnapshot,
  type NavTarget,
  type RiskLevel,
  type CheckInFlag,
} from '../data/execSummaryData';
import { QUARTILE_CONFIG } from '../data/benchmarkData';
import { FeedbackBanner } from './feedback/FeedbackBanner';
import { ExportButtons } from './ExportButtons';

interface Props {
  onNavigate: (target: NavTarget) => void;
  onAskAI: (initialQuestion?: string) => void;
}

const AI_SUGGESTIONS = [
  'Who is at risk of leaving?',
  'Where are our biggest skills gaps?',
  'Which teams need restructuring?',
  'Build a retention plan for churn risks',
  'How do we compare to industry?',
  'Who is ready for promotion?',
];

function AIPromptBar({ onAskAI }: { onAskAI: (q?: string) => void }) {
  const [input, setInput] = useState('');

  function submit(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    onAskAI(text);
    setInput('');
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm" data-tour="home-ai-hero">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-brand-blue-bg3 border border-brand-blue-bg2 flex items-center justify-center flex-shrink-0">
          <Sparkles size={13} className="text-brand-blue" />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-brand-blue focus-within:bg-white transition-all">
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue-text disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-all flex-shrink-0"
          >
            <SendHorizonal size={11} />
            Ask
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3 pl-10">
        {AI_SUGGESTIONS.slice(0, 4).map(q => (
          <button
            key={q}
            onClick={() => submit(q)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-brand-blue-bg3 hover:text-brand-blue hover:border-brand-blue-bg2 transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── KPI metric card types ──────────────────────────────────────────────────

interface KpiCardData {
  /** Top-left icon */
  icon: React.ReactNode;
  iconColor: string;
  /** Large prominent number/value */
  value: string;
  valueSuffix?: string;
  valueColor: string;
  /** Small label next to value */
  valueNote?: string;
  valueNoteColor?: string;
  /** Bottom label in caps */
  label: string;
  action: NavTarget;
}

function KpiCard({ card, onNavigate }: { card: KpiCardData; onNavigate: (t: NavTarget) => void }) {
  return (
    <button
      onClick={() => onNavigate(card.action)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-px transition-all text-left px-5 py-4 flex flex-col gap-3"
    >
      {/* Icon row */}
      <div className="flex items-center justify-between">
        <span className={card.iconColor}>{card.icon}</span>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1.5">
        <span className={`text-4xl font-black leading-none tracking-tight ${card.valueColor}`}>
          {card.value}
        </span>
        {card.valueSuffix && (
          <span className="text-sm font-semibold text-gray-400">{card.valueSuffix}</span>
        )}
        {card.valueNote && (
          <span className={`text-sm font-semibold ${card.valueNoteColor ?? 'text-gray-500'}`}>{card.valueNote}</span>
        )}
      </div>

      {/* Label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">
        {card.label}
      </p>
    </button>
  );
}

function buildKpiCards(
  summary: ExecSummary,
): KpiCardData[] {
  const totalFlagged = summary.overdueCheckIns + summary.criticalCheckIns;
  const healthColor =
    summary.orgHealthScore >= 75 ? 'text-emerald-600' :
    summary.orgHealthScore >= 55 ? 'text-amber-500' :
    summary.orgHealthScore >= 35 ? 'text-orange-500' : 'text-red-600';

  const gapColor = summary.peopleWithSkillGaps === 0 ? 'text-emerald-600' :
    summary.peopleWithSkillGaps <= 10 ? 'text-amber-500' : 'text-red-600';

  const readyColor = summary.totalNearReady >= 5 ? 'text-emerald-600' :
    summary.totalNearReady >= 2 ? 'text-amber-500' : 'text-orange-500';

  const stalledColor = summary.totalStalled === 0 ? 'text-gray-500' : 'text-gray-600';

  const mgrColor = summary.managersNeedingSupport === 0 ? 'text-emerald-600' :
    summary.managersNeedingSupport === 1 ? 'text-amber-500' : 'text-orange-500';

  const rankColor = summary.benchmarkRank === 1 ? 'text-emerald-600' :
    summary.benchmarkRank <= Math.ceil(summary.benchmarkTotal / 2) ? 'text-amber-500' : 'text-red-600';

  const attritionColor = summary.attritionScore.score >= 70 ? 'text-red-600' :
    summary.attritionScore.score >= 45 ? 'text-amber-500' :
    summary.attritionScore.score >= 25 ? 'text-brand-blue' : 'text-emerald-600';
  const attritionIconColor = summary.attritionScore.score >= 70 ? 'text-red-500' :
    summary.attritionScore.score >= 45 ? 'text-amber-500' :
    summary.attritionScore.score >= 25 ? 'text-brand-blue' : 'text-emerald-500';

  const checkInColor = totalFlagged === 0 ? 'text-emerald-600' :
    summary.criticalCheckIns > 0 ? 'text-red-600' : 'text-amber-500';

  return [
    {
      icon: <Shield size={20} />,
      iconColor: 'text-orange-500',
      value: String(summary.orgHealthScore),
      valueSuffix: '/100',
      valueColor: healthColor,
      label: 'Org Health',
      action: { view: 'heatmap' },
    },
    {
      icon: <AlertTriangle size={20} />,
      iconColor: 'text-red-500',
      value: String(summary.peopleWithSkillGaps),
      valueNote: 'people',
      valueNoteColor: 'text-gray-500',
      valueColor: gapColor,
      label: 'Below Expected Level',
      action: { view: 'heatmap' },
    },
    {
      icon: <TrendingUp size={20} />,
      iconColor: 'text-emerald-500',
      value: String(summary.totalNearReady),
      valueNote: 'ready',
      valueNoteColor: 'text-gray-500',
      valueColor: readyColor,
      label: 'Promotable Now',
      action: { view: 'pipeline' },
    },
    {
      icon: <CheckCircle2 size={20} />,
      iconColor: 'text-gray-400',
      value: String(summary.totalStalled),
      valueNote: 'stalled',
      valueNoteColor: 'text-gray-500',
      valueColor: stalledColor,
      label: 'Stalled 24M+',
      action: { view: 'pipeline' },
    },
    {
      icon: <Users size={20} />,
      iconColor: 'text-amber-500',
      value: String(summary.managersNeedingSupport),
      valueNote: 'flagged',
      valueNoteColor: 'text-gray-500',
      valueColor: mgrColor,
      label: 'Managers',
      action: { view: 'managers' },
    },
    {
      icon: <Globe size={20} />,
      iconColor: 'text-orange-500',
      value: ordinal(summary.benchmarkRank),
      valueNote: `of ${summary.benchmarkTotal}`,
      valueNoteColor: 'text-gray-500',
      valueColor: rankColor,
      label: 'Industry Rank',
      action: { view: 'benchmark' },
    },
    {
      icon: <LogOut size={20} />,
      iconColor: attritionIconColor,
      value: String(summary.attritionScore.score),
      valueSuffix: '/100',
      valueNote: summary.attritionScore.riskLabel,
      valueNoteColor: attritionColor,
      valueColor: attritionColor,
      label: 'Attrition Risk',
      action: { view: 'benchmark' },
    },
    {
      icon: <CalendarX size={20} />,
      iconColor: totalFlagged === 0 ? 'text-emerald-500' : summary.criticalCheckIns > 0 ? 'text-red-500' : 'text-amber-500',
      value: String(totalFlagged),
      valueSuffix: totalFlagged === 0 ? undefined : `/ ${summary.totalHeadcount}`,
      valueNote: totalFlagged === 0 ? 'all current' : undefined,
      valueNoteColor: 'text-gray-500',
      valueColor: checkInColor,
      label: 'No Check-In',
      action: { view: 'pipeline' },
    },
  ];
}

function ordinal(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function riskIcon(level: RiskLevel) {
  if (level === 'critical') return <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />;
  return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />;
}

function riskBg(level: RiskLevel) {
  if (level === 'critical') return 'bg-red-50 border-red-200';
  return 'bg-amber-50 border-amber-200';
}

function riskTitle(level: RiskLevel) {
  if (level === 'critical') return 'text-red-800';
  return 'text-amber-800';
}

function riskDetail(level: RiskLevel) {
  if (level === 'critical') return 'text-red-700';
  return 'text-amber-700';
}

function riskMetric(level: RiskLevel) {
  if (level === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function riskBtn(level: RiskLevel) {
  if (level === 'critical') return 'bg-red-600 hover:bg-red-700 text-white';
  return 'bg-amber-600 hover:bg-amber-700 text-white';
}

function riskBtnSecondary(level: RiskLevel) {
  if (level === 'critical') return 'text-red-600 hover:text-red-800 border-red-200 hover:border-red-300';
  return 'text-amber-600 hover:text-amber-800 border-amber-200 hover:border-amber-300';
}

function sourceIcon(source: string) {
  if (source === 'skills') return <BarChart3 size={10} />;
  if (source === 'pipeline') return <TrendingUp size={10} />;
  if (source === 'managers') return <Users size={10} />;
  if (source === 'benchmark') return <Globe size={10} />;
  return <Zap size={10} />;
}

function sourceLabel(source: string) {
  if (source === 'skills') return 'Skills Heatmap';
  if (source === 'pipeline') return 'Promotion Pipeline';
  if (source === 'managers') return 'Manager Effectiveness';
  if (source === 'benchmark') return 'Industry Benchmark';
  return source;
}


function RiskCard({ risk, onNavigate }: { risk: OrgRisk; onNavigate: (t: NavTarget) => void }) {
  return (
    <div className={`rounded-2xl border p-5 ${riskBg(risk.level)}`}>
      <div className="flex items-start gap-3 mb-3">
        {riskIcon(risk.level)}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-bold leading-snug ${riskTitle(risk.level)}`}>{risk.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${riskMetric(risk.level)}`}>
              {risk.metric}
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${riskDetail(risk.level)}`}>{risk.detail}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {riskIcon(risk.level)}
            <span className={`text-[10px] font-semibold flex items-center gap-1 ${risk.level === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
              {sourceIcon(risk.source)}{sourceLabel(risk.source)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(risk.action)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${riskBtn(risk.level)}`}
        >
          {risk.actionLabel}
          <ArrowRight size={11} />
        </button>
        {risk.secondaryAction && risk.secondaryLabel && (
          <button
            onClick={() => onNavigate(risk.secondaryAction!)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white/60 transition-colors ${riskBtnSecondary(risk.level)}`}
          >
            {risk.secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckInRow({ flag }: { flag: CheckInFlag }) {
  const isCritical = flag.severity === 'critical';
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isCritical ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-100' : 'bg-amber-100'}`}>
        <Clock size={13} className={isCritical ? 'text-red-600' : 'text-amber-600'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>{flag.person.name}</p>
        <p className={`text-[10px] ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>{flag.person.department} · {flag.person.team}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{flag.daysSinceCheckIn}d ago</p>
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>{isCritical ? 'Critical' : 'Overdue'}</p>
      </div>
    </div>
  );
}

function DeptRow({ snap, onNavigate }: { snap: DeptHealthSnapshot; onNavigate: (t: NavTarget) => void }) {
  const qCfg = QUARTILE_CONFIG[snap.benchmarkPosition];
  const scoreColor = snap.overallScore >= 70 ? 'text-emerald-600' : snap.overallScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const barColor = snap.overallScore >= 70 ? 'bg-emerald-500' : snap.overallScore >= 50 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <button
      onClick={() => onNavigate({ view: 'heatmap', department: snap.department as any })}
      className="w-full flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors group text-left"
    >
      {/* Dept indicator */}
      <div
        className="w-2 h-8 rounded-full flex-shrink-0"
        style={{ background: snap.color }}
      />
      <div className="w-28 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-800 group-hover:text-gray-900">{snap.department}</p>
        <p className={`text-[10px] font-bold ${scoreColor}`}>{snap.scoreLabel}</p>
      </div>

      {/* Score bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${snap.overallScore}%` }} />
          </div>
          <span className={`text-xs font-black w-7 text-right ${scoreColor}`}>{snap.overallScore}</span>
        </div>
      </div>

      {/* KPI pills */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-center w-14">
          <p className="text-[10px] text-gray-400">Skill avg</p>
          <p className="text-xs font-bold text-gray-700">{snap.skillCompetency}/5</p>
        </div>
        <div className="text-center w-14">
          <p className="text-[10px] text-gray-400">Near ready</p>
          <p className={`text-xs font-bold ${snap.nearReadyCount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{snap.nearReadyCount}</p>
        </div>
        <div className="text-center w-12">
          <p className="text-[10px] text-gray-400">Stalled</p>
          <p className={`text-xs font-bold ${snap.stalledCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{snap.stalledCount}</p>
        </div>
        <div className="text-center w-24">
          <p className="text-[10px] text-gray-400 mb-0.5">vs industry</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${qCfg.bg} ${qCfg.border} ${qCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${qCfg.dot}`} />
            {qCfg.label}
          </span>
        </div>
      </div>

      {/* Chevron affordance */}
      <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
    </button>
  );
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nextScheduledRun(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(23, 59, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ExecutiveSummary({ onNavigate, onAskAI }: Props) {
  const [summary, setSummary] = useState<ExecSummary | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [checkInsExpanded, setCheckInsExpanded] = useState(false);
  const CHECK_IN_PAGE_SIZE = 20;

  useEffect(() => {
    let cancelled = false;
    computeExecSummaryAsync().then(result => {
      if (!cancelled) setSummary(result);
    });
    return () => { cancelled = true; };
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    computeExecSummaryAsync().then(result => {
      setSummary(result);
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    });
  }, []);

  if (!summary) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-brand-blue animate-spin" />
        <p className="text-xs text-gray-400">Calculating workforce signals…</p>
      </div>
    );
  }

  function buildExportContent() {
    const s = summary!;
    const lines = [
      'PROGRESSION — WORKFORCE HEALTH DASHBOARD',
      `Generated: ${s.asOf}`,
      `Organisation: Acme Corp · ${s.totalHeadcount} employees`,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'KEY METRICS',
      '─────────────────────────────────────',
      `Org Health Score:       ${s.orgHealthScore}/100`,
      `Below Expected Level:   ${s.peopleWithSkillGaps} people`,
      `Promotable Now:         ${s.totalNearReady} near-ready`,
      `Stalled 24M+:           ${s.totalStalled}`,
      `Managers Needing Support: ${s.managersNeedingSupport}`,
      `Industry Rank:          ${ordinal(s.benchmarkRank)} of ${s.benchmarkTotal}`,
      `Check-in Coverage:      ${s.checkInCoverage}%`,
      '',
      'HIGHLIGHTS',
      '─────────────────────────────────────',
      ...s.wins.map(w => `  • ${w.title}: ${w.detail}`),
      '',
      'PRIORITY RISKS',
      '─────────────────────────────────────',
      ...(s.risks.length === 0
        ? ['  No critical risks detected']
        : s.risks.map(r => `  [${r.level.toUpperCase()}] ${r.title} — ${r.detail}`)),
      '',
      'DEPARTMENT HEALTH',
      '─────────────────────────────────────',
      ...s.deptSnapshots.map(d =>
        `  ${d.department.padEnd(14)} Score: ${d.overallScore}  Near-ready: ${d.nearReadyCount}  Stalled: ${d.stalledCount}`
      ),
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Generated by Progression Workforce Intelligence.',
    ];
    return lines.join('\n');
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Chief People Officer · Executive View</p>
            <h1 className="text-2xl font-bold text-gray-900">Workforce Health Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Organisation-wide signal digest · Click any insight to investigate further
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-gray-600">Acme Corp</span>
              <span className="text-gray-400">{summary.totalHeadcount} employees</span>
            </div>
            <ExportButtons title="Workforce Health Dashboard" buildContent={buildExportContent} />
          </div>
        </div>

        {/* Data freshness bar */}
        <div className="mt-4 flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-gray-400" />
              <span>Last updated:</span>
              <span className="font-semibold text-gray-700">{formatTimestamp(lastRefreshed)}</span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1.5 text-gray-400">
              <RefreshCw size={10} />
              <span>Next auto-refresh: <span className="font-medium text-gray-500">{nextScheduledRun()}</span> (nightly at 23:59)</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* ── AI prompt bar ─────────────────────────────────────────────── */}
          <AIPromptBar onAskAI={onAskAI} />

          {/* ── KPI metric strip ──────────────────────────────────────────── */}
          <div data-tour="home-kpi-strip">
            {/* Primary 4 — always visible */}
            <div className="grid grid-cols-4 gap-3">
              {buildKpiCards(summary).slice(0, 4).map(card => (
                <KpiCard key={card.label} card={card} onNavigate={onNavigate} />
              ))}
            </div>

            {/* Secondary 4 — revealed on expand */}
            {kpiExpanded && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {buildKpiCards(summary).slice(4).map(card => (
                  <KpiCard key={card.label} card={card} onNavigate={onNavigate} />
                ))}
              </div>
            )}

            <div className="flex justify-center mt-3">
              <button
                onClick={() => setKpiExpanded(e => !e)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors group"
              >
                {kpiExpanded
                  ? <><ChevronUp size={13} className="group-hover:text-gray-600" />Hide managers, rank, attrition &amp; check-ins</>
                  : <><ChevronDown size={13} className="group-hover:text-gray-600" />Show managers, rank, attrition &amp; check-ins</>
                }
              </button>
            </div>
          </div>

          {/* ── Main body: wins + risks ────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Wins + quick actions */}
            <div className="space-y-5" data-tour="home-highlights">
              {/* Wins */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={13} className="text-amber-400" />
                  Highlights to communicate upward
                </h3>
                <div className="space-y-3">
                  {summary.wins.map((win, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">{win.title}</p>
                        <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">{win.detail}</p>
                        <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                          {sourceIcon(win.source)}{sourceLabel(win.source)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Risks */}
            <div className="space-y-4" data-tour="home-risks">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={14} className="text-red-500" />
                  Priority risks requiring attention
                </h2>
                <span className="text-xs text-gray-400">{summary.risks.length} active signal{summary.risks.length !== 1 ? 's' : ''}</span>
              </div>

              {summary.risks.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                  <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-emerald-800">No critical risks detected</p>
                  <p className="text-xs text-emerald-600 mt-1">All org dimensions are performing at or above benchmark</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.risks.map(risk => (
                    <RiskCard key={risk.id} risk={risk} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Check-in coverage ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="home-checkins">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CalendarX size={14} className={summary.criticalCheckIns > 0 ? 'text-red-500' : summary.overdueCheckIns > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                  Check-in coverage
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {summary.checkInCoverage}% of employees have checked in within the last 30 days
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                {summary.criticalCheckIns > 0 && (
                  <span className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    {summary.criticalCheckIns} critical (90d+)
                  </span>
                )}
                {summary.overdueCheckIns > 0 && (
                  <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    {summary.overdueCheckIns} overdue (30–90d)
                  </span>
                )}
                {summary.flaggedCheckIns.length === 0 && (
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    All up to date
                  </span>
                )}
              </div>
            </div>

            {/* Coverage bar */}
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${summary.checkInCoverage}%` }}
                  />
                  {summary.overdueCheckIns > 0 && (
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${Math.round((summary.overdueCheckIns / summary.totalHeadcount) * 100)}%` }}
                    />
                  )}
                  {summary.criticalCheckIns > 0 && (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${Math.round((summary.criticalCheckIns / summary.totalHeadcount) * 100)}%` }}
                    />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-600 w-10 text-right">{summary.checkInCoverage}%</span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Current ({summary.totalHeadcount - summary.overdueCheckIns - summary.criticalCheckIns})</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Overdue ({summary.overdueCheckIns})</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Critical ({summary.criticalCheckIns})</span>
              </div>
            </div>

            {summary.flaggedCheckIns.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Everyone has checked in within the last 30 days.</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  {summary.flaggedCheckIns.length} people need follow-up — sorted by days overdue
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(checkInsExpanded
                    ? summary.flaggedCheckIns
                    : summary.flaggedCheckIns.slice(0, CHECK_IN_PAGE_SIZE)
                  ).map(flag => (
                    <CheckInRow key={flag.person.id} flag={flag} />
                  ))}
                </div>
                {summary.flaggedCheckIns.length > CHECK_IN_PAGE_SIZE && (
                  <button
                    onClick={() => setCheckInsExpanded(e => !e)}
                    className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 py-2 border border-gray-100 rounded-xl hover:border-gray-200 transition-all"
                  >
                    {checkInsExpanded
                      ? 'Show fewer'
                      : `Show all ${summary.flaggedCheckIns.length} overdue check-ins`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Dept health table ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="home-dept-table">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-gray-900">Department health at a glance</h2>
              <div className="flex items-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Strong (≥70)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Moderate (50–69)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />At Risk (&lt;50)</span>
              </div>
            </div>
            <div>
              {summary.deptSnapshots.map(snap => (
                <DeptRow key={snap.department} snap={snap} onNavigate={onNavigate} />
              ))}
            </div>
          </div>

          <FeedbackBanner context="Executive Summary" className="mt-6" />
        </div>
      </main>
    </div>
  );
}
