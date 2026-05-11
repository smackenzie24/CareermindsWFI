# Executive Summary — Component Specification

**Page:** `home` view (`ExecutiveSummary.tsx`)  
**Data layer:** `computeExecSummary()` in `src/data/execSummaryData.ts`  
**Last updated:** May 2026

---

## Overview

The Executive Summary is the default landing page. It is a CPO-level read-only digest that aggregates signals from all five intelligence modules (Skills, Pipeline, Managers, Benchmark, Attrition) into a single scrollable dashboard. Every element is clickable and navigates to a deeper view for investigation.

The page owns no local state beyond UI toggles. All data is derived from `computeExecSummary()`, which is a pure function re-run on every manual refresh.

---

## Page Layout (top to bottom)

```
┌─────────────────────────────────────────┐
│ 1. Page Header                          │
│    └─ Data Freshness Bar                │
├─────────────────────────────────────────┤
│ 2. KPI Metric Strip (primary 4)         │
│    └─ [expand toggle]                   │
│    └─ KPI Metric Strip (secondary 3)    │
├─────────────────────────────────────────┤
│ 3. Highlights Panel                     │
├─────────────────────────────────────────┤
│ 4. Priority Risks Panel                 │
│    └─ Risk Cards (up to 5)             │
│    └─ AI Prompt Bar                     │
├─────────────────────────────────────────┤
│ 5. Check-in Coverage Panel              │
├─────────────────────────────────────────┤
│ 6. Department Health Table              │
├─────────────────────────────────────────┤
│ 7. Feedback Banner                      │
└─────────────────────────────────────────┘
```

---

## 1. Page Header

**Component:** Inline in `ExecutiveSummary`  
**Purpose:** Identifies the view, shows org context, and provides export access.

### Elements

| Element | Content | Behaviour |
|---|---|---|
| Eyebrow label | "Chief People Officer · Executive View" | Static |
| Page title | "Workforce Health Dashboard" | Static |
| Subtitle | "Organisation-wide signal digest · Click any insight to investigate further" | Static |
| Org pill | Displays company name + live headcount (`summary.totalHeadcount`) | Read-only |
| Export buttons | `ExportButtons` component | See Export section |

### Export

Clicking export builds a plain-text report containing: key metrics, highlights, priority risks, and department health. No navigation triggered. Two formats are available (copy to clipboard and download as `.txt`).

---

### 1a. Data Freshness Bar

Sits below the header content, full width.

| Element | Content | Behaviour |
|---|---|---|
| "Last updated" | Timestamp of last `computeExecSummary()` call | Updates on manual refresh |
| "Next auto-refresh" | Computed as next occurrence of 23:59 on today's date | Display only — auto-refresh is not wired; this is a UI affordance |
| "Refresh now" button | Triggers `handleRefresh()` | Re-runs `computeExecSummary()`, shows spinner for 600ms, updates timestamp |

**Refresh behaviour:** `refreshKey` state increments → `useMemo` dependency re-runs `computeExecSummary()` → all downstream components re-render with new data.

---

## 2. KPI Metric Strip

**Component:** `KpiCard` (rendered via `buildKpiCards()`)  
**Tour anchor:** `data-tour="home-kpi-strip"`  
**Purpose:** Eight at-a-glance metrics. Primary four are always visible; secondary three are hidden behind an expand toggle.

Every card is a `<button>` that navigates to a target view on click. Cards do not open modals or panels.

### Primary cards (always visible — 4-column grid)

#### 2.1 Org Health

| Property | Value |
|---|---|
| Icon | Shield |
| Value | `summary.orgHealthScore` (0–100) |
| Suffix | `/100` |
| Label | "Org Health" |
| Navigates to | `heatmap` view |

**Colour thresholds (value text):**

| Score | Colour |
|---|---|
| ≥ 75 | Emerald |
| ≥ 55 | Amber |
| ≥ 35 | Orange |
| < 35 | Red |

**Compute:** `computeOrgHealth()` — starts at 100 and deducts penalties based on four normalised rates:

1. **Skill gap rate** (`criticalSkillGaps / totalDistinctSkills`) → up to −25 pts. A "critical" skill is one where ≥70% of people org-wide are below their target rating.
2. **Stalled rate** (`totalStalled / totalHeadcount`) → up to −20 pts. A person is "stalled" if tenure > 24 months AND promotion readiness < 50%.
3. **Manager rate** (`managersNeedingSupport / totalManagers`) → up to −20 pts. A manager "needs support" if their composite effectiveness score < 40.
4. **Benchmark position** → fixed penalty: top quartile = 0, above-median = −5, below-median = −12, bottom quartile = −20.
5. **Attrition risk** (`attritionRiskScore / 100 × 15`) → up to −15 pts.

