import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  Copy,
  FileText,
  Heart,
  Lightbulb,
  MessageSquare,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Target,
  Wand2,
  X,
  XCircle,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createStoredRichTextFromPlainText,
  parseStoredRichTextToDoc,
} from '@/lib/richText';
import type { Id } from '../../../../convex/_generated/dataModel';
import OwnerCommentCard from './OwnerCommentCard';
import type {
  College,
  Essay,
  FeedbackType,
  GeneratedSuggestion,
  PromptFitGuidance,
  ReusableExcerpt,
  ReviewerComment,
  StoryExperience,
} from './types';

interface RightPanelProps {
  show: boolean;
  generatedSuggestions: GeneratedSuggestion[];
  dismissedSuggestions: Set<string>;
  onDismissSuggestion: (id: string) => void;

  currentEssay?: Essay;
  currentEssayId?: string;
  currentCollege: College | null;
  currentPromptId?: string;
  promptStrategy: any;
  isGeneratingStrategy: boolean;
  strategyError: string | null;
  onGeneratePromptStrategy: () => void;

  experienceSuggestions: (StoryExperience & { guidance: PromptFitGuidance })[];
  selectedExperience: string | null;
  lockedExperience: string | null;
  onSelectExperience: (experienceId: string | null) => void;
  onLockExperience: (experienceId: string | null) => void;
  onDismissExperienceSuggestion: (experienceId: string) => void;
  onOpenPersonalLens: () => void;

  experienceIndex: Map<string, { name: string; tags: string[] }>;
  experienceUsageMap: Map<string, string[]>;
  addExperienceUsage: (args: {
    experienceId: Id<'experiences'>;
    essayId: Id<'essays'>;
    collegeId: Id<'colleges'>;
  }) => Promise<unknown>;
  editorInstance: Editor | null;
  onSetContent: (content: string) => void;
  onShowStarterHelper: (show: boolean) => void;

  feedbackType: FeedbackType;
  onFeedbackTypeChange: (type: FeedbackType) => void;
  onGenerateFeedback: () => void;
  isGeneratingFeedback: boolean;
  feedbackError: string | null;
  displayedFeedback: any;

  reviewerComments: ReviewerComment[];
  onResolveComment: (commentId: Id<'shareComments'>) => void;
  onAddOwnerReply: (
    commentId: Id<'shareComments'>,
    content: string,
  ) => Promise<{ replyId: Id<'shareCommentReplies'> }>;

