/**
 * Aggregates signals from all 5 intelligence modules into a CPO-level summary.
 * This is the data layer for the Executive Summary dashboard.
 */

import { SKILLS_DATA, DEPT_COLORS, type Department } from './mockData';
import { getAllReadiness, PEOPLE, LEVEL_DEFINITIONS, getFlightRiskPeople } from './promotionData';
import { getAllManagerMetrics } from './managerData';
import {
  getDeptSkillBenchmarks,
  getDeptCompBenchmarks,
  getDeptSizeBenchmarks,
  getCategoryBenchmarks,
  getOrgBenchmarks,
  getOverallBenchmarkSummary,
  computeAttritionScore,
  ATTRITION_RECORDS,
  ACME_TOTAL_HEADCOUNT,
  QUARTILE_CONFIG,
  SIMILAR_PEERS,
  type QuartilePosition,
  type AttritionScore,
} from './benchmarkData';

export type RiskLevel = 'critical' | 'warning' | 'healthy';

export interface OrgRisk {
  id: string;
  level: RiskLevel;
  title: string;
  detail: string;
  metric: string;
  /** Which view + pre-filter to jump to */
  action: NavTarget;
  actionLabel: string;
  /** Optional secondary action */
  secondaryAction?: NavTarget;
  secondaryLabel?: string;
  source: 'skills' | 'pipeline' | 'managers' | 'benchmark';
}

export interface NavTarget {
  view: 'heatmap' | 'pipeline' | 'gap-report' | 'managers' | 'benchmark';
  department?: Department;
  skill?: string;
  managerId?: string;
  pipelineTab?: 'pipeline' | 'hidden-talent' | 'flight-risk';
}

export interface DeptHealthSnapshot {
  department: Department;
  color: string;
  overallScore: number; // 0–100
  scoreLabel: string;
  skillCompetency: number; // 1–5
  nearReadyCount: number;
  stalledCount: number;
  benchmarkPosition: QuartilePosition;
  criticalSkillGaps: number;
  avgManagerScore: number;
}

export interface CheckInFlag {
  person: import('./promotionData').Person;
  daysSinceCheckIn: number;
  severity: 'overdue' | 'critical'; // 30–90 days = overdue, 90+ = critical
}

export interface ExecSummary {
  /** Timestamp (simulated) */
  asOf: string;
  /** 0–100 org health */
  orgHealthScore: number;
  orgHealthLabel: string;
  orgHealthColor: string;

  /** Key KPIs */
  totalHeadcount: number;
  totalNearReady: number;
  totalStalled: number;
  criticalSkillGaps: number; // skills where 70%+ below target
  peopleWithSkillGaps: number; // people below target on at least one skill
  managersNeedingSupport: number; // effectiveness score < 40
  benchmarkPosition: QuartilePosition;
  benchmarkRank: number;
  benchmarkTotal: number;
  attritionScore: AttritionScore;

  /** Check-in coverage */
  checkInCoverage: number; // % who have checked in within 30 days
  overdueCheckIns: number; // checked in 30–90 days ago
  criticalCheckIns: number; // not checked in for 90+ days
  flaggedCheckIns: CheckInFlag[]; // full list, sorted by days overdue desc

  /** Top 5 prioritised risks */
  risks: OrgRisk[];

  /** Per-department snapshot */
  deptSnapshots: DeptHealthSnapshot[];

  /** Win callouts */
  wins: { title: string; detail: string; source: string }[];
}

// ── Compute all signals ─────────────────────────────────────────────────

function computeOrgHealth(
  criticalGapCount: number,
  totalSkills: number,
  stalledCount: number,
  totalHeadcount: number,
  managersNeedingSupport: number,
  totalManagers: number,
  benchmarkPos: QuartilePosition,
  attritionRiskScore: number,
): number {
  // All inputs converted to rates so the score is scale-invariant (works at 50 or 50,000 employees)
  const gapRate = totalSkills > 0 ? criticalGapCount / totalSkills : 0;
  const stalledRate = totalHeadcount > 0 ? stalledCount / totalHeadcount : 0;
  const managerRate = totalManagers > 0 ? managersNeedingSupport / totalManagers : 0;

  let score = 100;
  score -= Math.round(gapRate * 25);           // up to 25 pts: share of skills that are critical
  score -= Math.round(stalledRate * 20);        // up to 20 pts: share of headcount that is stalled
  score -= Math.round(managerRate * 20);        // up to 20 pts: share of managers needing support
  const benchPenalty = { top: 0, 'above-median': 5, 'below-median': 12, bottom: 20 }[benchmarkPos];
  score -= benchPenalty;
  score -= Math.round((attritionRiskScore / 100) * 15);
  return Math.max(10, Math.min(100, Math.round(score)));
}

