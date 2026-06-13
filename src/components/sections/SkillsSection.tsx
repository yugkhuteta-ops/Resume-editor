import type { ResumeData } from '../../types';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface SkillsSectionProps {
  data: string[];
  viewMode: boolean;
  onUpdate: (data: Partial<ResumeData>) => void;
}

export function SkillsSection({ data, viewMode, onUpdate }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim()) {
      onUpdate({ skills: [...data, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    onUpdate({ skills: data.filter((_, i) => i !== index) });
  };

  if (viewMode) {
    return (
      <section className="resume-section mb-5">
        <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
          Skills
        </h2>
        <div className="resume-skills-list text-sm text-gray-700">
          {data.map((skill, i) => (
            <span key={i} className="resume-skills-item">
              {skill}{i < data.length - 1 ? ',' : ''}
            </span>
          ))}
          {data.length === 0 && (
            <span className="text-gray-400 italic">No skills listed</span>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Skills
      </h2>
      <div className="flex flex-wrap gap-2">
        {data.map((skill, index) => (
          <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
            {skill}
            <button onClick={() => removeSkill(index)} className="text-gray-500 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="Add skill…"
            className="border border-gray-300 rounded-full px-2 py-1 text-sm w-24 focus:outline-none focus:border-blue-500"
          />
          <button onClick={addSkill} className="text-blue-600 hover:text-blue-700">
            <Plus size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
