import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createMoodEntryInputSchema,
  updateMoodEntryInputSchema,
  getMoodEntriesInputSchema,
  getMoodEntryByDateInputSchema,
  deleteMoodEntryInputSchema
} from './schema';

// Import handlers
import { createMoodEntry } from './handlers/create_mood_entry';
import { getMoodEntries } from './handlers/get_mood_entries';
import { getMoodEntryByDate } from './handlers/get_mood_entry_by_date';
import { updateMoodEntry } from './handlers/update_mood_entry';
import { deleteMoodEntry } from './handlers/delete_mood_entry';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new mood entry for a specific date
  createMoodEntry: publicProcedure
    .input(createMoodEntryInputSchema)
    .mutation(({ input }) => createMoodEntry(input)),
  
  // Get all mood entries for a user, optionally filtered by date range
  getMoodEntries: publicProcedure
    .input(getMoodEntriesInputSchema)
    .query(({ input }) => getMoodEntries(input)),
  
  // Get a specific mood entry by user and date
  getMoodEntryByDate: publicProcedure
    .input(getMoodEntryByDateInputSchema)
    .query(({ input }) => getMoodEntryByDate(input)),
  
  // Update an existing mood entry
  updateMoodEntry: publicProcedure
    .input(updateMoodEntryInputSchema)
    .mutation(({ input }) => updateMoodEntry(input)),
  
  // Delete a mood entry
  deleteMoodEntry: publicProcedure
    .input(deleteMoodEntryInputSchema)
    .mutation(({ input }) => deleteMoodEntry(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();