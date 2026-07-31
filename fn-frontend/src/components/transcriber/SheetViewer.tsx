'use client';

import { useState } from 'react';

import type { Sheet } from '@/lib/api';

/**
 * The sheet under transcription. Images can be zoomed (tap toggles 1×/2× with
 * pan); PDFs open in a new tab since they're better read full-size.
 */
export function SheetViewer({ sheet }: { sheet: Sheet }) {
  const [zoomed, setZoomed] = useState(false);
  const isPdf = sheet.mimeType === 'application/pdf';

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2.5">
        <span className="truncate font-mono text-[0.8rem] font-semibold">{sheet.puCode}</span>
        <span className="shrink-0 font-mono text-[0.68rem] text-muted">
          #{sheet.fileHash.slice(0, 10)}
        </span>
      </div>

      {isPdf ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-forest/10 font-mono text-[0.72rem] font-bold text-forest-deep">
            PDF
          </span>
          <p className="text-[0.9rem] text-muted">This sheet is a PDF.</p>
          {sheet.fileUrl ? (
            <a
              href={sheet.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-ink/20 px-5 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:border-lime hover:bg-lime/10"
            >
              Open sheet
            </a>
          ) : null}
        </div>
      ) : (
        <div className={`flex-1 bg-ink/[0.03] ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}>
          {sheet.fileUrl ? (
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="block w-full cursor-zoom-in"
              aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sheet.fileUrl}
                alt={`Result sheet for ${sheet.puCode}`}
                className={`mx-auto transition-transform duration-200 ${
                  zoomed ? 'w-[200%] max-w-none cursor-zoom-out' : 'w-full'
                }`}
              />
            </button>
          ) : (
            <p className="px-6 py-16 text-center text-[0.9rem] text-muted">
              The sheet image is unavailable.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
