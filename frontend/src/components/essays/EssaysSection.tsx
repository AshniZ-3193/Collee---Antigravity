import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Check, Download, History, PenLine, Share2 } from 'lucide-react';
import { countRichTextWords, parseStoredRichTextToDoc, stripRichTextFormatting } from '@/lib/richText';
import { getEssaySyncDocumentId } from '@/lib/prosemirrorSync';

import type { Id } from '../../../convex/_generated/dataModel';
import type { College, ExportData, GeneratedSuggestion, PromptFitGuidance, ReusableExcerpt, StoryExperience, Version } from '@/components/screens/workspace/types';
import VersionHistoryDrawer from '@/components/screens/workspace/VersionHistoryDrawer';
import ShareDialog from '@/components/screens/workspace/ShareDialog';
import DeletePromptDialog from '@/components/screens/workspace/DeletePromptDialog';
import {
  buildExperienceIndex,
  buildExperienceUsageMap,
  filterStoredFeedbackByType,
  mapExperienceSuggestions,
  mapSmartReuseExcerpts,
  mapVersionsForDisplay,
  type StoredFeedbackEntry,
} from '@/components/screens/workspace/dataTransforms';
import { useEssaySync } from '@/components/screens/workspace/useEssaySync';
import { Button } from '@/components/ui/button';

import CollegeNavigator from './CollegeNavigator';
import CommentsDrawer from './CommentsDrawer';
import EssayEditorPane from './EssayEditorPane';
import FeedbackDialog from './FeedbackDialog';
import SmartReusePopover from './SmartReusePopover';
import StrategySheet from './StrategySheet';
import { useEssayEditorState } from './useEssayEditorState';
import { useEssaySectionQueries } from './useEssaySectionQueries';

