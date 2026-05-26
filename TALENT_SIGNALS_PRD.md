# Talent Signals — Product Requirements

---

## Overview

Talent Signals is a workforce intelligence feature that gives people managers and HR leaders a real-time view of who is close to promotion, who is at risk of leaving, and which employees may be better suited to a different internal role. It is structured around departments and surfaces three categories of signal: **Promotion Pipeline**, **Flight Risk**, and **Hidden Talent**.

---

## Ticket 1 — Talent Signals: Department Grid (Overview Screen)

### Purpose
The entry point to Talent Signals. Presents a card-per-department summary of pipeline health so that leaders can quickly assess which departments need attention and navigate into the detail.

### Business Rules

- One card is displayed per department configured in the company.
- Each card is clickable and navigates to the department detail view (Ticket 2).
- If a department has no employees assessed in the system, the card displays a zero state (see Ticket 8) rather than pipeline data, but remains clickable so the user can learn what will appear once data is added.

### Metrics displayed per card

| Metric | Calculation |
|---|---|
| People count | Count of employees in that department who have been assessed against a level framework |
| Transitions count | Count of distinct target level IDs across all assessed employees in the department |
| Average readiness | Sum of all individual readiness scores ÷ count of assessed employees, rounded to nearest integer |
| Top candidate name | The assessed employee with the highest readiness score |
| Top candidate readiness % | That employee's readiness score |

### Pipeline breakdown bar
A proportional horizontal bar divided into segments, one per tier (see Ticket 3 for tier definitions). Each segment's width is: `(count in tier ÷ total assessed) × 100%`.

### Tier count chips
Five chips, one per tier, each showing the integer count of employees in that tier for the department.

### Bottom row
- If any employee is in the Near Ready tier, display the top candidate name and score.
- If no employee is in Near Ready but employees exist, display the highest-scoring employee as "Highest".

### Org-level summary strip (above the grid)
Four summary stats across all departments:

| Stat | Calculation |
|---|---|
| Total tracked | Count of all assessed employees org-wide |
| Near ready | Count of employees with a readiness score of 90% or above (excluding 100%) |
| Progressing | Count of employees with a readiness score of 70–89% |
| Avg readiness score | Sum of all readiness scores ÷ total assessed, rounded to integer; also shows average months in current level |

---

## Ticket 2 — Talent Signals: Department Detail View

### Purpose
A drill-down into a single department, with three tabs: Pipeline, Flight Risk, and Hidden Talent.

### Business Rules
- Header shows department name and count of assessed employees.
- The user can navigate back to the department grid at any time.
- Quick-access links to the department's Skill Gap Report and Manager view are surfaced in the header.
- The three tabs are: Pipeline (default), Flight Risk, Hidden Talent.
- Each tab is independent; switching tabs does not reset state in the other tabs.

---

## Ticket 3 — Talent Signals: Promotion Pipeline Tab

### Purpose
Lists all assessed employees in the department sorted by readiness score descending, grouped into readiness tiers. Clicking an employee expands an individual readiness panel (Ticket 4).

### Readiness Score Calculation
For a given employee and their target level framework:

1. Retrieve the set of skill criteria defined for the target level.
2. For each criterion, compare the employee's assessed skill rating against the required rating.
3. A criterion is **met** if `actual_rating >= required_rating`.
4. `readiness_pct = round((criteria_met / criteria_total) × 100)`

Skills are rated on a 1–5 integer scale. Only assessed (not inferred) skills are used in the readiness score calculation for the pipeline.

### Target Level
Each employee is assessed against the next level above their current level on their career track (IC or Manager). An employee at the top of their track has no target level and is excluded from the pipeline.

### Readiness Tiers

| Tier | Range | Label |
|---|---|---|
| Ready | 100% | Ready |
| Near Ready | 90–99% | Near Ready |
| Progressing | 70–89% | Progressing |
| Developing | 50–69% | Developing |
| Building | < 50% | Building |

### Recommendations (per employee in the pipeline)
The system generates plain-language recommendations for each employee based on their readiness tier and gap profile:

- **Ready / Near Ready:** Recommend initiating a promotion conversation. If the employee also has a flight risk signal, flag urgency.
- **Progressing:** Identify the largest skill gap (highest `required - actual` delta) and recommend focused development on that skill.
- **Developing / Building:** Recommend a structured development plan and suggest pairing with a senior peer or manager for mentoring on the top-gap skill.

If the employee has no check-in logged in the last 30 days, append a recommendation to schedule a check-in.

