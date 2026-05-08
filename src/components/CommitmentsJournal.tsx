import { useEffect, useState } from 'react';
import {
  ClipboardList, CheckCircle2, X, TrendingUp,
  AlertTriangle, BookOpen, BarChart2, Sparkles, RefreshCw, ExternalLink,
} from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import { FeedbackBanner } from './feedback/FeedbackBanner';
import { supabase, type Commitment } from '../lib/supabase';

// ── Kind metadata ──────────────────────────────────────────────────────

const KIND_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  promotion:   { label: 'Promotion',   icon: <TrendingUp size={12} />,   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'churn-risk':{ label: 'Churn risk',  icon: <AlertTriangle size={12} />,color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200' },
  'skill-gap': { label: 'Skills gap',  icon: <BookOpen size={12} />,     color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200' },
  benchmark:   { label: 'Benchmark',   icon: <BarChart2 size={12} />,    color: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200' },
  general:     { label: 'General',     icon: <Sparkles size={12} />,     color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200' },
};

function kindMeta(kind: string) {
  return KIND_CONFIG[kind] ?? KIND_CONFIG.general;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Single commitment row ──────────────────────────────────────────────

function CommitmentRow({
  commitment,
  onMarkDone,
  onDismiss,
  onUndismiss,
  onReviewSource,
}: {
  commitment: Commitment;
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
  onUndismiss?: (id: string) => void;
  onReviewSource?: (query: string) => void;
}) {
  const meta = kindMeta(commitment.insight_kind);
  const isDone = commitment.status === 'done';
  const isDismissed = commitment.status === 'dismissed';

  return (
    <div className={`group relative flex gap-4 px-5 py-4 border-b border-gray-100 last:border-0 transition-all ${isDismissed ? 'opacity-40' : ''}`}>
      {/* Status toggle */}
      <button
        onClick={() => !isDone && !isDismissed && onMarkDone(commitment.id)}
        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isDone
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 text-transparent hover:border-emerald-400 hover:text-emerald-400'
        }`}
        title={isDone ? 'Done' : 'Mark as done'}
      >
        <CheckCircle2 size={10} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {commitment.text}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.border} ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>
          {commitment.department && (
            <span className="text-[10px] text-gray-400 font-medium">{commitment.department}</span>
          )}
          <span className="text-[10px] text-gray-300">{formatDate(commitment.created_at)}</span>
        </div>
        {commitment.context && (
          <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed italic">
            {commitment.context}
          </p>
        )}
        {commitment.source_query && onReviewSource && (
          <button
            onClick={() => onReviewSource(commitment.source_query!)}
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-sky-600 hover:text-sky-800 transition-colors"
          >
            <ExternalLink size={10} />
            Review source in Ask AI
          </button>
        )}
      </div>

      {/* Dismiss / Undo */}
      {isDismissed ? (
        <button
          onClick={() => onUndismiss?.(commitment.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 whitespace-nowrap"
          title="Restore"
        >
          Undo
        </button>
      ) : !isDone && (
        <button
          onClick={() => onDismiss(commitment.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export function CommitmentsJournal({ onReviewSource }: { onReviewSource?: (query: string) => void } = {}) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'done' | 'all' | 'dismissed'>('open');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('commitments')
      .select('*')
      .order('created_at', { ascending: false });
    setCommitments((data ?? []) as Commitment[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markDone(id: string) {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'done' } : c));
    await supabase.from('commitments').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', id);
  }

  async function dismiss(id: string) {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'dismissed' } : c));
    await supabase.from('commitments').update({ status: 'dismissed', updated_at: new Date().toISOString() }).eq('id', id);
  }

  async function undismiss(id: string) {
    setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'open' } : c));
    await supabase.from('commitments').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', id);
  }

  const visible = commitments.filter(c => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'done') return c.status === 'done';
    if (filter === 'dismissed') return c.status === 'dismissed';
    return c.status !== 'dismissed';
  });

  const openCount = commitments.filter(c => c.status === 'open').length;
  const doneCount = commitments.filter(c => c.status === 'done').length;

  return (
    <div className="min-h-full bg-gray-50 px-8 py-10">
      <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8" data-tour="journal-header">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
              <ClipboardList size={14} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Decisions journal</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            Commitments you've made after AI insights. Your accountability layer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons title="Decisions Journal" buildContent={() => {
            const lines: string[] = [
              'DECISIONS JOURNAL — ACME CORP',
              `Generated: ${new Date().toLocaleDateString()}`,
              '='.repeat(50),
              '',
              `Open: ${openCount}  |  Completed: ${doneCount}  |  Total: ${commitments.filter(c => c.status !== 'dismissed').length}`,
              '',
            ];
            for (const c of commitments.filter(c => c.status !== 'dismissed')) {
              lines.push(`[${c.status.toUpperCase()}] ${c.text}`);
              if (c.department) lines.push(`  Department: ${c.department}`);
              if (c.context) lines.push(`  Context: ${c.context}`);
              lines.push(`  Kind: ${c.insight_kind} | Date: ${new Date(c.created_at).toLocaleDateString()}`);
              lines.push('');
            }
            return lines.join('\n');
          }} />
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={11} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6" data-tour="journal-stats">
        {[
          { label: 'Open', value: openCount, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Completed', value: doneCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total', value: commitments.filter(c => c.status !== 'dismissed').length, color: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-gray-100 px-5 py-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-1">
        {([
          ['open', 'Open'],
          ['done', 'Completed'],
          ['all', 'All'],
          ['dismissed', 'Dismissed'],
        ] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              filter === f ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-4" data-tour="journal-list">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2">
            <RefreshCw size={14} className="animate-spin text-gray-300" />
            <span className="text-sm text-gray-300">Loading...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <ClipboardList size={20} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400">
                {filter === 'open' ? 'No open commitments' : filter === 'dismissed' ? 'No dismissed commitments' : 'Nothing here yet'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {filter === 'open'
                  ? 'Ask the AI about promotions or churn risk to get started'
                  : filter === 'dismissed'
                  ? 'Commitments you dismiss will appear here and can be restored'
                  : 'Commitments you log from AI insights will appear here'}
              </p>
            </div>
          </div>
        ) : (
          visible.map(c => (
            <CommitmentRow key={c.id} commitment={c} onMarkDone={markDone} onDismiss={dismiss} onUndismiss={undismiss} onReviewSource={onReviewSource} />
          ))
        )}
      </div>
      <FeedbackBanner context="Decisions Journal" className="mt-4" />
      </div>
    </div>
  );
}
