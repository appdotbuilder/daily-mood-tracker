import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type DeleteMoodEntryInput } from '../schema';
import { deleteMoodEntry } from '../handlers/delete_mood_entry';
import { eq } from 'drizzle-orm';

describe('deleteMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a mood entry successfully', async () => {
    // Create a test mood entry first
    const insertResult = await db.insert(moodEntriesTable)
      .values({
        user_id: 'test-user-1',
        date: '2024-01-15',
        mood: '😊',
        note: 'Feeling great today!'
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    
    const deleteInput: DeleteMoodEntryInput = {
      id: createdEntry.id
    };

    // Delete the mood entry
    const result = await deleteMoodEntry(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the entry no longer exists in the database
    const remainingEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent mood entry', async () => {
    const deleteInput: DeleteMoodEntryInput = {
      id: 999999 // Non-existent ID
    };

    // Attempt to delete non-existent entry should throw error
    await expect(deleteMoodEntry(deleteInput)).rejects.toThrow(/not found/i);
  });

  it('should delete correct mood entry when multiple exist', async () => {
    // Create multiple test mood entries
    const insertResult = await db.insert(moodEntriesTable)
      .values([
        {
          user_id: 'test-user-1',
          date: '2024-01-15',
          mood: '😊',
          note: 'Entry 1'
        },
        {
          user_id: 'test-user-1',
          date: '2024-01-16',
          mood: '😢',
          note: 'Entry 2'
        },
        {
          user_id: 'test-user-2',
          date: '2024-01-15',
          mood: '😡',
          note: 'Entry 3'
        }
      ])
      .returning()
      .execute();

    const entryToDelete = insertResult[1]; // Delete the middle entry
    
    const deleteInput: DeleteMoodEntryInput = {
      id: entryToDelete.id
    };

    // Delete the specific mood entry
    const result = await deleteMoodEntry(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the correct entry was deleted
    const deletedEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, entryToDelete.id))
      .execute();

    expect(deletedEntry).toHaveLength(0);

    // Verify other entries still exist
    const remainingEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(remainingEntries).toHaveLength(2);
    expect(remainingEntries.find(e => e.id === insertResult[0].id)).toBeDefined();
    expect(remainingEntries.find(e => e.id === insertResult[2].id)).toBeDefined();
  });

  it('should delete entry with null note', async () => {
    // Create a test mood entry with null note
    const insertResult = await db.insert(moodEntriesTable)
      .values({
        user_id: 'test-user-1',
        date: '2024-01-15',
        mood: '😐',
        note: null
      })
      .returning()
      .execute();

    const createdEntry = insertResult[0];
    
    const deleteInput: DeleteMoodEntryInput = {
      id: createdEntry.id
    };

    // Delete the mood entry with null note
    const result = await deleteMoodEntry(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the entry no longer exists
    const remainingEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, createdEntry.id))
      .execute();

    expect(remainingEntries).toHaveLength(0);
  });

  it('should handle deletion of entry with different mood types', async () => {
    // Test deletion with each mood type
    const moods = ['😊', '😢', '😡', '🤩', '😐'] as const;
    const createdEntries = [];

    // Create entries with different moods
    for (let i = 0; i < moods.length; i++) {
      const insertResult = await db.insert(moodEntriesTable)
        .values({
          user_id: 'test-user-1',
          date: `2024-01-${String(i + 10).padStart(2, '0')}`,
          mood: moods[i],
          note: `Test mood ${moods[i]}`
        })
        .returning()
        .execute();
      
      createdEntries.push(insertResult[0]);
    }

    // Delete the third entry (😡)
    const deleteInput: DeleteMoodEntryInput = {
      id: createdEntries[2].id
    };

    const result = await deleteMoodEntry(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify correct entry was deleted
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(4);
    expect(allEntries.find(e => e.mood === '😡')).toBeUndefined();
    expect(allEntries.find(e => e.mood === '😊')).toBeDefined();
    expect(allEntries.find(e => e.mood === '😢')).toBeDefined();
    expect(allEntries.find(e => e.mood === '🤩')).toBeDefined();
    expect(allEntries.find(e => e.mood === '😐')).toBeDefined();
  });
});