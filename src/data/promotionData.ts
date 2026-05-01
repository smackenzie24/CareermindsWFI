import { DEPT_COLORS, type Department } from './mockData';

export type CareerTrack = 'IC' | 'Manager';

export interface LevelDefinition {
  id: string;
  label: string; // e.g. "IC2 – Mid Engineer"
  shortLabel: string; // e.g. "IC2"
  track: CareerTrack;
  department: Department;
  nextLevel: string | null; // id of next level
}

export interface SkillCriterion {
  skillId: string;
  skillName: string;
  category: string;
  requiredRating: number; // 1–5
}

export interface LevelFramework {
  levelId: string;
  criteria: SkillCriterion[];
}

export interface Person {
  id: string;
  name: string;
  department: Department;
  team: string;
  location: string;
  currentLevelId: string;
  skills: Record<string, number>; // skillId -> actual rating 1–5
  tenure: number; // months in current level
  lastCheckIn: string; // ISO date string of most recent check-in
}

// ── Level definitions ──────────────────────────────────────────────────

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  // Engineering IC
  { id: 'eng-ic1', label: 'IC1 · Junior Engineer', shortLabel: 'IC1', track: 'IC', department: 'Engineering', nextLevel: 'eng-ic2' },
  { id: 'eng-ic2', label: 'IC2 · Mid Engineer', shortLabel: 'IC2', track: 'IC', department: 'Engineering', nextLevel: 'eng-ic3' },
  { id: 'eng-ic3', label: 'IC3 · Senior Engineer', shortLabel: 'IC3', track: 'IC', department: 'Engineering', nextLevel: 'eng-ic4' },
  { id: 'eng-ic4', label: 'IC4 · Staff Engineer', shortLabel: 'IC4', track: 'IC', department: 'Engineering', nextLevel: null },
  // Engineering Manager
  { id: 'eng-m1', label: 'M1 · Engineering Manager', shortLabel: 'M1', track: 'Manager', department: 'Engineering', nextLevel: 'eng-m2' },
  { id: 'eng-m2', label: 'M2 · Senior EM', shortLabel: 'M2', track: 'Manager', department: 'Engineering', nextLevel: null },
  // Product
  { id: 'prod-ic1', label: 'IC1 · Associate PM', shortLabel: 'IC1', track: 'IC', department: 'Product', nextLevel: 'prod-ic2' },
  { id: 'prod-ic2', label: 'IC2 · PM', shortLabel: 'IC2', track: 'IC', department: 'Product', nextLevel: 'prod-ic3' },
  { id: 'prod-ic3', label: 'IC3 · Senior PM', shortLabel: 'IC3', track: 'IC', department: 'Product', nextLevel: 'prod-ic4' },
  { id: 'prod-ic4', label: 'IC4 · Principal PM', shortLabel: 'IC4', track: 'IC', department: 'Product', nextLevel: null },
  // Design
  { id: 'des-ic1', label: 'IC1 · Junior Designer', shortLabel: 'IC1', track: 'IC', department: 'Design', nextLevel: 'des-ic2' },
  { id: 'des-ic2', label: 'IC2 · Designer', shortLabel: 'IC2', track: 'IC', department: 'Design', nextLevel: 'des-ic3' },
  { id: 'des-ic3', label: 'IC3 · Senior Designer', shortLabel: 'IC3', track: 'IC', department: 'Design', nextLevel: null },
  // Data
  { id: 'dat-ic1', label: 'IC1 · Data Analyst', shortLabel: 'IC1', track: 'IC', department: 'Data', nextLevel: 'dat-ic2' },
  { id: 'dat-ic2', label: 'IC2 · Data Scientist', shortLabel: 'IC2', track: 'IC', department: 'Data', nextLevel: 'dat-ic3' },
  { id: 'dat-ic3', label: 'IC3 · Senior Data Scientist', shortLabel: 'IC3', track: 'IC', department: 'Data', nextLevel: null },
  // Marketing
  { id: 'mkt-ic1', label: 'IC1 · Marketing Coordinator', shortLabel: 'IC1', track: 'IC', department: 'Marketing', nextLevel: 'mkt-ic2' },
  { id: 'mkt-ic2', label: 'IC2 · Marketing Manager', shortLabel: 'IC2', track: 'IC', department: 'Marketing', nextLevel: 'mkt-ic3' },
  { id: 'mkt-ic3', label: 'IC3 · Senior Marketing Manager', shortLabel: 'IC3', track: 'IC', department: 'Marketing', nextLevel: null },
  // Sales
  { id: 'sal-ic1', label: 'IC1 · SDR', shortLabel: 'IC1', track: 'IC', department: 'Sales', nextLevel: 'sal-ic2' },
  { id: 'sal-ic2', label: 'IC2 · Account Executive', shortLabel: 'IC2', track: 'IC', department: 'Sales', nextLevel: 'sal-ic3' },
  { id: 'sal-ic3', label: 'IC3 · Senior AE', shortLabel: 'IC3', track: 'IC', department: 'Sales', nextLevel: null },
  // People Ops
  { id: 'ppl-ic1', label: 'IC1 · HR Coordinator', shortLabel: 'IC1', track: 'IC', department: 'People Ops', nextLevel: 'ppl-ic2' },
  { id: 'ppl-ic2', label: 'IC2 · HRBP', shortLabel: 'IC2', track: 'IC', department: 'People Ops', nextLevel: 'ppl-m1' },
  { id: 'ppl-m1', label: 'M1 · Head of People', shortLabel: 'M1', track: 'Manager', department: 'People Ops', nextLevel: null },
];

