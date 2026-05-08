import {
  getAllReadiness,
  getReadinessTier,
  groupByTier,
  TIER_CONFIG,
  LEVEL_DEFINITIONS,
  PEOPLE,
  LEVEL_FRAMEWORKS,
  getCrossDeptFitCandidates,
  type ReadinessResult,
  type CrossDeptFitResult,
} from './promotionData';
import { SKILLS_DATA, DEPARTMENTS, type Department } from './mockData';
import { ACME_HEADCOUNT_BY_DEPT, ACME_TOTAL_HEADCOUNT, ACME_SKILL_COMPETENCY, PEER_COMPANIES } from './benchmarkData';
import { MANAGERS, getAllManagerMetrics } from './managerData';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  results?: QueryResult[];
  timestamp: Date;
  isClarifyQuestion?: boolean;
}

export interface PersonResult {
  name: string;
  department: Department;
  readinessPct: number;
  tier: string;
  targetLevel: string;
  topGap?: string;
  tenure: number;
  location: string;
}

export interface SkillGapResult {
  skill: string;
  department: string;
  avgActual: number;
  expected: number;
  gap: number;
  belowTarget: number;
}

export interface DeptSummaryResult {
  department: string;
  total: number;
  nearReady: number;
  avgReadiness: number;
}

export interface StatCard {
  label: string;
  value: string;
  note: string;
}

export type ActionType = 'hire' | 'upskill' | 'restructure' | 'retain' | 'monitor' | 'reduce';

export interface ActionNavTarget {
  view: 'pipeline' | 'gap-report' | 'managers' | 'heatmap' | 'benchmark';
  department?: string;
  label: string; // e.g. "View pipeline" / "Open skills report"
}

export interface DeptReductionImpact {
  department: Department;
  currentHeadcount: number;
  targetReduction: number;
  nearReadyLost: number;
  criticalSkillsAtRisk: string[];
  voluntaryLikely: number; // people who are high churn risk — may leave anyway
  capabilityRisk: 'critical' | 'high' | 'medium' | 'low';
  benchmarkDelta: number; // how much further below peers this puts us
}

export interface ClarificationQuestion {
  question: string;
  chips: string[]; // quick-reply options
}

export interface ClarificationResult {
  intro: string;
  reasoning: string; // transparent explanation of why we ask
  questions: ClarificationQuestion[];
  composeKey?: 'headcount-reduction' | 'careerminds'; // how to build the follow-up prompt
}

export interface ReductionAnalysis {
  totalHeadcount: number;
  reductionTarget: number; // absolute number
  reductionPct: number;
  voluntaryBuffer: number; // how many might leave anyway
  netForcedReduction: number;
  alternativeSavings: string[];
  deptImpacts: DeptReductionImpact[];
  legalFlags: string[];
  processSteps: string[];
}

export interface RecommendationAction {
  type: ActionType;
  label: string;
  detail: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  navTarget?: ActionNavTarget;
}

export interface RecommendationResult {
  title: string;
  context: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  actions: RecommendationAction[];
}

export interface ScenarioResult {
  scenario: string;
  current: string;
  projected: string;
  risk: 'high' | 'medium' | 'low';
  mitigations: string[];
}

export type QueryResultKind =
  | 'person-list'
  | 'skill-gap-list'
  | 'dept-summary'
  | 'churn-risk-list'
  | 'stat-cards'
  | 'recommendation'
  | 'scenario'
  | 'reduction'
  | 'clarification'
  | 'decision'
  | 'commitment-prompt'
  | 'partner-recommendation'
  | 'role-fit-list';

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  prompt: string; // sent as next user message when chosen
  icon: 'upskill' | 'hire' | 'move' | 'monitor' | 'retain' | 'restructure';
  accent: 'sky' | 'emerald' | 'amber' | 'rose' | 'teal';
}

export interface DecisionFrame {
  situation: string;
  question: string;
  options: DecisionOption[];
  insightKind: string;
  department?: string;
}

export interface CommitmentPrompt {
  insightSummary: string;
  insightKind: string;
  department?: string;
  sourceQuery?: string;
}

export type PartnerService =
  | 'outplacement'
  | 'talent-development'
  | 'leadership-dev'
  | 'manager-coaching'
  | 'comp-review';

export interface PartnerRecommendation {
  service: PartnerService;
  provider: string;
  headline: string;
  body: string;
  cta: string;
  why: string; // personalised rationale based on their answers
}

export type QueryResult =
  | { kind: 'person-list'; items: PersonResult[] }
  | { kind: 'skill-gap-list'; items: SkillGapResult[] }
  | { kind: 'dept-summary'; items: DeptSummaryResult[] }
  | { kind: 'churn-risk-list'; items: PersonResult[] }
  | { kind: 'stat-cards'; items: StatCard[] }
  | { kind: 'recommendation'; items: RecommendationResult[] }
  | { kind: 'scenario'; items: ScenarioResult[] }
  | { kind: 'reduction'; analysis: ReductionAnalysis }
  | { kind: 'clarification'; data: ClarificationResult }
  | { kind: 'labeled-people'; label: string; subLabel?: string; isChurn?: boolean; items: PersonResult[] }
  | { kind: 'decision'; frame: DecisionFrame }
  | { kind: 'commitment-prompt'; data: CommitmentPrompt }
  | { kind: 'partner-recommendation'; data: PartnerRecommendation }
  | { kind: 'role-fit-list'; items: CrossDeptFitResult[] };

// ── Suggest prompts shown when chat is empty ─────────────────────────
export const SUGGESTED_PROMPTS = [
  'Who is ready for promotion?',
  'Who is at risk of churn?',
  'Where are our biggest skills gaps?',
  'Show me the Engineering pipeline',
  'Who needs the most development?',
  'Which skills are missing org-wide?',
  'How many people are near-ready in Product?',
  'Who might be better suited to a different role?',
];

export const PLANNING_PROMPTS = [
  'Recommend a hiring strategy for Engineering',
  'How do we close the skills gaps in Data?',
  'Which teams need restructuring?',
  'Build a retention plan for churn risks',
  'What if we lose 3 Staff Engineers?',
  'Prioritize upskilling across the org',
  'How does our bench compare to industry?',
  'Create a 90-day workforce action plan',
  'Help me with a headcount reduction plan',
];

// ── Helpers ──────────────────────────────────────────────────────────

function toPersonResult(r: ReadinessResult): PersonResult {
  return {
    name: r.person.name,
    department: r.person.department as Department,
    readinessPct: r.readinessPct,
    tier: TIER_CONFIG[getReadinessTier(r.readinessPct)].label,
    targetLevel: r.targetLevelLabel,
    topGap: r.gapSkills.sort((a, b) => b.gap - a.gap)[0]?.skillName,
    tenure: r.person.tenure,
    location: r.person.location,
  };
}

function matchesDept(dept: Department, query: string): boolean {
  return query.includes(dept.toLowerCase()) ||
    (dept === 'Engineering' && (query.includes('eng') || query.includes('engineer'))) ||
    (dept === 'People Ops' && (query.includes('people') || query.includes('hr') || query.includes('people ops'))) ||
    (dept === 'Product' && query.includes('product')) ||
    (dept === 'Design' && query.includes('design')) ||
    (dept === 'Data' && query.includes('data')) ||
    (dept === 'Marketing' && query.includes('market')) ||
    (dept === 'Sales' && query.includes('sales'));
}

function detectDept(query: string): Department | null {
  return DEPARTMENTS.find(d => matchesDept(d, query)) ?? null;
}

// ── Intent handlers ──────────────────────────────────────────────────

function handlePromoReady(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();
  const nearReady = all
    .filter(r => getReadinessTier(r.readinessPct) === 'near-ready')
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => b.readinessPct - a.readinessPct);

  const scope = dept ? ` in ${dept}` : ' org-wide';
  if (nearReady.length === 0) {
    return { text: `No one${scope} is currently at 90%+ readiness.`, results: [] };
  }

  return {
    text: `${nearReady.length} ${nearReady.length === 1 ? 'person is' : 'people are'} ready for promotion${scope} (90%+ criteria met).`,
    results: [
      { kind: 'person-list', items: nearReady.map(toPersonResult) },
      { kind: 'commitment-prompt', data: {
        insightSummary: `${nearReady.length} people are ready for promotion${scope}`,
        insightKind: 'promotion',
        department: dept ?? undefined,
      }},
    ],
  };
}

function handleProgressing(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();
  const tier = all
    .filter(r => getReadinessTier(r.readinessPct) === 'progressing')
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => b.readinessPct - a.readinessPct);

  const scope = dept ? ` in ${dept}` : ' org-wide';
  return {
    text: `${tier.length} ${tier.length === 1 ? 'person is' : 'people are'} progressing (70–89%)${scope} — on track but with gaps to close.`,
    results: [{ kind: 'person-list', items: tier.map(toPersonResult) }],
  };
}