function healthLabel(score: number): string {
  if (score >= 75) return 'Strong';
  if (score >= 55) return 'Moderate';
  if (score >= 35) return 'At Risk';
  return 'Critical';
}

function healthColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-amber-600';
  if (score >= 35) return 'text-orange-600';
  return 'text-red-600';
}

function healthBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 55) return 'bg-amber-50 border-amber-200';
  if (score >= 35) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export function getHealthBg(score: number) { return healthBg(score); }

export function computeExecSummary(): ExecSummary {
  const allReadiness = getAllReadiness();
  const managerMetrics = getAllManagerMetrics();
  const benchSummary = getOverallBenchmarkSummary(SIMILAR_PEERS);
  const skillBenchmarks = getDeptSkillBenchmarks(SIMILAR_PEERS);
  const compBenchmarks = getDeptCompBenchmarks(SIMILAR_PEERS);
  const categoryBenchmarks = getCategoryBenchmarks(SIMILAR_PEERS);
  const orgBenchmarks = getOrgBenchmarks(SIMILAR_PEERS);

  // ── Skill gaps ─────────────────────────────────────────────────────
  // Aggregate SKILLS_DATA by skill across all entries
  const skillMap = new Map<string, { dept: Department; totalHead: number; totalBelow: number; category: string }>();
  for (const entry of SKILLS_DATA) {
    const existing = skillMap.get(entry.skill);
    if (existing) {
      existing.totalHead += entry.headcount;
      existing.totalBelow += entry.belowTarget;
    } else {
      skillMap.set(entry.skill, {
        dept: entry.department,
        totalHead: entry.headcount,
        totalBelow: entry.belowTarget,
        category: entry.category,
      });
    }
  }
  const criticalSkillsList = Array.from(skillMap.entries())
    .map(([skill, d]) => ({ skill, dept: d.dept, category: d.category, belowPct: (d.totalBelow / d.totalHead) * 100 }))
    .filter(s => s.belowPct >= 70)
    .sort((a, b) => b.belowPct - a.belowPct);

  const criticalSkillGaps = criticalSkillsList.length;
  const totalDistinctSkills = skillMap.size;
  const peopleWithSkillGaps = allReadiness.filter(r => r.readinessPct < 100).length;

  // ── Pipeline signals ───────────────────────────────────────────────
  const totalNearReady = allReadiness.filter(r => r.readinessPct >= 90).length;
  const totalStalled = allReadiness.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length;

  // Dept-level: worst dept by avg readiness
  const deptReadiness = new Map<Department, number[]>();
  for (const r of allReadiness) {
    const arr = deptReadiness.get(r.person.department) ?? [];
    arr.push(r.readinessPct);
    deptReadiness.set(r.person.department, arr);
  }
  const deptAvgReadiness = new Map<Department, number>();
  for (const [dept, vals] of deptReadiness.entries()) {
    deptAvgReadiness.set(dept, Math.round(vals.reduce((s, v) => s + v, 0) / vals.length));
  }

  // ── Manager signals ────────────────────────────────────────────────
  const managersNeedingSupport = managerMetrics.filter(m => {
    const stallPenalty = m.reports.length > 0 ? (m.stalledCount / m.reports.length) * 100 : 0;
    const score = Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - stallPenalty) * 0.3);
    return score < 40 && m.reports.length > 0;
  });

  const managersWithMostStalled = managerMetrics
    .filter(m => m.stalledCount > 0)
    .sort((a, b) => b.stalledCount - a.stalledCount);

  // ── Benchmark signals ──────────────────────────────────────────────
  const bottomQuartileDepts = skillBenchmarks.filter(b => b.position === 'bottom');
  const topQuartileDepts = skillBenchmarks.filter(b => b.position === 'top');
  const underPaidDepts = compBenchmarks.filter(b => b.position === 'bottom' || b.position === 'below-median');
  const topGapCategories = categoryBenchmarks.filter(b => b.delta < -0.2).slice(0, 3);

  // ── Attrition score ────────────────────────────────────────────────
  const attritionScore = computeAttritionScore(ATTRITION_RECORDS, ACME_TOTAL_HEADCOUNT);

  // ── Org health ─────────────────────────────────────────────────────
  const orgHealthScore = computeOrgHealth(
    criticalSkillGaps,
    totalDistinctSkills,
    totalStalled,
    allReadiness.length,
    managersNeedingSupport.length,
    managerMetrics.length,
    benchSummary.overallPosition,
    attritionScore.score,
  );

  // ── Build risk list ────────────────────────────────────────────────
  const risks: OrgRisk[] = [];

  // Critical skill gaps
  if (criticalSkillsList.length > 0) {
    const worst = criticalSkillsList[0];
    risks.push({
      id: 'critical-skills',
      level: 'critical',
      title: `${criticalSkillsList.length} critical skill gap${criticalSkillsList.length > 1 ? 's' : ''} across the org`,
      detail: `${worst.skill} in ${worst.dept} is the most severe — ${Math.round(worst.belowPct)}% of people below target. This is blocking promotion pipelines and increasing delivery risk.`,
      metric: `${Math.round(worst.belowPct)}% below target`,
      action: { view: 'gap-report', department: worst.dept },
      actionLabel: `View ${worst.dept} skill gaps`,
      secondaryAction: { view: 'heatmap' },
      secondaryLabel: 'Open heatmap',
      source: 'skills',
    });
  }

  // Stalled employees
  const stalledRate = allReadiness.length > 0 ? totalStalled / allReadiness.length : 0;
  if (totalStalled > 0 && managersWithMostStalled.length > 0) {
    const worstMgr = managersWithMostStalled[0];
    risks.push({
      id: 'stalled-reports',
      level: stalledRate >= 0.05 ? 'critical' : 'warning',
      title: `${totalStalled} employee${totalStalled > 1 ? 's' : ''} showing stall signals`,
      detail: `These individuals have been in their current level for 24+ months with less than 50% promotion readiness. ${worstMgr.manager.name}'s team has the most (${worstMgr.stalledCount}). Inaction risks attrition.`,
      metric: `${totalStalled} stalled (24m+ · <50% ready)`,
      action: { view: 'managers', managerId: worstMgr.manager.id },
      actionLabel: `Review ${worstMgr.manager.name}'s team`,
      secondaryAction: { view: 'pipeline' },
      secondaryLabel: 'Full pipeline view',
      source: 'pipeline',
    });
  }

  // Managers needing support
  if (managersNeedingSupport.length > 0) {
    risks.push({
      id: 'manager-support',
      level: 'warning',
      title: `${managersNeedingSupport.length} manager${managersNeedingSupport.length > 1 ? 's' : ''} flagged for L&D coaching`,
      detail: `Low effectiveness scores driven by high stall rates and poor framework completion. These managers' teams are growing slowest in skills and career progression.`,
      metric: `Effectiveness score < 40`,
      action: { view: 'managers' },
      actionLabel: 'Manager effectiveness',
      source: 'managers',
    });
  }

  // Benchmark gaps
  if (bottomQuartileDepts.length > 0) {
    const worst = bottomQuartileDepts[0];
    risks.push({
      id: 'benchmark-gap',
      level: 'warning',
      title: `${worst.department} skills in bottom quartile vs industry`,
      detail: `Your ${worst.department} team's average competency (${worst.acmeValue.toFixed(1)}/5) is below 75% of similar-sized companies. This affects recruiting, retention, and delivery capacity.`,
      metric: `${worst.acmeValue.toFixed(1)} vs ${worst.peerMedian.toFixed(1)} peer median`,
      action: { view: 'benchmark' },
      actionLabel: 'View skill benchmarks',
      secondaryAction: { view: 'gap-report', department: worst.department },
      secondaryLabel: `${worst.department} gap report`,
      source: 'benchmark',
    });
  }

  // Compensation risk
  if (underPaidDepts.length > 0) {
    const worst = underPaidDepts.sort((a, b) => a.delta - b.delta)[0];
    risks.push({
      id: 'comp-risk',
      level: 'warning',
      title: `${worst.department} compensation below market`,
      detail: `Average ${worst.department} comp is ${Math.abs(Math.round(worst.delta / 1000))}K below the peer median. Combined with bottom-quartile skills, this creates a flight-risk profile.`,
      metric: `$${Math.abs(Math.round(worst.delta / 1000))}K below median`,
      action: { view: 'benchmark' },
      actionLabel: 'Compensation benchmarks',
      source: 'benchmark',
    });
  }

  // Flight risk signal (Revelio Labs)
  const highFlightRisk = getFlightRiskPeople('high');
  const flightRiskRate = allReadiness.length > 0 ? highFlightRisk.length / allReadiness.length : 0;
  if (highFlightRisk.length > 0) {
    const withOpportunity = highFlightRisk.filter(e => e.hasInternalOpportunity);
    const topPerson = highFlightRisk[0];
    risks.push({
      id: 'flight-risk',
      level: flightRiskRate >= 0.06 ? 'critical' : 'warning',
      title: `${highFlightRisk.length} employee${highFlightRisk.length > 1 ? 's' : ''} flagged high flight risk by Revelio Labs`,
      detail: `${topPerson.person.name} (${topPerson.person.department}) has the strongest signal — ${topPerson.flightRiskDrivers[0] ?? 'multiple risk factors detected'}.${withOpportunity.length > 0 ? ` ${withOpportunity.length} also match an internal mobility opportunity.` : ''}`,
      metric: `${highFlightRisk.length} high risk · ${withOpportunity.length} internal match`,
      action: { view: 'pipeline', pipelineTab: 'flight-risk' },
      actionLabel: 'View flight risk',
      secondaryAction: withOpportunity.length > 0 ? { view: 'pipeline', pipelineTab: 'hidden-talent' } : undefined,
      secondaryLabel: withOpportunity.length > 0 ? 'Internal opportunities' : undefined,
      source: 'pipeline',
    });
  }

  // Attrition risk signal
  if (attritionScore.score >= 45) {
    risks.push({
      id: 'attrition-risk',
      level: attritionScore.score >= 70 ? 'critical' : 'warning',
      title: `Attrition risk: ${attritionScore.riskLabel} (${attritionScore.annualisedRate}% annualised)`,
      detail: attritionScore.headline,
      metric: `${attritionScore.competitorPct}% to competitors · ${attritionScore.compDrivenPct}% comp-driven`,
      action: { view: 'benchmark' },
      actionLabel: 'View talent flow',
      source: 'benchmark',
    });
  }

  // Sort: critical first, then warning
  risks.sort((a, b) => {
    const order = { critical: 0, warning: 1, healthy: 2 };
    return order[a.level] - order[b.level];
  });

  // ── Wins ───────────────────────────────────────────────────────────
  const wins: { title: string; detail: string; source: string }[] = [];

  if (totalNearReady > 0) {
    wins.push({
      title: `${totalNearReady} employee${totalNearReady > 1 ? 's' : ''} ready for promotion`,
      detail: `These individuals meet 90%+ of their next-level criteria and have the tenure to support it. Recognising them now protects retention.`,
      source: 'pipeline',
    });
  }

  if (topQuartileDepts.length > 0) {
    wins.push({
      title: `${topQuartileDepts.map(d => d.department).join(', ')} skill${topQuartileDepts.length > 1 ? 's' : ''} in top quartile vs industry`,
      detail: `These teams outperform the majority of similar-sized companies on skill competency — a competitive advantage worth highlighting in employer branding.`,
      source: 'benchmark',
    });
  }

  const topMgr = managerMetrics
    .filter(m => m.reports.length > 0)
    .sort((a, b) => {
      const sa = Math.round(a.avgReadiness * 0.4 + a.avgFrameworkCompletion * 0.3 + (1 - a.stalledCount / Math.max(a.reports.length, 1)) * 100 * 0.3);
      const sb = Math.round(b.avgReadiness * 0.4 + b.avgFrameworkCompletion * 0.3 + (1 - b.stalledCount / Math.max(b.reports.length, 1)) * 100 * 0.3);
      return sb - sa;
    })[0];

  if (topMgr) {
    wins.push({
      title: `${topMgr.manager.name} is the highest-rated manager`,
      detail: `With ${topMgr.nearReadyCount} near-ready reports and ${topMgr.stalledCount} stalled, ${topMgr.manager.name}'s approach to career development is a model to share across the org.`,
      source: 'managers',
    });
  }

  // ── Dept snapshots ─────────────────────────────────────────────────
  const deptSnapshots: DeptHealthSnapshot[] = (
    ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'] as Department[]
  ).map(dept => {
    const deptReadinessResults = allReadiness.filter(r => r.person.department === dept);
    const n = deptReadinessResults.length;
    const nearReady = deptReadinessResults.filter(r => r.readinessPct >= 90).length;
    const stalled = deptReadinessResults.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length;

    const deptSkillEntries = SKILLS_DATA.filter(e => e.department === dept);
    const totalHead = deptSkillEntries.reduce((s, e) => s + e.headcount, 0);
    const totalBelow = deptSkillEntries.reduce((s, e) => s + e.belowTarget, 0);
    const avgActual = totalHead > 0
      ? deptSkillEntries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / totalHead
      : 0;
    const criticalGapsCount = Array.from(new Set(
      deptSkillEntries.filter(e => (e.belowTarget / e.headcount) >= 0.7).map(e => e.skill)
    )).length;

    const benchPos = skillBenchmarks.find(b => b.department === dept)?.position ?? 'below-median';

    const deptManagers = managerMetrics.filter(m => m.manager.department === dept && m.reports.length > 0);
    const avgMgrScore = deptManagers.length > 0
      ? Math.round(deptManagers.reduce((s, m) => {
          const sp = m.reports.length > 0 ? (m.stalledCount / m.reports.length) * 100 : 0;
          return s + Math.round(m.avgReadiness * 0.4 + m.avgFrameworkCompletion * 0.3 + (100 - sp) * 0.3);
        }, 0) / deptManagers.length)
      : 0;

    // Dept score: blend of skills, readiness, benchmark, manager
    const benchScore = { top: 90, 'above-median': 70, 'below-median': 45, bottom: 20 }[benchPos];
    const avgReadiness = n > 0 ? deptReadinessResults.reduce((s, r) => s + r.readinessPct, 0) / n : 50;
    const skillScore = Math.round((avgActual / 5) * 100);
    const stallPenalty = n > 0 ? (stalled / n) * 100 : 0;
    const overallScore = Math.round(
      skillScore * 0.3 + avgReadiness * 0.3 + benchScore * 0.25 + Math.max(0, 100 - stallPenalty * 3) * 0.15
    );

    return {
      department: dept,
      color: DEPT_COLORS[dept],
      overallScore: Math.min(100, Math.max(5, overallScore)),
      scoreLabel: healthLabel(overallScore),
      skillCompetency: parseFloat(avgActual.toFixed(1)),
      nearReadyCount: nearReady,
      stalledCount: stalled,
      benchmarkPosition: benchPos,
      criticalSkillGaps: criticalGapsCount,
      avgManagerScore: avgMgrScore,
    };
  });

  // ── Check-in coverage ─────────────────────────────────────────────────
  const today = new Date('2026-04-29');
  const flaggedCheckIns: CheckInFlag[] = PEOPLE
    .map(p => {
      const last = new Date(p.lastCheckIn);
      const days = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return { person: p, daysSinceCheckIn: days };
    })
    .filter(f => f.daysSinceCheckIn > 30)
    .map(f => ({
      ...f,
      severity: f.daysSinceCheckIn >= 90 ? 'critical' as const : 'overdue' as const,
    }))
    .sort((a, b) => b.daysSinceCheckIn - a.daysSinceCheckIn);

  const overdueCheckIns = flaggedCheckIns.filter(f => f.severity === 'overdue').length;
  const criticalCheckIns = flaggedCheckIns.filter(f => f.severity === 'critical').length;
  const checkedInRecently = PEOPLE.length - flaggedCheckIns.length;
  const checkInCoverage = Math.round((checkedInRecently / PEOPLE.length) * 100);

  return {
    asOf: 'Apr 2026',
    orgHealthScore,
    orgHealthLabel: healthLabel(orgHealthScore),
    orgHealthColor: healthColor(orgHealthScore),
    totalHeadcount: PEOPLE.length,
    totalNearReady,
    totalStalled,
    criticalSkillGaps,
    peopleWithSkillGaps,
    managersNeedingSupport: managersNeedingSupport.length,
    benchmarkPosition: benchSummary.overallPosition,
    benchmarkRank: benchSummary.acmeRank,
    benchmarkTotal: benchSummary.totalCompanies,
    attritionScore,
    checkInCoverage,
    overdueCheckIns,
    criticalCheckIns,
    flaggedCheckIns,
    risks: risks.slice(0, 5),
    deptSnapshots,
    wins: wins.slice(0, 3),
  };
}
