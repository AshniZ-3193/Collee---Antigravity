import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Share2,
  Lightbulb,
  Target,
  FileText,
  X,
  RotateCcw,
  Mail,
  Send,
  CheckCircle,
  Eye,
  Users,
  Shield,
  GraduationCap,
  Pencil,
  MapPin,
  Plus,
  BookOpen,
  Rocket,
  User,
  LogOut,
  Minimize2,
  Maximize2,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Quote,
  Copy,
  XCircle,
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
import { Pencil as EditIcon, Link2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingWalkthrough, { useOnboardingState } from '@/components/OnboardingWalkthrough';

// ===== PERSONAL LENS TYPES =====
interface PersonalLensNote {
  id: string;
  content: string;
  category: 'moment' | 'observation' | 'responsibility' | 'realization' | 'value' | 'shift';
  createdAt: Date;
}

const PERSONAL_LENS_CATEGORIES = [
  { value: 'moment', label: 'A moment', placeholder: 'Describe a specific moment that stuck with you...' },
  { value: 'observation', label: 'Something I noticed', placeholder: 'What have you observed that others might miss?' },
  { value: 'responsibility', label: 'A responsibility', placeholder: 'A duty or commitment you carry...' },
  { value: 'realization', label: 'A realization', placeholder: 'Something you came to understand...' },
  { value: 'value', label: 'What matters to me', placeholder: 'A value or belief that guides you...' },
  { value: 'shift', label: 'A shift in perspective', placeholder: 'How your thinking changed...' },
] as const;

const promptTypes = [
  { value: 'contribution', label: 'Contribution' },
  { value: 'why-major', label: 'Why Major' },
  { value: 'why-college', label: 'Why This College' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'identity', label: 'Identity' },
  { value: 'challenge', label: 'Challenge/Setback' },
  { value: 'other', label: 'Other' },
];

// ===== TYPES =====
interface Essay {
  id: string;
  promptId: string;
  title: string;
  prompt: string;
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
  wordLimit: number;
  content: string;
  promptType?: string; // e.g., 'why-college', 'why-major', 'challenge', 'identity'
}

interface College {
  id: string;
  name: string;
  applicationType?: string;
  deadline?: string;
  essays: Essay[];
}

interface Version {
  id: string;
  timestamp: string;
  wordCount: number;
  preview: string;
  content?: string;
  isCurrent?: boolean;
}

interface LaunchPadWorkspaceProps {
  onAddCollege: () => void;
  onExport: () => void;
  onEditStoryIdentity?: () => void;
  onLogoClick?: () => void;
  onLogout?: () => void;
}

interface StoryExperience {
  id: string;
  name: string;
  tags: string[];
  usedIn: string[];
}

interface PromptFitGuidance {
  matchStrength: 'strong' | 'moderate';
  whyItFits: string;
  framingTips: string[];
  caution?: string;
  startWith?: string;
  focusOn?: string;
  avoidFocus?: string;
  starterSentences?: string[];
}

interface ReusableExcerpt {
  id: string;
  sourceEssayId: string;
  sourceEssayTitle: string;
  sourceCollegeId: string;
  sourceCollegeName: string;
  excerpt: string;
  themes: string[];
  promptType?: string;
  overlapThemes?: string[];
  matchesSamePromptType?: boolean;
  whyItWorks: string;
  sameSchoolWarning?: string;
}

interface ExcerptUsageRecord {
  excerptId: string;
  targetCollegeId: string;
  targetCollegeName: string;
  targetEssayId: string;
  targetEssayTitle: string;
}

type FeedbackType = 'overall' | 'opening' | 'structure' | 'voice' | 'specificity';

// ===== HELPER FUNCTIONS =====
const getEssaySnapshot = (essays: Essay[]): string => {
  const inProgress = essays.filter(e => e.status === 'in-progress').length;
  const complete = essays.filter(e => e.status === 'complete').length;
  const notStarted = essays.filter(e => e.status === 'not-started').length;
  const total = essays.length;

  if (complete === total) return 'All essays drafted';
  if (notStarted === total) return `${total} essays • not started yet`;
  if (inProgress > 0) return `${total} essays • ${inProgress} in progress`;
  return `${total} essays • ${complete} complete`;
};

const getStatusDot = (status: Essay['status']) => {
  switch (status) {
    case 'complete': return 'bg-emerald-500';
    case 'in-progress': return 'bg-primary';
    default: return 'bg-muted-foreground/30';
  }
};

// Check if deadline is approaching (within 14 days)
const isDeadlineApproaching = (deadline?: string): boolean => {
  if (!deadline) return false;
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  const parts = deadline.split(' ');
  if (parts.length !== 2) return false;
  const month = months[parts[0]];
  const day = parseInt(parts[1]);
  if (month === undefined || isNaN(day)) return false;
  const currentYear = new Date().getFullYear();
  const deadlineDate = new Date(currentYear, month, day);
  const now = new Date();
  // If deadline is in the past this year, assume next year
  if (deadlineDate < now) {
    deadlineDate.setFullYear(currentYear + 1);
  }
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 14 && daysUntil >= 0;
};

// ===== MAIN COMPONENT =====
const LaunchPadWorkspace: React.FC<LaunchPadWorkspaceProps> = ({
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
  const saveEssayMutation = useMutation(api.essays.save);
  const addLensNoteMutation = useMutation(api.personalLens.add);
  const updateLensNoteMutation = useMutation(api.personalLens.update);
  const deleteLensNoteMutation = useMutation(api.personalLens.remove);
  const generateSuggestionsAction = useAction(api.ai.generateSuggestions.generate);
  const generatePromptStrategyAction = useAction(api.ai.generatePromptStrategy.generate);
  const generateEssayFeedbackAction = useAction(api.ai.generateEssayFeedback.generate);
  const restoreVersionMutation = useMutation(api.essays.restoreVersion);
  const addExperienceUsageMutation = useMutation(api.experienceBank.addUsage);
  const experienceUsages = useQuery(api.experienceBank.getUsages) ?? [];

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
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRecipientType, setShareRecipientType] = useState<'parent' | 'counselor'>('parent');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [isShareSent, setIsShareSent] = useState(false);
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

  // Prompt editing state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState('');
  const [editedWordLimit, setEditedWordLimit] = useState(250);
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

  // Generated story suggestions from Personal Lens notes
  interface GeneratedSuggestion {
    id: string;
    noteId: string;
    noteContent: string;
    suggestion: string;
    matchStrength: 'strong' | 'moderate';
  }
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
  const wordLimit = currentEssay?.wordLimit || 650;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > wordLimit;

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
      const previewText = version.content.length > 120
        ? `${version.content.substring(0, 120)}...`
        : version.content;
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
    }
  }, [activeEssay?.essayId]);

  useEffect(() => {
    setSelectedExperience(null);
    setLockedExperience(null);
    setShowStarterHelper(false);
    setFeedbackResult(null);
    setFeedbackError(null);
    setStrategyError(null);
    setPreviewVersion(null);
    setGeneratedSuggestions([]);
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

  // Autosave to Convex
  useEffect(() => {
    if (content !== undefined && currentEssayId) {
      setIsSaving(true);
      const timer = setTimeout(async () => {
        try {
          await saveEssayMutation({
            essayId: currentEssayId as Id<"essays">,
            content,
          });
          setLastSaved(new Date());
        } catch (e) {
          console.error("Autosave failed:", e);
        }
        setIsSaving(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [content, currentEssayId, saveEssayMutation]);

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

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        newSet.delete(format);
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleShareSubmit = () => {
    if (shareEmail.trim()) {
      setIsShareSent(true);
      setTimeout(() => {
        setShowShareDialog(false);
        setIsShareSent(false);
        setShareEmail('');
        setSharePermission('view');
      }, 2000);
    }
  };

  // Handler for minimizing editor and returning to College Map view
  const handleMinimizeEditor = () => {
    setIsEditorMinimized(true);
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
          essayContent: `Context: This user has a personal lens note about: ${note.content} (Category: ${note.category}). Current essay content: ${content || "(not started)"}`,
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
      setShowVersionHistory(false);
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  // Get Smart Reuse suggestions
  const smartReuseExcerpts = getSmartReuseExcerpts();
  // Show smart reuse when there are suggestions (for essays with same prompt type, we show early)
  const hasWrittenContent = content.trim().length > 50;
  const hasSameTypeExcerpts = smartReuseExcerpts.some(e => e.matchesSamePromptType);
  const showSmartReuse = (hasWrittenContent || hasSameTypeExcerpts) && smartReuseExcerpts.length > 0;

  // Prompt editing handlers
  const handleStartEditingPrompt = () => {
    if (currentEssay) {
      setEditedPromptText(currentEssay.prompt);
      setEditedWordLimit(currentEssay.wordLimit);
      setIsEditingPrompt(true);
    }
  };

  const handleSavePromptEdit = () => {
    // In a real app, this would update the backend
    // For now, we just close the editing mode
    setIsEditingPrompt(false);
  };

  const handleCancelPromptEdit = () => {
    setIsEditingPrompt(false);
    setEditedPromptText('');
    setEditedWordLimit(250);
  };

  const handleDeletePrompt = () => {
    // In a real app, this would delete the prompt from the backend
    // For now, close the dialog and deselect the essay
    setShowDeletePromptDialog(false);
    setActiveEssay(null);
    setIsEditorMinimized(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* GLOBAL HEADER - Lightweight, persistent */}
      <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: LaunchPad logo/name - clicking returns to College Map */}
          <ColleeLogo
            size="sm"
            onClick={onLogoClick || (() => {
              setActiveEssay(null);
              setIsEditorMinimized(false);
            })}
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
                  How LaunchPad works
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={onEditStoryIdentity}>
                  <EditIcon className="w-4 h-4 mr-2" />
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
                                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
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
                                              ? 'bg-primary/10 border border-primary/30'
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
              className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20"
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
                        <span className="animate-pulse">Saving...</span>
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
                    onClick={onExport}
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
                                          <EditIcon className="w-3.5 h-3.5" />
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFormat('bold')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('bold')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('italic')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('italic')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('underline')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('underline')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button
                          onClick={() => toggleFormat('bullet')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('bullet')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('numbered')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('numbered')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                      </div>

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
                                <EditIcon className="w-3.5 h-3.5" />
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

                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Start writing your essay..."
                          className="w-full min-h-[500px] bg-transparent text-foreground text-lg leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50"
                          style={{
                            fontWeight: activeFormats.has('bold') ? 600 : 400,
                            fontStyle: activeFormats.has('italic') ? 'italic' : 'normal',
                            textDecoration: activeFormats.has('underline') ? 'underline' : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer - Word Count */}
                    <div className="border-t border-border bg-card/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-body font-medium ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}>
                          {wordCount}
                        </span>
                        <span className="text-body text-muted-foreground">/ {wordLimit} words</span>
                      </div>
                    </div>
                  </main>

                  {/* RIGHT PANEL - Context & Guidance (Collapsible) */}
                  <AnimatePresence>
                    {showRightPanel && (
                      <motion.aside
                        className="w-80 border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto hidden lg:block"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 320 }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-4 space-y-4">
                          {/* Personal Lens Generated Suggestions */}
                          {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length > 0 && (
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                              <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-primary" />
                                Based on your Personal Lens
                              </h3>
                              <div className="space-y-3">
                                {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).map((suggestion) => (
                                  <div key={suggestion.id} className="p-3 rounded-lg bg-background border border-border group">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs text-foreground leading-relaxed flex-1">
                                        {suggestion.suggestion}
                                      </p>
                                      <button
                                        onClick={() => handleDismissSuggestion(suggestion.id)}
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                        title="Dismiss suggestion"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      From: "{suggestion.noteContent.substring(0, 40)}..."
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length > 0 && (
                            <div className="my-4">
                              <Separator className="bg-border/60" />
                            </div>
                          )}

                          {/* Prompt Strategy */}
                          {currentEssay && (
                            <div className="rounded-lg bg-muted/20 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                  <Target className="w-4 h-4 text-primary" />
                                  Prompt Strategy
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleGeneratePromptStrategy}
                                  disabled={!currentPromptId || isGeneratingStrategy}
                                >
                                  {promptStrategy ? 'Refresh' : 'Generate'}
                                </Button>
                              </div>

                              {isGeneratingStrategy && (
                                <p className="text-xs text-muted-foreground italic">
                                  Generating a tailored approach for this prompt...
                                </p>
                              )}

                              {!isGeneratingStrategy && promptStrategy?.approach && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {promptStrategy.approach}
                                </p>
                              )}

                              {!isGeneratingStrategy && !promptStrategy && (
                                <p className="text-xs text-muted-foreground italic">
                                  No strategy yet. Generate one to get tailored guidance.
                                </p>
                              )}

                              {strategyError && (
                                <p className="text-xs text-destructive mt-2">{strategyError}</p>
                              )}
                            </div>
                          )}

                          {currentEssay && (
                            <div className="my-4">
                              <Separator className="bg-border/60" />
                            </div>
                          )}

                          {/* Section 3: Story Suggestions for This Prompt */}
                          {(() => {
                            const lockedExp = lockedExperience ? experienceSuggestions.find(e => e.id === lockedExperience) : null;

                            // If experience is locked in, show Section 4: Selected Angle
                            if (lockedExp) {
                              return (
                                <div className="rounded-lg bg-muted/20 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                      Selected Angle
                                    </h3>
                                    <button
                                      onClick={() => {
                                        setLockedExperience(null);
                                        setSelectedExperience(null);
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      Change
                                    </button>
                                  </div>

                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen className="w-4 h-4 text-emerald-600" />
                                      <span className="text-body-sm font-medium text-foreground">{lockedExp.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-6">
                                      Using {lockedExp.name} to show {lockedExp.guidance.whyItFits.toLowerCase().includes('shows')
                                        ? lockedExp.guidance.whyItFits.toLowerCase().split('shows')[1]?.trim()
                                        : 'your growth and values.'}
                                    </p>
                                  </div>

                                  {/* Actionable Guidance - Start with, Focus on, Avoid */}
                                  {(lockedExp.guidance.startWith || lockedExp.guidance.focusOn || lockedExp.guidance.avoidFocus) && (
                                    <div className="mt-4 space-y-2.5">
                                      {lockedExp.guidance.startWith && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">Start with</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.startWith}</p>
                                        </div>
                                      )}
                                      {lockedExp.guidance.focusOn && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Focus on</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.focusOn}</p>
                                        </div>
                                      )}
                                      {lockedExp.guidance.avoidFocus && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Avoid</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.avoidFocus}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <h4 className="text-xs font-medium text-foreground mb-2 mt-4 flex items-center gap-1.5">
                                    <Target className="w-3 h-3 text-primary" />
                                    Framing Tips
                                  </h4>
                                  <ul className="space-y-2">
                                    {lockedExp.guidance.framingTips.map((tip, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  {lockedExp.guidance.caution && (
                                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">{lockedExp.guidance.caution}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Show experience selection
                            return (
                              <div className="rounded-lg bg-muted/20 p-4">
                                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  Story Suggestions
                                </h3>

                                {experienceSuggestions.length === 0 ? (
                                  <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground italic">
                                      {isGeneratingStrategy
                                        ? 'Generating suggestions for this prompt...'
                                        : promptStrategy
                                          ? 'No specific suggestions for this prompt yet. Write from your heart!'
                                          : 'Generate a prompt strategy to get tailored suggestions.'}
                                    </p>

                                    {/* Contextual Personal Lens entry point */}
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                      <div className="flex items-start gap-2">
                                        <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="text-xs text-foreground mb-2">
                                            Want more tailored story suggestions? Adding a personal note can help.
                                          </p>
                                          <button
                                            onClick={handleOpenPersonalLens}
                                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                          >
                                            <Plus className="w-3 h-3" />
                                            Add to Personal Lens
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {experienceSuggestions
                                      .filter(exp => !dismissedSuggestions.has(`exp-${exp.id}-${currentEssay?.id}`))
                                      .map((experience) => {
                                        const isSelected = selectedExperience === experience.id;
                                        const usedInOtherEssays = experience.usedIn.filter(id => id !== currentEssay?.id);
                                        const isUsedElsewhere = usedInOtherEssays.length > 0;
                                        const isUsedInSameSchool = usedInOtherEssays.some(essayId =>
                                          currentCollege?.essays.some(e => e.id === essayId)
                                        );

                                        return (
                                          <motion.div
                                            key={experience.id}
                                            layout
                                            className={`rounded-xl border-2 transition-all cursor-pointer group relative ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : isUsedInSameSchool
                                                  ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                                  : 'border-border bg-card hover:border-primary/30'
                                              }`}
                                            onClick={() => setSelectedExperience(isSelected ? null : experience.id)}
                                          >
                                            {/* Dismiss button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismissExperienceSuggestion(experience.id);
                                              }}
                                              className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
                                              title="Dismiss suggestion"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="p-3">
                                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                  <BookOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                  <span className="text-body-sm font-medium text-foreground">
                                                    {experience.name}
                                                  </span>
                                                </div>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${experience.guidance.matchStrength === 'strong'
                                                    ? 'bg-emerald-500/15 text-emerald-600'
                                                    : 'bg-amber-500/15 text-amber-600'
                                                  }`}>
                                                  {experience.guidance.matchStrength === 'strong' ? 'Strong fit' : 'Good fit'}
                                                </span>
                                              </div>

                                              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                {experience.guidance.whyItFits}
                                              </p>

                                              {isUsedInSameSchool && !isSelected && (
                                                <div className="flex items-start gap-1.5 mt-2 pl-6 p-2 rounded-lg bg-amber-500/10">
                                                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                                  <span className="text-xs text-amber-600">
                                                    Already used in another {currentCollege?.name} essay. Consider a different experience or vary your angle.
                                                  </span>
                                                </div>
                                              )}

                                              {isUsedElsewhere && !isUsedInSameSchool && !isSelected && (
                                                <div className="flex items-center gap-1.5 mt-2 pl-6">
                                                  <span className="text-xs text-muted-foreground italic">Used in another school (okay to reuse)</span>
                                                </div>
                                              )}
                                            </div>

                                            <AnimatePresence>
                                              {isSelected && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-0">
                                                    <div className="pt-3 space-y-3">
                                                      {/* Actionable Guidance - Start with, Focus on, Avoid */}
                                                      {(experience.guidance.startWith || experience.guidance.focusOn || experience.guidance.avoidFocus) && (
                                                        <div className="space-y-2.5">
                                                          {experience.guidance.startWith && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">Start with</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.startWith}</p>
                                                            </div>
                                                          )}
                                                          {experience.guidance.focusOn && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Focus on</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.focusOn}</p>
                                                            </div>
                                                          )}
                                                          {experience.guidance.avoidFocus && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Avoid</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.avoidFocus}</p>
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* Framing Tips */}
                                                      <div>
                                                        <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                                          <Target className="w-3 h-3 text-primary" />
                                                          Framing Tips
                                                        </h4>
                                                        <ul className="space-y-1.5">
                                                          {experience.guidance.framingTips.map((tip, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                              <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                              <span>{tip}</span>
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      </div>

                                                      {experience.guidance.caution && (
                                                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                          <div className="flex items-start gap-2">
                                                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs text-amber-700">{experience.guidance.caution}</p>
                                                          </div>
                                                        </div>
                                                      )}

                                                      <button
                                                        className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                                                        onClick={async (e) => {
                                                          e.stopPropagation();
                                                          setLockedExperience(experience.id);
                                                          if (currentEssayId && currentCollege && experienceIndex.has(experience.id)) {
                                                            const alreadyUsed = (experienceUsageMap.get(experience.id) ?? []).includes(currentEssayId);
                                                            if (!alreadyUsed) {
                                                              try {
                                                                await addExperienceUsageMutation({
                                                                  experienceId: experience.id as Id<"experiences">,
                                                                  essayId: currentEssayId as Id<"essays">,
                                                                  collegeId: currentCollege.id as Id<"colleges">,
                                                                });
                                                              } catch (error) {
                                                                console.error("Failed to track experience usage:", error);
                                                              }
                                                            }
                                                          }
                                                          // Auto-populate editor with starter sentences if available
                                                          if (experience.guidance.starterSentences && experience.guidance.starterSentences.length > 0) {
                                                            const starterContent = experience.guidance.starterSentences.join(' ');
                                                            setContent(starterContent);
                                                            setShowStarterHelper(true);
                                                          }
                                                        }}
                                                      >
                                                        <Check className="w-3.5 h-3.5" />
                                                        Use this experience
                                                      </button>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </motion.div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* (Related Writing section removed for cleaner experience) */}

                          {/* Essay Feedback */}
                          {currentEssay && (
                            <>
                              <div className="my-6">
                                <Separator className="bg-border/60" />
                              </div>
                              <div className="rounded-lg bg-muted/20 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-primary" />
                                    Essay Feedback
                                  </h3>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Select
                                    value={feedbackType}
                                    onValueChange={(value) => setFeedbackType(value as FeedbackType)}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-32">
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="overall">Overall</SelectItem>
                                      <SelectItem value="opening">Opening</SelectItem>
                                      <SelectItem value="structure">Structure</SelectItem>
                                      <SelectItem value="voice">Voice</SelectItem>
                                      <SelectItem value="specificity">Specificity</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleGenerateFeedback}
                                    disabled={!currentEssayId || isGeneratingFeedback}
                                  >
                                    {isGeneratingFeedback ? 'Generating...' : 'Get Feedback'}
                                  </Button>
                                </div>

                                {feedbackError && (
                                  <p className="text-xs text-destructive mt-2">{feedbackError}</p>
                                )}

                                {!displayedFeedback && !isGeneratingFeedback && (
                                  <p className="text-xs text-muted-foreground mt-3 italic">
                                    No feedback yet. Generate to get coaching.
                                  </p>
                                )}

                                {displayedFeedback && (
                                  <div className="mt-3 space-y-3">
                                    {displayedFeedback.summary && (
                                      <p className="text-xs text-foreground leading-relaxed">
                                        {displayedFeedback.summary}
                                      </p>
                                    )}

                                    {displayedFeedback.strengths?.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1">Strengths</p>
                                        <div className="space-y-1">
                                          {displayedFeedback.strengths.slice(0, 3).map((strength: string, idx: number) => (
                                            <p key={idx} className="text-xs text-muted-foreground">
                                              • {strength}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {displayedFeedback.improvements?.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1">Improvements</p>
                                        <div className="space-y-2">
                                          {displayedFeedback.improvements.slice(0, 2).map((item: any, idx: number) => (
                                            <div key={idx} className="p-2 rounded-lg bg-background border border-border">
                                              <p className="text-xs text-foreground mb-1">{item.issue}</p>
                                              {item.suggestion && (
                                                <p className="text-xs text-muted-foreground">
                                                  Suggestion: {item.suggestion}
                                                </p>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {displayedFeedback.nextStep && (
                                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                        <p className="text-xs text-primary">
                                          Next step: {displayedFeedback.nextStep}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {/* Section 8: Smart Reuse - Reusable Excerpts from Other Schools */}
                          {showSmartReuse && (
                            <>
                              <div className="my-6">
                                <Separator className="bg-border/60" />
                              </div>
                              <div className="rounded-lg bg-muted/20 p-4">
                                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4 text-secondary" />
                                  You might reuse part of this
                                </h3>

                                <p className="text-xs text-muted-foreground mb-3">
                                  Excerpts from your other essays that may help here:
                                </p>

                                <div className="space-y-3">
                                  {smartReuseExcerpts.map((excerpt) => (
                                    <motion.div
                                      key={excerpt.id}
                                      layout
                                      className="rounded-xl border border-border bg-card overflow-hidden"
                                    >
                                      {/* Source */}
                                      <div className="px-3 py-2 bg-muted/30 border-b border-border">
                                        <p className="text-xs font-medium text-foreground">
                                          {excerpt.sourceCollegeName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {excerpt.sourceEssayTitle}
                                        </p>
                                      </div>

                                      {/* Excerpt Preview */}
                                      <div className="p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                          <Quote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-4">
                                            "{excerpt.excerpt}"
                                          </p>
                                        </div>

                                        {/* Why it works */}
                                        <div className="mt-2 p-2 rounded-lg bg-primary/15">
                                          <p className="text-xs text-foreground leading-relaxed">
                                            {excerpt.whyItWorks}
                                          </p>
                                        </div>

                                        {/* Same-school warning (gentle, not blocking) */}
                                        {excerpt.sameSchoolWarning && (
                                          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-start gap-1.5">
                                              <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-amber-700 leading-relaxed">
                                                {excerpt.sameSchoolWarning}
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Actions: Insert as reference OR Dismiss */}
                                        <div className="flex items-center gap-2 mt-3">
                                          <button
                                            onClick={() => handleInsertAsReference(excerpt)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                            Insert as reference
                                          </button>
                                          <button
                                            onClick={() => handleDismissExcerpt(excerpt.id)}
                                            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                            title="Dismiss"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>

                                <p className="text-xs text-center text-muted-foreground mt-3 italic">
                                  Guided reuse — always revise to fit this prompt.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.aside>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VERSION HISTORY SLIDE-OVER */}
      <AnimatePresence>
        {showVersionHistory && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVersionHistory(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-lg z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-heading-sm text-foreground">Version History</h2>
                      <p className="text-body-sm text-muted-foreground">Nothing is ever lost</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVersionHistory(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {previewVersion && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body-sm font-medium text-foreground">
                        Preview · {previewVersion.timestamp}
                      </span>
                      <button
                        onClick={() => setPreviewVersion(null)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {previewVersion.content ?? ""}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleRestoreVersion(previewVersion)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Restore this version
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {versionsForDisplay.length === 0 && (
                    <p className="text-body-sm text-muted-foreground text-center">
                      No versions yet.
                    </p>
                  )}
                  {versionsForDisplay.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-xl border transition-all ${version.isCurrent
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-medium text-foreground">
                            {version.timestamp}
                          </span>
                          {version.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-body-sm text-muted-foreground">
                          {version.wordCount} words
                        </span>
                      </div>
                      <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
                        {version.preview}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setPreviewVersion(version)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          onClick={() => handleRestoreVersion(version)}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-body-sm text-center text-muted-foreground mt-6">
                  Versions are automatically saved as you write
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SHARE DIALOG */}
      <AnimatePresence>
        {showShareDialog && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isShareSent) {
                  setShowShareDialog(false);
                  setShareEmail('');
                }
              }}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {isShareSent ? (
                  <motion.div
                    className="p-8 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-heading-sm text-foreground mb-2">Invitation Sent!</h3>
                    <p className="text-body-sm text-muted-foreground">
                      A {sharePermission === 'view' ? 'view-only' : sharePermission === 'comment' ? 'commenting' : 'editing'} link has been sent to {shareEmail}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="p-6 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-heading-sm text-foreground">Share Essay</h3>
                            <p className="text-body-sm text-muted-foreground">
                              Invite someone to view or collaborate
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowShareDialog(false);
                            setShareEmail('');
                            setSharePermission('view');
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Recipient's email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="parent@email.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Who is this for?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShareRecipientType('parent')}
                            className={`p-3 rounded-lg border text-left transition-all ${shareRecipientType === 'parent'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <Users className={`w-4 h-4 mb-1 ${shareRecipientType === 'parent' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-body-sm font-medium ${shareRecipientType === 'parent' ? 'text-primary' : 'text-foreground'}`}>
                              Parent
                            </p>
                          </button>
                          <button
                            onClick={() => setShareRecipientType('counselor')}
                            className={`p-3 rounded-lg border text-left transition-all ${shareRecipientType === 'counselor'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <Shield className={`w-4 h-4 mb-1 ${shareRecipientType === 'counselor' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-body-sm font-medium ${shareRecipientType === 'counselor' ? 'text-primary' : 'text-foreground'}`}>
                              Counselor
                            </p>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Permission level
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setSharePermission('view')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'view'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Eye className={`w-4 h-4 ${sharePermission === 'view' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'view' ? 'text-primary' : 'text-foreground'}`}>
                                  View only
                                </p>
                                <p className="text-xs text-muted-foreground">Can read but not change anything</p>
                              </div>
                            </div>
                            {sharePermission === 'view' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                          <button
                            onClick={() => setSharePermission('comment')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'comment'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className={`w-4 h-4 ${sharePermission === 'comment' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'comment' ? 'text-primary' : 'text-foreground'}`}>
                                  Comment
                                </p>
                                <p className="text-xs text-muted-foreground">Can add inline feedback and suggestions</p>
                              </div>
                            </div>
                            {sharePermission === 'comment' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                          <button
                            onClick={() => setSharePermission('edit')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'edit'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Pencil className={`w-4 h-4 ${sharePermission === 'edit' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'edit' ? 'text-primary' : 'text-foreground'}`}>
                                  Edit
                                </p>
                                <p className="text-xs text-muted-foreground">Can make changes to the essay text</p>
                              </div>
                            </div>
                            {sharePermission === 'edit' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground text-center">
                          You remain the owner of this essay. You can revoke access anytime.
                        </p>
                      </div>
                      <Button
                        variant="collee-accent"
                        size="collee"
                        onClick={handleShareSubmit}
                        disabled={!shareEmail.trim()}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send invitation
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE PROMPT CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeletePromptDialog && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeletePromptDialog(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="text-heading-sm text-foreground text-center mb-2">
                    Delete this prompt?
                  </h3>
                  <p className="text-body-sm text-muted-foreground text-center mb-6">
                    This will remove the prompt and its draft. This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="collee"
                      onClick={() => setShowDeletePromptDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="collee"
                      onClick={handleDeletePrompt}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete prompt
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isOpen={showOnboarding && isDocumentAreaActive}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default LaunchPadWorkspace;