function handleChurnRisk(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();

  // Churn risk: high tenure (>= 18m) in current level + low-to-mid readiness
  const atRisk = all
    .filter(r => r.person.tenure >= 18 && r.readinessPct < 70)
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => b.person.tenure - a.person.tenure);

  const scope = dept ? ` in ${dept}` : '';
  if (atRisk.length === 0) {
    return { text: `No high-churn-risk signals detected${scope}.`, results: [] };
  }

  const topDept = dept ?? (atRisk[0]?.person.department ?? undefined);
  const decisionFrame: DecisionFrame = {
    situation: `${atRisk.length} ${atRisk.length === 1 ? 'person is' : 'people are'} at churn risk${scope}.`,
    question: 'What do you want to do about it?',
    insightKind: 'churn-risk',
    department: topDept,
    options: [
      {
        id: 'retain-plan',
        label: 'Build a retention plan',
        description: 'Get specific actions to re-engage and keep each person',
        prompt: `Build a retention plan for churn risks${dept ? ` in ${dept}` : ''}`,
        icon: 'retain',
        accent: 'rose',
      },
      {
        id: 'mobility',
        label: 'Explore internal mobility',
        description: 'See if a role move could reignite engagement',
        prompt: `What internal mobility options exist for people at churn risk${dept ? ` in ${dept}` : ''}?`,
        icon: 'move',
        accent: 'amber',
      },
      {
        id: 'scenario',
        label: 'Model the impact of losing them',
        description: "See what breaks if they actually leave",
        prompt: `What happens if we lose the ${Math.min(atRisk.length, 3)} people most at churn risk${dept ? ` in ${dept}` : ''}?`,
        icon: 'monitor',
        accent: 'sky',
      },
    ],
  };

  return {
    text: `${atRisk.length} ${atRisk.length === 1 ? 'person has' : 'people have'} been in their current level 18+ months but are below 70% readiness${scope} — high churn risk.`,
    results: [
      { kind: 'churn-risk-list', items: atRisk.map(toPersonResult) },
      { kind: 'decision', frame: decisionFrame },
    ],
  };
}

function handleSkillsGaps(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);

  // Aggregate gaps by skill across all rows
  const gapMap = new Map<string, { skill: string; department: string; totalBelow: number; totalHeadcount: number; sumGap: number; sumExpected: number; count: number }>();

  for (const row of SKILLS_DATA) {
    if (dept && row.department !== dept) continue;
    const gap = row.expectedLevel - row.averageActual;
    if (gap <= 0) continue;
    const key = `${row.skill}|${dept ? row.department : 'org'}`;
    const existing = gapMap.get(key);
    if (existing) {
      existing.totalBelow += row.belowTarget;
      existing.totalHeadcount += row.headcount;
      existing.sumGap += gap;
      existing.sumExpected += row.expectedLevel;
      existing.count++;
    } else {
      gapMap.set(key, {
        skill: row.skill,
        department: dept ? row.department : 'Org-wide',
        totalBelow: row.belowTarget,
        totalHeadcount: row.headcount,
        sumGap: gap,
        sumExpected: row.expectedLevel,
        count: 1,
      });
    }
  }

  const items: SkillGapResult[] = Array.from(gapMap.values())
    .map(v => ({
      skill: v.skill,
      department: v.department,
      avgActual: parseFloat((v.sumExpected / v.count - v.sumGap / v.count).toFixed(1)),
      expected: parseFloat((v.sumExpected / v.count).toFixed(1)),
      gap: parseFloat((v.sumGap / v.count).toFixed(1)),
      belowTarget: v.totalBelow,
    }))
    .sort((a, b) => b.belowTarget - a.belowTarget)
    .slice(0, 10);

  const scope = dept ? ` in ${dept}` : ' org-wide';
  const topSkill = items[0]?.skill ?? 'this skill';
  const topSkillDept = items[0]?.department ?? dept ?? undefined;
  const decisionFrame: DecisionFrame = {
    situation: `${topSkill} is your biggest gap${scope} — ${items[0]?.belowTarget ?? 0} people below target.`,
    question: 'How do you want to close it?',
    insightKind: 'skill-gap',
    department: topSkillDept !== 'Org-wide' ? topSkillDept : undefined,
    options: [
      {
        id: 'upskill',
        label: 'Upskilling path',
        description: 'See who to develop and how long it takes',
        prompt: `How do we close the ${topSkill} skills gap${dept ? ` in ${dept}` : ''}?`,
        icon: 'upskill',
        accent: 'teal',
      },
      {
        id: 'mobility',
        label: 'Internal mobility',
        description: 'Find people in other teams with this skill already',
        prompt: `Who internally has strong ${topSkill} skills and could move${dept ? ` into ${dept}` : ''}?`,
        icon: 'move',
        accent: 'amber',
      },
      {
        id: 'hire',
        label: 'Hiring cost',
        description: 'Understand what bringing in external talent looks like',
        prompt: `What would it cost to hire for ${topSkill}${dept ? ` in ${dept}` : ''}?`,
        icon: 'hire',
        accent: 'sky',
      },
    ],
  };

  return {
    text: `Top ${items.length} skills gaps${scope} by number of people below target:`,
    results: [
      { kind: 'skill-gap-list', items },
      { kind: 'decision', frame: decisionFrame },
    ],
  };
}

function handleDeptPipeline(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();

  const deptsToShow: Department[] = dept ? [dept] : [...DEPARTMENTS];
  const summaries: DeptSummaryResult[] = deptsToShow.map(d => {
    const results = all.filter(r => r.person.department === d);
    const tiers = groupByTier(results);
    const avgReadiness = results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.readinessPct, 0) / results.length)
      : 0;
    return { department: d, total: results.length, nearReady: tiers['near-ready'], avgReadiness };
  });

  const scope = dept ? dept : 'all departments';
  return {
    text: `Pipeline summary for ${scope}:`,
    results: [{ kind: 'dept-summary', items: summaries }],
  };
}

function handleEveryone(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness()
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => b.readinessPct - a.readinessPct);

  const scope = dept ? ` in ${dept}` : '';
  return {
    text: `${all.length} people${scope} tracked for promotion, sorted by readiness:`,
    results: [{ kind: 'person-list', items: all.map(toPersonResult) }],
  };
}

function handleNeedsWork(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness()
    .filter(r => getReadinessTier(r.readinessPct) === 'early' || getReadinessTier(r.readinessPct) === 'developing')
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => a.readinessPct - b.readinessPct);

  const scope = dept ? ` in ${dept}` : '';
  return {
    text: `${all.length} ${all.length === 1 ? 'person needs' : 'people need'} the most development${scope} (below 70% readiness):`,
    results: [{ kind: 'person-list', items: all.map(toPersonResult) }],
  };
}

function handleOrgStats(): { text: string; results: QueryResult[] } {
  const all = getAllReadiness();
  const tiers = groupByTier(all);
  const n = all.length;
  const avgReadiness = n > 0 ? Math.round(all.reduce((s, r) => s + r.readinessPct, 0) / n) : 0;
  const atRisk = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;

  return {
    text: `Here's the org-wide snapshot across ${n} tracked employees:`,
    results: [{
      kind: 'stat-cards',
      items: [
        { label: 'Near Ready', value: String(tiers['near-ready']), note: '90%+ criteria met' },
        { label: 'Progressing', value: String(tiers['progressing']), note: '70–89% readiness' },
        { label: 'Developing', value: String(tiers['developing']), note: '50–69% readiness' },
        { label: 'Avg Readiness', value: `${avgReadiness}%`, note: 'across all candidates' },
        { label: 'Churn Risk', value: String(atRisk), note: '18m+ tenure, <70% ready' },
        { label: 'Tracked Total', value: String(n), note: 'people in pipeline' },
      ],
    }],
  };
}

function handlePersonSearch(query: string): { text: string; results: QueryResult[] } | null {
  const all = getAllReadiness();
  const tokens = query.split(/\s+/).filter(t => t.length > 2);
  const matches = all.filter(r => {
    const name = r.person.name.toLowerCase();
    return tokens.some(t => name.includes(t));
  });
  if (matches.length === 0) return null;
  return {
    text: `Found ${matches.length} matching ${matches.length === 1 ? 'person' : 'people'}:`,
    results: [{ kind: 'person-list', items: matches.map(toPersonResult) }],
  };
}

function handleRoleFit(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getCrossDeptFitCandidates();
  const filtered = dept
    ? all.filter(r => r.currentDept === dept || r.suggestedDept === dept)
    : all;

  if (filtered.length === 0) {
    return {
      text: `No cross-department fit candidates detected${dept ? ` for ${dept}` : ''}. Upload LinkedIn data via Revelio Labs to surface hidden strengths across more employees.`,
      results: [],
    };
  }

  const scope = dept ? ` in or involving ${dept}` : '';
  const topCandidate = filtered[0];
  return {
    text: `${filtered.length} employee${filtered.length === 1 ? '' : 's'}${scope} show stronger fit in a different department based on their inferred LinkedIn skills. Top signal: ${topCandidate.person.name} scores ${topCandidate.fitPct}% in ${topCandidate.suggestedDept} vs ${topCandidate.currentReadinessPct}% in their current ${topCandidate.currentDept} role — a +${topCandidate.delta}% delta.`,
    results: [
      { kind: 'role-fit-list', items: filtered },
    ],
  };
}

// ── Strategy / Recommend handlers ────────────────────────────────────

