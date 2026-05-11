# Decisions Journal — Product Specification

## 1. Feature Overview

The Decisions Journal is an accountability layer that captures every strategic workforce commitment made through the AI assistant. When a user receives an AI-generated insight (e.g., churn risk analysis, promotion readiness assessment, skills gap report), they are presented with an inline capture card where they can log a concrete action. Those logged actions become the persistent record in the Journal.

The Journal serves three purposes:

1. **Accountability** — a record of what the HR leader committed to do after receiving an AI insight.
2. **Audit trail** — provides a governance-ready export of workforce decisions with date, type, and context.
3. **Follow-through loop** — closes the loop between AI analysis and real action by surfacing open commitments and allowing them to be marked done.

---

## 2. Navigation Model

### Route

The Journal is accessed via the `journal` view in the `NavState` object managed by `App.tsx`. There is no sub-view; the journal has a single flat page.

### Nav bar entry

In the global navigation strip (`App.tsx`), the Journal appears as:

```
{ id: 'journal', label: 'Decisions', icon: <ClipboardList size={13} /> }
```

It is a standard (non-accent) nav item. When active, the button receives `bg-white/10 text-white`; when inactive it is `text-gray-400 hover:text-gray-200 hover:bg-white/5`.

### Mount lifecycle

Unlike the Ask AI page, the Journal is **not** always-mounted. It is rendered conditionally: `{nav.view === 'journal' && <CommitmentsJournal onReviewSource={openAI} />}`. This means its local state (filter selection, loaded commitments) resets each time the user navigates away and back.

### Props

```typescript
CommitmentsJournal({ onReviewSource?: (query: string) => void })
```

`onReviewSource` — when provided, enables the "Review source in Ask AI" link inside commitment rows. When clicked, it calls `openAI(query)` from `App.tsx`, which navigates to the Ask AI page and pre-populates the input with the original question that generated the commitment.

---

## 3. How Decisions Are Populated

Commitments are created exclusively through the Ask AI workflow. There is no manual-entry mechanism outside of the AI output panel.

### 3.1 Full pipeline: query → commitment

```
User types a question in AskAIPage
         │
         ▼
chatEngine.query(input) — local intent handler
         │
         ├─ returns { text, results }
         │
         ▼ (if needsAI: true)
workforce-ai edge function — Anthropic Claude call
         │
         ▼
finalize(text, results) — called for ALL responses
         │
         ▼
withCommitmentPrompt(text, results)
         │
         ├─ checks: does results already contain kind='commitment-prompt'?
         │     yes → return results unchanged
         │     no  → call buildCommitmentPrompt(trimmedQuestion, responseText)
         │           stamp prompt.sourceQuery = trimmedQuestion
         │           append { kind: 'commitment-prompt', data: prompt } to results
         │
         ▼
AIChatRenderer renders each result in order
         │
         ▼ (for kind='commitment-prompt')
CommitmentCaptureCard renders below all other output blocks
         │
         ▼ (user fills textarea and clicks "Log it")
supabase.from('commitments').insert({ ... })
         │
         ▼
CommitmentsJournal.load() picks it up on next visit / refresh
```

### 3.2 `withCommitmentPrompt` (AskAIPage.tsx)

Located in `AskAIPage.tsx`, called inside `finalize()`, which is invoked at the end of both local-intent and AI-backed query flows.

```typescript
const withCommitmentPrompt = (text: string, results: QueryResult[]) => {
  const hasCommitment = results.some(r => r.kind === 'commitment-prompt');
  if (hasCommitment) return results;
  const prompt = buildCommitmentPrompt(trimmed, text);
  prompt.sourceQuery = trimmed;
  return [...results, { kind: 'commitment-prompt', data: prompt }];
};
```

- `trimmed` is the user's question with leading/trailing whitespace removed.
- The guard (`hasCommitment`) prevents duplicate capture cards if `chatEngine.query()` itself returned a `commitment-prompt` result (which also stamps `sourceQuery` at `chatEngine.ts` line 1613).
- Every response from the AI page — regardless of query type — appends exactly one `commitment-prompt` result.

