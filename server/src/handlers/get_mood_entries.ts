import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type GetMoodEntriesInput, type MoodEntry } from '../schema';
import { eq, and, gte, lte, desc, type SQL } from 'drizzle-orm';

export const getMoodEntries = async (input: GetMoodEntriesInput): Promise<MoodEntry[]> => {
  try {
    // Collect conditions for filtering
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(moodEntriesTable.user_id, input.user_id));

    // Add date range filters if provided
    if (input.start_date) {
      conditions.push(gte(moodEntriesTable.date, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(moodEntriesTable.date, input.end_date));
    }

    // Build and execute query
    const results = await db.select()
      .from(moodEntriesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(moodEntriesTable.date))
      .execute();

    // Convert the results to match the MoodEntry schema
    // Note: No numeric conversions needed for this table as all fields are already in correct types
    return results.map(entry => ({
      ...entry,
      // Convert date string to Date object for consistency with schema
      date: new Date(entry.date),
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));
  } catch (error) {
    console.error('Failed to get mood entries:', error);
    throw error;
  }
};