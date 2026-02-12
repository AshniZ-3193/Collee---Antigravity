import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export const useNotesState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<Id<'notesDocuments'> | null>(null);
  const migrationAttemptedRef = useRef(false);

  const notesResult = useQuery(api.notes.list, { status: 'active' });
  const notes = useMemo(() => notesResult ?? [], [notesResult]);

  const createNoteMutation = useMutation(api.notes.create);
  const updateNoteMutation = useMutation(api.notes.update);
  const archiveNoteMutation = useMutation(api.notes.archive);
  const removeNoteMutation = useMutation(api.notes.remove);
  const migratePersonalLensMutation = useMutation(api.notes.migratePersonalLens);

  useEffect(() => {
    if (migrationAttemptedRef.current) return;
    migrationAttemptedRef.current = true;
    void migratePersonalLensMutation({}).catch((error) => {
      console.error('Failed to migrate personal lens notes:', error);
    });
  }, [migratePersonalLensMutation]);

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0]._id);
      return;
    }

    if (activeNoteId && !notes.some((note) => note._id === activeNoteId)) {
      setActiveNoteId(notes[0]?._id ?? null);
    }
  }, [notes, activeNoteId]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter((note) => {
      const haystack = `${note.title} ${note.content}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [notes, searchQuery]);

  const activeNote = useMemo(
    () => notes.find((note) => note._id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  const createNote = async () => {
    const createdId = await createNoteMutation({ title: 'Untitled note' });
    setActiveNoteId(createdId);
    return createdId;
  };

  const updateNote = async (
    id: Id<'notesDocuments'>,
    patch: {
      title?: string;
      content?: string;
      linkedCollegeIds?: Id<'colleges'>[];
    },
  ) => {
    await updateNoteMutation({ id, ...patch });
  };

  const archiveNote = async (id: Id<'notesDocuments'>) => {
    await archiveNoteMutation({ id });
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const deleteNote = async (id: Id<'notesDocuments'>) => {
    await removeNoteMutation({ id });
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  return {
    notes,
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
  };
};
