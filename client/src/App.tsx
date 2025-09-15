import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ListIcon, TrendingUpIcon } from 'lucide-react';
import { MoodEntryForm } from '@/components/MoodEntryForm';
import { MoodHistory } from '@/components/MoodHistory';
import { MoodStats } from '@/components/MoodStats';
import type { MoodEntry } from '../../server/src/schema';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fixed user ID for demo purposes
  const userId = 'demo-user';

  // Load mood entries for the current user
  const loadMoodEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await trpc.getMoodEntries.query({ user_id: userId });
      setMoodEntries(entries);
    } catch (error) {
      console.error('Failed to load mood entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load mood entry for selected date
  const loadSelectedEntry = useCallback(async (date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      const entry = await trpc.getMoodEntryByDate.query({ 
        user_id: userId, 
        date: dateString 
      });
      setSelectedEntry(entry);
    } catch (error) {
      console.error('Failed to load mood entry for date:', error);
      setSelectedEntry(null);
    }
  }, [userId]);

  useEffect(() => {
    loadMoodEntries();
  }, [loadMoodEntries]);

  useEffect(() => {
    loadSelectedEntry(selectedDate);
  }, [selectedDate, loadSelectedEntry]);

  // Handle mood entry creation/update
  const handleMoodSaved = useCallback(() => {
    loadMoodEntries();
    loadSelectedEntry(selectedDate);
  }, [loadMoodEntries, loadSelectedEntry, selectedDate]);

  // Handle mood entry deletion
  const handleMoodDeleted = useCallback(() => {
    loadMoodEntries();
    setSelectedEntry(null);
  }, [loadMoodEntries]);

  // Get mood entries that have moods set for calendar highlighting
  const moodDates = moodEntries.reduce((acc: Record<string, string>, entry: MoodEntry) => {
    const dateKey = entry.date.toISOString().split('T')[0];
    acc[dateKey] = entry.mood;
    return acc;
  }, {});

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌟 Daily Mood Tracker 🌟
          </h1>
          <p className="text-gray-600 text-lg">
            Track your emotions, understand your patterns, and celebrate your journey! ✨
          </p>
        </div>

        <Tabs defaultValue="calendar" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <ListIcon className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card className="border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
                  <CardTitle className="flex items-center gap-2">
                    📅 Select a Day
                  </CardTitle>
                  <CardDescription>
                    Click on any date to view or add your mood
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => {
                      if (date) setSelectedDate(date);
                    }}
                    className="rounded-md border"
                    modifiers={{
                      hasMood: (date: Date) => {
                        const dateKey = date.toISOString().split('T')[0];
                        return !!moodDates[dateKey];
                      },
                      future: isFuture
                    }}
                    modifiersStyles={{
                      hasMood: { 
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        fontWeight: 'bold',
                        position: 'relative'
                      },
                      future: {
                        color: '#d1d5db',
                        cursor: 'not-allowed'
                      }
                    }}
                    disabled={isFuture}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded bg-blue-200"></div>
                      <span>Days with mood entries</span>
                    </div>
                    <p>💡 Future dates are disabled</p>
                  </div>
                </CardContent>
              </Card>

              {/* Mood Entry Form */}
              <Card className="border-2 border-pink-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100">
                  <CardTitle className="flex items-center gap-2">
                    {isToday(selectedDate) ? '💝' : '📝'} 
                    {isToday(selectedDate) ? "Today's Mood" : formatDate(selectedDate)}
                  </CardTitle>
                  <CardDescription>
                    {isToday(selectedDate) 
                      ? "How are you feeling right now?"
                      : `Record how you felt on ${selectedDate.toLocaleDateString()}`
                    }
                  </CardDescription>
                  {selectedEntry && (
                    <Badge variant="secondary" className="w-fit">
                      {selectedEntry.mood} Previously recorded
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {!isFuture(selectedDate) ? (
                    <MoodEntryForm
                      userId={userId}
                      date={selectedDate}
                      existingEntry={selectedEntry}
                      onSaved={handleMoodSaved}
                      onDeleted={handleMoodDeleted}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-lg">🔮</p>
                      <p>Can't predict the future!</p>
                      <p className="text-sm">Select a past or current date to record your mood.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-blue-100">
                <CardTitle className="flex items-center gap-2">
                  📊 Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <MoodStats entries={moodEntries} compact />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History View */}
          <TabsContent value="history">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
                <CardTitle className="flex items-center gap-2">
                  📚 Mood History
                </CardTitle>
                <CardDescription>
                  Your emotional journey over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-4xl mb-4">🔄</div>
                    <p>Loading your mood history...</p>
                  </div>
                ) : (
                  <MoodHistory 
                    entries={moodEntries} 
                    onEntryUpdated={handleMoodSaved}
                    onEntryDeleted={handleMoodDeleted}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats View */}
          <TabsContent value="stats">
            <Card className="border-2 border-yellow-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100">
                <CardTitle className="flex items-center gap-2">
                  📈 Mood Insights
                </CardTitle>
                <CardDescription>
                  Discover patterns in your emotional wellbeing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <MoodStats entries={moodEntries} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;