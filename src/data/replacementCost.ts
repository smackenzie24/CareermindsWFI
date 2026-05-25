/**
 * Replacement cost scoring — "most expensive to lose"
 *
 * Five dimensions, each scored 0–20, total 0–100:
 *   1. Seniority cost   — level × dept comp → estimated recruiter fee + ramp burn
 *   2. Knowledge risk   — skills they hold that few teammates match (scarcity)
 *   3. Pipeline stake   — near-ready candidates: losing them forfeits future leadership
 *   4. Peer gap weight  — strong in categories where Acme already trails benchmarks
 *   5. Flight urgency   — flight risk × cost multiplier (probability-weighted)
 */

import {
  PEOPLE,
  LEVEL_DEFINITIONS,
  LEVEL_FRAMEWORKS,
  computeReadiness,
  type Person,
} from './promotionData';
import { MANAGERS, type Manager } from './managerData';
import { ACME_COMP, ACME_SKILL_COMPETENCY, getCategoryBenchmarks } from './benchmarkData';
import { SKILLS_DATA, type Department } from './mockData';

// ── Seniority bands ───────────────────────────────────────────────────────

const LEVEL_SENIORITY: Record<string, number> = {
  'eng-ic1': 1, 'eng-ic2': 2, 'eng-ic3': 3, 'eng-ic4': 4, 'eng-m1': 5, 'eng-m2': 6,
  'prod-ic1': 1, 'prod-ic2': 2, 'prod-ic3': 3, 'prod-ic4': 4,
  'des-ic1': 1, 'des-ic2': 2, 'des-ic3': 3,
  'dat-ic1': 1, 'dat-ic2': 2, 'dat-ic3': 3,
  'mkt-ic1': 1, 'mkt-ic2': 2, 'mkt-ic3': 3,
  'sal-ic1': 1, 'sal-ic2': 2, 'sal-ic3': 3,
  'ppl-ic1': 1, 'ppl-ic2': 2, 'ppl-m1': 5,
};

