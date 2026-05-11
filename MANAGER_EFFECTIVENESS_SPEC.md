# Manager Effectiveness — Product Specification

**Feature:** Manager Effectiveness
**Components:**
- `src/components/managerEffectiveness/ManagerEffectiveness.tsx` — org-level list view
- `src/components/managerEffectiveness/ManagerDetail.tsx` — individual manager drill-down
- `src/data/managerData.ts` — MANAGERS data, ManagerMetrics interface, computeManagerMetrics, getAllManagerMetrics

**Data source:** Static mock data. Manager reports are derived from `src/data/promotionData.ts` (PEOPLE, LEVEL_DEFINITIONS, LEVEL_FRAMEWORKS, computeReadiness).
**Last updated:** May 2026

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Navigation model](#2-navigation-model)
3. [ManagerEffectiveness — org-level view](#3-managereffectiveness--org-level-view)
   - 3.1 Page structure and background
   - 3.2 Page header
   - 3.3 Org-level stat cards
   - 3.4 Score legend bar
   - 3.5 Filter and sort bar
   - 3.6 Manager card grid
   - 3.7 Manager cards
   - 3.8 Export content (org view)
4. [ManagerDetail — individual manager view](#4-managerdetail--individual-manager-view)
   - 4.1 Page structure
   - 4.2 Header — breadcrumb row
   - 4.3 Header — manager info and score badge
   - 4.4 Primary KPI grid
   - 4.5 Secondary KPI grid
   - 4.6 Top blocking skills panel
   - 4.7 Skill profile panel
   - 4.8 Direct reports list
   - 4.9 Coaching suggestions
   - 4.10 Export content (manager detail)
5. [Shared components](#5-shared-components)
   - 5.1 TrendIcon
   - 5.2 ReportRow
   - 5.3 effectivenessScore formula
   - 5.4 scoreColor / scoreBg / scoreLabel
6. [Data model and computations](#6-data-model-and-computations)
   - 6.1 Manager source data (MANAGERS)
   - 6.2 Report filtering
   - 6.3 computeManagerMetrics — all fields
   - 6.4 getAllManagerMetrics
7. [Constants and configuration](#7-constants-and-configuration)

---

## 1. Feature overview

Manager Effectiveness aggregates promotion readiness data per manager to surface which teams are growing fastest and which need coaching support. Each manager's effectiveness is expressed as a composite 0–100 score weighted from three components: team readiness (40%), framework completion (30%), and stall penalty (30%).

The view has two states:

| State | Condition | Component rendered |
|---|---|---|
| Org list | `selectedManager === null` | `ManagerEffectiveness` renders the manager card grid |
| Manager detail | `selectedManager !== null` | `ManagerDetail` replaces the entire page |

---

## 2. Navigation model

`ManagerEffectiveness` uses a controlled/uncontrolled hybrid pattern:

```
selectedManager = selectedManagerProp !== undefined ? selectedManagerProp : internalManager
```

`internalManager` is initialised via a **lazy state initializer** (a function passed to `useState`):
```typescript
useState<ManagerMetrics | null>(
  () => initialManagerId
    ? (allMetrics.find(m => m.manager.id === initialManagerId) ?? null)
    : null
)
```
This runs once at mount time. If `initialManagerId` is provided but not found in `allMetrics`, the initial state is null.

`setSelectedManager(m)` always updates both `internalManager` and calls `onSelectManager?.(m)`.

**Props:**

| Prop | Type | Effect |
|---|---|---|
| `initialManagerId` | `string` | Looks up manager by id in `allMetrics` at mount; opens detail view directly |
| `selectedManager` | `ManagerMetrics \| null` | Controlled selection; takes precedence over `internalManager` when not `undefined` |
| `onSelectManager` | `(m: ManagerMetrics \| null) => void` | Callback fired on every selection change |
| `onNavigateToGapReport` | `(dept: Department) => void` | Cross-feature: Skills Gap Report filtered to manager's dept. Passed through to `ManagerDetail`. |
| `onNavigateToHeatmap` | `() => void` | Cross-feature: Skills Gap Heatmap (no dept filter). Passed through to `ManagerDetail`. |
| `onNavigateToPipeline` | `(dept?: Department) => void` | Cross-feature: Promotion Pipeline, optionally filtered to dept. Passed through to `ManagerDetail`. |

When `selectedManager` is non-null, the component renders `<ManagerDetail>` in place of the list view. `ManagerDetail.onBack` calls `setSelectedManager(null)`.

---

## 3. ManagerEffectiveness — org-level view

Rendered when `selectedManager === null`.

### 3.1 Page structure and background

Outermost container: `flex flex-col min-h-screen bg-gray-50 font-sans`. The gray-50 background is visible in the main scrollable area and behind the card grid.

### 3.2 Page header

`header` element: `bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0`.

**Title block row** (`flex items-center justify-between mb-5`):

Left side:
- Eyebrow: "Workforce Intelligence" (`text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1`)
- Title: "Manager Effectiveness" (`text-2xl font-bold text-gray-900`)
- Subtitle: "Aggregate progression velocity and framework completion rates by manager. Identify whose teams are growing fastest — and who needs coaching support." (`text-sm text-gray-500 mt-1 max-w-2xl`)

Right side (`flex items-center gap-3`):
- `ExportButtons title="Manager Effectiveness"` — Download + Email me. See §3.8.
- Live indicator: `w-2 h-2 rounded-full bg-emerald-400 animate-pulse` + "Acme Corp" (`text-xs text-gray-400`)

### 3.3 Org-level stat cards

`grid-cols-4 gap-4` (`data-tour="managers-org-stats"`). Each `OrgStat` card: `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`.

Card structure: icon + label row (`flex items-center gap-2 mb-2`), then 3xl font-black value, then xs gray-400 sub-label (`mt-1`).

| # | Label | Value | Sub-label | Colour | Icon (size 14) |
|---|---|---|---|---|---|
| 1 | Managers tracked | `orgStats.total` | "with active direct reports" | text-gray-900 | BarChart3 (gray-400) |
| 2 | High impact managers | `orgStats.highImpact` | "score ≥ 75 — teams growing fast" | text-emerald-600 | Star (emerald-400) |
| 3 | Reports near promotion | `orgStats.totalNearReady` | "across all manager teams" | text-sky-600 | TrendingUp (sky-400) |
| 4 | Stalled reports | `orgStats.totalStalled` | "24m+ in level, <50% ready" | text-red-600 | AlertTriangle (red-400) |

**`orgStats` computation** (memoized, `allMetrics` dependency):

```
withReports = allMetrics.filter(m => m.reports.length > 0)
n = withReports.length

orgStats = {
  total:          n,
  avgScore:       n > 0 ? Math.round(sum(effectivenessScore(m)) / n) : 0,  // computed but NOT displayed
  highImpact:     count where effectivenessScore(m) >= 75,
  needsSupport:   count where effectivenessScore(m) < 40,                  // computed but NOT displayed
  totalStalled:   sum(m.stalledCount),
  totalNearReady: sum(m.nearReadyCount),
}
```

`avgScore` and `needsSupport` are in `orgStats` but are only used in the export (see §3.8).

### 3.4 Score legend bar

`bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-6`.

- Label: "Effectiveness score:" (`text-xs font-semibold text-gray-400 uppercase tracking-wider`)
- Four legend entries (`flex items-center gap-1.5` each):

| Label | Range | Circle (`w-2.5 h-2.5 rounded-full`) |
|---|---|---|
| High Impact | 75–100 | bg-emerald-500 |
| Effective | 55–74 | bg-sky-500 |
| Developing | 40–54 | bg-amber-400 |
| Needs Support | <40 | bg-red-400 |

Each entry: circle + label (`text-xs text-gray-600 font-medium`) + range (`text-xs text-gray-400`).

- Right-aligned formula caption (`ml-auto`): "Score = readiness (40%) + framework completion (30%) + stall penalty (30%)" (`text-xs text-gray-400`)

### 3.5 Filter and sort bar

`bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-4`.

**Left — Department filter** (`flex items-center gap-2`):
- Filter icon (`size=13 text-gray-400`)
- "Department:" label (`text-xs text-gray-500 font-medium`)
- Buttons container (`flex items-center gap-1`):
  - "All" button
  - One button per entry in the `DEPARTMENTS` array (all 7 departments, in order)

All filter buttons: `text-xs px-2.5 py-1 rounded-lg font-medium transition-colors`
- Active (`deptFilter === value`): `bg-gray-900 text-white`
- Inactive: `text-gray-500 hover:bg-gray-100`

Clicking sets `deptFilter` state (initial: `'all'`).

**Right — Sort** (`ml-auto flex items-center gap-2`):
- "Sort by:" label (`text-xs text-gray-500 font-medium`)
- Four sort buttons (same styling as filter buttons):

| Key (`sortKey`) | Button label | Sort comparison |
|---|---|---|
| `'readiness'` | "Effectiveness score" | `effectivenessScore(b) - effectivenessScore(a)` |
| `'completionRate'` | "Framework completion" | `b.avgFrameworkCompletion - a.avgFrameworkCompletion` |
| `'stalled'` | "Stalled reports" | `b.stalledCount - a.stalledCount` |
| `'teamSize'` | "Team size" | `b.reports.length - a.reports.length` |

All four sorts are descending. Initial `sortKey`: `'readiness'`.

**`filtered` computation** (memoized, depends on `allMetrics`, `deptFilter`, `sortKey`):

```
result = allMetrics.filter(m => m.reports.length > 0)   // always applied first
if deptFilter !== 'all':
  result = result.filter(m => m.manager.department === deptFilter)
return [...result].sort(comparison for sortKey)          // new array (original not mutated)
```

### 3.6 Manager card grid

`main className="flex-1 overflow-auto p-8"`.

**When `filtered.length === 0`:**
- `flex items-center justify-center h-48 text-gray-400 text-sm`
- Text: "No managers match the current filter"
- Note: `UpsellBanner` and `FeedbackBanner` are **not** shown in the empty state

**When `filtered.length > 0`:**
- `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5` (`data-tour="managers-card-grid"`)
- `<UpsellBanner variant="manager-coaching" className="mt-8" />` — below the grid, Keystone Partners coaching upsell
- `<FeedbackBanner context="Manager Effectiveness" className="mt-4" />` — below the upsell banner

Both banners are rendered inside the non-empty branch only.

### 3.7 Manager cards

Each `ManagerCard` is a `<button>`:
```
text-left w-full bg-white rounded-2xl border border-gray-200 p-5 group
transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300
```

Click: `setSelectedManager(metrics)` → renders `ManagerDetail`.

**Initials:** `manager.name.split(' ').map(n => n[0]).join('')` — first letter of every word. E.g. "Alex Rivera" → "AR", "Claire Zhou" → "CZ".

---

**Header row** (`flex items-start justify-between mb-4`):

*Left* (`flex items-center gap-3`):
- **Avatar** (40×40, `rounded-xl`, `text-sm font-bold text-white flex-shrink-0`): background `DEPT_COLORS[manager.department]`. Content: all initials.
- Name (`text-sm font-bold text-gray-900`) + title (`text-[11px] text-gray-400 mt-0.5`)

*Right* (`flex items-center gap-2`):
- **Score badge** (`rounded-lg border px-2.5 py-1 text-center`):
  - Background + border from `scoreBg(score)` (see §5.4)
  - Score number: `text-base font-black leading-none` in `scoreColor(score)` class
  - Score label: `text-[9px] font-semibold mt-0.5` in same `scoreColor(score)` class
- **ChevronRight** (`size=15 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all flex-shrink-0`)

---

**Meta row** (`flex items-center gap-3 mb-4 text-[11px] text-gray-400`):

| Element | Content |
|---|---|
| MapPin (size=9) | `manager.location` |
| Users (size=9) | `"{reports.length} reports"` |
| Clock (size=9) | `"{manager.tenure}m in role"` |
| `ml-auto` TrendIcon + label | `trendLabel` string |

---

**Metrics grid** (`grid-cols-3 gap-2 mb-4`):

| Column | Value | Background | Value colour |
|---|---|---|---|
| Avg readiness | `{avgReadiness}%` | `bg-gray-50 rounded-xl p-2.5` | `text-gray-900` (always) |
| Near ready | `{nearReadyCount}` | `bg-gray-50 rounded-xl p-2.5` | emerald-600 if `nearReadyCount > 0`; gray-400 if 0 |
| Stalled | `{stalledCount}` | red-50 if `stalledCount > 0`; gray-50 if 0 | red-600 if `stalledCount > 0`; gray-400 if 0 |

All: `text-base font-black` for value, `text-[10px] text-gray-400 mt-0.5` for label ("Avg readiness" / "Near ready" / "Stalled").

---

**Framework completion bar**:

Label row (`flex items-center justify-between mb-1`):
- "Framework completion" (`text-[10px] text-gray-500 font-medium`)
- `{avgFrameworkCompletion}%` (`text-[10px] font-bold text-gray-700`)

Bar (`w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`):
- Fill: `bg-sky-500 transition-all duration-700` at `{avgFrameworkCompletion}%` width
- Colour is always sky-500 regardless of score (not conditional)

### 3.8 Export content (org view)

`buildExportContent()` is called by `ExportButtons` on download or email. Iterates `allMetrics.filter(m => m.reports.length > 0)` — **all managers with reports, not the currently filtered/sorted subset**.

The score is re-calculated inline (not using `effectivenessScore` helper — identical formula written out):
```
score = Math.round(
  m.avgReadiness * 0.4 +
  m.avgFrameworkCompletion * 0.3 +
  (100 - (m.stalledCount / m.reports.length) * 100) * 0.3
)
```

```
MANAGER EFFECTIVENESS — ACME CORP
Generated: [date]
==================================================

Managers tracked: {orgStats.total}
High impact (75+): {orgStats.highImpact}
Reports near promotion: {orgStats.totalNearReady}
Stalled reports: {orgStats.totalStalled}
Avg score: {orgStats.avgScore}

MANAGER BREAKDOWN
--------------------------------------------------
{manager.name} ({manager.title})
  Score: {score} | Team: {reports.length} reports | Near-ready: {nearReadyCount} | Stalled: {stalledCount}
  Avg readiness: {avgReadiness}% | Framework completion: {avgFrameworkCompletion}%
(blank line)
...
```

Note `Avg score` appears in the export summary even though it is not displayed anywhere in the UI.

---

## 4. ManagerDetail — individual manager view

Rendered when `selectedManager !== null` — replaces the entire `ManagerEffectiveness` output.

### 4.1 Page structure

Outermost: `flex flex-col min-h-screen bg-gray-50 font-sans`.

`main` element: `flex-1 overflow-auto p-8`. Inner wrapper: `max-w-6xl mx-auto space-y-8` — content is centre-constrained to 1152px max and sections are separated by 32px gaps.

**Sections (top to bottom):**
1. Header (sticky white, flex-shrink-0)
2. Primary KPI grid (4 columns)
3. Secondary KPI grid (3 columns)
4. Two-column panel: Top blocking skills + Skill profile
5. Direct reports list
6. Coaching suggestions

### 4.2 Header — breadcrumb row

`header` element: `bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0` (`data-tour="managers-detail-header"`).

**Breadcrumb** (`flex items-center gap-3 mb-5`):
- **Back button** (`flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group`):
  - ArrowLeft (`size=15 group-hover:-translate-x-0.5 transition-transform`) + "All managers"
  - Click: `onBack()` → sets `selectedManager` to null
- Separator: "/" (gray-300)
- **Mini avatar** (20×20, `rounded flex items-center justify-center text-white text-[10px] font-bold`): background `DEPT_COLORS[dept]`, content = `initials[0]` (**first initial only**, not all initials — e.g. "A" for "Alex Rivera")
- Manager name (`text-sm font-semibold text-gray-900`)

### 4.3 Header — manager info and score badge

Main header row (`flex items-start justify-between`):

**Left** (`flex items-center gap-4`):
- **Avatar** (48×48, `rounded-xl text-white font-bold text-base flex-shrink-0`): background `DEPT_COLORS[dept]`. Content: **all initials** (both letters, e.g. "AR") — uses the same `initials` variable, not `initials[0]`.
- Name block:
  - Row 1 (`flex items-center gap-3`): manager name (h1, `text-xl font-bold text-gray-900`) + title badge (`text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium`)
  - Row 2 (`flex items-center gap-3 mt-1 text-xs text-gray-400`):
    - MapPin (`size=11`) + `manager.location`
    - Users (`size=11`) + `"{reports.length} direct reports"`
    - Clock (`size=11`) + `"{manager.tenure}m in role"`
    - Department name styled via `style={{ color: deptColor }}` (not a Tailwind class — the dept colour is applied inline)
    - `ml-1` span: TrendIcon + `trendLabel`
  - Row 3 (`text-xs text-gray-400 mt-1`): `"Teams: {manager.teams.join(', ')}"`

**Right** (`flex items-start gap-4`):
- `ExportButtons title="{manager.name} — Manager Detail"` — Download + Email me. See §4.10.
- **Score badge** (`rounded-2xl border {sc.bg} {sc.border} px-5 py-3 text-center min-w-[100px]`):
  - Score: `text-4xl font-black leading-none {sc.text}`
  - Label: `text-xs font-bold mt-1 {sc.text}` (e.g. "High Impact")
  - Sub-label: "Effectiveness score" (`text-[10px] text-gray-400 mt-0.5`)

`sc` = `scoreColor(score)` which in `ManagerDetail` returns an object `{ text, bg, border, bar }` (see §5.4).

### 4.4 Primary KPI grid

`grid-cols-4 gap-4` (`data-tour="managers-detail-kpis"`). Each card: `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`. Structure: icon + label (`flex items-center gap-2 mb-2`), value (`text-3xl font-black`), sub-label (`text-xs text-gray-400 mt-1`).

| # | Label | Value | Sub-label | Value colour | Icon |
|---|---|---|---|---|---|
| 1 | Avg readiness | `{avgReadiness}%` | "across all reports" | text-gray-900 | TrendingUp (sky-400, size=14) |
| 2 | Near ready (≥90%) | `{nearReadyCount}` | `"{progressingCount} more progressing"` | text-emerald-600 | Star (emerald-400, size=14) |
| 3 | Stalled reports | `{stalledCount}` | "24m+ in level, <50% ready" | red-600 if `stalledCount > 0`; gray-400 if 0 | AlertTriangle (size=14): red-400 if > 0; **gray-300** if 0 |
| 4 | Framework completion | `{avgFrameworkCompletion}%` | `"{strongSkillCount}/{totalSkillCriteria} skills at target"` | text-gray-900 | CheckCircle2 (sky-400, size=14) |

The stalled card's icon colour also changes conditionally: `stalledCount > 0 ? 'text-red-400' : 'text-gray-300'`.

### 4.5 Secondary KPI grid

`grid-cols-3 gap-4`. Each card: `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`. Icon + label row uses `mb-2`.

**Card 1 — Avg tenure in level:**
- Icon: Clock (`size=14 text-gray-400`)
- Label: "Avg tenure in level"
- Value: `{avgTenure}m` (3xl font-black, always **text-gray-900**)
- Sub-label (conditional on `avgTenure > 20`):
  - `> 20` → "Above average — check blockers"
  - `≤ 20` → "Healthy velocity"

**Card 2 — Promotion ready:**
- Icon: Star (`size=14 text-emerald-400`)
- Label: "Promotion ready"
- Value: `{promotionReadyCount}` (3xl font-black, **text-emerald-600** always)
- Sub-label: "≥90% ready + ≥18m tenure"

**Card 3 — Reports with gaps:**
- Icon: XCircle (`size=14 text-red-400`)
- Label: "Reports with gaps"
- Value: `{blockedCount}` (3xl font-black, **text-gray-900** always — not conditional)
- Sub-label: "have ≥1 blocking skill gap"

### 4.6 Top blocking skills panel

Left column of the `grid-cols-2 gap-6` section (`data-tour="managers-detail-skills"`).

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`.

**Header** (`flex items-center gap-2 mb-5`):
- AlertTriangle (`size=14 text-red-400`)
- "Top blocking skills" (`text-sm font-bold text-gray-900`)
- `ml-auto` count: `"{blockingRanked.length} skills with gaps"` (`text-xs text-gray-400`) — this is the number of **distinct blocking skills** (max 6), not the number of blocked reports (`blockedCount`)

**`blockingRanked` computation** (memoized on `readinessResults`):
```
map = Map<skillName, count>
for each r in readinessResults:
  for each gap in r.gapSkills:
    map[gap.skillName]++

Array.from(map.entries())
  .sort(([, a], [, b]) => b - a)   // descending by count
  .slice(0, 6)                      // top 6 only
```

Note: this is re-derived in `ManagerDetail` from raw `readinessResults.gapSkills`. It can differ from `topBlockingSkill`/`topBlockingSkillCount` (pre-computed in `managerData.ts`) on tie-breaking, since the Map insertion order differs between the two computations.

**Empty state** (when `blockingRanked.length === 0`):
- "No blocking skill gaps — excellent!" (`text-sm text-gray-400 text-center py-8`)

**Skill list** (`space-y-3`, only when non-empty):

Each skill row:
- Row (`flex items-center justify-between mb-1`):
  - Skill name (`text-xs font-semibold text-gray-700`)
  - Count label (`text-xs text-gray-500`): `"{count} of {readinessResults.length} reports"` — denominator is `readinessResults.length` (people with frameworks), not `reports.length`
- Bar (`w-full bg-gray-100 rounded-full h-2 overflow-hidden`):
  - Fill: `bg-red-400 transition-all` at `(count / readinessResults.length) * 100%`

**Coaching priority box** (shown when `topBlockingSkill !== '—'`, `mt-5`):
- Container: `bg-red-50 border border-red-100 rounded-xl p-3`
- "Coaching priority" (`text-xs font-semibold text-red-700`)
- `{topBlockingSkill}` (`text-sm font-bold text-red-800 mt-0.5`)
- `"Blocking {topBlockingSkillCount} of {readinessResults.length} reports"` (`text-[11px] text-red-500 mt-0.5`)
- Button row (`flex gap-2 mt-2`) — each button only shown if its prop is provided:
  - **"Dept gap report"** (shown when `onNavigateToGapReport` prop exists):
    - `flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors`
    - ExternalLink (`size=9`) + "Dept gap report"
    - Click: `onNavigateToGapReport(manager.department)` — navigates to Skills Gap Report for this manager's department
  - **"Skills heatmap"** (shown when `onNavigateToHeatmap` prop exists):
    - Same style as "Dept gap report"
    - ExternalLink (`size=9`) + "Skills heatmap"
    - Click: `onNavigateToHeatmap()` — navigates to Skills Gap Heatmap (no dept filter passed)

### 4.7 Skill profile panel

Right column of the two-column grid.

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`.

**Header** (`flex items-center gap-2 mb-5`):
- CheckCircle2 (`size=14 text-sky-400`)
- "Skill profile — team avg vs target" (`text-sm font-bold text-gray-900`)

**`skillStrengths` computation** (memoized on `readinessResults`):

```
criteriaMap = Map<skillId, { name, required, actuals: number[] }>

for each r in readinessResults:
  allCriteria = [
    // metSkills don't carry actualRating, so it's looked up:
    ...r.metSkills.map(s => ({ ...s, actualRating: r.person.skills[s.skillId] ?? 0 })),
    ...r.gapSkills   // already carry actualRating
  ]
  for each criterion c in allCriteria:
    if skillId not in criteriaMap: initialise with name, required, actuals=[]
    criteriaMap[c.skillId].actuals.push(r.person.skills[c.skillId] ?? 0)
    // note: actuals always uses person.skills lookup, not c.actualRating

→ for each entry:
  avg = actuals.length > 0 ? sum(actuals) / actuals.length : 0
  avg = parseFloat(avg.toFixed(1))   // rounded to 1dp BEFORE further use
  gap = Math.max(0, required - avg)

→ sorted descending by gap
```

**Important:** `avg` is rounded to 1 decimal place via `parseFloat(avg.toFixed(1))` before computing `gap` and before the `atTarget` check. A skill averaging 2.96 with `required=3` displays as "3.0 / 3" and is `atTarget`.

The `gap` field drives sort order but is **never displayed** in the UI. Only `name`, `required`, `avg`, and the derived boolean `atTarget = avg >= required` are rendered.

**Display** (`space-y-2.5`): top 8 entries — `skillStrengths.slice(0, 8)`.

Each row:
- Row 1 (`flex items-center justify-between mb-1`):
  - Skill name (`text-[11px] font-medium text-gray-700 truncate pr-2`)
  - Status + score (`flex items-center gap-1.5 flex-shrink-0`):
    - If `atTarget`: CheckCircle2 (`size=11 text-emerald-500`) + `"{avg.toFixed(1)} / {required}"` (11px bold, **text-emerald-600**)
    - If not: XCircle (`size=11 text-red-400`) + `"{avg.toFixed(1)} / {required}"` (11px bold, **text-red-500**)
- Row 2 — bar (`relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`):
  - Fill: `bg-emerald-400` if `atTarget`; `bg-red-400` if not; `transition-all`; width = `Math.min((avg / required) * 100, 100)%`
  - **Target marker**: `absolute top-0 bottom-0 w-px bg-gray-400 opacity-50 style={{ left: '100%' }}` — a 1px vertical line positioned at the right edge. Because the container has `overflow-hidden`, this marker is always clipped and never visually visible. It is a cosmetic artefact.

### 4.8 Direct reports list

`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm` (`data-tour="managers-detail-reports"`).

**Header** (`flex items-center gap-3 mb-5`):
- Users (`size=14 text-gray-400`)
- "Direct reports" (`text-sm font-bold text-gray-900`)
- Count badge: `{reports.length}` (`text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full`) — this is **all** reports, including those without framework data
- **Stalled alert** (shown when `stalledCount > 0`, `ml-auto`): `"{stalledCount} stalled"` (`text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full`)

**Empty state** (when `sortedResults.length === 0`):
- "No promotion pipeline data for this team" (`text-sm text-gray-400 text-center py-8`)
- This state occurs when all of the manager's reports are at terminal levels or have no defined framework. The count badge in the header still shows `reports.length > 0` in this case — the header count and list content can diverge.

**`sortedResults`** (memoized): `[...readinessResults].sort((a, b) => b.readinessPct - a.readinessPct)` — pure descending readiness sort. The comment in code says "near-ready first, then by readiness desc" but the implementation is a single comparison that is equivalent to readiness-descending (near-ready people naturally appear first because they have the highest scores).

**Report list** (`space-y-2`): each entry is a `ReportRow`. See §5.2.

### 4.9 Coaching suggestions

`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm` (`data-tour="managers-detail-coaching"`).

**Header** (`flex items-center gap-2 mb-5`):
- ChevronRight (`size=14 text-gray-400`)
- "Coaching suggestions" (`text-sm font-bold text-gray-900`)

**Suggestions list** (`space-y-2`): 1–4 items depending on conditions. Each item: `flex items-start gap-3 p-3.5 rounded-xl border`.

---

**Suggestion 1 — Promotion ready** (shown when `promotionReadyCount > 0`):
- Container: `bg-emerald-50 border-emerald-100`
- Star (`size=14 text-emerald-500 mt-0.5 flex-shrink-0`)
- Title: `"{N} report{s} ready to promote"` — pluralised: no "s" when `promotionReadyCount === 1`; adds "s" otherwise. (`text-xs font-semibold text-emerald-800`)
- Body: "Review these individuals for formal promotion consideration in the next cycle." (`text-[11px] text-emerald-600 mt-0.5`)
- **"View in promotion pipeline" link** (shown when `onNavigateToPipeline` prop exists):
  - `mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors`
  - ExternalLink (`size=9`) + "View in promotion pipeline"
  - Click: `onNavigateToPipeline(manager.department)` — navigates to Promotion Pipeline filtered to manager's department

---

**Suggestion 2 — Stalled reports** (shown when `stalledCount > 0`):
- Container: `bg-red-50 border-red-100`
- AlertTriangle (`size=14 text-red-400 mt-0.5 flex-shrink-0`)
- Title: `"{N} report{s} showing stall signals"` — pluralised same way (`text-xs font-semibold text-red-800`)
- Body: "High tenure + low readiness. Schedule 1:1 coaching conversations and review blockers." (`text-[11px] text-red-600 mt-0.5`)
- No navigation link.

---

**Suggestion 3 — Team-wide skill gap** (shown when `topBlockingSkill !== '—'`):
- Container: `bg-amber-50 border-amber-100`
- AlertTriangle (`size=14 text-amber-500 mt-0.5 flex-shrink-0`)
- Title: `"Team-wide gap: {topBlockingSkill}"` (`text-xs font-semibold text-amber-800`)
- Body: `"Blocking {topBlockingSkillCount} reports. Consider a team workshop or shared learning resource."` (`text-[11px] text-amber-700 mt-0.5`) — **not pluralised**, always "reports"
- No navigation link.

---

**Suggestion 4 — Framework completion** (always shown, every manager):
- Container: `bg-sky-50 border-sky-100`
- TrendingUp (`size=14 text-sky-500 mt-0.5 flex-shrink-0`)
- Title: `"Framework completion at {avgFrameworkCompletion}%"` (`text-xs font-semibold text-sky-800`)
- Body (conditional, `text-[11px] text-sky-600 mt-0.5`):
  - `avgFrameworkCompletion >= 70` → "Strong coverage — keep reinforcing career conversations."
  - `avgFrameworkCompletion < 70` → "Below 70%. Prioritise structured development plans with each report."
- No navigation link.

### 4.10 Export content (manager detail)

`buildExportContent()` called by `ExportButtons`. Uses `sortedResults` (readiness-descending).

```
MANAGER DETAIL — {MANAGER.NAME.TOUPPERCASE()}
Generated: [date]
==================================================

Title: {manager.title}
Department: {manager.department}
Location: {manager.location}
Tenure in role: {manager.tenure}m
Effectiveness score: {score}

Avg readiness: {avgReadiness}%
Near ready (90%+): {nearReadyCount}
Progressing: {progressingCount}
Stalled: {stalledCount}
Framework completion: {avgFrameworkCompletion}%
Top blocking skill: {topBlockingSkill}

DIRECT REPORTS
--------------------------------------------------
{person.name} — {readinessPct}% ({tier}) | {criteriaMet}/{criteriaTotal} criteria | {person.tenure}m tenure
...
```

Tier text (inline, not from TIER_CONFIG): `>= 90 → 'Near Ready'`; `>= 70 → 'Progressing'`; `>= 50 → 'Developing'`; else `'Early'`.

People without framework data are excluded (export uses `sortedResults` which comes from `readinessResults`, not `reports`).

---

## 5. Shared components

### 5.1 TrendIcon

Used in both `ManagerEffectiveness` (manager card meta row) and `ManagerDetail` (header meta row). Defined separately in each file — not shared via import.

| `trend` value | Icon | Colour |
|---|---|---|
| `'up'` | TrendingUp (`size=13`) | text-emerald-500 |
| `'down'` | TrendingDown (`size=13`) | text-red-400 |
| `'flat'` | Minus (`size=13`) | text-gray-400 |

### 5.2 ReportRow

Stateless component in `ManagerDetail`. Receives one `ReadinessResult`.

**Derived values:**
```
tier = getReadinessTier(result.readinessPct)   // from promotionData.ts
cfg = TIER_CONFIG[tier]
initials = result.person.name.split(' ').map(n => n[0]).join('')
nextTitle = result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel
  // strips dept prefix: "IC3 · Senior Engineer" → "Senior Engineer"
isStalled = result.person.tenure > 24 && result.readinessPct < 50
```

**Container:** `flex items-center gap-3 p-3.5 rounded-xl border {cfg.border} {cfg.bg}` — tier-coloured border and background.

**Avatar** (32×32, `rounded-lg flex-shrink-0`): Always `bg-gradient-to-br from-slate-600 to-slate-800` — same dark gradient regardless of tier. White `text-[10px] font-bold`. Content: all initials.

**Left section** (`flex-1 min-w-0`):
- Name row (`flex items-center gap-2`):
  - Name: `text-xs font-semibold text-gray-800 truncate`
  - **Stalled badge** (shown when `isStalled`): "Stalled" (`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0`)
- Meta row (`flex items-center gap-2 mt-0.5`):
  - `{result.person.team}` (10px, gray-400)
  - "·" separator (gray-300)
  - MapPin (`size=8`) + `{result.person.location}` (10px, gray-400, `flex items-center gap-0.5`)
  - "·" separator (gray-300)
  - Clock (`size=8`) + `{result.person.tenure}m` (10px, gray-400, `flex items-center gap-0.5`)

**Right section** (`text-right flex-shrink-0`):
- Next level row (`flex items-center gap-2 justify-end mb-1`):
  - `"→ {nextTitle}"` (10px, gray-500)
  - Tier badge: `text-[10px] font-bold px-1.5 py-0.5 rounded-full {cfg.badge}` + `{cfg.label}` (e.g. "Near Ready")
- Progress row (`flex items-center gap-1.5 justify-end`):
  - Bar (80px, `bg-white/70 rounded-full h-1.5 overflow-hidden border border-black/5`): fill `{cfg.barColor}` at `{readinessPct}%`
  - `{readinessPct}%` (10px bold, gray-600)
- Criteria: `"{criteriaMet}/{criteriaTotal} criteria"` (10px, gray-400, `mt-0.5`)

### 5.3 effectivenessScore formula

Defined in **both** files independently — not shared via import. Identical formula:

```typescript
function effectivenessScore(m: ManagerMetrics): number {
  const stallPenalty = m.reports.length > 0
    ? (m.stalledCount / m.reports.length) * 100
    : 0;
  return Math.round(
    m.avgReadiness * 0.4 +
    m.avgFrameworkCompletion * 0.3 +
    (100 - stallPenalty) * 0.3
  );
}
```

**Component breakdown:**
- `avgReadiness * 0.4` — contributes 0–40 points
- `avgFrameworkCompletion * 0.3` — contributes 0–30 points
- `(100 - stallPenalty) * 0.3` — contributes 0–30 points
  - 0 stalled → contributes 30 points
  - 50% stalled → contributes 15 points
  - 100% stalled → contributes 0 points
  - `reports.length === 0` → `stallPenalty = 0`, contributes full 30 points

**Score range:** 0–100 integer (rounded).

### 5.4 scoreColor / scoreBg / scoreLabel

**In `ManagerEffectiveness`** — three separate functions returning strings:

| Function | Returns |
|---|---|
| `scoreColor(score)` | Single Tailwind text class: `text-emerald-600 \| text-sky-600 \| text-amber-600 \| text-red-600` |
| `scoreBg(score)` | Two Tailwind classes: `"bg-X border-Y"` |
| `scoreLabel(score)` | Text string |

**In `ManagerDetail`** — `scoreColor` returns an **object** `{ text, bg, border, bar }`. `scoreLabel` is a separate function with identical logic.

**Thresholds (identical in both files):**

| Score | Label | text | bg | border | bar |
|---|---|---|---|---|---|
| ≥ 75 | High Impact | text-emerald-600 | bg-emerald-50 | border-emerald-100 | bg-emerald-500 |
| ≥ 55 | Effective | text-sky-600 | bg-sky-50 | border-sky-100 | bg-sky-500 |
| ≥ 40 | Developing | text-amber-600 | bg-amber-50 | border-amber-100 | bg-amber-400 |
| < 40 | Needs Support | text-red-600 | bg-red-50 | border-red-100 | bg-red-400 |

`bar` from `scoreColor` in `ManagerDetail` is defined but **not used** in any rendered element.

---

## 6. Data model and computations

### 6.1 Manager source data (MANAGERS)

11 managers across 7 departments. Each `Manager`: `id`, `name`, `title`, `department`, `location`, `teams: string[]`, `tenure` (months in role).

| ID | Name | Title | Dept | Location | Teams | Tenure |
|---|---|---|---|---|---|---|
| mgr-e1 | Alex Rivera | Engineering Manager | Engineering | London | Platform, Frontend | 30m |
| mgr-e2 | Nina Obi | Engineering Manager | Engineering | New York | Backend | 22m |
| mgr-e3 | Sven Holst | Engineering Manager | Engineering | Berlin | Mobile, Infrastructure | 18m |
| mgr-p1 | Claire Zhou | Director of Product | Product | London | Growth, Core | 36m |
| mgr-p2 | James Osei | Senior PM | Product | Remote | Partnerships | 14m |
| mgr-d1 | Mara Santos | Design Lead | Design | London | Product Design, Brand, UX Research | 28m |
| mgr-da1 | Yoko Tanaka | Head of Data | Data | Singapore | Analytics, ML & AI, Data Eng | 24m |
| mgr-m1 | Pierre Duval | VP Marketing | Marketing | London | Performance, Brand, Content | 20m |
| mgr-s1 | Keisha Brown | Sales Manager | Sales | London | Enterprise | 32m |
| mgr-s2 | Will Park | Sales Manager | Sales | New York | Mid-Market, SMB | 16m |
| mgr-hr1 | Anya Reeves | Head of People | People Ops | London | HR Business Partners, Talent, L&D | 42m |

Note: `mgr-p2` (James Osei, Partnerships team) will have 0 reports because no PEOPLE entries are assigned to the "Partnerships" team. This manager is excluded from all filtered views and export content by the `m.reports.length > 0` guard.

### 6.2 Report filtering

A person is a manager's report when **both** conditions hold:

```
person.department === manager.department
AND
manager.teams.includes(person.team)
```

Team name matching is **exact string comparison** (case-sensitive). "Platform" ≠ "platform".

### 6.3 computeManagerMetrics — all fields

**`getFrameworkForPerson(person)` helper:**
```
currentLevel = LEVEL_DEFINITIONS.find(l.id === person.currentLevelId)
if !currentLevel?.nextLevel → return null   // terminal level
nextLevel = LEVEL_DEFINITIONS.find(l.id === currentLevel.nextLevel)
if !nextLevel → return null
framework = LEVEL_FRAMEWORKS.find(f.levelId === nextLevel.id)
if !framework → return null                 // no criteria defined for next level
return { framework, nextLevel }
```

**`readinessResults`:** For each person in `reports`, calls `getFrameworkForPerson`. If null, the person is skipped — they are in `reports` but not in `readinessResults`. `computeReadiness` is called with `fw.nextLevel.label`.

---

**`avgReadiness`:**
```
n = readinessResults.length
n > 0 ? Math.round(sum(r.readinessPct) / n) : 0
```

**`nearReadyCount`:** `readinessResults.filter(r => r.readinessPct >= 90).length`

**`progressingCount`:** `readinessResults.filter(r => r.readinessPct >= 70 && r.readinessPct < 90).length`

**`avgTenure`:**
```
reports.length > 0 ? Math.round(sum(p.tenure for p in reports) / reports.length) : 0
```
Computed from **all reports** including those without frameworks. `p.tenure` = months in current level.

**`avgFrameworkCompletion`:**
```
n > 0 ? Math.round(sum(r.criteriaMet / r.criteriaTotal * 100) / n) : 0
```
Per-person percentage of criteria met, averaged across team. Numerically equivalent to `avgReadiness` (since `readinessPct = Math.round(criteriaMet / criteriaTotal * 100)`), but computed independently.

**`blockedCount`:** `readinessResults.filter(r => r.gapSkills.length > 0).length`
People with at least one skill below the required rating.

**`topBlockingSkill` and `topBlockingSkillCount`:**
```
blockingMap = Map<skillName, count>
for each r in readinessResults:
  for each gap in r.gapSkills:
    blockingMap[gap.skillName]++

topBlockingSkill = skill with max count (iterates map.entries() — tie-breaks by map insertion order, i.e. first encountered)
topBlockingSkillCount = that count
Default: '—' and 0 if blockingMap is empty
```

**`promotionReadyCount`:**
```
readinessResults.filter(r => r.readinessPct >= 90 && r.person.tenure >= 18).length
```

**`stalledCount`:**
```
readinessResults.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length
```
Note: tenure threshold is **strictly greater than 24** (not ≥ 24).

**`strongSkillCount` and `totalSkillCriteria`:**
```
criteriaMap = Map<skillId, { required, actuals: number[] }>
for each r in readinessResults:
  for each criterion in [...r.metSkills, ...r.gapSkills]:
    criteriaMap[skillId].actuals.push(r.person.skills[skillId] ?? 0)

totalSkillCriteria = criteriaMap.size   (unique skill IDs across all frameworks in team)
strongSkillCount = count where avg(actuals) >= required
  (using raw average, no rounding — differs from skillStrengths in ManagerDetail which rounds to 1dp)
```

**`trend` and `trendLabel`:**
```
stallRatio = reports.length > 0 ? stalledCount / reports.length : 0

if avgReadiness >= 70 AND stallRatio < 0.15:
  trend = 'up',   trendLabel = 'Team growing fast'
else if stallRatio > 0.3 OR avgReadiness < 45:
  trend = 'down', trendLabel = 'Several reports stalled'
else:
  trend = 'flat', trendLabel = 'Steady progress'
```

Boundaries: `stallRatio < 0.15` for up; `> 0.3` for down; neither ≥ 0.15 nor > 0.3 gives flat. There is an overlap-free gap between the boundaries (0.15–0.3 is always flat if readiness is also in mid range).

### 6.4 getAllManagerMetrics

```typescript
export function getAllManagerMetrics(): ManagerMetrics[] {
  return MANAGERS.map(computeManagerMetrics);
}
```

Returns all 11 managers' metrics. In `ManagerEffectiveness`, this is called once via `useMemo(() => getAllManagerMetrics(), [])` and the result is stable for the component lifetime (data is static).

---

## 7. Constants and configuration

| Constant | Value | Location | Purpose |
|---|---|---|---|
| `MANAGERS` | 11 Manager entries | managerData.ts:24 | Source data |
| `SortKey` | `'readiness' \| 'stalled' \| 'teamSize' \| 'completionRate'` | ManagerEffectiveness.tsx:11 | Sort type |
| Stall definition | `tenure > 24 && readinessPct < 50` | managerData.ts:135, ManagerDetail.tsx:41 | Applied in data and in `ReportRow.isStalled`; tenure boundary is strictly > 24 |
| Promotion ready definition | `readinessPct >= 90 && person.tenure >= 18` | managerData.ts:134 | `promotionReadyCount` |
| Trend thresholds | up: readiness ≥ 70 AND stall < 15%; down: stall > 30% OR readiness < 45% | managerData.ts:161–170 | `trend` field |
| effectivenessScore weights | 40% / 30% / 30% | Both tsx files:19–23 | Composite score |
| Score colour thresholds | 75 / 55 / 40 | Both tsx files | scoreColor, scoreBg, scoreLabel |

**`data-tour` attributes:**

| Value | Element | What it marks |
|---|---|---|
| `managers-org-stats` | `ManagerEffectiveness` header | Four org stat cards |
| `managers-card-grid` | `ManagerEffectiveness` main | Manager card grid |
| `managers-detail-header` | `ManagerDetail` header | Full header with breadcrumb + score badge |
| `managers-detail-kpis` | `ManagerDetail` main | Primary 4-column KPI grid |
| `managers-detail-skills` | `ManagerDetail` main | Two-column blocking skills + skill profile |
| `managers-detail-reports` | `ManagerDetail` main | Direct reports list |
| `managers-detail-coaching` | `ManagerDetail` main | Coaching suggestions card |
