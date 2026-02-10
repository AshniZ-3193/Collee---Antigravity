import { useCallback, useState } from 'react';

import type { GeneratedSuggestion, PersonalLensNote } from './types';

export const usePersonalLensTabState = () => {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<PersonalLensNote['category']>('moment');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [generatedSuggestions, setGeneratedSuggestions] = useState<GeneratedSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const resetForEssayChange = useCallback(() => {
    setGeneratedSuggestions([]);
    setEditingNoteId(null);
    setEditingNoteContent('');
  }, []);

  return {
    newNoteContent,
    setNewNoteContent,
    newNoteCategory,
    setNewNoteCategory,
    editingNoteId,
    setEditingNoteId,
    editingNoteContent,
    setEditingNoteContent,
    generatedSuggestions,
    setGeneratedSuggestions,
    dismissedSuggestions,
    setDismissedSuggestions,
    resetForEssayChange,
  };
};