interface EssaysSectionProps {
  colleges: College[];
  activeEssay: { collegeId: string; essayId: string } | null;
  setActiveEssay: (essay: { collegeId: string; essayId: string } | null) => void;
  selectedCollegeId?: string | null;
  onAddCollege: () => void;
  onExport: (data: ExportData) => void;
  storyIdentityData: unknown;
  experienceUsagesResult: unknown;
  onBackToSchools: () => void;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const EssaysSection: React.FC<EssaysSectionProps> = ({
  colleges,
  activeEssay,
  setActiveEssay,
  selectedCollegeId,
  onAddCollege,
  onExport,
  storyIdentityData,
  experienceUsagesResult,
  onBackToSchools,
}) => {
  const state = useEssayEditorState();
  const strategyAttempts = useRef<Set<string>>(new Set());

  const handleSelectEssay = useCallback(
    (collegeId: string, essayId: string) => {
      setActiveEssay({ collegeId, essayId });
    },
    [setActiveEssay],
  );

  const selectedCollege = selectedCollegeId
    ? colleges.find((college) => college.id === selectedCollegeId) ?? null
    : null;
  const currentCollege = activeEssay ? colleges.find((college) => college.id === activeEssay.collegeId) : null;
  const currentEssay = currentCollege?.essays.find((essay) => essay.id === activeEssay?.essayId);
  const currentEssayId = currentEssay?.id;
  const currentEssayPersistedId =
    currentEssay?.persistedId ?? (currentEssay && currentEssay.id !== currentEssay.promptId ? currentEssay.id : undefined);
  const currentEssaySyncGeneration = currentEssay?.syncGeneration ?? 0;
  const currentSyncDocumentId = currentEssayId
    ? getEssaySyncDocumentId(currentEssayId, currentEssaySyncGeneration)
    : undefined;
  const currentPromptId = currentEssay?.promptId;

  const queries = useEssaySectionQueries({ currentEssayId: currentEssayPersistedId, currentPromptId });

  const { editorSyncKey, hasPendingExternalReset, markLocalEdit, markLoadedEssayVersion } = useEssaySync({
    currentSyncDocumentId,
    currentSyncGeneration: currentEssaySyncGeneration,
    essayContent: currentEssay?.content,
    essayLastUpdated: currentEssay?.lastUpdated,
    localContent: state.content,
    setLocalContent: state.setContent,
    resetSyncDocument: queries.resetSyncDocumentMutation,
  });

  const experienceIndex = useMemo(() => buildExperienceIndex(storyIdentityData), [storyIdentityData]);
  const experienceUsageMap = useMemo(
    () => buildExperienceUsageMap(experienceUsagesResult),
    [experienceUsagesResult],
  );

  const experienceSuggestions: (StoryExperience & { guidance: PromptFitGuidance })[] = useMemo(
    () => mapExperienceSuggestions(queries.promptStrategy, experienceIndex, experienceUsageMap),
    [queries.promptStrategy, experienceIndex, experienceUsageMap],
  );

  const versionsForDisplay: Version[] = useMemo(
    () => mapVersionsForDisplay(queries.essayVersionsResult, currentEssay?.content),
    [queries.essayVersionsResult, currentEssay?.content],
  );

  const feedbackForType: StoredFeedbackEntry[] = useMemo(
    () => filterStoredFeedbackByType(queries.essayFeedbackResult, state.feedbackType),
    [queries.essayFeedbackResult, state.feedbackType],
  );

  const parsedStoredFeedback = useMemo(() => {
    if (!feedbackForType || feedbackForType.length === 0) return null;
    try {
      return JSON.parse(feedbackForType[0].feedback);
    } catch {
      return null;
    }
  }, [feedbackForType]);

  const displayedFeedback = state.feedbackResult ?? parsedStoredFeedback;

  const currentEssayContent = currentEssay?.content;
  const currentEssayLastUpdated = currentEssay?.lastUpdated;

  useEffect(() => {
    if (!currentEssayId || currentEssayContent === undefined) return;
    state.setContent(currentEssayContent);
    markLoadedEssayVersion(currentEssayLastUpdated);
    state.setActiveFormats({
      bold: false,
      italic: false,
      underline: false,
      bullet: false,
      numbered: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEssayId, markLoadedEssayVersion]);

  useEffect(() => {
    state.resetForEssayChange();
    state.setPreviewVersion(null);
    state.setEditorInstance(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEssayId, state.resetForEssayChange, state.setPreviewVersion, state.setEditorInstance]);

  useEffect(() => {
    state.setFeedbackResult(null);
    state.setFeedbackError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedbackType, state.setFeedbackResult, state.setFeedbackError]);

  useEffect(() => {
    return () => {
      if (state.saveIndicatorTimerRef.current !== null) {
        window.clearTimeout(state.saveIndicatorTimerRef.current);
      }
    };
  }, [state.saveIndicatorTimerRef]);

  useEffect(() => {
    if (!currentPromptId) return;
    if (queries.promptStrategy === undefined) return;
    if (queries.promptStrategy !== null) return;
    if (strategyAttempts.current.has(currentPromptId)) return;

    strategyAttempts.current.add(currentPromptId);
    state.setIsGeneratingStrategy(true);
    state.setStrategyError(null);
    queries
      .generatePromptStrategyAction({ promptId: currentPromptId as Id<'prompts'> })
      .catch((error) => {
        console.error('Failed to generate prompt strategy:', error);
        state.setStrategyError('Unable to generate strategy right now.');
      })
      .finally(() => {
        state.setIsGeneratingStrategy(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPromptId,
    queries.promptStrategy,
    queries.generatePromptStrategyAction,
    state.setIsGeneratingStrategy,
    state.setStrategyError,
  ]);

  const handleEditorContentChange = (nextContent: string) => {
    state.setContent(nextContent);
    state.setIsSaving(true);
    markLocalEdit();
    if (state.saveIndicatorTimerRef.current !== null) {
      window.clearTimeout(state.saveIndicatorTimerRef.current);
    }
    state.saveIndicatorTimerRef.current = window.setTimeout(() => {
      state.setIsSaving(false);
      state.setLastSaved(new Date());
    }, 1400);
  };

  const applyFormatting = (format: keyof typeof state.activeFormats) => {
    if (!state.editorInstance) return;
    const chain = state.editorInstance.chain().focus();
    if (format === 'bold') {
      chain.toggleBold().run();
      return;
    }
    if (format === 'italic') {
      chain.toggleItalic().run();
      return;
    }
    if (format === 'underline') {
      chain.toggleUnderline().run();
      return;
    }
    if (format === 'bullet') {
      chain.toggleBulletList().run();
      return;
    }
    chain.toggleOrderedList().run();
  };

  useEffect(() => {
    if (activeEssay) return;
    if (!selectedCollege || selectedCollege.essays.length === 0) return;
    setActiveEssay({
      collegeId: selectedCollege.id,
      essayId: selectedCollege.essays[0].id,
    });
  }, [activeEssay, selectedCollege, setActiveEssay]);

  useEffect(() => {
    if (!activeEssay) return;
    const essayCollege = colleges.find((college) => college.id === activeEssay.collegeId);
    if (!essayCollege) {
      setActiveEssay(null);
      return;
    }

    if (essayCollege.essays.length === 0) {
      setActiveEssay(null);
      return;
    }

    const hasEssay = essayCollege.essays.some((essay) => essay.id === activeEssay.essayId);
    if (!hasEssay) {
      setActiveEssay({
        collegeId: essayCollege.id,
        essayId: essayCollege.essays[0].id,
      });
    }
  }, [activeEssay, colleges, setActiveEssay]);

  const handleGeneratePromptStrategy = async () => {
    if (!currentPromptId) return;
    state.setIsGeneratingStrategy(true);
    state.setStrategyError(null);
    strategyAttempts.current.add(currentPromptId);
    try {
      await queries.generatePromptStrategyAction({ promptId: currentPromptId as Id<'prompts'> });
    } catch (error) {
      console.error('Failed to generate prompt strategy:', error);
      state.setStrategyError('Unable to generate strategy right now.');
    } finally {
      state.setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!currentEssayPersistedId) return;
    state.setIsGeneratingFeedback(true);
    state.setFeedbackError(null);
    try {
      const result = await queries.generateEssayFeedbackAction({
        essayId: currentEssayPersistedId as Id<'essays'>,
        feedbackType: state.feedbackType,
      });
      state.setFeedbackResult(result);
    } catch (error) {
      console.error('Failed to generate feedback:', error);
      state.setFeedbackError('Unable to generate feedback right now.');
    } finally {
      state.setIsGeneratingFeedback(false);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    if (!currentEssayPersistedId || !version.content) return;
    try {
      await queries.restoreVersionMutation({
        essayId: currentEssayPersistedId as Id<'essays'>,
        versionId: version.id as Id<'essayVersions'>,
      });
      state.setContent(version.content);
      state.editorInstance?.commands.setContent(parseStoredRichTextToDoc(version.content));
      state.setShowVersionHistory(false);
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const handleStartEditingPrompt = () => {
    if (!currentEssay) return;
    state.setEditedPromptText(currentEssay.prompt);
    state.setEditedWordLimit(String(currentEssay.wordLimit));
    state.setPromptEditError(null);
    state.setIsEditingPrompt(true);
  };

  const handleCancelPromptEdit = () => {
    state.setIsEditingPrompt(false);
    state.setPromptEditError(null);
  };

  const handleSavePromptEdit = async () => {
    if (!currentPromptId || !currentEssay) return;
    const nextPromptText = state.editedPromptText.trim();
    const parsedWordLimit = Number.parseInt(state.editedWordLimit, 10);

    if (!nextPromptText) {
      state.setPromptEditError('Prompt text is required.');
      return;
    }
    if (!Number.isFinite(parsedWordLimit) || parsedWordLimit < 50 || parsedWordLimit > 2000) {
      state.setPromptEditError('Word limit must be between 50 and 2000.');
      return;
    }

    const unchanged =
      nextPromptText === currentEssay.prompt && parsedWordLimit === currentEssay.wordLimit;
    if (unchanged) {
      state.setIsEditingPrompt(false);
      state.setPromptEditError(null);
      return;
    }

    state.setIsUpdatingPrompt(true);
    state.setPromptEditError(null);
    try {
      await queries.updatePromptMutation({
        promptId: currentPromptId as Id<'prompts'>,
        text: nextPromptText,
        wordCountMax: parsedWordLimit,
      });
      state.setIsEditingPrompt(false);
      state.setFeedbackResult(null);
      state.setFeedbackError(null);
      strategyAttempts.current.delete(currentPromptId);
    } catch (error) {
      console.error('Failed to update prompt:', error);
      state.setPromptEditError('Unable to save prompt changes right now.');
    } finally {
      state.setIsUpdatingPrompt(false);
    }
  };

  const smartReuseExcerpts: ReusableExcerpt[] = useMemo(() => {
    if (!currentEssay || !currentCollege) return [];
    return mapSmartReuseExcerpts({
      reuseSuggestions: queries.reuseSuggestions,
      dismissedExcerpts: state.dismissedExcerpts,
      currentEssayId: currentEssay.id,
      currentCollegeId: currentCollege.id,
      excerptUsages: state.excerptUsages,
    });
  }, [
    currentEssay,
    currentCollege,
    queries.reuseSuggestions,
    state.dismissedExcerpts,
    state.excerptUsages,
  ]);

  const handleInsertAsReference = (excerpt: ReusableExcerpt) => {
    if (!currentCollege || !currentEssay) return;

    state.setExcerptUsages((prev) => [
      ...prev,
      {
        excerptId: excerpt.id,
        targetCollegeId: currentCollege.id,
        targetCollegeName: currentCollege.name,
        targetEssayId: currentEssay.id,
        targetEssayTitle: currentEssay.title,
      },
    ]);

    state.setInsertedReferences((prev) => [
      ...prev,
      {
        id: `ref-${Date.now()}`,
        excerptId: excerpt.id,
        text: excerpt.excerpt,
        sourceName: `${excerpt.sourceCollegeName} - ${excerpt.sourceEssayTitle}`,
      },
    ]);
  };

  const handleDismissExcerpt = (excerptId: string) => {
    if (!currentEssay) return;
    state.setDismissedExcerpts((prev) => new Set(prev).add(`${excerptId}-${currentEssay.id}`));
  };

  const handleDismissExperienceSuggestion = (experienceId: string) => {
    if (!currentEssay) return;
    state.setDismissedSuggestions((prev) => new Set(prev).add(`exp-${experienceId}-${currentEssay.id}`));
  };

  const handleDeletePrompt = () => {
    state.setShowDeletePromptDialog(false);
    setActiveEssay(null);
  };

  const handleShareSubmit = async () => {
    if (!state.shareEmail.trim() || !currentEssayPersistedId) return;

    state.setIsCreatingShare(true);
    state.setShareError(null);
    state.setShareLinkCopyState('idle');
    state.setShareLinkCopyMessage('');

    try {
      const result = await queries.createShareMutation({
        essayId: currentEssayPersistedId as Id<'essays'>,
        permission: state.sharePermission,
        recipientEmail: state.shareEmail.trim(),
        recipientType: state.shareRecipientType,
      });

      const shareUrl = `${window.location.origin}/share/${result.token}`;
      state.setGeneratedShareLink(shareUrl);

      try {
        await navigator.clipboard.writeText(shareUrl);
        state.setShareLinkCopyState('copied');
        state.setShareLinkCopyMessage('Copied to clipboard automatically.');
      } catch (clipboardError) {
        console.error('Auto-copy failed:', clipboardError);
        state.setShareLinkCopyState('error');
        state.setShareLinkCopyMessage('Could not auto-copy. Use the copy button.');
      }

      state.setIsShareSent(true);
      setTimeout(() => {
        state.closeShareDialog();
      }, 5000);
    } catch (error) {
      console.error('Failed to create share link:', error);
      state.setShareError('Failed to create share link. Please try again.');
    } finally {
      state.setIsCreatingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!state.generatedShareLink) return;

    try {
      await navigator.clipboard.writeText(state.generatedShareLink);
      state.setShareLinkCopyState('copied');
      state.setShareLinkCopyMessage('Link copied to clipboard.');
    } catch (error) {
      console.error('Manual copy failed:', error);
      state.setShareLinkCopyState('error');
      state.setShareLinkCopyMessage('Copy failed. Select the link and copy manually.');
    }
  };

  const dismissShareDialogIfAllowed = () => {
    if (!state.isShareSent && !state.isCreatingShare) {
      state.closeShareDialog();
    }
  };

  const wordLimit = currentEssay?.wordLimit || 650;
  const wordCount = countRichTextWords(state.content);
  const isOverLimit = wordCount > wordLimit;
  const hasWrittenContent = stripRichTextFormatting(state.content).trim().length > 50;
  const hasSameTypeExcerpts = smartReuseExcerpts.some((excerpt) => excerpt.matchesSamePromptType);
  const showSmartReuse = (hasWrittenContent || hasSameTypeExcerpts) && smartReuseExcerpts.length > 0;

  if (colleges.length === 0) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-10 text-center shadow-soft">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <PenLine className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-heading text-foreground">No colleges yet</h2>
          <p className="mt-2 text-body-sm text-muted-foreground">
            Add a college first, then come back here to write and polish your essays.
          </p>
          <Button variant="collee" className="mt-6" onClick={onAddCollege}>
            Add College
          </Button>
        </div>
      </section>
    );
  }

  if (selectedCollege && selectedCollege.essays.length === 0) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-dashed border-border p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">No essays found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedCollege.name} does not have essay prompts yet.
          </p>
        </div>
      </section>
    );
  }

  if (!activeEssay || !currentEssay || !currentCollege) {
    return (
      <section className="flex h-full flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-dashed border-border p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Open an essay from Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a college and click Open Essays to jump straight into writing.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-1 overflow-hidden">
      <CollegeNavigator
        college={currentCollege}
        activeEssay={activeEssay}
        onSelectEssay={handleSelectEssay}
        onBackToSchools={onBackToSchools}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2">
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{currentEssay.title}</p>
            <p className="text-xs text-muted-foreground">{currentCollege.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {!state.isSaving ? (
              <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>Saved {formatTime(state.lastSaved)}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => state.setShowVersionHistory(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Version history"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onExport({
                  essayTitle: currentEssay.title,
                  collegeName: currentCollege.name,
                  collegeId: currentCollege.id,
                  wordCount,
                  essayContent: stripRichTextFormatting(state.content),
                  essayId: currentEssay.id,
                });
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => state.setShowShareDialog(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <EssayEditorPane
          activeFormats={state.activeFormats}
          applyFormatting={applyFormatting}
          onOpenStrategy={state.openStrategySheet}
          onOpenFeedback={() => state.setFeedbackDialogOpen(true)}
          onOpenSmartReuse={() => state.setSmartReusePopoverOpen(true)}
          onOpenComments={state.openCommentsDrawer}
          commentsCount={queries.reviewerComments.filter((comment) => !comment.resolved).length}
          canShowSmartReuse={showSmartReuse}
          isEditingPrompt={state.isEditingPrompt}
          isUpdatingPrompt={state.isUpdatingPrompt}
          editedPromptText={state.editedPromptText}
          editedWordLimit={state.editedWordLimit}
          promptEditError={state.promptEditError}
          onStartEditingPrompt={handleStartEditingPrompt}
          onCancelPromptEdit={handleCancelPromptEdit}
          onSavePromptEdit={() => void handleSavePromptEdit()}
          onEditedPromptTextChange={state.setEditedPromptText}
          onEditedWordLimitChange={state.setEditedWordLimit}
          insertedReferences={state.insertedReferences}
          onRemoveReference={(referenceId) =>
            state.setInsertedReferences((prev) => prev.filter((reference) => reference.id !== referenceId))
          }
          showStarterHelper={state.showStarterHelper}
          onDismissStarterHelper={() => state.setShowStarterHelper(false)}
          hasPendingExternalReset={hasPendingExternalReset}
          currentEssay={currentEssay}
          currentEssayId={currentEssayId}
          currentSyncDocumentId={currentSyncDocumentId}
          editorSyncKey={editorSyncKey}
          content={state.content}
          onEditorContentChange={handleEditorContentChange}
          onFormatsChange={state.setActiveFormats}
          onEditorInstanceChange={state.setEditorInstance}
          wordCount={wordCount}
          wordLimit={wordLimit}
          isOverLimit={isOverLimit}
          isSaving={state.isSaving}
          lastSavedLabel={formatTime(state.lastSaved)}
        />
      </div>

      <StrategySheet
        open={state.strategySheetOpen}
        onOpenChange={state.setStrategySheetOpen}
        currentEssay={currentEssay}
        currentEssayId={currentEssayPersistedId}
        currentCollege={currentCollege}
        currentPromptId={currentPromptId}
        promptStrategy={queries.promptStrategy}
        isGeneratingStrategy={state.isGeneratingStrategy}
        strategyError={state.strategyError}
        onGeneratePromptStrategy={() => void handleGeneratePromptStrategy()}
        experienceSuggestions={experienceSuggestions}
        selectedExperience={state.selectedExperience}
        lockedExperience={state.lockedExperience}
        dismissedSuggestions={state.dismissedSuggestions}
        onSelectExperience={state.setSelectedExperience}
        onLockExperience={state.setLockedExperience}
        onDismissExperienceSuggestion={handleDismissExperienceSuggestion}
        experienceIndex={experienceIndex}
        experienceUsageMap={experienceUsageMap}
        addExperienceUsage={queries.addExperienceUsageMutation}
        editorInstance={state.editorInstance}
        onSetContent={state.setContent}
        onShowStarterHelper={state.setShowStarterHelper}
      />

      <FeedbackDialog
        open={state.feedbackDialogOpen}
        onOpenChange={state.setFeedbackDialogOpen}
        feedbackType={state.feedbackType}
        onFeedbackTypeChange={state.setFeedbackType}
        onGenerateFeedback={() => void handleGenerateFeedback()}
        isGeneratingFeedback={state.isGeneratingFeedback}
        feedbackError={state.feedbackError}
        displayedFeedback={displayedFeedback}
        currentEssayId={currentEssayPersistedId}
      />

      <SmartReusePopover
        open={state.smartReusePopoverOpen}
        onOpenChange={state.setSmartReusePopoverOpen}
        smartReuseExcerpts={smartReuseExcerpts}
        onInsertAsReference={handleInsertAsReference}
        onDismissExcerpt={handleDismissExcerpt}
      />

      <CommentsDrawer
        open={state.commentsDrawerOpen}
        onOpenChange={state.setCommentsDrawerOpen}
        reviewerComments={queries.reviewerComments}
        onResolveComment={(commentId) => void queries.resolveCommentAsOwnerMutation({ commentId })}
        onAddOwnerReply={(commentId, contentValue) =>
          queries.addOwnerReplyMutation({ commentId, content: contentValue })
        }
      />

      <VersionHistoryDrawer
        isOpen={state.showVersionHistory}
        previewVersion={state.previewVersion}
        versions={versionsForDisplay}
        onClose={() => state.setShowVersionHistory(false)}
        onPreview={state.setPreviewVersion}
        onRestore={(version) => void handleRestoreVersion(version)}
      />

      <ShareDialog
        isOpen={state.showShareDialog}
        isShareSent={state.isShareSent}
        isCreatingShare={state.isCreatingShare}
        shareEmail={state.shareEmail}
        shareRecipientType={state.shareRecipientType}
        sharePermission={state.sharePermission}
        generatedShareLink={state.generatedShareLink}
        shareLinkCopyState={state.shareLinkCopyState}
        shareLinkCopyMessage={state.shareLinkCopyMessage}
        shareError={state.shareError}
        currentEssayId={currentEssayPersistedId}
        onShareEmailChange={state.setShareEmail}
        onShareRecipientTypeChange={state.setShareRecipientType}
        onSharePermissionChange={state.setSharePermission}
        onCopyShareLink={() => void handleCopyShareLink()}
        onSubmit={() => void handleShareSubmit()}
        onDismissIfAllowed={dismissShareDialogIfAllowed}
        onCloseAndReset={state.closeShareDialog}
      />

      <DeletePromptDialog
        isOpen={state.showDeletePromptDialog}
        onClose={() => state.setShowDeletePromptDialog(false)}
        onDelete={handleDeletePrompt}
      />
    </section>
  );
};

export default EssaysSection;
