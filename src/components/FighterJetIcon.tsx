import React from 'react';

interface FighterJetSvgProps {
  className?: string;
}

export const FighterJetSvg: React.FC<FighterJetSvgProps> = ({className = 'h-5 w-5'}) => (
  <svg
    viewBox="0 0 64 64"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M32 3L36.5 19.5L58 34.5V40.5L36.5 34.5L35 49.5L44 56.5V60L32 56.5L20 60V56.5L29 49.5L27.5 34.5L6 40.5V34.5L27.5 19.5L32 3Z" />
  </svg>
);

export const IafRoundelSvg: React.FC<FighterJetSvgProps> = ({className = 'h-6 w-6'}) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <circle cx="24" cy="24" r="22" fill="#0c2340" stroke="#38bdf8" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="15.5" fill="#138808" />
    <circle cx="24" cy="24" r="10.5" fill="#ffffff" />
    <circle cx="24" cy="24" r="5.5" fill="#ff9933" />
  </svg>
);
