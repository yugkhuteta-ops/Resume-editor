import { useState, useEffect, useRef, useCallback } from 'react';
import { ResumeTemplate } from './components/ResumeTemplate';
import { AIChatSidebar } from './components/AIChatSidebar';
import { ATSAnalyzer } from './components/ATSAnalyzer';
import { VersionHistory } from './components/VersionHistory';
import { ExportModal } from './components/ExportModal';
import { TemplateSelector } from './components/TemplateSelector';
import { useStorage } from './hooks/useStorage';
import type { ResumeData, TemplateType, ExportType } from './types';
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

  const [sidebarView, setSidebarView] = useState<'ai' | 'history' | null>(null);
  const [atsExpanded, setAtsExpanded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const isViewMode = settings.viewMode === 'view';

  const undoStackRef = useRef<ResumeData[]>([]);
  const redoStackRef = useRef<ResumeData[]>([]);

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

  const pushUndo = useCallback(() => {
    undoStackRef.current.push({ ...resume });
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, [resume]);

  const handleUpdate = useCallback((data: ResumeData) => {
    pushUndo();
    updateResume({ ...resume, ...data });
  }, [resume, updateResume, pushUndo]);

  const undo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const prev = undoStackRef.current.pop()!;
      redoStackRef.current.push({ ...resume });
      updateResume(prev);
    }
  }, [resume, updateResume]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push({ ...resume });
      updateResume(next);
    }
  }, [resume, updateResume]);

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

  const handleTemplateChange = useCallback((template: TemplateType) => {
    updateSettings({ template });
  }, [updateSettings]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    e.target.value = '';
  }, [importResume, pushUndo]);

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

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading your resume...</span>
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
            <FileJson size={18} className="text-primary-500" />
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
            {isViewMode ? <EyeOff size={15} /> : <Eye size={15} />}
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
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw size={15} />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-0.5" />

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export PDF (Ctrl+Shift+P)"
          >
            <FileDown size={15} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <Upload size={15} />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export JSON backup"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <div className="h-5 w-px bg-gray-200 mx-0.5" />

          <button
            onClick={() => toggleSidebar('ai')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              sidebarView === 'ai' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="AI Assistant"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">AI</span>
          </button>

          <button
            onClick={() => toggleSidebar('history')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              sidebarView === 'history' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Version History"
          >
            <History size={15} />
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
          sidebarView ? 'lg:mr-0' : ''
        }`}>
          <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
            sidebarView ? 'lg:max-w-3xl' : ''
          }`}>
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

        {/* Sidebar */}
        {sidebarView && (
          <aside className="w-80 sm:w-96 bg-white border-l border-gray-200 no-print flex flex-col overflow-hidden shrink-0">
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
            <AlertTriangle size={15} className="text-amber-500" />
            <span className="font-medium">Resume Health</span>
          </div>
          <ChevronRight size={16} className={`transition-transform ${atsExpanded ? 'rotate-90' : ''}`} />
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
