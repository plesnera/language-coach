import React from 'react';
interface DoodleProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}
export const SquigglyLine = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 10"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path
    d="M2 5 Q 12 0, 22 5 T 42 5 T 62 5 T 82 5 T 98 5"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round" />

  </svg>;

export const SpeechBubble = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path
    d="M15 25 C 20 10, 80 10, 85 25 C 95 45, 85 75, 65 80 C 50 85, 30 95, 15 95 C 20 80, 15 65, 10 50 C 5 35, 10 30, 15 25 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <path
    d="M35 45 L 65 45"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M40 60 L 60 60"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

  </svg>;

export const StarDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path
    d="M50 10 L 60 40 L 90 45 L 65 65 L 75 95 L 50 75 L 25 95 L 35 65 L 10 45 L 40 40 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

  </svg>;

export const PencilDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path d="M20 80 L 10 90 L 20 90 L 20 80 Z" fill="currentColor" />
    <path
    d="M20 80 L 30 70 L 80 20 C 85 15, 90 20, 85 25 L 35 75 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <path
    d="M30 70 L 35 75"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M70 30 L 75 35"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

  </svg>;

export const BookDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path
    d="M50 20 C 30 15, 15 20, 15 20 L 15 80 C 15 80, 30 75, 50 80 C 70 75, 85 80, 85 80 L 85 20 C 85 20, 70 15, 50 20 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <path
    d="M50 20 L 50 80"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M25 35 L 40 35"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

    <path
    d="M25 50 L 40 50"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

    <path
    d="M60 35 L 75 35"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

  </svg>;

export const GlobeDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <circle
    cx="50"
    cy="50"
    r="40"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M50 10 C 25 30, 25 70, 50 90 C 75 70, 75 30, 50 10 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <path
    d="M15 50 L 85 50"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M20 30 L 80 30"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

    <path
    d="M20 70 L 80 70"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

  </svg>;

export const MicrophoneDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <rect
    x="35"
    y="15"
    width="30"
    height="45"
    rx="15"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <path
    d="M25 45 C 25 65, 75 65, 75 45"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M50 68 L 50 85"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M35 85 L 65 85"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round" />

    <path
    d="M40 30 L 60 30"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round" />

  </svg>;

export const ChatBubbleDoodle = ({ className, ...props }: DoodleProps) =>
<svg
  viewBox="0 0 100 100"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  className={className}
  {...props}>

    <path
    d="M20 30 C 20 15, 80 15, 80 30 C 80 50, 60 65, 40 65 L 20 80 L 25 60 C 15 50, 20 40, 20 30 Z"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round" />

    <circle cx="35" cy="40" r="3" fill="currentColor" />
    <circle cx="50" cy="40" r="3" fill="currentColor" />
    <circle cx="65" cy="40" r="3" fill="currentColor" />
  </svg>;