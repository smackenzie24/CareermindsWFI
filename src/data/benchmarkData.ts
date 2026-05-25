import { SKILLS_DATA, type Department } from './mockData';

// ── Acme Corp (our company) ─────────────────────────────────────────────

// Total headcount derived from SKILLS_DATA headcounts per department
function deriveAcmeHeadcount(): Record<Department, number> {
  const seen = new Set<string>(); // dept+team+level to avoid double-counting
  const counts: Record<string, number> = {};
  for (const entry of SKILLS_DATA) {
    const key = `${entry.department}|${entry.team}|${entry.location}`;
    if (!seen.has(key)) {
      seen.add(key);
      counts[entry.department] = (counts[entry.department] ?? 0) + entry.headcount;
    }
  }
  return counts as Record<Department, number>;
}

export const ACME_HEADCOUNT_BY_DEPT: Record<Department, number> = {
  Engineering: 59,
  Product: 23,
  Design: 16,
  Data: 29,
  Marketing: 22,
  Sales: 28,
  'People Ops': 15,
};

export const ACME_TOTAL_HEADCOUNT = Object.values(ACME_HEADCOUNT_BY_DEPT).reduce((s, n) => s + n, 0);

// Avg comp by department (annual, USD)
export const ACME_COMP: Record<Department, number> = {
  Engineering: 128000,
  Product: 118000,
  Design: 102000,
  Data: 122000,
  Marketing: 88000,
  Sales: 95000,
  'People Ops': 90000,
};

// Avg skill competency by department: weighted mean of averageActual across all entries
function computeAcmeSkillCompetency(): Record<Department, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const entry of SKILLS_DATA) {
    sums[entry.department] = (sums[entry.department] ?? 0) + entry.averageActual * entry.headcount;
    counts[entry.department] = (counts[entry.department] ?? 0) + entry.headcount;
  }
  const result: Record<string, number> = {};
  for (const dept of Object.keys(sums)) {
    result[dept] = parseFloat((sums[dept] / counts[dept]).toFixed(2));
  }
  return result as Record<Department, number>;
}

export const ACME_SKILL_COMPETENCY: Record<Department, number> = computeAcmeSkillCompetency();

// Avg competency by skill category across Acme
function computeAcmeCategoryCompetency(): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const entry of SKILLS_DATA) {
    sums[entry.category] = (sums[entry.category] ?? 0) + entry.averageActual * entry.headcount;
    counts[entry.category] = (counts[entry.category] ?? 0) + entry.headcount;
  }
  const result: Record<string, number> = {};
  for (const cat of Object.keys(sums)) {
    result[cat] = parseFloat((sums[cat] / counts[cat]).toFixed(2));
  }
  return result;
}

export const ACME_CATEGORY_COMPETENCY = computeAcmeCategoryCompetency();

// ── Peer companies dataset ──────────────────────────────────────────────

export type CompanySize = 'Startup' | 'Scaleup' | 'Enterprise';
export type Industry = 'B2B SaaS' | 'Fintech' | 'E-commerce' | 'Marketplace' | 'DevTools';

export interface PeerCompany {
  id: string;
  name: string;
  size: CompanySize;
  industry: Industry;
  totalHeadcount: number;
  deptHeadcountPct: Record<Department, number>; // % of total
  deptComp: Record<Department, number>; // avg annual comp USD
  deptSkillCompetency: Record<Department, number>; // avg 1–5
  categoryCompetency: Record<string, number>; // avg 1–5 per skill category
  frameworkMaturity: number; // 1–5 (how mature are their career frameworks)
  promotionVelocity: number; // avg months to next level org-wide
  topSkillGaps: Department[]; // departments with biggest gaps
}

const DEPT_KEYS: Department[] = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'];

function pct(n: Record<Department, number>): Record<Department, number> { return n; }
function comp(n: Record<Department, number>): Record<Department, number> { return n; }
function skill(n: Record<Department, number>): Record<Department, number> { return n; }

