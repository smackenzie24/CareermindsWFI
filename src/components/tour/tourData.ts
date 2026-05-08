export type ActiveView = 'home' | 'heatmap' | 'pipeline' | 'pipeline-dept' | 'gap-report' | 'gap-report-dept' | 'managers' | 'managers-detail' | 'benchmark' | 'ask-ai' | 'journal';

export interface TourStep {
  id: string;
  view: ActiveView;
  title: string;
  body: string;
  // data-tour attribute value on the target DOM element
  anchorId: string;
  // Where within the element the dot sits (0 = top/left edge, 1 = bottom/right edge)
  anchorOffsetX: number;
  anchorOffsetY: number;
  // Which side of the dot the card opens towards
  side: 'right' | 'left' | 'top' | 'bottom';
}

export const TOUR_STEPS: TourStep[] = [

  // ── Executive Summary ─────────────────────────────────────────────────────

  {
    id: 'home-2',
    view: 'home',
    title: 'Org Health KPIs',
    body: 'Seven live metrics updated weekly: overall health score, critical skill gaps, employees promotable now, people stalled 24+ months, underperforming managers, industry rank, and employees with no recent 1:1. Each card is clickable and drills into the relevant view.',
    anchorId: 'home-kpi-strip',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'home-3',
    view: 'home',
    title: 'Priority Risks',
    body: 'Progression automatically surfaces the highest-urgency workforce signals. Red = action overdue; Amber = developing issue. Each card shows the specific metric driving the alert and a direct shortcut to address it.',
    anchorId: 'home-risks',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'right',
  },
  {
    id: 'home-3b',
    view: 'home',
    title: 'Workforce AI',
    body: 'Once you\'ve seen the risks, ask a follow-up in plain English — "Who is at risk of leaving?", "Build a retention plan for churn risks". The AI reads your live org data and returns a structured briefing. You can also reach it anytime from the Ask AI page in the nav.',
    anchorId: 'home-ai-hero',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'top',
  },
  {
    id: 'home-4',
    view: 'home',
    title: 'Highlights to communicate upward',
    body: 'Positive signals surfaced alongside the risks — team wins, strong performers, departments outperforming peers. Designed to give a balanced picture for board or exec reporting.',
    anchorId: 'home-highlights',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'left',
  },
  {
    id: 'home-5',
    view: 'home',
    title: '1:1 Check-in Coverage',
    body: 'Shows whether managers are holding regular development conversations. Amber = overdue (30–90 days); Red = critical (90+ days). Low check-in coverage is one of the strongest leading indicators of regrettable attrition.',
    anchorId: 'home-checkins',
    anchorOffsetX: 0.5, anchorOffsetY: 0.2,
    side: 'top',
  },
  {
    id: 'home-6',
    view: 'home',
    title: 'Department Health Table',
    body: 'One row per department. The bar shows overall health score; the four pills break it down into average skill level, promotion readiness, stalled headcount, and industry quartile position. Click Gaps, Pipeline, or Benchmark on any row to drill directly into that department.',
    anchorId: 'home-dept-table',
    anchorOffsetX: 0.5, anchorOffsetY: 0.2,
    side: 'top',
  },

  // ── Skills Gap Heatmap ────────────────────────────────────────────────────

  {
    id: 'heatmap-1',
    view: 'heatmap',
    title: 'Org-Level Gap Stats',
    body: 'Four headline numbers at a glance: total headcount tracked, the percentage below competency target, critical skill gaps (60%+ of a team below expected), and the median gap score. Click any department card below to open its full skill-by-skill heatmap.',
    anchorId: 'heatmap-header-stats',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'heatmap-2',
    view: 'heatmap',
    title: 'Department Cards',
    body: 'Each card shows a department\'s severity (On Track → Developing → At Risk → Critical), the percentage of staff below target, number of critical skills, and the single biggest skill gap. Click a card to open the skill-level heatmap for that team.',
    anchorId: 'heatmap-grid',
    anchorOffsetX: 0.3, anchorOffsetY: 0.3,
    side: 'right',
  },
  {
    id: 'heatmap-3',
    view: 'heatmap',
    title: 'Severity Key',
    body: 'Severity tiers are based on the percentage of the team below their expected competency level — On Track <25%, Developing 25–44%, At Risk 45–64%, Critical 65%+. Inside a department, click any heatmap cell to open a drill-down with location breakdowns and promotion pipeline impact.',
    anchorId: 'heatmap-legend',
    anchorOffsetX: 0.3, anchorOffsetY: 0.5,
    side: 'top',
  },

  // ── Promotion Pipeline ────────────────────────────────────────────────────

  {
    id: 'pipeline-1',
    view: 'pipeline',
    title: 'Pipeline Summary Stats',
    body: 'Four headline numbers: total people tracked for promotion, how many are near-ready (90%+ of criteria met), how many are progressing (70–89%), and the organisation\'s average readiness score. These roll up from individual assessments across every department.',
    anchorId: 'pipeline-stat-cards',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'pipeline-2',
    view: 'pipeline',
    title: 'Readiness Tiers',
    body: 'Candidates are grouped into four tiers: Near Ready (90%+), Progressing (70–89%), Developing (50–69%), and Early Stage (<50%). The breakdown per department shows how deep the succession bench is and how long it will take to fill roles organically.',
    anchorId: 'pipeline-tier-legend',
    anchorOffsetX: 0.4, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'pipeline-3',
    view: 'pipeline',
    title: 'Department Pipeline Cards',
    body: 'Each card shows a department\'s bench strength — the segmented bar visualises the tier split, the four boxes show headcount per tier, and the green callout names the top candidate with their readiness percentage. Click a card to see every individual\'s score and the skill gaps blocking their progression.',
    anchorId: 'pipeline-dept-grid',
    anchorOffsetX: 0.3, anchorOffsetY: 0.3,
    side: 'right',
  },

  // ── Promotion Pipeline — Department Drilldown ────────────────────────────

  {
    id: 'pipeline-dept-1',
    view: 'pipeline-dept',
    title: 'Department Pipeline',
    body: 'You\'re now inside a single department\'s pipeline. The header shows the total people tracked, how many level transitions are in play, and quick-links to the skill gap report and manager view for this team.',
    anchorId: 'pipeline-dept-header',
    anchorOffsetX: 0.5, anchorOffsetY: 0.7,
    side: 'bottom',
  },
  {
    id: 'pipeline-dept-2',
    view: 'pipeline-dept',
    title: 'Level Transition Swimlanes',
    body: 'Each swimlane represents a level-up transition — e.g. Mid → Senior. Candidates are sorted into their tier within that transition. Multiple swimlanes appear when a department has people chasing different level changes simultaneously.',
    anchorId: 'pipeline-dept-swimlanes',
    anchorOffsetX: 0.5, anchorOffsetY: 0.15,
    side: 'bottom',
  },
  {
    id: 'pipeline-dept-3',
    view: 'pipeline-dept',
    title: 'Tier Columns',
    body: 'Four columns — Near Ready, Progressing, Developing, and Early Stage — show every candidate ranked by readiness within their tier. The card displays their readiness bar, how many promotion criteria they\'ve met, location, and time in role. Click any card to open the full individual breakdown.',
    anchorId: 'pipeline-dept-columns',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'top',
  },

  // ── Skill Gap Report — Main ───────────────────────────────────────────────

  {
    id: 'gap-report-1',
    view: 'gap-report',
    title: 'Org-Level Gap Summary',
    body: 'Four headline numbers across the whole organisation: total headcount tracked, the percentage below competency target, how many critical skill gaps exist (60%+ below), and the number of departments with data. These give you an instant health check before drilling in.',
    anchorId: 'gap-report-org-stats',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'gap-report-2',
    view: 'gap-report',
    title: 'Department Cards',
    body: 'Each card shows a department\'s overall gap severity (Critical / At Risk / Developing / On Track), the percentage of staff below target, how many critical skills it has, and the single biggest skill gap. Click any card to open the full department skills report.',
    anchorId: 'gap-report-picker',
    anchorOffsetX: 0.3, anchorOffsetY: 0.3,
    side: 'right',
  },

  // ── Skill Gap Report — Department Drilldown ───────────────────────────────

  {
    id: 'gap-report-dept-1',
    view: 'gap-report-dept',
    title: 'Department Summary',
    body: 'The header shows the department\'s total skills tracked, the percentage of the workforce below target, the number of critical skills, and how many people are affected. These roll up from individual skill assessments across every team and location in this department.',
    anchorId: 'gap-report-dept-header',
    anchorOffsetX: 0.5, anchorOffsetY: 0.7,
    side: 'bottom',
  },
  {
    id: 'gap-report-dept-2',
    view: 'gap-report-dept',
    title: 'Skills Sidebar',
    body: 'All tracked skills sorted by severity, grouped by category. The coloured dot and percentage show how severe each gap is. Check-in Coverage at the top flags whether managers are holding regular 1:1s — a key leading indicator for attrition. Click any row to load its detail on the right.',
    anchorId: 'gap-report-dept-sidebar',
    anchorOffsetX: 0.5, anchorOffsetY: 0.4,
    side: 'right',
  },
  {
    id: 'gap-report-dept-3',
    view: 'gap-report-dept',
    title: 'Skill Detail Panel',
    body: 'The detail panel shows four headline stats for the selected skill, a breakdown by location and team, promotion pipeline impact (who is blocked vs. who meets next-level criteria), and suggested actions. This is the primary workspace for diagnosing and acting on a specific gap.',
    anchorId: 'gap-report-dept-detail',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'left',
  },

  // ── Manager Effectiveness ─────────────────────────────────────────────────

  {
    id: 'managers-1',
    view: 'managers',
    title: 'Org-Level Stats',
    body: 'Four headline numbers: total managers tracked, how many are high-impact (score 75+), how many of their reports are near promotion, and how many reports are stalled. These give a quick read on whether management quality is a systemic issue or isolated.',
    anchorId: 'managers-org-stats',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'managers-2',
    view: 'managers',
    title: 'Effectiveness Score',
    body: 'A 0–100 composite score per manager, weighted across: team readiness growth (40%), framework completion rate (30%), and stalled reports which reduce the score (-30%). It surfaces managers who need support before their teams feel the impact.',
    anchorId: 'managers-card-grid',
    anchorOffsetX: 0.2, anchorOffsetY: 0.3,
    side: 'right',
  },
  {
    id: 'managers-3',
    view: 'managers',
    title: 'Trend & Team Breakdown',
    body: 'The trend arrow shows whether a manager\'s score has improved, held steady, or declined over the past 90 days. A falling trend on an otherwise acceptable score is often more important than an already-low score. The three metric cells show average team readiness, near-ready count, and stalled count.',
    anchorId: 'managers-card-grid',
    anchorOffsetX: 0.6, anchorOffsetY: 0.6,
    side: 'left',
  },

  // ── Manager Effectiveness — Detail ───────────────────────────────────────

  {
    id: 'managers-detail-1',
    view: 'managers-detail',
    title: 'Manager Profile',
    body: 'The header shows the manager\'s composite effectiveness score (0–100), their title, location, team size, tenure in role, and 90-day trend. The score is weighted: team readiness growth (40%), framework completion (30%), stalled reports penalty (30%).',
    anchorId: 'managers-detail-header',
    anchorOffsetX: 0.5, anchorOffsetY: 0.7,
    side: 'bottom',
  },
  {
    id: 'managers-detail-2',
    view: 'managers-detail',
    title: 'Team KPIs',
    body: 'Four headline metrics for this manager\'s team: average promotion readiness across all reports, how many are near-ready (≥90%), how many are stalled (24m+ in level, <50% ready), and the team\'s average framework completion rate.',
    anchorId: 'managers-detail-kpis',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'managers-detail-3',
    view: 'managers-detail',
    title: 'Blocking Skills & Skill Profile',
    body: 'Left: the skills most frequently blocking promotions in this team, ranked by how many reports are affected — with a direct link to the dept gap report or heatmap. Right: the team\'s average rating vs required level for every criterion, showing at a glance where to focus coaching.',
    anchorId: 'managers-detail-skills',
    anchorOffsetX: 0.5, anchorOffsetY: 0.4,
    side: 'top',
  },
  {
    id: 'managers-detail-4',
    view: 'managers-detail',
    title: 'Direct Reports',
    body: 'Every direct report ranked by readiness. Each row shows their target level transition, readiness tier, criteria met, location, and tenure. Stalled individuals are flagged in red. Click through to the promotion pipeline for a full candidate view.',
    anchorId: 'managers-detail-reports',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'top',
  },
  {
    id: 'managers-detail-5',
    view: 'managers-detail',
    title: 'Coaching Suggestions',
    body: 'Context-aware coaching prompts generated from this manager\'s team data: promotion-ready reports to act on, stall signals requiring 1:1 follow-up, team-wide skill gaps to address with a workshop, and framework completion guidance.',
    anchorId: 'managers-detail-coaching',
    anchorOffsetX: 0.5, anchorOffsetY: 0.4,
    side: 'top',
  },

  // ── Industry Benchmark ────────────────────────────────────────────────────

  {
    id: 'benchmark-1',
    view: 'benchmark',
    title: 'Peer Cohort Selector',
    body: 'Progression benchmarks against a matched cohort of similar companies. Filter to all peers, similar-size companies, B2B SaaS only, or scaleups. The count shows how many companies are in the current comparison set.',
    anchorId: 'benchmark-peer-filter',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'benchmark-2',
    view: 'benchmark',
    title: 'Benchmark Tabs',
    body: 'Five views of the same peer data: Overview (headline position), Skill Competency (skills by department vs peers), Compensation (pay vs skill maturity — a flight-risk signal), Team Composition (org shape vs peers), and Skill Categories (granular category rankings).',
    anchorId: 'benchmark-tabs',
    anchorOffsetX: 0.4, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'benchmark-3',
    view: 'benchmark',
    title: 'Overall Quartile Position',
    body: 'The large card shows where your organisation sits across all benchmarked metrics: Q1 = top 25% of peers, Q4 = bottom 25%. The two panels below break down your strongest departments and the areas with most ground to close.',
    anchorId: 'benchmark-overview-card',
    anchorOffsetX: 0.5, anchorOffsetY: 0.4,
    side: 'bottom',
  },
  {
    id: 'benchmark-4',
    view: 'benchmark',
    title: 'Distribution Bars',
    body: 'Each metric card shows a box-plot style bar — the shaded band is the interquartile range of peers, the line is the median, and your position is marked. The delta chip shows your gap to the peer median in absolute terms.',
    anchorId: 'benchmark-dist-grid',
    anchorOffsetX: 0.3, anchorOffsetY: 0.4,
    side: 'right',
  },

  // ── Decisions Journal ─────────────────────────────────────────────────────

  {
    id: 'journal-1',
    view: 'journal',
    title: 'Decisions Journal',
    body: 'Every strategic commitment made through the AI assistant is automatically logged here with context and rationale. It creates a searchable audit trail of workforce decisions — useful for governance, board reporting, and accountability.',
    anchorId: 'journal-header',
    anchorOffsetX: 0.4, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'journal-2',
    view: 'journal',
    title: 'Open vs Completed',
    body: 'The three summary cards show how many commitments are open, completed, and in total. Use the filter tabs below to switch between views. Checking off a commitment marks it done and moves it to the Completed list.',
    anchorId: 'journal-stats',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'bottom',
  },
  {
    id: 'journal-3',
    view: 'journal',
    title: 'Commitment Rows',
    body: 'Each row shows the commitment text, its type (Hire, Develop, Review, etc.), the department it relates to, and when it was created. Hover a row to reveal the dismiss button. Completed commitments are shown with a strikethrough.',
    anchorId: 'journal-list',
    anchorOffsetX: 0.5, anchorOffsetY: 0.3,
    side: 'top',
  },

  // ── Ask AI ────────────────────────────────────────────────────────────────

  {
    id: 'ask-ai-1',
    view: 'ask-ai',
    title: 'Diagnose vs Plan & Act',
    body: 'Two modes: Diagnose analyses your workforce data and surfaces what\'s happening and why. Plan & Act generates structured action plans — proposed hires, development programmes, restructuring options — based on the same data.',
    anchorId: 'ai-mode-tabs',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'right',
  },
  {
    id: 'ask-ai-2',
    view: 'ask-ai',
    title: 'Suggested Prompts',
    body: 'Pre-built questions for the most common strategic workforce scenarios — retention risk, skills strategy, succession planning, restructuring analysis. At the bottom of the list, "How can Careerminds support me?" opens a short qualification conversation that recommends the right Careerminds or Keystone Partners service based on your situation.',
    anchorId: 'ai-suggestions',
    anchorOffsetX: 0.5, anchorOffsetY: 0.5,
    side: 'right',
  },
  {
    id: 'ask-ai-3',
    view: 'ask-ai',
    title: 'AI Output Panel',
    body: 'Responses appear here as structured briefings — not chat bubbles. Each output includes a summary, supporting data in named result blocks, and contextual navigation links. When the AI surfaces a high-urgency signal — churn risk, skills gaps, a planned reduction — a contextual support suggestion from Careerminds or Keystone Partners appears at the bottom of the response.',
    anchorId: 'ai-output-panel',
    anchorOffsetX: 0.5, anchorOffsetY: 0.4,
    side: 'left',
  },
];
