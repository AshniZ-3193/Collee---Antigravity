import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, FilePlus2, NotebookPen, Search, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { stripRichTextFormatting } from '@/lib/richText';
import type { College } from '@/components/screens/workspace/types';

import NotionEditor from './NotionEditor';
import { useNotesState } from './useNotesState';

interface NotesSectionProps {
  colleges: College[];
}

const formatUpdatedAt = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const NotesSection: React.FC<NotesSectionProps> = ({ colleges }) => {
  const {
    filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    archiveNote,
    deleteNote,
  } = useNotesState();

  const [titleDraft, setTitleDraft] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const collegeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const college of colleges) {
      map.set(college.id, college.name);
    }
    return map;
  }, [colleges]);

  useEffect(() => {
    setTitleDraft(activeNote?.title ?? '');
  }, [activeNote?._id, activeNote?.title]);

  const notePreview = (content: string) => {
    const plain = stripRichTextFormatting(content).replace(/\s+/g, ' ').trim();
    return plain.length > 84 ? `${plain.slice(0, 84)}...` : plain || 'Empty note';
  };

  const handleTitleBlur = async () => {
    if (!activeNote) return;
    const nextTitle = titleDraft.trim() || 'Untitled note';
    if (nextTitle === activeNote.title) return;
    await updateNote(activeNote._id, { title: nextTitle });
    setLastSavedAt(Date.now());
  };

  return (
    <section className="flex h-full overflow-hidden">
      {/* Notes sidebar */}
      <aside className="flex w-[280px] flex-shrink-0 flex-col border-r border-border bg-card/50">
        <div className="space-y-3 border-b border-border p-4">
          <Button variant="collee" className="w-full" onClick={() => void createNote()}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            New Note
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notes..."
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => {
              const isActive = note._id === activeNoteId;
              return (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setActiveNoteId(note._id)}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? 'border-primary/30 bg-primary/5 shadow-soft'
                            : 'border-transparent bg-transparent hover:border-border hover:bg-card'
                        }`}
                      >
                        <p className="truncate text-sm font-medium text-foreground">{note.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {notePreview(note.content)}
                        </p>
                        <p className="mt-2 text-[10px] text-muted-foreground/70">
                          {formatUpdatedAt(note.updatedAt)}
                        </p>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => void archiveNote(note._id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => void deleteNote(note._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredNotes.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border p-6 text-center">
              <NotebookPen className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-body-sm text-muted-foreground">
                {searchQuery ? 'No notes match your search.' : 'No notes yet. Create one to get started.'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Editor area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!activeNote ? (
          <div className="flex h-full items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-sm text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <NotebookPen className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-heading text-foreground">
                Your notes
              </h3>
              <p className="mt-2 text-body-sm text-muted-foreground">
                Select a note from the sidebar or create a new one. Notes autosave as you type.
              </p>
              <Button variant="collee" className="mt-6" onClick={() => void createNote()}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Note header */}
            <div className="space-y-2 border-b border-border px-6 py-4">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={() => void handleTitleBlur()}
                placeholder="Untitled note"
                className="w-full bg-transparent font-display text-heading text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-3">
                {activeNote.linkedCollegeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeNote.linkedCollegeIds.map((collegeId) => (
                      <span
                        key={collegeId}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                      >
                        {collegeNameById.get(collegeId) ?? 'College'}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-caption text-muted-foreground/70">
                  Saved {lastSavedAt ? formatUpdatedAt(lastSavedAt) : formatUpdatedAt(activeNote.updatedAt)}
                </p>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto max-w-content">
                <NotionEditor
                  initialContent={activeNote.content}
                  onContentChange={() => {
                    // content stays managed by editor instance; persisted on debounce
                  }}
                  onDebouncedSave={(nextContent) => {
                    void updateNote(activeNote._id, { content: nextContent }).then(() => {
                      setLastSavedAt(Date.now());
                    });
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default NotesSection;
