import React, { useId } from 'react';
interface HandDrawnInputProps extends
  React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}
export function HandDrawnInput({
  label,
  error,
  className = '',
  multiline = false,
  rows = 4,
  ...props
}: HandDrawnInputProps) {
  const id = useId();
  const inputClasses = `
    w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt
    px-4 py-3 text-[#1A1A1A] placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]
    transition-colors
    ${error ? 'border-[#DC2626]' : ''}
    ${className}
  `;
  return (
    <div className="flex flex-col gap-2 w-full">
      {label &&
      <label
        htmlFor={id}
        className="font-heading font-bold text-[#1A1A1A] text-lg">

          {label}
        </label>
      }

      {multiline ?
      <textarea
        id={id}
        className={inputClasses}
        rows={rows}
        {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>} /> :


      <input
        id={id}
        className={inputClasses}
        {...props as React.InputHTMLAttributes<HTMLInputElement>} />

      }

      {error &&
      <span className="text-[#DC2626] text-sm font-medium flex items-center gap-1">
          <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-4 h-4"
          stroke="currentColor"
          strokeWidth="2">

            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

          </svg>
          {error}
        </span>
      }
    </div>);

}
