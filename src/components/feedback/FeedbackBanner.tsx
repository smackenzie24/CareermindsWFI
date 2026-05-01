import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { FeedbackFlow } from './FeedbackFlow';

interface Props {
  context: string;
  className?: string;
}

export function FeedbackBanner({ context, className = '' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center justify-between gap-6 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-5 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
            <Pencil size={14} className="text-teal-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              Shape what gets built next
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tell us what's missing and what would make this genuinely useful for your work.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 active:scale-95 transition-all duration-150"
        >
          Share your thoughts
        </button>
      </div>

      {open && <FeedbackFlow context={context} onClose={() => setOpen(false)} />}
    </>
  );
}