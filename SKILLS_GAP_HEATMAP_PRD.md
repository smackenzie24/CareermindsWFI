# Skills Gap Heatmap — Product Requirements Document

**Page:** Skills Gap Heatmap  
**Navigation entry:** "Heatmap" in the main sidebar nav  
**Purpose:** Give HR leaders and people managers a complete, scannable view of where employee skills fall short of expected levels, at both an organisation-wide and department-level granularity — and allow them to drill into any gap and take action.

---

## 1. Page structure overview

The Skills Gap Heatmap has two distinct states:

| State | What the user sees |
|---|---|
| **Overview** | An org-level landing page listing all seven departments with summary cards |
| **Department view** | A full skill-by-skill heatmap grid for one department, with a slide-out drilldown panel |

The user always enters the Overview state first. Clicking any department card transitions to the Department view for that department. A breadcrumb at the top of the Department view lets the user navigate back to the Overview at any time.

---

## 2. Overview state

### 2.1 Page header

The page header contains:

- **Page eyebrow:** "Workforce Intelligence" in small caps above the title
- **Page title:** "Skills Gap Heatmap"
- **Export button** (top right) — generates a plain-text report; see §2.5 for format
- **Org identifier** — a small pill showing "Acme Corp" with a live status indicator (top right)

#### Four always-visible KPI tiles

A 4-column grid immediately below the title bar:

1. **Total headcount** — total employees with skills data across all departments. Sub-label: "across all depts"
2. **Below target (org)** — percentage of the workforce below their expected level. Sub-label: "of workforce"
3. **Skills below target** — count of skills where 60% or more of the relevant employees are below their expected level. Sub-label: "60%+ of team below expected"
4. **Median gap score** — the median of all per-department median gap scores, expressed on a 0–5 scale, rounded to one decimal place. Sub-label: "across org (0–5)"

#### Expand / collapse secondary tiles

Below the four primary tiles is a text toggle button labelled **"Show org summary"** / **"Hide org summary"** with a chevron icon. Clicking it reveals or hides a second row of four tiles (see below). Collapsed by default.

**Secondary tile 1 — Check-in Coverage:**
- Value: percentage of employees checked in within the last 30 days
- Status-coloured: positive state if ≥ 80%, warning state if below 80%
- Sub-label: "checked in (30d)"

**Secondary tile 2 — Est. Total Cost:**
- Value: sum of all employee salaries, formatted as "$X.XM" (millions to one decimal) or "$XXXK" (thousands, no decimal)
- Sub-label: "annual salaries"

**Secondary tile 3 — Avg Salary:**
- Value: total cost divided by headcount, formatted the same way
- Sub-label: "per employee"

**Secondary tile 4 — Team Headcount:**
- Contains a mini horizontal bar chart, one row per department, sorted by headcount descending
- Each bar is drawn in that department's assigned brand colour
- Each row shows department name (truncated if needed), headcount number, and a bar whose width is proportional to the largest department's count
- The largest department's bar is always full width; all others are proportionally narrower

All four secondary tiles are displayed in a single 4-column grid row (not stacked).

### 2.2 Instruction text

Below the header, above the department cards, a short line of instruction text reads: "Click a department to explore its full skills gap heatmap"

### 2.3 Department cards

One card is shown for each of the seven departments. Cards are arranged in a responsive grid: 1 column on small screens, 2 columns on medium, 3 columns on large (xl+). Each card:

- Is fully clickable and takes the user into the Department view for that department
- Has a clear hover state indicating it is interactive
- Shows:
  - The department's initial letter in a coloured icon (using the department's assigned brand colour), department name in bold, and "N people · N skills" as a sub-label
  - A **severity badge** (see §2.4) based on the percentage of the department's staff who are below their expected level across all skills
  - A **"Staff below target" segmented bar** — see below
  - A **2×2 skill count tile grid** — see below
  - A **"Biggest gap" callout** — see below

#### Segmented "Staff below target" bar

A horizontal bar below the department name row. To the left of the bar is the label "Staff below target"; to the right is the department's overall below-target percentage as a large bold number (e.g. "47%").

The bar itself is segmented to show the *proportion of tracked skills* in each severity tier (not the proportion of employees):

- **Critical segment** — proportion of skills where ≥ 65% of employees are below target
- **At Risk segment** — proportion of skills where 45–64% are below target
- **Developing segment** — proportion of skills where 25–44% are below target
- **On Track segment** — proportion of skills where < 25% are below target

Each segment's width = (count of skills in that tier / total skills) × 100%. The segments are ordered Critical → At Risk → Developing → On Track, left to right.

Note: the bar's visual segmentation represents the distribution of *skill-level severity*, not the raw percentage of employees below target. The large number to the right of the label is the employee-level percentage.

#### Skill count tiles (2×2 grid)

Four tiles in a 2×2 grid, one per severity tier:

| Position | Tier |
|---|---|
| Top-left | Critical |
| Top-right | At Risk |
| Bottom-left | Developing |
| Bottom-right | On Track |

Each tile shows a large bold number (count of skills in that tier) and the tier name as a small sub-label. Each tile is visually distinguished by its severity tier (design defines exact treatment).

