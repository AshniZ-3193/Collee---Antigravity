import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

interface ColleeWorkspaceProps {
  onAddCollege: () => void;
  onExport: (data: ExportData) => void;
  onEditStoryIdentity?: () => void;
  onLogoClick?: () => void;
  onLogout?: () => void;
}

// ===== MAIN COMPONENT =====
const ColleeWorkspace: React.FC<ColleeWorkspaceProps> = ({
  onAddCollege,
  onExport,
  onEditStoryIdentity,
  onLogoClick,
  onLogout,
}) => {
  // Convex queries
  const convexColleges = useQuery(api.colleges.list, {}) ?? [];
  const storyIdentityData = useQuery(api.storyIdentity.get, {});
  const convexLensNotes = useQuery(api.personalLens.list, {}) ?? [];
  const addLensNoteMutation = useMutation(api.personalLens.add);
  const updateLensNoteMutation = useMutation(api.personalLens.update);
  const deleteLensNoteMutation = useMutation(api.personalLens.remove);
  const createShareMutation = useMutation(api.shares.create);
  const generateSuggestionsAction = useAction(api.ai.generateSuggestions.generate);
  const generatePromptStrategyAction = useAction(api.ai.generatePromptStrategy.generate);
  const generateEssayFeedbackAction = useAction(api.ai.generateEssayFeedback.generate);
  const restoreVersionMutation = useMutation(api.essays.restoreVersion);
  const addExperienceUsageMutation = useMutation(api.experienceBank.addUsage);
  const experienceUsages = useQuery(api.experienceBank.getUsages) ?? [];
  
  // Comments from reviewers
  const addOwnerReplyMutation = useMutation(api.shares.addOwnerReply);
  const resolveCommentAsOwnerMutation = useMutation(api.shares.resolveCommentAsOwner);
  // ProseMirror sync reset (for external changes from share links)
  const resetSyncDocumentMutation = useMutation(api.prosemirror.resetDocument);

  // Transform Convex data to match existing UI types
  const colleges: College[] = useMemo(() => {
    return convexColleges.map((c: any) => ({
      id: c._id,
      name: c.name,
      applicationType: c.applicationType,
      deadline: c.deadline,
      essays: c.prompts.map((p: any) => ({
        id: p.essay?._id || p._id,
        promptId: p._id,
        title: p.text.length > 50 ? p.text.substring(0, 50) + '...' : p.text,
        prompt: p.text,
        status: (p.essay?.status || 'not-started') as Essay['status'],
        wordCount: p.essay?.wordCount || 0,
        wordLimit: p.wordCountMax,
        content: p.essay?.content || '',
        promptType: p.promptType,
        lastUpdated: p.essay?.lastUpdated,
      })),
    }));
  }, [convexColleges]);

  const experienceIndex = useMemo(() => {
    const map = new Map<string, { name: string; tags: string[] }>();
    (storyIdentityData?.experiences || []).forEach((experience: any) => {
      map.set(experience._id, {
        name: experience.name,
        tags: experience.tags,
      });
    });
    return map;
  }, [storyIdentityData]);

  const experienceUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    experienceUsages.forEach((usage: any) => {
      const current = map.get(usage.experienceId) ?? [];
      current.push(usage.essayId);
      map.set(usage.experienceId, current);
    });
    return map;
  }, [experienceUsages]);

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
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [lockedExperience, setLockedExperience] = useState<string | null>(null);
  const strategyAttempts = useRef<Set<string>>(new Set());
  const deferredOnboardingRef = useRef(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('overall');
  const [feedbackResult, setFeedbackResult] = useState<any | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  // Smart Reuse state
  const [excerptUsages, setExcerptUsages] = useState<ExcerptUsageRecord[]>([]);
  const [dismissedExcerpts, setDismissedExcerpts] = useState<Set<string>>(new Set());
  const [insertedReferences, setInsertedReferences] = useState<{ id: string; excerptId: string; text: string; sourceName: string }[]>([]);

  // Starter text state - tracks when starter sentences were added
  const [showStarterHelper, setShowStarterHelper] = useState(false);

  // Prompt action state
  const [showDeletePromptDialog, setShowDeletePromptDialog] = useState(false);

  // Workspace tab state: 'write' or 'personal-lens'
  const [workspaceTab, setWorkspaceTab] = useState<'write' | 'personal-lens'>('write');

  // Personal Lens notes - from Convex
  const personalLensNotes: PersonalLensNote[] = useMemo(() => {
    return convexLensNotes.map((n: any) => ({
      id: n._id,
      content: n.content,
      category: n.category as PersonalLensNote['category'],
      createdAt: new Date(n._creationTime),
    }));
  }, [convexLensNotes]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<PersonalLensNote['category']>('moment');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const [generatedSuggestions, setGeneratedSuggestions] = useState<GeneratedSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

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
  const currentPromptId = currentEssay?.promptId;
  const isDocumentAreaActive = Boolean(activeEssay && currentEssay && !isEditorMinimized);
  const promptStrategy = useQuery(
    api.ai.promptStrategy.getForPrompt,
    currentPromptId ? { promptId: currentPromptId as Id<"prompts"> } : "skip"
  );
  const reuseSuggestions = useQuery(
    api.experienceBank.getReuseSuggestions,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  ) ?? [];
  const essayVersions = useQuery(
    api.essays.getVersions,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  ) ?? [];
  const essayFeedback = useQuery(
    api.ai.essayFeedback.getForEssay,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  ) ?? [];
  const reviewerComments = useQuery(
    api.shares.getCommentsForEssay,
    currentEssayId ? { essayId: currentEssayId as Id<"essays"> } : "skip"
  ) ?? [];
  const wordLimit = currentEssay?.wordLimit || 650;
  const wordCount = countRichTextWords(content);
  const isOverLimit = wordCount > wordLimit;
  const { editorSyncKey, markLocalEdit, markLoadedEssayVersion } = useEssaySync({
    currentEssayId,
    essayContent: currentEssay?.content,
    essayLastUpdated: currentEssay?.lastUpdated,
    localContent: content,
    setLocalContent: setContent,
    resetSyncDocument: resetSyncDocumentMutation,
  });

  const experienceSuggestions: (StoryExperience & { guidance: PromptFitGuidance })[] = useMemo(() => {
    if (!promptStrategy?.experienceMatches) return [];
    return promptStrategy.experienceMatches.map((match: any) => {
      const experience = experienceIndex.get(match.experienceId);
      const usedIn = experienceUsageMap.get(match.experienceId) ?? [];
      return {
        id: match.experienceId,
        name: experience?.name || match.experienceName || "Experience",
        tags: experience?.tags || [],
        usedIn,
        guidance: {
          matchStrength: match.matchStrength || 'moderate',
          whyItFits: match.whyItFits || '',
          framingTips: match.framingTips || [],
          caution: match.caution,
          startWith: match.startWith,
          focusOn: match.focusOn,
          avoidFocus: match.avoidFocus,
          starterSentences: match.starterSentences,
        },
      };
    });
  }, [promptStrategy, experienceIndex, experienceUsageMap]);

  const versionsForDisplay: Version[] = useMemo(() => {
    return essayVersions.map((version: any) => {
      const plainVersionContent = stripRichTextFormatting(version.content ?? "");
      const previewText = plainVersionContent.length > 120
        ? `${plainVersionContent.substring(0, 120)}...`
        : plainVersionContent;
      const timestamp = new Date(version.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      return {
        id: version._id,
        timestamp,
        wordCount: version.wordCount,
        preview: previewText,
        content: version.content,
        isCurrent: version.content === currentEssay?.content,
      };
    });
  }, [essayVersions, currentEssay?.content]);

  const feedbackForType = useMemo(() => {
    if (!essayFeedback) return [];
    return essayFeedback.filter((entry: any) => entry.feedbackType === feedbackType);
  }, [essayFeedback, feedbackType]);

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
    setSelectedExperience(null);
    setLockedExperience(null);
    setShowStarterHelper(false);
    setFeedbackResult(null);
    setFeedbackError(null);
    setStrategyError(null);
    setPreviewVersion(null);
    setGeneratedSuggestions([]);
    setEditorInstance(null);
  }, [currentEssayId]);

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
  }, [currentPromptId, promptStrategy, generatePromptStrategyAction]);

  useEffect(() => {
    setFeedbackResult(null);
    setFeedbackError(null);
  }, [feedbackType]);

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

  // Smart Reuse: Get matching excerpts for current prompt (cross-school only)
  const getSmartReuseExcerpts = () => {
    if (!currentEssay || !currentCollege) return [];
    const themeLabels: Record<string, string> = {
      responsibility: 'responsibility',
      impact: 'meaningful impact',
      decision: 'decision-making',
      growth: 'personal growth',
      failure: 'learning from setbacks',
      resilience: 'resilience',
      leadership: 'leadership',
      challenge: 'facing challenges',
      setback: 'overcoming setbacks',
      community: 'community focus',
      contribution: 'contribution',
      purpose: 'sense of purpose',
      intellectual: 'intellectual curiosity',
      curiosity: 'curiosity',
      interdisciplinary: 'interdisciplinary thinking',
      identity: 'identity',
      culture: 'culture',
      service: 'service',
      family: 'family',
      values: 'values',
    };

    return reuseSuggestions
      .filter((suggestion: any) => {
        if (dismissedExcerpts.has(`${suggestion.excerptId}-${currentEssay.id}`)) return false;
        return true;
      })
      .map((suggestion: any) => {
        const sameSchoolReuse = excerptUsages.find(u =>
          u.excerptId === suggestion.excerptId &&
          u.targetCollegeId === currentCollege.id &&
          u.targetEssayId !== currentEssay.id
        );

        const overlapThemes = suggestion.overlapThemes || [];
        const hasSamePromptType = !!suggestion.matchesSamePromptType;
        let whyItWorks = "This excerpt aligns with the prompt themes you're working with.";

        if (hasSamePromptType) {
          whyItWorks = `This is from another "${suggestion.promptType === 'why-college' ? 'Why This School' : suggestion.promptType}" essay. The framing and insights may transfer well.`;
        } else if (overlapThemes.length > 0) {
          const descriptions = overlapThemes.slice(0, 2).map((t: string) => themeLabels[t] || t);
          whyItWorks = descriptions.length === 1
            ? `This excerpt reflects ${descriptions[0]}, which aligns with what this prompt is asking.`
            : `This excerpt reflects ${descriptions.join(' and ')}, which aligns with what this prompt is asking.`;
        }

        return {
          id: suggestion.excerptId,
          sourceEssayId: suggestion.sourceEssayId,
          sourceEssayTitle: suggestion.sourceEssayTitle,
          sourceCollegeId: suggestion.sourceCollegeId,
          sourceCollegeName: suggestion.sourceCollegeName,
          excerpt: suggestion.excerpt,
          themes: suggestion.themes || [],
          promptType: suggestion.promptType,
          overlapThemes,
          matchesSamePromptType: hasSamePromptType,
          whyItWorks,
          sameSchoolWarning: sameSchoolReuse
            ? `You've already reused a similar passage for "${sameSchoolReuse.targetEssayTitle}". Consider focusing on a different moment or insight here.`
            : undefined,
        } as ReusableExcerpt;
      })
      .sort((a, b) => {
        if (a.matchesSamePromptType && !b.matchesSamePromptType) return -1;
        if (!a.matchesSamePromptType && b.matchesSamePromptType) return 1;
        if (a.sameSchoolWarning && !b.sameSchoolWarning) return 1;
        if (!a.sameSchoolWarning && b.sameSchoolWarning) return -1;
        return 0;
      });
  };

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

  // Get Smart Reuse suggestions
  const smartReuseExcerpts = getSmartReuseExcerpts();
  // Show smart reuse when there are suggestions (for essays with same prompt type, we show early)
  const hasWrittenContent = stripRichTextFormatting(content).trim().length > 50;
  const hasSameTypeExcerpts = smartReuseExcerpts.some(e => e.matchesSamePromptType);
  const showSmartReuse = (hasWrittenContent || hasSameTypeExcerpts) && smartReuseExcerpts.length > 0;

  // Prompt editing handlers
  const handleStartEditingPrompt = () => {
    if (!currentEssay) return;
    // Prompt editing UI is not yet implemented; this is intentionally a no-op for now.
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
          <ColleeLogo
            size="sm"
            onClick={handleLogoClick}
          />

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
                    <div className="flex items-center bg-muted rounded-lg p-0.5 mr-1">
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
                    <p className="text-body font-medium text-foreground">{currentEssay?.title}</p>
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
              {/* PERSONAL LENS TAB CONTENT */}
              {workspaceTab === 'personal-lens' && (
                <main className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-2xl mx-auto">
                      {/* Personal Lens Header */}
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

                        {/* Value proposition - calm framing */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-body-sm text-foreground leading-relaxed">
                            The more you share here, the more personal and specific your story suggestions will be.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            These notes are optional. Add what feels right — there's no wrong answer.
                          </p>
                        </div>
                      </div>

                      {/* Add New Note */}
                      <div className="mb-8 p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus className="w-4 h-4 text-primary" />
                          <span className="text-body-sm font-medium text-foreground">Add a note</span>
                        </div>

                        {/* Category Selection */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PERSONAL_LENS_CATEGORIES.map(cat => (
                            <button
                              key={cat.value}
                              onClick={() => setNewNoteCategory(cat.value as PersonalLensNote['category'])}
                              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${newNoteCategory === cat.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Note Input */}
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder={PERSONAL_LENS_CATEGORIES.find(c => c.value === newNoteCategory)?.placeholder || 'Write a short note...'}
                          className="min-h-[80px] resize-none mb-3"
                        />

                        <div className="flex justify-end">
                          <Button
                            variant="collee"
                            size="sm"
                            onClick={handleAddPersonalLensNote}
                            disabled={!newNoteContent.trim()}
                          >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Note
                          </Button>
                        </div>
                      </div>

                      {/* Existing Notes */}
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
                                Add a note above, then click "Generate story suggestions" to get personalized writing ideas for your current essay.
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
                                      onChange={(e) => setEditingNoteContent(e.target.value)}
                                      className="min-h-[60px] resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingNoteId(null);
                                          setEditingNoteContent('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="collee"
                                        size="sm"
                                        onClick={handleSaveEditedNote}
                                      >
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
                                        <p className="text-body-sm text-foreground leading-relaxed">
                                          {note.content}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditPersonalLensNote(note.id)}
                                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                          title="Edit"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePersonalLensNote(note.id)}
                                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Generate Story Suggestions Button */}
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <button
                                        onClick={() => handleGenerateSuggestionsFromNote(note)}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                      >
                                        <Wand2 className="w-3.5 h-3.5" />
                                        Generate story suggestions from this note
                                      </button>
                                      {generatedSuggestions.some(s => s.noteId === note.id) && (
                                        <p className="text-xs text-muted-foreground text-center mt-2 italic">
                                          ✓ Suggestions generated — view them in the Write tab
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

                      {/* How it helps - subtle footer */}
                      {personalLensNotes.length > 0 && (
                        <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-body-sm font-medium text-foreground mb-1">
                                These notes improve your suggestions
                              </p>
                              <p className="text-xs text-muted-foreground">
                                When you write essays, we'll reference these notes to give you more tailored story ideas and starting points. You're always in control of what you share.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </main>
              )}

              {/* WRITE TAB CONTENT */}
              {workspaceTab === 'write' && (
                <>
                  {/* Editor */}
                  <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Formatting Toolbar */}
                    <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => applyFormatting('bold')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.bold
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                          title="Bold (Cmd/Ctrl + B)"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => applyFormatting('italic')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.italic
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                          title="Italic (Cmd/Ctrl + I)"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => applyFormatting('underline')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.underline
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                          title="Underline (Cmd/Ctrl + U)"
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button
                          onClick={() => applyFormatting('bullet')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.bullet
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                          title="Bulleted list"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => applyFormatting('numbered')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.numbered
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                          title="Numbered list"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="hidden md:block text-xs text-muted-foreground">
                          Select text, then format.
                        </p>
                        <button
                          onClick={() => setShowRightPanel(!showRightPanel)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          title={showRightPanel ? 'Hide guidance' : 'Show guidance'}
                        >
                          {showRightPanel ? (
                            <PanelRightClose className="w-4 h-4" />
                          ) : (
                            <PanelRightOpen className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                      <div className="max-w-2xl mx-auto">
                        {/* Prompt Display - Above Editor */}
                        <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt</span>
                              </div>
                              <p className="text-body text-foreground leading-relaxed">
                                {currentEssay?.prompt}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {currentEssay?.wordLimit} words max
                              </span>
                              <button
                                onClick={handleStartEditingPrompt}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit prompt"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {insertedReferences.map((ref) => (
                            <motion.div
                              key={ref.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 relative group"
                            >
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleRemoveReference(ref.id)}
                                  className="p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Remove reference"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-start gap-3">
                                <Quote className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-foreground/80 italic leading-relaxed mb-2">
                                    "{ref.text}"
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    From: {ref.sourceName}
                                  </p>
                                  <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
                                    <Lightbulb className="w-3 h-3" />
                                    This is a starting point — revise or delete freely.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Starter Text Helper */}
                        <AnimatePresence>
                          {showStarterHelper && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                            >
                              <p className="text-xs text-primary flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3" />
                                This is just a starting point — revise freely or delete.
                              </p>
                              <button
                                onClick={() => setShowStarterHelper(false)}
                                className="p-1 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {currentEssayId && (
                          <SyncEssayEditor
                            key={`${currentEssayId}-${editorSyncKey}`}
                            essayId={currentEssayId}
                            initialStoredContent={currentEssay?.content ?? content}
                            onStoredContentChange={handleEditorContentChange}
                            onFormatsChange={setActiveFormats}
                            onEditorChange={setEditorInstance}
                          />
                        )}
                      </div>
                    </div>

                    {/* Footer - Word Count */}
                    <div className="border-t border-border bg-card/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-body font-medium transition-colors duration-300 ${
                          isOverLimit
                            ? 'text-destructive'
                            : wordCount > wordLimit * 0.9
                              ? 'text-amber-600 dark:text-amber-400'
                              : wordCount > wordLimit * 0.5
                                ? 'text-foreground'
                                : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {wordCount}
                        </span>
                        <span className="text-body text-muted-foreground">/ {wordLimit} words</span>
                      </div>
                    </div>
                  </main>

                  <RightPanel
                    show={showRightPanel}
                    generatedSuggestions={generatedSuggestions}
                    dismissedSuggestions={dismissedSuggestions}
                    onDismissSuggestion={handleDismissSuggestion}
                    currentEssay={currentEssay}
                    currentEssayId={currentEssayId}
                    currentCollege={currentCollege}
                    currentPromptId={currentPromptId}
                    promptStrategy={promptStrategy}
                    isGeneratingStrategy={isGeneratingStrategy}
                    strategyError={strategyError}
                    onGeneratePromptStrategy={handleGeneratePromptStrategy}
                    experienceSuggestions={experienceSuggestions}
                    selectedExperience={selectedExperience}
                    lockedExperience={lockedExperience}
                    onSelectExperience={setSelectedExperience}
                    onLockExperience={setLockedExperience}
                    onDismissExperienceSuggestion={handleDismissExperienceSuggestion}
                    onOpenPersonalLens={handleOpenPersonalLens}
                    experienceIndex={experienceIndex}
                    experienceUsageMap={experienceUsageMap}
                    addExperienceUsage={addExperienceUsageMutation}
                    editorInstance={editorInstance}
                    onSetContent={setContent}
                    onShowStarterHelper={setShowStarterHelper}
                    feedbackType={feedbackType}
                    onFeedbackTypeChange={setFeedbackType}
                    onGenerateFeedback={handleGenerateFeedback}
                    isGeneratingFeedback={isGeneratingFeedback}
                    feedbackError={feedbackError}
                    displayedFeedback={displayedFeedback}
                    reviewerComments={reviewerComments}
                    onResolveComment={(commentId) => void resolveCommentAsOwnerMutation({ commentId })}
                    onAddOwnerReply={(commentId, contentValue) =>
                      addOwnerReplyMutation({ commentId, content: contentValue })
                    }
                    showSmartReuse={showSmartReuse}
                    smartReuseExcerpts={smartReuseExcerpts}
                    onInsertAsReference={handleInsertAsReference}
                    onDismissExcerpt={handleDismissExcerpt}
                  />
                </>
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
        isOpen={showOnboarding && isDocumentAreaActive}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default ColleeWorkspace;
