import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Placeholder that proves migrations run. Not the real data model. */
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
