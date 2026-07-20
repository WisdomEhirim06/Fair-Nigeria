'use client';

import { AppShell, ConsolePlaceholder } from '@/components/app/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';

// Administrator console: manage elections, parties, and oversight.
export default function AdminPage() {
  return (
    <RequireAuth roles={['super_admin']}>
      <AppShell>
        <ConsolePlaceholder
          eyebrow="Administrator"
          title="Election overview"
          description="Set up elections and parties, watch sheets move from uploaded to verified, and keep an eye on the whole count as it comes together."
        />
      </AppShell>
    </RequireAuth>
  );
}
