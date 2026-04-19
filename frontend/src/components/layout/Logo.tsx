'use client';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }}>
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E879F9" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M6 36 L16 18 L24 26 L34 12 L40 36 Z" fill="url(#logo-gradient)" stroke="#C084FC" strokeWidth="2" />
        <rect x="22" y="8" width="5" height="5" fill="#E9D5FF" />
        <rect x="28" y="16" width="4" height="4" fill="#DDD6FE" />
        <rect x="30" y="8" width="3" height="3" fill="#C084FC" />
        <path d="M8 38 H38" stroke="rgba(232, 73, 153, 0.25)" strokeWidth="2" />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '0.24em', fontSize: '0.95rem', color: '#F8F4FF' }}>zenith</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, letterSpacing: '0.32em', fontSize: '0.72rem', color: '#EC4899' }}>AI</div>
      </div>
    </div>
  );
}
