import * as XLSX from 'xlsx';

export function downloadDataMap() {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Data Sources ─────────────────────────────────────────────
  const s1: string[][] = [
    ['Data Source File', 'Export Type', 'Export Name', 'Description', 'Consumed By (Component / File)'],

    // mockData.ts
    ['src/data/mockData.ts','Constant','SKILLS_DATA','61 skill-gap rows (dept x skill x level with actual/expected scores)','SkillsGapHeatmap, DepartmentOverview, DrilldownPanel, SkillGapReport, IndustryBenchmark, chatEngine, benchmarkData (internal)'],
    ['src/data/mockData.ts','Constant','DEPT_COLORS','Department to hex colour map','DepartmentOverview, SkillsGapHeatmap, DeptGapReportPicker, SkillGapReport, PromotionPipeline, ManagerEffectiveness, ManagerDetail, AIChatRenderer, promotionData (re-export), managerData (re-export)'],
    ['src/data/mockData.ts','Constant','DEPARTMENTS','Ordered array of department name strings','DepartmentOverview, DeptGapReportPicker, PromotionPipeline, ManagerEffectiveness, IndustryBenchmark, chatEngine'],
    ['src/data/mockData.ts','Type','Department','Union type of valid department name strings','HeatmapCell, DepartmentOverview, SkillsGapHeatmap, DrilldownPanel, SkillGapReport, DeptGapReportPicker, ManagerEffectiveness, ManagerDetail, IndustryBenchmark, App.tsx, chatEngine, promotionData, managerData, execSummaryData'],
    ['src/data/mockData.ts','Type','SkillGapEntry','Shape of one heatmap row (dept, skill, level, headcount, averageActual, expectedLevel, belowTarget)','DrilldownPanel, SkillsGapHeatmap, chatEngine'],

    // promotionData.ts
    ['src/data/promotionData.ts','Constant','PEOPLE','42 employee records with skills, tenure, location, career track, lastCheckIn','DepartmentOverview, SkillsGapHeatmap (CheckInPanel), DrilldownPanel, PromotionPipeline, DeptPipelineView, ManagerDetail, AIChatRenderer, chatEngine, managerData, execSummaryData'],
    ['src/data/promotionData.ts','Constant','LEVEL_DEFINITIONS','IC / M level names, descriptions, and typical tenure','DepartmentOverview, DrilldownPanel, ManagerDetail, chatEngine'],
    ['src/data/promotionData.ts','Constant','LEVEL_FRAMEWORKS','Promotion criteria per target level (skills + behaviours)','DrilldownPanel, PromotionPipeline (via DeptPipelineView), PersonPanel, ManagerDetail, chatEngine, managerData (internal)'],
    ['src/data/promotionData.ts','Constant','TIER_CONFIG','Readiness tier labels, colours, and badge styles','PromotionPipeline, DeptPipelineView, PersonPanel, ManagerDetail, AIChatRenderer, chatEngine'],
    ['src/data/promotionData.ts','Constant','TIER_RANGES','Numeric % thresholds per readiness tier (Near-Ready >= 90%)','PromotionPipeline, DeptPipelineView'],
    ['src/data/promotionData.ts','Constant','DEPT_COLORS','Re-export of mockData DEPT_COLORS for convenience','PromotionPipeline, DeptPipelineView, PersonPanel, ManagerEffectiveness, ManagerDetail'],
    ['src/data/promotionData.ts','Function','computeReadiness()','Scores one person against their target level framework, returns ReadinessResult','DrilldownPanel, ManagerDetail, chatEngine, managerData (internal)'],
    ['src/data/promotionData.ts','Function','getAllReadiness()','Scores all 42 PEOPLE in one pass, returns ReadinessResult[]','PromotionPipeline, DeptPipelineView, execSummaryData, chatEngine'],
    ['src/data/promotionData.ts','Function','getReadinessTier()','Maps a % score to a ReadinessTier string','PromotionPipeline, DeptPipelineView, ManagerDetail, chatEngine'],
    ['src/data/promotionData.ts','Function','groupByTier()','Groups a ReadinessResult[] by tier into a keyed object','PromotionPipeline, DeptPipelineView'],
    ['src/data/promotionData.ts','Function','getCandidatesForSkill()','Returns people with a gap in a given skill','SkillsGapHeatmap (DrilldownPanel), SkillGapReport, chatEngine'],
    ['src/data/promotionData.ts','Function','getBlockedCandidatesForSkill()','Returns near-ready people whose promotion is blocked by a specific skill gap','SkillsGapHeatmap (DrilldownPanel), SkillGapReport'],
    ['src/data/promotionData.ts','Type','Person','Employee record shape (id, name, dept, team, level, skills, tenure, location, lastCheckIn, careerTrack)','PromotionPipeline, DeptPipelineView, PersonPanel, ManagerDetail, AIChatRenderer, chatEngine, managerData'],
    ['src/data/promotionData.ts','Type','ReadinessResult','Output of computeReadiness() - score %, tier, criteria detail','PromotionPipeline, DeptPipelineView, PersonPanel, ManagerDetail, AIChatRenderer, chatEngine'],
    ['src/data/promotionData.ts','Type','ReadinessTier','"near-ready" | "progressing" | "developing" | "early"','PromotionPipeline, DeptPipelineView, PersonPanel, AIChatRenderer'],
    ['src/data/promotionData.ts','Type','SkillCandidateMatch','Person + gap info for a specific skill','DrilldownPanel, SkillGapReport'],
    ['src/data/promotionData.ts','Type','LevelFramework','Shape of one level promotion criteria object','DrilldownPanel, ManagerDetail, chatEngine'],
    ['src/data/promotionData.ts','Type','LevelDefinition','Shape of one level definition record','DepartmentOverview, DrilldownPanel, ManagerDetail, chatEngine'],

    // managerData.ts
    ['src/data/managerData.ts','Constant','MANAGERS','11 manager records (name, dept, team, directReportIds)','ManagerEffectiveness, ManagerDetail, SkillGapReport, chatEngine'],
    ['src/data/managerData.ts','Constant','DEPT_COLORS','Re-export from promotionData for convenience','ManagerEffectiveness, ManagerDetail'],
    ['src/data/managerData.ts','Function','computeManagerMetrics()','Scores one manager on 6 effectiveness dimensions, returns ManagerMetrics','ManagerDetail, chatEngine'],
    ['src/data/managerData.ts','Function','getAllManagerMetrics()','Scores all 11 managers, returns ManagerMetrics[]','ManagerEffectiveness, execSummaryData, chatEngine'],
    ['src/data/managerData.ts','Type','Manager','Manager record shape (id, name, dept, team, directReportIds)','ManagerEffectiveness, ManagerDetail'],
    ['src/data/managerData.ts','Type','ManagerMetrics','Scored manager output (6 dimension scores + composite)','ManagerEffectiveness, ManagerDetail, App.tsx'],

    // benchmarkData.ts
    ['src/data/benchmarkData.ts','Constant','PEER_COMPANIES','8 peer company datasets (headcount, comp, skill scores by dept)','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','SIMILAR_PEERS','Filtered subset of closest-match peer companies','ExecutiveSummary, IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','QUARTILE_CONFIG','Quartile label + colour/badge config (Q1-Q4)','ExecutiveSummary, IndustryBenchmark, execSummaryData'],
    ['src/data/benchmarkData.ts','Constant','ACME_HEADCOUNT_BY_DEPT','Acme headcount split by department','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','ACME_TOTAL_HEADCOUNT','Acme total headcount scalar','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','ACME_COMP','Acme compensation data by department','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','ACME_SKILL_COMPETENCY','Acme average skill competency score by dept','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Constant','ACME_DEPT_PCT','Acme dept headcount as % of total','IndustryBenchmark'],
    ['src/data/benchmarkData.ts','Constant','ACME_CATEGORY_COMPETENCY','Acme competency scores by skill category','IndustryBenchmark (internal)'],
    ['src/data/benchmarkData.ts','Constant','ACME_FRAMEWORK_MATURITY','Acme talent framework maturity score','IndustryBenchmark (internal)'],
    ['src/data/benchmarkData.ts','Constant','ACME_PROMOTION_VELOCITY','Acme promotion velocity metrics','IndustryBenchmark (internal)'],
    ['src/data/benchmarkData.ts','Function','getDeptSkillBenchmarks()','Peer skill score comparison per dept','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Function','getDeptCompBenchmarks()','Peer compensation comparison per dept','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Function','getDeptSizeBenchmarks()','Peer team-size comparison per dept','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Function','getCategoryBenchmarks()','Category-level benchmark rollup','IndustryBenchmark, execSummaryData'],
    ['src/data/benchmarkData.ts','Function','getOrgBenchmarks()','Org-wide benchmark summary','IndustryBenchmark, execSummaryData'],
    ['src/data/benchmarkData.ts','Function','getOverallBenchmarkSummary()','Single-row overall rank + quartile position','execSummaryData, chatEngine'],
    ['src/data/benchmarkData.ts','Function','computeQuartiles()','Internal: compute quartile breakpoints from an array','benchmarkData internal'],
    ['src/data/benchmarkData.ts','Function','getQuartilePosition()','Map a value to Q1/Q2/Q3/Q4 label','execSummaryData, IndustryBenchmark'],
    ['src/data/benchmarkData.ts','Type','PeerCompany','Peer company record shape','IndustryBenchmark, chatEngine'],
    ['src/data/benchmarkData.ts','Type','QuartilePosition','"Q1" | "Q2" | "Q3" | "Q4"','ExecutiveSummary, IndustryBenchmark, execSummaryData'],

    // execSummaryData.ts
    ['src/data/execSummaryData.ts','Function','computeExecSummary()','Aggregates all data sources into a single ExecSummary snapshot for the CPO dashboard','ExecutiveSummary'],
    ['src/data/execSummaryData.ts','Function','getHealthBg()','Returns Tailwind bg class for a numeric health score','ExecutiveSummary (internal)'],
    ['src/data/execSummaryData.ts','Type','ExecSummary','Full output shape of computeExecSummary()','ExecutiveSummary'],
    ['src/data/execSummaryData.ts','Type','OrgRisk','One priority risk signal (title, detail, level, action, metric)','ExecutiveSummary'],
    ['src/data/execSummaryData.ts','Type','DeptHealthSnapshot','Per-dept row for health table (scores, benchmark position, colour)','ExecutiveSummary'],
    ['src/data/execSummaryData.ts','Type','NavTarget','Navigation target: { view, department?, managerId?, benchmarkTab? }','ExecutiveSummary, App.tsx'],
    ['src/data/execSummaryData.ts','Type','RiskLevel','"critical" | "warning"','ExecutiveSummary'],
    ['src/data/execSummaryData.ts','Type','CheckInFlag','Person + daysSinceCheckIn for check-in coverage widget','ExecutiveSummary'],

    // chatEngine.ts
    ['src/data/chatEngine.ts','Function','query()','Intent router: matches user text to local handlers, returns QueryResult or { needsAI: true }','AskAIPage, ChatPanel'],
    ['src/data/chatEngine.ts','Function','buildWorkforceContext()','Builds full org context string used as AI system prompt for Claude','AskAIPage (passed to workforce-ai edge function)'],
    ['src/data/chatEngine.ts','Constant','SUGGESTED_PROMPTS','Quick-start question chips shown in chat UI','AskAIPage, ChatPanel'],
    ['src/data/chatEngine.ts','Constant','PLANNING_PROMPTS','Strategic planning question chips','AskAIPage'],
    ['src/data/chatEngine.ts','Type','QueryResult','Discriminated union of all result kinds','AskAIPage, AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','ChatMessage','Single message record in conversation history (role, content, result)','AskAIPage, ChatPanel'],
    ['src/data/chatEngine.ts','Type','ActionNavTarget','Navigation target shape used inside AI action buttons','AskAIPage, App.tsx'],
    ['src/data/chatEngine.ts','Type','PersonResult','Result kind: list of people with metadata','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','SkillGapResult','Result kind: list of skill gap rows','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','DeptSummaryResult','Result kind: department summary cards','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','StatCard','A single stat tile inside stat-cards results','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','RecommendationResult','Result kind: prioritised recommendation with actions','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','ScenarioResult','Result kind: scenario / what-if analysis output','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','ReductionAnalysis','Result kind: headcount reduction impact analysis','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','DecisionFrame','Result kind: structured decision with options','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','CommitmentPrompt','Result kind: prompt to save a commitment to the journal','AIChatRenderer'],
    ['src/data/chatEngine.ts','Type','PartnerRecommendation','Result kind: recommended partner / vendor cards','AIChatRenderer'],

    // supabase.ts
    ['src/lib/supabase.ts','Constant','supabase','Singleton Supabase JS client (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)','CommitmentsJournal, AIChatRenderer, ExecutiveSummary'],
    ['src/lib/supabase.ts','Type','Commitment','DB row shape: id (uuid), text, source_query (nullable text), created_at (timestamptz)','CommitmentsJournal, AIChatRenderer'],

    // tourData.ts
    ['src/components/tour/tourData.ts','Constant','TOUR_STEPS','Step definitions keyed by ActiveView: element selector, title, body, placement','TourOverlay'],
    ['src/components/tour/tourData.ts','Type','TourStep','Shape of one tour step (selector, title, body, placement)','TourOverlay'],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1['!cols'] = [{wch:30},{wch:12},{wch:34},{wch:64},{wch:80}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Data Sources');

  // ── Sheet 2: Pages & Components ──────────────────────────────────────
  const s2: string[][] = [
    ['Component','Nav Location','Data Files Used','Key Imports','Purpose'],
    ['App.tsx','Root shell','mockData, execSummaryData, chatEngine','type Department, type NavTarget, type ActionNavTarget, type ManagerMetrics','Owns NavState; mounts all views; passes navigation callbacks downward'],
    ['ExecutiveSummary','Home tab','execSummaryData, benchmarkData, supabase','computeExecSummary(), SIMILAR_PEERS, QUARTILE_CONFIG, supabase','CPO dashboard: KPI strip, org risks, wins, check-in coverage, dept health table. Dept rows click through to Skills heatmap with dept pre-selected.'],
    ['SkillsGapHeatmap','Skills tab (container)','mockData, promotionData','SKILLS_DATA, DEPT_COLORS, type Department, getCandidatesForSkill, getBlockedCandidatesForSkill','Renders DepartmentOverview or DeptHeatmap based on selectedDept; accepts initialDepartment prop for deep-linking from Home'],
    ['DepartmentOverview','Skills tab (dept grid)','mockData, promotionData','SKILLS_DATA, DEPT_COLORS, type Department, PEOPLE, LEVEL_DEFINITIONS','Dept card grid with gap severity badges and org summary strip; clicking a card enters that dept heatmap'],
    ['DeptHeatmap (within SkillsGapHeatmap)','Skills tab (dept drilldown)','mockData','SKILLS_DATA, DEPT_COLORS, type Department','Full skill x location heatmap for one dept; clicking a cell opens DrilldownPanel sidebar'],
    ['HeatmapCell','Skills tab (cell)','mockData','type Department','Single coloured heatmap cell with hover tooltip'],
    ['DrilldownPanel','Skills tab (side panel)','mockData, promotionData','SKILLS_DATA, DEPT_COLORS, type Department, PEOPLE, LEVEL_DEFINITIONS, getAllReadiness, LEVEL_FRAMEWORKS, computeReadiness, type SkillGapEntry','Sidebar on heatmap cell click: skill detail, affected people, near-ready blocked candidates, check-in panel'],
    ['DeptGapReportPicker','Gap Report tab (picker)','mockData','DEPT_COLORS, DEPARTMENTS, type Department','Dept selector strip before SkillGapReport renders'],
    ['SkillGapReport','Gap Report tab','mockData, promotionData, managerData','SKILLS_DATA, DEPT_COLORS, type Department, getCandidatesForSkill, getBlockedCandidatesForSkill, MANAGERS','Full per-dept skill gap report with candidate lists and manager context'],
    ['PromotionPipeline','Pipeline tab (container)','promotionData, mockData','getAllReadiness, TIER_CONFIG, TIER_RANGES, groupByTier, getReadinessTier, type ReadinessTier, DEPT_COLORS, DEPARTMENTS','Org-wide pipeline overview with dept switcher; renders DeptPipelineView for selected dept'],
    ['DeptPipelineView','Pipeline tab (kanban)','promotionData','getAllReadiness, TIER_CONFIG, TIER_RANGES, getReadinessTier, groupByTier','Four-column kanban per dept (Near-Ready / Progressing / Developing / Early Stage); person cards open PersonPanel'],
    ['PersonPanel','Pipeline tab (drawer)','promotionData','type ReadinessResult, TIER_CONFIG','Person detail drawer: criteria checklist, score, tenure, location'],
    ['ManagerEffectiveness','Managers tab (grid)','managerData, mockData','MANAGERS, getAllManagerMetrics, DEPT_COLORS, DEPARTMENTS, type Department','Manager scorecard grid with effectiveness bars; clicking a card opens ManagerDetail'],
    ['ManagerDetail','Managers tab (detail)','managerData, promotionData, mockData','MANAGERS, computeManagerMetrics, DEPT_COLORS, type Department, LEVEL_DEFINITIONS, LEVEL_FRAMEWORKS, computeReadiness, TIER_CONFIG','Deep-dive for one manager: direct reports, readiness breakdown, effectiveness scores, coaching flags'],
    ['IndustryBenchmark','Benchmark tab','benchmarkData, mockData','getDeptSkillBenchmarks, getDeptCompBenchmarks, getDeptSizeBenchmarks, getCategoryBenchmarks, getOrgBenchmarks, getOverallBenchmarkSummary, PEER_COMPANIES, ACME_SKILL_COMPETENCY, ACME_COMP, ACME_HEADCOUNT_BY_DEPT, ACME_TOTAL_HEADCOUNT, QUARTILE_CONFIG, SIMILAR_PEERS, ACME_DEPT_PCT, DEPT_COLORS, DEPARTMENTS, type Department','4-tab benchmark view: overview, skills, compensation, team size vs 8 peer companies'],
    ['CommitmentsJournal','Journal / Decisions tab','supabase','supabase (client), type Commitment','CRUD list of saved decision commitments stored in Supabase commitments table'],
    ['AskAIPage','AI tab','chatEngine, supabase','query, buildWorkforceContext, SUGGESTED_PROMPTS, PLANNING_PROMPTS, type ChatMessage, type QueryResult, type ActionNavTarget','Full-page AI chat: intent routing via chatEngine, fallthrough to workforce-ai edge function; document upload for salary context; can save commitments'],
    ['AIChatRenderer','AI tab (renderer)','chatEngine, mockData, promotionData, supabase','All QueryResult variant types, SKILLS_DATA, type Department, PEOPLE, LEVEL_DEFINITIONS, TIER_CONFIG, type ReadinessTier, supabase, type Commitment','Switches on QueryResult.kind and renders the correct card/list/chart for each AI response type'],
    ['ChatPanel','Global (slide-out sidebar)','chatEngine','query, SUGGESTED_PROMPTS, type ChatMessage, type QueryResult','Slide-out chat sidebar; same intent routing as AskAIPage without document upload'],
    ['TourOverlay','Global (tour mode)','tour/tourData','TOUR_STEPS, type TourStep','Step-by-step product tour overlay driven by element selectors per view'],
    ['FeedbackBanner','Various (page footers)','(none)','—','Inline feedback widget shown at bottom of several views'],
    ['FeedbackFlow','Various (modal)','(none)','—','Multi-step feedback collection modal triggered by FeedbackBanner'],
    ['UpsellBanner','Various','(none)','—','Marketing / upsell strip component'],
    ['HowItWorks','Various','(none)','—','Explainer section component'],
    ['Tooltip','Various','(none)','—','Generic tooltip wrapper'],
    ['workforce-ai (Edge Function)','Supabase backend','Anthropic API (external)','POST body: { message: string, context: string }','Calls Claude with full workforce context string; streams completion back to AskAIPage / ChatPanel'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2['!cols'] = [{wch:36},{wch:26},{wch:32},{wch:90},{wch:72}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Pages & Components');

  // ── Sheet 3: Dependency Graph ────────────────────────────────────────
  const s3: string[][] = [
    ['Data File','Tier','Imports From (internal only)','Reason'],
    ['src/data/mockData.ts','1 - Foundational','(none)','Pure static data: departments, 61 skill-gap rows, colours. No internal dependencies.'],
    ['src/lib/supabase.ts','1 - Foundational','(none)','Singleton DB client. No data dependencies.'],
    ['src/components/tour/tourData.ts','1 - Foundational','(none)','Static tour step definitions. No data dependencies.'],
    ['src/data/promotionData.ts','2','mockData','Re-exports DEPT_COLORS; uses type Department for Person records.'],
    ['src/data/benchmarkData.ts','2','mockData','Uses SKILLS_DATA to derive dept-level competency; type Department.'],
    ['src/data/managerData.ts','3','mockData, promotionData','type Department from mockData; PEOPLE + readiness functions from promotionData to score direct reports.'],
    ['src/data/execSummaryData.ts','4 - Aggregator','mockData, promotionData, managerData, benchmarkData','Pulls all signals together for the CPO snapshot. Only ExecutiveSummary consumes it directly.'],
    ['src/data/chatEngine.ts','4 - Aggregator','mockData, promotionData, managerData, benchmarkData','Needs all data to answer any workforce question. AskAIPage and ChatPanel are its only direct consumers.'],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(s3);
  ws3['!cols'] = [{wch:34},{wch:22},{wch:46},{wch:80}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Dependency Graph');

  // ── Sheet 4: Supabase Assets ─────────────────────────────────────────
  const s4: string[][] = [
    ['Asset','Type','Schema / Endpoint','Consumed By','Notes'],
    ['commitments','Database Table','id uuid PK | text text NOT NULL | source_query text | created_at timestamptz DEFAULT now()','CommitmentsJournal (full CRUD), AIChatRenderer (INSERT when user saves a decision from AI)','RLS enabled: authenticated users select/insert/delete own rows only. Migrations: 20260429121239_create_commitments_table.sql, 20260501093848_add_source_query_to_commitments.sql'],
    ['workforce-ai','Edge Function','POST /functions/v1/workforce-ai | body: { message: string, context: string }','AskAIPage (primary), ChatPanel (fallthrough when chatEngine returns needsAI: true)','Wraps Anthropic Claude API. Requires ANTHROPIC_API_KEY edge function secret. Full CORS headers applied.'],
  ];

  const ws4 = XLSX.utils.aoa_to_sheet(s4);
  ws4['!cols'] = [{wch:22},{wch:18},{wch:62},{wch:50},{wch:80}];
  XLSX.utils.book_append_sheet(wb, ws4, 'Supabase Assets');

  // Trigger browser download
  XLSX.writeFile(wb, 'progression-data-map.xlsx');
}
