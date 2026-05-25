import { useState } from 'react';
import {
  LayoutGrid, TrendingUp, FileBarChart, BarChart3, Globe,
  ClipboardList, Sparkles, ChevronRight, Home, ArrowRight,
  Brain, Target, AlertTriangle, Zap,
  CheckCircle, BarChart2, MessageSquare, Shield,
  Scale, ShieldCheck, Eye, Users, Lock, BookOpen,
  AlertCircle, GitBranch, Database, Gavel, UserCheck,
  RefreshCw, TrendingDown, Search,
} from 'lucide-react';

// ── Feature data ──────────────────────────────────────────────────────────────

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
      'Positive highlights ready to communicate upward to the board',
      '1:1 check-in coverage by manager — one of the strongest leading indicators of attrition',
      'One-click drill-down from any metric into the relevant detail view',
    ],
    accent: false,
  },
  {
    id: 'heatmap',
    nav: 'heatmap',
    icon: <LayoutGrid size={20} />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    label: 'Skills Gap Heatmap',
    tagline: 'See exactly where capability falls short — and by how much',
    description:
      'A colour-coded grid maps every skill across every department, location, and level simultaneously. Sky blue means exceeding target; red means critical. Patterns reveal whether a gap is team-wide or localised to one office.',
    bullets: [
      'Critical gap alerts when a high proportion of a team are below expected level',
      'Click any cell for a full drill-down: gap size, headcount, location breakdown',
      'Direct bridge to the promotion pipeline — see who is blocked by each skill',
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
    label: 'Talent Signals',
    tagline: "Know who's ready now — and who needs 90 more days",
    description:
      'Every employee working toward a level transition is scored against the exact criteria in your level framework. Four tiers — Near Ready (90%+), Progressing, Developing, Early — show the depth of your succession bench in real time.',
    bullets: [
      'Readiness percentage computed from your actual skill and criteria data',
      'Department pipeline cards show bench depth and top candidates at a glance',
      'Swimlane drill-down by level transition (e.g. Mid → Senior)',
      'Stalled individuals flagged with tenure and criteria detail for structured conversations',
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
      'Org-level summary: headcount, % below target, critical skill count',
      'Per-skill detail: location breakdown, team breakdown, headcount at each severity level',
      'Promotion impact: how many near-ready candidates are blocked by this specific skill',
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
      'Composite effectiveness score with 90-day trend: improving, holding, or declining',
      'Per-report breakdown: readiness, tier, criteria met, tenure, stall flag',
      'Coaching suggestions generated from live team data — specific, not generic',
      "Links to the skills heatmap and pipeline for the manager's department",
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
      'Overall quartile position (Q1 = top 25%) with department-level breakdown',
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
      'Auto-captures commitments from AI conversations with full context preserved',
      'Open / completed workflow with one-click status updates',
      'Commitment types: promotion review, churn risk, skills gap, benchmark, and more',
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
      "The AI reads your live org data — skills, readiness, managers, benchmarks — and answers strategic questions in plain English. Two modes: Diagnose (what's happening and why) and Plan & Act (structured action plans). Every output includes a full reasoning audit trail.",
    bullets: [
      '"Who is at risk of leaving?" — churn signals with ranked individuals and context',
      '"Where are our biggest skills gaps?" — department breakdown with action links',
      '"Build me a 90-day workforce action plan" — structured output with owners and deadlines',
      'Commitments from AI responses are auto-saved to the Decisions Journal',
    ],
    accent: true,
  },
];

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    number: '01',
    icon: <Brain size={22} />,
    title: 'Your data, structured',
    body: 'Progression ingests your HRIS, performance records, and skill assessments and structures them into a unified workforce model — skills, levels, managers, locations, and readiness criteria all connected.',
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
    body: 'Ask a question in plain English. The AI reads your live org data and returns structured briefings, action plans, and scenario analyses — not generic advice. Every commitment is auto-logged for governance and accountability.',
  },
];

// ── AI guardrails data ────────────────────────────────────────────────────────