### 3.3 `buildCommitmentPrompt` (chatEngine.ts, line 168)

Takes `(question: string, responseText: string)` and returns a `CommitmentPrompt` object by regex-matching the question and response text.

**`CommitmentPrompt` interface** (chatEngine.ts, line 158):

```typescript
interface CommitmentPrompt {
  insightSummary: string;
  insightKind: string;
  department?: string;
  sourceQuery?: string;
  suggestedDecisions?: string[];
}
```

**Intent classification branches** (9 named + fallback):

| Branch | Regex match on question/response | `insightKind` | Example `suggestedDecisions` |
|--------|----------------------------------|---------------|------------------------------|
| promotion | `/promot/i` | `'promotion'` | Schedule check-in with near-ready candidates, update role criteria |
| churn | `/churn\|flight.risk\|retain\|attrition\|leaving/i` | `'churn-risk'` | Arrange 1:1 with at-risk employees, review compensation |
| skill-gap | `/skill.gap\|competency\|training\|upskill\|reskill/i` | `'skill-gap'` | Commission training programme, assign mentors |
| hiring | `/hir\|recruit\|headcount\|backfill/i` | `'hiring'` | Open requisition, define role profile |
| reduction | `/reduc\|downsize\|restructur\|layoff\|RIF/i` | `'reduction'` | Draft communication plan, review severance |
| manager | `/manager\|coaching\|1.1\|one.on.one/i` | `'manager'` | Book coaching session, review manager effectiveness scores |
| benchmark | `/benchmark\|industr\|peer\|quartile/i` | `'benchmark'` | Share benchmark report with leadership, identify improvement areas |
| action-plan | `/action.plan\|roadmap\|strategy\|plan/i` | `'action-plan'` | Present plan to leadership, set quarterly milestones |
| general (fallback) | no match | `'general'` | Schedule follow-up, document findings |

`insightSummary` is derived from the response text (truncated to a readable summary). `department` is extracted from the question if a department name is detected.

### 3.4 `CommitmentCaptureCard` (AIChatRenderer.tsx, line 566)

Rendered at the bottom of every AI response output panel when `result.kind === 'commitment-prompt'`.

**State:**

```typescript
const [text, setText] = useState('');
const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
```

**Suggested decision chips:**

The `suggestedDecisions[]` array from `buildCommitmentPrompt` is split into two chip groups:

- `actionChips` — decisions that do **not** reference Careerminds. Styled with emerald background.
- `careermindsChips` — decisions that reference Careerminds or Keystone Partners. Styled with sky background and a `Sparkles` icon.

Clicking any chip sets `text` to that chip's value, populating the textarea. This does not auto-save.

**Textarea:**

Free-text input. Placeholder: "Write your commitment here...". `Enter` (without `Shift`) triggers `save()`. `Shift+Enter` inserts a newline.

**"Log it" button:**

Disabled when `!text.trim() || status === 'saving'`. On click, calls `save()`.

**`save()` function:**

```typescript
await supabase.from('commitments').insert({
  text: text.trim(),
  context: data.insightSummary,
  insight_kind: data.insightKind,
  department: data.department ?? null,
  source_query: data.sourceQuery ?? null,
  status: 'open',
});
```

After a successful insert, `status` is set to `'saved'` and the card displays a green success message:
> "Commitment logged — you'll see it in your Decisions journal."

The `id`, `created_at`, and `updated_at` columns are generated server-side by Supabase defaults.

### 3.5 `sourceQuery` stamping — two locations

The `source_query` field is stamped in two places to ensure it is always set:

1. **`AskAIPage.tsx` — `withCommitmentPrompt()`**: `prompt.sourceQuery = trimmed` after calling `buildCommitmentPrompt`.
2. **`chatEngine.ts` line 1613** — inside `query()`: `if (r.kind === 'commitment-prompt') r.data.sourceQuery = input;` — covers results returned by the local intent engine before they reach `withCommitmentPrompt`.

---

## 4. Database Schema

### Table: `commitments`

