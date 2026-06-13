import type { ResumeData } from '../../types';
import { EditableText } from '../EditableText';

interface SummarySectionProps {
  data: string;
  viewMode: boolean;
  onUpdate: (data: ResumeData) => void;
}

export function SummarySection({ data, viewMode, onUpdate }: SummarySectionProps) {
  const updateSummary = (value: string) => {
    onUpdate({ summary: value } as any);
  };

  return (
    <section className="resume-section mb-5">
      <h2 className="resume-section-heading text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
        Professional Summary
      </h2>
      {data || !viewMode ? (
        <EditableText
          value={data}
          onChange={updateSummary}
          viewMode={viewMode}
          className="resume-summary-text text-sm text-gray-700 leading-relaxed"
          placeholder="Brief professional summary highlighting your key skills and experience..."
          multiline
        />
      ) : (
        <span className="text-gray-400 italic text-sm">No summary provided</span>
      )}
    </section>
  );
}
