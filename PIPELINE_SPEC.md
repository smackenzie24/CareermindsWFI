# Promotion Readiness Pipeline — Product Specification

**Feature:** Promotion Readiness Pipeline
**Entry points:** `src/components/promotion/PromotionPipeline.tsx` (main container), `src/components/promotion/DeptPipelineView.tsx` (department drill-down), `src/components/promotion/PersonPanel.tsx` (individual side panel), `src/components/promotion/FlightRiskTab.tsx` (flight risk view), `src/components/promotion/HiddenTalent.tsx` (hidden talent view)
**Data source:** `src/data/promotionData.ts` — static mock data (PEOPLE, LEVEL_DEFINITIONS, LEVEL_FRAMEWORKS)
**Last updated:** May 2026

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Navigation model](#2-navigation-model)
3. [PromotionPipeline — org-level view](#3-promotionpipeline--org-level-view)
4. [DeptPipelineView — department drill-down](#4-deptpipelineview--department-drill-down)
5. [PersonPanel — individual side panel](#5-personpanel--individual-side-panel)
6. [FlightRiskTab — flight risk view](#6-flightrisktab--flight-risk-view)
7. [HiddenTalent — cross-department fit view](#7-hiddentalent--cross-department-fit-view)
8. [Export and download behaviour](#8-export-and-download-behaviour)
9. [Data model and computations](#9-data-model-and-computations)
10. [Readiness tiers](#10-readiness-tiers)
11. [Constants and configuration](#11-constants-and-configuration)

---

## 1. Feature overview

The Promotion Readiness Pipeline is a people analytics module that surfaces who across the organisation is ready (or on their way to being ready) for promotion to the next level. It draws on a skills-based readiness model: each person's assessed skill ratings are compared against the skill requirements defined for their target level, producing a percentage readiness score.

The feature has three tabs:

| Tab | Purpose |
|---|---|
| **Pipeline** | Org-level summary grid + department drill-down with individual candidates |
| **Hidden Talent** | People whose inferred (LinkedIn-derived) skills suggest a better fit in a different function |
| **Flight Risk** | People flagged by the Revelio Labs job-switching model as at risk of leaving |

---

## 2. Navigation model

Navigation is managed by `App.tsx` via the `NavState` object. The pipeline view is activated when `nav.view === 'pipeline'`.

`PromotionPipeline` supports a hybrid controlled/uncontrolled department selection pattern:

- **Uncontrolled (internal):** `internalDept` state controls which department is drilled into. Starts as `initialDepartment` prop (or null).
- **Controlled (prop-driven):** If `selectedDept` prop is passed from the parent, it takes precedence over `internalDept`. Parent uses `onSelectDept` callback to receive changes.

When `selectedDept` is non-null, the entire pipeline view is replaced by `DeptPipelineView`. When `onBack()` fires inside `DeptPipelineView`, `selectedDept` is reset to null and the org-level grid returns.

**Cross-feature navigation:**
- `onNavigateToGapReport(dept)` — fires from DeptPipelineView header and from AI chat recommendations; navigates to the Skills Gap Report filtered to a department.
- `onNavigateToManagers(managerId?)` — fires from DeptPipelineView header; navigates to the Manager Effectiveness view, optionally pre-selected to a specific manager.

---

## 3. PromotionPipeline — org-level view

**Component:** `PromotionPipeline.tsx`
**Route state:** `selectedDept === null`

### 3.1 Page header

The header is always visible and contains:

**Left side:**
- Eyebrow label: "Workforce Intelligence" (uppercase, tracking-widest)
- Title: "Promotion Readiness Pipeline"
- Subtitle: "Who's close to the next level? Click a department to see individual readiness scores and skill gaps."

**Right side:**
- **Download button** — downloads a PDF of the current pipeline data. While downloading, button shows a spinner; on completion shows a green "Downloaded" confirmation for 2 seconds before reverting. See §8.
- **Email me button** — opens the Email modal. See §8.
- **Live indicator** — animated pulsing green dot + "Acme Corp" label confirming data source.

### 3.2 Org-level stat cards

Four stat cards displayed in a 4-column grid immediately below the header title block:

| Card | Value | Sub-label | Colour |
|---|---|---|---|
| Tracked for promotion | `orgStats.total` | "people assessed org-wide" | Gray |
| Near ready (90%+) | `orgStats.nearReady` | "meet 90%+ of next-level criteria" | Emerald |
| Progressing (70–89%) | `orgStats.progressing` | "on track, closing gaps" | Sky |
| Avg readiness score | `orgStats.avgReadiness%` | "avg Xm in current level" | Gray |

**How these values are computed:**

```
allResults = getAllReadiness()            // all 42 people with a next level
orgStats.total = allResults.length
orgStats.nearReady = count where readinessPct >= 90
orgStats.progressing = count where 70 <= readinessPct < 90
orgStats.avgReadiness = Math.round(sum(readinessPct) / total)
orgStats.avgTenure = Math.round(sum(person.tenure) / total)   // tenure in months
```

### 3.3 Org summary section (expandable)

A collapsible row below the stat cards, toggled by the "Show/Hide org summary" chevron button. Expanded by default (`orgExpanded: true`).

**Toggle button:** centred below the stat cards, shows ChevronUp icon + "Hide org summary" when expanded, ChevronDown + "Show org summary" when collapsed. Hover darkens the text.

**When expanded — four cards:**

| Card | Value | Logic |
|---|---|---|
| Check-in Coverage | `ORG_SUMMARY.checkInCoverage%` | % of PEOPLE whose `lastCheckIn` was within 30 days of `CHECKIN_CUTOFF` (2026-04-29). Icon and number are **emerald** if ≥ 80%, **amber** if < 80%. |
| Est. Total Cost | `fmtCurrency(ORG_SUMMARY.totalCost)` | Sum of `DEPT_SALARIES[person.department]` for every person in PEOPLE. Formatted as $XM, $XK, or $X. |
| Avg Salary | `fmtCurrency(ORG_SUMMARY.avgSalary)` | `totalCost / PEOPLE.length`, rounded. |
| Team Headcount | Horizontal bar chart | Each department's headcount as a proportional bar. Bar width = `count / maxCount * 100%`. Bars use `DEPT_COLORS[dept]`. Sorted descending by count. |

**Department salary assumptions used for Total Cost:**

| Department | Annual salary assumption |
|---|---|
| Engineering | $128,000 |
| Product | $118,000 |
| Data | $122,000 |
| Design | $102,000 |
| Sales | $95,000 |
| People Ops | $90,000 |
| Marketing | $88,000 |

### 3.4 Tabs

Three tabs appear below the header in a tab bar:

| Tab | Icon | Active indicator | Badge |
|---|---|---|---|
| Pipeline | Users | dark bottom border | none |
| Hidden Talent | Sparkles | sky bottom border | sky badge showing count if > 0 |
| Flight Risk | AlertTriangle | red bottom border | red badge showing high-risk count if > 0 |

Clicking a tab sets `activeTab` and swaps the content area. The stat cards and org summary remain visible at all times regardless of active tab.

### 3.5 Tier legend bar

Shown only when `activeTab === 'pipeline'`. A horizontal strip below the tabs listing the four readiness tiers, each with a coloured circle and the percentage range:

| Tier | Colour | Range |
|---|---|---|
| Near Ready | Emerald | 90%+ |
| Progressing | Sky | 70–89% |
| Developing | Amber | 50–69% |
| Early | Gray | <50% |

### 3.6 Department cards grid

Shown only when `activeTab === 'pipeline'`. A responsive grid (1 column on small screens, 2 on medium, 3 on extra-large) of department cards.

**Each card shows:**

- **Dept icon** — coloured square with the department's first letter, using `DEPT_COLORS[dept]`.
- **Dept name** + sub-label showing "X people · Y transitions" (where transitions = number of distinct target levels in the dept).
- **ChevronRight icon** — visible only if `dept.total > 0`; nudges right on card hover.
- **Pipeline breakdown bar** — horizontal segmented bar, height 3px, showing proportional share of each tier. Segments: emerald (near-ready), sky (progressing), amber (developing), gray (early). Segments are only rendered when the tier count > 0. Tooltip on each segment shows count and tier name.
- **Average readiness** — shown as right-aligned label above the bar: "X% avg readiness".
- **Tier count grid** — 2×2 grid of coloured badges, one per tier, showing count. Badge background uses tier colour. Label shows truncated tier name (first word only).
- **Top candidate strip:**
  - If `nearReady > 0`: emerald background, Star icon, "Top candidate: **[Name]** (X% ready)"
  - If `nearReady === 0`: gray background, TrendingUp icon, "Highest: **[Name]** (X% ready)"
- **Empty state** (when `total === 0`): dashed border box with "No candidates tracked yet". Card is disabled (opacity 60%, default cursor, not clickable).

**Card interaction:**
- Cards with `total > 0` are clickable buttons.
- Hover: `shadow-lg`, slight upward translation (`-translate-y-0.5`).
- Click: `setSelectedDept(dept.department)` — navigates to `DeptPipelineView`.
- Focus: visible focus ring (gray, offset 2).

**Below the grid:**
- Keystone Partners upsell banner (`<UpsellBanner variant="leadership-dev" />`)
- Feedback banner (`<FeedbackBanner context="Promotion Pipeline" />`)

---

## 4. DeptPipelineView — department drill-down

**Component:** `DeptPipelineView.tsx`
**Route state:** `selectedDept !== null` (replaces the org-level view entirely)

### 4.1 Page header

**Left side — breadcrumb:**
- Back button: "← All departments" — calls `onBack()`. Navigates back to the org-level grid.
- Dept icon + name + headcount summary: "X people tracked across Y level transitions"

**Right side — action buttons:**
- **"Skill gap report" button** (ArrowRight icon) — calls `onNavigateToGapReport(department)`. Only rendered if prop is provided.
- **"Manager view" button** (Users icon) — calls `onNavigateToManagers()`. Only rendered if prop is provided.
- **Download button** — downloads a PDF of the department's pipeline data. See §8.
- **Email me button** — opens the Email modal pre-filled with department data.

**Tier summary pills (below the breadcrumb):**
One pill per tier that has at least one person. Pill shows: coloured circle + tier label + count. Tiers with zero people are hidden entirely.

### 4.2 Transition groups

People are grouped by their promotion transition (current level → target level). Each group is displayed as a section.

**Grouping logic:**
```
Map key: `${currentLevelId}→${targetLevelId}`
Within each group: sorted by readinessPct descending
Groups themselves: sorted by the minimum (most-junior) currentLevelId in the group
```

**Transition header:** "[Current Level] → [Next Level]" with "(Y people)" count.

**Four-column tier layout:**

Each transition section is divided into four columns — one per readiness tier:

| Column | Colour | Range |
|---|---|---|
| Near Ready | Emerald | 90%+ |
| Progressing | Sky | 70–89% |
| Developing | Amber | 50–69% |
| Early | Gray | <50% |

Column header shows: tier label (uppercase, tracking-widest), count badge, tier range (e.g. "90%+").

**Empty tier column:** Dashed border box with "None" label.

### 4.3 Candidate cards

Each person in a tier column is rendered as a `CandidateCard`:

- **Avatar** — circular, containing 2-letter initials. Background colour from `TIER_CONFIG[tier].bg`, border from `TIER_CONFIG[tier].border`.
- **Name** (bold), **team** (truncated with ellipsis)
- **Tier label** + **readiness %** (e.g. "Near Ready · 94%")
- **Readiness progress bar** — full width, thin, coloured by tier.
- **Metadata row:** location pin icon + location, clock icon + tenure in months, checkmark + "X/Y criteria met"

**Card interaction:**
- Click: opens `PersonPanel` with:
  - `result` = the clicked ReadinessResult
  - `peers` = all people in the same tier column (same transition group + same tier)
  - `currentIndex` = position of the clicked person within `peers`

### 4.4 Export content for department view

When exporting from `DeptPipelineView`, the text content includes:
```
[DEPT] PIPELINE
Generated: [date]
==================================================
[CurrentLevel] → [NextLevel] ([N] people)
  [Name] — [readinessPct]% ([tier label]) · [criteriaMet]/[criteriaTotal] criteria
  ...
```

---

## 5. PersonPanel — individual side panel

**Component:** `PersonPanel.tsx`
**Triggered by:** clicking any `CandidateCard` in `DeptPipelineView`

### 5.1 Layout

A full-height side panel that slides in from the right over the department view. Closes via the X button in the top-right corner calling `onClose()`.

### 5.2 Navigation controls

Shown when `peers` prop has more than one entry and `currentIndex` is defined:

- **Previous (←) button** — calls `onPrev()`. Disabled and visually faded when `currentIndex === 0`.
- **Next (→) button** — calls `onNext()`. Disabled and visually faded when `currentIndex === peers.length - 1`.
- **Counter** — "X of Y" showing current position in the peer list.

### 5.3 Person header

- Name (large bold)
- Team + Department
- Pills: location, tenure in months (e.g. "18m"), target level label (e.g. "IC3 → IC4")

### 5.4 Readiness score block

- **Tier badge** — coloured label (e.g. "Near Ready")
- **Readiness percentage** — large display number, coloured by tier (e.g. emerald for near-ready)
- **Criteria summary** — "X of Y criteria met"
- **Progress bar** — full-width, height 8px, coloured by tier, fills to `readinessPct%`

### 5.5 Met criteria section

Shown only when `metSkills.length > 0`. Header: "Meeting criteria" with a checkmark badge.

Each met skill shows:
- Skill name + category label
- **RatingDots** — 5 dots. For each dot position 1–5:
  - Filled (actual ≥ position AND position ≤ required): emerald (above/meeting requirement) or sky-blue (below required but counted — i.e. actual ≥ required is true, so these will all be emerald in met-skills)
  - Empty (position > actual): red-300 background if position ≤ required (required but not reached), gray-100 if position > required
- **Actual/Required label** — "X/Y" (e.g. "4/3")

### 5.6 Gaps to close section

Shown only when `gapSkills.length > 0`. Header: "Gaps to close" with a warning badge. Skills sorted descending by `gap` (required − actual).

Each gap skill shows:
- Skill name + category
- RatingDots (same logic as above — filled dots show actual rating, red empty dots show missing required levels)
- "X/Y" label where X < Y

### 5.7 Footer actions

Three buttons are shown at the bottom of the panel. These are currently placeholder interactions (no functionality wired):

| Button | Label |
|---|---|
| 1 | Set as focus skills → |
| 2 | Find mentors for gap skills → |
| 3 | Schedule check-in → |

### 5.8 RatingDots component

```
props: actual (1–5), required (1–5)
5 dots rendered for positions 1–5:
  position <= actual:
    if position <= required: emerald fill (meeting/exceeding)
    else: sky fill (above required — over-indexed)
  position > actual:
    if position <= required: red-300 fill (gap — required but not met)
    else: gray-100 fill (not required, not met — irrelevant)
```

---

## 6. FlightRiskTab — flight risk view

**Component:** `FlightRiskTab.tsx`
**Activated by:** `activeTab === 'flight-risk'`

### 6.1 Overview

Displays employees flagged by the Revelio Labs job-switching propensity model as at risk of leaving. Risk levels are `high` and `medium`. People are sorted by risk level descending, then by `daysSinceCheckIn` descending.

### 6.2 Header

- Title: "Flight Risk"
- **"Revelio Labs" badge** — sky background, citing the data source.
- Description: "Employees flagged by Revelio job-switching model, sorted by risk + days since last check-in."
- **Confidentiality notice** — lock icon + "For managers only · Confidential"

### 6.3 Summary strip

Three stat tiles in a row:

| Tile | Value | Background |
|---|---|---|
| High risk | count of `flightRisk === 'high'` | Red |
| Medium risk | count of `flightRisk === 'medium'` | Amber |
| Internal match available | count with `hasInternalOpportunity` | Sky |

**"View" button** on the Internal match tile — shown only when `withOpportunity > 0`. Clicking calls `onSwitchToHiddenTalent()` which switches the active tab to "Hidden Talent".

### 6.4 Filter pills

Three filter buttons: **All** / **High** / **Medium**, each showing the count in parentheses.

- Active: dark background (bg-gray-900), white text.
- Inactive: light gray background, gray text.

Clicking a filter sets `filter` state. The displayed cards are filtered accordingly:
- "All": shows all high + medium risk people
- "High": shows only `flightRisk === 'high'`
- "Medium": shows only `flightRisk === 'medium'`

### 6.5 Person cards

Each person is displayed as a `PersonCard` with an expand/collapse toggle.

**Collapsed state:**

- **Avatar** — 2-letter initials. A red dot indicator overlaid at the bottom-right corner if `flightRisk === 'high'`.
- **Name** + **Department pill** (coloured with `DEPT_COLORS[dept]`) + **current level label** + **team name**
- **Risk badge** — shows risk level in the appropriate colour (red/amber).
- **Expand button** (ChevronDown/ChevronUp icon) — toggles the expanded section.
- **Key signals row:**
  - Check-in recency: days since last check-in. Colour: red if > 60 days, amber if > 30 days, gray if ≤ 30 days.
  - Tenure: X months
  - Location
- **"Internal opportunity available" button** — shown only when `hasInternalOpportunity`. Clicking calls `onSwitchToHiddenTalent()`.

**Expanded state (additional content):**

- "Revelio Labs · Risk drivers" sub-header
- Bullet list of `flightRiskDrivers` strings
- Amber info box: "Suggested action: schedule a growth conversation, review comp and career trajectory, and consider internal mobility options."

### 6.6 Empty state

When no people match the active filter: a centred Zap icon + message prompting to check the Hidden Talent tab.

### 6.7 Footer note

Shown when `filtered.length > 0`. Reminder that flight risk data is for managers only and is not shown to employees.

---

## 7. HiddenTalent — cross-department fit view

**Component:** `HiddenTalent.tsx`
**Activated by:** `activeTab === 'hidden-talent'`

### 7.1 Overview

Surfaces employees whose LinkedIn-inferred skills suggest they would be a strong fit in a different department. Uses `getCrossDeptFitCandidates()` which computes both the person's readiness in their current role and their projected readiness in a candidate alternative role, then returns cases where the alternative fit is meaningfully higher.

### 7.2 Header

- Title: "Hidden Talent"
- **"LinkedIn-inferred" badge** (sky)
- Description: "People whose inferred skills suggest a better-fit function. Flight risk signals from Revelio."
- **Warning notice** — "For managers only · Not visible to employees"

### 7.3 High-risk alert banner

Shown when `highRiskCount > 0` (count of high-flight-risk people in the current filtered set):
> "X people flagged high flight risk — internal mobility conversations recommended this quarter"

Amber background, AlertTriangle icon.

### 7.4 Department filter pills

Shown only when `filterDept` prop is not set. Buttons for "All" + each department that has at least one candidate (current or suggested dept).

- Active: coloured background using `DEPT_COLORS[dept]`, white text.
- "All" button: dark background when active.
- Each dept button shows its candidate count in parentheses.

Clicking sets `selectedDept` state which filters the displayed candidates.

### 7.5 Sort toggle

Two sort modes:

| Button | Icon | Label | Sort logic |
|---|---|---|---|
| Most urgent | Zap | "Most urgent" | `FLIGHT_RISK_WEIGHT[flightRisk] + delta` descending |
| Best fit | ArrowUpDown | "Best fit" | `delta` descending |

```
FLIGHT_RISK_WEIGHT = { high: 100, medium: 50, low: 0 }
urgencyScore = FLIGHT_RISK_WEIGHT[flightRisk] + delta
```

Active sort button: white background with shadow. Inactive: gray text, no background.

### 7.6 Candidate cards

Each card represents one person with one cross-department fit opportunity.

**Card header (always visible):**
- **Avatar** — 2-letter initials. Red dot if `flightRisk === 'high'`.
- **Name** + **current dept pill** → **suggested dept pill** (arrow between them)
- **Δ% delta badge** — shows `fitPct − currentFit`. Colour: emerald if delta ≥ 30%, sky if ≥ 20%, amber if < 20%.
- **Expand button** (ChevronDown/ChevronUp)
- **Flight risk badge** (risk level)
- **Fit bars** — two side-by-side bars:
  - "Current dept fit": `currentReadinessPct%` bar + label
  - "Suggested dept fit": `fitPct%` bar + label
- **Top inferred signal** — LinkedIn icon + first `topInferredSignals` entry

**Expanded state (additional content):**
- **Flight risk drivers** (if `flightRiskDrivers` is non-empty): bulleted list
- **LinkedIn signals** (if `linkedInSignals` is non-empty): bulleted list
- **Inferred skills** section: list of skills with confidence badges (high/medium/low) driving the fit score
- **Framework match** summary: "Meets X of Y criteria for [Level]"
- **Amber disclaimer box**: "This is an opportunity signal, not a performance flag. Validate with manager before taking any action."

### 7.7 Empty state

When the filtered list is empty: empty state card with a message and suggestion to adjust the dept filter.

### 7.8 Footer note

Shown when candidates are visible. Reminds that hidden talent analysis is based on inferred signals and should be validated.

---

## 8. Export and download behaviour

Both the org-level view and the department drill-down view have `ExportButtons` in their headers, each with a **Download** button and an **Email me** button.

### 8.1 Download

**Behaviour:** Generates a PDF file representing the user's current view and triggers a browser download.

- **Org-level download filename:** `progression-promotion-readiness-pipeline.pdf`
- **Department download filename:** `progression-[dept-name]-pipeline.pdf`

**Org-level PDF content:**
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
  Top candidate: [Name] (X%)
...
```

**Department-level PDF content:**
```
[DEPT] PIPELINE
Generated: [date]
==================================================
[CurrentLevel] → [NextLevel] (X people)
  [Name] — X% ([tier]) · X/Y criteria
  ...
```

**Download button states:**
- Default: Download icon + "Download" text, white background, gray border.
- Downloading: spinner animation.
- Completed (2 seconds): green Check icon + "Downloaded" text, emerald background.
- Reverts automatically after 2 seconds.

### 8.2 Email me

Clicking **Email me** opens a modal dialog:

**Modal content:**
- Header: Mail icon + "Email this report"
- X close button (top-right)
- Report preview box showing the report title
- Email address input (autoFocused, Enter key submits)
- Disclaimer: "This opens your email client with the report pre-filled. Nothing is sent through Progression servers."
- "Open email client" button (disabled until email is non-empty)

**Send action:**
1. Calls `buildContent()` to generate the report text.
2. Opens `mailto:[email]?subject=Progression: [title]&body=[report text]` via `window.open()`.
3. Shows confirmation state: green checkmark + "Your email client has opened" + confirmation message with recipient address.
4. "Close" link appears to dismiss.

**Closing the modal:** X button, clicking the backdrop, or the post-send "Close" link.

**Privacy:** The report content is sent directly from the user's email client. No data passes through Progression servers.

---

## 9. Data model and computations

### 9.1 Source data

All data is static mock data in `promotionData.ts`:

- **PEOPLE** — 42 employees across 7 departments. Each person has: id, name, department, team, location, currentLevelId, skills (Record<skillId, 1–5>), tenure (months), lastCheckIn (ISO date). Optionally: inferredSkills, inferredNotes, linkedInSignals, flightRisk, flightRiskDrivers.
- **LEVEL_DEFINITIONS** — level hierarchy per department and track (IC/Manager). Each level has: id, label, shortLabel, track, department, nextLevel (id or null if terminal).
- **LEVEL_FRAMEWORKS** — per-level skill requirements. Each framework maps to one target levelId and contains an array of criteria: `{ skillId, skillName, category, requiredRating (1–5) }`.

### 9.2 `computeReadiness(person, framework, levelLabel)`

For each criterion in the framework:
```
if person.skills[skillId] >= requiredRating:
  → metSkills (includes: skillName, category, actualRating, requiredRating)
else:
  → gapSkills (includes: skillName, category, actualRating, requiredRating, gap = required - actual)

readinessPct = Math.round(metSkills.length / criteria.length * 100)
criteriaMet = metSkills.length
criteriaTotal = criteria.length
```

### 9.3 `getAllReadiness()`

For every person in PEOPLE:
1. Looks up `currentLevelId` in LEVEL_DEFINITIONS for the person's department.
2. If no `nextLevel` exists on the current level, the person is at the top of their track — skipped.
3. Looks up the framework for `nextLevel`.
4. If no framework exists for that level — skipped.
5. Calls `computeReadiness(person, framework, nextLevelLabel)`.
6. Returns the accumulated array of `ReadinessResult`.

People at the top of their level track, or in departments without defined frameworks for their next level, do not appear in pipeline data.

### 9.4 `getReadinessTier(pct)`

```
pct >= 90 → 'near-ready'
pct >= 70 → 'progressing'
pct >= 50 → 'developing'
else      → 'early'
```

### 9.5 Flight risk computation (`getFlightRiskPeople(minRisk)`)

Reference date: **2026-05-08** (hardcoded constant `REFERENCE_DATE`).

```
daysSinceCheckIn = Math.floor((REFERENCE_DATE - lastCheckIn) / (1000 * 60 * 60 * 24))
hasInternalOpportunity = person.inferredSkills exists and has at least one key
```

Filter: `p.flightRisk` is defined AND meets the minimum risk level threshold:
- `minRisk = 'high'`: only `flightRisk === 'high'`
- `minRisk = 'medium'`: `flightRisk === 'high'` OR `flightRisk === 'medium'`

Sort: risk level descending (high before medium), then `daysSinceCheckIn` descending (longer since check-in first).

Check-in recency colouring:
- > 60 days since check-in: **red**
- > 30 days: **amber**
- ≤ 30 days: **gray**

### 9.6 Cross-department fit computation (`getCrossDeptFitCandidates()`)

Constants:
```
ROLE_FIT_MIN_SUGGESTED = 50   // minimum fit % in suggested dept to qualify
ROLE_FIT_MIN_DELTA = 20       // minimum improvement over current fit to qualify
```

**Merged skills:** Before scoring, inferred skills are merged with assessed skills with a one-level discount:
```
for each inferredSkill not in assessed skills:
  merged[skillId] = Math.max(1, inferredRating - 1)
```

**Scoring a person against a framework:**
```
met = count of criteria where merged[skillId] >= requiredRating
score = Math.round(met / criteria.length * 100)
```

**Current dept fit:**
```
Max score of person against all IC frameworks in their current department
Floored at 20 (minimum baseline)
```

**Level rank (`icRank`):**
```
ic4 or m2 → 4
ic3 or m1 → 3
ic2       → 2
else      → 1
```

**Candidate qualification:**
- Must have `inferredSkills`
- Target framework must be IC track, different department from current
- Target level rank must be within ±1 of person's current rank
- `fitPct >= ROLE_FIT_MIN_SUGGESTED`
- `delta = fitPct - currentFit >= ROLE_FIT_MIN_DELTA`

**Deduplication:** If a person qualifies for multiple target departments, only the highest-delta match is kept.

**Final sort:** Descending by `delta`.

---

## 10. Readiness tiers

| Tier key | Label | Range | Dot colour | Bar colour | Badge bg |
|---|---|---|---|---|---|
| `near-ready` | Near Ready | 90%+ | Emerald | bg-emerald-500 | Emerald light |
| `progressing` | Progressing | 70–89% | Sky | bg-sky-500 | Sky light |
| `developing` | Developing | 50–69% | Amber | bg-amber-400 | Amber light |
| `early` | Early Stage | <50% | Gray | bg-gray-300 | Gray light |

---

## 11. Constants and configuration

| Constant | Value | Location | Purpose |
|---|---|---|---|
| `CHECKIN_CUTOFF` | 2026-04-29 | PromotionPipeline.tsx:32 | Baseline date for check-in coverage calculation |
| `REFERENCE_DATE` | 2026-05-08 | promotionData.ts | Baseline date for `daysSinceCheckIn` calculation |
| `ROLE_FIT_MIN_SUGGESTED` | 50 | promotionData.ts | Minimum fit % for a cross-dept match to qualify |
| `ROLE_FIT_MIN_DELTA` | 20 | promotionData.ts | Minimum improvement over current fit to qualify |
| `DEPT_SALARIES` | See §3.3 table | PromotionPipeline.tsx:22 | Per-dept salary assumption for total cost card |
| `DEPT_COLORS` | Hex/RGB strings | promotionData.ts | Colour per department (used for cards, bars, pills) |
| `TIER_CONFIG` | Object keyed by tier | promotionData.ts | Label, colour classes per readiness tier |
| `TIER_RANGES` | Object keyed by tier | promotionData.ts | Range label string per tier (e.g. "90%+") |
| `FLIGHT_RISK_WEIGHT` | `{high:100, medium:50, low:0}` | HiddenTalent.tsx:27 | Weight added to delta for urgency sort |