// Recruiter fee % and ramp months per seniority band
const RAMP: Record<number, { fee: number; months: number }> = {
  1: { fee: 0.10, months: 2 },
  2: { fee: 0.15, months: 3 },
  3: { fee: 0.20, months: 4 },
  4: { fee: 0.25, months: 6 },
  5: { fee: 0.30, months: 8 },
  6: { fee: 0.35, months: 10 },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getPersonReadiness(person: Person): number {
  const cur = LEVEL_DEFINITIONS.find(l => l.id === person.currentLevelId);
  if (!cur?.nextLevel) return 0;
  const nxt = LEVEL_DEFINITIONS.find(l => l.id === cur.nextLevel);
  if (!nxt) return 0;
  const fw = LEVEL_FRAMEWORKS.find(f => f.levelId === nxt.id);
  if (!fw) return 0;
  return computeReadiness(person, fw, nxt.label).readinessPct;
}

// Skill-id → category map (built once from LEVEL_FRAMEWORKS)
const skillIdToCategory: Record<string, string> = {};
for (const fw of LEVEL_FRAMEWORKS) {
  for (const c of fw.criteria) skillIdToCategory[c.skillId] = c.category;
}

// Categories where Acme lags the peer median
const belowMedianCategories = new Set(
  getCategoryBenchmarks().filter(b => b.delta < 0).map(b => b.category)
);

// ── Scoring ───────────────────────────────────────────────────────────────

export interface CostBreakdown {
  seniorityCost:    number; // 0–20
  knowledgeRisk:    number; // 0–20
  pipelineStake:    number; // 0–20
  peerGapWeight:    number; // 0–20
  flightUrgency:    number; // 0–20
}

export interface ReplacementEntry {
  id: string;
  name: string;
  role: string;
  department: Department;
  isManager: boolean;
  flightRisk: 'high' | 'medium' | 'low';
  totalScore: number;        // 0–100
  breakdown: CostBreakdown;
  estimatedCostUsd: number;  // fee + ramp burn
  rampMonths: number;
  reasons: string[];         // 2–4 plain-English bullets
  /** present only for managers */
  reportCount?: number;
  avgReportReadiness?: number;
}

const FLIGHT_W = { high: 1.0, medium: 0.55, low: 0.15 };
const MAX_USD   = 128_000 * 0.25 + (128_000 / 12) * 6 * 0.5; // IC4 Eng ceiling

function scorePerson(p: Person): ReplacementEntry {
  const seniority = LEVEL_SENIORITY[p.currentLevelId] ?? 2;
  const comp      = ACME_COMP[p.department] ?? 90_000;
  const ramp      = RAMP[seniority] ?? RAMP[2];

  const feeUsd    = comp * ramp.fee;
  const rampUsd   = (comp / 12) * ramp.months * 0.5;
  const totalUsd  = feeUsd + rampUsd;

  // 1. Seniority cost
  const seniorityCost = Math.min((totalUsd / MAX_USD) * 20, 20);

  // 2. Knowledge risk — fraction of their strong skills (≥3) that teammates don't match
  const teammates = PEOPLE.filter(q => q.id !== p.id && q.team === p.team);
  let scarceSum = 0, scarceCount = 0;
  for (const [sid, rating] of Object.entries(p.skills)) {
    if (rating < 3) continue;
    const coverage = teammates.filter(t => (t.skills[sid] ?? 0) >= rating - 0.5).length;
    scarceSum += 1 - (teammates.length > 0 ? coverage / teammates.length : 0);
    scarceCount++;
  }
  const knowledgeRisk = scarceCount > 0 ? (scarceSum / scarceCount) * 20 : 10;

  // 3. Pipeline stake — near-ready = highest loss
  const readinessPct  = getPersonReadiness(p);
  const pipelineStake = readinessPct >= 90 ? 20 : readinessPct >= 70 ? 14 : readinessPct >= 50 ? 8 : 3;

  // 4. Peer gap weight — strong skills in below-median categories
  let gapSum = 0, gapCount = 0;
  for (const [sid, rating] of Object.entries(p.skills)) {
    if (rating < 3) continue;
    const cat = skillIdToCategory[sid];
    if (!cat) continue;
    gapSum   += belowMedianCategories.has(cat) ? rating / 5 : 0;
    gapCount++;
  }
  const peerGapWeight = gapCount > 0 ? (gapSum / gapCount) * 20 : 5;

  // 5. Flight urgency — probability × normalised cost
  const riskW       = FLIGHT_W[p.flightRisk ?? 'low'];
  const costNorm    = (seniorityCost + knowledgeRisk) / 40;
  const flightUrgency = riskW * costNorm * 20;

  const breakdown: CostBreakdown = {
    seniorityCost:  +seniorityCost.toFixed(1),
    knowledgeRisk:  +knowledgeRisk.toFixed(1),
    pipelineStake:  +pipelineStake.toFixed(1),
    peerGapWeight:  +peerGapWeight.toFixed(1),
    flightUrgency:  +flightUrgency.toFixed(1),
  };
  const totalScore = Math.min(
    Math.round(seniorityCost + knowledgeRisk + pipelineStake + peerGapWeight + flightUrgency),
    100,
  );

  const levelLabel = LEVEL_DEFINITIONS.find(l => l.id === p.currentLevelId)?.label ?? p.currentLevelId;

  const reasons: string[] = [];
  if (seniorityCost >= 12) reasons.push(`Senior role — est. $${Math.round(totalUsd / 1000)}K to replace with ${ramp.months}-month ramp to productivity`);
  if (knowledgeRisk >= 14) reasons.push('Holds critical skills with little or no backup coverage on the team');
  else if (knowledgeRisk >= 8) reasons.push('Several key skills have limited backup coverage on the team');
  if (pipelineStake >= 14) reasons.push(`${Math.round(readinessPct)}% promotion-ready — losing near-term leadership pipeline`);
  if (peerGapWeight >= 10) reasons.push('Strong in skill categories where Acme already lags behind industry peers');
  if (flightUrgency >= 10) reasons.push(`${p.flightRisk ?? 'low'} flight risk${p.flightRiskDrivers?.length ? ': ' + p.flightRiskDrivers.slice(0, 2).join(', ') : ''}`);
  if (reasons.length === 0) reasons.push('Consistent contributor across multiple valued competency areas');

  return {
    id: p.id,
    name: p.name,
    role: levelLabel,
    department: p.department,
    isManager: false,
    flightRisk: p.flightRisk ?? 'low',
    totalScore,
    breakdown,
    estimatedCostUsd: Math.round(totalUsd),
    rampMonths: ramp.months,
    reasons: reasons.slice(0, 3),
  };
}

function scoreManager(m: Manager): ReplacementEntry {
  const reports  = PEOPLE.filter(p => m.teams.includes(p.team) && p.department === m.department);
  const avgReady = reports.length > 0
    ? Math.round(reports.reduce((s, p) => s + getPersonReadiness(p), 0) / reports.length)
    : 0;

  const comp      = ACME_COMP[m.department] ?? 90_000;
  const mgrComp   = comp * 1.35;
  const fee       = mgrComp * 0.30;
  const rampBurn  = (mgrComp / 12) * 8 * 0.5;
  const totalUsd  = fee + rampBurn;

  const seniorityCost  = Math.min((totalUsd / (MAX_USD * 1.35)) * 20, 20);
  const knowledgeRisk  = 14 + Math.min((m.tenure / 48) * 6, 6); // tenure adds scarcity
  const pipelineStake  = Math.min(8 + (reports.length / 15) * 8 + (avgReady / 100) * 4, 20);
  const deptComp       = ACME_SKILL_COMPETENCY[m.department] ?? 3.3;
  const peerGapWeight  = deptComp < 3.2 ? 16 : deptComp < 3.5 ? 11 : 7;
  const tenureRisk     = m.tenure < 18 ? 0.65 : m.tenure > 48 ? 0.45 : 0.3;
  const flightUrgency  = tenureRisk * ((seniorityCost + knowledgeRisk) / 40) * 20;

  const breakdown: CostBreakdown = {
    seniorityCost:  +seniorityCost.toFixed(1),
    knowledgeRisk:  +knowledgeRisk.toFixed(1),
    pipelineStake:  +pipelineStake.toFixed(1),
    peerGapWeight:  +peerGapWeight.toFixed(1),
    flightUrgency:  +flightUrgency.toFixed(1),
  };
  const totalScore = Math.min(
    Math.round(seniorityCost + knowledgeRisk + pipelineStake + peerGapWeight + flightUrgency),
    100,
  );

  const reasons: string[] = [
    `Manages ${reports.length} direct reports — losing this manager disrupts ${reports.length} active development plans`,
  ];
  if (m.tenure >= 28) reasons.push(`${m.tenure}-month tenure — deep institutional knowledge and team trust at risk`);
  if (avgReady >= 55) reasons.push(`Team avg readiness ${avgReady}% — new manager would slow near-ready promotions`);
  if (peerGapWeight >= 14) reasons.push(`${m.department} lags peers on skill competency — leadership continuity critical`);

  const flightRisk: 'high' | 'medium' | 'low' = tenureRisk >= 0.6 ? 'high' : tenureRisk >= 0.4 ? 'medium' : 'low';

  return {
    id: m.id,
    name: m.name,
    role: m.title,
    department: m.department,
    isManager: true,
    flightRisk,
    totalScore,
    breakdown,
    estimatedCostUsd: Math.round(totalUsd),
    rampMonths: 8,
    reasons: reasons.slice(0, 3),
    reportCount: reports.length,
    avgReportReadiness: avgReady,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

let _cache: ReplacementEntry[] | null = null;

export function getAllReplacementCosts(): ReplacementEntry[] {
  if (_cache) return _cache;
  _cache = [
    ...PEOPLE.map(scorePerson),
    ...MANAGERS.map(scoreManager),
  ].sort((a, b) => b.totalScore - a.totalScore);
  return _cache;
}

export function getTopReplacementCosts(n = 5, dept?: Department): ReplacementEntry[] {
  let all = getAllReplacementCosts();
  if (dept) all = all.filter(r => r.department === dept);
  return all.slice(0, n);
}
