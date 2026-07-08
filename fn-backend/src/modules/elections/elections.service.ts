import { desc, eq } from 'drizzle-orm';

import { appDb } from '../../db';
import { elections, type Election } from '../../db/app/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { writeAudit, type AuditActor } from '../audit/audit.service';
import type {
  CreateElectionInput,
  ElectionStatus,
  ListElectionsQuery,
  PublicElection,
} from './elections.schemas';

/** Who performed the action, for the audit trail. */
export type Actor = AuditActor;

/** Legal forward-only status transitions. Elections never move backwards. */
const ALLOWED_TRANSITIONS: Record<ElectionStatus, ElectionStatus[]> = {
  upcoming: ['active'],
  active: ['concluded'],
  concluded: [],
};

function toPublicElection(row: Election): PublicElection {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    electionDate: row.electionDate.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createElection(
  input: CreateElectionInput,
  actor: Actor,
): Promise<PublicElection> {
  const electionDate = new Date(input.electionDate);

  const row = await appDb.transaction(async (tx) => {
    const [created] = await tx
      .insert(elections)
      .values({
        name: input.name,
        type: input.type,
        electionDate,
        createdBy: actor.id,
      })
      .returning();

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'election.create',
        entityType: 'election',
        entityId: created.id,
        metadata: { name: created.name, type: created.type, status: created.status },
        ipAddress: actor.ip,
      },
      tx,
    );

    return created;
  });

  return toPublicElection(row);
}

export async function listElections(query: ListElectionsQuery): Promise<PublicElection[]> {
  const rows = await appDb
    .select()
    .from(elections)
    .where(query.status ? eq(elections.status, query.status) : undefined)
    .orderBy(desc(elections.electionDate));
  return rows.map(toPublicElection);
}

export async function getElection(id: string): Promise<PublicElection> {
  const [row] = await appDb.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!row) {
    throw new AppError('NOT_FOUND', 'Election not found.');
  }
  return toPublicElection(row);
}

export async function changeElectionStatus(
  id: string,
  next: ElectionStatus,
  actor: Actor,
): Promise<PublicElection> {
  const [current] = await appDb.select().from(elections).where(eq(elections.id, id)).limit(1);
  if (!current) {
    throw new AppError('NOT_FOUND', 'Election not found.');
  }

  if (current.status === next || !ALLOWED_TRANSITIONS[current.status].includes(next)) {
    throw new AppError(
      'INVALID_STATUS_TRANSITION',
      `Cannot move an election from '${current.status}' to '${next}'.`,
      'status',
    );
  }

  try {
    const row = await appDb.transaction(async (tx) => {
      const [updated] = await tx
        .update(elections)
        .set({ status: next, updatedAt: new Date() })
        .where(eq(elections.id, id))
        .returning();

      await writeAudit(
        {
          actorId: actor.id,
          actorRole: actor.role,
          action: 'election.status_change',
          entityType: 'election',
          entityId: id,
          metadata: { from: current.status, to: next },
          ipAddress: actor.ip,
        },
        tx,
      );

      return updated;
    });

    return toPublicElection(row);
  } catch (err) {
    // The partial unique index guarantees at most one 'active' election.
    if (isUniqueViolation(err, 'elections_single_active_idx')) {
      throw new AppError(
        'ELECTION_ALREADY_ACTIVE',
        'Another election is already active. Conclude it before activating this one.',
        'status',
      );
    }
    throw err;
  }
}
