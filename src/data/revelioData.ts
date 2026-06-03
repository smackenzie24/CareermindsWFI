// Mock data representing Revelio Labs external intelligence (scraped from ~1.1bn LinkedIn profiles)

export type RevelioDept = 'Engineering' | 'Product' | 'Design' | 'Data' | 'Marketing' | 'Sales' | 'People Ops';

export const REVELIO_DEPTS: RevelioDept[] = [
  'Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops',
];

// ── 1. Talent Supply & Demand ───────────────────────────────────────────────

export interface RoleDemandRow {
  role: string;
  dept: RevelioDept;
  openPostings: number;       // market-wide open postings (thousands)
  talentSupply: number;       // available candidates index 0–100
  demandGrowthPct: number;    // YoY change in postings
  medianDaysToFill: number;
  competitionTier: 'extreme' | 'high' | 'moderate' | 'low';
}

export const ROLE_DEMAND: RoleDemandRow[] = [
  { role: 'ML Engineer',           dept: 'Engineering', openPostings: 84,  talentSupply: 22, demandGrowthPct: 38, medianDaysToFill: 67, competitionTier: 'extreme' },
  { role: 'Staff Engineer',        dept: 'Engineering', openPostings: 61,  talentSupply: 31, demandGrowthPct: 21, medianDaysToFill: 54, competitionTier: 'extreme' },
  { role: 'Data Engineer',         dept: 'Data',        openPostings: 72,  talentSupply: 29, demandGrowthPct: 29, medianDaysToFill: 58, competitionTier: 'extreme' },
  { role: 'Product Manager',       dept: 'Product',     openPostings: 56,  talentSupply: 41, demandGrowthPct: 14, medianDaysToFill: 48, competitionTier: 'high' },
  { role: 'Senior Designer (UX)',  dept: 'Design',      openPostings: 38,  talentSupply: 44, demandGrowthPct: 11, medianDaysToFill: 42, competitionTier: 'high' },
  { role: 'Growth Marketer',       dept: 'Marketing',   openPostings: 43,  talentSupply: 52, demandGrowthPct: 9,  medianDaysToFill: 38, competitionTier: 'moderate' },
  { role: 'Enterprise AE',         dept: 'Sales',       openPostings: 49,  talentSupply: 55, demandGrowthPct: 6,  medianDaysToFill: 35, competitionTier: 'moderate' },
  { role: 'HRBP',                  dept: 'People Ops',  openPostings: 27,  talentSupply: 63, demandGrowthPct: 3,  medianDaysToFill: 29, competitionTier: 'low' },
  { role: 'Analytics Engineer',    dept: 'Data',        openPostings: 33,  talentSupply: 34, demandGrowthPct: 44, medianDaysToFill: 61, competitionTier: 'extreme' },
  { role: 'Frontend Engineer',     dept: 'Engineering', openPostings: 78,  talentSupply: 47, demandGrowthPct: 7,  medianDaysToFill: 41, competitionTier: 'high' },
  { role: 'Content Strategist',    dept: 'Marketing',   openPostings: 21,  talentSupply: 71, demandGrowthPct: -2, medianDaysToFill: 24, competitionTier: 'low' },
  { role: 'Recruiting Lead',       dept: 'People Ops',  openPostings: 19,  talentSupply: 68, demandGrowthPct: 1,  medianDaysToFill: 27, competitionTier: 'low' },
];

// ── 2. Flight Risk Index ────────────────────────────────────────────────────

export interface FlightRiskRow {
  dept: RevelioDept;
  flightRiskScore: number;    // 0–100, higher = more likely to leave
  profileActivityIndex: number; // normalised LinkedIn activity (endorsements, posts, connection growth)
  avgTenureMonths: number;
  pctLookingPassively: number; // % showing passive signals
  pctLookingActively: number;  // % showing active signals (follows companies, updates headline)
  marketAvgScore: number;
  trend: 'rising' | 'stable' | 'falling';
}