Migration files:
- `supabase/migrations/20260429121239_create_commitments_table.sql` — initial table creation
- `supabase/migrations/20260501093848_add_source_query_to_commitments.sql` — adds `source_query` column

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `text` | `text` | no | — | The commitment text entered by the user |
| `context` | `text` | no | — | `insightSummary` from the AI response — the short summary of what triggered the commitment |
| `insight_kind` | `text` | no | — | One of: `promotion`, `churn-risk`, `skill-gap`, `benchmark`, `general`, `hiring`, `reduction`, `manager`, `action-plan` |
| `department` | `text` | yes | `null` | Department name extracted from the query, if detected |
| `source_query` | `text` | yes | `null` | The original user question that generated this commitment (added in second migration) |
| `status` | `text` | no | `'open'` | One of: `open`, `done`, `dismissed` |
| `created_at` | `timestamptz` | no | `now()` | Insert timestamp |
| `updated_at` | `timestamptz` | no | `now()` | Last status-change timestamp; manually updated on each status transition |

Row Level Security is enabled on the table with policies defined in the migration files.

### TypeScript interface (`src/lib/supabase.ts`)

```typescript
export interface Commitment {
  id: string;
  text: string;
  context: string;
  insight_kind: string;
  department: string | null;
  source_query: string | null;
  status: 'open' | 'done' | 'dismissed';
  created_at: string;
  updated_at: string;
}
```

---

## 5. Page Layout

### Overall structure

```
<div class="min-h-full bg-gray-50 px-8 py-10">
  <div class="max-w-3xl mx-auto">
    [Header]
    [Stats cards]
    [Filter tabs]
    [Commitment list]
    [FeedbackBanner]
  </div>
</div>
```

Maximum content width: `max-w-3xl` (48rem). Background: `bg-gray-50`. Padding: `px-8 py-10`.

---

## 6. Header

**Tour anchor:** `data-tour="journal-header"`

### Layout

```
flex items-start justify-between mb-8
├── Left: icon + title + subtitle
└── Right: ExportButtons + Refresh button
```

### Icon + title

The icon is a `w-8 h-8 rounded-xl bg-gray-900` container holding `<ClipboardList size={14} className="text-white" />`. Title: `text-xl font-bold text-gray-900` "Decisions journal". Subtitle (indented by `ml-11`): `text-sm text-gray-400` "Commitments you've made after AI insights. Your accountability layer."

The icon and title sit in a `flex items-center gap-2.5 mb-1` row; the subtitle is below.

### Export button

`ExportButtons` component with:
- `title="Decisions Journal"`
- `buildContent()` function that produces plain-text export (see Section 11)

### Refresh button

```
flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700
transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100
```

Icon: `<RefreshCw size={11} />`. Label: "Refresh". On click: calls `load()` which re-fetches all commitments from Supabase.

---

## 7. Stats Cards

**Tour anchor:** `data-tour="journal-stats"`

Three cards in a `grid grid-cols-3 gap-3 mb-6`.

| Card | Value | Text colour | Background |
|------|-------|-------------|------------|
| Open | `openCount` — count where `status === 'open'` | `text-gray-900` | `bg-white` |
| Completed | `doneCount` — count where `status === 'done'` | `text-emerald-600` | `bg-emerald-50` |
| Total | count where `status !== 'dismissed'` | `text-gray-500` | `bg-gray-50` |

Each card: `rounded-2xl border border-gray-100 px-5 py-4`. Value: `text-2xl font-bold`. Label: `text-xs text-gray-400 font-medium mt-0.5`.

---

## 8. Filter Tabs

A horizontal tab bar rendered as `flex gap-0 border-b border-gray-200 mb-1`.

| Tab key | Label | Shows |
|---------|-------|-------|
| `'open'` | Open | `status === 'open'` |
| `'done'` | Completed | `status === 'done'` |
| `'all'` | All | `status !== 'dismissed'` (open + done) |
| `'dismissed'` | Dismissed | `status === 'dismissed'` |

Default active filter: `'open'`.

**Active tab styling:** `border-b-2 border-gray-900 text-gray-900 -mb-px`

