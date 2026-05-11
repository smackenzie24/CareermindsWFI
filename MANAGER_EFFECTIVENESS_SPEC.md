# Manager Effectiveness — Product Specification

**Feature:** Manager Effectiveness
**Components:**
- `src/components/managerEffectiveness/ManagerEffectiveness.tsx` — org-level list view
- `src/components/managerEffectiveness/ManagerDetail.tsx` — individual manager drill-down
- `src/data/managerData.ts` — MANAGERS data, `ManagerMetrics` interface, `computeManagerMetrics`, `getAllManagerMetrics`

**Data source:** Static mock data. Manager reports are derived from `src/data/promotionData.ts` (PEOPLE, LEVEL_DEFINITIONS, LEVEL_FRAMEWORKS, computeReadiness).
**Last updated:** May 2026

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Navigation model](#2-navigation-model)
3. [ManagerEffectiveness — org-level view](#3-managereffectiveness--org-level-view)
   - 3.1 Page header
   - 3.2 Org-level stat cards
   - 3.3 Score legend bar
   - 3.4 Filter and sort bar
   - 3.5 Manager card grid
   - 3.6 Manager cards
   - 3.7 Export content
4. [ManagerDetail — individual manager view](#4-managerdetail--individual-manager-view)
   - 4.1 Page header and breadcrumb
   - 4.2 Score badge
   - 4.3 Primary KPI grid
   - 4.4 Secondary KPI grid
   - 4.5 Top blocking skills panel
   - 4.6 Skill profile panel
   - 4.7 Direct reports list
   - 4.8 Coaching suggestions
   - 4.9 Export content
5. [Shared components](#5-shared-components)
   - 5.1 TrendIcon
   - 5.2 ReportRow
   - 5.3 effectivenessScore
   - 5.4 scoreColor / scoreBg / scoreLabel
6. [Data model and computations](#6-data-model-and-computations)
   - 6.1 Manager source data (MANAGERS)
   - 6.2 Report filtering
   - 6.3 `computeManagerMetrics` — all fields
   - 6.4 `getAllManagerMetrics`
7. [Constants and configuration](#7-constants-and-configuration)

---

## 1. Feature overview

The Manager Effectiveness view aggregates promotion readiness data by manager to surface which teams are growing fastest and which need coaching support. Each manager's effectiveness is expressed as a single composite score (0–100) derived from three weighted components: team readiness, framework completion, and stall penalty.

The view has two states:

| State | Condition | Component |
|---|---|---|
| Org list | `selectedManager === null` | `ManagerEffectiveness` renders grid of manager cards |
| Manager detail | `selectedManager !== null` | `ManagerDetail` renders full-page deep dive |

---

## 2. Navigation model

`ManagerEffectiveness` uses a controlled/uncontrolled hybrid pattern identical to `PromotionPipeline`:

```
selectedManager = selectedManagerProp !== undefined ? selectedManagerProp : internalManager
```

`setSelectedManager(m)` always updates both `internalManager` and calls `onSelectManager?.(m)`.

**Props:**

| Prop | Type | Effect |
|---|---|---|
| `initialManagerId` | `string` | Sets `internalManager` initial state via `allMetrics.find(m => m.manager.id === id)`. If not found, initial state is null. |
| `selectedManager` | `ManagerMetrics \| null` | Controlled selection (takes precedence over `internalManager`) |
| `onSelectManager` | `(m: ManagerMetrics \| null) => void` | Callback when selection changes |
| `onNavigateToGapReport` | `(dept: Department) => void` | Cross-feature link → Skills Gap Report filtered to manager's dept |
| `onNavigateToHeatmap` | `() => void` | Cross-feature link → Skills Gap Heatmap (no dept param) |
| `onNavigateToPipeline` | `(dept?: Department) => void` | Cross-feature link → Promotion Pipeline, optionally filtered to dept |

When `selectedManager` is non-null, the entire component renders `ManagerDetail`. When `ManagerDetail` calls `onBack()`, `selectedManager` is set to null and the list view returns.

---

## 3. ManagerEffectiveness — org-level view

Rendered when `selectedManager === null`.

### 3.1 Page header

White header with bottom border (`border-b border-gray-100 px-8 py-5`).

**Left side:**
- Eyebrow: "Workforce Intelligence" (xs, uppercase, tracking-widest, gray-400, semibold)
- Title: "Manager Effectiveness" (2xl bold, gray-900)
- Subtitle: "Aggregate progression velocity and framework completion rates by manager. Identify whose teams are growing fastest — and who needs coaching support." (sm, gray-500, max-width 2xl)

**Right side (flex row, gap-3):**
- `ExportButtons` — title `"Manager Effectiveness"`. See §3.7.
- Live indicator: pulsing emerald dot (`w-2 h-2 bg-emerald-400 animate-pulse`) + "Acme Corp" (xs, gray-400)

### 3.2 Org-level stat cards

Four `OrgStat` cards in `grid-cols-4 gap-4` (`data-tour="managers-org-stats"`):

| # | Label | Value | Sub-label | Number colour | Icon |
|---|---|---|---|---|---|
| 1 | Managers tracked | `orgStats.total` | "with active direct reports" | text-gray-900 | BarChart3 (gray-400) |
| 2 | High impact managers | `orgStats.highImpact` | "score ≥ 75 — teams growing fast" | text-emerald-600 | Star (emerald-400) |
| 3 | Reports near promotion | `orgStats.totalNearReady` | "across all manager teams" | text-sky-600 | TrendingUp (sky-400) |
| 4 | Stalled reports | `orgStats.totalStalled` | "24m+ in level, <50% ready" | text-red-600 | AlertTriangle (red-400) |

**`orgStats` computation** (memoized, depends on `allMetrics`):

```
withReports = allMetrics.filter(m => m.reports.length > 0)
n = withReports.length

orgStats = {
  total:         n,
  avgScore:      Math.round(sum(effectivenessScore(m)) / n),   // not displayed in cards
  highImpact:    count where effectivenessScore(m) >= 75,
  needsSupport:  count where effectivenessScore(m) < 40,       // not displayed in cards
  totalStalled:  sum(m.stalledCount),
  totalNearReady: sum(m.nearReadyCount),
}
```

Note: `avgScore` and `needsSupport` are computed but not rendered in any card.

### 3.3 Score legend bar

White bar with bottom border, below the header. Contains:

- Label: "Effectiveness score:" (xs, uppercase, tracking-wider, gray-400, semibold)
- Four legend entries (coloured circle + label + range):

| Label | Range | Circle colour |
|---|---|---|
| High Impact | 75–100 | bg-emerald-500 |
| Effective | 55–74 | bg-sky-500 |
| Developing | 40–54 | bg-amber-400 |
| Needs Support | <40 | bg-red-400 |

- Right-aligned formula caption (ml-auto): "Score = readiness (40%) + framework completion (30%) + stall penalty (30%)" (xs, gray-400)

### 3.4 Filter and sort bar

White bar with bottom border (`px-8 py-3`). Two sections separated by `ml-auto`:

**Left — Department filter:**
- Filter icon (size=13, gray-400) + "Department:" label (xs, gray-500, medium)
- "All" button + one button per entry in `DEPARTMENTS` array
- Active: `bg-gray-900 text-white`
- Inactive: `text-gray-500 hover:bg-gray-100`
- All buttons: `text-xs px-2.5 py-1 rounded-lg font-medium transition-colors`
- Clicking sets `deptFilter` state. Filter applies to: `m.manager.department === deptFilter`

**Right — Sort:**
- "Sort by:" label (xs, gray-500, medium)
- Four sort buttons:

| Key | Button label |
|---|---|
| `readiness` | "Effectiveness score" |
| `completionRate` | "Framework completion" |
| `stalled` | "Stalled reports" |
| `teamSize` | "Team size" |

- Active: `bg-gray-900 text-white`
- Inactive: `text-gray-500 hover:bg-gray-100`
- Clicking sets `sortKey` state

**`filtered` computation** (memoized, depends on `allMetrics`, `deptFilter`, `sortKey`):

```
result = allMetrics.filter(m => m.reports.length > 0)   // always excludes managers with no reports
if deptFilter !== 'all': result = result.filter(m => m.manager.department === deptFilter)

sort by:
  'readiness':      effectivenessScore(b) - effectivenessScore(a)   (desc)
  'stalled':        b.stalledCount - a.stalledCount                  (desc)
  'teamSize':       b.reports.length - a.reports.length              (desc)
  'completionRate': b.avgFrameworkCompletion - a.avgFrameworkCompletion (desc)
```

**Empty state:** When `filtered.length === 0`, renders centred text in a 48-height container: "No managers match the current filter" (sm, gray-400).

### 3.5 Manager card grid

When `filtered.length > 0`:

- Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5` (`data-tour="managers-card-grid"`)
- Below the grid: `<UpsellBanner variant="manager-coaching" className="mt-8" />` (Keystone Partners coaching upsell)
- Below that: `<FeedbackBanner context="Manager Effectiveness" className="mt-4" />`

### 3.6 Manager cards

Each `ManagerCard` is a `<button>` element:
- `text-left w-full bg-white rounded-2xl border border-gray-200 p-5 group`
- `transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`
- `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300`
- Click: `setSelectedManager(metrics)` → navigates to `ManagerDetail`

**Header row (`flex items-start justify-between mb-4`):**

Left:
- **Avatar** (40×40, `rounded-xl`): background = `DEPT_COLORS[manager.department]`, white text (sm bold), content = all-initials (first letter of each name part, e.g. "AR" for "Alex Rivera")
- Manager name (sm bold, gray-900)
- Manager title (11px, gray-400, mt-0.5)

Right:
- **Score badge**: `rounded-lg border px-2.5 py-1 text-center`
  - Background+border from `scoreBg(score)`: emerald-50/emerald-100 | sky-50/sky-100 | amber-50/amber-100 | red-50/red-100
  - Score number: `text-base font-black leading-none` in `scoreColor(score)`
  - Score label: `text-[9px] font-semibold mt-0.5` in same colour from `scoreLabel(score)`
- **ChevronRight** (size=15, gray-400): `group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all`

**Meta row (`flex items-center gap-3 mb-4 text-[11px] text-gray-400`):**
- MapPin (size=9) + `manager.location`
- Users (size=9) + `{reports.length} reports`
- Clock (size=9) + `{manager.tenure}m in role`
- Right-aligned (`ml-auto`): `TrendIcon` + `trendLabel`

**Metrics grid (`grid-cols-3 gap-2 mb-4`):**

| Cell | Value | Background | Text colour |
|---|---|---|---|
| Avg readiness | `{avgReadiness}%` | `bg-gray-50 rounded-xl p-2.5` | text-gray-900 |
| Near ready | `{nearReadyCount}` | `bg-gray-50 rounded-xl p-2.5` | emerald-600 if > 0, gray-400 if 0 |
| Stalled | `{stalledCount}` | red-50 if > 0, gray-50 if 0 | red-600 if > 0, gray-400 if 0 |

Each cell: `text-base font-black` for value, `text-[10px] text-gray-400 mt-0.5` for label ("Avg readiness" / "Near ready" / "Stalled").

**Framework completion bar:**
- Label row: "Framework completion" (10px, gray-500, medium) + `{avgFrameworkCompletion}%` (10px, bold, gray-700)
- Bar: `w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`
- Fill: `bg-sky-500 transition-all duration-700` at `{avgFrameworkCompletion}%` width

### 3.7 Export content

`buildExportContent()` for the org list view (`ExportButtons` title: `"Manager Effectiveness"`):

```
MANAGER EFFECTIVENESS — ACME CORP
Generated: [date]
==================================================

Managers tracked: X
High impact (75+): X
Reports near promotion: X
Stalled reports: X
Avg score: X

MANAGER BREAKDOWN
--------------------------------------------------
[Manager Name] ([Title])
  Score: X | Team: X reports | Near-ready: X | Stalled: X
  Avg readiness: X% | Framework completion: X%
(blank line)
...
```

Iterates `allMetrics.filter(m => m.reports.length > 0)` — **all managers** (not just the filtered/sorted view). Score is re-calculated inline in `buildExportContent` using the same formula.

---

## 4. ManagerDetail — individual manager view

Rendered when `selectedManager !== null` (replaces the entire list view).

### 4.1 Page header and breadcrumb

White header with bottom border (`px-8 py-5 flex-shrink-0`, `data-tour="managers-detail-header"`).

**Breadcrumb row (`flex items-center gap-3 mb-5`):**
- Back button: ArrowLeft (size=15, `group-hover:-translate-x-0.5 transition-transform`) + "All managers" (sm, gray-500, `hover:text-gray-900 transition-colors`)
- Click calls `onBack()` → sets `selectedManager` to null in parent
- Separator: "/" (gray-300)
- Mini avatar (20×20, `rounded`): `DEPT_COLORS[dept]` background, `initials[0]` (first initial only, not all initials)
- Manager name (sm semibold, gray-900)

**Main header row (`flex items-start justify-between`):**

Left (`flex items-center gap-4`):
- Avatar (48×48, `rounded-xl`): `DEPT_COLORS[dept]` background, white `font-bold text-base`, all initials (both first letters)
- Name block:
  - Manager name (h1, xl bold, gray-900) + title badge (`text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium`) — inline on same row
  - Meta row (`text-xs text-gray-400 mt-1 flex items-center gap-3`):
    - MapPin (size=11) + `manager.location`
    - Users (size=11) + `{reports.length} direct reports`
    - Clock (size=11) + `{manager.tenure}m in role`
    - Department name: styled with `DEPT_COLORS[dept]` as inline colour
    - TrendIcon + `trendLabel`
  - Teams row (below meta, `text-xs text-gray-400 mt-1`): "Teams: [team1, team2, ...]" — `manager.teams.join(', ')`

Right (`flex items-start gap-4`):
- `ExportButtons` — title `"{manager.name} — Manager Detail"`. See §4.9.
- Score badge (see §4.2)

### 4.2 Score badge

Large centred badge in the header's right side:

```
rounded-2xl border {sc.bg} {sc.border} px-5 py-3 text-center min-w-[100px]
```

- Score number: `text-4xl font-black leading-none {sc.text}`
- Score label (e.g. "High Impact"): `text-xs font-bold mt-1 {sc.text}`
- Sub-label: "Effectiveness score" (`text-[10px] text-gray-400 mt-0.5`)

`scoreColor(score)` in `ManagerDetail` returns an object `{ text, bg, border, bar }`:

| Score | text | bg | border | bar |
|---|---|---|---|---|
| ≥ 75 | text-emerald-600 | bg-emerald-50 | border-emerald-100 | bg-emerald-500 |
| ≥ 55 | text-sky-600 | bg-sky-50 | border-sky-100 | bg-sky-500 |
| ≥ 40 | text-amber-600 | bg-amber-50 | border-amber-100 | bg-amber-400 |
| < 40 | text-red-600 | bg-red-50 | border-red-100 | bg-red-400 |

Note: `ManagerDetail` has its own copy of `scoreColor` that returns an object (not a string as in `ManagerEffectiveness`). The bar colour is defined in the return object but is not currently used in the Detail view UI.

### 4.3 Primary KPI grid

`grid-cols-4 gap-4` (`data-tour="managers-detail-kpis"`). Each card: `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`.

| # | Label | Value | Sub-label | Colour | Icon |
|---|---|---|---|---|---|
| 1 | Avg readiness | `{avgReadiness}%` | "across all reports" | text-gray-900 | TrendingUp (sky-400) |
| 2 | Near ready (≥90%) | `{nearReadyCount}` | `"{progressingCount} more progressing"` | text-emerald-600 | Star (emerald-400) |
| 3 | Stalled reports | `{stalledCount}` | "24m+ in level, <50% ready" | **red-600 if stalledCount > 0, gray-400 if 0** | AlertTriangle: **red-400 if > 0, gray-300 if 0** |
| 4 | Framework completion | `{avgFrameworkCompletion}%` | `"{strongSkillCount}/{totalSkillCriteria} skills at target"` | text-gray-900 | CheckCircle2 (sky-400) |

All four cards share identical structure: icon + label row (`flex items-center gap-2 mb-2`), then 3xl font-black value, then xs gray-400 sub-label.

### 4.4 Secondary KPI grid

`grid-cols-3 gap-4`. Each card: `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`.

**Card 1 — Avg tenure in level:**
- Icon: Clock (size=14, gray-400)
- Label: "Avg tenure in level"
- Value: `{avgTenure}m` (3xl font-black, gray-900)
- Sub-label (conditional): `avgTenure > 20` → "Above average — check blockers"; else → "Healthy velocity" (xs, gray-400)

**Card 2 — Promotion ready:**
- Icon: Star (size=14, emerald-400)
- Label: "Promotion ready"
- Value: `{promotionReadyCount}` (3xl font-black, emerald-600)
- Sub-label: "≥90% ready + ≥18m tenure"

**Card 3 — Reports with gaps:**
- Icon: XCircle (size=14, red-400)
- Label: "Reports with gaps"
- Value: `{blockedCount}` (3xl font-black, gray-900)
- Sub-label: "have ≥1 blocking skill gap"

### 4.5 Top blocking skills panel

Two-column grid (`grid-cols-2 gap-6`, `data-tour="managers-detail-skills"`). This section is the **left** column.

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`.

**Header:** AlertTriangle (size=14, red-400) + "Top blocking skills" (sm bold, gray-900) + count badge (`{blockingRanked.length} skills with gaps`, xs, gray-400, `ml-auto`)

**`blockingRanked` computation** (memoized):
```
map = Map<skillName, count>
for each r in readinessResults:
  for each gap in r.gapSkills:
    map[gap.skillName]++

sorted descending by count, sliced to top 6
```

**Empty state** (when `blockingRanked.length === 0`): "No blocking skill gaps — excellent!" (sm, gray-400, centred, py-8)

**Skill list** (when non-empty, `space-y-3`):
- Each entry: skill name (xs semibold, gray-700) + count label (xs, gray-500: `"{count} of {readinessResults.length} reports"`)
- Progress bar: `w-full bg-gray-100 rounded-full h-2 overflow-hidden`, fill `bg-red-400 transition-all` at `(count / readinessResults.length) * 100%` width

**Coaching priority box** (shown when `topBlockingSkill !== '—'`, `mt-5`):
- Background: `bg-red-50 border border-red-100 rounded-xl p-3`
- "Coaching priority" label (xs semibold, red-700)
- Skill name (`{topBlockingSkill}`, sm bold, red-800, `mt-0.5`)
- Impact text: "Blocking {topBlockingSkillCount} of {readinessResults.length} reports" (11px, red-500, mt-0.5)
- Two action buttons (flex row, `gap-2 mt-2`), each shown only if the corresponding prop is provided:
  - **"Dept gap report"** (shown when `onNavigateToGapReport` prop exists): ExternalLink (size=9) + "Dept gap report". Click: `onNavigateToGapReport(manager.department)`. Style: `text-[10px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors`.
  - **"Skills heatmap"** (shown when `onNavigateToHeatmap` prop exists): ExternalLink (size=9) + "Skills heatmap". Click: `onNavigateToHeatmap()`. Same style.

### 4.6 Skill profile panel

Right column of the two-column grid.

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`.

**Header:** CheckCircle2 (size=14, sky-400) + "Skill profile — team avg vs target" (sm bold, gray-900)

**`skillStrengths` computation** (memoized):
```
criteriaMap = Map<skillId, { name, required, actuals: [] }>

for each r in readinessResults:
  allCriteria = [
    ...r.metSkills.map(s => ({ ...s, actualRating: r.person.skills[s.skillId] ?? 0 })),
    ...r.gapSkills
  ]
  for each criterion c in allCriteria:
    criteriaMap[c.skillId].actuals.push(r.person.skills[c.skillId] ?? 0)

for each entry:
  avg = sum(actuals) / actuals.length   (0 if empty)
  avg = parseFloat(avg.toFixed(1))
  gap = Math.max(0, required - avg)

sorted descending by gap
```

**Display:** Top 8 entries (`skillStrengths.slice(0, 8)`), `space-y-2.5`.

Each row:
- Name row: skill name (11px, medium, gray-700, truncated, `pr-2`) + status icon + score
  - `atTarget = avg >= required`
  - Status icon: CheckCircle2 (size=11, emerald-500) if `atTarget`; XCircle (size=11, red-400) if not
  - Score: `"{avg.toFixed(1)} / {required}"` (11px bold): emerald-600 if atTarget, red-500 if not
- Progress bar: `relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`
  - Fill: `bg-emerald-400` if atTarget, `bg-red-400` if not; `transition-all`; width = `Math.min((avg / required) * 100, 100)%`
  - Target marker: `absolute top-0 bottom-0 w-px bg-gray-400 opacity-50` at `left: '100%'` — a vertical line marking the required target at the right edge of the bar

**Note on target marker:** The target marker is positioned at `left: 100%` of the bar container. Because the container has `overflow-hidden`, the marker itself is hidden. It would only be visible for bars wider than 100% — which cannot happen since `Math.min(..., 100)` caps the width. This is a cosmetic artefact; visually the right edge of the bar functions as the target indicator.

### 4.7 Direct reports list

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm` (`data-tour="managers-detail-reports"`).

**Header row (`flex items-center gap-3 mb-5`):**
- Users (size=14, gray-400)
- "Direct reports" (sm bold, gray-900)
- Count badge: `{reports.length}` (xs, gray-400, `bg-gray-100 px-2 py-0.5 rounded-full`)
- **Stalled alert badge** (shown when `stalledCount > 0`, `ml-auto`): `"{stalledCount} stalled"` (xs semibold, red-600, `bg-red-50 border border-red-100 px-2 py-0.5 rounded-full`)

**Empty state** (when `sortedResults.length === 0`): "No promotion pipeline data for this team" (sm, gray-400, centred, py-8)

**`sortedResults` computation** (memoized): `[...readinessResults].sort((a, b) => b.readinessPct - a.readinessPct)` — descending by readiness.

Note: `sortedResults` is derived from `readinessResults`, not from `reports`. A person who is on the manager's team but has no framework (terminal level or missing framework) will appear in `reports` but **not** in `readinessResults` and thus not in `sortedResults`.

**Report list (`space-y-2`):** Each entry rendered as a `ReportRow`. See §5.2.

### 4.8 Coaching suggestions

Card: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm` (`data-tour="managers-detail-coaching"`).

**Header:** ChevronRight (size=14, gray-400) + "Coaching suggestions" (sm bold, gray-900)

**Suggestions list (`space-y-2`):** Between 1 and 4 items depending on conditions:

**Suggestion 1 — Promotion ready** (shown when `promotionReadyCount > 0`):
- `bg-emerald-50 border border-emerald-100 rounded-xl p-3.5`
- Star (size=14, emerald-500, `mt-0.5 flex-shrink-0`)
- Title: `"{promotionReadyCount} report{s} ready to promote"` (xs semibold, emerald-800) — pluralised: "report" if 1, "reports" if ≠ 1
- Body: "Review these individuals for formal promotion consideration in the next cycle." (11px, emerald-600, mt-0.5)
- **Link button** (shown only when `onNavigateToPipeline` prop exists): ExternalLink (size=9) + "View in promotion pipeline" (`text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mt-1.5`). Click: `onNavigateToPipeline(manager.department)`.

**Suggestion 2 — Stalled reports** (shown when `stalledCount > 0`):
- `bg-red-50 border border-red-100 rounded-xl p-3.5`
- AlertTriangle (size=14, red-400, `mt-0.5 flex-shrink-0`)
- Title: `"{stalledCount} report{s} showing stall signals"` (xs semibold, red-800) — pluralised
- Body: "High tenure + low readiness. Schedule 1:1 coaching conversations and review blockers." (11px, red-600, mt-0.5)
- No navigation link.

**Suggestion 3 — Team-wide skill gap** (shown when `topBlockingSkill !== '—'`):
- `bg-amber-50 border border-amber-100 rounded-xl p-3.5`
- AlertTriangle (size=14, amber-500, `mt-0.5 flex-shrink-0`)
- Title: `"Team-wide gap: {topBlockingSkill}"` (xs semibold, amber-800)
- Body: `"Blocking {topBlockingSkillCount} reports. Consider a team workshop or shared learning resource."` (11px, amber-700, mt-0.5)
- No navigation link.

**Suggestion 4 — Framework completion** (always shown):
- `bg-sky-50 border border-sky-100 rounded-xl p-3.5`
- TrendingUp (size=14, sky-500, `mt-0.5 flex-shrink-0`)
- Title: `"Framework completion at {avgFrameworkCompletion}%"` (xs semibold, sky-800)
- Body (conditional, 11px, sky-600, mt-0.5):
  - `avgFrameworkCompletion >= 70` → "Strong coverage — keep reinforcing career conversations."
  - `avgFrameworkCompletion < 70` → "Below 70%. Prioritise structured development plans with each report."
- No navigation link.

### 4.9 Export content

`buildExportContent()` for the manager detail view (`ExportButtons` title: `"{manager.name} — Manager Detail"`):

```
MANAGER DETAIL — [MANAGER NAME UPPERCASE]
Generated: [date]
==================================================

Title: [title]
Department: [department]
Location: [location]
Tenure in role: Xm
Effectiveness score: X

Avg readiness: X%
Near ready (90%+): X
Progressing: X
Stalled: X
Framework completion: X%
Top blocking skill: [skill]

DIRECT REPORTS
--------------------------------------------------
[Name] — X% ([tier]) | X/Y criteria | Xm tenure
...
```

Tier text (inline, not from TIER_CONFIG): `>= 90 → 'Near Ready'`; `>= 70 → 'Progressing'`; `>= 50 → 'Developing'`; else `'Early'`.

Iterates `sortedResults` (readiness descending). Reports without framework data are excluded.

---

## 5. Shared components

### 5.1 TrendIcon

Used in both `ManagerEffectiveness` (manager card meta row) and `ManagerDetail` (header meta row).

| `trend` prop | Icon | Colour |
|---|---|---|
| `'up'` | TrendingUp (size=13) | text-emerald-500 |
| `'down'` | TrendingDown (size=13) | text-red-400 |
| `'flat'` | Minus (size=13) | text-gray-400 |

### 5.2 ReportRow

Rendered in `ManagerDetail`'s direct reports list. Stateless — receives one `ReadinessResult`.

**`isStalled` condition:** `result.person.tenure > 24 && result.readinessPct < 50`

**`nextTitle`:** `result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel` — strips the "IC3 ·" prefix, showing e.g. "Senior Engineer" not "IC3 · Senior Engineer".

**Container:** `flex items-center gap-3 p-3.5 rounded-xl border {cfg.border} {cfg.bg}` — coloured by tier (from `TIER_CONFIG`).

**Avatar (32×32, `rounded-lg`):** Always `bg-gradient-to-br from-slate-600 to-slate-800` (same gradient regardless of tier), white text (10px bold), 2-letter initials.

**Left section (`flex-1 min-w-0`):**
- Name row: `{result.person.name}` (xs semibold, gray-800, truncated)
- **Stalled badge** (shown when `isStalled`): "Stalled" (`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600`, flex-shrink-0, inline next to name)
- Meta row (10px, gray-400, `flex items-center gap-2 mt-0.5`):
  - `{result.person.team}`
  - "·" separator (gray-300)
  - MapPin (size=8) + `{result.person.location}`
  - "·" separator
  - Clock (size=8) + `{result.person.tenure}m`

**Right section (`text-right flex-shrink-0`):**
- Next level row: `"→ {nextTitle}"` (10px, gray-500) + tier badge (`text-[10px] font-bold px-1.5 py-0.5 rounded-full {cfg.badge}`, e.g. "Near Ready")
- Progress bar row: 80px bar (`bg-white/70 rounded-full h-1.5 border border-black/5`) + readiness % (10px bold, gray-600)
  - Fill: `{cfg.barColor}` at `{readinessPct}%`
- Criteria: `"{criteriaMet}/{criteriaTotal} criteria"` (10px, gray-400, mt-0.5)

### 5.3 effectivenessScore

Both files define identical copies of this function (not shared via import):

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

**Component weights:**
- Team readiness (avgReadiness): **40%**
- Framework completion (avgFrameworkCompletion): **30%**
- Stall penalty component (100 − stallPenalty): **30%**
  - `stallPenalty = (stalledCount / reports.length) * 100`
  - If 0 stalled: stall component contributes 30 points to score
  - If 100% stalled: stall component contributes 0 points
  - If `reports.length === 0`: stallPenalty = 0 (no division by zero)

**Score range:** 0–100 (integer, rounded).

### 5.4 scoreColor / scoreBg / scoreLabel

**In ManagerEffectiveness** — three separate functions:

```typescript
scoreColor(score): string   // Tailwind text class
scoreBg(score): string      // Two Tailwind classes: "bg-X border-Y"
scoreLabel(score): string   // Text label
```

**In ManagerDetail** — combined into one function:

```typescript
scoreColor(score): { text, bg, border, bar }   // object with four Tailwind classes
scoreLabel(score): string
```

**Thresholds (both files, identical):**

| Score | scoreLabel | scoreColor text | scoreBg / .bg + .border |
|---|---|---|---|
| ≥ 75 | High Impact | text-emerald-600 | bg-emerald-50 + border-emerald-100 |
| ≥ 55 | Effective | text-sky-600 | bg-sky-50 + border-sky-100 |
| ≥ 40 | Developing | text-amber-600 | bg-amber-50 + border-amber-100 |
| < 40 | Needs Support | text-red-600 | bg-red-50 + border-red-100 |

---

## 6. Data model and computations

### 6.1 Manager source data (MANAGERS)

11 managers across 7 departments. Each `Manager` has: `id`, `name`, `title`, `department`, `location`, `teams: string[]`, `tenure` (months in role).

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

### 6.2 Report filtering

A person is a manager's report if **both** conditions are true:
1. `person.department === manager.department`
2. `manager.teams.includes(person.team)`

This means team name matching is **exact string comparison**. A person on "Platform" is not matched by "platform" or "Platform Team".

### 6.3 `computeManagerMetrics` — all fields

**Reports:** Filtered from PEOPLE as above.

**`getFrameworkForPerson(person)`** (internal helper):
```
currentLevel = LEVEL_DEFINITIONS.find(l.id === person.currentLevelId)
if !currentLevel?.nextLevel → return null
nextLevel = LEVEL_DEFINITIONS.find(l.id === currentLevel.nextLevel)
if !nextLevel → return null
framework = LEVEL_FRAMEWORKS.find(f.levelId === nextLevel.id)
if !framework → return null
return { framework, nextLevel }
```

**`readinessResults`:** For each report, calls `getFrameworkForPerson`. If null (terminal level or no framework), the person is **excluded** from `readinessResults` but remains in `reports`.

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
Computed from **all reports** (not just those with readiness results), using `person.tenure` (months in current level).

**`avgFrameworkCompletion`:**
```
n > 0 ? Math.round(sum(r.criteriaMet / r.criteriaTotal * 100) / n) : 0
```
Average **percentage of criteria met** per person. Differs from `avgReadiness` only because `criteriaMet / criteriaTotal` is already a percentage (same as `readinessPct / 100 * 100`). They are in practice equivalent: `avgFrameworkCompletion ≈ avgReadiness`.

**`blockedCount`:** `readinessResults.filter(r => r.gapSkills.length > 0).length`
People who have at least one skill gap (i.e. haven't met 100% of criteria).

**`topBlockingSkill` and `topBlockingSkillCount`:**
```
blockingMap = Map<skillName, count>
for each r in readinessResults:
  for each gap in r.gapSkills:
    blockingMap[gap.skillName]++

topBlockingSkill = skill with highest count (first encountered on tie)
topBlockingSkillCount = that count
Default: '—' and 0 if blockingMap is empty
```

**`promotionReadyCount`:**
```
readinessResults.filter(r => r.readinessPct >= 90 && r.person.tenure >= 18).length
```
Both conditions must be true: 90%+ readiness AND 18+ months in current level.

**`stalledCount`:**
```
readinessResults.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length
```
Both conditions required: strictly more than 24 months in current level AND less than 50% readiness.

**`strongSkillCount` and `totalSkillCriteria`:**
```
criteriaMap = Map<skillId, { required, actuals: [] }>
for each r in readinessResults:
  for each criterion in [...r.metSkills, ...r.gapSkills]:
    criteriaMap[criterion.skillId].actuals.push(r.person.skills[criterion.skillId] ?? 0)

for each { required, actuals } in criteriaMap.values():
  totalSkillCriteria++
  avg = sum(actuals) / actuals.length
  if avg >= required: strongSkillCount++
```

**`trend` and `trendLabel`:**
```
stallRatio = reports.length > 0 ? stalledCount / reports.length : 0

if avgReadiness >= 70 AND stallRatio < 0.15:
  trend = 'up', trendLabel = 'Team growing fast'
else if stallRatio > 0.3 OR avgReadiness < 45:
  trend = 'down', trendLabel = 'Several reports stalled'
else:
  trend = 'flat', trendLabel = 'Steady progress'
```

**`stallRatio` thresholds:**
- < 15% stalled AND avg readiness ≥ 70% → growing
- > 30% stalled OR avg readiness < 45% → stalled
- Otherwise → steady

### 6.4 `getAllManagerMetrics`

```typescript
MANAGERS.map(computeManagerMetrics)
```

Returns all 11 managers' metrics. Called once in `ManagerEffectiveness` via `useMemo(() => getAllManagerMetrics(), [])`. The result is stable for the lifetime of the component since the source data is static.

---

## 7. Constants and configuration

| Constant | Value / Type | Location | Purpose |
|---|---|---|---|
| `MANAGERS` | `Manager[]` (11 entries) | managerData.ts:24 | Source data for all managers |
| `SortKey` | `'readiness' \| 'stalled' \| 'teamSize' \| 'completionRate'` | ManagerEffectiveness.tsx:11 | Sort options for the manager list |
| Stall definition | tenure > 24 months AND readinessPct < 50 | managerData.ts:135 | Applied in both `computeManagerMetrics` and `ReportRow.isStalled` |
| Promotion ready definition | readinessPct >= 90 AND tenure >= 18 | managerData.ts:134 | Used in `promotionReadyCount` and Coaching suggestions card |
| Trend thresholds | avgReadiness >= 70 + stallRatio < 0.15 / stallRatio > 0.3 or readiness < 45 | managerData.ts:161–170 | `trend` field |
| `effectivenessScore` weights | readiness 40% + completion 30% + stall-penalty 30% | Both tsx files | Composite score formula |
| Score colour thresholds | 75 / 55 / 40 | Both tsx files | scoreColor, scoreBg, scoreLabel |
| `data-tour` attributes | See below | Various | Product tour anchor points |

**`data-tour` attributes:**

| Attribute | Location | Marks |
|---|---|---|
| `managers-org-stats` | ManagerEffectiveness header | Four org stat cards |
| `managers-card-grid` | ManagerEffectiveness main | Manager card grid |
| `managers-detail-header` | ManagerDetail header | Full header with breadcrumb + score badge |
| `managers-detail-kpis` | ManagerDetail main | Primary 4-column KPI grid |
| `managers-detail-skills` | ManagerDetail main | Two-column blocking skills + skill profile |
| `managers-detail-reports` | ManagerDetail main | Direct reports list |
| `managers-detail-coaching` | ManagerDetail main | Coaching suggestions card |
