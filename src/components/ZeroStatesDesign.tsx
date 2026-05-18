import {
  LayoutGrid, Settings, AlertTriangle, CalendarX, ChevronRight,
  ArrowLeft, Filter, BarChart2, Users, Target, Info, X,
  PanelRightClose, ClipboardList, Sparkles, CheckCircle2,
  PlusCircle, Search, RefreshCw
} from 'lucide-react';

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ number, id, title, description }: { number: string; id: string; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold text-gray-400 tabular-nums">{number}</span>
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest font-mono">{id}</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{description}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-14" />;
}

function Label({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'sky' | 'amber' | 'emerald' | 'red' }) {
  const cls: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-500',
    sky: 'bg-sky-50 text-sky-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cls[color]}`}>
      {children}
    </span>
  );
}

// ── Frame wrapper — simulates the app chrome ──────────────────────────────────

function Frame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm ${className}`}>
      {/* Fake top nav strip */}
      <div className="h-9 bg-[#0B1628] flex items-center px-4 gap-3 flex-shrink-0">
        <div className="w-20 h-3 bg-white/10 rounded" />
        <div className="flex-1" />
        {['Skills', 'Pipeline', 'Managers', 'Benchmarks'].map(l => (
          <span key={l} className="text-[10px] text-white/30 font-medium">{l}</span>
        ))}
        <div className="w-14 h-5 bg-sky-500/30 rounded-md ml-2" />
      </div>
      {children}
    </div>
  );
}

function FrameWithBreadcrumb({ dept, children }: { dept: string; children: React.ReactNode }) {
  return (
    <Frame>
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <button className="flex items-center gap-1 text-xs text-sky-600 font-medium hover:underline">
          <ArrowLeft size={11} /> All departments
        </button>
        <ChevronRight size={11} className="text-gray-300" />
        <span className="text-xs font-semibold text-gray-700">{dept}</span>
      </div>
      {children}
    </Frame>
  );
}

// ── TICKET 10 — No Skills Framework (Full Page Zero State) ────────────────────

function Ticket10() {
  return (
    <Frame>
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50/30 min-h-[420px]">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-6 shadow-sm">
          <LayoutGrid size={32} className="text-gray-300" />
        </div>

        {/* Copy */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 max-w-sm">
          Your skills framework isn't set up yet
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-md mb-8">
          The Skills Gap Heatmap shows you — at a glance — where your people are falling short of the level the business needs. To get started, define the skills and expected proficiency levels for each department.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors shadow-sm">
            <Settings size={14} />
            Set up your skills framework
          </button>
          <button className="text-sm text-gray-400 hover:text-sky-600 transition-colors underline underline-offset-2">
            Learn how it works
          </button>
        </div>

        {/* What you'll see preview */}
        <div className="mt-12 flex items-center gap-6 opacity-40 pointer-events-none select-none">
          {['Engineering', 'Product', 'Design', 'Data'].map(dept => (
            <div key={dept} className="w-28 bg-white rounded-xl border border-gray-200 p-3 text-left">
              <div className="h-2 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
              <div className="h-1.5 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-300 mt-3">Department cards will appear here once skills are configured</p>
      </div>
    </Frame>
  );
}

// ── TICKET 11 — Department Has No Skills ──────────────────────────────────────

function Ticket11() {
  return (
    <FrameWithBreadcrumb dept="Engineering">
      {/* Page header — still visible but stats hidden */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Engineering</h1>
          <p className="text-xs text-gray-400 mt-0.5">Skills Gap Heatmap</p>
        </div>
        <div className="flex items-center gap-4">
          {['% below target', 'Avg gap', 'Skills'].map(l => (
            <div key={l} className="text-center">
              <p className="text-base font-bold text-gray-200">—</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zero state body */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[360px] bg-gray-50/20">
        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-5">
          <Settings size={26} className="text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">
          No skills configured for Engineering yet
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
          Add the skills and expected levels for this department to start tracking gaps and identifying who needs support.
        </p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors shadow-sm">
          <PlusCircle size={13} />
          Configure Engineering skills
        </button>
      </div>
    </FrameWithBreadcrumb>
  );
}

// ── TICKET 12 — No Check-in Data ──────────────────────────────────────────────

function Ticket12() {
  return (
    <FrameWithBreadcrumb dept="Design">
      {/* Department header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Design</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">6 skills tracked</span>
              <span className="text-xs font-semibold text-red-500">3 below target</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
              <Filter size={11} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main heatmap area (skeleton) */}
        <div className="flex-1 p-4 min-h-[300px]">
          {/* Skill rows placeholder */}
          <div className="space-y-1.5">
            {['Design Systems', 'User Research', 'Prototyping', 'Visual Design', 'Motion Design', 'Accessibility'].map((skill, i) => (
              <div key={skill} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-600 w-28 truncate">{skill}</span>
                <div className="flex gap-1">
                  {[0,1,2].map(j => (
                    <div key={j} className={`w-10 h-6 rounded text-[10px] font-semibold flex items-center justify-center ${
                      (i + j) % 3 === 0 ? 'bg-red-100 text-red-600' : (i + j) % 3 === 1 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {2 + ((i + j) % 3)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Check-in row — zero state */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="flex items-center gap-1.5 w-28">
                  <CalendarX size={11} className="text-gray-400" />
                  <span className="text-[11px] text-gray-500 font-medium">Check-in Coverage</span>
                </div>
                {/* Zero state cell — neutral, no red */}
                <div className="flex-1 h-6 rounded bg-gray-100 border border-dashed border-gray-200 flex items-center px-2.5 gap-1.5">
                  <span className="text-[10px] text-gray-400 font-medium">No check-ins yet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in panel zero state */}
        <div className="w-64 border-l border-gray-100 flex flex-col bg-gray-50/30">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Engagement</p>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5">Check-in Coverage</h3>
            </div>
            <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
              <X size={12} />
            </button>
          </div>

          {/* Stats — dashes */}
          <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-gray-100">
            {['Team size', 'Not checked in', 'Critical 90d+', 'Coverage'].map(label => (
              <div key={label} className="bg-white rounded-lg px-2 py-1.5 border border-gray-100 text-center">
                <p className="text-base font-bold text-gray-200">—</p>
                <p className="text-[9px] text-gray-300 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Zero state content */}
          <div className="flex-1 p-4 flex flex-col items-center text-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <CalendarX size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Check-ins not started</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Check-ins track how recently each person has had a development conversation. Once people start logging check-ins, you'll see coverage and overdue alerts here.
              </p>
            </div>
            <button className="w-full text-center text-xs font-semibold text-white bg-sky-600 rounded-xl py-2 hover:bg-sky-700 transition-colors">
              Send first check-in prompt
            </button>
            {/* Export hidden */}
            <p className="text-[10px] text-gray-300 italic">Export check-in report is hidden until data exists</p>
          </div>
        </div>
      </div>
    </FrameWithBreadcrumb>
  );
}

// ── TICKET 13 — Skills Set Up, No Assessments ─────────────────────────────────

function Ticket13() {
  return (
    <FrameWithBreadcrumb dept="Product">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Product</h1>
          <p className="text-xs text-gray-400 mt-0.5">8 skills configured — no assessments yet</p>
        </div>
        {/* Stats hidden */}
        <div className="flex items-center gap-4">
          {['% below target', 'Avg gap', 'Skills'].map((l, i) => (
            <div key={l} className="text-center">
              <p className="text-base font-bold text-gray-200">{i === 2 ? '8' : '—'}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Zero state — no grid, no filters */}
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[340px]">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center mb-5">
          <Target size={26} className="text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">
          Skills are set up — now run your first assessment
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
          Your competency framework is ready. Ask your team to complete their skill self-assessments so you can start seeing where the gaps are.
        </p>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm">
            <Users size={13} />
            Start assessments for this department
          </button>
        </div>

        <button className="mt-3 text-sm text-gray-400 hover:text-sky-600 transition-colors underline underline-offset-2">
          Preview what the heatmap will look like
        </button>

        {/* Framework preview — showing the 8 skills exist but all cells empty */}
        <div className="mt-10 w-full max-w-lg opacity-50 pointer-events-none">
          <div className="text-[10px] text-gray-300 uppercase tracking-widest font-semibold mb-2 text-left">Framework preview (no data)</div>
          <div className="space-y-1">
            {['Product Strategy', 'Roadmapping', 'Stakeholder Mgmt', 'Data Analysis', 'User Research', 'Agile / Scrum'].map(skill => (
              <div key={skill} className="flex items-center gap-2 h-6">
                <span className="text-[11px] text-gray-400 w-36 truncate text-right pr-2">{skill}</span>
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="w-10 h-6 rounded bg-gray-100 border border-dashed border-gray-200" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FrameWithBreadcrumb>
  );
}

// ── TICKET 14 — Partial Zero State: Mixed Dept Cards ─────────────────────────

const DEPT_COLORS: Record<string, string> = {
  Engineering: '#3b82f6',
  Product: '#8b5cf6',
  Design: '#ec4899',
  Data: '#06b6d4',
  Marketing: '#f59e0b',
  Sales: '#10b981',
  'People Ops': '#6366f1',
};

function DeptCard({ dept, configured }: { dept: string; configured: boolean }) {
  const color = DEPT_COLORS[dept] ?? '#6b7280';
  return (
    <div className={`rounded-xl border transition-all hover:shadow-md ${configured ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/60'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-sm font-bold text-gray-800">{dept}</span>
          </div>
          {configured ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">3 critical</span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Not set up</span>
          )}
        </div>

        {configured ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-gray-400">12 tracked · 8 skills</span>
              <span className="text-xs font-bold text-gray-700">38% below target</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-400 to-amber-400 rounded-full" style={{ width: '38%' }} />
            </div>
            <div className="flex gap-1.5 mt-2">
              {['critical', 'high', 'medium'].map((s, i) => (
                <div key={s} className={`h-1 rounded-full flex-1 ${['bg-red-400', 'bg-amber-400', 'bg-sky-400'][i]}`} />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Set up skills for this department to start tracking gaps
            </p>
            <button className="w-full text-xs font-semibold text-sky-600 border border-sky-200 rounded-lg py-1.5 hover:bg-sky-50 transition-colors">
              Configure
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Ticket14() {
  const depts = [
    { dept: 'Engineering', configured: true },
    { dept: 'Product', configured: false },
    { dept: 'Design', configured: true },
    { dept: 'Data', configured: false },
    { dept: 'Marketing', configured: true },
    { dept: 'Sales', configured: false },
    { dept: 'People Ops', configured: false },
  ];
  const configured = depts.filter(d => d.configured);

  return (
    <Frame>
      {/* Page header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Skills Gap Heatmap</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Org stats calculated from {configured.length} configured departments only
            </p>
          </div>
          {/* Stats — exclude unconfigured */}
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-base font-bold text-red-500">34%</p>
              <p className="text-[10px] text-gray-400">% below target</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-700">−0.8</p>
              <p className="text-[10px] text-gray-400">Avg gap</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-700">18</p>
              <p className="text-[10px] text-gray-400">Skills tracked</p>
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Info size={12} className="text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700">
            4 departments are not yet configured and are excluded from org-level stats.
          </p>
        </div>
      </div>

      {/* Department grid */}
      <div className="p-5">
        <div className="grid grid-cols-4 gap-3">
          {depts.map(d => (
            <DeptCard key={d.dept} dept={d.dept} configured={d.configured} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ── TICKET 15 — Drilldown Panel: No Breakdown Data ───────────────────────────

function Ticket15NoFilters() {
  return (
    <FrameWithBreadcrumb dept="Sales">
      <div className="flex">
        {/* Main grid */}
        <div className="flex-1 p-4">
          <div className="space-y-1.5">
            {['Negotiation', 'CRM Tools', 'Pipeline Mgmt', 'Closing Techniques'].map((skill, i) => (
              <div key={skill} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-600 w-32 truncate">{skill}</span>
                <div className="flex gap-1">
                  {[0,1,2].map(j => (
                    <div key={j} className={`w-10 h-6 rounded text-[10px] font-semibold flex items-center justify-center ${
                      (i + j) % 3 === 0 ? 'bg-red-100 text-red-600' : (i + j) % 3 === 1 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {2 + ((i + j) % 3)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Selected row */}
            <div className="flex items-center gap-2 bg-sky-50 rounded-lg px-1">
              <span className="text-[11px] text-sky-700 font-semibold w-32">Cold Outreach</span>
              <div className="flex gap-1">
                {[0,1,2].map(j => (
                  <div key={j} className="w-10 h-6 rounded bg-gray-100 border border-dashed border-gray-200" />
                ))}
              </div>
              <span className="text-[10px] text-sky-500 ml-1">selected</span>
            </div>
          </div>
        </div>

        {/* Drilldown panel — no data for Cold Outreach */}
        <div className="w-72 border-l border-gray-100 flex flex-col">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Skill detail</p>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5">Cold Outreach</h3>
            </div>
            <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
              <X size={12} />
            </button>
          </div>

          {/* Empty state */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-10 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BarChart2 size={20} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">No assessments recorded for this skill yet</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Once assessments are completed for Cold Outreach, you'll see individual and team breakdowns here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </FrameWithBreadcrumb>
  );
}

function Ticket15WithFilters() {
  return (
    <FrameWithBreadcrumb dept="Sales">
      {/* Filter bar showing active filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/40">
        <Filter size={11} className="text-gray-400" />
        <span className="text-[11px] text-gray-500">Filters:</span>
        <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">New York</span>
        <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">IC3</span>
        <span className="text-[11px] text-gray-400 ml-auto">Showing 0 matches for this skill</span>
      </div>

      <div className="flex">
        <div className="flex-1 p-4">
          <div className="space-y-1.5">
            {['Negotiation', 'CRM Tools', 'Cold Outreach (selected)'].map((skill, i) => (
              <div key={skill} className={`flex items-center gap-2 ${i === 2 ? 'bg-sky-50 rounded-lg px-1' : ''}`}>
                <span className={`text-[11px] w-36 truncate ${i === 2 ? 'text-sky-700 font-semibold' : 'text-gray-600'}`}>{skill}</span>
                {i === 2 ? (
                  <div className="flex gap-1">
                    {[0,1,2].map(j => (
                      <div key={j} className="w-10 h-6 rounded bg-gray-100 border border-dashed border-gray-200" />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {[0,1,2].map(j => (
                      <div key={j} className={`w-10 h-6 rounded text-[10px] font-semibold flex items-center justify-center ${(i + j) % 2 === 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {3 + ((i + j) % 2)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Drilldown panel — filter variant */}
        <div className="w-72 border-l border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Skill detail</p>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5">Cold Outreach</h3>
            </div>
            <button className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
              <X size={12} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-10 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Search size={20} className="text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">No data matches your current filters</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                No records for Cold Outreach match the active Location: New York and Level: IC3 filters. Try removing one or both filters.
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 border border-sky-200 rounded-xl px-3 py-1.5 hover:bg-sky-50 transition-colors">
              <RefreshCw size={11} />
              Clear filters
            </button>
          </div>
        </div>
      </div>
    </FrameWithBreadcrumb>
  );
}

// ── LOW SAMPLE SIZE — shared heatmap grid rows ────────────────────────────────

const LOW_SAMPLE_SKILLS = ['Design Systems', 'User Research', 'Prototyping', 'Visual Design', 'Motion Design'];

// 5 people: 3 have all skills, 1 has only Motion Design, 1 has only Visual Design + Motion Design
const CELL_DATA: Record<string, { score: number; n: number }[]> = {
  'Design Systems':  [{ score: 4, n: 3 }, { score: 2, n: 3 }, { score: 3, n: 3 }],
  'User Research':   [{ score: 3, n: 3 }, { score: 4, n: 3 }, { score: 2, n: 3 }],
  'Prototyping':     [{ score: 5, n: 3 }, { score: 3, n: 3 }, { score: 4, n: 3 }],
  'Visual Design':   [{ score: 2, n: 2 }, { score: 3, n: 3 }, { score: 4, n: 3 }],
  'Motion Design':   [{ score: 3, n: 1 }, { score: 2, n: 1 }, { score: 4, n: 3 }],
};

const PEOPLE = ['Alex M.', 'Jamie L.', 'Priya R.'];

function cellColor(score: number) {
  if (score <= 2) return 'bg-red-100 text-red-600';
  if (score === 3) return 'bg-amber-100 text-amber-600';
  return 'bg-emerald-100 text-emerald-700';
}

// Variant A — person count badge in corner of cell
function VariantA() {
  return (
    <FrameWithBreadcrumb dept="Design">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Design</h1>
          <p className="text-xs text-gray-400 mt-0.5">5 people · 5 skills tracked</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-200" />
          <span className="text-[10px] text-gray-400 font-medium">Cells with fewer than 3 responses show a count badge</span>
        </div>
      </div>

      <div className="p-4">
        {/* Column headers */}
        <div className="flex items-center gap-2 mb-1.5 pl-[120px]">
          {PEOPLE.map(p => (
            <span key={p} className="w-12 text-center text-[10px] text-gray-400 font-medium truncate">{p}</span>
          ))}
        </div>

        <div className="space-y-1.5">
          {LOW_SAMPLE_SKILLS.map(skill => (
            <div key={skill} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-600 w-[116px] truncate text-right pr-2">{skill}</span>
              <div className="flex gap-1">
                {CELL_DATA[skill].map((cell, j) => (
                  <div key={j} className="relative w-12 h-7">
                    <div className={`w-full h-full rounded text-[11px] font-semibold flex items-center justify-center ${cellColor(cell.score)}`}>
                      {cell.score}
                    </div>
                    {cell.n < 3 && (
                      <span className={`absolute -top-1 -right-1 text-[8px] font-bold px-1 py-px rounded-full leading-none
                        ${cell.n === 1 ? 'bg-gray-600 text-white' : 'bg-gray-400 text-white'}`}>
                        {cell.n === 1 ? '1 person' : `${cell.n} people`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Legend</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block text-[8px] font-bold bg-gray-600 text-white px-1 py-0.5 rounded-full leading-none">1 person</span>
            <span className="text-[10px] text-gray-500">Only 1 response — treat with caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block text-[8px] font-bold bg-gray-400 text-white px-1 py-0.5 rounded-full leading-none">2 people</span>
            <span className="text-[10px] text-gray-500">Only 2 responses — limited confidence</span>
          </div>
        </div>
      </div>
    </FrameWithBreadcrumb>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ZeroStatesDesign() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-12">

      {/* Page title */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center">
            <LayoutGrid size={14} className="text-white" />
          </div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Design Reference</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zero State Designs</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-2xl">
          This page documents all empty and zero states across the Skills Gap Heatmap — covering the lifecycle from a brand new customer with no data through to partial setup and filter-driven empty results.
        </p>
        {/* Quick nav */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'ticket-10', label: 'No framework' },
            { id: 'ticket-11', label: 'No dept skills' },
            { id: 'ticket-12', label: 'No check-ins' },
            { id: 'ticket-13', label: 'No assessments' },
            { id: 'ticket-14', label: 'Partial setup' },
            { id: 'ticket-15', label: 'No drilldown data' },
            { id: 'low-sample', label: 'Low sample size' },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-full hover:bg-sky-100 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* TICKET 10 */}
      <div id="ticket-10">
        <SectionHeader
          number="01"
          id="TICKET 10"
          title="No Skills Framework Configured"
          description="The company has not set up any skills at all. The Department Overview page shows a full-screen zero state instead of department cards. This state takes priority over all other content."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Full-page takeover</Label>
          <Label color="gray">No dept cards</Label>
          <Label color="gray">No org stats</Label>
          <Label color="gray">No legend</Label>
        </div>
        <Ticket10 />
      </div>

      <Divider />

      {/* TICKET 11 */}
      <div id="ticket-11">
        <SectionHeader
          number="02"
          id="TICKET 11"
          title="Department Has No Skills Configured"
          description="The company has partially set up their framework — some departments are configured, others are not. When a user drills into an unconfigured department the heatmap grid is replaced with a department-level zero state."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Dept-level only</Label>
          <Label color="gray">Breadcrumb stays</Label>
          <Label color="gray">Stats show dashes</Label>
          <Label color="amber">Filters hidden</Label>
        </div>
        <Ticket11 />
      </div>

      <Divider />

      {/* TICKET 12 */}
      <div id="ticket-12">
        <SectionHeader
          number="03"
          id="TICKET 12"
          title="No Check-in Data"
          description="Skills are configured and assessments have been completed — so the heatmap grid has real data to display. Check-ins are a separate engagement data source that tracks how recently each person has had a development 1:1. The two are independent: the heatmap shows skill scores from assessments; the check-in row and panel show a different signal entirely. This state represents the check-in feature being unused while everything else works normally."
        />

        {/* Two-column explainer */}
        <div className="grid grid-cols-2 gap-4 mb-7">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Has data — heatmap shows normally</p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              <strong>Skill assessment scores</strong> — each person has rated themselves against the competency framework. Cells show averageActual vs expectedLevel. This data exists and is displayed as normal.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5">No data — check-in row is zeroed</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Check-in coverage</strong> — tracks when each person last had a 1:1 development conversation. This is logged separately via the check-in feature. Nobody has used it yet, so this row and panel are empty.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Inline row zero state</Label>
          <Label color="emerald">Heatmap grid still shows</Label>
          <Label color="gray">Panel stats show dashes</Label>
          <Label color="amber">Export hidden</Label>
        </div>
        <Ticket12 />
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Key detail:</strong> The check-in row cell uses neutral grey with a dashed border — not red or amber, because this is not a problem, just a feature that hasn't been adopted yet. The skill cells above it show real assessment data as normal. The panel's four stat tiles show em-dashes. The coverage bar and overdue alerts are not rendered. "Export check-in report" is hidden until data exists.
          </p>
        </div>
      </div>

      <Divider />

      {/* TICKET 13 */}
      <div id="ticket-13">
        <SectionHeader
          number="04"
          id="TICKET 13"
          title="Skills Configured, No Assessments Yet"
          description="The framework is set up (8 skills visible) but nobody has been assessed. This is the most common early-lifecycle state. The heatmap grid is replaced with a zero state that distinguishes 'skills exist but no data' from 'not set up at all'."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="amber">Skills count still shows</Label>
          <Label color="gray">Grid hidden</Label>
          <Label color="gray">Filters hidden</Label>
          <Label color="amber">Alert bar hidden</Label>
        </div>
        <Ticket13 />
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Key detail:</strong> The skills count (8) is shown in the header to confirm the framework is ready. Stats for % below target and avg gap show em-dashes. The faded framework preview below the CTA helps users understand what they're building towards.
          </p>
        </div>
      </div>

      <Divider />

      {/* TICKET 14 */}
      <div id="ticket-14">
        <SectionHeader
          number="05"
          id="TICKET 14"
          title="Partial Setup — Mixed Configured and Unconfigured Departments"
          description="The Department Overview entry screen shows a mix of active departments and ones that haven't been set up. Unconfigured cards are visually distinct but still clickable. Org-level stats exclude unconfigured departments."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Same grid layout</Label>
          <Label color="gray">Unconfigured card variant</Label>
          <Label color="amber">Stats exclude unconfigured</Label>
          <Label color="gray">Info banner</Label>
        </div>
        <Ticket14 />
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Key detail:</strong> Configured and unconfigured cards coexist in the same grid, maintaining visual rhythm. The "Not set up" badge uses a muted grey pill (not red) — this is a neutral state, not an error. The amber info strip at the top explains that stats are calculated from configured departments only, so users aren't confused by unexpectedly low numbers.
          </p>
        </div>
      </div>

      <Divider />

      {/* TICKET 15 */}
      <div id="ticket-15">
        <SectionHeader
          number="06"
          id="TICKET 15"
          title="Drilldown Panel — No Breakdown Data"
          description="When a skill row is clicked but the panel has nothing to show — either because no assessments exist for that skill, or because active filters produce no matches — the panel renders a contextual empty state instead of blank sections."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Two variants</Label>
          <Label color="gray">Panel header stays</Label>
          <Label color="amber">Action buttons hidden</Label>
        </div>

        {/* Variant A */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Variant A</span>
            <span className="text-xs text-gray-400">— No assessments recorded at all for this skill</span>
          </div>
          <Ticket15NoFilters />
        </div>

        {/* Variant B */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Variant B</span>
            <span className="text-xs text-gray-400">— Active filters produce no matching records</span>
          </div>
          <Ticket15WithFilters />
        </div>

        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Key detail:</strong> The two variants have different icons and copy. Variant A (no assessments) uses a neutral bar-chart icon with no action button. Variant B (filter mismatch) uses a search icon with a "Clear filters" CTA. The panel header always remains showing the skill name and X button. The promotion pipeline section and action buttons are not rendered in either state.
          </p>
        </div>
      </div>

      <Divider />

      {/* LOW SAMPLE SIZE */}
      <div id="low-sample">
        <SectionHeader
          number="07"
          id="LOW SAMPLE SIZE"
          title="Skill Has Only 1 or 2 Respondents"
          description="When a skill column contains very few assessments the displayed score is unreliable — it may just be one person's self-rating. The cell still shows the score and colour coding, but a small badge in the corner shows how many people contributed. The threshold is fewer than 3 respondents."
        />
        <div className="flex items-start gap-3 mb-6">
          <Label color="sky">Score still visible</Label>
          <Label color="gray">Colour coding preserved</Label>
          <Label color="gray">Badge in cell corner</Label>
        </div>
        <VariantA />
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Key detail:</strong> The "1 person" / "2 people" badge appears only on cells below the threshold — cells with 3 or more respondents show no badge. The darker pill (single person) draws more attention than the lighter one (two people), reflecting the higher uncertainty.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-sm text-gray-500">7 states documented — Tickets 10–15 + Low Sample Size</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles size={11} className="text-sky-400" />
          Skills Gap Heatmap · Zero State Reference
        </div>
      </div>

    </div>
  );
}
