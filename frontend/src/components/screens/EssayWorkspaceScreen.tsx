import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useExperienceBank, type StorySuggestion, type ExperienceUsage, type ReuseSuggestion, type EssayExcerpt } from '@/contexts/ExperienceBankContext';
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
  Download,
  Share2,
  ArrowLeft,
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
  Sparkles,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Quote,
  Copy,
  XCircle
} from 'lucide-react';

interface Essay {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
}

interface College {
  id: string;
  name: string;
  essays: Essay[];
}

interface Version {
  id: string;
  timestamp: string;
  wordCount: number;
  preview: string;
  isCurrent?: boolean;
}

interface Essay {
  id: string;
  title: string;
  prompt: string; // Added prompt text
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
}

// Reference block inserted into essay
interface InsertedReference {
  id: string;
  excerptId: string;
  text: string;
  sourceName: string;
}

interface EssayWorkspaceScreenProps {
  onBack: () => void;
  onExport: () => void;
  onShare: () => void;
}

const mockColleges: College[] = [
  {
    id: '1',
    name: 'Stanford University',
    essays: [
      { id: 'e1', title: 'Personal Statement', prompt: "Describe an experience where you had to make a difficult choice. What did you decide and what did you learn?", status: 'in-progress', wordCount: 542 },
      { id: 'e2', title: 'Why Stanford?', prompt: "What is the most significant challenge that society faces today, and how do you want to contribute to its solution?", status: 'not-started', wordCount: 0 },
      { id: 'e3', title: 'Meaningful Experience', prompt: "Briefly elaborate on one of your extracurricular activities or work experiences.", status: 'complete', wordCount: 248 },
    ]
  },
  {
    id: '2',
    name: 'MIT',
    essays: [
      { id: 'e4', title: 'Describe the world you come from', prompt: "Describe the world you come from (for example, your family, community, or school) and tell us how your world has shaped your dreams and aspirations.", status: 'not-started', wordCount: 0 },
      { id: 'e5', title: 'Challenge or setback', prompt: "Tell us about a significant challenge you've faced or something that hasn't gone according to plan. How did you manage the situation?", status: 'in-progress', wordCount: 180 },
    ]
  },
  {
    id: '3',
    name: 'Yale University',
    essays: [
      { id: 'e6', title: 'Why Yale?', prompt: "What is it about Yale that has led you to apply?", status: 'not-started', wordCount: 0 },
      { id: 'e7', title: 'Reflect on something', prompt: "Reflect on something you have learned or experienced that has sparked your curiosity.", status: 'not-started', wordCount: 0 },
    ]
  },
];

const mockVersions: Version[] = [
  { id: 'v1', timestamp: 'Today, 3:42 PM', wordCount: 542, preview: 'The moment I realized I wanted to pursue computer science...', isCurrent: true },
  { id: 'v2', timestamp: 'Today, 2:15 PM', wordCount: 487, preview: 'The moment I realized I wanted to pursue computer science...' },
  { id: 'v3', timestamp: 'Today, 11:30 AM', wordCount: 320, preview: 'I never expected to find my passion for technology...' },
  { id: 'v4', timestamp: 'Yesterday, 8:45 PM', wordCount: 156, preview: 'Growing up, I always thought technology was cold...' },
];

// Prompt themes for matching (in real app, AI-generated from prompt analysis)
const promptThemesMap: Record<string, string[]> = {
  'e1': ['decision', 'growth', 'responsibility', 'impact'],
  'e2': ['purpose', 'fit', 'contribution'],
  'e3': ['impact', 'meaning', 'experience'],
  'e4': ['identity', 'background', 'perspective'],
  'e5': ['failure', 'resilience', 'growth', 'learning'],
  'e6': ['purpose', 'community', 'contribution'],
  'e7': ['reflection', 'growth', 'insight'],
};

// Helper to check if experience is used at a specific school (excluding current essay)
const getSchoolUsage = (usedIn: ExperienceUsage[], currentCollegeId: string, currentEssayId: string): ExperienceUsage | null => {
  return usedIn.find(usage =>
    usage.collegeId === currentCollegeId && usage.essayId !== currentEssayId
  ) || null;
};

