'use client';

import { useState, useRef } from 'react';

interface InlineAddFormProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
}

export function InlineAddForm({ placeholder = 'Add item...', onSubmit }: InlineAddFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setValue('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button type="button" className="inline-add-trigger" onClick={handleOpen}>
        + Add
      </button>
    );
  }

  return (
    <div className="inline-add-form">
      <input
        ref={inputRef}
        type="text"
        className="inline-add-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') handleCancel();
        }}
      />
      <button type="button" className="inline-add-btn" onClick={handleSubmit}>
        Add
      </button>
      <button type="button" className="inline-add-cancel" onClick={handleCancel}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