### Department-level summary statistics (shown above the list)

| Stat | Calculation |
|---|---|
| Near ready | Count of employees in Near Ready tier in this department |
| Avg readiness | Sum of readiness scores ÷ count, rounded to integer |
| Avg tenure in level | Sum of months each employee has spent in their current level ÷ count, rounded to integer |
| Last check-in coverage | Count of employees with a check-in in the last 30 days ÷ total, as a percentage |

---

## Ticket 4 — Talent Signals: Individual Readiness Panel

### Purpose
A side panel showing the full readiness breakdown for a single employee. Opens when a user clicks an employee row in the Pipeline tab.

### Content

- Employee name, team, department, location.
- Months in current level.
- Target level label.
- Readiness score (percentage, large display).
- Criteria met count and criteria total count.
- **Met criteria list:** All skills where `actual >= required`, sorted by skill name. Shows actual rating, required rating.
- **Gaps list:** All skills where `actual < required`, sorted by gap size descending (largest gap first). Shows actual rating, required rating, and gap delta.
- Skills are displayed with their category label (e.g. Architecture, Quality, Collaboration).
- Ratings are displayed on a 1–5 scale.

### Actions from this panel
- View latest check-in for this employee.
- Ask AI about this employee's readiness and development needs (pre-populates the AI query with the employee's name and a readiness question).
- Schedule a check-in (links to check-in scheduling flow).

---

## Ticket 5 — Talent Signals: Flight Risk Tab

### Purpose
Surfaces employees in the department who have been identified as at risk of leaving, ordered by risk level and urgency. Enables managers to act before attrition occurs.

### Risk Level Source
Flight risk levels are sourced from an external job-switching propensity model (e.g. Revelio Labs). The model produces a signal per employee of **high**, **medium**, or **low**.

The tab defaults to showing **medium and high risk** employees. Low risk employees are not shown.

### Sort Order
Employees are sorted:
1. High risk first, then medium.
2. Within the same risk level, sorted by days since last check-in, descending (longest gap first).

### Per-employee information
- Name, department, current level, location.
- Risk level badge (High / Medium).
- Days since last check-in (calculated from the check-in date to the current date).
- Flight risk drivers: a list of plain-language reasons surfaced by the risk model. Examples include stalled tenure, peer salary gap, LinkedIn activity increase, below-band compensation.
- Whether the employee has an identified internal mobility opportunity (see Ticket 6).

### Department-level summary stats (shown above the list)

| Stat | Calculation |
|---|---|
| High risk | Count of employees in this department with high flight risk |
| Avg days since check-in | Sum of days since last check-in for all at-risk employees ÷ count |
| Internal match available | Count of at-risk employees who also appear as a cross-department fit candidate (i.e. have an internal mobility option) |

### "Internal match available" stat
Tapping / clicking this stat navigates the user directly to the Hidden Talent tab.

---

## Ticket 6 — Talent Signals: Hidden Talent Tab

### Purpose
Surfaces employees whose career history and inferred skills suggest they would be a stronger fit in a different department. Intended to help managers act on retention risk by offering a meaningful internal move before the employee leaves.

### Inferred Skills
In addition to assessed skills, the system ingests LinkedIn career history and qualification signals to infer skills the employee has demonstrated in prior roles. Inferred skills are stored separately from assessed skills. They are used only in Hidden Talent calculations, not in the core readiness score (Ticket 3).

### Cross-Department Fit Score Calculation
For each employee who has inferred skills:

1. Merge assessed and inferred skills into a combined profile. Where an inferred skill has no assessed equivalent, apply a **one-level discount** to the inferred rating to reflect lower confidence: `effective_rating = max(1, inferred_rating - 1)`.
2. Score the employee against every IC-track level framework in departments other than their current one, using the merged skill set.
3. Only consider frameworks at the **same or adjacent IC level** to the employee's current level (within ±1 rank).
4. A framework is a candidate match if: `suggested_dept_fit >= 50%` AND `suggested_dept_fit - current_readiness >= 20 points`.
5. Where an employee matches multiple departments, retain only the **highest delta** match.

### Current Readiness Baseline
The baseline used in the delta calculation is the employee's next-level readiness in their current department (from the pipeline). A floor of 20% is applied so that no employee shows 0% fit in their own department.

### Sort Order
Results sorted by delta descending (largest improvement in fit first).

