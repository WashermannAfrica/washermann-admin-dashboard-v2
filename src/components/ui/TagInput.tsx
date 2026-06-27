'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  label?: string;
  required?: boolean;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
}

/**
 * Chip/tag input: type a value and press Enter (or comma) to add it as a chip;
 * Backspace on an empty field removes the last chip. Matches the Add Area design.
 */
export function TagInput({ label, required, value, onChange, placeholder, max = 50 }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, t]);
    setDraft('');
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length) {
      remove(value.length - 1);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-12 w-full cursor-text flex-wrap items-center gap-2 rounded-2xl bg-section px-3 py-2',
          'focus-within:ring-2 focus-within:ring-primary/40',
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[13px] text-ink"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(i); }}
              className="text-faint hover:text-danger"
              aria-label={`Remove ${tag}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="h-7 min-w-[8rem] flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
        />
      </div>
    </div>
  );
}
