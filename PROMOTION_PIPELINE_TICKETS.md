# Promotion Pipeline — Product Tickets

**Feature area:** Workforce Intelligence › Promotion Readiness Pipeline
**Surfaces covered:** Org-level pipeline view · Department drill-down (kanban) · Individual person panel · Hidden Talent tab · Flight Risk tab · Export (PDF & email)
**Ticket range:** PP-01 – PP-28

---

## Table of Contents

- [PP-01 Org-level page header](#pp-01-org-level-page-header)
- [PP-02 Org-level stat cards](#pp-02-org-level-stat-cards)
- [PP-03 Expandable org summary section](#pp-03-expandable-org-summary-section)
- [PP-04 Tab bar](#pp-04-tab-bar)
- [PP-05 Tier legend bar](#pp-05-tier-legend-bar)
- [PP-06 Department cards grid](#pp-06-department-cards-grid)
- [PP-07 Department card — pipeline bar and tier grid](#pp-07-department-card--pipeline-bar-and-tier-grid)
- [PP-08 Department drill-down: page header and breadcrumb](#pp-08-department-drill-down-page-header-and-breadcrumb)
- [PP-09 Department drill-down: transition grouping](#pp-09-department-drill-down-transition-grouping)
- [PP-10 Department drill-down: kanban columns and candidate cards](#pp-10-department-drill-down-kanban-columns-and-candidate-cards)
- [PP-11 Individual person panel: layout and navigation](#pp-11-individual-person-panel-layout-and-navigation)
- [PP-12 Individual person panel: readiness score block](#pp-12-individual-person-panel-readiness-score-block)
- [PP-13 Individual person panel: criteria breakdown](#pp-13-individual-person-panel-criteria-breakdown)
- [PP-14 Individual person panel: skill rating visualisation](#pp-14-individual-person-panel-skill-rating-visualisation)
- [PP-15 Individual person panel: footer actions](#pp-15-individual-person-panel-footer-actions)
- [PP-16 Readiness calculation](#pp-16-readiness-calculation)
- [PP-17 Pipeline inclusion rules](#pp-17-pipeline-inclusion-rules)
- [PP-18 Flight Risk tab: header and stat strip](#pp-18-flight-risk-tab-header-and-stat-strip)
- [PP-19 Flight Risk tab: person cards](#pp-19-flight-risk-tab-person-cards)
- [PP-20 Hidden Talent tab: header and filters](#pp-20-hidden-talent-tab-header-and-filters)
- [PP-21 Hidden Talent tab: candidate cards](#pp-21-hidden-talent-tab-candidate-cards)
- [PP-22 Cross-dept fit calculation (Hidden Talent)](#pp-22-cross-dept-fit-calculation-hidden-talent)
- [PP-23 Internal mobility bridge (Flight Risk ↔ Hidden Talent)](#pp-23-internal-mobility-bridge-flight-risk--hidden-talent)
- [PP-24 Download to PDF](#pp-24-download-to-pdf)
- [PP-25 Email me](#pp-25-email-me)
- [PP-26 Cross-feature navigation links](#pp-26-cross-feature-navigation-links)
- [PP-27 Empty and zero states](#pp-27-empty-and-zero-states)
- [PP-28 Readiness tiers — colour and label reference](#pp-28-readiness-tiers--colour-and-label-reference)
- [PP-29 Individual person panel: "Schedule check-in" action — DECISION REQUIRED](#pp-29-individual-person-panel-schedule-check-in-action--decision-required)

---

## PP-01 Org-level page header

**Summary:** The persistent header at the top of the Promotion Readiness Pipeline page. Always visible across all three tabs.

### Header content

**Left side:**
- Eyebrow label: "Workforce Intelligence" — small, all-caps, wide letter-spacing, muted colour
- Page title: "Promotion Readiness Pipeline"
- Subtitle: "Who's close to the next level? Click a department to see individual readiness scores and skill gaps."

**Right side (arranged in a row):**
- Export controls — Download and Email me buttons. See PP-24 and PP-25.
- Live data indicator: a small pulsing dot (green) followed by the organisation name ("Acme Corp"). This signals that the data is live and company-specific.

### Behaviour
- The header scrolls with the page. To export, the user must scroll back to the top if they have scrolled down past the header.

---

## PP-02 Org-level stat cards

**Summary:** Four summary numbers shown below the header, always visible across all tabs. These give at-a-glance answers to the most important pipeline questions.

### Cards

| Card | Label | Value | Sub-label | Colour treatment |
|---|---|---|---|---|
| 1 | Tracked for promotion | Total headcount with a defined next level and an assessment framework | "people assessed org-wide" | Neutral |
| 2 | Near ready (90%+) | Count of people scoring 90% or above against their next-level criteria | "meet 90%+ of next-level criteria" | Green |
| 3 | Progressing (70–89%) | Count of people scoring 70–89% | "on track, closing gaps" | Sky blue |
| 4 | Avg readiness score | Average readiness percentage across all pipeline-tracked people | "avg Xm in current level" (months) | Neutral |

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

## PP-03 Expandable org summary section

**Summary:** A collapsible section below the stat cards containing four additional org-level data points: check-in coverage, estimated salary cost, average salary, and a headcount bar chart. Expanded by default.

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
- If coverage is below 80%: the icon and number are shown in amber. This signals that a significant portion of the team has gone unchecked.

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

## PP-04 Tab bar

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
- The Pipeline tab badge is never shown (all-depts overview does not need a count).
- The Hidden Talent badge uses a sky-blue colour scheme.
- The Flight Risk badge uses a red colour scheme.

### Badge counts
- **Hidden Talent badge:** The total number of people surfaced by the cross-dept fit algorithm across all departments. See PP-22 for the algorithm.
- **Flight Risk badge:** The count of people flagged as **high** risk only (not medium). Medium-risk people are included on the tab but do not contribute to the badge.

---

## PP-05 Tier legend bar

**Summary:** A reference strip showing the four readiness tiers and their score ranges. Helps users interpret the pipeline at a glance.

Shown only when the Pipeline tab is active. Not shown on Hidden Talent or Flight Risk.

### Tiers

| Tier | Label | Score range |
|---|---|---|
| Near Ready | Near Ready | 90% and above |
| Progressing | Progressing | 70% to 89% |
| Developing | Developing | 50% to 69% |
| Early Stage | Early Stage | Below 50% |

Each entry shows a small filled circle in the tier colour, the tier label, and the score range. Refer to interactive design for the colour assigned to each tier. See also PP-28 for the full colour reference.

---

## PP-06 Department cards grid

**Summary:** The main content area of the Pipeline tab. One card per department, laid out in a responsive grid. Each card is the entry point to the department drill-down.

### Grid behaviour
- Cards are arranged in a multi-column grid that adjusts to screen width (1 column on small screens, up to 3 columns on large screens).
- Cards are ordered by the fixed department list — they do not reorder dynamically.

### Card — active state (department has tracked candidates)

Each department card shows:

**Header row:**
- A coloured square icon showing the department's initial letter (department colour is fixed — refer to interactive design)
- Department name
- Sub-label: "X people · Y transition" (or "Y transitions" if more than one). A "transition" is a distinct current-level → next-level pairing tracked within that department.
- A right-facing chevron that nudges right slightly on hover

**Pipeline breakdown bar:** See PP-07.

**Tier count grid:** See PP-07.

**Top candidate strip:**
- If at least one person is Near Ready: show their name and score with the label "Top candidate: [Name] (X% ready)". Strip uses a green tint.
- If no one is Near Ready: show the person with the highest score with the label "Highest: [Name] (X% ready)". Strip uses a neutral tint.
- The top candidate is always the person with the single highest readiness percentage in the department.

### Card — empty state (no tracked candidates)

If a department has zero pipeline-tracked people, the card is shown in a disabled, low-opacity state. The body is replaced with the message "No candidates tracked yet". The card is not clickable.

### Card — click behaviour

Clicking an active card navigates to the department drill-down view (PP-08 through PP-10). The pipeline page is replaced in its entirety by the drill-down.

### Below the grid

- A leadership development upsell module appears beneath the department grid.
- A feedback prompt ("How useful is this view?") appears below the upsell.

---

## PP-07 Department card — pipeline bar and tier grid

**Summary:** The visual breakdown inside each department card. Two components: a stacked bar and a four-cell count grid.

### Pipeline breakdown bar

A single horizontal bar representing the proportion of people in each tier.

**Construction:**
- The bar is divided into up to four coloured segments, one per tier.
- Each segment's width is `(count in tier ÷ total in department) × 100%`.
- Segments are rendered in order: Near Ready, Progressing, Developing, Early Stage.
- A segment is omitted entirely if its count is zero.
- A 1-pixel gap between segments creates a visible separator and allows the bar background (neutral) to show through.
- Each segment has a tooltip on hover showing the count, e.g. "3 near ready".

**Segment colours:** See PP-28.

**Bar label row (above the bar):**
- Left: "Pipeline breakdown"
- Right: "[X]% avg readiness" — the average readiness percentage for the department, bold

**Average readiness calculation:** sum of all individual readiness percentages in the department ÷ department headcount, rounded to the nearest whole number.

### Tier count grid

Four equal cells in a row, one per tier.

Each cell shows:
- The count of people in that tier (large, bold number) in the tier colour
- The first word of the tier label only: "Near", "Progressing", "Developing", "Early"
- The cell background uses the tier's background colour

---

## PP-08 Department drill-down: page header and breadcrumb

**Summary:** When a user clicks a department card, the full pipeline page is replaced by the department drill-down. This view shows every tracked person in that department organised by their promotion transition and readiness tier.

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
- Export controls — Download and Email me. See PP-24 and PP-25.
- "Skill gap report" link button (with external-link icon): navigates to the Skills Gap Heatmap filtered to this department. Only shown if this navigation is available in the current context.
- "Manager view" link button (with external-link icon): navigates to the Manager Effectiveness view. Only shown if this navigation is available in the current context.
- Tier summary pills: one pill per tier that has at least one person. Each pill shows the count and the tier label. Tiers with zero people are hidden.

---

## PP-09 Department drill-down: transition grouping

**Summary:** The kanban board is organised by promotion transitions. A transition is a pairing of a current level and a target level (e.g. IC2 → Senior Engineer). Each transition gets its own labelled section containing four tier columns.

### What is a transition?

A transition is defined by a unique current-level → target-level pair within the department. Each person in the pipeline belongs to exactly one transition (they are moving from their current level to the next level up).

### Grouping logic

People in the department are grouped by their unique transition key. Within each transition group, people are sorted by readiness percentage, highest first.

### Transition section header

- Current level label shown as a pill (e.g. "IC2")
- Right-arrow separator
- Target level label shown as a darker pill. The target label is trimmed to remove the level code prefix — for example "IC3 · Senior Engineer" is displayed as "Senior Engineer".
- Count in parentheses: "(N people)"

### Section order

Transition sections appear in the order they are encountered when iterating the people list. There is no alphabetical or manual reordering. The order will stabilise once data is live.

---

## PP-10 Department drill-down: kanban columns and candidate cards

**Summary:** Each transition section contains four columns — one per readiness tier. People are placed in the column matching their tier. This is the kanban view.

### Columns

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
- Avatar: circular/rounded, showing the person's two-letter initials. The background uses a consistent neutral gradient (not tier-coloured).
- Name (truncated if necessary)
- Team name (truncated, muted)
- Readiness label: the tier name in the tier colour + the readiness percentage
- Readiness bar: a short horizontal progress bar filled to the readiness percentage, in the tier colour
- Metadata row: location · tenure in months (e.g. "18m") · criteria count ("X/Y criteria" — criteria met out of total)

**Card — hover state:**
- Slight upward lift and shadow appear on hover. Refer to interactive design.

**Card — click behaviour:**
Clicking a card opens the individual person panel (PP-11 through PP-15) as a right-side slide-in panel. The kanban remains visible behind the panel.

**Peer context for navigation:**
When a card is opened, the system records which other cards are in the same tier column. The person panel's prev/next navigation (PP-11) moves through those peers only — not through the whole transition or whole department.

---

## PP-11 Individual person panel: layout and navigation

**Summary:** A right-side panel that slides in when a candidate card is clicked. Shows a single person's full readiness breakdown. The rest of the page remains accessible; clicking outside the panel closes it.

### Layout

The panel slides in from the right and occupies the right portion of the screen. Clicking the backdrop (the dimmed area to the left) closes the panel. A close button (×) in the top-right of the panel also closes it.

The panel has three vertical sections:
1. Header — person identity and meta information
2. Readiness score block — the headline score and tier
3. Criteria breakdown — scrollable list of met criteria and gaps

The criteria section scrolls independently; the header and score block remain visible while scrolling.

### Peer navigation

When there are multiple people in the same tier column, prev/next navigation controls are shown at the top of the panel.

- "Prev" button with left-chevron: moves to the previous person in the same tier column. Disabled when on the first person.
- "Next" button with right-chevron: moves to the next person. Disabled when on the last person.
- Position counter: "X of Y" (1-indexed), showing the person's position among peers in that column.

If there is only one person in the column, navigation controls are not shown.

### Person header

- Avatar: rounded square, showing the person's two-letter initials on a neutral dark gradient background
- Full name (large, bold)
- Team · Department (muted)
- Meta pills in a row (wrapping on small screens):
  - Location (with pin icon)
  - Tenure in current level: "Xm in current level" (with clock icon) — note the "in current level" suffix distinguishes this from overall tenure
  - Target level: trimmed to the role title only (e.g. "Senior Engineer" not "IC3 · Senior Engineer") — with people icon

---

## PP-12 Individual person panel: readiness score block

**Summary:** The headline readiness block is the most prominent section of the panel. It gives the key answer at a glance: what percentage of the next level's criteria does this person meet?

### Content

**Top row:**
- Left: label "Readiness for" (small, muted, all-caps) above the full target level label (e.g. "IC3 · Senior Engineer")
- Right: readiness tier badge (e.g. "Near Ready" in green, "Developing" in amber)

**Score:**
- The readiness percentage displayed in a very large font, in the tier colour
- Below it: "X of Y criteria met" — the raw count (e.g. "7 of 8 criteria met")

**Progress bar:**
- A full-width horizontal bar filled to the readiness percentage
- Bar fill uses the tier colour
- A subtle transition animation plays when the panel opens or when navigating between people

**Block background:**
The entire readiness block uses the tier's background colour (e.g. light green for Near Ready, light amber for Developing). This makes the tier status immediately visible even before reading the numbers.

### Calculation

See PP-16 for the full readiness calculation. The score displayed here is the output of that calculation: `criteria met ÷ total criteria × 100`, rounded to the nearest whole number.

Tier boundaries:
- 90% or above = Near Ready
- 70% to 89% = Progressing
- 50% to 69% = Developing
- Below 50% = Early Stage

Boundaries are inclusive at the lower end of each tier (70% exactly = Progressing, not Developing).

---

## PP-13 Individual person panel: criteria breakdown

**Summary:** A scrollable list showing, for each skill criterion of the target level, whether the person meets it or has a gap.

### Met criteria section

Label: "Meeting criteria (N)" with a green check-circle icon.

Each met criterion row:
- Skill name
- Skill category (muted, smaller text)
- Skill rating visual — see PP-14
- Score label: "X/Y" where X is the person's actual rating and Y is the required rating (e.g. "4/3" — the person has a rating of 4, requirement is 3)
- Row background: light green tint

This section is only shown if the person meets at least one criterion.

### Gaps to close section

Label: "Gaps to close (N)" with a warning-circle icon in red.

Each gap row:
- Skill name
- Skill category
- Skill rating visual — see PP-14
- Score label: "X/Y" in red — actual vs required
- Row background: light red tint

**Sort order:** Gaps are sorted by gap size, largest first. The gap size is the difference between the required rating and the person's actual rating (e.g. if required is 4 and actual is 1, the gap is 3). Larger gaps appear at the top so the most critical areas are immediately visible.

This section is only shown if the person has at least one gap.

---

## PP-14 Individual person panel: skill rating visualisation

**Summary:** Each criterion row in the panel includes a five-dot visual that communicates both where the person is and where they need to be, at a glance.

### Five-dot visual

Five dots are displayed in a row. Each dot position represents a skill rating level from 1 (leftmost) to 5 (rightmost).

The dots are coloured as follows:

| Condition | Dot appearance | Meaning |
|---|---|---|
| Position is at or below the person's actual rating AND at or below the required rating | Filled, sky blue | Person has reached this level, and it is required |
| Position is at or below the person's actual rating AND above the required rating | Filled, green | Person exceeds the requirement at this position |
| Position is above the person's actual rating AND at or below the required rating | Empty with red tint | This level is required but the person has not reached it (a gap) |
| Position is above the person's actual rating AND above the required rating | Empty, neutral grey | Not required and not reached — not relevant |

**Practical reading:**
- A row of all sky-blue filled dots (up to the required level) means the person exactly meets the requirement.
- Emerald dots beyond the requirement mean the person is over-indexed on this skill.
- Red-tinted empty dots indicate the gap — how many levels the person needs to gain.
- Grey empty dots are noise — they can be ignored.

---

## PP-15 Individual person panel: footer actions

**Summary:** Three action buttons at the bottom of the panel. These are the system's suggested next steps for developing this person towards their next level.

### Buttons

| Button | Label |
|---|---|
| 1 | Set as focus skills → |
| 2 | Find mentors for gap skills → |
| 3 | Schedule check-in → |

### Current state

| Button | Status |
|---|---|
| View latest check-in → | Implemented — navigates to the Decisions Journal |
| Ask AI → | Implemented — opens Ask AI pre-filled with the person's name and readiness context |
| Schedule check-in → | Placeholder — no behaviour. See PP-29 for the decision required before this can be built. |

### Behaviour notes
- All three buttons are always displayed, regardless of whether the person has gaps or not.
- The footer is pinned to the bottom of the panel and does not scroll away.

---

## PP-16 Readiness calculation

**Summary:** This ticket defines the calculation that produces the readiness percentage shown throughout the pipeline. It is a foundational rule — every number in the pipeline derives from it.

### Where the next-level career step data comes from

Every person in the pipeline is assessed against a defined target level — the level immediately above their current one. Two configuration sources provide this:

**1. Level hierarchy (`LEVEL_DEFINITIONS`)**

A static configuration list that defines every level in the organisation and chains them together. Each entry specifies:
- The level's ID, display label (e.g. "IC3 · Senior Engineer"), and short code (e.g. "IC3")
- Which department and track (IC or Manager) it belongs to
- The ID of the next level up, or null if this is a terminal level

The system looks up the person's current level in this list, then follows the `nextLevel` pointer to find their target level. This is the level shown in the person panel header and used for all readiness comparisons.

**2. Skills frameworks (`LEVEL_FRAMEWORKS`)**

For each target level that has been defined, a corresponding framework specifies the skill criteria that must be met to be considered ready for promotion to that level. Each criterion names a skill, its category, and the minimum rating required (on a 1–5 scale).

Not every level has a framework yet — some entry-level transitions and terminal levels are excluded. A person can only appear in the pipeline if their target level has a framework. See PP-17.

**In the current product:** Both `LEVEL_DEFINITIONS` and `LEVEL_FRAMEWORKS` are configuration managed by Progression (not editable by end users in this version). When connected to a live HRIS, the level hierarchy will be sourced from the customer's career framework data.

### Inputs

- The person's skill ratings: a set of skill IDs mapped to a self-assessed rating from 1 to 5
- The target level's framework: a list of criteria, each consisting of a skill ID, skill name, category, and required rating (1–5)

### Calculation

For each criterion in the target level's framework:

1. Look up the person's rating for that skill. If the person has no rating for a skill, treat it as 0.
2. If the person's rating is **equal to or above** the required rating: the criterion is met.
3. If the person's rating is **below** the required rating: the criterion is a gap. Record the gap size as `required rating − actual rating`.

Readiness percentage = `criteria met ÷ total criteria × 100`, rounded to the nearest whole number.

**Important: only assessed skills are used.** LinkedIn-inferred skills (used in the Hidden Talent algorithm) do not affect a person's readiness score. The readiness score reflects only verified self-assessments.

### Examples

A framework has 8 criteria. A person meets 6 of them.
`6 ÷ 8 × 100 = 75%` → Progressing tier.

A framework has 10 criteria. A person meets 9.
`9 ÷ 10 × 100 = 90%` → Near Ready tier.

A framework has 10 criteria. A person meets 4.
`4 ÷ 10 × 100 = 40%` → Early Stage tier.

The same framework produces all four tiers. The tier a person lands in depends entirely on their score — there is no separate set of criteria for Developing or Early Stage. See PP-17 for full detail on this point.

---

## PP-17 Pipeline inclusion rules

**Summary:** Not every employee appears in the pipeline. This ticket defines who is included, who is excluded, and why.

### The four tiers are outcomes of one calculation — not separate categories

This is an important clarification: **Near Ready, Progressing, Developing, and Early Stage are not separate groups with separate frameworks.** They are all the result of the same readiness calculation (see PP-16) run against the same framework for a person's target level.

Every person who is included in the pipeline goes through the same process:
1. Their target level's framework is looked up (a list of skill criteria with required ratings)
2. Their assessed skill ratings are compared against every criterion
3. A percentage is produced: criteria met ÷ total criteria × 100
4. That percentage is then classified into one of the four tiers

The tier a person lands in is purely a consequence of their score. A person with a score of 45% is Early Stage. The same person, if they improved their skills and rescored at 75%, would be Progressing. The framework itself does not change — only the score does.

**Frameworks defined in the current dataset:**

| Target level | Department |
|---|---|
| IC2 | Engineering |
| IC3 | Engineering, Product, Design, Data, Marketing, Sales |
| IC4 | Engineering, Product |
| M1 | People Ops |

People assessed against these frameworks will be distributed across all four tiers based on how their skills measure up. A framework with 10 strict criteria will naturally produce more Early Stage and Developing people than one with fewer, easier-to-meet criteria.

### Included

A person is included in the pipeline if:
1. Their current level exists in the level hierarchy
2. Their current level is not the top of their track (there is a next level)
3. The next level has a defined skills framework

### Excluded

| Reason | Example |
|---|---|
| At a terminal level (top of their track) | A Staff Engineer at IC4 — there is no IC5 |
| Next level exists but has no framework yet | Entry-level positions (e.g. IC1) and most manager levels where criteria have not yet been defined |

### Implication for stats

All counts in the pipeline (tracked total, near-ready count, etc.) refer only to included people. Employees who are not in the pipeline are not counted. A department appearing to have zero Developing or Early Stage candidates simply means all their tracked people happen to score above 50% — it does not mean those tiers are unavailable to that department.

---

## PP-18 Flight Risk tab: header and stat strip

**Summary:** The Flight Risk tab surfaces employees who, based on external signals, are considered likely to leave. This data comes from a third-party propensity model (Revelio Labs in the current dataset). All content on this tab is confidential and for managers only.

### Header

**Left:**
- Warning triangle icon + label "Flight Risk"
- A "Revelio Labs" badge — indicating the data source
- Description: "Employees flagged by Revelio Labs' job-switching propensity model. Sorted by risk level and days since last check-in."

**Right:**
- A confidentiality notice: "For managers only · Confidential" with a shield icon and amber background. This is always visible and cannot be dismissed.

### Summary stat strip

Three tiles:

| Tile | Value | Colour |
|---|---|---|
| High risk | Count of high-risk people | Red |
| Medium risk | Count of medium-risk people | Amber |
| Internal match available | Count of flight-risk people who also appear in Hidden Talent | Sky blue |

The "Internal match available" tile includes a "View" button when the count is above zero. Clicking it switches the user to the Hidden Talent tab, pre-filtered to show only those people. See PP-23.

### Filter pills

Three filters that control which cards are shown:
- "All (N)" — default
- "High risk (N)"
- "Medium risk (N)"

The active filter pill is visually distinct from inactive ones. Counts update dynamically based on the current dataset.

### Sort order (always applied, not user-configurable)

Cards are sorted:
1. By risk level first — high risk appears before medium risk
2. Within each risk level, by days since last check-in, most overdue first

---

## PP-19 Flight Risk tab: person cards

**Summary:** One card per flagged person. Cards contain identity information, risk signal, check-in status, and an expandable detail section.

### Card — always-visible content

**Avatar:**
- Rounded square with the person's two-letter initials
- Background: the department colour
- A red indicator dot appears in the corner of the avatar for high-risk people only. Medium-risk people do not have this indicator.

**Identity row:**
- Full name
- Department pill (using the department colour)
- Level short code (e.g. "IC3")
- Team name

**Risk badge:**
- A coloured pill with a dot + label: "High flight risk" or "Medium flight risk"
- Colour matches the risk level — see PP-28 for colour reference

**Expand/collapse button:**
- A chevron icon on the right of the card
- Toggles the expanded detail section

**Key signals row:**
- Days since last check-in (e.g. "42d since check-in")
  - **Red** if more than 60 days (urgent — this person has not had a conversation in a long time)
  - **Amber** if 31–60 days (caution)
  - **Neutral grey** if 30 days or fewer (acceptable)
- Tenure at current level + location, separated by "·" (e.g. "28m at level · London")
- If the person also appears in Hidden Talent: an "Internal opportunity available →" link. Clicking this switches to the Hidden Talent tab. See PP-23.

### Card — expanded content

When expanded, the card shows:

- **Risk drivers section:** Labelled "Revelio Labs · Risk drivers". A bulleted list of the specific signals that contributed to this person's risk flag (e.g. "LinkedIn profile updated 6 times in 30 days", "Below-band compensation").
- **Suggested action box:** A fixed message: "Suggested action: schedule a growth conversation, review comp against market, and explore internal mobility if applicable." This is not personalised — it is a standard recommended action for any flight-risk situation.

The expanded background uses the risk level colour lightly applied to distinguish the expanded content from the rest of the card.

### Empty state

If no people are flagged (or none match the active filter): show a centred empty state with the message "No flight risk signals detected" and the sub-copy "Connect Revelio Labs to surface real-time job-switching propensity data."

### Footer note

Shown when cards are visible:
"Flight risk scored by Revelio Labs job-switching propensity model. Factors include LinkedIn activity, tenure plateau, compensation gap, and engagement signals. For internal retention use only."

---

## PP-20 Hidden Talent tab: header and filters

**Summary:** The Hidden Talent tab identifies people whose LinkedIn-inferred skills suggest they would perform better in a different function. This is an opportunity signal, not a performance flag. All content is for managers only and should not be shared with employees.

### Header

**Left:**
- Sparkle icon + label "Hidden Talent"
- A "LinkedIn-inferred" badge — indicating the data source
- Description: "People whose inferred skills suggest a better-fit function. Flight risk signals from Revelio Labs show who needs a conversation now."

**Right:**
- A notice: "For managers only · Not visible to employees" with a warning triangle and amber background. Always visible, not dismissable.

### High-risk alert banner

Shown only when at least one person in the current filtered view is also flagged as high flight risk:

"[N] person/people flagged high flight risk — internal mobility conversations recommended this quarter."

The count reflects the filtered view, not all candidates. If the user changes the department filter, this count updates.

### Department filter pills

A row of filter pills. Each pill filters the list to show people connected to that department — either people currently in that department, or people suggested for a role in that department.

- "All (N)" — default, shows everyone
- One pill per department that has at least one connected candidate. Departments with zero relevant candidates are hidden.

**Active pill:** highlighted in the department colour.

**Inactive pill:** neutral style; darkens on hover.

### Sort toggle

Two options presented as a toggle:
- "Most urgent": sorts by a combined urgency score that weights flight risk heavily and adds the fit improvement delta. High-risk people with large fit deltas appear first.
- "Best fit": sorts purely by the fit improvement delta, largest first.

**Urgency score formula:** `flight risk weight + fit delta`
- High risk: weight 100
- Medium risk: weight 50
- Low risk or none: weight 0

For example: a high-risk person with a +25% delta has an urgency score of 125. A low-risk person with a +40% delta has a score of 40.

Default sort is "Most urgent".

---

## PP-21 Hidden Talent tab: candidate cards

**Summary:** One card per person identified as a potential cross-department fit. Cards show the fit comparison and the signals behind it.

### Card — always-visible content

**Avatar:**
- Rounded square with two-letter initials
- Background: the person's current department colour
- Red indicator dot if the person is also flagged as high flight risk

**Name + transition row:**
- Full name
- Current department pill → arrow → suggested department pill
- Each department pill uses the department's colour

**Fit delta badge:**
- Shows "↗ +X%" where X is the percentage-point improvement in fit score from current to suggested department
- Colour:
  - 30 points or more: green
  - 20–29 points: sky blue
  - Below 20 points: amber (this threshold should not appear given the inclusion rules, but is handled as a fallback)

**Expand/collapse button:**
- Chevron that toggles the expanded view

**Flight risk badge:**
- Coloured dot + label (e.g. "High flight risk") using the same colours as PP-19

**Fit comparison bars:**
- Two side-by-side horizontal bars
- Left bar: "Current dept fit" — shows the person's readiness percentage against their current next-level criteria
- Right bar: "[Suggested dept] fit" — shows the person's fit score against the suggested level's criteria, using merged assessed + inferred skills
- Each bar has a percentage label to the right
- Bar colours use the respective department colour

**Top inferred signal:**
- A single line showing the most significant LinkedIn signal driving the suggested fit (e.g. "2 years as PM at Stripe"). LinkedIn icon appears to the left.
- Only the first (most significant) signal is shown in the collapsed view.

### Card — expanded content

When expanded, up to five sections are shown. Each section only appears if it has content.

1. **Flight risk drivers** (if person is flight-risk flagged): "Revelio Labs · Flight risk drivers" header + bulleted list of signals
2. **LinkedIn history** (if available): header + bulleted list of prior roles and experiences
3. **Inferred skills driving fit** (if available): header + list of skills with a confidence label each
   - Confidence levels: High (green label), Medium (amber label), Low (neutral label)
4. **Framework match** (always shown): "Meets X of Y criteria for [suggested level label]" — the raw criteria count confirming how well the person fits the suggested role
5. **Framing disclaimer** (always shown): "This is an opportunity signal, not a performance flag. Share with the employee as a career conversation starter — not a directive." Displayed in a soft amber info box.

### Empty state

When no candidates are found for the current filter: "No cross-fit candidates detected" + "Upload LinkedIn data for more employees to surface hidden strengths."

### Footer note

Shown when cards are visible:
"Fit scores use Revelio Labs LinkedIn data discounted one level for confidence. Flight risk from Revelio Labs job-switching propensity model. For internal use only."

---

## PP-22 Cross-dept fit calculation (Hidden Talent)

**Summary:** This ticket defines how the system identifies people who would be a better fit in a different department. It is the calculation behind the Hidden Talent tab.

### Step 1 — Establish the person's current fit baseline

For each person who has LinkedIn-inferred skills on file:

- Look up their readiness percentage against their current next-level framework (using assessed skills only — the standard pipeline readiness).
- Use this as the "current fit" baseline, with a floor of 20%. The floor prevents unfairly low baselines for people who happen to be at entry level.

**Example:** A person scoring 35% readiness in their current department would have a baseline of 35%. A person with no defined pathway (no framework) would fall back to the 20% floor.

### Step 2 — Score the person against target frameworks in other departments

For each skills framework defined in other departments:

- Check that the target level is on the IC (individual contributor) track — the algorithm does not match people into management roles.
- Check that the target level is within one level of the person's current level — i.e. the same level or the next level up or down. Cross-department mobility at more than one level of difference is excluded.
- Calculate a "fit score" for this person against this framework, using a merged skill set:
  - **Assessed skills** are used at full face value
  - **Inferred skills** (from LinkedIn) are included at one level below their inferred value (e.g. if LinkedIn suggests a level-4 proficiency, it is treated as level 3). This discount reflects lower confidence in inferred vs assessed data. If a skill has both an assessed rating and an inferred rating, the assessed rating takes precedence.
- The fit score = `criteria met ÷ total criteria × 100`, rounded to the nearest whole number

**Inclusion criteria for a match:**
- Fit score must be 50% or above
- The improvement over the person's current baseline (fit delta) must be 20 percentage points or more

### Step 3 — Deduplicate

A person may score well against frameworks in multiple other departments. Only the **single best match** (the one with the largest fit delta) is kept per person. All lower-ranked matches are discarded.

### Step 4 — Sort

The final list is sorted by fit delta, largest first, before any user-applied filters or sort toggle is applied.

### What the delta badge shows

The fit delta is the difference between the suggested department fit score and the current department fit baseline. It represents the uplift in fit the person would experience by moving to the suggested role.

---

## PP-23 Internal mobility bridge (Flight Risk ↔ Hidden Talent)

**Summary:** People who are both a flight risk and a cross-dept fit candidate are flagged in both tabs. A direct link lets managers move between the two views for the same person.

### Flight Risk → Hidden Talent

On Flight Risk tab person cards: if a person also appears on the Hidden Talent tab (i.e. they have inferred skills suggesting a better-fit role), the card shows an "Internal opportunity available →" link.

Clicking this link switches the active tab to Hidden Talent. The Hidden Talent view shows all candidates; no automatic filter is applied to the person in question.

### Hidden Talent → Flight Risk (via stat strip)

On the Flight Risk tab header, the "Internal match available" stat tile shows how many flight-risk people also have a Hidden Talent match. When this number is above zero, a "View" button appears. Clicking it switches to the Hidden Talent tab.

### Business intent

The bridge exists because the two signals together have higher urgency than either alone. A person who is both likely to leave and a strong fit for an internal role is the highest-priority candidate for a retention conversation involving a mobility offer.

---

## PP-24 Download to PDF

**Summary:** Users can download a formatted report of the current view as a PDF. Available from the org-level pipeline header and from the department drill-down header.

### Entry point

The "Download" button is always visible in the page header. It is accessible from both the org-level view and the department drill-down view. The button label: download icon + "Download".

### What is exported

**From the org-level view:**

A full-page report containing:
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

Notes:
- Departments with zero tracked people are omitted.
- The "Top candidate" line is only shown for departments where at least one person is Near Ready.

**From the department drill-down view:**

A report for the selected department:
```
[DEPT NAME UPPERCASE] — PROMOTION PIPELINE
Generated: [date]
==================================================

People tracked: X across Y level transitions

[CurrentLevel] → [NextLevel] (N people)
  [Name] — X% ([tier]) | X/Y criteria
  ...

```

Notes:
- Each transition group is separated by a blank line.
- People within each group are listed highest readiness first.
- The next level label is trimmed to the role title only (level code is removed).
- Tier labels in the export: "Near Ready" / "Progressing" / "Developing" / "Early"

### How it works

The system generates a styled HTML document from the report content and opens it in a new browser tab. The browser's print dialog opens automatically, presenting the user with options including "Save as PDF". The new tab closes after printing.

The user does not need to configure any settings — the document is formatted and ready to save or print.

### Button states

- **Default:** Download icon + "Download"
- **Immediately after clicking (2 seconds):** Checkmark icon + "Downloaded" in a green style — confirms the action completed
- **After 2 seconds:** automatically reverts to the default state

---

## PP-25 Email me

**Summary:** Users can send a pre-formatted version of the current report to an email address of their choice. Available from the org-level pipeline header and from the department drill-down header.

### Entry point

The "Email me" button is always visible in the page header alongside the Download button. Button label: envelope icon + "Email me". Clicking opens a modal overlay.

### Modal content

The modal contains:

1. **Report preview:** The title of the report that will be sent (e.g. "Promotion Readiness Pipeline — Acme Corp"), shown in a preview box so the user knows what they are sending.

2. **Email input:** A text input for the recipient email address. This field is focused automatically when the modal opens. Pressing Enter submits.

3. **"Open email client" button:** Disabled until a valid (non-empty) email address is entered. Clicking composes a new email in the user's default email client with:
   - Subject: "Progression: [report title]"
   - Body: the full report content (same content as the PDF export, as plain text)

4. **Privacy note:** "This opens your email client with the report pre-filled. Nothing is sent through Progression servers." This reassures users that no data is transmitted via Progression infrastructure.

### After sending

Once the "Open email client" button is clicked:
- A confirmation message replaces the input: a green check icon + "Your email client has opened" + "The report is pre-filled in a new email to [email address]. Review and send from your email client."
- A "Close" link dismisses the modal.

### Closing the modal

The modal can be closed by:
- Clicking the × button in the top-right corner of the modal
- Clicking outside the modal (on the backdrop)
- The "Close" link shown in the post-send confirmation state

---

## PP-26 Cross-feature navigation links

**Summary:** From the department drill-down, users can navigate directly to related views — the Skills Gap Heatmap for the same department, and the Manager Effectiveness view. These links help users move between analytical contexts without losing their place.

### "Skill gap report" button

Located in the department drill-down header. Shows only when this navigation path is available.

- Icon: external-link arrow
- Label: "Skill gap report"
- Action: navigates to the Skills Gap Heatmap, pre-filtered to the department the user is currently viewing in the pipeline.

**Intent:** A user reviewing promotion readiness for Engineering may want to cross-reference which skills have the largest gaps at a team level. This link takes them directly there.

### "Manager view" button

Located in the department drill-down header. Shows only when this navigation path is available.

- Icon: external-link arrow
- Label: "Manager view"
- Action: navigates to the Manager Effectiveness view. No specific manager is pre-selected.

**Intent:** A user wanting to act on pipeline data by reviewing a manager's team health can move directly to that view.

---

## PP-27 Empty and zero states

**Summary:** Several surfaces in the pipeline can appear with no data. This ticket specifies what should be shown in each case.

### Org-level department grid — department has no tracked people

The department card is shown in a disabled, low-opacity state. The pipeline bar, tier grid, and top-candidate strip are replaced by a short placeholder: "No candidates tracked yet". The card is not clickable.

### Kanban column — no people in a tier

The column body is replaced with a short dashed placeholder box containing the word "None" in muted text. The column header (tier label, range) remains visible so the user understands the column exists but is empty.

### Flight Risk tab — no flagged people

A centred empty state:
- Icon: lightning bolt (muted)
- Heading: "No flight risk signals detected"
- Sub-copy: "Connect Revelio Labs to surface real-time job-switching propensity data."

### Hidden Talent tab — no candidates

A centred empty state:
- Icon: sparkle (muted)
- Heading: "No cross-fit candidates detected"
- Sub-copy: "Upload LinkedIn data for more employees to surface hidden strengths."

### Flight Risk tab — filter returns no results

If the user has selected "High risk" or "Medium risk" and no people match, show the standard empty state above (same content regardless of filter).

---

## PP-28 Readiness tiers — colour and label reference

**Summary:** The pipeline uses four readiness tiers consistently across every surface. This ticket documents the label, score range, and colour treatment for each tier. This is a reference for design and implementation consistency.

### Tiers

| Tier | Label | Score range | When used |
|---|---|---|---|
| Near Ready | Near Ready | 90% or above | Person meets 90%+ of the next-level criteria |
| Progressing | Progressing | 70% to 89% | Person meets 70–89% |
| Developing | Developing | 50% to 69% | Person meets 50–69% |
| Early Stage | Early Stage | Below 50% | Person meets less than 50% |

**Boundary rule:** The lower boundary of each tier is inclusive. 90% exactly is Near Ready. 70% exactly is Progressing. 50% exactly is Developing.

### Colour application

Refer to interactive design for the exact colours. The system applies tier colours to:
- Tier legend dots (org-level view)
- Pipeline bar segments (department cards)
- Tier count grid cells (department cards)
- Kanban column headers and candidate card backgrounds (department drill-down)
- Readiness score block background (person panel)
- Score percentage number and progress bar (person panel)
- Tier badge pill (person panel)

**Consistent rule:** A given tier always uses the same colour family in every location it appears. Near Ready is always green; Progressing is always sky blue; Developing is always amber; Early Stage is always a muted neutral. This consistency ensures users learn the tier colours once and recognise them everywhere.

### Flight risk colour reference

| Level | Usage |
|---|---|
| High risk | Red throughout — card border, badge, dot, expanded background |
| Medium risk | Amber throughout |
| Low risk | Green throughout |

Check-in staleness colours (used on flight risk cards only):
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

## PP-29 Individual person panel: "Schedule check-in" action — DECISION REQUIRED

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
- Nothing feeds back into the check-in coverage metric (PP-03).

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
- The check-in coverage metric (PP-03) could eventually draw from this table.

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
| Manager stays in Progression | No | Yes | Yes |
| External dependencies | Calendar deep-link format | None | Per-provider OAuth |
