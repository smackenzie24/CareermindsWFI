import { X, Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { TIER_CONFIG, getReadinessTier, type ReadinessResult } from '../../data/promotionData';

interface Props {
  result: ReadinessResult;
  onClose: () => void;
}

function RatingDots({ actual, required }: { actual: number; required: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full border transition-all ${
            i < actual
              ? i < required
                ? 'bg-sky-500 border-sky-600'
                : 'bg-emerald-500 border-emerald-600'
              : i < required
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-gray-100'
          }`}
        />
      ))}
    </div>
  );
}

export function PersonPanel({ result, onClose }: Props) {
  const tier = getReadinessTier(result.readinessPct);
  const cfg = TIER_CONFIG[tier];
  const { person } = result;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {person.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{person.name}</h2>
                <p className="text-sm text-gray-500">{person.team} · {person.department}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
              <MapPin size={11} /> {person.location}
            </span>
            <span className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
              <Clock size={11} /> {person.tenure}m in current level
            </span>
            <span className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1">
              <Users size={11} /> {result.targetLevelLabel.split('·')[1]?.trim() ?? result.targetLevelLabel}
            </span>
          </div>
        </div>

        {/* Readiness score */}
        <div className={`px-6 py-5 border-b border-gray-100 ${cfg.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Readiness for</p>
              <p className="text-sm font-bold text-gray-900">{result.targetLevelLabel}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>

          {/* Big score */}
          <div className="flex items-end gap-3 mb-3">
            <span className={`text-5xl font-black ${cfg.color}`}>{result.readinessPct}%</span>
            <span className="text-sm text-gray-500 mb-1">{result.criteriaMet} of {result.criteriaTotal} criteria met</span>
          </div>

          <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden border border-black/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
              style={{ width: `${result.readinessPct}%` }}
            />
          </div>
        </div>

        {/* Criteria breakdown */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Met */}
          {result.metSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Meeting criteria ({result.metSkills.length})
                </h3>
              </div>
              <div className="space-y-2">
                {result.metSkills.map(skill => {
                  const actual = result.person.skills[skill.skillId] ?? 0;
                  return (
                    <div key={skill.skillId} className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{skill.skillName}</p>
                        <p className="text-[11px] text-gray-400">{skill.category}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <RatingDots actual={actual} required={skill.requiredRating} />
                        <span className="text-xs text-emerald-700 font-semibold w-10 text-right">{actual}/{skill.requiredRating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gaps */}
          {result.gapSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-red-400" />
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Gaps to close ({result.gapSkills.length})
                </h3>
              </div>
              <div className="space-y-2">
                {[...result.gapSkills].sort((a, b) => b.gap - a.gap).map(skill => (
                  <div key={skill.skillId} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{skill.skillName}</p>
                      <p className="text-[11px] text-gray-400">{skill.category}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <RatingDots actual={skill.actualRating} required={skill.requiredRating} />
                      <span className="text-xs text-red-600 font-semibold w-10 text-right">{skill.actualRating}/{skill.requiredRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0 space-y-2">
          <button className="w-full text-left text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-colors">
            Set as focus skills &rarr;
          </button>
          <button className="w-full text-left text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-colors">
            Find mentors for gap skills &rarr;
          </button>
          <button className="w-full text-left text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-colors">
            Schedule check-in &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