export const FLIGHT_RISK: FlightRiskRow[] = [
  { dept: 'Engineering', flightRiskScore: 74, profileActivityIndex: 82, avgTenureMonths: 22, pctLookingPassively: 41, pctLookingActively: 18, marketAvgScore: 58, trend: 'rising' },
  { dept: 'Data',        flightRiskScore: 71, profileActivityIndex: 78, avgTenureMonths: 19, pctLookingPassively: 38, pctLookingActively: 21, marketAvgScore: 58, trend: 'rising' },
  { dept: 'Product',     flightRiskScore: 62, profileActivityIndex: 69, avgTenureMonths: 26, pctLookingPassively: 33, pctLookingActively: 14, marketAvgScore: 54, trend: 'stable' },
  { dept: 'Design',      flightRiskScore: 58, profileActivityIndex: 64, avgTenureMonths: 28, pctLookingPassively: 28, pctLookingActively: 12, marketAvgScore: 51, trend: 'stable' },
  { dept: 'Marketing',   flightRiskScore: 55, profileActivityIndex: 71, avgTenureMonths: 24, pctLookingPassively: 26, pctLookingActively: 11, marketAvgScore: 52, trend: 'falling' },
  { dept: 'Sales',       flightRiskScore: 68, profileActivityIndex: 75, avgTenureMonths: 18, pctLookingPassively: 35, pctLookingActively: 19, marketAvgScore: 62, trend: 'stable' },
  { dept: 'People Ops',  flightRiskScore: 44, profileActivityIndex: 52, avgTenureMonths: 34, pctLookingPassively: 18, pctLookingActively: 7,  marketAvgScore: 46, trend: 'falling' },
];

// ── 3. Compensation Positioning ─────────────────────────────────────────────

export interface CompPositioningRow {
  dept: RevelioDept;
  acmeMedian: number;         // Acme's median comp (from internal data)
  marketP25: number;
  marketP50: number;
  marketP75: number;
  marketP90: number;
  percentilePosition: number; // which percentile Acme sits at
  atRiskRoles: string[];      // roles where Acme is below p50
}

export const COMP_POSITIONING: CompPositioningRow[] = [
  { dept: 'Engineering', acmeMedian: 128000, marketP25: 108000, marketP50: 132000, marketP75: 158000, marketP90: 195000, percentilePosition: 46, atRiskRoles: ['Staff Engineer', 'ML Engineer'] },
  { dept: 'Product',     acmeMedian: 118000, marketP25: 102000, marketP50: 120000, marketP75: 142000, marketP90: 168000, percentilePosition: 49, atRiskRoles: ['Senior PM'] },
  { dept: 'Design',      acmeMedian: 102000, marketP25: 88000,  marketP50: 105000, marketP75: 124000, marketP90: 148000, percentilePosition: 47, atRiskRoles: ['Staff Designer'] },
  { dept: 'Data',        acmeMedian: 122000, marketP25: 98000,  marketP50: 118000, marketP75: 144000, marketP90: 172000, percentilePosition: 52, atRiskRoles: [] },
  { dept: 'Marketing',   acmeMedian: 88000,  marketP25: 76000,  marketP50: 92000,  marketP75: 112000, marketP90: 134000, percentilePosition: 44, atRiskRoles: ['Growth Lead', 'Demand Gen'] },
  { dept: 'Sales',       acmeMedian: 95000,  marketP25: 82000,  marketP50: 98000,  marketP75: 118000, marketP90: 142000, percentilePosition: 47, atRiskRoles: ['Enterprise AE'] },
  { dept: 'People Ops',  acmeMedian: 90000,  marketP25: 80000,  marketP50: 88000,  marketP75: 102000, marketP90: 122000, percentilePosition: 54, atRiskRoles: [] },
];

// ── 4. Talent Prestige ───────────────────────────────────────────────────────

export interface PrestigeRow {
  dept: RevelioDept;
  acmePrestigeScore: number;    // 0–100
  marketMedianScore: number;
  topTierPct: number;           // % of dept with top-tier company/school backgrounds
  risingPrestigePct: number;    // recent hires prestige vs company avg
  topPreviousEmployers: string[];
  topSchools: string[];
}

