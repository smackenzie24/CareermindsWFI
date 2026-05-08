import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Users, TrendingUp, Star, Clock, DollarSign, Building2, CalendarCheck, Sparkles } from 'lucide-react';
import { ExportButtons } from '../ExportButtons';
import { HiddenTalent } from './HiddenTalent';
import { getCrossDeptFitCandidates } from '../../data/promotionData';
import {
  getAllReadiness,
  TIER_CONFIG,
  TIER_RANGES,
  getReadinessTier,
  groupByTier,
  DEPT_COLORS,
  PEOPLE,
  type Department,
} from '../../data/promotionData';
import { DEPARTMENTS } from '../../data/mockData';
import { DeptPipelineView } from './DeptPipelineView';
import { UpsellBanner } from '../UpsellBanner';
import { FeedbackBanner } from '../feedback/FeedbackBanner';

const DEPT_SALARIES: Record<Department, number> = {
  Engineering: 128000,
  Product: 118000,
  Design: 102000,
  Data: 122000,
  Marketing: 88000,
  Sales: 95000,
  'People Ops': 90000,
};

const CHECKIN_CUTOFF = new Date('2026-04-29');
function computeOrgSummary() {
  const deptCounts = new Map<Department, number>();
  for (const dept of DEPARTMENTS) deptCounts.set(dept, 0);
  for (const p of PEOPLE) deptCounts.set(p.department, (deptCounts.get(p.department) ?? 0) + 1);

  let totalCost = 0;
  for (const p of PEOPLE) totalCost += DEPT_SALARIES[p.department];

  const headcount = PEOPLE.length;
  const avgSalary = Math.round(totalCost / headcount);
  const roleLevels = new Set(PEOPLE.map(p => p.currentLevelId)).size;
  const deptBreakdown = DEPARTMENTS
    .map(d => ({ dept: d, count: deptCounts.get(d) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const checkedIn = PEOPLE.filter(p =>
    Math.floor((CHECKIN_CUTOFF.getTime() - new Date(p.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)) <= 30
  ).length;
  const checkInCoverage = Math.round((checkedIn / headcount) * 100);

  return { headcount, totalCost, avgSalary, roleLevels, deptBreakdown, checkInCoverage };
}

const ORG_SUMMARY = computeOrgSummary();

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface DeptPipelineSummary {
  department: Department;
  color: string;
  total: number;
  nearReady: number;
  progressing: number;
  developing: number;
  early: number;
  avgReadiness: number;
  topCandidate: string;
  topCandidatePct: number;
  transitions: number;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function OrgExpandedCards() {
  const max = ORG_SUMMARY.deptBreakdown[0]?.count ?? 1;
  return (
    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100 mt-4">
      {/* Check-in coverage */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck size={14} className={ORG_SUMMARY.checkInCoverage >= 80 ? 'text-emerald-500' : 'text-amber-500'} />
          <span className="text-xs text-gray-500">Check-in Coverage</span>
        </div>
        <p className={`text-3xl font-black ${ORG_SUMMARY.checkInCoverage >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{ORG_SUMMARY.checkInCoverage}%</p>
        <p className="text-xs text-gray-400 mt-1">checked in (30d)</p>
      </div>

      {/* Total cost */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Est. Total Cost</span>
        </div>
        <p className="text-3xl font-black text-gray-900">{fmtCurrency(ORG_SUMMARY.totalCost)}</p>
        <p className="text-xs text-gray-400 mt-1">annual salaries</p>
      </div>

      {/* Avg salary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Avg Salary</span>
        </div>
        <p className="text-3xl font-black text-gray-900">{fmtCurrency(ORG_SUMMARY.avgSalary)}</p>
        <p className="text-xs text-gray-400 mt-1">per employee</p>
      </div>

      {/* Headcount by dept */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Team Headcount</span>
        </div>
        <div className="space-y-2 mt-1">
          {ORG_SUMMARY.deptBreakdown.map(({ dept, count }) => (
            <div key={dept}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-500 truncate pr-2">{dept}</span>
                <span className="text-[10px] font-bold text-gray-600 flex-shrink-0">{count}</span>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(count / max) * 100}%`, background: DEPT_COLORS[dept] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  initialDepartment?: Department;
  selectedDept?: Department | null;
  onSelectDept?: (dept: Department | null) => void;
  onNavigateToGapReport?: (dept: Department) => void;
  onNavigateToManagers?: (managerId?: string) => void;
}

export function PromotionPipeline({ initialDepartment, selectedDept: selectedDeptProp, onSelectDept, onNavigateToGapReport, onNavigateToManagers }: Props) {
  const [internalDept, setInternalDept] = useState<Department | null>(initialDepartment ?? null);
  const selectedDept = selectedDeptProp !== undefined ? selectedDeptProp : internalDept;
  const setSelectedDept = (dept: Department | null) => {
    setInternalDept(dept);
    onSelectDept?.(dept);
  };
  const [orgExpanded, setOrgExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'hidden-talent'>('pipeline');
  const hiddenTalentCount = useMemo(() => getCrossDeptFitCandidates().length, []);

  const allResults = useMemo(() => getAllReadiness(), []);

  const orgStats = useMemo(() => {
    const tiers = groupByTier(allResults);
    const n = allResults.length;
    let sumReadiness = 0, sumTenure = 0;
    for (const r of allResults) { sumReadiness += r.readinessPct; sumTenure += r.person.tenure; }
    return {
      total: n,
      nearReady: tiers['near-ready'],
      progressing: tiers['progressing'],
      avgReadiness: n > 0 ? Math.round(sumReadiness / n) : 0,
      avgTenure: n > 0 ? Math.round(sumTenure / n) : 0,
    };
  }, [allResults]);

  const deptSummaries = useMemo((): DeptPipelineSummary[] => {
    return DEPARTMENTS.map(dept => {
      const results = allResults.filter(r => r.person.department === dept);

      const tiers = groupByTier(results);
      const nearReady = tiers['near-ready'];
      const progressing = tiers['progressing'];
      const developing = tiers['developing'];
      const early = tiers['early'];
      const n = results.length;
      const avgReadiness = n > 0 ? Math.round(results.reduce((s, r) => s + r.readinessPct, 0) / n) : 0;
      const top = results.reduce<typeof results[0] | null>((max, r) => !max || r.readinessPct > max.readinessPct ? r : max, null);
      const transitions = new Set(results.map(r => r.targetLevelId)).size;

      return {
        department: dept,
        color: DEPT_COLORS[dept],
        total: results.length,
        nearReady,
        progressing,
        developing,
        early,
        avgReadiness,
        topCandidate: top?.person.name ?? '—',
        topCandidatePct: top?.readinessPct ?? 0,
        transitions,
      };
    });
  }, [allResults]);

  function buildExportContent(): string {
    const lines: string[] = [
      'PROMOTION READINESS PIPELINE — ACME CORP',
      `Generated: ${new Date().toLocaleDateString()}`,
      '='.repeat(50),
      '',
      `Total tracked: ${orgStats.total}`,
      `Near ready (90%+): ${orgStats.nearReady}`,
      `Progressing (70-89%): ${orgStats.progressing}`,
      `Avg readiness: ${orgStats.avgReadiness}%`,
      `Avg tenure in level: ${orgStats.avgTenure}m`,
      '',
      'BY DEPARTMENT',
      '-'.repeat(50),
    ];
    for (const d of deptSummaries) {
      if (d.total === 0) continue;
      lines.push(`${d.department}: ${d.total} people | ${d.nearReady} near-ready | ${d.progressing} progressing | avg ${d.avgReadiness}%`);
      if (d.nearReady > 0) lines.push(`  Top candidate: ${d.topCandidate} (${d.topCandidatePct}%)`);
    }
    return lines.join('\n');
  }

  if (selectedDept) {
    return (
      <DeptPipelineView
        department={selectedDept}
        onBack={() => setSelectedDept(null)}
        onNavigateToGapReport={onNavigateToGapReport}
        onNavigateToManagers={onNavigateToManagers}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Workforce Intelligence</p>
            <h1 className="text-2xl font-bold text-gray-900">Promotion Readiness Pipeline</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Who's close to the next level? Click a department to see individual readiness scores and skill gaps.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons title="Promotion Readiness Pipeline" buildContent={buildExportContent} />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Acme Corp
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4" data-tour="pipeline-stat-cards">
          <StatCard
            label="Tracked for promotion"
            value={orgStats.total}
            sub="people assessed org-wide"
            color="text-gray-900"
            icon={<Users size={14} className="text-gray-400" />}
          />
          <StatCard
            label="Near ready (90%+)"
            value={orgStats.nearReady}
            sub="meet 90%+ of next-level criteria"
            color="text-emerald-600"
            icon={<Star size={14} className="text-emerald-400" />}
          />
          <StatCard
            label="Progressing (70–89%)"
            value={orgStats.progressing}
            sub="on track, closing gaps"
            color="text-sky-600"
            icon={<TrendingUp size={14} className="text-sky-400" />}
          />
          <StatCard
            label="Avg readiness score"
            value={`${orgStats.avgReadiness}%`}
            sub={`avg ${orgStats.avgTenure}m in current level`}
            color="text-gray-800"
            icon={<Clock size={14} className="text-gray-400" />}
          />
        </div>

        {orgExpanded && <OrgExpandedCards />}

        <div className="flex justify-center mt-4">
          <button
            onClick={() => setOrgExpanded(e => !e)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors group"
          >
            {orgExpanded ? <ChevronUp size={13} className="group-hover:text-gray-600" /> : <ChevronDown size={13} className="group-hover:text-gray-600" />}
            {orgExpanded ? 'Hide org summary' : 'Show org summary'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-8 flex items-center gap-0">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pipeline'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Users size={14} />
          Pipeline
        </button>
        <button
          onClick={() => setActiveTab('hidden-talent')}
          className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'hidden-talent'
              ? 'border-sky-500 text-sky-700'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Sparkles size={14} />
          Hidden Talent
          {hiddenTalentCount > 0 && (
            <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
              {hiddenTalentCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'hidden-talent' ? (
        <main className="flex-1 overflow-auto p-8">
          <HiddenTalent />
        </main>
      ) : (
      <>
      {/* Tier legend */}
      <div className="bg-white border-b border-gray-100 px-8 py-3 flex items-center gap-6" data-tour="pipeline-tier-legend">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Readiness tiers:</span>
        {(Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tier, cfg]) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.barColor}`} />
            <span className="text-xs text-gray-600 font-medium">{cfg.label}</span>
            <span className="text-xs text-gray-400">{TIER_RANGES[tier]}</span>
          </div>
        ))}
      </div>

      {/* Department cards */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-5">
          <p className="text-sm text-gray-500">Click a department to explore individual candidates and skill gaps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-tour="pipeline-dept-grid">
          {deptSummaries.map((dept) => (
            <button
              key={dept.department}
              disabled={dept.total === 0}
              onClick={() => setSelectedDept(dept.department)}
              className="text-left rounded-2xl border border-gray-200 bg-white p-6 group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 enabled:hover:shadow-lg enabled:hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-default"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: dept.color }}
                  >
                    {dept.department[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{dept.department}</h3>
                    <p className="text-xs text-gray-400">
                      {dept.total > 0
                        ? `${dept.total} people · ${dept.transitions} transition${dept.transitions !== 1 ? 's' : ''}`
                        : 'No pipeline data yet'}
                    </p>
                  </div>
                </div>
                {dept.total > 0 && (
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>

              {dept.total === 0 ? (
                <div className="h-24 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-gray-300">No candidates tracked yet</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">Pipeline breakdown</span>
                      <span className="text-xs font-bold text-gray-700">{dept.avgReadiness}% avg readiness</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-100">
                      {dept.nearReady > 0 && (
                        <div className="bg-emerald-500 transition-all" style={{ width: `${(dept.nearReady / dept.total) * 100}%` }} title={`${dept.nearReady} near ready`} />
                      )}
                      {dept.progressing > 0 && (
                        <div className="bg-sky-500 transition-all" style={{ width: `${(dept.progressing / dept.total) * 100}%` }} title={`${dept.progressing} progressing`} />
                      )}
                      {dept.developing > 0 && (
                        <div className="bg-amber-400 transition-all" style={{ width: `${(dept.developing / dept.total) * 100}%` }} title={`${dept.developing} developing`} />
                      )}
                      {dept.early > 0 && (
                        <div className="bg-gray-300 transition-all" style={{ width: `${(dept.early / dept.total) * 100}%` }} title={`${dept.early} early stage`} />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {([['near-ready', dept.nearReady], ['progressing', dept.progressing], ['developing', dept.developing], ['early', dept.early]] as const).map(([tier, count]) => {
                      const cfg = TIER_CONFIG[tier];
                      return (
                        <div key={tier} className={`rounded-lg p-2 text-center ${cfg.bg}`}>
                          <p className={`text-lg font-black leading-none ${cfg.color}`}>{count}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{cfg.label.split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>

                  {dept.nearReady > 0 ? (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                      <Star size={11} className="text-emerald-500 flex-shrink-0" />
                      <span>Top candidate: <strong>{dept.topCandidate}</strong> ({dept.topCandidatePct}% ready)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <TrendingUp size={11} className="text-sky-400 flex-shrink-0" />
                      <span>Highest: <strong>{dept.topCandidate}</strong> ({dept.topCandidatePct}% ready)</span>
                    </div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Keystone upsell — leadership development */}
        <UpsellBanner variant="leadership-dev" className="mt-6" />
        <FeedbackBanner context="Promotion Pipeline" className="mt-4" />
      </main>
      </>
      )}
    </div>
  );
}