**Inactive tab styling:** `border-b-2 border-transparent text-gray-400 hover:text-gray-600`

Both states share: `px-4 py-2 text-xs font-semibold transition-colors`

The `-mb-px` on the active tab makes its bottom border overlap the container's `border-b` to appear seamlessly connected.

---

## 9. Commitment List

**Tour anchor:** `data-tour="journal-list"`

Container: `bg-white rounded-2xl border border-gray-200 overflow-hidden mt-4`.

### 9.1 Loading state

Shown while `loading === true`. Renders a centered row with `<RefreshCw size={14} className="animate-spin text-gray-300" />` and "Loading..." in `text-sm text-gray-300`.

### 9.2 Empty states

Shown when `visible.length === 0` after loading. Content varies by active filter:

| Filter | Heading | Subtext |
|--------|---------|---------|
| `'open'` | "No open commitments" | "Ask the AI about promotions or churn risk to get started" |
| `'dismissed'` | "No dismissed commitments" | "Commitments you dismiss will appear here and can be restored" |
| any other | "Nothing here yet" | "Commitments you log from AI insights will appear here" |

Empty state layout: `flex flex-col items-center justify-center py-16 text-center gap-3`. Icon: `w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100` containing `<ClipboardList size={20} className="text-gray-300" />`.

### 9.3 Commitment rows

Each `Commitment` in the `visible` array is rendered as a `CommitmentRow`. Rows are separated by `border-b border-gray-100 last:border-0`.

---

## 10. CommitmentRow Component

```typescript
function CommitmentRow({
  commitment,
  onMarkDone,
  onDismiss,
  onUndismiss,
  onReviewSource,
}: { ... })
```

### Row layout

```
group relative flex gap-4 px-5 py-4 border-b border-gray-100 last:border-0
transition-all [opacity-40 when dismissed]
├── [Status toggle button] — flex-shrink-0 mt-0.5
├── [Content area] — flex-1 min-w-0
│   ├── Commitment text
│   ├── Metadata row (kind badge + department chip + date)
│   ├── Context text (if present)
│   └── "Review source in Ask AI" link (if source_query and onReviewSource)
└── [Dismiss / Undo button] — flex-shrink-0, visible on group hover
```

When `status === 'dismissed'`, the entire row receives `opacity-40`.

### 10.1 Status toggle (mark-done button)

A `w-5 h-5 rounded-full border-2` circular button at the top-left of the row.

| State | Appearance |
|-------|-----------|
| `status === 'done'` | `bg-emerald-500 border-emerald-500 text-white` |
| `status !== 'done'` (idle) | `border-gray-300 text-transparent` |
| `status !== 'done'` (hover) | `hover:border-emerald-400 hover:text-emerald-400` |

Contains `<CheckCircle2 size={10} />`. `title` attribute: "Done" if done, "Mark as done" otherwise.

Click behaviour: calls `onMarkDone(commitment.id)` **only** when `!isDone && !isDismissed`. Dismissed rows cannot be marked done via the toggle.

### 10.2 Commitment text

`text-sm font-medium leading-snug`. When `status === 'done'`: `text-gray-400 line-through`. Otherwise: `text-gray-900`.

### 10.3 Metadata row

`flex items-center gap-2 mt-1.5 flex-wrap`

**Kind badge** — `inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border`

Colours come from `KIND_CONFIG` (see Section 13). The badge shows a small icon and the kind label.

**Department chip** — `text-[10px] text-gray-400 font-medium`. Rendered only when `commitment.department` is non-null.

**Date** — `text-[10px] text-gray-300`. Formatted by `formatDate(iso)`:

```typescript
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}
```
Example output: "9 May 2026".

### 10.4 Context text

`text-[11px] text-gray-400 mt-1.5 leading-relaxed italic`. Rendered when `commitment.context` is non-empty. This is the `insightSummary` stored at insert time — a short description of the AI insight that prompted the commitment.

### 10.5 "Review source in Ask AI" link

```
inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium
text-sky-600 hover:text-sky-800 transition-colors
```

