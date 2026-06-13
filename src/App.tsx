import { useState, useEffect, useRef, useCallback } from 'react';
import { ResumeTemplate } from './components/ResumeTemplate';
import { AIChatSidebar } from './components/AIChatSidebar';
import { ATSAnalyzer } from './components/ATSAnalyzer';
import { VersionHistory } from './components/VersionHistory';
import { ExportModal } from './components/ExportModal';
import { TemplateSelector } from './components/TemplateSelector';
import { useStorage } from './hooks/useStorage';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import { GoogleDriveButton } from './components/GoogleDriveButton';
import type { ResumeData, TemplateType, ExportType, Experience, Project, Education, Achievement } from './types';
import { initialResumeData } from './types';
import {
  FileDown, Upload, Download, RotateCcw, RotateCw,
  Eye, EyeOff, History, FileJson,
  ChevronRight, Sparkles, AlertTriangle
} from 'lucide-react';

export default function App() {
  const {
    resume, versions, settings, isLoaded,
    updateResume, saveVersion, restoreVersion,
    importResume, exportResume, toggleViewMode,
    updateSectionOrder, updateSettings
  } = useStorage();

  const googleDrive = useGoogleDrive();
  const [sidebarView, setSidebarView] = useState<'ai' | 'history' | null>(null);
  const [atsExpanded, setAtsExpanded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const isViewMode = settings.viewMode === 'view';

  const undoStackRef = useRef<ResumeData[]>([]);
  const redoStackRef = useRef<ResumeData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushUndo = useCallback(() => {
    undoStackRef.current.push({ ...resume });
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [resume]);

  const undo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const prev = undoStackRef.current.pop()!;
      redoStackRef.current.push({ ...resume });
      updateResume(prev);
      setCanUndo(undoStackRef.current.length > 0);
      setCanRedo(true);
    }
  }, [resume, updateResume]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push({ ...resume });
      updateResume(next);
      setCanRedo(redoStackRef.current.length > 0);
      setCanUndo(true);
    }
  }, [resume, updateResume]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }
      if (meta && !e.shiftKey && e.key === 's') {
        e.preventDefault();
        saveVersion('Manual save');
        return;
      }
      if (meta && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleUpdate = useCallback((data: Partial<ResumeData>) => {
    pushUndo();
    updateResume({ ...resume, ...data } as ResumeData);
  }, [resume, updateResume, pushUndo]);

  const handleExport = useCallback((exportType: ExportType, template: TemplateType) => {
    setShowExportModal(false);

    updateSettings({
      template,
      exportType,
      viewMode: 'view',
    });

    setIsPrintPreview(true);

    saveVersion('Pre-export backup');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setIsPrintPreview(false);
      }, 500);
    }, 300);
  }, [saveVersion, updateSettings]);

  useEffect(() => {
    if (!googleDrive.state.isSignedIn) return;
    googleDrive.saveToDrive(resume);
  }, [resume, googleDrive.state.isSignedIn, googleDrive]);

  const handleSyncNow = useCallback(() => {
    googleDrive.saveToDrive(resume);
  }, [googleDrive, resume]);

  const handleTemplateChange = useCallback((template: TemplateType) => {
    updateSettings({ template });
  }, [updateSettings]);

  const parseMarkdownResume = useCallback((md: string): ResumeData | null => {
    const lines = md.split('\n').map(l => l.trim()).filter(Boolean);
    const result: ResumeData = JSON.parse(JSON.stringify(initialResumeData));
    let currentSection = '';
    const sections: Record<string, string[]> = {};

    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headerMatch) {
        currentSection = headerMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!sections[currentSection]) sections[currentSection] = [];
        continue;
      }
      if (currentSection) {
        sections[currentSection].push(line);
      } else if (!result.contact.fullName) {
        result.contact.fullName = line;
      }
    }

    // Extract contact info from first section or leading lines
    const allText = lines.join(' ');

    // Try to extract email
    const emailMatch = allText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (emailMatch) result.contact.email = emailMatch[0];

    // Try to extract phone
    const phoneMatch = allText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.contact.phone = phoneMatch[0];

    // Process each section
    for (const [key, sectionLines] of Object.entries(sections)) {
      if (key.includes('summary') || key.includes('objective') || key.includes('profile')) {
        result.summary = sectionLines.join(' ');
      } else if (key.includes('skill')) {
        result.skills = sectionLines.flatMap(l => l.split(/[,|•·-]/).map(s => s.trim()).filter(s => s.length > 0));
      } else if (key.includes('experience') || key.includes('work') || key.includes('employment')) {
        const entries = parseSectionEntries(sectionLines);
        for (const entry of entries) {
          const exp: Experience = {
            id: crypto.randomUUID(),
            position: entry.position || '',
            company: entry.company || '',
            location: entry.location || '',
            startDate: entry.startdate || '',
            endDate: entry.enddate || (entry.current ? 'Present' : ''),
            current: entry.current === 'true' || entry.enddate?.toLowerCase() === 'present',
            bullets: entry._bullets || [],
          };
          result.experience.push(exp);
        }
      } else if (key.includes('project')) {
        const entries = parseSectionEntries(sectionLines);
        for (const entry of entries) {
          const proj: Project = {
            id: crypto.randomUUID(),
            name: entry.name || '',
            description: entry.description || '',
            technologies: entry.technologies ? entry.technologies.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
            link: entry.link || '',
            bullets: entry._bullets || [],
          };
          result.projects.push(proj);
        }
      } else if (key.includes('education') || key.includes('academic')) {
        const entries = parseSectionEntries(sectionLines);
        for (const entry of entries) {
          const edu: Education = {
            id: crypto.randomUUID(),
            degree: entry.degree || '',
            institution: entry.institution || '',
            location: entry.location || '',
            startDate: entry.startdate || '',
            endDate: entry.enddate || '',
            gpa: entry.gpa || '',
            honors: entry.honors || '',
          };
          result.education.push(edu);
        }
      } else if (key.includes('achievement') || key.includes('certification') || key.includes('award')) {
        for (const line of sectionLines) {
          const parts = line.split(/[-–·•|]/).map(s => s.trim()).filter(Boolean);
          const ach: Achievement = {
            id: crypto.randomUUID(),
            title: parts[0] || line,
            description: parts[1] || '',
            date: parts[2] || '',
          };
          result.achievements.push(ach);
        }
      }
    }

    return result;
  }, []);

  const parseSectionEntries = useCallback((lines: string[]) => {
    const entries: Array<Record<string, string> & { _bullets?: string[] }> = [];
    let current: (Record<string, string> & { _bullets?: string[] }) | null = null;
    let currentBullets: string[] = [];

    for (const line of lines) {
      const fieldMatch = line.match(/^\*\*(\w+):\*\*\s*(.*)/i) || line.match(/^(\w+):\s+(.*)/i);
      if (fieldMatch) {
        if (current) {
          current._bullets = currentBullets;
          entries.push(current);
          currentBullets = [];
        }
        current = { [fieldMatch[1].toLowerCase()]: fieldMatch[2].trim() };
      } else if (current && (line.startsWith('-') || line.startsWith('*') || line.startsWith('•'))) {
        currentBullets.push(line.replace(/^[-*•]\s*/, '').trim());
      } else if (current && line) {
        currentBullets.push(line);
      }
    }
    if (current) {
      current._bullets = currentBullets;
      entries.push(current);
    }
    return entries;
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data && typeof data === 'object' && data.contact) {
            pushUndo();
            importResume(data as ResumeData);
          } else {
            alert('Invalid resume backup file. Expected a valid JSON resume object.');
          }
        } catch {
          alert('Could not parse file. Ensure it is a valid JSON backup.');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'md' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = ev => {
        const md = ev.target?.result as string;
        const parsed = parseMarkdownResume(md);
        if (parsed) {
          pushUndo();
          importResume(parsed);
        } else {
          alert('Could not parse resume from Markdown. Check the format.');
        }
      };
      reader.readAsText(file);
    } else if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = ev => {
        const pdfText = ev.target?.result as string;
        const parsed = parseMarkdownResume(pdfText);
        if (parsed) {
          pushUndo();
          importResume(parsed);
        } else {
          alert('Could not extract resume data from PDF. Try copying the text manually.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Unsupported file format. Please use .json, .md, .txt, or .pdf files.');
    }
    e.target.value = '';
  }, [importResume, pushUndo, parseMarkdownResume]);

  const handleExportJson = useCallback(() => {
    const json = exportResume();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportResume]);

  const toggleSidebar = useCallback((view: 'ai' | 'history') => {
    setSidebarView(prev => prev === view ? null : view);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading your resume\u2026</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileJson size={18} className="text-primary-500" aria-hidden="true" />
            <span className="text-base font-bold text-gray-800 hidden sm:inline">Resume Editor</span>
          </div>

          <div className="h-5 w-px bg-gray-200 ml-1" />

          <button
            onClick={toggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isViewMode
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
            }`}
          >
            {isViewMode ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            <span className="hidden sm:inline">{isViewMode ? 'Edit' : 'View'}</span>
          </button>

          {/* Template Selector - visible in view mode */}
          {isViewMode && (
            <div className="hidden md:flex items-center ml-2">
              <TemplateSelector current={settings.template} onSelect={handleTemplateChange} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <RotateCw size={15} aria-hidden="true" />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-0.5" />

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export PDF (Ctrl+Shift+P)"
            aria-label="Export PDF"
          >
            <FileDown size={15} aria-hidden="true" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group relative" aria-label="Import resume">
            <Upload size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json,.md,.txt,.pdf" onChange={handleImport} className="hidden" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Supports: .json .md .txt .pdf
            </div>
          </label>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group relative"
            title="Export full resume as JSON backup file (downloads .json)"
            aria-label="Export JSON backup"
          >
            <Download size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Backup</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              Download full resume as .json backup file
            </div>
          </button>

          <div className="h-5 w-px bg-gray-200 mx-0.5" />

          <GoogleDriveButton
            state={googleDrive.state}
            onSignIn={googleDrive.signIn}
            onSignOut={googleDrive.signOut}
            onSyncNow={handleSyncNow}
          />

          <div className="h-5 w-px bg-gray-200 mx-0.5" />

          <button
            onClick={() => toggleSidebar('ai')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              sidebarView === 'ai' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="AI Assistant"
            aria-label="AI Assistant"
          >
            <Sparkles size={15} aria-hidden="true" />
            <span className="hidden sm:inline">AI</span>
          </button>

          <button
            onClick={() => toggleSidebar('history')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              sidebarView === 'history' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Version History"
            aria-label="Version History"
          >
            <History size={15} aria-hidden="true" />
            <span className="hidden sm:inline">History</span>
            {versions.length > 0 && (
              <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 ml-0.5">
                {versions.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
          sidebarView ? 'lg:mr-[384px]' : ''
        }`}>
          <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            sidebarView ? 'lg:max-w-3xl' : ''
          } ${isPrintPreview ? 'print-preview-mode' : ''}`}>
            <ResumeTemplate
              data={resume}
              viewMode={isViewMode || isPrintPreview}
              sectionOrder={settings.sectionOrder}
              lockedFields={['contact']}
              template={settings.template}
              exportType={settings.exportType}
              isExportPreview={isPrintPreview}
              onUpdate={handleUpdate}
              onUpdateSectionOrder={updateSectionOrder}
              pushUndo={pushUndo}
            />
          </div>
        </main>

        {/* Mobile overlay for sidebar */}
        {sidebarView && (
          <div className="fixed inset-0 bg-black/20 z-20 lg:hidden no-print" onClick={() => setSidebarView(null)} />
        )}

        {/* Sidebar */}
        {sidebarView && (
          <aside className="fixed right-0 top-[57px] bottom-0 w-80 sm:w-96 bg-white border-l border-gray-200 no-print flex flex-col overflow-hidden z-30 shadow-xl lg:static lg:top-auto lg:bottom-auto lg:shadow-none">
            {sidebarView === 'ai' && (
              <AIChatSidebar
                resumeData={resume}
                onClose={() => setSidebarView(null)}
              />
            )}
            {sidebarView === 'history' && (
              <VersionHistory
                versions={versions}
                onRestore={restoreVersion}
                onSave={() => saveVersion()}
                onClose={() => setSidebarView(null)}
              />
            )}
          </aside>
        )}
      </div>

      {/* ATS Footer */}
      <footer className="bg-white border-t border-gray-200 no-print">
        <button
          onClick={() => setAtsExpanded(!atsExpanded)}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-500" aria-hidden="true" />
            <span className="font-medium">Resume Health</span>
          </div>
          <ChevronRight size={16} className={`transition-transform ${atsExpanded ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
        {atsExpanded && (
          <div className="px-4 sm:px-6 pb-3">
            <ATSAnalyzer resumeData={resume} />
          </div>
        )}
      </footer>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        currentTemplate={settings.template}
        currentExportType={settings.exportType}
      />
    </div>
  );
}
