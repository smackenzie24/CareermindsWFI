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
  'Promotion Pipeline':    { question: 'Does this pipeline reflect how you actually think about readiness?', sub: 'Share what\'s missing from the promotion picture.' },
  'Manager Effectiveness': { question: 'Are these manager metrics helping you have better conversations?', sub: 'Tell us what signals you wish you had.' },
  'Industry Benchmarks':   { question: 'Are you benchmarking against the right peers?', sub: 'Let us know what comparisons would be most useful.' },
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
      <div className={`flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={14} className="text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              {copy.question}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              {copy.sub}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all whitespace-nowrap shadow-sm"
        >
          <MessageSquare size={11} />
          Share feedback
        </button>
      </div>

      {open && <FeedbackFlow context={context} onClose={() => setOpen(false)} />}
    </>
  );
}
