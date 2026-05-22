import { useMemo, useState } from 'react';
import {
  ArrowLeft, AlertTriangle, TrendingDown, TrendingUp, Target, Users,
  ChevronRight, Star, MapPin, Tag, CalendarX, Clock,
} from 'lucide-react';
import { SKILLS_DATA, DEPT_COLORS, type Department, type SkillGapEntry } from '../data/mockData';
import {
  getCandidatesForSkill,
  getBlockedCandidatesForSkill,
  getReadinessTier,
  TIER_CONFIG,
  PEOPLE,
  type SkillCandidateMatch,
} from '../data/promotionData';

interface SkillSummary {
  skill: string;
  category: string;
  level: string;
  entries: SkillGapEntry[];
  totalHead: number;
  totalBelow: number;
  belowPct: number;
  avgActual: number;
  expectedLevel: number;
  gap: number;
}

function severityColor(pct: number) {
  if (pct >= 70) return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  if (pct >= 50) return { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' };
  if (pct >= 30) return { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' };
  return { bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' };
}

function severityLabel(pct: number) {
  if (pct >= 70) return 'Critical';
  if (pct >= 50) return 'Moderate';
  if (pct >= 30) return 'Mild';
  return 'On Track';
}

function CandidateRow({ match, variant }: { match: SkillCandidateMatch; variant: 'met' | 'blocked' }) {
  const tier = getReadinessTier(match.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const initials = match.person.name.split(' ').map(n => n[0]).join('');
  const nextTitle = match.targetLevelLabel.split('·')[1]?.trim() ?? match.targetLevelLabel;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${variant === 'met' ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{match.person.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400 truncate">{match.person.team}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={8} />{match.person.location}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{match.readinessPct}%</span>
        <p className="text-[10px] text-gray-400 mt-0.5">{nextTitle}</p>
      </div>
      <div className={`text-xs font-bold flex-shrink-0 ${variant === 'met' ? 'text-teal-600' : 'text-red-500'}`}>
        {match.actualRating}/{match.requiredRating}
      </div>
    </div>
  );
}

interface SkillDetailProps {
  summary: SkillSummary;
  department: Department;
  onNavigateToPipeline?: () => void;
}

function SkillDetail({ summary, department, onNavigateToPipeline }: SkillDetailProps) {
  const { skill, entries, totalHead, totalBelow, belowPct, avgActual, expectedLevel, category, level } = summary;
  const colors = severityColor(belowPct);
  const exceeding = avgActual > expectedLevel;

  const sorted = [...entries].sort((a, b) => (b.belowTarget / b.headcount) - (a.belowTarget / a.headcount));

  const promoCandidates = useMemo(() => getCandidatesForSkill(skill, department), [skill, department]);
  const blockedCandidates = useMemo(() => getBlockedCandidatesForSkill(skill, department), [skill, department]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{category}</span>
              <span className="text-gray-200">·</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{level}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{skill}</h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
            {severityLabel(belowPct)}
          </span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Users size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-500">Headcount</span>
            </div>
            <p className="text-base font-black text-gray-900">{totalHead}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 border ${exceeding ? 'bg-sky-50 border-sky-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-1 mb-0.5">
              {exceeding ? <TrendingUp size={11} className="text-sky-500" /> : <TrendingDown size={11} className="text-red-400" />}
              <span className={`text-[10px] font-medium ${exceeding ? 'text-sky-600' : 'text-red-500'}`}>
                {exceeding ? 'Exceeding' : 'Below'}
              </span>
            </div>
            <p className={`text-base font-black ${exceeding ? 'text-sky-600' : 'text-red-600'}`}>
              {exceeding ? `+${(avgActual - expectedLevel).toFixed(1)}` : `${belowPct}%`}
              {!exceeding && <span className="text-xs font-normal text-red-400 ml-0.5">({totalBelow})</span>}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Target size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-500">Avg actual</span>
            </div>
            <p className="text-base font-black text-gray-900">
              {avgActual.toFixed(1)}
              <span className="text-xs font-normal text-gray-400 ml-0.5">/ {expectedLevel}.0</span>
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="flex items-center gap-1 mb-0.5">
              <AlertTriangle size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-500">Gap</span>
            </div>
            <p className="text-base font-black text-gray-900">
              {exceeding ? '—' : Math.max(0, expectedLevel - avgActual).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Location / team breakdown */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Breakdown by location & team</h3>
        <div className="space-y-5">
          {sorted.map((entry, i) => {
            const pct = entry.headcount > 0 ? Math.round((entry.belowTarget / entry.headcount) * 100) : 0;
            const exc = entry.averageActual > entry.expectedLevel;
            const ec = severityColor(pct);
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-800">{entry.location}</span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{entry.team}</span>
                    <span className="text-xs text-gray-400">{entry.headcount} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {exc ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        Exceeding +{(entry.averageActual - entry.expectedLevel).toFixed(1)}
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500">{entry.belowTarget} below</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ec.badge}`}>{pct}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="mb-1">
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${exc ? 'bg-sky-400' : ec.bar}`}
                      style={{ width: exc ? '100%' : `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Actual: {entry.averageActual.toFixed(1)}</span>
                  <span>Expected: {entry.expectedLevel}.0</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Promotion pipeline bridge */}
      {(promoCandidates.length > 0 || blockedCandidates.length > 0) && (
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Promotion pipeline impact</h3>
          <div className="space-y-6">
            {promoCandidates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={13} className="text-teal-500" />
                  <span className="text-sm font-semibold text-teal-700">
                    {promoCandidates.length} {promoCandidates.length === 1 ? 'person meets' : 'people meet'} next-level criteria for this skill
                  </span>
                </div>
                <div className="space-y-2">
                  {promoCandidates.map(m => <CandidateRow key={m.person.id} match={m} variant="met" />)}
                </div>
              </div>
            )}
            {blockedCandidates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-red-400" />
                  <span className="text-sm font-semibold text-red-600">
                    {blockedCandidates.length} {blockedCandidates.length === 1 ? 'person is' : 'people are'} blocked on this skill
                  </span>
                </div>
                <div className="space-y-2">
                  {blockedCandidates.map(m => <CandidateRow key={m.person.id} match={m} variant="blocked" />)}
                </div>
              </div>
            )}
            {onNavigateToPipeline && (
              <button
                onClick={onNavigateToPipeline}
                className="text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 hover:bg-sky-100 hover:border-sky-300 transition-colors font-medium w-full text-left"
              >
                View full promotion pipeline &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested actions */}
      <div className="px-8 py-6 bg-white">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Suggested actions</h3>
        <div className="space-y-2">
          <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
            Find internal mentors with this skill &rarr;
          </button>
          <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
            Set as department focus skill &rarr;
          </button>
          <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
            Export gap report for this skill &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

const TODAY = new Date('2026-04-29');

function daysSince(dateStr: string) {
  return Math.floor((TODAY.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function CheckInDetail({ department }: { department: Department }) {
  const people = PEOPLE.filter(p => p.department === department);
  const flagged = people
    .filter(p => p.lastCheckIn)
    .map(p => ({ person: p, days: daysSince(p.lastCheckIn!) }))
    .filter(f => f.days > 30)
    .sort((a, b) => b.days - a.days);

  const critical = flagged.filter(f => f.days >= 90);
  const overdue = flagged.filter(f => f.days < 90);
  const coveragePct = Math.round(((people.length - flagged.length) / people.length) * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Engagement</span>
            <h2 className="text-lg font-bold text-gray-900">Check-in Coverage</h2>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            flagged.length === 0 ? 'bg-emerald-100 text-emerald-700' :
            critical.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {flagged.length === 0 ? 'All current' : critical.length > 0 ? 'Critical' : 'Overdue'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Users size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-500">Team size</span>
            </div>
            <p className="text-base font-black text-gray-900">{people.length}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 border ${flagged.length === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-1 mb-0.5">
              <CalendarX size={11} className={flagged.length === 0 ? 'text-emerald-500' : 'text-red-400'} />
              <span className={`text-[10px] font-medium ${flagged.length === 0 ? 'text-emerald-600' : 'text-red-500'}`}>Not in</span>
            </div>
            <p className={`text-base font-black ${flagged.length === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {flagged.length}
              <span className="text-xs font-normal ml-0.5 opacity-60">/ {people.length}</span>
            </p>
          </div>
          <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100">
            <div className="flex items-center gap-1 mb-0.5">
              <AlertTriangle size={11} className="text-red-400" />
              <span className="text-[10px] text-red-500">Critical</span>
            </div>
            <p className="text-base font-black text-red-600">{critical.length}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 border ${coveragePct >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className="flex items-center gap-1 mb-0.5">
              <Target size={11} className={coveragePct >= 80 ? 'text-emerald-500' : 'text-amber-500'} />
              <span className={`text-[10px] ${coveragePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>Coverage</span>
            </div>
            <p className={`text-base font-black ${coveragePct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{coveragePct}%</p>
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="px-8 py-5 border-b border-gray-100 bg-white">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Coverage breakdown</h3>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${coveragePct}%` }} />
            {overdue.length > 0 && (
              <div className="h-full bg-amber-400" style={{ width: `${Math.round((overdue.length / people.length) * 100)}%` }} />
            )}
            {critical.length > 0 && (
              <div className="h-full bg-red-500" style={{ width: `${Math.round((critical.length / people.length) * 100)}%` }} />
            )}
          </div>
          <span className="text-sm font-bold text-gray-600 w-10 text-right">{coveragePct}%</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Current ({people.length - flagged.length})</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Overdue 30–90d ({overdue.length})</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Critical 90d+ ({critical.length})</span>
        </div>
      </div>

      {flagged.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
            <CalendarX size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-gray-700 mb-1">Everyone is up to date</p>
          <p className="text-xs text-gray-400">All {people.length} team members have checked in within the last 30 days.</p>
        </div>
      ) : (
        <div className="px-8 py-6 bg-white">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {flagged.length} people need follow-up — sorted by days overdue
          </h3>
          <div className="space-y-2">
            {flagged.map(({ person, days }) => {
              const isCritical = days >= 90;
              const initials = person.name.split(' ').map(n => n[0]).join('');
              return (
                <div key={person.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isCritical ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCritical ? 'text-red-800' : 'text-amber-800'}`}>{person.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{person.team}</span>
                      <span className="text-gray-300 text-[10px]">·</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={8} />{person.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>{days}d ago</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                      {isCritical ? 'Critical' : 'Overdue'}
                    </p>
                  </div>
                  <Clock size={14} className={`flex-shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
              );
            })}
          </div>

          {/* Suggested actions */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Suggested actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                Send check-in reminder to overdue team members &rarr;
              </button>
              <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                Escalate critical cases to their manager &rarr;
              </button>
              <button className="w-full text-left text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-gray-100 transition-colors">
                Export check-in report for {department} &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  department: Department;
  onBack: () => void;
  onNavigateToPipeline?: () => void;
}

export function SkillGapReport({ department, onBack, onNavigateToPipeline }: Props) {
  const deptColor = DEPT_COLORS[department];

  const skillSummaries = useMemo((): SkillSummary[] => {
    const entries = SKILLS_DATA.filter(e => e.department === department);
    const skills = Array.from(new Set(entries.map(e => e.skill)));

    return skills.map(skill => {
      const skillEntries = entries.filter(e => e.skill === skill);
      const totalHead = skillEntries.reduce((s, e) => s + e.headcount, 0);
      const totalBelow = skillEntries.reduce((s, e) => s + e.belowTarget, 0);
      const belowPct = totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0;
      const avgActual = totalHead > 0
        ? skillEntries.reduce((s, e) => s + e.averageActual * e.headcount, 0) / totalHead
        : 0;
      const expectedLevel = skillEntries[0].expectedLevel;
      const gap = Math.max(0, expectedLevel - avgActual);

      return {
        skill,
        category: skillEntries[0].category,
        level: skillEntries[0].level,
        entries: skillEntries,
        totalHead,
        totalBelow,
        belowPct,
        avgActual: parseFloat(avgActual.toFixed(2)),
        expectedLevel,
        gap,
      };
    }).sort((a, b) => b.belowPct - a.belowPct);
  }, [department]);

  const deptPeople = useMemo(() => PEOPLE.filter(p => p.department === department), [department]);
  const deptFlagged = useMemo(() =>
    deptPeople.filter(p => p.lastCheckIn && Math.floor((TODAY.getTime() - new Date(p.lastCheckIn).getTime()) / (1000 * 60 * 60 * 24)) > 30),
    [deptPeople]
  );
  const checkInCoveragePct = deptPeople.length > 0
    ? Math.round(((deptPeople.length - deptFlagged.length) / deptPeople.length) * 100)
    : 100;

  const [selectedSkill, setSelectedSkill] = useState<string>(skillSummaries[0]?.skill ?? '');

  const selectedSummary = skillSummaries.find(s => s.skill === selectedSkill) ?? skillSummaries[0];

  // Group by category for the sidebar
  const byCategory = useMemo(() => {
    const map = new Map<string, SkillSummary[]>();
    for (const s of skillSummaries) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return map;
  }, [skillSummaries]);

  const orgStats = useMemo(() => {
    const totalHead = skillSummaries.reduce((s, x) => s + x.totalHead, 0);
    const totalBelow = skillSummaries.reduce((s, x) => s + x.totalBelow, 0);
    const criticalCount = skillSummaries.filter(s => s.belowPct >= 60).length;
    return { totalHead, totalBelow, pct: totalHead > 0 ? Math.round((totalBelow / totalHead) * 100) : 0, criticalCount };
  }, [skillSummaries]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Page header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex-shrink-0" data-tour="gap-report-dept-header">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to heatmap
          </button>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: deptColor }}>
              {department[0]}
            </div>
            <span className="text-sm font-semibold text-gray-900">{department}</span>
          </div>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">Areas to Improve</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: deptColor }}>
              {department[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{department} · Areas to Improve</h1>
              <p className="text-xs text-gray-400 mt-0.5">{skillSummaries.length} skills tracked · {orgStats.pct}% of workforce below target</p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex items-center gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-red-600">{orgStats.criticalCount}</p>
              <p className="text-[10px] text-red-500 font-medium">Below expected</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-gray-900">{orgStats.totalBelow}</p>
              <p className="text-[10px] text-gray-500 font-medium">People below target</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-center">
              <p className="text-xl font-black text-orange-600">{orgStats.pct}%</p>
              <p className="text-[10px] text-orange-500 font-medium">Below target rate</p>
            </div>
          </div>
        </div>
      </header>

      {/* Body: sidebar + detail */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Skills sidebar */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto" data-tour="gap-report-dept-sidebar">
          <div className="p-4">
            {/* Check-in entry */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <CalendarX size={10} className="text-gray-300" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Engagement</span>
              </div>
              <button
                onClick={() => setSelectedSkill('__checkins__')}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group ${
                  selectedSkill === '__checkins__'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-xs font-semibold truncate ${selectedSkill === '__checkins__' ? 'text-white' : 'text-gray-800'}`}>
                    Check-in Coverage
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      deptFlagged.length === 0 ? 'bg-emerald-400' :
                      deptFlagged.some(p => p.lastCheckIn && daysSince(p.lastCheckIn) >= 90) ? 'bg-red-500' : 'bg-amber-400'
                    }`} />
                    <ChevronRight size={11} className={selectedSkill === '__checkins__' ? 'text-gray-400' : 'text-gray-300 group-hover:text-gray-500'} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={selectedSkill === '__checkins__' ? 'text-gray-400' : 'text-gray-400'}>{deptFlagged.length} not checked in</span>
                  <span className={`font-bold ${selectedSkill === '__checkins__' ? 'text-gray-300' : 'text-gray-500'}`}>{checkInCoveragePct}%</span>
                </div>
                <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedSkill === '__checkins__' ? 'bg-white/60' : deptFlagged.length === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${checkInCoveragePct}%` }}
                  />
                </div>
              </button>
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Skills · sorted by severity
            </p>
            <div className="space-y-5">
              {Array.from(byCategory.entries()).map(([category, skills]) => (
                <div key={category}>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <Tag size={10} className="text-gray-300" />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{category}</span>
                  </div>
                  <div className="space-y-1">
                    {skills.map(s => {
                      const colors = severityColor(s.belowPct);
                      const isSelected = s.skill === selectedSkill;
                      return (
                        <button
                          key={s.skill}
                          onClick={() => setSelectedSkill(s.skill)}
                          className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group ${
                            isSelected
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                              {s.skill}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                              <ChevronRight size={11} className={isSelected ? 'text-gray-400' : 'text-gray-300 group-hover:text-gray-500'} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={isSelected ? 'text-gray-400' : 'text-gray-400'}>{s.totalBelow} below</span>
                            <span className={`font-bold ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>{s.belowPct}%</span>
                          </div>
                          <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isSelected ? 'bg-white/60' : colors.bar}`}
                              style={{ width: `${s.belowPct}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-hidden bg-gray-50" data-tour="gap-report-dept-detail">
          {selectedSkill === '__checkins__' ? (
            <CheckInDetail department={department} />
          ) : selectedSummary ? (
            <SkillDetail
              summary={selectedSummary}
              department={department}
              onNavigateToPipeline={onNavigateToPipeline}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a skill to see the full breakdown
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
