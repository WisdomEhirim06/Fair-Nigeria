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


/** Five fixed roles. Citizens self-register; the other three are admin-provisioned. */
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
  ninHash: char('nin_hash', { length: 64 }).notNull().unique(),
  role: userRole('role').notNull().default('citizen'),
  state: varchar('state', { length: 60 }),
  geopoliticalZone: varchar('geopolitical_zone', { length: 4 }),
  // False = suspended. Row is preserved for the audit trail, never deleted.
  isActive: boolean('is_active').notNull().default(true),
  // Firebase push token, refreshed on each login.
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
    // 5 minutes from creation.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Set on successful verification. Prevents replay.
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
    // 7 days from issuance.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Set on logout or rotation; non-null means the token is dead.
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_tokens_user_idx').on(table.userId),
    // Refresh/rotation looks the row up by token hash.
    index('refresh_tokens_hash_idx').on(table.tokenHash),
  ],
);

/**
 * Codeword invites used to self-provision Yiaga officials and transcribers.
 * A super admin mints a code carrying a role + geographic assignment; anyone who
 * registers with the code inherits that role/state/zone. The plaintext codeword is
 * never stored — only its SHA-256 hash. `maxUses` caps redemptions; `expiresAt`
 * time-boxes the window; `isActive` lets an admin revoke a leaked code immediately.
 */
export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  // SHA-256 hex of the normalized codeword. Unique so the same phrase can't be minted twice.
  codeHash: char('code_hash', { length: 64 }).notNull().unique(),
  // Only provisionable roles are ever stored here: yiaga_official | yiaga_transcriber.
  role: userRole('role').notNull(),
  // Geographic assignment inherited by anyone redeeming the code (feeds consensus routing).
  state: varchar('state', { length: 60 }),
  geopoliticalZone: varchar('geopolitical_zone', { length: 4 }),
  maxUses: integer('max_uses').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  // False = revoked. Row is preserved for the audit trail, never deleted.
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
