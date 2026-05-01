import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, FileBarChart, BarChart3, Globe,
  ClipboardList, Sparkles, ChevronRight, Home, ArrowRight,
  Brain, Target, Users, AlertTriangle, BookOpen, Zap,
  CheckCircle, BarChart2, MessageSquare, Shield,
} from 'lucide-react';

interface FeatureStep {
  id: string;
  nav: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  tagline: string;
  description: string;
  bullets: string[];
  accent: boolean;
}

const FEATURES: FeatureStep[] = [
  {
    id: 'home',
    nav: 'home',
    icon: <Home size={20} />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    label: 'Executive Summary',
    tagline: "Your org's health on a single screen",
    description:
      "Start every week with a real-time snapshot of what's working and what needs attention. Seven live KPIs — from skill gaps to promotion readiness to 1:1 coverage — surface the signals that matter before your next leadership meeting.",
    bullets: [
      'Automatic risk prioritisation (Red = overdue, Amber = developing)',
      'Positive highlights ready to communicate upward',
      '1:1 check-in coverage by manager — a leading indicator of attrition',
      'One-click drill-down from any metric into the relevant view',
    ],
    accent: false,
  },
  {
    id: 'heatmap',
    nav: 'heatmap',
    icon: <LayoutGrid size={20} />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    label: 'Skills Gap Heatmap',
    tagline: 'See exactly where capability falls short — and by how much',
    description:
      'A colour-coded grid maps every skill across every department, location, and level simultaneously. Sky blue means exceeding target; red means critical. Patterns reveal whether a gap is team-wide or localised to one office.',
    bullets: [
      'Critical gap alerts when 85%+ of a team are below expected level',
      'Click any cell for a full drill-down: gap size, headcount, location breakdown',
      'Direct bridge to the promotion pipeline — see who is blocked by this skill',
      'Context-aware action shortcuts: find mentors, set team focus, export report',
    ],
    accent: false,
  },
  {
    id: 'pipeline',
    nav: 'pipeline',
    icon: <TrendingUp size={20} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Promotion Pipeline',
    tagline: "Know who's ready now — and who needs 90 more days",
    description:
      'Every employee working toward a level transition is scored against the exact criteria in your level framework. Four tiers — Near Ready (90%+), Progressing, Developing, Early — show the depth of your succession bench in real time.',
    bullets: [
      'Readiness percentage computed from your actual skill and criteria data',
      'Department pipeline cards show bench depth and top candidates at a glance',
      'Swimlane drill-down by level transition (e.g. Mid → Senior)',
      'Stalled individuals flagged in red with tenure and criteria detail',
    ],
    accent: false,
  },
  {
    id: 'gap-report',
    nav: 'gap-report',
    icon: <FileBarChart size={20} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Skill Gap Reports',
    tagline: 'The evidence base for every L&D investment decision',
    description:
      'Department-level reports break down every tracked skill by severity, location, and business impact. The promotion pipeline impact section shows which skills are blocking the most promotions — turning training prioritisation from guesswork into data.',
    bullets: [
      'Org-level summary: headcount, % below target, critical skill count, affected departments',
      'Per-skill detail: location breakdown, team breakdown, headcount at each severity level',
      'Promotion impact: how many near-ready candidates are blocked by this skill',
      'Check-in coverage flagged alongside skills as a leading attrition signal',
    ],
    accent: false,
  },
  {
    id: 'managers',
    nav: 'managers',
    icon: <BarChart3 size={20} />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    label: 'Manager Effectiveness',
    tagline: 'Hold managers accountable for team growth, not just output',
    description:
      "A 0–100 composite score measures each manager's real impact on their team's development. Weighted across team readiness growth (40%), framework completion rate (30%), and stalled reports (–30%). Falling trends on otherwise acceptable scores often matter more than a static low score.",
    bullets: [
      'Composite effectiveness score surfaced per manager',
      '90-day trend arrows: improving, holding, or declining',
      'Per-report breakdown: readiness, tier, criteria met, tenure, stall flag',
      'Coaching suggestions generated from live team data',
    ],
    accent: false,
  },
  {
    id: 'benchmark',
    nav: 'benchmark',
    icon: <Globe size={20} />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    label: 'Industry Benchmarks',
    tagline: 'Stop guessing whether your talent strategy is competitive',
    description:
      'Compare your organisation against a matched cohort of peers across five dimensions. Box-plot distributions show where you sit relative to the median and interquartile range — giving you a defensible answer to "how do we compare?" in any board conversation.',
    bullets: [
      'Filterable peer cohorts: all peers, similar-size, B2B SaaS, scaleups',
      'Five benchmark views: overview, skills, compensation, team composition, skill categories',
      'Compensation vs. skill maturity — a direct pay-driven flight-risk signal',
      'Overall quartile position (Q1 = top 25%) with strongest and weakest departments called out',
    ],
    accent: false,
  },
  {
    id: 'journal',
    nav: 'journal',
    icon: <ClipboardList size={20} />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    label: 'Decisions Journal',
    tagline: 'Turn insights into a searchable audit trail of commitments',
    description:
      'Every strategic commitment you make through the AI assistant is automatically logged with context and rationale. A governance-ready record of workforce decisions — useful for board reporting, regulatory audits, and holding teams accountable.',
    bullets: [
      'Auto-captures commitments from AI conversations with full context',
      'Open / completed workflow with one-click status updates',
      'Commitment types: Hire, Develop, Review, Restructure, and more',
      'Link back to the original AI conversation that generated each commitment',
    ],
    accent: false,
  },
  {
    id: 'ask-ai',
    nav: 'ask-ai',
    icon: <Sparkles size={20} />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-600',
    borderColor: 'border-sky-600',
    label: 'Workforce AI',
    tagline: 'Ask any question about your workforce. Get a structured briefing, not a chatbot answer.',
    description:
      "The AI reads your live org data — skills, readiness, managers, benchmarks — and answers strategic questions in plain English. Two modes: Diagnose (what's happening and why) and Plan & Act (structured action plans). Every high-urgency signal triggers a contextual support recommendation.",
    bullets: [
      '"Who is at risk of leaving?" — churn signals with ranked individuals',
      '"Where are our biggest skills gaps?" — department breakdown with action links',
      '"Build me a succession plan for Engineering" — structured plan with criteria',
      'Commitments from AI responses are auto-saved to the Decisions Journal',
    ],
    accent: true,
  },
];