function handleHiringStrategy(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();

  if (dept) {
    const deptPeople = all.filter(r => r.person.department === dept);
    const headcount = ACME_HEADCOUNT_BY_DEPT[dept] ?? deptPeople.length;
    const nearReady = deptPeople.filter(r => getReadinessTier(r.readinessPct) === 'near-ready').length;
    const churnRisk = deptPeople.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;

    // Find top skill gaps for this dept
    const deptGaps = SKILLS_DATA
      .filter(s => s.department === dept && s.expectedLevel > s.averageActual)
      .sort((a, b) => (b.expectedLevel - b.averageActual) - (a.expectedLevel - a.averageActual))
      .slice(0, 3);

    const topGapSkill = deptGaps[0]?.skill ?? 'core skills';
    const gapSeverity = deptGaps[0] ? (deptGaps[0].expectedLevel - deptGaps[0].averageActual).toFixed(1) : '0';

    // Benchmark comparison
    const acmeComp = ACME_SKILL_COMPETENCY[dept] ?? 3.0;
    const peerAvg = PEER_COMPANIES.reduce((s, p) => s + (p.deptSkillCompetency[dept] ?? 3.0), 0) / PEER_COMPANIES.length;
    const benchmarkGap = (peerAvg - acmeComp).toFixed(1);

    const rec: RecommendationResult = {
      title: `${dept} Hiring Strategy`,
      context: `${dept} has ${headcount} people, ${nearReady} ready for promotion, ${churnRisk} churn risks, and a ${gapSeverity}-point gap in ${topGapSkill}. Peer average competency is ${Number(benchmarkGap) > 0 ? '+' : ''}${benchmarkGap} vs your team.`,
      urgency: churnRisk >= 3 || Number(gapSeverity) >= 1.5 ? 'high' : 'medium',
      actions: [
        {
          type: 'hire',
          label: `Hire ${Math.max(1, churnRisk)} senior ${dept} hires`,
          detail: `Focus on ${topGapSkill} as a required competency. ${churnRisk > 0 ? `${churnRisk} at-risk people create backfill pressure.` : 'Strengthen bench depth proactively.'}`,
          impact: churnRisk >= 2 ? 'high' : 'medium',
          timeframe: '0–3 months',
          navTarget: { view: 'pipeline', department: dept, label: 'View pipeline' },
        },
        {
          type: 'upskill',
          label: `Launch ${topGapSkill} upskilling program`,
          detail: `${deptGaps[0]?.belowTarget ?? 0} people in ${dept} are below target on ${topGapSkill}. A structured 8-week program would close ~60% of the gap.`,
          impact: 'high',
          timeframe: '1–3 months',
          navTarget: { view: 'gap-report', department: dept, label: 'Open skills report' },
        },
        ...(nearReady > 0 ? [{
          type: 'retain' as ActionType,
          label: `Fast-track ${nearReady} near-ready ${nearReady === 1 ? 'person' : 'people'} for promotion`,
          detail: `Promoting internal talent is 2–4x cheaper than external hiring and signals strong career paths. ${nearReady} ${dept} ${nearReady === 1 ? 'person is' : 'people are'} ready now.`,
          impact: 'high' as const,
          timeframe: 'Immediate',
          navTarget: { view: 'pipeline' as const, department: dept, label: 'View promotion pipeline' },
        }] : []),
      ],
    };

    const deptChurnRisks = all.filter(r => r.person.department === dept && r.person.tenure >= 18 && r.readinessPct < 70);
    const deptNearReady = all.filter(r => r.person.department === dept && getReadinessTier(r.readinessPct) === 'near-ready');
    return {
      text: `Here's a targeted hiring and growth strategy for ${dept}:`,
      results: [
        { kind: 'recommendation', items: [rec] },
        ...(deptChurnRisks.length > 0 ? [{
          kind: 'labeled-people' as const,
          label: `${deptChurnRisks.length} churn risk${deptChurnRisks.length === 1 ? '' : 's'} in ${dept}`,
          subLabel: 'High backfill pressure — these are the people driving urgency',
          isChurn: true,
          items: deptChurnRisks.map(toPersonResult),
        }] : []),
        ...(deptNearReady.length > 0 ? [{
          kind: 'labeled-people' as const,
          label: `${deptNearReady.length} near-ready in ${dept}`,
          subLabel: 'Ready for promotion now — internal backfill candidates',
          isChurn: false,
          items: deptNearReady.map(toPersonResult),
        }] : []),
      ],
    };
  }

  // Org-wide hiring strategy
  const churnRisks = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70);
  const promotionReady = all.filter(r => getReadinessTier(r.readinessPct) === 'near-ready');

  const riskByDept = new Map<string, number>();
  for (const r of churnRisks) {
    riskByDept.set(r.person.department, (riskByDept.get(r.person.department) ?? 0) + 1);
  }
  const topRiskDept = [...riskByDept.entries()].sort((a, b) => b[1] - a[1])[0];

  const recs: RecommendationResult[] = [
    {
      title: 'Immediate: Backfill Risk',
      context: `${churnRisks.length} people org-wide are high churn risks. ${topRiskDept ? `${topRiskDept[0]} has the most at-risk staff (${topRiskDept[1]}).` : ''}`,
      urgency: churnRisks.length >= 5 ? 'critical' : 'high',
      actions: [
        {
          type: 'hire',
          label: `Open ${Math.ceil(churnRisks.length * 0.5)} strategic backfill roles`,
          detail: 'Source externally for critical skill gaps; use internal mobility for culture-fit roles.',
          impact: 'high',
          timeframe: '0–6 weeks',
          navTarget: { view: 'pipeline', label: 'View promotion pipeline' },
        },
        {
          type: 'retain',
          label: `Initiate stay conversations with ${churnRisks.length} at-risk employees`,
          detail: 'Manager 1:1s with clear career path commitments. Focus on stalled progression as the #1 exit reason.',
          impact: 'high',
          timeframe: 'This week',
          navTarget: { view: 'pipeline', label: 'View pipeline' },
        },
      ],
    },
    {
      title: 'Near-term: Internal Mobility',
      context: `${promotionReady.length} people are promotion-ready. Filling openings internally first reduces time-to-productivity by ~60%.`,
      urgency: 'medium',
      actions: [
        {
          type: 'retain',
          label: `Promote ${promotionReady.length} ready employees in next cycle`,
          detail: 'Delay costs motivation and accelerates churn for your best performers.',
          impact: 'high',
          timeframe: 'Next review cycle',
          navTarget: { view: 'pipeline', label: 'View promotion pipeline' },
        },
        {
          type: 'upskill',
          label: 'Start skill-targeted learning sprints for progressing employees',
          detail: 'Focus on the top 3 skill gaps per department to accelerate pipeline velocity.',
          impact: 'medium',
          timeframe: '1–3 months',
          navTarget: { view: 'heatmap', label: 'View skills heatmap' },
        },
      ],
    },
  ];

  return {
    text: `Org-wide hiring strategy based on current pipeline, churn signals, and skill gaps:`,
    results: [
      { kind: 'recommendation', items: recs },
      ...(churnRisks.length > 0 ? [{
        kind: 'labeled-people' as const,
        label: `${churnRisks.length} at-risk employee${churnRisks.length === 1 ? '' : 's'} driving backfill urgency`,
        subLabel: '18+ months in role, below 70% readiness — stay conversations needed this week',
        isChurn: true,
        items: churnRisks.slice(0, 8).map(toPersonResult),
      }] : []),
      ...(promotionReady.length > 0 ? [{
        kind: 'labeled-people' as const,
        label: `${promotionReady.length} promotion-ready employee${promotionReady.length === 1 ? '' : 's'} for internal mobility`,
        subLabel: 'Promote before external hiring — 2–4x cheaper and faster to productivity',
        isChurn: false,
        items: promotionReady.slice(0, 8).map(toPersonResult),
      }] : []),
    ],
  };
}

function handleUpskillStrategy(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);

  // Find the most severe skill gaps
  const gapMap = new Map<string, { skill: string; dept: string; belowTarget: number; gap: number; headcount: number }>();
  for (const row of SKILLS_DATA) {
    if (dept && row.department !== dept) continue;
    const gap = row.expectedLevel - row.averageActual;
    if (gap <= 0) continue;
    const key = `${row.skill}|${dept ? row.department : 'org'}`;
    const ex = gapMap.get(key);
    if (ex) {
      ex.belowTarget += row.belowTarget;
      ex.headcount += row.headcount;
      ex.gap = Math.max(ex.gap, gap);
    } else {
      gapMap.set(key, { skill: row.skill, dept: row.department, belowTarget: row.belowTarget, gap, headcount: row.headcount });
    }
  }

  const sorted = [...gapMap.values()].sort((a, b) => b.belowTarget - a.belowTarget).slice(0, 4);
  const scope = dept ?? 'Org-wide';
  const totalImpacted = sorted.reduce((s, g) => s + g.belowTarget, 0);

  const actions: RecommendationAction[] = sorted.map(g => ({
    type: 'upskill' as ActionType,
    label: `${g.skill} — ${g.belowTarget} people need uplift`,
    detail: `Average gap of ${g.gap.toFixed(1)} points. ${Math.round((g.belowTarget / g.headcount) * 100)}% of ${dept ? dept : g.dept} below target. Recommend structured workshop + mentorship pairing.`,
    impact: g.belowTarget >= 10 ? 'high' : g.belowTarget >= 5 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
    timeframe: g.gap >= 1.5 ? '3–6 months' : '4–8 weeks',
    navTarget: { view: 'gap-report' as const, department: dept ?? g.dept, label: 'Open skills report' },
  }));

  const rec: RecommendationResult = {
    title: `${scope} Upskilling Roadmap`,
    context: `${totalImpacted} people across ${sorted.length} skill areas are below target. Closing these gaps would unlock ~${Math.round(totalImpacted * 0.6)} additional promotion-ready candidates over 6 months.`,
    urgency: totalImpacted >= 30 ? 'high' : 'medium',
    actions,
  };

  return {
    text: `Upskilling strategy prioritized by impact${dept ? ` for ${dept}` : ' across the org'}:`,
    results: [{ kind: 'recommendation', items: [rec] }],
  };
}

