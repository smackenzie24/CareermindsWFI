# CareermindsWFI — Workforce Intelligence Dashboard

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-ixvzkyhr)

A production-grade workforce analytics platform built for Chief People Officers and HR leaders. CareermindsWFI (branded internally as **Progression**) gives people teams a unified view across promotion readiness, skills gaps, manager effectiveness, industry benchmarking, and churn risk using an AI chat system backed by Anthropic Claude (uses Opus 4.7 currently).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Views & Features](#views--features)
- [Data Architecture](#data-architecture)
- [AI Chat System](#ai-chat-system)
- [Key Algorithms](#key-algorithms)
- [Database](#database)
- [Edge Function: Workforce AI](#edge-function-workforce-ai)
- [Navigation Model](#navigation-model)
- [Tour System](#tour-system)
- [Feedback System](#feedback-system)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

---

## Overview

CareermindsWFI tracks **192 employees** across **7 departments** and surfaces the information CPOs need to make decisions fast:

- Who is ready for promotion right now?
- Where are our biggest skills gaps?
- Which managers need coaching?
- How do we compare to industry peers?
- What happens if we lose 3 senior engineers?

The platform answers all of these through 8 purpose-built dashboard views plus a full conversational AI assistant — and saves every commitment to a persistent decisions journal backed by Supabase.

**Key numbers at a glance:**

| Dimension | Count |
|---|---|
| Total employees tracked | 192 |
| Promotion pipeline candidates | 42 |
| Skills mapped | 61 across 7 departments |
| Managers with effectiveness metrics | 11 |
| Peer benchmark companies | 8 |
| AI chat intents handled locally | 30+ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase (Postgres + Edge Functions) |
| AI | Anthropic Claude (via Supabase Edge Function) |
| Data | Static mock data in `src/data/` (except Commitments journal) |

---

## Getting Started

```bash
npm install
npm run dev         # dev server at http://localhost:5173
npm run build       # production build (also runs type check)
npm run typecheck   # type-check without emitting
npm run lint        # ESLint
```

---

## Views & Features

### 1. Executive Summary (Home)

The CPO landing screen. Aggregates every workforce signal into one scrollable dashboard.

**Workforce AI input** — Ask any natural language question at the top of the page. Suggestion chips provide one-click access to the most common queries.

**KPI Strip (7 cards, collapsible)**

| Card | What it shows |
|---|---|
| Org Health Score | 0–100 composite score (see algorithm below) |
| Critical Skill Gaps | Skills where 70%+ of workforce is below target |
| Promotable Now | People in the Near-Ready tier (90%+ readiness) |
| Stalled 24M+ | People stuck 24+ months with <50% readiness |
| Managers | Managers flagged for coaching support |
| Industry Rank | Acme's quartile rank vs peer companies |
| No Check-In | People with no check-in in the last 30 days |

**Priority Risks** — Up to 5 risk cards, each with severity (critical = red, warning = amber), a headline metric, detail text, source module label, and a direct action button navigating into the relevant view.

**Highlights** — Positive signals worth communicating to leadership (e.g. top-quartile departments, strong promotion pipeline, high-performing managers).

**Check-in Coverage** — Segmented bar (current / overdue 30–90d / critical 90d+) plus a per-person list sorted by days overdue.

**Department Health Table** — One row per department showing: health score bar, avg skill competency, near-ready count, stalled count, benchmark quartile position, and drill-down links to that department's gap report, pipeline, and benchmark.

---

### 2. Skills Gap Heatmap

A filterable grid of all 61 skills across the organisation.

**Filters:** Department, Location, Level (IC1–IC4, M1–M2), Group By (Department or Location)

**Heatmap cells** are colour-coded by gap severity:
- Green — at or above target
- Yellow — small gap (<0.5)
- Orange — medium gap (0.5–1.0)
- Red — large gap or >70% of headcount below target

Each cell shows headcount, average actual rating (1–5), and expected rating.

**Drilldown panel** (right-side, collapsible) — Click any cell to see: skill category, expected vs actual across the population, a sorted list of people below target grouped by readiness tier, and links to the promotion pipeline and gap report.

---

### 3. Promotion Pipeline

Readiness tracking for all 42 pipeline candidates across 4 tiers.

**Readiness Tiers**

| Tier | Threshold | Meaning |
|---|---|---|
| Near-Ready | ≥90% | Eligible for promotion now |
| Progressing | 70–89% | On track, minor gaps to close |
| Developing | 50–69% | Needs structured upskilling |
| Early | <50% | Too early for promotion cycle |

**Department selector** — Filter by department to see that team's pipeline distribution.

**Person cards** — Each shows name, current level, target level, readiness %, tenure in current role, top blocking skill, and location. Click to expand the full framework criteria breakdown.

**Person detail panel** — Lists every skill criterion for the target level, marking each as Met (with actual vs required rating) or Gap. Includes suggested actions (upskill, internal mobility, etc.).

---

### 4. Department Gap Report

A per-department deep-dive into skill gaps, filterable by level, team, and location.

**Skill table** — Rows per skill showing category, average actual rating, expected rating, gap magnitude, and number of people below target. Sortable by any column.

**Row expansion** — Expand any skill row to see the individual people below target and suggested learning resources.

---

### 5. Manager Effectiveness

Performance signals for all 11 managers.

**Manager cards** show: name, title, department, location, avg readiness of reports, near-ready and stalled counts, top blocking skill across the team, effectiveness score, and trend indicator (up / flat / down).

**Effectiveness score** is a weighted composite (see algorithm section). Managers scoring below 40 are flagged as needing coaching support.

**Manager detail view** — Full breakdown: all direct reports with individual readiness %, framework completion by skill category, strongest skills vs biggest gaps, and recommended actions.

---

### 6. Industry Benchmark

Quartile comparison against 8 peer companies (Verity HQ, Cortex Labs, Solara Finance, Meadow Platform, Hatch Commerce, Orbis Cloud, Ripple Analytics, Axiom Market — ranging from 68 to 840 headcount across Startup / Scaleup / Enterprise stages).

**Tabs:**

| Tab | What it benchmarks |
|---|---|
| Overview | Overall quartile position, rank, top and gap departments |
| Skills | Dept skill competency (avg 1–5) vs peer p25/p50/p75 |
| Compensation | Avg annual comp USD per department vs peers |
| Team Size | Dept headcount as % of org total vs peers |
| Categories | Skill category competency across 24 categories |

Each data point shows Acme's value, the peer quartile band (shaded), and the delta from median.

---

### 7. Decisions Journal

A persistent log of every commitment and action item captured via the AI assistant.

**Table columns:** commitment text, insight kind (badge), department, date created, status toggle.

**Status lifecycle:** open → done → dismissed (reversible).

**Filters:** by insight kind (promotion, churn-risk, skill-gap, benchmark, general) and status.

**Source replay:** click "Review source" on any commitment to re-open the AI chat with the original question that surfaced the insight.

---

### 8. Workforce AI (Ask AI)

A full-page conversational AI experience. Also accessible as a slide-out sidebar panel (`ChatPanel`) from any other view.

- 8 diagnostic prompt suggestions (pipeline, gaps, risks, etc.)
- 9 planning prompt suggestions (hiring strategy, 90-day plan, restructure analysis)
- Document upload — attach a PDF, CSV, JSON, or TXT file and its contents are appended to the AI context (useful for salary data, board decks, etc.)
- Conversation state is preserved when navigating away and back
- See [AI Chat System](#ai-chat-system) for full detail on intents and result types

---

## Data Architecture

All application data is **static mock data** in `src/data/`. The only live database table is `commitments` (decisions journal).

### Skill Gap Data (`mockData.ts`)

61 `SkillGapEntry` records, each containing:

```ts
{
  skill: string           // e.g. "System Design"
  category: string        // e.g. "Architecture"
  department: string      // Engineering | Product | Design | Data | Marketing | Sales | People Ops
  location: string        // London | New York | Berlin | Singapore | Remote
  team: string
  level: string           // IC1 | IC2 | IC3 | IC4 | M1 | M2
  averageActual: number   // 1–5 rating (current competency)
  expectedLevel: number   // 1–5 rating (required)
  headcount: number
  belowTarget: number     // count of people below expectedLevel
}
```

Departments and their skill counts: Engineering (11), Data (11), Product (10), Design (10), Marketing (10), Sales (10), People Ops (10).

---

### Promotion Pipeline Data (`promotionData.ts`)

**42 People** tracked for promotion. Each `Person` has:

```ts
{
  id, name, department, team, location
  currentLevelId: string          // e.g. "eng-ic3"
  skills: Record<string, number>  // skillId → actual rating 1–5
  tenure: number                  // months in current level
  lastCheckIn: string             // ISO date
}
```

**24 Level Definitions** span all departments across IC and Manager tracks (Engineering IC1–IC4 + M1–M2, Product IC1–IC4, Design IC1–IC3, Data IC1–IC3, Marketing IC1–IC3, Sales IC1–IC3, People Ops IC1–IC2 + M1).

**Level Frameworks** define the skill criteria for each target level (e.g., to reach eng-ic4, a person must hit specific ratings across 8 skills). `computeReadiness(person, framework)` compares actual skills against criteria and returns `readinessPct` plus per-skill met/gap detail.

---

### Manager Data (`managerData.ts`)

**11 Managers** across all departments:

- **Engineering** — Alex Rivera (Platform + Frontend), Nina Obi (Backend), Sven Holst (Mobile + Infrastructure)
- **Product** — Claire Zhou (Growth + Core), James Osei (Partnerships)
- **Design** — Mara Santos
- **Data** — Yoko Tanaka
- **Marketing** — Pierre Duval
- **Sales** — Keisha Brown (Enterprise), Will Park (Mid-Market + SMB)
- **People Ops** — Anya Reeves

`computeManagerMetrics(manager)` returns: avg readiness of reports, near-ready and stalled counts, avg tenure, framework completion %, top blocking skill, promotion-ready count, and a composite effectiveness score.

---

### Benchmark Data (`benchmarkData.ts`)

**8 Peer Companies**, each with:
- `deptHeadcountPct` — headcount distribution by department
- `deptComp` — avg annual comp USD per department
- `deptSkillCompetency` — avg 1–5 rating per department
- `categoryCompetency` — avg 1–5 across 24 skill categories
- `frameworkMaturity` — 1–5 career framework sophistication score
- `promotionVelocity` — avg months to next level org-wide

Quartile helpers (`computeQuartiles`, `getQuartilePosition`) classify Acme into top / above-median / below-median / bottom for every dimension.

---

### Executive Summary Data (`execSummaryData.ts`)

`computeExecSummary()` aggregates all data sources into a single `ExecSummary` snapshot including org health score, risk list, wins list, check-in flags, and per-department health snapshots. Called once on mount and memoised.

---

## AI Chat System

### Two Entry Points

| Component | Location |
|---|---|
| `ChatPanel` | Slide-out sidebar — available from any non-home view |
| `AskAIPage` | Full-page experience with document upload and richer rendering |

Both call `query(input)` from `chatEngine.ts` first. If the input matches a local intent, a structured `QueryResult` is returned immediately (no API call). If `needsAI: true`, the frontend POSTs to the `workforce-ai` Supabase edge function.

---

### Local Intents (30+)

**Diagnostic intents:**

| Trigger phrase | Handler | Returns |
|---|---|---|
| "Who is ready for promotion?" | `handlePromoReady` | `person-list` (Near-Ready tier) |
| "Who is progressing?" | `handleProgressing` | `person-list` (Progressing tier) |
| "Who is at churn risk?" | `handleChurnRisk` | `decision` with 3 options |
| "Skills gaps" | `handleSkillsGaps` | `decision` with 3 paths |
| "Pipeline summary" | `handleDeptPipeline` | `dept-summary` |
| "Show me everyone" | `handleEveryone` | `person-list` (all 42 sorted by readiness) |
| "Org stats" | `handleOrgStats` | `stat-cards` (6 KPIs) |
| Person name | `handlePersonSearch` | `person-list` (fuzzy match) |

**Planning intents:**

| Trigger phrase | Handler | Returns |
|---|---|---|
| "Build a retention plan" | `handleRetentionPlan` | `recommendation` (4–5 actions) |
| "Close skill gaps" | `handleUpskillStrategy` | `recommendation` with timelines |
| "Hiring strategy" | `handleHiringStrategy` | `recommendation` per department |
| "What if we lose 3 senior engineers?" | `handleScenarioPlanning` | `scenario` with mitigations |
| "90-day plan" | `handleActionPlan` | `recommendation` (3-phase plan) |
| "Restructuring" | `handleTeamRestructure` | `recommendation` |
| "Compare to peers" | `handleBenchmarkStrategy` | `recommendation` |

**Headcount reduction workflow:**

A guided multi-step flow triggered by "headcount reduction plan":
1. `handleHeadcountReductionClarify` → `clarification` (asks savings target, headcount %, timeline)
2. `handleHeadcountReduction` → `reduction` — full `ReductionAnalysis` including:
   - Per-department capability risk ratings (critical / high / medium / low)
   - Near-ready talent lost by department
   - Critical skills at risk
   - Alternative savings options (hiring freeze, voluntary separation, etc.)
   - Legal flags (WARN Act, TULRCA, selection criteria, consultation timelines)
   - Detailed process steps (7–9 steps, timeline-aware)

**Partner qualification workflow:**

Triggered by "How can Careerminds help?" — a 3-question clarification flow that maps answers to a specific Careerminds or Keystone Partners service recommendation.

---

### Query Result Types

`AIChatRenderer.tsx` switches on `result.kind` to render each type:

| Kind | Rendered as |
|---|---|
| `person-list` | Table: name, dept, readiness %, tier, target level, top gap, tenure, location |
| `skill-gap-list` | Table: skill, dept, avg actual, expected, gap, # below target |
| `dept-summary` | Department cards with headcount, tier distribution, avg readiness |
| `churn-risk-list` | Highlighted person list with risk reasoning |
| `stat-cards` | 6 KPI cards |
| `recommendation` | Card with urgency badge, context, and action items (each with type, label, impact, timeframe, nav link) |
| `scenario` | Card with current state, projected impact, risk level, mitigation list |
| `reduction` | Full reduction report with dept-by-dept impact table and legal flags |
| `decision` | 3–4 clickable option buttons — clicking one fires a follow-up query |
| `commitment-prompt` | "Save this to your decisions journal" prompt |
| `labeled-people` | Contextual person list with custom subheading |
| `clarification` | Follow-up questions with chip options |
| `partner-recommendation` | Careerminds / Keystone service card with CTA |

---

## Key Algorithms

### Promotion Readiness Score

```
For each person:
  for each skill criterion in target level framework:
    if person.skills[skillId] >= criterion.requiredRating → met
    else → gap (with required - actual delta)

  readinessPct = (met / total) × 100
  tier = 90%+ → near-ready | 70–89% → progressing | 50–69% → developing | <50% → early
```

### Manager Effectiveness Score

```
effectivenessScore =
  (avgReadiness × 0.40) +
  (frameworkCompletion × 0.30) +
  ((100 - stallRatio × 100) × 0.30)

If score < 40 → flagged for coaching support
```

### Org Health Score

```
score = 100
score -= min(criticalSkillGaps × 4, 25)
score -= min(stalledCount × 2, 20)
score -= managersNeedingSupport × 5
score -= benchmarkPenalty { top: 0, above-median: 5, below-median: 12, bottom: 20 }
return clamp(score, 10, 100)
```

### Department Health Score (Exec Summary)

```
skillScore      = (avgActualRating / 5) × 100
avgReadiness    = avg readiness % of all people in dept
benchScore      = { top: 90, above-median: 70, below-median: 45, bottom: 20 }[quartile]
antiStall       = max(0, 100 - (stallRatio × 300))

overallScore    = (skillScore × 0.30) + (avgReadiness × 0.30) + (benchScore × 0.25) + (antiStall × 0.15)
```

### Benchmark Quartile Classification

```
Given 8 peer values:
  p25 = 25th percentile interpolated
  p50 = median
  p75 = 75th percentile

  Acme value >= p75 → top
  Acme value >= p50 → above-median
  Acme value >= p25 → below-median
  else             → bottom
```

### Headcount Reduction Capability Risk

```
For each department:
  coveragePct = (headcount - targetReduction) / headcount × 100
  criticalSkills = skills where belowTarget >= 3 AND expectedLevel > averageActual

  if coveragePct < 75 AND criticalSkills >= 2  → critical
  if coveragePct < 85 OR (criticalSkills >= 1 AND benchDelta > 0.3) → high
  if coveragePct < 92  → medium
  else → low
```

---

## Database

### Table: `commitments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `text` | text | The commitment / action item text |
| `context` | text | Contextual summary from the triggering insight |
| `insight_kind` | text | promotion \| churn-risk \| skill-gap \| benchmark \| general |
| `department` | text | Optional — department scope |
| `source_query` | text | The original question that surfaced the insight |
| `status` | text | open \| done \| dismissed |
| `created_at` | timestamptz | Auto-set on insert |
| `updated_at` | timestamptz | Auto-set on update |

RLS is enabled. Authenticated users can only read and write their own commitments.

---

## Edge Function: Workforce AI

Located at `supabase/functions/workforce-ai/index.ts`.

- **Model:** Claude (configurable in function code)
- **Max tokens:** 600
- **Input:** `{ question: string, context?: string }` — `context` is appended when the user uploads a document
- **Output:** `{ text: string }`
- **System prompt:** Instructs Claude to act as a workforce analytics expert, use the provided data snapshot (`buildWorkforceContext()` output), be concise, and be honest about data limitations
- **Requires:** `ANTHROPIC_API_KEY` set as a Supabase Edge Function secret

The workforce context snapshot passed to Claude includes: total headcount, promotion pipeline breakdown by tier and department, top skills gaps with counts, manager signals, and benchmark comparison data.

---

## Navigation Model

`App.tsx` owns all navigation via a `NavState` object — no routing library is used.

```ts
type NavState = {
  view: 'home' | 'heatmap' | 'pipeline' | 'gap-report' | 'managers' | 'benchmark' | 'journal' | 'ask-ai' | 'how-it-works'
  department?: Department
  managerId?: string
  benchmarkTab?: string
  aiQuestion?: string
}
```

Views are rendered with conditional JSX. The `ask-ai` view is **always mounted but hidden** so its conversation state (message history, uploaded document) persists when navigating to other views and back.

When the user navigates from the AI chat to another view, a "Back to AI conversation" bar appears at the top of that view, allowing instant return.

---

## Tour System

`TourOverlay.tsx` renders a guided walkthrough across all 8 views. Step definitions live in `src/components/tour/tourData.ts`.

Each `TourStep` has:
- `id`, `view` — which view this step belongs to
- `title`, `body` — explanatory text
- `anchorId` — matches a `data-tour="..."` attribute on the target DOM element
- `anchorOffsetX/Y` — 0–1 position within the element where the indicator dot sits
- `side` — which side of the element the card opens on (right / left / top / bottom)

40+ steps are defined across all views. Activate with the tour button in the top nav bar.

---

## Feedback System

A 3-step feedback flow (`FeedbackFlow.tsx`) surfaced by a periodic banner (`FeedbackBanner.tsx`):

1. **Rating** — 5-point emoji scale
2. **Comment** — optional text feedback
3. **Research opt-in** — "Can we follow up with you?" with optional name + email

The banner appears after the user spends time on a view and can be dismissed. Context (which view triggered it) is stored with the submission.

---

## Project Structure

```
src/
  App.tsx                     # NavState machine, top navigation bar
  components/
    ai/
      AIChatRenderer.tsx      # Renders all 12 QueryResult kinds
      AskAIPage.tsx           # Full-page AI experience + document upload
    benchmark/
      IndustryBenchmark.tsx   # 5-tab benchmark comparison view
    feedback/
      FeedbackBanner.tsx      # Periodic feedback prompt
      FeedbackFlow.tsx        # 3-step feedback modal
    managerEffectiveness/
      ManagerEffectiveness.tsx # Manager list view
      ManagerDetail.tsx        # Individual manager deep-dive
    promotion/
      PromotionPipeline.tsx   # Pipeline with tier swimlanes
      DeptPipelineView.tsx    # Per-dept pipeline summary
      PersonPanel.tsx         # Individual person readiness detail
    tour/
      TourOverlay.tsx         # Tour UI (dot + card + nav)
      tourData.ts             # 40+ step definitions
    ChatPanel.tsx             # Slide-out AI chat sidebar
    CommitmentsJournal.tsx    # Decisions journal table
    DepartmentOverview.tsx    # Dept summary card
    DeptGapReportPicker.tsx   # Department selector for gap report
    DrilldownPanel.tsx        # Right-side collapsible detail panel
    ExecutiveSummary.tsx      # Home / CPO dashboard
    HeatmapCell.tsx           # Single heatmap grid cell
    HowItWorks.tsx            # Platform explainer page
    SkillGapReport.tsx        # Per-dept skill gap table
    SkillsGapHeatmap.tsx      # 61-skill heatmap grid
    Tooltip.tsx               # Shared tooltip component
    UpsellBanner.tsx          # Upgrade prompt
  data/
    benchmarkData.ts          # 8 peer companies + quartile helpers
    chatEngine.ts             # AI intent router + all local handlers
    execSummaryData.ts        # computeExecSummary() + scoring
    managerData.ts            # 11 managers + computeManagerMetrics()
    mockData.ts               # 61 SKILLS_DATA + org constants
    promotionData.ts          # 42 PEOPLE + readiness computation
  lib/
    supabase.ts               # Supabase singleton client + Commitment type
supabase/
  functions/
    workforce-ai/
      index.ts                # Anthropic Claude edge function
  migrations/
    20260429121239_create_commitments_table.sql
    20260501093848_add_source_query_to_commitments.sql
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The `workforce-ai` edge function requires `ANTHROPIC_API_KEY` set as a Supabase Edge Function secret (not in `.env`).
