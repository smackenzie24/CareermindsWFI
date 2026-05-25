import { useEffect, useRef, useState } from 'react';
import {
  X, Send, Sparkles, TrendingUp, AlertTriangle, BarChart2, User,
  ChevronRight, Lightbulb, Search, UserPlus, BookOpen, RefreshCw, Zap,
} from 'lucide-react';
import {
  query,
  buildWorkforceContext,
  SUGGESTED_PROMPTS,
  PLANNING_PROMPTS,
  type ChatMessage,
  type ActionNavTarget,
} from '../data/chatEngine';
import { MessageBubble, TypingIndicator } from './ai/AIChatRenderer';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function callWorkforceAI(question: string): Promise<string> {
  const context = buildWorkforceContext();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/workforce-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ question, context }),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const data = await res.json();
  return data.text ?? 'No response received.';
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuestion?: string;
  onNavigate?: (target: ActionNavTarget) => void;
}

let msgCounter = 0;
function makeId() { return `msg-${++msgCounter}`; }

type ChatMode = 'diagnose' | 'plan';

export function ChatPanel({ open, onClose, initialQuestion, onNavigate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState<ChatMode>('diagnose');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sentInitialRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    if (open && initialQuestion && sentInitialRef.current !== initialQuestion) {
      sentInitialRef.current = initialQuestion;
      setTimeout(() => sendMessage(initialQuestion), 350);
    }
  }, [open, initialQuestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const response = query(text.trim());

    if (response.needsAI) {
      try {
        const aiText = await callWorkforceAI(text.trim());
        setMessages(prev => [...prev, { id: makeId(), role: 'assistant', text: aiText, results: [], timestamp: new Date() }]);
      } catch {
        setMessages(prev => [...prev, {
          id: makeId(), role: 'assistant',
          text: "I couldn't reach the AI service right now. Try asking about promotions, skills gaps, churn risk, or workforce planning strategies.",
          results: [], timestamp: new Date(),
        }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { id: makeId(), role: 'assistant', text: response.text, results: response.results, timestamp: new Date() }]);
      setTyping(false);
    }, 400 + Math.random() * 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  const isEmpty = messages.length === 0;

  const planChips = [
    { icon: <UserPlus size={11} />, label: 'Hire for Engineering' },
    { icon: <Zap size={11} />, label: 'Build a retention plan for churn risks' },
    { icon: <BookOpen size={11} />, label: 'How do we close the skills gaps in Data?' },
    { icon: <RefreshCw size={11} />, label: 'Which teams need restructuring?' },
  ];
  const diagnoseChips = [
    { icon: <TrendingUp size={11} />, label: 'Ready for promo' },
    { icon: <AlertTriangle size={11} />, label: 'Churn risk' },
    { icon: <BarChart2 size={11} />, label: 'Skills gaps' },
    { icon: <User size={11} />, label: 'Engineering' },
  ];
  const chips = mode === 'plan' ? planChips : diagnoseChips;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900">Workforce AI</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 tracking-wide border border-sky-200">BETA</span>
              </div>
              <p className="text-[11px] text-gray-400">Quick query panel</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={15} />
            </button>
          </div>
          <div className="flex px-5 pb-0 gap-0">
            <button onClick={() => setMode('diagnose')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${mode === 'diagnose' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Search size={11} />Diagnose
            </button>
            <button onClick={() => setMode('plan')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${mode === 'plan' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Lightbulb size={11} />Plan & Act
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-8 gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${mode === 'plan' ? 'bg-amber-50 border-amber-100' : 'bg-sky-50 border-sky-100'}`}>
                {mode === 'plan' ? <Lightbulb size={24} className="text-amber-500" /> : <Sparkles size={24} className="text-sky-500" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {mode === 'plan' ? 'Plan your workforce strategy' : 'Ask about your workforce'}
                </p>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  {mode === 'plan'
                    ? 'Get concrete hiring, upskilling, and retention strategies grounded in your live data.'
                    : 'Query promotion readiness, churn risk, skills gaps, and more.'}
                </p>
              </div>
              <div className="w-full space-y-1.5">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Try asking</p>
                {(mode === 'plan' ? PLANNING_PROMPTS : SUGGESTED_PROMPTS).map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    className={`w-full text-left text-xs text-gray-600 px-3 py-2.5 rounded-xl bg-white border border-gray-200 transition-all flex items-center gap-2 group ${mode === 'plan' ? 'hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50' : 'hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50'}`}>
                    <ChevronRight size={11} className={`text-gray-300 flex-shrink-0 transition-colors ${mode === 'plan' ? 'group-hover:text-amber-400' : 'group-hover:text-sky-400'}`} />
                    {p}
                  </button>
                ))}
                <div className="pt-1.5 border-t border-gray-100 mt-1">
                  <button onClick={() => sendMessage('How can Careerminds support me?')}
                    className="w-full text-left text-xs font-medium text-teal-700 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-200 transition-all flex items-center gap-2 group hover:bg-teal-100 hover:border-teal-300">
                    <Sparkles size={11} className="text-teal-500 flex-shrink-0" />
                    How can Careerminds support me?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} onSend={sendMessage} onNavigate={onNavigate} />)}
              {typing && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        {!isEmpty && (
          <div className="flex gap-2 px-4 pb-2 overflow-x-auto flex-shrink-0">
            {chips.map((chip, i) => (
              <button key={i} onClick={() => sendMessage(chip.label)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1.5 rounded-full transition-all ${mode === 'plan' ? 'hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50' : 'hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'}`}>
                {chip.icon}{chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white border-t border-gray-100">
          <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'plan' ? 'Ask for a strategy or action plan…' : 'Ask about your workforce…'}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-5 max-h-32"
              style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sky-600 transition-all flex-shrink-0">
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-2">Queries run entirely on local data</p>
        </div>
      </div>
    </>
  );
}
