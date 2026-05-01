import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.right > vw - 16) {
      el.style.left = `${pos.x - rect.width - 12}px`;
    } else {
      el.style.left = `${pos.x + 12}px`;
    }
    el.style.top = `${pos.y - rect.height / 2}px`;
  }, [visible, pos]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{ left: pos.x + 12, top: pos.y }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2.5 min-w-[180px] border border-gray-700">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
