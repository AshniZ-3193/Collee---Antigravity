import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Pencil, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PERSONAL_LENS_CATEGORIES } from './constants';
import type { GeneratedSuggestion, PersonalLensNote } from './types';

interface PersonalLensWorkspaceProps {
  personalLensNotes: PersonalLensNote[];
  newNoteContent: string;
  newNoteCategory: PersonalLensNote['category'];
  editingNoteId: string | null;
  editingNoteContent: string;
  generatedSuggestions: GeneratedSuggestion[];
  getCategoryLabel: (category: PersonalLensNote['category']) => string;
  onNewNoteCategoryChange: (category: PersonalLensNote['category']) => void;
  onNewNoteContentChange: (content: string) => void;
  onAddNote: () => void;
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onEditingNoteContentChange: (content: string) => void;
  onCancelEdit: () => void;
  onSaveEditedNote: () => void;
  onGenerateSuggestions: (note: PersonalLensNote) => void;
}

const PersonalLensWorkspace: React.FC<PersonalLensWorkspaceProps> = ({
  personalLensNotes,
  newNoteContent,
  newNoteCategory,
  editingNoteId,
  editingNoteContent,
  generatedSuggestions,
  getCategoryLabel,
  onNewNoteCategoryChange,
  onNewNoteContentChange,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onEditingNoteContentChange,
  onCancelEdit,
  onSaveEditedNote,
  onGenerateSuggestions,
}) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-heading-sm text-foreground">Personal Lens</h2>
                <p className="text-body-sm text-muted-foreground">What makes your story yours</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-body-sm text-foreground leading-relaxed">
                The more you share here, the more personal and specific your story suggestions will be.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                These notes are optional. Add what feels right - there's no wrong answer.
              </p>
            </div>
          </div>

          <div className="mb-8 p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-primary" />
              <span className="text-body-sm font-medium text-foreground">Add a note</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {PERSONAL_LENS_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => onNewNoteCategoryChange(category.value as PersonalLensNote['category'])}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    newNoteCategory === category.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <Textarea
              value={newNoteContent}
              onChange={(event) => onNewNoteContentChange(event.target.value)}
              placeholder={
                PERSONAL_LENS_CATEGORIES.find((category) => category.value === newNoteCategory)?.placeholder ??
                'Write a short note...'
              }
              className="min-h-[80px] resize-none mb-3"
            />

            <div className="flex justify-end">
              <Button
                variant="collee"
                size="sm"
                onClick={onAddNote}
                disabled={!newNoteContent.trim()}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Note
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
              Your Notes ({personalLensNotes.length})
            </h3>

            {personalLensNotes.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-body-sm text-muted-foreground">No notes yet.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Start by capturing a moment, observation, or value that matters to you.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Add a note above, then click "Generate story suggestions" to get personalized writing ideas for your
                    current essay.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {personalLensNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl border border-border bg-card group"
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(event) => onEditingNoteContentChange(event.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                            Cancel
                          </Button>
                          <Button variant="collee" size="sm" onClick={onSaveEditedNote}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground mb-2">
                              {getCategoryLabel(note.category)}
                            </span>
                            <p className="text-body-sm text-foreground leading-relaxed">{note.content}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditNote(note.id)}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border">
                          <button
                            onClick={() => onGenerateSuggestions(note)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            Generate story suggestions from this note
                          </button>
                          {generatedSuggestions.some((suggestion) => suggestion.noteId === note.id) && (
                            <p className="text-xs text-muted-foreground text-center mt-2 italic">
                              ✓ Suggestions generated - view them in the Write tab
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {personalLensNotes.length > 0 && (
            <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-body-sm font-medium text-foreground mb-1">
                    These notes improve your suggestions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    When you write essays, we'll reference these notes to give you more tailored story ideas and starting
                    points. You're always in control of what you share.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PersonalLensWorkspace;
