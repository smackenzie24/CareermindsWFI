# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite, port 5173)
npm run build      # production build (run this to verify no type errors)
npm run typecheck  # type-check without emitting
npm run lint       # eslint
```

There are no tests. `npm run build` is the verification step.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Lucide icons. No routing library — navigation is a single `NavState` object in `App.tsx`.

### Navigation model

`App.tsx` owns all navigation via a `NavState` object `{ view, department?, managerId?, benchmarkTab?, aiQuestion? }`. Views are rendered with conditional JSX. The AI page (`ask-ai`) is **always mounted but hidden** so its conversation state persists. Cross-view navigation callbacks are passed down as props.

Views: `home | heatmap | pipeline | gap-report | managers | benchmark | journal | ask-ai`

### Data architecture

All application data is currently **static mock data** in `src/data/`. Nothing is persisted to Supabase except the Decisions Journal (`commitments` table).

Key data files:
- `src/data/mockData.ts` — `SKILLS_DATA` (61 skill-gap rows), department/location/level constants
- `src/data/promotionData.ts` — `PEOPLE` (42 people), `LEVEL_DEFINITIONS`, `LEVEL_FRAMEWORKS`, and all readiness computation functions (`computeReadiness`, `getAllReadiness`, `getReadinessTier`)
- `src/data/managerData.ts` — `MANAGERS` (11 managers), `computeManagerMetrics`, `getAllManagerMetrics`
- `src/data/benchmarkData.ts` — `PEER_COMPANIES` (8 companies), `ACME_HEADCOUNT_BY_DEPT`, `ACME_COMP`, quartile computation helpers
- `src/data/execSummaryData.ts` — `computeExecSummary()` aggregates all signals into a single exec dashboard snapshot; org health scoring, risk/win detection, dept snapshots
- `src/data/chatEngine.ts` — intent router for the AI chat. `query(input)` matches user text to local handlers; returns `{ text, results, needsAI? }`. If `needsAI: true`, the caller falls through to the Supabase edge function. Add new local intents here before routing to AI.

### AI chat system

Two entry points, same underlying engine:
- `ChatPanel` — slide-out sidebar panel (quick access)
- `AskAIPage` — full-page AI experience with richer output rendering

Both call `query()` from `chatEngine.ts` first. If `needsAI: true`, they POST to the `workforce-ai` Supabase edge function (`supabase/functions/workforce-ai/index.ts`), which calls Anthropic Claude with the workforce context snapshot from `buildWorkforceContext()`.

`AskAIPage` supports document upload (text extraction from uploaded files) which is appended to the AI context for financial/salary questions.

### Query result types

`chatEngine.ts` exports a `QueryResult` discriminated union. `AIChatRenderer.tsx` switches on `result.kind` to render each type. Current kinds: `person-list`, `skill-gap-list`, `dept-summary`, `churn-risk-list`, `stat-cards`, `recommendation`, `scenario`, `reduction`, `clarification`, `labeled-people`, `decision`, `commitment-prompt`.

### Supabase

Single table: `commitments` (see `src/lib/supabase.ts` for the `Commitment` interface). The `workforce-ai` edge function requires `ANTHROPIC_API_KEY` set as a Supabase edge function secret.

### Promotion readiness computation

`computeReadiness(person, levelFramework)` in `promotionData.ts` evaluates each person's `skills[]` array against the criteria in `LEVEL_FRAMEWORKS` for their target level. Readiness tiers: Near-Ready ≥90%, Progressing 70–89%, Developing 50–69%, Early <50%.

### Tour system

`TourOverlay` reads step definitions from `src/components/tour/tourData.ts`, which maps `ActiveView` strings to arrays of annotated steps. When adding a new view or significant UI section, add corresponding tour steps there.
