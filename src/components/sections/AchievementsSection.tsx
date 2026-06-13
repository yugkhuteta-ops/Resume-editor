import type { ResumeData, Achievement } from '../../types';
import { Plus, X } from 'lucide-react';
import { EditableText } from '../EditableText';

interface AchievementsSectionProps {
  data: Achievement[];
  viewMode: boolean;
  onUpdate: (data: ResumeData) => void;
}

export function AchievementsSection({ data, viewMode, onUpdate }: AchievementsSectionProps) {
  const addAchievement = () => {
    const newAch: Achievement = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      date: '',
    };
    onUpdate({ achievements: [...data, newAch] } as any);
  };

  const removeAchievement = (id: string) => {
    onUpdate({ achievements: data.filter(a => a.id !== id) } as any);
  };

  const updateAchievement = (id: string, field: keyof Achievement, value: string) => {
    onUpdate({
      achievements: data.map(a => (a.id === id ? { ...a, [field]: value } : a))
    } as any);
  };

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Achievements & Certifications
      </h2>
      {data.map(ach => (
        <div key={ach.id} className="resume-achievement-entry mb-2 last:mb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <EditableText
                  value={ach.title}
                  onChange={v => updateAchievement(ach.id, 'title', v)}
                  viewMode={viewMode}
                  placeholder="Certification or Achievement"
                  className="resume-achievement-title font-medium"
                />
                {ach.date && (
                  <>
                    <span className="text-gray-400 hidden print:inline"> | </span>
                    <span className="text-gray-400 inline print:hidden">|</span>
                    <EditableText
                      value={ach.date}
                      onChange={v => updateAchievement(ach.id, 'date', v)}
                      viewMode={viewMode}
                      placeholder="Date"
                      className="resume-achievement-detail text-sm text-gray-500"
                    />
                  </>
                )}
              </div>
              {ach.description && (
                <EditableText
                  value={ach.description}
                  onChange={v => updateAchievement(ach.id, 'description', v)}
                  viewMode={viewMode}
                  placeholder="Description or issuing organization..."
                  className="resume-achievement-detail text-sm text-gray-600 mt-0.5"
                  multiline
                />
              )}
            </div>
            {!viewMode && (
              <button onClick={() => removeAchievement(ach.id)} className="text-red-500 hover:text-red-700 ml-2 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      ))}
      {!viewMode && (
        <button onClick={addAchievement} className="flex items-center gap-1 text-blue-600 hover:underline mt-2">
          <Plus size={16} /> Add Achievement
        </button>
      )}
    </section>
  );
}
