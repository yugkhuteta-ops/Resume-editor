import type { ResumeData, ContactInfo } from '../../types';
import { EditableText } from '../EditableText';

interface ContactSectionProps {
  data: ContactInfo;
  viewMode: boolean;
  onUpdate: (data: ResumeData) => void;
}

export function ContactSection({ data, viewMode, onUpdate }: ContactSectionProps) {
  const updateField = (field: keyof ContactInfo, value: string) => {
    onUpdate({ contact: { ...data, [field]: value } } as any);
  };

  const contactFields = [
    { key: 'email', value: data.email, placeholder: 'email@example.com' },
    { key: 'phone', value: data.phone, placeholder: '(555) 123-4567' },
    { key: 'location', value: data.location, placeholder: 'City, State' },
    { key: 'linkedin', value: data.linkedin, placeholder: 'linkedin.com/in/username' },
    { key: 'github', value: data.github, placeholder: 'github.com/username' },
  ];

  const visibleFields = contactFields.filter(f => viewMode ? f.value : true);

  return (
    <div className="resume-contact mb-6">
      <EditableText
        value={data.fullName}
        onChange={v => updateField('fullName', v)}
        viewMode={viewMode}
        className="resume-name text-3xl font-bold text-gray-900 mb-1"
        placeholder="Your Name"
      />
      <div className="contact-line flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-sm text-gray-600">
        {visibleFields.map((field, i) => (
          <span key={field.key} className="inline-flex items-center">
            <EditableText
              value={field.value}
              onChange={v => updateField(field.key as keyof ContactInfo, v)}
              viewMode={viewMode}
              placeholder={field.placeholder}
            />
            {viewMode && i < visibleFields.length - 1 && (
              <span className="contact-separator text-gray-400 mx-1">|</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
