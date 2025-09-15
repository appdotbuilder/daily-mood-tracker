import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput, type MoodEntry } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createMoodEntry = async (input: CreateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // Validate that the date is not in the future
    const inputDate = new Date(input.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (inputDate > today) {
      throw new Error('Cannot create mood entry for future date');
    }

    // Check if a mood entry already exists for this user and date
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(and(
        eq(moodEntriesTable.user_id, input.user_id),
        eq(moodEntriesTable.date, input.date)
      ))
      .limit(1)
      .execute();

    if (existingEntry.length > 0) {
      // Update existing entry (replace if exists)
      const result = await db.update(moodEntriesTable)
        .set({
          mood: input.mood,
          note: input.note || null,
          updated_at: new Date()
        })
        .where(eq(moodEntriesTable.id, existingEntry[0].id))
        .returning()
        .execute();

      return {
        ...result[0],
        date: new Date(result[0].date), // Convert date string to Date object
        created_at: new Date(result[0].created_at),
        updated_at: new Date(result[0].updated_at)
      };
    } else {
      // Create new entry
      const result = await db.insert(moodEntriesTable)
        .values({
          user_id: input.user_id,
          date: input.date, // Date column expects string in YYYY-MM-DD format
          mood: input.mood,
          note: input.note || null
        })
        .returning()
        .execute();

      return {
        ...result[0],
        date: new Date(result[0].date), // Convert date string to Date object
        created_at: new Date(result[0].created_at),
        updated_at: new Date(result[0].updated_at)
      };
    }
  } catch (error) {
    console.error('Mood entry creation failed:', error);
    throw error;
  }
};