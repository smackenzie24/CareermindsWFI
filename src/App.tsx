import { useState } from 'react';
import { LayoutGrid, TrendingUp, Sparkles, BarChart3, Globe, Home, ArrowLeft, ClipboardList, BookOpen, HelpCircle } from 'lucide-react';
import { TourOverlay } from './components/tour/TourOverlay';
import type { ActiveView as TourActiveView } from './components/tour/tourData';
import { SkillsGapHeatmap } from './components/SkillsGapHeatmap';
import { PromotionPipeline } from './components/promotion/PromotionPipeline';
import { ChatPanel } from './components/ChatPanel';
import { ManagerEffectiveness } from './components/managerEffectiveness/ManagerEffectiveness';
import { IndustryBenchmark } from './components/benchmark/IndustryBenchmark';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { AskAIPage } from './components/ai/AskAIPage';
import { CommitmentsJournal } from './components/CommitmentsJournal';
import { HowItWorks } from './components/HowItWorks';
import { DeptGapReportPicker } from './components/DeptGapReportPicker';
import { SkillGapReport } from './components/SkillGapReport';
import type { Department } from './data/mockData';
import type { NavTarget } from './data/execSummaryData';
import type { ActionNavTarget } from './data/chatEngine';
import type { ManagerMetrics } from './data/managerData';

type ActiveView = 'home' | 'heatmap' | 'pipeline' | 'managers' | 'benchmark' | 'ask-ai' | 'journal' | 'how-it-works' | 'gap-report';

function TourNudge({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(() => {
    try { return !sessionStorage.getItem('tour-nudge-seen'); } catch { return true; }
  });

  function dismiss() {
    try { sessionStorage.setItem('tour-nudge-seen', '1'); } catch { /* */ }
    setVisible(false);
    onDismiss();
  }

  if (!visible) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-52 bg-gray-900 border border-sky-500/30 rounded-xl shadow-xl p-3 z-[300]">
      <div className="absolute -top-1.5 right-5 w-3 h-3 bg-gray-900 border-l border-t border-sky-500/30 rotate-45" />
      <p className="text-xs text-sky-300 font-semibold mb-1">New to Progression?</p>
      <p className="text-[11px] text-gray-400 leading-relaxed mb-2.5">Click <strong className="text-white">Tour</strong> for an annotated walkthrough of every screen.</p>
      <button onClick={dismiss} className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">Got it</button>
    </div>
  );
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ReactNode; accent?: boolean }[] = [
  { id: 'home',         label: 'Summary',      icon: <Home size={13} /> },
  { id: 'heatmap',      label: 'Skills',       icon: <LayoutGrid size={13} /> },
  { id: 'pipeline',     label: 'Pipeline',     icon: <TrendingUp size={13} /> },
  { id: 'managers',     label: 'Managers',     icon: <BarChart3 size={13} /> },
  { id: 'benchmark',    label: 'Benchmarks',   icon: <Globe size={13} /> },
  { id: 'journal',      label: 'Decisions',    icon: <ClipboardList size={13} /> },
  { id: 'how-it-works', label: 'How it works', icon: <HelpCircle size={13} /> },
  { id: 'ask-ai',       label: 'Ask AI',       icon: <Sparkles size={13} />, accent: true },
];

interface NavState {
  view: ActiveView;
  department?: Department;
  managerId?: string;
  aiQuestion?: string;
  pipelineTab?: 'pipeline' | 'hidden-talent' | 'flight-risk';
}