// ── Level frameworks (skills + required ratings to reach that level) ───

export const LEVEL_FRAMEWORKS: LevelFramework[] = [
  // To reach IC2 in Engineering
  {
    levelId: 'eng-ic2',
    criteria: [
      { skillId: 'code-review', skillName: 'Code Review', category: 'Quality', requiredRating: 3 },
      { skillId: 'testing', skillName: 'Testing & QA', category: 'Quality', requiredRating: 3 },
      { skillId: 'documentation', skillName: 'Documentation', category: 'Quality', requiredRating: 3 },
      { skillId: 'cicd', skillName: 'CI/CD & DevOps', category: 'Operations', requiredRating: 2 },
      { skillId: 'written-comms', skillName: 'Written Communication', category: 'Collaboration', requiredRating: 3 },
    ],
  },
  // To reach IC3 in Engineering
  {
    levelId: 'eng-ic3',
    criteria: [
      { skillId: 'system-design', skillName: 'System Design', category: 'Architecture', requiredRating: 3 },
      { skillId: 'code-review', skillName: 'Code Review', category: 'Quality', requiredRating: 4 },
      { skillId: 'security', skillName: 'Security Practices', category: 'Security', requiredRating: 3 },
      { skillId: 'cicd', skillName: 'CI/CD & DevOps', category: 'Operations', requiredRating: 3 },
      { skillId: 'perf-opt', skillName: 'Performance Optimisation', category: 'Quality', requiredRating: 3 },
      { skillId: 'api-design', skillName: 'API Design', category: 'Architecture', requiredRating: 3 },
      { skillId: 'mentoring', skillName: 'Technical Mentoring', category: 'Leadership', requiredRating: 2 },
      { skillId: 'cross-team', skillName: 'Cross-team Communication', category: 'Collaboration', requiredRating: 3 },
    ],
  },
  // To reach IC4 in Engineering
  {
    levelId: 'eng-ic4',
    criteria: [
      { skillId: 'system-design', skillName: 'System Design', category: 'Architecture', requiredRating: 5 },
      { skillId: 'code-review', skillName: 'Code Review', category: 'Quality', requiredRating: 5 },
      { skillId: 'security', skillName: 'Security Practices', category: 'Security', requiredRating: 4 },
      { skillId: 'cicd', skillName: 'CI/CD & DevOps', category: 'Operations', requiredRating: 4 },
      { skillId: 'perf-opt', skillName: 'Performance Optimisation', category: 'Quality', requiredRating: 4 },
      { skillId: 'api-design', skillName: 'API Design', category: 'Architecture', requiredRating: 4 },
      { skillId: 'mentoring', skillName: 'Technical Mentoring', category: 'Leadership', requiredRating: 4 },
      { skillId: 'cross-team', skillName: 'Cross-team Communication', category: 'Collaboration', requiredRating: 4 },
      { skillId: 'incident', skillName: 'Incident Response', category: 'Operations', requiredRating: 4 },
      { skillId: 'observability', skillName: 'Observability & Monitoring', category: 'Operations', requiredRating: 4 },
    ],
  },
  // To reach IC3 in Product
  {
    levelId: 'prod-ic3',
    criteria: [
      { skillId: 'stakeholder', skillName: 'Stakeholder Management', category: 'Influence', requiredRating: 3 },
      { skillId: 'roadmap', skillName: 'Roadmap Planning', category: 'Strategy', requiredRating: 3 },
      { skillId: 'data-analysis', skillName: 'Data Analysis', category: 'Analytical', requiredRating: 3 },
      { skillId: 'prioritisation', skillName: 'Prioritisation Frameworks', category: 'Strategy', requiredRating: 4 },
      { skillId: 'user-research', skillName: 'User Research', category: 'Discovery', requiredRating: 3 },
      { skillId: 'metrics', skillName: 'Metrics & KPIs', category: 'Analytical', requiredRating: 3 },
      { skillId: 'okr', skillName: 'OKR Setting', category: 'Delivery', requiredRating: 3 },
    ],
  },
  // To reach IC4 in Product
  {
    levelId: 'prod-ic4',
    criteria: [
      { skillId: 'stakeholder', skillName: 'Stakeholder Management', category: 'Influence', requiredRating: 5 },
      { skillId: 'roadmap', skillName: 'Roadmap Planning', category: 'Strategy', requiredRating: 5 },
      { skillId: 'data-analysis', skillName: 'Data Analysis', category: 'Analytical', requiredRating: 4 },
      { skillId: 'prioritisation', skillName: 'Prioritisation Frameworks', category: 'Strategy', requiredRating: 5 },
      { skillId: 'gtm', skillName: 'Go-to-Market', category: 'Strategy', requiredRating: 4 },
      { skillId: 'written-comms', skillName: 'Written Communication', category: 'Collaboration', requiredRating: 4 },
      { skillId: 'competitive', skillName: 'Competitive Analysis', category: 'Discovery', requiredRating: 4 },
    ],
  },
  // To reach IC3 in Design
  {
    levelId: 'des-ic3',
    criteria: [
      { skillId: 'design-systems', skillName: 'Design Systems', category: 'Craft', requiredRating: 4 },
      { skillId: 'interaction', skillName: 'Interaction Design', category: 'Craft', requiredRating: 4 },
      { skillId: 'user-research', skillName: 'User Research', category: 'Research', requiredRating: 3 },
      { skillId: 'accessibility', skillName: 'Accessibility', category: 'Quality', requiredRating: 3 },
      { skillId: 'visual-comms', skillName: 'Visual Communication', category: 'Craft', requiredRating: 4 },
      { skillId: 'design-critique', skillName: 'Design Critique', category: 'Collaboration', requiredRating: 3 },
    ],
  },
  // To reach IC3 in Data
  {
    levelId: 'dat-ic3',
    criteria: [
      { skillId: 'ml-deploy', skillName: 'ML Model Deployment', category: 'MLOps', requiredRating: 3 },
      { skillId: 'sql', skillName: 'SQL & Query Optimisation', category: 'Technical', requiredRating: 4 },
      { skillId: 'feature-eng', skillName: 'Feature Engineering', category: 'MLOps', requiredRating: 3 },
      { skillId: 'stats', skillName: 'Statistical Analysis', category: 'Analytical', requiredRating: 4 },
      { skillId: 'data-storytelling', skillName: 'Data Storytelling', category: 'Communication', requiredRating: 3 },
      { skillId: 'experiment', skillName: 'Experiment Design (A/B)', category: 'Analytical', requiredRating: 3 },
      { skillId: 'data-governance', skillName: 'Data Governance', category: 'Operations', requiredRating: 3 },
    ],
  },
  // To reach IC3 in Marketing
  {
    levelId: 'mkt-ic3',
    criteria: [
      { skillId: 'campaign-attr', skillName: 'Campaign Attribution', category: 'Analytics', requiredRating: 4 },
      { skillId: 'mkt-analytics', skillName: 'Marketing Analytics', category: 'Analytics', requiredRating: 4 },
      { skillId: 'brand-strategy', skillName: 'Brand Strategy', category: 'Communication', requiredRating: 4 },
      { skillId: 'conversion', skillName: 'Conversion Optimisation', category: 'Analytics', requiredRating: 3 },
      { skillId: 'seo', skillName: 'SEO Strategy', category: 'Digital', requiredRating: 3 },
    ],
  },
  // To reach IC3 in Sales
  {
    levelId: 'sal-ic3',
    criteria: [
      { skillId: 'negotiation', skillName: 'Enterprise Negotiation', category: 'Closing', requiredRating: 4 },
      { skillId: 'demo', skillName: 'Demo & Storytelling', category: 'Closing', requiredRating: 4 },
      { skillId: 'account-mgmt', skillName: 'Account Management', category: 'Retention', requiredRating: 4 },
      { skillId: 'forecasting', skillName: 'Sales Forecasting', category: 'Operations', requiredRating: 3 },
      { skillId: 'executive', skillName: 'Executive Engagement', category: 'Influence', requiredRating: 3 },
    ],
  },
  // To reach M1 in People Ops
  {
    levelId: 'ppl-m1',
    criteria: [
      { skillId: 'comp-bench', skillName: 'Compensation Benchmarking', category: 'Total Rewards', requiredRating: 4 },
      { skillId: 'org-design', skillName: 'Organisational Design', category: 'Strategy', requiredRating: 3 },
      { skillId: 'change-mgmt', skillName: 'Change Management', category: 'Strategy', requiredRating: 3 },
      { skillId: 'dei', skillName: 'DEI Strategy', category: 'Culture', requiredRating: 3 },
      { skillId: 'hr-analytics', skillName: 'HR Analytics', category: 'Analytical', requiredRating: 3 },
      { skillId: 'perf-frameworks', skillName: 'Performance Frameworks', category: 'Strategy', requiredRating: 4 },
    ],
  },
];