Floor is 10. Ceiling is 100.

---

#### 2.2 Below Expected Level

| Property | Value |
|---|---|
| Icon | AlertTriangle |
| Value | `summary.peopleWithSkillGaps` |
| Note | "people" |
| Label | "Below Expected Level" |
| Navigates to | `heatmap` view |

**Colour thresholds:**

| Count | Colour |
|---|---|
| 0 | Emerald |
| ≤ 10 | Amber |
| > 10 | Red |

**Compute:** Count of people whose overall promotion readiness is < 100% (i.e., at least one skill criterion not fully met).

---

#### 2.3 Promotable Now

| Property | Value |
|---|---|
| Icon | TrendingUp |
| Value | `summary.totalNearReady` |
| Note | "ready" |
| Label | "Promotable Now" |
| Navigates to | `pipeline` view |

**Colour thresholds:**

| Count | Colour |
|---|---|
| ≥ 5 | Emerald |
| ≥ 2 | Amber |
| < 2 | Orange |

**Compute:** Count of people with promotion readiness ≥ 90%.

---

#### 2.4 Stalled 24M+

| Property | Value |
|---|---|
| Icon | CheckCircle2 |
| Value | `summary.totalStalled` |
| Note | "stalled" |
| Label | "Stalled 24M+" |
| Navigates to | `pipeline` view |

**Colour:** Always gray (neutral display — the risk escalation lives in the Risk Cards section).

**Compute:** Count of people with tenure > 24 months AND readiness < 50%.

---

### Secondary cards (revealed on expand — 3-column grid)

#### 2.5 Managers (Needing Support)

| Property | Value |
|---|---|
| Icon | Users |
| Value | `summary.managersNeedingSupport` |
| Note | "flagged" |
| Label | "Managers" |
| Navigates to | `managers` view |

**Colour thresholds:**

| Count | Colour |
|---|---|
| 0 | Emerald |
| 1 | Amber |
| > 1 | Orange |

**Compute:** Count of managers with `reports.length > 0` whose composite score < 40. Score formula: `avgReadiness × 0.4 + avgFrameworkCompletion × 0.3 + (100 − stallRate%) × 0.3`.

---

#### 2.6 Industry Rank

| Property | Value |
|---|---|
| Icon | Globe |
| Value | `ordinal(summary.benchmarkRank)` (e.g. "2nd") |
| Note | `of ${summary.benchmarkTotal}` |
| Label | "Industry Rank" |
| Navigates to | `benchmark` view |

**Colour thresholds:**

| Rank | Colour |
|---|---|
| 1st | Emerald |
| ≤ top half | Amber |
| > top half | Red |

**Compute:** Acme's rank among `SIMILAR_PEERS` (similar-sized companies) on overall skill benchmark score. Lower rank number = better position. Ordinal suffix added via `ordinal()` helper.

---

#### 2.7 Attrition Risk

| Property | Value |
|---|---|
| Icon | LogOut |
| Value | `summary.attritionScore.score` (0–100) |
| Suffix | `/100` |
| Note | `summary.attritionScore.riskLabel` (Low / Moderate / Elevated / High) |
| Label | "Attrition Risk" |
| Navigates to | `benchmark` view |

**Colour thresholds (value and note):**

| Score | Colour |
|---|---|
| ≥ 70 | Red |
| ≥ 45 | Amber |
| ≥ 25 | Sky blue |
| < 25 | Emerald |

**Compute:** `computeAttritionScore()` in `benchmarkData.ts`. Composite of annualised attrition rate (0–50 pts), competitor-bound departures (0–20 pts), comp-driven departures (0–15 pts), and average tenure band (0–15 pts). Risk label thresholds: ≥70 = High, ≥45 = Elevated, ≥25 = Moderate, < 25 = Low.

---

#### 2.8 No Check-In

| Property | Value |
|---|---|
| Icon | CalendarX |
| Value | `overdueCheckIns + criticalCheckIns` (total flagged) |
| Suffix | `/ totalHeadcount` (if any flagged) |
| Note | "all current" (if none flagged) |
| Label | "No Check-In" |
| Navigates to | `pipeline` view |

**Colour thresholds:**

