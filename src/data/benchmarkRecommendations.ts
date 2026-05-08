import {
  getDeptSkillBenchmarks,
  getDeptCompBenchmarks,
  getDeptSizeBenchmarks,
  getCategoryBenchmarks,
  getOrgBenchmarks,
  getTopDestinations,
  ATTRITION_RECORDS,
  ACME_FRAMEWORK_MATURITY,
  ACME_PROMOTION_VELOCITY,
  type PeerCompany,
  type DeptBenchmark,
} from './benchmarkData';

export type RecommendationPriority = 'critical' | 'high' | 'medium';
export type RecommendationCategory = 'upskilling' | 'retention' | 'compensation' | 'hiring' | 'org-design' | 'process';

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  title: string;
  rationale: string;        // one sentence: why this matters, grounded in the data
  actions: string[];        // 2–4 concrete steps
  timeframe: string;        // e.g. "30–60 days", "Q3"
  department?: string;      // if dept-specific
}

const CATEGORY_LABEL: Record<RecommendationCategory, string> = {
  upskilling:   'Upskilling',
  retention:    'Retention',
  compensation: 'Compensation',
  hiring:       'Hiring',
  'org-design': 'Org Design',
  process:      'Process',
};

export { CATEGORY_LABEL };

const PRIORITY_ORDER: Record<RecommendationPriority, number> = { critical: 0, high: 1, medium: 2 };

function fmtK(n: number) {
  return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
}

// ── Overview recommendations ────────────────────────────────────────────

