import { useState } from 'react';
import { X, ExternalLink, Sparkles, BookOpen, TrendingUp, Users, BarChart2, ArrowRight } from 'lucide-react';

export type UpsellVariant =
  | 'talent-development'   // Skills gap → Careerminds structured upskilling
  | 'leadership-dev'       // Promotion pipeline → Keystone executive coaching
  | 'manager-coaching'     // Manager effectiveness → Keystone leadership programme
  | 'outplacement'         // Flight risk → Careerminds career transition
  | 'comp-review';         // Benchmark → Career dev + comp review

interface UpsellConfig {
  service: string;
  provider: string;
  headline: string;
  body: string;
  cta: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
  trigger: string; // the insight that surfaced this
}

const CONFIGS: Record<UpsellVariant, UpsellConfig> = {
  'talent-development': {
    service: 'Talent Development',
    provider: 'Careerminds',
    headline: 'Close this skills gap with a structured upskilling programme',
    body: 'Careerminds designs role-specific learning tracks aligned to your competency framework — so your team reaches target faster.',
    cta: 'Learn about Talent Development',
    trigger: 'Critical skill gap detected across your team',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
    accentText: 'text-teal-700',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
    icon: <BookOpen size={16} />,
  },
  'leadership-dev': {
    service: 'Leadership Development',
    provider: 'Keystone Partners',
    headline: 'Your bench is ready to grow — accelerate with executive coaching',
    body: 'Keystone Partners provides 1:1 leadership coaching programmes tailored to each candidate\'s readiness profile and target level.',
    cta: 'Explore Leadership Development',
    trigger: 'Near-ready candidates identified in your pipeline',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    icon: <TrendingUp size={16} />,
  },
  'manager-coaching': {
    service: 'Manager Coaching',
    provider: 'Keystone Partners',
    headline: 'Teams stalling? Targeted coaching can turn a manager around',
    body: 'Keystone\'s leadership programme pairs struggling managers with experienced coaches to improve team velocity and reduce attrition.',
    cta: 'Explore Manager Coaching',
    trigger: 'Manager effectiveness below threshold',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
    accentText: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700',
    icon: <Users size={16} />,
  },
  'outplacement': {
    service: 'Outplacement Services',
    provider: 'Careerminds',
    headline: 'Protect your employer brand when people do leave',
    body: 'Careerminds career transition programmes support departing employees with coaching, job search, and placement — reducing legal risk and preserving relationships.',
    cta: 'Learn about Outplacement',
    trigger: 'High flight-risk employees with no intervention plan',
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-200',
    accentText: 'text-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    icon: <ArrowRight size={16} />,
  },
  'comp-review': {
    service: 'Career Dev + Comp Review',
    provider: 'Careerminds',
    headline: 'You\'re behind peers on comp — act before talent walks',
    body: 'Careerminds career development services give underpaid high-performers a clear growth path — a powerful retention tool when a pay rise isn\'t immediately possible.',
    cta: 'Explore Retention Strategies',
    trigger: 'Team compensation below industry benchmark',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    icon: <BarChart2 size={16} />,
  },
};

interface UpsellBannerProps {
  variant: UpsellVariant;
  className?: string;
}

export function UpsellBanner({ variant, className = '' }: UpsellBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const cfg = CONFIGS[variant];

  return (
    <div className={`relative rounded-2xl border ${cfg.accentBorder} ${cfg.accentBg} px-5 py-4 ${className}`}>
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-white/60 transition-all"
      >
        <X size={12} />
      </button>

      <div className="flex items-start gap-4 pr-6">
        {/* Icon + provider */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.badgeBg} ${cfg.accentText}`}>
            {cfg.icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} uppercase tracking-wider`}>
              <Sparkles size={9} />
              {cfg.provider}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{cfg.trigger}</span>
          </div>
          <p className={`text-sm font-semibold leading-snug ${cfg.accentText} mb-1`}>{cfg.headline}</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{cfg.body}</p>
          <button className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.accentText} hover:underline underline-offset-2 transition-colors`}>
            <ExternalLink size={11} />
            {cfg.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
