import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Plus, Send, Lightbulb, Search,
  ChevronRight, Clock, ArrowLeft,
  TrendingUp, AlertTriangle, BarChart2, User,
  UserPlus, Zap, BookOpen, RefreshCw,
  Download, Mail, X, Check, Paperclip, FileText,
  ClipboardPaste, Upload, ShieldAlert, Scale, Lock,
  History, MessageSquare,
} from 'lucide-react';
import {
  query,
  buildCommitmentPrompt,
  buildWorkforceContext,
  SUGGESTED_PROMPTS,
  PLANNING_PROMPTS,
  type ChatMessage,
  type QueryResult,
  type ActionNavTarget,
} from '../../data/chatEngine';
import { ResultsBlock } from './AIChatRenderer';
import {
  HumanDecisionBar,
  ConfidenceBadge,
  EthicsBadge,
  ReasoningAccordion,
  CareermindsCard,
  ContextRequestBanner,
  type StructuredReasoning,
} from './AITrustComponents';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Document context ──────────────────────────────────────────────────

interface AttachedDoc {
  name: string;
  content: string;
  size: number;
}

async function extractTextFromFile(file: File): Promise<string> {
  // CSV / plain text
  if (file.type === 'text/csv' || file.type === 'text/plain' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
    return file.text();
  }
  // JSON
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    return file.text();
  }
  // PDF — read as ArrayBuffer and extract text using PDF.js if available,
  // otherwise fall back to reading as binary and extracting visible strings
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    // Attempt lightweight string extraction from PDF bytes
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);
    // Extract text between BT (begin text) and ET (end text) markers
    const chunks: string[] = [];
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let m: RegExpExecArray | null;
    while ((m = btEtRegex.exec(raw)) !== null) {
      // Extract string literals from Tj / TJ operators
      const strRegex = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
      let s: RegExpExecArray | null;
      while ((s = strRegex.exec(m[1])) !== null) {
        const part = (s[1] || s[2] || '').replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
        if (part) chunks.push(part);
      }
    }
    if (chunks.length > 0) return chunks.join(' ');
    // Fallback: grab printable ASCII runs
    return raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s{3,}/g, '\n').slice(0, 20000);
  }
  // Generic fallback
  return file.text();
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// Keywords that suggest the AI couldn't answer due to missing financial/external data
const MISSING_CONTEXT_PATTERNS = [
  /don't have.*?(financial|budget|salary|compensation|cost|revenue|headcount target)/i,
  /no.*?(financial|budget|salary|compensation|cost|revenue)/i,
  /not.*?(available|provided|access).*?(financial|budget|data|document)/i,
  /would need.*?(financial|budget|data|document|information)/i,
  /missing.*?(financial|budget|salary|data)/i,
  /if you.*?(share|provide|upload|attach).*?(data|document|file|budget|salary)/i,
  /please.*?(provide|share|upload|attach)/i,
  /more.*?information.*?(budget|financial|cost)/i,
  /unable to.*?(calculate|determine|assess).*?without/i,
];

function detectsMissingContext(text: string): boolean {
  return MISSING_CONTEXT_PATTERNS.some(p => p.test(text));
}

// ── AI response type ──────────────────────────────────────────────────

export interface AIResponse {
  confidence: 'high' | 'medium' | 'low';
  text: string;
  reasoning: StructuredReasoning | string[] | null;
  sources: string[];
  assumptions: string[];
  needsMoreContext: boolean;
  contextQuestion?: string;
  careermindsSuggestion: { product: string; reason: string } | null;
  ethicsNote: string | null;
}

// ── AI call ───────────────────────────────────────────────────────────

async function callWorkforceAI(question: string, docContext?: string): Promise<AIResponse> {
  const workforceCtx = buildWorkforceContext();
  const context = docContext
    ? `${workforceCtx}\n\n---\nSUPPLEMENTARY DOCUMENT PROVIDED BY USER:\n${docContext}`
    : workforceCtx;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/workforce-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ question, context }),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const data = await res.json();

  // Handle both new structured format and legacy plain-text fallback
  if (data.confidence && data.text) {
    return {
      confidence: data.confidence ?? 'medium',
      text: data.text ?? 'No response received.',
      reasoning: data.reasoning ?? [],
      sources: data.sources ?? [],
      assumptions: data.assumptions ?? [],
      needsMoreContext: data.needsMoreContext ?? false,
      contextQuestion: data.contextQuestion,
      careermindsSuggestion: data.careermindsSuggestion ?? null,
      ethicsNote: data.ethicsNote ?? null,
    };
  }

  // Legacy fallback: edge fn returned { text: "..." }
  const text = data.text ?? 'No response received.';
  return {
    confidence: 'medium',
    text,
    reasoning: [],
    sources: ['Workforce context snapshot'],
    assumptions: [],
    needsMoreContext: !docContext && detectsMissingContext(text),
    contextQuestion: undefined,
    careermindsSuggestion: null,
    ethicsNote: null,
  };
}

// ── Types ─────────────────────────────────────────────────────────────