const GUARDRAILS = [
  {
    icon: <Lock size={18} />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    title: 'Protected characteristics — absolute prohibition',
    body: 'The AI is hard-coded to never factor in, reference, infer, or suggest decisions based on age, gender, race, ethnicity, religion, disability, sexual orientation, pregnancy, or any other protected characteristic. If a question would require reasoning about any of these to answer, the AI refuses that line of reasoning explicitly and redirects to legitimate, performance-based signals. This is non-negotiable and cannot be overridden by any prompt.',
  },
  {
    icon: <UserCheck size={18} />,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    title: 'Humans make the decisions — always',
    body: 'The AI is explicitly instructed that its role is to surface patterns, not make people decisions. Every output that affects an individual\'s employment, compensation, or career includes a mandatory note that final decisions must be reviewed and made by qualified HR professionals. The "AI surfaces patterns — people make decisions" principle is embedded in every single response, not just the high-stakes ones.',
  },
  {
    icon: <Eye size={18} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'Full reasoning transparency — every response',
    body: 'Every AI response includes a mandatory "How this was reached" audit trail: the methodology used, step-by-step analysis with real data points cited, which signals were used and how, what was deliberately excluded, any assumptions made, and alternative interpretations of the same data. HR professionals can audit, interrogate, and challenge every recommendation. Nothing is a black box.',
  },
  {
    icon: <AlertCircle size={18} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'Confidence-rated answers — no confident guessing',
    body: 'The AI rates its own confidence on every answer: High (backed by clear, structured data), Medium (partial data, reasonable inference), or Low (limited data — states what\'s missing and asks for more context before proceeding). At low confidence, the AI pauses and asks clarifying questions rather than fabricating an answer. It cannot present a guess with the same weight as a data-backed finding.',
  },
  {
    icon: <Gavel size={18} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    title: 'Headcount reduction — strict legal guardrails',
    body: 'Any question touching on individual selection for redundancy triggers a mandatory interstitial: the AI refuses to produce or imply a ranked list of individuals for dismissal; it explains that individual selection is a legal process governed by employment law; it redirects to legitimate aggregate analysis (role duplication, structural options, voluntary attrition modelling); it flags disparate impact risk explicitly; and it requires the user to confirm they understand legal review is mandatory before the analysis is shown. Exports are locked until acknowledgment.',
  },
  {
    icon: <Database size={18} />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    title: 'Scope-bound — only your data, no hallucinated benchmarks',
    body: "The AI can only analyse the workforce data provided for your organisation. It cannot access external HR databases or invent market data. If benchmark comparisons are requested and the data isn't in context, it says so explicitly rather than fabricating numbers. All benchmark data shown is drawn from the structured peer dataset built into Progression — sources are always cited.",
  },
  {
    icon: <GitBranch size={18} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    title: 'Fairness signals only — behavioural, not demographic',
    body: 'Flight risk and churn analysis uses only behavioural and structural signals: role performance, promotion readiness percentage, skill ratings, tenure at level, check-in recency, manager effectiveness scores, and compensation vs. market position. Signals correlated with protected characteristics are excluded by design. When discussing at-risk employees, the AI references only legitimate workforce signals.',
  },
  {
    icon: <Search size={18} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Alternative interpretations — always surfaced',
    body: "The AI is required to include alternative interpretations of the same data when they exist — e.g. \"a lower readiness threshold would add 4 more candidates to this list\" or \"this churn signal could also reflect a team culture issue rather than individual disengagement.\" This prevents anchoring on a single conclusion and preserves HR judgment on the most appropriate course of action.",
  },
];

// ── Trust signals ─────────────────────────────────────────────────────────────

