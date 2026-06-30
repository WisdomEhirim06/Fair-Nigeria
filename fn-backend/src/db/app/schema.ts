import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';


export const electionStatus = pgEnum('election_status', ['upcoming', 'active', 'concluded']);

// Fixed civic-content categories.
export const articleCategory = pgEnum('article_category', [
  'voter_rights',
  'accreditation',
  'malpractice',
  'reporting',
  'civic_general',
]);

// Nigeria's six geopolitical zones. Mirrors GEOPOLITICAL_ZONES in shared/validation.
export const geopoliticalZone = pgEnum('geopolitical_zone', ['NW', 'NE', 'NC', 'SW', 'SE', 'SS']);


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


//  Civic content (articles)
export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 180 }).notNull().unique(),
    title: varchar('title', { length: 200 }).notNull(),
    category: articleCategory('category').notNull(),
    excerpt: varchar('excerpt', { length: 300 }),
    body: text('body').notNull(),
    isPublished: boolean('is_published').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    authorId: uuid('author_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('articles_category_idx').on(table.category),
    // Public list reads filter on published + not-deleted, newest first.
    index('articles_published_idx').on(table.isPublished, table.publishedAt),
  ],
);


export const states = pgTable('states', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  alias: varchar('alias', { length: 80 }).notNull().unique(),
  zone: geopoliticalZone('zone').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lgas = pgTable(
  'lgas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stateId: uuid('state_id')
      .notNull()
      .references(() => states.id),
    name: varchar('name', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('lgas_state_name_idx').on(table.stateId, table.name),
    index('lgas_state_idx').on(table.stateId),
  ],
);


//  Citizen experience ratings
//  One rating per citizen per election (UNIQUE user_id+election_id). The five
//  criteria are fixed yes/no questions (see ratings.schemas RATING_CRITERIA).
//  user_id has no FK — the user row lives in the isolated fn_auth database, so
//  referential integrity is enforced at the app layer by the auth middleware.
export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    electionId: uuid('election_id')
      .notNull()
      .references(() => elections.id),
    // The LGA where the citizen voted. Unrestricted — any LGA in Nigeria.
    lgaId: uuid('lga_id')
      .notNull()
      .references(() => lgas.id),
    // Five fixed yes/no criteria. Keys mirror RATING_CRITERIA in ratings.schemas.
    noIntimidation: boolean('no_intimidation').notNull(),
    accreditationProper: boolean('accreditation_proper').notNull(),
    votingOrderly: boolean('voting_orderly').notNull(),
    securityPresent: boolean('security_present').notNull(),
    witnessedMalpractice: boolean('witnessed_malpractice').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One rating per citizen per election, DB-enforced.
    uniqueIndex('ratings_user_election_idx').on(table.userId, table.electionId),
    // Supports the dashboard aggregation: group by lga within an election.
    index('ratings_election_lga_idx').on(table.electionId, table.lgaId),
  ],
);


//  Inferred row types
export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type Election = typeof elections.$inferSelect;
export type NewElection = typeof elections.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type State = typeof states.$inferSelect;
export type NewState = typeof states.$inferInsert;
export type Lga = typeof lgas.$inferSelect;
export type NewLga = typeof lgas.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
