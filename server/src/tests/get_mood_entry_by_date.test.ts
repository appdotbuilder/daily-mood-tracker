import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type GetMoodEntryByDateInput } from '../schema';
import { getMoodEntryByDate } from '../handlers/get_mood_entry_by_date';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: GetMoodEntryByDateInput = {
  user_id: 'user123',
  date: '2024-01-15'
};

const testMoodEntry = {
  user_id: 'user123',
  date: '2024-01-15',
  mood: '😊' as const,
  note: 'Great day today!'
};

describe('getMoodEntryByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return mood entry for existing date', async () => {
    // Create a test mood entry first
    await db.insert(moodEntriesTable)
      .values(testMoodEntry)
      .execute();

    const result = await getMoodEntryByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual('user123');
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.mood).toEqual('😊');
    expect(result!.note).toEqual('Great day today!');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existing date', async () => {
    const nonExistingInput: GetMoodEntryByDateInput = {
      user_id: 'user123',
      date: '2024-01-16'
    };

    const result = await getMoodEntryByDate(nonExistingInput);

    expect(result).toBeNull();
  });

  it('should return null for different user with same date', async () => {
    // Create mood entry for user123
    await db.insert(moodEntriesTable)
      .values(testMoodEntry)
      .execute();

    // Query with different user_id but same date
    const differentUserInput: GetMoodEntryByDateInput = {
      user_id: 'user456',
      date: '2024-01-15'
    };

    const result = await getMoodEntryByDate(differentUserInput);

    expect(result).toBeNull();
  });

  it('should return correct entry when multiple entries exist for different dates', async () => {
    // Create multiple mood entries for same user on different dates
    await db.insert(moodEntriesTable)
      .values([
        {
          user_id: 'user123',
          date: '2024-01-14',
          mood: '😢',
          note: 'Bad day'
        },
        testMoodEntry,
        {
          user_id: 'user123',
          date: '2024-01-16',
          mood: '😡',
          note: 'Angry day'
        }
      ])
      .execute();

    const result = await getMoodEntryByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.mood).toEqual('😊');
    expect(result!.note).toEqual('Great day today!');
  });

  it('should handle mood entry with null note', async () => {
    // Create mood entry without note
    await db.insert(moodEntriesTable)
      .values({
        user_id: 'user123',
        date: '2024-01-15',
        mood: '😐',
        note: null
      })
      .execute();

    const result = await getMoodEntryByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.mood).toEqual('😐');
    expect(result!.note).toBeNull();
  });

  it('should return only one entry when exactly one exists', async () => {
    // Create the test mood entry
    await db.insert(moodEntriesTable)
      .values(testMoodEntry)
      .execute();

    // Also verify by direct database query
    const directResults = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.user_id, 'user123'))
      .execute();

    expect(directResults).toHaveLength(1);

    const result = await getMoodEntryByDate(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(directResults[0].id);
  });
});