function handleRetentionPlan(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);
  const all = getAllReadiness();
  const atRisk = all
    .filter(r => r.person.tenure >= 18 && r.readinessPct < 70)
    .filter(r => !dept || r.person.department === dept)
    .sort((a, b) => b.person.tenure - a.person.tenure);

  const scope = dept ? ` in ${dept}` : '';
  const avgTenure = atRisk.length > 0
    ? Math.round(atRisk.reduce((s, r) => s + r.person.tenure, 0) / atRisk.length)
    : 0;

  const rec: RecommendationResult = {
    title: `Retention Plan${scope}`,
    context: `${atRisk.length} people${scope} have been in their role 18+ months without reaching 70% promotion readiness — the strongest predictor of voluntary exit.${avgTenure > 0 ? ` Average tenure: ${avgTenure} months.` : ''}`,
    urgency: atRisk.length >= 6 ? 'critical' : atRisk.length >= 3 ? 'high' : 'medium',
    actions: [
      {
        type: 'retain',
        label: `Schedule career clarity conversations with all ${atRisk.length} at-risk employees`,
        detail: 'Manager-led 30-min sessions with a written career path document by end of week. This single action reduces 6-month attrition risk by ~40%.',
        impact: 'high',
        timeframe: 'This week',
        navTarget: { view: 'pipeline', department: dept ?? undefined, label: 'View promotion pipeline' },
      },
      {
        type: 'upskill',
        label: 'Assign targeted skill coaches for top gaps',
        detail: 'Each at-risk employee has a dominant skill gap blocking progression. Pair with a senior peer who is strong in that area.',
        impact: 'high',
        timeframe: '2–4 weeks',
        navTarget: { view: 'gap-report', department: dept ?? undefined, label: 'Open skills gap report' },
      },
      {
        type: 'restructure',
        label: 'Review role scope and growth opportunities',
        detail: 'Some stalls are caused by narrow role definitions. Consider lateral moves, stretch assignments, or new team placement to re-engage.',
        impact: 'medium',
        timeframe: '4–8 weeks',
        navTarget: { view: 'managers', label: 'View manager effectiveness' },
      },
      {
        type: 'monitor',
        label: 'Set monthly check-in cadence for at-risk cohort',
        detail: 'Track readiness % monthly. Escalate to senior leadership if no improvement after 60 days.',
        impact: 'medium',
        timeframe: 'Ongoing',
        navTarget: { view: 'pipeline', department: dept ?? undefined, label: 'View promotion pipeline' },
      },
    ],
  };

  return {
    text: `Retention action plan for ${atRisk.length} at-risk employee${atRisk.length === 1 ? '' : 's'}${scope}:`,
    results: [
      { kind: 'recommendation', items: [rec] },
      { kind: 'churn-risk-list', items: atRisk.slice(0, 5).map(toPersonResult) },
    ],
  };
}

function handleScenarioPlanning(query: string): { text: string; results: QueryResult[] } {
  const all = getAllReadiness();

  // Detect if asking about losing staff engineers / senior people
  const loseMatch = query.match(/lose\s+(\d+)|(\d+)\s+(staff|senior|lead|ic4|manager)/i);
  const count = loseMatch ? parseInt(loseMatch[1] ?? loseMatch[2], 10) : 2;

  const dept = detectDept(query);
  const isSenior = /staff|senior|lead|ic4|m2/i.test(query);

  const deptScope = dept ?? 'Engineering';
  const deptPeople = all.filter(r => r.person.department === deptScope);
  const nearReady = deptPeople.filter(r => getReadinessTier(r.readinessPct) === 'near-ready');
  const headcount = ACME_HEADCOUNT_BY_DEPT[deptScope] ?? deptPeople.length;

  // Top skill gap for this dept
  const deptGaps = SKILLS_DATA
    .filter(s => s.department === deptScope && s.expectedLevel > s.averageActual)
    .sort((a, b) => (b.expectedLevel - b.averageActual) - (a.expectedLevel - a.averageActual));
  const topGap = deptGaps[0]?.skill ?? 'core skills';

  const capacityImpact = Math.round((count / headcount) * 100);
  const canBackfillInternally = nearReady.length >= count;

  const scenarios: ScenarioResult[] = [
    {
      scenario: `Lose ${count} ${isSenior ? 'senior' : ''} ${deptScope} ${count === 1 ? 'person' : 'people'}`,
      current: `${headcount} total, ${nearReady.length} near-ready, top gap: ${topGap}`,
      projected: `~${capacityImpact}% capacity loss. ${canBackfillInternally ? `${nearReady.length} internal candidates available for backfill.` : `Only ${nearReady.length} near-ready — external hiring required for ${count - nearReady.length} role${count - nearReady.length > 1 ? 's' : ''}.`}`,
      risk: capacityImpact >= 10 || !canBackfillInternally ? 'high' : 'medium',
      mitigations: [
        canBackfillInternally
          ? `Promote ${Math.min(count, nearReady.length)} near-ready employees immediately`
          : `Open ${count - nearReady.length} external hire${count - nearReady.length > 1 ? 's' : ''} focused on ${topGap}`,
        `Cross-train ${Math.min(3, deptPeople.length - count)} progressing employees as coverage`,
        `Redistribute critical projects to reduce single points of failure`,
        `Increase check-in frequency with remaining team to detect further flight risk`,
      ],
    },
    {
      scenario: `${topGap} skill gap widens by 1 level`,
      current: `${deptGaps[0]?.belowTarget ?? 0} people below target today`,
      projected: `Est. ${Math.round((deptGaps[0]?.belowTarget ?? 0) * 1.4)} people impacted in 6 months if unchecked. Product quality and delivery velocity at risk.`,
      risk: (deptGaps[0]?.belowTarget ?? 0) >= 10 ? 'high' : 'medium',
      mitigations: [
        `Launch structured ${topGap} curriculum within 4 weeks`,
        `Hire 1–2 ${topGap} specialists who can act as internal coaches`,
        `Set quarterly skill milestones and track progress in review cycles`,
      ],
    },
  ];

  return {
    text: `Scenario analysis for ${deptScope} — here's what the data projects:`,
    results: [{ kind: 'scenario', items: scenarios }],
  };
}

