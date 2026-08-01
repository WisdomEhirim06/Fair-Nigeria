import type { Metadata } from 'next';

import { PageChrome } from '@/components/app/PageChrome';
import { AuditViewer } from '@/components/audit/AuditViewer';

export const metadata: Metadata = {
  title: 'Transparency trail',
  description:
    'A running, append-only record of every official action taken on Fair Nigeria — what happened, and when. No login required to read it.',
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
            Every action, on the record.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[0.96rem] leading-relaxed text-muted">
            A running record of every official action, what happened and when.
          </p>
        </section>

        <div className="mt-9">
          <AuditViewer />
        </div>
      </div>
    </PageChrome>
  );
}
