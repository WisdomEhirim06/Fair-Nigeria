import { asc, eq } from 'drizzle-orm';

import { appDb } from '../../db';
import { lgas, states, type Lga, type State } from '../../db/app/schema';
import { AppError } from '../../shared/errors';
import type { PublicLga, PublicState } from './geography.schemas';

function toState(row: State): PublicState {
  return { id: row.id, name: row.name, alias: row.alias, zone: row.zone };
}

function toLga(row: Lga): PublicLga {
  return { id: row.id, stateId: row.stateId, name: row.name };
}

/** All 37 states (incl. FCT), alphabetical. Static reference data. */
export async function listStates(): Promise<PublicState[]> {
  const rows = await appDb.select().from(states).orderBy(asc(states.name));
  return rows.map(toState);
}

/** LGAs within a state, alphabetical. 404 if the state id is unknown. */
export async function listLgasByState(stateId: string): Promise<PublicLga[]> {
  const [state] = await appDb
    .select({ id: states.id })
    .from(states)
    .where(eq(states.id, stateId))
    .limit(1);
  if (!state) {
    throw new AppError('NOT_FOUND', 'State not found.');
  }

  const rows = await appDb
    .select()
    .from(lgas)
    .where(eq(lgas.stateId, stateId))
    .orderBy(asc(lgas.name));
  return rows.map(toLga);
}
