# Ask AI — System Specification

**Feature:** Ask AI (full-page) and Chat Panel (sidebar)
**Entry points:** `src/components/ai/AskAIPage.tsx`, `src/components/ChatPanel.tsx`
**Query router:** `src/data/chatEngine.ts` → `query()`
**Edge function:** `supabase/functions/workforce-ai/index.ts`
**Last updated:** May 2026

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Query routing — the two-tier system](#2-query-routing--the-two-tier-system)
3. [Local intent handlers](#3-local-intent-handlers)
4. [AI edge function](#4-ai-edge-function)
5. [AskAIPage — full-page interface](#5-askaiphage--full-page-interface)
6. [ChatPanel — sidebar interface](#6-chatpanel--sidebar-interface)
7. [Result rendering](#7-result-rendering)
8. [Trust and transparency components](#8-trust-and-transparency-components)
9. [Document upload and context injection](#9-document-upload-and-context-injection)
10. [Headcount reduction — special handling](#10-headcount-reduction--special-handling)
11. [Data interfaces](#11-data-interfaces)
12. [Adding a new intent](#12-adding-a-new-intent)

---

## 1. Architecture overview

Every question passes through two layers in sequence:

```
User input
    │
    ▼
query() — chatEngine.ts
    │
    ├── Local handler matched?  ──YES──▶  Return { text, results[] }
    │                                     (no network call)
    │
    └── NO (needsAI: true)
              │
              ▼
         callWorkforceAI()
              │
              ▼
         buildWorkforceContext()  ──▶  Workforce snapshot string
              │
              ▼
         POST /functions/v1/workforce-ai
              │
              ▼
         Claude claude-opus-4-5 (Anthropic)
              │
              ▼
         Structured AIResponse JSON
```

**Layer 1 — Local engine:** Regex intent matching against static mock data. Synchronous, zero latency, returns typed `QueryResult` objects that `AIChatRenderer` renders as rich UI cards.

**Layer 2 — AI edge function:** Supabase Edge Function running on Deno. Calls Anthropic's `claude-opus-4-5` with a structured system prompt and the full workforce context snapshot. Returns a JSON `AIResponse` object. Used only when Layer 1 cannot answer the question.

Both `AskAIPage` and `ChatPanel` follow this same two-layer pattern. The difference is UI only.

> **Data source — current state:** All workforce data (employees, skill gaps, readiness scores, manager metrics, benchmarks) is **static mock data** defined in `src/data/*.ts` files. No data is read from a database at query time. `buildWorkforceContext()` serialises these in-memory fixtures into the string sent to the AI. The AI's answers are therefore based on this fixture dataset, not live Progression records. When real data is connected (e.g. from Supabase), `buildWorkforceContext()` and the local handler data sources are the integration points to update — the rest of the pipeline stays the same.

---

## 2. Query routing — the two-tier system

### Entry point

```ts
query(input: string): { text: string; results: QueryResult[]; needsAI?: boolean }
```

`query()` is the single public function from `chatEngine.ts`. It lowercases and trims the input, then runs a sequence of regex checks to dispatch to the correct handler. Order matters — earlier checks win.

### Dispatch order

The checks run top-to-bottom in this order:

| Priority | Trigger pattern | Handler |
|---|---|---|
| 1 | `headcount reduction` or `layoff` or `redundanc` or `rif` or `let.*go` or `dismiss` | `handleHeadcountReduction` |
| 2 | `(reduce\|cut\|trim\|shrink)` + `\d+\s*%` | `handleHeadcountReduction` |
| 3 | `90.day\|action plan\|roadmap\|plan\|playbook\|priorities` + `workforce\|org\|team\|plan\|upskill\|quarter` | `handleActionPlan` |
| 4 | `what if\|scenario\|lose\|lost\|leave\|leaves\|if we\|imagine\|suppose\|project` | `handleScenarioPlanning` |
| 5 | `retention\|retain\|keep\|flight risk\|prevent\|attrition` + `plan\|strategy\|how\|help\|fix\|address` | `handleRetentionPlan` |
| 6 | `upskill\|close the gap\|training\|learning\|l&d\|develop\|curriculum\|program` + `strategy\|plan\|how\|recommend\|should\|fix` | `handleUpskillStrategy` |
| 7 | `hire\|hiring\|recruit\|headcount\|add\|staffing\|backfill\|open role` + `strategy\|plan\|should\|how\|recommend\|need` | `handleHiringStrategy` |
| 8 | `restructure\|restructuring\|reorganize\|reorg\|team structure\|reshuffle\|span of control` | `handleTeamRestructure` |
| 9 | `benchmark\|industry\|peer\|compare\|market\|competition\|competitive` + `strategy\|plan\|how\|close\|gap\|improve` | `handleBenchmarkStrategy` |
| 10 | `recommend\|strategy\|strategic\|what should\|what can\|how do we\|how should\|fix\|address\|improve\|action` | `handleHiringStrategy` (if dept detected) or `handleActionPlan` |
| 11 | `/careerminds\|keystone\|how can.{0,20}(support\|help\|assist)\|partner support\|what support\|what services/i` | `handleCareermindsIntro` (or `handleCareermindsResult` if composed answer) |
| 12 | `budget\|cost\|salary\|compensation\|pay\|spend\|expenditure\|total comp\|% of\|percent of\|afford\|expensive\|cheap\|save\|saving` | **→ AI (needsAI: true)** |
| 13 | `misplaced\|wrong role\|hidden talent\|role fit\|career pivot\|internal transfer\|cross.dept\|misfit\|underperform` | `handleRoleFit` |
| 14 | `overview\|summary\|snapshot\|stats\|how many\|how.s the\|overall` (without `skill\|gap`) | `handleOrgStats` |
| 15 | `ready\|promote\|promotion\|near.ready\|90` (without `who need\|risk\|churn`) | `handlePromoReady` |
| 16 | `progress\|on track\|close\|almost` | `handleProgressing` |
| 17 | `churn\|risk\|stuck\|stall\|overdue\|flight\|leaving\|retention` | `handleChurnRisk` |
| 18 | `skill\|gap\|missing\|weak\|strength\|competency\|competencies\|capabilities` | `handleSkillsGaps` |
| 19 | `need\|develop\|behind\|low\|early\|struggling\|far from` | `handleNeedsWork` |
| 20 | `everyone\|all\|pipeline\|show me\|list\|full\|entire` | `handleDeptPipeline` or `handleEveryone` |
| 21 | Department name alone (any of 7 departments) | `handleEveryone` |
| 22 | Person name tokens (≥3 chars, matched against PEOPLE) | `handlePersonSearch` |
| 23 | No match | **→ AI (needsAI: true)** |

### Department detection

`detectDept(query)` runs inside most handlers. It matches department names case-insensitively and has aliases: `eng`/`engineer` → `Engineering`. A department match narrows the result to that dept's population.

### needsAI: true

When `query()` returns `{ needsAI: true }`, the caller (`AskAIPage` or `ChatPanel`) makes the network call to the edge function. The local `text` and `results` fields are empty — the AI response populates them instead.

---

## 3. Local intent handlers

All handlers are in `chatEngine.ts`. They compute against static mock data and return `{ text: string; results: QueryResult[] }`.

| Handler | What it does |
|---|---|
| `handlePromoReady` | Returns people with `readinessPct >= 90`. Filters by dept if detected. Returns `person-list`. |
| `handleProgressing` | Returns people with `readinessPct` in 70–89 tier. Returns `person-list`. |
| `handleChurnRisk` | Returns people flagged `flightRisk: 'high'` or `'medium'`, crossed with tenure and readiness data. Returns `churn-risk-list` or `person-list`. |
| `handleSkillsGaps` | Returns `skill-gap-list` from `SKILLS_DATA`, optionally filtered by dept. |
| `handleDeptPipeline` | Returns `dept-summary` cards for each dept (or a specific dept), showing tier counts. |
| `handleEveryone` | Returns all people (or dept subset) as `person-list`. |
| `handleNeedsWork` | Returns people with `readinessPct < 50`. Returns `person-list`. |
| `handleOrgStats` | Returns `stat-cards` — total headcount, tier counts, manager count, stalled count. |
| `handlePersonSearch` | Fuzzy token match against `PEOPLE[].name`. Returns `person-list` (1–3 results). |
| `handleRoleFit` | Calls `getCrossDeptFitCandidates()`. Returns `role-fit-list`. |
| `handleHiringStrategy` | Returns `recommendation` + `stat-cards` with action buttons navigating to `heatmap` / `pipeline` / `gap-report`. |
| `handleUpskillStrategy` | Returns `recommendation` with upskill actions, top gap skills, L&D partners. |
| `handleRetentionPlan` | Returns `recommendation` + flight risk `churn-risk-list`. |
| `handleScenarioPlanning` | Returns `scenario` cards (2–3 what-if scenarios with current state and projected impact). |
| `handleTeamRestructure` | Returns `recommendation` + manager metrics analysis. |
| `handleBenchmarkStrategy` | Returns `recommendation` using benchmark quartile data. |
| `handleActionPlan` | Returns `recommendation` — synthesises top risks into a prioritised 90-day action plan. |
| `handleHeadcountReductionClarify` | Returns `clarification` (`composeKey: 'headcount-reduction'`) — gathers target %, timeline, and driver before running analysis. See §10. |
| `handleHeadcountReduction` | Returns `reduction` — aggregate analysis only. Called after clarification is answered. See §10. |

### 3.1 clarification + composeKey

`ClarificationResult` has an optional `composeKey` field:

```ts
composeKey?: 'headcount-reduction' | 'careerminds'
```

When the user selects a chip on a `clarification` card, the UI composes a follow-up prompt string from the chip values and re-submits it to `query()`. `composeKey` tells the UI which composition template to use:

| composeKey | What happens on chip selection |
|---|---|
| `'headcount-reduction'` | Chip answers are concatenated into a structured prompt (e.g. "Reduce by 15%, Q1 deadline, budget-driven"). Re-submitted to `query()` which matches `handleHeadcountReduction`. |
| `'careerminds'` | Chip answers are combined into a partner-qualification prompt. Re-submitted to `query()` which matches `handleCareermindsResult`. |
| `undefined` | Chip text is sent as-is as the next user message. |

### 3.2 Careerminds / partner qualification flow

Two handlers support a two-step partner recommendation flow:

**`handleCareermindsIntro()`** — triggered by questions matching `/careerminds|keystone|how can.{0,20}(support|help|assist)|partner support|what support|what services/i`. Returns a `clarification` result with `composeKey: 'careerminds'` and three qualification questions (challenge type, team size, timeline). The intro text references the user's actual data (churn count, skill gap count, near-ready count) to make it contextual.

**`handleCareermindsResult(query)`** — called after the user answers the clarification chips (the composed prompt is routed back through `query()`). Parses the composed string for signals (churn/skills/managers/pipeline/reduction, team size, urgency) and returns a `partner-recommendation` result.

| Answer pattern | Service | Provider |
|---|---|---|
| Leaving / churn / headcount reduction | `outplacement` | Careerminds |
| Skills gaps | `talent-development` | Careerminds |
| Manager / coaching | `manager-coaching` | Keystone Partners |
| Pipeline / promotion | `leadership-dev` | Keystone Partners |
| Default | `retention-suite` | Careerminds |

Add this dispatch entry to the `query()` router **before** the financial fallback:

| Trigger | Handler |
|---|---|
| `/careerminds\|keystone\|how can.{0,20}(support\|help\|assist)\|partner support\|what support\|what services/i` | `handleCareermindsIntro` |

---

## 4. AI edge function

**Location:** `supabase/functions/workforce-ai/index.ts`
**Model:** `claude-opus-4-5` (Anthropic), `max_tokens: 3000`
**Deployed via:** `mcp__supabase__deploy_edge_function`
**Requires secret:** `ANTHROPIC_API_KEY` (set as Supabase edge function secret)

### Request

```ts
POST /functions/v1/workforce-ai
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json

{
  "question": string,   // the user's raw question
  "context":  string    // buildWorkforceContext() output + optional doc context
}
```

The `context` field is built in `callWorkforceAI()`:

```ts
const workforceCtx = buildWorkforceContext();
const context = docContext
  ? `${workforceCtx}\n\n---\nSUPPLEMENTARY DOCUMENT PROVIDED BY USER:\n${docContext}`
  : workforceCtx;
```

`buildWorkforceContext()` (in `chatEngine.ts`) serialises the full workforce snapshot: org stats, per-dept breakdowns, top skill gaps, churn risk list, manager metrics, benchmark positions, and attrition signals.

### System prompt

The system prompt (constant `SYSTEM_PROMPT` in `supabase/functions/workforce-ai/index.ts`) has four sections assembled in this order:

1. **Role introduction** — establishes the AI's identity and scope.
2. **Ethical guardrails** — seven numbered rules (reproduced in full below).
3. **Careerminds products** — six services the AI may contextually recommend (reproduced below).
4. **Response format** — strict JSON schema the model must return (reproduced below).

At call time, the workforce data context is appended after section 4 as a fifth block.

#### Full system prompt

```
You are Workforce AI, an expert people analytics assistant embedded in a talent management
platform called Progression, built by Careerminds. You help HR leaders, managers, and
executives make better, fairer, and more transparent workforce decisions.

You have access to live workforce data about Acme Corp provided in the context below.

═══════════════════════════════════════
ETHICAL GUARDRAILS — NON-NEGOTIABLE
═══════════════════════════════════════

1. PROTECTED CHARACTERISTICS — ABSOLUTE PROHIBITION
   You must NEVER factor in, reference, infer, or suggest decisions based on:
   age, race, ethnicity, gender, gender identity, sexual orientation, religion, national origin,
   disability, pregnancy, marital status, or any other protected characteristic.
   If a question would require reasoning about protected characteristics to answer, refuse that
   specific angle clearly and explain why. Redirect to legitimate performance-based signals.

2. DATA HONESTY — NO CONFIDENT FABRICATION
   You may only draw conclusions from the data explicitly provided in the context.
   If the data is insufficient to answer with confidence, say so directly before attempting
   a partial answer. Never present a guess with the same weight as a data-backed finding.
   Rate your own confidence: start your response with one of:
     [CONFIDENCE:HIGH] — backed by clear structured data in context
     [CONFIDENCE:MEDIUM] — partial data, reasonable inference
     [CONFIDENCE:LOW] — limited data; state what's missing and ask for more context
   When confidence is LOW, you MUST ask the user for the specific missing information before
   giving a substantive answer.

3. HUMAN DECISION AUTHORITY
   AI surfaces patterns — people make decisions.
   Always frame outputs as inputs to human judgment, not as decisions themselves.
   For any recommendation that affects an individual's employment, compensation, or career:
   include a note that final decisions must be reviewed and made by qualified HR professionals.

4. FAIRNESS SIGNALS ONLY
   Acceptable signals: role performance, promotion readiness %, skill ratings, tenure at level,
   check-in recency, manager effectiveness scores, flight risk from job-switching propensity models.
   Unacceptable signals: anything correlated with protected characteristics.
   When discussing flight risk or attrition, use only behavioural and structural signals.

5. TRANSPARENCY IN REASONING
   Briefly state which data sources informed your answer (e.g. "Based on promotion readiness
   scores across 42 employees..." or "Flight risk data from Revelio Labs signals...").
   If you make an assumption, flag it explicitly: "I'm assuming X because Y is not in the data."

6. SCOPE BOUNDARIES
   You can only analyse the Acme Corp workforce data provided. You cannot access external HR
   databases, salary surveys, or real-time market data beyond what's in the context.
   Do not invent benchmark numbers — use the benchmark data in context or say it's unavailable.

7. HEADCOUNT REDUCTION — STRICT SPECIAL RULES
   This section applies whenever a question relates to selecting individuals for redundancy,
   identifying who should be let go, ranking employees for layoff, or any similar individual-level
   selection for workforce reduction. These rules are non-negotiable and override all other guidance.

   (a) NEVER produce or imply a ranked list of individuals for redundancy selection.
       Do not name specific people as candidates for dismissal, even indirectly (e.g. "the lowest
       performer in X department" or "the employee with the highest flight risk"). Any question
       that asks you to identify specific individuals for redundancy MUST be declined clearly.

   (b) EXPLAIN THE LAW. Always state explicitly: individual selection for redundancy is a legal
       process governed by employment law that varies by jurisdiction. It requires documented,
       objective, and consistently applied selection criteria developed with qualified HR and
       employment law expertise. AI analysis alone is never sufficient basis for individual selection.

   (c) OFFER ONLY AGGREGATE ANALYSIS. Redirect to legitimate structural-level analysis:
       - Role type overlap and duplication analysis across departments
       - Department restructuring options and span-of-control modelling
       - Voluntary vs. forced reduction ratio modelling (e.g. natural attrition rate vs. target)
       - Skill gap risk: which capability clusters would be most impacted by a given reduction
       - Timeline and phasing options
       These are legitimate inputs to a restructuring plan. Individual names are not.

   (d) FLAG DISPARATE IMPACT RISK. Always include a note that even ostensibly neutral,
       performance-based selection criteria (e.g. lowest performance score, shortest tenure,
       specific skill sets) can constitute indirect discrimination if they disproportionately
       affect a protected group. This is a well-established principle in employment law in most
       jurisdictions. Disparate impact analysis by a qualified lawyer is required before any
       selection criteria are finalised.

   (e) LEGAL REFERRAL. Always end any response touching individual selection with an explicit
       directive: "Before any individual selection process begins, involve a qualified employment
       lawyer and your HR leadership team. This is not optional — it is a legal requirement."

   (f) SET the "ethicsNote" field in your JSON response to a clear summary of these constraints
       whenever this section applies. Do not omit it.

═══════════════════════════════════════
CAREERMINDS PRODUCTS — CONTEXTUAL CROSS-SELL
═══════════════════════════════════════

Careerminds offers these services that may be relevant to the question:
- Outplacement Services: career transition support for employees affected by reductions
- Retention Suite: manager coaching, stay interviews, and at-risk employee engagement programs
- Career Coaching: 1:1 coaching for high-potential employees and those at risk of disengagement
- Learning Pathways: structured skills development and upskilling programs
- Succession Planning: leadership pipeline development and readiness acceleration
- Workforce Analytics Consulting: deeper data analysis and strategic workforce planning

Only mention a Careerminds product when it is directly relevant to the question asked.
If you do mention one, explain specifically why it applies to this situation.
Do not mention products in every response — only when genuinely useful.

═══════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════

Structure every response as valid JSON with this shape:
{
  "confidence": "high" | "medium" | "low",
  "text": "Your main answer in 2–5 short paragraphs. Plain language, no jargon.",
  "reasoning": {
    "summary": "One sentence: the core logic that drove this answer.",
    "methodology": "2–3 sentences describing the overall analytical approach used.",
    "steps": [
      {
        "label": "Short label for this step",
        "detail": "Concrete explanation. Must cite actual numbers from the data.",
        "dataPoint": "The key number or fact from the data that informed this step."
      }
    ],
    "keySignals": [
      {
        "signal": "Signal name",
        "howUsed": "How this signal was used in the analysis.",
        "threshold": "The cutoff or benchmark applied, if any.",
        "limitation": "Any known limitation of this signal."
      }
    ],
    "whatWasNotConsidered": ["Factors intentionally excluded or unavailable."],
    "alternativeInterpretations": ["Other reasonable conclusions from the same data."]
  },
  "sources": ["list of data sources used"],
  "assumptions": ["any assumptions made, or empty array"],
  "needsMoreContext": true | false,
  "contextQuestion": "If needsMoreContext is true, the specific question to ask the user",
  "careermindsSuggestion": null | {
    "product": "product name",
    "reason": "one sentence why it's relevant"
  },
  "ethicsNote": null | "only include if you declined part of a question for ethical reasons"
}

The "reasoning" object is ALWAYS required and is the most important part of your response.
It is shown to HR professionals who need to understand, audit, and defend your recommendations.
- Every step.dataPoint must be a real number or fact from the provided data — no placeholders
- keySignals must cover every signal that materially affected the output
- whatWasNotConsidered must be honest — if you lacked data, say so explicitly
- alternativeInterpretations must be included if reasonable alternative conclusions exist
- If you made a judgment call, explain it explicitly

If confidence is low and needsMoreContext is true, keep "text" brief and still populate
reasoning with what you could assess and what is missing.
```

### Response format

The model returns JSON:

```ts
{
  confidence: 'high' | 'medium' | 'low',
  text: string,               // 2–5 paragraphs, plain language
  reasoning: {
    summary: string,          // one-sentence core logic
    methodology: string,      // 2–3 sentences on approach
    steps: [{ label, detail, dataPoint }],
    keySignals: [{ signal, howUsed, threshold, limitation }],
    whatWasNotConsidered: string[],
    alternativeInterpretations: string[]
  },
  sources: string[],
  assumptions: string[],
  needsMoreContext: boolean,
  contextQuestion?: string,   // if needsMoreContext is true
  careermindsSuggestion: null | { product: string; reason: string },
  ethicsNote: string | null
}
```

### JSON extraction fallback

Three strategies in order:
1. Parse raw response as JSON directly.
2. Extract content between ` ```json ``` ` fences.
3. Extract the substring between the first `{` and last `}`.

If all three fail, the raw text is wrapped in a medium-confidence fallback `AIResponse` with `reasoning: null`.

### Confidence signal behaviour

| Confidence | Behaviour |
|---|---|
| `high` | Answer shown immediately with green badge. |
| `medium` | Answer shown with amber badge. |
| `low` | Answer shown with red badge. `needsMoreContext` likely `true`. A `ContextRequestBanner` prompts the user for missing data. |

---

## 5. AskAIPage — full-page interface

**Location:** `src/components/ai/AskAIPage.tsx`

### Navigation

`AskAIPage` is **always mounted but hidden** (`display: none`) when not active. This preserves conversation state across navigation. The `hidden` CSS class is toggled in `App.tsx`:

```tsx
<div className={nav.view === 'ask-ai' ? 'h-full' : 'hidden'}>
  <AskAIPage initialQuestion={nav.aiQuestion} onNavigate={navigateFromAI} />
</div>
```

`initialQuestion` triggers an automatic submit when the page becomes visible (e.g. when a risk card CTA from the home page fires `onAskAI("Who is most at risk?")`).

### Conversation model

```ts
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  outputs: OutputEntry[];
  activeOutputId: string | null;
  createdAt: Date;
  mode: ChatMode;             // 'diagnose' | 'plan'
  attachedDoc: AttachedDoc | null;
}
```

Multiple conversations are stored in a `conversations` state array. The sidebar lists them; clicking switches the active one. Each conversation is independent — separate message thread, separate attached document, separate mode.

### Chat modes

| Mode | Description | Suggested prompts shown |
|---|---|---|
| `diagnose` | Diagnostic queries — who is at risk, what are the gaps, who is ready. | `SUGGESTED_PROMPTS` from `chatEngine.ts` |
| `plan` | Strategy and action queries — hiring plans, upskilling, retention. | `PLANNING_PROMPTS` from `chatEngine.ts` |

Mode is set per-conversation and shown as a toggle in the input area.

### Submit flow

1. User submits a question (or `initialQuestion` fires automatically).
2. A `ChatMessage { role: 'user' }` is appended to the conversation.
3. A typing indicator message is shown.
4. `query(input)` runs synchronously.
5. **If** `needsAI: false`: result is rendered immediately from local data.
6. **If** `needsAI: true`: `callWorkforceAI(question, attachedDoc?.content)` is awaited.
7. The typing indicator is replaced with the assistant message and its `OutputEntry`.
8. `OutputEntry.answer` is set from `AIResponse.text`; the full `AIResponse` is stored for the reasoning panel.

### Output panel

Each AI response is also tracked as an `OutputEntry`:

```ts
interface OutputEntry {
  id: string;
  question: string;
  answer: string | null;
  results: QueryResult[];
  aiResponse: AIResponse | null;
  timestamp: Date;
}
```

The right-hand panel shows the active `OutputEntry`. Export actions (download as `.txt`, email via `mailto:`) operate on this entry. The email subject line is prefixed with `[AI — human review required]`.

### Missing context detection

After an AI response, `detectsMissingContext(text)` scans the response text against `MISSING_CONTEXT_PATTERNS` — a set of regex patterns matching phrases like "don't have financial data" or "please provide a budget document". If a match is found and no document is already attached, `needsMoreContext` is set to `true` in the `OutputEntry` and a `MissingContextNudge` component (defined locally in `AskAIPage.tsx`, not the same as `ContextRequestBanner` in `AITrustComponents.tsx`) is rendered below the answer. It offers two actions: "Upload a file" and "Paste data".

---

## 6. ChatPanel — sidebar interface

**Location:** `src/components/ChatPanel.tsx`

A lightweight slide-out panel. Shares the same `query()` / `callWorkforceAI()` pipeline as `AskAIPage` but has no multi-conversation state, no output panel, no document upload, and no export. Intended for quick lookups without leaving the current view.

Messages are stored in a local `messages` array (not persisted). The panel clears on close.

Quick-reply chips at the top show a subset of `SUGGESTED_PROMPTS`. Clicking one submits immediately.

---

## 7. Result rendering

**Location:** `src/components/ai/AIChatRenderer.tsx`

`AIChatRenderer` receives a `QueryResult[]` array and switches on `result.kind` to render the appropriate card.

| Kind | Rendered as |
|---|---|
| `person-list` | Grid of person cards — name, dept, team, readiness bar, tier badge |
| `churn-risk-list` | Same card layout with flight risk drivers and tenure |
| `skill-gap-list` | Skill gap rows — skill name, dept, below-target %, bar |
| `dept-summary` | Department summary cards — tier breakdown donut/bar, headcount |
| `stat-cards` | 2×2 or 4-wide grid of labelled metric tiles |
| `recommendation` | Full recommendation card — title, context, action buttons with `onNavigate` targets |
| `scenario` | Scenario cards — current state, projected state, risk level |
| `reduction` | Reduction analysis card — multi-tab (Alternatives / By Dept / Process / Legal). See §10. |
| `clarification` | Clarification card — question text + quick-reply chips. `composeKey` controls what happens on chip selection. See §3.1. |
| `labeled-people` | Grouped person list under a heading label. Optional `subLabel` renders below. `isChurn: true` switches to `ChurnCard` rendering and rose colouring; `false`/absent uses `PersonCard` and emerald. |
| `decision` | Decision frame card — situation, question, 2–4 options with consequences |
| `commitment-prompt` | Inline commitment capture — summary + save-to-journal button |
| `partner-recommendation` | Partner service card (Careerminds or Keystone Partners). See §3.2. |
| `role-fit-list` | Cross-dept fit cards — current role, suggested fit, readiness delta |

Action buttons in `recommendation` and `reduction` cards call `onNavigate(target: ActionNavTarget)` which maps to:

```ts
interface ActionNavTarget {
  view: 'pipeline' | 'gap-report' | 'managers' | 'heatmap' | 'benchmark';
  department?: string;
}
```

---

## 8. Trust and transparency components

**Location:** `src/components/ai/AITrustComponents.tsx`

These components are rendered alongside AI responses and are not optional — they are part of the contract between the system and the user.

| Component | Purpose |
|---|---|
| `ConfidenceBadge` | Colour-coded badge (green/amber/red) showing `high`/`medium`/`low`. Clicking opens a popover explaining what each level means. |
| `ReasoningAccordion` | Expandable panel showing the full `AIResponse.reasoning` object — methodology, analysis steps with data points, key signals with thresholds and limitations, what was not considered, and alternative interpretations. |
| `EthicsBadge` | "Fairness checked" badge. Popover lists the signals used (readiness, tenure, skill ratings, check-in recency, manager scores, flight risk propensity) and explicitly states that age, gender, ethnicity, and all other protected characteristics are never factored in. |
| `HumanDecisionBar` | Persistent footer on every AI response: "AI surfaces patterns — people make decisions. Final decisions must be reviewed by qualified HR professionals." |
| `CareermindsCard` | Shown when `AIResponse.careermindsSuggestion` is non-null. Displays the product name and reason for relevance. |
| `ContextRequestBanner` | Defined in `AITrustComponents.tsx`. A compact banner that can be embedded inside structured result cards when the AI flags it needs more context. |

---

## 9. Document upload and context injection

**Location:** `AskAIPage.tsx` — `extractTextFromFile()`, `PasteModal`, `AttachedDoc`

Users can attach supplementary data (salary data, budget documents, board decks) to a conversation. This is the mechanism for answering financial questions that the local engine cannot answer.

### Supported formats

| Format | Extraction method |
|---|---|
| `.csv`, `.txt` | `file.text()` — full content |
| `.json` | `file.text()` — full content |
| `.pdf` | Text extraction using `FileReader` + PDF parse (best-effort; layout not preserved) |

### Attachment flow

1. User clicks the attachment button (paperclip) or "paste data" in the `ContextRequestBanner`.
2. File picker opens or `PasteModal` appears.
3. `extractTextFromFile(file)` runs; the result is stored as `conversation.attachedDoc`.
4. A banner appears in the input area showing the document name and size.
5. On the next submit, `attachedDoc.content` is passed to `callWorkforceAI` as `docContext`.
6. `docContext` is appended to the context string sent to the edge function: `\n\n---\nSUPPLEMENTARY DOCUMENT PROVIDED BY USER:\n{docContext}`.

One document per conversation. Uploading a new file replaces the existing one.

---

## 10. Headcount reduction — special handling

Headcount reduction queries trigger a dedicated flow in both Layer 1 and Layer 2 with hard constraints.

### Layer 1 — two-step flow

Reduction queries go through two steps:

**Step 1 — `handleHeadcountReductionClarify()`** — the initial trigger. Returns a `clarification` result with `composeKey: 'headcount-reduction'` and three questions: target percentage, timeline, and driver (budget vs. strategic). The user answers via chips. Their answers are composed into a structured follow-up prompt and re-submitted to `query()`.

**Step 2 — `handleHeadcountReduction(query)`** — receives the composed prompt. Returns a `reduction` `QueryResult` with:
- `ReductionAnalysis` object — `totalHeadcount`, `reductionTarget` (absolute), `reductionPct`, `deptImpacts[]`, `alternativesToReduction[]`, `voluntaryAttritionRate`, `monthsToNaturalAttrition`
- **No individual names are included.** `deptImpacts` contains aggregate dept-level data only.

The `reduction` card in `AIChatRenderer` has four tabs:
1. **Alternatives** — list of alternatives to forced reduction (hiring freeze, natural attrition modelling, redeployment)
2. **By Dept** — dept-level impact table
3. **Process** — legal and procedural checklist
4. **Legal** — the full legal referral notice

### Layer 2 — edge function guardrails

Rule 7 in the system prompt (`HEADCOUNT REDUCTION — STRICT SPECIAL RULES`) is non-negotiable and overrides all other instructions:

- (a) Never produce or imply a ranked list of individuals for redundancy.
- (b) Always explain the legal framework.
- (c) Offer only aggregate structural analysis.
- (d) Flag disparate impact risk.
- (e) End every response with an explicit legal referral.
- (f) Always set `ethicsNote` in the JSON response.

### UI interstitial

Before rendering the first reduction-related response in `AskAIPage`, a `ReductionInterstitial` modal appears. The user must check a box confirming they understand the AI cannot make individual selection decisions before proceeding. `reductionAcknowledged` state is set to `true` after confirmation and persists for the lifetime of the conversation.

After acknowledgement, a persistent red warning banner remains visible above the response:

> "AI cannot and must not be used to select individuals for redundancy. This analysis covers structural and aggregate options only."

### Reduction detection

```ts
const REDUCTION_PATTERN = /\b(redundan|layoff|lay.off|let.go|let go|retrench|downsize|down.size|headcount.reduc|reduc.headcount|who.should.we.cut|who.to.cut|who.should.be.cut|who.to.fire|who.should.we.fire|who.should.be.fired|cut.staff|staff.cut|workforce.reduc|reduc.workforce|reduction.in.force|rif\b|involuntary|termination.list|who.should.leave|who.can.we.lose)\b/i
```

Applied at two points: (1) at submit time in `AskAIPage` — if the question matches, `ReductionInterstitial` fires before the query runs; (2) on each `OutputEntry` via `isReductionEntry()` — if either the question or answer matches, or the results contain a `reduction` kind, the persistent red banner is shown above the output.

---

## 11. Data interfaces

### ChatMessage

```ts
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  results?: QueryResult[];
  timestamp: Date;
  isClarifyQuestion?: boolean;
}
```

### AIResponse (AskAIPage.tsx)

```ts
interface AIResponse {
  confidence: 'high' | 'medium' | 'low';
  text: string;
  reasoning: { ... } | null;
  sources: string[];
  assumptions: string[];
  needsMoreContext: boolean;
  contextQuestion?: string;
  careermindsSuggestion: null | { product: string; reason: string };
  ethicsNote: string | null;
}
```

### QueryResult discriminated union (chatEngine.ts)

```ts
type QueryResult =
  | { kind: 'person-list';           items: PersonResult[] }
  | { kind: 'skill-gap-list';        items: SkillGapResult[] }
  | { kind: 'dept-summary';          items: DeptSummaryResult[] }
  | { kind: 'churn-risk-list';       items: PersonResult[] }
  | { kind: 'stat-cards';            items: StatCard[] }
  | { kind: 'recommendation';        items: RecommendationResult[] }   // plural items, array
  | { kind: 'scenario';              items: ScenarioResult[] }
  | { kind: 'reduction';             analysis: ReductionAnalysis }     // field is 'analysis'
  | { kind: 'clarification';         data: ClarificationResult }       // field is 'data'
  | { kind: 'labeled-people';        label: string; subLabel?: string; isChurn?: boolean; items: PersonResult[] }
  | { kind: 'decision';              frame: DecisionFrame }            // field is 'frame'
  | { kind: 'commitment-prompt';     data: CommitmentPrompt }          // field is 'data'
  | { kind: 'partner-recommendation'; data: PartnerRecommendation }   // field is 'data'
  | { kind: 'role-fit-list';         items: CrossDeptFitResult[] };   // from promotionData, not chatEngine
```

---

## 12. Adding a new intent

To add a new local intent (handled without an AI call):

1. Write a handler function in `chatEngine.ts` — `function handleMyThing(query: string): { text: string; results: QueryResult[] }`.
2. Add the regex dispatch case to `query()` **above** the `needsAI: true` financial fallback (line ~1541) unless it requires external data.
3. If the result needs a new visual layout, add a new `kind` to the `QueryResult` union and add a case in `AIChatRenderer.tsx`.
4. If the new kind needs a trust component (confidence badge, ethics badge), add it to `AITrustComponents.tsx` and wire it into the `AIChatRenderer` case.
5. Add one or two example prompts to `SUGGESTED_PROMPTS` or `PLANNING_PROMPTS` so it surfaces in the empty-state chips.

To route questions to the AI that currently fall through to the generic fallback, simply let them hit the `return { text: '', results: [], needsAI: true }` at the bottom — no change needed. The edge function handles anything not matched locally.

> **Scale note:** `buildWorkforceContext()` serialises the full mock dataset on every AI call. If the dataset grows substantially, move to a server-side context-builder or implement selective context (only the relevant dept snapshot). The current approach is fine for ~200 employees but will produce an oversized context at 1000+.
