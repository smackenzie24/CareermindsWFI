# Promotion Pipeline — Product Tickets

**Feature area:** Workforce Intelligence › Promotion Readiness Pipeline
**Surfaces covered:** Org-level pipeline view · Department drill-down (kanban) · Individual person panel · Hidden Talent tab · Flight Risk tab · Export (PDF & email)
**Ticket range:** T-01 – T-21

---

## Table of Contents

- [T-01 Org-level page header](#t-01-org-level-page-header)
- [T-02 Org-level stat cards](#t-02-org-level-stat-cards)
- [T-03 Expandable org summary section](#t-03-expandable-org-summary-section)
- [T-04 Tab bar](#t-04-tab-bar)
- [T-05 Tier legend bar](#t-05-tier-legend-bar)
- [T-06 Department cards](#t-06-department-cards)
- [T-07 Department drill-down: header and breadcrumb](#t-07-department-drill-down-header-and-breadcrumb)
- [T-08 Department drill-down view](#t-08-department-drill-down-view)
- [T-09 Individual person panel: layout and navigation](#t-09-individual-person-panel-layout-and-navigation)
- [T-10 Individual person panel: readiness and criteria detail](#t-10-individual-person-panel-readiness-and-criteria-detail)
- [T-11 Readiness calculation](#t-11-readiness-calculation)
- [T-12 Pipeline inclusion rules](#t-12-pipeline-inclusion-rules)
- [T-13 Flight Risk tab](#t-13-flight-risk-tab)
- [T-14 Hidden Talent tab](#t-14-hidden-talent-tab)
- [T-15 Cross-dept fit calculation (Hidden Talent)](#t-15-cross-dept-fit-calculation-hidden-talent)
- [T-16 Internal mobility bridge (Flight Risk ↔ Hidden Talent)](#t-16-internal-mobility-bridge-flight-risk--hidden-talent)
- [T-17 Export and sharing (PDF + email)](#t-17-export-and-sharing-pdf--email)
- [T-18 Cross-feature navigation links](#t-18-cross-feature-navigation-links)
- [T-19 Empty and zero states](#t-19-empty-and-zero-states)
- [T-20 Readiness tiers — colour and label reference](#t-20-readiness-tiers--colour-and-label-reference)
- [T-21 Individual person panel: "Schedule check-in" action — DECISION REQUIRED](#t-21-individual-person-panel-schedule-check-in-action--decision-required)

---

## T-01 Org-level page header

**Summary:** The persistent header at the top of the Promotion Readiness Pipeline page. Always visible across all three tabs.

### Header content

**Left side:**
- Eyebrow label: "Workforce Intelligence" — small, all-caps, wide letter-spacing, muted colour
- Page title: "Promotion Readiness Pipeline"
- Subtitle: "Who's close to the next level? Click a department to see individual readiness scores and skill gaps."

**Right side (arranged in a row):**
- Export controls — Download and Email me buttons. See T-17.
- Live data indicator: a small pulsing dot (green) followed by the organisation name ("Acme Corp"). This signals that the data is live and company-specific.

### Behaviour
- The header scrolls with the page. To export, the user must scroll back to the top if they have scrolled down past the header.

---

## T-02 Org-level stat cards

**Summary:** Four summary numbers shown below the header, always visible across all tabs. These give at-a-glance answers to the most important pipeline questions.

### Cards

| Card | Label | Value | Sub-label | Colour treatment |
|---|---|---|---|---|
| 1 | Tracked for promotion | Total headcount with a defined next level and an assessment framework | "people assessed org-wide" | Neutral |
| 2 | Near ready (90%+) | Count of people scoring 90% or above against their next-level criteria | "meet 90%+ of next-level criteria" | Green |
| 3 | Progressing (70–89%) | Count of people scoring 70–89% | "on track, closing gaps" | Sky blue |
| 4 | Avg readiness score | Average readiness percentage across all pipeline-tracked people | "avg Xm in current level" (months) | Neutral |

### Data

`promotionData.ts` · `Person` object
- `person.tenure` — `number` — months in current level (used for avg tenure sub-label)
- `getAllReadiness()` — returns `ReadinessResult[]`, each with `{ person, readinessPct, metSkills, gaps, currentLevel, targetLevel }`

### Calculation rules

**Who is "tracked for promotion"?**
A person is counted in the pipeline if and only if:
1. Their current level exists in the level hierarchy
2. Their current level is not a terminal level (i.e. there is a defined next level)
3. The next level has an assessment framework (a defined set of skill criteria)

People at a terminal level (the top of their track) are excluded. People whose next level exists but has no framework are also excluded.

**Near ready count:** Count of pipeline-tracked people with a readiness score ≥ 90%.

**Progressing count:** Count with a score ≥ 70% and < 90%.

**Avg readiness score:** `sum of all individual readiness percentages ÷ total pipeline-tracked headcount`, rounded to the nearest whole number. Displays as a percentage (e.g. "74%"). If there are no tracked people, show "0%".

**Avg tenure sub-label:** The average number of months pipeline-tracked people have been in their current level. Displayed as "avg Xm in current level" (e.g. "avg 14m in current level"). Rounded to the nearest whole number.

### Layout
Four equal-width cards in a row. Refer to interactive design for the card style.

---

## T-03 Expandable org summary section

**Summary:** A collapsible section below the stat cards containing four additional org-level data points: check-in coverage, estimated salary cost, average salary, and a headcount bar chart. Expanded by default.

### Data

`promotionData.ts` · `Person` object
- `person.lastCheckIn` — `string` (ISO date, e.g. `"2026-04-15"`) — date of last recorded check-in
- `person.department` — `string` — used to look up salary assumption

Salary assumptions and the cutoff date (`CHECKIN_CUTOFF = new Date('2026-04-29')`) are hardcoded constants in the component. When connected to live data the cutoff becomes `new Date()`.

### Toggle control

A centred button below the stat cards:
- When expanded: up-chevron icon + label "Hide org summary"
- When collapsed: down-chevron icon + label "Show org summary"
- Hover: label darkens

### Cards when expanded

Four equal-width cards in a row.

---

**Card 1 — Check-in Coverage**

Label: "Check-in Coverage"

Value: the percentage of all employees who have had a check-in logged within the past 30 days, expressed as a whole number followed by "%".

**How it is calculated:**
- A fixed cutoff date is used as the reference point (this will be replaced by "today" when connected to live data).
- For each employee, calculate the number of calendar days between their last check-in date and the cutoff.
- An employee counts as "covered" if that number is 30 or fewer days.
- Coverage % = number covered ÷ total employees × 100, rounded to the nearest whole number.

**Colour treatment:**
- If coverage is 80% or above: the icon and number are shown in green.
- If coverage is below 80%: the icon and number are shown in amber.

Sub-label: "checked in (30d)"

---

**Card 2 — Est. Total Cost**

Label: "Est. Total Cost"

Value: the estimated total annual salary spend across all tracked employees, formatted as a currency figure.

**How it is calculated:**
- A standard annual salary figure is applied per department (see the salary assumptions table below).
- The total is the sum of the relevant salary for every employee in the dataset.

**Salary assumptions by department:**

| Department | Annual salary assumption |
|---|---|
| Engineering | $128,000 |
| Product | $118,000 |
| Data | $122,000 |
| Design | $102,000 |
| Sales | $95,000 |
| People Ops | $90,000 |
| Marketing | $88,000 |

**Currency formatting:**
- $1,000,000 or above: show as "$X.XM" (one decimal place, e.g. "$4.7M")
- $1,000 to $999,999: show as "$XK" (no decimal, e.g. "$485K")
- Below $1,000: show as "$X"

Sub-label: "annual salaries"

---

**Card 3 — Avg Salary**

Label: "Avg Salary"

Value: estimated average annual salary per employee.

**How it is calculated:** Total estimated cost (Card 2) ÷ total number of employees in the dataset, rounded to the nearest whole dollar. Apply the same currency formatting as Card 2.

Sub-label: "per employee"

---

**Card 4 — Team Headcount**

Label: "Team Headcount"

Content: a small horizontal bar chart, one row per department, sorted from highest to lowest headcount.

Each row shows:
- Department name (truncated if necessary)
- Employee count (right-aligned)
- A proportional horizontal bar below the label row

**Bar width calculation:** Each bar is proportional to the department with the most employees. The largest department's bar fills the full available width; all others are scaled proportionally.

**Bar colour:** each department has a fixed colour used consistently throughout the pipeline (refer to interactive design for the colour assigned to each department).

---

## T-04 Tab bar

**Summary:** Three tabs that switch the content area below the stat cards. The stat cards and org summary remain visible on all tabs.

### Tabs

| Tab | Label | Icon | Badge |
|---|---|---|---|
| 1 | Pipeline | People/grid icon | None |
| 2 | Hidden Talent | Sparkle icon | Count of cross-dept fit candidates, shown when > 0 |
| 3 | Flight Risk | Warning triangle icon | Count of high-risk people only, shown when > 0 |

### Behaviour
- Clicking a tab switches the content area immediately. No page reload.
- The active tab has a bottom border indicator and its label is at full opacity.
- Inactive tabs are muted; they darken on hover.
- The Pipeline tab badge is never shown.
- The Hidden Talent badge uses a sky-blue colour scheme.
- The Flight Risk badge uses a red colour scheme.

### Badge counts
- **Hidden Talent badge:** The total number of people surfaced by the cross-dept fit algorithm across all departments. See T-15 for the algorithm.
- **Flight Risk badge:** The count of people flagged as **high** risk only (not medium). Medium-risk people are included on the tab but do not contribute to the badge.

---

## T-05 Tier legend bar

**Summary:** A reference strip showing the four readiness tiers and their score ranges. Helps users interpret the pipeline at a glance.

Shown only when the Pipeline tab is active. Not shown on Hidden Talent or Flight Risk.

### Tiers

| Tier | Label | Score range |
|---|---|---|
| Near Ready | Near Ready | 90% and above |
| Progressing | Progressing | 70% to 89% |
| Developing | Developing | 50% to 69% |
| Early Stage | Early Stage | Below 50% |

Each entry shows a small filled circle in the tier colour, the tier label, and the score range. Refer to interactive design for the colour assigned to each tier. See also T-20 for the full colour reference.

---

## T-06 Department cards

**Summary:** The main content area of the Pipeline tab. One card per department, laid out in a responsive grid. Each card is the entry point to the department drill-down and contains the pipeline breakdown bar and tier count grid.

### Data

`promotionData.ts` · `getAllReadiness()` returns `ReadinessResult[]`. Group by `result.person.department` to build per-department stats.

**Top candidate:** the single person with the highest `readinessPct` in the department — not necessarily a Near Ready person. Display label switches based on whether anyone in the department is Near Ready, but the person shown is always the highest scorer.

### Grid behaviour
- Cards are arranged in a multi-column grid that adjusts to screen width (1 column on small screens, up to 3 columns on large screens).
- Cards are ordered by the fixed department list — they do not reorder dynamically.

### Card — active state (department has tracked candidates)

Each department card shows:

**Header row:**
- A coloured square icon showing the department's initial letter (department colour is fixed — refer to interactive design)
- Department name
- Sub-label: "X people · Y transition" (or "Y transitions" if more than one)
- A right-facing chevron that nudges right slightly on hover

**Pipeline breakdown bar:**

A single horizontal bar representing the proportion of people in each tier.

- The bar is divided into up to four coloured segments, one per tier.
- Each segment's width is `(count in tier ÷ total in department) × 100%`.
- Segments are rendered in order: Near Ready, Progressing, Developing, Early Stage. A segment is omitted entirely if its count is zero.
- A 1-pixel gap between segments creates a visible separator.
- Each segment has a tooltip on hover showing the count, e.g. "3 near ready".
- Bar label row (above the bar): left "Pipeline breakdown", right "[X]% avg readiness" — average readiness for the department, bold.

**Average readiness calculation:** sum of all individual readiness percentages in the department ÷ department headcount, rounded to the nearest whole number.

**Tier count grid:**

Four equal cells in a row, one per tier. Each cell shows:
- The count of people in that tier (large, bold number) in the tier colour
- The first word of the tier label only: "Near", "Progressing", "Developing", "Early"
- The cell background uses the tier's background colour

**Top candidate strip:**
- If at least one person is Near Ready: show their name and score with the label "Top candidate: [Name] (X% ready)". Strip uses a green tint.
- If no one is Near Ready: show the person with the highest score with the label "Highest: [Name] (X% ready)". Strip uses a neutral tint.

### Card — empty state (no tracked candidates)

The card is shown in a disabled, low-opacity state. The body is replaced with the message "No candidates tracked yet". The card is not clickable.

### Card — click behaviour

Clicking an active card navigates to the department drill-down view (T-07, T-08). The pipeline page is replaced in its entirety by the drill-down.

### Below the grid

- A leadership development upsell module appears beneath the department grid.
- A feedback prompt ("How useful is this view?") appears below the upsell.

---

## T-07 Department drill-down: header and breadcrumb

**Summary:** When a user clicks a department card, the full pipeline page is replaced by the department drill-down. This ticket covers the header and breadcrumb navigation at the top of that view.

### Breadcrumb

A row at the top of the page:
- Back button: left-arrow icon + "All departments". Clicking returns to the org-level pipeline grid.
- Separator: "/"
- Current location: the department's coloured icon (small) + department name

### Page header

**Left side:**
- The department's coloured icon (larger)
- Department name + "· Promotion Pipeline"
- Sub-label: "X people tracked across Y level transitions"

**Right side (row):**
- Export controls — Download and Email me. See T-17.
- "Skill gap report" link button (with external-link icon): navigates to the Skills Gap Heatmap filtered to this department. Only shown if this navigation is available in the current context.
- "Manager view" link button (with external-link icon): navigates to the Manager Effectiveness view. Only shown if this navigation is available in the current context.
- Tier summary pills: one pill per tier that has at least one person. Each pill shows the count and the tier label. Tiers with zero people are hidden.

---

## T-08 Department drill-down view

**Summary:** The kanban board shown below the header in the department drill-down. Organised by promotion transitions, each containing four tier columns and candidate cards.

### Transition grouping

People in the department are grouped by their unique current-level → target-level pair. Within each group, people are sorted by readiness percentage, highest first.

**Transition section header:**
- Current level label shown as a pill (e.g. "IC2")
- Right-arrow separator
- Target level label shown as a darker pill. The target label is trimmed to remove the level code prefix — for example "IC3 · Senior Engineer" is displayed as "Senior Engineer".
- Count in parentheses: "(N people)"

Section order follows the order encountered when iterating the people list.

### Kanban columns

Each transition section contains four columns — one per readiness tier.

| Column | Tier | Score range |
|---|---|---|
| 1 | Near Ready | 90%+ |
| 2 | Progressing | 70–89% |
| 3 | Developing | 50–69% |
| 4 | Early Stage | Below 50% |

Each column header shows:
- The tier name in the tier colour, all-caps
- A count badge in the tier colour
- The score range (e.g. "90%+") in a small, muted font

**Empty column:** If a tier has no people, the column body shows a dashed placeholder with the word "None".

### Candidate cards

Each person in the kanban is shown as a card. Cards within a column are ordered highest readiness first.

**Card contents:**
- Avatar: circular/rounded, showing the person's two-letter initials. Background uses a consistent neutral gradient.
- Name (truncated if necessary)
- Team name (truncated, muted)
- Readiness label: the tier name in the tier colour + the readiness percentage
- Readiness bar: a short horizontal progress bar filled to the readiness percentage, in the tier colour
- Metadata row: location · tenure in months (e.g. "18m") · criteria count ("X/Y criteria")

**Card — hover state:** Slight upward lift and shadow appear on hover.

**Card — click behaviour:** Clicking a card opens the individual person panel (T-09, T-10) as a right-side slide-in panel. The kanban remains visible behind the panel.

**Peer context for navigation:** When a card is opened, the system records which other cards are in the same tier column. The person panel's prev/next navigation moves through those peers only.

---

## T-09 Individual person panel: layout and navigation

**Summary:** A right-side panel that slides in when a candidate card is clicked. Covers the structural layout, peer navigation controls, and footer action buttons.

### Layout

The panel slides in from the right. Clicking the backdrop closes it. A close button (×) in the top-right also closes it.

The panel has three vertical sections:
1. Header — person identity and meta information
2. Readiness score block — the headline score and tier (see T-10)
3. Criteria breakdown — scrollable list of met criteria and gaps (see T-10)

The criteria section scrolls independently; the header and score block remain visible while scrolling.

### Data / state

Panel receives two props from the kanban:
- `selection: { result: ReadinessResult, peers: ReadinessResult[], index: number }` — the opened person plus all others in the same tier column, sorted highest readiness first
- `onClose: () => void`

Peer navigation updates `index` and swaps `result` to `peers[newIndex]`.

### Peer navigation

When there are multiple people in the same tier column:
- "Prev" button with left-chevron: moves to the previous person. Disabled when on the first person.
- "Next" button with right-chevron: moves to the next person. Disabled when on the last person.
- Position counter: "X of Y" (1-indexed).

If there is only one person in the column, navigation controls are not shown.

### Person header

- Avatar: rounded square, two-letter initials on a neutral dark gradient background
- Full name (large, bold)
- Team · Department (muted)
- Meta pills in a row (wrapping on small screens):
  - Location (with pin icon)
  - Tenure in current level: "Xm in current level" (with clock icon)
  - Target level: trimmed to role title only (with people icon)

### Footer actions

Three action buttons pinned to the bottom of the panel. They do not scroll away.

| Button | Status |
|---|---|
| View latest check-in → | Implemented — navigates to the Decisions Journal |
| Ask AI → | Implemented — opens Ask AI pre-filled with the person's name and readiness context |
| Schedule check-in → | Placeholder — see T-21 for the decision required before this can be built |

All three buttons are always displayed, regardless of whether the person has gaps or not.

---

## T-10 Individual person panel: readiness and criteria detail

**Summary:** The content body of the person panel. Covers the headline readiness block, the criteria breakdown list, and the five-dot skill rating visualisation used in each criterion row.

### Readiness score block

**Top row:**
- Left: label "Readiness for" (small, muted, all-caps) above the full target level label (e.g. "IC3 · Senior Engineer")
- Right: readiness tier badge (e.g. "Near Ready" in green)

**Score:**
- The readiness percentage in a very large font, in the tier colour
- Below it: "X of Y criteria met"

**Progress bar:**
- Full-width horizontal bar filled to the readiness percentage, in the tier colour
- A subtle transition animation plays when the panel opens or when navigating between people

**Block background:** Uses the tier's background colour (e.g. light green for Near Ready).

### Criteria breakdown

**Met criteria section**

Label: "Meeting criteria (N)" with a green check-circle icon. Only shown if the person meets at least one criterion.

Each met criterion row:
- Skill name
- Skill category (muted, smaller text)
- Five-dot rating visual (see below)
- Score label: "X/Y" where X is the person's actual rating and Y is the required rating
- Row background: light green tint

**Gaps to close section**

Label: "Gaps to close (N)" with a warning-circle icon in red. Only shown if the person has at least one gap.

Each gap row:
- Skill name, skill category, five-dot visual, score label "X/Y" in red
- Row background: light red tint
- Sort order: gaps sorted by gap size, largest first (required − actual)

### Five-dot skill rating visualisation

Five dots in a row representing skill rating levels 1–5 (left to right).

| Condition | Dot appearance |
|---|---|
| At or below person's rating AND at or below required rating | Filled, sky blue |
| At or below person's rating AND above required rating | Filled, green (exceeds requirement) |
| Above person's rating AND at or below required rating | Empty with red tint (gap) |
| Above person's rating AND above required rating | Empty, neutral grey (not relevant) |

---

## T-11 Readiness calculation

**Summary:** The foundational calculation that produces the readiness percentage shown throughout the pipeline. Every number in the pipeline derives from it.

### Data

`promotionData.ts`
- `person.skills` — `Record<skillId: string, rating: number>` — assessed skill ratings (1–5). A missing skill is treated as 0.
- `LEVEL_FRAMEWORKS` — static constant mapping `levelId → LevelFramework`. Each framework has `criteria: SkillCriterion[]`, each with `{ skillId, name, category, requiredRating }`.
- `computeReadiness(person, framework)` — the canonical function. Returns `{ readinessPct, metSkills, gaps }`.

### Where the next-level career step data comes from

**1. Level hierarchy (`LEVEL_DEFINITIONS`)**

A static configuration list that defines every level in the organisation. Each entry specifies the level's ID, display label, short code, department, track (IC or Manager), and the ID of the next level up (or null for terminal levels).

**2. Skills frameworks (`LEVEL_FRAMEWORKS`)**

For each target level, a framework specifies the skill criteria required for promotion to that level — each criterion names a skill, its category, and the minimum rating required (1–5 scale).

A person can only appear in the pipeline if their target level has a framework. See T-12.

**In the current product:** Both are configuration managed by Progression, not editable by end users.

### Inputs

- The person's skill ratings: a set of skill IDs mapped to a self-assessed rating from 1 to 5
- The target level's framework: a list of criteria, each with a skill ID, name, category, and required rating

### Calculation

For each criterion in the target level's framework:

1. Look up the person's rating for that skill. If none, treat as 0.
2. If the person's rating is **equal to or above** the required rating: the criterion is met.
3. If below: the criterion is a gap. Gap size = `required rating − actual rating`.

Readiness percentage = `criteria met ÷ total criteria × 100`, rounded to the nearest whole number.

**Important:** Only assessed skills are used. LinkedIn-inferred skills (used in the Hidden Talent algorithm) do not affect the readiness score.

### Examples

8 criteria, 6 met: `6 ÷ 8 × 100 = 75%` → Progressing
10 criteria, 9 met: `9 ÷ 10 × 100 = 90%` → Near Ready
10 criteria, 4 met: `4 ÷ 10 × 100 = 40%` → Early Stage

---

## T-12 Pipeline inclusion rules

**Summary:** Defines who is included in the pipeline and who is excluded.

### Data

`promotionData.ts`
- `LEVEL_DEFINITIONS` — static array of `LevelDefinition` objects: `{ id, label, shortCode, department, track, nextLevel: string | null }`. A `null` nextLevel means terminal.
- `LEVEL_FRAMEWORKS` — static map of `levelId → LevelFramework`. Only levels in this map can appear in the pipeline.
- `getAllReadiness()` — applies both constants to the full `PEOPLE` array and returns all included people as `ReadinessResult[]`.

### The four tiers are outcomes of one calculation — not separate categories

Near Ready, Progressing, Developing, and Early Stage are not separate groups with separate frameworks. They are all the result of the same readiness calculation (T-11) run against the same framework.

Every included person goes through the same process:
1. Their target level's framework is looked up
2. Their assessed skill ratings are compared against every criterion
3. A percentage is produced: criteria met ÷ total criteria × 100
4. That percentage is classified into one of the four tiers

**Frameworks defined in the current dataset:**

| Target level | Department |
|---|---|
| IC2 | Engineering |
| IC3 | Engineering, Product, Design, Data, Marketing, Sales |
| IC4 | Engineering, Product |
| M1 | People Ops |

### Included

A person is included if:
1. Their current level exists in the level hierarchy
2. Their current level is not the top of their track
3. The next level has a defined skills framework

### Excluded

| Reason | Example |
|---|---|
| At a terminal level | A Staff Engineer at IC4 — there is no IC5 |
| Next level has no framework yet | Entry-level positions (e.g. IC1) and most manager levels |

---

## T-13 Flight Risk tab

**Summary:** The Flight Risk tab surfaces employees who, based on external signals, are considered likely to leave. Data comes from Revelio Labs. All content is confidential and for managers only.

### Data

`promotionData.ts` · `Person` object — **mock data** (no live Revelio Labs connection in the current build)
- `person.flightRisk` — `'high' | 'medium' | 'low' | undefined`
- `person.flightRiskDrivers` — `string[]` — human-readable risk signals (e.g. "LinkedIn profile updated 6 times in 30 days")
- `person.lastCheckIn` — `string` (ISO date) — used to compute days-since-check-in

`getFlightRiskPeople(riskLevel?)` in `promotionData.ts` — filters to flight-risk people, computes `daysSinceCheckIn` and `hasInternalOpportunity` (true if `person.inferredSkills` is non-empty), and sorts: high risk first, then by `daysSinceCheckIn` descending.

### Header

**Left:**
- Warning triangle icon + label "Flight Risk"
- A "Revelio Labs" badge
- Description: "Employees flagged by Revelio Labs' job-switching propensity model. Sorted by risk level and days since last check-in."

**Right:**
- Confidentiality notice: "For managers only · Confidential" with a shield icon and amber background. Always visible, not dismissable.

### Summary stat strip

Three tiles:

| Tile | Value | Colour |
|---|---|---|
| High risk | Count of high-risk people | Red |
| Medium risk | Count of medium-risk people | Amber |
| Internal match available | Count of flight-risk people who also appear in Hidden Talent | Sky blue |

The "Internal match available" tile includes a "View" button when the count is above zero. Clicking switches to the Hidden Talent tab. See T-16.

### Filter pills

Three filters:
- "All (N)" — default
- "High risk (N)"
- "Medium risk (N)"

The active filter pill is visually distinct. Counts update dynamically.

### Sort order (always applied, not user-configurable)

1. By risk level — high risk before medium risk
2. Within each risk level, by days since last check-in, most overdue first

### Person cards

One card per flagged person.

**Always-visible content:**

- Avatar: rounded square with two-letter initials. Background: department colour. Red indicator dot for high-risk people only.
- Identity row: full name · department pill · level short code · team name
- Risk badge: coloured pill with dot + label ("High flight risk" / "Medium flight risk")
- Expand/collapse chevron button
- Key signals row:
  - Days since last check-in — red if >60 days, amber if 31–60, neutral if ≤30
  - Tenure at current level + location (e.g. "28m at level · London")
  - If person also appears in Hidden Talent: "Internal opportunity available →" link (see T-16)

**Expanded content:**

- **Risk drivers section:** "Revelio Labs · Risk drivers" header + bulleted list of signals (e.g. "LinkedIn profile updated 6 times in 30 days", "Below-band compensation")
- **Suggested action box:** "Suggested action: schedule a growth conversation, review comp against market, and explore internal mobility if applicable." Standard message, not personalised.
- Expanded background uses the risk level colour lightly applied.

### Empty state

If no people are flagged (or none match the active filter): "No flight risk signals detected" + "Connect Revelio Labs to surface real-time job-switching propensity data."

### Footer note

"Flight risk scored by Revelio Labs job-switching propensity model. Factors include LinkedIn activity, tenure plateau, compensation gap, and engagement signals. For internal retention use only."

---

## T-14 Hidden Talent tab

**Summary:** The Hidden Talent tab identifies people whose LinkedIn-inferred skills suggest they would perform better in a different function. All content is for managers only and should not be shared with employees.

### Data

`promotionData.ts` · `Person` object — **mock data** (no live LinkedIn or Revelio Labs connection in the current build)
- `person.inferredSkills` — `Record<skillId: string, number>` — LinkedIn-inferred ratings (1–5), confidence-discounted before use
- `person.inferredNotes` — `InferredSkillNote[]` — each `{ skillId, note }` e.g. "2 years as PM at Stripe"
- `person.linkedInSignals` — `string[]` — career history items shown in the expanded card

`getCrossDeptFitCandidates()` in `promotionData.ts` — returns `CrossDeptFitResult[]`, each with `{ person, suggestedDept, currentFit, suggestedFit, fitDelta, topSignal, flightRisk, ... }`. See T-15 for the algorithm.

### Header

**Left:**
- Sparkle icon + label "Hidden Talent"
- A "LinkedIn-inferred" badge
- Description: "People whose inferred skills suggest a better-fit function. Flight risk signals from Revelio Labs show who needs a conversation now."

**Right:**
- Notice: "For managers only · Not visible to employees" with a warning triangle and amber background. Always visible, not dismissable.

### High-risk alert banner

Shown only when at least one person in the current filtered view is also flagged as high flight risk:

"[N] person/people flagged high flight risk — internal mobility conversations recommended this quarter."

Count reflects the filtered view and updates when the department filter changes.

### Department filter pills

- "All (N)" — default
- One pill per department that has at least one connected candidate. Departments with zero relevant candidates are hidden.

Active pill: highlighted in the department colour. Inactive: neutral, darkens on hover.

### Sort toggle

Two options:
- "Most urgent": weights flight risk heavily and adds fit improvement delta. High-risk people with large fit deltas appear first.
- "Best fit": sorts purely by fit improvement delta, largest first.

**Urgency score formula:** `flight risk weight + fit delta`
- High risk: weight 100
- Medium risk: weight 50
- Low risk or none: weight 0

Default sort is "Most urgent".

### Candidate cards

One card per person identified as a potential cross-department fit.

**Always-visible content:**

- Avatar: rounded square with two-letter initials. Background: person's current department colour. Red indicator dot if also flagged as high flight risk.
- Name + transition row: full name, current department pill → arrow → suggested department pill
- Fit delta badge: "↗ +X%" — colour: green if ≥30 points, sky blue if 20–29, amber below 20
- Expand/collapse chevron
- Flight risk badge: coloured dot + label
- Fit comparison bars: two side-by-side horizontal bars — "Current dept fit" and "[Suggested dept] fit". Each has a percentage label. Bar colours use the respective department colour.
- Top inferred signal: the most significant LinkedIn signal driving the suggested fit (e.g. "2 years as PM at Stripe"). LinkedIn icon to the left. Only the first signal shown in collapsed view.

**Expanded content (up to five sections, each only if it has content):**

1. **Flight risk drivers** (if flagged): "Revelio Labs · Flight risk drivers" + bulleted list
2. **LinkedIn history** (if available): header + bulleted list of prior roles
3. **Inferred skills driving fit** (if available): header + list of skills with confidence labels — High (green), Medium (amber), Low (neutral)
4. **Framework match** (always shown): "Meets X of Y criteria for [suggested level label]"
5. **Framing disclaimer** (always shown): "This is an opportunity signal, not a performance flag. Share with the employee as a career conversation starter — not a directive." Shown in a soft amber info box.

### Empty state

When no candidates are found for the current filter: "No cross-fit candidates detected" + "Upload LinkedIn data for more employees to surface hidden strengths."

### Footer note

"Fit scores use Revelio Labs LinkedIn data discounted one level for confidence. Flight risk from Revelio Labs job-switching propensity model. For internal use only."

---

## T-15 Cross-dept fit calculation (Hidden Talent)

**Summary:** Defines how the system identifies people who would be a better fit in a different department.

### Data

All inputs from `promotionData.ts`. Key implementation details:
- Level distance is computed via `icRank()` which maps `IC1→1, IC2→2, IC3→3, IC4→4, M1→1, M2→2`. "Within one level" means `Math.abs(targetRank - personRank) <= 1`.
- Confidence discount: `Math.max(1, inferredRating - 1)` — floors at 1, never 0.
- Assessed skill takes precedence when both assessed and inferred ratings exist for the same skill.
- Deduplication keeps the single `CrossDeptFitResult` with the largest `fitDelta` per person.

### Step 1 — Establish the person's current fit baseline

For each person who has LinkedIn-inferred skills on file:
- Look up their readiness percentage against their current next-level framework (assessed skills only).
- Use this as the "current fit" baseline, with a floor of 20%.

Example: a person scoring 35% readiness → baseline of 35%. A person with no defined pathway → 20% floor.

### Step 2 — Score the person against target frameworks in other departments

For each skills framework in other departments:
- Check the target level is on the IC track (manager roles are excluded).
- Check the target level is within one level of the person's current level.
- Calculate a "fit score" using a merged skill set:
  - Assessed skills used at full face value
  - Inferred skills included at one level below their inferred value (confidence discount). If a skill has both an assessed and inferred rating, assessed takes precedence.
- Fit score = `criteria met ÷ total criteria × 100`, rounded to the nearest whole number.

**Inclusion criteria for a match:**
- Fit score must be 50% or above
- Fit delta (improvement over current baseline) must be 20 percentage points or more

### Step 3 — Deduplicate

Only the single best match (largest fit delta) is kept per person. All lower-ranked matches are discarded.

### Step 4 — Sort

Final list is sorted by fit delta, largest first, before any user-applied filters or sort toggle.

### What the delta badge shows

The fit delta is the difference between the suggested department fit score and the current department fit baseline.

---

## T-16 Internal mobility bridge (Flight Risk ↔ Hidden Talent)

**Summary:** People who are both a flight risk and a cross-dept fit candidate are flagged in both tabs. Direct links let managers move between the two views for the same person.

### Flight Risk → Hidden Talent

On Flight Risk tab person cards: if a person also appears on the Hidden Talent tab, the card shows an "Internal opportunity available →" link. Clicking switches the active tab to Hidden Talent. The Hidden Talent view shows all candidates; no automatic filter is applied.

### Hidden Talent → Flight Risk (via stat strip)

On the Flight Risk tab header, the "Internal match available" stat tile shows how many flight-risk people also have a Hidden Talent match. When above zero, a "View" button appears. Clicking switches to the Hidden Talent tab.

### Business intent

A person who is both likely to leave and a strong fit for an internal role is the highest-priority candidate for a retention conversation involving a mobility offer. The bridge surfaces this combined signal explicitly.

---

## T-17 Export and sharing (PDF + email)

**Summary:** Users can export a formatted report of the current view, either as a PDF download or via email. Both options are available from the org-level pipeline header and from the department drill-down header.

### Entry points

Two buttons always visible in the page header: "Download" (download icon) and "Email me" (envelope icon).

### Download to PDF

**What is exported:**

*From the org-level view:*
```
PROMOTION READINESS PIPELINE — ACME CORP
Generated: [date]
==================================================

Total tracked: X
Near ready (90%+): X
Progressing (70–89%): X
Avg readiness: X%
Avg tenure in level: Xm

BY DEPARTMENT
--------------------------------------------------
[Dept name]: X people | X near-ready | X progressing | avg X%
  Top candidate: [Name] (X%)
```
Departments with zero tracked people are omitted. The "Top candidate" line is only shown for departments where at least one person is Near Ready.

*From the department drill-down view:*
```
[DEPT NAME UPPERCASE] — PROMOTION PIPELINE
Generated: [date]
==================================================

People tracked: X across Y level transitions

[CurrentLevel] → [NextLevel] (N people)
  [Name] — X% ([tier]) | X/Y criteria
  ...
```
People within each group listed highest readiness first. Next level label trimmed to role title only. Tier labels: "Near Ready" / "Progressing" / "Developing" / "Early".

**How it works:** Generates a styled HTML document, opens it in a new browser tab, and triggers the browser's print dialog automatically. The new tab closes after printing.

**Button states:**
- Default: Download icon + "Download"
- Immediately after clicking (2 seconds): Checkmark icon + "Downloaded" in green
- After 2 seconds: reverts to default

### Email me

**Modal content:**

1. Report preview: the title of the report to be sent, shown in a preview box.
2. Email input: text field for the recipient email address. Focused automatically on open. Pressing Enter submits.
3. "Open email client" button: disabled until a valid email is entered. On click, composes a new email in the user's default client with:
   - Subject: "Progression: [report title]"
   - Body: the full report content (same as PDF, as plain text)
4. Privacy note: "This opens your email client with the report pre-filled. Nothing is sent through Progression servers."

**After sending:**
A confirmation replaces the input: green check icon + "Your email client has opened" + "The report is pre-filled in a new email to [email address]. Review and send from your email client." + a "Close" link.

**Closing the modal:** × button, clicking outside the modal, or the "Close" link.

---

## T-18 Cross-feature navigation links

**Summary:** From the department drill-down, users can navigate directly to related views.

### "Skill gap report" button

In the department drill-down header. Shows only when this navigation path is available.
- Icon: external-link arrow
- Label: "Skill gap report"
- Action: navigates to the Skills Gap Heatmap, pre-filtered to the department currently being viewed.

### "Manager view" button

In the department drill-down header. Shows only when this navigation path is available.
- Icon: external-link arrow
- Label: "Manager view"
- Action: navigates to the Manager Effectiveness view. No specific manager is pre-selected.

---

## T-19 Empty and zero states

**Summary:** Specifies what should be shown when surfaces in the pipeline have no data.

### Org-level department grid — department has no tracked people

The department card is shown in a disabled, low-opacity state. The pipeline bar, tier grid, and top-candidate strip are replaced by: "No candidates tracked yet". The card is not clickable.

### Kanban column — no people in a tier

The column body shows a short dashed placeholder box with the word "None" in muted text. The column header (tier label, range) remains visible.

### Flight Risk tab — no flagged people

Centred empty state:
- Icon: lightning bolt (muted)
- Heading: "No flight risk signals detected"
- Sub-copy: "Connect Revelio Labs to surface real-time job-switching propensity data."

### Hidden Talent tab — no candidates

Centred empty state:
- Icon: sparkle (muted)
- Heading: "No cross-fit candidates detected"
- Sub-copy: "Upload LinkedIn data for more employees to surface hidden strengths."

### Flight Risk tab — filter returns no results

Show the standard empty state above regardless of which filter is active.

---

## T-20 Readiness tiers — colour and label reference

**Summary:** Reference documentation for the four readiness tier labels, score ranges, and colour application. This is a design and implementation consistency reference — not a build ticket.

### Tiers

| Tier | Label | Score range | When used |
|---|---|---|---|
| Near Ready | Near Ready | 90% or above | Person meets 90%+ of the next-level criteria |
| Progressing | Progressing | 70% to 89% | Person meets 70–89% |
| Developing | Developing | 50% to 69% | Person meets 50–69% |
| Early Stage | Early Stage | Below 50% | Person meets less than 50% |

**Boundary rule:** The lower boundary of each tier is inclusive. 90% exactly is Near Ready. 70% exactly is Progressing. 50% exactly is Developing.

### Colour application

Refer to interactive design for exact colours. Tier colours apply to:
- Tier legend dots (org-level view)
- Pipeline bar segments (department cards)
- Tier count grid cells (department cards)
- Kanban column headers and candidate card backgrounds (department drill-down)
- Readiness score block background (person panel)
- Score percentage number and progress bar (person panel)
- Tier badge pill (person panel)

**Consistent rule:** A given tier always uses the same colour family everywhere. Near Ready = green; Progressing = sky blue; Developing = amber; Early Stage = muted neutral.

### Flight risk colour reference

| Level | Usage |
|---|---|
| High risk | Red throughout — card border, badge, dot, expanded background |
| Medium risk | Amber throughout |
| Low risk | Green throughout |

Check-in staleness colours (flight risk cards only):
- More than 60 days since check-in: red — urgent
- 31 to 60 days: amber — caution
- 30 days or fewer: neutral — acceptable

### Inferred skill confidence colours (Hidden Talent expanded view)

| Confidence | Colour |
|---|---|
| High | Green |
| Medium | Amber |
| Low | Neutral / muted |

---

## T-21 Individual person panel: "Schedule check-in" action — DECISION REQUIRED

**Summary:** The "Schedule check-in" button in the person panel footer is currently a placeholder with no behaviour. Before it can be built, a product decision is needed on how check-ins should be scheduled from within Progression.

**Status:** Blocked — awaiting decision from product/stakeholders.

---

### Context

When a manager opens a person's readiness panel in the Promotion Pipeline, the panel surfaces three suggested actions. The first two are now implemented (View latest check-in, Ask AI). The third — Schedule check-in — is the most operationally significant: it prompts the manager to have a development conversation with the employee. There are three credible ways to implement it, each with meaningfully different build cost, infrastructure requirements, and user experience.

---

### Option A — Calendar handoff (external)

**What it does:**
Generates a pre-filled calendar invite link and opens it. The manager's calendar app (Google Calendar, Outlook, Apple Calendar) handles the actual scheduling.

**How it works:**
On click, Progression generates a `mailto:` or Google Calendar deep-link URL pre-populated with:
- Meeting title: "Development check-in — [Employee Name]"
- Suggested duration: 30 minutes
- Suggested agenda in the body, derived from the employee's top gap skills (e.g. "Topics: close the gap on Strategic Communication, Data Analysis")
- Attendees field pre-filled with the employee's email (if available in the employee record)

**User experience:**
A single click hands the manager off to their familiar calendar app with minimal friction. Nothing is recorded back in Progression.

**Build cost:** Low — URL construction only, no backend.

**Tradeoffs:**
- No record of whether the check-in was actually scheduled or completed.
- Requires the employee's email address to be present in the data model (currently not stored).
- Deep-link format differs between Google Calendar and Outlook; would need to detect or ask which calendar the user uses.
- Nothing feeds back into the check-in coverage metric (T-03).

---

### Option B — In-app scheduling with journal record

**What it does:**
Opens an in-app modal that lets the manager set a date, add notes, and saves the scheduled check-in as a record in the Decisions Journal (`commitments` table).

**How it works:**
On click, a modal opens showing:
- Employee name and readiness context (read-only)
- A date picker: "Schedule for" (defaults to two weeks from today)
- A notes field: "Agenda / focus areas" — pre-populated with the employee's top gap skills, editable
- A "Save check-in" button

On save:
- A new row is written to the `commitments` table with `source_query` set to the person's name, `type` set to `"check-in"`, and the scheduled date and notes stored in the record.
- The modal closes with a confirmation: "Check-in scheduled for [date]."
- The scheduled check-in becomes visible in the Decisions Journal.
- The check-in coverage metric (T-03) could eventually draw from this table.

**User experience:**
Richer — creates an audit trail, feeds the journal, and closes the loop between pipeline data and manager action. The manager never leaves Progression.

**Build cost:** Medium — requires a modal UI, a date picker, and a write to Supabase. The `commitments` table already exists; a `type` and `scheduled_date` column would need to be added.

**Tradeoffs:**
- More UI to build and maintain.
- Progression becomes a scheduling record, which may overlap with tools the customer already uses for 1:1s (Lattice, Culture Amp, etc.).
- No calendar integration means the manager still needs to create the calendar event separately.

---

### Option C — HRIS / calendar integration handoff

**What it does:**
Sends a scheduling request directly to the customer's existing HR or calendar system via an API integration (e.g. Workday, BambooHR, Google Calendar API, Microsoft Graph).

**How it works:**
On click, Progression calls a configured integration endpoint. The check-in is created directly in the customer's system of record — no separate action required from the manager.

**User experience:**
Seamless if configured — one click creates the event in the system the customer already uses. Check-in history can be read back into Progression for coverage metrics.

**Build cost:** High — requires integration framework, OAuth flows per provider, per-customer configuration, and ongoing maintenance for each supported integration.

**Tradeoffs:**
- Significant engineering investment.
- Each integration is a separate build and maintenance surface.
- Only valuable to customers who have one of the supported integrations.
- Likely out of scope for the near term unless a specific customer integration is being prioritised.

---

### Decision needed

**Please confirm which option to build, or whether to defer this button to a later milestone.**

Recommended default if no integration work is planned: **Option B**. It creates a record in Progression, builds towards the check-in coverage metric, and requires no external dependencies. Option A is a reasonable interim if Option B is too much scope for the current sprint.

| | Option A (Calendar handoff) | Option B (In-app journal record) | Option C (HRIS integration) |
|---|---|---|---|
| Build cost | Low | Medium | High |
| Creates record in Progression | No | Yes | Yes (read-back) |
| Requires employee email in data | Yes | No | Depends |
| Feeds check-in coverage metric | No | Yes (with schema change) | Yes |
| Manager stays in Progression | Yes | Yes | Yes |
| External dependencies | Calendar deep-link format | None | Per-provider OAuth |
