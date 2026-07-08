import { and, eq } from 'drizzle-orm';

import { appDb } from '../../db';
import { elections, lgas, ratings, type Rating } from '../../db/app/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import type { PublicRating, SubmitRatingInput } from './ratings.schemas';

function toPublicRating(row: Rating): PublicRating {
  return {
    id: row.id,
    electionId: row.electionId,
    lgaId: row.lgaId,
    noIntimidation: row.noIntimidation,
    accreditationProper: row.accreditationProper,
    votingOrderly: row.votingOrderly,
    securityPresent: row.securityPresent,
    witnessedMalpractice: row.witnessedMalpractice,
    createdAt: row.createdAt.toISOString(),
  };
}


export async function submitRating(
  userId: string,
  input: SubmitRatingInput,
): Promise<PublicRating> {
  const [election] = await appDb
    .select({ status: elections.status })
    .from(elections)
    .where(eq(elections.id, input.electionId))
    .limit(1);
  if (!election) {
    throw new AppError('NOT_FOUND', 'Election not found.', 'electionId');
  }
  if (election.status === 'upcoming') {
    throw new AppError(
      'RATING_NOT_OPEN',
      'Rating opens once the election is active. This election has not started yet.',
      'electionId',
    );
  }

  const [lga] = await appDb
    .select({ id: lgas.id })
    .from(lgas)
    .where(eq(lgas.id, input.lgaId))
    .limit(1);
  if (!lga) {
    throw new AppError('NOT_FOUND', 'LGA not found.', 'lgaId');
  }

  try {
    const [created] = await appDb
      .insert(ratings)
      .values({
        userId,
        electionId: input.electionId,
        lgaId: input.lgaId,
        noIntimidation: input.noIntimidation,
        accreditationProper: input.accreditationProper,
        votingOrderly: input.votingOrderly,
        securityPresent: input.securityPresent,
        witnessedMalpractice: input.witnessedMalpractice,
      })
      .returning();
    return toPublicRating(created);
  } catch (err) {
    if (isUniqueViolation(err, 'ratings_user_election_idx')) {
      throw new AppError(
        'ALREADY_RATED',
        'You have already submitted a rating for this election.',
      );
    }
    throw err;
  }
}

/** The citizen's own rating for an election, or 404 if they haven't rated it yet. */
export async function getMyRating(userId: string, electionId: string): Promise<PublicRating> {
  const [row] = await appDb
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.electionId, electionId)))
    .limit(1);
  if (!row) {
    throw new AppError('NOT_FOUND', 'You have not rated this election yet.');
  }
  return toPublicRating(row);
}