function handleTeamRestructure(query: string): { text: string; results: QueryResult[] } {
  const all = getAllReadiness();
  const managerMetrics = getAllManagerMetrics();

  // Find departments / managers with poor metrics
  const weakManagers = managerMetrics
    .filter(m => m.avgReadiness < 60 || m.blockedCount >= 3)
    .sort((a, b) => a.avgReadiness - b.avgReadiness)
    .slice(0, 3);

  // Departments with high churn + low pipeline
  const deptStats = DEPARTMENTS.map(d => {
    const deptPeople = all.filter(r => r.person.department === d);
    const churnRisk = deptPeople.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;
    const nearReady = deptPeople.filter(r => getReadinessTier(r.readinessPct) === 'near-ready').length;
    return { dept: d, churnRisk, nearReady, total: deptPeople.length };
  }).filter(d => d.churnRisk >= 2 || d.nearReady === 0).sort((a, b) => b.churnRisk - a.churnRisk);

  const recs: RecommendationResult[] = [];

  if (weakManagers.length > 0) {
    recs.push({
      title: 'Manager Effectiveness Intervention',
      context: `${weakManagers.length} manager${weakManagers.length > 1 ? 's' : ''} have teams below 60% avg readiness or 3+ blocked employees. This is the strongest structural signal for reshuffling.`,
      urgency: 'high',
      actions: [
        {
          type: 'restructure',
          label: `Audit team composition under ${weakManagers.map(m => m.manager.name).join(', ')}`,
          detail: `Low team readiness is often structural: wrong team size, mismatched skills, or manager bandwidth issues. Start with a 2-week diagnostic.`,
          impact: 'high',
          timeframe: '2–4 weeks',
          navTarget: { view: 'managers', label: 'View manager effectiveness' },
        },
        {
          type: 'upskill',
          label: 'Manager coaching for low-velocity teams',
          detail: 'Readiness velocity is a direct function of manager effectiveness. Pair with a senior leader for monthly coaching and structured 1:1 frameworks.',
          impact: 'high',
          timeframe: '4–8 weeks',
          navTarget: { view: 'managers', label: 'View manager report' },
        },
      ],
    });
  }

  if (deptStats.length > 0) {
    const topDept = deptStats[0];
    recs.push({
      title: `${topDept.dept} Team Structure Review`,
      context: `${topDept.churnRisk} churn risks and ${topDept.nearReady} near-ready in ${topDept.dept}. Thin pipeline combined with flight risk suggests structural misalignment.`,
      urgency: topDept.churnRisk >= 3 ? 'critical' : 'high',
      actions: [
        {
          type: 'restructure',
          label: `Redistribute ${topDept.dept} team into smaller, focused pods`,
          detail: 'Smaller teams (4–6) with clear ownership reduce stall risk and give managers more visibility into individual growth.',
          impact: 'medium',
          timeframe: '4–12 weeks',
          navTarget: { view: 'pipeline', department: topDept.dept, label: 'View pipeline' },
        },
        {
          type: 'hire',
          label: `Add a senior individual contributor to strengthen ${topDept.dept} pipeline`,
          detail: 'A technical anchor at IC4/Staff level creates mentorship density and pulls up the team\'s average competency.',
          impact: 'high',
          timeframe: '6–12 weeks to hire',
          navTarget: { view: 'gap-report', department: topDept.dept, label: 'Open skills report' },
        },
      ],
    });
  }

  if (recs.length === 0) {
    return {
      text: `No urgent restructuring signals found. Team compositions look reasonably healthy. Consider reviewing again after next review cycle.`,
      results: [],
    };
  }

  const structuralAtRisk = all.filter(r =>
    deptStats.some(d => d.dept === r.person.department) &&
    r.person.tenure >= 18 && r.readinessPct < 70
  ).slice(0, 8);

  return {
    text: `Restructuring recommendations based on manager effectiveness and pipeline health:`,
    results: [
      { kind: 'recommendation', items: recs },
      ...(structuralAtRisk.length > 0 ? [{
        kind: 'labeled-people' as const,
        label: `${structuralAtRisk.length} at-risk employee${structuralAtRisk.length === 1 ? '' : 's'} in structurally weak departments`,
        subLabel: 'These people are most exposed to the structural issues identified above',
        isChurn: true,
        items: structuralAtRisk.map(toPersonResult),
      }] : []),
    ],
  };
}

function handleActionPlan(query: string): { text: string; results: QueryResult[] } {
  const all = getAllReadiness();
  const churnRisks = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70);
  const nearReady = all.filter(r => getReadinessTier(r.readinessPct) === 'near-ready');
  const progressing = all.filter(r => getReadinessTier(r.readinessPct) === 'progressing');

  const topGap = SKILLS_DATA
    .filter(s => s.expectedLevel > s.averageActual)
    .sort((a, b) => (b.expectedLevel - b.averageActual + b.belowTarget) - (a.expectedLevel - a.averageActual + a.belowTarget))[0];

  const recs: RecommendationResult[] = [
    {
      title: 'Days 1–30: Stop the Bleeding',
      context: `${churnRisks.length} at-risk employees and ${nearReady.length} promotable employees need immediate action.`,
      urgency: 'critical',
      actions: [
        {
          type: 'retain',
          label: `Career clarity sessions with all ${churnRisks.length} churn risks`,
          detail: 'Every at-risk employee needs a documented career path within 30 days. Lack of clarity is the #1 reason high-tenure employees leave.',
          impact: 'high',
          timeframe: 'Week 1–2',
          navTarget: { view: 'pipeline', label: 'View promotion pipeline' },
        },
        {
          type: 'retain',
          label: `Promote ${nearReady.length} near-ready employees in current cycle`,
          detail: `Delaying promotions for employees who've met criteria erodes trust and accelerates churn of your best performers.`,
          impact: 'high',
          timeframe: 'Week 2–4',
          navTarget: { view: 'pipeline', label: 'View promotion pipeline' },
        },
      ],
    },
    {
      title: 'Days 31–60: Build the Pipeline',
      context: `${progressing.length} employees are progressing but need targeted support to reach readiness.`,
      urgency: 'high',
      actions: [
        {
          type: 'upskill',
          label: topGap ? `Launch ${topGap.skill} skill sprint for ${topGap.belowTarget} impacted employees` : 'Launch cross-org skill development sprints',
          detail: 'Focus on the highest-impact skill gap first. Run 4-week sprints with measurable milestones and manager accountability.',
          impact: 'high',
          timeframe: 'Days 30–60',
          navTarget: { view: 'gap-report', label: 'Open skills gap report' },
        },
        {
          type: 'monitor',
          label: 'Set up monthly readiness tracking and manager reviews',
          detail: 'Workforce planning only works with feedback loops. Track readiness % monthly; review pipeline in every management meeting.',
          impact: 'medium',
          timeframe: 'Day 30, then monthly',
          navTarget: { view: 'heatmap', label: 'View skills heatmap' },
        },
      ],
    },
    {
      title: 'Days 61–90: Fill the Gaps',
      context: 'External hiring targets should be scoped to what internal mobility cannot fill.',
      urgency: 'medium',
      actions: [
        {
          type: 'hire',
          label: `Open targeted external roles for critical skill gaps`,
          detail: `Hire for skills that are structurally absent — not roles that internal promotions should fill. Prioritize ${topGap?.skill ?? 'senior individual contributors'} expertise.`,
          impact: 'medium',
          timeframe: 'Days 45–90',
          navTarget: { view: 'gap-report', label: 'Open skills gap report' },
        },
        {
          type: 'restructure',
          label: 'Review team structures to remove bottlenecks',
          detail: 'With new hires and promotions in place, reassess team compositions for optimal span of control and growth opportunity.',
          impact: 'medium',
          timeframe: 'Day 90',
          navTarget: { view: 'managers', label: 'View manager effectiveness' },
        },
      ],
    },
  ];

  return {
    text: `90-day workforce action plan based on your current pipeline, gaps, and churn signals:`,
    results: [
      { kind: 'recommendation', items: recs },
      ...(churnRisks.length > 0 ? [{
        kind: 'labeled-people' as const,
        label: `${churnRisks.length} churn risk${churnRisks.length === 1 ? '' : 's'} referenced in this plan`,
        subLabel: '18+ months in role, below 70% readiness — need career clarity sessions',
        isChurn: true,
        items: churnRisks.slice(0, 8).map(toPersonResult),
      }] : []),
      ...(nearReady.length > 0 ? [{
        kind: 'labeled-people' as const,
        label: `${nearReady.length} promotion-ready employee${nearReady.length === 1 ? '' : 's'} referenced in this plan`,
        subLabel: '90%+ readiness criteria met — promote in current cycle',
        isChurn: false,
        items: nearReady.slice(0, 8).map(toPersonResult),
      }] : []),
    ],
  };
}

function handleBenchmarkStrategy(query: string): { text: string; results: QueryResult[] } {
  const dept = detectDept(query);

  // Find where we're furthest below peers
  const belowPeerDepts = (dept ? [dept] : DEPARTMENTS as Department[]).map(d => {
    const acme = ACME_SKILL_COMPETENCY[d] ?? 3.0;
    const peerAvg = PEER_COMPANIES.reduce((s, p) => s + (p.deptSkillCompetency[d] ?? 3.0), 0) / PEER_COMPANIES.length;
    return { dept: d, acme, peerAvg, delta: peerAvg - acme };
  }).filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta);

  const worst = belowPeerDepts[0];

  if (!worst) {
    return {
      text: `Your team is at or above industry benchmarks across all departments. Focus on maintaining this edge through promotion velocity and retention.`,
      results: [],
    };
  }

  const rec: RecommendationResult = {
    title: `Close the ${worst.dept} Benchmark Gap`,
    context: `Your ${worst.dept} team scores ${worst.acme.toFixed(1)}/5 vs peer average of ${worst.peerAvg.toFixed(1)}/5 — a ${worst.delta.toFixed(1)}-point gap. At current trajectory, this widens as peers invest faster.`,
    urgency: worst.delta >= 0.5 ? 'high' : 'medium',
    actions: [
      {
        type: 'hire',
        label: `Hire ${worst.dept} talent with above-average competency profiles`,
        detail: `Source candidates at 3.5+ competency in their specialty. Even 2–3 strong hires shift the team average measurably.`,
        impact: 'high',
        timeframe: '6–12 weeks',
      },
      {
        type: 'upskill',
        label: `Structured learning investment for ${worst.dept}`,
        detail: `Peers investing in L&D outperform by 0.3–0.5 points over 12 months. Allocate dedicated learning time (10–15% weekly) for ${worst.dept}.`,
        impact: 'medium',
        timeframe: '1–6 months',
      },
      {
        type: 'monitor',
        label: 'Benchmark review every quarter',
        detail: 'Industry competency shifts. Re-run benchmark analysis each quarter to track relative progress and reprioritize.',
        impact: 'low',
        timeframe: 'Quarterly',
      },
    ],
  };

  return {
    text: `Industry benchmark strategy — here's where to focus to close the gap with peers:`,
    results: [{ kind: 'recommendation', items: [rec] }],
  };
}

