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

- **Page title:** "Skills Gap Heatmap"
- **Four org-level KPI tiles** (always visible):
  1. **Total headcount** — the total number of employees with skills data across all departments
  2. **Below target** — the percentage of employees who fall below their expected level on at least one skill, with the raw count shown alongside (e.g. "34% (142 of 418)")
  3. **Critical skill gaps** — the count of skills where 60% or more of the relevant team are below the expected level for that skill
  4. **Median gap score** — the median of all per-skill gap scores expressed on a 0–5 scale (where 0 = everyone meeting expectations and 5 = everyone 5 points below)

- **Expand/collapse toggle** that reveals four additional secondary tiles:
  5. **Check-in coverage** — the percentage of employees who have had a manager 1:1 check-in within the last 30 days. Displays in green if ≥ 80%, amber if below 80%.
  6. **Estimated total annual salary cost** — sum of all employee salaries across the org, formatted as "$X.XM"
  7. **Average salary per employee** — formatted as "$XXXK"
  8. **Team headcount breakdown** — a mini bar chart showing headcount per department, sorted by size. Each bar is proportional to the largest department.

### 2.2 Department cards

One card is shown for each of the seven departments. Cards are arranged in a grid. Each card:

- Is fully clickable and takes the user into the Department view for that department
- Shows:
  - The department name and its assigned colour indicator
  - Total employee headcount for the department and total number of skills tracked
  - A **severity badge** (see §2.3 for rules) based on the percentage of staff below target across that department
  - A **"Staff below target" bar** — a horizontal bar showing what percentage of the department's staff are currently below their expected skill level. The bar is segmented and colour-coded by severity across the department's tracked skills:
    - Red segment = proportion of skills rated Critical
    - Orange segment = proportion of skills rated At Risk
    - Amber segment = proportion of skills rated Developing
    - Grey segment = proportion of skills rated On Track
  - Four **skill count tiles** in a 2×2 grid, one per severity tier, showing how many skills in this department fall into each tier (Critical / At Risk / Developing / On Track)
  - A **"Biggest gap" callout** at the bottom of the card, showing the name of the single skill with the highest percentage below target in that department and its percentage

### 2.3 Severity tier rules

Severity is determined by the percentage of employees in a department who are below their expected level for a given skill. The thresholds are:

| Tier | % below target | Badge colour |
|---|---|---|
| On Track | < 25% | Green |
| Developing | 25–44% | Amber |
| At Risk | 45–64% | Orange |
| Critical | ≥ 65% | Red |

These four tiers and their colour assignments are used consistently across the Overview, the Department view skill labels, and the drilldown panel.

### 2.4 Legend

A colour legend sits below the department cards explaining the four severity tiers: On Track (green), Developing (amber), At Risk (orange), Critical (red).

---

## 3. Department view

When the user clicks a department card on the Overview, the page transitions to the Department view for that department. This view remains a full-page experience with a persistent header, a scrollable heatmap grid in the centre, and a slide-out drilldown panel on the right that appears when the user selects a skill.

### 3.1 Department view header

#### Breadcrumb
A breadcrumb at the top of the header allows the user to navigate back to the Overview. It displays: `← All departments / [Department icon] [Department name]`. Clicking "All departments" returns to the Overview.

#### Department title block
Shows the department initial in a colour-coded icon, followed by "[Department name] · Skills Gap" as the page title, and "Skills Gap Heatmap · Progression" as a subtitle.

#### Summary stats (top right)
Three numbers displayed in the header area:
1. **People below target** — e.g. "47% (23 of 49)" — the percentage and raw count of employees in this department whose average actual level is below their expected level, across all selected skills
2. **Avg skill gap** — the weighted average gap across all skills in this department (expected minus actual, minimum 0, averaged by headcount). Displayed to one decimal place.
3. **Skills tracked** — the total number of distinct skills tracked for this department

These three numbers update live when filters are applied.

#### Export button
An export button (top right of header) generates a plain-text report of the department's skill gaps, listing each skill with its headcount, percentage below target, and average actual vs expected level.

#### Filters
A filter bar below the summary stats contains two dropdown filters:
- **Location filter** — filters all heatmap data to show only employees based in the selected location (options: London, New York, Berlin, Singapore, Remote, or "All locations")
- **Level filter** — filters all heatmap data to show only employees at the selected level (options: IC1–IC4, M1, M2, or "All levels")