export default function App() {
  const [nav, setNav] = useState<NavState>({ view: 'home' });
  const [tourActive, setTourActive] = useState(false);
  const [pipelineDept, setPipelineDept] = useState<Department | null>(null);
  const [selectedManager, setSelectedManager] = useState<ManagerMetrics | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string | undefined>();
  // Track whether the current view was navigated to from the AI page
  const [returnToAI, setReturnToAI] = useState(false);

  function openAI(question?: string) {
    setReturnToAI(false);
    setNav({ view: 'ask-ai', aiQuestion: question });
  }

  function navigate(target: NavTarget) {
    setReturnToAI(false);
    if (target.view !== 'pipeline') setPipelineDept(null);
    if (target.view !== 'managers') setSelectedManager(null);
    setNav({
      view: target.view as ActiveView,
      department: target.department,
      managerId: target.managerId,
      pipelineTab: target.pipelineTab,
    });
  }

  function setView(view: ActiveView) {
    setReturnToAI(false);
    if (view !== 'pipeline') setPipelineDept(null);
    if (view !== 'managers') setSelectedManager(null);
    setNav({ view });
  }

  function navigateFromAI(target: ActionNavTarget) {
    setReturnToAI(true);
    setNav({
      view: target.view as ActiveView,
      department: target.department as Department | undefined,
    });
  }

  function backToAI() {
    setReturnToAI(false);
    setNav({ view: 'ask-ai' });
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      {/* Global nav strip */}
      <nav className="bg-brand-navy flex-shrink-0 flex items-center h-11 z-50 min-w-0">
        {/* Logo — always visible */}
        <div className="flex items-center pl-4 pr-4 flex-shrink-0">
          <img src="/Progression_by_careerminds.svg" alt="Progression by CareerMinds" className="h-6 w-auto" />
        </div>

        {/* Tour mode toggle — next to logo */}
        <div className="relative flex-shrink-0 pr-2">
          <button
            onClick={() => setTourActive(t => !t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tourActive
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-sky-500/15 text-sky-400 border border-sky-500/40 hover:bg-sky-500/25 hover:text-sky-300'
            }`}
          >
            <BookOpen size={12} />
            {tourActive ? 'Exit Tour' : 'Tour'}
          </button>
          {!tourActive && <TourNudge onDismiss={() => {}} />}
        </div>

        {/* Scrollable nav items — pushed to the right */}
        <div className="flex items-center gap-0.5 px-2 overflow-x-auto flex-1 min-w-0 scrollbar-none justify-end">
          {NAV_ITEMS.map(item => {
            const isActive = nav.view === item.id;
            if (item.accent) {
              return (
                <button
                  key={item.id}
                  onClick={() => item.id === 'ask-ai' ? openAI() : setView(item.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-blue text-white'
                      : 'bg-brand-blue/10 text-brand-blue-accent hover:bg-brand-blue/20 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-brand-mid-gray hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-brand-blue-accent' : 'text-brand-accent-gray'}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

      </nav>

      {/* View */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Always-mounted AI page — hidden when not active so state persists */}
        <div className={nav.view === 'ask-ai' ? 'h-full' : 'hidden'}>
          <AskAIPage initialQuestion={nav.aiQuestion} onNavigate={navigateFromAI} />
        </div>

        {nav.view !== 'ask-ai' && returnToAI && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-navy border-b border-brand-blue/30 flex-shrink-0">
            <button
              onClick={backToAI}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-accent hover:text-white transition-colors"
            >
              <ArrowLeft size={12} />
              Back to AI conversation
            </button>
            <span className="text-brand-secondary text-xs">You navigated here from the AI. Your conversation is waiting.</span>
          </div>
        )}

        {nav.view === 'home' && (
          <ExecutiveSummary onNavigate={navigate} onAskAI={openAI} />
        )}
        {nav.view === 'heatmap' && (
          <SkillsGapHeatmap
            onNavigateToPipeline={() => setView('pipeline')}
            onAskAI={openAI}
            tourActive={tourActive}
            initialDepartment={nav.department}
          />
        )}
        {nav.view === 'pipeline' && (
          <PromotionPipeline
            initialDepartment={nav.department}
            initialTab={nav.pipelineTab}
            onSelectDept={setPipelineDept}
            onNavigateToManagers={(managerId) => setNav({ view: 'managers', managerId })}
          />
        )}
        {nav.view === 'managers' && (
          <ManagerEffectiveness
            initialManagerId={nav.managerId}
            selectedManager={selectedManager}
            onSelectManager={setSelectedManager}
            onNavigateToHeatmap={() => setView('heatmap')}
            onNavigateToPipeline={(dept) => setNav({ view: 'pipeline', department: dept })}
          />
        )}
        {nav.view === 'benchmark' && (
          <IndustryBenchmark onNavigateToGapReport={(dept) => setNav({ view: 'gap-report', department: dept })} />
        )}
        {nav.view === 'gap-report' && (
          nav.department
            ? <SkillGapReport
                department={nav.department}
                onBack={() => setNav({ view: 'gap-report' })}
                onNavigateToPipeline={() => setNav({ view: 'pipeline', department: nav.department })}
              />
            : <DeptGapReportPicker
                onSelect={(dept) => setNav({ view: 'gap-report', department: dept })}
              />
        )}
        {nav.view === 'journal' && <CommitmentsJournal onReviewSource={openAI} />}
        {nav.view === 'how-it-works' && (
          <HowItWorks onNavigate={(view) => {
            if (view === 'ask-ai') { openAI(); } else { setView(view as ActiveView); }
          }} />
        )}
      </div>

      {/* Sidebar panel — kept for quick access from non-home views if needed */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} initialQuestion={chatInitialQuestion} onNavigate={navigateFromAI} />

      {/* Tour mode overlay */}
      {tourActive && (
        <TourOverlay
          activeView={
            nav.view === 'pipeline' && pipelineDept ? 'pipeline-dept' :
            nav.view === 'managers' && selectedManager ? 'managers-detail' :
            nav.view as TourActiveView
          }
          onClose={() => setTourActive(false)}
        />
      )}
    </div>
  );
}