### Per-employee information
- Name, current department, current level.
- Current next-level readiness % (in their existing department).
- Suggested department and level.
- Fit % in the suggested role (using merged skills).
- Delta: `fit_pct - current_readiness_pct`, shown as a positive number of points.
- Matched criteria count and total criteria count.
- Top inferred skill signals (up to 3) that drive the fit, each with: skill name, source evidence (e.g. "2 years as PM at [prior company]"), and confidence level (high / medium / low).
- LinkedIn career signals: list of prior roles / qualifications that informed the inferred skills.
- Flight risk level for this employee.

### Relationship to Flight Risk
An employee who appears in both Flight Risk and Hidden Talent is flagged with a "has internal opportunity" indicator in the Flight Risk tab. This is how the "Internal match available" stat in Ticket 5 is counted.

---

## Ticket 7 — Talent Signals: Level Frameworks

### Purpose
Defines the skill criteria required to progress to each level within each department. These frameworks are the foundation of all readiness calculations.

### Structure
Each level framework consists of:
- A target level ID (the level the employee is being assessed for readiness to reach).
- A list of skill criteria, each with: skill name, category, and required rating (1–5).

### Career Tracks
Each level belongs to either an **IC track** (Individual Contributor) or a **Manager track**. Readiness is always calculated relative to the next level on the employee's current track.

### Level Hierarchy
Levels are chained: each level definition references the ID of the next level. An employee at the top of their track (no next level) is not included in the pipeline.

### Skill Ratings
Skill ratings use a 1–5 integer scale:
- 1 = Awareness
- 2 = Foundational
- 3 = Proficient
- 4 = Advanced
- 5 = Expert

A criterion is met when the employee's rating is **equal to or greater than** the required rating for that criterion at the target level.

### Configuring Frameworks
Frameworks are configured per department and per level. The set of criteria and required ratings for each transition are defined by the company at setup and can be updated over time. Changes to a framework do not retroactively alter historical readiness scores.

---

## Ticket 8 — Talent Signals: Zero State (No Department Data)

### Purpose
When a department has not yet been set up with assessed employees, the system shows a structured zero state rather than empty content. This applies to both the department card on the grid and the full department detail view.

### Department Card Zero State
- The card is still clickable (navigates to the department detail zero state).
- A "No data" label is displayed alongside the department name.
- Sub-label reads: "Pipeline not yet set up".
- Pipeline breakdown bar shows as an empty/flat placeholder.
- Tier count chips show a dash (—) in place of numbers.
- A short prompt is shown explaining that connecting HRIS data will populate the card.

### Department Detail Zero State
When navigating into a department that has no assessed employees:
- Standard navigation header is shown (back link, department name).
- Body shows: department name, a clear headline confirming no data exists, and a brief description of what will appear once employees are assessed.
- Three preview cards explain the three categories of signal that will appear: Promotion Pipeline, Flight Risk, Hidden Talent.
- A three-step guide explains how to get started: connect HRIS, map employees to a level framework, run first assessment.
- A back link returns the user to the department grid.

---

## Ticket 9 — Talent Signals: Check-In Coverage Logic

### Purpose
Check-in coverage is surfaced in the Pipeline tab summary and is used to flag urgency in individual employee recommendations.

### Business Rules
- A check-in is considered **recent** if it was logged within the last **30 days** from the current date.
- Check-in coverage % = `(employees with a recent check-in ÷ total assessed employees in department) × 100`, rounded to integer.
- If an employee has no check-in date recorded at all, they are treated as not having a recent check-in.
- An individual employee is flagged for a check-in recommendation in the pipeline if their last check-in was more than 30 days ago or they have no check-in on record.

---

## Ticket 10 — Talent Signals: AI Integration

### Purpose
Every employee panel and department view includes an "Ask AI" affordance that pre-populates a question about the employee or department into the AI assistant. The AI assistant has access to the full workforce context snapshot.

### Pre-populated query: individual employee
When a user triggers "Ask AI" from an individual readiness panel, the query is pre-populated with:
`"Tell me about [employee name]'s promotion readiness and what they need to work on"`

### Workforce context provided to AI
The AI assistant receives a structured snapshot of the workforce that includes:
- All assessed employees and their readiness scores.
- All flight risk signals and drivers.
- All cross-department fit candidates and their fit scores.
- Department-level aggregates.

This context is provided at query time and is not stored as a persistent AI memory.

### AI output types relevant to Talent Signals
The AI can respond with structured output types that render as formatted cards in the UI, including: person lists, skill gap lists, department summaries, flight risk lists, scenario analysis, and recommendations. Plain text responses are also supported.
