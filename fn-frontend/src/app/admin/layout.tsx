'use client';

import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { RequireAuth } from '@/components/auth/RequireAuth';

// Guards every /admin route to super_admin and gives them the CMS shell.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={['super_admin']}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
