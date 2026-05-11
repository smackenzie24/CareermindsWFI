# Industry Benchmarks — Product Specification

**Feature:** Industry Benchmarks
**Component:** `src/components/benchmark/IndustryBenchmark.tsx`
**Data files:**
- `src/data/benchmarkData.ts` — peer data, quartile computation, benchmark helpers, attrition records and risk score
- `src/data/benchmarkRecommendations.ts` — data-driven recommendation generators

**Data source:** Static mock data. `ATTRITION_RECORDS` and `PEER_COMPANIES` are module-level constants.
**Last updated:** May 2026

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Navigation model](#2-navigation-model)
3. [Page layout](#3-page-layout)
4. [Header](#4-header)
5. [Section 1 — Overview](#5-section-1--overview)
6. [Section 2 — By Department](#6-section-2--by-department)
7. [Section 3 — Talent Flow](#7-section-3--talent-flow)
8. [Footer banners](#8-footer-banners)
9. [Shared sub-components](#9-shared-sub-components)
10. [Data model and computations](#10-data-model-and-computations)
11. [Recommendation generators](#11-recommendation-generators)
12. [Export content](#12-export-content)
13. [Constants and configuration](#13-constants-and-configuration)

---

## 1. Feature overview

The Industry Benchmarks page compares Acme Corp across three dimensions — skill competency, compensation, and team composition — against a configurable set of 8 peer companies. A third section shows attrition destination data for the last 12 months.

All three sections (Overview, By Department, Talent Flow) are always rendered and separated by `border-t border-gray-200` dividers. There is no tab-based navigation between sections. The page scrolls as a single continuous document.

Benchmark computations re-run reactively when the peer filter changes. Talent flow data is always derived from the full `ATTRITION_RECORDS` constant — the attrition risk score card never recomputes. The departure log, KPI strip, top destinations, and trend chart all recompute when the in-section department filter changes.

---

## 2. Navigation model

**Entry point:** `App.tsx` renders `<IndustryBenchmark>` when `nav.view === 'benchmark'`.

**Prop:**
```typescript
interface Props {
  onNavigateToGapReport?: (dept: Department) => void;
}
```

Wired in App.tsx as:
```typescript
onNavigateToGapReport={(dept) => setNav({ view: 'gap-report', department: dept })}
```

This callback is only invoked from `DeptBenchmarkRow` for departments positioned `'bottom'` or `'below-median'`, and only when the callback is defined. It navigates to `view: 'gap-report'` scoped to the selected department.

---

## 3. Page layout

```
<div className="flex flex-col min-h-screen bg-gray-50 font-sans">
  <header>                    // bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0
  <main className="flex-1 overflow-auto p-8">
    <div className="max-w-5xl mx-auto space-y-12">
      <section>               // Overview
      <div className="border-t border-gray-200" />
      <section>               // By Department
      <div className="border-t border-gray-200" />
      <section>               // Talent Flow
      <UpsellBanner ... />
      <FeedbackBanner ... />
    </div>
  </main>
</div>
```

The `max-w-5xl mx-auto` container constrains all content. The header does not scroll. The main scrolls independently via `overflow-auto`.

---

## 4. Header

### 4.1 Title block

```
"Workforce Intelligence"     // text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1
"Industry Benchmarks"        // text-2xl font-bold text-gray-900
"Compare Acme Corp's skill maturity, compensation, and team composition against {PEER_COMPANIES.length} similar SaaS and tech companies. Data aggregated anonymously with customer consent."
                             // text-sm text-gray-500 mt-1 max-w-2xl
```

The subtitle always uses `PEER_COMPANIES.length` (always 8), not the currently filtered `peers.length`.

### 4.2 Export button

`<ExportButtons title="Industry Benchmarks" buildContent={...} />` — top-right of header. See [Section 12](#12-export-content) for exact content.

### 4.3 Live context badge

```
[● Acme Corp  vs {peers.length} peers]
```

- Container: `bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2`
- Dot: `w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse`
- "Acme Corp": `text-xs font-medium text-gray-600`
- "vs N peers": `text-xs text-gray-400`

`peers.length` is reactive — updates when the peer filter changes.

### 4.4 Peer filter bar

`data-tour="benchmark-peer-filter"` on the containing div.

```
"Compare against:"   // text-xs font-medium text-gray-500
[All peers] [Similar size] [B2B SaaS only] [Scaleups]
"{peers.length} companies selected"   // text-xs text-gray-400 ml-2
```

**State:** `peerFilter: PeerFilter` — initialised to `'similar'`.

**Options:**

| Key | Label | Resolves to |
|---|---|---|
| `'all'` | All peers | All 8 `PEER_COMPANIES` |
| `'similar'` | Similar size | `SIMILAR_PEERS` (Scaleups + Enterprise <300 headcount = 4 companies) |
| `'saas'` | B2B SaaS only | `PEER_COMPANIES.filter(p => p.industry === 'B2B SaaS')` |
| `'scaleup'` | Scaleups | `PEER_COMPANIES.filter(p => p.size === 'Scaleup')` |

Active: `bg-gray-900 text-white`. Inactive: `text-gray-500 hover:bg-gray-100`. Both: `text-xs px-3 py-1.5 rounded-lg font-medium transition-colors`.

Changing the peer filter triggers recomputation of `summary`, `orgBenchmarks`, `skillBenchmarks`, `compBenchmarks`, `sizeBenchmarks`, `overviewRecs`, `skillsRecs`, `compRecs`, `compositionRecs` — all via `useMemo([peerFilter])`.

---

## 5. Section 1 — Overview

`data-tour="benchmark-overview-card"` on the `<section>` element.

Section heading: `<Globe size={15} className="text-gray-400" />` + `"Overview"` (`text-base font-bold text-gray-900`). Both in a `flex items-center gap-3` row.

### 5.1 Overall position card

Background, border, and text colours all driven by `QUARTILE_CONFIG[summary.overallPosition]` (referred to as `overallCfg`).

**Left side:**
```
"Overall benchmark position"       // text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1
{overallCfg.label}                 // text-3xl font-black {overallCfg.color}
"Across skill competency, compensation, and org structure, Acme Corp ranks in the {label} compared to {peers.length} similar-sized SaaS and tech companies."
                                   // text-sm text-gray-600 mt-2 max-w-xl
```

**Right side — quartile icon box** (`w-16 h-16 rounded-2xl bg-white/50 border {overallCfg.border} flex items-center justify-center`):
```
{rank}Q    // rank from: top→"1st", above-median→"2nd", below-median→"3rd", bottom→"4th"
           // text-2xl font-black {overallCfg.color}; "Q" suffix is text-xs
```

**2-column grid below** (`grid grid-cols-2 gap-4 mt-5`):

**Left — Strengths** (`bg-white/60 rounded-xl p-4 border border-white`):
- Header: `<Star size={11} className="text-emerald-500" />` + "Strengths" (`text-xs font-semibold text-gray-500 mb-2`)
- Source: `summary.topDepts` — skill benchmarks where `position === 'top' || 'above-median'`. Up to **3** shown via `.slice(0, 3)`.
- Each row: dept name left (`text-xs text-gray-700`) + `<QuartileBadge>` right.
- Empty state: "No top-quartile departments yet" (`text-xs text-gray-400`).

**Right — Areas to close** (`bg-white/60 rounded-xl p-4 border border-white`):
- Header: `<AlertTriangle size={11} className="text-red-400" />` + "Areas to close" (`text-xs font-semibold text-gray-500 mb-2`)
- Source: `summary.gapDepts` — skill benchmarks where `position === 'bottom' || 'below-median'`. Up to **3** shown via `.slice(0, 3)`.
- Same row structure as Strengths.
- Empty state: "All departments at or above median" (`text-xs text-gray-400`).

### 5.2 Org-level benchmark cards

`data-tour="benchmark-dist-grid"` on the `grid grid-cols-2 gap-5` wrapper.

Two cards from `getOrgBenchmarks(peers)`:

1. **Framework maturity** — `acmeValue = 3.6`, `unit = '/ 5'`, `higherIsBetter = true`
2. **Promotion velocity** — `acmeValue = 19`, `unit = 'months avg'`, `higherIsBetter = false`

Each card (`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`):
```
{bench.label}                           // text-xs text-gray-500 mb-1
{bench.acmeValue}{bench.unit}           // text-3xl font-black {bCfg.color}
<QuartileBadge pos={bench.position} />
<DeltaChip delta={bench.delta} unit={unitArg} higherIsBetter={bench.higherIsBetter} />
<DistributionBar .../>                  // mt-4 mb-6
"Peer range: {min}–{max}{unit} · Median: {p50}{unit}"    // text-[11px] text-gray-400 mt-6
```

**DeltaChip `unit` arg:** `bench.unit.includes('months') ? 'm' : ''` — so velocity shows "±Xm vs median", maturity shows "±X vs median".

**DistributionBar format function:** `v => \`${v}${bench.unit}\`` — e.g. "3.6/ 5" or "19months avg".

### 5.3 Skill category panels

`grid grid-cols-2 gap-5`:

**Left — Strongest skill categories** (`<TrendingUp size={14} className="text-emerald-500" />`):
- Source: `summary.topCategories` = `getCategoryBenchmarks(peers).filter(b => b.delta > 0).slice(-3).reverse()` — last 3 entries with positive delta from the ascending-sorted array, reversed so best first. Max 3 items.
- Each row: category name (`text-xs font-medium text-gray-700`) + value (`text-xs font-bold text-gray-800`) + `<DeltaChip>` + emerald bar (`bg-emerald-400`), width = `(b.acmeValue / 5) * 100%`.

**Right — Largest skill gaps vs peers** (`<TrendingDown size={14} className="text-red-400" />`):
- Source: `summary.gapCategories` = `getCategoryBenchmarks(peers).filter(b => b.delta < 0).slice(0, 3)` — first 3 with negative delta (worst gaps first). Max 3 items.
- Same layout; red bar (`bg-red-400`), width = `(b.acmeValue / 5) * 100%`.

Both bar tracks: `w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`.

### 5.4 Peer company cards

Heading: `"Peer group ({peers.length} companies)"` (`text-sm font-bold text-gray-900 mb-4`)

`grid grid-cols-4 gap-3` — each card (`bg-white rounded-xl border border-gray-100 p-4`):
```
{peer.name}                  // text-xs font-bold text-gray-800 truncate
{peer.size} · {peer.industry}  // text-[10px] text-gray-400 mt-0.5
--- (border-t border-gray-50 mt-2 pt-2 space-y-1)
Headcount  {peer.totalHeadcount}   // text-[10px]
Framework  {peer.frameworkMaturity}/5
```

Fields shown: name, size, industry, `totalHeadcount`, `frameworkMaturity` only. No comp, skill competency, or dept breakdown shown in cards.

### 5.5 Recommendations panel

`<RecommendationsPanel recs={overviewRecs} />` — `defaultOpen` not passed, defaults to `false` (collapsed).

Source: `getOverviewRecommendations(peers)`. See [Section 11.1](#111-getoverviewrecommendations).

---

## 6. Section 2 — By Department

### 6.1 Section header and metric toggle

Section heading: `<BarChart3 size={15} className="text-gray-400" />` + `"By Department"` — flex left.

`data-tour="benchmark-tabs"` on the metric toggle container.

**Metric toggle** (`bg-gray-100 rounded-xl p-1 flex items-center gap-1`):

| id | Label | Icon |
|---|---|---|
| `'skills'` | Skill Competency | `<BarChart3 size={12} />` |
| `'compensation'` | Compensation | `<DollarSign size={12} />` |
| `'team-size'` | Team Composition | `<Users size={12} />` |

Active: `bg-white text-gray-900 shadow-sm` + icon `text-sky-500`.
Inactive: `text-gray-500 hover:text-gray-700` + icon `text-gray-400`.

**State:** `deptMetric: DeptMetric` — initialised to `'skills'`.

Changing `deptMetric` switches the benchmark rows, context blurb, composition bar, and recommendations panel. Does not affect Sections 1 or 3.

### 6.2 Context blurb

`bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-start gap-2`:
- `<Info size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />`

Text per metric:
- `'skills'`: "Average skill competency rating (1–5 scale) per department, compared to peer companies. Departments below median link directly to the skill gap report."
- `'compensation'`: "Average annual compensation (USD) per department. Peer data is anonymized and aggregated. Departments below market link to skill gap context."
- `'team-size'`: "Department headcount as a **percentage of total company size**. Acme total: **{ACME_TOTAL_HEADCOUNT}**. Reveals structural differences — e.g. whether you are engineering-heavy or sales-light relative to peers." (`<strong>` tags used; `ACME_TOTAL_HEADCOUNT = 192`)

### 6.3 Composition bar (team-size only)

Only rendered when `deptMetric === 'team-size'`.

Container: `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`

Label: "Acme Corp team composition" (`text-xs font-semibold text-gray-500 mb-3`)

**Stacked bar** (`flex h-8 rounded-xl overflow-hidden gap-px mb-3`):
- Iterates `sizeBenchmarks` (Engineering → People Ops order)
- Each segment: `width: ${b.acmeValue}%`, `background: DEPT_COLORS[b.department]`
- Text label inside segment (`text-[9px] font-bold text-white`): shown only if `b.acmeValue > 6`, otherwise empty
- `title` attribute: `"{b.department}: {b.acmeValue}%"`

**Legend** (`flex flex-wrap gap-3`):
- Each: `w-2.5 h-2.5 rounded-sm` swatch + `"{dept} {value}%"` where value is `<strong>`

### 6.4 Department benchmark rows

`grid grid-cols-2 gap-4`

Benchmark array by `deptMetric`:
- `'skills'` → `skillBenchmarks` (from `getDeptSkillBenchmarks(peers)`)
- `'compensation'` → `compBenchmarks` (from `getDeptCompBenchmarks(peers)`)
- `'team-size'` → `sizeBenchmarks` (from `getDeptSizeBenchmarks(peers)`)

Format function `deptFormatValue`:
- `'skills'` → `v.toFixed(1)`
- `'compensation'` → `fmtK(v)` where `fmtK(n) = n >= 1000 ? "$" + (n/1000).toFixed(0) + "K" : "$" + n`
- `'team-size'` → `` `${v.toFixed(1)}%` ``

Each row: `<DeptBenchmarkRow bench={b} formatValue={deptFormatValue} onNavigateToGapReport={onNavigateToGapReport} />` — see [Section 9.4](#94-deptbenchmarkrow).

**"View gaps →" link** — shown for any `deptMetric` (not gated to skills only) when `bench.position === 'bottom' || 'below-median'` AND `onNavigateToGapReport` is defined.

### 6.5 Recommendations panel

`<RecommendationsPanel recs={deptMetricRecs} />` — collapsed by default.

`deptMetricRecs`:
- `'skills'` → `skillsRecs` from `getSkillsRecommendations(peers)`
- `'compensation'` → `compRecs` from `getCompRecommendations(peers)`
- `'team-size'` → `compositionRecs` from `getCompositionRecommendations(peers)`

---

## 7. Section 3 — Talent Flow

Section heading: `<LogOut size={15} className="text-gray-400" />` + `"Talent Flow"` (`text-base font-bold text-gray-900`).

### 7.1 Info blurb

"Shows employees who left Acme Corp in the last 12 months and the companies they joined. Data sourced from exit interviews and publicly available LinkedIn signals."

Same sky-50 style as 6.2 context blurb.

### 7.2 Attrition risk score card

Computed once: `useMemo(() => computeAttritionScore(ATTRITION_RECORDS, ACME_TOTAL_HEADCOUNT), [])` — empty deps, never recomputes.

Card: `rounded-2xl border p-6 {attritionScore.riskBg} {attritionScore.riskBorder}` — themed by risk level.

**Left side (`flex-1`):**
```
"Attrition Risk Score"          // text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1
{attritionScore.score}          // text-5xl font-black leading-none {attritionScore.riskColor}
/100  {riskLabel} risk           // text-base and text-sm font-bold {attritionScore.riskColor}
{attritionScore.headline}       // text-sm text-gray-600 max-w-xl
```

**Right side — score bar** (`flex-shrink-0 w-40`):
- Track: `h-3 bg-white/60 rounded-full overflow-hidden border border-white`
- Fill: `width: {score}%`, colour:
  - `score >= 70` → `bg-red-400`
  - `score >= 45` → `bg-amber-400`
  - `score >= 25` → `bg-sky-400`
  - else → `bg-emerald-400`
- Labels: "Low" (left) "High" (right) `text-[9px] text-gray-400`

**Sub-metric grid** (`grid grid-cols-4 gap-3 mt-5`), each `bg-white/60 rounded-xl px-4 py-3 border border-white`:

| Label | Value | Sub-text | Warn when |
|---|---|---|---|
| Annualised rate | `{annualisedRate}%` | `Peer median: {peerMedianRate}%` | `annualisedRate > peerMedianRate` |
| To competitors | `{competitorPct}%` | "of leavers" | `competitorPct >= 20` |
| Comp-driven | `{compDrivenPct}%` | "cited pay as reason" | `compDrivenPct >= 40` |
| Avg tenure exit | `{avgTenureMonths}m` | "months at exit" | `avgTenureMonths < 18` |

When `warn` is true, value text uses `attritionScore.riskColor`; otherwise `text-gray-700`. Label: `text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1.5`. Sub: `text-[10px] text-gray-400 mt-0.5`.

### 7.3 Department filter bar

**State:** `deptFilter: string` — initialised to `'All'`.

```
"Department:"   // text-xs font-medium text-gray-500
[All] [dept...] (sorted alphabetically)
```

`attritionDepts = useMemo(() => ['All', ...Array.from(new Set(ATTRITION_RECORDS.map(r => r.department))).sort()], [])` — never recomputes.

Active: `bg-gray-900 text-white`. Inactive: `text-gray-500 hover:bg-gray-100`. Both: `text-xs px-2.5 py-1 rounded-lg font-medium transition-colors`.

When `deptFilter` changes: `filteredAttrition`, `topDestinations`, `trend`, and all derived KPI values recompute.

### 7.4 KPI strip

`grid grid-cols-4 gap-4` — all derived from `filteredAttrition`:

```typescript
filteredAttrition = ATTRITION_RECORDS
  .filter(r => deptFilter === 'All' || r.department === deptFilter)
  .sort((a, b) => b.date.localeCompare(a.date))

totalLeavers = filteredAttrition.length
avgTenure = totalLeavers > 0 ? Math.round(sum(tenureMonths) / totalLeavers) : 0
bigTechCount = filteredAttrition.filter(r => r.destinationType === 'Big Tech').length
competitorCount = filteredAttrition.filter(r => r.destinationType === 'Competitor').length
```

| Label | Value | Sub | Value colour condition |
|---|---|---|---|
| Total leavers | `{totalLeavers}` | "last 12 months" | always `text-gray-700` |
| Avg tenure at exit | `{avgTenure}m` | "months in role" | always `text-amber-600` |
| Went to Big Tech | `{bigTechCount}` | `{pct}% of leavers` | `bigTechCount > 4 ? text-amber-600 : text-gray-700` |
| Went to competitors | `{competitorCount}` | `{pct}% of leavers` | `competitorCount > 3 ? text-red-600 : text-gray-700` |

Icon colour mirrors value colour. `pct = totalLeavers > 0 ? Math.round((count / totalLeavers) * 100) : 0`.

Icon for Big Tech and competitors: `<Building2 size={16} />`. Leavers: `<LogOut size={16} />`. Tenure: `<Calendar size={16} />`.

Each card: `bg-white rounded-2xl border border-gray-100 shadow-sm p-5`, value `text-2xl font-black leading-none`, label `text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2`, sub `text-[10px] text-gray-400 mt-0.5`.

### 7.5 Top destinations panel

Layout: `grid grid-cols-[1fr_320px] gap-6` — destinations list (left) + right column (chart stacked on breakdown).

**Destinations list** (`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`):

Header (`px-6 py-4 border-b border-gray-100`):
```
"Top destinations"
"Companies that received the most Acme alumni"   // text-xs text-gray-400 mt-0.5
```

Empty state (when `topDestinations.length === 0`):
`"No departures match the current filters."` — `px-6 py-10 text-center text-xs text-gray-400`

**Each destination row** — alternating `bg-white` / `bg-gray-50/50`, `flex items-center gap-4 px-6 py-4`:

- **Rank** (`w-6 text-center`): rank 1 = `text-sm font-black text-gray-800`; others = `text-gray-400`
- **Content (`flex-1 min-w-0`)**:
  - Company name (`text-sm font-bold text-gray-800 truncate`) + destination-type badge (see below)
  - Department chips: `flex flex-wrap gap-1 mb-2`, each `text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500`
  - Bar: `bg-gray-100 rounded-full h-1.5 overflow-hidden`, fill `{cfg.dot}` colour, width = `Math.round((dest.count / topDestinations[0].count) * 100)%` relative to the top destination
- **Right stats (`text-right flex-shrink-0`)**:
  - Count: `text-xl font-black text-gray-800`
  - "person" or "people": `text-[10px] text-gray-400`
  - Avg tenure: "Avg tenure: {X}m" — `text-[10px] text-gray-400`, value in `font-semibold text-gray-600`

**Destination-type badge** (`text-[10px] font-bold px-1.5 py-0.5 rounded-full border {cfg.bg} {cfg.border} {cfg.color}`):
- Contains `<span className="inline-block w-1.5 h-1.5 rounded-full mr-1 {cfg.dot}" />` + type string
- Colours from `DESTINATION_TYPE_CONFIG` — see [Section 13](#13-constants-and-configuration)

### 7.6 Monthly departures chart

`bg-white rounded-2xl border border-gray-100 shadow-sm p-5`:

```
"Monthly departures"   // text-sm font-bold text-gray-900 mb-1
"Last 12 months"       // text-xs text-gray-400 mb-4
```

`trend = getAttritionTrend(filteredAttrition)` — sorted ascending by month.

`maxTrend = Math.max(...trend.map(t => t.count), 1)` — prevents divide-by-zero.

**Bar chart** (`flex items-end gap-1.5 h-28`), one `flex-1` column per month:
- On hover: count label (`text-[9px] font-semibold text-gray-400`) fades in via `opacity-0 group-hover:opacity-100`
- Bar: `w-full rounded-t-sm`, default `bg-gray-200`, hover `bg-sky-400`
- Height: `Math.round((t.count / maxTrend) * 100)%`, minimum `Math.max(h, 4)%`
- Month label: `text-[8px] text-gray-400 rotate-45 origin-left w-4 block mt-0.5 truncate` — shows only `t.month.split(' ')[0]` (month abbreviation, e.g. "Jan")

### 7.7 By destination type breakdown

`bg-white rounded-2xl border border-gray-100 shadow-sm p-5`:
```
"By destination type"   // text-sm font-bold text-gray-900 mb-4
```

Iterates `Object.keys(DESTINATION_TYPE_CONFIG)` in fixed order: `Big Tech, Scaleup, Startup, Enterprise, Competitor, Unknown`.

Types with `count === 0` return `null` (hidden).

Per row:
- Type name: `text-xs font-semibold {cfg.color}` with `w-2 h-2 rounded-full {cfg.dot}` leading dot
- Count + pct: `text-xs font-bold text-gray-700` + `text-gray-400 font-normal` pct in parens
- Bar: `w-full bg-gray-100 rounded-full h-1.5 overflow-hidden`, fill `{cfg.dot}`, `width: {pct}%`

`pct = Math.round((count / totalLeavers) * 100)` using `filteredAttrition.length`.

### 7.8 Departure log

`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`

Header:
```
"Departure log"
"{filteredAttrition.length} records · sorted by most recent"   // text-xs text-gray-400 mt-0.5
```

Column header row (`grid grid-cols-[160px_1fr_120px_120px_110px] gap-3 px-6 py-2.5 border-b border-gray-100 bg-gray-50`):
Columns: Date | Person | Department | Destination | Tenure

Data rows — same grid template, alternating `bg-white` / `bg-gray-50/40`, `px-6 py-3 items-center`:
- **Date**: `text-xs text-gray-500` — `fmtDate(r.date)` = `new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })` (no explicit locale — uses browser default)
- **Person**: `text-xs font-semibold text-gray-800`
- **Department**: `text-xs text-gray-500`
- **Destination**: `w-1.5 h-1.5 rounded-full flex-shrink-0 {typeCfg.dot}` dot + `text-xs font-medium text-gray-700 truncate` name
- **Tenure**: `text-xs text-gray-500` — `{r.tenureMonths}m`

Note: `r.level` and `r.reason` are in the data model but are **not displayed** in the departure log.

**Pagination:**
- Default: `filteredAttrition.slice(0, 8)` shown.
- State: `showAllRecords: boolean` — initialised `false`.
- Toggle appears only when `filteredAttrition.length > 8`:
  - Collapsed: `<ChevronDown size={13} />` + `"Show all {filteredAttrition.length} departures"`
  - Expanded: `<ChevronUp size={13} />` + `"Show fewer"`
  - Style: `text-xs text-gray-400 hover:text-gray-700 transition-colors`
- **`showAllRecords` is NOT reset when `deptFilter` changes.** If the list was expanded before a filter change, the full filtered list remains expanded after.

### 7.9 Recommendations panel

`<RecommendationsPanel recs={talentFlowRecs} />` — collapsed by default.

`talentFlowRecs = useMemo(() => getTalentFlowRecommendations(), [])` — empty deps, never recomputes. Always uses full `ATTRITION_RECORDS`. See [Section 11.5](#115-gettalentflowrecommendations).

---

## 8. Footer banners

Always rendered after the Talent Flow section (no conditions):

```tsx
<UpsellBanner variant="talent-development" className="mt-4" />
<FeedbackBanner context="Industry Benchmarks" className="mt-4" />
```

**UpsellBanner** (`variant="talent-development"`):
- Provider: Careerminds | Service: Talent Development
- Trigger: "Critical skill gap detected across your team"
- Headline: "Close this skills gap with a structured upskilling programme"
- Body: "Careerminds designs role-specific learning tracks aligned to your competency framework — so your team reaches target faster."
- CTA button: "Learn about Talent Development"
- Accent: teal (`bg-teal-50 border-teal-200 text-teal-700`)
- Icon: `<BookOpen size={16} />`
- Dismiss (X button, top-right): sets `dismissed = true`, renders `null`. Not reversible in session.

**FeedbackBanner** (`context="Industry Benchmarks"`):
- Background: `linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)`
- Question: "Are you benchmarking against the right peers?"
- Sub: "Let us know what comparisons would be most useful."
- CTA: "Share feedback" → opens `<FeedbackFlow context="Industry Benchmarks" />` modal

---

## 9. Shared sub-components

### 9.1 QuartileBadge

```typescript
function QuartileBadge({ pos }: { pos: QuartilePosition })
```

`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border {cfg.bg} {cfg.border} {cfg.color}` — contains `w-1.5 h-1.5 rounded-full {cfg.dot}` dot + `{cfg.label}` text. Colours from `QUARTILE_CONFIG`.

### 9.2 DeltaChip

```typescript
function DeltaChip({ delta, unit = '', higherIsBetter = true }: {
  delta: number; unit?: string; higherIsBetter?: boolean
})
```

- **Neutral** (`Math.abs(delta) < 0.05`): `<Minus size={11} />` "At median" (`text-xs text-gray-400 flex items-center gap-1`)
- **Positive** (`higherIsBetter ? delta > 0 : delta < 0`): `<TrendingUp size={11} />` `"+{formatted}{unit} vs median"` (`text-xs font-semibold text-emerald-600`)
- **Negative**: `<TrendingDown size={11} />` `"{formatted}{unit} vs median"` (`text-xs font-semibold text-red-500`)

Value formatting: `Math.abs(delta) < 10 ? delta.toFixed(1) : Math.round(delta)`. For negative, `delta.toFixed(1)` preserves the minus sign naturally. The `+` prefix is added explicitly only for positive values.

### 9.3 DistributionBar

```typescript
function DistributionBar({ benchmark, formatValue }: {
  benchmark: DeptBenchmark;
  formatValue: (v: number) => string;
})
```

`relative h-5 flex items-center mt-1`:
- **Track**: `absolute inset-x-0 h-1.5 bg-gray-100 rounded-full`
- **IQR box** (p25–p75): `absolute h-3 bg-gray-200 rounded-sm` — `left: {pct(p25)}%`, `width: {pct(p75)-pct(p25)}%`
- **Median marker**: `absolute h-4 w-0.5 bg-gray-500 rounded-full` at `left: {pct(p50)}%`
- **Acme dot**: `absolute w-3 h-3 rounded-full border-2 border-white shadow-md z-10 -translate-x-1/2`, `background: #0ea5e9`, clamped: `Math.min(Math.max(pct(acmeValue), 2), 98)%`. Has `title="Acme: {formatValue(acmeValue)}"`.
- **Min/max labels**: `absolute -bottom-4 text-[9px] text-gray-400` at `left-0` and `right-0`

`pct(v) = ((v - min) / range) * 100`, `range = max - min || 1`.

### 9.4 DeptBenchmarkRow

```typescript
function DeptBenchmarkRow({ bench, formatValue, onNavigateToGapReport })
```

`bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4`:

- **Dept avatar**: `w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`, `background: DEPT_COLORS[bench.department]`, shows `bench.department[0]` (first character of dept name).
- **Content (`flex-1 min-w-0`)**:
  - Row 1: dept name (`text-xs font-semibold text-gray-800`) + right side: `<QuartileBadge>` + optional "View gaps →" link
  - Row 2: `{formatValue(bench.acmeValue)}` (`text-sm font-black {cfg.color}`) + `<DeltaChip delta={bench.delta} />`
  - Row 3 (`mt-2 mb-5`): `<DistributionBar>`
  - Row 4 (`text-[10px] text-gray-400 mt-5`): "Peer median: {formatValue(peerMedian)} · Range: {formatValue(min)}–{formatValue(max)}"

**"View gaps →" link** (conditionally rendered):
- Condition: `(bench.position === 'bottom' || bench.position === 'below-median') && onNavigateToGapReport`
- Style: `text-[10px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-sky-50 transition-colors border border-sky-100`
- Click: `onNavigateToGapReport(bench.department)`

### 9.5 RecommendationCard

```typescript
function RecommendationCard({ rec }: { rec: Recommendation })
```

**State:** `expanded: boolean` — default `false`.

Outer: `rounded-xl border bg-white overflow-hidden transition-shadow hover:shadow-sm {pc.border}` where `pc = PRIORITY_CONFIG[rec.priority]`.

**Clickable header** (`w-full text-left px-5 py-4 flex items-start gap-4`):
- Priority dot: `mt-0.5 w-2 h-2 rounded-full flex-shrink-0 {pc.dot}`
- Content block (`flex-1 min-w-0`):
  - Badge row: priority badge + category badge + optional dept name (`text-[10px] text-gray-400 font-medium`)
  - Title: `text-sm font-semibold text-gray-800 leading-snug`
  - Rationale: `text-xs text-gray-500 mt-1 leading-relaxed`
- Right side: timeframe (`<Clock size={10} /> {rec.timeframe}`, `text-[10px] text-gray-400 whitespace-nowrap`) + `<ChevronRight size={14} className="text-gray-300">` (rotates 90° when expanded)

**Priority badge**: `text-[10px] font-bold px-2 py-0.5 rounded-full border {pc.bg} {pc.border} {pc.color}` — labels: "Critical", "High", "Medium"

**Category badge**: `text-[10px] font-semibold px-2 py-0.5 rounded-full border {catCls}` — label from `CATEGORY_LABEL[rec.category]`, colour from `CATEGORY_COLOR[rec.category]`, fallback `text-gray-600 bg-gray-50 border-gray-200`.

**Expanded body** (`px-5 pb-4 pt-0 border-t border-gray-50`):
- "Action plan" heading: `text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-3 mb-2`
- Ordered list (`space-y-2`): each action with number badge (`w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5`) + text (`text-xs text-gray-600 leading-relaxed`)

### 9.6 RecommendationsPanel

```typescript
function RecommendationsPanel({ recs, defaultOpen = false }: {
  recs: Recommendation[];
  defaultOpen?: boolean;
})
```

**Returns `null` immediately if `recs.length === 0`.**

**State:** `open: boolean` — initialised to `defaultOpen`.

Outer: `rounded-2xl border border-gray-200 overflow-hidden`

**Header button** (`w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 transition-colors`):
- `<Lightbulb size={15} className="text-amber-400" />` + "Recommendations" (`text-sm font-bold text-gray-900`)
- Count badges:
  - `criticalCount > 0`: `"{criticalCount} critical"` (`bg-red-50 border border-red-200 text-red-700`)
  - `highCount > 0`: `"{highCount} high priority"` (`bg-amber-50 border border-amber-200 text-amber-700`)
  - Both zero: `"{recs.length} suggestions"` (`text-[10px] text-gray-400`)
  - Note: if both critical and high counts exist, both badges are shown simultaneously.
- `<ChevronDown size={15} className="text-gray-400 transition-transform">` — rotates 180° when open.

**Body** (when `open`): `px-6 pb-6 pt-2 bg-white border-t border-gray-100 space-y-3` — renders each `<RecommendationCard>` in `recs` order.

---

## 10. Data model and computations

### 10.1 Acme Corp constants

```typescript
ACME_HEADCOUNT_BY_DEPT: Record<Department, number> = {
  Engineering: 59, Product: 23, Design: 16, Data: 29,
  Marketing: 22, Sales: 28, 'People Ops': 15,
}

ACME_TOTAL_HEADCOUNT = 192  // sum of above (59+23+16+29+22+28+15)

ACME_COMP: Record<Department, number> = {
  Engineering: 128000, Product: 118000, Design: 102000, Data: 122000,
  Marketing: 88000, Sales: 95000, 'People Ops': 90000,
}

ACME_FRAMEWORK_MATURITY = 3.6   // module-level constant, not computed
ACME_PROMOTION_VELOCITY = 19    // module-level constant, not computed
```

**`ACME_SKILL_COMPETENCY`** — computed at module load via `computeAcmeSkillCompetency()`:
- Iterates `SKILLS_DATA`, accumulates `averageActual * headcount` and total headcount per department.
- Result: `parseFloat((weightedSum / totalHeadcount).toFixed(2))` per department.

**`ACME_CATEGORY_COMPETENCY`** — computed at module load via `computeAcmeCategoryCompetency()`:
- Same weighted-mean approach, keyed by `entry.category`.

**`ACME_DEPT_PCT`** — `parseFloat(((n / ACME_TOTAL_HEADCOUNT) * 100).toFixed(1))` per department.

### 10.2 Peer company dataset (PEER_COMPANIES)

8 static peers:

| id | Name | Size | Industry | Headcount | Framework maturity | Promo velocity |
|---|---|---|---|---|---|---|
| peer-1 | Verity HQ | Scaleup | B2B SaaS | 210 | 4.1 | 20 |
| peer-2 | Cortex Labs | Scaleup | DevTools | 180 | 4.4 | 18 |
| peer-3 | Solara Finance | Enterprise | Fintech | 520 | 3.8 | 26 |
| peer-4 | Meadow Platform | Scaleup | Marketplace | 165 | 3.5 | 22 |
| peer-5 | Hatch Commerce | Startup | E-commerce | 82 | 2.8 | 30 |
| peer-6 | Orbis Cloud | Enterprise | B2B SaaS | 840 | 4.7 | 16 |
| peer-7 | Ripple Analytics | Scaleup | B2B SaaS | 195 | 3.9 | 21 |
| peer-8 | Axiom Market | Startup | Marketplace | 68 | 2.6 | 32 |

Each peer has: `deptHeadcountPct` (% of total), `deptComp` (avg USD), `deptSkillCompetency` (avg 1–5), `categoryCompetency` (avg 1–5 per skill category), `frameworkMaturity`, `promotionVelocity`, `topSkillGaps`.

### 10.3 SIMILAR_PEERS

```typescript
SIMILAR_PEERS = PEER_COMPANIES.filter(
  p => p.size === 'Scaleup' || (p.size === 'Enterprise' && p.totalHeadcount < 300)
)
```

Includes: Verity HQ, Cortex Labs, Meadow Platform, Ripple Analytics (4 Scaleups). Solara Finance (Enterprise, 520) and Orbis Cloud (Enterprise, 840) are excluded.

### 10.4 Quartile computation

```typescript
function computeQuartiles(values: number[]): Quartile
```

Sorts values ascending. For percentile p: `pos = (p/100) * (n-1)`, interpolates `sorted[floor(pos)] + (sorted[ceil(pos)] - sorted[floor(pos)]) * (pos - floor(pos))`. Results stored as `parseFloat(value.toFixed(2))`. Empty array → `{ p25:0, p50:0, p75:0, min:0, max:0 }`.

### 10.5 QuartilePosition classification

**Standard (higher is better):**
```typescript
function getQuartilePosition(value, q): QuartilePosition
  value >= q.p75 → 'top'
  value >= q.p50 → 'above-median'
  value >= q.p25 → 'below-median'
  else           → 'bottom'
```
Thresholds are inclusive (`>=`).

**Inverted for promotion velocity** (lower is better — in `getOrgBenchmarks`):
```typescript
function invertedVelocity(v, q): QuartilePosition
  v <= q.p25 → 'top'
  v <= q.p50 → 'above-median'
  v <= q.p75 → 'below-median'
  else       → 'bottom'
```

**Inverted for attrition rate** (in `computeAttritionScore`):
Uses `getQuartilePosition` then applies `INVERT` map: `top↔bottom`, `above-median↔below-median`.

### 10.6 QUARTILE_CONFIG

| Position | label | color | bg | border | dot |
|---|---|---|---|---|---|
| `top` | Top quartile | text-emerald-700 | bg-emerald-50 | border-emerald-200 | bg-emerald-500 |
| `above-median` | Above median | text-sky-700 | bg-sky-50 | border-sky-200 | bg-sky-500 |
| `below-median` | Below median | text-amber-700 | bg-amber-50 | border-amber-200 | bg-amber-400 |
| `bottom` | Bottom quartile | text-red-700 | bg-red-50 | border-red-200 | bg-red-500 |

Also has `short` (`Top/Above/Below/Bottom`) and `rank` (`1st/2nd/3rd/4th`) fields — rank is used in the overall position icon box.

### 10.7 getDeptSkillBenchmarks

For each of 7 departments in order (Engineering, Product, Design, Data, Marketing, Sales, People Ops):
- `peerValues = peers.map(p => p.deptSkillCompetency[dept])`
- `acmeValue = ACME_SKILL_COMPETENCY[dept]`
- `quartiles = computeQuartiles(peerValues)`
- `position = getQuartilePosition(acmeValue, quartiles)`
- `peerMedian = quartiles.p50`
- `delta = parseFloat((acmeValue - peerMedian).toFixed(2))`

### 10.8 getDeptCompBenchmarks

Same structure:
- `peerValues = peers.map(p => p.deptComp[dept])`
- `acmeValue = ACME_COMP[dept]`
- `delta = acmeValue - peerMedian` (no rounding applied — raw number)

### 10.9 getDeptSizeBenchmarks

Same structure:
- `peerValues = peers.map(p => p.deptHeadcountPct[dept])`
- `acmeValue = ACME_DEPT_PCT[dept]`
- `delta = parseFloat((acmeValue - peerMedian).toFixed(1))`

### 10.10 getCategoryBenchmarks

```typescript
function getCategoryBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): CategoryBenchmark[]
```

- Categories: union of all keys from `PEER_COMPANIES[*].categoryCompetency` — uses the `PEER_COMPANIES` constant, not the passed `peers` arg.
- `peerValues = peers.map(p => p.categoryCompetency[cat] ?? 0).filter(v => v > 0)` — zeroes excluded.
- `acmeValue = ACME_CATEGORY_COMPETENCY[cat] ?? 0`
- `delta = parseFloat((acmeValue - quartiles.p50).toFixed(2))`
- **Returns sorted ascending by delta** — worst gaps (most negative) first, best strengths last.

### 10.11 getOrgBenchmarks

Returns 2 `OrgBenchmark` entries:

**Framework maturity:**
- `acmeValue = ACME_FRAMEWORK_MATURITY = 3.6`
- `peerValues = peers.map(p => p.frameworkMaturity)`
- `position = getQuartilePosition(3.6, mQ)` (standard, higher is better)
- `delta = parseFloat((3.6 - mQ.p50).toFixed(2))`
- `unit = '/ 5'`, `higherIsBetter = true`

**Promotion velocity:**
- `acmeValue = ACME_PROMOTION_VELOCITY = 19`
- `peerValues = peers.map(p => p.promotionVelocity)`
- `position = invertedVelocity(19, vQ)` (inverted, lower is better)
- `delta = parseFloat((19 - vQ.p50).toFixed(1))`
- `unit = 'months avg'`, `higherIsBetter = false`

### 10.12 getOverallBenchmarkSummary

**`avgScore`:** position-scores all values (`top=4, above-median=3, below-median=2, bottom=1`) across:
- 7 skill benchmark positions
- 2 org benchmark positions
- First 8 category benchmark positions (from the ascending-sorted array = the 8 worst-gap categories)

Total of 17 positions averaged.

**`overallPosition`:**
- `>= 3.5` → `'top'`
- `>= 2.5` → `'above-median'`
- `>= 1.5` → `'below-median'`
- else → `'bottom'`

**`topDepts`:** `skillBenchmarks.filter(b => b.position === 'top' || b.position === 'above-median')` — no slice applied before `slice(0, 3)` in the component.

**`gapDepts`:** `skillBenchmarks.filter(b => b.position === 'bottom' || b.position === 'below-median')` — no slice applied before `slice(0, 3)` in the component.

**`topCategories`:** `getCategoryBenchmarks(peers).filter(b => b.delta > 0).slice(-3).reverse()` — last 3 positive-delta entries from the ascending-sorted list, reversed so best first.

**`gapCategories`:** `getCategoryBenchmarks(peers).filter(b => b.delta < 0).slice(0, 3)` — first 3 negative-delta entries (worst gaps).

**`acmeRank` and `totalCompanies`:** Computed but **never displayed** in the UI. `acmeRank` is Acme's position when scored against all peers using a skill-only scoring method.

**Return object:** `{ overallPosition, avgScore, acmeRank, totalCompanies, topDepts, gapDepts, topCategories, gapCategories, skillBenchmarks, compBenchmarks, sizeBenchmarks, orgBenchmarks, categoryBenchmarks }`

Important: The component's own `useMemo` calls for `skillBenchmarks`, `compBenchmarks`, `sizeBenchmarks`, `orgBenchmarks` are independent from the summary return object. The summary's copies of these arrays are not used by the component.

### 10.13 ATTRITION_RECORDS

30 static records. Interface:
```typescript
interface AttritionRecord {
  date: string;            // ISO e.g. "2026-04-15"
  name: string;
  department: Department;
  level: string;           // e.g. "IC3" — present in data but NOT displayed in UI
  destination: string;
  destinationType: 'Big Tech' | 'Scaleup' | 'Startup' | 'Enterprise' | 'Competitor' | 'Unknown';
  reason: AttritionReason; // 'compensation' | 'career-growth' | 'culture' | 'location' | 'unknown'
                           // reason is NOT displayed in departure log rows
  tenureMonths: number;
}
```

Date range: 2025-03-21 to 2026-04-15.
Department distribution: Engineering (10), Product (4), Data (4), Sales (3), Design (3), Marketing (3), People Ops (2).

### 10.14 getTopDestinations

```typescript
function getTopDestinations(records, limit = 10): DestinationSummary[]
```

- Groups by `destination` string.
- Per destination: `count`, `type` (first record's type), `departments` (unique set), `mostRecentDate`, `avgTenureMonths` (rounded mean), `primaryReason` (mode of reasons, tie-broken by `Object.entries` order).
- Sorted descending by `count`. Sliced to `limit`.

### 10.15 getAttritionTrend

```typescript
function getAttritionTrend(records): AttritionTrend[]
```

- Groups by `toLocaleString('default', { month: 'short', year: 'numeric' })` — runtime locale dependent.
- Returns `[{ month: string, count: number }]` sorted ascending by `new Date(month).getTime()`.

### 10.16 computeAttritionScore

```typescript
function computeAttritionScore(
  records = ATTRITION_RECORDS,
  totalHeadcount = ACME_TOTAL_HEADCOUNT,
): AttritionScore
```

**`annualisedRate`:** `parseFloat(((total / totalHeadcount) * 100).toFixed(1))`

**`position`:** inverted — `INVERT[getQuartilePosition(annualisedRate, rateQuartiles)]`. Peer rates for quartiles: `[8, 10, 11, 12, 13, 14, 15, 17]`.

**Sub-metrics:**
```typescript
competitorPct  = Math.round((competitorCount  / total) * 100)
compDrivenPct  = Math.round((compDrivenCount  / total) * 100)
careerDrivenPct = Math.round((careerDrivenCount / total) * 100)
avgTenureMonths = Math.round(sum(tenureMonths) / total)
```

**Composite risk score (0–100, higher = worse):**
```
rateScore       = Math.min((annualisedRate / 25) * 50, 50)          // 0–50
competitorScore = Math.min((competitorPct / 40) * 20, 20)           // 0–20
compScore       = Math.min((compDrivenPct / 60) * 15, 15)           // 0–15
tenureScore     = avgTenureMonths < 18 ? 15 : avgTenureMonths < 24 ? 8 : 0   // 0–15
score           = Math.round(sum of above)
```

**`riskLabel`:** `>= 70 → 'High'`, `>= 45 → 'Elevated'`, `>= 25 → 'Moderate'`, else `'Low'`

**Risk colours (thresholds at 70/45/25):**
- High: `text-red-700 / bg-red-50 / border-red-200`
- Elevated: `text-amber-700 / bg-amber-50 / border-amber-200`
- Moderate: `text-sky-700 / bg-sky-50 / border-sky-200`
- Low: `text-emerald-700 / bg-emerald-50 / border-emerald-200`

**`headline`:**
- `>= 70`: "Attrition is a critical risk — {rate}% rate with {competitorPct}% going to competitors"
- `>= 45`: "Elevated attrition ({rate}%) — compensation and career growth are primary drivers"
- `>= 25`: "Moderate attrition risk ({rate}%) — early-tenure exits merit attention"
- else: "Healthy attrition levels at {rate}% — below peer median"

---

## 11. Recommendation generators

All generators return `Recommendation[]` sorted by `PRIORITY_ORDER = { critical: 0, high: 1, medium: 2 }`.

### 11.1 getOverviewRecommendations

**Input:** `peers: PeerCompany[]`

1. **Framework maturity** — if `maturity.position === 'bottom' || 'below-median'`:
   - Priority: `bottom → 'critical'`, `below-median → 'high'`
   - Category: `'process'`
   - Timeframe: "60–90 days"
   - 4 actions: audit level definitions, add measurable criteria, publish + calibrate, annual review

2. **Promotion velocity** — if `velocity.position === 'bottom'` only (not `below-median`):
   - Priority: `'high'`
   - Category: `'retention'`
   - Timeframe: "Next review cycle"
   - 4 actions: identify 18m+ at-level, quarterly calibration, visible next-level criteria, track rates

3. **Category skill gaps** — for each of `getCategoryBenchmarks(peers).slice(0, 3)` where `gap.delta < -0.3`:
   - Priority: `gap.position === 'bottom' ? 'high' : 'medium'`
   - Category: `'upskilling'`
   - Timeframe: "60 days to launch, 6 months to close"
   - 4 actions: identify employees via heatmap, source learning path, assign sponsor, re-assess

### 11.2 getSkillsRecommendations

**Input:** `peers: PeerCompany[]`

1. **Gap departments** (`position === 'bottom' || 'below-median'`):
   - Priority: `bottom → 'critical'`, `below-median → 'high'`
   - Category: `'upskilling'`, has `department` field
   - Title: `"Upskill {dept} ({acmeValue.toFixed(1)} vs {peerMedian.toFixed(1)} median)"`
   - Timeframe: "30 days to plan, 6 months to target"
   - 5 actions

2. **Top-quartile departments** (`position === 'top'`):
   - Priority: `'medium'`
   - Category: `'upskilling'`, has `department` field
   - Title: `"Leverage {dept} as an internal centre of excellence"`
   - Timeframe: "60 days"
   - 3 actions

### 11.3 getCompRecommendations

**Input:** `peers: PeerCompany[]`. Also reads `ATTRITION_RECORDS` directly.

`compAttritionRate = Math.round((compLeavers / totalLeavers) * 100)` from full `ATTRITION_RECORDS`.

1. **Gap departments** (`position === 'bottom' || 'below-median'`):
   - Priority: `bottom → 'critical'`, `below-median → 'high'`
   - Category: `'compensation'`, has `department` field
   - Title includes `fmtK(gapK * 1000)` gap amount
   - Rationale mentions attrition rate if `compAttritionRate > 25`
   - Timeframe: `bottom → '1–2 comp cycles'`, `below-median → 'Next annual review'`
   - 4 actions

2. **Comp-driven attrition** — if `compAttritionRate > 30`:
   - Priority: `'critical'`
   - Category: `'retention'`
   - Timeframe: "30 days"
   - 4 actions

3. **Above-market departments** — if any `position === 'top' || 'above-median'`:
   - Priority: `'medium'`
   - Category: `'hiring'`
   - Timeframe: "30 days"
   - 3 actions (use as recruiting advantage)

### 11.4 getCompositionRecommendations

**Input:** `peers: PeerCompany[]`

1. **Understaffed** — `delta < -3` AND `(position === 'bottom' || 'below-median')`:
   - Priority: `bottom → 'high'`, `below-median → 'medium'`
   - Category: `'hiring'`, has `department` field
   - Timeframe: "Next headcount planning cycle"
   - 4 actions

2. **Overstaffed** — `delta > 3` AND `(position === 'top' || 'above-median')`:
   - Priority: `'medium'`
   - Category: `'org-design'`, has `department` field
   - Timeframe: "Next planning cycle"
   - 3 actions

### 11.5 getTalentFlowRecommendations

**No input.** Always reads `ATTRITION_RECORDS` directly.

```typescript
competitorPct = Math.round((competitorCount / total) * 100)
bigTechPct    = Math.round((bigTechCount    / total) * 100)
startupPct    = Math.round((startupCount    / total) * 100)
avgTenure     = Math.round(sum(tenureMonths) / total)
```

1. **Competitor attrition** — if `competitorPct >= 20`:
   - Priority: `'critical'`, category: `'retention'`
   - Timeframe: "30–60 days"
   - 5 actions (includes competitor-target-dept list from `topDests.filter(d => d.type === 'Competitor')`)

2. **Big Tech pull** — if `bigTechPct >= 20`:
   - Priority: `'high'`, category: `'retention'`
   - Timeframe: "Next comp review cycle"
   - 4 actions

3. **Startup pull** — if `startupPct >= 20`:
   - Priority: `'high'`, category: `'retention'`
   - Timeframe: "60–90 days"
   - 4 actions

4. **Early-tenure attrition** — if `avgTenure < 18`:
   - Priority: `'high'`, category: `'retention'`
   - Timeframe: "30–60 days"
   - 4 actions

---

## 12. Export content

`buildContent` function passed to `<ExportButtons title="Industry Benchmarks">`:

```
INDUSTRY BENCHMARKS — ACME CORP
Generated: {new Date().toLocaleDateString()}
==================================================

Overall position: {overallCfg.label}
Compared against: {peers.length} peers

STRENGTHS
  {department}: {QUARTILE_CONFIG[b.position].label}
  ... (all summary.topDepts — no slice)

AREAS TO IMPROVE
  {department}: {QUARTILE_CONFIG[b.position].label}
  ... (all summary.gapDepts — no slice)
```

- `overallCfg = QUARTILE_CONFIG[summary.overallPosition]`
- `summary` and `peers` are reactive to the current peer filter state.
- The export does **not** include: per-department benchmarks, attrition data, recommendations, org-level cards, or category analysis.
- `ExportButtons` converts this text to styled print HTML via `buildPrintHtml()`, opens a new browser tab, and triggers `window.print()`.

---

## 13. Constants and configuration

### DESTINATION_TYPE_CONFIG

| Type | color | bg | border | dot |
|---|---|---|---|---|
| Big Tech | text-sky-700 | bg-sky-50 | border-sky-200 | bg-sky-500 |
| Scaleup | text-emerald-700 | bg-emerald-50 | border-emerald-200 | bg-emerald-500 |
| Startup | text-amber-700 | bg-amber-50 | border-amber-200 | bg-amber-400 |
| Enterprise | text-gray-700 | bg-gray-100 | border-gray-200 | bg-gray-500 |
| Competitor | text-red-700 | bg-red-50 | border-red-200 | bg-red-500 |
| Unknown | text-gray-400 | bg-gray-50 | border-gray-200 | bg-gray-300 |

### PRIORITY_CONFIG

| Priority | label | color | bg | border | dot |
|---|---|---|---|---|---|
| critical | Critical | text-red-700 | bg-red-50 | border-red-200 | bg-red-500 |
| high | High | text-amber-700 | bg-amber-50 | border-amber-200 | bg-amber-400 |
| medium | Medium | text-sky-700 | bg-sky-50 | border-sky-200 | bg-sky-500 |

### CATEGORY_COLOR

| Category | Classes |
|---|---|
| upskilling | text-emerald-700 bg-emerald-50 border-emerald-200 |
| retention | text-red-700 bg-red-50 border-red-200 |
| compensation | text-amber-700 bg-amber-50 border-amber-200 |
| hiring | text-sky-700 bg-sky-50 border-sky-200 |
| org-design | text-gray-700 bg-gray-100 border-gray-200 |
| process | text-gray-700 bg-gray-100 border-gray-200 |

Fallback (unknown category): `text-gray-600 bg-gray-50 border-gray-200`

### CATEGORY_LABEL

| Key | Label |
|---|---|
| upskilling | Upskilling |
| retention | Retention |
| compensation | Compensation |
| hiring | Hiring |
| org-design | Org Design |
| process | Process |

### PEER_ATTRITION_RATES

`[8, 10, 11, 12, 13, 14, 15, 17]` — used in `computeAttritionScore` to compute quartiles for the annualised rate position comparison.

### fmtK

Defined separately in `IndustryBenchmark.tsx` and `benchmarkRecommendations.ts`:
```typescript
// IndustryBenchmark.tsx
fmtK(n) = n >= 1000 ? "$" + (n/1000).toFixed(0) + "K" : "$" + n

// benchmarkRecommendations.ts
fmtK(n) = n >= 1000 ? "$" + Math.round(n/1000) + "K" : "$" + n
```
Both produce identical output for whole-thousand values.

### Tour data attributes

| Attribute | Element |
|---|---|
| `data-tour="benchmark-peer-filter"` | Peer filter button group in header |
| `data-tour="benchmark-overview-card"` | Overview `<section>` element |
| `data-tour="benchmark-dist-grid"` | 2-column org benchmark card grid |
| `data-tour="benchmark-tabs"` | Metric toggle container in By Department section |
