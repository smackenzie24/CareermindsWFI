import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Upload,
  Clipboard,
  ExternalLink,
  Scale,
  Database,
  Sliders,
  ListChecks,
  AlertOctagon,
  GitBranch,
} from 'lucide-react';

export interface ReasoningStep {
  label: string;
  detail: string;
  dataPoint: string;
}

export interface KeySignal {
  signal: string;
  howUsed: string;
  threshold: string;
  limitation: string;
}

export interface StructuredReasoning {
  summary: string;
  methodology: string;
  steps: ReasoningStep[];
  keySignals: KeySignal[];
  whatWasNotConsidered: string[];
  alternativeInterpretations: string[];
}

// ── Shared popover primitive ──────────────────────────────────────────────────

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  minWidth?: number;
}

function Popover({ open, onClose, anchorRef, children, minWidth = 260 }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover below the anchor element
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
    });
  }, [open, anchorRef]);

  if (!open) return null;

  return (
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={popoverRef}
        className="absolute z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-xs text-gray-600 leading-relaxed"
        style={{
          top: coords.top,
          left: coords.left,
          minWidth,
          maxWidth: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

// ── 1. HumanDecisionBar ───────────────────────────────────────────────────────

export function HumanDecisionBar() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
      <span className="text-[11px] text-gray-400 font-medium">
        AI surfaces patterns — people make decisions.
      </span>
      <EthicsBadge />
    </div>
  );
}

// ── 2. ConfidenceBadge ────────────────────────────────────────────────────────

interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}

const CONFIDENCE_CONFIG = {
  high: {
    label: 'High confidence',
    shortLabel: 'High',
    icon: ShieldCheck,
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
    heading: 'High Confidence',
    meaning:
      'The AI has sufficient data points to give a reliable answer. The signals are consistent and drawn from multiple sources.',
  },
  medium: {
    label: 'Medium confidence',
    shortLabel: 'Medium',
    icon: AlertCircle,
    pill: 'bg-amber-100 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    heading: 'Medium Confidence',
    meaning:
      'The answer is directionally sound but based on partial data. Treat as a starting point and verify with additional context.',
  },
  low: {
    label: 'Low confidence',
    shortLabel: 'Low',
    icon: AlertTriangle,
    pill: 'bg-orange-100 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
    heading: 'Low Confidence',
    meaning:
      'The AI doesn\'t have enough context to give a reliable answer. Review the sources below and consider uploading additional data.',
  },
};