| State | Colour |
|---|---|
| 0 flagged | Emerald |
| Any critical (90d+) | Red |
| Only overdue (30–90d) | Amber |

**Compute:** People are flagged if `daysSinceCheckIn > 30`. Severity: overdue = 30–90 days, critical = 90+ days. Reference date is `2026-04-29`.

---

### Expand toggle

A centered text button below the card grids. Toggles `kpiExpanded` state.

- Collapsed label: "Show managers, rank, attrition & check-ins"
- Expanded label: "Hide managers, rank, attrition & check-ins"

---

## 3. Highlights Panel

**Tour anchor:** `data-tour="home-highlights"`  
**Purpose:** Positive signals surfaced for upward communication. Always visible, never actionable (no navigation).

Shows up to 3 wins. Each win is a green card with:
- Title (bold, emerald)
- Detail sentence
- Source badge (icon + label indicating which module detected the win)

### Win detection logic (in order of priority)

| Win | Trigger | Source badge |
|---|---|---|
| "N employees ready for promotion" | `totalNearReady > 0` | Promotion Pipeline |
| "X dept(s) skill in top quartile vs industry" | Any department in top benchmark quartile | Industry Benchmark |
| "[Manager name] is the highest-rated manager" | Always — top-scoring manager by composite score | Manager Effectiveness |

If no near-ready employees exist, the first win is omitted. The manager win always appears if any manager has at least one direct report.

---

## 4. Priority Risks Panel

**Tour anchor:** `data-tour="home-risks"`  
**Purpose:** The primary action surface. Lists up to 5 active risks sorted by severity (critical first, then warning).

Header shows: "Priority risks requiring attention" + a count badge ("N active signals").

If `risks.length === 0`: shows a full-width green empty state ("No critical risks detected").

---

### 4a. Risk Card

**Component:** `RiskCard`  
**Purpose:** One card per detected risk. Renders differently based on `risk.level` (`critical` = red, `warning` = amber).

Each card contains:

| Element | Content |
|---|---|
| Severity icon | AlertTriangle (red = critical, amber = warning) |
| Title | Short description of the risk |
| Metric badge | Key number/stat (top-right of title row) |
| Detail | One-sentence explanation with named actors |
| Source badge | Which module the signal came from |
| Primary CTA button | Navigates directly to the relevant deep-dive view |
| Secondary CTA button | Optional second navigation target (shown when relevant) |

#### Risk types, triggers, levels, and navigation

**Critical Skills**

| Property | Value |
|---|---|
| ID | `critical-skills` |
| Trigger | Any skill where ≥ 70% of people org-wide are below their target rating |
| Level | Always `critical` |
| Primary CTA | Gap Report, pre-filtered to the worst department |
| Secondary CTA | Skills Heatmap (full org view) |
| Source | Skills Heatmap |

---

**Stalled Employees**

| Property | Value |
|---|---|
| ID | `stalled-reports` |
| Trigger | `totalStalled > 0` AND at least one manager has stalled reports |
| Level | `critical` if stalled ≥ 5% of headcount; otherwise `warning` |
| Metric | Count + criteria (e.g. "3 stalled (24m+ · <50% ready)") |
| Primary CTA | Manager Effectiveness, deep-linked to the manager with the most stalled reports |
| Secondary CTA | Promotion Pipeline (full view) |
| Source | Promotion Pipeline |

---

**Managers Needing Support**

| Property | Value |
|---|---|
| ID | `manager-support` |
| Trigger | `managersNeedingSupport.length > 0` |
| Level | Always `warning` |
| Primary CTA | Manager Effectiveness (no specific manager pre-selected) |
| Source | Manager Effectiveness |

---

**Benchmark Gap**

| Property | Value |
|---|---|
| ID | `benchmark-gap` |
| Trigger | Any department in the bottom benchmark quartile for skill competency |
| Level | Always `warning` |
| Metric | Acme avg vs peer median (e.g. "3.1 vs 3.8 peer median") |
| Primary CTA | Industry Benchmark view |
| Secondary CTA | Gap Report, pre-filtered to the worst department |
| Source | Industry Benchmark |

---

**Compensation Risk**

| Property | Value |
|---|---|
| ID | `comp-risk` |
| Trigger | Any department with comp in bottom or below-median vs peers |
| Level | Always `warning` |
| Metric | $ gap below peer median (rounded to nearest $K) |
| Primary CTA | Industry Benchmark (compensation tab) |
| Source | Industry Benchmark |

---

**Flight Risk**