const HOW_STEPS = [
  {
    number: '01',
    icon: <Brain size={22} />,
    title: 'Your data, structured',
    body: 'Progression ingests your HRIS, performance records, and skill assessments and structures them into a unified workforce model — skills, levels, managers, locations, and readiness criteria all in one place.',
  },
  {
    number: '02',
    icon: <Target size={22} />,
    title: 'Gaps computed automatically',
    body: 'Every employee is scored against the level framework for their target role. Promotion readiness, skill gaps, manager effectiveness, and benchmark positions are computed fresh on every session — no manual input required.',
  },
  {
    number: '03',
    icon: <AlertTriangle size={22} />,
    title: 'Risks surfaced proactively',
    body: 'Progression monitors your workforce continuously and surfaces the signals that need attention: critical skill gaps, stalled employees, declining manager scores, and pay-gap flight risks — before they become regrettable losses.',
  },
  {
    number: '04',
    icon: <Zap size={22} />,
    title: 'AI turns data into decisions',
    body: 'Ask a question in plain English. The AI reads your live org data and returns structured briefings, action plans, and scenario analyses — not generic advice. Strategic commitments are auto-logged for governance and accountability.',
  },
];

const PRINCIPLES = [
  { icon: <BarChart2 size={16} />, title: 'Always live data', body: 'Every metric recalculates from source data each session. No stale snapshots.' },
  { icon: <MessageSquare size={16} />, title: 'Plain-English AI', body: 'Ask strategic questions in natural language. Get structured briefings, not chatbot replies.' },
  { icon: <Users size={16} />, title: 'Manager accountability', body: 'Effectiveness scores and coaching prompts keep managers honest about team development.' },
  { icon: <BookOpen size={16} />, title: 'Decision audit trail', body: 'Every AI commitment is logged. A governance-ready record of every workforce decision made.' },
  { icon: <Shield size={16} />, title: 'Evidence-based L&D', body: 'Skill gap reports rank training priorities by business impact, not hunches.' },
  { icon: <CheckCircle size={16} />, title: 'Benchmark-calibrated', body: 'Know whether your talent strategy is competitive. Compare against a matched peer cohort.' },
];