export function ConfidenceBadge({ confidence, sources }: ConfidenceBadgeProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const cfg = CONFIDENCE_CONFIG[confidence];
  const Icon = cfg.icon;

  return (
    <span className="relative inline-flex">
      <button
        ref={anchorRef}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer transition-opacity hover:opacity-80 ${cfg.pill}`}
        aria-label={`Confidence: ${cfg.heading}. Click for details.`}
      >
        <Icon size={11} className={cfg.iconColor} />
        {cfg.shortLabel}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} minWidth={272}>
        <p className="font-semibold text-gray-800 mb-1">{cfg.heading}</p>
        <p className="text-gray-500 mb-3">{cfg.meaning}</p>

        {sources.length > 0 && (
          <>
            <p className="font-semibold text-gray-700 mb-1">Data sources used</p>
            <ul className="space-y-0.5 mb-3">
              {sources.map((s) => (
                <li key={s} className="flex items-center gap-1.5 text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </>
        )}

        {confidence === 'low' && (
          <p className="text-orange-600 font-medium">
            Low confidence means the AI needs more context. Try uploading a relevant document or pasting additional data.
          </p>
        )}
      </Popover>
    </span>
  );
}

// ── 3. EthicsBadge ────────────────────────────────────────────────────────────

export function EthicsBadge() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <span className="relative inline-flex">
      <button
        ref={anchorRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200 cursor-pointer transition-opacity hover:opacity-80"
        aria-label="Fairness-checked. Click for details."
      >
        <Scale size={10} />
        Fairness-checked
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} minWidth={288}>
        <p className="font-semibold text-gray-800 mb-2">Fairness-checked</p>

        <p className="font-medium text-gray-700 mb-1">Signals used</p>
        <p className="text-gray-500 mb-3">
          Role performance, promotion readiness, skill ratings, tenure, check-in recency, flight risk (behavioural signals only).
        </p>

        <p className="font-medium text-gray-700 mb-1">Never factored in</p>
        <p className="text-gray-500 mb-3">
          Age, gender, race, ethnicity, religion, disability, or any other protected characteristic.
        </p>

        <p className="text-teal-700 font-medium bg-teal-50 rounded-lg px-3 py-2">
          AI recommendations are advisory only. A human manager must review and approve all people decisions.
        </p>
      </Popover>
    </span>
  );
}

// ── 4. ReasoningAccordion ─────────────────────────────────────────────────────

interface ReasoningAccordionProps {
  reasoning: StructuredReasoning | string[] | null | undefined;
  sources: string[];
  assumptions: string[];
  ethicsNote?: string | null;
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function ReasoningAccordion({ reasoning, sources, assumptions, ethicsNote }: ReasoningAccordionProps) {
  const [open, setOpen] = useState(false);

  const isStructured = reasoning && !Array.isArray(reasoning);
  const isLegacyArray = Array.isArray(reasoning) && reasoning.length > 0;
  const structured = isStructured ? (reasoning as StructuredReasoning) : null;

  const hasContent = isStructured || isLegacyArray || sources.length > 0 || assumptions.length > 0 || ethicsNote;
  if (!hasContent) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between px-5 py-4 text-left group hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <ListChecks size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-sm font-bold text-slate-700">How this recommendation was reached</span>
          </div>
          {/* Always-visible summary line */}
          {structured?.summary ? (
            <p className="text-xs text-slate-500 leading-relaxed">{structured.summary}</p>
          ) : (
            <p className="text-xs text-slate-400">Click to see the full reasoning audit trail</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {open
            ? <ChevronUp size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            : <ChevronDown size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100">

          {structured ? (
            <div className="divide-y divide-slate-100">

              {/* ── Methodology ─────────────────────────────────────── */}
              {structured.methodology && (
                <div className="px-5 py-4 bg-slate-50/50">
                  <p className="text-xs text-slate-600 leading-relaxed">{structured.methodology}</p>
                </div>
              )}

              {/* ── Step-by-step process ─────────────────────────────── */}
              {structured.steps?.length > 0 && (
                <div className="px-5 py-4">
                  <SectionHeading icon={<ListChecks size={11} className="text-slate-500" />} label="Analysis steps" />
                  <ol className="space-y-3">
                    {structured.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          {i < structured.steps.length - 1 && (
                            <div className="w-px flex-1 bg-sky-100 mt-1 mb-0" />
                          )}
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-xs font-semibold text-slate-700 mb-0.5">{step.label}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{step.detail}</p>
                          {step.dataPoint && (
                            <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1">
                              <Database size={9} className="text-sky-500 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-sky-700">{step.dataPoint}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* ── Key signals ──────────────────────────────────────── */}
              {structured.keySignals?.length > 0 && (
                <div className="px-5 py-4">
                  <SectionHeading icon={<Sliders size={11} className="text-slate-500" />} label="Signals used" />
                  <div className="space-y-3">
                    {structured.keySignals.map((sig, i) => (
                      <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-xs font-bold text-slate-700">{sig.signal}</span>
                          {sig.threshold && (
                            <span className="flex-shrink-0 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                              Threshold: {sig.threshold}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5">{sig.howUsed}</p>
                        {sig.limitation && (
                          <div className="flex items-start gap-1.5">
                            <AlertCircle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 leading-relaxed">{sig.limitation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── What was not considered ───────────────────────────── */}
              {structured.whatWasNotConsidered?.length > 0 && (
                <div className="px-5 py-4">
                  <SectionHeading icon={<AlertOctagon size={11} className="text-slate-500" />} label="What was not considered" />
                  <ul className="space-y-1.5">
                    {structured.whatWasNotConsidered.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Alternative interpretations ──────────────────────── */}
              {structured.alternativeInterpretations?.length > 0 && (
                <div className="px-5 py-4">
                  <SectionHeading icon={<GitBranch size={11} className="text-slate-500" />} label="Alternative interpretations" />
                  <ul className="space-y-1.5">
                    {structured.alternativeInterpretations.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-300 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Assumptions ──────────────────────────────────────── */}
              {assumptions.length > 0 && (
                <div className="px-5 py-4">
                  <SectionHeading icon={<AlertCircle size={11} className="text-slate-500" />} label="Assumptions made" />
                  <ul className="space-y-1.5">
                    {assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <AlertCircle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Ethics note ──────────────────────────────────────── */}
              {ethicsNote && (
                <div className="px-5 py-4">
                  <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale size={12} className="text-teal-600" />
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">Ethics note</span>
                    </div>
                    <p className="text-xs text-teal-700 leading-relaxed">{ethicsNote}</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* ── Legacy flat array fallback ─────────────────────── */
            <div className="px-5 py-4 space-y-4">
              {isLegacyArray && (
                <div>
                  <SectionHeading icon={<ListChecks size={11} className="text-slate-500" />} label="Reasoning steps" />
                  <ol className="space-y-2">
                    {(reasoning as string[]).map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-[9px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {sources.length > 0 && (
                <div>
                  <SectionHeading icon={<Database size={11} className="text-slate-500" />} label="Sources" />
                  <ul className="space-y-1">
                    {sources.map((s) => (
                      <li key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ethicsNote && (
                <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
                  <p className="text-xs text-teal-700">{ethicsNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 5. CareermindsCard ────────────────────────────────────────────────────────

interface CareermindsCardProps {
  suggestion: { product: string; reason: string } | null;
}

export function CareermindsCard({ suggestion }: CareermindsCardProps) {
  if (!suggestion) return null;

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3.5 flex items-start gap-3">
      {/* Brand mark */}
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center mt-0.5">
        <ExternalLink size={14} className="text-teal-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
            Careerminds
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-white/70 border border-slate-200 rounded-full px-2 py-0.5">
            {suggestion.product}
          </span>
        </div>
        <p className="text-[12px] text-slate-600 leading-snug mb-2.5">{suggestion.reason}</p>
        <button className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 hover:underline underline-offset-2 transition-colors">
          Learn more
          <ExternalLink size={10} />
        </button>
      </div>
    </div>
  );
}

// ── 6. ContextRequestBanner ───────────────────────────────────────────────────

interface ContextRequestBannerProps {
  question: string;
  onUpload: () => void;
  onPaste: () => void;
}

export function ContextRequestBanner({ question, onUpload, onPaste }: ContextRequestBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center mt-0.5">
          <AlertCircle size={14} className="text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
            More context needed
          </p>
          <p className="text-sm text-amber-800 leading-snug mb-3">{question}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors"
            >
              <Upload size={11} />
              Upload file
            </button>
            <button
              onClick={onPaste}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
            >
              <Clipboard size={11} />
              Paste data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
