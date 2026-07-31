import type { ReactNode } from 'react';

import type { NavIcon } from '@/lib/auth/roles';

const PATHS: Record<NavIcon, ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />,
  upload: (
    <>
      <path d="M12 16V5m0 0L7.5 9.5M12 5l4.5 4.5" />
      <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />
    </>
  ),
  transcribe: (
    <>
      <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v5h5M8 13h8M8 17h5" />
    </>
  ),
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10L5.6 18.4" />
    </>
  ),
  results: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20V10M12 20V5M17 20v-7" />
    </>
  ),
  audit: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4M11 8v3.2l2 1.3" />
    </>
  ),
};

export function NavGlyph({ icon, size = 20 }: { icon: NavIcon; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[icon]}
    </svg>
  );
}
