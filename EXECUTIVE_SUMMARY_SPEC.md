# Executive Summary — Component Specification

**Page:** `home` view  
**Entry point:** `src/components/ExecutiveSummary.tsx`  
**Data layer:** `src/data/execSummaryData.ts` → `computeExecSummary()`  
**Last updated:** May 2026

---

## Open questions

These are unresolved ambiguities that require a decision before the affected components can be built or tested.

**OQ-1 — `gap-report` routing is broken.**  
`NavTarget.view` includes `'gap-report'` and several risk card CTAs navigate to it, but `App.tsx`'s `ActiveView` type does not include `'gap-report'`, and there is no conditional renderer for it. When `navigate({ view: 'gap-report' })` is called from this page, `nav.view` is set to `'gap-report'` but nothing renders — the main content area goes blank. `DeptGapReportPicker` and `SkillGapReport` components exist in `src/components/` but are not mounted in `App.tsx`. This must be resolved before the critical-skills and benchmark-gap risk card CTAs will work. **Decision needed:** add `'gap-report'` to `ActiveView` and wire up the renderer in `App.tsx`.

---

## Table of contents

1. [Architecture & file map](#1-architecture--file-map)
2. [TypeScript interfaces](#2-typescript-interfaces)
3. [Page layout](#3-page-layout)
4. [Component reference](#4-component-reference)
   - 4.1 [Page Header](#41-page-header)
   - 4.2 [Data Freshness Bar](#42-data-freshness-bar)
   - 4.3 [KPI Metric Strip](#43-kpi-metric-strip)
   - 4.4 [Highlights Panel](#44-highlights-panel)
   - 4.5 [Priority Risks Panel](#45-priority-risks-panel)
   - 4.6 [AI Prompt Bar](#46-ai-prompt-bar)
   - 4.7 [Check-in Coverage Panel](#47-check-in-coverage-panel)
   - 4.8 [Department Health Table](#48-department-health-table)
   - 4.9 [Feedback Banner](#49-feedback-banner)
   - 4.10 [Export Buttons](#410-export-buttons)
5. [Data compute reference](#5-data-compute-reference)
6. [Navigation map](#6-navigation-map)
7. [Responsive behaviour](#7-responsive-behaviour)
8. [Empty & loading states](#8-empty--loading-states)

---

## 1. Architecture & file map

### Component locations

All components below are **local to `ExecutiveSummary.tsx`** — they are defined in the same file and are not exported or reused elsewhere. Do not extract them into `src/components/shared/` unless they are explicitly needed by another page.

| Component | Location | Exported? |
|---|---|---|
| `ExecutiveSummary` | `src/components/ExecutiveSummary.tsx` | Yes — named export, consumed by `App.tsx` |
| `KpiCard` | Same file | No |
| `AIPromptBar` | Same file | No |
| `RiskCard` | Same file | No |
| `CheckInRow` | Same file | No |
| `DeptRow` | Same file | No |
| `buildKpiCards()` | Same file | No — helper function |
| `ordinal()` | Same file | No — helper function |
| `riskIcon/Bg/Title/etc.` | Same file | No — style helpers |

### Shared components consumed by this page

| Component | Location | Purpose |
|---|---|---|
| `FeedbackBanner` | `src/components/feedback/FeedbackBanner.tsx` | Feedback prompt at page bottom |
| `FeedbackFlow` | `src/components/feedback/FeedbackFlow.tsx` | Modal triggered by FeedbackBanner |
| `ExportButtons` | `src/components/ExportButtons.tsx` | Download + email export |

### Data dependencies

| Function / constant | Source file | What it provides |
|---|---|---|
| `computeExecSummary()` | `src/data/execSummaryData.ts` | Full summary object — single source of truth for the page |
| `QUARTILE_CONFIG` | `src/data/benchmarkData.ts` | Colour/label config for quartile position badges |

---

## 2. TypeScript interfaces

These are the exact types the page works with. Do not redefine them — import from the paths shown.

### From `src/data/mockData.ts`

```typescript
// The seven department names used throughout the app as a discriminated union.
// Import from 'src/data/mockData.ts', not redefined elsewhere.
export type Department =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Data'
  | 'Marketing'
  | 'Sales'
  | 'People Ops';
```

### From `src/data/promotionData.ts`

The full `Person` interface is defined here. `CheckInRow` only renders a subset of its fields:

```typescript
export interface Person {
  id: string;
  name: string;               // displayed in CheckInRow
  department: Department;     // displayed in CheckInRow
  team: string;               // displayed in CheckInRow
  // (additional fields not used by this page)
  tenure: number;             // months in current level — used to compute stalledCount
  lastCheckIn: string;        // ISO date string — used to compute daysSinceCheckIn
  flightRisk?: 'high' | 'medium' | 'low';
  flightRiskDrivers?: string[];
}
```

### From `src/data/execSummaryData.ts`

```typescript
export type RiskLevel = 'critical' | 'warning' | 'healthy';

export interface OrgRisk {
  id: string;
  level: RiskLevel;
  title: string;           // short description, e.g. "3 critical skill gaps across the org"
  detail: string;          // one sentence with named actors
  metric: string;          // badge text, e.g. "87% below target"
  action: NavTarget;       // primary CTA destination
  actionLabel: string;     // primary CTA button text
  secondaryAction?: NavTarget;
  secondaryLabel?: string;
  source: 'skills' | 'pipeline' | 'managers' | 'benchmark';
}

export interface NavTarget {
  view: 'heatmap' | 'pipeline' | 'gap-report' | 'managers' | 'benchmark';
  department?: Department;       // pre-filter destination to this dept
  skill?: string;
  managerId?: string;            // deep-link to a specific manager
  pipelineTab?: 'pipeline' | 'hidden-talent' | 'flight-risk';
}

export interface DeptHealthSnapshot {
  department: Department;
  color: string;             // hex — department brand colour from DEPT_COLORS
  overallScore: number;      // 0–100 composite
  scoreLabel: string;        // 'Strong' | 'Moderate' | 'At Risk' | 'Critical'
  skillCompetency: number;   // 1.0–5.0
  nearReadyCount: number;
  stalledCount: number;
  benchmarkPosition: QuartilePosition;  // 'top' | 'above-median' | 'below-median' | 'bottom'
  criticalSkillGaps: number;
  avgManagerScore: number;
}

export interface CheckInFlag {
  person: Person;            // from promotionData.ts
  daysSinceCheckIn: number;
  severity: 'overdue' | 'critical';  // overdue = 30–90d, critical = 90d+
}

export interface ExecSummary {
  asOf: string;                      // display string e.g. 'Apr 2026'
  orgHealthScore: number;            // 0–100
  orgHealthLabel: string;            // 'Strong' | 'Moderate' | 'At Risk' | 'Critical'
  orgHealthColor: string;            // Tailwind text colour class

  totalHeadcount: number;
  totalNearReady: number;
  totalStalled: number;
  criticalSkillGaps: number;         // skills where 70%+ of people are below target
  peopleWithSkillGaps: number;       // people below target on ≥1 skill
  managersNeedingSupport: number;    // managers with effectiveness score < 40
  benchmarkPosition: QuartilePosition;
  benchmarkRank: number;             // e.g. 2 (Acme is 2nd of N companies)
  benchmarkTotal: number;            // total companies in peer set

  attritionScore: AttritionScore;    // from benchmarkData.ts

  checkInCoverage: number;           // 0–100 percentage
  overdueCheckIns: number;           // count of 30–90d
  criticalCheckIns: number;          // count of 90d+
  flaggedCheckIns: CheckInFlag[];    // sorted by daysSinceCheckIn desc

  risks: OrgRisk[];                  // up to 5, sorted critical-first
  deptSnapshots: DeptHealthSnapshot[];
  wins: { title: string; detail: string; source: string }[];  // up to 3
}
```

### From `src/data/benchmarkData.ts`

```typescript
export type QuartilePosition = 'top' | 'above-median' | 'below-median' | 'bottom';

export interface AttritionScore {
  score: number;           // 0–100 composite risk score
  riskLabel: string;       // 'Low' | 'Moderate' | 'Elevated' | 'High'
  annualisedRate: number;  // e.g. 14.2 (percent)
  competitorPct: number;   // % of leavers going to direct competitors
  compDrivenPct: number;   // % of leavers citing comp as driver
  headline: string;        // one-sentence summary for risk card detail
}

// QUARTILE_CONFIG maps QuartilePosition to display config:
export const QUARTILE_CONFIG: Record<QuartilePosition, {
  label: string;    // e.g. 'Top Quartile'
  color: string;    // Tailwind text class
  bg: string;       // Tailwind bg class
  border: string;   // Tailwind border class
  dot: string;      // Tailwind bg class for dot indicator
}>;
```

### Props interfaces

```typescript
// ExecutiveSummary — the page root
interface ExecutiveSummaryProps {
  onNavigate: (target: NavTarget) => void;  // routes the app to another view
  onAskAI: (initialQuestion?: string) => void;  // opens ask-ai view, optionally pre-seeds a question
}

// KpiCard
interface KpiCardData {
  icon: React.ReactNode;
  iconColor: string;       // Tailwind text colour class for icon
  value: string;           // large displayed number/value
  valueSuffix?: string;    // smaller text after value, e.g. '/100'
  valueColor: string;      // Tailwind text colour class for value
  valueNote?: string;      // small text beside value, e.g. 'people'
  valueNoteColor?: string;
  label: string;           // uppercase caption below value
  action: NavTarget;       // where clicking the card navigates
}

interface KpiCardProps {
  card: KpiCardData;
  onNavigate: (target: NavTarget) => void;
}

// RiskCard
interface RiskCardProps {
  risk: OrgRisk;
  onNavigate: (target: NavTarget) => void;
}

// CheckInRow — no navigation, display only
interface CheckInRowProps {
  flag: CheckInFlag;
}

// DeptRow
interface DeptRowProps {
  snap: DeptHealthSnapshot;
  onNavigate: (target: NavTarget) => void;
}

// AIPromptBar
interface AIPromptBarProps {
  onAskAI: (question?: string) => void;
}
```

---

## 3. Page layout

```
┌─────────────────────────────────────────┐
│ 4.1 Page Header                         │
│     └─ 4.2 Data Freshness Bar           │
├─────────────────────────────────────────┤
│ 4.3 KPI Strip — primary 4 (always)      │
│     [expand toggle]                     │
│     KPI Strip — secondary 3 (toggle)    │
├─────────────────────────────────────────┤
│ 4.4 Highlights Panel                    │
├─────────────────────────────────────────┤
│ 4.5 Priority Risks Panel                │
│     └─ RiskCard × N (up to 5)          │
│     └─ 4.6 AI Prompt Bar               │
├─────────────────────────────────────────┤
│ 4.7 Check-in Coverage Panel             │
├─────────────────────────────────────────┤
│ 4.8 Department Health Table             │
├─────────────────────────────────────────┤
│ 4.9 Feedback Banner                     │
└─────────────────────────────────────────┘
```

The page uses a single scrollable column. `max-w-6xl mx-auto` constrains content width. Sections are separated by `space-y-8`. Background is `bg-gray-50`.

---

## 4. Component reference

### 4.1 Page Header

**Location:** Inline in `ExecutiveSummary`, inside a `<header>` element.  
**Background:** White with bottom border.  
**Not clickable.** Navigation is handled by child components.

| Element | Content | Notes |
|---|---|---|
| Eyebrow | "Chief People Officer · Executive View" | Static string |
| Title | "Workforce Health Dashboard" | `text-2xl font-bold` |
| Subtitle | "Organisation-wide signal digest · Click any insight to investigate further" | Static string |
| Org pill | Company name + `summary.totalHeadcount` + pulsing green dot | Read-only |
| Export row | `ExportButtons` component | See §4.10 |

---

### 4.2 Data Freshness Bar

**Location:** Inline in `ExecutiveSummary`, below the header content row.  
**Background:** `bg-gray-50 border border-gray-100 rounded-xl`.

**State owned by `ExecutiveSummary`:**
```typescript
const [refreshKey, setRefreshKey] = useState(0);
const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());
const [isRefreshing, setIsRefreshing] = useState(false);
```

| Element | Content | Behaviour |
|---|---|---|
| "Last updated" | `formatTimestamp(lastRefreshed)` — day/month/year + HH:MM | Updates on refresh |
| "Next auto-refresh" | `nextScheduledRun()` — next occurrence of 23:59 | Display only; auto-refresh is not implemented |
| "Refresh now" button | Spinner icon when `isRefreshing` | See below |

**Refresh sequence:**
1. `setIsRefreshing(true)`
2. 600ms `setTimeout`
3. `setRefreshKey(k => k + 1)` — triggers `useMemo` to re-run `computeExecSummary()`
4. `setLastRefreshed(new Date())`
5. `setIsRefreshing(false)`

The 600ms delay is intentional — it makes the spinner visible so the user perceives a response. Button is `disabled` while refreshing.

---

### 4.3 KPI Metric Strip

**Tour anchor:** `data-tour="home-kpi-strip"`  
**State:** `const [kpiExpanded, setKpiExpanded] = useState(false)` — owned by `ExecutiveSummary`.

Cards are built by `buildKpiCards(summary): KpiCardData[]`. The function returns an array of 8 items; indices 0–3 are primary, 4–7 are secondary.

**Grid layout:**
- Primary (indices 0–3): `grid grid-cols-4 gap-3`
- Secondary (indices 4–7): `grid grid-cols-3 gap-3 mt-3` — only rendered when `kpiExpanded === true`

**Expand toggle:** Centered text button below the grids. Clicking toggles `kpiExpanded`. Labels:
- Collapsed: "Show managers, rank, attrition & check-ins"
- Expanded: "Hide managers, rank, attrition & check-ins"

Every `KpiCard` is a `<button>` that calls `onNavigate(card.action)` on click. No modal, no panel — direct view navigation.

#### KpiCard anatomy

```
┌─────────────────────────────┐
│ [icon]              [→]     │  ← icon + hover arrow
│                             │
│  42 people                  │  ← value + suffix/note
│                             │
│  BELOW EXPECTED LEVEL       │  ← uppercase label
└─────────────────────────────┘
```

`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-px`

---

#### Card 1 — Org Health

| Field | Value |
|---|---|
| Source | `summary.orgHealthScore` |
| Suffix | `/100` |
| Label | "Org Health" |
| Navigates to | `heatmap` |

Colour of value text (and icon is always `text-orange-500`):

| Score | Class |
|---|---|
| ≥ 75 | `text-emerald-600` |
| ≥ 55 | `text-amber-500` |
| ≥ 35 | `text-orange-500` |
| < 35 | `text-red-600` |

**Compute:** See [§5.1 — Org Health Score](#51-org-health-score).

---

#### Card 2 — Below Expected Level

| Field | Value |
|---|---|
| Source | `summary.peopleWithSkillGaps` |
| Note | "people" |
| Label | "Below Expected Level" |
| Navigates to | `heatmap` |

Colour:

| Count | Class |
|---|---|
| 0 | `text-emerald-600` |
| ≤ 10 | `text-amber-500` |
| > 10 | `text-red-600` |

**Compute:** Count of people where `readinessPct < 100` (at least one skill criterion unmet).

---

#### Card 3 — Promotable Now

| Field | Value |
|---|---|
| Source | `summary.totalNearReady` |
| Note | "ready" |
| Label | "Promotable Now" |
| Navigates to | `pipeline` |

Colour:

| Count | Class |
|---|---|
| ≥ 5 | `text-emerald-600` |
| ≥ 2 | `text-amber-500` |
| < 2 | `text-orange-500` |

**Compute:** Count of people with `readinessPct >= 90`.

---

#### Card 4 — Stalled 24M+

| Field | Value |
|---|---|
| Source | `summary.totalStalled` |
| Note | "stalled" |
| Label | "Stalled 24M+" |
| Navigates to | `pipeline` |

Colour: Always `text-gray-600` (neutral — risk escalation is handled in the Risk Cards section, not here).

**Compute:** Count of people with `person.tenure > 24` months AND `readinessPct < 50`.

---

#### Card 5 — Managers (secondary)

| Field | Value |
|---|---|
| Source | `summary.managersNeedingSupport` |
| Note | "flagged" |
| Label | "Managers" |
| Navigates to | `managers` |

Colour:

| Count | Class |
|---|---|
| 0 | `text-emerald-600` |
| 1 | `text-amber-500` |
| > 1 | `text-orange-500` |

**Compute:** Count of managers with `reports.length > 0` whose composite effectiveness score < 40. Score = `avgReadiness × 0.4 + avgFrameworkCompletion × 0.3 + (100 − stallRate%) × 0.3`.

---

#### Card 6 — Industry Rank (secondary)

| Field | Value |
|---|---|
| Source | `ordinal(summary.benchmarkRank)` — e.g. "2nd" |
| Note | `of ${summary.benchmarkTotal}` |
| Label | "Industry Rank" |
| Navigates to | `benchmark` |

`ordinal(n)` appends the correct English suffix (st/nd/rd/th).

Colour:

| Condition | Class |
|---|---|
| Rank = 1 | `text-emerald-600` |
| Rank ≤ top half | `text-amber-500` |
| Rank > top half | `text-red-600` |

**Compute:** Acme's rank among `SIMILAR_PEERS` on overall skill benchmark score. Rank 1 = best.

---

#### Card 7 — Attrition Risk (secondary)

| Field | Value |
|---|---|
| Source | `summary.attritionScore.score` (0–100) |
| Suffix | `/100` |
| Note | `summary.attritionScore.riskLabel` |
| Label | "Attrition Risk" |
| Navigates to | `benchmark` |

Both value and note share the same colour:

| Score | Class |
|---|---|
| ≥ 70 | `text-red-600` |
| ≥ 45 | `text-amber-500` |
| ≥ 25 | `text-sky-600` |
| < 25 | `text-emerald-600` |

**Compute:** See [§5.2 — Attrition Score](#52-attrition-score).

---

#### Card 8 — No Check-In (secondary)

| Field | Value |
|---|---|
| Source | `summary.overdueCheckIns + summary.criticalCheckIns` |
| Suffix | `/ ${summary.totalHeadcount}` — only shown when total > 0 |
| Note | "all current" — only shown when total = 0 |
| Label | "No Check-In" |
| Navigates to | `pipeline` |

Colour:

| State | Class |
|---|---|
| 0 flagged | `text-emerald-600` |
| Any critical (90d+) | `text-red-600` |
| Only overdue (30–90d) | `text-amber-500` |

**Compute:** See [§5.3 — Check-in Coverage](#53-check-in-coverage).

---

### 4.4 Highlights Panel

**Tour anchor:** `data-tour="home-highlights"`  
**Background:** `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm`

Header: "Highlights to communicate upward" with a `Star` icon (amber).

Renders `summary.wins` — up to 3 items. Each win is a green card:
- `bg-emerald-50 rounded-xl border border-emerald-100`
- `CheckCircle2` icon (emerald)
- Title (`text-xs font-semibold text-emerald-800`)
- Detail (`text-[11px] text-emerald-700`)
- Source badge: small icon + label at bottom (`text-[10px] text-emerald-500`)

**Empty state:** If `summary.wins.length === 0`, the panel should not render at all (condition is `wins.length > 0` — if no wins, the panel is simply absent from the DOM). This will not happen with the current data set but is the correct behaviour.

**Win detection logic** (in priority order, first 3 included):

| Win | Trigger condition |
|---|---|
| "N employees ready for promotion" | `totalNearReady > 0` |
| "X departments skill in top quartile" | Any dept with `skillBenchmarks.position === 'top'` |
| "[Name] is the highest-rated manager" | Always — top-scoring manager among those with `reports.length > 0` |

Source badge labels: `Skills Heatmap`, `Industry Benchmark`, `Promotion Pipeline`, `Manager Effectiveness`.

---

### 4.5 Priority Risks Panel

**Tour anchor:** `data-tour="home-risks"`

Header row:
- Left: "Priority risks requiring attention" with a red `Shield` icon
- Right: count badge — `${summary.risks.length} active signal(s)`

**Empty state (zero risks):**
```
bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center
[CheckCircle2 icon, size 32, emerald]
"No critical risks detected"
"All org dimensions are performing at or above benchmark"
```
This is a full-width block. It is not the same height as a RiskCard — it has `p-8` padding and is taller.

When risks exist: `space-y-3` list of `RiskCard` components.

#### RiskCard

```
┌─────────────────────────────────────────────────┐
│ [!] Risk title                    [metric badge] │
│     Detail sentence                              │
│     [source icon] Source label                   │
│                                                  │
│ [Primary CTA button]  [Secondary CTA button]     │
└─────────────────────────────────────────────────┘
```

Background, text colours, and button colours all derive from `risk.level`:

| Level | Background | Border | Title | Detail | Metric badge | Primary btn | Secondary btn |
|---|---|---|---|---|---|---|---|
| `critical` | `bg-red-50` | `border-red-200` | `text-red-800` | `text-red-700` | `bg-red-100 text-red-700 border-red-200` | `bg-red-600 hover:bg-red-700 text-white` | `text-red-600 border-red-200` |
| `warning` | `bg-amber-50` | `border-amber-200` | `text-amber-800` | `text-amber-700` | `bg-amber-100 text-amber-700 border-amber-200` | `bg-amber-600 hover:bg-amber-700 text-white` | `text-amber-600 border-amber-200` |

Secondary CTA is only rendered when `risk.secondaryAction` and `risk.secondaryLabel` are both defined.

Source badge icons: `BarChart3` for skills, `TrendingUp` for pipeline, `Users` for managers, `Globe` for benchmark.

---

#### Risk types — full specification

**critical-skills**

| Property | Value |
|---|---|
| Trigger | `criticalSkillsList.length > 0` — any skill with ≥70% of people below target |
| Level | Always `critical` |
| Title | `"${n} critical skill gap(s) across the org"` |
| Metric | `"${worst.belowPct}% below target"` |
| Detail | Names the worst skill and its department |
| Primary CTA | `gap-report`, `department: worst.dept` |
| Primary label | `"View ${dept} skill gaps"` |
| Secondary CTA | `heatmap` |
| Secondary label | "Open heatmap" |
| Source | `skills` |

---

**stalled-reports**

| Property | Value |
|---|---|
| Trigger | `totalStalled > 0` AND `managersWithMostStalled.length > 0` |
| Level | `critical` if `totalStalled / allReadiness.length >= 0.05`; else `warning` |
| Title | `"${n} employee(s) showing stall signals"` |
| Metric | `"${n} stalled (24m+ · <50% ready)"` |
| Detail | Names the manager with the most stalled reports |
| Primary CTA | `managers`, `managerId: worstMgr.manager.id` |
| Primary label | `"Review ${name}'s team"` |
| Secondary CTA | `pipeline` |
| Secondary label | "Full pipeline view" |
| Source | `pipeline` |

---

**manager-support**

| Property | Value |
|---|---|
| Trigger | `managersNeedingSupport.length > 0` |
| Level | Always `warning` |
| Title | `"${n} manager(s) flagged for L&D coaching"` |
| Metric | "Effectiveness score < 40" |
| Detail | Describes pattern (high stall rate + poor framework completion) |
| Primary CTA | `managers` (no managerId — shows full list) |
| Primary label | "Manager effectiveness" |
| Secondary CTA | None |
| Source | `managers` |

---

**benchmark-gap**

| Property | Value |
|---|---|
| Trigger | Any dept with `skillBenchmarks.position === 'bottom'` |
| Level | Always `warning` |
| Title | `"${dept} skills in bottom quartile vs industry"` |
| Metric | `"${acmeValue} vs ${peerMedian} peer median"` |
| Detail | Names the department and its competency score |
| Primary CTA | `benchmark` |
| Primary label | "View skill benchmarks" |
| Secondary CTA | `gap-report`, `department: worst.department` |
| Secondary label | `"${dept} gap report"` |
| Source | `benchmark` |

---

**comp-risk**

| Property | Value |
|---|---|
| Trigger | Any dept with comp benchmark position `bottom` or `below-median` |
| Level | Always `warning` |
| Title | `"${dept} compensation below market"` |
| Metric | `"$${amount}K below median"` |
| Detail | Names the department, dollar gap, and combined flight-risk implication |
| Primary CTA | `benchmark` |
| Primary label | "Compensation benchmarks" |
| Secondary CTA | None |
| Source | `benchmark` |

---

**flight-risk**

| Property | Value |
|---|---|
| Trigger | `highFlightRisk.length > 0` |
| Level | `critical` if `highFlightRisk.length / allReadiness.length >= 0.06`; else `warning` |
| Title | `"${n} employee(s) flagged high flight risk by Revelio Labs"` |
| Metric | `"${n} high risk · ${m} internal match"` |
| Detail | Names the top-risk individual and their first risk driver |
| Primary CTA | `pipeline`, `pipelineTab: 'flight-risk'` |
| Primary label | "View flight risk" |
| Secondary CTA | `pipeline`, `pipelineTab: 'hidden-talent'` — **only if** `withOpportunity.length > 0` |
| Secondary label | "Internal opportunities" — only if secondary CTA present |
| Source | `pipeline` |

---

**attrition-risk**

| Property | Value |
|---|---|
| Trigger | `attritionScore.score >= 45` |
| Level | `critical` if score ≥ 70; else `warning` |
| Title | `"Attrition risk: ${riskLabel} (${annualisedRate}% annualised)"` |
| Metric | `"${competitorPct}% to competitors · ${compDrivenPct}% comp-driven"` |
| Detail | `attritionScore.headline` |
| Primary CTA | `benchmark` |
| Primary label | "View talent flow" |
| Secondary CTA | None |
| Source | `benchmark` |

---

**Sort order:** All `critical` risks appear before all `warning` risks. Within each group, detection order is preserved (skills → stalled → managers → benchmark-gap → comp-risk → flight-risk → attrition-risk). Maximum 5 risks are included (`risks.slice(0, 5)`).

---

### 4.6 AI Prompt Bar

**Location:** Rendered inside the risks section, directly below the last RiskCard (or the empty state if no risks).  
**Purpose:** Zero-friction entry point to the AI assistant, pre-contextualised to this page.

**State (local to `AIPromptBar`):**
```typescript
const [input, setInput] = useState('');
```

| Element | Behaviour |
|---|---|
| Text input | `Enter` key submits; calls `submit(input)` |
| "Ask" button | Disabled when `input.trim() === ''`; calls `submit(input)` |
| Suggestion chip | Calls `submit(chip text)` immediately — no typing required |

**`submit(text)` function:**
1. Trim text; if empty, return early
2. Call `onAskAI(text)` — parent navigates to `ask-ai` view with question pre-loaded
3. `setInput('')`

Suggestion chips (first 4 of 6 shown):
1. "Who is at risk of leaving?"
2. "Where are our biggest skills gaps?"
3. "Which teams need restructuring?"
4. "Build a retention plan for churn risks"

---

### 4.7 Check-in Coverage Panel

**Tour anchor:** `data-tour="home-checkins"`  
**Background:** `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`  
**No navigation.** This panel is read-only.

#### Header

| Element | Content |
|---|---|
| Icon | `CalendarX` — red if `criticalCheckIns > 0`, amber if `overdueCheckIns > 0`, emerald if all clear |
| Title | "Check-in coverage" |
| Subtitle | `"${checkInCoverage}% of employees have checked in within the last 30 days"` |
| Status pills | Up to 3 pills (see below) |

Status pill logic (all three can show simultaneously):
- Red pill: shown if `criticalCheckIns > 0` — label `"${n} critical (90d+)"`
- Amber pill: shown if `overdueCheckIns > 0` — label `"${n} overdue (30–90d)"`
- Green pill: shown if `flaggedCheckIns.length === 0` — label `"All up to date"`

#### Coverage bar

A single horizontal bar (`h-2 rounded-full`) made of three segments in a flex row:

```
[═══════ emerald ════][══ amber ══][═ red ═]
```

Segment widths:
- Emerald: `${checkInCoverage}%`
- Amber: `${Math.round((overdueCheckIns / totalHeadcount) * 100)}%`
- Red: `${Math.round((criticalCheckIns / totalHeadcount) * 100)}%`

Legend below bar: three dot + label pairs for Current / Overdue / Critical with actual counts.

#### Flagged people list

**Empty state (all clear):**
```
text-center py-4
[CheckCircle2 icon, size 24, emerald]
"Everyone has checked in within the last 30 days."
```

**When flagged people exist:**
```
2-column grid (grid-cols-2 gap-2)
sorted by daysSinceCheckIn desc (most overdue first)
```

Each `CheckInRow`:
- `bg-red-50 border-red-100` for critical; `bg-amber-50 border-amber-100` for overdue
- Avatar circle with `Clock` icon
- Name (truncated), department · team
- Days since check-in (bold, right-aligned)
- "Critical" or "Overdue" label (uppercase, right-aligned below days)

---

### 4.8 Department Health Table

**Tour anchor:** `data-tour="home-dept-table"`  
**Background:** `bg-white rounded-2xl border border-gray-100 p-6 shadow-sm`

#### Header

Title: "Department health at a glance"

Legend (right side of header):
- Emerald dot — "Strong (≥70)"
- Amber dot — "Moderate (50–69)"
- Red dot — "At Risk (<50)"

#### DeptRow

Clicking any row calls `onNavigate({ view: 'heatmap', department: snap.department })`.

Row layout: `flex items-center gap-4 py-3 border-b border-gray-100 last:border-0`

| Column | Content | Width |
|---|---|---|
| Colour bar | 8×32px rounded rectangle in `snap.color` | flex-shrink-0 |
| Dept name + score label | Name on top, score label below in themed colour | `w-28` |
| Score bar | Horizontal fill bar + score number right-aligned | flex-1 |
| Skill avg | `snap.skillCompetency/5` | `w-14` |
| Near ready | `snap.nearReadyCount` — emerald if >0, gray if 0 | `w-14` |
| Stalled | `snap.stalledCount` — red if >0, gray if 0 | `w-12` |
| vs industry | Quartile badge from `QUARTILE_CONFIG[snap.benchmarkPosition]` | `w-24` |
| Arrow | `ArrowRight` icon, fades in on hover | flex-shrink-0 |

Score bar colours:
- `bg-emerald-500` if `overallScore >= 70`
- `bg-amber-400` if `overallScore >= 50`
- `bg-red-500` if `overallScore < 50`

Departments are always rendered in this fixed order: Engineering, Product, Design, Data, Marketing, Sales, People Ops.

**Compute:** See [§5.4 — Department Score](#54-department-score).

---

### 4.9 Feedback Banner

**Component:** `FeedbackBanner` from `src/components/feedback/FeedbackBanner.tsx`  
**Props:**

```typescript
interface Props {
  context: string;     // page identifier — must match a key in CONTEXT_COPY
  className?: string;
}
```

Called with `context="Executive Summary"` and `className="mt-6"`.

The `context` string must exactly match a key in the `CONTEXT_COPY` map inside `FeedbackBanner.tsx`. If it doesn't match, a generic fallback is used. The full map is:

```typescript
const CONTEXT_COPY: Record<string, { question: string; sub: string }> = {
  'Skills Heatmap':        { question: 'Is this heatmap surfacing the gaps that matter most to you?',           sub: 'Tell us what data or filters would make it more actionable.' },
  'Skills Overview':       { question: 'Does this department view help you plan development conversations?',     sub: "We'd love to know what's missing from the skills picture." },
  'Areas to Improve':      { question: 'Is this gap report giving you what you need to make a case?',           sub: 'Tell us what would make this report more useful in practice.' },
  'Promotion Pipeline':    { question: 'Does this pipeline reflect how you actually think about readiness?',     sub: 'Share what\'s missing from the promotion picture.' },
  'Manager Effectiveness': { question: 'Are these manager metrics helping you have better conversations?',       sub: 'Tell us what signals you wish you had.' },
  'Industry Benchmarks':   { question: 'Are you benchmarking against the right peers?',                         sub: 'Let us know what comparisons would be most useful.' },
  'Executive Summary':     { question: 'Is this summary giving you what you need before a leadership meeting?',  sub: 'Tell us what signals belong on this page.' },
  'Decisions Journal':     { question: 'Is the journal helping you follow through on commitments?',             sub: 'Tell us how we can make it a better accountability tool.' },
};
// Fallback (key not found):
// { question: 'Is this view useful for your work?', sub: "Tell us what's missing or what would make it better." }
```

When adding the `FeedbackBanner` to a new page, add a corresponding entry to this map using the exact string you pass as `context`.

**Appearance:** Full-width sky-blue gradient banner (`linear-gradient(135deg, #0ea5e9, #0284c7, #0369a1)`) with a white "Share feedback" button on the right.

**Behaviour:** Clicking "Share feedback" opens `FeedbackFlow` as a modal overlay.

#### FeedbackFlow modal (from `src/components/feedback/FeedbackFlow.tsx`)

A 3-step bottom sheet modal (`max-w-md`, centred, slides up from bottom).

| Step | Content |
|---|---|
| `rating` | 5-option emoji rating (1–5). Requires selection before Continue is enabled. |
| `text` | Free text textarea. Skippable. |
| `research` | Research opt-in with "I'm in" / "Maybe later". If "I'm in", name + email fields appear. Submit requires both fields filled. |
| `done` | Thank-you screen. Single "Done" button closes modal. |

**Scrim:** `bg-gray-950/30 backdrop-blur-[2px]`. Clicking scrim closes modal (triggers fade-out before `onClose`).

**Animation:** Panel slides up (`translate-y-0`) and fades in (`opacity-100`) on mount with 350ms transition. Reverse on close, then `onClose()` called after 350ms.

**Data is persisted** to the `feedback` Supabase table (see migration `create_feedback_table`). A single INSERT is made when the user reaches the `done` step — either via "Maybe later" (no call) or "Submit feedback" (with call). The insert is fire-and-forget; errors are swallowed so feedback submission never breaks the UI. The table has an anonymous INSERT RLS policy — no auth is required to submit.

#### Feedback table schema

| Form input | Column | Type | Nullable | Notes |
|---|---|---|---|---|
| Which page triggered it | `context` | `text NOT NULL` | No | e.g. `'Executive Summary'` — always set |
| 1–5 rating buttons | `rating` | `smallint` | Yes | Required before step 1 Continue is enabled; `null` only if bypassed |
| Free-text textarea | `feedback_text` | `text` | Yes | `null` if blank or step skipped |
| "I'm in" / "Maybe later" | `wants_research_call` | `boolean NOT NULL DEFAULT false` | No | Always set |
| Name field | `researcher_name` | `text` | Yes | `null` when `wants_research_call = false` |
| Email field | `researcher_email` | `text` | Yes | `null` when `wants_research_call = false` |
| — | `created_at` | `timestamptz DEFAULT now()` | Yes | Auto-set by the database |

One row is inserted per completed feedback session. `context` and `rating` are always populated. `feedback_text` is optional (step 2 is skippable). The three research columns are only populated when the user chooses "I'm in" and submits their contact details. All submissions are visible in the Supabase dashboard under **Table Editor → feedback**.

---

### 4.10 Export Buttons

**Component:** `ExportButtons` from `src/components/ExportButtons.tsx`  
**Props:**

```typescript
interface Props {
  title: string;           // "Workforce Health Dashboard"
  buildContent: () => string;  // called lazily on click — generates the export text
}
```

Renders two buttons in a flex row:

**Download button:**
1. Calls `buildContent()` to generate the plain-text report string
2. Creates a `Blob` with `type: 'text/plain'`
3. Creates a temporary `<a>` element with `download` attribute
4. Filename: `progression-workforce-health-dashboard.txt`
5. Shows "Downloaded" with check icon for 2 seconds, then resets

**Email button:**
Opens an `EmailModal` overlay. User enters an email address. On submit, opens `mailto:` URL with subject and body pre-filled. Nothing is sent through app servers — the user's own email client handles sending.

#### Export content format

`buildExportContent()` produces this plain-text structure (exact section order):

```
PROGRESSION — WORKFORCE HEALTH DASHBOARD
Generated: {summary.asOf}
Organisation: Acme Corp · {n} employees

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY METRICS
─────────────────────────────────────
Org Health Score:         {n}/100
Below Expected Level:     {n} people
Promotable Now:           {n} near-ready
Stalled 24M+:             {n}
Managers Needing Support: {n}
Industry Rank:            {ordinal} of {total}
Check-in Coverage:        {n}%

HIGHLIGHTS
─────────────────────────────────────
  • {win.title}: {win.detail}
  ...

PRIORITY RISKS
─────────────────────────────────────
  [CRITICAL] {risk.title} — {risk.detail}
  [WARNING]  {risk.title} — {risk.detail}
  ...
  (or: "  No critical risks detected")

DEPARTMENT HEALTH
─────────────────────────────────────
  Engineering     Score: 72  Near-ready: 3  Stalled: 1
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated by Progression Workforce Intelligence.
```

---

## 5. Data compute reference

### 5.1 Org Health Score

`computeOrgHealth()` in `src/data/execSummaryData.ts`. Starts at 100 and subtracts penalties. All inputs are converted to rates before use so the score is scale-invariant.

| Penalty | Calculation | Max deduction |
|---|---|---|
| Skill gap rate | `(criticalSkillGaps / totalDistinctSkills) × 25` | −25 |
| Stalled rate | `(totalStalled / totalHeadcount) × 20` | −20 |
| Manager rate | `(managersNeedingSupport / totalManagers) × 20` | −20 |
| Benchmark position | top=0, above-median=−5, below-median=−12, bottom=−20 | −20 |
| Attrition risk | `(attritionScore / 100) × 15` | −15 |

Result clamped to 10–100.

Score labels: ≥75 → Strong, ≥55 → Moderate, ≥35 → At Risk, <35 → Critical.

A "critical skill" is any skill where ≥70% of people org-wide are below their target rating. `totalDistinctSkills` is the count of unique skill names across all `SKILLS_DATA` entries.

---

### 5.2 Attrition Score

`computeAttritionScore()` in `src/data/benchmarkData.ts`. Returns `AttritionScore`.

| Component | Max pts | Source |
|---|---|---|
| Annualised rate | 50 | `(rate / 25) × 50`, capped at 50 |
| Competitor-bound departures | 20 | `(pct / 40) × 20`, capped at 20 |
| Comp-driven departures | 15 | `(pct / 60) × 15`, capped at 15 |
| Average tenure band | 15 | <18m → 15, <24m → 8, ≥24m → 0 |

Risk labels: ≥70 → High, ≥45 → Elevated, ≥25 → Moderate, <25 → Low.

---

### 5.3 Check-in Coverage

Reference date: `2026-04-29` (hardcoded — **replace with `new Date()` in production**).

```
daysSinceCheckIn = floor((referenceDate - person.lastCheckIn) / msPerDay)
```

| Bucket | Condition |
|---|---|
| Current | `daysSinceCheckIn ≤ 30` |
| Overdue | `30 < daysSinceCheckIn < 90` |
| Critical | `daysSinceCheckIn ≥ 90` |

`checkInCoverage = round((currentCount / totalPeople) × 100)`

`flaggedCheckIns` includes overdue + critical, sorted by `daysSinceCheckIn` descending.

---

### 5.4 Department Score

Per-department composite in `computeExecSummary()`.

| Input | Weight | Calculation |
|---|---|---|
| Skill competency | 30% | `(avgActual / 5) × 100` — weighted by headcount across all skill entries for the dept |
| Avg readiness | 30% | Mean `readinessPct` across all people in the dept |
| Benchmark score | 25% | top=90, above-median=70, below-median=45, bottom=20 |
| Stall penalty | 15% | `max(0, 100 − (stalledCount / deptHeadcount × 100) × 3)` |

Result clamped to 5–100. Score labels: ≥70 → Strong, ≥50 → Moderate, ≥35 → At Risk, <35 → Critical.

---

## 6. Navigation map

All navigation is handled by `onNavigate(NavTarget)` which is passed down from `App.tsx`. `NavTarget` is defined in `src/data/execSummaryData.ts`.

| Element | Action | `NavTarget` |
|---|---|---|
| KPI: Org Health | Click card | `{ view: 'heatmap' }` |
| KPI: Below Expected Level | Click card | `{ view: 'heatmap' }` |
| KPI: Promotable Now | Click card | `{ view: 'pipeline' }` |
| KPI: Stalled 24M+ | Click card | `{ view: 'pipeline' }` |
| KPI: Managers | Click card | `{ view: 'managers' }` |
| KPI: Industry Rank | Click card | `{ view: 'benchmark' }` |
| KPI: Attrition Risk | Click card | `{ view: 'benchmark' }` |
| KPI: No Check-In | Click card | `{ view: 'pipeline' }` |
| Risk: critical-skills primary | Click button | `{ view: 'gap-report', department: worstDept }` |
| Risk: critical-skills secondary | Click button | `{ view: 'heatmap' }` |
| Risk: stalled-reports primary | Click button | `{ view: 'managers', managerId: worstMgr.id }` |
| Risk: stalled-reports secondary | Click button | `{ view: 'pipeline' }` |
| Risk: manager-support primary | Click button | `{ view: 'managers' }` |
| Risk: benchmark-gap primary | Click button | `{ view: 'benchmark' }` |
| Risk: benchmark-gap secondary | Click button | `{ view: 'gap-report', department: worstDept }` |
| Risk: comp-risk primary | Click button | `{ view: 'benchmark' }` |
| Risk: flight-risk primary | Click button | `{ view: 'pipeline', pipelineTab: 'flight-risk' }` |
| Risk: flight-risk secondary | Click button | `{ view: 'pipeline', pipelineTab: 'hidden-talent' }` |
| Risk: attrition-risk primary | Click button | `{ view: 'benchmark' }` |
| AI Prompt Bar — submit | Enter / click Ask | `onAskAI(question)` → `ask-ai` view |
| AI Prompt Bar — chip | Click chip | `onAskAI(chipText)` → `ask-ai` view |
| Dept row | Click anywhere | `{ view: 'heatmap', department: snap.department }` |

**Note:** All rows with `view: 'gap-report'` are currently non-functional. See **OQ-1** at the top of this document.

---

## 7. Responsive behaviour

| Breakpoint | KPI strip | Dept table | Check-in grid |
|---|---|---|---|
| Desktop (≥1024px) | 4-col primary, 3-col secondary | Horizontal row with all columns | 2-column grid |
| Tablet (768–1023px) | 4-col primary (cards compress), 3-col secondary | Horizontal — rightmost KPI columns may be tight; consider hiding "vs industry" pill | 2-column grid |
| Mobile (<768px) | Stack to 2-col for primary, 1-col for secondary | Horizontal scroll or collapsed to name + score only | 1-column grid |

The `FeedbackBanner` subtitle (`sub` line) is hidden at `sm` breakpoint and below using `hidden sm:block`.

No existing responsive breakpoints are defined in `ExecutiveSummary.tsx` at the time of writing. The above is the target behaviour — implementation is pending.

---

## 8. Empty & loading states

### Loading state

`computeExecSummary()` is a synchronous pure function — there is no async loading. The page renders immediately. There is no loading skeleton or spinner for the initial render.

During manual refresh, `isRefreshing` is `true` for 600ms. Only the "Refresh now" button reacts (spinner + disabled). All content remains visible and unchanged during this window.

**If `computeExecSummary()` is replaced with an async API call in future**, every section will need a loading skeleton. No skeletons exist today.

### Empty states per section

| Section | Empty condition | Renders |
|---|---|---|
| KPI strip | Never empty — all values default to 0 | N/A |
| Highlights Panel | `summary.wins.length === 0` | Panel is not rendered at all |
| Priority Risks | `summary.risks.length === 0` | Green "No critical risks" block (full-width, `p-8`) |
| Check-in list | `summary.flaggedCheckIns.length === 0` | Centred `CheckCircle2` icon + "Everyone has checked in" text |
| Dept table | Never empty — 7 fixed departments always shown | N/A |