export function getOverviewRecommendations(peers: PeerCompany[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const orgBenchmarks = getOrgBenchmarks(peers);
  const maturity = orgBenchmarks.find(b => b.label.toLowerCase().includes('framework'));
  const velocity = orgBenchmarks.find(b => b.label.toLowerCase().includes('promotion'));

  if (maturity && (maturity.position === 'bottom' || maturity.position === 'below-median')) {
    recs.push({
      id: 'overview-framework',
      priority: maturity.position === 'bottom' ? 'critical' : 'high',
      category: 'process',
      title: 'Mature your career framework',
      rationale: `Acme's framework maturity is ${ACME_FRAMEWORK_MATURITY}/5, below the peer median of ${maturity.peerMedian}/5 — a leading indicator of higher attrition and slower skill development.`,
      actions: [
        'Audit current level definitions for completeness and consistency across all departments',
        'Add measurable criteria for each level (output quality, scope, leadership expectations)',
        'Publish the framework internally and run manager calibration sessions',
        'Review and update the framework annually tied to the promotion cycle',
      ],
      timeframe: '60–90 days',
    });
  }

  if (velocity && velocity.position === 'bottom') {
    recs.push({
      id: 'overview-velocity',
      priority: 'high',
      category: 'retention',
      title: 'Accelerate promotion velocity',
      rationale: `Avg time to promotion is ${ACME_PROMOTION_VELOCITY} months vs. a peer median of ${velocity.peerMedian} months — slower progression is a top-cited factor in voluntary attrition.`,
      actions: [
        'Identify employees who have been at level for 18+ months and assess readiness',
        'Introduce a quarterly calibration process so promotions aren\'t gated to annual cycles',
        'Build visible "next level" criteria into 1:1 templates and manager scorecards',
        'Track promotion rates by department and level to surface bottlenecks',
      ],
      timeframe: 'Next review cycle',
    });
  }

  const catGaps = getCategoryBenchmarks(peers).slice(0, 3);
  catGaps.forEach((gap, i) => {
    if (gap.delta < -0.3) {
      recs.push({
        id: `overview-cat-gap-${i}`,
        priority: gap.position === 'bottom' ? 'high' : 'medium',
        category: 'upskilling',
        title: `Close the ${gap.category} skill gap`,
        rationale: `Acme scores ${gap.acmeValue.toFixed(1)}/5 in ${gap.category}, ${Math.abs(gap.delta).toFixed(1)} points below the peer median — this category gap cuts across departments.`,
        actions: [
          `Identify the top 10–15 employees with the largest ${gap.category} gap using the skill gap heatmap`,
          `Source or build a targeted ${gap.category} learning path (internal lunch-and-learns, vendor courses, or cohort programs)`,
          'Assign a learning sponsor per department to drive completion and track scores',
          'Re-assess competency ratings at the next review cycle (3–6 months)',
        ],
        timeframe: '60 days to launch, 6 months to close',
      });
    }
  });

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ── Skills recommendations ──────────────────────────────────────────────

export function getSkillsRecommendations(peers: PeerCompany[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const benchmarks = getDeptSkillBenchmarks(peers);
  const gapDepts = benchmarks.filter(b => b.position === 'bottom' || b.position === 'below-median');

  gapDepts.forEach(b => {
    const gap = Math.abs(b.delta).toFixed(1);
    const isCritical = b.position === 'bottom';
    recs.push({
      id: `skills-${b.department}`,
      priority: isCritical ? 'critical' : 'high',
      category: 'upskilling',
      department: b.department,
      title: `Upskill ${b.department} (${b.acmeValue.toFixed(1)} vs ${b.peerMedian.toFixed(1)} median)`,
      rationale: `${b.department} sits in the ${isCritical ? 'bottom quartile' : 'third quartile'} for skill competency, ${gap} points below the peer median — a direct risk to delivery quality and talent retention.`,
      actions: [
        `Run a skills audit within ${b.department} to identify the specific skill clusters dragging the average down`,
        'Create individual development plans (IDPs) for everyone more than 0.5 points below their target level',
        `Pair high performers as internal coaches for the bottom 20% of ${b.department} by skill rating`,
        'Consider bringing in an external trainer or partnering with an L&D platform for structured programs',
        'Set a 6-month target to move the dept average to peer median, tracked in quarterly reviews',
      ],
      timeframe: '30 days to plan, 6 months to target',
    });
  });

  const topDepts = benchmarks.filter(b => b.position === 'top');
  topDepts.forEach(b => {
    recs.push({
      id: `skills-leverage-${b.department}`,
      priority: 'medium',
      category: 'upskilling',
      department: b.department,
      title: `Leverage ${b.department} as an internal centre of excellence`,
      rationale: `${b.department} is in the top quartile for skill competency — a differentiator worth amplifying across the org.`,
      actions: [
        `Document what ${b.department} does well: hiring bar, onboarding, coaching culture`,
        'Run cross-functional workshops where top-performing ICs from this team teach peers',
        'Use this team\'s skill distribution as the benchmark template for other departments\' IDPs',
      ],
      timeframe: '60 days',
    });
  });

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ── Compensation recommendations ────────────────────────────────────────

export function getCompRecommendations(peers: PeerCompany[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const benchmarks = getDeptCompBenchmarks(peers);

  // Check attrition for compensation pressure
  const totalLeavers = ATTRITION_RECORDS.length;
  const compLeavers = ATTRITION_RECORDS.filter(r => r.reason === 'compensation').length;
  const compAttritionRate = totalLeavers > 0 ? Math.round((compLeavers / totalLeavers) * 100) : 0;

  const gapDepts = benchmarks.filter(b => b.position === 'bottom' || b.position === 'below-median');
  gapDepts.forEach(b => {
    const gapK = Math.abs(Math.round(b.delta / 1000));
    const isCritical = b.position === 'bottom';
    recs.push({
      id: `comp-${b.department}`,
      priority: isCritical ? 'critical' : 'high',
      category: 'compensation',
      department: b.department,
      title: `Address pay gap in ${b.department} (~${fmtK(gapK * 1000)} below market)`,
      rationale: `${b.department} avg comp of ${fmtK(b.acmeValue)} is ${fmtK(gapK * 1000)} below the peer median of ${fmtK(b.peerMedian)}${compAttritionRate > 25 ? ` — and ${compAttritionRate}% of recent leavers cited compensation as their exit reason` : ''}.`,
      actions: [
        `Conduct a compensation audit for ${b.department}: identify the bottom 20% of pay-vs-market employees`,
        `Build a remediation plan to bring the lowest-paid to at least peer median within the next ${isCritical ? '1–2' : '2–3'} compensation cycles`,
        'Introduce a total compensation statement so employees see the full value of equity + benefits',
        'Set a compensation philosophy target (e.g. "pay at 50th–75th percentile for top performers") and review against it annually',
      ],
      timeframe: isCritical ? '1–2 comp cycles' : 'Next annual review',
    });
  });

  if (compAttritionRate > 30) {
    recs.push({
      id: 'comp-attrition-signal',
      priority: 'critical',
      category: 'retention',
      title: 'Address compensation-driven attrition urgently',
      rationale: `${compAttritionRate}% of the last 12 months' leavers cited compensation — this is above the typical 20–25% benchmark and suggests systemic underpay rather than isolated cases.`,
      actions: [
        'Run an emergency spot-check of comp for employees at flight-risk levels (IC3–IC4) in high-attrition departments',
        'Introduce off-cycle compensation adjustments for documented below-market cases — don\'t wait for the annual cycle',
        'Brief the board or exec team: the cost of replacing each leaver (1–1.5× salary) likely exceeds the cost of the pay increases needed',
        'Implement a stay-interview program to surface compensation concerns before employees reach the resignation stage',
      ],
      timeframe: '30 days',
    });
  }

  const aboveDepts = benchmarks.filter(b => b.position === 'top' || b.position === 'above-median');
  if (aboveDepts.length > 0) {
    recs.push({
      id: 'comp-leverage-above',
      priority: 'medium',
      category: 'hiring',
      title: 'Use above-market comp as a recruiting advantage',
      rationale: `${aboveDepts.map(b => b.department).join(', ')} pay above the peer median — a differentiator that should be visible in JDs and recruiting conversations.`,
      actions: [
        'Add salary ranges to all job postings for these departments (increasingly expected by candidates)',
        'Train recruiters to proactively discuss total comp early in the interview process',
        'Highlight compensation benchmarking in your employer brand materials',
      ],
      timeframe: '30 days',
    });
  }

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ── Team composition recommendations ───────────────────────────────────

export function getCompositionRecommendations(peers: PeerCompany[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const benchmarks = getDeptSizeBenchmarks(peers);

  const understaffed = benchmarks.filter(b => b.delta < -3 && (b.position === 'bottom' || b.position === 'below-median'));
  const overstaffed  = benchmarks.filter(b => b.delta > 3  && (b.position === 'top' || b.position === 'above-median'));

  understaffed.forEach(b => {
    recs.push({
      id: `composition-under-${b.department}`,
      priority: b.position === 'bottom' ? 'high' : 'medium',
      category: 'hiring',
      department: b.department,
      title: `${b.department} appears understaffed vs. peers (${b.acmeValue.toFixed(1)}% vs ${b.peerMedian.toFixed(1)}% median)`,
      rationale: `${b.department} makes up ${b.acmeValue.toFixed(1)}% of Acme's headcount versus a peer median of ${b.peerMedian.toFixed(1)}% — suggesting the team may be stretched relative to company scale.`,
      actions: [
        `Audit current ${b.department} capacity: are there recurring backlogs, burnout signals, or missed OKRs that signal understaffing?`,
        'Model the headcount needed to reach peer median ratio given Acme\'s current total headcount',
        `Include ${b.department} headcount growth in the next headcount planning cycle with supporting data`,
        'Consider whether contract/fractional roles can bridge capacity gaps in the short term',
      ],
      timeframe: 'Next headcount planning cycle',
    });
  });

  overstaffed.forEach(b => {
    recs.push({
      id: `composition-over-${b.department}`,
      priority: 'medium',
      category: 'org-design',
      department: b.department,
      title: `Review ${b.department} team size relative to peers (${b.acmeValue.toFixed(1)}% vs ${b.peerMedian.toFixed(1)}% median)`,
      rationale: `${b.department} is proportionally larger than the peer median, which may indicate over-investment or an opportunity to raise the output bar per person.`,
      actions: [
        `Benchmark ${b.department} output metrics (not just headcount): revenue per head, tickets resolved, campaigns launched, etc.`,
        'Assess whether the proportionally larger team reflects a strategic bet (e.g. product-led growth requiring a larger Product org) or structural bloat',
        'If bloat is confirmed, consider redeployment to understaffed departments before external hiring',
      ],
      timeframe: 'Next planning cycle',
    });
  });

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

// ── Talent flow recommendations ─────────────────────────────────────────

export function getTalentFlowRecommendations(): Recommendation[] {
  const recs: Recommendation[] = [];
  const total = ATTRITION_RECORDS.length;
  if (total === 0) return recs;

  const topDests = getTopDestinations(ATTRITION_RECORDS);
  const competitorCount = ATTRITION_RECORDS.filter(r => r.destinationType === 'Competitor').length;
  const bigTechCount    = ATTRITION_RECORDS.filter(r => r.destinationType === 'Big Tech').length;
  const startupCount    = ATTRITION_RECORDS.filter(r => r.destinationType === 'Startup').length;

  const competitorPct = Math.round((competitorCount / total) * 100);
  const bigTechPct    = Math.round((bigTechCount    / total) * 100);
  const startupPct    = Math.round((startupCount    / total) * 100);

  if (competitorPct >= 20) {
    recs.push({
      id: 'talent-flow-competitor',
      priority: 'critical',
      category: 'retention',
      title: 'Stem competitor-bound attrition',
      rationale: `${competitorPct}% of leavers are joining direct competitors — your talent is walking out the door and into the arms of companies competing for the same customers.`,
      actions: [
        'Run win/loss interviews with recent leavers who joined competitors: what was the deciding factor?',
        `Focus retention efforts on the departments most affected: ${topDests.filter(d => d.type === 'Competitor').flatMap(d => d.departments).slice(0, 3).join(', ') || 'high-attrition departments'}`,
        'Review whether non-compete agreements are appropriately scoped (where legally permitted)',
        'Build a competitive intelligence loop: track what your competitor destinations are paying and positioning in job ads',
        'Implement a "flight risk" flagging process in 1:1s for IC3+ employees in competitor-target roles',
      ],
      timeframe: '30–60 days',
    });
  }

  if (bigTechPct >= 20) {
    recs.push({
      id: 'talent-flow-bigtech',
      priority: 'high',
      category: 'retention',
      title: `Counter Big Tech pull (${bigTechPct}% of leavers)`,
      rationale: `${bigTechPct}% of leavers are moving to Big Tech companies — typically driven by compensation, brand prestige, and career trajectory rather than day-to-day dissatisfaction.`,
      actions: [
        'Strengthen equity/RSU competitiveness: Big Tech\'s total comp advantage is often equity-driven, not cash',
        'Emphasise what Acme offers that Big Tech can\'t: ownership, impact, speed of career growth, and mission',
        'Introduce a "counter-offer" protocol: for high performers, equip managers with pre-approved retention packages before exit conversations start',
        'Build a senior IC career track that doesn\'t require moving into management — Big Tech is often chosen for the Principal/Staff/Distinguished Engineer path',
      ],
      timeframe: 'Next comp review cycle',
    });
  }

  if (startupPct >= 20) {
    recs.push({
      id: 'talent-flow-startup',
      priority: 'high',
      category: 'retention',
      title: `Compete with startup appeal (${startupPct}% of leavers)`,
      rationale: `${startupPct}% of leavers are joining startups — typically seeking equity upside, ownership, and faster career progression than a larger company can offer.`,
      actions: [
        'Audit internal mobility: are high-ambition employees getting stretch assignments and cross-functional opportunities, or are they stagnating?',
        'Review equity refresh grants: are they competitive with seed/Series A startup option packages for key roles?',
        'Create "intrapreneurship" opportunities: internal hackathons, innovation pods, or 20%-time projects for entrepreneurially minded talent',
        'Accelerate promotion velocity for top performers so they don\'t feel they need to leave to level up',
      ],
      timeframe: '60–90 days',
    });
  }

  // Tenure-based insight
  const avgTenure = Math.round(ATTRITION_RECORDS.reduce((s, r) => s + r.tenureMonths, 0) / total);
  if (avgTenure < 18) {
    recs.push({
      id: 'talent-flow-tenure',
      priority: 'high',
      category: 'retention',
      title: 'Fix early-tenure attrition',
      rationale: `The average tenure at exit is ${avgTenure} months — people are leaving before they're fully ramped, meaning you're losing the investment in hiring and onboarding.`,
      actions: [
        'Review the first-90-days onboarding experience: are new hires clear on their role, team, and success criteria?',
        'Implement a structured 30/60/90 day check-in process with People Ops, separate from manager 1:1s',
        'Analyse attrition by department to find where early exits cluster — prioritise those managers for coaching',
        'Consider implementing a "new hire buddy" program pairing joiners with a senior peer for their first 6 months',
      ],
      timeframe: '30–60 days',
    });
  }

  return recs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
