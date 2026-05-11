import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Sparkles, MessageSquare, Star, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Step = 'rating' | 'text' | 'research' | 'done';

interface Props {
  onClose: () => void;
  context: string;
}

const RATING_OPTIONS = [
  { value: 1, label: 'Not useful' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Useful' },
  { value: 4, label: 'Really useful' },
  { value: 5, label: 'Love it' },
];

const RATING_FILLS = [
  // value 1–5: bg colour for selected state
  'bg-red-500 border-red-500',
  'bg-orange-400 border-orange-400',
  'bg-amber-400 border-amber-400',
  'bg-teal-500 border-teal-500',
  'bg-emerald-500 border-emerald-500',
];

function ProgressBar({ step }: { step: Step }) {
  const order: Step[] = ['rating', 'text', 'research', 'done'];
  const idx = order.indexOf(step);
  const pct = step === 'done' ? 100 : Math.round((idx / 3) * 100);
  return (
    <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

async function saveFeedback(payload: {
  context: string;
  rating: number | null;
  feedback_text: string;
  wants_research_call: boolean;
  researcher_name: string;
  researcher_email: string;
}) {
  await supabase.from('feedback').insert({
    context: payload.context,
    rating: payload.rating,
    feedback_text: payload.feedback_text.trim() || null,
    wants_research_call: payload.wants_research_call,
    researcher_name: payload.researcher_name.trim() || null,
    researcher_email: payload.researcher_email.trim() || null,
  });
  // Errors are intentionally swallowed — feedback submission must never break the UI
}

export function FeedbackFlow({ onClose, context }: Props) {
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [wantsCall, setWantsCall] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (step === 'text' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [step]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 350);
  }

  async function finish(callWanted: boolean, resName: string, resEmail: string) {
    setSubmitting(true);
    await saveFeedback({
      context,
      rating,
      feedback_text: feedbackText,
      wants_research_call: callWanted,
      researcher_name: resName,
      researcher_email: resEmail,
    });
    setWantsCall(callWanted);
    setSubmitting(false);
    setStep('done');
  }

  const displayRating = hoveredRating ?? rating;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none px-4">
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-gray-950/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-350 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-350 ease-out ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
        }`}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={13} className="text-white" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {step === 'done' ? 'Thank you' : 'Your feedback'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <ProgressBar step={step} />
        </div>

        {/* Step content */}
        <div className="px-6 pb-6">

          {/* ── Step 1: Rating ──────────────────────────────────────────── */}
          {step === 'rating' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                How useful is this for your day-to-day?
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                You're on{' '}
                <span className="font-semibold text-gray-600">{context}</span>.
                Your rating helps us prioritise what to build next.
              </p>

              <div className="flex items-center gap-2 mb-5">
                {RATING_OPTIONS.map(opt => {
                  const isSelected = rating === opt.value;
                  const isHighlighted = displayRating !== null && displayRating >= opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRating(opt.value)}
                      onMouseEnter={() => setHoveredRating(opt.value)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`flex-1 flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? `${RATING_FILLS[opt.value - 1]} shadow-sm`
                          : isHighlighted
                          ? 'bg-gray-50 border-gray-300 scale-105'
                          : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <span className={`text-lg font-bold transition-all duration-150 ${
                        isSelected ? 'text-white' : 'text-gray-700'
                      }`}>
                        {opt.value}
                      </span>
                      <span className={`text-[9px] font-semibold leading-tight text-center transition-colors ${
                        isSelected ? 'text-white/90' : 'text-gray-400'
                      }`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Rating scale labels */}
              <div className="flex justify-between text-[9px] text-gray-300 font-medium mb-5 -mt-2 px-1">
                <span>Not useful</span>
                <span>Love it</span>
              </div>

              <button
                onClick={() => setStep('text')}
                disabled={rating === null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Step 2: Free text ─────────────────────────────────────── */}
          {step === 'text' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                What's missing, or what would make this more useful?
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Data points, new views, workflow improvements — anything goes.
                Be as blunt as you like.
              </p>
              <textarea
                ref={textareaRef}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="e.g. I wish I could see attrition risk per manager, or export the gap report as a PDF…"
                rows={4}
                className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setStep('research')}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-600 py-3 transition-colors text-center rounded-xl hover:bg-gray-50"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep('research')}
                  className="flex-[3] flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Research opt-in ─────────────────────────────── */}
          {step === 'research' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-amber-400" />
                <h2 className="text-base font-bold text-gray-900">
                  Help shape the roadmap
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                We do short product calls with people using this in the real world.
                20 minutes, no pitch — just honest conversation about what would
                make this genuinely better.
              </p>

              {wantsCall === null && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setWantsCall(true)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-900 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all"
                  >
                    I'm in
                  </button>
                  <button
                    onClick={() => finish(false, '', '')}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Maybe later
                  </button>
                </div>
              )}

              {wantsCall === true && (
                <div className="space-y-2.5">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                  />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Work email"
                    type="email"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && name.trim() && email.trim()) {
                        finish(true, name, email);
                      }
                    }}
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                  />
                  <button
                    onClick={() => finish(true, name, email)}
                    disabled={!name.trim() || !email.trim() || submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      <>Submit feedback <ChevronRight size={14} /></>
                    )}
                  </button>
                  <button
                    onClick={() => setWantsCall(null)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors text-center"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Done ─────────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Star size={22} className="text-emerald-500" fill="currentColor" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-2">
                Thank you.
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs mx-auto">
                {wantsCall
                  ? "We'll be in touch to set up a call. Your input directly influences what we build next."
                  : 'Your feedback goes straight to the team. We read every response.'}
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
