import { ArrowUp } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface CellData {
  skill: string;
  department: string;
  averageActual: number;
  expectedLevel: number;
  headcount: number;
  belowTarget: number;
  team?: string;
  location?: string;
}

interface HeatmapCellProps {
  data: CellData | null;
  onClick?: () => void;
  selected?: boolean;
}

function getGapScore(actual: number, expected: number): number {
  // Negative = exceeding (surplus), positive = deficit
  return expected - actual;
}

function isExceeding(actual: number, expected: number): boolean {
  return actual > expected;
}

function getGapColor(gap: number, headcount: number, exceeding: boolean): string {
  if (headcount === 0) return 'bg-gray-50 border-gray-200';
  if (exceeding) return 'bg-slate-700 border-slate-800';
  if (gap < 0.3) return 'bg-gray-100 border-gray-200';
  if (gap < 0.8) return 'bg-slate-100 border-slate-200';
  if (gap < 1.4) return 'bg-slate-200 border-slate-300';
  if (gap < 2.0) return 'bg-red-100 border-red-200';
  return 'bg-red-200 border-red-300';
}

function getTextColor(gap: number, exceeding: boolean): string {
  if (exceeding) return 'text-white';
  if (gap < 0.3) return 'text-gray-500';
  if (gap < 0.8) return 'text-slate-600';
  if (gap < 1.4) return 'text-slate-700';
  return 'text-red-700';
}

function getLabel(pct: number, exceeding: boolean): string {
  if (exceeding) return 'exceeding';
  if (pct < 30) return 'on track';
  if (pct < 50) return 'developing';
  if (pct < 70) return 'at risk';
  return 'critical';
}

function getPctBelowTarget(belowTarget: number, headcount: number): number {
  if (headcount === 0) return 0;
  return Math.round((belowTarget / headcount) * 100);
}

export function HeatmapCell({ data, onClick, selected }: HeatmapCellProps) {
  if (!data) {
    return (
      <div className="w-full h-14 rounded-md bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
        <span className="text-gray-300 text-xs">—</span>
      </div>
    );
  }

  const rawGap = getGapScore(data.averageActual, data.expectedLevel);
  const exceeding = isExceeding(data.averageActual, data.expectedLevel);
  const gap = Math.max(0, rawGap);
  const pct = getPctBelowTarget(data.belowTarget, data.headcount);
  const colorClass = getGapColor(gap, data.headcount, exceeding);
  const textColor = getTextColor(gap, exceeding);
  const surplus = parseFloat(Math.abs(rawGap).toFixed(1));
  const label = getLabel(pct, exceeding);

  const tooltipContent = (
    <div className="space-y-1.5">
      <div className="font-semibold text-white text-sm border-b border-gray-700 pb-1.5 mb-1">{data.skill}</div>
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Avg actual</span>
        <span className="text-white font-medium">{data.averageActual.toFixed(1)} / {data.expectedLevel}</span>
      </div>
      {exceeding ? (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Surplus</span>
          <span className="text-emerald-200 font-medium">+{surplus} above target</span>
        </div>
      ) : (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Below target</span>
          <span className="text-red-400 font-medium">{data.belowTarget} of {data.headcount} ({pct}%)</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Gap score</span>
        <span className="text-white font-medium">{exceeding ? `+${surplus}` : gap.toFixed(1)}</span>
      </div>
      {data.headcount < 3 && (
        <div className="flex justify-between gap-4 border-t border-gray-700 pt-1.5 mt-0.5">
          <span className="text-amber-400">Low sample</span>
          <span className="text-amber-300 font-medium">Only {data.headcount === 1 ? '1 person' : `${data.headcount} people`}</span>
        </div>
      )}
      {data.team && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Team</span>
          <span className="text-white">{data.team}</span>
        </div>
      )}
    </div>
  );

  const isLowSample = data.headcount < 3;
  const lowSampleLabel = data.headcount === 1 ? '1 person' : '2 people';

  return (
    <Tooltip content={tooltipContent}>
      <button
        onClick={onClick}
        className={`
          relative w-full h-14 rounded-md border transition-all duration-150 cursor-pointer
          flex flex-col items-center justify-center gap-0.5
          ${colorClass}
          ${selected ? 'ring-2 ring-offset-1 ring-gray-900 scale-105 shadow-md' : 'hover:scale-105 hover:shadow-sm'}
        `}
      >
        {exceeding ? (
          <div className="flex items-center gap-1">
            <ArrowUp size={11} className="text-emerald-100 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white leading-none">Exceeding</span>
          </div>
        ) : (
          <span className={`text-[11px] font-semibold ${textColor} leading-none capitalize`}>{label}</span>
        )}
        {isLowSample && (
          <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap shadow-sm
            ${data.headcount === 1 ? 'bg-gray-700 text-white' : 'bg-gray-500 text-white'}`}>
            {lowSampleLabel}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export { getGapScore, getGapColor, getPctBelowTarget };