import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { TOUR_STEPS, type ActiveView } from './tourData';

interface TourOverlayProps {
  activeView: ActiveView;
  onClose: () => void;
}

interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getAnchorRect(tourId: string): AnchorRect | null {
  const el = document.querySelector(`[data-tour="${tourId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

const CARD_W = 288;
const GAP = 16;
const MARGIN = 8;

function computeCardPosition(
  dotX: number,
  dotY: number,
  side: 'right' | 'left' | 'top' | 'bottom',
  cardH: number,
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clampX = (x: number) => Math.max(MARGIN, Math.min(x, vw - CARD_W - MARGIN));
  const clampY = (y: number) => Math.max(MARGIN, Math.min(y, vh - cardH - MARGIN));

  switch (side) {
    case 'right':
      return { position: 'fixed', left: clampX(dotX + GAP), top: clampY(dotY - cardH / 2) };
    case 'left':
      return { position: 'fixed', left: clampX(dotX - CARD_W - GAP), top: clampY(dotY - cardH / 2) };
    case 'bottom':
      return { position: 'fixed', left: clampX(dotX - CARD_W / 2), top: clampY(dotY + GAP) };
    case 'top':
      return { position: 'fixed', left: clampX(dotX - CARD_W / 2), top: clampY(dotY - cardH - GAP) };
  }
}

interface CardProps {
  step: (typeof TOUR_STEPS)[number];
  viewSteps: typeof TOUR_STEPS;
  localIdx: number;
  isFirst: boolean;
  isLast: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
  dotPos: { x: number; y: number } | null;
  cardRef: React.RefObject<HTMLDivElement>;
  style: React.CSSProperties;
}

function TourCard({ step, viewSteps, localIdx, isFirst, isLast, onClose, onPrev, onNext, onGoTo, style, cardRef }: CardProps) {
  const maxBodyH = Math.max(60, window.innerHeight - 180); // header + footer ~120px, margins

  return (
    <div
      ref={cardRef}
      className="z-[210] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={{ ...style, width: CARD_W, maxHeight: window.innerHeight - MARGIN * 2 }}
    >
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
            <BookOpen size={12} className="text-sky-600" />
          </div>
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Tour mode</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
        >
          <X size={12} />
        </button>
      </div>

      {/* Content — scrollable if overflows */}
      <div className="px-4 pb-3 overflow-y-auto flex-1" style={{ maxHeight: maxBodyH }}>
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">{step.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
      </div>

      {/* Footer nav — always visible */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 bg-gray-50/60 flex-shrink-0">
        <div className="flex items-center gap-1">
          {viewSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === localIdx ? 'bg-sky-500 w-4' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={onNext}
            className={`flex items-center gap-1 text-xs font-semibold px-3 h-7 rounded-lg transition-all border ${
              isLast
                ? 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {isLast ? 'Done' : (<>Next <ChevronRight size={11} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TourOverlay({ activeView, onClose }: TourOverlayProps) {
  const viewSteps = TOUR_STEPS.filter(s => s.view === activeView);
  const [localIdx, setLocalIdx] = useState(0);
  const [dotPos, setDotPos] = useState<{ x: number; y: number } | null>(null);
  const [cardH, setCardH] = useState(220);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = viewSteps[localIdx];

  const updateDotPos = useCallback(() => {
    if (!step) return;
    const rect = getAnchorRect(step.anchorId);
    if (!rect) { setDotPos(null); return; }
    const x = rect.x + rect.width * step.anchorOffsetX;
    const y = rect.y + rect.height * step.anchorOffsetY;
    setDotPos({ x, y });
  }, [step]);

  // Measure actual card height after render
  useEffect(() => {
    if (cardRef.current) {
      setCardH(cardRef.current.offsetHeight);
    }
  });

  // Reset step when view changes
  useEffect(() => { setLocalIdx(0); }, [activeView]);

  // Recalculate dot position when step changes or on scroll/resize
  useEffect(() => {
    updateDotPos();
    const t = setTimeout(updateDotPos, 120);
    window.addEventListener('scroll', updateDotPos, true);
    window.addEventListener('resize', updateDotPos);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', updateDotPos, true);
      window.removeEventListener('resize', updateDotPos);
    };
  }, [updateDotPos]);

  if (viewSteps.length === 0) return null;
  if (!step) return null;

  const isFirst = localIdx === 0;
  const isLast = localIdx === viewSteps.length - 1;

  const cardStyle = dotPos
    ? computeCardPosition(dotPos.x, dotPos.y, step.side, cardH)
    : { position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      {/* Dim overlay */}
      <div className="fixed inset-0 z-[200] pointer-events-none bg-gray-950/25" />

      {/* Pulsing anchor dot */}
      {dotPos && (
        <div
          className="fixed z-[210] pointer-events-none"
          style={{ left: dotPos.x, top: dotPos.y, transform: 'translate(-50%, -50%)' }}
        >
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 ring-2 ring-white shadow-lg" />
          </span>
        </div>
      )}

      <TourCard
        step={step}
        viewSteps={viewSteps}
        localIdx={localIdx}
        isFirst={isFirst}
        isLast={isLast}
        onClose={onClose}
        onPrev={() => setLocalIdx(i => i - 1)}
        onNext={() => isLast ? onClose() : setLocalIdx(i => i + 1)}
        onGoTo={setLocalIdx}
        dotPos={dotPos}
        cardRef={cardRef}
        style={cardStyle}
      />
    </>
  );
}