const TRUST_SIGNALS = [
  {
    icon: <ShieldCheck size={20} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Fairness-checked badge',
    body: 'Every AI response carries a "Fairness-checked" badge. Click it to see exactly which signals were used in the analysis and which were explicitly excluded. Full transparency, every time.',
  },
  {
    icon: <BarChart2 size={20} />,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    title: 'Confidence rating on every answer',
    body: 'High, Medium, or Low. The AI rates itself. At Medium or Low, it tells you what\'s uncertain and why. At Low, it pauses and asks for more context before giving a substantive answer.',
  },
  {
    icon: <Eye size={20} />,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    title: 'Step-by-step reasoning trail',
    body: 'Expand "How this recommendation was reached" on any AI response. You\'ll see the exact methodology, data points cited, signals used, assumptions flagged, and what was deliberately not considered.',
  },
  {
    icon: <Scale size={20} />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'Ethics note on sensitive topics',
    body: 'On any response touching redundancy, flight risk, or individual employment decisions, a mandatory ethics note appears explaining the constraints applied and the legal review required before action.',
  },
  {
    icon: <ClipboardList size={20} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Persistent audit trail',
    body: 'Every commitment made through the AI is saved to the Decisions Journal with full context: the original question, the AI\'s insight summary, the decision taken, and the date. A governance-ready record.',
  },
  {
    icon: <RefreshCw size={20} />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    title: 'Live data — no stale snapshots',
    body: 'All metrics recalculate from source data each session. The AI reads the same live workforce context every time — it cannot give advice based on outdated figures.',
  },
];

// ── Data signals used ─────────────────────────────────────────────────────────

const ACCEPTABLE_SIGNALS = [
  { label: 'Role performance rating', desc: 'How well is the employee performing in their current role?' },
  { label: 'Promotion readiness %', desc: 'What percentage of next-level criteria have they met?' },
  { label: 'Skill ratings vs. target', desc: 'Where are they above, at, or below the expected competency level?' },
  { label: 'Tenure at current level', desc: 'How long have they been at this level — is progression stalling?' },
  { label: '1:1 check-in recency', desc: "When did they last have a structured development conversation with their manager?" },
  { label: 'Manager effectiveness score', desc: 'Is the team environment one that supports growth and retention?' },
  { label: 'Compensation vs. market position', desc: 'Is pay competitive relative to peers — a structural flight-risk indicator?' },
];

const EXCLUDED_SIGNALS = [
  'Age or date of birth',
  'Gender or gender identity',
  'Race or ethnicity',
  'Religion or belief',
  'Disability or health status',
  'Sexual orientation',
  'Pregnancy or parental status',
  'Marital or civil partnership status',
  'National origin or citizenship',
  'Any demographic inference from name, location, or education history',
];

// ── Principles ────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  { icon: <BarChart2 size={16} />, title: 'Always live data', body: 'Every metric recalculates from source data each session. No stale snapshots.' },
  { icon: <MessageSquare size={16} />, title: 'Plain-English AI', body: 'Ask strategic questions in natural language. Get structured briefings, not chatbot replies.' },
  { icon: <Users size={16} />, title: 'Manager accountability', body: 'Effectiveness scores and coaching prompts keep managers honest about team development.' },
  { icon: <BookOpen size={16} />, title: 'Decision audit trail', body: 'Every AI commitment is logged. A governance-ready record of every workforce decision made.' },
  { icon: <Shield size={16} />, title: 'Evidence-based L&D', body: 'Skill gap reports rank training priorities by business impact, not hunches.' },
  { icon: <CheckCircle size={16} />, title: 'Benchmark-calibrated', body: 'Know whether your talent strategy is competitive. Compare against a matched peer cohort.' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (view: string) => void;
}

