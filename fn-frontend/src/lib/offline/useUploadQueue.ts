'use client';

import { useCallback, useEffect, useState } from 'react';

import { uploadSheet } from '@/lib/api';
import {
  fileFromQueued,
  flushQueue,
  listQueuedUploads,
  removeQueuedUpload,
  type QueuedUpload,
} from './uploadQueue';


export function useUploadQueue() {
  const [items, setItems] = useState<QueuedUpload[]>([]);
  const [flushing, setFlushing] = useState(false);

  const refresh = useCallback(async () => {
    setItems(await listQueuedUploads());
  }, []);

  const flush = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      setFlushing(true);
      await flushQueue(
        (item) =>
          uploadSheet({
            electionId: item.electionId,
            stateId: item.stateId,
            lgaId: item.lgaId,
            puCode: item.puCode,
            file: fileFromQueued(item),
          }),
        options,
      ).catch(() => undefined);
      setFlushing(false);
      await refresh();
    },
    [refresh],
  );

  const discard = useCallback(
    async (id: string) => {
      await removeQueuedUpload(id);
      await refresh();
    },
    [refresh],
  );

  // Load on mount, try once if already online, and retry the moment we
  // reconnect — the officer shouldn't have to remember to press anything.
  useEffect(() => {
    void (async () => {
      await refresh();
      void flush();
    })();

    const onOnline = () => void flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh, flush]);

  return { items, flushing, flush, discard, refresh };
}
