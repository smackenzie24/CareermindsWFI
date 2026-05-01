import {
  PEOPLE,
  getAllReadiness,
  computeReadiness,
  LEVEL_DEFINITIONS,
  LEVEL_FRAMEWORKS,
  type Person,
  type ReadinessResult,
  DEPT_COLORS,
} from './promotionData';
import { type Department } from './mockData';

export interface Manager {
  id: string;
  name: string;
  title: string;
  department: Department;
  location: string;
  /** team names this manager owns */
  teams: string[];
  tenure: number; // months in role
}

export const MANAGERS: Manager[] = [
  // Engineering
  { id: 'mgr-e1', name: 'Alex Rivera', title: 'Engineering Manager', department: 'Engineering', location: 'London', teams: ['Platform', 'Frontend'], tenure: 30 },
  { id: 'mgr-e2', name: 'Nina Obi', title: 'Engineering Manager', department: 'Engineering', location: 'New York', teams: ['Backend'], tenure: 22 },
  { id: 'mgr-e3', name: 'Sven Holst', title: 'Engineering Manager', department: 'Engineering', location: 'Berlin', teams: ['Mobile', 'Infrastructure'], tenure: 18 },
  // Product
  { id: 'mgr-p1', name: 'Claire Zhou', title: 'Director of Product', department: 'Product', location: 'London', teams: ['Growth', 'Core'], tenure: 36 },
  { id: 'mgr-p2', name: 'James Osei', title: 'Senior PM', department: 'Product', location: 'Remote', teams: ['Partnerships'], tenure: 14 },
  // Design
  { id: 'mgr-d1', name: 'Mara Santos', title: 'Design Lead', department: 'Design', location: 'London', teams: ['Product Design', 'Brand', 'UX Research'], tenure: 28 },
  // Data
  { id: 'mgr-da1', name: 'Yoko Tanaka', title: 'Head of Data', department: 'Data', location: 'Singapore', teams: ['Analytics', 'ML & AI', 'Data Eng'], tenure: 24 },
  // Marketing
  { id: 'mgr-m1', name: 'Pierre Duval', title: 'VP Marketing', department: 'Marketing', location: 'London', teams: ['Performance', 'Brand', 'Content'], tenure: 20 },
  // Sales
  { id: 'mgr-s1', name: 'Keisha Brown', title: 'Sales Manager', department: 'Sales', location: 'London', teams: ['Enterprise'], tenure: 32 },
  { id: 'mgr-s2', name: 'Will Park', title: 'Sales Manager', department: 'Sales', location: 'New York', teams: ['Mid-Market', 'SMB'], tenure: 16 },
  // People Ops
  { id: 'mgr-hr1', name: 'Anya Reeves', title: 'Head of People', department: 'People Ops', location: 'London', teams: ['HR Business Partners', 'Talent', 'L&D'], tenure: 42 },
];

export interface ManagerMetrics {
  manager: Manager;
  reports: Person[];
  readinessResults: ReadinessResult[];
  // Velocity: average readiness % across direct reports
  avgReadiness: number;
  // How many are near-ready (≥90%)
  nearReadyCount: number;
  // How many are progressing (70–89%)
  progressingCount: number;
  // Avg tenure of reports in current level (lower = faster movement potentially, higher = stalling)
  avgTenure: number;
  // Framework completion: avg % of framework criteria met across reports
  avgFrameworkCompletion: number;
  // Reports with ≥1 skill gap blocking promotion
  blockedCount: number;
  // Most common blocking skill across the team
  topBlockingSkill: string;
  topBlockingSkillCount: number;
  // Promotion velocity signal: reports promoted (simulated as near-ready who have high tenure)
  promotionReadyCount: number;
  // Stall signal: reports with tenure > 24m and readiness < 50%
  stalledCount: number;
  // Skills covered well: criteria where avg team rating ≥ required
  strongSkillCount: number;
  totalSkillCriteria: number;
  // Trend indicator (simulated): positive, neutral, negative
  trend: 'up' | 'flat' | 'down';
  trendLabel: string;
}

function getFrameworkForPerson(person: Person) {
  const currentLevel = LEVEL_DEFINITIONS.find(l => l.id === person.currentLevelId);
  if (!currentLevel?.nextLevel) return null;
  const nextLevel = LEVEL_DEFINITIONS.find(l => l.id === currentLevel.nextLevel);
  if (!nextLevel) return null;
  const framework = LEVEL_FRAMEWORKS.find(f => f.levelId === nextLevel.id);
  if (!framework) return null;
  return { framework, nextLevel };
}