function handleHeadcountReductionClarify(): { text: string; results: QueryResult[] } {
  const data: ClarificationResult = {
    composeKey: 'headcount-reduction',
    intro: "Before I run the analysis I need to ask a few questions. Headcount reduction is one of the most consequential decisions an organisation makes — getting the inputs right means the output is actually useful rather than generic.",
    reasoning: "Here's my thinking: most reductions are driven by a specific cost savings target, but the headcount impact depends heavily on your salary mix and which departments you're willing to cut. I also need to understand the driver (budget vs. strategic) and timeline — a 20% cut in 30 days looks completely different from the same cut over 6 months. Getting these three inputs right is the difference between a useful plan and a generic one.",
    questions: [
      {
        question: "Do you have a financial savings target to hit?",
        chips: ['<£1M / year', '£1M–£3M / year', '£3M–£5M / year', '>£5M / year', 'No target — working from headcount %'],
      },
      {
        question: "What headcount reduction are you targeting?",
        chips: ['~5%', '~10%', '~15%', '~20%', 'Not sure yet — explore options'],
      },
      {
        question: "What's the timeline?",
        chips: ['30 days', '60–90 days', '6 months', 'Planning ahead — no hard deadline'],
      },
    ],
  };

  return {
    text: "I can help you think through a headcount reduction plan carefully and responsibly. But before I run the analysis, I need a few details — the approach changes significantly depending on your answers.",
    results: [{ kind: 'clarification', data }],
  };
}

function handleHeadcountReduction(query: string): { text: string; results: QueryResult[] } {
  // Parse a percentage or absolute number from the query
  const pctMatch = query.match(/(\d+)\s*%/);
  const absMatch = query.match(/\b(cut|reduce|remove|lose|lay.?off|let go)\s+(\d+)\b/i);
  const rawPct = pctMatch ? parseInt(pctMatch[1], 10) : null;
  const rawAbs = absMatch ? parseInt(absMatch[2], 10) : null;

  // "explore options" chip selected — show analysis at a default 10% to illustrate impact
  const exploreMode = /explore options/i.test(query);

  // No specific target provided — ask qualifying questions first
  if (!rawPct && !rawAbs && !exploreMode) {
    return handleHeadcountReductionClarify();
  }

  // Parse savings target and driver from composed query (from clarification chips)
  const savingsMatch = query.match(/savings target:\s*([^,]+)/i);
  const timelineMatch = query.match(/timeline:\s*([^,]+)/i);
  const savingsTarget = savingsMatch ? savingsMatch[1].trim() : null;
  const timeline = timelineMatch ? timelineMatch[1].trim() : null;

  const reductionPct = rawPct ?? (rawAbs ? Math.round((rawAbs / ACME_TOTAL_HEADCOUNT) * 100) : 10);
  const reductionTarget = rawAbs ?? Math.round(ACME_TOTAL_HEADCOUNT * (reductionPct / 100));

  // Classify timeline urgency
  const timelineUrgency: 'immediate' | 'short' | 'medium' | 'long' =
    /30.day/i.test(timeline ?? '') ? 'immediate' :
    /60|90/i.test(timeline ?? '') ? 'short' :
    /6.month/i.test(timeline ?? '') ? 'medium' : 'long';

  const all = getAllReadiness();

  // Voluntary buffer: people who are high churn risk and might leave anyway
  const voluntaryLikely = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;
  const netForcedReduction = Math.max(0, reductionTarget - voluntaryLikely);

  // Per-department impact analysis
  const deptImpacts: DeptReductionImpact[] = (DEPARTMENTS as Department[]).map(dept => {
    const currentHeadcount = ACME_HEADCOUNT_BY_DEPT[dept] ?? 0;
    // Proportional reduction target for this dept
    const targetReduction = Math.round(currentHeadcount * (reductionPct / 100));

    const deptPeople = all.filter(r => r.person.department === dept);
    const nearReady = deptPeople.filter(r => getReadinessTier(r.readinessPct) === 'near-ready').length;
    const deptVoluntary = deptPeople.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;

    // Critical skills: skills where belowTarget is already high — losing anyone worsens this
    const criticalSkills = SKILLS_DATA
      .filter(s => s.department === dept && s.expectedLevel > s.averageActual && s.belowTarget >= 3)
      .sort((a, b) => b.belowTarget - a.belowTarget)
      .slice(0, 2)
      .map(s => s.skill);

    // Benchmark delta: how much further below peers a reduction would push us
    const acmeComp = ACME_SKILL_COMPETENCY[dept] ?? 3.0;
    const peerAvg = PEER_COMPANIES.reduce((s, p) => s + (p.deptSkillCompetency[dept] ?? 3.0), 0) / PEER_COMPANIES.length;
    const benchmarkDelta = parseFloat((peerAvg - acmeComp).toFixed(2));

    // Capability risk rating
    const remainingAfterCut = currentHeadcount - targetReduction;
    const coverageRatio = remainingAfterCut / currentHeadcount;
    const capabilityRisk: DeptReductionImpact['capabilityRisk'] =
      coverageRatio < 0.75 && criticalSkills.length >= 2 ? 'critical' :
      coverageRatio < 0.85 || (criticalSkills.length >= 1 && benchmarkDelta > 0.3) ? 'high' :
      coverageRatio < 0.92 ? 'medium' : 'low';

    return {
      department: dept,
      currentHeadcount,
      targetReduction,
      nearReadyLost: Math.min(nearReady, targetReduction),
      criticalSkillsAtRisk: criticalSkills,
      voluntaryLikely: deptVoluntary,
      capabilityRisk,
      benchmarkDelta,
    };
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.capabilityRisk] - order[b.capabilityRisk];
  });

  // Alternative savings before forcing redundancies — filtered by timeline viability
  const alternativeSavings = [
    // Natural attrition only works over time — not viable in 30 days
    voluntaryLikely > 0 && timelineUrgency !== 'immediate'
      ? `Natural attrition buffer: ${voluntaryLikely} high-churn-risk employees may leave voluntarily — this could absorb ${Math.round((voluntaryLikely / reductionTarget) * 100)}% of the target without forced redundancies${timelineUrgency === 'short' ? ' (partially viable in 60–90 days)' : ''}`
      : voluntaryLikely > 0 && timelineUrgency === 'immediate'
      ? `Natural attrition is not a viable lever at a 30-day timeline — ${voluntaryLikely} high-churn-risk employees may leave over time, but cannot be counted on to meet an immediate target`
      : null,
    // Hiring freeze is immediate-viable
    'Hiring freeze: pausing open roles and backfills is viable at any timeline and typically saves 8–15% of annual hiring costs',
    // Contractor reduction is fast — viable even at 30 days
    'Contractor and contingent workforce review: reducing non-permanent headcount is the fastest lever and avoids employment law risk — viable even on a 30-day timeline',
    // Voluntary separation takes time — not realistic in 30 days
    timelineUrgency !== 'immediate'
      ? 'Voluntary separation scheme: offering incentives to volunteers protects morale and reduces legal exposure — requires 4–8 weeks minimum to design and run'
      : 'Voluntary separation scheme: not viable at a 30-day timeline — designing, communicating, and closing a VSS takes a minimum of 4–8 weeks',
    // Hours/pay adjustments only make sense for smaller cuts and longer timelines
    reductionPct <= 8 && timelineUrgency !== 'immediate'
      ? 'Hours reduction or temporary pay adjustments: may achieve short-term cost targets without permanent headcount loss — requires employee consultation and takes 4+ weeks to implement'
      : null,
  ].filter(Boolean) as string[];

  // Legal and process flags — some are escalated for immediate timelines
  const legalFlags = [
    'Consult employment legal counsel before communicating any reduction plans — requirements vary by jurisdiction',
    timelineUrgency === 'immediate'
      ? `URGENT — 30-day timeline: if cutting ${reductionTarget} or more people, collective consultation obligations almost certainly apply and may be impossible to satisfy in 30 days (e.g., US WARN Act requires 60 days; UK TULRCA requires 30–45 days). Legal counsel must be engaged immediately.`
      : `If cutting ${reductionTarget} or more people, collective consultation obligations may apply (e.g., 45-day rule in the US, 30/45-day rule in the UK under TULRCA)`,
    'Document the business rationale and selection criteria thoroughly — selection must not correlate with protected characteristics',
    'This tool does not have data on protected characteristics — all individual selection decisions must go through your HR and legal review process',
    'Ensure all impacted employees receive correct notice periods, statutory redundancy pay, and right-to-appeal processes per local law',
  ];

  const processSteps = timelineUrgency === 'immediate' ? [
    'Step 1 — Engage legal counsel TODAY: a 30-day timeline may conflict with statutory consultation periods in your jurisdiction — confirm feasibility before proceeding',
    'Step 2 — Fast-path alternatives first: contractor/contingent workforce and hiring freeze can be actioned within days without employment law risk',
    'Step 3 — Define scope tightly: limit forced redundancies to roles that are genuinely surplus — a rushed, broad cut creates legal exposure and capability damage',
    'Step 4 — Capability impact assessment: use the dept analysis below — a fast cut cannot be undone, so prioritise protecting critical capabilities',
    'Step 5 — Selection criteria: must still be objective, documented, and role-based — timeline pressure does not reduce legal obligations',
    'Step 6 — Communication plan: all-at-once notification with clear written rationale reduces rumour risk in a compressed timeline',
    'Step 7 — Support: even in a compressed timeline, offer outplacement support and clear references — this affects the morale of those who remain',
  ] : [
    'Step 1 — Define scope: confirm the cost target, timeline, and whether it must be headcount or could be total cost',
    'Step 2 — Exhaust alternatives: hiring freeze, contractor reduction, voluntary departures (see alternatives above)',
    'Step 3 — Identify at-risk role types (not individuals): which roles are duplicated, under-utilised, or misaligned with future direction',
    'Step 4 — Capability impact assessment: use the dept analysis below to understand what capability you lose in each scenario',
    'Step 5 — Legal review: engage employment counsel and HR before any selection criteria are defined',
    'Step 6 — Selection criteria: objective, documented, role-based — never based on personal characteristics',
    'Step 7 — Consultation: follow statutory consultation obligations, allow employees to respond',
    'Step 8 — Redeployment first: before confirming any redundancy, actively search for suitable alternative roles',
    'Step 9 — Support: offer outplacement support, reference commitments, and a dignified exit process',
  ];

  const analysis: ReductionAnalysis = {
    totalHeadcount: ACME_TOTAL_HEADCOUNT,
    reductionTarget,
    reductionPct,
    voluntaryBuffer: voluntaryLikely,
    netForcedReduction,
    alternativeSavings,
    deptImpacts,
    legalFlags,
    processSteps,
  };

  return {
    text: (() => {
      const contextParts: string[] = [];
      if (savingsTarget && !/no target/i.test(savingsTarget)) contextParts.push(`savings target of ${savingsTarget}`);
      if (timeline) contextParts.push(`${timeline} timeline`);
      const context = contextParts.length ? ` — ${contextParts.join(', ')}` : '';
      if (exploreMode) {
        return `Here's what a 10% reduction would look like against your current workforce of ${ACME_TOTAL_HEADCOUNT}${context}. Use this as a baseline to understand the capability trade-offs before committing to a specific target.`;
      }
      if (timelineUrgency === 'immediate') {
        return `A ${reductionPct}% reduction means ${reductionTarget} roles from a workforce of ${ACME_TOTAL_HEADCOUNT}${context}. A 30-day timeline is extremely compressed — statutory consultation obligations in most jurisdictions alone can take 30–45 days. Review the legal flags carefully before proceeding.`;
      }
      return `A ${reductionPct}% reduction means ${reductionTarget} roles from a workforce of ${ACME_TOTAL_HEADCOUNT}${context}. Before any forced redundancies, here's a full picture of alternatives, capability impact, and the process you must follow:`;
    })(),
    results: [{ kind: 'reduction', analysis }],
  };
}

