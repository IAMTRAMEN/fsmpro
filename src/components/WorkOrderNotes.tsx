import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, X, Search } from 'lucide-react';
import type { WorkOrderNote } from '../types/index';

interface WorkOrderNotesProps {
  notes: WorkOrderNote[];
  onAddNote: (content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  currentUserName: string;
  currentUserId: string;
  canEdit: boolean;
}

interface OptimisticNote extends WorkOrderNote {
  optimistic?: boolean;
}

const formatRelativeTime = (date: string | Date) => {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

export const WorkOrderNotes = ({
  notes,
  onAddNote,
  onDeleteNote,
  currentUserName,
  currentUserId,
  canEdit
}: WorkOrderNotesProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [optimisticNotes, setOptimisticNotes] = useState<OptimisticNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTime, setRefreshTime] = useState(0);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);

  const displayNotes = [
    ...optimisticNotes.filter(n => n.optimistic),
    ...notes.filter(n => !optimisticNotes.some(o => o.id === n.id))
  ];

  const filteredNotes = displayNotes.filter(n =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    
    const optimisticId = `opt-${Date.now()}`;
    const optimisticNote: OptimisticNote = {
      id: optimisticId,
      content: newNote,
      author: currentUserName,
      authorId: currentUserId,
      timestamp: new Date().toISOString(),
      updatedAt: undefined,
      optimistic: true
    };

    setOptimisticNotes(prev => [optimisticNote, ...prev]);
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      await onAddNote(newNote);
      setOptimisticNotes(prev => prev.filter(n => n.id !== optimisticId));
      setNewNote('');
      setSuccess('Note posted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    } catch (err) {
      setError('Failed to add note. Please try again.');
      setOptimisticNotes(prev => prev.filter(n => n.id !== optimisticId));
      console.error('Add note error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    setError(null);
    try {
      setOptimisticNotes(prev => prev.filter(n => n.id !== noteId));
      await onDeleteNote(noteId);
      setSuccess('Note deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setOptimisticNotes(prev => [
        ...prev,
        notes.find(n => n.id === noteId)!
      ]);
      setError('Failed to delete note. Please try again.');
      console.error('Delete note error:', err);
      setDeletingNoteId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
        {displayNotes.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {displayNotes.length}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-in">
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2 animate-in">
          <p className="text-sm text-green-700 dark:text-green-300 flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="flex-shrink-0 text-green-400 dark:text-green-500 hover:text-green-600 dark:hover:text-green-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Note Form */}
      {canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <textarea
            ref={textAreaRef}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note... (Ctrl+Enter to submit)"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none text-sm"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">{newNote.length} characters</p>
            <button
              onClick={handleSubmit}
              disabled={!newNote.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition font-medium"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {displayNotes.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotes && filteredNotes.length > 0 ? (
          filteredNotes.map((note, idx) => (
            <div 
              key={note.id} 
              onMouseEnter={() => setFocusedNoteId(note.id)}
              onMouseLeave={() => setFocusedNoteId(null)}
              className={`rounded-lg p-4 border transition-all animate-in ${
                note.optimistic
                  ? 'bg-blue-50 border-blue-200 opacity-75'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{note.author}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span>{formatRelativeTime(note.timestamp)}</span>
                    {note.optimistic && <span className="text-blue-600">• posting</span>}
                  </p>
                </div>
                {canEdit && !note.optimistic && (focusedNoteId === note.id || deletingNoteId === note.id) && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                    className="p-2 hover:bg-red-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            {displayNotes.length === 0 ? 'No notes yet. Be the first to add one!' : 'No matching notes'}
          </p>
        )}
      </div>
    </div>
  );
};
