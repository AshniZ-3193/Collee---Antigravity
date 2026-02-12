import React, { useEffect, useMemo, useState } from 'react';
import { Archive, FilePlus2, Search, Trash2 } from 'lucide-react';

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
      <aside className="w-[280px] flex-shrink-0 border-r border-border bg-card/40">
        <div className="space-y-3 border-b border-border p-4">
          <Button className="w-full" onClick={() => void createNote()}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Note
          </Button>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search notes"
              className="pl-8"
            />
          </div>
        </div>

        <div className="h-[calc(100%-124px)] space-y-2 overflow-y-auto p-3">
          {filteredNotes.map((note) => {
            const isActive = note._id === activeNoteId;
            return (
              <ContextMenu key={note._id}>
                <ContextMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveNoteId(note._id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-border bg-card hover:bg-muted/40'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-foreground">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notePreview(note.content)}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">{formatUpdatedAt(note.updatedAt)}</p>
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
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No notes yet.
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {!activeNote ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-md rounded-2xl border border-dashed border-border p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground">Select or create a note</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Notes are private and autosave as you type.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 border-b border-border p-4">
              <Input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={() => void handleTitleBlur()}
                placeholder="Untitled note"
                className="h-10 text-base font-medium"
              />

              {activeNote.linkedCollegeIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeNote.linkedCollegeIds.map((collegeId) => (
                    <span
                      key={collegeId}
                      className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {collegeNameById.get(collegeId) ?? 'College'}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Last saved:{' '}
                {lastSavedAt ? formatUpdatedAt(lastSavedAt) : formatUpdatedAt(activeNote.updatedAt)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
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
          </>
        )}
      </div>
    </section>
  );
};

export default NotesSection;