// ── People ─────────────────────────────────────────────────────────────

export const PEOPLE: Person[] = [
  // ── Engineering IC3 → IC4 candidates ──────────────────────────────
  { id: 'e1', name: 'Priya Sharma', department: 'Engineering', team: 'Platform', location: 'London', currentLevelId: 'eng-ic3', tenure: 24, lastCheckIn: '2026-04-18', skills: { 'system-design': 4, 'code-review': 5, 'security': 3, 'cicd': 4, 'perf-opt': 4, 'api-design': 4, 'mentoring': 4, 'cross-team': 4, 'incident': 4, 'observability': 3 } },
  { id: 'e2', name: 'James Okafor', department: 'Engineering', team: 'Platform', location: 'London', currentLevelId: 'eng-ic3', tenure: 18, lastCheckIn: '2026-04-10', skills: { 'system-design': 4, 'code-review': 4, 'security': 3, 'cicd': 4, 'perf-opt': 3, 'api-design': 4, 'mentoring': 3, 'cross-team': 4, 'incident': 4, 'observability': 3 } },
  { id: 'e3', name: 'Lena Fischer', department: 'Engineering', team: 'Backend', location: 'New York', currentLevelId: 'eng-ic3', tenure: 30, lastCheckIn: '2026-04-22', skills: { 'system-design': 5, 'code-review': 5, 'security': 4, 'cicd': 4, 'perf-opt': 5, 'api-design': 5, 'mentoring': 4, 'cross-team': 4, 'incident': 5, 'observability': 4 } },
  { id: 'e4', name: 'Marcus Thompson', department: 'Engineering', team: 'Backend', location: 'New York', currentLevelId: 'eng-ic3', tenure: 14, lastCheckIn: '2026-01-15', skills: { 'system-design': 3, 'code-review': 4, 'security': 2, 'cicd': 3, 'perf-opt': 3, 'api-design': 3, 'mentoring': 2, 'cross-team': 3, 'incident': 3, 'observability': 2 } },
  { id: 'e5', name: 'Lars Eriksson', department: 'Engineering', team: 'Mobile', location: 'Berlin', currentLevelId: 'eng-ic3', tenure: 22, lastCheckIn: '2026-04-05', skills: { 'system-design': 4, 'code-review': 4, 'security': 3, 'cicd': 4, 'perf-opt': 4, 'api-design': 3, 'mentoring': 3, 'cross-team': 4, 'incident': 3, 'observability': 3 } },
  { id: 'e6', name: 'Mei Chen', department: 'Engineering', team: 'Platform', location: 'Remote', currentLevelId: 'eng-ic3', tenure: 16, lastCheckIn: '2026-02-28', skills: { 'system-design': 3, 'code-review': 4, 'security': 2, 'cicd': 3, 'perf-opt': 3, 'api-design': 3, 'mentoring': 2, 'cross-team': 3, 'incident': 3, 'observability': 2 } },
  { id: 'e7', name: 'Aisha Banerjee', department: 'Engineering', team: 'Frontend', location: 'New York', currentLevelId: 'eng-ic3', tenure: 20, lastCheckIn: '2026-04-20', skills: { 'system-design': 4, 'code-review': 4, 'security': 3, 'cicd': 4, 'perf-opt': 3, 'api-design': 3, 'mentoring': 3, 'cross-team': 4, 'incident': 3, 'observability': 3 } },
  { id: 'e8', name: 'Carlos Mendez', department: 'Engineering', team: 'Frontend', location: 'London', currentLevelId: 'eng-ic3', tenure: 12, lastCheckIn: '2026-03-10', skills: { 'system-design': 2, 'code-review': 3, 'security': 2, 'cicd': 3, 'perf-opt': 2, 'api-design': 2, 'mentoring': 2, 'cross-team': 3, 'incident': 2, 'observability': 2 } },
  // Engineering IC2 → IC3
  { id: 'e9', name: 'Arjun Patel', department: 'Engineering', team: 'Platform', location: 'Singapore', currentLevelId: 'eng-ic2', tenure: 18, lastCheckIn: '2026-04-14', skills: { 'system-design': 2, 'code-review': 3, 'security': 2, 'cicd': 3, 'perf-opt': 2, 'api-design': 3, 'mentoring': 2, 'cross-team': 3, 'incident': 3, 'observability': 2 } },
  { id: 'e10', name: 'Sofia Rossi', department: 'Engineering', team: 'Platform', location: 'London', currentLevelId: 'eng-ic2', tenure: 12, lastCheckIn: '2026-04-25', skills: { 'system-design': 3, 'code-review': 3, 'security': 2, 'cicd': 2, 'perf-opt': 2, 'api-design': 3, 'mentoring': 1, 'cross-team': 3, 'incident': 2, 'observability': 2 } },
  { id: 'e11', name: 'Priya Nair', department: 'Engineering', team: 'Backend', location: 'New York', currentLevelId: 'eng-ic2', tenure: 20, lastCheckIn: '2026-03-02', skills: { 'system-design': 3, 'code-review': 4, 'security': 3, 'cicd': 3, 'perf-opt': 3, 'api-design': 3, 'mentoring': 2, 'cross-team': 4, 'incident': 3, 'observability': 3 } },
  { id: 'e12', name: 'Oliver Schmidt', department: 'Engineering', team: 'Frontend', location: 'Berlin', currentLevelId: 'eng-ic2', tenure: 8, lastCheckIn: '2026-04-01', skills: { 'system-design': 1, 'code-review': 3, 'security': 1, 'cicd': 2, 'perf-opt': 2, 'api-design': 2, 'mentoring': 1, 'cross-team': 2, 'incident': 2, 'observability': 1 } },
  { id: 'e13', name: 'Amara Diallo', department: 'Engineering', team: 'Mobile', location: 'Singapore', currentLevelId: 'eng-ic2', tenure: 15, lastCheckIn: '2026-04-17', skills: { 'system-design': 3, 'code-review': 3, 'security': 2, 'cicd': 3, 'perf-opt': 2, 'api-design': 3, 'mentoring': 2, 'cross-team': 3, 'incident': 3, 'observability': 2 } },

  // ── Product IC2 → IC3 ──────────────────────────────────────────────
  { id: 'p1', name: 'Sarah Kim', department: 'Product', team: 'Growth', location: 'London', currentLevelId: 'prod-ic2', tenure: 22, lastCheckIn: '2026-04-21', skills: { 'stakeholder': 4, 'roadmap': 4, 'data-analysis': 4, 'prioritisation': 4, 'user-research': 3, 'metrics': 4, 'okr': 3, 'gtm': 3, 'written-comms': 4, 'competitive': 3 } },
  { id: 'p2', name: 'Ben Adeyemi', department: 'Product', team: 'Core', location: 'London', currentLevelId: 'prod-ic2', tenure: 18, lastCheckIn: '2026-02-14', skills: { 'stakeholder': 3, 'roadmap': 3, 'data-analysis': 3, 'prioritisation': 3, 'user-research': 3, 'metrics': 3, 'okr': 3, 'gtm': 2, 'written-comms': 4, 'competitive': 2 } },
  { id: 'p3', name: 'David Park', department: 'Product', team: 'Growth', location: 'New York', currentLevelId: 'prod-ic2', tenure: 10, lastCheckIn: '2026-04-08', skills: { 'stakeholder': 2, 'roadmap': 2, 'data-analysis': 2, 'prioritisation': 2, 'user-research': 2, 'metrics': 2, 'okr': 2, 'gtm': 2, 'written-comms': 3, 'competitive': 2 } },
  { id: 'p4', name: 'Fatima Hassan', department: 'Product', team: 'Core', location: 'Berlin', currentLevelId: 'prod-ic2', tenure: 14, lastCheckIn: '2026-04-23', skills: { 'stakeholder': 3, 'roadmap': 3, 'data-analysis': 3, 'prioritisation': 3, 'user-research': 2, 'metrics': 2, 'okr': 3, 'gtm': 2, 'written-comms': 3, 'competitive': 2 } },
  // Product IC3 → IC4
  { id: 'p5', name: 'Emma Clarke', department: 'Product', team: 'Growth', location: 'Remote', currentLevelId: 'prod-ic3', tenure: 28, lastCheckIn: '2026-01-30', skills: { 'stakeholder': 5, 'roadmap': 4, 'data-analysis': 4, 'prioritisation': 5, 'gtm': 4, 'written-comms': 4, 'competitive': 4 } },
  { id: 'p6', name: 'Yusuf Ali', department: 'Product', team: 'Core', location: 'London', currentLevelId: 'prod-ic3', tenure: 16, lastCheckIn: '2026-04-16', skills: { 'stakeholder': 3, 'roadmap': 3, 'data-analysis': 3, 'prioritisation': 4, 'gtm': 3, 'written-comms': 3, 'competitive': 3 } },

  // ── Design IC2 → IC3 ──────────────────────────────────────────────
  { id: 'd1', name: 'Zara Ahmed', department: 'Design', team: 'Product Design', location: 'London', currentLevelId: 'des-ic2', tenure: 20, lastCheckIn: '2026-04-19', skills: { 'design-systems': 4, 'interaction': 4, 'user-research': 3, 'accessibility': 3, 'visual-comms': 4, 'design-critique': 3 } },
  { id: 'd2', name: 'Ivan Petrov', department: 'Design', team: 'Brand', location: 'Berlin', currentLevelId: 'des-ic2', tenure: 14, lastCheckIn: '2026-03-22', skills: { 'design-systems': 3, 'interaction': 3, 'user-research': 2, 'accessibility': 2, 'visual-comms': 4, 'design-critique': 3 } },
  { id: 'd3', name: 'Yuki Nakamura', department: 'Design', team: 'Product Design', location: 'Singapore', currentLevelId: 'des-ic2', tenure: 10, lastCheckIn: '2026-04-11', skills: { 'design-systems': 2, 'interaction': 3, 'user-research': 2, 'accessibility': 1, 'visual-comms': 3, 'design-critique': 2 } },
  { id: 'd4', name: 'Kwame Mensah', department: 'Design', team: 'Brand', location: 'Remote', currentLevelId: 'des-ic2', tenure: 18, lastCheckIn: '2026-02-05', skills: { 'design-systems': 4, 'interaction': 3, 'user-research': 3, 'accessibility': 2, 'visual-comms': 4, 'design-critique': 3 } },

  // ── Data IC2 → IC3 ──────────────────────────────────────────────
  { id: 'da1', name: 'Hana Johansson', department: 'Data', team: 'Analytics', location: 'London', currentLevelId: 'dat-ic2', tenure: 24, lastCheckIn: '2026-04-26', skills: { 'ml-deploy': 3, 'sql': 4, 'feature-eng': 3, 'stats': 4, 'data-storytelling': 3, 'experiment': 3, 'data-governance': 3 } },
  { id: 'da2', name: 'Raj Krishnamurthy', department: 'Data', team: 'ML & AI', location: 'Singapore', currentLevelId: 'dat-ic2', tenure: 18, lastCheckIn: '2026-03-15', skills: { 'ml-deploy': 3, 'sql': 3, 'feature-eng': 3, 'stats': 4, 'data-storytelling': 2, 'experiment': 3, 'data-governance': 2 } },
  { id: 'da3', name: 'Ana Lima', department: 'Data', team: 'Analytics', location: 'New York', currentLevelId: 'dat-ic2', tenure: 12, lastCheckIn: '2026-04-27', skills: { 'ml-deploy': 2, 'sql': 4, 'feature-eng': 2, 'stats': 3, 'data-storytelling': 3, 'experiment': 2, 'data-governance': 2 } },
  { id: 'da4', name: 'Luis Garcia', department: 'Data', team: 'ML & AI', location: 'Remote', currentLevelId: 'dat-ic2', tenure: 20, lastCheckIn: '2026-01-20', skills: { 'ml-deploy': 4, 'sql': 4, 'feature-eng': 4, 'stats': 4, 'data-storytelling': 3, 'experiment': 3, 'data-governance': 3 } },
  { id: 'da5', name: 'Nina Volkov', department: 'Data', team: 'Analytics', location: 'Berlin', currentLevelId: 'dat-ic2', tenure: 8, lastCheckIn: '2026-04-03', skills: { 'ml-deploy': 1, 'sql': 3, 'feature-eng': 1, 'stats': 3, 'data-storytelling': 2, 'experiment': 2, 'data-governance': 1 } },

  // ── Marketing IC2 → IC3 ─────────────────────────────────────────
  { id: 'm1', name: 'Chloe Martin', department: 'Marketing', team: 'Performance', location: 'London', currentLevelId: 'mkt-ic2', tenure: 18, lastCheckIn: '2026-04-24', skills: { 'campaign-attr': 4, 'mkt-analytics': 3, 'brand-strategy': 3, 'conversion': 3, 'seo': 3 } },
  { id: 'm2', name: 'Tom Bradley', department: 'Marketing', team: 'Brand', location: 'New York', currentLevelId: 'mkt-ic2', tenure: 22, lastCheckIn: '2026-02-20', skills: { 'campaign-attr': 3, 'mkt-analytics': 3, 'brand-strategy': 4, 'conversion': 2, 'seo': 3 } },
  { id: 'm3', name: 'Isabelle Dupont', department: 'Marketing', team: 'Content', location: 'Remote', currentLevelId: 'mkt-ic2', tenure: 10, lastCheckIn: '2026-04-12', skills: { 'campaign-attr': 2, 'mkt-analytics': 2, 'brand-strategy': 3, 'conversion': 2, 'seo': 4 } },

  // ── Sales IC2 → IC3 ─────────────────────────────────────────────
  { id: 's1', name: 'Rachel Green', department: 'Sales', team: 'Enterprise', location: 'London', currentLevelId: 'sal-ic2', tenure: 20, lastCheckIn: '2026-04-28', skills: { 'negotiation': 4, 'demo': 4, 'account-mgmt': 4, 'forecasting': 3, 'executive': 3 } },
  { id: 's2', name: 'Dan Torres', department: 'Sales', team: 'SMB', location: 'New York', currentLevelId: 'sal-ic2', tenure: 14, lastCheckIn: '2026-03-30', skills: { 'negotiation': 3, 'demo': 3, 'account-mgmt': 3, 'forecasting': 3, 'executive': 2 } },
  { id: 's3', name: 'Sam Wilson', department: 'Sales', team: 'Enterprise', location: 'Singapore', currentLevelId: 'sal-ic2', tenure: 16, lastCheckIn: '2026-04-15', skills: { 'negotiation': 4, 'demo': 4, 'account-mgmt': 3, 'forecasting': 4, 'executive': 3 } },
  { id: 's4', name: 'Lila Osei', department: 'Sales', team: 'SMB', location: 'Remote', currentLevelId: 'sal-ic2', tenure: 8, lastCheckIn: '2026-02-10', skills: { 'negotiation': 2, 'demo': 3, 'account-mgmt': 2, 'forecasting': 2, 'executive': 1 } },

  // ── People Ops IC2 → M1 ─────────────────────────────────────────
  { id: 'hr1', name: 'Talia Moore', department: 'People Ops', team: 'HR Business Partners', location: 'London', currentLevelId: 'ppl-ic2', tenure: 26, lastCheckIn: '2026-04-29', skills: { 'comp-bench': 4, 'org-design': 3, 'change-mgmt': 3, 'dei': 4, 'hr-analytics': 3, 'perf-frameworks': 4 } },
  { id: 'hr2', name: 'Oscar Flynn', department: 'People Ops', team: 'L&D', location: 'London', currentLevelId: 'ppl-ic2', tenure: 14, lastCheckIn: '2026-03-05', skills: { 'comp-bench': 3, 'org-design': 2, 'change-mgmt': 2, 'dei': 3, 'hr-analytics': 2, 'perf-frameworks': 3 } },
];

