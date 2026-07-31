'use client';

import { AppShell } from '@/components/app/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { UploadConsole } from '@/components/official/UploadConsole';

// Field-officer console: capture and upload EC8A result sheets.
export default function UploadPage() {
  return (
    <RequireAuth roles={['yiaga_official']}>
      <AppShell>
        <UploadConsole />
      </AppShell>
    </RequireAuth>
  );
}
