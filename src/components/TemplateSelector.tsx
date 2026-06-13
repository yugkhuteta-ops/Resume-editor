import type { TemplateType } from '../types';
import { TEMPLATES } from '../types';

interface TemplateSelectorProps {
  current: TemplateType;
  onSelect: (template: TemplateType) => void;
}

export function TemplateSelector({ current, onSelect }: TemplateSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      {TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
            current === t.id
              ? 'bg-primary-500 text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title={t.description}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
