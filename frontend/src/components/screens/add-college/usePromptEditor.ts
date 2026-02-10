import { useMemo, useState } from 'react';

import type { EssayPrompt } from './types';
import { createEmptyPrompt, filterPromptsForUser } from './utils';

interface UsePromptEditorParams {
  userInterests: string[];
}

export const usePromptEditor = ({ userInterests }: UsePromptEditorParams) => {
  const [prompts, setPrompts] = useState<EssayPrompt[]>([createEmptyPrompt()]);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const filteredPrompts = useMemo(() => filterPromptsForUser(prompts, userInterests), [prompts, userInterests]);
  const hiddenPromptCount = prompts.length - filteredPrompts.length;
  const displayPrompts = showAllPrompts ? prompts : filteredPrompts;
  const validPromptCount = prompts.filter((p) => p.promptText.trim() && p.limitValue > 0).length;

  const addPrompt = () => {
    setPrompts((prev) => [...prev, createEmptyPrompt(Date.now().toString())]);
  };

  const removePrompt = (id: string) => {
    setPrompts((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  const updatePrompt = (
    id: string,
    field: keyof EssayPrompt,
    value: string | number | boolean,
  ) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const resetPrompts = () => {
    setPrompts([createEmptyPrompt()]);
    setShowAllPrompts(false);
  };

  return {
    prompts,
    setPrompts,
    showAllPrompts,
    setShowAllPrompts,
    filteredPrompts,
    hiddenPromptCount,
    displayPrompts,
    validPromptCount,
    addPrompt,
    removePrompt,
    updatePrompt,
    resetPrompts,
  };
};
