import type { ResumeData, Project } from '../../types';
import { Plus, X } from 'lucide-react';
import { EditableText } from '../EditableText';

interface ProjectsSectionProps {
  data: Project[];
  viewMode: boolean;
  onUpdate: (data: Partial<ResumeData>) => void;
}

export function ProjectsSection({ data, viewMode, onUpdate }: ProjectsSectionProps) {
  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
      link: '',
      bullets: [],
    };
    onUpdate({ projects: [...data, newProject] });
  };

  const removeProject = (id: string) => {
    onUpdate({ projects: data.filter(p => p.id !== id) });
  };

  const updateProject = (id: string, field: keyof Project, value: unknown) => {
    onUpdate({
      projects: data.map(p => (p.id === id ? { ...p, [field]: value } : p))
    });
  };

  const addBullet = (id: string) => {
    const proj = data.find(p => p.id === id);
    if (proj) {
      updateProject(id, 'bullets', [...proj.bullets, '']);
    }
  };

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Projects
      </h2>
      {data.map(project => (
        <div key={project.id} className="resume-entry mb-3 last:mb-0">
          <div className="resume-entry-header flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <EditableText
                  value={project.name}
                  onChange={v => updateProject(project.id, 'name', v)}
                  viewMode={viewMode}
                  placeholder="Project name"
                  className="resume-entry-title font-semibold"
                />
                {project.link || !viewMode ? (
                  <EditableText
                    value={project.link}
                    onChange={v => updateProject(project.id, 'link', v)}
                    viewMode={viewMode}
                    placeholder="github.com/username/project"
                    className="text-sm text-gray-500"
                  />
                ) : null}
              </div>
              {(project.description || !viewMode) && (
                <EditableText
                  value={project.description}
                  onChange={v => updateProject(project.id, 'description', v)}
                  viewMode={viewMode}
                  placeholder="Brief project description\u2026"
                  className="text-sm text-gray-600 mt-0.5"
                  multiline
                />
              )}
              {viewMode && project.technologies.length > 0 && (
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-medium">Tech:</span> {project.technologies.join(', ')}
                </div>
              )}
              {!viewMode && (
                <div className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Tech:</span>
                  <EditableText
                    value={project.technologies.join(', ')}
                    onChange={v => updateProject(project.id, 'technologies', v.split(',').map(s => s.trim()).filter(Boolean))}
                    viewMode={viewMode}
                    placeholder="React, TypeScript, Node.js"
                    className="text-xs text-gray-500 ml-1"
                  />
                </div>
              )}
            </div>
            {!viewMode && (
              <button onClick={() => removeProject(project.id)} className="text-red-500 hover:text-red-700 ml-2 shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
          {project.bullets.length > 0 && (
            <ul className="resume-bullets mt-1">
              {project.bullets.map((bullet, idx) => (
                <li key={idx} className="resume-bullet flex items-start gap-1">
                  <EditableText
                    value={bullet}
                    onChange={v => {
                      const newBullets = [...project.bullets];
                      newBullets[idx] = v;
                      updateProject(project.id, 'bullets', newBullets);
                    }}
                    viewMode={viewMode}
                    placeholder="Project contribution or achievement"
                    className="flex-1 text-sm text-gray-700"
                    multiline
                  />
                  {!viewMode && (
                    <button onClick={() => {
                      updateProject(project.id, 'bullets', project.bullets.filter((_, i) => i !== idx));
                    }} className="text-gray-400 hover:text-red-500 shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!viewMode && (
            <button onClick={() => addBullet(project.id)} className="text-blue-600 text-sm mt-1 hover:underline">
              + Add bullet
            </button>
          )}
        </div>
      ))}
      {!viewMode && (
        <button onClick={addProject} className="flex items-center gap-1 text-blue-600 hover:underline mt-2">
          <Plus size={16} /> Add Project
        </button>
      )}
    </section>
  );
}
