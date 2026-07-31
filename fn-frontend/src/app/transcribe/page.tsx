'use client';

import { AppShell } from '@/components/app/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { TranscribeConsole } from '@/components/transcriber/TranscribeConsole';

// Transcriber console: read uploaded sheets and enter the figures for consensus.
export default function TranscribePage() {
  return (
    <RequireAuth roles={['yiaga_transcriber']}>
      <AppShell>
        <TranscribeConsole />
      </AppShell>
    </RequireAuth>
  );
}
