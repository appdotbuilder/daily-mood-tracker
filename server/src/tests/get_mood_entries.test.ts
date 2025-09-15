import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type GetMoodEntriesInput } from '../schema';
import { getMoodEntries } from '../handlers/get_mood_entries';

describe('getMoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test mood entries
  const createTestMoodEntry = async (user_id: string, date: string, mood: '😊' | '😢' | '😡' | '🤩' | '😐', note?: string | null) => {
    const result = await db.insert(moodEntriesTable)
      .values({
        user_id,
        date,
        mood,
        note: note ?? null
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should get all mood entries for a user when no date range is provided', async () => {
    // Create test data
    await createTestMoodEntry('user1', '2024-01-01', '😊', 'Happy New Year');
    await createTestMoodEntry('user1', '2024-01-02', '😢', 'Sad day');
    await createTestMoodEntry('user1', '2024-01-03', '😐', null);
    // Create entry for different user to ensure filtering works
    await createTestMoodEntry('user2', '2024-01-01', '🤩', 'Different user');

    const input: GetMoodEntriesInput = {
      user_id: 'user1'
    };

    const result = await getMoodEntries(input);

    // Should return 3 entries for user1, ordered by date desc
    expect(result).toHaveLength(3);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date).toEqual(new Date('2024-01-03'));
    expect(result[0].mood).toBe('😐');
    expect(result[0].note).toBeNull();

    expect(result[1].date).toEqual(new Date('2024-01-02'));
    expect(result[1].mood).toBe('😢');
    expect(result[1].note).toBe('Sad day');

    expect(result[2].date).toEqual(new Date('2024-01-01'));
    expect(result[2].mood).toBe('😊');
    expect(result[2].note).toBe('Happy New Year');

    // Verify all entries have required fields
    result.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(entry.user_id).toBe('user1');
      expect(entry.date).toBeInstanceOf(Date);
      expect(['😊', '😢', '😡', '🤩', '😐']).toContain(entry.mood);
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter entries by start_date', async () => {
    // Create test data
    await createTestMoodEntry('user1', '2024-01-01', '😊');
    await createTestMoodEntry('user1', '2024-01-05', '😢');
    await createTestMoodEntry('user1', '2024-01-10', '😡');

    const input: GetMoodEntriesInput = {
      user_id: 'user1',
      start_date: '2024-01-05'
    };

    const result = await getMoodEntries(input);

    // Should return 2 entries (from 2024-01-05 onward)
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[0].mood).toBe('😡');
    expect(result[1].date).toEqual(new Date('2024-01-05'));
    expect(result[1].mood).toBe('😢');
  });

  it('should filter entries by end_date', async () => {
    // Create test data
    await createTestMoodEntry('user1', '2024-01-01', '😊');
    await createTestMoodEntry('user1', '2024-01-05', '😢');
    await createTestMoodEntry('user1', '2024-01-10', '😡');

    const input: GetMoodEntriesInput = {
      user_id: 'user1',
      end_date: '2024-01-05'
    };

    const result = await getMoodEntries(input);

    // Should return 2 entries (up to 2024-01-05)
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-05'));
    expect(result[0].mood).toBe('😢');
    expect(result[1].date).toEqual(new Date('2024-01-01'));
    expect(result[1].mood).toBe('😊');
  });

  it('should filter entries by both start_date and end_date', async () => {
    // Create test data
    await createTestMoodEntry('user1', '2024-01-01', '😊');
    await createTestMoodEntry('user1', '2024-01-05', '😢');
    await createTestMoodEntry('user1', '2024-01-07', '🤩');
    await createTestMoodEntry('user1', '2024-01-10', '😡');

    const input: GetMoodEntriesInput = {
      user_id: 'user1',
      start_date: '2024-01-05',
      end_date: '2024-01-07'
    };

    const result = await getMoodEntries(input);

    // Should return 2 entries (between 2024-01-05 and 2024-01-07 inclusive)
    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(new Date('2024-01-07'));
    expect(result[0].mood).toBe('🤩');
    expect(result[1].date).toEqual(new Date('2024-01-05'));
    expect(result[1].mood).toBe('😢');
  });

  it('should return empty array when no entries match criteria', async () => {
    // Create test data for different user
    await createTestMoodEntry('user2', '2024-01-01', '😊');

    const input: GetMoodEntriesInput = {
      user_id: 'user1' // No entries for this user
    };

    const result = await getMoodEntries(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when date range has no matches', async () => {
    // Create test data
    await createTestMoodEntry('user1', '2024-01-01', '😊');
    await createTestMoodEntry('user1', '2024-01-10', '😢');

    const input: GetMoodEntriesInput = {
      user_id: 'user1',
      start_date: '2024-01-05',
      end_date: '2024-01-07' // No entries in this range
    };

    const result = await getMoodEntries(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle all mood types correctly', async () => {
    // Create entries with all possible mood types
    await createTestMoodEntry('user1', '2024-01-01', '😊');
    await createTestMoodEntry('user1', '2024-01-02', '😢');
    await createTestMoodEntry('user1', '2024-01-03', '😡');
    await createTestMoodEntry('user1', '2024-01-04', '🤩');
    await createTestMoodEntry('user1', '2024-01-05', '😐');

    const input: GetMoodEntriesInput = {
      user_id: 'user1'
    };

    const result = await getMoodEntries(input);

    expect(result).toHaveLength(5);

    const moods = result.map(entry => entry.mood);
    expect(moods).toContain('😊');
    expect(moods).toContain('😢');
    expect(moods).toContain('😡');
    expect(moods).toContain('🤩');
    expect(moods).toContain('😐');
  });

  it('should handle entries with and without notes', async () => {
    // Create entries with different note scenarios
    await createTestMoodEntry('user1', '2024-01-01', '😊', 'Happy note');
    await createTestMoodEntry('user1', '2024-01-02', '😢', null); // Explicit null note

    const input: GetMoodEntriesInput = {
      user_id: 'user1'
    };

    const result = await getMoodEntries(input);

    expect(result).toHaveLength(2);
    expect(result[0].note).toBeNull(); // Most recent entry has no note
    expect(result[1].note).toBe('Happy note');
  });

  it('should maintain correct order (most recent first)', async () => {
    // Create entries in non-chronological order
    await createTestMoodEntry('user1', '2024-01-05', '😊');
    await createTestMoodEntry('user1', '2024-01-01', '😢');
    await createTestMoodEntry('user1', '2024-01-10', '😡');
    await createTestMoodEntry('user1', '2024-01-03', '🤩');

    const input: GetMoodEntriesInput = {
      user_id: 'user1'
    };

    const result = await getMoodEntries(input);

    expect(result).toHaveLength(4);
    
    // Verify chronological order (desc)
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[1].date).toEqual(new Date('2024-01-05'));
    expect(result[2].date).toEqual(new Date('2024-01-03'));
    expect(result[3].date).toEqual(new Date('2024-01-01'));

    // Verify dates are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].date.getTime()).toBeGreaterThanOrEqual(result[i + 1].date.getTime());
    }
  });
});