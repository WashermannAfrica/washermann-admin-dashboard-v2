'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/* Rounded-pill grey inputs from the designs: label above (red asterisk when
   required), #F4F4F4 fill, no border until focus. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, required, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'h-12 w-full rounded-full bg-section px-5 text-sm text-ink',
              'placeholder:text-faint transition-shadow',
              'focus:outline-none focus:ring-2 focus:ring-primary/40',
              error && 'ring-2 ring-danger/40',
              !!leftIcon && 'pl-11',
              !!rightIcon && 'pr-11',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-faint">{rightIcon}</span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

/* Same look for textareas. */
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; required?: boolean }>(
  ({ label, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            'min-h-28 w-full rounded-2xl bg-section px-5 py-4 text-sm text-ink',
            'placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/40',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

/* Pill select used in forms (not the filter dropdowns). */
export function SelectField({
  label,
  required,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-ink">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        className={cn(
          'h-12 w-full appearance-none rounded-full bg-section px-5 text-sm text-ink',
          'focus:outline-none focus:ring-2 focus:ring-primary/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