export const PEER_COMPANIES: PeerCompany[] = [
  {
    id: 'peer-1',
    name: 'Verity HQ',
    size: 'Scaleup',
    industry: 'B2B SaaS',
    totalHeadcount: 210,
    deptHeadcountPct: pct({ Engineering: 38, Product: 12, Design: 7, Data: 10, Marketing: 14, Sales: 14, 'People Ops': 5 }),
    deptComp: comp({ Engineering: 138000, Product: 124000, Design: 108000, Data: 131000, Marketing: 92000, Sales: 98000, 'People Ops': 87000 }),
    deptSkillCompetency: skill({ Engineering: 3.4, Product: 3.1, Design: 3.2, Data: 3.0, Marketing: 3.3, Sales: 3.2, 'People Ops': 3.0 }),
    categoryCompetency: { Architecture: 3.5, Quality: 3.4, Operations: 3.2, Security: 2.9, Leadership: 3.1, Collaboration: 3.6, Influence: 3.2, Strategy: 3.3, Analytical: 3.4, Discovery: 3.1, Delivery: 3.2, Craft: 3.3, Research: 3.4, MLOps: 2.8, Technical: 3.5, Communication: 3.3, Closing: 3.1, Retention: 3.2, 'Total Rewards': 3.0, Culture: 3.1, Digital: 3.3, Analytics: 3.2, Talent: 3.3, HR: 3.1 },
    frameworkMaturity: 4.1,
    promotionVelocity: 20,
    topSkillGaps: ['Security', 'Data'] as unknown as Department[],
  },
  {
    id: 'peer-2',
    name: 'Cortex Labs',
    size: 'Scaleup',
    industry: 'DevTools',
    totalHeadcount: 180,
    deptHeadcountPct: pct({ Engineering: 44, Product: 11, Design: 6, Data: 12, Marketing: 11, Sales: 12, 'People Ops': 4 }),
    deptComp: comp({ Engineering: 144000, Product: 128000, Design: 112000, Data: 137000, Marketing: 89000, Sales: 102000, 'People Ops': 86000 }),
    deptSkillCompetency: skill({ Engineering: 3.7, Product: 3.4, Design: 3.0, Data: 3.6, Marketing: 2.9, Sales: 3.0, 'People Ops': 2.9 }),
    categoryCompetency: { Architecture: 3.8, Quality: 3.6, Operations: 3.5, Security: 3.4, Leadership: 3.2, Collaboration: 3.5, Influence: 3.1, Strategy: 3.2, Analytical: 3.7, Discovery: 3.0, Delivery: 3.1, Craft: 3.1, Research: 3.2, MLOps: 3.4, Technical: 3.8, Communication: 3.2, Closing: 2.9, Retention: 3.0, 'Total Rewards': 2.8, Culture: 2.9, Digital: 3.0, Analytics: 3.5, Talent: 3.0, HR: 2.9 },
    frameworkMaturity: 4.4,
    promotionVelocity: 18,
    topSkillGaps: ['Marketing', 'People Ops'] as unknown as Department[],
  },
  {
    id: 'peer-3',
    name: 'Solara Finance',
    size: 'Enterprise',
    industry: 'Fintech',
    totalHeadcount: 520,
    deptHeadcountPct: pct({ Engineering: 30, Product: 10, Design: 5, Data: 15, Marketing: 12, Sales: 22, 'People Ops': 6 }),
    deptComp: comp({ Engineering: 142000, Product: 132000, Design: 114000, Data: 143000, Marketing: 95000, Sales: 108000, 'People Ops': 96000 }),
    deptSkillCompetency: skill({ Engineering: 3.2, Product: 3.3, Design: 3.1, Data: 3.5, Marketing: 3.0, Sales: 3.6, 'People Ops': 3.3 }),
    categoryCompetency: { Architecture: 3.3, Quality: 3.2, Operations: 3.4, Security: 3.8, Leadership: 3.4, Collaboration: 3.5, Influence: 3.4, Strategy: 3.5, Analytical: 3.6, Discovery: 3.2, Delivery: 3.3, Craft: 3.0, Research: 3.1, MLOps: 3.3, Technical: 3.6, Communication: 3.4, Closing: 3.5, Retention: 3.6, 'Total Rewards': 3.4, Culture: 3.3, Digital: 3.2, Analytics: 3.5, Talent: 3.4, HR: 3.4 },
    frameworkMaturity: 3.8,
    promotionVelocity: 26,
    topSkillGaps: ['Design', 'Marketing'] as unknown as Department[],
  },
  {
    id: 'peer-4',
    name: 'Meadow Platform',
    size: 'Scaleup',
    industry: 'Marketplace',
    totalHeadcount: 165,
    deptHeadcountPct: pct({ Engineering: 32, Product: 14, Design: 10, Data: 9, Marketing: 17, Sales: 13, 'People Ops': 5 }),
    deptComp: comp({ Engineering: 122000, Product: 112000, Design: 98000, Data: 118000, Marketing: 86000, Sales: 91000, 'People Ops': 84000 }),
    deptSkillCompetency: skill({ Engineering: 3.0, Product: 3.2, Design: 3.5, Data: 2.9, Marketing: 3.4, Sales: 3.1, 'People Ops': 3.2 }),
    categoryCompetency: { Architecture: 3.0, Quality: 3.1, Operations: 3.0, Security: 2.7, Leadership: 3.0, Collaboration: 3.5, Influence: 3.3, Strategy: 3.3, Analytical: 3.1, Discovery: 3.5, Delivery: 3.2, Craft: 3.6, Research: 3.5, MLOps: 2.7, Technical: 3.1, Communication: 3.4, Closing: 3.0, Retention: 3.2, 'Total Rewards': 3.1, Culture: 3.3, Digital: 3.5, Analytics: 3.1, Talent: 3.2, HR: 3.1 },
    frameworkMaturity: 3.5,
    promotionVelocity: 22,
    topSkillGaps: ['Data', 'Engineering'] as unknown as Department[],
  },
  {
    id: 'peer-5',
    name: 'Hatch Commerce',
    size: 'Startup',
    industry: 'E-commerce',
    totalHeadcount: 82,
    deptHeadcountPct: pct({ Engineering: 28, Product: 12, Design: 8, Data: 7, Marketing: 20, Sales: 18, 'People Ops': 7 }),
    deptComp: comp({ Engineering: 115000, Product: 108000, Design: 94000, Data: 110000, Marketing: 82000, Sales: 86000, 'People Ops': 79000 }),
    deptSkillCompetency: skill({ Engineering: 2.7, Product: 2.8, Design: 3.1, Data: 2.6, Marketing: 3.3, Sales: 2.9, 'People Ops': 2.8 }),
    categoryCompetency: { Architecture: 2.8, Quality: 2.9, Operations: 2.8, Security: 2.4, Leadership: 2.7, Collaboration: 3.2, Influence: 3.0, Strategy: 2.9, Analytical: 2.8, Discovery: 3.1, Delivery: 2.9, Craft: 3.0, Research: 3.0, MLOps: 2.4, Technical: 2.9, Communication: 3.1, Closing: 2.9, Retention: 2.8, 'Total Rewards': 2.7, Culture: 3.0, Digital: 3.2, Analytics: 2.8, Talent: 2.9, HR: 2.7 },
    frameworkMaturity: 2.8,
    promotionVelocity: 30,
    topSkillGaps: ['Security', 'Data'] as unknown as Department[],
  },
  {
    id: 'peer-6',
    name: 'Orbis Cloud',
    size: 'Enterprise',
    industry: 'B2B SaaS',
    totalHeadcount: 840,
    deptHeadcountPct: pct({ Engineering: 35, Product: 9, Design: 6, Data: 13, Marketing: 13, Sales: 20, 'People Ops': 4 }),
    deptComp: comp({ Engineering: 151000, Product: 138000, Design: 118000, Data: 148000, Marketing: 99000, Sales: 112000, 'People Ops': 101000 }),
    deptSkillCompetency: skill({ Engineering: 3.8, Product: 3.5, Design: 3.3, Data: 3.7, Marketing: 3.2, Sales: 3.8, 'People Ops': 3.5 }),
    categoryCompetency: { Architecture: 3.9, Quality: 3.8, Operations: 3.7, Security: 3.6, Leadership: 3.5, Collaboration: 3.7, Influence: 3.5, Strategy: 3.6, Analytical: 3.8, Discovery: 3.4, Delivery: 3.5, Craft: 3.4, Research: 3.5, MLOps: 3.5, Technical: 3.9, Communication: 3.7, Closing: 3.7, Retention: 3.8, 'Total Rewards': 3.6, Culture: 3.5, Digital: 3.6, Analytics: 3.8, Talent: 3.6, HR: 3.6 },
    frameworkMaturity: 4.7,
    promotionVelocity: 16,
    topSkillGaps: ['Design', 'Marketing'] as unknown as Department[],
  },
  {
    id: 'peer-7',
    name: 'Ripple Analytics',
    size: 'Scaleup',
    industry: 'B2B SaaS',
    totalHeadcount: 195,
    deptHeadcountPct: pct({ Engineering: 33, Product: 13, Design: 7, Data: 17, Marketing: 13, Sales: 13, 'People Ops': 4 }),
    deptComp: comp({ Engineering: 132000, Product: 120000, Design: 104000, Data: 128000, Marketing: 90000, Sales: 96000, 'People Ops': 88000 }),
    deptSkillCompetency: skill({ Engineering: 3.3, Product: 3.2, Design: 3.1, Data: 3.5, Marketing: 3.1, Sales: 3.0, 'People Ops': 3.1 }),
    categoryCompetency: { Architecture: 3.4, Quality: 3.3, Operations: 3.3, Security: 3.0, Leadership: 3.2, Collaboration: 3.4, Influence: 3.2, Strategy: 3.3, Analytical: 3.6, Discovery: 3.2, Delivery: 3.3, Craft: 3.1, Research: 3.3, MLOps: 3.3, Technical: 3.6, Communication: 3.3, Closing: 3.0, Retention: 3.1, 'Total Rewards': 3.1, Culture: 3.2, Digital: 3.2, Analytics: 3.5, Talent: 3.2, HR: 3.1 },
    frameworkMaturity: 3.9,
    promotionVelocity: 21,
    topSkillGaps: ['Sales', 'People Ops'] as unknown as Department[],
  },
  {
    id: 'peer-8',
    name: 'Axiom Market',
    size: 'Startup',
    industry: 'Marketplace',
    totalHeadcount: 68,
    deptHeadcountPct: pct({ Engineering: 29, Product: 15, Design: 9, Data: 8, Marketing: 18, Sales: 16, 'People Ops': 5 }),
    deptComp: comp({ Engineering: 112000, Product: 103000, Design: 91000, Data: 106000, Marketing: 79000, Sales: 83000, 'People Ops': 76000 }),
    deptSkillCompetency: skill({ Engineering: 2.6, Product: 2.9, Design: 3.2, Data: 2.7, Marketing: 3.2, Sales: 2.8, 'People Ops': 2.7 }),
    categoryCompetency: { Architecture: 2.7, Quality: 2.8, Operations: 2.7, Security: 2.3, Leadership: 2.6, Collaboration: 3.1, Influence: 3.0, Strategy: 2.8, Analytical: 2.8, Discovery: 3.2, Delivery: 2.8, Craft: 3.1, Research: 3.1, MLOps: 2.3, Technical: 2.8, Communication: 3.0, Closing: 2.8, Retention: 2.7, 'Total Rewards': 2.6, Culture: 2.9, Digital: 3.1, Analytics: 2.8, Talent: 2.8, HR: 2.6 },
    frameworkMaturity: 2.6,
    promotionVelocity: 32,
    topSkillGaps: ['Security', 'Data'] as unknown as Department[],
  },
];