Both filters default to showing all data. When a filter is active, the summary stats, heatmap cells, and drilldown panel all update to reflect only the filtered population.

#### Group-by toggle
A three-way toggle controls how the heatmap columns are organised:
- **By Location** (default) — one column per office/remote location
- **By Manager** — one column per team manager within the department; manager name is shown as the column header with their team names beneath
- **By Department** — a single consolidated column showing the whole department as one figure

Changing the group-by updates the column headers and all cell values immediately without resetting the selected skill or the drilldown panel.

---

### 3.2 Critical gaps alert bar

If any skill in the current filtered view has 60% or more of employees below target, a red alert bar appears directly below the filter bar. It reads:

> **Critical gaps detected:** [Skill A] (XX% below target), [Skill B] (YY% below target)

Each skill name in the alert bar is a clickable link. Clicking it selects that skill and opens its drilldown panel (see §5). If no critical gaps exist, the alert bar is hidden entirely.

---

### 3.3 The heatmap grid

The heatmap grid is the primary content area of the Department view. It is a table-style layout where:
- **Rows** represent individual skills
- **Columns** represent groups (locations, managers, or the whole department, depending on the group-by setting)

#### Check-in row
Pinned above the column headers is a special **Check-in coverage row** that does not represent a skill. It shows the current 1:1 check-in health for the department:
- Overall coverage percentage (employees checked in within the last 30 days)
- A coverage bar segmented into: current (green), overdue/30–90 days (amber), critical/90+ days (red)
- Count labels for current, overdue, and critical employees
- The row is clickable — selecting it opens a check-in drilldown panel (see §5.4) instead of a skill drilldown

#### Column headers
One column header per group (location, manager, or department). For the "By Manager" grouping, the manager's name is the primary header text with their team names displayed in smaller text beneath.

#### Skill rows
One row per skill tracked for the department. Each row contains:

**Left label cell (fixed 220px wide):**
- Skill name in bold
- Skill category in smaller grey text below the name (e.g. "Architecture", "Operations", "Leadership")
- A **"HIGH RISK"** badge if 60% or more of the department-level headcount for that skill are below target

Clicking anywhere on the label cell selects the skill and opens its drilldown panel.

**Data cells** (one per group column):
Each cell is a **heatmap cell** — a coloured tile showing the skill gap status for that group. See §4 for the full cell specification.

Clicking any cell selects the skill for that row and opens the drilldown panel. If the same skill is already selected, clicking again deselects it and closes the panel.

When a skill is selected, the entire row gets a light grey background to indicate the active state.

---

### 3.4 Legend

Below the heatmap grid, a colour legend explains the six gap severity levels used in the heatmap cells (see §4.2 for the full colour rules):

| Colour | Label |
|---|---|
| Dark green | Exceeding target |
| Light green | On track (less than 30% below) |
| Amber | Mild gap (30–49% below) |
| Orange | Moderate (50–69% below) |
| Light red | Severe (70–84% below) |
| Dark red | Critical (85%+) |

---

## 4. Heatmap cells

### 4.1 What a cell represents

Each cell represents the aggregated skill gap for one skill within one group (e.g. the "System Design" skill for the London location). When multiple data points exist for a skill/group combination (e.g. multiple teams in London), they are aggregated as follows:

- **Total headcount** — sum of headcount across all matching data points
- **Total below target** — sum of below-target counts across all matching data points
- **Average actual level** — weighted average of actual level scores, weighted by headcount

### 4.2 Cell colour rules

Cell colour is determined by the **gap score** (expected level minus average actual level). A negative gap means the group is exceeding expectations.

| Gap score | % below target | Cell colour | Label |
|---|---|---|---|
| Negative (exceeding) | — | Dark green | "exceeding" |
| < 0.3 | < 30% | Light green | "on track" |
| 0.3 – 0.79 | 30–49% | Amber | "mild gap" |
| 0.8 – 1.39 | 50–69% | Orange | "moderate" |
| 1.4 – 1.99 | 70–84% | Light red | "severe" |
| ≥ 2.0 | 85%+ | Dark red | "critical" |

If a cell has zero headcount (no data), it displays a dashed placeholder with a dash character and no colour.

### 4.3 Cell content

