import { count, eq } from 'drizzle-orm';

import { appDb, closeAppDb } from './index';
import { lgas, states } from './schema';
import { logger } from '../../shared/logger';
import type { GeopoliticalZone } from '../../shared/validation';
import rawData from './seed-data/nigeria-state-and-lgas.json';

const ZONE_BY_ALIAS: Record<string, GeopoliticalZone> = {
  // North Central
  benue: 'NC',
  kogi: 'NC',
  kwara: 'NC',
  nasarawa: 'NC',
  niger: 'NC',
  plateau: 'NC',
  abuja: 'NC', // Federal Capital Territory
  // North East
  adamawa: 'NE',
  bauchi: 'NE',
  borno: 'NE',
  gombe: 'NE',
  taraba: 'NE',
  yobe: 'NE',
  // North West
  jigawa: 'NW',
  kaduna: 'NW',
  kano: 'NW',
  katsina: 'NW',
  kebbi: 'NW',
  sokoto: 'NW',
  zamfara: 'NW',
  // South East
  abia: 'SE',
  anambra: 'SE',
  ebonyi: 'SE',
  enugu: 'SE',
  imo: 'SE',
  // South South
  akwa_ibom: 'SS',
  bayelsa: 'SS',
  cross_river: 'SS',
  delta: 'SS',
  edo: 'SS',
  rivers: 'SS',
  // South West
  ekiti: 'SW',
  lagos: 'SW',
  ogun: 'SW',
  ondo: 'SW',
  osun: 'SW',
  oyo: 'SW',
};

async function seed(): Promise<void> {
  for (const entry of rawData) {
    const zone = ZONE_BY_ALIAS[entry.alias];
    if (!zone) {
      throw new Error(`No geopolitical zone mapped for state alias '${entry.alias}'.`);
    }

    // Upsert the state, then resolve its id (onConflictDoNothing returns nothing on conflict).
    await appDb
      .insert(states)
      .values({ name: entry.state, alias: entry.alias, zone })
      .onConflictDoNothing();

    const [state] = await appDb
      .select({ id: states.id })
      .from(states)
      .where(eq(states.alias, entry.alias))
      .limit(1);

    if (!state) {
      throw new Error(`Failed to upsert state '${entry.state}'.`);
    }

    if (entry.lgas.length > 0) {
      await appDb
        .insert(lgas)
        .values(entry.lgas.map((name) => ({ stateId: state.id, name })))
        .onConflictDoNothing();
    }
  }

  const [{ stateCount }] = await appDb.select({ stateCount: count() }).from(states);
  const [{ lgaCount }] = await appDb.select({ lgaCount: count() }).from(lgas);
  logger.info({ stateCount, lgaCount }, 'Reference data seeded (states + LGAs).');
}

seed()
  .then(() => closeAppDb())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Seeding failed.');
    void closeAppDb().finally(() => process.exit(1));
  });
