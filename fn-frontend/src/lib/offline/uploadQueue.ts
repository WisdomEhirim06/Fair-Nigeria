/**
 * A durable queue for EC8A uploads that couldn't reach the server.
 *
 * Field officers work at polling units with thin or no signal, and a sheet is
 * evidence — losing one because the network dropped mid-send is not acceptable.
 * So a failed upload is written to IndexedDB, file and all, and retried when
 * the device is back online.
 *
 * Two rules follow from "this is evidence":
 *   1. A queued sheet is only ever removed after the server accepts it, or when
 *      the officer explicitly discards it. Nothing is dropped silently.
 *   2. After several failed attempts we stop retrying automatically and surface
 *      the item, rather than looping forever against an error we can't fix.
 */

const DB_NAME = 'fair-nigeria';
const DB_VERSION = 1;
const STORE = 'pending-uploads';

/** Auto-retries before we stop and ask the officer to look. */
export const MAX_AUTO_ATTEMPTS = 5;

export interface QueuedUpload {
  id: string;
  electionId: string;
  stateId: string;
  lgaId: string;
  puCode: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export type NewQueuedUpload = Omit<QueuedUpload, 'id' | 'createdAt' | 'attempts' | 'lastError'>;

function supported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
      }),
  );
}

/** Save a sheet that couldn't be sent. Returns the stored record. */
export async function enqueueUpload(input: NewQueuedUpload): Promise<QueuedUpload> {
  const record: QueuedUpload = {
    ...input,
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  };
  if (!supported()) throw new Error('Offline storage is unavailable on this device.');
  await tx('readwrite', (store) => store.add(record));
  return record;
}

export async function listQueuedUploads(): Promise<QueuedUpload[]> {
  if (!supported()) return [];
  const rows = await tx<QueuedUpload[]>('readonly', (store) => store.getAll()).catch(() => []);
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

export async function countQueuedUploads(): Promise<number> {
  if (!supported()) return 0;
  return tx<number>('readonly', (store) => store.count()).catch(() => 0);
}

export async function removeQueuedUpload(id: string): Promise<void> {
  if (!supported()) return;
  await tx('readwrite', (store) => store.delete(id)).catch(() => undefined);
}

async function markAttempt(record: QueuedUpload, message: string): Promise<void> {
  await tx('readwrite', (store) =>
    store.put({ ...record, attempts: record.attempts + 1, lastError: message }),
  ).catch(() => undefined);
}

export interface FlushSummary {
  sent: number;
  failed: number;
  remaining: number;
}

/**
 * Try to send everything queued.
 *
 * `send` is injected rather than imported so this module stays free of any
 * dependency on the API client, and so tests can drive it directly.
 * Set `force` to retry items that have exhausted their automatic attempts.
 */
export async function flushQueue(
  send: (item: QueuedUpload) => Promise<unknown>,
  options: { force?: boolean } = {},
): Promise<FlushSummary> {
  if (!supported()) return { sent: 0, failed: 0, remaining: 0 };

  const items = await listQueuedUploads();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    if (!options.force && item.attempts >= MAX_AUTO_ATTEMPTS) continue;
    // Stop early rather than burning through the queue while plainly offline.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) break;
    try {
      await send(item);
      await removeQueuedUpload(item.id);
      sent += 1;
    } catch (err) {
      failed += 1;
      await markAttempt(item, err instanceof Error ? err.message : 'Could not send.');
    }
  }

  return { sent, failed, remaining: await countQueuedUploads() };
}

/** Rebuild a File from a queued record, ready to hand to the upload endpoint. */
export function fileFromQueued(item: QueuedUpload): File {
  return new File([item.blob], item.fileName, { type: item.mimeType });
}