export const PRESTIGE_DATA: PrestigeRow[] = [
  { dept: 'Engineering', acmePrestigeScore: 71, marketMedianScore: 68, topTierPct: 34, risingPrestigePct: 12, topPreviousEmployers: ['Google', 'Meta', 'Stripe', 'Palantir'], topSchools: ['MIT', 'Stanford', 'Carnegie Mellon'] },
  { dept: 'Product',     acmePrestigeScore: 68, marketMedianScore: 65, topTierPct: 29, risingPrestigePct: 8,  topPreviousEmployers: ['Airbnb', 'Figma', 'Notion', 'Atlassian'], topSchools: ['Stanford', 'Harvard', 'UC Berkeley'] },
  { dept: 'Design',      acmePrestigeScore: 64, marketMedianScore: 60, topTierPct: 22, risingPrestigePct: 6,  topPreviousEmployers: ['Apple', 'IDEO', 'frog', 'Shopify'], topSchools: ['RISD', 'Parsons', 'RCA'] },
  { dept: 'Data',        acmePrestigeScore: 73, marketMedianScore: 66, topTierPct: 38, risingPrestigePct: 15, topPreviousEmployers: ['Databricks', 'Snowflake', 'Two Sigma', 'Jane Street'], topSchools: ['MIT', 'CMU', 'Oxford'] },
  { dept: 'Marketing',   acmePrestigeScore: 58, marketMedianScore: 57, topTierPct: 18, risingPrestigePct: 3,  topPreviousEmployers: ['HubSpot', 'Salesforce', 'WPP', 'Edelman'], topSchools: ['Northwestern', 'Michigan', 'NYU'] },
  { dept: 'Sales',       acmePrestigeScore: 55, marketMedianScore: 54, topTierPct: 14, risingPrestigePct: 2,  topPreviousEmployers: ['Salesforce', 'Oracle', 'SAP', 'Workday'], topSchools: ['Indiana', 'Arizona State', 'SMU'] },
  { dept: 'People Ops',  acmePrestigeScore: 60, marketMedianScore: 58, topTierPct: 20, risingPrestigePct: 5,  topPreviousEmployers: ['McKinsey', 'Deloitte', 'LinkedIn', 'Workday'], topSchools: ['Cornell ILR', 'Michigan Ross', 'Georgetown'] },
];

// ── 5. Promotion Rate vs Market ──────────────────────────────────────────────

export interface PromotionRateRow {
  dept: RevelioDept;
  acmePromotionRatePct: number;   // % promoted in last 12 months
  marketMedianPct: number;
  marketP75Pct: number;
  avgMonthsToPromotion: number;
  marketAvgMonths: number;
  bottleneckedLevel: string | null;  // level where people stall vs market
}

export const PROMOTION_RATES: PromotionRateRow[] = [
  { dept: 'Engineering', acmePromotionRatePct: 14, marketMedianPct: 18, marketP75Pct: 24, avgMonthsToPromotion: 22, marketAvgMonths: 18, bottleneckedLevel: 'Senior → Staff' },
  { dept: 'Product',     acmePromotionRatePct: 17, marketMedianPct: 16, marketP75Pct: 22, avgMonthsToPromotion: 20, marketAvgMonths: 20, bottleneckedLevel: null },
  { dept: 'Design',      acmePromotionRatePct: 12, marketMedianPct: 15, marketP75Pct: 21, avgMonthsToPromotion: 26, marketAvgMonths: 21, bottleneckedLevel: 'Mid → Senior' },
  { dept: 'Data',        acmePromotionRatePct: 19, marketMedianPct: 17, marketP75Pct: 23, avgMonthsToPromotion: 18, marketAvgMonths: 19, bottleneckedLevel: null },
  { dept: 'Marketing',   acmePromotionRatePct: 11, marketMedianPct: 14, marketP75Pct: 20, avgMonthsToPromotion: 28, marketAvgMonths: 22, bottleneckedLevel: 'Manager → Senior Manager' },
  { dept: 'Sales',       acmePromotionRatePct: 22, marketMedianPct: 20, marketP75Pct: 28, avgMonthsToPromotion: 16, marketAvgMonths: 17, bottleneckedLevel: null },
  { dept: 'People Ops',  acmePromotionRatePct: 10, marketMedianPct: 12, marketP75Pct: 18, avgMonthsToPromotion: 30, marketAvgMonths: 24, bottleneckedLevel: 'HRBP → Senior HRBP' },
];

