import { useState } from 'react';
import type { ExportType, TemplateType } from '../types';
import { EXPORT_TYPES, TEMPLATES } from '../types';
import { FileDown, X, Eye } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (exportType: ExportType, template: TemplateType) => void;
  currentTemplate: TemplateType;
  currentExportType: ExportType;
}

export function ExportModal({ isOpen, onClose, onExport, currentTemplate, currentExportType }: ExportModalProps) {
  const [selectedType, setSelectedType] = useState<ExportType>(currentExportType);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(currentTemplate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileDown size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-gray-800">Export Resume</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">PDF Style</label>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">Choose how your resume should be formatted for export.</p>
            <div className="grid gap-2">
              {EXPORT_TYPES.map(exp => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedType(exp.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedType === exp.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedType === exp.id ? 'border-primary-500' : 'border-gray-300'
                  }`}>
                    {selectedType === exp.id && (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{exp.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{exp.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</label>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">Select the visual style for your resume.</p>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                      selectedTemplate === t.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                    }`} />
                    <span className="text-sm font-medium text-gray-800">{t.name}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-tight">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> Use <strong>ATS PDF</strong> for job applications submitted through online portals.
              Use <strong>Modern PDF</strong> for direct email submissions. <strong>One Page</strong> is ideal for early career.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport(selectedType, selectedTemplate)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shadow-sm"
          >
            <Eye size={15} />
            Preview & Export
          </button>
        </div>
      </div>
    </div>
  );
}
