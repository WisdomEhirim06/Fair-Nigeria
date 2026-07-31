'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerManager() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // A worker may already be waiting from a previous visit.
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaiting(reg.waiting);
        }
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setWaiting(installing);
            }
          });
        });
      })
      .catch(() => {
        // Registration failing must never break the app; it just means no
        // offline support on this device.
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-4">
      <div className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl border border-ink/12 bg-forest-deep px-4 py-3 text-cream shadow-[0_18px_40px_rgba(15,31,23,0.28)]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-lime" aria-hidden />
        <p className="flex-1 text-[0.86rem] font-medium leading-snug">
          A new version is ready.
        </p>
        <button
          type="button"
          onClick={() => waiting.postMessage({ type: 'SKIP_WAITING' })}
          className="shrink-0 rounded-full bg-lime px-4 py-1.5 text-[0.82rem] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setWaiting(null)}
          aria-label="Dismiss"
          className="shrink-0 text-cream/50 transition-colors hover:text-cream"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
