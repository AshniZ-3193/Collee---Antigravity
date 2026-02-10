import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Check,
  Settings,
  History,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Share2,
  Lightbulb,
  FileText,
  X,
  Pencil,
  MapPin,
  Plus,
  User,
  LogOut,
  Maximize2,
  Clock,
  Sparkles,
  Quote,
  Trash2,
  ArrowLeft,
  HelpCircle,
  Heart,
  PenLine,
  Calendar,
  Wand2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ColleeLogo from '@/components/ColleeLogo';
import ThemeToggle from '@/components/ThemeToggle';
import {
  countRichTextWords,
  parseStoredRichTextToDoc,
  stripRichTextFormatting,
} from '@/lib/richText';
import { getEssaySyncDocumentId } from '@/lib/prosemirrorSync';
import type { Editor } from '@tiptap/react';
import SyncEssayEditor, {
  type ActiveRichTextFormats,
} from '@/components/editor/SyncEssayEditor';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingWalkthrough, { useOnboardingState } from '@/components/OnboardingWalkthrough';
import { PERSONAL_LENS_CATEGORIES } from './workspace/constants';
import RightPanel from './workspace/RightPanel';
import ShareDialog from './workspace/ShareDialog';
import DeletePromptDialog from './workspace/DeletePromptDialog';
import VersionHistoryDrawer from './workspace/VersionHistoryDrawer';
import {
  buildExperienceIndex,
  buildExperienceUsageMap,
  filterStoredFeedbackByType,
  mapCollegesFromConvex,
  mapExperienceSuggestions,
  mapPersonalLensNotesFromConvex,
  mapSmartReuseExcerpts,
  mapVersionsForDisplay,
  type StoredFeedbackEntry,
} from './workspace/dataTransforms';
import {
  type College,
  type Essay,
  type ExcerptUsageRecord,
  type ExportData,
  type FeedbackType,
  type GeneratedSuggestion,
  type PersonalLensNote,
  type PromptFitGuidance,
  type ReusableExcerpt,
  type StoryExperience,
  type Version,
} from './workspace/types';
import { getEssaySnapshot, getStatusDot, isDeadlineApproaching } from './workspace/utils';
import { useEssaySync } from './workspace/useEssaySync';
import { usePersonalLensTabState } from './workspace/usePersonalLensTabState';
import { useWriteTabState } from './workspace/useWriteTabState';
import PersonalLensWorkspace from './workspace/PersonalLensWorkspace';
import WriteWorkspace from './workspace/WriteWorkspace';

interface ColleeWorkspaceProps {
  onAddCollege: () => void;
  onExport: (data: ExportData) => void;
  onEditStoryIdentity?: () => void;
  onLogoClick?: () => void;
  onLogout?: () => void;
  initialActiveEssay?: { collegeId: string; essayId: string } | null;
  onInitialActiveEssayApplied?: () => void;
}