// ── 6. Skills Market Signals ─────────────────────────────────────────────────

export interface SkillSignalRow {
  skill: string;
  cluster: string;
  growthPct: number;          // YoY growth in demand across LinkedIn profiles
  scarcityScore: number;      // 0–100, higher = harder to find
  acmeHasPct: number;         // % of Acme workforce with this skill
  marketHasPct: number;       // % of market workforce with this skill
  trending: 'rising' | 'peak' | 'maturing' | 'declining';
  relevantDepts: RevelioDept[];
}

export const SKILL_SIGNALS: SkillSignalRow[] = [
  { skill: 'LLM Fine-tuning',        cluster: 'AI/ML',       growthPct: 214, scarcityScore: 94, acmeHasPct: 4,  marketHasPct: 7,  trending: 'rising',   relevantDepts: ['Engineering', 'Data'] },
  { skill: 'dbt (data build tool)',   cluster: 'Data Eng',    growthPct: 87,  scarcityScore: 78, acmeHasPct: 18, marketHasPct: 22, trending: 'rising',   relevantDepts: ['Data'] },
  { skill: 'Prompt Engineering',      cluster: 'AI/ML',       growthPct: 162, scarcityScore: 71, acmeHasPct: 9,  marketHasPct: 14, trending: 'rising',   relevantDepts: ['Engineering', 'Product', 'Data'] },
  { skill: 'Product-led Growth',      cluster: 'Product',     growthPct: 54,  scarcityScore: 68, acmeHasPct: 22, marketHasPct: 28, trending: 'rising',   relevantDepts: ['Product', 'Marketing'] },
  { skill: 'Revenue Operations',      cluster: 'GTM',         growthPct: 49,  scarcityScore: 62, acmeHasPct: 11, marketHasPct: 18, trending: 'rising',   relevantDepts: ['Sales', 'Marketing'] },
  { skill: 'Figma (advanced)',        cluster: 'Design',      growthPct: 21,  scarcityScore: 44, acmeHasPct: 74, marketHasPct: 68, trending: 'peak',     relevantDepts: ['Design', 'Product'] },
  { skill: 'Spark / PySpark',         cluster: 'Data Eng',    growthPct: 12,  scarcityScore: 55, acmeHasPct: 31, marketHasPct: 38, trending: 'maturing', relevantDepts: ['Data', 'Engineering'] },
  { skill: 'Agile / Scrum',           cluster: 'Process',     growthPct: 3,   scarcityScore: 14, acmeHasPct: 84, marketHasPct: 81, trending: 'maturing', relevantDepts: ['Engineering', 'Product'] },
  { skill: 'Tableau',                 cluster: 'Analytics',   growthPct: -8,  scarcityScore: 22, acmeHasPct: 41, marketHasPct: 36, trending: 'declining', relevantDepts: ['Data', 'Marketing'] },
  { skill: 'Kubernetes',              cluster: 'Infra',       growthPct: 34,  scarcityScore: 72, acmeHasPct: 28, marketHasPct: 31, trending: 'rising',   relevantDepts: ['Engineering'] },
  { skill: 'Account-based Marketing', cluster: 'GTM',         growthPct: 38,  scarcityScore: 58, acmeHasPct: 14, marketHasPct: 21, trending: 'rising',   relevantDepts: ['Marketing', 'Sales'] },
  { skill: 'Change Management',       cluster: 'People',      growthPct: 27,  scarcityScore: 48, acmeHasPct: 38, marketHasPct: 42, trending: 'rising',   relevantDepts: ['People Ops'] },
  { skill: 'SQL (advanced)',          cluster: 'Analytics',   growthPct: 7,   scarcityScore: 28, acmeHasPct: 62, marketHasPct: 58, trending: 'maturing', relevantDepts: ['Data', 'Engineering'] },
  { skill: 'RLHF',                    cluster: 'AI/ML',       growthPct: 189, scarcityScore: 97, acmeHasPct: 2,  marketHasPct: 3,  trending: 'rising',   relevantDepts: ['Engineering', 'Data'] },
  { skill: 'GTM Strategy',            cluster: 'GTM',         growthPct: 19,  scarcityScore: 52, acmeHasPct: 29, marketHasPct: 33, trending: 'peak',     relevantDepts: ['Sales', 'Marketing', 'Product'] },
];