**When exceeding target:**
- An upward arrow icon
- The surplus value formatted as "+X.X" (e.g. "+0.4")
- Label: "exceeding"

**When at or below target:**
- The percentage of employees below target (e.g. "68%")
- A severity label from the table above (e.g. "moderate")

### 4.4 Cell tooltip

Hovering a cell shows a tooltip containing:
- Skill name
- Average actual level / expected level (e.g. "2.4 / 4")
- If exceeding: "+X.X above target"
- If not exceeding: "X of Y people below target (Z%)"
- Gap score (numerical)
- Team name if applicable (for "By Manager" grouping)

### 4.5 Cell interactions

- Hover: cell scales up slightly and gains a shadow
- Selected (after click): cell has a dark ring, scales up slightly, gains a medium shadow
- Clicking a cell opens the drilldown panel for that skill (see §5)
- Clicking the same cell again (or clicking elsewhere on the same skill row) deselects and closes the panel

---

## 5. The drilldown panel

The drilldown panel is a fixed-width right-hand sidebar that appears when the user selects a skill. It slides in from the right edge of the viewport. The main heatmap grid remains visible and scrollable behind it (narrowed to accommodate the panel).

### 5.1 Panel header

- Label: "Skill drill-down" in small caps
- Skill name as the panel heading
- Sub-label: "Across N [locations / managers / teams]" (matches the current group-by setting)
- Close button (×) dismisses the panel and deselects the skill
- A collapse/expand toggle allows the user to shrink the panel to a narrow strip to reclaim horizontal space, then expand it again

### 5.2 Summary cards

Four summary cards at the top of the panel body:

1. **Overall status card:**
   - If the department is exceeding target overall: shows "Exceeding" with the surplus ("+X.X") in green
   - If not exceeding: shows "Below" with the percentage of employees below target and the raw count in parentheses, in red

2. **Avg level card:**
   - Label: "Avg level"
   - Value: average actual level across all entries for this skill, to one decimal place, followed by "/ [expected level]" (e.g. "2.6 / 4")

3. **Worst area card:**
   - Label: "Worst area"
   - Value: the name of the location / manager / team (matching the current group-by) with the highest percentage of employees below target for this skill

### 5.3 Promotion pipeline section

A collapsible section within the drilldown panel. Collapsed by default; clicking the header expands it.

**Header shows:**
- "Promotion pipeline" label
- A count badge showing the total number of relevant candidates (both ready and blocked)

**When expanded, two sub-sections appear:**

**Candidates who meet next-level criteria for this skill:**
- Displayed as individual chips, each showing:
  - Person's initials in a teal avatar
  - Person's name
  - Their team and target level title (e.g. "Platform · Senior Engineer")
  - Their overall promotion readiness percentage
  - Their current rating for this skill vs the required rating (e.g. "3.8 / 4.0 required")
- Sub-section heading: "N person/people meet next-level criteria" (green)

**Candidates blocked by this skill gap:**
- Same chip format as above
- Sub-section heading: "N person/people is/are blocked by this skill" (red)
- These are people who would otherwise be near promotion-ready but whose score on this specific skill is preventing progress

### 5.4 Check-in drilldown panel

When the user clicks the check-in coverage row at the top of the heatmap grid, the panel switches to a check-in-specific view instead of a skill view. This panel shows:

- Overall coverage percentage for the department
- A segmented coverage bar (current / overdue / critical)
- A list of all employees flagged for missing check-ins, sorted by longest overdue first, each showing:
  - Employee name
  - Department and team
  - Days since last check-in
  - A severity badge: "Critical" (90+ days, red) or "Overdue" (30–90 days, amber)

### 5.5 Breakdown bars

Below the summary cards and pipeline section, a "Breakdown by [grouping]" section shows one horizontal bar per group column. Each bar shows:

- The group name (location / manager / team) as the label on the left
- The team name beneath the group name (where applicable)
- A percentage label showing what percentage of that group are below target for this skill
- A horizontal bar that fills to that percentage width, coloured by severity:
  - Green bar: < 30% below target
  - Amber bar: 30–49%
  - Orange bar: 50–69%
  - Red bar: ≥ 70%
- The actual vs expected levels shown at the right end of the bar (e.g. "2.4 / 4")

If a group is exceeding target, the bar and percentage are shown in sky/blue to distinguish "exceeding" from the standard green "on track".

