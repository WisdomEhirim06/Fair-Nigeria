'use client';

import { AuthFlow } from '@/components/auth/AuthFlow';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthFlow renderFirst={(onDone) => <RegisterForm onSubmit={onDone} />} />
    </AuthShell>
  );
}
