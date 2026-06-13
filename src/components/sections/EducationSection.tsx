import type { ResumeData, Education } from '../../types';
import { Plus, X } from 'lucide-react';
import { EditableText } from '../EditableText';

interface EducationSectionProps {
  data: Education[];
  viewMode: boolean;
  onUpdate: (data: Partial<ResumeData>) => void;
}

export function EducationSection({ data, viewMode, onUpdate }: EducationSectionProps) {
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      honors: '',
    };
    onUpdate({ education: [...data, newEdu] });
  };

  const removeEducation = (id: string) => {
    onUpdate({ education: data.filter(e => e.id !== id) });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    onUpdate({
      education: data.map(e => (e.id === id ? { ...e, [field]: value } : e))
    });
  };

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Education
      </h2>
      {data.map(edu => (
        <div key={edu.id} className="resume-education-entry mb-3 last:mb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <EditableText
                  value={edu.degree}
                  onChange={v => updateEducation(edu.id, 'degree', v)}
                  viewMode={viewMode}
                  placeholder="Degree"
                  className="resume-education-degree font-semibold"
                />
                {edu.institution && (
                  <>
                    <span className="text-gray-500 hidden print:inline">, </span>
                    <span className="text-gray-500 inline print:hidden">from</span>
                    <EditableText
                      value={edu.institution}
                      onChange={v => updateEducation(edu.id, 'institution', v)}
                      viewMode={viewMode}
                      placeholder="Institution"
                      className="resume-education-school"
                    />
                  </>
                )}
              </div>
              {edu.location && (
                <EditableText
                  value={edu.location}
                  onChange={v => updateEducation(edu.id, 'location', v)}
                  viewMode={viewMode}
                  placeholder="Location"
                  className="text-sm text-gray-500"
                />
              )}
              <div className="resume-education-details text-sm text-gray-500 mt-0.5 flex gap-3">
                {(edu.startDate || edu.endDate) && (
                  <span>{edu.startDate || ''}{edu.startDate && edu.endDate ? ' - ' : ''}{edu.endDate || ''}</span>
                )}
                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                {edu.honors && <span>{edu.honors}</span>}
              </div>
            </div>
            {!viewMode && (
              <button onClick={() => removeEducation(edu.id)} className="text-red-500 hover:text-red-700 ml-2 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      ))}
      {!viewMode && (
        <button onClick={addEducation} className="flex items-center gap-1 text-blue-600 hover:underline mt-2">
          <Plus size={16} /> Add Education
        </button>
      )}
    </section>
  );
}
