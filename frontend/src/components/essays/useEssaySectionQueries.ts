import { useMemo } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { calculateProfileCompletion } from '@/utils/profileCompletion';

export const useEssaySectionQueries = (params: {
  currentEssayId?: string;
  currentPromptId?: string;
}) => {
  const { currentEssayId, currentPromptId } = params;

  const userProfile = useQuery(api.userProfile.get, {});
  const storyIdentity = useQuery(api.storyIdentity.get, {});

  const promptStrategy = useQuery(
    api.ai.promptStrategy.getForPrompt,
    currentPromptId ? { promptId: currentPromptId as Id<'prompts'> } : 'skip',
  );

  const reuseSuggestionsResult = useQuery(
    api.experienceBank.getReuseSuggestions,
    currentEssayId ? { essayId: currentEssayId as Id<'essays'> } : 'skip',
  );

  const essayVersionsResult = useQuery(
    api.essays.getVersions,
    currentEssayId ? { essayId: currentEssayId as Id<'essays'> } : 'skip',
  );

  const essayFeedbackResult = useQuery(
    api.ai.essayFeedback.getForEssay,
    currentEssayId ? { essayId: currentEssayId as Id<'essays'> } : 'skip',
  );

  const reviewerComments =
    useQuery(
      api.shares.getCommentsForEssay,
      currentEssayId ? { essayId: currentEssayId as Id<'essays'> } : 'skip',
    ) ?? [];

  const reuseSuggestions = useMemo(() => reuseSuggestionsResult ?? [], [reuseSuggestionsResult]);

  const profileCompletion = useMemo(
    () => calculateProfileCompletion(userProfile ?? null, Boolean(storyIdentity)),
    [userProfile, storyIdentity],
  );

  return {
    profilePct: profileCompletion.pct,
    isProfileComplete: profileCompletion.pct === 100,
    promptStrategy,
    reuseSuggestions,
    essayVersionsResult,
    essayFeedbackResult,
    reviewerComments,
    addOwnerReplyMutation: useMutation(api.shares.addOwnerReply),
    resolveCommentAsOwnerMutation: useMutation(api.shares.resolveCommentAsOwner),
    restoreVersionMutation: useMutation(api.essays.restoreVersion),
    addExperienceUsageMutation: useMutation(api.experienceBank.addUsage),
    resetSyncDocumentMutation: useMutation(api.prosemirror.resetDocument),
    updatePromptMutation: useMutation(api.colleges.updatePrompt),
    createShareMutation: useMutation(api.shares.create),
    generatePromptStrategyAction: useAction(api.ai.generatePromptStrategy.generate),
    generateEssayFeedbackAction: useAction(api.ai.generateEssayFeedback.generate),
  };
};