| Property | Value |
|---|---|
| ID | `flight-risk` |
| Trigger | Any people flagged with "high" flight risk score (from Revelio Labs data) |
| Level | `critical` if flight-risk people ≥ 6% of headcount; otherwise `warning` |
| Metric | Count of high-risk people + count with an internal opportunity match |
| Detail | Names the highest-risk individual and their top risk driver |
| Primary CTA | Pipeline view, Flight Risk tab |
| Secondary CTA | Pipeline view, Hidden Talent tab (only shown if ≥ 1 person has an internal opportunity match) |
| Source | Promotion Pipeline |

---

**Attrition Risk**

| Property | Value |
|---|---|
| ID | `attrition-risk` |
| Trigger | `attritionScore.score >= 45` |
| Level | `critical` if score ≥ 70; otherwise `warning` |
| Metric | `% to competitors · % comp-driven` |
| Primary CTA | Industry Benchmark (talent flow section) |
| Source | Industry Benchmark |

---

#### Risk sort order

Risks are sorted: all `critical` cards first, then all `warning` cards. Within each level, order follows detection order (skills → stalled → managers → benchmark → comp → flight risk → attrition). Maximum 5 risks are shown.

---

### 4b. AI Prompt Bar

**Component:** `AIPromptBar`  
**Positioned:** Directly below the last risk card.  
**Purpose:** Zero-friction entry to the AI assistant contextualised to the risks visible above.

| Element | Behaviour |
|---|---|
| Free-text input | `Enter` key or "Ask" button submits. Navigates to `ask-ai` view with the question pre-loaded. |
| Suggestion chips | Four hardcoded prompts. Clicking one submits immediately (no typing required). Navigates to `ask-ai`. |
| "Ask" button | Disabled when input is empty. |

Suggestions shown: "Who is at risk of leaving?", "Where are our biggest skills gaps?", "Which teams need restructuring?", "Build a retention plan for churn risks".

On submit: calls `onAskAI(question)` → parent (`App.tsx`) switches view to `ask-ai` and seeds the conversation with the question.

---

## 5. Check-in Coverage Panel

**Tour anchor:** `data-tour="home-checkins"`  
**Purpose:** Shows what proportion of the workforce has had a recent manager check-in, and surfaces individuals who are overdue.

This panel is read-only. There is no navigation triggered from within it.

### Header

| Element | Content |
|---|---|
| Title icon | CalendarX — red if any critical, amber if any overdue, emerald if all current |
| Title | "Check-in coverage" |
| Subtitle | `{checkInCoverage}% of employees have checked in within the last 30 days` |
| Status pills | Red pill: "N critical (90d+)" — amber pill: "N overdue (30–90d)" — or green pill: "All up to date" |

### Coverage bar

A segmented horizontal progress bar showing three zones:
- **Emerald** — proportion checked in within 30 days
- **Amber** — proportion overdue (30–90 days)
- **Red** — proportion critical (90+ days)

Widths computed as a percentage of `totalHeadcount`. A legend sits below the bar.

### Flagged people list

If `flaggedCheckIns.length > 0`: renders a 2-column grid of `CheckInRow` components, sorted by `daysSinceCheckIn` descending (most overdue first).

Each row shows: name, department + team, days since last check-in, severity label ("Critical" or "Overdue").

If `flaggedCheckIns.length === 0`: shows a centred green empty state.

### Compute

Reference date: `2026-04-29` (hardcoded; to be replaced with live `now()` in production).

| State | Condition |
|---|---|
| Current | `daysSinceCheckIn ≤ 30` |
| Overdue | `30 < daysSinceCheckIn < 90` |
| Critical | `daysSinceCheckIn ≥ 90` |

`checkInCoverage` = `(totalPeople − flaggedCount) / totalPeople × 100`, rounded to nearest integer.

---

## 6. Department Health Table

**Tour anchor:** `data-tour="home-dept-table"`  
**Purpose:** One-line summary of each department's health across four dimensions. Every row is clickable.

### Legend (header row)

Three colour-coded legend items: Strong (≥70), Moderate (50–69), At Risk (<50).

### Department Row

**Component:** `DeptRow`  
**Clicking any row navigates to:** `heatmap` view, pre-filtered to that department.

Each row contains:

