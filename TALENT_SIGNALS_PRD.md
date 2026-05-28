#lation
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

---

## Ticket 11 — Talent Signals: Feature Tracking (Placeholder)

### Purpose
Placeholder ticket for tracking the Talent Signals feature end-to-end across build, QA, and release.

### Scope
This ticket is the parent epic. All other Talent Signals tickets (1–10, 12–13) are children of this ticket. It is used to:
- Track overall feature readiness for release.
- Coordinate cross-functional sign-off (product, design, engineering, QA).
- Gate any phased rollout or feature flag decisions.

### Definition of Done
All child tickets are complete, the feature has passed QA, and sign-off has been given by product and the relevant stakeholder (e.g. HR leadership sponsor).

---

## Ticket 12 — Shared Feedback Component

### Purpose
A reusable in-product feedback banner that appears at the bottom of each major view. It prompts the user with a context-specific question, opens a structured feedback flow, and submits the response for product analysis. This is a shared component used across Talent Signals and other features.

### Business Rules

- Each view that includes the banner passes a **context label** (e.g. "Talent Signals", "Manager Effectiveness"). The banner uses this label to display a tailored prompt question and sub-text.
- If no specific copy is configured for a given context label, a generic fallback question is shown: "Is this view useful for your work?" with sub-text "Tell us what's missing or what would make it better."
- Clicking the primary CTA opens a **feedback flow** modal/overlay — a short structured form capturing the user's response.
- The feedback flow is triggered from the banner only; it does not open automatically.
- The banner persists on screen until the user submits feedback or dismisses it. Dismissal state is session-scoped (the banner reappears on next session).
- The component accepts a `context` string and an optional layout class for spacing control.

### Context-specific copy (confirmed)

| Context | Question | Sub-text |
|---|---|---|
| Skills Heatmap | Is this heatmap surfacing the gaps that matter most to you? | Tell us what data or filters would make it more actionable. |
| Skills Overview | Does this department view help you plan development conversations? | We'd love to know what's missing from the skills picture. |
| Areas to Improve | Is this gap report giving you what you need to make a case? | Tell us what would make this report more useful in practice. |
| Talent Signals | Does this view reflect how you actually think about readiness? | Share what's missing from the talent picture. |
| Manager Effectiveness | Are these manager metrics helping you have better conversations? | Tell us what signals you wish you had. |
| Industry Benchmarks | Are you benchmarking against the right peers? | Let us know what comparisons would be most useful. |
| Executive Summary | Is this summary giving you what you need before a leadership meeting? | Tell us what signals belong on this page. |
| Decisions Journal | Is the journal helping you follow through on commitments? | Tell us how we can make it a better accountability tool. |

### Placement
The feedback banner appears at the bottom of the main content area on each view. It sits below all primary content and below any upsell banner where both are present.

---

## Ticket 13 — Upsell Banner Component

### Purpose
A dismissible contextual banner that surfaces a relevant third-party service recommendation based on a signal detected in the current view. Intended to connect product-identified insights (e.g. a skills gap, near-ready pipeline, high flight risk) to a concrete commercial action via a partner service.

### Business Rules

- The banner is **variant-driven**: each instance is configured with a `variant` value that determines all copy, icon, and colour treatment.
- The banner is **dismissible per session**: once dismissed, it does not reappear until the next session. No cross-session persistence is required.
- The CTA link is an external link to the partner service. It opens in a new tab.
- The banner renders a "trigger" line — a short plain-language description of the insight that caused this recommendation to surface (e.g. "Near-ready candidates identified in your pipeline"). This is part of the variant configuration, not dynamic per-user data.
- The banner accepts an optional layout class for spacing control.

### Variants

| Variant | Service | Provider | Trigger context | Headline summary |
|---|---|---|---|---|
| `talent-development` | Talent Development | Careerminds | Critical skill gap detected | Close this skills gap with a structured upskilling programme |
| `leadership-dev` | Leadership Development | Keystone Partners | Near-ready candidates in pipeline | Accelerate bench growth with executive coaching |
| `manager-coaching` | Manager Coaching | Keystone Partners | Manager effectiveness below threshold | Targeted coaching to turn a struggling manager around |
| `outplacement` | Outplacement Services | Careerminds | High flight-risk with no intervention plan | Protect employer brand when people do leave |
| `comp-review` | Career Dev + Comp Review | Careerminds | Team compensation below industry benchmark | Act on comp gap before talent walks |

### Placement within Talent Signals
- `leadership-dev` variant appears at the bottom of the Promotion Pipeline department grid view.
- `outplacement` variant is available for use at the bottom of the Flight Risk tab.

### Placement in other features
The component is shared across features. Other placements (Skills Heatmap, Manager Effectiveness, Benchmarks) use their respective variants and are out of scope for this ticket but use the same component.
