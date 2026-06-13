import type { ResumeData, Experience } from '../../types';
import { Plus, X } from 'lucide-react';
import { EditableText } from '../EditableText';

interface ExperienceSectionProps {
  data: Experience[];
  viewMode: boolean;
  onUpdate: (data: Partial<ResumeData>) => void;
}

export function ExperienceSection({ data, viewMode, onUpdate }: ExperienceSectionProps) {
  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [],
    };
    onUpdate({ experience: [...data, newExp] });
  };

  const removeExperience = (id: string) => {
    onUpdate({ experience: data.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: keyof Experience, value: unknown) => {
    onUpdate({
      experience: data.map(e => (e.id === id ? { ...e, [field]: value } : e))
    });
  };

  const addBullet = (id: string) => {
    const exp = data.find(e => e.id === id);
    if (exp) {
      updateExperience(id, 'bullets', [...exp.bullets, '']);
    }
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    const exp = data.find(e => e.id === expId);
    if (exp) {
      const newBullets = [...exp.bullets];
      newBullets[bulletIndex] = value;
      updateExperience(expId, 'bullets', newBullets);
    }
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    const exp = data.find(e => e.id === expId);
    if (exp) {
      updateExperience(expId, 'bullets', exp.bullets.filter((_, i) => i !== bulletIndex));
    }
  };

  const formatDateRange = (exp: Experience) => {
    const start = exp.startDate || '';
    const end = exp.current ? 'Present' : exp.endDate || '';
    if (!start && !end) return '';
    return `${start}${start && end ? ' - ' : ''}${end}`;
  };

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Experience
      </h2>
      {data.map(exp => (
        <div key={exp.id} className="resume-entry mb-4 last:mb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="resume-entry-header">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <EditableText
                    value={exp.position}
                    onChange={v => updateExperience(exp.id, 'position', v)}
                    viewMode={viewMode}
                    placeholder="Position"
                    className="resume-entry-title font-semibold"
                  />
                  {exp.company && (
                    <>
                      <span className="text-gray-500 hidden print:inline">, </span>
                      <span className="text-gray-500 inline print:hidden">at</span>
                      <EditableText
                        value={exp.company}
                        onChange={v => updateExperience(exp.id, 'company', v)}
                        viewMode={viewMode}
                        placeholder="Company"
                        className="resume-entry-org"
                      />
                    </>
                  )}
                </div>
                <div className="resume-entry-dates text-sm text-gray-500 shrink-0">
                  {formatDateRange(exp)}
                </div>
              </div>
              <div className="resume-entry-location text-sm text-gray-500 mt-0.5">
                <EditableText
                  value={exp.location}
                  onChange={v => updateExperience(exp.id, 'location', v)}
                  viewMode={viewMode}
                  placeholder="Location"
                />
              </div>
              {!viewMode && (
                <div className="flex gap-2 text-sm text-gray-500 mt-1">
                  <EditableText value={exp.startDate} onChange={v => updateExperience(exp.id, 'startDate', v)} viewMode={viewMode} placeholder="Start date" />
                  <span>-</span>
                  <EditableText value={exp.endDate} onChange={v => updateExperience(exp.id, 'endDate', v)} viewMode={viewMode} placeholder="End date" />
                  <label className="flex items-center gap-1 ml-2">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={e => updateExperience(exp.id, 'current', e.target.checked)}
                    />
                    <span className="text-xs">Current</span>
                  </label>
                </div>
              )}
            </div>
            {!viewMode && (
              <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-700 ml-2 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
          {exp.bullets.length > 0 && (
            <ul className="resume-bullets mt-1.5">
              {exp.bullets.map((bullet, idx) => (
                <li key={idx} className="resume-bullet flex items-start gap-1">
                  <EditableText
                    value={bullet}
                    onChange={v => updateBullet(exp.id, idx, v)}
                    viewMode={viewMode}
                    placeholder="Describe your responsibility or achievement"
                    className="flex-1 text-sm text-gray-700"
                    multiline
                  />
                  {!viewMode && (
                    <button onClick={() => removeBullet(exp.id, idx)} className="text-gray-400 hover:text-red-500 shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!viewMode && (
            <button onClick={() => addBullet(exp.id)} className="text-blue-600 text-sm mt-1 hover:underline">
              + Add bullet
            </button>
          )}
        </div>
      ))}
      {!viewMode && (
        <button onClick={addExperience} className="flex items-center gap-1 text-blue-600 hover:underline mt-2">
          <Plus size={16} /> Add Experience
        </button>
      )}
    </section>
  );
}
