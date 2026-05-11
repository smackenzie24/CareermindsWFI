# Promotion Readiness Pipeline — Product Specification

**Feature:** Promotion Readiness Pipeline
**Components:**
- `src/components/promotion/PromotionPipeline.tsx` — org-level container
- `src/components/promotion/DeptPipelineView.tsx` — department drill-down
- `src/components/promotion/PersonPanel.tsx` — individual side panel
- `src/components/promotion/FlightRiskTab.tsx` — flight risk view
- `src/components/promotion/HiddenTalent.tsx` — hidden talent / cross-dept fit view
- `src/components/ExportButtons.tsx` — shared download + email component

**Data:** `src/data/promotionData.ts` — static mock data (PEOPLE, LEVEL_DEFINITIONS, LEVEL_FRAMEWORKS)
**Last updated:** May 2026

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Navigation model](#2-navigation-model)
3. [PromotionPipeline — org-level view](#3-promotionpipeline--org-level-view)
   - 3.1 Page header
   - 3.2 Org-level stat cards
   - 3.3 Expandable org summary section
   - 3.4 Tab bar
   - 3.5 Tier legend bar
   - 3.6 Department cards grid
4. [DeptPipelineView — department drill-down](#4-deptpipelineview--department-drill-down)
   - 4.1 Page header
   - 4.2 Transition grouping logic
   - 4.3 Transition section layout
   - 4.4 Candidate cards
   - 4.5 Export content
5. [PersonPanel — individual side panel](#5-personpanel--individual-side-panel)
   - 5.1 Layout and overlay
   - 5.2 Peer navigation controls
   - 5.3 Person header
   - 5.4 Readiness score block
   - 5.5 Met criteria section
   - 5.6 Gaps to close section
   - 5.7 RatingDots component
   - 5.8 Footer actions
6. [FlightRiskTab — flight risk view](#6-flightrisktab--flight-risk-view)
   - 6.1 Data population
   - 6.2 Page header
   - 6.3 Summary stat strip
   - 6.4 Filter pills
   - 6.5 Person cards
   - 6.6 Empty state
   - 6.7 Footer note
7. [HiddenTalent — cross-department fit view](#7-hiddentalent--cross-department-fit-view)
   - 7.1 Data population
   - 7.2 Page header
   - 7.3 High-risk alert banner
   - 7.4 Department filter pills
   - 7.5 Sort toggle
   - 7.6 Candidate cards
   - 7.7 Empty state
   - 7.8 Footer note
8. [Export — download and email](#8-export--download-and-email)
9. [Data model and computations](#9-data-model-and-computations)
   - 9.1 Source data
   - 9.2 `computeReadiness`
   - 9.3 `getAllReadiness`
   - 9.4 `getReadinessTier`
   - 9.5 `groupByTier`
   - 9.6 `getFlightRiskPeople`
   - 9.7 `getCrossDeptFitCandidates`
   - 9.8 `fmtCurrency`
10. [Readiness tiers reference](#10-readiness-tiers-reference)
11. [Constants and configuration](#11-constants-and-configuration)

---

## 1. Feature overview

The Promotion Readiness Pipeline is a people analytics module that surfaces who is ready (or progressing towards being ready) for promotion to their next level. A skills-based readiness model compares each person's actual skill ratings against the requirements defined for their target level, producing a readiness percentage and a breakdown of met criteria vs gaps.

The pipeline view is accessible from `nav.view === 'pipeline'` and renders `PromotionPipeline` as the full page. Three tabs exist at the org level:

| Tab | Purpose | Data source |
|---|---|---|
| **Pipeline** | Org summary grid + department drill-down with individual candidates | `getAllReadiness()` |
| **Hidden Talent** | People whose LinkedIn-inferred skills suggest a better fit in a different function | `getCrossDeptFitCandidates()` |
| **Flight Risk** | People flagged by Revelio Labs job-switching model as likely to leave | `getFlightRiskPeople('medium')` |

---

## 2. Navigation model

### Department selection (controlled/uncontrolled hybrid)

`PromotionPipeline` accepts optional `selectedDept` and `onSelectDept` props from the parent (`App.tsx`). When these are provided the component is in **controlled mode** and the parent owns the selection. When they are absent the component manages `internalDept` state itself.

```
selectedDept = selectedDeptProp !== undefined ? selectedDeptProp : internalDept
```

`setSelectedDept(dept)` always updates both `internalDept` and calls `onSelectDept?.(dept)`.

When `selectedDept` is non-null, `PromotionPipeline` renders `DeptPipelineView` in its entirety (replaces the whole page). When `DeptPipelineView` calls `onBack()`, `selectedDept` is set to null and the org-level grid returns.

### Prop-based entry points

| Prop | Type | Effect |
|---|---|---|
| `initialDepartment` | `Department` | Sets `internalDept` initial state — opens directly to that dept on first render |
| `initialTab` | `'pipeline' \| 'hidden-talent' \| 'flight-risk'` | Sets `activeTab` initial state |
| `selectedDept` | `Department \| null` | Controlled dept selection (takes precedence over internal state) |
| `onSelectDept` | `(dept: Department \| null) => void` | Callback when dept changes |
| `onNavigateToGapReport` | `(dept: Department) => void` | Cross-feature link; fires from DeptPipelineView header → Skills Gap Report |
| `onNavigateToManagers` | `(managerId?: string) => void` | Cross-feature link; fires from DeptPipelineView header → Manager Effectiveness |

---

## 3. PromotionPipeline — org-level view

Rendered when `selectedDept === null`.

### 3.1 Page header

Sticky white header with bottom border. Contains:

**Left side:**
- Eyebrow: "Workforce Intelligence" (uppercase, tracking-widest, gray-400)
- Title: "Promotion Readiness Pipeline" (2xl bold)
- Subtitle: "Who's close to the next level? Click a department to see individual readiness scores and skill gaps."

**Right side (flex row, gap-3):**
- `ExportButtons` component — Download + Email me. See §8.
- Live data indicator: pulsing emerald dot + "Acme Corp" label (gray-400, text-xs)

### 3.2 Org-level stat cards

Four `StatCard` components in a `grid-cols-4` layout (`data-tour="pipeline-stat-cards"`):

| # | Label | Value | Sub-label | Number colour | Icon |
|---|---|---|---|---|---|
| 1 | Tracked for promotion | `orgStats.total` | "people assessed org-wide" | text-gray-900 | Users (gray-400) |
| 2 | Near ready (90%+) | `orgStats.nearReady` | "meet 90%+ of next-level criteria" | text-emerald-600 | Star (emerald-400) |
| 3 | Progressing (70–89%) | `orgStats.progressing` | "on track, closing gaps" | text-sky-600 | TrendingUp (sky-400) |
| 4 | Avg readiness score | `orgStats.avgReadiness%` | "avg Xm in current level" | text-gray-800 | Clock (gray-400) |

**How `orgStats` is computed** (memoized, recomputes if `allResults` changes):

```
allResults = getAllReadiness()           // all people with a defined next level + framework

tiers = groupByTier(allResults)
orgStats = {
  total:        allResults.length,
  nearReady:    tiers['near-ready'],
  progressing:  tiers['progressing'],
  avgReadiness: Math.round(sum(r.readinessPct) / total),   // 0 if total === 0
  avgTenure:    Math.round(sum(r.person.tenure) / total),  // months in current level; 0 if total === 0
}
```

Note: `avgTenure` is the average tenure of **pipeline-tracked people only** (those with a defined next level and framework), not all employees.

### 3.3 Expandable org summary section

Rendered immediately below the stat cards when `orgExpanded === true` (default: `true`). `ORG_SUMMARY` is a module-level constant computed once at module load, not re-rendered.

**Toggle button:** Centred below stat cards. Shows:
- When expanded: ChevronUp icon + "Hide org summary"
- When collapsed: ChevronDown icon + "Show org summary"
- Hover: text darkens from gray-400 to gray-600.

**When expanded — four cards in `grid-cols-4`:**

#### Card 1 — Check-in Coverage
- Label: "Check-in Coverage", CalendarCheck icon
- Value: `ORG_SUMMARY.checkInCoverage%`
- Sub-label: "checked in (30d)"
- Icon and number are **emerald** if `checkInCoverage >= 80`, **amber** if `< 80`
- Formula: `Math.round(checkedIn / PEOPLE.length * 100)` where `checkedIn` = count of PEOPLE whose `lastCheckIn` is within 30 days of `CHECKIN_CUTOFF` (2026-04-29).
  - Days formula: `Math.floor((CHECKIN_CUTOFF - lastCheckIn) / 86_400_000) <= 30`

#### Card 2 — Est. Total Cost
- Label: "Est. Total Cost", DollarSign icon (gray-400)
- Value: `fmtCurrency(ORG_SUMMARY.totalCost)`
- Sub-label: "annual salaries"
- Formula: `sum(DEPT_SALARIES[person.department] for each person in PEOPLE)`
- Formatted via `fmtCurrency`: `$X.XM` if ≥ 1,000,000; `$XK` if ≥ 1,000; `$X` otherwise (see §9.8)

#### Card 3 — Avg Salary
- Label: "Avg Salary", DollarSign icon (gray-400)
- Value: `fmtCurrency(ORG_SUMMARY.avgSalary)`
- Sub-label: "per employee"
- Formula: `Math.round(totalCost / PEOPLE.length)`

#### Card 4 — Team Headcount
- Label: "Team Headcount", Building2 icon (gray-400)
- Content: horizontal bar chart, one row per department, sorted descending by count
- Each row: dept name (truncated) + count (right-aligned), then a proportional bar underneath
- Bar width: `(count / maxCount) * 100%` where `maxCount = deptBreakdown[0].count` (first after desc sort)
- Bar colour: `DEPT_COLORS[dept]`

**Dept salary assumptions (DEPT_SALARIES constant):**

| Department | Annual salary |
|---|---|
| Engineering | $128,000 |
| Product | $118,000 |
| Data | $122,000 |
| Design | $102,000 |
| Sales | $95,000 |
| People Ops | $90,000 |
| Marketing | $88,000 |

### 3.4 Tab bar

White bar with bottom border, immediately below the header. Three tabs:

| Tab | Icon | Active style | Inactive hover | Badge condition |
|---|---|---|---|---|
| Pipeline | Users | `border-gray-900 text-gray-900` bottom border | text-gray-700 | none |
| Hidden Talent | Sparkles | `border-sky-500 text-sky-700` bottom border | text-gray-700 | sky pill with `hiddenTalentCount` if > 0 |
| Flight Risk | AlertTriangle | `border-red-500 text-red-700` bottom border | text-gray-700 | red pill with `flightRiskHighCount` if > 0 |

- `hiddenTalentCount` = `getCrossDeptFitCandidates().length` (memoized, computed once)
- `flightRiskHighCount` = `getFlightRiskPeople('high').length` (memoized, computed once)

Clicking a tab sets `activeTab`. The stat cards and org summary remain visible across all tabs. The tier legend and dept grid are **only** shown when `activeTab === 'pipeline'`.

### 3.5 Tier legend bar

Shown only when `activeTab === 'pipeline'`. White bar with bottom border (`data-tour="pipeline-tier-legend"`). Displays four tier entries in a row:

| Tier | Coloured circle class | Label | Range |
|---|---|---|---|
| near-ready | `bg-emerald-500` | Near Ready | 90%+ |
| progressing | `bg-sky-500` | Progressing | 70–89% |
| developing | `bg-amber-400` | Developing | 50–69% |
| early | `bg-gray-300` | Early Stage | <50% |

Iterated directly from `TIER_CONFIG` object entries. Circle uses `cfg.barColor`.

### 3.6 Department cards grid

Shown only when `activeTab === 'pipeline'`. Scrollable main area, padding 8. Subtitle text: "Click a department to explore individual candidates and skill gaps."

**Grid:** `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5` (`data-tour="pipeline-dept-grid"`).

One card per department (all 7, in `DEPARTMENTS` order). Each card is a `<button>`.

**Card states:**

- **`total === 0`:** `disabled` attribute set; `opacity-60`; `cursor-default`; not clickable; ChevronRight icon absent.
- **`total > 0`:** Fully interactive. `hover:shadow-lg hover:-translate-y-0.5`; `focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`.

**Card click:** `setSelectedDept(dept.department)` — navigates to `DeptPipelineView`.

**Card contents (when `total > 0`):**

**Header row:**
- Coloured square icon (40×40, rounded-xl, dept's first letter in white, background `DEPT_COLORS[dept]`)
- Dept name (base font, bold, gray-900)
- Sub-label: `"X people · Y transition"` / `"X people · Y transitions"` (singular if `transitions === 1`)
- `transitions` = `new Set(allResults.filter(dept).map(r => r.targetLevelId)).size` — count of distinct target level IDs
- ChevronRight icon (gray-400, nudges right by 0.5 on group hover)

**Pipeline breakdown bar:**
- Label row: "Pipeline breakdown" (left) + `"X% avg readiness"` (right, bold)
- Bar: `h-3 rounded-full overflow-hidden gap-px bg-gray-100`
- Four segments rendered in order, each only if their count > 0:
  - Emerald: near-ready — width `nearReady / total * 100%`
  - Sky: progressing — width `progressing / total * 100%`
  - Amber: developing — width `developing / total * 100%`
  - Gray-300: early — width `early / total * 100%`
- `gap-px` between segments shows as the gray background (visible separator between segments)
- Each segment has a `title` attribute: e.g. `"3 near ready"`, `"5 progressing"`, `"2 early stage"`

**Tier count mini-grid:**
- `grid-cols-4 gap-2`
- One cell per tier (near-ready, progressing, developing, early)
- Each cell: `rounded-lg p-2 text-center` with `cfg.bg` background
- Number: `text-lg font-black` in `cfg.color`
- Label: **first word only** of `cfg.label` — e.g. "Near", "Progressing", "Developing", "Early"

**Top candidate strip:**
- If `nearReady > 0`: emerald background (`bg-emerald-50 border-emerald-100`), Star icon (emerald-500), "Top candidate: **[Name]** (X% ready)"
- If `nearReady === 0`: gray background (`bg-gray-50 border-gray-100`), TrendingUp icon (sky-400), "Highest: **[Name]** (X% ready)"
- Name and pct come from `topCandidate` (highest `readinessPct` across dept) and `topCandidatePct`

**Card contents (when `total === 0`):**
- Dashed border box, 96px tall, centred text: "No candidates tracked yet" (gray-300)

**Below the grid:**
- `<UpsellBanner variant="leadership-dev" className="mt-6" />` — Keystone Partners upsell for leadership development
- `<FeedbackBanner context="Promotion Pipeline" className="mt-4" />` — user feedback prompt

**`deptSummaries` computation** (memoized):
```
for each dept in DEPARTMENTS:
  results = allResults.filter(r => r.person.department === dept)
  tiers = groupByTier(results)
  n = results.length
  avgReadiness = n > 0 ? Math.round(sum(readinessPct) / n) : 0
  top = results with highest readinessPct (reduce)
  transitions = new Set(results.map(r => r.targetLevelId)).size

  → { department, color: DEPT_COLORS[dept], total: n, nearReady, progressing,
      developing, early, avgReadiness,
      topCandidate: top?.person.name ?? '—',
      topCandidatePct: top?.readinessPct ?? 0, transitions }
```

---

## 4. DeptPipelineView — department drill-down

Rendered when `selectedDept !== null` (replaces the entire pipeline page).

### 4.1 Page header

White header with bottom border (`data-tour="pipeline-dept-header"`).

**Breadcrumb row:**
- Back button: ArrowLeft icon + "All departments" (gray-500; hover gray-900; ArrowLeft nudges left on group hover)
- Clicking calls `onBack()` which resets `selectedDept` to null
- Separator "/"
- Mini dept icon (20×20, rounded, dept colour) + dept name (sm semibold, gray-900)

**Title row (below breadcrumb):**
- Left: dept icon (36×36, rounded-xl, dept colour) + dept name + "· Promotion Pipeline" + sub-label: "X people tracked across Y level transitions"
- Right (flex row, gap-3):
  - `ExportButtons` — Download (dept PDF) + Email me. See §8.
  - **"Skill gap report" button** (ExternalLink icon, sky-600 text, sky-50 bg): shown only if `onNavigateToGapReport` prop is provided. Clicking calls `onNavigateToGapReport(department)`.
  - **"Manager view" button** (ExternalLink icon, gray-600 text, gray-50 bg): shown only if `onNavigateToManagers` prop is provided. Clicking calls `onNavigateToManagers()` (no managerId argument).
  - **Tier summary pills**: one pill per tier that has at least one person. Pills hidden if count === 0. Format: count (large bold) + tier label. Background: `cfg.badge`. Iterated from `TIER_CONFIG` entries.

### 4.2 Transition grouping logic

`deptResults` = `allResults.filter(r => r.person.department === department)` (memoized).

`transitions` (memoized): groups `deptResults` by the key `"${currentLevelId}→${targetLevelId}"`:

```typescript
for each r of deptResults:
  key = `${r.person.currentLevelId}→${r.targetLevelId}`
  currentLabel = r.person.currentLevelId.split('-').slice(1).join('-').toUpperCase()
    // e.g. 'eng-ic2' → 'IC2', 'ppl-m1' → 'M1'
  nextLabel = r.targetLevelLabel
    // e.g. 'IC3 · Senior Engineer'
```

Within each transition group, results are sorted by `readinessPct` descending.

The transition groups are rendered in the order they were first encountered during the `deptResults` iteration. `deptResults` itself comes from `allResults` which is an unsorted array produced by `getAllReadiness()` (iterates PEOPLE in declaration order). There is no explicit sort of transition groups — their order reflects the order of first appearance in the PEOPLE array.

**Note on label display in transition header:**
- `currentLabel` shows as a rounded pill (e.g. "IC2", bg-gray-200)
- `nextLabel` is trimmed: `nextLabel.split('·')[1]?.trim() ?? nextLabel` — strips the dept prefix (e.g. "IC3 · Senior Engineer" → "Senior Engineer"). Shown as dark pill (bg-gray-900, text-white).

### 4.3 Transition section layout

Each transition is a `<div>` with `data-tour="pipeline-dept-swimlanes"` on the container.

**Transition header:**
- "IC2" pill → ChevronRight → "Senior Engineer" pill + "(N people)"

**Four-column tier layout** (`grid-cols-4 gap-4`, `data-tour="pipeline-dept-columns"`):

| Column | Order |
|---|---|
| Near Ready | 1st |
| Progressing | 2nd |
| Developing | 3rd |
| Early Stage | 4th |

Each column header:
- Tier label (xs, bold, uppercase, tracking-wide, `cfg.color`)
- Count badge (5×5 circle, `cfg.badge`)
- Tier range string (e.g. "90%+", text-[11px] gray-400)

People within each column: `CandidateCard` components in readiness-desc order.

**Empty tier column:** Dashed border box (h-16, rounded-xl) with "None" (gray-300).

### 4.4 Candidate cards

`CandidateCard` component — a fully interactive `<button>` element.

**Hover/focus states:**
- `hover:shadow-md hover:-translate-y-0.5`
- `focus:ring-2 focus:ring-offset-1 focus:ring-gray-400`
- Card background and border come from tier: `cfg.border cfg.bg`
- ChevronRight icon: gray-400 normally, gray-600 on group hover

**Avatar:** 36×36 px, `rounded-xl`, gradient `from-slate-600 to-slate-800` (not tier-coloured — gradient is always the same regardless of tier). 2-letter initials from name split.

**Content:**
- Name (sm, bold, gray-900, truncated)
- Team (11px, gray-400, truncated, mt-0.5)
- Readiness bar section:
  - Tier label (`cfg.label`, 11px bold, `cfg.color`)
  - Readiness % (11px bold, gray-700)
  - Progress bar: `bg-white/70 rounded-full h-1.5 border border-black/5`, filled segment `cfg.barColor` at `readinessPct%`
- Metadata row (11px, gray-400):
  - MapPin icon + location
  - Clock icon + tenure in months (e.g. "18m")
  - Right-aligned: "X/Y criteria" (criteriaMet/criteriaTotal)

**Click action:** `openPerson(result, items)` where `items` = all cards in the **same tier column** (not the whole transition group). `selection` state set to `{ result, peers: items, index: items.indexOf(result) }`.

### 4.5 Export content

`buildExportContent()` for the department view produces:

```
[DEPT UPPERCASE] — PROMOTION PIPELINE
Generated: [date]
==================================================

People tracked: X across Y level transitions

[CurrentLabel] → [NextLabel trimmed] (N people)
  [Name] — X% ([tier text]) | X/Y criteria
  ...
  (blank line between transition groups)
```

Tier text mapping (inline, not using TIER_CONFIG): `>= 90 → 'Near Ready'`; `>= 70 → 'Progressing'`; `>= 50 → 'Developing'`; else `'Early'`.

`nextLabel` in export uses `t.nextLabel.split('·')[1]?.trim() ?? t.nextLabel`.

---

## 5. PersonPanel — individual side panel

Triggered when the user clicks a `CandidateCard` in `DeptPipelineView`.

### 5.1 Layout and overlay

A `fixed inset-0 z-50 flex justify-end` overlay. The backdrop (the `inset-0` div) calls `onClose()` when clicked, dismissing the panel. Clicking inside the panel itself stops propagation.

The panel itself: `w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100`. The panel has three independently-controlled sections:
1. Header (`flex-shrink-0 p-6 border-b`)
2. Readiness score block (`flex-shrink-0 px-6 py-5 border-b`)
3. Criteria breakdown (`flex-1 overflow-y-auto p-6`) — independently scrollable

### 5.2 Peer navigation controls

Shown when: `peers` prop exists AND `peers.length > 1` AND `currentIndex` is defined. These navigate through people in the same tier column.

**Prev button:** ChevronLeft + "Prev". Disabled (opacity-30, cursor-not-allowed) when `currentIndex === 0`.

**Next button:** "Next" + ChevronRight. Disabled when `currentIndex === peers.length - 1`.

**Counter:** `"{currentIndex + 1} of {peers.length}"` (1-indexed).

**Navigation:** `navigateTo(index)` in `DeptPipelineView` sets `selection` to `{ ...selection, result: peers[index], index }`.

**Close button (X):** Top-right of header. `p-1.5 rounded-lg hover:bg-gray-100`. Calls `onClose()` which sets `selection` to null. Also called by backdrop click.

### 5.3 Person header

Avatar: 48×48, `rounded-2xl`, gradient `from-slate-700 to-slate-900`, 2-letter initials (18px bold white).

Name (lg bold, gray-900) + team + "·" + department (sm, gray-500).

**Meta pills (flex-wrap, gap-2, text-xs, gray-500):**
- Location pill: MapPin icon + `person.location`
- Tenure pill: Clock icon + `"{person.tenure}m in current level"` — note the "in current level" suffix
- Target level pill: Users icon + **trimmed** label: `result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel` — e.g. "Senior Engineer" not "IC3 · Senior Engineer"

### 5.4 Readiness score block

Background: **tier-coloured** — `cfg.bg` (e.g. emerald-50 for near-ready).

**Top row:**
- Left: "Readiness for" label (xs uppercase tracking-widest gray-500) + full `result.targetLevelLabel` below it (sm bold gray-900, e.g. "IC3 · Senior Engineer")
- Right: tier badge (`cfg.badge` + `cfg.label`, xs bold, pill)

**Score display:**
- `result.readinessPct` in `text-5xl font-black cfg.color`
- `"{result.criteriaMet} of {result.criteriaTotal} criteria met"` (sm, gray-500)

**Progress bar:** `bg-white/70 rounded-full h-2.5 border border-black/5`, filled segment `cfg.barColor` at `readinessPct%`, transition `duration-700`.

### 5.5 Met criteria section

Shown only when `result.metSkills.length > 0`.

Header: CheckCircle icon (emerald-500) + "Meeting criteria (N)" (xs bold uppercase tracking-widest, gray-700).

Each met skill row (emerald-50 bg, emerald-100 border, rounded-lg, py-2 px-3):
- Skill name (sm, medium, gray-800)
- Category (11px, gray-400)
- `RatingDots actual={person.skills[skill.skillId] ?? 0} required={skill.requiredRating}`
- Score label `"{actual}/{skill.requiredRating}"` (xs, emerald-700, semibold, w-10, text-right)

### 5.6 Gaps to close section

Shown only when `result.gapSkills.length > 0`. **Sorted descending by `gap`** (`b.gap - a.gap`).

Header: AlertCircle icon (red-400) + "Gaps to close (N)" (xs bold uppercase tracking-widest, gray-700).

Each gap skill row (red-50 bg, red-100 border, rounded-lg, py-2 px-3):
- Skill name + category
- `RatingDots actual={skill.actualRating} required={skill.requiredRating}`
- Score label `"{skill.actualRating}/{skill.requiredRating}"` (xs, red-600, semibold)

### 5.7 RatingDots component

5 dots, positions 0–4 (each dot represents ratings 1–5 respectively):

```
for each position i in [0..4]:
  if i < actual:            // dot is filled (person has this skill level)
    if i < required:        // this level is required
      → sky-500 (bg + border)    // meeting a required level — at or below requirement
    else:                   // above requirement
      → emerald-500 (bg + border) // exceeding requirement
  else:                     // dot is empty (person hasn't reached this level)
    if i < required:        // this level is required but not met
      → red-50 bg, red-300 border // gap
    else:                   // not required, not reached
      → gray-100 bg, gray-200 border // irrelevant
```

**Interpretation:**
- **Sky dots** — the person has this skill level AND it is a required level. They're meeting (but not exceeding) the bar at this position.
- **Emerald dots** — the person has this skill level AND it exceeds what's required (over-indexed).
- **Red-tinted empty dots** — the person is missing a required level (gap).
- **Gray empty dots** — neither required nor achieved (irrelevant positions).

### 5.8 Footer actions

Three full-width buttons in `bg-gray-50 border-t`, `flex-shrink-0`:

| Button | Label | Status |
|---|---|---|
| 1 | Set as focus skills → | Placeholder — no action wired |
| 2 | Find mentors for gap skills → | Placeholder — no action wired |
| 3 | Schedule check-in → | Placeholder — no action wired |

All three buttons: `bg-white border-gray-200 hover:border-gray-300 hover:bg-white rounded-xl px-4 py-3`.

---

## 6. FlightRiskTab — flight risk view

Rendered when `activeTab === 'flight-risk'`. Wrapped in `<main className="flex-1 overflow-auto p-8">`.

### 6.1 Data population

```
all = getFlightRiskPeople('medium')   // high + medium risk people only
```

`all` is memoized. Filters `PEOPLE` to those with `flightRisk` defined and at or above the minimum level. Sorted: risk level desc (high before medium), then `daysSinceCheckIn` desc.

```
highCount    = all.filter(e => e.flightRisk === 'high').length
mediumCount  = all.filter(e => e.flightRisk === 'medium').length
withOpportunity = all.filter(e => e.hasInternalOpportunity).length
```

`filtered` (memoized): `filter === 'all'` → all; else filter by exact `flightRisk` value.

### 6.2 Page header

**Left side:**
- AlertTriangle icon (red-500) + "Flight Risk" (base bold, gray-900)
- **"Revelio Labs" badge**: `bg-red-100 text-red-700`, xs semibold, rounded-full, px-2
- Description: "Employees flagged by Revelio Labs' job-switching propensity model. Sorted by risk level and days since last check-in."

**Right side:**
- Shield icon (amber-500) + "For managers only · Confidential" (11px, amber-700, semibold) in `bg-amber-50 border-amber-100 rounded-xl px-3 py-2`

### 6.3 Summary stat strip

Three tiles in `grid-cols-3 gap-3`:

| Tile | Value | Background |
|---|---|---|
| High risk | `highCount` (2xl black, red-600) + "High risk" (xs, red-500) | bg-red-50 border-red-100 |
| Medium risk | `mediumCount` (2xl black, amber-600) + "Medium risk" (xs, amber-500) | bg-amber-50 border-amber-100 |
| Internal match available | `withOpportunity` (2xl black, sky-600) + "Internal match available" (xs, sky-500) | bg-sky-50 border-sky-100 |

**"View" button on Internal match tile:** Sparkles icon + "View" + ArrowRight. Rendered only when `withOpportunity > 0`. On click: `onSwitchToHiddenTalent()` → switches parent's `activeTab` to `'hidden-talent'`.

### 6.4 Filter pills

Three buttons: **All (N)** / **High risk (N)** / **Medium risk (N)**.

- Active: `bg-gray-900 text-white`
- Inactive: `bg-gray-100 text-gray-500 hover:text-gray-800`
- Label format: `"All"` / `"High risk"` / `"Medium risk"` — always includes the word "risk" for high/medium

Counts: All = `all.length`; High = `highCount`; Medium = `mediumCount`.

### 6.5 Person cards

Grid: `grid-cols-1 lg:grid-cols-2 gap-4`.

Each `PersonCard` has local `expanded` state (default: false).

**Card border:** `border-red-100` if `flightRisk === 'high'`; otherwise `border-gray-100`.

**Avatar (36×36, rounded-xl):** Background = `DEPT_COLORS[person.department]`. 2-letter initials (up to 2 chars). **Red dot indicator** (12×12 circle, bg-red-500, border-2 border-white, positioned `-top-1 -right-1`): shown **only** when `flightRisk === 'high'`.

**Person info row:**
- Name (sm bold, gray-900)
- Department pill: `DEPT_COLORS[dept]` as text colour and `${deptColor}18` (hex with 18 = ~10% opacity) as background
- "·" separator
- Level short label via `LEVEL_DEFINITIONS.find(l => l.id === currentLevelId)?.shortLabel` (xs, gray-500)
- "·" separator
- Team name (xs, gray-500)

**Risk badge:** `inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full`. Background from `RISK_CONFIG[risk].badgeBg`, text from `RISK_CONFIG[risk].text`. Contains a 1.5×1.5 coloured dot.

**Expand button:** ChevronDown (collapsed) / ChevronUp (expanded). gray-400 → gray-600 on hover.

**Key signals row (mt-3, flex-wrap):**
- `CheckInAgo` component: Clock icon + "{days}d since check-in". Colour: **red-600** if days > 60; **amber-600** if days > 30; **gray-500** if ≤ 30.
- "·" separator
- Combined single span: `"{tenure}m at level · {location}"` (11px, gray-500)
- If `hasInternalOpportunity`: "·" + Sparkles icon (sky) + "Internal opportunity available" + ArrowRight (11px, sky-600). Clicking calls `onViewOpportunity()` → `onSwitchToHiddenTalent()`.

**Expanded section** (rendered when `expanded === true`):
- Background: `cfg.bg cfg.border` (risk-level colour — e.g. red-50 for high, amber-50 for medium)
- "Revelio Labs · Risk drivers" header (`cfg.text` colour)
- Bulleted list of `entry.flightRiskDrivers` (each bullet uses `cfg.dot` coloured circle)
- Info box (bg-white/70, border-white, rounded-xl p-3): Info icon (gray-400) + "Suggested action: schedule a growth conversation, review comp against market, and explore internal mobility if applicable."

**Risk configuration (RISK_CONFIG):**

| Risk | Dot | Card bg | Card border | Text | Badge bg |
|---|---|---|---|---|---|
| high | bg-red-500 | bg-red-50 | border-red-100 | text-red-700 | bg-red-100 |
| medium | bg-amber-400 | bg-amber-50 | border-amber-100 | text-amber-700 | bg-amber-100 |
| low | bg-emerald-400 | bg-emerald-50 | border-emerald-100 | text-emerald-700 | bg-emerald-100 |

### 6.6 Empty state

When `filtered.length === 0`:
- Centred, white bg, rounded-2xl, p-12
- Zap icon (gray-200, 28px) + "No flight risk signals detected" (sm semibold, gray-400) + "Connect Revelio Labs to surface real-time job-switching propensity data." (xs, gray-400)

### 6.7 Footer note

Shown when `filtered.length > 0`. Info icon + full text:
> "Flight risk scored by Revelio Labs job-switching propensity model. Factors include LinkedIn activity, tenure plateau, compensation gap, and engagement signals. For internal retention use only."

---

## 7. HiddenTalent — cross-department fit view

Rendered when `activeTab === 'hidden-talent'`. Wrapped in `<main className="flex-1 overflow-auto p-8">`.

### 7.1 Data population

```
allCandidates = getCrossDeptFitCandidates()   // memoized
```

`filtered` (memoized): applies dept filter + sort:

```
dept = filterDept ?? (selectedDept === 'all' ? null : selectedDept)
base = dept
  ? allCandidates.filter(r => r.currentDept === dept || r.suggestedDept === dept)
  : allCandidates

// dept filter matches if the person's CURRENT or SUGGESTED dept matches
// i.e. "show me everyone relevant to Engineering" includes people moving from or to Engineering

sorted by:
  urgency mode: urgencyScore(b) - urgencyScore(a)
    where urgencyScore = FLIGHT_RISK_WEIGHT[flightRisk] + delta
    FLIGHT_RISK_WEIGHT = { high: 100, medium: 50, low: 0 }
  fit mode: b.delta - a.delta
```

`byDeptCounts` (memoized):
```
all: allCandidates.length
per dept: allCandidates.filter(r => r.currentDept === dept || r.suggestedDept === dept).length
```

`highRiskCount` = `filtered.filter(r => r.flightRisk === 'high').length` — count within the **currently filtered** set, not all candidates.

### 7.2 Page header

**Left side:**
- Sparkles icon (sky-500) + "Hidden Talent" (base bold, gray-900)
- **"LinkedIn-inferred" badge**: `bg-sky-100 text-sky-700`, xs semibold, rounded-full
- Description: "People whose inferred skills suggest a better-fit function. Flight risk signals from Revelio Labs show who needs a conversation now."

**Right side:**
- AlertTriangle icon (amber-500) + "For managers only · Not visible to employees" (11px, amber-700) in `bg-amber-50 border-amber-100 rounded-xl px-3 py-2`

### 7.3 High-risk alert banner

Shown only when `highRiskCount > 0`:
- `bg-red-50 border-red-100 rounded-xl px-4 py-2.5`
- Zap icon (red-500) + "{N} person/people flagged high flight risk — internal mobility conversations recommended this quarter."

### 7.4 Department filter pills

Shown only when `filterDept` prop is **not** set. Department buttons are hidden if their count is 0.

**"All" button:**
- Active (when `selectedDept === 'all'`): `bg-gray-900 text-white`
- Inactive: `bg-gray-100 text-gray-500 hover:text-gray-800`
- Label: `"All ({byDeptCounts.all})"`

**Per-dept buttons** (only for depts with `byDeptCounts[dept] > 0`):
- Active: background = `DEPT_COLORS[dept]`, border = `DEPT_COLORS[dept]`, text = white
- Inactive: `bg-gray-50 text-gray-500 border-gray-100 hover:text-gray-800`
- Label: `"{dept} ({count})"`

Clicking a dept button sets `selectedDept`. The filter applies to both current and suggested dept.

### 7.5 Sort toggle

A pill container (`bg-gray-100 rounded-lg p-0.5`) containing two inner buttons:

| Button | Icon | Label | Sort |
|---|---|---|---|
| Most urgent | Zap | "Most urgent" | `urgencyScore = FLIGHT_RISK_WEIGHT[risk] + delta`, desc |
| Best fit | ArrowUpDown | "Best fit" | `delta` desc |

- Active inner button: `bg-white text-gray-900 shadow-sm rounded-md`
- Inactive: `text-gray-500 hover:text-gray-700`

Sort toggle is always visible (regardless of filter dept state) and positioned `ml-auto flex-shrink-0`.

### 7.6 Candidate cards

Grid: `grid-cols-1 lg:grid-cols-2 gap-4`.

Each `CandidateCard` has local `expanded` state (default: false).

**Card border:** `border-red-100` if `flightRisk === 'high'`; `border-gray-100` otherwise.

**Always-visible section (px-6 py-4):**

**Avatar (36×36, rounded-xl):** Background = `DEPT_COLORS[result.currentDept]`. Red dot indicator if high flight risk (same as FlightRiskTab).

**Name + dept transition row:**
- Name (sm bold, gray-900)
- Current dept pill (coloured with `currentColor`)
- ArrowRight icon (gray-300)
- Suggested dept pill (coloured with `suggestedColor`)

**Δ badge** (`DeltaBadge`): TrendingUp icon + `"+{delta}%"`. Colour:
- `delta >= 30`: `bg-emerald-100 text-emerald-800`
- `delta >= 20`: `bg-sky-100 text-sky-800`
- `delta < 20`: `bg-amber-100 text-amber-700`

**Expand button:** ChevronDown/ChevronUp (gray-400 → gray-700).

**Flight risk badge** (`FlightRiskBadge`): coloured dot + label. Shown below the name row (`mt-3`).

**Fit comparison bars** (`grid-cols-2 gap-4`, `mt-3`):
- Left: "Current dept fit" label + `FitBar` at `result.currentReadinessPct%` in `currentColor`
- Right: `"{result.suggestedDept} fit"` label + `FitBar` at `result.fitPct%` in `suggestedColor`

`FitBar`: `bg-gray-100 rounded-full h-1.5`, filled at `pct%` with `background: color`, + `"{pct}%"` right-aligned.

**Top inferred signal** (shown when `topInferredSignals.length > 0`): Linkedin icon (sky, #0A66C2) + `result.topInferredSignals[0].source` text. Always the first signal only.

**Expanded section (border-t bg-gray-50/40, px-6 py-4):**

Sections shown only when their data is non-empty:

1. **Flight risk drivers** (when `flightRiskDrivers.length > 0`):
   - "Revelio Labs · Flight risk drivers" header (`riskCfg.text`)
   - Bulleted list of driver strings

2. **LinkedIn history** (when `linkedInSignals.length > 0`):
   - "LinkedIn history" header (gray-400)
   - Bulleted list with LinkedIn-blue (#0A66C2) dots

3. **Inferred skills driving fit** (when `topInferredSignals.length > 0`):
   - "Inferred skills driving fit" header (gray-400)
   - Each signal: confidence badge (`CONFIDENCE_COLORS[note.confidence]`) + source text
   - `CONFIDENCE_COLORS`: high = `text-emerald-700 bg-emerald-50`; medium = `text-amber-700 bg-amber-50`; low = `text-gray-600 bg-gray-50`

4. **Framework match** (always shown in expanded view):
   - "Framework match" header (gray-400)
   - "Meets **{matchedCriteria} of {totalCriteria}** criteria for {suggestedLevelLabel}"

5. **Framing disclaimer** (always shown in expanded view):
   - `bg-amber-50 border-amber-100 rounded-xl p-3`
   - Info icon (amber-500)
   - "This is an opportunity signal, not a performance flag. Share with the employee as a career conversation starter — not a directive."

### 7.7 Empty state

When `filtered.length === 0`:
- Centered, white bg, rounded-2xl, p-12
- Sparkles icon (gray-200, 28px) + "No cross-fit candidates detected" (sm semibold, gray-400) + "Upload LinkedIn data for more employees to surface hidden strengths."

### 7.8 Footer note

Shown when `filtered.length > 0`. Info icon + text:
> "Fit scores use Revelio Labs LinkedIn data discounted one level for confidence. Flight risk from Revelio Labs job-switching propensity model. For internal use only."

---

## 8. Export — download and email

Both `PromotionPipeline` (org view) and `DeptPipelineView` render `ExportButtons` in their headers.

### 8.1 Download button

**Action:** Calls `buildContent()` to generate the report text, passes it to `buildPrintHtml(title, text)`, opens a new browser tab via `window.open('', '_blank')`, writes the HTML to it, and closes the document. The new tab renders styled HTML and auto-triggers `window.print()` via an `onload` script. After `window.print()` finishes, `window.close()` is called on the print window.

**User experience:** The browser opens its native print dialog (with "Save as PDF" as an option) in a new tab. The content is formatted as a clean, readable HTML document.

**Button states:**
- Default: Download icon + "Download"; `bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700`
- Post-click (2 seconds): Check icon + "Downloaded"; `bg-emerald-50 border-emerald-200 text-emerald-600`
- Reverts automatically after 2 seconds

**PDF content for org-level view (`buildExportContent` in PromotionPipeline):**
```
PROMOTION READINESS PIPELINE — ACME CORP
Generated: [date]
==================================================

Total tracked: X
Near ready (90%+): X
Progressing (70-89%): X
Avg readiness: X%
Avg tenure in level: Xm

BY DEPARTMENT
--------------------------------------------------
[Dept]: X people | X near-ready | X progressing | avg X%
  Top candidate: [Name] (X%)         ← only if nearReady > 0
...                                   ← depts with total === 0 are skipped
```

**PDF content for department view (`buildExportContent` in DeptPipelineView):**
```
[DEPT UPPERCASE] — PROMOTION PIPELINE
Generated: [date]
==================================================

People tracked: X across Y level transitions

[CurrentLabel] → [NextLabel] (N people)
  [Name] — X% ([tier]) | X/Y criteria
  ...

(blank line between transition groups)
```

**HTML rendering in `buildPrintHtml`:**
- Lines of all-uppercase (length > 2, not starting with digit) → `<h2>` section headers
- Lines starting with 2+ spaces → indented `<p>` (20px left padding)
- `=...` / `-...` separator lines → `<hr>`
- Blank lines → `<br/>`
- All other lines → `<p>`

### 8.2 Email me button

**Action:** Opens the `EmailModal`.

**EmailModal behaviour:**

1. Shows report title in a preview box
2. Email input field (autoFocused; Enter key submits)
3. "Open email client" button (disabled until email is non-empty)
4. On submit: calls `buildContent()`, constructs `mailto:[email]?subject=Progression: [title]&body=[content]`, opens via `window.open()`; shows confirmation state
5. **Post-send confirmation:** Green check icon + "Your email client has opened" + "The report is pre-filled in a new email to [email]. Review and send from your email client." + "Close" link
6. **Closing:** X button (top-right), clicking the backdrop, or the post-send "Close" link

**Privacy note** displayed in modal: "This opens your email client with the report pre-filled. Nothing is sent through Progression servers."

---

## 9. Data model and computations

### 9.1 Source data

**PEOPLE** (42 employees): Each `Person` has `id`, `name`, `department`, `team`, `location`, `currentLevelId`, `skills: Record<skillId, 1–5>`, `tenure` (months in current level), `lastCheckIn` (ISO date). Optional: `inferredSkills: Record<skillId, number>`, `inferredNotes: InferredSkillNote[]`, `linkedInSignals: string[]`, `flightRisk: FlightRisk`, `flightRiskDrivers: string[]`.

**LEVEL_DEFINITIONS** (23 entries): Level hierarchy per department and track. Each has `id`, `label` (e.g. "IC2 · Mid Engineer"), `shortLabel` (e.g. "IC2"), `track: 'IC' | 'Manager'`, `department`, `nextLevel: string | null`.

Levels per department:
- Engineering IC: eng-ic1 → eng-ic2 → eng-ic3 → eng-ic4 (terminal)
- Engineering Manager: eng-m1 → eng-m2 (terminal)
- Product: prod-ic1 → prod-ic2 → prod-ic3 → prod-ic4 (terminal)
- Design: des-ic1 → des-ic2 → des-ic3 (terminal)
- Data: dat-ic1 → dat-ic2 → dat-ic3 (terminal)
- Marketing: mkt-ic1 → mkt-ic2 → mkt-ic3 (terminal)
- Sales: sal-ic1 → sal-ic2 → sal-ic3 (terminal)
- People Ops: ppl-ic1 → ppl-ic2 → ppl-m1 (terminal; note: IC → Manager track transition)

**LEVEL_FRAMEWORKS** (10 entries): One per target level with a defined advancement criterion. Frameworks exist for: `eng-ic2`, `eng-ic3`, `eng-ic4`, `prod-ic3`, `prod-ic4`, `des-ic3`, `dat-ic3`, `mkt-ic3`, `sal-ic3`, `ppl-m1`. People whose next level has no framework are excluded from pipeline data.

### 9.2 `computeReadiness(person, framework, levelLabel)`

```typescript
for each criterion in framework.criteria:
  actual = person.skills[criterion.skillId] ?? 0
  if actual >= criterion.requiredRating:
    → metSkills.push(criterion)
  else:
    → gapSkills.push({ ...criterion, actualRating: actual, gap: requiredRating - actual })

readinessPct = Math.round(metSkills.length / framework.criteria.length * 100)
```

Returns `ReadinessResult`: `{ person, targetLevelId, targetLevelLabel, criteriaTotal, criteriaMet, readinessPct, metSkills, gapSkills }`.

**Note:** Uses `person.skills` only (assessed ratings). Inferred skills are **not** used in `computeReadiness` — they are only used in `getCrossDeptFitCandidates` via `mergedSkills`.

### 9.3 `getAllReadiness()`

```typescript
for each person in PEOPLE:
  currentLevel = LEVEL_DEFINITIONS.find(l.id === person.currentLevelId)
  if !currentLevel?.nextLevel → skip   // terminal level, no promotion path
  nextLevel = LEVEL_DEFINITIONS.find(l.id === currentLevel.nextLevel)
  if !nextLevel → skip
  framework = LEVEL_FRAMEWORKS.find(f.levelId === nextLevel.id)
  if !framework → skip                 // no criteria defined for this next level
  → computeReadiness(person, framework, nextLevel.label)
```

People are excluded if: at a terminal level (e.g. Staff Engineer IC4), or their next level has no framework defined.

### 9.4 `getReadinessTier(pct)`

```
pct >= 90 → 'near-ready'
pct >= 70 → 'progressing'
pct >= 50 → 'developing'
else      → 'early'
```

Boundaries are **inclusive at the top** — 90% exactly is near-ready; 70% exactly is progressing.

### 9.5 `groupByTier(results)`

Returns `{ 'near-ready': N, 'progressing': N, 'developing': N, 'early': N }` by calling `getReadinessTier` on each result's `readinessPct`.

### 9.6 `getFlightRiskPeople(minRisk)`

```
riskOrder = { high: 2, medium: 1, low: 0 }
minLevel = riskOrder[minRisk]

filter: p.flightRisk exists AND riskOrder[p.flightRisk] >= minLevel
map to FlightRiskPerson:
  daysSinceCheckIn = Math.floor((REFERENCE_DATE - p.lastCheckIn) / 86_400_000)
  hasInternalOpportunity = p.inferredSkills exists AND has at least 1 key

sort: riskOrder[b.flightRisk] - riskOrder[a.flightRisk] (desc)
  tie-break: b.daysSinceCheckIn - a.daysSinceCheckIn (desc)
```

`REFERENCE_DATE = 2026-05-08` (hardcoded). Check-in colour thresholds: > 60 days = red, > 30 days = amber, ≤ 30 = gray.

### 9.7 `getCrossDeptFitCandidates()`

**Step 1 — for each person with `inferredSkills`:**

```
currentReadinessResult = getAllReadiness().find(r.person.id === person.id)
currentFit = Math.max(20, currentReadinessResult?.readinessPct ?? 20)
  // baseline is next-level readiness in current dept; floored at 20

personRank = icRank(person.currentLevelId)
  // ic4 or m2 → 4; ic3 or m1 → 3; ic2 → 2; else → 1
```

**Step 2 — score against every other IC framework:**

```
for each framework in LEVEL_FRAMEWORKS:
  targetLevel = LEVEL_DEFINITIONS.find(l.id === framework.levelId)
  skip if: targetLevel.department === person.department   // same dept
  skip if: targetLevel.track !== 'IC'                    // managers only
  targetRank = icRank(framework.levelId)
  skip if: |targetRank - personRank| > 1                 // more than 1 level apart

  fitPct = scorePerson(person, framework)     // uses mergedSkills
  skip if: fitPct < 50                        // ROLE_FIT_MIN_SUGGESTED

  delta = fitPct - currentFit
  skip if: delta < 20                         // ROLE_FIT_MIN_DELTA

  topSignals = inferredNotes matching framework skill IDs, first 3
```

**`mergedSkills(person)`:**
```
start with person.skills (assessed)
for each [skillId, rating] in person.inferredSkills:
  if skillId not already in assessed:
    merged[skillId] = Math.max(1, rating - 1)   // discount by 1 level
```

**`scorePerson(person, framework)`:**
```
skills = mergedSkills(person)
met = count where skills[criterion.skillId] >= criterion.requiredRating
return Math.round(met / framework.criteria.length * 100)
```

**Step 3 — deduplicate:** Keep only the highest-delta match per person.

**Step 4 — sort** descending by `delta`.

### 9.8 `fmtCurrency(n)`

```
n >= 1_000_000 → "$X.XM"    (1 decimal place)
n >= 1_000     → "$XK"      (0 decimal places)
else           → "$X"
```

---

## 10. Readiness tiers reference

| Tier key | Label | Range | Color class | Bg class | Border class | Badge class | Bar class |
|---|---|---|---|---|---|---|---|
| `near-ready` | Near Ready | 90%+ | text-emerald-700 | bg-emerald-50 | border-emerald-200 | bg-emerald-100 text-emerald-800 | bg-emerald-500 |
| `progressing` | Progressing | 70–89% | text-sky-700 | bg-sky-50 | border-sky-200 | bg-sky-100 text-sky-800 | bg-sky-500 |
| `developing` | Developing | 50–69% | text-amber-700 | bg-amber-50 | border-amber-200 | bg-amber-100 text-amber-800 | bg-amber-400 |
| `early` | Early Stage | <50% | text-gray-500 | bg-gray-50 | border-gray-200 | bg-gray-100 text-gray-600 | bg-gray-300 |

---

## 11. Constants and configuration

| Constant | Value | Location | Purpose |
|---|---|---|---|
| `CHECKIN_CUTOFF` | 2026-04-29 | PromotionPipeline.tsx:32 | Baseline for check-in coverage. Employees checked in within 30d of this date count as covered. |
| `REFERENCE_DATE` | 2026-05-08 | promotionData.ts:291 | Baseline for `daysSinceCheckIn` calculation in flight risk |
| `ROLE_FIT_MIN_SUGGESTED` | 50 | promotionData.ts:537 | Min fit % in suggested dept for cross-dept match to qualify |
| `ROLE_FIT_MIN_DELTA` | 20 | promotionData.ts:538 | Min improvement over current fit for a match to qualify |
| `DEPT_SALARIES` | See §3.3 | PromotionPipeline.tsx:22–30 | Per-dept salary assumption for total cost card |
| `DEPT_COLORS` | Hex strings | mockData.ts (re-exported from promotionData.ts) | One colour per department; used for cards, bars, pills, avatars |
| `TIER_CONFIG` | Keyed by ReadinessTier | promotionData.ts:350 | Label, color, bg, border, badge, barColor per tier |
| `TIER_RANGES` | Keyed by ReadinessTier | promotionData.ts:337 | Display range string per tier (e.g. "90%+") |
| `FLIGHT_RISK_WEIGHT` | `{high:100, medium:50, low:0}` | HiddenTalent.tsx:25 | Weight added to delta for urgency sort in Hidden Talent |
| `RISK_CONFIG` | Keyed by FlightRisk | FlightRiskTab.tsx:13 | dot, bg, border, text, badgeBg colours per risk level |
| `ORG_SUMMARY` | Computed object | PromotionPipeline.tsx:56 | Module-level constant. Computed once at load. headcount, totalCost, avgSalary, roleLevels, deptBreakdown, checkInCoverage. |