const EssayWorkspaceScreen: React.FC<EssayWorkspaceScreenProps> = ({
  onBack,
  onExport,
  onShare,
}) => {
  const {
    getSuggestionsForPrompt,
    addExperienceUsage,
    getReuseSuggestions,
    insertExcerptAsReference,
    dismissExcerpt
  } = useExperienceBank();

  const [content, setContent] = useState('The moment I realized I wanted to pursue computer science was not in a classroom — it was in my grandmother\'s kitchen. She had just received a new smartphone from my parents, and the look of confusion and frustration on her face was something I\'ll never forget.\n\nI spent the next three hours walking her through every feature, translating the cold, technical language into something that made sense to her. That afternoon, I discovered that my passion wasn\'t just about building technology — it was about building bridges between technology and the people who need it most.');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRecipientType, setShareRecipientType] = useState<'parent' | 'counselor'>('parent');
  const [isShareSent, setIsShareSent] = useState(false);
  const [previewType, setPreviewType] = useState<'parent' | 'counselor'>('parent');
  const [selectedCollege, setSelectedCollege] = useState<string>('1');
  const [selectedEssay, setSelectedEssay] = useState<string>('e1');
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set(['1']));
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);

  // Smart Reuse state
  const [insertedReferences, setInsertedReferences] = useState<InsertedReference[]>([]);

  // Get current college/essay info for experience tracking
  const currentCollege = mockColleges.find(c => c.id === selectedCollege);
  const currentEssay = currentCollege?.essays.find(e => e.id === selectedEssay);

  // Get suggestions from context (prioritizes unused experiences for this school)
  const [storySuggestions, setStorySuggestions] = useState<StorySuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchsuggestions = async () => {
      setIsGeneratingSuggestions(true);
      // Use dynamic prompt from selected essay
      const promptText = currentEssay?.prompt || "Standard College Essay Prompt";

      const results = await getSuggestionsForPrompt(selectedCollege, selectedEssay, promptText, content);
      if (mounted) {
        setStorySuggestions(results);
        setIsGeneratingSuggestions(false);
      }
    };
    fetchsuggestions();
    return () => { mounted = false; };
  }, [selectedCollege, selectedEssay, getSuggestionsForPrompt, currentEssay]); // Added currentEssay dependency

  // Get Smart Reuse suggestions (cross-school only)
  const promptThemes = promptThemesMap[selectedEssay] || [];
  const reuseSuggestions = getReuseSuggestions(selectedCollege, selectedEssay, promptThemes);

  // Show Smart Reuse only when: has written essays AND has thematic overlap
  const hasWrittenEssays = content.trim().length > 100; // Simplified check
  const showSmartReuse = hasWrittenEssays && reuseSuggestions.length > 0;

  const wordLimit = 650;
  const promptWordRange = "250–650 words"; // Word count range for prompt display

  // Starter text state - shown in editor after clicking "Use this experience"
  const [starterText, setStarterText] = useState<{ text: string; experienceName: string } | null>(null);

  // Handle using an experience with starter sentences
  const handleUseExperience = (suggestion: StorySuggestion) => {
    if (currentCollege && currentEssay) {
      addExperienceUsage(suggestion.experienceId, {
        essayId: selectedEssay,
        essayTitle: currentEssay.title,
        collegeId: selectedCollege,
        collegeName: currentCollege.name
      });
    }

    // Set starter text if available
    if (suggestion.starterSentences && suggestion.starterSentences.length > 0) {
      const starterContent = suggestion.starterSentences.join(' ');
      setStarterText({ text: starterContent, experienceName: suggestion.experienceName });

      // Only populate if editor is empty or nearly empty
      if (content.trim().length < 50) {
        setContent(starterContent);
      }
    }

    setSelectedExperience(null);
  };

  // Clear starter text helper
  const clearStarterText = () => {
    setStarterText(null);
    setContent('');
  };
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > wordLimit;

  // Simulated autosave
  useEffect(() => {
    if (content) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content]);

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusDot = (status: Essay['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-primary';
      default:
        return 'bg-muted-foreground/30';
    }
  };

  const handleShareSubmit = () => {
    if (shareEmail.trim()) {
      setIsShareSent(true);
      setTimeout(() => {
        setShowShareDialog(false);
        setIsShareSent(false);
        setShareEmail('');
      }, 2000);
    }
  };

  // Handle inserting excerpt as reference
  const handleInsertAsReference = (suggestion: ReuseSuggestion) => {
    const { excerpt } = suggestion;

    // Track the usage
    if (currentCollege && currentEssay) {
      insertExcerptAsReference(
        excerpt.id,
        currentCollege.id,
        currentCollege.name,
        currentEssay.id,
        currentEssay.title
      );
    }

    // Add to inserted references (shown in editor)
    const newReference: InsertedReference = {
      id: `ref-${Date.now()}`,
      excerptId: excerpt.id,
      text: excerpt.excerpt,
      sourceName: `${excerpt.collegeName} — ${excerpt.essayTitle}`
    };

    setInsertedReferences(prev => [...prev, newReference]);
  };

  // Handle dismissing an excerpt
  const handleDismissExcerpt = (excerptId: string) => {
    dismissExcerpt(excerptId, selectedEssay);
  };

  // Remove an inserted reference
  const handleRemoveReference = (refId: string) => {
    setInsertedReferences(prev => prev.filter(r => r.id !== refId));
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <motion.header
        className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-body-sm hidden sm:inline">Back</span>
            </button>
            <div className="h-5 w-px bg-border" />
            <div>
              <p className="text-body-sm text-muted-foreground">{currentCollege?.name}</p>
              <p className="text-body font-medium text-foreground">{currentEssay?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Status */}
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

            <button
              onClick={() => setShowVersionHistory(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Version history"
            >
              <History className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowPreviewMode(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Preview as shared"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
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
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE - Essay Navigator */}
        <motion.aside
          className="w-64 border-r border-border bg-card/50 flex-shrink-0 overflow-y-auto hidden md:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4">
            <h2 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Essays
            </h2>

            <div className="space-y-2">
              {mockColleges.map((college) => (
                <div key={college.id}>
                  <button
                    onClick={() => toggleCollegeExpanded(college.id)}
                    className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-body-sm font-medium text-foreground truncate">
                      {college.name}
                    </span>
                    {expandedColleges.has(college.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedColleges.has(college.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-2 space-y-1 mt-1">
                          {college.essays.map((essay) => (
                            <button
                              key={essay.id}
                              onClick={() => {
                                setSelectedCollege(college.id);
                                setSelectedEssay(essay.id);
                              }}
                              className={`w-full flex items-center gap-2 py-2 px-2 rounded-lg transition-colors text-left ${selectedEssay === essay.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/50 text-muted-foreground'
                                }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${getStatusDot(essay.status)} flex-shrink-0`} />
                              <span className="text-body-sm truncate">{essay.title}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* CENTER PANE - Writing Editor */}
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
              {/* Starter Text Indicator */}
              <AnimatePresence>
                {starterText && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-primary font-medium mb-1">
                            Starting point from "{starterText.experienceName}"
                          </p>
                          <p className="text-xs text-muted-foreground">
                            This is just a starting point - revise freely or delete.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearStarterText}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Clear starter text"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inserted References (Smart Reuse) */}
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
                          This is a starting point - revise or delete freely.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              <span className={`text-body font-medium ${isOverLimit ? 'text-destructive' : 'text-foreground'
                }`}>
                {wordCount}
              </span>
              <span className="text-body text-muted-foreground">
                / {wordLimit} words
              </span>
            </div>

            <div className="flex sm:hidden items-center gap-2 text-body-sm text-muted-foreground">
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span>Saved</span>
                </>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT PANE - Context & Guidance (Collapsible) */}
        <AnimatePresence>
          {showRightPanel && (
            <motion.aside
              className="w-80 border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto hidden lg:block"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 320 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 space-y-5">
                {/* Prompt Section - Compact with Word Count */}
                <div>
                  <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Prompt
                  </h3>
                  <p className="text-body-sm text-foreground leading-relaxed">
                    {currentEssay?.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    ({promptWordRange})
                  </p>
                </div>

                <div className="h-px bg-border" />

                {/* Decoded Guidance - Brief */}
                <div>
                  <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" />
                    What They're Looking For
                  </h3>
                  <p className="text-body-sm text-muted-foreground leading-relaxed">
                    Your decision-making process and self-awareness. Focus on internal conflict, not just outcome.
                  </p>
                </div>

                <div className="h-px bg-border" />

                {/* Smart Reuse Section - ONLY shows when there are cross-school excerpts with thematic overlap */}
                {showSmartReuse && (
                  <>
                    <div>
                      <h3 className="text-body-sm font-medium text-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-secondary" />
                        You might reuse part of this
                      </h3>

                      <p className="text-xs text-muted-foreground mb-3">
                        Excerpts from your other essays that may help here:
                      </p>

                      <div className="space-y-3">
                        {reuseSuggestions.map((suggestion) => (
                          <motion.div
                            key={suggestion.id}
                            layout
                            className="rounded-xl border border-border bg-card overflow-hidden"
                          >
                            {/* Source */}
                            <div className="px-3 py-2 bg-muted/30 border-b border-border">
                              <p className="text-xs font-medium text-foreground">
                                {suggestion.excerpt.collegeName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {suggestion.excerpt.essayTitle}
                              </p>
                            </div>

                            {/* Excerpt Preview */}
                            <div className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <Quote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-4">
                                  "{suggestion.excerpt.excerpt}"
                                </p>
                              </div>

                              {/* Why it works */}
                              <div className="mt-2 p-2 rounded-lg bg-secondary/10">
                                <p className="text-xs text-secondary-foreground leading-relaxed">
                                  {suggestion.whyItWorks}
                                </p>
                              </div>

                              {/* Same-school warning (gentle, not blocking) */}
                              {suggestion.sameSchoolWarning && (
                                <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                  <div className="flex items-start gap-1.5">
                                    <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                      {suggestion.sameSchoolWarning}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Actions: Insert as reference OR Dismiss */}
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleInsertAsReference(suggestion)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  Insert as reference
                                </button>
                                <button
                                  onClick={() => handleDismissExcerpt(suggestion.excerpt.id)}
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

                    <div className="h-px bg-border" />
                  </>
                )}

                {/* Story Suggestions for This Prompt */}
                <div>
                  <h3 className="text-body-sm font-medium text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Story Suggestions for This Prompt
                  </h3>

                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-muted-foreground">
                      From your Experience Bank — tailored to this prompt:
                    </p>
                    <button
                      onClick={() => {
                        // Re-trigger fetch manually
                        const promptText = currentEssay?.prompt || "Write a college essay.";
                        getSuggestionsForPrompt(selectedCollege, selectedEssay, promptText, content)
                          .then(setStorySuggestions);
                      }}
                      className="text-xs text-primary hover:underline"
                      disabled={isGeneratingSuggestions}
                    >
                      {isGeneratingSuggestions ? 'Thinking...' : 'Refresh'}
                    </button>
                  </div>

                  {isGeneratingSuggestions && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Generating insights...
                    </div>
                  )}

                  {!isGeneratingSuggestions && (
                    <div className="space-y-3">
                      {storySuggestions.map((suggestion) => {
                        const isSelected = selectedExperience === suggestion.id;
                        const sameSchoolUsage = getSchoolUsage(suggestion.usedIn, selectedCollege, selectedEssay);
                        const usedAtDifferentSchool = suggestion.usedIn.length > 0 && !sameSchoolUsage;

                        return (
                          <motion.div
                            key={suggestion.id}
                            layout
                            className={`rounded-xl border-2 transition-all cursor-pointer ${isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card hover:border-primary/30'
                              }`}
                            onClick={() => setSelectedExperience(isSelected ? null : suggestion.id)}
                          >
                            {/* Suggestion Header */}
                            <div className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <BookOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <span className="text-body-sm font-medium text-foreground">
                                    {suggestion.experienceName}
                                  </span>
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${suggestion.matchStrength === 'strong'
                                  ? 'bg-green-500/15 text-green-600'
                                  : 'bg-amber-500/15 text-amber-600'
                                  }`}>
                                  {suggestion.matchStrength === 'strong' ? 'Strong fit' : 'Good fit'}
                                </span>
                              </div>

                              {/* Story Pillar Tag */}
                              <div className="pl-6 mb-2">
                                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-secondary/50 text-muted-foreground">
                                  {suggestion.storyPillar}
                                </span>
                              </div>

                              {/* Why it fits THIS prompt */}
                              <div className="pl-6">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {suggestion.whyItFitsThisPrompt}
                                </p>
                              </div>

                              {/* Same-school usage guidance (gentle, not blocking) */}
                              {sameSchoolUsage && !isSelected && (
                                <div className="mt-2 pl-6">
                                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Lightbulb className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-700">
                                      Used in "{sameSchoolUsage.essayTitle}" for {sameSchoolUsage.collegeName}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expanded Framing Guidance */}
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
                                      {(suggestion.startWith || suggestion.focusOn || suggestion.avoidFocus) && (
                                        <div className="space-y-2.5">
                                          {suggestion.startWith && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">Start with</span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.startWith}</p>
                                            </div>
                                          )}
                                          {suggestion.focusOn && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Focus on</span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.focusOn}</p>
                                            </div>
                                          )}
                                          {suggestion.avoidFocus && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Avoid</span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.avoidFocus}</p>
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
                                          {suggestion.framingGuidance.map((tip, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                              <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                              <span>{tip}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      {/* Same-school reuse gentle guidance when expanded */}
                                      {sameSchoolUsage && (
                                        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                          <div className="flex items-start gap-2">
                                            <Lightbulb className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <p className="text-xs text-blue-800 font-medium mb-1">
                                                Already used for {sameSchoolUsage.collegeName}
                                              </p>
                                              <p className="text-xs text-blue-700 leading-relaxed">
                                                You've used this experience in "{sameSchoolUsage.essayTitle}". It may be stronger to highlight a different experience here, unless you focus on a completely different aspect.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* General caution (unrelated to reuse) */}
                                      {suggestion.caution && !sameSchoolUsage && (
                                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                          <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-amber-700">{suggestion.caution}</p>
                                          </div>
                                        </div>
                                      )}

                                      <button
                                        className="w-full py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUseExperience(suggestion);
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

                  <p className="text-xs text-center text-muted-foreground mt-4 italic">
                    Optional guidance — write your own way.
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Version History Slide-Over Panel */}
      <AnimatePresence>
        {showVersionHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVersionHistory(false)}
            />

            {/* Slide-over panel */}
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

                <div className="space-y-3">
                  {mockVersions.map((version) => (
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

                      {!version.isCurrent && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Preview
                          </Button>
                          <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary-hover">
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restore
                          </Button>
                        </div>
                      )}
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

      {/* Preview Mode Slide-Over Panel */}
      <AnimatePresence>
        {showPreviewMode && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewMode(false)}
            />

            {/* Full-screen Preview Panel */}
            <motion.div
              className="fixed inset-0 bg-background z-50 overflow-y-auto"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Preview Header */}
              <div className="sticky top-0 bg-primary/5 border-b border-border z-10">
                <div className="max-w-2xl mx-auto px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-body-sm font-medium text-primary">Preview Mode</span>
                        <p className="text-xs text-muted-foreground">
                          How others will see your essay
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPreviewMode(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span className="text-body-sm text-foreground">Back to editing</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View Type Selector */}
              <div className="max-w-2xl mx-auto px-6 pt-6">
                <div className="flex gap-2 p-1 rounded-xl bg-muted/50 mb-8">
                  <button
                    onClick={() => setPreviewType('parent')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all ${previewType === 'parent'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-body-sm font-medium">Parent View</span>
                  </button>
                  <button
                    onClick={() => setPreviewType('counselor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all ${previewType === 'counselor'
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-body-sm font-medium">Counselor View</span>
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="max-w-2xl mx-auto px-6 pb-16">
                {/* View Description */}
                <motion.div
                  key={previewType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-muted/30 border border-border mb-8"
                >
                  <div className="flex items-start gap-3">
                    {previewType === 'parent' ? (
                      <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    ) : (
                      <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                    )}
                    <div>
                      <p className="text-body-sm font-medium text-foreground mb-1">
                        {previewType === 'parent' ? 'Parent View' : 'Counselor View'}
                      </p>
                      <p className="text-body-sm text-muted-foreground">
                        {previewType === 'parent'
                          ? 'Parents see only your essay content. Strategy notes and guidance are hidden.'
                          : 'Counselors see your essay with context about the prompt and college.'}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* College & Prompt (Counselor only) */}
                {previewType === 'counselor' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-secondary" />
                      <span className="text-body font-medium text-secondary">{currentCollege?.name}</span>
                    </div>
                    <p className="text-body text-muted-foreground leading-relaxed">
                      Describe an experience where you had to make a difficult choice. What did you decide and what did you learn?
                    </p>
                  </motion.div>
                )}

                {previewType === 'counselor' && <div className="h-px bg-border mb-10" />}

                {/* Essay Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: previewType === 'counselor' ? 0.2 : 0.1 }}
                  className="mb-6"
                >
                  <h1 className="text-2xl font-semibold text-foreground">{currentEssay?.title}</h1>
                  {previewType === 'parent' && (
                    <p className="text-body-sm text-muted-foreground mt-1">{currentCollege?.name}</p>
                  )}
                </motion.div>

                {/* Essay Content */}
                <motion.article
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: previewType === 'counselor' ? 0.3 : 0.2 }}
                >
                  {content.split('\n\n').map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-foreground text-lg leading-relaxed mb-6"
                    >
                      {paragraph}
                    </p>
                  ))}
                </motion.article>

                {/* Footer */}
                <motion.div
                  className="mt-12 pt-6 border-t border-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between text-body-sm text-muted-foreground">
                    <span>{wordCount} words</span>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Shared via LaunchPad</span>
                    </div>
                  </div>
                </motion.div>

                {/* Reference Note */}
                <motion.div
                  className="mt-8 p-4 rounded-xl bg-muted/30 border border-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-body-sm text-center text-muted-foreground">
                    This is a read-only preview. Recipients cannot edit your essay.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Dialog */}
      <AnimatePresence>
        {showShareDialog && (
          <>
            {/* Backdrop */}
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

            {/* Share Dialog Panel */}
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
                  /* Success State */
                  <motion.div
                    className="p-8 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-heading-sm text-foreground mb-2">Invitation Sent!</h3>
                    <p className="text-body-sm text-muted-foreground">
                      A link has been sent to {shareEmail}
                    </p>
                  </motion.div>
                ) : (
                  /* Form State */
                  <>
                    <div className="p-6 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-heading-sm text-foreground">Share Essay</h2>
                            <p className="text-body-sm text-muted-foreground">Send a read-only link</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowShareDialog(false);
                            setShareEmail('');
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Recipient Type Selection */}
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-3">
                          Who are you sharing with?
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShareRecipientType('parent')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${shareRecipientType === 'parent'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/30 text-muted-foreground'
                              }`}
                          >
                            <Users className="w-4 h-4" />
                            <span className="text-body-sm font-medium">Parent</span>
                          </button>
                          <button
                            onClick={() => setShareRecipientType('counselor')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${shareRecipientType === 'counselor'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/30 text-muted-foreground'
                              }`}
                          >
                            <Shield className="w-4 h-4" />
                            <span className="text-body-sm font-medium">Counselor</span>
                          </button>
                        </div>
                      </div>

                      {/* Email Input */}
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Their email address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder={shareRecipientType === 'parent' ? "parent@email.com" : "counselor@school.edu"}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      {/* Privacy Note */}
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <p className="text-body-sm text-muted-foreground">
                          {shareRecipientType === 'parent'
                            ? "Parents will only see your essay content. Strategy notes and guidance remain private."
                            : "Counselors will see your essay with the prompt context to provide better feedback."}
                        </p>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleShareSubmit}
                        disabled={!shareEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3"
                      >
                        <Send className="w-4 h-4" />
                        Send Invitation
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EssayWorkspaceScreen;
