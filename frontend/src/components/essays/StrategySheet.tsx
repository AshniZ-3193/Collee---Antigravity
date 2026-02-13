import React, { useMemo } from 'react';
import { AlertTriangle, BookOpen, Check, CheckCircle, Sparkles, Target, X } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createStoredRichTextFromPlainText, parseStoredRichTextToDoc } from '@/lib/richText';
import type { Id } from '../../../convex/_generated/dataModel';
import type {
  College,
  Essay,
  PromptFitGuidance,
  StoryExperience,
} from '@/components/screens/workspace/types';

interface StrategySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEssay?: Essay;
  currentEssayId?: string;
  currentCollege: College | null;
  currentPromptId?: string;
  promptStrategy: unknown;
  isGeneratingStrategy: boolean;
  strategyError: string | null;
  onGeneratePromptStrategy: () => void;
  experienceSuggestions: (StoryExperience & { guidance: PromptFitGuidance })[];
  selectedExperience: string | null;
  lockedExperience: string | null;
  dismissedSuggestions: Set<string>;
  onSelectExperience: (experienceId: string | null) => void;
  onLockExperience: (experienceId: string | null) => void;
  onDismissExperienceSuggestion: (experienceId: string) => void;
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
}

const StrategySheet: React.FC<StrategySheetProps> = ({
  open,
  onOpenChange,
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
  dismissedSuggestions,
  onSelectExperience,
  onLockExperience,
  onDismissExperienceSuggestion,
  experienceIndex,
  experienceUsageMap,
  addExperienceUsage,
  editorInstance,
  onSetContent,
  onShowStarterHelper,
}) => {
  const lockedExp = useMemo(
    () =>
      lockedExperience ? experienceSuggestions.find((experience) => experience.id === lockedExperience) : null,
    [lockedExperience, experienceSuggestions],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
        <div className="p-5">
          <SheetHeader>
            <SheetTitle>Prompt Strategy</SheetTitle>
            <SheetDescription>Use your best-fit experiences for this specific prompt.</SheetDescription>
          </SheetHeader>

          {currentEssay && (
            <div className="mt-4 rounded-lg bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                  <Target className="h-4 w-4 text-primary" />
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  <p className="text-xs text-muted-foreground">Analyzing prompt...</p>
                </div>
              )}

              {!isGeneratingStrategy && (promptStrategy as { approach?: string } | null)?.approach && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {(promptStrategy as { approach: string }).approach}
                </p>
              )}

              {!isGeneratingStrategy && !promptStrategy && (
                <p className="text-xs italic text-muted-foreground">
                  No strategy yet. Generate one to get tailored guidance.
                </p>
              )}

              {strategyError && <p className="mt-2 text-xs text-destructive">{strategyError}</p>}
            </div>
          )}

          <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {lockedExp ? (
            <div className="rounded-lg bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Selected Angle
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onLockExperience(null);
                    onSelectExperience(null);
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Change
                </button>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground">{lockedExp.name}</span>
                </div>
                <p className="pl-6 text-xs text-muted-foreground">{lockedExp.guidance.whyItFits}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/20 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Story Suggestions
              </h3>

              {experienceSuggestions.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  {promptStrategy
                    ? 'No specific suggestions yet for this prompt.'
                    : 'Generate prompt strategy to get suggestions.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {experienceSuggestions
                    .filter((experience) => !dismissedSuggestions.has(`exp-${experience.id}-${currentEssay?.id}`))
                    .map((experience) => {
                      const isSelected = selectedExperience === experience.id;
                      const usedInOtherEssays = (experience.usedIn ?? []).filter(
                        (essayId) => essayId !== currentEssay?.id,
                      );
                      const isUsedInSameSchool = usedInOtherEssays.some((essayId) =>
                        currentCollege?.essays.some((essay) => essay.id === essayId),
                      );

                      return (
                        <div
                          key={experience.id}
                          className={`group relative rounded-xl border-2 p-3 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : isUsedInSameSchool
                                ? 'border-amber-500/30 bg-amber-500/5'
                                : 'border-border bg-card'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onDismissExperienceSuggestion(experience.id)}
                            className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                            title="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectExperience(isSelected ? null : experience.id)}
                            className="w-full text-left"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{experience.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{experience.guidance.whyItFits}</p>
                          </button>

                          {isUsedInSameSchool && (
                            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2">
                              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500" />
                              <p className="text-xs text-amber-700">
                                Already used in another essay for this school. Consider varying angle.
                              </p>
                            </div>
                          )}

                          {isSelected && (
                            <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
                              {experience.guidance.framingTips.length > 0 && (
                                <div>
                                  <h4 className="mb-2 text-xs font-medium text-foreground">Framing tips</h4>
                                  <ul className="space-y-1.5">
                                    {experience.guidance.framingTips.map((tip, idx) => (
                                      <li key={idx} className="text-xs text-muted-foreground">
                                        • {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {experience.guidance.caution && (
                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                                  <p className="text-xs text-amber-700">{experience.guidance.caution}</p>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                size="sm"
                                onClick={async () => {
                                  onLockExperience(experience.id);

                                  if (currentEssayId && currentCollege && experienceIndex.has(experience.id)) {
                                    const alreadyUsed = (
                                      experienceUsageMap.get(experience.id) ?? []
                                    ).includes(currentEssayId);
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
                                    editorInstance?.commands.setContent(parseStoredRichTextToDoc(starterContent));
                                    onShowStarterHelper(true);
                                  }
                                }}
                              >
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Use this experience
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StrategySheet;
