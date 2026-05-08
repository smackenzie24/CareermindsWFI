import { useMemo, useState } from 'react';
import { Sparkles, ArrowRight, Linkedin, ChevronDown, ChevronUp, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  getCrossDeptFitCandidates,
  DEPT_COLORS,
  type CrossDeptFitResult,
  type Department,
} from '../../data/promotionData';
import { DEPARTMENTS } from '../../data/mockData';

const CONFIDENCE_COLORS = {
  high: 'text-emerald-700 bg-emerald-50',
  medium: 'text-amber-700 bg-amber-50',
  low: 'text-gray-600 bg-gray-50',
};

function DeltaBadge({ delta }: { delta: number }) {
  const color = delta >= 30 ? 'bg-emerald-100 text-emerald-800' : delta >= 20 ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      <TrendingUp size={10} />
      +{delta}%
    </span>
  );
}

function FitBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

function CandidateCard({ result }: { result: CrossDeptFitResult }) {
  const [expanded, setExpanded] = useState(false);
  const currentColor = DEPT_COLORS[result.currentDept] ?? '#6b7280';
  const suggestedColor = DEPT_COLORS[result.suggestedDept] ?? '#6b7280';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: currentColor }}
            >
              {result.person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-none">{result.person.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: currentColor, background: `${currentColor}18` }}
                >
                  {result.currentDept}
                </span>
                <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: suggestedColor, background: `${suggestedColor}18` }}
                >
                  {result.suggestedDept}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <DeltaBadge delta={result.delta} />
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Fit comparison bars */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Current dept fit
            </p>
            <FitBar pct={result.currentReadinessPct} color={currentColor} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {result.suggestedDept} fit
            </p>
            <FitBar pct={result.fitPct} color={suggestedColor} />
          </div>
        </div>

        {/* Top signals summary (always visible) */}
        {result.topInferredSignals.length > 0 && (
          <div className="mt-3 flex items-start gap-2">
            <Linkedin size={12} className="text-[#0A66C2] mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              {result.topInferredSignals[0].source}
            </p>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-6 py-4 bg-gray-50/40 space-y-4">
          {/* LinkedIn signals */}
          {result.linkedInSignals.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                LinkedIn history
              </p>
              <div className="space-y-1">
                {result.linkedInSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0A66C2] flex-shrink-0" />
                    <span className="text-xs text-gray-600">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inferred skill signals */}
          {result.topInferredSignals.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Inferred skills driving fit
              </p>
              <div className="space-y-2">
                {result.topInferredSignals.map((note, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 capitalize ${CONFIDENCE_COLORS[note.confidence]}`}>
                      {note.confidence}
                    </span>
                    <span className="text-xs text-gray-600 leading-relaxed">{note.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Framework match */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Framework match
            </p>
            <p className="text-xs text-gray-600">
              Meets <span className="font-bold text-gray-800">{result.matchedCriteria} of {result.totalCriteria}</span> criteria for {result.suggestedLevelLabel}
            </p>
          </div>

          {/* Framing note */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <Info size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              This is an opportunity signal, not a performance flag. Share with the employee as a career conversation starter — not a directive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  filterDept?: Department | null;
}

export function HiddenTalent({ filterDept }: Props) {
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const allCandidates = useMemo(() => getCrossDeptFitCandidates(), []);

  const filtered = useMemo(() => {
    const dept = filterDept ?? (selectedDept === 'all' ? null : selectedDept);
    if (!dept) return allCandidates;
    return allCandidates.filter(r => r.currentDept === dept || r.suggestedDept === dept);
  }, [allCandidates, selectedDept, filterDept]);

  const byDeptCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allCandidates.length };
    for (const dept of DEPARTMENTS) {
      counts[dept] = allCandidates.filter(r => r.currentDept === dept || r.suggestedDept === dept).length;
    }
    return counts;
  }, [allCandidates]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-sky-500" />
            <h2 className="text-base font-bold text-gray-900">Hidden Talent</h2>
            <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
              LinkedIn-inferred
            </span>
          </div>
          <p className="text-sm text-gray-500 max-w-xl">
            People whose inferred skills — from previous roles and LinkedIn history — suggest they may be better suited to a different function. Scored against each department's level framework.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-shrink-0">
          <AlertTriangle size={13} className="text-amber-500" />
          <p className="text-[11px] text-amber-700 font-medium">For managers only · Not visible to employees</p>
        </div>
      </div>

      {/* Department filter (only shown when not locked to a dept) */}
      {!filterDept && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDept === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:text-gray-800'
            }`}
          >
            All ({byDeptCounts.all})
          </button>
          {DEPARTMENTS.filter(d => (byDeptCounts[d] ?? 0) > 0).map(dept => {
            const color = DEPT_COLORS[dept];
            const active = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  active ? 'text-white' : 'bg-gray-50 text-gray-500 hover:text-gray-800 border-gray-100'
                }`}
                style={active ? { background: color, borderColor: color } : undefined}
              >
                {dept} ({byDeptCounts[dept] ?? 0})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <Sparkles size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No cross-fit candidates detected</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload LinkedIn data for more employees to surface hidden strengths.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(result => (
            <CandidateCard key={result.person.id} result={result} />
          ))}
        </div>
      )}

      {/* Footer note */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <Info size={12} />
          <span>
            Inferred skills are weighted at 80% confidence. Delta shows fit in suggested role vs. current role readiness. Requires LinkedIn integration via Revelio Labs.
          </span>
        </div>
      )}
    </div>
  );
}
