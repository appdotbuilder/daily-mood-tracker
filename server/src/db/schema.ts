import { serial, text, pgTable, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';

// Define mood enum for PostgreSQL
export const moodTypeEnum = pgEnum('mood_type', ['😊', '😢', '😡', '🤩', '😐']);

export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // For future user management
  date: date('date').notNull(), // The specific date for this mood entry (YYYY-MM-DD)
  mood: moodTypeEnum('mood').notNull(),
  note: text('note'), // Nullable by default - optional note about the mood
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Add unique constraint on user_id and date to ensure one mood per day per user
// This will be handled in the application logic for now

// TypeScript types for the table schema
export type MoodEntry = typeof moodEntriesTable.$inferSelect; // For SELECT operations
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { moodEntries: moodEntriesTable };