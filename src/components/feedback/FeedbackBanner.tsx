import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackFlow } from './FeedbackFlow';

interface Props {
  context: string;
  className?: string;
}

const CONTEXT_COPY: Record<string, { question: string; sub: string }> = {
  'Skills Heatmap':        { question: 'Is this heatmap surfacing the gaps that matter most to you?', sub: 'Tell us what data or filters would make it more actionable.' },
  'Skills Overview':       { question: 'Does this department view help you plan development conversations?', sub: 'We\'d love to know what\'s missing from the skills picture.' },
  'Areas to Improve':      { question: 'Is this gap report giving you what you need to make a case?', sub: 'Tell us what would make this report more useful in practice.' },
  'Talent Signals':        { question: 'Does this view reflect how you actually think about readiness?', sub: 'Share what\'s missing from the talent picture.' },
  'Manager Effectiveness': { question: 'Are these manager metrics helping you have better conversations?', sub: 'Tell us what signals you wish you had.' },
  'Industry Benchmarks':   { question: 'Are you benchmarking against the right peers?', sub: 'Let us know what comparisons would be most useful.' },
  'Talent Intelligence':   { question: 'Is this market intelligence changing how you think about your workforce?', sub: 'Tell us which signals are most useful and what\'s missing.' },
  'Executive Summary':     { question: 'Is this summary giving you what you need before a leadership meeting?', sub: 'Tell us what signals belong on this page.' },
  'Decisions Journal':     { question: 'Is the journal helping you follow through on commitments?', sub: 'Tell us how we can make it a better accountability tool.' },
};

function getContextCopy(context: string) {
  return CONTEXT_COPY[context] ?? {
    question: 'Is this view useful for your work?',
    sub: 'Tell us what\'s missing or what would make it better.',
  };
}

export function FeedbackBanner({ context, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const copy = getContextCopy(context);

  return (
    <>
      <div className={`relative flex items-center justify-between gap-6 overflow-hidden rounded-2xl px-6 py-5 ${className}`}
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)' }}
      >
        {/* subtle background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10"
          style={{ background: 'radial-gradient(ellipse at right center, white 0%, transparent 70%)' }}
        />

        <div className="relative flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
            <MessageSquare size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-snug">
              {copy.question}
            </p>
            <p className="text-xs text-blue-100 mt-0.5 hidden sm:block">
              {copy.sub}
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="relative flex-shrink-0 flex items-center gap-2 text-sm font-bold text-brand-blue bg-white hover:bg-brand-blue-bg4 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-px"
        >
          <MessageSquare size={13} />
          Share feedback
        </button>
      </div>

      {open && <FeedbackFlow context={context} onClose={() => setOpen(false)} />}
    </>
  );
}