export function HowItWorks({ onNavigate }: Props) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [openGuardrail, setOpenGuardrail] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-white">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
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
            Progression connects your skills data, promotion readiness, manager performance, and industry benchmarks into a single intelligence layer — with AI that answers strategic questions in plain English, backed by a full audit trail.
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

      {/* ── How it works — 4 steps ────────────────────────────────────────── */}
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

      {/* ── Platform features ─────────────────────────────────────────────── */}
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

      {/* ── AI Trust & Guardrails — main section ─────────────────────────── */}
      <div className="bg-gray-950 px-6 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/25 mb-5">
              <Shield size={12} className="text-teal-400" />
              <span className="text-xs font-semibold text-teal-300 tracking-wide">AI Governance</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Why you can trust the AI</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto">
              The Workforce AI is not a general-purpose chatbot. It is a purpose-built people analytics tool with hard-coded ethical guardrails, mandatory legal safeguards, and full transparency on every answer. Here is exactly how it works — and what it will never do.
            </p>
          </div>

          {/* Guardrail cards — expandable */}
          <div className="space-y-3">
            {GUARDRAILS.map((g, i) => (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  openGuardrail === i
                    ? `${g.border} bg-white/5`
                    : 'border-white/8 bg-white/3 hover:bg-white/5'
                }`}
              >
                <button
                  onClick={() => setOpenGuardrail(openGuardrail === i ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${g.bg} border ${g.border} flex items-center justify-center ${g.color}`}>
                    {g.icon}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white leading-snug">{g.title}</span>
                  <ChevronRight
                    size={14}
                    className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${openGuardrail === i ? 'rotate-90' : ''}`}
                  />
                </button>

                <div className={`transition-all duration-200 overflow-hidden ${openGuardrail === i ? 'max-h-60' : 'max-h-0'}`}>
                  <div className="px-5 pb-5 pt-1">
                    <div className={`w-full h-px ${g.border} mb-4 opacity-30`} />
                    <p className="text-sm text-gray-300 leading-relaxed">{g.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Callout — what the AI will never do */}
          <div className="mt-10 rounded-2xl border border-rose-500/25 bg-rose-500/8 px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mt-0.5">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-3">What the AI will never do</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    'Name specific individuals as candidates for redundancy',
                    'Factor in any protected characteristic in any analysis',
                    'Present a guess with the same confidence as a data-backed finding',
                    'Give advice based on data it has not been provided',
                    'Produce a final employment decision — only inputs to human judgment',
                    'Proceed without flagging when legal review is required',
                    'Omit the reasoning behind a recommendation',
                    'Suppress alternative interpretations of the same data',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-rose-400 text-[9px] font-bold">✕</span>
                      </div>
                      <span className="text-xs text-gray-300 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Signals used and excluded ─────────────────────────────────────── */}
      <div className="bg-white px-6 py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exactly what data the AI uses</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              The AI analyses only legitimate, performance-based workforce signals. Demographic characteristics are excluded entirely — by design, not by policy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Acceptable signals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle size={13} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Signals the AI uses</h3>
              </div>
              <div className="space-y-2.5">
                {ACCEPTABLE_SIGNALS.map((s, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-800 mb-0.5">{s.label}</p>
                    <p className="text-[11px] text-gray-500 leading-snug">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded signals */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <Lock size={13} className="text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Signals the AI never uses</h3>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-[11px] text-rose-700 font-semibold uppercase tracking-wider mb-3">Protected characteristics — absolute exclusion</p>
                <div className="space-y-2">
                  {EXCLUDED_SIGNALS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-rose-500 text-[8px] font-bold">✕</span>
                      </div>
                      <span className="text-xs text-rose-800">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-rose-100">
                  <p className="text-[11px] text-rose-600 leading-relaxed">
                    These exclusions are enforced at the AI system level, not just as a usage policy. The model is instructed to refuse any line of reasoning that requires these characteristics and to explain why.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust signals visible in the product ─────────────────────────── */}
      <div className="bg-gray-50 px-6 py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trust signals you'll see in every AI response</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Governance is not buried in a terms document. It is visible in the interface on every single AI interaction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRUST_SIGNALS.map((ts, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className={`w-9 h-9 rounded-xl ${ts.bg} flex items-center justify-center ${ts.color} mb-3`}>
                  {ts.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{ts.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{ts.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Who Progression is designed for ──────────────────────────────── */}
      <div className="bg-white px-6 py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Designed for HR leaders who own the decisions</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Progression is built for the people who are accountable — Chief People Officers, HR Directors, and their teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users size={20} />,
                color: 'text-sky-600',
                bg: 'bg-sky-50',
                role: 'Chief People Officer',
                needs: [
                  'A single view of org health for board reporting',
                  'Defensible benchmark data to support budget asks',
                  'Confidence that AI recommendations are legally sound',
                  'An audit trail of workforce decisions over time',
                ],
              },
              {
                icon: <BarChart3 size={20} />,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                role: 'HR Director',
                needs: [
                  'Evidence-based L&D investment priorities by department',
                  'Promotion pipeline depth across the whole org',
                  'Manager effectiveness data before performance reviews',
                  'Early warning on flight risk before it becomes attrition',
                ],
              },
              {
                icon: <TrendingDown size={20} />,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                role: 'HRBP / People Partner',
                needs: [
                  'Department-level skills gap data for stakeholder conversations',
                  'Specific coaching suggestions for low-effectiveness managers',
                  'Individual pipeline data for promotion calibration meetings',
                  'Quick AI analysis before a business partner meeting',
                ],
              },
            ].map((persona, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-9 h-9 rounded-xl ${persona.bg} flex items-center justify-center ${persona.color} flex-shrink-0`}>
                    {persona.icon}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{persona.role}</h3>
                </div>
                <ul className="space-y-2">
                  {persona.needs.map((need, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle size={11} className={`${persona.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-xs text-gray-600 leading-snug">{need}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Data freshness & methodology ─────────────────────────────────── */}
      <div className="bg-gray-50 px-6 py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How the numbers are calculated</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Every metric in Progression is derived from a documented methodology. Nothing is a black box.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Promotion readiness score',
                body: 'Each employee is evaluated against the specific criteria in the level framework for their target role. The percentage of criteria met determines their readiness tier: Ready (100%), Near Ready (90–99%), Progressing (70–89%), Developing (50–69%), Building (<50%). The criteria and weightings are drawn directly from your configured level framework — they are not AI-generated.',
              },
              {
                title: 'Manager effectiveness score',
                body: 'A 0–100 composite weighted across three factors: team readiness growth (40% weight), framework completion rate across direct reports (30% weight), and a deduction for stalled reports (up to 30%). A "stalled" report is defined as someone who has been at their current level for 24+ months with a readiness score below 50%. The score updates each session from live data.',
              },
              {
                title: 'Churn and flight risk signals',
                body: 'Flight risk is assessed from a composite of behavioural and structural signals: time since last 1:1 (a strong leading indicator), compensation position relative to peers, promotion stall duration, and manager effectiveness score. No demographic data is included. The model identifies patterns associated with voluntary departure decisions based on workforce research.',
              },
              {
                title: 'Industry benchmark quartiles',
                body: 'Benchmark positions are computed using linear interpolation across the distribution of peer company data. Q1 is the top 25% of peers, Q4 is the bottom 25%. Peer data comes from a curated dataset of comparable companies. Quartile position is computed fresh on each session — as you filter the peer cohort, all benchmark positions recalculate immediately.',
              },
              {
                title: 'Skill gap severity',
                body: 'Each skill is rated against a target competency level for each role. The percentage of a team\'s headcount below the expected level determines severity: On Track (<25% below), Developing (25–44%), At Risk (45–64%), Critical (65%+). These thresholds are fixed and consistently applied across all departments to ensure fair comparisons.',
              },
              {
                title: 'Org health score',
                body: 'The executive summary health score aggregates signals across five dimensions: promotion pipeline depth, skill gap severity, manager effectiveness, attrition risk exposure, and benchmark quartile position. Each dimension is normalised to a 0–100 scale and combined with equal weighting. The component scores are always visible so the headline number can be interrogated.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Principles ───────────────────────────────────────────────────── */}
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

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="bg-white px-6 py-16 border-t border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to see your workforce clearly?</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Start with the Executive Summary — a single-screen view of your organisation's health, risks, and opportunities — or jump straight into the AI.
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