Icon: `<ExternalLink size={10} />`. Label: "Review source in Ask AI".

Rendered only when both `commitment.source_query` is non-null and the `onReviewSource` prop is provided.

On click: calls `onReviewSource(commitment.source_query)`, which in `App.tsx` calls `openAI(query)` — navigating to the Ask AI page and pre-populating the question input with the original query.

### 10.6 Dismiss button (non-dismissed, non-done rows only)

A `w-6 h-6 rounded-lg` icon button with `<X size={12} />`. Visible only on `group-hover` (`opacity-0 group-hover:opacity-100 transition-opacity`). Title: "Dismiss".

Positioning: `flex-shrink-0` in the row's trailing slot.

Colours: `text-gray-300 hover:text-gray-600 hover:bg-gray-100`

On click: calls `onDismiss(commitment.id)`.

### 10.7 Undo button (dismissed rows only)

Replaces the dismiss button when `status === 'dismissed'`.

```
opacity-0 group-hover:opacity-100 transition-opacity
text-[11px] font-semibold text-gray-400 hover:text-gray-700
px-2 py-1 rounded-lg hover:bg-gray-100 whitespace-nowrap
```

Label: "Undo". Title: "Restore". On click: calls `onUndismiss(commitment.id)`.

---

## 11. Status Transitions

All transitions use **optimistic UI updates** — the local React state is updated immediately before the Supabase call, so the UI responds without waiting for the network.

### Mark done

```typescript
async function markDone(id: string) {
  setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'done' } : c));
  await supabase.from('commitments')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('id', id);
}
```

`updated_at` is manually set to the current ISO timestamp on each status change. There is no server-side trigger.

### Dismiss

```typescript
async function dismiss(id: string) {
  setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'dismissed' } : c));
  await supabase.from('commitments')
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('id', id);
}
```

A dismissed commitment disappears from the active list (if filter is `'open'` or `'all'`). It reappears in the `'dismissed'` tab.

### Undismiss

```typescript
async function undismiss(id: string) {
  setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: 'open' } : c));
  await supabase.from('commitments')
    .update({ status: 'open', updated_at: new Date().toISOString() })
    .eq('id', id);
}
```

Restores the commitment to `'open'` status.

### State machine

```
         insert (from AI)
              │
              ▼
           'open'
           /    \
    dismiss      mark done
       │               │
       ▼               ▼
  'dismissed'        'done'
       │
   undismiss
       │
       ▼
    'open'
```

There is no transition from `'done'` back to `'open'`. There is no transition from `'done'` to `'dismissed'`. The mark-done button is disabled for dismissed rows.

---

## 12. Data Loading

### Initial load

Triggered in `useEffect(() => { load(); }, [])` — runs once on component mount.

```typescript
async function load() {
  setLoading(true);
  const { data } = await supabase
    .from('commitments')
    .select('*')
    .order('created_at', { ascending: false });
  setCommitments((data ?? []) as Commitment[]);
  setLoading(false);
}
```

All fields are fetched (`select('*')`). Results are ordered newest-first. `data ?? []` guards against null on empty table or error.

### Manual refresh

Clicking the Refresh button in the header re-calls `load()`, setting `loading` to `true` briefly (showing the spinner) before repopulating from Supabase.

There is no real-time subscription — the list does not update automatically if another session creates a commitment.

---

## 13. KIND_CONFIG — Insight Kind Metadata

Defined at the top of `CommitmentsJournal.tsx`. Maps `insight_kind` values to display metadata.

