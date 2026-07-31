import {
  boolean,
  char,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';


export const userRole = pgEnum('user_role', [
  'citizen',
  'yiaga_official',
  'yiaga_transcriber',
  'super_admin',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 120 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  ninHash: char('nin_hash', { length: 64 }).notNull().unique(),
  role: userRole('role').notNull().default('citizen'),
  state: varchar('state', { length: 60 }),
  geopoliticalZone: varchar('geopolitical_zone', { length: 4 }),
  isActive: boolean('is_active').notNull().default(true),
  fcmToken: text('fcm_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


export const otpRecords = pgTable(
  'otp_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
    codeHash: char('code_hash', { length: 64 }).notNull(),
    attempts: smallint('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('otp_records_phone_idx').on(table.phoneNumber),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_tokens_user_idx').on(table.userId),
    index('refresh_tokens_hash_idx').on(table.tokenHash),
  ],
);

//  invite code by the admins to create yiaga officials and transcribers
export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: char('code_hash', { length: 64 }).notNull().unique(),
  role: userRole('role').notNull(),
  state: varchar('state', { length: 60 }),
  geopoliticalZone: varchar('geopolitical_zone', { length: 4 }),
  maxUses: integer('max_uses').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Inferred row types for use across the auth module.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OtpRecord = typeof otpRecords.$inferSelect;
export type NewOtpRecord = typeof otpRecords.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;
