import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { MoodEntry } from '../../../server/src/schema';

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', color: 'bg-green-500' },
  { emoji: '😢', label: 'Sad', color: 'bg-blue-500' },
  { emoji: '😡', label: 'Angry', color: 'bg-red-500' },
  { emoji: '🤩', label: 'Excited', color: 'bg-yellow-500' },
  { emoji: '😐', label: 'Neutral', color: 'bg-gray-500' }
] as const;

interface MoodStatsProps {
  entries: MoodEntry[];
  compact?: boolean;
}

export function MoodStats({ entries, compact = false }: MoodStatsProps) {
  // Calculate mood distribution
  const moodCounts = entries.reduce((acc: Record<string, number>, entry: MoodEntry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const totalEntries = entries.length;
  
  // Get mood percentages
  const moodStats = MOOD_OPTIONS.map(mood => ({
    ...mood,
    count: moodCounts[mood.emoji] || 0,
    percentage: totalEntries > 0 ? (moodCounts[mood.emoji] || 0) / totalEntries * 100 : 0
  }));

  // Find most common mood
  const mostCommonMood = moodStats.reduce((prev, current) => 
    prev.count > current.count ? prev : current
  );

  // Calculate streak (consecutive days with entries)
  const sortedEntries = [...entries].sort((a: MoodEntry, b: MoodEntry) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].date);
    entryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (entryDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate this week's entries
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const thisWeekEntries = entries.filter((entry: MoodEntry) => 
    new Date(entry.date) >= oneWeekAgo
  );

  // Get recent mood trend (last 7 days vs previous 7 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const previousWeekEntries = entries.filter((entry: MoodEntry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= twoWeeksAgo && entryDate < oneWeekAgo;
  });

  // Calculate average "mood score" (Happy=5, Excited=4, Neutral=3, Sad=2, Angry=1)
  const moodScores: Record<string, number> = {
    '😊': 5, // Happy
    '🤩': 4, // Excited  
    '😐': 3, // Neutral
    '😢': 2, // Sad
    '😡': 1  // Angry
  };

  const getAverageMoodScore = (entriesArray: MoodEntry[]) => {
    if (entriesArray.length === 0) return 0;
    const totalScore = entriesArray.reduce((sum: number, entry: MoodEntry) => 
      sum + (moodScores[entry.mood] || 3), 0
    );
    return totalScore / entriesArray.length;
  };

  const thisWeekAverage = getAverageMoodScore(thisWeekEntries);
  const previousWeekAverage = getAverageMoodScore(previousWeekEntries);
  const trendDirection = thisWeekAverage > previousWeekAverage ? 'up' : 
                        thisWeekAverage < previousWeekAverage ? 'down' : 'stable';

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">No data to analyze yet</h3>
        <p className="text-gray-500">
          Start tracking your moods to see insights about your emotional patterns!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalEntries}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl">{mostCommonMood.emoji}</div>
          <div className="text-sm text-gray-600">Most Common</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{thisWeekEntries.length}/7</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-600">{totalEntries}</CardTitle>
            <CardDescription>Total Entries</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center p-4">
          <CardHeader className="pb-2">
            <div className="text-4xl mb-1">{mostCommonMood.emoji}</div>
            <CardTitle className="text-sm">{mostCommonMood.label}</CardTitle>
            <CardDescription>Most Common Mood</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{currentStreak}</CardTitle>
            <CardDescription>
              Day{currentStreak !== 1 ? 's' : ''} Streak 🔥
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">{thisWeekEntries.length}/7</CardTitle>
            <CardDescription>This Week's Progress</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Mood Distribution
          </CardTitle>
          <CardDescription>
            How often you experience each mood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moodStats
              .filter(mood => mood.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(mood => (
                <div key={mood.emoji} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="font-medium">{mood.label}</span>
                    </div>
                    <Badge variant="outline">
                      {mood.count} ({mood.percentage.toFixed(1)}%)
                    </Badge>
                  </div>
                  <Progress value={mood.percentage} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      {previousWeekEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Weekly Trend
            </CardTitle>
            <CardDescription>
              Comparing this week to last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">Previous Week</div>
                <div className="text-2xl font-bold">
                  {previousWeekAverage.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {previousWeekEntries.length} entries
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                {trendDirection === 'up' && (
                  <div className="text-green-500">
                    <div className="text-2xl">📈</div>
                    <div className="text-sm font-medium">Improving</div>
                  </div>
                )}
                {trendDirection === 'down' && (
                  <div className="text-orange-500">
                    <div className="text-2xl">📉</div>
                    <div className="text-sm font-medium">Declining</div>
                  </div>
                )}
                {trendDirection === 'stable' && (
                  <div className="text-blue-500">
                    <div className="text-2xl">➡️</div>
                    <div className="text-sm font-medium">Stable</div>
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">This Week</div>
                <div className="text-2xl font-bold">
                  {thisWeekAverage.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  {thisWeekEntries.length} entries
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {currentStreak > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-green-500">🎉</span>
                <span>
                  Amazing! You're on a {currentStreak}-day tracking streak. 
                  Keep it up!
                </span>
              </div>
            )}
            
            {mostCommonMood.count > 1 && (
              <div className="flex items-start gap-2">
                <span>{mostCommonMood.emoji}</span>
                <span>
                  Your most frequent mood is {mostCommonMood.label} 
                  ({mostCommonMood.percentage.toFixed(1)}% of the time).
                </span>
              </div>
            )}
            
            {thisWeekEntries.length >= 5 && (
              <div className="flex items-start gap-2">
                <span className="text-blue-500">⭐</span>
                <span>
                  Great job tracking {thisWeekEntries.length} days this week! 
                  Consistency is key to understanding your patterns.
                </span>
              </div>
            )}
            
            {trendDirection === 'up' && previousWeekEntries.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-green-500">📈</span>
                <span>
                  Your mood trend is improving compared to last week. 
                  Whatever you're doing, it's working!
                </span>
              </div>
            )}
            
            {totalEntries >= 30 && (
              <div className="flex items-start gap-2">
                <span className="text-purple-500">🏆</span>
                <span>
                  Incredible dedication! You've tracked {totalEntries} days. 
                  You now have enough data to see meaningful patterns.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}