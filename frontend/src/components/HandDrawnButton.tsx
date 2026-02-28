import React from 'react';
interface HandDrawnButtonProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}
export function HandDrawnButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: HandDrawnButtonProps) {
  const baseStyles =
  'px-6 py-3 font-semibold text-base transition-all duration-200 hand-drawn-border-pill border-2 border-[#1A1A1A] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
    'bg-[#1A1A1A] text-white hover:bg-gray-800 hand-drawn-shadow-sm active:translate-y-1 active:shadow-none',
    secondary:
    'bg-white text-[#1A1A1A] hover:bg-gray-50 hand-drawn-shadow-sm active:translate-y-1 active:shadow-none',
    outline: 'bg-transparent text-[#1A1A1A] hover:bg-black/5'
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}>

      {children}
    </button>);

}
