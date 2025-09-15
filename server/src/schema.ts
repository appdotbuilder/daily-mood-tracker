import { z } from 'zod';

// Mood enum with common emoji representations
export const moodEnum = z.enum(['😊', '😢', '😡', '🤩', '😐']);

// Mood entry schema for database records
export const moodEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(), // For future user management
  date: z.coerce.date(), // The specific date for this mood entry
  mood: moodEnum,
  note: z.string().nullable(), // Optional note about the mood
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MoodEntry = z.infer<typeof moodEntrySchema>;

// Input schema for creating mood entries
export const createMoodEntryInputSchema = z.object({
  user_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"), // Date in YYYY-MM-DD format
  mood: moodEnum,
  note: z.string().nullable().optional() // Can be null or undefined
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntryInputSchema>;

// Input schema for updating mood entries
export const updateMoodEntryInputSchema = z.object({
  id: z.number(),
  mood: moodEnum.optional(),
  note: z.string().nullable().optional() // Can be updated to null or undefined
});

export type UpdateMoodEntryInput = z.infer<typeof updateMoodEntryInputSchema>;

// Input schema for getting mood entries
export const getMoodEntriesInputSchema = z.object({
  user_id: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional()
});

export type GetMoodEntriesInput = z.infer<typeof getMoodEntriesInputSchema>;

// Input schema for getting mood entry by date
export const getMoodEntryByDateInputSchema = z.object({
  user_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type GetMoodEntryByDateInput = z.infer<typeof getMoodEntryByDateInputSchema>;

// Input schema for deleting mood entries
export const deleteMoodEntryInputSchema = z.object({
  id: z.number()
});

export type DeleteMoodEntryInput = z.infer<typeof deleteMoodEntryInputSchema>;