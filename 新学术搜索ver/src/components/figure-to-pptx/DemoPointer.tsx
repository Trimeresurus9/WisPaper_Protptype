import React from 'react';

interface DemoPointerProps {
  left: number;
  top: number;
  opacity: number;
}

export function DemoPointer({ left, top, opacity }: DemoPointerProps) {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true"
      style={{ position: 'absolute', left, top, opacity, filter: 'drop-shadow(0 3px 4px rgba(34,38,44,0.18))', zIndex: 60 }}>
      <path d="M3 2.5L23.5 17.5L14.8 19.2L19.7 28.2L15.2 30.4L10.4 21.2L4.3 27.3L3 2.5Z" fill="#22262c" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}