#### "Biggest gap" callout

A single row at the bottom of the card showing a downward-trend icon and: "Biggest gap: **[Skill name]** (XX% below)". This is the skill with the highest percentage of employees below target within this department. Only shown if at least one skill has a gap.

### 2.4 Severity tier rules — department cards

Department card severity is determined by the percentage of the department's employees who are below their expected level across all skills combined. The thresholds are:

| Tier | % below target |
|---|---|
| On Track | < 25% |
| Developing | 25–44% |
| At Risk | 45–64% |
| Critical | ≥ 65% |

**Important:** This severity system governs the department card badge and the per-skill segmented bar tiles. It uses different thresholds from the heatmap cell severity system (§4.2), which is based on gap scores rather than percentages. Do not conflate the two.

### 2.5 Overview export format

The export produces a plain-text file containing:

```
SKILLS GAP HEATMAP — ACME CORP
Generated: [date]
==================================================

ORG SUMMARY
Total headcount: [N]
Below target: [N]% ([N] people)

DEPARTMENT BREAKDOWN
--------------------------------------------------
[Department name]
  Headcount: [N]  |  Below target: [N]%
  Critical skills: [N]  |  Median gap: [N]
  Biggest gap: [Skill name] ([N]%)

[...repeated for each department]
```

### 2.6 Feedback banner

A feedback prompt banner is shown at the bottom of the Overview page below the department cards. It is context-tagged "Skills Overview". See §9 for the full feedback system specification.

### 2.7 Legend

A legend sits below the department cards explaining the four department-level severity tiers: On Track, Developing, At Risk, Critical.

---

## 3. Department view

When the user clicks a department card on the Overview, the page transitions to the Department view for that department. This view is a full-height layout with a persistent header, a scrollable heatmap grid in the main content area, and a slide-out drilldown panel on the right that appears when the user selects a skill.

### 3.1 Department view header

#### Breadcrumb
A breadcrumb at the top of the header allows the user to navigate back to the Overview. Format: `← All departments / [Dept icon] [Department name]`. Clicking "All departments" returns to the Overview.

#### Department title block
Shows the department initial in a brand-coloured icon, followed by "[Department name] · Skills Gap" as the page title, and "Skills Gap Heatmap · Progression" as a subtitle line.

#### Summary stats (top right of header)
Three numbers displayed inline in the top-right of the header area. Each has a small label above it and a detail value:

1. **People below target** — e.g. "47% (23 of 49)". Label: "People below target". This is the percentage of the department's total headcount whose average actual level is below their expected level, across all tracked skills in the current filter selection.
2. **Avg skill gap** — the weighted average gap across all skills in this department (expected level minus actual level, minimum 0, averaged by headcount). Displayed to one decimal place. Label: "Avg skill gap".
3. **Skills tracked** — the count of distinct skills tracked for this department after filters are applied. Label: "Skills tracked".

All three numbers update live when filters are applied.

#### Export button
Positioned in the top-right area of the header. Generates a plain-text report listing the department's summary stats followed by a per-skill breakdown (skill name, % below target, N of N people). See §3.8 for the format.

#### Filters
A filter bar sits below the title block. On the left: a Filter icon + "Filter" label, then one `FilterPill` dropdown.

**FilterPill component:** A native `<select>` element styled as a pill, with a chevron icon indicating it is interactive. The select shows "[Label]: All" when no value is selected, or the selected value when one is chosen. Changing the value updates the filter immediately. Selecting "All" resets to the unfiltered state.

- **Level dropdown** — label "Level". Options: "All" + all levels from the `LEVELS` constant (IC1, IC2, IC3, IC4, M1, M2 — fixed list, not dynamically derived). Selecting a level restricts all data to that level only.

The filter defaults to "All". There is no "clear filter" button at the filter bar level (a clear button only appears in the empty-state — see §8A.4).

> **Note: Location filter removed.** A Location filter and By Location group-by were specified in earlier drafts but have been intentionally removed from the product. Location is available as a field in the underlying data but is not exposed as a filter or group-by in the UI.

On the right side of the filter bar (separated by a flex spacer):

**Group-by toggle** — a two-button toggle:
- **By Manager** (default) — columns = all managers in this department, each showing their team names beneath. Managers without any data rows in the current filtered set still appear as columns but their cells are empty.
- **Department** — single column showing the entire department aggregated.

Changing the group-by does not reset the filter.

---

### 3.2 Critical gaps alert bar

An alert bar that appears between the header and the heatmap grid. It is shown only when at least one skill in the current filtered view has 60% or more of employees below target. It shows the **top 3 skills** by percentage below target that meet this threshold (not all qualifying skills — capped at 3).

Format: **Critical gaps detected:** [Skill A] (XX% below target), [Skill B] (YY% below target), [Skill C] (ZZ% below target)

Each skill name is a clickable underlined link. Clicking it selects that skill and opens its drilldown panel. If no qualifying skills exist, the alert bar is not rendered.

---

### 3.3 The heatmap grid

The heatmap grid is the primary scrollable content area. It is a table-style layout rendered as a CSS grid where:

- **Rows** represent individual skills tracked for this department
- **Columns** represent groups determined by the current group-by setting