// ── Careerminds / partner qualification ──────────────────────────────

function handleCareermindsIntro(): { text: string; results: QueryResult[] } {
  const all = getAllReadiness();
  const churnCount = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;
  const skillGaps = SKILLS_DATA.filter(s => s.expectedLevel > s.averageActual).length;
  const nearReady = all.filter(r => getReadinessTier(r.readinessPct) === 'near-ready').length;

  // Tailor the intro based on what's actually pressing in their data
  const topSignal =
    churnCount >= 5 ? `you have ${churnCount} people at high churn risk` :
    skillGaps >= 10 ? `there are ${skillGaps} active skills gaps across the org` :
    nearReady >= 4 ? `${nearReady} people are promotion-ready but may be waiting` :
    'your workforce data surfaces some areas worth addressing';

  const data: ClarificationResult = {
    composeKey: 'careerminds',
    intro: `Good question — and timely. Based on your data, ${topSignal}. Careerminds and Keystone Partners offer services that map directly onto what we're seeing. I just want to make sure I point you to the right one.`,
    reasoning: 'Different situations call for different services. Outplacement is for transitions; talent development is for building skills; leadership coaching is for accelerating your pipeline. The right fit depends on what\'s most urgent for you right now.',
    questions: [
      {
        question: 'What\'s the most pressing challenge you\'re trying to solve?',
        chips: [
          'People leaving (or at risk of leaving)',
          'Skills gaps slowing us down',
          'Managers not developing their teams',
          'Promotion pipeline feels thin',
          'Planning a headcount reduction',
        ],
      },
      {
        question: 'How many people are affected?',
        chips: ['1–5 people', '6–20 people', '20–50 people', '50+ people'],
      },
      {
        question: 'What\'s your timeline?',
        chips: ['This needs to move now', 'Next 1–3 months', 'Planning for H2', 'Early exploration'],
      },
    ],
  };

  return {
    text: `Let me ask you a few quick questions so I can point you to the right support.`,
    results: [{ kind: 'clarification', data }],
  };
}

function handleCareermindsResult(query: string): { text: string; results: QueryResult[] } {
  const q = query.toLowerCase();

  // Parse what they answered from the composed prompt
  const isChurn = /leaving|at risk|churn|transition|headcount reduction/i.test(q);
  const isSkills = /skills gap|slowing/i.test(q);
  const isManagers = /manager|coaching/i.test(q);
  const isPipeline = /pipeline|promotion|thin/i.test(q);
  const isReduction = /headcount reduction/i.test(q);

  const isLarge = /50\+|20.50/i.test(q);
  const isUrgent = /now|urgent/i.test(q);

  let service: PartnerService;
  let provider: string;
  let headline: string;
  let body: string;
  let cta: string;
  let why: string;

  if (isReduction || (isChurn && isLarge)) {
    service = 'outplacement';
    provider = 'Careerminds';
    headline = 'Careerminds Outplacement — protect your employer brand through the transition';
    body = 'Careerminds places 95% of affected employees in new roles, typically in under 3 months. Their digital-first model means cost-effective coverage for every impacted employee, not just senior leaders.';
    cta = 'Talk to Careerminds about Outplacement';
    why = isReduction
      ? 'You\'re planning a headcount reduction. Outplacement support is the single biggest factor in maintaining trust with the employees who remain — and in managing legal and reputational risk.'
      : `With ${isLarge ? '20+ people' : 'multiple people'} at flight risk, having a transition programme in place protects you if they do leave, while also signalling to the whole team that you take career outcomes seriously.`;
  } else if (isSkills) {
    service = 'talent-development';
    provider = 'Careerminds';
    headline = 'Careerminds Talent Development — structured upskilling aligned to your competency framework';
    body = 'Careerminds builds role-specific learning tracks that map directly to the skill gaps in your data. Programmes are typically 8–12 weeks and designed for working professionals — no long classroom commitments.';
    cta = 'Explore Talent Development with Careerminds';
    why = 'Your data shows active skills gaps across the org. A structured programme with clear milestones closes gaps faster than ad-hoc learning — and creates a paper trail for performance conversations.';
  } else if (isManagers) {
    service = 'manager-coaching';
    provider = 'Keystone Partners';
    headline = 'Keystone Partners Manager Coaching — improve team velocity from the top down';
    body = 'Keystone\'s leadership programme pairs managers with experienced executive coaches. Sessions are fortnightly, focused on practical skills: running 1:1s, giving developmental feedback, unblocking team growth.';
    cta = 'Explore Manager Coaching with Keystone';
    why = 'Manager quality is the strongest single predictor of team readiness velocity. Investing here typically produces visible improvements in team promotion rates within one review cycle.';
  } else if (isPipeline) {
    service = 'leadership-dev';
    provider = 'Keystone Partners';
    headline = 'Keystone Partners Leadership Development — accelerate your near-ready candidates';
    body = 'Keystone provides 1:1 executive coaching programmes tailored to each candidate\'s specific readiness gaps. Rather than generic training, every session targets the exact criteria they\'re not yet meeting.';
    cta = 'Explore Leadership Development with Keystone';
    why = 'You have near-ready employees who are close to promotion. Targeted coaching at this stage is 3–5x more effective than a learning course — and far cheaper than losing them to a competitor who will develop them.';
  } else if (isChurn) {
    service = 'outplacement';
    provider = 'Careerminds';
    headline = 'Careerminds Career Transition — turn a risk into a positive outcome';
    body = 'When employees are disengaged and unlikely to recover, having a clear, supportive off-ramp protects the relationship, your employer brand, and the morale of those who stay. Careerminds makes this cost-effective at any scale.';
    cta = 'Learn about Careerminds Career Transition';
    why = 'You have people at flight risk. Whether they leave voluntarily or through managed departure, having a transition programme in place is better than an unmanaged exit every time.';
  } else {
    service = 'talent-development';
    provider = 'Careerminds';
    headline = 'Careerminds Talent Development — a structured path for your team\'s growth';
    body = 'Careerminds builds role-specific learning tracks that close skills gaps and accelerate your promotion pipeline. Programmes are designed to deliver measurable readiness improvements within one review cycle.';
    cta = 'Explore Talent Development with Careerminds';
    why = 'Based on your data, a structured talent development programme would directly address the gaps we\'re seeing and accelerate your pipeline.';
  }

  const urgencyNote = isUrgent ? ' Given your timeline, it\'s worth having a conversation this week.' : '';

  return {
    text: `Based on what you\'ve told me, here\'s the service I\'d recommend.${urgencyNote}`,
    results: [
      {
        kind: 'partner-recommendation',
        data: { service, provider, headline, body, cta, why },
      },
    ],
  };
}

