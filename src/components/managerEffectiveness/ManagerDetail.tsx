import { useMemo, useState } from 'react';
import {
  ArrowLeft, Users, TrendingUp, TrendingDown, AlertTriangle, Star,
  Clock, MapPin, CheckCircle2, XCircle, ChevronRight, Minus, ExternalLink,
  ClipboardList, ChevronDown, MessageSquare, CalendarDays, Sparkles,
  BarChart3, BookOpen, Megaphone, Handshake, Target, Brain,
} from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { type ManagerMetrics } from '../../data/managerData';
import { DEPT_COLORS, type Department } from '../../data/mockData';
import { getReadinessTier, TIER_CONFIG, type ReadinessResult } from '../../data/promotionData';

function effectivenessScore(m: ManagerMetrics): number {
  const stallPenalty = m.reports.length > 0 ? (m.stalledCount / m.reports.length) * 100 : 0;
  return Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - stallPenalty) * 0.3);
}

function scoreColor(score: number) {
  if (score >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', bar: 'bg-emerald-500' };
  if (score >= 55) return { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', bar: 'bg-sky-500' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', bar: 'bg-amber-400' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', bar: 'bg-red-400' };
}

function scoreLabel(score: number) {
  if (score >= 75) return 'High Impact';
  if (score >= 55) return 'Effective';
  if (score >= 40) return 'Developing';
  return 'Needs Support';
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' }) {
  if (trend === 'up') return <TrendingUp size={13} className="text-emerald-500" />;
  if (trend === 'down') return <TrendingDown size={13} className="text-red-400" />;
  return <Minus size={13} className="text-gray-400" />;
}

function ReportRow({ result }: { result: ReadinessResult }) {
  const tier = getReadinessTier(result.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = result.person.name.split(' ').map(n => n[0]).join('');
  const nextTitle = result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel;
  const isStalled = result.person.tenure > 24 && result.readinessPct < 50;

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-800 truncate">{result.person.name}</p>
          {isStalled && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">Stalled</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{result.person.team}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={8} />{result.person.location}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} />{result.person.tenure}m</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-2 justify-end mb-1">
          <span className="text-[10px] text-gray-500">→ {nextTitle}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <div className="w-20 bg-white/70 rounded-full h-1.5 overflow-hidden border border-black/5">
            <div className={`h-full rounded-full ${cfg.barColor}`} style={{ width: `${result.readinessPct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-600">{result.readinessPct}%</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">{result.criteriaMet}/{result.criteriaTotal} criteria</p>
      </div>
    </div>
  );
}

// ── Manager skill competency framework ───────────────────────────────────

interface SkillDimension {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  selfScore: number;    // 1–5 from last self-assessment
  reportScore: number;  // 1–5 avg from direct report ratings
  peerScore: number;    // 1–5 avg from peer 360
  targetScore: number;  // expected for this level
}

// Static mock: two profiles so different managers feel distinct
const SKILL_PROFILES: Record<string, SkillDimension[]> = {
  default: [
    { id: 'coaching',    category: 'People',    name: 'Coaching & Development',  description: 'Gives structured, actionable feedback; actively develops reports toward their next level', icon: <BookOpen size={13} />,  selfScore: 4, reportScore: 3.8, peerScore: 4.0, targetScore: 4 },
    { id: 'delegation',  category: 'People',    name: 'Delegation & Trust',       description: 'Distributes ownership effectively; avoids micromanagement while maintaining accountability',  icon: <Handshake size={13} />, selfScore: 3, reportScore: 3.2, peerScore: 3.5, targetScore: 4 },
    { id: 'comms',       category: 'People',    name: 'Clear Communication',      description: 'Communicates expectations, decisions, and context with clarity; reduces ambiguity',           icon: <Megaphone size={13} />, selfScore: 4, reportScore: 4.1, peerScore: 3.9, targetScore: 4 },
    { id: 'strategy',    category: 'Strategic', name: 'Strategic Thinking',       description: 'Connects team work to company goals; anticipates and plans for change',                        icon: <Brain size={13} />,     selfScore: 3, reportScore: 2.9, peerScore: 3.2, targetScore: 4 },
    { id: 'prioritise',  category: 'Strategic', name: 'Prioritisation',           description: 'Keeps team focused on highest-leverage work; manages scope and re-plans under pressure',        icon: <Target size={13} />,    selfScore: 4, reportScore: 3.6, peerScore: 3.7, targetScore: 4 },
    { id: 'xfn',         category: 'Strategic', name: 'Cross-functional Influence','description': 'Builds alignment across departments; advocates effectively for the team',                    icon: <Users size={13} />,     selfScore: 3, reportScore: 3.0, peerScore: 3.4, targetScore: 4 },
    { id: 'delivery',    category: 'Execution', name: 'Delivery Reliability',     description: 'Team consistently ships to quality and timeline; proactively flags risks',                     icon: <CheckCircle2 size={13} />, selfScore: 4, reportScore: 4.2, peerScore: 4.1, targetScore: 4 },
    { id: 'metrics',     category: 'Execution', name: 'Data-driven Decisions',    description: 'Uses metrics to inform priorities, retrospectives, and team health conversations',             icon: <BarChart3 size={13} />,  selfScore: 3, reportScore: 3.3, peerScore: 3.5, targetScore: 4 },
  ],
  strong: [
    { id: 'coaching',    category: 'People',    name: 'Coaching & Development',  description: 'Gives structured, actionable feedback; actively develops reports toward their next level', icon: <BookOpen size={13} />,  selfScore: 5, reportScore: 4.6, peerScore: 4.5, targetScore: 4 },
    { id: 'delegation',  category: 'People',    name: 'Delegation & Trust',       description: 'Distributes ownership effectively; avoids micromanagement while maintaining accountability',  icon: <Handshake size={13} />, selfScore: 4, reportScore: 4.3, peerScore: 4.2, targetScore: 4 },
    { id: 'comms',       category: 'People',    name: 'Clear Communication',      description: 'Communicates expectations, decisions, and context with clarity; reduces ambiguity',           icon: <Megaphone size={13} />, selfScore: 5, reportScore: 4.5, peerScore: 4.4, targetScore: 4 },
    { id: 'strategy',    category: 'Strategic', name: 'Strategic Thinking',       description: 'Connects team work to company goals; anticipates and plans for change',                        icon: <Brain size={13} />,     selfScore: 4, reportScore: 3.8, peerScore: 4.0, targetScore: 4 },
    { id: 'prioritise',  category: 'Strategic', name: 'Prioritisation',           description: 'Keeps team focused on highest-leverage work; manages scope and re-plans under pressure',        icon: <Target size={13} />,    selfScore: 5, reportScore: 4.4, peerScore: 4.3, targetScore: 4 },
    { id: 'xfn',         category: 'Strategic', name: 'Cross-functional Influence','description': 'Builds alignment across departments; advocates effectively for the team',                    icon: <Users size={13} />,     selfScore: 4, reportScore: 3.9, peerScore: 4.1, targetScore: 4 },
    { id: 'delivery',    category: 'Execution', name: 'Delivery Reliability',     description: 'Team consistently ships to quality and timeline; proactively flags risks',                     icon: <CheckCircle2 size={13} />, selfScore: 5, reportScore: 4.7, peerScore: 4.6, targetScore: 4 },
    { id: 'metrics',     category: 'Execution', name: 'Data-driven Decisions',    description: 'Uses metrics to inform priorities, retrospectives, and team health conversations',             icon: <BarChart3 size={13} />,  selfScore: 4, reportScore: 4.2, peerScore: 4.0, targetScore: 4 },
  ],
};

function getSkillProfile(managerId: string): SkillDimension[] {
  const strongIds = ['mgr-e1', 'mgr-p1', 'mgr-da1', 'mgr-hr1'];
  return strongIds.includes(managerId) ? SKILL_PROFILES.strong : SKILL_PROFILES.default;
}

// ── Check-in history (static mock) ───────────────────────────────────────

interface CheckIn {
  date: string;
  cycle: string;
  selfAvg: number;
  reportAvg: number;
  peerAvg: number;
  topStrength: string;
  topGap: string;
  status: 'complete' | 'in-progress' | 'overdue' | 'scheduled';
}

const CHECK_IN_HISTORY: CheckIn[] = [
  { date: '2026-03-15', cycle: 'Q1 2026', selfAvg: 3.6, reportAvg: 3.5, peerAvg: 3.7, topStrength: 'Delivery Reliability', topGap: 'Strategic Thinking', status: 'complete' },
  { date: '2025-12-10', cycle: 'Q4 2025', selfAvg: 3.4, reportAvg: 3.3, peerAvg: 3.5, topStrength: 'Clear Communication', topGap: 'Delegation & Trust', status: 'complete' },
  { date: '2025-09-08', cycle: 'Q3 2025', selfAvg: 3.2, reportAvg: 3.1, peerAvg: 3.3, topStrength: 'Clear Communication', topGap: 'Strategic Thinking', status: 'complete' },
];

const NEXT_CHECK_IN = { cycle: 'Q2 2026', due: '2026-06-20', status: 'scheduled' as const };

// ── Score dot ─────────────────────────────────────────────────────────────

function ScoreDot({ score, target }: { score: number; target: number }) {
  const atTarget = score >= target;
  const close    = score >= target - 0.5;
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 inline-block ${
        atTarget ? 'bg-emerald-400' : close ? 'bg-amber-400' : 'bg-red-400'
      }`}
    />
  );
}

// ── Skill assessment section ──────────────────────────────────────────────

function SkillAssessmentSection({ managerId, deptColor }: { managerId: string; deptColor: string }) {
  const dims = getSkillProfile(managerId);
  const categories = Array.from(new Set(dims.map(d => d.category)));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ratingView, setRatingView] = useState<'self' | 'reports' | 'peer'>('reports');

  const avgSelf    = +(dims.reduce((s, d) => s + d.selfScore, 0) / dims.length).toFixed(1);
  const avgReports = +(dims.reduce((s, d) => s + d.reportScore, 0) / dims.length).toFixed(1);
  const avgPeer    = +(dims.reduce((s, d) => s + d.peerScore, 0) / dims.length).toFixed(1);
  const atTarget   = dims.filter(d => d.reportScore >= d.targetScore).length;
  const gaps       = dims.filter(d => d.reportScore < d.targetScore - 0.3);

  const activeScore = (d: SkillDimension) =>
    ratingView === 'self' ? d.selfScore : ratingView === 'reports' ? d.reportScore : d.peerScore;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Manager Skill Assessment</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-full">Q1 2026</span>
            </div>
            <p className="text-xs text-gray-400">
              Three-source rating: self, direct-report (360), and peer. Target is 4.0 across all dimensions for this level.
            </p>
          </div>

          {/* Summary scores */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {([
              { label: 'Self',    val: avgSelf,    key: 'self'    },
              { label: 'Reports', val: avgReports, key: 'reports' },
              { label: 'Peers',   val: avgPeer,    key: 'peer'    },
            ] as { label: string; val: number; key: typeof ratingView }[]).map(s => (
              <button
                key={s.key}
                onClick={() => setRatingView(s.key)}
                className={`text-center px-3 py-1.5 rounded-xl border transition-all ${
                  ratingView === s.key
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <p className={`text-base font-black leading-none ${ratingView === s.key ? 'text-white' : 'text-gray-800'}`}>{s.val}</p>
                <p className={`text-[9px] font-semibold mt-0.5 ${ratingView === s.key ? 'text-gray-300' : 'text-gray-400'}`}>{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* At-target summary */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-xs text-gray-600 font-medium">{atTarget} of {dims.length} dimensions at target</span>
          </div>
          {gaps.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-500" />
              <span className="text-xs text-gray-600 font-medium">{gaps.length} dimension{gaps.length !== 1 ? 's' : ''} below target</span>
              <span className="text-xs text-gray-400">({gaps.map(g => g.name).join(', ')})</span>
            </div>
          )}
          <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
            <CalendarDays size={10} />
            Last assessed: 15 Mar 2026
          </span>
        </div>
      </div>

      {/* Dimension list by category */}
      <div className="divide-y divide-gray-50">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-6 py-2 bg-gray-50/60">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{cat}</span>
            </div>
            {dims.filter(d => d.category === cat).map(dim => {
              const score    = activeScore(dim);
              const atTarget = score >= dim.targetScore;
              const close    = score >= dim.targetScore - 0.5;
              const pct      = (score / 5) * 100;
              const barColor = atTarget ? 'bg-emerald-400' : close ? 'bg-amber-400' : 'bg-red-400';
              const isOpen   = expandedId === dim.id;

              return (
                <div key={dim.id} className="border-b border-gray-50 last:border-0">
                  <button
                    className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedId(isOpen ? null : dim.id)}
                  >
                    {/* Icon + name */}
                    <span className="text-gray-400 flex-shrink-0">{dim.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 w-44 flex-shrink-0 truncate">{dim.name}</span>

                    {/* Bar */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden relative">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        {/* target line at 80% (4/5) */}
                        <div className="absolute top-0 bottom-0 w-px bg-gray-400/60" style={{ left: '80%' }} />
                      </div>
                      <span className={`text-xs font-black w-6 text-right flex-shrink-0 ${atTarget ? 'text-emerald-600' : close ? 'text-amber-600' : 'text-red-600'}`}>
                        {score.toFixed(1)}
                      </span>
                    </div>

                    {/* Three source dots */}
                    <div className="flex items-center gap-2 flex-shrink-0 w-28">
                      {([
                        { label: 'S', val: dim.selfScore,   tip: 'Self' },
                        { label: 'R', val: dim.reportScore, tip: 'Reports' },
                        { label: 'P', val: dim.peerScore,   tip: 'Peers' },
                      ]).map(src => (
                        <div key={src.label} className="text-center" title={src.tip}>
                          <p className="text-[9px] text-gray-400 leading-none">{src.label}</p>
                          <p className={`text-[11px] font-bold leading-tight ${
                            src.val >= dim.targetScore ? 'text-emerald-600' :
                            src.val >= dim.targetScore - 0.5 ? 'text-amber-600' : 'text-red-500'
                          }`}>{src.val.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>

                    {/* At-target indicator */}
                    <ScoreDot score={score} target={dim.targetScore} />

                    <ChevronDown size={12} className={`text-gray-300 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded: description + delta insight */}
                  {isOpen && (
                    <div className="px-6 pb-4 pt-0 bg-gray-50/30">
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{dim.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Self vs report gap */}
                        {(() => {
                          const delta = dim.reportScore - dim.selfScore;
                          if (Math.abs(delta) < 0.3) return (
                            <span className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                              Self and report ratings aligned
                            </span>
                          );
                          if (delta < 0) return (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                              Overestimates: self {dim.selfScore.toFixed(1)} vs reports {dim.reportScore.toFixed(1)}
                            </span>
                          );
                          return (
                            <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-2.5 py-1">
                              Underestimates: self {dim.selfScore.toFixed(1)} vs reports {dim.reportScore.toFixed(1)}
                            </span>
                          );
                        })()}
                        {score < dim.targetScore && (
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                            {(dim.targetScore - score).toFixed(1)} below target of {dim.targetScore.toFixed(1)}
                          </span>
                        )}
                        {score >= dim.targetScore && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                            At or above target
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-5 flex-wrap text-[10px] text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />At target (≥ 4.0)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Close (3.5–3.9)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Gap (&lt; 3.5)</span>
        <span className="ml-auto">S = Self · R = Report 360 · P = Peer · Target line at 4.0</span>
      </div>
    </div>
  );
}

// ── Check-in section ─────────────────────────────────────────────────────

function CheckInSection({ managerId, deptColor }: { managerId: string; deptColor: string }) {
  const [showHistory, setShowHistory] = useState(false);

  const latest = CHECK_IN_HISTORY[0];
  const trend  = latest.reportAvg - CHECK_IN_HISTORY[CHECK_IN_HISTORY.length - 1].reportAvg;

  const STATUS_CFG = {
    complete:    { label: 'Complete',    cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    'in-progress': { label: 'In progress', cls: 'bg-sky-50 border-sky-200 text-sky-700' },
    overdue:     { label: 'Overdue',     cls: 'bg-red-50 border-red-200 text-red-700' },
    scheduled:   { label: 'Scheduled',   cls: 'bg-gray-100 border-gray-200 text-gray-600' },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">Skill Check-in History</h3>
          </div>
          {/* Next check-in CTA */}
          <button
            className="flex items-center gap-2 text-xs font-semibold text-white rounded-xl px-3.5 py-2 shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: deptColor }}
          >
            <CalendarDays size={12} />
            Schedule Q2 2026 check-in
          </button>
        </div>

        {/* Next due callout */}
        <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-black" style={{ background: deptColor }}>
            Q2
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-800">Next check-in: {NEXT_CHECK_IN.cycle}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <CalendarDays size={9} />
              Due 20 Jun 2026 · Participants: manager self-assessment + 3 report ratings + 2 peer ratings
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CFG.scheduled.cls}`}>
            {STATUS_CFG.scheduled.label}
          </span>
        </div>
      </div>

      {/* Latest check-in summary */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-gray-800">{latest.cycle} — Most recent</p>
            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
              <CalendarDays size={9} />
              Completed {new Date(latest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CFG.complete.cls}`}>
            Complete
          </span>
        </div>

        {/* Three score cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Self-assessment', val: latest.selfAvg,    sub: 'Manager self-rating',  icon: '🙋' },
            { label: 'Report 360',      val: latest.reportAvg,  sub: `${getSkillProfile(managerId).length > 0 ? 'Avg from direct reports' : '—'}`, icon: '👥' },
            { label: 'Peer rating',     val: latest.peerAvg,    sub: 'Avg from 2 peers',      icon: '🤝' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3.5 text-center border border-gray-100">
              <p className="text-lg mb-0.5">{s.icon}</p>
              <p className={`text-xl font-black ${s.val >= 4 ? 'text-emerald-600' : s.val >= 3.5 ? 'text-amber-600' : 'text-red-600'}`}>{s.val.toFixed(1)}</p>
              <p className="text-[10px] font-semibold text-gray-600 mt-0.5">{s.label}</p>
              <p className="text-[9px] text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Trend vs previous */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-medium">Report trend:</span>
          {trend >= 0 ? (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <TrendingUp size={12} />+{trend.toFixed(1)} vs {CHECK_IN_HISTORY[CHECK_IN_HISTORY.length - 1].cycle}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <TrendingDown size={12} />{trend.toFixed(1)} vs {CHECK_IN_HISTORY[CHECK_IN_HISTORY.length - 1].cycle}
            </span>
          )}
        </div>

        {/* Strength / gap callouts */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">Top strength</p>
            <p className="text-xs font-bold text-emerald-800">{latest.topStrength}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Highest-rated dimension this cycle</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Development area</p>
            <p className="text-xs font-bold text-amber-800">{latest.topGap}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Lowest-rated dimension this cycle</p>
          </div>
        </div>
      </div>

      {/* History toggle */}
      <div className="px-6 py-4">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Clock size={12} />
          {showHistory ? 'Hide' : 'Show'} full check-in history ({CHECK_IN_HISTORY.length} cycles)
          <ChevronDown size={12} className={`transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`} />
        </button>

        {showHistory && (
          <div className="mt-4 space-y-2">
            {CHECK_IN_HISTORY.map((ci, i) => {
              const cfg = STATUS_CFG[ci.status];
              return (
                <div key={ci.cycle} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-16 flex-shrink-0">
                    <p className="text-[10px] font-bold text-gray-700">{ci.cycle}</p>
                    <p className="text-[9px] text-gray-400">
                      {new Date(ci.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] flex-1">
                    <span className="text-gray-500">Self <strong className="text-gray-800">{ci.selfAvg.toFixed(1)}</strong></span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Reports <strong className={ci.reportAvg >= 4 ? 'text-emerald-600' : ci.reportAvg >= 3.5 ? 'text-amber-600' : 'text-red-600'}>{ci.reportAvg.toFixed(1)}</strong></span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Peers <strong className="text-gray-800">{ci.peerAvg.toFixed(1)}</strong></span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-emerald-600 font-medium">{ci.topStrength}</p>
                    <p className="text-[9px] text-amber-600">{ci.topGap}</p>
                  </div>
                  {i > 0 && (
                    <div className="flex-shrink-0 w-12 text-right">
                      {(() => {
                        const d = ci.reportAvg - CHECK_IN_HISTORY[i - 1].reportAvg;
                        return d >= 0
                          ? <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 justify-end"><TrendingUp size={9} />+{d.toFixed(1)}</span>
                          : <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 justify-end"><TrendingDown size={9} />{d.toFixed(1)}</span>;
                      })()}
                    </div>
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Qualitative comments callout */}
      <div className="mx-6 mb-6 bg-sky-50 border border-sky-100 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <MessageSquare size={13} className="text-sky-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-sky-800">Report comments — Q1 2026</p>
            <p className="text-xs text-sky-700 mt-1.5 leading-relaxed italic">
              "Really strong on delivery and keeping the team focused, but I'd love more strategic context on where the team is headed long-term."
            </p>
            <p className="text-[10px] text-sky-500 mt-1.5">3 comments submitted · 1 actioned</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  metrics: ManagerMetrics;
  onBack: () => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToHeatmap?: () => void;
  onNavigateToPipeline?: (dept?: Department) => void;
}

export function ManagerDetail({ metrics, onBack, onNavigateToGapReport, onNavigateToHeatmap, onNavigateToPipeline }: Props) {
  const {
    manager, reports, readinessResults,
    avgReadiness, nearReadyCount, progressingCount,
    avgTenure, avgFrameworkCompletion, blockedCount,
    topBlockingSkill, topBlockingSkillCount,
    promotionReadyCount, stalledCount,
    strongSkillCount, totalSkillCriteria,
    trend, trendLabel,
  } = metrics;

  const score = effectivenessScore(metrics);
  const sc = scoreColor(score);
  const deptColor = DEPT_COLORS[manager.department];
  const initials = manager.name.split(' ').map(n => n[0]).join('');

  // Sort reports: near-ready first, then by readiness desc
  const sortedResults = useMemo(
    () => [...readinessResults].sort((a, b) => b.readinessPct - a.readinessPct),
    [readinessResults]
  );

  // Top blocking skills ranked
  const blockingRanked = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of readinessResults) {
      for (const gap of r.gapSkills) {
        map.set(gap.skillName, (map.get(gap.skillName) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [readinessResults]);

  // Skill strength: avg team rating vs required per criterion
  const skillStrengths = useMemo(() => {
    const criteriaMap = new Map<string, { name: string; required: number; actuals: number[] }>();
    for (const r of readinessResults) {
      const allCriteria = [...r.metSkills.map(s => ({ ...s, actualRating: r.person.skills[s.skillId] ?? 0 })), ...r.gapSkills];
      for (const c of allCriteria) {
        if (!criteriaMap.has(c.skillId)) {
          criteriaMap.set(c.skillId, { name: c.skillName, required: c.requiredRating, actuals: [] });
        }
        criteriaMap.get(c.skillId)!.actuals.push(r.person.skills[c.skillId] ?? 0);
      }
    }
    return Array.from(criteriaMap.values())
      .map(({ name, required, actuals }) => {
        const avg = actuals.length > 0 ? actuals.reduce((s, a) => s + a, 0) / actuals.length : 0;
        return { name, required, avg: parseFloat(avg.toFixed(1)), gap: Math.max(0, required - avg) };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [readinessResults]);

  function buildExportContent(): string {
    const lines: string[] = [
      `MANAGER DETAIL — ${manager.name.toUpperCase()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `Title: ${manager.title}`,
      `Department: ${manager.department}`,
      `Location: ${manager.location}`,
      `Tenure in role: ${manager.tenure}m`,
      `Effectiveness score: ${score}`,
      '',
      `Avg readiness: ${avgReadiness}%`,
      `Near ready (90%+): ${nearReadyCount}`,
      `Progressing: ${progressingCount}`,
      `Stalled: ${stalledCount}`,
      `Framework completion: ${avgFrameworkCompletion}%`,
      `Top blocking skill: ${topBlockingSkill}`,
      '',
      'DIRECT REPORTS',
      '-'.repeat(50),
    ];
    for (const r of sortedResults) {
      const tier = r.readinessPct >= 90 ? 'Near Ready' : r.readinessPct >= 70 ? 'Progressing' : r.readinessPct >= 50 ? 'Developing' : 'Early';
      lines.push(`${r.person.name} — ${r.readinessPct}% (${tier}) | ${r.criteriaMet}/${r.criteriaTotal} criteria | ${r.person.tenure}m tenure`);
    }
    return lines.join('\n');
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0" data-tour="managers-detail-header">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            All managers
          </button>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: deptColor }}>
              {initials[0]}
            </div>
            <span className="text-sm font-semibold text-gray-900">{manager.name}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: deptColor }}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{manager.name}</h1>
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{manager.title}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={11} />{manager.location}</span>
                <span className="flex items-center gap-1"><Users size={11} />{reports.length} direct reports</span>
                <span className="flex items-center gap-1"><Clock size={11} />{manager.tenure}m in role</span>
                <span className="flex items-center gap-1"
                  style={{ color: deptColor }}>
                  {manager.department}
                </span>
                <span className="flex items-center gap-1 ml-1"><TrendIcon trend={trend} />{trendLabel}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Teams: {manager.teams.join(', ')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <ExportButtons title={`${manager.name} — Manager Detail`} buildContent={buildExportContent} />
          {/* Score badge */}
          <div className={`rounded-2xl border ${sc.bg} ${sc.border} px-5 py-3 text-center min-w-[100px]`}>
            <p className={`text-4xl font-black leading-none ${sc.text}`}>{score}</p>
            <p className={`text-xs font-bold mt-1 ${sc.text}`}>{scoreLabel(score)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Effectiveness score</p>
          </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* KPI grid */}
          <div className="grid grid-cols-4 gap-4" data-tour="managers-detail-kpis">
            {[
              { label: 'Avg readiness', value: `${avgReadiness}%`, sub: 'across all reports', color: 'text-gray-900', icon: <TrendingUp size={14} className="text-sky-400" /> },
              { label: 'Near ready (≥90%)', value: nearReadyCount, sub: `${progressingCount} more progressing`, color: 'text-emerald-600', icon: <Star size={14} className="text-emerald-400" /> },
              { label: 'Stalled reports', value: stalledCount, sub: '24m+ in level, <50% ready', color: stalledCount > 0 ? 'text-red-600' : 'text-gray-400', icon: <AlertTriangle size={14} className={stalledCount > 0 ? 'text-red-400' : 'text-gray-300'} /> },
              { label: 'Framework completion', value: `${avgFrameworkCompletion}%`, sub: `${strongSkillCount}/${totalSkillCriteria} skills at target`, color: 'text-gray-900', icon: <CheckCircle2 size={14} className="text-sky-400" /> },
            ].map(({ label, value, sub, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">Avg tenure in level</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{avgTenure}m</p>
              <p className="text-xs text-gray-400 mt-1">{avgTenure > 20 ? 'Above average — check blockers' : 'Healthy velocity'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-emerald-400" />
                <span className="text-xs text-gray-500">Promotion ready</span>
              </div>
              <p className="text-3xl font-black text-emerald-600">{promotionReadyCount}</p>
              <p className="text-xs text-gray-400 mt-1">≥90% ready + ≥18m tenure</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={14} className="text-red-400" />
                <span className="text-xs text-gray-500">Reports with gaps</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{blockedCount}</p>
              <p className="text-xs text-gray-400 mt-1">have ≥1 blocking skill gap</p>
            </div>
          </div>

          {/* Two column: blocking skills + skill strengths */}
          <div className="grid grid-cols-2 gap-6" data-tour="managers-detail-skills">
            {/* Blocking skills */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle size={14} className="text-red-400" />
                <h3 className="text-sm font-bold text-gray-900">Top blocking skills</h3>
                <span className="text-xs text-gray-400 ml-auto">{blockingRanked.length} skills with gaps</span>
              </div>
              {blockingRanked.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No blocking skill gaps — excellent!</p>
              ) : (
                <div className="space-y-3">
                  {blockingRanked.map(([skill, count]) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{skill}</span>
                        <span className="text-xs text-gray-500">{count} of {readinessResults.length} reports</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-all"
                          style={{ width: `${(count / readinessResults.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {topBlockingSkill !== '—' && (
                <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-700">Coaching priority</p>
                  <p className="text-sm font-bold text-red-800 mt-0.5">{topBlockingSkill}</p>
                  <p className="text-[11px] text-red-500 mt-0.5">Blocking {topBlockingSkillCount} of {readinessResults.length} reports</p>
                  <div className="flex gap-2 mt-2">
                    {onNavigateToGapReport && (
                      <button
                        onClick={() => onNavigateToGapReport(manager.department)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={9} />Dept gap report
                      </button>
                    )}
                    {onNavigateToHeatmap && (
                      <button
                        onClick={onNavigateToHeatmap}
                        className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={9} />Skills heatmap
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Skill strengths vs gaps */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 size={14} className="text-sky-400" />
                <h3 className="text-sm font-bold text-gray-900">Skill profile — team avg vs target</h3>
              </div>
              <div className="space-y-2.5">
                {skillStrengths.slice(0, 8).map(({ name, required, avg, gap }) => {
                  const atTarget = avg >= required;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-700 truncate pr-2">{name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {atTarget
                            ? <CheckCircle2 size={11} className="text-emerald-500" />
                            : <XCircle size={11} className="text-red-400" />
                          }
                          <span className={`text-[11px] font-bold ${atTarget ? 'text-emerald-600' : 'text-red-500'}`}>
                            {avg.toFixed(1)} / {required}
                          </span>
                        </div>
                      </div>
                      <div className="relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${atTarget ? 'bg-emerald-400' : 'bg-red-400'} transition-all`}
                          style={{ width: `${Math.min((avg / required) * 100, 100)}%` }}
                        />
                        {/* Target marker */}
                        <div className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50" style={{ left: '100%' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Direct reports */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="managers-detail-reports">
            <div className="flex items-center gap-3 mb-5">
              <Users size={14} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Direct reports</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reports.length}</span>
              {stalledCount > 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full ml-auto">
                  {stalledCount} stalled
                </span>
              )}
            </div>
            {sortedResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No promotion pipeline data for this team</p>
            ) : (
              <div className="space-y-2">
                {sortedResults.map(result => (
                  <ReportRow key={result.person.id} result={result} />
                ))}
              </div>
            )}
          </div>

          {/* Manager skill assessment */}
          <SkillAssessmentSection managerId={manager.id} deptColor={deptColor} />

          {/* Check-in history */}
          <CheckInSection managerId={manager.id} deptColor={deptColor} />

          {/* Coaching suggestions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-tour="managers-detail-coaching">
            <div className="flex items-center gap-2 mb-5">
              <ChevronRight size={14} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900">Coaching suggestions</h3>
            </div>
            <div className="space-y-2">
              {promotionReadyCount > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <Star size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-800">{promotionReadyCount} report{promotionReadyCount !== 1 ? 's' : ''} ready to promote</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Review these individuals for formal promotion consideration in the next cycle.</p>
                    {onNavigateToPipeline && (
                      <button
                        onClick={() => onNavigateToPipeline(manager.department)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        <ExternalLink size={9} />View in promotion pipeline
                      </button>
                    )}
                  </div>
                </div>
              )}
              {stalledCount > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-800">{stalledCount} report{stalledCount !== 1 ? 's' : ''} showing stall signals</p>
                    <p className="text-[11px] text-red-600 mt-0.5">High tenure + low readiness. Schedule 1:1 coaching conversations and review blockers.</p>
                  </div>
                </div>
              )}
              {topBlockingSkill !== '—' && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Team-wide gap: {topBlockingSkill}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Blocking {topBlockingSkillCount} reports. Consider a team workshop or shared learning resource.</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-100">
                <TrendingUp size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-sky-800">Framework completion at {avgFrameworkCompletion}%</p>
                  <p className="text-[11px] text-sky-600 mt-0.5">
                    {avgFrameworkCompletion >= 70
                      ? 'Strong coverage — keep reinforcing career conversations.'
                      : 'Below 70%. Prioritise structured development plans with each report.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