The grid has a fixed left column for skill labels; each data column takes equal remaining width.

#### Check-in row

Pinned as the first row of the grid, above the column headers and above all skill rows. It does not represent a skill — it shows check-in health for the department. This row spans the full grid width.

**Left cell (label column):**
- "Check-in Coverage" in bold, with a calendar icon whose state reflects severity
- Category label: "Engagement"
- A "CRITICAL" badge if any employees are 90+ days overdue

**Right cell (spans all data columns):**
- A segmented coverage bar showing: current / overdue (30–89 days) / critical (90+ days), each segment width proportional to that count as a percentage of total department headcount
- Coverage percentage in bold text to the right of the bar
- Three count labels beneath the bar: "N current", "N overdue" (only if > 0), "N critical" (only if > 0)

The entire row is clickable. Clicking opens the check-in drilldown panel (§5.9). The row highlights when selected.

#### Column headers

One header cell per group key. The first column header is labelled "Skill".

For **By Manager**: each column shows the manager's name with their team names in smaller text beneath. Teams shown are those in the manager's `teams` array (the manager data object contains a list of team names they are responsible for — this is the authoritative source of which employees belong to that manager's column).  
For **Department**: a single column header showing the department name.

#### Skill rows

One row per skill tracked in this department. Rows are ordered as they appear in the underlying data (not sorted by severity by default).

**Left label cell:**
- Skill name in bold
- Skill category in smaller text beneath (e.g. "Architecture", "Leadership", "Quality")
- If 60% or more of the department-level headcount for that skill is below target: a "HIGH RISK" badge
- The entire label cell is clickable and selects the skill (same behaviour as clicking a data cell)

**Data cells** — one per group column. See §4 for full cell specification.

When a row is selected (a skill is active), the entire row gets a highlighted background. Clicking a selected skill again deselects it and closes the drilldown panel.

#### Empty state

If the active filters result in no matching data rows, the grid content area shows a message indicating no data matches the current filters. See §8A.4 for the full empty-state spec.

---

### 3.4 Legend

Below the heatmap grid, a legend labelled "Gap severity:" explains the six cell severity levels used in heatmap cells:

| Level | Label |
|---|---|
| Exceeding target | actual level > expected level |
| On track | gap score < 0.3 |
| Mild | gap score 0.3–0.49 (30–49% below) |
| Moderate | gap score 0.5–0.69 (50–69% below) |
| Severe | gap score 0.7–0.84 (70–84% below) |
| Critical | gap score ≥ 0.85 (85%+ below) |

Note: these thresholds are specific to heatmap *cells* and differ from the department-card severity system (§2.4).

---

### 3.5 Upsell banner and feedback banner

Below the legend, a talent development upsell banner is shown. Below that, a feedback prompt banner is shown (context-tagged "Skills Heatmap"). See §9 for the full feedback system specification.

---

### 3.6 Group-by behaviour details

**By Manager (default):**
- Column keys are the names of all managers in this department, taken from the manager data for the department
- A cell is populated with entries whose `team` field matches any team in that manager's `teams` array
- If a manager's teams have no data in the filtered set, their column will show empty cells

**Department (consolidated):**
- A single column showing the entire department's data aggregated
- Useful when a level filter is active to see the combined result

> **Note: By Location removed.** Location-based grouping was specified in an earlier draft but has been intentionally removed. The Location group-by option is not present in the UI.

Changing group-by updates all column headers and recalculates all cell values immediately. It does not reset the active skill selection or close the drilldown panel.

---

### 3.7 Filter behaviour details

The Level filter applies to the raw data rows before any aggregation, via a single `useMemo` that returns the filtered subset of `SKILLS_DATA`. The filtered subset is the source of truth for everything downstream. The effects propagate to:

- The three summary stats in the header (people below target, avg skill gap, skills tracked)
- The set of skill rows displayed in the grid (skills with no rows in the filtered set disappear entirely)
- The column keys (group-by options) available in the grid
- All heatmap cell values
- The critical gaps alert bar (re-ranks on the filtered subset)
- All content inside the drilldown panel (bar chart, candidate lists, stat counts)

The filter does not reset when the group-by toggle changes, when the drilldown panel is opened or closed, or on navigation away and back (it is component state and resets on unmount only).

> **Note: Location filter removed.** Earlier drafts described a Location filter with the same propagation behaviour. This has been intentionally removed.

---

### 3.8 Department view export format

```
[DEPARTMENT NAME] — SKILLS GAP HEATMAP
Generated: [date]
==================================================

People below target: [N]% ([N] of [N])
Avg skill gap: [N.N]
Skills tracked: [N]

SKILLS BREAKDOWN
--------------------------------------------------
[Skill name]: [N]% below target ([N] of [N] people)
[...repeated for each skill]
```

---

## 4. Heatmap cells

### 4.1 What a cell represents

Each cell represents the aggregated skill gap data for one skill within one group column. When multiple raw data rows exist for a skill/group combination, they are aggregated as:

- **Total headcount** — sum of headcount across all matching rows
- **Total below target** — sum of below-target counts across all matching rows
- **Average actual level** — headcount-weighted average: `sum(actualLevel × headcount) / totalHeadcount`
- **Expected level** — taken from the first matching row (expected level is consistent across rows for a given skill)

If no data rows match a skill/group combination, the cell renders as an empty placeholder.

### 4.2 Cell severity rules — heatmap cells

**This is a separate system from the department card severity in §2.4.** Cell severity is determined by the **gap score** (expected level minus average actual level). The label shown in the cell is based on the percentage of headcount below target.

| Gap score | Severity level | Label shown in cell |
|---|---|---|
| Negative (actual > expected) | Exceeding | "exceeding" |
| < 0.3 | On track | "on track" |
| 0.3 – 0.79 | Mild | "mild gap" |
| 0.8 – 1.39 | Moderate | "moderate" |
| 1.4 – 1.99 | Severe | "severe" |
| ≥ 2.0 | Critical | "critical" |

Note: the label "on track" appears when the gap score is < 0.3 (not when 0% are below target). A gap score of 0 means average actual equals expected; a score just below 0.3 means a small gap exists but it is within tolerance.

If headcount is zero (no data), the cell renders a dashed placeholder tile with a "—" character.

### 4.3 Cell content display

**When exceeding target (gap score is negative):**
- An upward-trend icon
- The average actual level value
- "+X.X above" — the surplus rounded to one decimal place

**When at or below target (gap score ≥ 0):**
- The average actual level value
- "X/Y below" — count below target out of total headcount

### 4.4 Cell tooltip

Hovering a cell shows a tooltip containing:
- Skill name
- Avg actual level / expected level (e.g. "2.4 / 4")
- If exceeding: "+X.X above target"
- If not exceeding: "X of Y people below target (Z%)"
- Gap score (numerical, labelled)
- Low sample warning if headcount < 3
- Team name (only shown when group-by is "By Manager"; not shown in Department view)

### 4.5 Cell interaction states

- **Default:** standard appearance
- **Hover:** scales up slightly, gains a subtle shadow
- **Selected (after click):** prominent ring, scale, shadow
- Clicking a cell opens the drilldown panel for that skill row
- Clicking the same cell again deselects it and closes the panel
- Selecting a cell in a different row deselects the previous row and opens the new drilldown

---

## 5. The drilldown panel

The drilldown panel slides in from the right side of the viewport when a skill is selected. It overlays the right side of the viewport, full height. When the panel is open, the main heatmap grid shifts left to accommodate it. When collapsed (see §5.1), the grid shifts left by only the width of the collapse rail.

### 5.1 Collapse rail

Along the left edge of the panel is a **narrow collapse toggle rail**. This is always visible when the panel is open and acts as the primary affordance for collapsing the panel.

**When expanded:** the rail shows a collapse icon. Clicking collapses the panel to show only the rail.  
**When collapsed:** the rail shows an expand icon plus the skill name rendered vertically. Clicking expands the panel back to full width.

### 5.2 Panel close

An × (close) button in the panel header closes the panel entirely and deselects the current skill.

### 5.3 Panel header

- Eyebrow label: "Skill drill-down"
- Skill name as the panel heading
- Sub-label: "Across N [teams / departments]" — the noun changes to match the current group-by setting ("teams" for By Manager, "departments" for Department). N is the count of raw data rows for this skill in the current filtered dataset (not the number of group columns).

### 5.4 Summary cards (three cards)

A 3-column grid directly below the header, above the scrollable body.

**Card 1 — Overall status:**
- If the department is exceeding target overall: label "Exceeding", value "+X.X" (the surplus of average actual over expected, to one decimal place)
- If not exceeding: label "Below", value "XX% (N)" — percentage below target followed by the raw count in parentheses

**Card 2 — Avg level:**
- Label: "Avg level"
- Value: "[X.X] / [Y]" where X.X is the weighted average actual level (one decimal) and Y is the expected level (integer)

**Card 3 — Worst area:**
- Label: "Worst area"
- Value: for By Manager: the **team name** (not the manager name) with the highest % below target; for Department: the department name
- The entry shown is the first in the list after the breakdown bars are sorted by % below target descending

### 5.5 Scrollable body

The majority of the panel is a scrollable content area containing (from top to bottom):

1. Promotion pipeline section (§5.6) — only shown if relevant candidates exist
2. Breakdown bars (§5.7)

### 5.6 Promotion pipeline section

This section only appears when there is at least one promotion-ready candidate or at least one blocked candidate for this skill in this department.

**Section header (always visible when section exists):**
- Label: "Promotion pipeline"
- Count badge showing the total number of candidates (ready + blocked combined)
- Expand/collapse chevron on the right
- The entire header row is clickable to expand/collapse the section body
- Default state: **expanded**

**When expanded — sub-section: "Meets next-level criteria"** (only if promoCandidates > 0):
- Heading: "N person meets next-level criteria" or "N people meet next-level criteria" (singular/plural)
- A stack of candidate chips (see §5.8)

**When expanded — sub-section: "Blocked by this skill"** (only if blockedCandidates > 0):
- Heading: "N person is blocked by this skill" or "N people are blocked by this skill"
- A stack of candidate chips (see §5.8)

If neither sub-section has candidates, the entire promotion pipeline section is hidden.

### 5.7 Breakdown bars

A section labelled "Breakdown by [grouping]" where the grouping label is "team" (for By Manager) or "department" (for Department view).

**One bar per raw data row** in the filtered dataset for this skill, sorted by percentage below target descending (highest gap first). Note: these are individual raw data rows, not one bar per group column — the bars show the underlying granularity below the column level.

Each bar entry shows:
- **Left side:** the group label (team name / department name depending on group-by)
- **Right side:** if exceeding, a badge showing "+X.X"; if not exceeding, a "X/Y" count and a percentage badge whose severity state matches the percentage
- **The bar itself:** fills to the percentage below target, with width capped at 100%. Bars for exceeding entries are always rendered at full width with a distinct "exceeding" treatment.
- **Beneath the bar:** two small labels — "Actual: X.X" on the left and "Expected: Y.0" on the right

### 5.8 Candidate chips

Used in the promotion pipeline section. Each chip shows:

- **Avatar:** a square with the person's initials (first letter of first name + first letter of last name)
- **Name** (bold, truncated if needed)
- **Team · Target title** — the team name and the target level title (e.g. "Platform · Senior Engineer"), truncated if needed
- **Readiness percentage badge** — state reflects the overall readiness tier (Near Ready, Progressing, etc.)
- **Skill rating:** shown as "X.X/Y.Y" where X.X is the person's current rating for this skill and Y.Y is the required rating for next level

"Met" chips and "blocked" chips have visually distinct states (design defines exact treatment).

**Each chip is fully clickable and navigates to that person's individual record in the Progression page** (see §5.8A).

---

### 5.8A Individual person record (Progression page)

Clicking a candidate chip opens that person's full profile as a slide-over panel within the Progression (Promotion Pipeline) page. This panel is the `PersonPanel` component and is the authoritative view of a person's promotion readiness detail.

The panel is not rendered inside the heatmap itself — clicking the chip navigates the user out of the heatmap and into the Progression page, where the person's panel opens automatically. The navigation passes the person's ID so the Progression page can open the correct panel on arrival.

**Until deep-linking is implemented**, the chip click should navigate to the Progression page filtered to the relevant department, with the person's panel opened. At minimum, the Progression page should scroll to and highlight the person's card.

**The person panel contains:**

- **Header:**
  - Person's initials avatar
  - Full name
  - Team · Department sub-label
  - Meta pills: Location, Tenure in current level (e.g. "14m in current level"), Target level title
  - Close (×) button
  - Prev / Next navigation if the panel was opened as part of a peer group (not applicable when opened from the heatmap — no peer navigation context)

- **Readiness score block:**
  - "Readiness for [Target level label]" with the tier badge (e.g. "Near Ready")
  - Large percentage score (e.g. "94%")
  - "N of N criteria met" sub-label
  - Horizontal progress bar

- **Criteria breakdown (scrollable):**
  - **"Meeting criteria (N)"** section — one row per skill the person currently meets for their target level. Each row shows: skill name, category, a rating visualisation, and the rating as "actual/required"
  - **"Gaps to close (N)"** section — one row per skill the person has not yet met. Same row format. Sorted by gap size descending (largest gap first).

- **Footer actions (currently placeholder buttons — destinations to be defined):**
  - "Set as focus skills →"
  - "Find mentors for gap skills →"
  - "Schedule check-in →"

**Relationship to the heatmap drilldown:** When the user arrives at the Progression page from a heatmap chip click, the context is that specific skill. A future enhancement should pre-scroll the person's criteria breakdown to highlight the relevant skill row (the one that was the subject of the heatmap drilldown). This is not yet implemented.

### 5.9 Check-in drilldown panel

When the user clicks the check-in coverage row at the top of the heatmap grid, the panel switches to a dedicated check-in view (instead of a skill drilldown). This panel has its own layout:

**Header:**
- Eyebrow: "Engagement"
- Title: "Check-in Coverage"
- Sub-label: department name
- Status badge: "All current" if no one is flagged; "Critical" if any employees are 90+ days overdue; "Overdue" otherwise

**Four stat cards (2×2 grid):**

| Card | Label | Value |
|---|---|---|
| Team size | "Team size" | Total employees in dept |
| Not checked in | "Not checked in" | "N / Total" |
| Critical 90d+ | "Critical 90d+" | Count of 90+ day overdue |
| Coverage | "Coverage" | Percentage checked in |

**Coverage bar:**
Identical in behaviour to the check-in row bar in the grid: segmented into current / overdue / critical. Below the bar: three count labels — "Current (N)", "Overdue (N)", "Critical (N)".

**Flagged employees list:**
- If no employees are flagged: a centred empty state with "Everyone is up to date" and "All N members checked in within 30 days."
- If employees are flagged: a section header "N people need follow-up", followed by a list of employee rows sorted by days overdue descending (most overdue first). Each row shows:
  - Initials avatar
  - Employee name (bold, truncated if long)
  - Team name
  - Days overdue as a number + "d" (e.g. "94d")
  - A severity label: "Critical" or "Overdue"

**Suggested actions footer (sticky, always visible):**
- "Send reminder to overdue members →"
- "Export check-in report →"

Both are currently placeholder buttons (no destination defined).

---

### 5.10 Actions footer (skill drilldown)

A sticky footer at the bottom of the skill drilldown panel (not the check-in panel). Labelled "Suggested actions" above the button stack. Contains:

**Conditional primary button:**
- If at least one promotion-ready candidate exists for this skill: **"View N promotion-ready in pipeline →"** — navigates to the Promotion Pipeline page filtered to this department
- If no promotion-ready candidates exist: **"Find mentors with this skill →"** — placeholder, no destination defined

**Always-present buttons:**
- **"Ask AI about this skill gap →"** — navigates to the Ask AI page with a pre-populated question: "What should we do about the [Skill] skill gap in [Department]?" The AI page opens with this question already submitted so the user lands on an active response, not a blank prompt.
- "Export gap report →" — placeholder, no destination defined

Note: "Set as team focus skill" was removed. That interaction implies a full goal-setting and tracking workflow that does not yet exist in the product. Until that workflow is built, the slot is better used by the AI entry point, which can suggest focus actions contextually without requiring a separate feature surface.

---

## 6. Navigation links summary

| Trigger | Destination |
|---|---|
| Click any department card on the Overview | Department view for that department |
| Breadcrumb "← All departments" | Returns to the Overview |
| Click a skill name in the critical gaps alert bar | Selects that skill and opens its drilldown panel (panel opens expanded) |
| Click the check-in coverage row | Opens the check-in drilldown panel |
| Click any skill label cell | Selects the skill and opens its drilldown panel |
| Click any heatmap data cell | Selects the skill for that row and opens the drilldown panel |
| Click the same selected skill/cell again | Deselects; closes the drilldown panel |
| Click a candidate chip (met or blocked) in the promotion pipeline section | Progression page with that person's panel open |
| "View N promotion-ready in pipeline →" button | Promotion Pipeline page (current department) |
| "Find mentors with this skill →" | No destination — placeholder |
| "Ask AI about this skill gap →" | Ask AI page, pre-populated with a question about this specific skill and department |
| "Export gap report →" | No destination — placeholder |
| "Send reminder to overdue members →" | No destination — placeholder |
| "Export check-in report →" | No destination — placeholder |

---

## 7. Data rules and calculations

### Gap score (per cell)
`gap = expected level − average actual level`

Positive = below target. Negative = exceeding. The gap used for severity thresholds is `max(0, gap)` — i.e. negative gaps are treated as 0 for severity purposes but shown as surplus values in the cell content.

### Average actual level (cell aggregation)
`average actual = sum(actualLevel × headcount) / totalHeadcount`  
Headcount-weighted. Not a simple mean.

### Percentage below target
`% below target = (count below target / total headcount) × 100`, rounded to the nearest whole number.

### Department median gap
For each skill in a department:
1. Calculate the headcount-weighted average actual level across all rows for that skill
2. Calculate `gap = max(0, expectedLevel − weightedAvgActual)`
3. Collect all per-skill gap values into a list
4. Return the statistical median of that list, rounded to one decimal place

### Org-level median gap (Overview KPI)
The median of all seven department median gap scores, rounded to one decimal place.

### Check-in coverage
`coverage % = ((total employees − flagged employees) / total employees) × 100`, rounded to the nearest whole number.

An employee is "flagged" if their last check-in date is more than 30 days before the reference date.  
- Overdue: 31–89 days since last check-in  
- Critical: ≥ 90 days since last check-in

### Critical gaps alert bar threshold
A skill qualifies for the alert bar if: `(total below target / total headcount) × 100 ≥ 60%`  
Only the top 3 qualifying skills by percentage are shown, sorted descending.

### Manager column assignment
In "By Manager" grouping, a data row is assigned to a manager's column if the row's `team` field is included in that manager's `teams` array (as defined in the manager data source). Each team belongs to exactly one manager.

---

## 8. Empty and edge states

| Situation | Behaviour |
|---|---|
| No data matches the active filters | Grid body shows an empty state; see §8A.4 |
| A skill/group combination has no data | Cell renders a dashed empty tile with "—" |
| A department has zero skills with ≥ 60% below target | The critical gaps alert bar is not shown |
| A skill has no blocked promotion candidates | The "blocked by this skill" sub-section in the drilldown is not shown |
| A skill has no promotion-ready candidates | The "meets next-level criteria" sub-section is not shown |
| A skill has no relevant candidates of either type | The entire promotion pipeline section is hidden |
| Check-in coverage is 100% for the department | Check-in row still appears; bar is fully in the current state; panel shows "Everyone is up to date" empty state |
| A manager's teams have no data in the filtered set | Their column renders empty placeholder cells |

---

## 8A. Missing data — calls to action

Wherever data is absent — whether an entire department has no skills data, a skill has no ratings for a particular group, or an individual employee has not completed a self-assessment — the product must not silently display a blank state. Every missing-data situation must surface a specific, actionable prompt that tells the user **what is missing**, **who is responsible for providing it**, and **what action to take**.

### Principles

1. **Never leave a blank without a prompt.** A dashed cell or empty section is always accompanied by a short explanation and a next step.
2. **Attribute the gap.** Where possible, name the team, manager, or individual whose data is missing — not just "no data available."
3. **Offer the lowest-friction action.** The action should be as direct as possible: a button to send a nudge, a link to the data entry flow, or a prompt to open a conversation.
4. **Distinguish the two root causes.** Data can be missing because (a) no one has submitted ratings yet, or (b) ratings exist but are incomplete or outdated (> N months old). Each case calls for a different message and action.

---

### 8A.1 Overview — department card with no skills data

**When:** A department has no skills entries at all (e.g. a newly created department, or data has never been collected).

**What to show:** The department card still renders in the grid but instead of the segmented bar and skill tiles, it shows a neutral empty state with:

> **No skills data yet**  
> Skill ratings have not been collected for this department.

**Call to action:** A button labelled **"Request skill assessment →"** that initiates a prompt or workflow to ask the department's HR partner or manager to trigger a skills assessment for the team.

---

### 8A.2 Overview — department card with stale data

**When:** A department has skills data but the most recent submission is older than a configurable threshold (suggested default: 6 months).

**What to show:** The card renders normally but includes a "Data outdated" badge alongside the severity badge.

**Call to action:** A small text link beneath the biggest-gap callout row: **"Last updated [Month Year] — request refresh →"**

---

### 8A.3 Department view — entire department has no data

**When:** The user navigates into a department with no skills rows.

**What to show:** Instead of the heatmap grid, the full content area shows a centred empty state:

> **No skill data for [Department name]**  
> Skill ratings haven't been collected for this team yet. To populate this view, team members need to complete a skills self-assessment and their managers need to validate the ratings.

**Call to action (two options, stacked):**
1. **"Send assessment request to team →"** — initiates a message/email to the department's manager or HR partner to trigger collection
2. **"Learn how skill data is collected →"** — links to documentation or a help article

---

### 8A.4 Department view — filter returns no rows

**When:** The user applies a Level filter that has no matching data (e.g. "M2" for a department with no M2-level skill data).

**What to show:** The grid content area shows:

> **No data for [Level] in [Department]**  
> There are no employees at this level for [Department]. Try adjusting your filters, or this level may not yet have skill data on record.

**Call to action:** A button labelled **"Clear filters"** that resets the filter to "All". No data-collection action is needed here since the gap is likely a filter issue, not a missing-data issue.

---

### 8A.5 Heatmap cell — no data for a skill/group combination

**When:** A cell at the intersection of a skill row and a group column has no data rows.

**What to show:** The cell renders a dashed placeholder tile. On hover, a tooltip explains:

> **No data**  
> No skill ratings on record for [Skill] in [Group]. This may mean no employees in this team/level have been assessed for this skill yet.

**Call to action:** No inline button (the cell is too small). Instead, the tooltip includes a small text link: **"Flag for assessment"** that marks this skill/group combination as needing data collection. This creates a record that can be reviewed in a separate data-completeness workflow.

---

### 8A.6 Drilldown panel — skill has breakdown bars but some entries have no data

**When:** The drilldown panel is open for a skill, and one or more group rows in the breakdown section have zero headcount.

**What to show:** Rather than omitting those rows, each zero-headcount row renders in the breakdown list with a dashed bar and the text:

> **No ratings recorded** — [Group name]

**Call to action:** A small inline link to the right of each empty row: **"Request data →"** — this should trigger a nudge to the relevant manager or team lead asking them to ensure their team completes ratings for this skill.

---

### 8A.7 Drilldown panel — no promotion candidates (neither ready nor blocked)

**When:** The promotion pipeline section has no candidates of either type for this skill in this department.

**What to show:** The promotion pipeline section is hidden entirely (no change from current behaviour). No empty-state message is needed here — the absence of candidates is expected and not a data problem.

---

### 8A.8 Check-in panel — an employee has never had a check-in recorded

**When:** An employee appears in the flagged list but has no check-in date on record at all (as opposed to having an old check-in date).

**What to show:** In the flagged employees list, these employees render with a "Never checked in" label instead of a day count.

**Call to action:** The same "Send reminder to overdue members →" button in the footer covers this case, but the label on this specific employee's row should read **"Schedule first check-in →"** as a more appropriate prompt.

---

### 8A.9 Check-in panel — entire department has no check-in data

**When:** None of the employees in the department have any check-in records at all.

**What to show:** The check-in panel shows a centred state with:

> **No check-in data for [Department name]**  
> It looks like 1:1 check-ins haven't been logged for this team yet. Encourage managers to record their regular check-ins to track engagement over time.

**Call to action (two options):**
1. **"Send reminder to all managers →"** — sends a prompt to all managers in the department to begin logging check-ins
2. **"Learn about check-in tracking →"** — links to documentation

---

## 9. Feedback system

The feedback system is a lightweight, two-component in-product feedback mechanism used across all major views. It is not specific to the heatmap — it runs on eight views — but its placement in the heatmap is described here.

---

### 9.1 FeedbackBanner — placement and copy

The `FeedbackBanner` component renders as a full-width banner below the main content of a view, above the page bottom. It appears on every view that has a clear task context so that feedback can be attributed precisely.

**Views and their context tags:**

| View | Context tag | Question shown |
|---|---|---|
| Skills Overview (department cards) | `Skills Overview` | "Does this department view help you plan development conversations?" |
| Skills Heatmap (department view) | `Skills Heatmap` | "Is this heatmap surfacing the gaps that matter most to you?" |
| Areas to Improve (gap report picker) | `Areas to Improve` | "Is this gap report giving you what you need to make a case?" |
| Promotion Pipeline | `Promotion Pipeline` | "Does this pipeline reflect how you actually think about readiness?" |
| Manager Effectiveness | `Manager Effectiveness` | "Are these manager metrics helping you have better conversations?" |
| Industry Benchmarks | `Industry Benchmarks` | "Are you benchmarking against the right peers?" |
| Executive Summary | `Executive Summary` | "Is this summary giving you what you need before a leadership meeting?" |
| Decisions Journal | `Decisions Journal` | "Is the journal helping you follow through on commitments?" |

---

### 9.2 FeedbackFlow — the modal

`FeedbackFlow` is a centred modal overlay triggered by clicking "Share feedback" in the banner. It is a three-step form with a progress bar, rendered over a blurred scrim.

**Modal chrome:**
- A progress bar below the header, animated as steps advance (0% → 33% → 66% → 100%)
- Clicking the scrim or the × close button dismisses the modal

---

### 9.3 Step 1 — Rating

**Prompt:** "How useful is this for your day-to-day?"

**Sub-label:** "You're on [context tag]. Your rating helps us prioritise what to build next."

**Input:** Five horizontally-arranged buttons, each showing a number (1–5) and a label below:

| Value | Label |
|---|---|
| 1 | Not useful |
| 2 | Somewhat |
| 3 | Useful |
| 4 | Really useful |
| 5 | Love it |

**Interaction:**
- Hovering highlights all buttons from 1 up to the hovered value
- Clicking selects that value
- Rating is required — the "Continue" button is disabled until one is selected

**CTA:** "Continue →" button (full-width). Advances to step 2.

---

### 9.4 Step 2 — Free text

**Prompt:** "What's missing, or what would make this more useful?"

**Sub-label:** "Data points, new views, workflow improvements — anything goes. Be as blunt as you like."

**Input:** A 4-row textarea with placeholder: "e.g. I wish I could see attrition risk per manager, or export the gap report as a PDF…". Autofocuses on arrival.

**CTAs:**
- "Skip" (left) — advances to step 3 without capturing text
- "Continue →" (right) — advances to step 3 with text

---

### 9.5 Step 3 — Research opt-in

**Prompt:** "Help shape the roadmap"

**Body:** "We do short product calls with people using this in the real world. 20 minutes, no pitch — just honest conversation about what would make this genuinely better."

**CTAs (initial state):**
- "I'm in" (left half) — reveals the name/email form below
- "Maybe later" (right half) — submits the feedback without a research call and advances to the done state

**When "I'm in" is clicked:** The two buttons are replaced by:
- Name input (autofocus)
- Work email input (type=email; pressing Enter while both fields are filled submits)
- "Submit feedback →" button (full-width, disabled until both name and email are non-empty)
- "Back" link below (returns to the initial two-button state, without clearing name/email)

While submitting, the button shows a loading state.

---

### 9.6 Done state

After submission the modal transitions to a thank-you screen:

- "Thank you." heading
- Body copy varies by research opt-in choice:
  - With call: "We'll be in touch to set up a call. Your input directly influences what we build next."
  - Without call: "Your feedback goes straight to the team. We read every response."
- A "Done" button that closes the modal

---

### 9.7 Data persistence

Feedback is written to the `feedback` Supabase table with the following fields:

| Column | Type | Notes |
|---|---|---|
| `context` | text | The view's context tag (e.g. "Skills Heatmap") |
| `rating` | integer or null | 1–5 from step 1 |
| `feedback_text` | text or null | Free text from step 2; null if skipped or empty |
| `wants_research_call` | boolean | True if the user clicked "I'm in" and submitted name+email |
| `researcher_name` | text or null | Name collected in step 3; null if no call requested |
| `researcher_email` | text or null | Email collected in step 3; null if no call requested |
| `created_at` | timestamptz | Set by database default |

**Error handling:** Submission errors are intentionally swallowed — a failed feedback write must never surface an error to the user or block the UI. The modal always advances to the done state regardless of whether the database write succeeds.

---

## 9A. Tour integration

When the product tour is active and the page lands on the Department view, the first skill in the skills list is **automatically selected** and its drilldown panel is opened. This ensures the drilldown panel is present in the DOM so that the tour overlay can anchor its step annotations to elements inside the panel. This is a tour-only behaviour — it should not trigger in normal usage.

---

## 10. Out of scope for this document

- The Promotion Pipeline page (linked to from the drilldown panel)
- The Manager Effectiveness page (which can navigate into the heatmap)
- The Ask AI sidebar (available from the main nav)
- The Decisions Journal (where commitments created from the heatmap are saved)
- The UpsellBanner component content (managed separately)
- The ExportButtons component (shared utility, not heatmap-specific)
