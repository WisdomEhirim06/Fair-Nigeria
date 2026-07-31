'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import {
  ApiError,
  listLgas,
  listStates,
  uploadSheet,
  type Election,
  type Lga,
  type Sheet,
  type StateOption,
} from '@/lib/api';
import { SelectField } from '@/components/ui/SelectField';
import { enqueueUpload } from '@/lib/offline/uploadQueue';

type Props = {
  election: Election;
  /** The officer's own state name, used to preselect the state dropdown. */
  defaultStateName?: string | null;
  onUploaded: (sheet: Sheet) => void;
  /** The sheet couldn't be sent and is safely queued on the device. */
  onQueued: () => void;
  onCancel: () => void;
};

const ACCEPT = 'image/jpeg,image/png,application/pdf';

export function UploadForm({
  election,
  defaultStateName,
  onUploaded,
  onQueued,
  onCancel,
}: Props) {
  const [states, setStates] = useState<StateOption[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [stateId, setStateId] = useState('');
  const [lgaId, setLgaId] = useState('');
  const [puCode, setPuCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const puId = useId();

  // Load states once; preselect the officer's own state when it matches.
  useEffect(() => {
    void (async () => {
      const rows = await listStates().catch(() => []);
      setStates(rows);
      if (defaultStateName) {
        const mine = rows.find((s) => s.name === defaultStateName);
        if (mine) setStateId(mine.id);
      }
    })();
  }, [defaultStateName]);

  // Cascade LGAs whenever the state changes.
  useEffect(() => {
    if (!stateId) {
      setLgas([]);
      return;
    }
    setLgaId('');
    void (async () => {
      setLgas(await listLgas(stateId).catch(() => []));
    })();
  }, [stateId]);

  // Manage the preview object URL lifetime.
  useEffect(() => {
    if (!file || file.type === 'application/pdf') {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    if (chosen) {
      setFile(chosen);
      setError(null);
    }
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
  }

  const ready = Boolean(file && stateId && lgaId && puCode.trim());

  /** Save the sheet on the device so it can be sent when there's signal. */
  async function queueIt(): Promise<boolean> {
    if (!file) return false;
    try {
      await enqueueUpload({
        electionId: election.id,
        stateId,
        lgaId,
        puCode: puCode.trim(),
        blob: file,
        fileName: file.name || 'sheet',
        mimeType: file.type,
      });
      onQueued();
      return true;
    } catch {
      return false;
    }
  }

  async function submit() {
    if (!ready || !file) return;
    setSubmitting(true);
    setError(null);
    setFieldError(null);

    // Plainly offline: don't waste the officer's time on a doomed request.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      if (await queueIt()) return;
      setError('Could not save this sheet on your device. Try again.');
      setSubmitting(false);
      return;
    }

    try {
      const sheet = await uploadSheet({
        electionId: election.id,
        stateId,
        lgaId,
        puCode: puCode.trim(),
        file,
      });
      onUploaded(sheet);
    } catch (err) {
      // A 4xx other than 401 means the server looked at this and refused it —
      // retrying unchanged would fail forever, so show it and let the officer
      // fix it. Anything else (network dropped, expired session, server
      // trouble) is worth keeping and sending later.
      const permanent =
        err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 401;

      if (permanent) {
        setError((err as ApiError).message);
        setFieldError((err as ApiError).field ?? null);
        setSubmitting(false);
        return;
      }

      if (await queueIt()) return;
      setError('Upload failed and the sheet could not be saved. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 pb-24 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="mb-5 inline-flex items-center text-[0.85rem] font-medium text-muted transition-colors hover:text-ink"
      >
        My sheets
      </button>

      <h1 className="text-[clamp(1.45rem,5vw,2.1rem)] font-extrabold tracking-[-0.03em]">
        Send a result sheet
      </h1>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
        Photograph the EC8A at your polling unit. It’s fingerprinted on arrival and can’t be
        altered.
      </p>

      {/* Capture */}
      <div className="mt-7">
        {file ? (
          <div className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Selected sheet" className="max-h-72 w-full object-contain" />
            ) : (
              <div className="flex items-center gap-3 px-5 py-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10 font-mono text-[0.7rem] font-bold text-forest-deep">
                  PDF
                </span>
                <span className="truncate text-[0.9rem] font-medium">{file.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3">
              <span className="truncate font-mono text-[0.72rem] text-muted">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-[0.8rem] font-semibold text-leaf hover:text-forest-deep"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-2xl border border-ink/15 bg-white py-7 text-ink transition-colors hover:border-lime hover:bg-lime/10"
            >
              <CameraIcon />
              <span className="text-[0.9rem] font-semibold">Take photo</span>
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-2xl border border-ink/15 bg-white py-7 text-ink transition-colors hover:border-lime hover:bg-lime/10"
            >
              <FileIcon />
              <span className="text-[0.9rem] font-semibold">Choose file</span>
            </button>
          </div>
        )}
        <input
          ref={cameraRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          onChange={pick}
          className="hidden"
        />
        <input ref={fileRef} type="file" accept={ACCEPT} onChange={pick} className="hidden" />
      </div>

      {/* Location */}
      <div className="mt-4 flex flex-col gap-4">
        <SelectField
          label="State"
          value={stateId}
          onChange={setStateId}
          options={states.map((s) => ({ value: s.id, label: s.name }))}
        />
        <SelectField
          label="Local government"
          value={lgaId}
          onChange={setLgaId}
          disabled={!stateId}
          options={lgas.map((l) => ({ value: l.id, label: l.name }))}
        />

        <div className="relative">
          <input
            id={puId}
            value={puCode}
            onChange={(e) => setPuCode(e.target.value)}
            placeholder=" "
            className={`peer h-14 w-full rounded-xl border bg-white px-4 pb-1 pt-5 font-mono text-[0.95rem] outline-none transition-colors focus:ring-2 focus:ring-lime/20 ${
              fieldError === 'puCode' ? 'border-error' : 'border-ink/15 focus:border-lime'
            }`}
          />
          <label
            htmlFor={puId}
            className="pointer-events-none absolute left-4 top-2 origin-left text-[0.7rem] font-medium text-muted transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[1rem] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[0.7rem]"
          >
            Polling unit code
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-[0.85rem] font-medium text-error">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!ready || submitting}
        className="mt-6 h-14 w-full rounded-full bg-ink text-[0.95rem] font-semibold text-cream transition enabled:hover:bg-lime enabled:hover:text-ink disabled:opacity-40"
      >
        {submitting ? 'Sending…' : 'Send sheet'}
      </button>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M3 8a2 2 0 0 1 2-2h1.5l1-1.5h5l1 1.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
