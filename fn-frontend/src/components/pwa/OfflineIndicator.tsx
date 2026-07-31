'use client';

import { useEffect, useRef, useState } from 'react';

import { useOnline } from '@/lib/pwa/useOnline';

/**
 * A quiet, persistent bar while the device has no connection, and a brief
 * confirmation when it returns.
 *
 * People on weak rural signal need to know *why* something didn't send —
 * without it, a failed action looks like the app is broken.
 */
export function OfflineIndicator() {
  const online = useOnline();
  const [showBack, setShowBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowBack(false);
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setShowBack(true);
    const t = setTimeout(() => setShowBack(false), 4000);
    return () => clearTimeout(t);
  }, [online]);

  if (online && !showBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div
        className={`flex items-center gap-2.5 rounded-full px-4 py-2 text-[0.82rem] font-semibold shadow-[0_8px_24px_rgba(15,31,23,0.18)] ${
          online ? 'bg-lime text-ink' : 'bg-ink text-cream'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-forest-deep' : 'bg-gold'}`}
          aria-hidden
        />
        {online ? 'Back online' : "You're offline — your work is saved here"}
      </div>
    </div>
  );
}