// ── Computed helpers ────────────────────────────────────────────────────

export interface ReadinessResult {
  person: Person;
  targetLevelId: string;
  targetLevelLabel: string;
  criteriaTotal: number;
  criteriaMet: number;
  readinessPct: number; // 0–100
  metSkills: SkillCriterion[];
  gapSkills: Array<SkillCriterion & { actualRating: number; gap: number }>;
}

export type ReadinessTier = 'near-ready' | 'progressing' | 'developing' | 'early';

export function getReadinessTier(pct: number): ReadinessTier {
  if (pct >= 90) return 'near-ready';
  if (pct >= 70) return 'progressing';
  if (pct >= 50) return 'developing';
  return 'early';
}

export const TIER_RANGES: Record<ReadinessTier, string> = {
  'near-ready': '90%+',
  'progressing': '70–89%',
  'developing': '50–69%',
  'early': '<50%',
};

export function groupByTier(results: ReadinessResult[]): Record<ReadinessTier, number> {
  const counts: Record<ReadinessTier, number> = { 'near-ready': 0, 'progressing': 0, 'developing': 0, 'early': 0 };
  for (const r of results) counts[getReadinessTier(r.readinessPct)]++;
  return counts;
}

export const TIER_CONFIG: Record<ReadinessTier, { label: string; color: string; bg: string; border: string; badge: string; barColor: string }> = {
  'near-ready': { label: 'Near Ready', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', barColor: 'bg-emerald-500' },
  'progressing': { label: 'Progressing', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800', barColor: 'bg-sky-500' },
  'developing': { label: 'Developing', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', barColor: 'bg-amber-400' },
  'early': { label: 'Early Stage', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', barColor: 'bg-gray-300' },
};

export function computeReadiness(person: Person, framework: LevelFramework, levelLabel: string): ReadinessResult {
  const metSkills: SkillCriterion[] = [];
  const gapSkills: Array<SkillCriterion & { actualRating: number; gap: number }> = [];

  for (const criterion of framework.criteria) {
    const actual = person.skills[criterion.skillId] ?? 0;
    if (actual >= criterion.requiredRating) {
      metSkills.push(criterion);
    } else {
      gapSkills.push({ ...criterion, actualRating: actual, gap: criterion.requiredRating - actual });
    }
  }

  const readinessPct = Math.round((metSkills.length / framework.criteria.length) * 100);

  return {
    person,
    targetLevelId: framework.levelId,
    targetLevelLabel: levelLabel,
    criteriaTotal: framework.criteria.length,
    criteriaMet: metSkills.length,
    readinessPct,
    metSkills,
    gapSkills,
  };
}

export function getAllReadiness(): ReadinessResult[] {
  const results: ReadinessResult[] = [];

  for (const person of PEOPLE) {
    const currentLevel = LEVEL_DEFINITIONS.find(l => l.id === person.currentLevelId);
    if (!currentLevel?.nextLevel) continue;

    const nextLevel = LEVEL_DEFINITIONS.find(l => l.id === currentLevel.nextLevel);
    if (!nextLevel) continue;

    const framework = LEVEL_FRAMEWORKS.find(f => f.levelId === nextLevel.id);
    if (!framework) continue;

    results.push(computeReadiness(person, framework, nextLevel.label));
  }

  return results;
}

export { DEPT_COLORS };

// ── Cross-tool bridge: find pipeline candidates who meet a skill criterion ──

export interface SkillCandidateMatch {
  person: Person;
  actualRating: number;
  requiredRating: number;
  targetLevelLabel: string;
  readinessPct: number;
}

/**
 * Given a heatmap skill name and optional department filter, return people in
 * the promotion pipeline who already meet that skill's next-level criterion.
 * Skill names are matched case-insensitively against LEVEL_FRAMEWORKS criteria.
 */
export function getCandidatesForSkill(skillName: string, department?: string): SkillCandidateMatch[] {
  const matches: SkillCandidateMatch[] = [];
  const normalised = skillName.toLowerCase();

  for (const person of PEOPLE) {
    if (department && person.department !== department) continue;

    const currentLevel = LEVEL_DEFINITIONS.find(l => l.id === person.currentLevelId);
    if (!currentLevel?.nextLevel) continue;

    const nextLevel = LEVEL_DEFINITIONS.find(l => l.id === currentLevel.nextLevel);
    if (!nextLevel) continue;

    const framework = LEVEL_FRAMEWORKS.find(f => f.levelId === nextLevel.id);
    if (!framework) continue;

    const criterion = framework.criteria.find(c => c.skillName.toLowerCase() === normalised);
    if (!criterion) continue;

    const actual = person.skills[criterion.skillId] ?? 0;
    if (actual >= criterion.requiredRating) {
      const readiness = computeReadiness(person, framework, nextLevel.label);
      matches.push({
        person,
        actualRating: actual,
        requiredRating: criterion.requiredRating,
        targetLevelLabel: nextLevel.label,
        readinessPct: readiness.readinessPct,
      });
    }
  }

  return matches.sort((a, b) => b.readinessPct - a.readinessPct);
}

/**
 * Given a heatmap skill name and optional department, return people who have
 * this skill as a blocking gap (they don't yet meet the criterion).
 */
export function getBlockedCandidatesForSkill(skillName: string, department?: string): SkillCandidateMatch[] {
  const matches: SkillCandidateMatch[] = [];
  const normalised = skillName.toLowerCase();

  for (const person of PEOPLE) {
    if (department && person.department !== department) continue;

    const currentLevel = LEVEL_DEFINITIONS.find(l => l.id === person.currentLevelId);
    if (!currentLevel?.nextLevel) continue;

    const nextLevel = LEVEL_DEFINITIONS.find(l => l.id === currentLevel.nextLevel);
    if (!nextLevel) continue;

    const framework = LEVEL_FRAMEWORKS.find(f => f.levelId === nextLevel.id);
    if (!framework) continue;

    const criterion = framework.criteria.find(c => c.skillName.toLowerCase() === normalised);
    if (!criterion) continue;

    const actual = person.skills[criterion.skillId] ?? 0;
    if (actual < criterion.requiredRating) {
      const readiness = computeReadiness(person, framework, nextLevel.label);
      matches.push({
        person,
        actualRating: actual,
        requiredRating: criterion.requiredRating,
        targetLevelLabel: nextLevel.label,
        readinessPct: readiness.readinessPct,
      });
    }
  }

  return matches.sort((a, b) => b.readinessPct - a.readinessPct);
}
