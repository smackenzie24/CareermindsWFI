import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Sparkles, MessageSquare, Star, ChevronRight } from 'lucide-react';

type Step = 'rating' | 'text' | 'research' | 'done';

interface Props {
  onClose: () => void;
  context: string; // which view triggered it
}

const RATING_OPTIONS = [
  { value: 1, emoji: '😕', label: 'Not useful' },
  { value: 2, emoji: '😐', label: 'Somewhat' },
  { value: 3, emoji: '🙂', label: 'Useful' },
  { value: 4, emoji: '😊', label: 'Really useful' },
  { value: 5, emoji: '🤩', label: 'Love it' },
];

function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ['rating', 'text', 'research'];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`rounded-full transition-all duration-300 ${
            step === 'done'
              ? 'w-1.5 h-1.5 bg-emerald-400'
              : s === step
              ? 'w-4 h-1.5 bg-gray-900'
              : steps.indexOf(step) > i
              ? 'w-1.5 h-1.5 bg-gray-400'
              : 'w-1.5 h-1.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export function FeedbackFlow({ onClose, context }: Props) {
  const [step, setStep] = useState<Step>('rating');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [wantsCall, setWantsCall] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  function nextStep() {
    if (step === 'rating') setStep('text');
    else if (step === 'text') setStep('research');
    else if (step === 'research') setStep('done');
  }

  const displayRating = hoveredRating ?? rating;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center pointer-events-none"
      style={{ padding: '0 0 80px 0' }}
    >
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-gray-950/30 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-350 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative pointer-events-auto w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-350 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={13} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {step === 'done' ? 'Thank you' : 'Your feedback'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressDots step={step} />
            <button
              onClick={handleClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-5">

          {/* Step 1: Rating */}
          {step === 'rating' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                How useful is this for your day-to-day?
              </h2>
              <p className="text-xs text-gray-400 mb-5">
                You're on <span className="font-medium text-gray-600">{context}</span>. Your rating helps us prioritise.
              </p>
              <div className="flex items-center gap-2 mb-5">
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRating(opt.value)}
                    onMouseEnter={() => setHoveredRating(opt.value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-150 ${
                      rating === opt.value
                        ? 'bg-gray-900 border-gray-900'
                        : 'bg-gray-50 border-gray-100 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-150 ${
                      displayRating !== null && displayRating >= opt.value ? 'scale-110' : 'scale-100'
                    }`}>
                      {opt.emoji}
                    </span>
                    <span className={`text-[9px] font-semibold leading-tight text-center ${
                      rating === opt.value ? 'text-white' : 'text-gray-400'
                    }`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={nextStep}
                disabled={rating === null}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2: Free text */}
          {step === 'text' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">
                What's missing, or what would make this more useful?
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Data points, new views, workflow improvements — anything goes. Be as blunt as you like.
              </p>
              <textarea
                ref={textareaRef}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="e.g. I wish I could see attrition risk per manager, or export the gap report as a PDF..."
                rows={4}
                className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setStep('research')}
                  className="flex-1 text-sm text-gray-400 hover:text-gray-600 py-3 transition-colors text-center"
                >
                  Skip
                </button>
                <button
                  onClick={nextStep}
                  className="flex-[3] flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Research opt-in */}
          {step === 'research' && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-amber-400" />
                <h2 className="text-base font-bold text-gray-900">
                  Help shape the roadmap
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                We do short product calls with people using this in the real world. 20 minutes, no pitch — just honest conversation about what would make this genuinely better.
              </p>

              {wantsCall === null && (
                <div className="flex gap-2 mb-0">
                  <button
                    onClick={() => setWantsCall(true)}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-900 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all"
                  >
                    I'm in
                  </button>
                  <button
                    onClick={() => { setWantsCall(false); setTimeout(nextStep, 0); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-all"
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
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                  />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Work email"
                    type="email"
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all"
                  />
                  <button
                    onClick={nextStep}
                    disabled={!name.trim() || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold transition-all hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Submit feedback <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Star size={20} className="text-emerald-500" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-2">
                Thank you.
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                {wantsCall
                  ? "We'll be in touch to set up a call. Your input directly influences what we build next."
                  : 'Your feedback goes straight to the team. We read every response.'}
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all"
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