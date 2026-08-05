import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { AuditViewer } from '@/components/audit/AuditViewer';

export const metadata: Metadata = {
  title: 'Transparency trail',
  description:
    'Every result sheet uploaded, verified, and every change made to an election — written down when it happens.',
  alternates: { canonical: '/audit' },
};

// Public, append-only transparency trail. No login required.
export default function AuditPage() {
  return (
    <PageChrome>
      <div className="mx-auto w-full max-w-[720px] px-6 pb-20">
        <section className="pt-10 sm:pt-12">
          <p className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-leaf">
            Transparency trail
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,5.2vw,2.9rem)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            Nothing happens quietly.
          </h1>
          <p className="mt-4 max-w-[54ch] text-[0.96rem] leading-relaxed text-muted">
            Every result sheet uploaded, verified, and every change an administrator
            makes to an election is written down here the moment it happens.
          </p>
          <p className="mt-3 max-w-[54ch] text-[0.96rem] leading-relaxed text-muted">
            You don’t need to read it. It’s here so that if anyone ever questions a number, the
            answer can be checked rather than argued about.
          </p>
        </section>

        <div className="mt-9">
          <AuditViewer />
        </div>
      </div>
    </PageChrome>
  );
}
