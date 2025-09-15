import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DeleteMoodEntryInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMoodEntry = async (input: DeleteMoodEntryInput): Promise<{ success: boolean }> => {
  try {
    // Delete the mood entry by ID
    const result = await db.delete(moodEntriesTable)
      .where(eq(moodEntriesTable.id, input.id))
      .returning()
      .execute();

    // Check if any row was actually deleted
    if (result.length === 0) {
      throw new Error(`Mood entry with ID ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Mood entry deletion failed:', error);
    throw error;
  }
};