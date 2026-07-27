'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Share controls for an article. Uses plain share-intent URLs (no third-party
 * SDKs or trackers) plus the native share sheet on devices that support it —
 * which is how most people will forward a guide to WhatsApp on a phone.
 */
export function ShareBar({ title, excerpt }: { title: string; excerpt?: string | null }) {
  const [url, setUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(title);
  // WhatsApp puts the URL inside the message; X/Facebook take it as a param.
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
  const twitter = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  async function nativeShare() {
    try {
      await navigator.share({ title, text: excerpt ?? title, url });
    } catch {
      /* user dismissed the sheet — nothing to do */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="mt-12 border-t border-ink/10 pt-6">
      <p className="text-[0.9rem] font-semibold">Share this guide</p>
      <p className="mt-1 text-[0.85rem] text-muted">
        Knowing what should happen is how it gets protected. Pass it on.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {canNativeShare ? (
          <button type="button" onClick={() => void nativeShare()} className={SHARE_BTN}>
            <ShareIcon />
            Share
          </button>
        ) : null}

        <ShareLink href={whatsapp} label="WhatsApp" brand="#25D366">
          <WhatsAppIcon />
        </ShareLink>
        <ShareLink href={twitter} label="X" brand="#0f1419">
          <XIcon />
        </ShareLink>
        <ShareLink href={facebook} label="Facebook" brand="#1877F2">
          <FacebookIcon />
        </ShareLink>

        <button type="button" onClick={() => void copy()} className={SHARE_BTN}>
          <LinkIcon />
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
}

const SHARE_BTN =
  'inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[0.85rem] font-semibold text-ink/80 transition-colors hover:border-lime hover:bg-lime/10 hover:text-ink';

function ShareLink({
  href,
  label,
  brand,
  children,
}: {
  href: string;
  label: string;
  brand: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[0.85rem] font-semibold text-ink/80 transition-colors hover:bg-ink/[0.03]"
      style={{ ['--brand' as string]: brand }}
    >
      <span style={{ color: brand }}>{children}</span>
      {label}
    </a>
  );
}

/* Icons — 18px, currentColor unless a brand color is applied by the wrapper. */
function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 15 15 9" />
      <path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.1-.5 0a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.3.1-.4l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.8s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3A2.8 2.8 0 0 0 6 8.6a4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c.6.3 1.1.4 1.5.5a3.5 3.5 0 0 0 1.6.1c.5-.1 1.4-.6 1.6-1.1a2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.3 8.3L23.3 22h-6.8l-5.3-6.9L5.1 22H2l7.8-8.9L1 2h6.9l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
