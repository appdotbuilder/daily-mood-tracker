import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type UpdateMoodEntryInput, type MoodEntry } from '../schema';
import { updateMoodEntry } from '../handlers/update_mood_entry';
import { eq } from 'drizzle-orm';

describe('updateMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMoodEntry: MoodEntry;

  beforeEach(async () => {
    // Create a test mood entry to update
    const result = await db.insert(moodEntriesTable)
      .values({
        user_id: 'test-user-123',
        date: '2024-01-15',
        mood: '😊',
        note: 'Initial test note',
      })
      .returning()
      .execute();

    // Convert date string to Date object to match schema expectation
    const rawEntry = result[0];
    testMoodEntry = {
      ...rawEntry,
      date: new Date(rawEntry.date)
    };
  });

  it('should update mood only', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      mood: '😢'
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.mood).toEqual('😢');
    expect(result.note).toEqual('Initial test note'); // Should remain unchanged
    expect(result.user_id).toEqual(testMoodEntry.user_id);
    expect(result.date).toEqual(testMoodEntry.date);
    expect(result.created_at).toEqual(testMoodEntry.created_at);
    expect(result.updated_at).not.toEqual(testMoodEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update note only', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      note: 'Updated note content'
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.mood).toEqual('😊'); // Should remain unchanged
    expect(result.note).toEqual('Updated note content');
    expect(result.user_id).toEqual(testMoodEntry.user_id);
    expect(result.date).toEqual(testMoodEntry.date);
    expect(result.created_at).toEqual(testMoodEntry.created_at);
    expect(result.updated_at).not.toEqual(testMoodEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both mood and note', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      mood: '🤩',
      note: 'Feeling amazing today!'
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.mood).toEqual('🤩');
    expect(result.note).toEqual('Feeling amazing today!');
    expect(result.user_id).toEqual(testMoodEntry.user_id);
    expect(result.date).toEqual(testMoodEntry.date);
    expect(result.created_at).toEqual(testMoodEntry.created_at);
    expect(result.updated_at).not.toEqual(testMoodEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set note to null when provided', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      note: null
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.mood).toEqual('😊'); // Should remain unchanged
    expect(result.note).toBeNull();
    expect(result.user_id).toEqual(testMoodEntry.user_id);
    expect(result.date).toEqual(testMoodEntry.date);
    expect(result.created_at).toEqual(testMoodEntry.created_at);
    expect(result.updated_at).not.toEqual(testMoodEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      mood: '😡',
      note: 'Database verification test'
    };

    await updateMoodEntry(updateInput);

    // Verify changes were saved to database
    const savedEntry = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, testMoodEntry.id))
      .execute();

    expect(savedEntry).toHaveLength(1);
    expect(savedEntry[0].mood).toEqual('😡');
    expect(savedEntry[0].note).toEqual('Database verification test');
    expect(savedEntry[0].updated_at).not.toEqual(testMoodEntry.updated_at);
    expect(savedEntry[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update only updated_at when no fields provided', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id
    };

    const result = await updateMoodEntry(updateInput);

    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.mood).toEqual(testMoodEntry.mood); // Should remain unchanged
    expect(result.note).toEqual(testMoodEntry.note); // Should remain unchanged
    expect(result.user_id).toEqual(testMoodEntry.user_id);
    expect(result.date).toEqual(testMoodEntry.date);
    expect(result.created_at).toEqual(testMoodEntry.created_at);
    expect(result.updated_at).not.toEqual(testMoodEntry.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when mood entry does not exist', async () => {
    const updateInput: UpdateMoodEntryInput = {
      id: 99999, // Non-existent ID
      mood: '😊'
    };

    await expect(updateMoodEntry(updateInput)).rejects.toThrow(/mood entry with id 99999 not found/i);
  });

  it('should handle all mood enum values', async () => {
    const moods = ['😊', '😢', '😡', '🤩', '😐'] as const;
    
    for (const mood of moods) {
      const updateInput: UpdateMoodEntryInput = {
        id: testMoodEntry.id,
        mood: mood
      };

      const result = await updateMoodEntry(updateInput);
      expect(result.mood).toEqual(mood);
    }
  });

  it('should preserve original timestamps and identifiers', async () => {
    const originalCreatedAt = testMoodEntry.created_at;
    const originalUserId = testMoodEntry.user_id;
    const originalDate = testMoodEntry.date;

    const updateInput: UpdateMoodEntryInput = {
      id: testMoodEntry.id,
      mood: '🤩'
    };

    const result = await updateMoodEntry(updateInput);

    // These fields should never change during an update
    expect(result.id).toEqual(testMoodEntry.id);
    expect(result.user_id).toEqual(originalUserId);
    expect(result.date).toEqual(originalDate);
    expect(result.created_at).toEqual(originalCreatedAt);
  });
});