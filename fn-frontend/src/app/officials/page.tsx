'use client';

import { AuthFlow } from '@/components/auth/AuthFlow';
import { AuthShell } from '@/components/auth/AuthShell';
import { StaffRegisterForm } from '@/components/auth/StaffRegisterForm';

const STAFF_PLEDGE = (
  <p>
    <span aria-hidden>“</span>The labours of our heroes past,
    <br />
    shall never be in <span className="text-lime">vain.</span>
    <span aria-hidden>”</span>
  </p>
);

export default function OfficialsPage() {
  return (
    <AuthShell quote={STAFF_PLEDGE}>
      <AuthFlow renderFirst={(onDone) => <StaffRegisterForm onSubmit={onDone} />} />
    </AuthShell>
  );
}
