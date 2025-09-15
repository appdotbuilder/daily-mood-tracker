import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput, type MoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMoodEntry = async (input: UpdateMoodEntryInput): Promise<MoodEntry> => {
  try {
    // First, check if the mood entry exists
    const existingEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, input.id))
      .execute();

    if (existingEntry.length === 0) {
      throw new Error(`Mood entry with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof moodEntriesTable.$inferInsert> = {
      updated_at: new Date(), // Always update the timestamp
    };

    if (input.mood !== undefined) {
      updateData.mood = input.mood;
    }

    if (input.note !== undefined) {
      updateData.note = input.note;
    }

    // Update the mood entry
    const result = await db.update(moodEntriesTable)
      .set(updateData)
      .where(eq(moodEntriesTable.id, input.id))
      .returning()
      .execute();

    // Convert date string to Date object to match schema expectation
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      date: new Date(updatedEntry.date)
    };
  } catch (error) {
    console.error('Mood entry update failed:', error);
    throw error;
  }
};