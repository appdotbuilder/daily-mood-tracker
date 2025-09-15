import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EditIcon, Trash2Icon, SaveIcon, XIcon, SearchIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MoodEntry, UpdateMoodEntryInput } from '../../../server/src/schema';

// Available mood options
const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '🤩', label: 'Excited' },
  { emoji: '😐', label: 'Neutral' }
] as const;

interface MoodHistoryProps {
  entries: MoodEntry[];
  onEntryUpdated: () => void;
  onEntryDeleted: () => void;
}

export function MoodHistory({ entries, onEntryUpdated, onEntryDeleted }: MoodHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMood, setEditMood] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter entries based on search term
  const filteredEntries = entries.filter((entry: MoodEntry) => {
    const searchLower = searchTerm.toLowerCase();
    const moodLabel = MOOD_OPTIONS.find(m => m.emoji === entry.mood)?.label.toLowerCase() || '';
    const note = (entry.note || '').toLowerCase();
    const date = entry.date.toLocaleDateString().toLowerCase();
    
    return moodLabel.includes(searchLower) || 
           note.includes(searchLower) || 
           date.includes(searchLower);
  });

  // Sort entries by date (most recent first)
  const sortedEntries = [...filteredEntries].sort((a: MoodEntry, b: MoodEntry) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const startEdit = (entry: MoodEntry) => {
    setEditingId(entry.id);
    setEditMood(entry.mood);
    setEditNote(entry.note || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMood('');
    setEditNote('');
  };

  const saveEdit = async (entryId: number) => {
    if (!editMood) return;

    setIsLoading(true);
    try {
      const updateData: UpdateMoodEntryInput = {
        id: entryId,
        mood: editMood as '😊' | '😢' | '😡' | '🤩' | '😐',
        note: editNote.trim() || null
      };
      
      await trpc.updateMoodEntry.mutate(updateData);
      setEditingId(null);
      onEntryUpdated();
    } catch (error) {
      console.error('Failed to update mood entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteMoodEntry.mutate({ id: entryId });
      onEntryDeleted();
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const getDaysAgo = (date: Date) => {
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '';
    if (diffDays === 1) return '(1 day ago)';
    return `(${diffDays} days ago)`;
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📖</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No mood entries yet</h3>
        <p className="text-gray-500 mb-6">
          Start tracking your daily moods to see your emotional journey unfold!
        </p>
        <div className="text-4xl">🌱</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by mood, note, or date..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
        <span>
          📊 Showing {filteredEntries.length} of {entries.length} entries
        </span>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear search
          </Button>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-2xl mb-2">🔍</p>
            <p>No entries match your search</p>
            <p className="text-sm">Try different keywords or clear the search</p>
          </div>
        ) : (
          sortedEntries.map((entry: MoodEntry) => (
            <Card key={entry.id} className="border-l-4 border-l-purple-300 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingId === entry.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{formatDate(entry.date)}</h3>
                        <p className="text-xs text-gray-500">{getDaysAgo(entry.date)}</p>
                      </div>
                    </div>
                    
                    {/* Mood selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Mood</Label>
                      <div className="flex flex-wrap gap-2">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={mood.emoji}
                            type="button"
                            onClick={() => setEditMood(mood.emoji)}
                            className={`p-2 rounded-lg border-2 transition-colors ${
                              editMood === mood.emoji
                                ? 'border-purple-400 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-200'
                            }`}
                          >
                            <span className="text-2xl block">{mood.emoji}</span>
                            <span className="text-xs text-gray-600">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Note editing */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Note</Label>
                      <Textarea
                        value={editNote}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditNote(e.target.value)}
                        placeholder="Add or edit your note..."
                        className="min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 text-right">
                        {editNote.length}/500 characters
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(entry.id)}
                        disabled={!editMood || isLoading}
                        className="flex items-center gap-1"
                      >
                        <SaveIcon className="w-3 h-3" />
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{formatDate(entry.date)}</h3>
                        <p className="text-xs text-gray-500">{getDaysAgo(entry.date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(entry)}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <EditIcon className="w-3 h-3" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2Icon className="w-3 h-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete mood entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your mood entry for {formatDate(entry.date)}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteEntry(entry.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{entry.mood}</span>
                      <div>
                        <Badge variant="secondary" className="mb-1">
                          {MOOD_OPTIONS.find(m => m.emoji === entry.mood)?.label}
                        </Badge>
                        {entry.note && (
                          <p className="text-sm text-gray-700 mt-2">{entry.note}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 border-t pt-2">
                      Created: {entry.created_at.toLocaleDateString()} at {entry.created_at.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {entry.updated_at.getTime() !== entry.created_at.getTime() && (
                        <span> • Updated: {entry.updated_at.toLocaleDateString()} at {entry.updated_at.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}