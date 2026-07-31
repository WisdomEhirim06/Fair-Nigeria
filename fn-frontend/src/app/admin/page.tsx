'use client';

import { useEffect, useState } from 'react';

import {
  getCurrentElection,
  getResultsDashboard,
  listInviteCodes,
  listParties,
  type Election,
  type SheetCounts,
} from '@/lib/api';
import { Badge, Card, EmptyState, PageHeading, Spinner, btnPrimary } from '@/components/admin/ui';
import { electionStatusTone, formatDate } from '@/components/admin/format';

interface Overview {
  election: Election | null;
  counts: SheetCounts | null;
  parties: number;
  activeInvites: number;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const election = await getCurrentElection().catch(() => null);
      const [counts, parties, invites] = await Promise.all([
        election ? getResultsDashboard(election.id).then((d) => d.sheetCounts).catch(() => null) : null,
        election ? listParties(election.id).then((p) => p.length).catch(() => 0) : 0,
        listInviteCodes().catch(() => []),
      ]);
      if (!active) return;
      const now = Date.now();
      const activeInvites = invites.filter(
        (c) => c.isActive && new Date(c.expiresAt).getTime() > now && c.usedCount < c.maxUses,
      ).length;
      setData({ election, counts, parties, activeInvites });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeading
        eyebrow="Administrator"
        title="Overview"
        description="The state of the count at a glance where the current election stands and what needs attention."
      />

      {data.election ? (
        <div className="flex flex-col gap-6">
          {/* Current election */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                  Current election
                </p>
                <h2 className="mt-1.5 text-[1.35rem] font-extrabold tracking-[-0.02em]">
                  {data.election.name}
                </h2>
                <p className="mt-1 text-[0.85rem] text-muted">
                  {data.election.type} · {formatDate(data.election.electionDate)}
                </p>
              </div>
              <ElectionStatusBadge status={data.election.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`/admin/elections/${data.election.id}`} className={btnPrimary}>
                Manage election
              </a>
              <a href="/results" className="self-center text-[0.85rem] font-semibold text-leaf hover:text-forest-deep">
                View public results
              </a>
            </div>
          </Card>

          {/* Sheet pipeline */}
          <div>
            <p className="mb-3 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">
              Result sheets
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Verified" value={data.counts?.verified ?? 0} tone="text-leaf" />
              <Stat label="Disputed" value={data.counts?.disputed ?? 0} tone="text-error" />
              <Stat label="Pending" value={data.counts?.pending ?? 0} tone="text-gold" />
            </div>
          </div>

          {/* Config counts */}
          <div className="grid grid-cols-2 gap-3">
            <LinkStat label="Parties" value={data.parties} href={`/admin/elections/${data.election.id}`} />
            <LinkStat label="Active invite codes" value={data.activeInvites} href="/admin/invites" />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No election yet"
          body="Create an election to open uploads, transcription, ratings, and the public dashboard."
          action={
            <a href="/admin/elections" className={btnPrimary}>
              Create an election
            </a>
          }
        />
      )}
    </div>
  );
}

function ElectionStatusBadge({ status }: { status: Election['status'] }) {
  return <Badge tone={electionStatusTone(status)}>{status}</Badge>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className={`text-[1.9rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums ${tone}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[0.78rem] font-medium text-muted">{label}</div>
    </Card>
  );
}

function LinkStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a href={href} className="group">
      <Card className="p-4 transition-colors group-hover:border-lime/50 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[1.6rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
              {value}
            </div>
            <div className="mt-1.5 text-[0.78rem] font-medium text-muted">{label}</div>
          </div>
          <span className="text-ink/30 transition-colors group-hover:text-lime" aria-hidden>
            →
          </span>
        </div>
      </Card>
    </a>
  );
}
