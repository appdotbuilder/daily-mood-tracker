import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2Icon, EditIcon, SaveIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MoodEntry, CreateMoodEntryInput, UpdateMoodEntryInput } from '../../../server/src/schema';

// Available mood options with labels
const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', description: 'Feeling good and positive' },
  { emoji: '😢', label: 'Sad', description: 'Feeling down or melancholy' },
  { emoji: '😡', label: 'Angry', description: 'Feeling frustrated or mad' },
  { emoji: '🤩', label: 'Excited', description: 'Feeling thrilled and energetic' },
  { emoji: '😐', label: 'Neutral', description: 'Feeling calm and balanced' }
] as const;

interface MoodEntryFormProps {
  userId: string;
  date: Date;
  existingEntry?: MoodEntry | null;
  onSaved: () => void;
  onDeleted: () => void;
}

export function MoodEntryForm({ 
  userId, 
  date, 
  existingEntry, 
  onSaved, 
  onDeleted 
}: MoodEntryFormProps) {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form with existing entry data
  useEffect(() => {
    if (existingEntry) {
      setSelectedMood(existingEntry.mood);
      setNote(existingEntry.note || '');
      setIsEditing(false);
    } else {
      setSelectedMood('');
      setNote('');
      setIsEditing(true);
    }
  }, [existingEntry]);

  const dateString = date.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    setIsLoading(true);
    try {
      if (existingEntry) {
        // Update existing entry
        const updateData: UpdateMoodEntryInput = {
          id: existingEntry.id,
          mood: selectedMood as '😊' | '😢' | '😡' | '🤩' | '😐',
          note: note.trim() || null
        };
        await trpc.updateMoodEntry.mutate(updateData);
      } else {
        // Create new entry
        const createData: CreateMoodEntryInput = {
          user_id: userId,
          date: dateString,
          mood: selectedMood as '😊' | '😢' | '😡' | '🤩' | '😐',
          note: note.trim() || null
        };
        await trpc.createMoodEntry.mutate(createData);
      }
      
      setIsEditing(false);
      onSaved();
    } catch (error) {
      console.error('Failed to save mood entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteMoodEntry.mutate({ id: existingEntry.id });
      onDeleted();
    } catch (error) {
      console.error('Failed to delete mood entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Display mode */}
      {existingEntry && !isEditing && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">{existingEntry.mood}</div>
            <p className="text-lg font-medium text-gray-700">
              {MOOD_OPTIONS.find(m => m.emoji === existingEntry.mood)?.label}
            </p>
            <p className="text-sm text-gray-500">
              {MOOD_OPTIONS.find(m => m.emoji === existingEntry.mood)?.description}
            </p>
          </div>
          
          {existingEntry.note && (
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-700">Your note:</Label>
              <p className="mt-1 text-gray-800">{existingEntry.note}</p>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <EditIcon className="w-4 h-4" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2Icon className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete mood entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your mood entry for {date.toLocaleDateString()}. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {(!existingEntry || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              How {isToday ? 'are' : 'were'} you feeling? ✨
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.emoji}
                  type="button"
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                    selectedMood === mood.emoji
                      ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{mood.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-800">{mood.label}</div>
                      <div className="text-sm text-gray-500">{mood.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium">
              Add a note (optional) 📝
            </Label>
            <Textarea
              id="note"
              placeholder={`Tell us more about ${isToday ? 'how you\'re feeling today' : 'how you felt on this day'}...`}
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {note.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {existingEntry && isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedMood(existingEntry.mood);
                  setNote(existingEntry.note || '');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!selectedMood || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <SaveIcon className="w-4 h-4" />
              {isLoading 
                ? 'Saving...' 
                : existingEntry 
                  ? 'Update Mood' 
                  : 'Save Mood'
              }
            </Button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {!existingEntry && !isEditing && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🤔</p>
          <p className="mb-4">No mood recorded for this day</p>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Add Your Mood
          </Button>
        </div>
      )}
    </div>
  );
}