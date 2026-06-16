import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';


export const electionStatus = pgEnum('election_status', ['upcoming', 'active', 'concluded']);


export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'),
    actorRole: varchar('actor_role', { length: 20 }),
    // Dotted action name, e.g. 'election.create', 'article.publish'.
    action: varchar('action', { length: 80 }).notNull(),
    entityType: varchar('entity_type', { length: 40 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }),
    metadata: jsonb('metadata'),
    // IPv4/IPv6 of the actor where known.
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_actor_idx').on(table.actorId),
    index('audit_log_created_idx').on(table.createdAt),
  ],
);


//  Elections
export const elections = pgTable(
  'elections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 160 }).notNull(),
    // e.g. 'presidential'. Only presidential is in scope for 2027.
    type: varchar('type', { length: 60 }).notNull(),
    electionDate: timestamp('election_date', { withTimezone: true }).notNull(),
    status: electionStatus('status').notNull().default('upcoming'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // At most one election may be 'active' at a time (partial unique index).
    uniqueIndex('elections_single_active_idx')
      .on(table.status)
      .where(sql`${table.status} = 'active'`),
  ],
);


//  Inferred row types
export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
