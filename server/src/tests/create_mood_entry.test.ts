import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moodEntriesTable } from '../db/schema';
import { type CreateMoodEntryInput } from '../schema';
import { createMoodEntry } from '../handlers/create_mood_entry';
import { eq, and } from 'drizzle-orm';

// Test input for creating mood entries
const testInput: CreateMoodEntryInput = {
  user_id: 'user123',
  date: '2024-01-15',
  mood: '😊',
  note: 'Feeling great today!'
};

describe('createMoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new mood entry', async () => {
    const result = await createMoodEntry(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.mood).toEqual('😊');
    expect(result.note).toEqual('Feeling great today!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save mood entry to database', async () => {
    const result = await createMoodEntry(testInput);

    const savedEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.id, result.id))
      .execute();

    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0].user_id).toEqual('user123');
    expect(savedEntries[0].date).toEqual('2024-01-15');
    expect(savedEntries[0].mood).toEqual('😊');
    expect(savedEntries[0].note).toEqual('Feeling great today!');
    expect(savedEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should create mood entry with null note', async () => {
    const inputWithoutNote: CreateMoodEntryInput = {
      user_id: 'user123',
      date: '2024-01-15',
      mood: '😢'
    };

    const result = await createMoodEntry(inputWithoutNote);

    expect(result.note).toBeNull();
    expect(result.mood).toEqual('😢');
  });

  it('should create mood entry with explicit null note', async () => {
    const inputWithNullNote: CreateMoodEntryInput = {
      user_id: 'user123',
      date: '2024-01-15',
      mood: '😐',
      note: null
    };

    const result = await createMoodEntry(inputWithNullNote);

    expect(result.note).toBeNull();
    expect(result.mood).toEqual('😐');
  });

  it('should update existing mood entry for same user and date', async () => {
    // Create initial entry
    await createMoodEntry(testInput);

    // Create another entry for same user and date
    const updateInput: CreateMoodEntryInput = {
      user_id: 'user123',
      date: '2024-01-15',
      mood: '😡',
      note: 'Changed my mind!'
    };

    const result = await createMoodEntry(updateInput);

    // Verify only one entry exists
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .where(and(
        eq(moodEntriesTable.user_id, 'user123'),
        eq(moodEntriesTable.date, '2024-01-15')
      ))
      .execute();

    expect(allEntries).toHaveLength(1);
    expect(allEntries[0].mood).toEqual('😡');
    expect(allEntries[0].note).toEqual('Changed my mind!');
    expect(result.mood).toEqual('😡');
    expect(result.note).toEqual('Changed my mind!');
  });

  it('should allow different users to have mood entries on same date', async () => {
    // Create entry for first user
    await createMoodEntry(testInput);

    // Create entry for second user on same date
    const secondUserInput: CreateMoodEntryInput = {
      user_id: 'user456',
      date: '2024-01-15',
      mood: '😢',
      note: 'Different user feeling'
    };

    const result = await createMoodEntry(secondUserInput);

    // Verify both entries exist
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.date, '2024-01-15'))
      .execute();

    expect(allEntries).toHaveLength(2);
    
    const userIds = allEntries.map(entry => entry.user_id).sort();
    expect(userIds).toEqual(['user123', 'user456']);
    
    expect(result.user_id).toEqual('user456');
    expect(result.mood).toEqual('😢');
  });

  it('should allow same user to have mood entries on different dates', async () => {
    // Create entry for first date
    await createMoodEntry(testInput);

    // Create entry for second date
    const secondDateInput: CreateMoodEntryInput = {
      user_id: 'user123',
      date: '2024-01-16',
      mood: '🤩',
      note: 'Another day!'
    };

    const result = await createMoodEntry(secondDateInput);

    // Verify both entries exist
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .where(eq(moodEntriesTable.user_id, 'user123'))
      .execute();

    expect(allEntries).toHaveLength(2);
    
    const dates = allEntries.map(entry => entry.date).sort();
    expect(dates).toEqual(['2024-01-15', '2024-01-16']);
    
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-01-16');
    expect(result.mood).toEqual('🤩');
  });

  it('should reject future dates', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    const futureInput: CreateMoodEntryInput = {
      user_id: 'user123',
      date: tomorrowString,
      mood: '😊',
      note: 'Future mood'
    };

    expect(createMoodEntry(futureInput)).rejects.toThrow(/cannot create mood entry for future date/i);
  });

  it('should accept today\'s date', async () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const todayInput: CreateMoodEntryInput = {
      user_id: 'user123',
      date: todayString,
      mood: '😊',
      note: 'Today\'s mood'
    };

    const result = await createMoodEntry(todayInput);
    
    expect(result.date.toISOString().split('T')[0]).toEqual(todayString);
    expect(result.mood).toEqual('😊');
  });

  it('should handle all mood types', async () => {
    const moodTypes = ['😊', '😢', '😡', '🤩', '😐'] as const;
    const results = [];

    for (let i = 0; i < moodTypes.length; i++) {
      const input: CreateMoodEntryInput = {
        user_id: `user${i}`,
        date: `2024-01-${15 + i}`,
        mood: moodTypes[i],
        note: `Mood ${i + 1}`
      };

      const result = await createMoodEntry(input);
      results.push(result);
    }

    // Verify all mood types were saved correctly
    const allEntries = await db.select()
      .from(moodEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(5);
    
    const savedMoods = allEntries.map(entry => entry.mood).sort();
    const expectedMoods = [...moodTypes].sort();
    expect(savedMoods).toEqual(expectedMoods);
  });

  it('should update timestamps correctly when replacing entry', async () => {
    // Create initial entry
    const initialResult = await createMoodEntry(testInput);
    const initialCreatedAt = initialResult.created_at;
    const initialUpdatedAt = initialResult.updated_at;

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the entry
    const updateInput: CreateMoodEntryInput = {
      user_id: 'user123',
      date: '2024-01-15',
      mood: '😡',
      note: 'Updated mood'
    };

    const updatedResult = await createMoodEntry(updateInput);

    // Verify timestamps
    expect(updatedResult.created_at).toEqual(initialCreatedAt); // Should remain the same
    expect(updatedResult.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime()); // Should be newer
    expect(updatedResult.mood).toEqual('😡');
    expect(updatedResult.note).toEqual('Updated mood');
  });
});