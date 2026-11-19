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
    {/* HAL Tejas / Rafale IAF delta-wing planform silhouette */}
    <path d="M32 2L35.6 15.5L42 19.5L42 23L36 22.5L36.5 27.5L59 44.5V48.5L36.5 44.5L35 53.5L39.5 58V61L32 58.2L24.5 61V58L29 53.5L27.5 44.5L5 48.5V44.5L27.5 27.5L28 22.5L22 23V19.5L28.4 15.5L32 2Z" />
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

export const IafFinFlashSvg: React.FC<FighterJetSvgProps> = ({className = 'h-3 w-5'}) => (
  <svg viewBox="0 0 24 14" aria-hidden="true" className={className}>
    <rect x="0" y="0" width="8" height="14" fill="#ff9933" />
    <rect x="8" y="0" width="8" height="14" fill="#ffffff" />
    <rect x="16" y="0" width="8" height="14" fill="#138808" />
  </svg>
);