// ── Acme comparable peers (similar-sized SaaS/tech scaleups) ───────────
export const SIMILAR_PEERS = PEER_COMPANIES.filter(
  p => p.size === 'Scaleup' || (p.size === 'Enterprise' && p.totalHeadcount < 300)
);

// ── Benchmark computation helpers ──────────────────────────────────────

export interface Quartile {
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
}

export function computeQuartiles(values: number[]): Quartile {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { p25: 0, p50: 0, p75: 0, min: 0, max: 0 };
  const idx = (p: number) => {
    const pos = (p / 100) * (n - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return {
    p25: parseFloat(idx(25).toFixed(2)),
    p50: parseFloat(idx(50).toFixed(2)),
    p75: parseFloat(idx(75).toFixed(2)),
    min: sorted[0],
    max: sorted[n - 1],
  };
}

export type QuartilePosition = 'top' | 'above-median' | 'below-median' | 'bottom';

export function getQuartilePosition(value: number, q: Quartile): QuartilePosition {
  if (value >= q.p75) return 'top';
  if (value >= q.p50) return 'above-median';
  if (value >= q.p25) return 'below-median';
  return 'bottom';
}

export const QUARTILE_CONFIG: Record<QuartilePosition, { label: string; short: string; rank: string; color: string; bg: string; border: string; dot: string }> = {
  top:           { label: 'Top quartile',    short: 'Top',    rank: '1st', color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'above-median':{ label: 'Above median',    short: 'Above',  rank: '2nd', color: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-200',     dot: 'bg-sky-500'     },
  'below-median':{ label: 'Below median',    short: 'Below',  rank: '3rd', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-400'   },
  bottom:        { label: 'Bottom quartile', short: 'Bottom', rank: '4th', color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     dot: 'bg-red-500'     },
};

// ── Acme dept headcount as % of total ──────────────────────────────────
export const ACME_DEPT_PCT: Record<Department, number> = Object.fromEntries(
  Object.entries(ACME_HEADCOUNT_BY_DEPT).map(([dept, n]) => [dept, parseFloat(((n / ACME_TOTAL_HEADCOUNT) * 100).toFixed(1))])
) as Record<Department, number>;

// ── Per-dimension benchmark outputs ────────────────────────────────────

export interface DeptBenchmark {
  department: Department;
  acmeValue: number;
  peerValues: number[];
  quartiles: Quartile;
  position: QuartilePosition;
  peerMedian: number;
  delta: number; // acme - median
}

/** Skill competency by dept compared to all peers */
export function getDeptSkillBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): DeptBenchmark[] {
  return (['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'] as Department[]).map(dept => {
    const peerValues = peers.map(p => p.deptSkillCompetency[dept]);
    const acmeValue = ACME_SKILL_COMPETENCY[dept];
    const quartiles = computeQuartiles(peerValues);
    const position = getQuartilePosition(acmeValue, quartiles);
    const peerMedian = quartiles.p50;
    return { department: dept, acmeValue, peerValues, quartiles, position, peerMedian, delta: parseFloat((acmeValue - peerMedian).toFixed(2)) };
  });
}

/** Compensation by dept compared to peers */
export function getDeptCompBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): DeptBenchmark[] {
  return (['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'] as Department[]).map(dept => {
    const peerValues = peers.map(p => p.deptComp[dept]);
    const acmeValue = ACME_COMP[dept];
    const quartiles = computeQuartiles(peerValues);
    const position = getQuartilePosition(acmeValue, quartiles);
    const peerMedian = quartiles.p50;
    return { department: dept, acmeValue, peerValues, quartiles, position, peerMedian, delta: acmeValue - peerMedian };
  });
}

/** Dept size as % of total headcount */
export function getDeptSizeBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): DeptBenchmark[] {
  return (['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'] as Department[]).map(dept => {
    const peerValues = peers.map(p => p.deptHeadcountPct[dept]);
    const acmeValue = ACME_DEPT_PCT[dept];
    const quartiles = computeQuartiles(peerValues);
    const position = getQuartilePosition(acmeValue, quartiles);
    const peerMedian = quartiles.p50;
    return { department: dept, acmeValue, peerValues, quartiles, position, peerMedian, delta: parseFloat((acmeValue - peerMedian).toFixed(1)) };
  });
}

/** Skill category competency vs peers */
export interface CategoryBenchmark {
  category: string;
  acmeValue: number;
  peerValues: number[];
  quartiles: Quartile;
  position: QuartilePosition;
  peerMedian: number;
  delta: number;
}

export function getCategoryBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): CategoryBenchmark[] {
  const categories = Array.from(new Set(PEER_COMPANIES.flatMap(p => Object.keys(p.categoryCompetency))));
  return categories.map(cat => {
    const peerValues = peers.map(p => p.categoryCompetency[cat] ?? 0).filter(v => v > 0);
    const acmeValue = ACME_CATEGORY_COMPETENCY[cat] ?? 0;
    const quartiles = computeQuartiles(peerValues);
    const position = getQuartilePosition(acmeValue, quartiles);
    return {
      category: cat,
      acmeValue,
      peerValues,
      quartiles,
      position,
      peerMedian: quartiles.p50,
      delta: parseFloat((acmeValue - quartiles.p50).toFixed(2)),
    };
  }).sort((a, b) => a.delta - b.delta); // worst gaps first
}

/** Framework maturity & promotion velocity */
export interface OrgBenchmark {
  label: string;
  acmeValue: number;
  peerValues: number[];
  quartiles: Quartile;
  position: QuartilePosition;
  peerMedian: number;
  delta: number;
  unit: string;
  higherIsBetter: boolean;
}

// Acme framework maturity: derived from avg pipeline readiness and skill data coverage
export const ACME_FRAMEWORK_MATURITY = 3.6; // based on breadth of framework coverage
export const ACME_PROMOTION_VELOCITY = 19; // avg months from pipeline tenure data

export function getOrgBenchmarks(peers: PeerCompany[] = PEER_COMPANIES): OrgBenchmark[] {
  const maturityValues = peers.map(p => p.frameworkMaturity);
  const velocityValues = peers.map(p => p.promotionVelocity);

  const mQ = computeQuartiles(maturityValues);
  const vQ = computeQuartiles(velocityValues);

  // For velocity, LOWER is better (faster progression)
  const invertedVelocity = (v: number, q: Quartile): QuartilePosition => {
    if (v <= q.p25) return 'top';
    if (v <= q.p50) return 'above-median';
    if (v <= q.p75) return 'below-median';
    return 'bottom';
  };

  return [
    {
      label: 'Framework maturity',
      acmeValue: ACME_FRAMEWORK_MATURITY,
      peerValues: maturityValues,
      quartiles: mQ,
      position: getQuartilePosition(ACME_FRAMEWORK_MATURITY, mQ),
      peerMedian: mQ.p50,
      delta: parseFloat((ACME_FRAMEWORK_MATURITY - mQ.p50).toFixed(2)),
      unit: '/ 5',
      higherIsBetter: true,
    },
    {
      label: 'Promotion velocity',
      acmeValue: ACME_PROMOTION_VELOCITY,
      peerValues: velocityValues,
      quartiles: vQ,
      position: invertedVelocity(ACME_PROMOTION_VELOCITY, vQ),
      peerMedian: vQ.p50,
      delta: parseFloat((ACME_PROMOTION_VELOCITY - vQ.p50).toFixed(1)),
      unit: 'months avg',
      higherIsBetter: false,
    },
  ];
}

/** Summary: overall quartile across all dimensions */
export function getOverallBenchmarkSummary(peers: PeerCompany[] = PEER_COMPANIES) {
  const skillBenchmarks = getDeptSkillBenchmarks(peers);
  const compBenchmarks = getDeptCompBenchmarks(peers);
  const sizeBenchmarks = getDeptSizeBenchmarks(peers);
  const orgBenchmarks = getOrgBenchmarks(peers);
  const categoryBenchmarks = getCategoryBenchmarks(peers);

  const positionScore = (pos: QuartilePosition) =>
    ({ top: 4, 'above-median': 3, 'below-median': 2, bottom: 1 }[pos]);

  const allPositions = [
    ...skillBenchmarks.map(b => b.position),
    ...orgBenchmarks.map(b => b.position),
    ...categoryBenchmarks.slice(0, 8).map(b => b.position),
  ];
  const avgScore = allPositions.reduce((s, p) => s + positionScore(p), 0) / allPositions.length;

  const overallPosition: QuartilePosition =
    avgScore >= 3.5 ? 'top' :
    avgScore >= 2.5 ? 'above-median' :
    avgScore >= 1.5 ? 'below-median' : 'bottom';

  const topDepts = skillBenchmarks.filter(b => b.position === 'top' || b.position === 'above-median');
  const gapDepts = skillBenchmarks.filter(b => b.position === 'bottom' || b.position === 'below-median');
  const topCategories = categoryBenchmarks.filter(b => b.delta > 0).slice(-3).reverse();
  const gapCategories = categoryBenchmarks.filter(b => b.delta < 0).slice(0, 3);

  // Compute Acme's rank out of all companies (peers + Acme)
  const peerScores = peers.map(p => {
    const peerSkillPositions = (['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'] as const).map(dept => {
      const peerValues = peers.map(pp => pp.deptSkillCompetency[dept as keyof typeof p.deptSkillCompetency]);
      const quartiles = computeQuartiles(peerValues);
      return getQuartilePosition(p.deptSkillCompetency[dept as keyof typeof p.deptSkillCompetency], quartiles);
    });
    return peerSkillPositions.reduce((s, pos) => s + positionScore(pos), 0) / peerSkillPositions.length;
  });
  const allScores = [...peerScores, avgScore].sort((a, b) => b - a);
  const acmeRank = allScores.indexOf(avgScore) + 1;
  const totalCompanies = allScores.length;

  return {
    overallPosition,
    avgScore: parseFloat(avgScore.toFixed(2)),
    acmeRank,
    totalCompanies,
    topDepts,
    gapDepts,
    topCategories,
    gapCategories,
    skillBenchmarks,
    compBenchmarks,
    sizeBenchmarks,
    orgBenchmarks,
    categoryBenchmarks,
  };
}

// ── Talent flow / attrition destination data ───────────────────────────

export type AttritionReason = 'compensation' | 'career-growth' | 'culture' | 'location' | 'unknown';
export type HireChannel = 'referral' | 'recruiter' | 'inbound' | 'agency' | 'internal-transfer';

export interface AttritionRecord {
  /** ISO date of departure */
  date: string;
  name: string;
  department: Department;
  level: string;
  /** Company they moved to */
  destination: string;
  /** Broad category of destination */
  destinationType: 'Big Tech' | 'Scaleup' | 'Startup' | 'Enterprise' | 'Competitor' | 'Unknown';
  reason: AttritionReason;
  tenureMonths: number;
  /** Months since their last 1-on-1 check-in before departure (null = no record) */
  monthsSinceLastCheckIn?: number | null;
  /** Months they had been at their current level — high numbers suggest promotion stall */
  monthsAtLevel?: number;
  /** Whether skills showed no measurable improvement in the 6 months before departure */
  skillStagnant?: boolean;
  /** Estimated pay uplift at destination vs Acme (positive = they earned more by leaving) */
  inferredPayGapPct?: number;
  /** Whether they received a promotion in the 12 months before leaving (protective signal) */
  hadRecentPromotion?: boolean;
  /** Whether they received a manager change in the 6 months before departure */
  recentManagerChange?: boolean;
  /** Company they came from before joining Acme */
  sourcePreviousCompany?: string;
  /** Broad category of their previous employer */
  sourceType?: 'Big Tech' | 'Scaleup' | 'Startup' | 'Enterprise' | 'Competitor' | 'Unknown';
  /** How they were hired into Acme */
  hireChannel?: HireChannel;
  /** Years of total industry experience at time of hire */
  sourceYearsExperience?: number;
}

export const ATTRITION_RECORDS: AttritionRecord[] = [
  { date: '2026-04-15', name: 'Jordan Lee',       department: 'Engineering',  level: 'IC3', destination: 'Stripe',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 28, monthsSinceLastCheckIn: 94,  monthsAtLevel: 26, skillStagnant: true,  inferredPayGapPct: 22, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Atlassian',        sourceType: 'Enterprise', hireChannel: 'recruiter',         sourceYearsExperience: 4  },
  { date: '2026-04-02', name: 'Sam Rivera',        department: 'Product',      level: 'IC2', destination: 'Notion',           destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 14, monthsSinceLastCheckIn: 41,  monthsAtLevel: 14, skillStagnant: false, inferredPayGapPct: 8,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Intercom',          sourceType: 'Scaleup',    hireChannel: 'inbound',           sourceYearsExperience: 2  },
  { date: '2026-03-20', name: 'Taylor Kim',        department: 'Engineering',  level: 'IC4', destination: 'Google',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 36, monthsSinceLastCheckIn: 112, monthsAtLevel: 31, skillStagnant: true,  inferredPayGapPct: 31, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Microsoft',         sourceType: 'Big Tech',   hireChannel: 'recruiter',         sourceYearsExperience: 7  },
  { date: '2026-03-11', name: 'Alex Morgan',       department: 'Data',         level: 'IC2', destination: 'Snowflake',         destinationType: 'Enterprise', reason: 'career-growth',  tenureMonths: 19, monthsSinceLastCheckIn: 58,  monthsAtLevel: 19, skillStagnant: false, inferredPayGapPct: 12, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Hatch Commerce',    sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 2  },
  { date: '2026-02-28', name: 'Casey Brown',       department: 'Marketing',    level: 'IC3', destination: 'HubSpot',           destinationType: 'Enterprise', reason: 'compensation',   tenureMonths: 22, monthsSinceLastCheckIn: 77,  monthsAtLevel: 22, skillStagnant: true,  inferredPayGapPct: 18, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Mailchimp',         sourceType: 'Enterprise', hireChannel: 'agency',            sourceYearsExperience: 5  },
  { date: '2026-02-14', name: 'Riley Chen',        department: 'Engineering',  level: 'IC3', destination: 'Stripe',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 31, monthsSinceLastCheckIn: 103, monthsAtLevel: 28, skillStagnant: true,  inferredPayGapPct: 25, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Cortex Labs',       sourceType: 'Competitor', hireChannel: 'recruiter',         sourceYearsExperience: 5  },
  { date: '2026-01-31', name: 'Morgan Davis',      department: 'Design',       level: 'IC2', destination: 'Figma',            destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 11, monthsSinceLastCheckIn: 18,  monthsAtLevel: 11, skillStagnant: false, inferredPayGapPct: 6,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Axiom Market',      sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 1  },
  { date: '2026-01-20', name: 'Drew Wilson',       department: 'Sales',        level: 'IC2', destination: 'Ripple Analytics',  destinationType: 'Competitor', reason: 'compensation',   tenureMonths: 16, monthsSinceLastCheckIn: 52,  monthsAtLevel: 16, skillStagnant: false, inferredPayGapPct: 14, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Verity HQ',         sourceType: 'Competitor', hireChannel: 'recruiter',         sourceYearsExperience: 3  },
  { date: '2026-01-08', name: 'Quinn Martinez',    department: 'Engineering',  level: 'IC2', destination: 'Vercel',           destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 10, monthsSinceLastCheckIn: 9,   monthsAtLevel: 10, skillStagnant: false, inferredPayGapPct: 10, hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Hatch Commerce',    sourceType: 'Startup',    hireChannel: 'referral',          sourceYearsExperience: 1  },
  { date: '2025-12-19', name: 'Avery Johnson',     department: 'Product',      level: 'IC3', destination: 'Linear',           destinationType: 'Startup',    reason: 'culture',        tenureMonths: 24, monthsSinceLastCheckIn: 88,  monthsAtLevel: 24, skillStagnant: true,  inferredPayGapPct: 3,  hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Meadow Platform',   sourceType: 'Scaleup',    hireChannel: 'referral',          sourceYearsExperience: 4  },
  { date: '2025-12-05', name: 'Blake Thompson',    department: 'Data',         level: 'IC3', destination: 'Databricks',       destinationType: 'Enterprise', reason: 'career-growth',  tenureMonths: 27, monthsSinceLastCheckIn: 95,  monthsAtLevel: 27, skillStagnant: true,  inferredPayGapPct: 17, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Ripple Analytics',  sourceType: 'Competitor', hireChannel: 'recruiter',         sourceYearsExperience: 5  },
  { date: '2025-11-22', name: 'Charlie White',     department: 'Engineering',  level: 'IC3', destination: 'Google',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 33, monthsSinceLastCheckIn: 120, monthsAtLevel: 30, skillStagnant: true,  inferredPayGapPct: 28, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Amazon',            sourceType: 'Big Tech',   hireChannel: 'recruiter',         sourceYearsExperience: 6  },
  { date: '2025-11-10', name: 'Dana Garcia',       department: 'People Ops',   level: 'IC2', destination: 'Workday',           destinationType: 'Enterprise', reason: 'career-growth',  tenureMonths: 18, monthsSinceLastCheckIn: 34,  monthsAtLevel: 18, skillStagnant: false, inferredPayGapPct: 9,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Axiom Market',      sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 2  },
  { date: '2025-10-29', name: 'Elliot Harris',     department: 'Marketing',    level: 'IC2', destination: 'Mailchimp',        destinationType: 'Enterprise', reason: 'compensation',   tenureMonths: 13, monthsSinceLastCheckIn: 44,  monthsAtLevel: 13, skillStagnant: false, inferredPayGapPct: 11, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Hatch Commerce',    sourceType: 'Startup',    hireChannel: 'agency',            sourceYearsExperience: 2  },
  { date: '2025-10-14', name: 'Finley Clark',      department: 'Engineering',  level: 'IC4', destination: 'Meta',             destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 41, monthsSinceLastCheckIn: 135, monthsAtLevel: 38, skillStagnant: true,  inferredPayGapPct: 34, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Google',            sourceType: 'Big Tech',   hireChannel: 'recruiter',         sourceYearsExperience: 9  },
  { date: '2025-09-30', name: 'Gray Lewis',        department: 'Design',       level: 'IC3', destination: 'Figma',            destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 20, monthsSinceLastCheckIn: 61,  monthsAtLevel: 20, skillStagnant: false, inferredPayGapPct: 8,  hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Meadow Platform',   sourceType: 'Scaleup',    hireChannel: 'referral',          sourceYearsExperience: 3  },
  { date: '2025-09-17', name: 'Harper Robinson',   department: 'Sales',        level: 'IC3', destination: 'Verity HQ',        destinationType: 'Competitor', reason: 'compensation',   tenureMonths: 25, monthsSinceLastCheckIn: 83,  monthsAtLevel: 25, skillStagnant: true,  inferredPayGapPct: 16, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Orbis Cloud',       sourceType: 'Enterprise', hireChannel: 'agency',            sourceYearsExperience: 5  },
  { date: '2025-09-03', name: 'Indigo Walker',     department: 'Engineering',  level: 'IC2', destination: 'Vercel',           destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 9,  monthsSinceLastCheckIn: null, monthsAtLevel: 9,  skillStagnant: false, inferredPayGapPct: 12, hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Axiom Market',      sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 1  },
  { date: '2025-08-20', name: 'Jules Hall',        department: 'Data',         level: 'IC2', destination: 'Snowflake',         destinationType: 'Enterprise', reason: 'career-growth',  tenureMonths: 15, monthsSinceLastCheckIn: 27,  monthsAtLevel: 15, skillStagnant: false, inferredPayGapPct: 10, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Hatch Commerce',    sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 2  },
  { date: '2025-08-07', name: 'Kit Young',         department: 'Product',      level: 'IC2', destination: 'Loom',             destinationType: 'Startup',    reason: 'culture',        tenureMonths: 12, monthsSinceLastCheckIn: 14,  monthsAtLevel: 12, skillStagnant: false, inferredPayGapPct: 2,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Axiom Market',      sourceType: 'Startup',    hireChannel: 'referral',          sourceYearsExperience: 1  },
  { date: '2025-07-25', name: 'Lane Allen',        department: 'Engineering',  level: 'IC3', destination: 'Stripe',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 29, monthsSinceLastCheckIn: 98,  monthsAtLevel: 26, skillStagnant: true,  inferredPayGapPct: 23, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Cortex Labs',       sourceType: 'Competitor', hireChannel: 'recruiter',         sourceYearsExperience: 5  },
  { date: '2025-07-11', name: 'Marlowe Scott',     department: 'Marketing',    level: 'IC3', destination: 'HubSpot',           destinationType: 'Enterprise', reason: 'compensation',   tenureMonths: 21, monthsSinceLastCheckIn: 71,  monthsAtLevel: 21, skillStagnant: true,  inferredPayGapPct: 15, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Verity HQ',         sourceType: 'Competitor', hireChannel: 'agency',            sourceYearsExperience: 4  },
  { date: '2025-06-28', name: 'Nico King',         department: 'Engineering',  level: 'IC2', destination: 'Notion',           destinationType: 'Scaleup',    reason: 'culture',        tenureMonths: 8,  monthsSinceLastCheckIn: 7,   monthsAtLevel: 8,  skillStagnant: false, inferredPayGapPct: 5,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Hatch Commerce',    sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 1  },
  { date: '2025-06-14', name: 'Onyx Wright',       department: 'Design',       level: 'IC2', destination: 'Unknown',           destinationType: 'Unknown',    reason: 'unknown',        tenureMonths: 14, monthsSinceLastCheckIn: null, monthsAtLevel: 14, skillStagnant: false, inferredPayGapPct: undefined, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: undefined, sourceType: undefined, hireChannel: 'inbound', sourceYearsExperience: 2 },
  { date: '2025-05-30', name: 'Parker Green',      department: 'Sales',        level: 'IC2', destination: 'Ripple Analytics',  destinationType: 'Competitor', reason: 'compensation',   tenureMonths: 17, monthsSinceLastCheckIn: 55,  monthsAtLevel: 17, skillStagnant: false, inferredPayGapPct: 13, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Meadow Platform',   sourceType: 'Scaleup',    hireChannel: 'recruiter',         sourceYearsExperience: 3  },
  { date: '2025-05-16', name: 'Quinn Adams',       department: 'Engineering',  level: 'IC3', destination: 'Google',           destinationType: 'Big Tech',   reason: 'compensation',   tenureMonths: 34, monthsSinceLastCheckIn: 116, monthsAtLevel: 31, skillStagnant: true,  inferredPayGapPct: 29, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Microsoft',         sourceType: 'Big Tech',   hireChannel: 'recruiter',         sourceYearsExperience: 7  },
  { date: '2025-05-02', name: 'Remy Baker',        department: 'Data',         level: 'IC3', destination: 'Databricks',       destinationType: 'Enterprise', reason: 'career-growth',  tenureMonths: 30, monthsSinceLastCheckIn: 101, monthsAtLevel: 30, skillStagnant: true,  inferredPayGapPct: 18, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Ripple Analytics',  sourceType: 'Competitor', hireChannel: 'referral',          sourceYearsExperience: 5  },
  { date: '2025-04-18', name: 'Sage Nelson',       department: 'Product',      level: 'IC3', destination: 'Linear',           destinationType: 'Startup',    reason: 'career-growth',  tenureMonths: 22, monthsSinceLastCheckIn: 79,  monthsAtLevel: 22, skillStagnant: false, inferredPayGapPct: 4,  hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Intercom',          sourceType: 'Scaleup',    hireChannel: 'referral',          sourceYearsExperience: 4  },
  { date: '2025-04-04', name: 'Tatum Carter',      department: 'Engineering',  level: 'IC2', destination: 'Vercel',           destinationType: 'Scaleup',    reason: 'career-growth',  tenureMonths: 11, monthsSinceLastCheckIn: 12,  monthsAtLevel: 11, skillStagnant: false, inferredPayGapPct: 9,  hadRecentPromotion: false, recentManagerChange: true,  sourcePreviousCompany: 'Axiom Market',      sourceType: 'Startup',    hireChannel: 'inbound',           sourceYearsExperience: 1  },
  { date: '2025-03-21', name: 'Uma Mitchell',      department: 'People Ops',   level: 'IC3', destination: 'Workday',           destinationType: 'Enterprise', reason: 'compensation',   tenureMonths: 26, monthsSinceLastCheckIn: 87,  monthsAtLevel: 26, skillStagnant: true,  inferredPayGapPct: 14, hadRecentPromotion: false, recentManagerChange: false, sourcePreviousCompany: 'Orbis Cloud',       sourceType: 'Enterprise', hireChannel: 'agency',            sourceYearsExperience: 6  },
];

export interface DestinationSummary {
  company: string;
  type: AttritionRecord['destinationType'];
  count: number;
  departments: Department[];
  mostRecentDate: string;
  avgTenureMonths: number;
  primaryReason: AttritionReason;
}

export function getTopDestinations(records: AttritionRecord[] = ATTRITION_RECORDS, limit = 10): DestinationSummary[] {
  const map = new Map<string, AttritionRecord[]>();
  for (const r of records) {
    if (!map.has(r.destination)) map.set(r.destination, []);
    map.get(r.destination)!.push(r);
  }

  return Array.from(map.entries())
    .map(([company, recs]) => {
      const reasonCounts = recs.reduce<Record<string, number>>((acc, r) => {
        acc[r.reason] = (acc[r.reason] ?? 0) + 1;
        return acc;
      }, {});
      const primaryReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0][0] as AttritionReason;
      return {
        company,
        type: recs[0].destinationType,
        count: recs.length,
        departments: [...new Set(recs.map(r => r.department))],
        mostRecentDate: recs.map(r => r.date).sort().reverse()[0],
        avgTenureMonths: Math.round(recs.reduce((s, r) => s + r.tenureMonths, 0) / recs.length),
        primaryReason,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface AttritionTrend {
  month: string; // "Jan 2026"
  count: number;
}

export function getAttritionTrend(records: AttritionRecord[] = ATTRITION_RECORDS): AttritionTrend[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const d = new Date(r.date);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

// ── Attrition risk score ────────────────────────────────────────────────

/**
 * Industry peer attrition rates (annualised %, voluntarily disclosed).
 * Typical healthy SaaS scaleup: 10–15% annual voluntary attrition.
 */
const PEER_ATTRITION_RATES: number[] = [8, 10, 11, 12, 13, 14, 15, 17];

export interface AttritionScore {
  /** 0–100: higher = worse (more at-risk) */
  score: number;
  /** Percentile label vs peers */
  position: QuartilePosition;
  /** Annualised attrition rate as a percentage */
  annualisedRate: number;
  peerMedianRate: number;
  peerRateQuartiles: Quartile;
  /** % of leavers going to direct competitors */
  competitorPct: number;
  /** % of leavers citing compensation */
  compDrivenPct: number;
  /** % of leavers citing career growth */
  careerDrivenPct: number;
  /** Average tenure at exit (months) */
  avgTenureMonths: number;
  /** Human-readable risk label */
  riskLabel: 'Low' | 'Moderate' | 'Elevated' | 'High';
  riskColor: string;
  riskBg: string;
  riskBorder: string;
  /** One-line headline for the score card */
  headline: string;
}

export function computeAttritionScore(
  records: AttritionRecord[] = ATTRITION_RECORDS,
  totalHeadcount: number = ACME_TOTAL_HEADCOUNT,
): AttritionScore {
  const total = records.length;

  // Annualised voluntary attrition rate
  const annualisedRate = parseFloat(((total / totalHeadcount) * 100).toFixed(1));

  const rateQuartiles = computeQuartiles(PEER_ATTRITION_RATES);
  // For attrition, LOWER is better — so we invert position logic
  const rawPosition = getQuartilePosition(annualisedRate, rateQuartiles);
  // Invert: if rate is in "top" (highest attrition) → that's actually bottom quartile for health
  const INVERT: Record<QuartilePosition, QuartilePosition> = {
    top: 'bottom',
    'above-median': 'below-median',
    'below-median': 'above-median',
    bottom: 'top',
  };
  const position = INVERT[rawPosition];

  // Sub-metrics
  const competitorCount  = records.filter(r => r.destinationType === 'Competitor').length;
  const compDrivenCount  = records.filter(r => r.reason === 'compensation').length;
  const careerDrivenCount = records.filter(r => r.reason === 'career-growth').length;
  const competitorPct  = total > 0 ? Math.round((competitorCount  / total) * 100) : 0;
  const compDrivenPct  = total > 0 ? Math.round((compDrivenCount  / total) * 100) : 0;
  const careerDrivenPct = total > 0 ? Math.round((careerDrivenCount / total) * 100) : 0;
  const avgTenureMonths = total > 0
    ? Math.round(records.reduce((s, r) => s + r.tenureMonths, 0) / total)
    : 0;

  // Composite risk score (0–100, higher = worse)
  // Rate contributes most weight; competitor drain and early-tenure exits amplify it
  const rateScore       = Math.min((annualisedRate / 25) * 50, 50);          // 0–50 based on rate
  const competitorScore = Math.min((competitorPct / 40) * 20, 20);           // 0–20
  const compScore       = Math.min((compDrivenPct / 60) * 15, 15);           // 0–15
  const tenureScore     = avgTenureMonths < 18 ? 15 : avgTenureMonths < 24 ? 8 : 0; // 0–15
  const score = Math.round(rateScore + competitorScore + compScore + tenureScore);

  const riskLabel: AttritionScore['riskLabel'] =
    score >= 70 ? 'High' : score >= 45 ? 'Elevated' : score >= 25 ? 'Moderate' : 'Low';
  const riskColor  = score >= 70 ? 'text-red-700'    : score >= 45 ? 'text-amber-700'  : score >= 25 ? 'text-sky-700'     : 'text-emerald-700';
  const riskBg     = score >= 70 ? 'bg-red-50'       : score >= 45 ? 'bg-amber-50'     : score >= 25 ? 'bg-sky-50'        : 'bg-emerald-50';
  const riskBorder = score >= 70 ? 'border-red-200'  : score >= 45 ? 'border-amber-200': score >= 25 ? 'border-sky-200'   : 'border-emerald-200';

  const headline =
    score >= 70 ? `Attrition is a critical risk — ${annualisedRate}% rate with ${competitorPct}% going to competitors`
    : score >= 45 ? `Elevated attrition (${annualisedRate}%) — compensation and career growth are primary drivers`
    : score >= 25 ? `Moderate attrition risk (${annualisedRate}%) — early-tenure exits merit attention`
    : `Healthy attrition levels at ${annualisedRate}% — below peer median`;

  return {
    score,
    position,
    annualisedRate,
    peerMedianRate: rateQuartiles.p50,
    peerRateQuartiles: rateQuartiles,
    competitorPct,
    compDrivenPct,
    careerDrivenPct,
    avgTenureMonths,
    riskLabel,
    riskColor,
    riskBg,
    riskBorder,
    headline,
  };
}