interface OutputEntry {
  id: string;
  question: string;
  answer: string;
  results: QueryResult[];
  timestamp: Date;
  needsMoreContext?: boolean;
  contextQuestion?: string;
  confidence?: 'high' | 'medium' | 'low';
  reasoning?: StructuredReasoning | string[] | null;
  sources?: string[];
  assumptions?: string[];
  ethicsNote?: string | null;
  careermindsSuggestion?: { product: string; reason: string } | null;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  outputs: OutputEntry[];
  activeOutputId: string | null;
  createdAt: Date;
  mode: ChatMode;
  attachedDoc: AttachedDoc | null;
}

type ChatMode = 'diagnose' | 'plan';

let counter = 0;
function makeId() { return `id-${++counter}`; }

function makeConversation(mode: ChatMode = 'diagnose'): Conversation {
  return { id: makeId(), title: 'New conversation', messages: [], outputs: [], activeOutputId: null, createdAt: new Date(), mode, attachedDoc: null };
}

function deriveTitle(q: string): string {
  return q.length > 46 ? q.slice(0, 46) + '…' : q;
}

// ── Chip config ───────────────────────────────────────────────────────

const DIAGNOSE_CHIPS = [
  { icon: <TrendingUp size={11} />, label: 'Who is ready for promotion?' },
  { icon: <AlertTriangle size={11} />, label: 'Who is at churn risk?' },
  { icon: <BarChart2 size={11} />, label: 'Where are our biggest skills gaps?' },
  { icon: <User size={11} />, label: 'Show me the Engineering pipeline' },
];

