import React from 'react';
interface HandDrawnCardProps {
  children: React.ReactNode;
  className?: string;
  rotate?: 'left' | 'right' | 'none';
  dashed?: boolean;
}
export function HandDrawnCard({
  children,
  className = '',
  rotate = 'none',
  dashed = false
}: HandDrawnCardProps) {
  const rotationClass =
  rotate === 'left' ?
  'rotate-wobble-left' :
  rotate === 'right' ?
  'rotate-wobble-right' :
  '';
  const borderStyle = dashed ? 'border-dashed' : 'border-solid';
  return (
    <div
      className={`
        bg-white border-2 border-[#1A1A1A] ${borderStyle}
        hand-drawn-border hand-drawn-shadow
        p-6 transition-transform hover:-translate-y-1 duration-200
        ${rotationClass}
        ${className}
      `}>

      {children}
    </div>);

}