import type { ResumeData, SectionConfig, TemplateType, ExportType } from '../types';
import { ContactSection } from './sections/ContactSection';
import { SummarySection } from './sections/SummarySection';
import { SkillsSection } from './sections/SkillsSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { EducationSection } from './sections/EducationSection';
import { AchievementsSection } from './sections/AchievementsSection';
import { Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

interface ResumeTemplateProps {
  data: ResumeData;
  viewMode: boolean;
  sectionOrder: SectionConfig[];
  lockedFields: string[];
  template: TemplateType;
  exportType: ExportType;
  isExportPreview?: boolean;
  onUpdate: (data: Partial<ResumeData>) => void;
  onUpdateSectionOrder: (order: SectionConfig[]) => void;
  pushUndo: () => void;
}

export function ResumeTemplate({
  data, viewMode, sectionOrder, onUpdate, onUpdateSectionOrder, pushUndo,
  template, exportType, isExportPreview = false
}: ResumeTemplateProps) {
  const visibleSections = viewMode
    ? sectionOrder.filter(s => s.visible)
    : sectionOrder;

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sectionOrder.length) return;
    pushUndo();
    const newOrder = [...sectionOrder];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    onUpdateSectionOrder(newOrder);
  };

  const toggleVisibility = (id: string) => {
    pushUndo();
    const newOrder = sectionOrder.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    onUpdateSectionOrder(newOrder);
  };

  const renderSection = (type: string) => {
    switch (type) {
      case 'contact':
        return <ContactSection key="contact" data={data.contact} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'summary':
        return <SummarySection key="summary" data={data.summary} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'skills':
        return <SkillsSection key="skills" data={data.skills} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'experience':
        return <ExperienceSection key="experience" data={data.experience} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'projects':
        return <ProjectsSection key="projects" data={data.projects} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'education':
        return <EducationSection key="education" data={data.education} viewMode={viewMode} onUpdate={onUpdate} />;
      case 'achievements':
        return <AchievementsSection key="achievements" data={data.achievements} viewMode={viewMode} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  const templateClass = `template-${template}`;
  const exportClass = `export-${exportType}`;

  const containerClass = viewMode && !isExportPreview
    ? 'bg-white shadow-sm border border-gray-200 rounded-lg p-8 sm:p-10 md:p-12'
    : '';

  return (
    <div className={`resume-container ${templateClass} ${exportClass} ${containerClass}`}>
      {visibleSections.map((section, index) => {
        const content = renderSection(section.type);

        if (viewMode) {
          return (
            <div key={section.id} className="resume-section">
              {content}
            </div>
          );
        }

        return (
          <div key={section.id} className="group relative resume-section">
            <div className="absolute -left-10 top-0 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 no-print">
              <button
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveSection(index, 1)}
                disabled={index === sectionOrder.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => toggleVisibility(section.id)}
                className={`p-0.5 ${section.visible ? 'text-gray-400 hover:text-amber-500' : 'text-amber-500 hover:text-gray-600'}`}
                title={section.visible ? 'Hide section' : 'Show section'}
              >
                {section.visible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className={`transition-opacity duration-200 ${!section.visible ? 'opacity-30 pointer-events-none' : ''}`}>
              {content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
