// src/db/schema.ts

import { sqliteTable, text, integer, real, AnySQLiteColumn, index } from "drizzle-orm/sqlite-core";
import { relations, sql } from 'drizzle-orm';

function createId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const p = !!prefix ? `${prefix}_` : ""

  const array = new Uint8Array(12);
  crypto.getRandomValues(array);

  const random = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${p}${timestamp}${random}`;
}


export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId("usr")),
  name: text('name').notNull(),
  masterKey: text('masterKey').notNull(),
  authKey: text('authKey'),
  bio: text('bio').notNull().default('No bio yet'),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