// ===== MAIN COMPONENT =====
const ColleeWorkspace: React.FC<ColleeWorkspaceProps> = ({
  onAddCollege,
  onExport,
  onEditStoryIdentity,
  onLogoClick,
  onLogout,
  initialActiveEssay,
  onInitialActiveEssayApplied,
}) => {
  // Convex queries
  const convexCollegesResult = useQuery(api.colleges.list, {});
  const storyIdentityData = useQuery(api.storyIdentity.get, {});
  const convexLensNotesResult = useQuery(api.personalLens.list, {});
  const addLensNoteMutation = useMutation(api.personalLens.add);
  const updateLensNoteMutation = useMutation(api.personalLens.update);
  const deleteLensNoteMutation = useMutation(api.personalLens.remove);
  const createShareMutation = useMutation(api.shares.create);
  const generateSuggestionsAction = useAction(api.ai.generateSuggestions.generate);
  const generatePromptStrategyAction = useAction(api.ai.generatePromptStrategy.generate);
  const generateEssayFeedbackAction = useAction(api.ai.generateEssayFeedback.generate);
  const restoreVersionMutation = useMutation(api.essays.restoreVersion);
  const addExperienceUsageMutation = useMutation(api.experienceBank.addUsage);
  const experienceUsagesResult = useQuery(api.experienceBank.getUsages);
  
  // Comments from reviewers
  const addOwnerReplyMutation = useMutation(api.shares.addOwnerReply);
  const resolveCommentAsOwnerMutation = useMutation(api.shares.resolveCommentAsOwner);
  // ProseMirror sync reset (for external changes from share links)
  const resetSyncDocumentMutation = useMutation(api.prosemirror.resetDocument);
  const updatePromptMutation = useMutation(api.colleges.updatePrompt);

  // Transform Convex data to match existing UI types
  const colleges: College[] = useMemo(() => {
    return mapCollegesFromConvex(convexCollegesResult);
  }, [convexCollegesResult]);

  const experienceIndex = useMemo(() => {
    return buildExperienceIndex(storyIdentityData);
  }, [storyIdentityData]);

  const experienceUsageMap = useMemo(() => {
    return buildExperienceUsageMap(experienceUsagesResult);
  }, [experienceUsagesResult]);

  // State
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());
  const [activeEssay, setActiveEssay] = useState<{ collegeId: string; essayId: string } | null>(null);
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState<ActiveRichTextFormats>({
    bold: false,
    italic: false,
    underline: false,
    bullet: false,
    numbered: false,
  });
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const saveIndicatorTimerRef = useRef<number | null>(null);

  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRecipientType, setShareRecipientType] = useState<'parent' | 'counselor'>('parent');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [isShareSent, setIsShareSent] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [shareLinkCopyState, setShareLinkCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [shareLinkCopyMessage, setShareLinkCopyMessage] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const strategyAttempts = useRef<Set<string>>(new Set());
  const deferredOnboardingRef = useRef(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [showDeletePromptDialog, setShowDeletePromptDialog] = useState(false);

  // Workspace tab state: 'write' or 'personal-lens'
  const [workspaceTab, setWorkspaceTab] = useState<'write' | 'personal-lens'>('write');

  const {
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
    resetForEssayChange: resetPersonalLensForEssayChange,
  } = usePersonalLensTabState();

  const {
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
    resetForEssayChange: resetWriteTabForEssayChange,
  } = useWriteTabState();

  // Personal Lens notes - from Convex
  const personalLensNotes: PersonalLensNote[] = useMemo(() => {
    return mapPersonalLensNotesFromConvex(convexLensNotesResult);
  }, [convexLensNotesResult]);

  // Calendar view state
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  // Onboarding state
  const {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  } = useOnboardingState();

  // Derived state
  const currentCollege = activeEssay ? colleges.find(c => c.id === activeEssay.collegeId) : null;
  const currentEssay = currentCollege?.essays.find(e => e.id === activeEssay?.essayId);
  const currentEssayId = currentEssay?.id;
  const currentEssaySyncGeneration = currentEssay?.syncGeneration ?? 0;
  const currentSyncDocumentId = currentEssayId
    ? getEssaySyncDocumentId(currentEssayId, currentEssaySyncGeneration)
    : undefined;
  const currentPromptId = currentEssay?.promptId;
  const isDocumentAreaActive = Boolean(activeEssay && currentEssay && !isEditorMinimized);
  const promptStrategy = useQuery(
    api.ai.promptStrategy.getForPrompt,
    currentPromptId ? { promptId: currentPromptId as Id<"prompts"> } : "skip"
  );
  const reuseSuggestionsResult = useQuery(
    api.experienceBank.getReuseSuggestions,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  );
  const reuseSuggestions = useMemo(() => reuseSuggestionsResult ?? [], [reuseSuggestionsResult]);
  const essayVersionsResult = useQuery(
    api.essays.getVersions,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  );
  const essayFeedbackResult = useQuery(
    api.ai.essayFeedback.getForEssay,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  );
  const reviewerComments = useQuery(
    api.shares.getCommentsForEssay,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  ) ?? [];
  const wordLimit = currentEssay?.wordLimit || 650;
  const wordCount = countRichTextWords(content);
  const isOverLimit = wordCount > wordLimit;
  const { editorSyncKey, hasPendingExternalReset, markLocalEdit, markLoadedEssayVersion } = useEssaySync({
    currentSyncDocumentId,
    currentSyncGeneration: currentEssaySyncGeneration,
    essayContent: currentEssay?.content,
    essayLastUpdated: currentEssay?.lastUpdated,
    localContent: content,
    setLocalContent: setContent,
    resetSyncDocument: resetSyncDocumentMutation,
  });

  const experienceSuggestions: (StoryExperience & { guidance: PromptFitGuidance })[] = useMemo(() => {
    return mapExperienceSuggestions(promptStrategy, experienceIndex, experienceUsageMap);
  }, [promptStrategy, experienceIndex, experienceUsageMap]);

  const versionsForDisplay: Version[] = useMemo(() => {
    return mapVersionsForDisplay(essayVersionsResult, currentEssay?.content);
  }, [essayVersionsResult, currentEssay?.content]);

  const feedbackForType: StoredFeedbackEntry[] = useMemo(
    () => filterStoredFeedbackByType(essayFeedbackResult, feedbackType),
    [essayFeedbackResult, feedbackType],
  );

  const parsedStoredFeedback = useMemo(() => {
    if (!feedbackForType || feedbackForType.length === 0) return null;
    try {
      return JSON.parse(feedbackForType[0].feedback);
    } catch {
      return null;
    }
  }, [feedbackForType]);

  const displayedFeedback = feedbackResult ?? parsedStoredFeedback;

  // Defer onboarding walkthrough until the document area is visible.
  useEffect(() => {
    if (hasCompletedOnboarding) return;
    if (!showOnboarding) return;
    if (isDocumentAreaActive) return;

    deferredOnboardingRef.current = true;
    setShowOnboarding(false);
  }, [hasCompletedOnboarding, showOnboarding, isDocumentAreaActive, setShowOnboarding]);

  useEffect(() => {
    if (hasCompletedOnboarding) return;
    if (showOnboarding) return;
    if (!deferredOnboardingRef.current) return;
    if (!isDocumentAreaActive) return;

    deferredOnboardingRef.current = false;
    setShowOnboarding(true);
  }, [hasCompletedOnboarding, showOnboarding, isDocumentAreaActive, setShowOnboarding]);

  useEffect(() => {
    if (!initialActiveEssay) return;

    const matchesCurrent =
      activeEssay?.collegeId === initialActiveEssay.collegeId &&
      activeEssay?.essayId === initialActiveEssay.essayId;
    if (!matchesCurrent) {
      setActiveEssay(initialActiveEssay);
      setIsEditorMinimized(false);
      setWorkspaceTab('write');
    }
    onInitialActiveEssayApplied?.();
  }, [
    initialActiveEssay,
    activeEssay?.collegeId,
    activeEssay?.essayId,
    onInitialActiveEssayApplied,
  ]);

  // Load essay content when active essay changes
  useEffect(() => {
    if (currentEssay) {
      setContent(currentEssay.content);
      markLoadedEssayVersion(currentEssay.lastUpdated);
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        bullet: false,
        numbered: false,
      });
    }
  }, [activeEssay?.essayId, currentEssay, markLoadedEssayVersion]);

  useEffect(() => {
    if (!showShareDialog) {
      setShareLinkCopyState('idle');
      setShareLinkCopyMessage('');
    }
  }, [showShareDialog]);

  useEffect(() => {
    resetWriteTabForEssayChange();
    resetPersonalLensForEssayChange();
    setPreviewVersion(null);
    setEditorInstance(null);
  }, [currentEssayId, resetWriteTabForEssayChange, resetPersonalLensForEssayChange]);

  useEffect(() => {
    if (!currentPromptId) return;
    if (promptStrategy === undefined) return;
    if (promptStrategy !== null) return;
    if (strategyAttempts.current.has(currentPromptId)) return;

    strategyAttempts.current.add(currentPromptId);
    setIsGeneratingStrategy(true);
    setStrategyError(null);
    generatePromptStrategyAction({ promptId: currentPromptId as Id<"prompts"> })
      .catch((error) => {
        console.error("Failed to generate prompt strategy:", error);
        setStrategyError("Unable to generate strategy right now.");
      })
      .finally(() => {
        setIsGeneratingStrategy(false);
      });
  }, [
    currentPromptId,
    promptStrategy,
    generatePromptStrategyAction,
    setIsGeneratingStrategy,
    setStrategyError,
  ]);

  useEffect(() => {
    setFeedbackResult(null);
    setFeedbackError(null);
  }, [feedbackType, setFeedbackError, setFeedbackResult]);

  useEffect(() => {
    return () => {
      if (saveIndicatorTimerRef.current !== null) {
        window.clearTimeout(saveIndicatorTimerRef.current);
      }
    };
  }, []);

  // Handlers
  const toggleCollegeExpanded = (collegeId: string) => {
    setExpandedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collegeId)) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });
  };

  const handleSelectEssay = (collegeId: string, essayId: string) => {
    setActiveEssay({ collegeId, essayId });
  };

  const handleEditorContentChange = (nextContent: string) => {
    setContent(nextContent);
    setIsSaving(true);
    markLocalEdit();
    if (saveIndicatorTimerRef.current !== null) {
      window.clearTimeout(saveIndicatorTimerRef.current);
    }
    saveIndicatorTimerRef.current = window.setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1400);
  };

  const applyFormatting = (format: keyof ActiveRichTextFormats) => {
    if (!editorInstance) return;

    const chain = editorInstance.chain().focus();
    if (format === "bold") {
      chain.toggleBold().run();
      return;
    }
    if (format === "italic") {
      chain.toggleItalic().run();
      return;
    }
    if (format === "underline") {
      chain.toggleUnderline().run();
      return;
    }
    if (format === "bullet") {
      chain.toggleBulletList().run();
      return;
    }
    chain.toggleOrderedList().run();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim() || !currentEssayId) return;
    
    setIsCreatingShare(true);
    setShareError(null);
    setShareLinkCopyState('idle');
    setShareLinkCopyMessage('');
    
    try {
      // Create the share link using the mutation with permission level
      const result = await createShareMutation({
        essayId: currentEssayId as Id<"essays">,
        permission: sharePermission,
        recipientEmail: shareEmail.trim(),
        recipientType: shareRecipientType,
      });
      
      // Generate the full share URL
      const shareUrl = `${window.location.origin}/share/${result.token}`;
      setGeneratedShareLink(shareUrl);
      
      // Copy to clipboard automatically
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareLinkCopyState('copied');
        setShareLinkCopyMessage('Copied to clipboard automatically.');
      } catch (clipboardError) {
        console.error('Auto-copy failed:', clipboardError);
        setShareLinkCopyState('error');
        setShareLinkCopyMessage('Could not auto-copy. Use the copy button.');
      }
      
      setIsShareSent(true);
      
      // Keep the dialog open longer so user can see/copy the link
      setTimeout(() => {
        closeShareDialog();
      }, 5000);
    } catch (error) {
      console.error('Failed to create share link:', error);
      setShareError('Failed to create share link. Please try again.');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!generatedShareLink) return;

    try {
      await navigator.clipboard.writeText(generatedShareLink);
      setShareLinkCopyState('copied');
      setShareLinkCopyMessage('Link copied to clipboard.');
    } catch (error) {
      console.error('Manual copy failed:', error);
      setShareLinkCopyState('error');
      setShareLinkCopyMessage('Copy failed. Select the link and copy manually.');
    }
  };

  const resetShareDialogState = () => {
    setShareEmail('');
    setSharePermission('view');
    setShareError(null);
    setGeneratedShareLink(null);
    setShareLinkCopyState('idle');
    setShareLinkCopyMessage('');
    setIsShareSent(false);
  };

  const closeShareDialog = () => {
    setShowShareDialog(false);
    resetShareDialogState();
  };

  const dismissShareDialogIfAllowed = () => {
    if (!isShareSent && !isCreatingShare) {
      closeShareDialog();
    }
  };

  const handleMaximizeEditor = () => {
    setIsEditorMinimized(false);
  };

  const smartReuseExcerpts: ReusableExcerpt[] = useMemo(() => {
    if (!currentEssay || !currentCollege) return [];
    return mapSmartReuseExcerpts({
      reuseSuggestions,
      dismissedExcerpts,
      currentEssayId: currentEssay.id,
      currentCollegeId: currentCollege.id,
      excerptUsages,
    });
  }, [currentEssay, currentCollege, reuseSuggestions, dismissedExcerpts, excerptUsages]);

  // Handle inserting excerpt as reference
  const handleInsertAsReference = (excerpt: ReusableExcerpt) => {
    if (!currentCollege || !currentEssay) return;

    // Track the usage
    setExcerptUsages(prev => [
      ...prev,
      {
        excerptId: excerpt.id,
        targetCollegeId: currentCollege.id,
        targetCollegeName: currentCollege.name,
        targetEssayId: currentEssay.id,
        targetEssayTitle: currentEssay.title
      }
    ]);

    // Add to inserted references
    setInsertedReferences(prev => [
      ...prev,
      {
        id: `ref-${Date.now()}`,
        excerptId: excerpt.id,
        text: excerpt.excerpt,
        sourceName: `${excerpt.sourceCollegeName} — ${excerpt.sourceEssayTitle}`
      }
    ]);
  };

  // Handle dismissing an excerpt
  const handleDismissExcerpt = (excerptId: string) => {
    if (!currentEssay) return;
    setDismissedExcerpts(prev => new Set(prev).add(`${excerptId}-${currentEssay.id}`));
  };

  // Remove an inserted reference
  const handleRemoveReference = (refId: string) => {
    setInsertedReferences(prev => prev.filter(r => r.id !== refId));
  };

  // Personal Lens handlers
  const handleAddPersonalLensNote = async () => {
    if (!newNoteContent.trim()) return;
    await addLensNoteMutation({
      content: newNoteContent.trim(),
      category: newNoteCategory,
    });
    setNewNoteContent('');
    setNewNoteCategory('moment');
  };

  const handleDeletePersonalLensNote = async (noteId: string) => {
    await deleteLensNoteMutation({ id: noteId as Id<"personalLensNotes"> });
  };

  const handleEditPersonalLensNote = (noteId: string) => {
    const note = personalLensNotes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteContent(note.content);
    }
  };

  const handleSaveEditedNote = async () => {
    if (!editingNoteId || !editingNoteContent.trim()) return;
    await updateLensNoteMutation({
      id: editingNoteId as Id<"personalLensNotes">,
      content: editingNoteContent.trim(),
    });
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleOpenPersonalLens = () => {
    setWorkspaceTab('personal-lens');
  };

  const getCategoryLabel = (category: PersonalLensNote['category']) => {
    return PERSONAL_LENS_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  // Generate story suggestions from a Personal Lens note
  const handleGenerateSuggestionsFromNote = async (note: PersonalLensNote) => {
    try {
      if (currentPromptId) {
        const result = await generateSuggestionsAction({
          promptId: currentPromptId as Id<"prompts">,
          essayContent: `Context: This user has a personal lens note about: ${note.content} (Category: ${note.category}). Current essay content: ${stripRichTextFormatting(content) || "(not started)"}`,
        });

        const suggestions = result?.suggestions || [];
        for (const s of suggestions) {
          const newSuggestion: GeneratedSuggestion = {
            id: `gen-${Date.now()}-${Math.random()}`,
            noteId: note.id,
            noteContent: note.content,
            suggestion: s.whyItFitsThisPrompt || "No suggestion generated.",
            matchStrength: s.matchStrength || 'strong',
          };
          setGeneratedSuggestions(prev => [...prev, newSuggestion]);
        }
      }
    } catch (e) {
      console.error("Failed to generate suggestion", e);
    }
  };

  // Dismiss a story suggestion
  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  };

  // Dismiss an experience-based suggestion
  const handleDismissExperienceSuggestion = (experienceId: string) => {
    if (!currentEssay) return;
    setDismissedSuggestions(prev => new Set(prev).add(`exp-${experienceId}-${currentEssay.id}`));
  };

  const handleGeneratePromptStrategy = async () => {
    if (!currentPromptId) return;
    setIsGeneratingStrategy(true);
    setStrategyError(null);
    strategyAttempts.current.add(currentPromptId);
    try {
      await generatePromptStrategyAction({ promptId: currentPromptId as Id<"prompts"> });
    } catch (error) {
      console.error("Failed to generate prompt strategy:", error);
      setStrategyError("Unable to generate strategy right now.");
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!currentEssayId) return;
    setIsGeneratingFeedback(true);
    setFeedbackError(null);
    try {
      const result = await generateEssayFeedbackAction({
        essayId: currentEssayId as Id<"essays">,
        feedbackType,
      });
      setFeedbackResult(result);
    } catch (error) {
      console.error("Failed to generate feedback:", error);
      setFeedbackError("Unable to generate feedback right now.");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    if (!currentEssayId || !version.content) return;
    try {
      await restoreVersionMutation({
        essayId: currentEssayId as Id<"essays">,
        versionId: version.id as Id<"essayVersions">,
      });
      setContent(version.content);
      editorInstance?.commands.setContent(parseStoredRichTextToDoc(version.content));
      setShowVersionHistory(false);
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  // Show smart reuse when there are suggestions (for essays with same prompt type, we show early)
  const hasWrittenContent = stripRichTextFormatting(content).trim().length > 50;
  const hasSameTypeExcerpts = smartReuseExcerpts.some(e => e.matchesSamePromptType);
  const showSmartReuse = (hasWrittenContent || hasSameTypeExcerpts) && smartReuseExcerpts.length > 0;

  // Prompt editing handlers
  const handleStartEditingPrompt = () => {
    if (!currentEssay) return;
    setEditedPromptText(currentEssay.prompt);
    setEditedWordLimit(String(currentEssay.wordLimit));
    setPromptEditError(null);
    setIsEditingPrompt(true);
  };

  const handleCancelPromptEdit = () => {
    setIsEditingPrompt(false);
    setPromptEditError(null);
  };

  const handleSavePromptEdit = async () => {
    if (!currentPromptId || !currentEssay) return;
    const nextPromptText = editedPromptText.trim();
    const parsedWordLimit = Number.parseInt(editedWordLimit, 10);

    if (!nextPromptText) {
      setPromptEditError('Prompt text is required.');
      return;
    }
    if (!Number.isFinite(parsedWordLimit) || parsedWordLimit < 50 || parsedWordLimit > 2000) {
      setPromptEditError('Word limit must be between 50 and 2000.');
      return;
    }

    const unchanged =
      nextPromptText === currentEssay.prompt && parsedWordLimit === currentEssay.wordLimit;
    if (unchanged) {
      setIsEditingPrompt(false);
      setPromptEditError(null);
      return;
    }

    setIsUpdatingPrompt(true);
    setPromptEditError(null);
    try {
      await updatePromptMutation({
        promptId: currentPromptId as Id<"prompts">,
        text: nextPromptText,
        wordCountMax: parsedWordLimit,
      });
      setIsEditingPrompt(false);
      setFeedbackResult(null);
      setFeedbackError(null);
      strategyAttempts.current.delete(currentPromptId);
    } catch (error) {
      console.error('Failed to update prompt:', error);
      setPromptEditError('Unable to save prompt changes right now.');
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleDeletePrompt = () => {
    // In a real app, this would delete the prompt from the backend
    // For now, close the dialog and deselect the essay
    setShowDeletePromptDialog(false);
    setActiveEssay(null);
    setIsEditorMinimized(false);
  };

  const handleLogoClick = () => {
    setActiveEssay(null);
    setIsEditorMinimized(false);
    onLogoClick?.();
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* GLOBAL HEADER - Lightweight, persistent */}
      <header className="h-12 bg-card/80 backdrop-blur-md shadow-sm flex-shrink-0 z-30 relative">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: LaunchPad logo/name - clicking returns to dashboard */}
          <div data-tour="logo-button">
            <ColleeLogo
              size="sm"
              onClick={handleLogoClick}
            />
          </div>

          {/* Center: Context label (only when writing) */}
          {activeEssay && currentCollege && !isEditorMinimized && (
            <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground">
              <span>Writing</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="font-medium text-foreground">{currentCollege.name}</span>
            </div>
          )}

          {/* Right: Theme toggle + Profile dropdown */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <User className="w-4 h-4 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="cursor-pointer" onClick={resetOnboarding}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Take the tour again
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={onEditStoryIdentity}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Story Identity
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Editor preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setShowShareDialog(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Sharing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-muted-foreground" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Gradient bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - College Map (collapsible when editing) */}
        <AnimatePresence initial={false}>
          {(showLeftPanel || isEditorMinimized || !activeEssay) && (
            <motion.aside
              data-tour="colleges-panel"
              className={`border-r border-border bg-card/50 flex flex-col overflow-hidden ${isEditorMinimized || !activeEssay ? 'flex-1' : 'w-80 flex-shrink-0'
                }`}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: isEditorMinimized || !activeEssay ? '100%' : 320,
                opacity: 1
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {viewMode === 'cards' ? (
                        <MapPin className="w-4 h-4 text-primary" />
                      ) : (
                        <Calendar className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-body font-semibold text-foreground">
                        {viewMode === 'cards' ? 'Your Colleges' : 'Deadline Calendar'}
                      </h1>
                      <p className="text-body-sm text-muted-foreground">
                        {viewMode === 'cards' ? 'Click to expand • click essay to write' : 'Overview of upcoming deadlines'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* View Mode Toggle */}
                    <div data-tour="calendar-toggle" className="flex items-center bg-muted rounded-lg p-0.5 mr-1">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        title="Card view"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        title="Calendar view"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Maximize button when editor minimized */}
                    {isEditorMinimized && activeEssay && (
                      <button
                        onClick={handleMaximizeEditor}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Return to writing"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* Collapse button - only show when editor is open */}
                    {activeEssay && !isEditorMinimized && (
                      <button
                        onClick={() => setShowLeftPanel(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Collapse panel"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* College List with Card Layout OR Calendar View */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {viewMode === 'calendar' ? (
                  /* Calendar View */
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Simple calendar grid showing deadlines */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Generate calendar days - showing a month view */}
                      {Array.from({ length: 35 }, (_, i) => {
                        const dayNumber = i - 3; // Offset to start on correct weekday
                        const isValidDay = dayNumber >= 1 && dayNumber <= 31;

                        // Find colleges with deadlines on this day
                        const collegesOnDay = colleges.filter(c => {
                          if (!c.deadline) return false;
                          const dayMatch = c.deadline.match(/\d+/);
                          return dayMatch && parseInt(dayMatch[0]) === dayNumber;
                        });

                        return (
                          <div
                            key={i}
                            className={`min-h-[80px] p-1.5 rounded-lg border transition-colors ${isValidDay
                                ? collegesOnDay.length > 0
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-border bg-card hover:bg-muted/50'
                                : 'border-transparent bg-transparent'
                              }`}
                          >
                            {isValidDay && (
                              <>
                                <span className={`text-xs font-medium ${collegesOnDay.length > 0 ? 'text-primary' : 'text-muted-foreground'
                                  }`}>
                                  {dayNumber}
                                </span>
                                {collegesOnDay.length > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {collegesOnDay.map(college => (
                                      <div
                                        key={college.id}
                                        className="px-1.5 py-0.5 rounded bg-primary/20 text-xs text-primary truncate"
                                        title={college.name}
                                      >
                                        {college.name.length > 10 ? college.name.substring(0, 10) + '...' : college.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
                        <span>Deadline</span>
                      </div>
                    </div>

                    {/* Upcoming list */}
                    <div className="mt-8">
                      <h3 className="text-body-sm font-medium text-foreground mb-3">Upcoming Deadlines</h3>
                      <div className="space-y-2">
                        {colleges
                          .filter(c => c.deadline)
                          .sort((a, b) => {
                            const aDay = parseInt(a.deadline?.match(/\d+/)?.[0] || '99');
                            const bDay = parseInt(b.deadline?.match(/\d+/)?.[0] || '99');
                            return aDay - bDay;
                          })
                          .map(college => (
                            <div
                              key={college.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isDeadlineApproaching(college.deadline) ? 'bg-amber-500' : 'bg-primary'
                                  }`} />
                                <span className="text-body-sm font-medium text-foreground">{college.name}</span>
                              </div>
                              <span className={`text-body-sm ${isDeadlineApproaching(college.deadline) ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                                }`}>
                                {college.deadline}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Card View */
                  <div className={`${isEditorMinimized || !activeEssay
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto'
                      : 'space-y-3'
                    }`}>
                    {colleges.map((college) => {
                      const deadlineApproaching = isDeadlineApproaching(college.deadline);
                      const essaySnapshot = getEssaySnapshot(college.essays);
                      const [essayCount, essayStatus] = essaySnapshot.split(' • ');

                      return (
                        <div
                          key={college.id}
                          className={`rounded-2xl border overflow-hidden transition-all ${deadlineApproaching
                              ? 'border-amber-200/80 dark:border-amber-800/40'
                              : 'border-border hover:border-primary/30 hover:shadow-md'
                            } bg-card ${isEditorMinimized || !activeEssay ? 'h-fit' : ''}`}
                        >
                          {/* College Card Content */}
                          {isEditorMinimized || !activeEssay ? (
                            // Expanded Card View
                            <div className="p-5">
                              {/* College Name */}
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {college.name}
                              </h3>

                              {/* Deadline */}
                              {college.deadline && (
                                <div className={`flex items-center gap-2 mb-3 ${deadlineApproaching ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                  {deadlineApproaching ? (
                                    <>
                                      <div className="relative flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                                      </div>
                                      <span className="text-body-sm font-medium">
                                        Due soon · {college.deadline}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4 text-muted-foreground/60" />
                                      <span className="text-body-sm">
                                        Due {college.deadline}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Essay Summary */}
                              <p className="text-body text-muted-foreground mb-5">
                                {essayCount} • {essayStatus}
                              </p>

                              {/* Action Button */}
                              <Button
                                variant="collee"
                                size="sm"
                                data-tour="college-card"
                                onClick={() => {
                                  toggleCollegeExpanded(college.id);
                                  // Select first essay and open editor
                                  if (college.essays.length > 0) {
                                    handleSelectEssay(college.id, college.essays[0].id);
                                    setIsEditorMinimized(false);
                                  }
                                }}
                                className="w-full"
                              >
                                Open essays
                              </Button>
                            </div>
                          ) : (
                            // Compact Sidebar View (when editor is open)
                            <>
                              <button
                                data-tour="college-card"
                                onClick={() => toggleCollegeExpanded(college.id)}
                                className="w-full p-3 text-left hover:bg-muted/50 hover:shadow-soft transition-all"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-body-sm font-medium text-foreground truncate">
                                      {college.name}
                                    </h3>
                                    <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${deadlineApproaching ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                      {deadlineApproaching && (
                                        <div className="relative flex items-center justify-center">
                                          <Clock className="w-3 h-3" />
                                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        </div>
                                      )}
                                      {college.deadline && (
                                        <span className={deadlineApproaching ? 'font-medium' : ''}>
                                          {deadlineApproaching ? `Due soon · ${college.deadline}` : `Due ${college.deadline}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {essayCount}
                                    </span>
                                    {expandedColleges.has(college.id) ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                {!expandedColleges.has(college.id) && (
                                  <p className="text-xs text-muted-foreground/70 mt-1">
                                    {essayStatus}
                                  </p>
                                )}
                              </button>

                              {/* Expanded Essays - Inline */}
                              <AnimatePresence>
                                {expandedColleges.has(college.id) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                                      {college.essays.map((essay) => (
                                        <button
                                          key={essay.id}
                                          onClick={() => {
                                            handleSelectEssay(college.id, essay.id);
                                            setIsEditorMinimized(false);
                                          }}
                                          className={`w-full p-2.5 rounded-lg text-left transition-all ${activeEssay?.essayId === essay.id
                                              ? 'bg-primary/10 border border-primary/30 border-l-2 border-l-primary'
                                              : 'hover:bg-muted/50 border border-transparent'
                                            }`}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getStatusDot(essay.status)}`} />
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-body-sm font-medium truncate ${activeEssay?.essayId === essay.id ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                {essay.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {essay.prompt}
                                              </p>
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Add College Button */}
                    <div className={isEditorMinimized || !activeEssay ? 'md:col-span-2 max-w-md mx-auto w-full' : ''}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddCollege}
                        className="w-full mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add a college
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border">
                <p className="text-xs text-center text-muted-foreground/60">
                  Take your time. You're making progress.
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed Left Panel - expand button */}
        {!showLeftPanel && activeEssay && !isEditorMinimized && (
          <div className="flex-shrink-0 border-r border-border bg-card/50">
            <button
              onClick={() => setShowLeftPanel(true)}
              className="p-3 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Show colleges"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CENTER - Essay Workspace (hidden when minimized) */}
        {activeEssay && currentEssay && !isEditorMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header Bar with Tabs */}
            <motion.header
              className="border-b border-border bg-card/80 backdrop-blur-md shadow-sm flex-shrink-0 z-20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Back to colleges button - prominent and clear */}
                  <button
                    data-tour="back-to-colleges"
                    onClick={() => {
                      setActiveEssay(null);
                      setIsEditorMinimized(false);
                      setWorkspaceTab('write');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-body-sm font-medium">Your Colleges</span>
                  </button>
                  <div className="h-5 w-px bg-border" />
                  <div>
                    <p className="text-body font-medium text-foreground line-clamp-1 max-w-[32rem]">
                      {currentEssay?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save Status - only show in Write tab */}
                  {workspaceTab === 'write' && (
                    <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground mr-2">
                      {isSaving ? (
                        <span className="animate-pulse-gentle text-primary">Saving...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span>Saved {formatTime(lastSaved)}</span>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Version history"
                  >
                    <History className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      if (currentEssay && currentCollege) {
                        onExport({
                          essayTitle: currentEssay.title,
                          collegeName: currentCollege.name,
                          collegeId: currentCollege.id,
                          wordCount: wordCount,
                          essayContent: stripRichTextFormatting(content),
                          essayId: currentEssay.id,
                        });
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Export"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Workspace Tabs - Write / Personal Lens */}
              <div className="px-4 pb-0">
                <Tabs value={workspaceTab} onValueChange={(v) => setWorkspaceTab(v as 'write' | 'personal-lens')}>
                  <TabsList className="bg-transparent p-0 h-auto gap-4">
                    <TabsTrigger
                      value="write"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                    >
                      <PenLine className="w-4 h-4 mr-1.5" />
                      Write
                    </TabsTrigger>
                    <TabsTrigger
                      value="personal-lens"
                      data-tour="personal-lens-tab"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                    >
                      <Heart className="w-4 h-4 mr-1.5" />
                      Personal Lens
                      {personalLensNotes.length > 0 && (
                        <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{personalLensNotes.length}</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </motion.header>

	            {/* Main Content Area - Switch between Write and Personal Lens */}
	            <div className="flex-1 flex overflow-hidden">
	              {workspaceTab === 'personal-lens' && (
	                <PersonalLensWorkspace
	                  personalLensNotes={personalLensNotes}
	                  newNoteContent={newNoteContent}
	                  newNoteCategory={newNoteCategory}
	                  editingNoteId={editingNoteId}
	                  editingNoteContent={editingNoteContent}
	                  generatedSuggestions={generatedSuggestions}
	                  getCategoryLabel={getCategoryLabel}
	                  onNewNoteCategoryChange={setNewNoteCategory}
	                  onNewNoteContentChange={setNewNoteContent}
	                  onAddNote={handleAddPersonalLensNote}
	                  onEditNote={handleEditPersonalLensNote}
	                  onDeleteNote={handleDeletePersonalLensNote}
	                  onEditingNoteContentChange={setEditingNoteContent}
	                  onCancelEdit={() => {
	                    setEditingNoteId(null);
	                    setEditingNoteContent('');
	                  }}
	                  onSaveEditedNote={handleSaveEditedNote}
	                  onGenerateSuggestions={(note) => void handleGenerateSuggestionsFromNote(note)}
	                />
	              )}

	              {workspaceTab === 'write' && (
	                <WriteWorkspace
	                  activeFormats={activeFormats}
	                  applyFormatting={applyFormatting}
	                  showRightPanel={showRightPanel}
	                  onToggleRightPanel={() => setShowRightPanel((prev) => !prev)}
	                  isEditingPrompt={isEditingPrompt}
	                  isUpdatingPrompt={isUpdatingPrompt}
	                  editedPromptText={editedPromptText}
	                  editedWordLimit={editedWordLimit}
	                  promptEditError={promptEditError}
	                  onStartEditingPrompt={handleStartEditingPrompt}
	                  onCancelPromptEdit={handleCancelPromptEdit}
	                  onSavePromptEdit={() => void handleSavePromptEdit()}
	                  onEditedPromptTextChange={setEditedPromptText}
	                  onEditedWordLimitChange={setEditedWordLimit}
	                  insertedReferences={insertedReferences}
	                  onRemoveReference={handleRemoveReference}
	                  showStarterHelper={showStarterHelper}
	                  onDismissStarterHelper={() => setShowStarterHelper(false)}
	                  hasPendingExternalReset={hasPendingExternalReset}
	                  currentEssay={currentEssay}
	                  currentEssayId={currentEssayId}
	                  currentSyncDocumentId={currentSyncDocumentId}
	                  editorSyncKey={editorSyncKey}
	                  content={content}
	                  onEditorContentChange={handleEditorContentChange}
	                  onFormatsChange={setActiveFormats}
	                  onEditorInstanceChange={setEditorInstance}
	                  wordCount={wordCount}
	                  wordLimit={wordLimit}
	                  isOverLimit={isOverLimit}
	                  rightPanelProps={{
	                    show: showRightPanel,
	                    generatedSuggestions,
	                    dismissedSuggestions,
	                    onDismissSuggestion: handleDismissSuggestion,
	                    currentEssay,
	                    currentEssayId,
	                    currentCollege,
	                    currentPromptId,
	                    promptStrategy,
	                    isGeneratingStrategy,
	                    strategyError,
	                    onGeneratePromptStrategy: () => void handleGeneratePromptStrategy(),
	                    experienceSuggestions,
	                    selectedExperience,
	                    lockedExperience,
	                    onSelectExperience: setSelectedExperience,
	                    onLockExperience: setLockedExperience,
	                    onDismissExperienceSuggestion: handleDismissExperienceSuggestion,
	                    onOpenPersonalLens: handleOpenPersonalLens,
	                    experienceIndex,
	                    experienceUsageMap,
	                    addExperienceUsage: addExperienceUsageMutation,
	                    editorInstance,
	                    onSetContent: setContent,
	                    onShowStarterHelper: setShowStarterHelper,
	                    feedbackType,
	                    onFeedbackTypeChange: setFeedbackType,
	                    onGenerateFeedback: () => void handleGenerateFeedback(),
	                    isGeneratingFeedback,
	                    feedbackError,
	                    displayedFeedback,
	                    reviewerComments,
	                    onResolveComment: (commentId) => void resolveCommentAsOwnerMutation({ commentId }),
	                    onAddOwnerReply: (commentId, contentValue) =>
	                      addOwnerReplyMutation({ commentId, content: contentValue }),
	                    showSmartReuse,
	                    smartReuseExcerpts,
	                    onInsertAsReference: handleInsertAsReference,
	                    onDismissExcerpt: handleDismissExcerpt,
	                  }}
	                />
	              )}
	            </div>
          </div>
        )}
      </div>

      <VersionHistoryDrawer
        isOpen={showVersionHistory}
        previewVersion={previewVersion}
        versions={versionsForDisplay}
        onClose={() => setShowVersionHistory(false)}
        onPreview={setPreviewVersion}
        onRestore={handleRestoreVersion}
      />

      <ShareDialog
        isOpen={showShareDialog}
        isShareSent={isShareSent}
        isCreatingShare={isCreatingShare}
        shareEmail={shareEmail}
        shareRecipientType={shareRecipientType}
        sharePermission={sharePermission}
        generatedShareLink={generatedShareLink}
        shareLinkCopyState={shareLinkCopyState}
        shareLinkCopyMessage={shareLinkCopyMessage}
        shareError={shareError}
        currentEssayId={currentEssayId}
        onShareEmailChange={setShareEmail}
        onShareRecipientTypeChange={setShareRecipientType}
        onSharePermissionChange={setSharePermission}
        onCopyShareLink={handleCopyShareLink}
        onSubmit={handleShareSubmit}
        onDismissIfAllowed={dismissShareDialogIfAllowed}
        onCloseAndReset={closeShareDialog}
      />

      <DeletePromptDialog
        isOpen={showDeletePromptDialog}
        onClose={() => setShowDeletePromptDialog(false)}
        onDelete={handleDeletePrompt}
      />

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default ColleeWorkspace;