| Key | Label | Icon | Text colour | Background | Border |
|-----|-------|------|-------------|------------|--------|
| `'promotion'` | Promotion | `<TrendingUp size={12} />` | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200` |
| `'churn-risk'` | Churn risk | `<AlertTriangle size={12} />` | `text-rose-700` | `bg-rose-50` | `border-rose-200` |
| `'skill-gap'` | Skills gap | `<BookOpen size={12} />` | `text-teal-700` | `bg-teal-50` | `border-teal-200` |
| `'benchmark'` | Benchmark | `<BarChart2 size={12} />` | `text-sky-700` | `bg-sky-50` | `border-sky-200` |
| `'general'` | General | `<Sparkles size={12} />` | `text-gray-600` | `bg-gray-50` | `border-gray-200` |

**Fallback:** Any `insight_kind` value not in the table (e.g. `'hiring'`, `'reduction'`, `'manager'`, `'action-plan'`) falls back to the `'general'` entry via `KIND_CONFIG[kind] ?? KIND_CONFIG.general`.

Note: `buildCommitmentPrompt` in `chatEngine.ts` can return `insight_kind` values such as `'skill-gap'` (with hyphen), but `KIND_CONFIG` has `'skill-gap'` as a key (matching). The value `'skills-gap'` (with an `s`) would fall to general — this is a potential edge case.

---

## 14. Export

The `ExportButtons` component is used with `title="Decisions Journal"` and a custom `buildContent()` function.

### Exported content

```
DECISIONS JOURNAL — ACME CORP
Generated: [locale date]
==================================================

Open: [n]  |  Completed: [n]  |  Total: [n]

[STATUS] [text]
  Department: [department]     ← only if non-null
  Context: [context]           ← always included if non-empty
  Kind: [insight_kind] | Date: [created_at locale date]

[blank line between entries]
```

- All non-dismissed commitments are included (both `'open'` and `'done'`).
- The `STATUS` prefix is uppercased: `OPEN` or `DONE`.
- Department and context lines are indented with two spaces.
- The separator line is exactly 50 `=` characters.

---

## 15. Footer

### FeedbackBanner

```tsx
<FeedbackBanner context="Decisions Journal" className="mt-4" />
```

Rendered below the commitment list. The `context` prop sets the copy in the feedback flow to refer to the Decisions Journal specifically.

---

## 16. Tour Integration

Three `data-tour` attributes are placed on key elements:

| Attribute | Element | Tour step ID | Tour title |
|-----------|---------|--------------|------------|
| `journal-header` | Header section (`flex items-start justify-between`) | `journal-1` | "Decisions Journal" |
| `journal-stats` | Stats grid (`grid grid-cols-3`) | `journal-2` | "Open vs Completed" |
| `journal-list` | Commitment list container | `journal-3` | "Commitment Rows" |

Tour step bodies (`tourData.ts`):
- `journal-1`: "Every strategic commitment made through the AI assistant is automatically logged here with context and rationale. It creates a searchable audit trail of workforce decisions — useful for governance, board reporting, and accountability."
- `journal-2`: "The three summary cards show how many commitments are open, completed, and in total. Use the filter tabs below to switch between views. Checking off a commitment marks it done and moves it to the Completed list."
- `journal-3`: "Each row shows the commitment text, its type (Hire, Develop, Review, etc.), the department it relates to, and when it was created. Hover a row to reveal the dismiss button. Completed commitments are shown with a strikethrough."

---

## 17. Component File Reference

| File | Purpose |
|------|---------|
| `src/components/CommitmentsJournal.tsx` | Journal page: list rendering, filtering, status transitions |
| `src/components/ai/AIChatRenderer.tsx` | `CommitmentCaptureCard` — AI output card that saves commitments |
| `src/components/ai/AskAIPage.tsx` | `withCommitmentPrompt()` — appends capture card to every response |
| `src/data/chatEngine.ts` | `buildCommitmentPrompt()`, `CommitmentPrompt` interface |
| `src/lib/supabase.ts` | `Commitment` TypeScript interface, Supabase client singleton |
| `src/App.tsx` | Mounts `CommitmentsJournal` with `onReviewSource={openAI}` prop |
| `src/components/tour/tourData.ts` | Tour step definitions for `journal-1/2/3` |
| `src/components/ExportButtons.tsx` | Shared export component used in journal header |
| `src/components/feedback/FeedbackBanner.tsx` | Feedback prompt shown below the list |
| `supabase/migrations/20260429121239_create_commitments_table.sql` | Initial schema |
| `supabase/migrations/20260501093848_add_source_query_to_commitments.sql` | Adds `source_query` column |
