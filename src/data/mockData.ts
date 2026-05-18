export type Department = 'Engineering' | 'Product' | 'Design' | 'Data' | 'Marketing' | 'Sales' | 'People Ops';
export type Location = 'London' | 'New York' | 'Berlin' | 'Singapore' | 'Remote';
export type Level = 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'M1' | 'M2';

export interface SkillGapEntry {
  skill: string;
  category: string;
  department: Department;
  location: Location;
  team: string;
  level: Level;
  averageActual: number; // 1–5
  expectedLevel: number; // 1–5
  headcount: number;
  belowTarget: number; // count below expected
}

// Helper to fan a skill out across locations for a department
function eng(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Engineering' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function prod(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Product' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function design(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Design' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function data(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Data' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function mkt(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Marketing' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function sales(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'Sales' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}
function people(skill: string, category: string, level: Level, exp: number, rows: [Location, string, number, number, number][]): SkillGapEntry[] {
  return rows.map(([location, team, actual, headcount, belowTarget]) => ({
    skill, category, department: 'People Ops' as Department, location, team, level,
    averageActual: actual, expectedLevel: exp, headcount, belowTarget,
  }));
}

export const SKILLS_DATA: SkillGapEntry[] = [
  // ── Engineering (11 skills) ─────────────────────────────────────────
  ...eng('System Design', 'Architecture', 'IC3', 4, [
    ['London', 'Platform', 2.1, 18, 13],
    ['New York', 'Backend', 2.4, 14, 10],
    ['Berlin', 'Infrastructure', 2.9, 9, 6],
    ['Singapore', 'Mobile', 3.2, 7, 4],
    ['Remote', 'Frontend', 2.6, 11, 8],
  ]),
  ...eng('Incident Response', 'Operations', 'IC2', 3, [
    ['London', 'Platform', 2.8, 18, 9],
    ['New York', 'Backend', 3.1, 14, 5],
    ['Berlin', 'Infrastructure', 3.4, 9, 2],
    ['Singapore', 'Mobile', 2.5, 7, 5],
    ['Remote', 'Frontend', 2.3, 11, 8],
  ]),
  ...eng('Technical Mentoring', 'Leadership', 'IC4', 4, [
    ['London', 'Platform', 3.1, 6, 4],
    ['New York', 'Backend', 3.5, 5, 2],
    ['Berlin', 'Infrastructure', 2.8, 4, 3],
    ['Singapore', 'Mobile', 3.7, 3, 1],
    ['Remote', 'Frontend', 3.2, 4, 3],
  ]),
  ...eng('Code Review', 'Quality', 'IC2', 4, [
    ['London', 'Platform', 3.6, 18, 6],
    ['New York', 'Backend', 3.8, 14, 4],
    ['Berlin', 'Infrastructure', 4.0, 9, 1],
    ['Singapore', 'Mobile', 3.5, 7, 3],
    ['Remote', 'Frontend', 3.9, 11, 2],
  ]),
  ...eng('Security Practices', 'Security', 'IC3', 4, [
    ['London', 'Platform', 1.8, 18, 16],
    ['New York', 'Backend', 2.1, 14, 12],
    ['Berlin', 'Infrastructure', 2.4, 9, 7],
    ['Singapore', 'Mobile', 2.0, 7, 6],
    ['Remote', 'Frontend', 1.9, 11, 10],
  ]),
  ...eng('CI/CD & DevOps', 'Operations', 'IC2', 3, [
    ['London', 'Platform', 2.5, 18, 11],
    ['New York', 'Backend', 2.8, 14, 8],
    ['Berlin', 'Infrastructure', 3.3, 9, 3],
    ['Singapore', 'Mobile', 2.6, 7, 5],
    ['Remote', 'Frontend', 2.4, 11, 9],
  ]),
  ...eng('API Design', 'Architecture', 'IC3', 3, [
    ['London', 'Platform', 3.2, 18, 7],
    ['New York', 'Backend', 3.5, 14, 4],
    ['Berlin', 'Infrastructure', 3.7, 9, 2],
    ['Singapore', 'Mobile', 3.1, 7, 3],
    ['Remote', 'Frontend', 3.3, 11, 4],
  ]),
  ...eng('Performance Optimisation', 'Quality', 'IC3', 4, [
    ['London', 'Platform', 2.6, 18, 12],
    ['New York', 'Backend', 2.9, 14, 9],
    ['Berlin', 'Infrastructure', 3.1, 9, 5],
    ['Singapore', 'Mobile', 2.7, 7, 5],
    ['Remote', 'Frontend', 2.5, 11, 9],
  ]),
  ...eng('Observability & Monitoring', 'Operations', 'IC3', 3, [
    ['London', 'Platform', 2.2, 18, 13],
    ['New York', 'Backend', 2.6, 14, 9],
    ['Berlin', 'Infrastructure', 3.0, 9, 4],
    ['Singapore', 'Mobile', 2.4, 7, 5],
    ['Remote', 'Frontend', 2.1, 11, 10],
  ]),
  ...eng('Cross-team Communication', 'Collaboration', 'IC2', 3, [
    ['London', 'Platform', 3.4, 18, 5],
    ['New York', 'Backend', 3.2, 14, 5],
    ['Berlin', 'Infrastructure', 3.6, 9, 2],
    ['Singapore', 'Mobile', 3.5, 7, 2],
    ['Remote', 'Frontend', 3.1, 11, 5],
  ]),
  ...eng('Documentation', 'Quality', 'IC2', 3, [
    ['London', 'Platform', 2.4, 18, 11],
    ['New York', 'Backend', 2.7, 14, 8],
    ['Berlin', 'Infrastructure', 2.9, 9, 5],
    ['Singapore', 'Mobile', 2.5, 7, 5],
    ['Remote', 'Frontend', 2.3, 11, 9],
  ]),

  // ── Product (10 skills) ─────────────────────────────────────────────
  ...prod('Stakeholder Management', 'Influence', 'IC3', 4, [
    ['London', 'Growth', 2.9, 8, 5],
    ['New York', 'Core', 3.2, 6, 3],
    ['Berlin', 'Platform', 2.7, 5, 4],
    ['Remote', 'Partnerships', 3.1, 4, 2],
  ]),
  ...prod('Data Analysis', 'Analytical', 'IC2', 3, [
    ['London', 'Growth', 2.5, 8, 6],
    ['New York', 'Core', 2.8, 6, 4],
    ['Berlin', 'Platform', 3.1, 5, 2],
    ['Remote', 'Partnerships', 2.4, 4, 3],
  ]),
  ...prod('Roadmap Planning', 'Strategy', 'IC4', 4, [
    ['London', 'Growth', 3.8, 3, 1],
    ['New York', 'Core', 3.5, 3, 2],
    ['Berlin', 'Platform', 2.9, 2, 2],
    ['Remote', 'Partnerships', 3.2, 2, 1],
  ]),
  ...prod('User Research', 'Discovery', 'IC2', 3, [
    ['London', 'Growth', 2.4, 8, 5],
    ['New York', 'Core', 2.7, 6, 4],
    ['Berlin', 'Platform', 2.2, 5, 4],
    ['Remote', 'Partnerships', 2.6, 4, 3],
  ]),
  ...prod('Prioritisation Frameworks', 'Strategy', 'IC3', 4, [
    ['London', 'Growth', 2.8, 8, 6],
    ['New York', 'Core', 3.1, 6, 3],
    ['Berlin', 'Platform', 2.5, 5, 4],
    ['Remote', 'Partnerships', 2.9, 4, 3],
  ]),
  ...prod('Go-to-Market', 'Strategy', 'IC3', 3, [
    ['London', 'Growth', 2.6, 8, 5],
    ['New York', 'Core', 2.9, 6, 3],
    ['Berlin', 'Platform', 2.3, 5, 4],
    ['Remote', 'Partnerships', 3.0, 4, 2],
  ]),
  ...prod('OKR Setting', 'Delivery', 'IC3', 3, [
    ['London', 'Growth', 3.0, 8, 4],
    ['New York', 'Core', 3.3, 6, 2],
    ['Berlin', 'Platform', 2.8, 5, 3],
    ['Remote', 'Partnerships', 3.1, 4, 2],
  ]),
  ...prod('Competitive Analysis', 'Discovery', 'IC2', 3, [
    ['London', 'Growth', 2.7, 8, 5],
    ['New York', 'Core', 3.0, 6, 3],
    ['Berlin', 'Platform', 2.5, 5, 4],
    ['Remote', 'Partnerships', 2.8, 4, 2],
  ]),
  ...prod('Metrics & KPIs', 'Analytical', 'IC2', 3, [
    ['London', 'Growth', 2.3, 8, 6],
    ['New York', 'Core', 2.6, 6, 4],
    ['Berlin', 'Platform', 2.9, 5, 3],
    ['Remote', 'Partnerships', 2.1, 4, 4],
  ]),
  ...prod('Written Communication', 'Collaboration', 'IC2', 4, [
    ['London', 'Growth', 3.6, 8, 2],
    ['New York', 'Core', 3.8, 6, 1],
    ['Berlin', 'Platform', 3.4, 5, 2],
    ['Remote', 'Partnerships', 3.7, 4, 1],
  ]),

  // ── Design (10 skills) ──────────────────────────────────────────────
  ...design('Design Systems', 'Craft', 'IC3', 4, [
    ['London', 'Brand', 2.3, 7, 6],
    ['New York', 'Product Design', 3.1, 5, 3],
    ['Remote', 'UX Research', 2.7, 4, 3],
  ]),
  ...design('User Research', 'Research', 'IC2', 4, [
    ['London', 'Brand', 3.5, 7, 2],
    ['New York', 'Product Design', 3.8, 5, 1],
    ['Remote', 'UX Research', 4.1, 4, 0],
  ]),
  ...design('Prototyping', 'Craft', 'IC2', 3, [
    ['London', 'Brand', 3.6, 7, 2],
    ['New York', 'Product Design', 3.9, 5, 1],
    ['Remote', 'UX Research', 3.4, 4, 2],
  ]),
  ...design('Visual Communication', 'Craft', 'IC2', 4, [
    ['London', 'Brand', 2.9, 7, 5],
    ['New York', 'Product Design', 3.3, 5, 2],
    ['Remote', 'UX Research', 2.7, 4, 3],
  ]),
  ...design('Accessibility', 'Quality', 'IC2', 3, [
    ['London', 'Brand', 2.0, 7, 6],
    ['New York', 'Product Design', 2.4, 5, 4],
    ['Remote', 'UX Research', 1.9, 4, 4],
  ]),
  ...design('Interaction Design', 'Craft', 'IC3', 4, [
    ['London', 'Brand', 2.6, 7, 5],
    ['New York', 'Product Design', 3.0, 5, 3],
    ['Remote', 'UX Research', 2.8, 4, 3],
  ]),
  ...design('Content Strategy', 'Communication', 'IC2', 3, [
    ['London', 'Brand', 2.5, 7, 5],
    ['New York', 'Product Design', 2.8, 5, 3],
    ['Remote', 'UX Research', 2.3, 4, 3],
  ]),
  ...design('Design Critique', 'Collaboration', 'IC3', 3, [
    ['London', 'Brand', 3.3, 7, 2],
    ['New York', 'Product Design', 3.5, 5, 1],
    ['Remote', 'UX Research', 3.1, 4, 2],
  ]),
  ...design('Motion Design', 'Craft', 'IC3', 3, [
    ['London', 'Brand', 1.8, 7, 6],
    ['New York', 'Product Design', 2.1, 5, 4],
    ['Remote', 'UX Research', 1.6, 4, 4],
  ]),
  ...design('Stakeholder Presentation', 'Influence', 'IC3', 3, [
    ['London', 'Brand', 3.1, 7, 3],
    ['New York', 'Product Design', 3.4, 5, 2],
    ['Remote', 'UX Research', 2.9, 4, 3],
  ]),
  ...design('3D & Spatial Design', 'Craft', 'IC3', 4, [
    ['London', 'Brand', 2.0, 1, 1],
    ['New York', 'Product Design', 2.5, 2, 1],
    ['Remote', 'UX Research', 1.5, 1, 1],
  ]),
  ...design('Design Ops', 'Operations', 'IC3', 3, [
    ['London', 'Brand', 3.0, 2, 1],
    ['New York', 'Product Design', 2.0, 1, 1],
    ['Remote', 'UX Research', 3.5, 5, 2],
  ]),

  // ── Data (11 skills) ────────────────────────────────────────────────
  ...data('ML Model Deployment', 'MLOps', 'IC3', 3, [
    ['London', 'Analytics', 1.9, 10, 9],
    ['New York', 'Data Science', 2.3, 8, 7],
    ['Singapore', 'BI', 2.1, 6, 5],
    ['Remote', 'Data Eng', 2.6, 5, 4],
  ]),
  ...data('SQL & Query Optimisation', 'Technical', 'IC2', 4, [
    ['London', 'Analytics', 3.7, 10, 3],
    ['New York', 'Data Science', 4.0, 8, 1],
    ['Singapore', 'BI', 3.4, 6, 4],
    ['Remote', 'Data Eng', 3.8, 5, 2],
  ]),
  ...data('Data Storytelling', 'Communication', 'IC2', 3, [
    ['London', 'Analytics', 2.4, 10, 7],
    ['New York', 'Data Science', 2.7, 8, 5],
    ['Singapore', 'BI', 2.2, 6, 5],
    ['Remote', 'Data Eng', 2.5, 5, 4],
  ]),
  ...data('Feature Engineering', 'MLOps', 'IC3', 4, [
    ['London', 'Analytics', 2.1, 10, 8],
    ['New York', 'Data Science', 2.5, 8, 6],
    ['Singapore', 'BI', 1.9, 6, 6],
    ['Remote', 'Data Eng', 2.3, 5, 4],
  ]),
  ...data('Data Pipeline Design', 'Technical', 'IC3', 4, [
    ['London', 'Analytics', 2.8, 10, 7],
    ['New York', 'Data Science', 3.1, 8, 4],
    ['Singapore', 'BI', 2.5, 6, 5],
    ['Remote', 'Data Eng', 3.3, 5, 2],
  ]),
  ...data('Statistical Analysis', 'Analytical', 'IC2', 3, [
    ['London', 'Analytics', 3.2, 10, 4],
    ['New York', 'Data Science', 3.5, 8, 2],
    ['Singapore', 'BI', 3.0, 6, 3],
    ['Remote', 'Data Eng', 3.1, 5, 3],
  ]),
  ...data('Experiment Design (A/B)', 'Analytical', 'IC3', 3, [
    ['London', 'Analytics', 2.3, 10, 7],
    ['New York', 'Data Science', 2.7, 8, 5],
    ['Singapore', 'BI', 2.1, 6, 5],
    ['Remote', 'Data Eng', 2.5, 5, 4],
  ]),
  ...data('Data Governance', 'Operations', 'IC3', 3, [
    ['London', 'Analytics', 2.0, 10, 8],
    ['New York', 'Data Science', 2.4, 8, 6],
    ['Singapore', 'BI', 1.8, 6, 6],
    ['Remote', 'Data Eng', 2.2, 5, 4],
  ]),
  ...data('Business Intelligence', 'Analytical', 'IC2', 3, [
    ['London', 'Analytics', 3.4, 10, 4],
    ['New York', 'Data Science', 3.6, 8, 2],
    ['Singapore', 'BI', 3.8, 6, 1],
    ['Remote', 'Data Eng', 3.3, 5, 3],
  ]),
  ...data('LLM & Generative AI', 'MLOps', 'IC3', 3, [
    ['London', 'Analytics', 1.5, 10, 10],
    ['New York', 'Data Science', 1.8, 8, 8],
    ['Singapore', 'BI', 1.4, 6, 6],
    ['Remote', 'Data Eng', 1.7, 5, 5],
  ]),
  ...data('Stakeholder Communication', 'Collaboration', 'IC2', 3, [
    ['London', 'Analytics', 2.9, 10, 5],
    ['New York', 'Data Science', 3.1, 8, 3],
    ['Singapore', 'BI', 2.7, 6, 4],
    ['Remote', 'Data Eng', 3.0, 5, 3],
  ]),

  // ── Marketing (10 skills) ───────────────────────────────────────────
  ...mkt('Campaign Attribution', 'Analytics', 'IC2', 3, [
    ['London', 'Performance', 2.6, 9, 7],
    ['New York', 'Brand', 2.9, 7, 5],
    ['Remote', 'Content', 2.2, 6, 5],
  ]),
  ...mkt('SEO Strategy', 'Digital', 'IC2', 4, [
    ['London', 'Performance', 3.3, 9, 4],
    ['New York', 'Brand', 3.1, 7, 5],
    ['Remote', 'Content', 3.6, 6, 2],
  ]),
  ...mkt('Paid Media', 'Digital', 'IC2', 3, [
    ['London', 'Performance', 2.8, 9, 5],
    ['New York', 'Brand', 3.0, 7, 3],
    ['Remote', 'Content', 2.5, 6, 4],
  ]),
  ...mkt('Content Marketing', 'Communication', 'IC2', 3, [
    ['London', 'Performance', 3.4, 9, 3],
    ['New York', 'Brand', 3.6, 7, 2],
    ['Remote', 'Content', 3.8, 6, 1],
  ]),
  ...mkt('Marketing Analytics', 'Analytics', 'IC3', 4, [
    ['London', 'Performance', 2.4, 9, 7],
    ['New York', 'Brand', 2.7, 7, 5],
    ['Remote', 'Content', 2.1, 6, 6],
  ]),
  ...mkt('Email Marketing', 'Digital', 'IC1', 3, [
    ['London', 'Performance', 3.5, 9, 2],
    ['New York', 'Brand', 3.7, 7, 1],
    ['Remote', 'Content', 3.3, 6, 2],
  ]),
  ...mkt('Brand Strategy', 'Communication', 'IC3', 4, [
    ['London', 'Performance', 2.9, 9, 6],
    ['New York', 'Brand', 3.2, 7, 4],
    ['Remote', 'Content', 2.6, 6, 4],
  ]),
  ...mkt('Social Media Strategy', 'Digital', 'IC2', 3, [
    ['London', 'Performance', 3.1, 9, 4],
    ['New York', 'Brand', 3.4, 7, 2],
    ['Remote', 'Content', 3.6, 6, 1],
  ]),
  ...mkt('Customer Segmentation', 'Analytics', 'IC2', 3, [
    ['London', 'Performance', 2.5, 9, 6],
    ['New York', 'Brand', 2.8, 7, 4],
    ['Remote', 'Content', 2.3, 6, 5],
  ]),
  ...mkt('Conversion Optimisation', 'Analytics', 'IC3', 4, [
    ['London', 'Performance', 2.2, 9, 7],
    ['New York', 'Brand', 2.5, 7, 5],
    ['Remote', 'Content', 2.0, 6, 6],
  ]),

  // ── Sales (10 skills) ───────────────────────────────────────────────
  ...sales('Enterprise Negotiation', 'Closing', 'IC3', 4, [
    ['London', 'Enterprise', 2.4, 12, 10],
    ['New York', 'Mid-Market', 2.8, 10, 8],
    ['Singapore', 'APAC', 2.1, 6, 6],
  ]),
  ...sales('CRM Management', 'Operations', 'IC1', 4, [
    ['London', 'Enterprise', 3.4, 12, 4],
    ['New York', 'Mid-Market', 3.7, 10, 2],
    ['Singapore', 'APAC', 3.1, 6, 3],
  ]),
  ...sales('Sales Forecasting', 'Operations', 'IC2', 3, [
    ['London', 'Enterprise', 2.5, 12, 8],
    ['New York', 'Mid-Market', 2.8, 10, 6],
    ['Singapore', 'APAC', 2.2, 6, 5],
  ]),
  ...sales('Discovery & Qualification', 'Closing', 'IC2', 3, [
    ['London', 'Enterprise', 3.1, 12, 4],
    ['New York', 'Mid-Market', 3.4, 10, 3],
    ['Singapore', 'APAC', 2.9, 6, 4],
  ]),
  ...sales('Demo & Storytelling', 'Closing', 'IC2', 4, [
    ['London', 'Enterprise', 2.7, 12, 9],
    ['New York', 'Mid-Market', 3.0, 10, 6],
    ['Singapore', 'APAC', 2.5, 6, 5],
  ]),
  ...sales('Account Management', 'Retention', 'IC3', 4, [
    ['London', 'Enterprise', 3.2, 12, 5],
    ['New York', 'Mid-Market', 3.5, 10, 3],
    ['Singapore', 'APAC', 2.9, 6, 4],
  ]),
  ...sales('Objection Handling', 'Closing', 'IC2', 3, [
    ['London', 'Enterprise', 2.9, 12, 6],
    ['New York', 'Mid-Market', 3.2, 10, 3],
    ['Singapore', 'APAC', 2.6, 6, 5],
  ]),
  ...sales('Pipeline Management', 'Operations', 'IC2', 3, [
    ['London', 'Enterprise', 3.0, 12, 5],
    ['New York', 'Mid-Market', 3.3, 10, 3],
    ['Singapore', 'APAC', 2.7, 6, 4],
  ]),
  ...sales('Executive Engagement', 'Influence', 'IC4', 4, [
    ['London', 'Enterprise', 2.3, 4, 4],
    ['New York', 'Mid-Market', 2.6, 4, 3],
    ['Singapore', 'APAC', 2.0, 3, 3],
  ]),
  ...sales('Customer Success Handoff', 'Retention', 'IC2', 3, [
    ['London', 'Enterprise', 2.8, 12, 6],
    ['New York', 'Mid-Market', 3.1, 10, 4],
    ['Singapore', 'APAC', 2.5, 6, 5],
  ]),

  // ── People Ops (10 skills) ──────────────────────────────────────────
  ...people('Compensation Benchmarking', 'Total Rewards', 'IC3', 4, [
    ['London', 'HR Business Partners', 2.2, 6, 5],
    ['New York', 'Talent', 2.7, 5, 4],
    ['Remote', 'L&D', 2.4, 4, 4],
  ]),
  ...people('Organisational Design', 'Strategy', 'M1', 4, [
    ['London', 'HR Business Partners', 3.1, 4, 2],
    ['New York', 'Talent', 2.8, 3, 3],
    ['Remote', 'L&D', 2.5, 3, 3],
  ]),
  ...people('Performance Frameworks', 'Strategy', 'IC3', 4, [
    ['London', 'HR Business Partners', 2.9, 6, 4],
    ['New York', 'Talent', 3.2, 5, 2],
    ['Remote', 'L&D', 2.7, 4, 3],
  ]),
  ...people('Talent Acquisition', 'Talent', 'IC2', 3, [
    ['London', 'HR Business Partners', 3.4, 6, 2],
    ['New York', 'Talent', 3.7, 5, 1],
    ['Remote', 'L&D', 3.2, 4, 2],
  ]),
  ...people('Employee Relations', 'HR', 'IC3', 3, [
    ['London', 'HR Business Partners', 3.1, 6, 3],
    ['New York', 'Talent', 3.4, 5, 2],
    ['Remote', 'L&D', 2.9, 4, 3],
  ]),
  ...people('Learning & Development', 'Strategy', 'IC3', 4, [
    ['London', 'HR Business Partners', 2.6, 6, 4],
    ['New York', 'Talent', 2.9, 5, 3],
    ['Remote', 'L&D', 3.4, 4, 1],
  ]),
  ...people('DEI Strategy', 'Culture', 'M1', 4, [
    ['London', 'HR Business Partners', 2.4, 6, 5],
    ['New York', 'Talent', 2.7, 5, 4],
    ['Remote', 'L&D', 2.2, 4, 4],
  ]),
  ...people('HR Analytics', 'Analytical', 'IC2', 3, [
    ['London', 'HR Business Partners', 2.0, 6, 5],
    ['New York', 'Talent', 2.3, 5, 4],
    ['Remote', 'L&D', 1.8, 4, 4],
  ]),
  ...people('Change Management', 'Strategy', 'M1', 4, [
    ['London', 'HR Business Partners', 2.8, 4, 3],
    ['New York', 'Talent', 3.1, 3, 2],
    ['Remote', 'L&D', 2.5, 3, 3],
  ]),
  ...people('Employer Branding', 'Talent', 'IC2', 3, [
    ['London', 'HR Business Partners', 3.0, 6, 3],
    ['New York', 'Talent', 3.3, 5, 2],
    ['Remote', 'L&D', 2.8, 4, 3],
  ]),
];

export const DEPARTMENTS: Department[] = ['Engineering', 'Product', 'Design', 'Data', 'Marketing', 'Sales', 'People Ops'];
export const LOCATIONS: Location[] = ['London', 'New York', 'Berlin', 'Singapore', 'Remote'];
export const LEVELS: Level[] = ['IC1', 'IC2', 'IC3', 'IC4', 'M1', 'M2'];

export const DEPT_COLORS: Record<Department, string> = {
  Engineering: '#0ea5e9',
  Product: '#10b981',
  Design: '#f59e0b',
  Data: '#8b5cf6',
  Marketing: '#ec4899',
  Sales: '#ef4444',
  'People Ops': '#6366f1',
};