| Column | Content |
|---|---|
| Colour bar | Department brand colour (left edge, 8px wide) |
| Department name | Text |
| Score label | "Strong" / "Moderate" / "At Risk" / "Critical" — coloured to match |
| Score bar | Horizontal bar, width = `overallScore / 100`. Emerald ≥70, amber 50–69, red <50 |
| Score number | `overallScore` (0–100) |
| Skill avg | `skillCompetency` (1–5 scale) |
| Near ready | `nearReadyCount` — emerald if > 0, gray if 0 |
| Stalled | `stalledCount` — red if > 0, gray if 0 |
| vs industry | Quartile badge (Top / Above Median / Below Median / Bottom Quartile) with colour-coded dot |

### Department score compute

The `overallScore` for each department is a weighted blend:

| Input | Weight | Basis |
|---|---|---|
| Skill competency score | 30% | `(avgActual / 5) × 100` — average skill rating across all skill entries for the dept, normalised to 0–100 |
| Avg readiness | 30% | Average promotion readiness % across all people in the dept |
| Benchmark score | 25% | Mapped from quartile position: top = 90, above-median = 70, below-median = 45, bottom = 20 |
| Stall penalty | 15% | `max(0, 100 − (stalledCount / deptHeadcount × 100) × 3)` |

Result is clamped to 5–100.

Departments shown (fixed order): Engineering, Product, Design, Data, Marketing, Sales, People Ops.

---

## 7. Feedback Banner

**Component:** `FeedbackBanner`  
**Context prop:** "Executive Summary"  
**Purpose:** Collects qualitative feedback from the user about this page. Rendered at the bottom of the page. Behaviour is defined in the `FeedbackBanner` / `FeedbackFlow` components.

---

## Data dependencies

All data for this page flows from a single call to `computeExecSummary()` which internally calls:

| Function | Source file | Provides |
|---|---|---|
| `getAllReadiness()` | `promotionData.ts` | Per-person readiness %, stall flags, flight risk |
| `getAllManagerMetrics()` | `managerData.ts` | Manager composite scores, stall counts, report counts |
| `getOverallBenchmarkSummary()` | `benchmarkData.ts` | Overall quartile position, rank |
| `getDeptSkillBenchmarks()` | `benchmarkData.ts` | Per-dept skill quartile vs peers |
| `getDeptCompBenchmarks()` | `benchmarkData.ts` | Per-dept comp quartile vs peers |
| `getCategoryBenchmarks()` | `benchmarkData.ts` | Skill category gaps vs peers |
| `getOrgBenchmarks()` | `benchmarkData.ts` | Promotion velocity, headcount ratios vs peers |
| `computeAttritionScore()` | `benchmarkData.ts` | Composite attrition risk 0–100 |
| `getFlightRiskPeople('high')` | `promotionData.ts` | People with high flight risk flag |
| `SKILLS_DATA` | `mockData.ts` | Raw skill gap rows for critical gap detection |
| `PEOPLE` | `promotionData.ts` | Check-in dates, headcount |

Peer comparison set: `SIMILAR_PEERS` — companies of similar size to Acme, filtered from `PEER_COMPANIES`.

---

## Navigation map

| From | Action | Destination |
|---|---|---|
| KPI: Org Health | Click | `heatmap` |
| KPI: Below Expected Level | Click | `heatmap` |
| KPI: Promotable Now | Click | `pipeline` |
| KPI: Stalled 24M+ | Click | `pipeline` |
| KPI: Managers | Click | `managers` |
| KPI: Industry Rank | Click | `benchmark` |
| KPI: Attrition Risk | Click | `benchmark` |
| KPI: No Check-In | Click | `pipeline` |
| Risk: Critical Skills (primary) | Click CTA | `gap-report` (dept pre-filtered) |
| Risk: Critical Skills (secondary) | Click CTA | `heatmap` |
| Risk: Stalled Employees (primary) | Click CTA | `managers` (manager deep-linked) |
| Risk: Stalled Employees (secondary) | Click CTA | `pipeline` |
| Risk: Managers (primary) | Click CTA | `managers` |
| Risk: Benchmark Gap (primary) | Click CTA | `benchmark` |
| Risk: Benchmark Gap (secondary) | Click CTA | `gap-report` (dept pre-filtered) |
| Risk: Comp Risk (primary) | Click CTA | `benchmark` |
| Risk: Flight Risk (primary) | Click CTA | `pipeline` → flight-risk tab |
| Risk: Flight Risk (secondary) | Click CTA | `pipeline` → hidden-talent tab |
| Risk: Attrition Risk (primary) | Click CTA | `benchmark` |
| AI Prompt Bar | Submit question | `ask-ai` (question pre-loaded) |
| Dept Health row | Click anywhere in row | `heatmap` (dept pre-filtered) |