export function computeManagerMetrics(manager: Manager): ManagerMetrics {
  // Reports: people on this manager's teams in this department
  const reports = PEOPLE.filter(
    p => p.department === manager.department && manager.teams.includes(p.team)
  );

  // Compute readiness for each report
  const readinessResults: ReadinessResult[] = [];
  for (const person of reports) {
    const fw = getFrameworkForPerson(person);
    if (!fw) continue;
    readinessResults.push(computeReadiness(person, fw.framework, fw.nextLevel.label));
  }

  const n = readinessResults.length;
  const avgReadiness = n > 0
    ? Math.round(readinessResults.reduce((s, r) => s + r.readinessPct, 0) / n)
    : 0;

  const nearReadyCount = readinessResults.filter(r => r.readinessPct >= 90).length;
  const progressingCount = readinessResults.filter(r => r.readinessPct >= 70 && r.readinessPct < 90).length;

  const avgTenure = reports.length > 0
    ? Math.round(reports.reduce((s, p) => s + p.tenure, 0) / reports.length)
    : 0;

  // Framework completion: average % of criteria met per person
  const avgFrameworkCompletion = n > 0
    ? Math.round(
        readinessResults.reduce((s, r) => s + (r.criteriaMet / r.criteriaTotal) * 100, 0) / n
      )
    : 0;

  const blockedCount = readinessResults.filter(r => r.gapSkills.length > 0).length;

  // Top blocking skill across all reports
  const blockingMap = new Map<string, number>();
  for (const r of readinessResults) {
    for (const gap of r.gapSkills) {
      blockingMap.set(gap.skillName, (blockingMap.get(gap.skillName) ?? 0) + 1);
    }
  }
  let topBlockingSkill = '—';
  let topBlockingSkillCount = 0;
  for (const [skill, count] of blockingMap.entries()) {
    if (count > topBlockingSkillCount) { topBlockingSkillCount = count; topBlockingSkill = skill; }
  }

  const promotionReadyCount = readinessResults.filter(r => r.readinessPct >= 90 && r.person.tenure >= 18).length;
  const stalledCount = readinessResults.filter(r => r.person.tenure > 24 && r.readinessPct < 50).length;

  // Strong skills: criteria where the team's avg actual rating meets the requirement
  let strongSkillCount = 0;
  let totalSkillCriteria = 0;
  // Aggregate across all unique criteria in this manager's team frameworks
  const criteriaMap = new Map<string, { required: number; actuals: number[] }>();
  for (const r of readinessResults) {
    for (const criterion of [...r.metSkills, ...r.gapSkills]) {
      if (!criteriaMap.has(criterion.skillId)) {
        criteriaMap.set(criterion.skillId, { required: criterion.requiredRating, actuals: [] });
      }
      const actual = r.person.skills[criterion.skillId] ?? 0;
      criteriaMap.get(criterion.skillId)!.actuals.push(actual);
    }
  }
  for (const { required, actuals } of criteriaMap.values()) {
    totalSkillCriteria++;
    const avg = actuals.length > 0 ? actuals.reduce((s, a) => s + a, 0) / actuals.length : 0;
    if (avg >= required) strongSkillCount++;
  }

  // Trend: simulate based on avg readiness vs stall ratio
  const stallRatio = reports.length > 0 ? stalledCount / reports.length : 0;
  let trend: 'up' | 'flat' | 'down';
  let trendLabel: string;
  if (avgReadiness >= 70 && stallRatio < 0.15) {
    trend = 'up';
    trendLabel = 'Team growing fast';
  } else if (stallRatio > 0.3 || avgReadiness < 45) {
    trend = 'down';
    trendLabel = 'Several reports stalled';
  } else {
    trend = 'flat';
    trendLabel = 'Steady progress';
  }

  return {
    manager,
    reports,
    readinessResults,
    avgReadiness,
    nearReadyCount,
    progressingCount,
    avgTenure,
    avgFrameworkCompletion,
    blockedCount,
    topBlockingSkill,
    topBlockingSkillCount,
    promotionReadyCount,
    stalledCount,
    strongSkillCount,
    totalSkillCriteria,
    trend,
    trendLabel,
  };
}

export function getAllManagerMetrics(): ManagerMetrics[] {
  return MANAGERS.map(computeManagerMetrics);
}

export { DEPT_COLORS };
