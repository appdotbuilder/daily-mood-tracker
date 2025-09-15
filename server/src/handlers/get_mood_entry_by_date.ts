import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type GetMoodEntryByDateInput, type MoodEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getMoodEntryByDate = async (input: GetMoodEntryByDateInput): Promise<MoodEntry | null> => {
  try {
    // Query for mood entry by user_id and date
    const results = await db.select()
      .from(moodEntriesTable)
      .where(and(
        eq(moodEntriesTable.user_id, input.user_id),
        eq(moodEntriesTable.date, input.date)
      ))
      .execute();

    // Return the first result or null if no entry found
    if (results.length === 0) {
      return null;
    }

    // Convert date string to Date object for type compatibility
    const entry = results[0];
    return {
      ...entry,
      date: new Date(entry.date)
    };
  } catch (error) {
    console.error('Get mood entry by date failed:', error);
    throw error;
  }
};