// ── Main query router ─────────────────────────────────────────────────

export function query(input: string): { text: string; results: QueryResult[]; needsAI?: boolean } {
  const q = input.toLowerCase().trim();
  const result = _queryInner(q, input);
  // Stamp the original question onto any commitment-prompt results
  if (result.results) {
    for (const r of result.results) {
      if (r.kind === 'commitment-prompt') r.data.sourceQuery = input;
    }
  }
  return result;
}

function _queryInner(q: string, _input: string): { text: string; results: QueryResult[]; needsAI?: boolean } {

  // ── Careerminds / partner qualification ──────────────────────────────

  // Entry point — "how can Careerminds help" or similar
  if (/careerminds|keystone|how can.{0,20}(support|help|assist)|partner support|what support|what services/i.test(q)) {
    return handleCareermindsIntro();
  }

  // Follow-up: qualification answers submitted via clarification chips
  if (/^careerminds support —/i.test(q)) {
    return handleCareermindsResult(q);
  }

  // ── Strategy / Planning intents (checked first — more specific) ──────

  // Headcount reduction / redundancy — must be first among strategy intents
  if (/\b(redund|lay.?off|layoff|downsize|cut headcount|reduce headcount|headcount reduction|headcount by|rif\b|reduction in force|let.*go|make.*redundant|cost.cutting|workforce reduction|reduce.*by.*%|cut.*%)\b/.test(q)) {
    return handleHeadcountReduction(q);
  }
  // "headcount reduction plan" composed follow-up or initial prompt
  if (/headcount.{0,10}reduction/i.test(q)) {
    return handleHeadcountReduction(q);
  }
  // Catch plain "reduce by X%" or "cut X%" patterns
  if (/\b(reduce|cut|trim|shrink)\b/.test(q) && /\d+\s*%/.test(q)) {
    return handleHeadcountReduction(q);
  }

  // 90-day / action plan
  if (/\b(90.day|action plan|roadmap|plan|playbook|priorities|prioritize)\b/.test(q) && /\b(workforce|org|team|plan|upskill|quarter)\b/.test(q)) {
    return handleActionPlan(q);
  }

  // Scenario / what if
  if (/\b(what if|scenario|lose|lost|leave|leaves|if we|imagine|suppose|project)\b/.test(q)) {
    return handleScenarioPlanning(q);
  }

  // Retention plan
  if (/\b(retention|retain|keep|keep them|flight risk|prevent|attrition)\b/.test(q) && /\b(plan|strategy|how|help|fix|address)\b/.test(q)) {
    return handleRetentionPlan(q);
  }

  // Upskill strategy
  if (/\b(upskill|close the gap|training|learning|l&d|develop|curriculum|program)\b/.test(q) && /\b(strategy|plan|how|recommend|should|fix)\b/.test(q)) {
    return handleUpskillStrategy(q);
  }

  // Hiring strategy
  if (/\b(hire|hiring|recruit|headcount|add|staffing|backfill|open role)\b/.test(q) && /\b(strategy|plan|should|how|recommend|need)\b/.test(q)) {
    return handleHiringStrategy(q);
  }

  // Team restructure
  if (/\b(restructure|restructuring|reorganize|reorg|team structure|reshuffle|reorganize|span of control)\b/.test(q)) {
    return handleTeamRestructure(q);
  }

  // Benchmark / industry comparison strategy
  if (/\b(benchmark|industry|peer|compare|market|competition|competitive)\b/.test(q) && /\b(strategy|plan|how|close|gap|improve)\b/.test(q)) {
    return handleBenchmarkStrategy(q);
  }

  // Recommend / strategy (generic)
  if (/\b(recommend|strategy|strategic|what should|what can|how do we|how should|fix|address|improve|action)\b/.test(q)) {
    const dept = detectDept(q);
    if (dept) return handleHiringStrategy(q);
    return handleActionPlan(q);
  }

  // ── Questions requiring external data → AI ───────────────────────────

  // Budget / cost / financial questions — we never have this data locally
  if (/\b(budget|cost|salary|compensation|pay|spend|expenditure|total comp|% of|percent of|afford|expensive|cheap|save|saving)\b/.test(q)) {
    return { text: '', results: [], needsAI: true };
  }

  // ── Role fit / hidden talent ─────────────────────────────────────────
  if (/\b(misplaced|wrong role|wrong department|wrong dept|better suited|hidden talent|hidden strength|role fit|career pivot|internal transfer|cross.dept|different function|different department|different role|misfit|underperform)\b/.test(q)) {
    return handleRoleFit(q);
  }

  // ── Diagnostic intents ───────────────────────────────────────────────

  // Stats / summary
  if (/\b(overview|summary|snapshot|stats|how many|how.s the|overall)\b/.test(q) && !/skill|gap/.test(q)) {
    return handleOrgStats();
  }

  // Ready for promotion
  if (/\b(ready|promote|promotion|near.ready|90)\b/.test(q) && !/who need|risk|churn/.test(q)) {
    return handlePromoReady(q);
  }

  // Progressing
  if (/\b(progress|on track|close|almost)\b/.test(q)) {
    return handleProgressing(q);
  }

  // Churn risk
  if (/\b(churn|risk|stuck|stall|overdue|flight|leaving|retention)\b/.test(q)) {
    return handleChurnRisk(q);
  }

  // Skills gaps
  if (/\b(skill|gap|missing|weak|strength|competency|competencies|capabilities)\b/.test(q)) {
    return handleSkillsGaps(q);
  }

  // Needs development
  if (/\b(need|develop|behind|low|early|struggling|far from)\b/.test(q)) {
    return handleNeedsWork(q);
  }

  // Everyone / show all / pipeline
  if (/\b(everyone|all|pipeline|show me|list|full|entire)\b/.test(q)) {
    const dept = detectDept(q);
    if (dept && /pipeline|summary|overview/.test(q)) {
      return handleDeptPipeline(q);
    }
    if (/pipeline|department|dept|summary|breakdown/.test(q)) {
      return handleDeptPipeline(q);
    }
    return handleEveryone(q);
  }

  // Department mentioned alone
  const dept = detectDept(q);
  if (dept) {
    return handleEveryone(q);
  }

  // Try person name search
  const personSearch = handlePersonSearch(q);
  if (personSearch) return personSearch;

  // Fallback — caller should route to AI edge function
  return { text: '', results: [], needsAI: true };
}

// ── Workforce context snapshot for AI ────────────────────────────────

export function buildWorkforceContext(): string {
  const all = getAllReadiness();
  const tiers = groupByTier(all);
  const churnRisk = all.filter(r => r.person.tenure >= 18 && r.readinessPct < 70);

  const deptSummaries = (DEPARTMENTS as Department[]).map(dept => {
    const people = all.filter(r => r.person.department === dept);
    const avg = people.length
      ? Math.round(people.reduce((s, r) => s + r.readinessPct, 0) / people.length)
      : 0;
    const nearReady = people.filter(r => getReadinessTier(r.readinessPct) === 'near-ready').length;
    const atRisk = people.filter(r => r.person.tenure >= 18 && r.readinessPct < 70).length;
    const hc = ACME_HEADCOUNT_BY_DEPT[dept] ?? 0;
    return `  ${dept}: ${hc} headcount, avg readiness ${avg}%, ${nearReady} near-ready for promotion, ${atRisk} churn risk`;
  });

  const topGaps = SKILLS_DATA
    .filter(s => s.expectedLevel > s.averageActual)
    .sort((a, b) => b.belowTarget - a.belowTarget)
    .slice(0, 5)
    .map(s => `  ${s.skill} (${s.department}): ${s.belowTarget} people below target, gap ${(s.expectedLevel - s.averageActual).toFixed(1)}`);

  const peerContext = PEER_COMPANIES.slice(0, 3).map(p => {
    const avgComp = Object.values(p.deptSkillCompetency).reduce((s, v) => s + v, 0) /
      Object.values(p.deptSkillCompetency).length;
    return `  ${p.name}: avg skill competency ${avgComp.toFixed(1)}/5`;
  });

  const acmeAvgComp = (Object.values(ACME_SKILL_COMPETENCY).reduce((s, v) => s + v, 0) /
    Object.values(ACME_SKILL_COMPETENCY).length).toFixed(1);

  return [
    `COMPANY: Acme Corp`,
    `TOTAL HEADCOUNT: ${ACME_TOTAL_HEADCOUNT}`,
    ``,
    `PROMOTION PIPELINE:`,
    `  Near-ready (90%+): ${tiers['near-ready']} people`,
    `  Progressing (70-89%): ${tiers['progressing']} people`,
    `  Developing (50-69%): ${tiers['developing']} people`,
    `  Early stage (<50%): ${tiers['early-stage']} people`,
    `  Churn risk (18m+ tenure, <70% readiness): ${churnRisk.length} people`,
    ``,
    `DEPARTMENT BREAKDOWN:`,
    ...deptSummaries,
    ``,
    `TOP SKILLS GAPS:`,
    ...topGaps,
    ``,
    `BENCHMARK (avg skill competency 1-5 scale):`,
    `  Acme Corp: ${acmeAvgComp}/5`,
    ...peerContext,
  ].join('\n');
}
