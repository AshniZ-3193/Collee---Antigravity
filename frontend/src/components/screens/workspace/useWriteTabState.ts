import { useCallback, useState } from 'react';

import type { ExcerptUsageRecord, FeedbackType } from './types';

export const useWriteTabState = () => {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [lockedExperience, setLockedExperience] = useState<string | null>(null);
  const [showStarterHelper, setShowStarterHelper] = useState(false);
  const [excerptUsages, setExcerptUsages] = useState<ExcerptUsageRecord[]>([]);
  const [dismissedExcerpts, setDismissedExcerpts] = useState<Set<string>>(new Set());
  const [insertedReferences, setInsertedReferences] = useState<
    { id: string; excerptId: string; text: string; sourceName: string }[]
  >([]);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState('');
  const [editedWordLimit, setEditedWordLimit] = useState('');
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  const [promptEditError, setPromptEditError] = useState<string | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('overall');
  const [feedbackResult, setFeedbackResult] = useState<unknown | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const resetForEssayChange = useCallback(() => {
    setSelectedExperience(null);
    setLockedExperience(null);
    setShowStarterHelper(false);
    setIsEditingPrompt(false);
    setEditedPromptText('');
    setEditedWordLimit('');
    setPromptEditError(null);
    setFeedbackResult(null);
    setFeedbackError(null);
    setStrategyError(null);
    setInsertedReferences([]);
  }, []);

  return {
    selectedExperience,
    setSelectedExperience,
    lockedExperience,
    setLockedExperience,
    showStarterHelper,
    setShowStarterHelper,
    excerptUsages,
    setExcerptUsages,
    dismissedExcerpts,
    setDismissedExcerpts,
    insertedReferences,
    setInsertedReferences,
    isEditingPrompt,
    setIsEditingPrompt,
    editedPromptText,
    setEditedPromptText,
    editedWordLimit,
    setEditedWordLimit,
    isUpdatingPrompt,
    setIsUpdatingPrompt,
    promptEditError,
    setPromptEditError,
    isGeneratingStrategy,
    setIsGeneratingStrategy,
    strategyError,
    setStrategyError,
    feedbackType,
    setFeedbackType,
    feedbackResult,
    setFeedbackResult,
    isGeneratingFeedback,
    setIsGeneratingFeedback,
    feedbackError,
    setFeedbackError,
    resetForEssayChange,
  };
};