Bars are sorted by percentage below target, highest first.

### 5.6 Actions footer

At the bottom of the drilldown panel, a "Suggested actions" section contains quick-action buttons:

| Condition | Button shown |
|---|---|
| One or more promotion-ready candidates exist for this skill | "View N promotion-ready in pipeline →" — navigates to the Promotion Pipeline page |
| No promotion-ready candidates exist | "Find mentors with this skill →" |
| Always shown | "Set as team focus skill →" |
| Always shown | "Export gap report →" |

The "View N promotion-ready in pipeline" button navigates to the Promotion Pipeline page filtered to this department.

---

## 6. Navigation links summary

| Trigger | Destination |
|---|---|
| Click any department card on the Overview | Department view for that department |
| Breadcrumb "← All departments" | Returns to the Overview |
| Click a skill name in the critical gaps alert bar | Selects that skill and opens its drilldown panel |
| Click the check-in coverage row | Opens the check-in drilldown panel |
| Click any skill label cell or heatmap cell | Opens the drilldown panel for that skill |
| "View N promotion-ready in pipeline →" button in the drilldown panel | Promotion Pipeline page (filtered to the current department) |
| "Gaps" quick-link on a Manager card (from the Manager Effectiveness page) | Department view for the relevant department |

---

## 7. Filter and grouping behaviour

### Filters
- Location and Level filters are independent. Both can be active simultaneously.
- When both are active, only employees matching both conditions are included.
- Filters apply to: the summary stats in the header, all cell values in the grid, the critical gaps alert bar, and all content in the drilldown panel.
- Filters do not reset when the user changes the group-by toggle.
- Filters do not reset when the user opens or closes the drilldown panel.
- If the active filters result in no data (e.g. no employees at IC4 level in Berlin for this department), the heatmap shows an empty state: "No data matches your filters."

### Group-by toggle
- Switching group-by updates the column headers and recalculates all cell values immediately.
- The currently selected skill (and its open drilldown panel) is preserved when the group-by changes.
- In "By Manager" mode, each manager's team names are shown as sub-text beneath the manager's name in the column header.
- In "By Department" mode, all data for the department is aggregated into a single column — this gives a single high-level view useful when filters are applied.

---

## 8. Data rules and calculations

### Gap score
A skill gap score for any cell is calculated as:  
`gap = expected level − average actual level`

A positive number means the group is below target. A negative number means they are exceeding. The gap displayed in tooltips and summary cards always shows the absolute value; sign context is communicated through colour and labels.

### Average actual level (cell aggregation)
When aggregating multiple data rows into a single cell (e.g. two teams both in London):  
`average actual = sum(actual × headcount) / total headcount`  
This is a headcount-weighted average, not a simple mean.

### Percentage below target
`% below target = (count below target / total headcount) × 100`, rounded to the nearest whole number.

### Org-level median gap
The org-level "Median gap score" shown in the Overview header is the median of all per-department median gap scores, rounded to one decimal place.

### Check-in coverage
`coverage % = ((total employees − flagged employees) / total employees) × 100`, rounded to the nearest whole number.  
An employee is considered "flagged" if their last check-in was more than 30 days ago.  
- 30–89 days overdue = "Overdue" (amber)
- 90+ days overdue = "Critical" (red)

The reference date used to calculate days since last check-in is the current date.

---

## 9. Empty and edge states

| Situation | Behaviour |
|---|---|
| No data matches the active filters | Grid body shows: "No data matches your filters." |
| A skill/group combination has no data | Cell shows a dashed placeholder tile with a "—" character |
| A department has zero critical skills | The critical gaps alert bar is not shown |
| A skill has no blocked promotion candidates | The "blocked by this skill" sub-section in the drilldown is not shown |
| A skill has no promotion-ready candidates | The "meets next-level criteria" sub-section in the drilldown is not shown |
| Check-in coverage is 100% | The check-in row still appears; the coverage bar is fully green with "All up to date" copy |

---

## 10. Out of scope for this document

- The Promotion Pipeline page (linked to from the drilldown panel actions)
- The Manager Effectiveness page (which links into the heatmap)
- The Ask AI sidebar (which can be opened from the main nav at any time and accepts skill gap context)
- The Decisions Journal (where commitments created from the heatmap are saved)
