import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  viewMode: boolean;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

export function EditableText({ value, onChange, viewMode, placeholder, className, multiline }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && !isEditing) {
      ref.current.textContent = value || '';
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      if (ref.current) {
        ref.current.textContent = value;
      }
    }
  };

  const handleFocus = () => {
    if (!viewMode) {
      setIsEditing(true);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.textContent || '');
  };

  if (viewMode) {
    const Component = multiline ? 'div' : 'span';
    return (
      <Component className={clsx(className, !value && 'text-gray-400')}>
        {value || placeholder}
      </Component>
    );
  }

  const ContentComponent = multiline ? 'div' : 'span';

  return (
    <ContentComponent
      ref={ref}
      className={clsx(
        className,
        'outline-none border-b border-dashed border-gray-300 hover:border-gray-400 focus:border-blue-500 cursor-text rounded px-1 -mx-1',
        !value && 'text-gray-400'
      )}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
    >
      {value || placeholder}
    </ContentComponent>
  );
}