// ── 7. Career Paths ──────────────────────────────────────────────────────────

export interface CareerTransition {
  from: string;                // role title
  to: string;                  // role title
  fromDept: RevelioDept;
  toDept: RevelioDept;
  pct: number;                 // % of people in `from` role who moved to `to`
  medianMonths: number;        // median time before transition
  crossDept: boolean;
  crossCompany: boolean;       // true = left Acme
}

export interface CareerPathNode {
  role: string;
  dept: RevelioDept;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'vp';
  avgTenureMonths: number;
  headcount: number;           // people currently in this role at Acme
  outflows: CareerTransition[];
}

export const CAREER_PATH_NODES: CareerPathNode[] = [
  {
    role: 'Junior Engineer',
    dept: 'Engineering',
    level: 'junior',
    avgTenureMonths: 14,
    headcount: 12,
    outflows: [
      { from: 'Junior Engineer', to: 'Software Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 58, medianMonths: 18, crossDept: false, crossCompany: false },
      { from: 'Junior Engineer', to: 'Software Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 22, medianMonths: 16, crossDept: false, crossCompany: true },
      { from: 'Junior Engineer', to: 'Data Engineer', fromDept: 'Engineering', toDept: 'Data', pct: 11, medianMonths: 20, crossDept: true, crossCompany: false },
      { from: 'Junior Engineer', to: 'Product Manager', fromDept: 'Engineering', toDept: 'Product', pct: 9, medianMonths: 24, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Software Engineer',
    dept: 'Engineering',
    level: 'mid',
    avgTenureMonths: 21,
    headcount: 22,
    outflows: [
      { from: 'Software Engineer', to: 'Senior Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 44, medianMonths: 22, crossDept: false, crossCompany: false },
      { from: 'Software Engineer', to: 'Senior Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 28, medianMonths: 20, crossDept: false, crossCompany: true },
      { from: 'Software Engineer', to: 'Product Manager', fromDept: 'Engineering', toDept: 'Product', pct: 14, medianMonths: 28, crossDept: true, crossCompany: false },
      { from: 'Software Engineer', to: 'Data Engineer', fromDept: 'Engineering', toDept: 'Data', pct: 14, medianMonths: 18, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Senior Engineer',
    dept: 'Engineering',
    level: 'senior',
    avgTenureMonths: 26,
    headcount: 18,
    outflows: [
      { from: 'Senior Engineer', to: 'Staff Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 31, medianMonths: 28, crossDept: false, crossCompany: false },
      { from: 'Senior Engineer', to: 'Engineering Manager', fromDept: 'Engineering', toDept: 'Engineering', pct: 24, medianMonths: 30, crossDept: false, crossCompany: false },
      { from: 'Senior Engineer', to: 'Staff Engineer', fromDept: 'Engineering', toDept: 'Engineering', pct: 29, medianMonths: 24, crossDept: false, crossCompany: true },
      { from: 'Senior Engineer', to: 'Product Manager', fromDept: 'Engineering', toDept: 'Product', pct: 16, medianMonths: 32, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Associate PM',
    dept: 'Product',
    level: 'junior',
    avgTenureMonths: 13,
    headcount: 5,
    outflows: [
      { from: 'Associate PM', to: 'Product Manager', fromDept: 'Product', toDept: 'Product', pct: 62, medianMonths: 16, crossDept: false, crossCompany: false },
      { from: 'Associate PM', to: 'Product Manager', fromDept: 'Product', toDept: 'Product', pct: 21, medianMonths: 14, crossDept: false, crossCompany: true },
      { from: 'Associate PM', to: 'UX Researcher', fromDept: 'Product', toDept: 'Design', pct: 17, medianMonths: 20, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Product Manager',
    dept: 'Product',
    level: 'mid',
    avgTenureMonths: 24,
    headcount: 10,
    outflows: [
      { from: 'Product Manager', to: 'Senior PM', fromDept: 'Product', toDept: 'Product', pct: 41, medianMonths: 22, crossDept: false, crossCompany: false },
      { from: 'Product Manager', to: 'Senior PM', fromDept: 'Product', toDept: 'Product', pct: 32, medianMonths: 20, crossDept: false, crossCompany: true },
      { from: 'Product Manager', to: 'Founder / Startup', fromDept: 'Product', toDept: 'Product', pct: 18, medianMonths: 36, crossDept: false, crossCompany: true },
      { from: 'Product Manager', to: 'Strategy & Ops', fromDept: 'Product', toDept: 'People Ops', pct: 9, medianMonths: 28, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Data Analyst',
    dept: 'Data',
    level: 'junior',
    avgTenureMonths: 16,
    headcount: 9,
    outflows: [
      { from: 'Data Analyst', to: 'Senior Analyst', fromDept: 'Data', toDept: 'Data', pct: 48, medianMonths: 18, crossDept: false, crossCompany: false },
      { from: 'Data Analyst', to: 'Data Engineer', fromDept: 'Data', toDept: 'Data', pct: 27, medianMonths: 22, crossDept: false, crossCompany: false },
      { from: 'Data Analyst', to: 'Senior Analyst', fromDept: 'Data', toDept: 'Data', pct: 18, medianMonths: 16, crossDept: false, crossCompany: true },
      { from: 'Data Analyst', to: 'Product Manager', fromDept: 'Data', toDept: 'Product', pct: 7, medianMonths: 30, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Senior Analyst',
    dept: 'Data',
    level: 'senior',
    avgTenureMonths: 22,
    headcount: 8,
    outflows: [
      { from: 'Senior Analyst', to: 'Data Science Lead', fromDept: 'Data', toDept: 'Data', pct: 36, medianMonths: 24, crossDept: false, crossCompany: false },
      { from: 'Senior Analyst', to: 'ML Engineer', fromDept: 'Data', toDept: 'Engineering', pct: 29, medianMonths: 20, crossDept: true, crossCompany: false },
      { from: 'Senior Analyst', to: 'Data Science Lead', fromDept: 'Data', toDept: 'Data', pct: 26, medianMonths: 22, crossDept: false, crossCompany: true },
      { from: 'Senior Analyst', to: 'Head of Analytics', fromDept: 'Data', toDept: 'Data', pct: 9, medianMonths: 36, crossDept: false, crossCompany: false },
    ],
  },
  {
    role: 'UX Designer',
    dept: 'Design',
    level: 'mid',
    avgTenureMonths: 20,
    headcount: 8,
    outflows: [
      { from: 'UX Designer', to: 'Senior Designer', fromDept: 'Design', toDept: 'Design', pct: 52, medianMonths: 22, crossDept: false, crossCompany: false },
      { from: 'UX Designer', to: 'Senior Designer', fromDept: 'Design', toDept: 'Design', pct: 26, medianMonths: 18, crossDept: false, crossCompany: true },
      { from: 'UX Designer', to: 'Product Manager', fromDept: 'Design', toDept: 'Product', pct: 14, medianMonths: 30, crossDept: true, crossCompany: false },
      { from: 'UX Designer', to: 'Design Lead', fromDept: 'Design', toDept: 'Design', pct: 8, medianMonths: 28, crossDept: false, crossCompany: false },
    ],
  },
  {
    role: 'Marketing Manager',
    dept: 'Marketing',
    level: 'mid',
    avgTenureMonths: 18,
    headcount: 7,
    outflows: [
      { from: 'Marketing Manager', to: 'Senior Marketing Manager', fromDept: 'Marketing', toDept: 'Marketing', pct: 38, medianMonths: 22, crossDept: false, crossCompany: false },
      { from: 'Marketing Manager', to: 'Senior Marketing Manager', fromDept: 'Marketing', toDept: 'Marketing', pct: 31, medianMonths: 18, crossDept: false, crossCompany: true },
      { from: 'Marketing Manager', to: 'Growth Lead', fromDept: 'Marketing', toDept: 'Marketing', pct: 19, medianMonths: 24, crossDept: false, crossCompany: false },
      { from: 'Marketing Manager', to: 'Product Manager', fromDept: 'Marketing', toDept: 'Product', pct: 12, medianMonths: 32, crossDept: true, crossCompany: false },
    ],
  },
  {
    role: 'Account Executive',
    dept: 'Sales',
    level: 'mid',
    avgTenureMonths: 17,
    headcount: 11,
    outflows: [
      { from: 'Account Executive', to: 'Senior AE', fromDept: 'Sales', toDept: 'Sales', pct: 44, medianMonths: 18, crossDept: false, crossCompany: false },
      { from: 'Account Executive', to: 'Senior AE', fromDept: 'Sales', toDept: 'Sales', pct: 29, medianMonths: 16, crossDept: false, crossCompany: true },
      { from: 'Account Executive', to: 'Sales Manager', fromDept: 'Sales', toDept: 'Sales', pct: 18, medianMonths: 28, crossDept: false, crossCompany: false },
      { from: 'Account Executive', to: 'Revenue Ops', fromDept: 'Sales', toDept: 'Sales', pct: 9, medianMonths: 24, crossDept: false, crossCompany: false },
    ],
  },
];

// ── Recommendations (AI-generated style) ─────────────────────────────────────

export interface TalentIntelRec {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  area: 'supply-demand' | 'flight-risk' | 'compensation' | 'prestige' | 'promotion' | 'skills' | 'career-paths';
  title: string;
  rationale: string;
  actions: string[];
  timeframe: string;
  dept?: RevelioDept;
}

export const TALENT_INTEL_RECS: TalentIntelRec[] = [
  {
    id: 'ti-1',
    priority: 'critical',
    area: 'flight-risk',
    title: 'Engineering & Data flight risk is 28% above market average',
    rationale: 'Revelio signals show 74 and 71 flight risk scores respectively — both materially above the 58-point market average — with a rising trend in both.',
    actions: [
      'Commission a comp benchmarking review for Staff Engineer and ML Engineer roles within 30 days',
      'Identify the top 10 flight-risk individuals using LinkedIn signal cross-referenced with tenure data',
      'Schedule skip-level conversations in Engineering and Data this quarter',
    ],
    timeframe: '30 days',
    dept: 'Engineering',
  },
  {
    id: 'ti-2',
    priority: 'critical',
    area: 'supply-demand',
    title: 'ML Engineer and Analytics Engineer roles face extreme hiring competition',
    rationale: 'Demand for ML Engineers grew 38% YoY with only a 22-point talent supply index — the worst supply-demand imbalance in your target hiring pool.',
    actions: [
      'Prioritise internal promotion for ML Engineer roles before opening external searches',
      'Build an ML Engineer apprenticeship track from Senior Data Analysts',
      'Increase recruiter focus on non-obvious talent pools (defence, academic, consulting)',
    ],
    timeframe: '60 days',
    dept: 'Engineering',
  },
  {
    id: 'ti-3',
    priority: 'high',
    area: 'compensation',
    title: 'Engineering and Marketing comp is below market median',
    rationale: 'Acme sits at the 46th percentile for Engineering and 44th for Marketing — both below p50, with Staff Engineer and Growth Lead roles most exposed.',
    actions: [
      'Adjust Staff Engineer and ML Engineer bands to at least p55 before next review cycle',
      'Review Growth Lead OTE structure — consider adding equity component',
      'Create a comp transparency FAQ for team leads to use in retention conversations',
    ],
    timeframe: '60–90 days',
    dept: 'Engineering',
  },
  {
    id: 'ti-4',
    priority: 'high',
    area: 'skills',
    title: 'LLM and RLHF skills growing 200%+ in market demand; Acme coverage is minimal',
    rationale: 'Only 4% of Acme has LLM fine-tuning skills and 2% have RLHF exposure, against market averages of 7% and 3% respectively — and both are growing rapidly.',
    actions: [
      'Identify 5–8 high-potential engineers for an internal AI upskilling cohort',
      'Partner with a provider (e.g. Coursera, DeepLearning.AI) to run a 6-week LLM sprint',
      'Add LLM and prompt engineering to Engineering hiring scorecards immediately',
    ],
    timeframe: 'Q3',
  },
  {
    id: 'ti-5',
    priority: 'high',
    area: 'promotion',
    title: 'Engineering promotion velocity is below market; Senior → Staff is the key bottleneck',
    rationale: 'Acme promotes 14% of Engineers annually vs an 18% market median, and the Senior → Staff transition takes 4 months longer than peers.',
    actions: [
      'Review the Staff Engineer levelling criteria — are expectations calibrated against market?',
      'Create a visible "Staff-ready" list and assign sponsors to each candidate',
      'Run a calibration session with Engineering VPs to align on promotion bar',
    ],
    timeframe: '45 days',
    dept: 'Engineering',
  },
  {
    id: 'ti-6',
    priority: 'medium',
    area: 'career-paths',
    title: '28% of Software Engineers leave for external promotions — internal path needs to be clearer',
    rationale: 'Revelio shows 28% of Software Engineers leave to get their Senior promotion externally, vs 44% who get it internally — the external path is often faster.',
    actions: [
      'Publish expected promotion timelines for each Engineering level internally',
      'Create a "promotion readiness check-in" process at 18 months in role',
      'Ensure managers can articulate the promotion criteria at the next all-hands',
    ],
    timeframe: '60 days',
    dept: 'Engineering',
  },
  {
    id: 'ti-7',
    priority: 'medium',
    area: 'prestige',
    title: 'Data team prestige score is rising — leverage this in employer branding',
    rationale: 'Data has the highest prestige score (73) and the fastest-rising recent hire prestige (+15 points) — a strong signal to amplify in recruiting.',
    actions: [
      'Feature Data team profiles in recruiting materials and LinkedIn content',
      'Create a "why we hire from X" employer brand story around top previous employers',
      'Ask top-prestige Data hires to represent Acme at conferences and panels',
    ],
    timeframe: 'Q3',
    dept: 'Data',
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getFlightRiskByDept(dept: RevelioDept): FlightRiskRow | undefined {
  return FLIGHT_RISK.find(r => r.dept === dept);
}

export function getCompByDept(dept: RevelioDept): CompPositioningRow | undefined {
  return COMP_POSITIONING.find(r => r.dept === dept);
}

export function getPromotionByDept(dept: RevelioDept): PromotionRateRow | undefined {
  return PROMOTION_RATES.find(r => r.dept === dept);
}

export function getTopRisingSkills(n = 5): SkillSignalRow[] {
  return [...SKILL_SIGNALS]
    .filter(s => s.trending === 'rising')
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, n);
}

export function getTopDecliningSkills(): SkillSignalRow[] {
  return SKILL_SIGNALS.filter(s => s.trending === 'declining');
}

export function getExtremeCompetitionRoles(): RoleDemandRow[] {
  return ROLE_DEMAND.filter(r => r.competitionTier === 'extreme');
}
