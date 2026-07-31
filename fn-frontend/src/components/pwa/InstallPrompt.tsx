'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'fn-install-dismissed';

/**
 * Offers to install the app, once, and never again if declined.
 *
 * Installing genuinely helps here — a field officer gets a home-screen icon and
 * a full screen on election day — but an install nag on a civic service reads
 * as pushy, so this appears after the visitor has settled and stays gone once
 * dismissed.
 */
export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const onPrompt = (e: Event) => {
      // Take control of when this is shown rather than letting the browser pick.
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Let the person read the page first.
      setTimeout(() => setVisible(true), 8000);
    };
    const onInstalled = () => {
      setVisible(false);
      setPrompt(null);
      localStorage.setItem(DISMISSED_KEY, '1');
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  async function install() {
    if (!prompt) return;
    setVisible(false);
    await prompt.prompt();
    await prompt.userChoice.catch(() => undefined);
    localStorage.setItem(DISMISSED_KEY, '1');
    setPrompt(null);
  }

  if (!visible || !prompt) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-4">
      <div className="pointer-events-auto w-full max-w-[420px] rounded-2xl border border-ink/12 bg-white p-5 shadow-[0_18px_44px_rgba(15,31,23,0.16)]">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-deep">
            <span className="h-4 w-4 rounded-full bg-lime" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-bold tracking-[-0.01em]">Install Fair Nigeria</p>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">
              Keep it on your home screen. It opens faster and keeps working when the network
              doesn’t.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => void install()}
            className="flex-1 rounded-full bg-ink py-2.5 text-[0.86rem] font-semibold text-cream transition-colors hover:bg-lime hover:text-ink"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-4 py-2.5 text-[0.86rem] font-semibold text-muted transition-colors hover:text-ink"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