const PLAN_CHIPS = [
  { icon: <UserPlus size={11} />, label: 'Recommend a hiring strategy for Engineering' },
  { icon: <Zap size={11} />, label: 'Build a retention plan for churn risks' },
  { icon: <BookOpen size={11} />, label: 'How do we close the skills gaps in Data?' },
  { icon: <RefreshCw size={11} />, label: 'Which teams need restructuring?' },
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Export helpers ────────────────────────────────────────────────────

function buildPlainText(entry: OutputEntry): string {
  const lines: string[] = [
    'PROGRESSION AI — WORKFORCE ANALYSIS',
    `Generated: ${formatDate(entry.timestamp)} at ${formatTime(entry.timestamp)}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `QUESTION: ${entry.question}`,
    '',
  ];

  if (entry.answer) {
    lines.push('SUMMARY', '─────────────────────────────────────', entry.answer, '');
  }

  for (const r of entry.results) {
    if (r.kind === 'stat-cards') {
      lines.push('KEY METRICS', '─────────────────────────────────────');
      for (const c of r.items) lines.push(`  ${c.label}: ${c.value}  (${c.note})`);
      lines.push('');
    } else if (r.kind === 'person-list' || r.kind === 'churn-risk-list') {
      lines.push(r.kind === 'churn-risk-list' ? 'CHURN RISK' : 'PEOPLE', '─────────────────────────────────────');
      for (const p of r.items) lines.push(`  ${p.name}  |  ${p.department}  |  ${p.readinessPct}% ready  |  ${p.tier}`);
      lines.push('');
    } else if (r.kind === 'skill-gap-list') {
      lines.push('SKILLS GAPS', '─────────────────────────────────────');
      for (const s of r.items) lines.push(`  ${s.skill} (${s.department})  |  ${s.belowTarget} below target  |  ${s.avgActual} / ${s.expected}`);
      lines.push('');
    } else if (r.kind === 'dept-summary') {
      lines.push('DEPARTMENT SUMMARY', '─────────────────────────────────────');
      for (const d of r.items) lines.push(`  ${d.department}  |  ${d.total} tracked  |  ${d.avgReadiness}% avg readiness  |  ${d.nearReady} near-ready`);
      lines.push('');
    } else if (r.kind === 'recommendation') {
      for (const rec of r.items) {
        lines.push(`RECOMMENDATION: ${rec.title}`, '─────────────────────────────────────');
        lines.push(`Urgency: ${rec.urgency.toUpperCase()}`, rec.context, '');
        lines.push('Actions:');
        for (const a of rec.actions) lines.push(`  • [${a.timeframe}] ${a.label}`, `    ${a.detail}`);
        lines.push('');
      }
    } else if (r.kind === 'scenario') {
      for (const s of r.items) {
        lines.push(`SCENARIO: ${s.scenario}`, '─────────────────────────────────────');
        lines.push(`Current: ${s.current}`, `Projected: ${s.projected}`, `Risk: ${s.risk.toUpperCase()}`, '');
        lines.push('Mitigations:');
        for (const m of s.mitigations) lines.push(`  • ${m}`);
        lines.push('');
      }
    } else if (r.kind === 'reduction') {
      const a = r.analysis;
      lines.push('HEADCOUNT REDUCTION ANALYSIS', '─────────────────────────────────────');
      lines.push(
        `Total headcount: ${a.totalHeadcount}`,
        `Reduction target: ${a.reductionTarget} (${a.reductionPct}%)`,
        `Voluntary buffer: ${a.voluntaryBuffer}`,
        `Net forced reduction: ${a.netForcedReduction}`,
        '',
        'Alternatives:',
      );
      for (const alt of a.alternativeSavings) lines.push(`  • ${alt}`);
      lines.push('', 'Legal flags:');
      for (const f of a.legalFlags) lines.push(`  • ${f}`);
      lines.push('');
    }
  }

  // Trust & transparency footer
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Confidence: ${(entry.confidence ?? 'medium').toUpperCase()}`);
  if (entry.sources && entry.sources.length > 0) {
    lines.push('Sources: ' + entry.sources.join(' · '));
  }
  if (entry.assumptions && entry.assumptions.length > 0) {
    lines.push('Assumptions:');
    for (const a of entry.assumptions) lines.push(`  • ${a}`);
  }
  if (entry.ethicsNote) {
    lines.push('', `Ethics note: ${entry.ethicsNote}`);
  }
  if (entry.careermindsSuggestion) {
    lines.push('', `Careerminds suggestion — ${entry.careermindsSuggestion.product}: ${entry.careermindsSuggestion.reason}`);
  }
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('AI SURFACES PATTERNS — PEOPLE MAKE DECISIONS.');
  lines.push('This report is generated by Progression Workforce Intelligence and is');
  lines.push('intended as an input to human judgment, not as a final decision.');
  lines.push('All recommendations affecting individuals must be reviewed by a');
  lines.push('qualified HR professional before any action is taken.');
  lines.push('Fairness-checked: protected characteristics are never factored in.');
  return lines.join('\n');
}

function downloadAsText(entry: OutputEntry) {
  const text = buildPlainText(entry);
  const slug = entry.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const filename = `progression-ai-${slug}.txt`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Email modal ───────────────────────────────────────────────────────

function EmailModal({ entry, onClose }: { entry: OutputEntry; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function send() {
    if (!email.trim()) return;
    const subject = encodeURIComponent(`[AI — human review required] Progression: ${entry.question}`);
    const body = encodeURIComponent(buildPlainText(entry));
    window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`);
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Mail size={13} className="text-sky-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">Email this report</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Check size={20} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Your email client has opened</p>
              <p className="text-xs text-gray-400 leading-relaxed">The report is pre-filled in a new email to <span className="font-medium text-gray-600">{email}</span>. Review and send from your email client.</p>
              <button onClick={onClose} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">Close</button>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Report</p>
                <p className="text-xs font-medium text-gray-700 leading-snug">{entry.question}</p>
              </div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="you@company.com"
                autoFocus
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50 transition-all placeholder:text-gray-300"
              />
              <p className="text-[10px] text-gray-400 mt-2">This opens your email client with the report pre-filled. Nothing is sent through Progression servers.</p>
              <button
                onClick={send}
                disabled={!email.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-400 transition-all"
              >
                <Mail size={13} />
                Open email client
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Paste modal ───────────────────────────────────────────────────────

function PasteModal({ onAttach, onClose }: { onAttach: (doc: AttachedDoc) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [name, setName] = useState('Pasted document');

  function attach() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAttach({ name, content: trimmed, size: new Blob([trimmed]).size });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
              <ClipboardPaste size={13} className="text-teal-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">Paste document content</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Document name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Q4 Budget Report"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Content</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
              placeholder="Paste CSV, financial data, headcount tables, or any text here…"
              rows={10}
              className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 transition-all placeholder:text-gray-300 resize-none font-mono leading-relaxed"
            />
          </div>
          <button
            onClick={attach}
            disabled={!text.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-700 transition-all"
          >
            <Paperclip size={13} />
            Attach to conversation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Missing context nudge (rendered inline in output panel) ───────────

function MissingContextNudge({ onUpload, onPaste }: { onUpload: () => void; onPaste: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-teal-200 bg-teal-50/60 px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-white border border-teal-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Upload size={14} className="text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug mb-1">
            Provide additional data to get a complete answer
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            This question likely needs financial or supplementary data we don't have on file — such as budget figures, salary bands, or headcount targets. Upload a file or paste the relevant data directly.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 active:scale-95 transition-all"
            >
              <FileText size={12} />
              Upload a file
            </button>
            <button
              onClick={onPaste}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-50 active:scale-95 transition-all"
            >
              <ClipboardPaste size={12} />
              Paste data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty output state ────────────────────────────────────────────────

function EmptyOutput({ mode }: { mode: ChatMode }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 px-16">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 ${
        mode === 'plan' ? 'bg-amber-50 border-amber-100' : 'bg-sky-50 border-sky-100'
      }`}>
        {mode === 'plan'
          ? <Lightbulb size={36} className="text-amber-400" />
          : <Sparkles size={36} className="text-sky-400" />
        }
      </div>
      <div className="max-w-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {mode === 'plan' ? 'Strategies appear here' : 'Analysis appears here'}
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          {mode === 'plan'
            ? 'Ask for a hiring plan, retention strategy, restructuring recommendation, or scenario analysis. The full output will render here.'
            : 'Ask about promotions, churn risk, skills gaps, benchmarks, or any workforce signal. Rich data and breakdowns will display here.'}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <ArrowLeft size={12} />
        <span>Type your question in the chat panel</span>
      </div>
    </div>
  );
}

// ── Reduction detection ───────────────────────────────────────────────

const REDUCTION_PATTERN = /\b(redundan|layoff|lay.off|let.go|let go|retrench|downsize|down.size|headcount.reduc|reduc.headcount|who.should.we.cut|who.to.cut|who.should.be.cut|who.to.fire|who.should.we.fire|who.should.be.fired|cut.staff|staff.cut|workforce.reduc|reduc.workforce|reduction.in.force|rif\b|involuntary|termination.list|who.should.leave|who.can.we.lose)\b/i;

function isReductionEntry(entry: OutputEntry): boolean {
  if (entry.results.some(r => r.kind === 'reduction')) return true;
  return REDUCTION_PATTERN.test(entry.question) || REDUCTION_PATTERN.test(entry.answer ?? '');
}

// ── Reduction interstitial modal ──────────────────────────────────────

function ReductionInterstitial({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header bar */}
        <div className="bg-sky-800 px-6 py-5 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mt-0.5">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-snug">Headcount Reduction Analysis</p>
            <p className="text-sky-200 text-sm mt-0.5 leading-snug">Legal and HR review required before any action</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            This analysis touches on headcount reduction. It provides <strong>aggregate, structural-level insight only</strong> and must not be used as the basis for individual selection decisions.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
            <div className="flex items-start gap-2">
              <Scale size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Individual selection for redundancy is a <strong>legal process</strong> requiring documented, objective criteria developed with qualified HR and employment law expertise.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Even performance-based criteria can constitute <strong>indirect discrimination</strong> if they disproportionately affect a protected group. Disparate impact analysis by a qualified lawyer is required.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked(v => !v)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                checked ? 'bg-sky-700 border-sky-700' : 'border-gray-300 group-hover:border-sky-500'
              }`}
            >
              {checked && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-gray-700 leading-snug select-none" onClick={() => setChecked(v => !v)}>
              I confirm I understand this analysis must not be used for individual selection decisions without HR and legal review, and that I will involve a qualified employment lawyer before any selection process begins.
            </span>
          </label>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onConfirm}
            disabled={!checked}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              checked
                ? 'bg-sky-700 text-white hover:bg-sky-800 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            I understand — show analysis
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reduction warning banner ──────────────────────────────────────────

function ReductionWarningBanner() {
  return (
    <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center mt-0.5">
        <ShieldAlert size={15} className="text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-700 mb-1">Legal review required before any action</p>
        <p className="text-xs text-red-600 leading-relaxed">
          This analysis is for structural planning only. It must not be used as the basis for individual selection decisions. Individual redundancy selection is a legal process — involve qualified HR and employment law counsel before any criteria are finalised. Even performance-based criteria can constitute indirect discrimination if they disproportionately affect a protected group.
        </p>
      </div>
    </div>
  );
}

// ── Output panel ──────────────────────────────────────────────────────

function OutputPanel({
  entry,
  onSend,
  onNavigate,
  onUpload,
  onPaste,
}: {
  entry: OutputEntry;
  onSend: (t: string) => void;
  onNavigate?: (target: ActionNavTarget) => void;
  onUpload: () => void;
  onPaste: () => void;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const isReduction = isReductionEntry(entry);
  const [reductionAcknowledged, setReductionAcknowledged] = useState(false);
  const exportsLocked = isReduction && !reductionAcknowledged;

  function handleDownload() {
    if (exportsLocked) return;
    downloadAsText(entry);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  const confidence = entry.confidence ?? 'medium';
  const sources = entry.sources ?? [];
  const assumptions = entry.assumptions ?? [];

  return (
    <>
      {/* Interstitial — blocks the output until user actively acknowledges */}
      {isReduction && !reductionAcknowledged && (
        <ReductionInterstitial onConfirm={() => setReductionAcknowledged(true)} />
      )}

      <div className="h-full overflow-y-auto flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full px-12 py-10">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-5 h-5 rounded-md bg-sky-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={10} className="text-white" />
                </div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-widest">Progression AI</span>
                <span className="text-[11px] text-gray-300">{formatTime(entry.timestamp)}</span>
                {/* Trust badges inline with header */}
                <ConfidenceBadge confidence={confidence} sources={sources} />
                <EthicsBadge />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
                >
                  <Download size={12} />
                  Export report
                </button>
                {false && <button
                  onClick={() => { if (!exportsLocked) setEmailOpen(true); }}
                  disabled={exportsLocked}
                  title={exportsLocked ? 'Acknowledge the legal notice to unlock exports' : undefined}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    exportsLocked
                      ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {exportsLocked ? <Lock size={12} /> : <Mail size={12} />}
                  Email me
                </button>}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-4">{entry.question}</h1>
            {entry.answer && (
              <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-sky-200 pl-4">
                {entry.answer}
              </p>
            )}
          </div>

          {/* Persistent reduction warning banner — replaces the subtle footer */}
          {isReduction && reductionAcknowledged && (
            <div className="mb-6">
              <ReductionWarningBanner />
            </div>
          )}

          {/* Data results */}
          {entry.results.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-6 mt-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">Data</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <ResultsBlock results={entry.results} onSend={onSend} onNavigate={onNavigate} wide />
            </>
          )}

          {/* Trust & transparency section */}
          <div className="mt-8 space-y-3">
            <ReasoningAccordion
              reasoning={entry.reasoning ?? []}
              sources={sources}
              assumptions={assumptions}
              ethicsNote={entry.ethicsNote}
            />
            <CareermindsCard suggestion={entry.careermindsSuggestion ?? null} />
          </div>
        </div>

        {/* Permanent human-in-the-loop footer — always visible, never dismissable */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-12">
          <HumanDecisionBar />
        </div>
      </div>

      {emailOpen && <EmailModal entry={entry} onClose={() => setEmailOpen(false)} />}
    </>
  );
}

// ── Mock history data ─────────────────────────────────────────────────

interface HistoryConversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  mode: ChatMode;
  messageCount: number;
}

const MOCK_HISTORY: HistoryConversation[] = [
  {
    id: 'h1',
    title: 'Who is ready for promotion in Engineering?',
    preview: '4 people are near-ready in Engineering. Sarah Chen leads with 96% readiness...',
    timestamp: new Date(Date.now() - 1000 * 60 * 47),
    mode: 'diagnose',
    messageCount: 6,
  },
  {
    id: 'h2',
    title: 'Build a retention plan for churn risks',
    preview: 'I recommend a 3-part retention strategy targeting the 8 high-risk employees...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    mode: 'plan',
    messageCount: 9,
  },
  {
    id: 'h3',
    title: 'Where are our biggest skills gaps?',
    preview: 'Data Science has the widest gaps — ML Engineering averages 2.1 vs 4.0 target...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22),
    mode: 'diagnose',
    messageCount: 4,
  },
  {
    id: 'h4',
    title: 'Recommend a hiring strategy for Data',
    preview: 'Given the 3 near-ready promotions and 2 high flight risks, I suggest a two-track...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    mode: 'plan',
    messageCount: 11,
  },
  {
    id: 'h5',
    title: 'Show me the Product pipeline',
    preview: 'Product has 12 tracked employees. 2 are near-ready, 4 progressing, 3 developing...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    mode: 'diagnose',
    messageCount: 5,
  },
  {
    id: 'h6',
    title: 'Which teams need restructuring?',
    preview: 'Based on span-of-control ratios and readiness distribution, Customer Success and...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    mode: 'plan',
    messageCount: 14,
  },
  {
    id: 'h7',
    title: 'Who is at churn risk in Sales?',
    preview: 'Sales has 3 employees flagged as high churn risk. Marcus Rodriguez has been at...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    mode: 'diagnose',
    messageCount: 7,
  },
  {
    id: 'h8',
    title: 'How do we close skills gaps in Data?',
    preview: 'To close the ML Engineering and Python gaps in Data, I recommend a blended...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13),
    mode: 'plan',
    messageCount: 8,
  },
  {
    id: 'h9',
    title: 'Headcount reduction scenario — 10%',
    preview: 'A 10% reduction from 42 employees means 4 roles. Voluntary buffer analysis shows...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
    mode: 'plan',
    messageCount: 12,
  },
  {
    id: 'h10',
    title: 'Compare Engineering readiness to benchmark',
    preview: 'Engineering sits at the 3rd quartile for readiness velocity vs peer companies...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    mode: 'diagnose',
    messageCount: 6,
  },
];

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 28) return `${days} days ago`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(items: HistoryConversation[]): { label: string; items: HistoryConversation[] }[] {
  const now = Date.now();
  const groups: Record<string, HistoryConversation[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    'Last month': [],
    Older: [],
  };
  for (const item of items) {
    const diffDays = Math.floor((now - item.timestamp.getTime()) / 86400000);
    if (diffDays < 1) groups['Today'].push(item);
    else if (diffDays < 2) groups['Yesterday'].push(item);
    else if (diffDays < 7) groups['This week'].push(item);
    else if (diffDays < 30) groups['Last month'].push(item);
    else groups['Older'].push(item);
  }
  return Object.entries(groups)
    .filter(([, v]) => v.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ── History panel ─────────────────────────────────────────────────────

function HistoryPanel({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (conv: HistoryConversation) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? MOCK_HISTORY.filter(h =>
        h.title.toLowerCase().includes(search.toLowerCase()) ||
        h.preview.toLowerCase().includes(search.toLowerCase())
      )
    : MOCK_HISTORY;
  const groups = groupByDate(filtered);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-950 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <History size={11} className="text-sky-400" />
            </div>
            <span className="text-sm font-bold text-white">Chat history</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/50 transition-all">
          <Search size={11} className="text-gray-600 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            autoFocus
            className="flex-1 bg-transparent text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400 transition-colors">
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
              <MessageSquare size={18} className="text-gray-600" />
            </div>
            <p className="text-xs text-gray-600">No conversations match your search</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => { onSelect(conv); onClose(); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${
                            conv.mode === 'plan' ? 'bg-amber-500' : 'bg-sky-500'
                          }`} />
                          <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors truncate leading-snug">
                            {conv.title}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5 group-hover:text-gray-500 transition-colors">
                          {relativeTime(conv.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2 pl-3 group-hover:text-gray-500 transition-colors">
                        {conv.preview}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 pl-3">
                        <MessageSquare size={9} className="text-gray-700" />
                        <span className="text-[10px] text-gray-700">{conv.messageCount} messages</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-white/5">
        <p className="text-[10px] text-gray-700 leading-relaxed text-center">
          Conversations are available for the current session
        </p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────

interface Props {
  initialQuestion?: string;
  onNavigate?: (target: ActionNavTarget) => void;
}

export function AskAIPage({ initialQuestion, onNavigate }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([makeConversation()]);
  const [activeId, setActiveId] = useState<string>(conversations[0].id);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentInitialRef = useRef<string | undefined>(undefined);

  const active = conversations.find(c => c.id === activeId)!;
  const mode = active.mode;
  const activeOutput = active.outputs.find(o => o.id === active.activeOutputId) ?? active.outputs.at(-1) ?? null;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, typing, activeId]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [activeId]);

  useEffect(() => {
    if (initialQuestion && sentInitialRef.current !== initialQuestion) {
      sentInitialRef.current = initialQuestion;
      setTimeout(() => sendMessage(initialQuestion), 200);
    }
  }, [initialQuestion]);

  function newConversation() {
    const conv = makeConversation(mode);
    setConversations(prev => [conv, ...prev]);
    setActiveId(conv.id);
    setInput('');
    setHistoryOpen(false);
  }

  function handleSelectHistory(conv: HistoryConversation) {
    // Design only: start a new conversation pre-titled with the history item's title
    const newConv = makeConversation(conv.mode);
    newConv.title = conv.title;
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newConv.id);
    setInput('');
  }

  function setMode(newMode: ChatMode) {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, mode: newMode } : c));
  }

  function selectOutput(outputId: string) {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, activeOutputId: outputId } : c));
  }

  function attachDoc(doc: AttachedDoc) {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, attachedDoc: doc } : c));
    setPasteOpen(false);
  }

  function removeDoc() {
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, attachedDoc: null } : c));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const content = await extractTextFromFile(file);
    attachDoc({ name: file.name, content, size: file.size });
  }

  function detectLocalClarifyQuestion(q: string): string | null {
    const lower = q.toLowerCase();
    if (/restructur|reorg|reorgani/.test(lower)) {
      return "What kind of restructuring are you exploring — career pathway redesign, org structure changes, headcount adjustments, or something else? And are there specific teams or business goals driving this?";
    }
    if (/strateg|plan|roadmap|priorit/.test(lower) && !/skill|promot|churn|flight/.test(lower)) {
      return "To give you useful strategic recommendations I'd need a bit more context — what's the main business goal or constraint driving this? For example: growth, cost reduction, retention, or capability building?";
    }
    if (/budget|cost|salary|compensation|pay/.test(lower) && !active.attachedDoc) {
      return "Salary and compensation data isn't in the system yet. To answer this, could you upload a file or paste the relevant figures? I can work with a spreadsheet, CSV, or even pasted text.";
    }
    return null;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: trimmed, timestamp: new Date() };
    const outputId = makeId();
    const docContext = active.attachedDoc?.content;

    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const msgs = [...c.messages, userMsg];
      const title = msgs.filter(m => m.role === 'user').length === 1 ? deriveTitle(trimmed) : c.title;
      return { ...c, messages: msgs, title, activeOutputId: outputId };
    }));
    setInput('');
    setTyping(true);

    const response = query(trimmed);

    const withCommitmentPrompt = (text: string, results: QueryResult[]): QueryResult[] => {
      const hasCommitment = results.some(r => r.kind === 'commitment-prompt');
      if (hasCommitment) return results;
      const prompt = buildCommitmentPrompt(trimmed, text);
      prompt.sourceQuery = trimmed;
      return [...results, { kind: 'commitment-prompt', data: prompt }];
    };

    const finalize = (
      text: string,
      results: QueryResult[],
      opts: Partial<Pick<OutputEntry, 'needsMoreContext' | 'contextQuestion' | 'confidence' | 'reasoning' | 'sources' | 'assumptions' | 'ethicsNote' | 'careermindsSuggestion'>> = {}
    ) => {
      const finalResults = withCommitmentPrompt(text, results);
      const aiMsg: ChatMessage = { id: makeId(), role: 'assistant', text, results: finalResults, timestamp: new Date() };
      const output: OutputEntry = { id: outputId, question: trimmed, answer: text, results: finalResults, timestamp: new Date(), ...opts };
      // When the AI needs more context, inject its clarifying question directly into the chat thread
      const clarifyMsg: ChatMessage | null = (opts.needsMoreContext && opts.contextQuestion)
        ? { id: makeId(), role: 'assistant', text: opts.contextQuestion, results: [], timestamp: new Date(), isClarifyQuestion: true }
        : null;
      setConversations(prev => prev.map(c => {
        if (c.id !== activeId) return c;
        const msgs = clarifyMsg
          ? [...c.messages, aiMsg, clarifyMsg]
          : [...c.messages, aiMsg];
        return { ...c, messages: msgs, outputs: [...c.outputs, output], activeOutputId: outputId };
      }));
      setTyping(false);
    };

    const patchReasoning = (
      opts: Partial<Pick<OutputEntry, 'reasoning' | 'sources' | 'assumptions' | 'confidence' | 'ethicsNote' | 'careermindsSuggestion' | 'needsMoreContext' | 'contextQuestion'>>
    ) => {
      setConversations(prev => prev.map(c => ({
        ...c,
        outputs: c.outputs.map(o => o.id === outputId ? { ...o, ...opts } : o),
      })));
    };

    if (response.needsAI) {
      // Detect queries that are likely to require clarification before the AI can help.
      // For these, fire the clarifying question instantly into the chat thread — no AI round-trip needed.
      const localClarifyQuestion = detectLocalClarifyQuestion(trimmed);
      if (localClarifyQuestion) {
        const clarifyMsg: ChatMessage = { id: makeId(), role: 'assistant', text: localClarifyQuestion, results: [], timestamp: new Date(), isClarifyQuestion: true };
        setConversations(prev => prev.map(c => {
          if (c.id !== activeId) return c;
          return { ...c, messages: [...c.messages, clarifyMsg] };
        }));
        setTyping(false);
        return;
      }

      // All other AI questions — wait for full response
      try {
        const aiResp = await callWorkforceAI(trimmed, docContext);

        // If AI still only needs clarification, inject into chat thread, no output panel entry
        if (aiResp.needsMoreContext && aiResp.contextQuestion) {
          const clarifyMsg: ChatMessage = { id: makeId(), role: 'assistant', text: aiResp.contextQuestion, results: [], timestamp: new Date(), isClarifyQuestion: true };
          setConversations(prev => prev.map(c => {
            if (c.id !== activeId) return c;
            return { ...c, messages: [...c.messages, clarifyMsg] };
          }));
          setTyping(false);
          return;
        }

        finalize(aiResp.text, [], {
          needsMoreContext: aiResp.needsMoreContext,
          contextQuestion: aiResp.contextQuestion,
          confidence: aiResp.confidence,
          reasoning: aiResp.reasoning,
          sources: aiResp.sources,
          assumptions: aiResp.assumptions,
          ethicsNote: aiResp.ethicsNote,
          careermindsSuggestion: aiResp.careermindsSuggestion,
        });
      } catch {
        const isBudgetQ = /budget|cost|salary|compensation|pay|spend|% of|percent/i.test(trimmed);
        const fallback = isBudgetQ
          ? "To answer this I'd need financial data — salary bands, budget figures, or compensation totals — which aren't in the system yet. Upload a file or paste the relevant data below and I'll calculate it for you."
          : "I couldn't reach the AI service right now. Try asking about promotions, skills gaps, churn risk, or workforce planning strategies.";
        finalize(fallback, [], { needsMoreContext: isBudgetQ, confidence: 'low', sources: [], assumptions: [] });
      }
      return;
    }

    // Local query — show structured data results immediately
    setTimeout(() => {
      finalize(response.text, response.results ?? [], {
        confidence: 'high',
        sources: ['Structured workforce data'],
      });
    }, 400 + Math.random() * 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  const chips = mode === 'plan' ? PLAN_CHIPS : DIAGNOSE_CHIPS;
  const isEmpty = active.messages.length === 0;

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* ── Chat panel ────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-gray-950 border-r border-white/5 relative overflow-hidden">

        {/* Header */}
        <div className="px-5 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center">
                <Sparkles size={11} className="text-white" />
              </div>
              <span className="text-sm font-bold text-white">Workforce AI</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-400/30 text-sky-100 tracking-wide border border-sky-400/40">BETA</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHistoryOpen(v => !v)}
                title="Chat history"
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  historyOpen ? 'text-sky-400 bg-sky-500/20' : 'text-gray-500 hover:text-white hover:bg-white/10'
                }`}
              >
                <History size={13} />
              </button>
              <button onClick={newConversation} title="New conversation"
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-0 border-b border-white/10" data-tour="ai-mode-tabs">
            <div className="relative group">
              <button onClick={() => setMode('diagnose')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${mode === 'diagnose' ? 'border-sky-400 text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <Search size={10} />Diagnose
              </button>
              <div className="pointer-events-none absolute left-0 top-full mt-2 w-48 bg-gray-800 text-gray-200 text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Surface insights — who's ready for promotion, at churn risk, or where skill gaps are widest.
              </div>
            </div>
            <div className="relative group">
              <button onClick={() => setMode('plan')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${mode === 'plan' ? 'border-amber-400 text-amber-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <Lightbulb size={10} />Plan & Act
              </button>
              <div className="pointer-events-none absolute left-0 top-full mt-2 w-48 bg-gray-800 text-gray-200 text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                Get actionable strategies — hiring plans, retention plays, restructuring ideas, and scenario analysis.
              </div>
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-tour="ai-suggestions">
          {isEmpty ? (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">Try asking</p>
              {(mode === 'plan' ? PLANNING_PROMPTS : SUGGESTED_PROMPTS).slice(0, 6).map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)}
                  className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all flex items-start gap-2 group ${
                    mode === 'plan'
                      ? 'bg-white/5 border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300 hover:bg-amber-500/10'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-sky-500/40 hover:text-sky-300 hover:bg-sky-500/10'
                  }`}>
                  <ChevronRight size={11} className="mt-0.5 flex-shrink-0 text-gray-600 group-hover:text-current transition-colors" />
                  {p}
                </button>
              ))}
              <div className="pt-2 border-t border-white/10 mt-1">
                <button onClick={() => sendMessage('How can Careerminds support me?')}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xl border transition-all flex items-center gap-2 group bg-teal-500/10 border-teal-500/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400/50">
                  <Sparkles size={11} className="flex-shrink-0 text-teal-400" />
                  How can Careerminds support me?
                </button>
              </div>
            </div>
          ) : (
            <>
              {active.messages.map((msg, msgIdx) => {
                const isUser = msg.role === 'user';
                const linkedOutput = isUser ? active.outputs.find(o => o.question === msg.text) : null;
                const isActiveOutput = linkedOutput && activeOutput?.id === linkedOutput.id;
                const isClarifyQuestion = !isUser && !!msg.isClarifyQuestion;

                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    {isUser ? (
                      <button
                        onClick={() => linkedOutput && selectOutput(linkedOutput.id)}
                        className={`max-w-[90%] text-left text-xs px-3 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed transition-all ${
                          isActiveOutput
                            ? 'bg-sky-500 text-white ring-2 ring-sky-400/40'
                            : 'bg-white/10 text-gray-200 hover:bg-white/15'
                        }`}>
                        {msg.text}
                      </button>
                    ) : isClarifyQuestion ? (
                      <div className="flex items-start gap-2 max-w-[95%]">
                        <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle size={9} className="text-amber-400" />
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tl-sm px-3 py-2.5">
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">More context needed</p>
                          <p className="text-xs text-amber-200 leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 max-w-[95%]">
                        <div className="w-5 h-5 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles size={9} className="text-sky-400" />
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{msg.text}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {typing && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={9} className="text-sky-400" />
                  </div>
                  <div className="flex gap-1 px-2.5 py-2 bg-white/10 rounded-2xl rounded-tl-sm">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              {active.outputs.length > 1 && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">All results</p>
                  <div className="space-y-1">
                    {active.outputs.map(o => (
                      <button key={o.id} onClick={() => selectOutput(o.id)}
                        className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-all truncate ${
                          activeOutput?.id === o.id
                            ? 'bg-sky-500/20 text-sky-300 font-medium'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}>
                        {o.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick chips */}
        {!isEmpty && (
          <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto flex-shrink-0">
            {chips.map((chip, i) => (
              <button key={i} onClick={() => sendMessage(chip.label)} title={chip.label}
                className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                  mode === 'plan'
                    ? 'text-gray-500 border-white/10 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10'
                    : 'text-gray-500 border-white/10 hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10'
                }`}>
                {chip.icon}
              </button>
            ))}
          </div>
        )}

        {/* Attached doc pill */}
        {active.attachedDoc && (
          <div className="mx-4 mb-2 flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-xl px-3 py-2">
            <FileText size={11} className="text-teal-400 flex-shrink-0" />
            <span className="text-[11px] text-teal-300 font-medium truncate flex-1">{active.attachedDoc.name}</span>
            <span className="text-[10px] text-teal-500 flex-shrink-0">{formatBytes(active.attachedDoc.size)}</span>
            <button onClick={removeDoc} className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-teal-600 hover:text-teal-300 transition-colors ml-1">
              <X size={10} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className={`flex items-start gap-2 bg-white/5 border rounded-xl px-3 py-2.5 transition-all ${
            mode === 'plan'
              ? 'border-white/10 focus-within:border-amber-500/50 focus-within:bg-amber-500/5'
              : 'border-white/10 focus-within:border-sky-500/50 focus-within:bg-sky-500/5'
          }`}>
            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach a file"
              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-teal-400 transition-colors flex-shrink-0 mb-0.5"
            >
              <Paperclip size={13} />
            </button>
            <textarea
              ref={inputRef}
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'plan' ? 'Ask for a plan or strategy…' : 'Ask about your workforce…'}
              className="flex-1 resize-none bg-transparent text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none leading-5 max-h-36"
              style={{ overflowY: input.split('\n').length > 6 ? 'auto' : 'hidden' }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || typing}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all flex-shrink-0 ${
                mode === 'plan' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-sky-500 hover:bg-sky-400'
              }`}>
              <Send size={12} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <Clock size={9} className="text-gray-700" />
              <span className="text-[10px] text-gray-700">Resets on refresh</span>
            </div>
            <button
              onClick={() => setPasteOpen(true)}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-teal-400 transition-colors"
            >
              <ClipboardPaste size={9} />
              Paste data
            </button>
          </div>
        </div>

        {/* ── History overlay ──────────────────────────────────────── */}
        {historyOpen && (
          <HistoryPanel
            onClose={() => setHistoryOpen(false)}
            onSelect={handleSelectHistory}
          />
        )}
      </div>

      {/* ── Output panel ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-white" data-tour="ai-output-panel">
        {activeOutput
          ? <OutputPanel
              entry={activeOutput}
              onSend={sendMessage}
              onNavigate={onNavigate}
              onUpload={() => fileInputRef.current?.click()}
              onPaste={() => setPasteOpen(true)}
            />
          : <EmptyOutput mode={mode} />
        }
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.json,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Paste modal */}
      {pasteOpen && <PasteModal onAttach={attachDoc} onClose={() => setPasteOpen(false)} />}

    </div>
  );
}