interface Props {
  onNavigate: (view: string) => void;
}

export function HowItWorks({ onNavigate }: Props) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-white">

      {/* Hero */}
      <div className="relative overflow-hidden bg-gray-950 px-6 pt-16 pb-20">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/25 mb-6">
            <Sparkles size={12} className="text-sky-400" />
            <span className="text-xs font-semibold text-sky-300 tracking-wide">Workforce Intelligence Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
            Turn workforce data into<br />
            <span className="text-sky-400">decisions that stick</span>
          </h1>
          <p className="text-base text-gray-400 leading-relaxed max-w-xl mx-auto mb-10">
            Progression connects your skills data, promotion readiness, manager performance, and industry benchmarks into a single intelligence layer — with AI that answers strategic questions in plain English.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-px"
            >
              Open the platform <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('ask-ai')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-all"
            >
              <Sparkles size={13} className="text-sky-400" /> Try the AI
            </button>
          </div>
        </div>
      </div>

      {/* How it works — 4 steps */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How Progression works</h2>
            <p className="text-sm text-gray-500">Four steps from raw HR data to confident workforce decisions</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px border-t border-dashed border-gray-300 z-0" style={{ width: 'calc(100% - 3rem)', left: 'calc(100% - 0.5rem)' }} />
                )}
                <div className="relative bg-white rounded-2xl border border-gray-200 p-5 h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-black text-gray-100 leading-none mt-0.5">{step.number}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Eight views. One workforce picture.</h2>
            <p className="text-sm text-gray-500">Every module connects to the others — gaps link to pipelines, managers link to skills, AI links to everything.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const isAI = f.accent;
              const isExpanded = activeFeature === f.id;

              if (isAI) {
                return (
                  <div
                    key={f.id}
                    className="relative overflow-hidden rounded-2xl cursor-pointer group"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)' }}
                    onClick={() => onNavigate('ask-ai')}
                  >
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                    <div className="relative p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 text-white">
                          <Sparkles size={18} />
                        </div>
                        <span className="text-[9px] font-bold text-sky-200 uppercase tracking-widest mt-1">AI-Powered</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">{f.label}</h3>
                      <p className="text-xs text-sky-100 leading-relaxed mb-4 flex-1">{f.tagline}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                        Ask the AI <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={f.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    isExpanded
                      ? `${f.borderColor} shadow-md`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setActiveFeature(isExpanded ? null : f.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${f.bgColor} border ${f.borderColor} flex items-center justify-center flex-shrink-0 ${f.color}`}>
                        {f.icon}
                      </div>
                      <ChevronRight
                        size={14}
                        className={`text-gray-300 flex-shrink-0 mt-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{f.label}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.tagline}</p>
                  </div>

                  {/* Expanded detail */}
                  <div className={`transition-all duration-200 overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`mx-5 mb-5 pt-4 border-t ${f.borderColor}`}>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{f.description}</p>
                      <ul className="space-y-1.5 mb-4">
                        {f.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle size={11} className={`${f.color} flex-shrink-0 mt-0.5`} />
                            <span className="text-xs text-gray-500 leading-snug">{b}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigate(f.nav); }}
                        className={`flex items-center gap-1.5 text-xs font-semibold ${f.color} hover:opacity-70 transition-opacity`}
                      >
                        Open {f.label} <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Principles */}
      <div className="bg-gray-950 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">Built on six principles</h2>
            <p className="text-sm text-gray-500">The design choices behind every screen</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="bg-white/5 border border-white/8 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400">
                    {p.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white px-6 py-16 border-t border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to see your workforce clearly?</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Start with the Executive Summary — a single-screen view of your organisation&apos;s health, risks, and opportunities — or jump straight into the AI.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-all shadow-md hover:-translate-y-px"
            >
              <Home size={14} /> Executive Summary
            </button>
            <button
              onClick={() => onNavigate('ask-ai')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold transition-all shadow-md shadow-sky-500/25 hover:-translate-y-px"
            >
              <Sparkles size={14} /> Ask the AI
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
