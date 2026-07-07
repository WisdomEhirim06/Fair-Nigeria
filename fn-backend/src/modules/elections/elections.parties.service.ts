import { and, asc, eq } from 'drizzle-orm';

import { appDb } from '../../db';
import { electionParties, elections, type ElectionParty } from '../../db/app/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { writeAudit, type AuditActor } from '../audit/audit.service';
import type { CreatePartyInput, PublicParty, UpdatePartyInput } from './elections.parties.schemas';

export type Actor = AuditActor;

function toPublicParty(row: ElectionParty): PublicParty {
  return {
    id: row.id,
    electionId: row.electionId,
    name: row.name,
    abbreviation: row.abbreviation,
    candidateName: row.candidateName,
    createdAt: row.createdAt.toISOString(),
  };
}


async function assertPartiesEditable(electionId: string): Promise<void> {
  const [election] = await appDb
    .select({ status: elections.status })
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);
  if (!election) {
    throw new AppError('NOT_FOUND', 'Election not found.', 'id');
  }
  if (election.status !== 'upcoming') {
    throw new AppError(
      'PARTIES_LOCKED',
      'Parties can only be changed while the election is still upcoming.',
    );
  }
}

/** List an election's parties. Public. */
export async function listParties(electionId: string): Promise<PublicParty[]> {
  const rows = await appDb
    .select()
    .from(electionParties)
    .where(eq(electionParties.electionId, electionId))
    .orderBy(asc(electionParties.abbreviation));
  return rows.map(toPublicParty);
}

export async function createParty(
  electionId: string,
  input: CreatePartyInput,
  actor: Actor,
): Promise<PublicParty> {
  await assertPartiesEditable(electionId);

  try {
    const row = await appDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(electionParties)
        .values({
          electionId,
          name: input.name,
          abbreviation: input.abbreviation,
          candidateName: input.candidateName ?? null,
        })
        .returning();

      await writeAudit(
        {
          actorId: actor.id,
          actorRole: actor.role,
          action: 'election.party_add',
          entityType: 'election',
          entityId: electionId,
          metadata: { partyId: created.id, abbreviation: created.abbreviation },
          ipAddress: actor.ip,
        },
        tx,
      );

      return created;
    });

    return toPublicParty(row);
  } catch (err) {
    if (isUniqueViolation(err, 'election_parties_election_abbr_idx')) {
      throw new AppError(
        'DUPLICATE_SLUG',
        'A party with that abbreviation already exists for this election.',
        'abbreviation',
      );
    }
    throw err;
  }
}

export async function updateParty(
  electionId: string,
  partyId: string,
  input: UpdatePartyInput,
  actor: Actor,
): Promise<PublicParty> {
  await assertPartiesEditable(electionId);

  if (
    input.name === undefined &&
    input.abbreviation === undefined &&
    input.candidateName === undefined
  ) {
    throw new AppError('VALIDATION_ERROR', 'Provide at least one field to update.');
  }

  try {
    const row = await appDb.transaction(async (tx) => {
      const [updated] = await tx
        .update(electionParties)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.abbreviation !== undefined ? { abbreviation: input.abbreviation } : {}),
          ...(input.candidateName !== undefined ? { candidateName: input.candidateName } : {}),
        })
        .where(and(eq(electionParties.id, partyId), eq(electionParties.electionId, electionId)))
        .returning();

      if (!updated) {
        throw new AppError('NOT_FOUND', 'Party not found.', 'partyId');
      }

      await writeAudit(
        {
          actorId: actor.id,
          actorRole: actor.role,
          action: 'election.party_update',
          entityType: 'election',
          entityId: electionId,
          metadata: { partyId },
          ipAddress: actor.ip,
        },
        tx,
      );

      return updated;
    });

    return toPublicParty(row);
  } catch (err) {
    if (isUniqueViolation(err, 'election_parties_election_abbr_idx')) {
      throw new AppError(
        'DUPLICATE_SLUG',
        'A party with that abbreviation already exists for this election.',
        'abbreviation',
      );
    }
    throw err;
  }
}

export async function deleteParty(
  electionId: string,
  partyId: string,
  actor: Actor,
): Promise<void> {
  await assertPartiesEditable(electionId);

  await appDb.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(electionParties)
      .where(and(eq(electionParties.id, partyId), eq(electionParties.electionId, electionId)))
      .returning({ id: electionParties.id });

    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Party not found.', 'partyId');
    }

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'election.party_remove',
        entityType: 'election',
        entityId: electionId,
        metadata: { partyId },
        ipAddress: actor.ip,
      },
      tx,
    );
  });
}