  showSmartReuse: boolean;
  smartReuseExcerpts: ReusableExcerpt[];
  onInsertAsReference: (excerpt: ReusableExcerpt) => void;
  onDismissExcerpt: (excerptId: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  show,
  generatedSuggestions,
  dismissedSuggestions,
  onDismissSuggestion,
  currentEssay,
  currentEssayId,
  currentCollege,
  currentPromptId,
  promptStrategy,
  isGeneratingStrategy,
  strategyError,
  onGeneratePromptStrategy,
  experienceSuggestions,
  selectedExperience,
  lockedExperience,
  onSelectExperience,
  onLockExperience,
  onDismissExperienceSuggestion,
  onOpenPersonalLens,
  experienceIndex,
  experienceUsageMap,
  addExperienceUsage,
  editorInstance,
  onSetContent,
  onShowStarterHelper,
  feedbackType,
  onFeedbackTypeChange,
  onGenerateFeedback,
  isGeneratingFeedback,
  feedbackError,
  displayedFeedback,
  reviewerComments,
  onResolveComment,
  onAddOwnerReply,
  showSmartReuse,
  smartReuseExcerpts,
  onInsertAsReference,
  onDismissExcerpt,
}) => {
  const visibleGeneratedSuggestions = useMemo(
    () => generatedSuggestions.filter((s) => !dismissedSuggestions.has(s.id)),
    [generatedSuggestions, dismissedSuggestions],
  );

  const lockedExp = useMemo(
    () => (lockedExperience ? experienceSuggestions.find((e) => e.id === lockedExperience) : null),
    [lockedExperience, experienceSuggestions],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          data-tour="context-panel"
          className="w-80 border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto hidden lg:block"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 320 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 space-y-4">
            {visibleGeneratedSuggestions.length > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Based on your Personal Lens
                </h3>
                <div className="space-y-3">
                  {visibleGeneratedSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-3 rounded-lg bg-background border border-border group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-foreground leading-relaxed flex-1">
                          {suggestion.suggestion}
                        </p>
                        <button
                          onClick={() => onDismissSuggestion(suggestion.id)}
                          data-tour="dismiss-suggestion"
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

            {visibleGeneratedSuggestions.length > 0 && (
              <div className="my-4">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            )}

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
                    onClick={onGeneratePromptStrategy}
                    disabled={!currentPromptId || isGeneratingStrategy}
                  >
                    {promptStrategy ? 'Refresh' : 'Generate'}
                  </Button>
                </div>

                {isGeneratingStrategy && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">
                      Analyzing prompt and finding your best story angles...
                    </p>
                  </div>
                )}

                {!isGeneratingStrategy && promptStrategy?.approach && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{promptStrategy.approach}</p>
                )}

                {!isGeneratingStrategy && !promptStrategy && (
                  <p className="text-xs text-muted-foreground italic">
                    No strategy yet. Generate one to get tailored guidance.
                  </p>
                )}

                {strategyError && <p className="text-xs text-destructive mt-2">{strategyError}</p>}
              </div>
            )}

            {currentEssay && (
              <div className="my-4">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            )}

            {lockedExp ? (
              <div className="rounded-lg bg-muted/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Selected Angle
                  </h3>
                  <button
                    onClick={() => {
                      onLockExperience(null);
                      onSelectExperience(null);
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
                    Using {lockedExp.name} to show{' '}
                    {lockedExp.guidance.whyItFits.toLowerCase().includes('shows')
                      ? lockedExp.guidance.whyItFits.toLowerCase().split('shows')[1]?.trim()
                      : 'your growth and values.'}
                  </p>
                </div>

                {(lockedExp.guidance.startWith ||
                  lockedExp.guidance.focusOn ||
                  lockedExp.guidance.avoidFocus) && (
                  <div className="mt-4 space-y-2.5">
                    {lockedExp.guidance.startWith && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          Start with
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lockedExp.guidance.startWith}
                        </p>
                      </div>
                    )}
                    {lockedExp.guidance.focusOn && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          Focus on
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lockedExp.guidance.focusOn}
                        </p>
                      </div>
                    )}
                    {lockedExp.guidance.avoidFocus && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          Avoid
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lockedExp.guidance.avoidFocus}
                        </p>
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
            ) : (
              <div className="rounded-lg bg-muted/20 p-4">
                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Story Suggestions
                </h3>

                {experienceSuggestions.length === 0 ? (
                  <div className="space-y-3">
                    {isGeneratingStrategy ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs text-muted-foreground">
                          Finding experiences that match this prompt...
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {promptStrategy
                          ? 'No specific suggestions for this prompt yet. Write from your heart!'
                          : 'Generate a prompt strategy to get tailored suggestions.'}
                      </p>
                    )}

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-foreground mb-2">
                            Want more tailored story suggestions? Adding a personal note can help.
                          </p>
                          <button
                            onClick={onOpenPersonalLens}
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
                      .filter((exp) => !dismissedSuggestions.has(`exp-${exp.id}-${currentEssay?.id}`))
                      .map((experience) => {
                        const isSelected = selectedExperience === experience.id;
                        const usedInOtherEssays = experience.usedIn.filter((id) => id !== currentEssay?.id);
                        const isUsedElsewhere = usedInOtherEssays.length > 0;
                        const isUsedInSameSchool = usedInOtherEssays.some((essayId) =>
                          currentCollege?.essays.some((e) => e.id === essayId),
                        );

                        return (
                          <motion.div
                            key={experience.id}
                            layout
                            className={`rounded-xl border-2 transition-all cursor-pointer group relative ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : isUsedInSameSchool
                                  ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                  : 'border-border bg-card hover:border-primary/30'
                            }`}
                            onClick={() => onSelectExperience(isSelected ? null : experience.id)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismissExperienceSuggestion(experience.id);
                              }}
                              data-tour="dismiss-suggestion"
                              className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
                              title="Dismiss suggestion"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <BookOpen
                                    className={`w-4 h-4 flex-shrink-0 ${
                                      isSelected ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                  />
                                  <span className="text-body-sm font-medium text-foreground">
                                    {experience.name}
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                    experience.guidance.matchStrength === 'strong'
                                      ? 'bg-emerald-500/15 text-emerald-600'
                                      : 'bg-amber-500/15 text-amber-600'
                                  }`}
                                >
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
                                    Already used in another {currentCollege?.name} essay. Consider a different
                                    experience or vary your angle.
                                  </span>
                                </div>
                              )}

                              {isUsedElsewhere && !isUsedInSameSchool && !isSelected && (
                                <div className="flex items-center gap-1.5 mt-2 pl-6">
                                  <span className="text-xs text-muted-foreground italic">
                                    Used in another school (okay to reuse)
                                  </span>
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
                                      {(experience.guidance.startWith ||
                                        experience.guidance.focusOn ||
                                        experience.guidance.avoidFocus) && (
                                        <div className="space-y-2.5">
                                          {experience.guidance.startWith && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                                Start with
                                              </span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">
                                                {experience.guidance.startWith}
                                              </p>
                                            </div>
                                          )}
                                          {experience.guidance.focusOn && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                                Focus on
                                              </span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">
                                                {experience.guidance.focusOn}
                                              </p>
                                            </div>
                                          )}
                                          {experience.guidance.avoidFocus && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                                                Avoid
                                              </span>
                                              <p className="text-xs text-muted-foreground leading-relaxed">
                                                {experience.guidance.avoidFocus}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div>
                                        <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                          <Target className="w-3 h-3 text-primary" />
                                          Framing Tips
                                        </h4>
                                        <ul className="space-y-1.5">
                                          {experience.guidance.framingTips.map((tip, idx) => (
                                            <li
                                              key={idx}
                                              className="flex items-start gap-2 text-xs text-muted-foreground"
                                            >
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
                                            <p className="text-xs text-amber-700">
                                              {experience.guidance.caution}
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      <button
                                        className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          onLockExperience(experience.id);
                                          if (currentEssayId && currentCollege && experienceIndex.has(experience.id)) {
                                            const alreadyUsed = (experienceUsageMap.get(experience.id) ?? []).includes(
                                              currentEssayId,
                                            );
                                            if (!alreadyUsed) {
                                              try {
                                                await addExperienceUsage({
                                                  experienceId: experience.id as Id<'experiences'>,
                                                  essayId: currentEssayId as Id<'essays'>,
                                                  collegeId: currentCollege.id as Id<'colleges'>,
                                                });
                                              } catch (error) {
                                                console.error('Failed to track experience usage:', error);
                                              }
                                            }
                                          }
                                          if (
                                            experience.guidance.starterSentences &&
                                            experience.guidance.starterSentences.length > 0
                                          ) {
                                            const starterContent = createStoredRichTextFromPlainText(
                                              experience.guidance.starterSentences.join(' '),
                                            );
                                            onSetContent(starterContent);
                                            editorInstance?.commands.setContent(
                                              parseStoredRichTextToDoc(starterContent),
                                            );
                                            onShowStarterHelper(true);
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
            )}

            {currentEssay && (
              <>
                <div className="my-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="rounded-lg bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      Essay Feedback
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={feedbackType} onValueChange={(value) => onFeedbackTypeChange(value as FeedbackType)}>
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
                      onClick={onGenerateFeedback}
                      disabled={!currentEssayId || isGeneratingFeedback}
                    >
                      {isGeneratingFeedback ? (
                        <span className="flex items-center gap-1.5">
                          <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Analyzing...
                        </span>
                      ) : (
                        'Get Feedback'
                      )}
                    </Button>
                  </div>

                  {feedbackError && <p className="text-xs text-destructive mt-2">{feedbackError}</p>}

                  {!displayedFeedback && !isGeneratingFeedback && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      No feedback yet. Generate to get coaching.
                    </p>
                  )}

                  {displayedFeedback && (
                    <div className="mt-3 space-y-3">
                      {displayedFeedback.summary && (
                        <p className="text-xs text-foreground leading-relaxed">{displayedFeedback.summary}</p>
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
                          <p className="text-xs text-primary">Next step: {displayedFeedback.nextStep}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {reviewerComments.length > 0 && (
              <>
                <div className="my-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <div className="rounded-lg bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Reviewer Comments ({reviewerComments.filter((c) => !c.resolved).length})
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {reviewerComments.map((comment) => (
                      <OwnerCommentCard
                        key={comment._id}
                        comment={comment}
                        onResolve={() => onResolveComment(comment._id)}
                        onAddReply={(content) => onAddOwnerReply(comment._id, content)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {showSmartReuse && (
              <>
                <div className="my-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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
                        <div className="px-3 py-2 bg-muted/30 border-b border-border">
                          <p className="text-xs font-medium text-foreground">{excerpt.sourceCollegeName}</p>
                          <p className="text-xs text-muted-foreground">{excerpt.sourceEssayTitle}</p>
                        </div>

                        <div className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <Quote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-4">
                              "{excerpt.excerpt}"
                            </p>
                          </div>

                          <div className="mt-2 p-2 rounded-lg bg-primary/15">
                            <p className="text-xs text-foreground leading-relaxed">{excerpt.whyItWorks}</p>
                          </div>

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

                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => onInsertAsReference(excerpt)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Insert as reference
                            </button>
                            <button
                              onClick={() => onDismissExcerpt(excerpt.id)}
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
  );
};

export default RightPanel;
