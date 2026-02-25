import React from 'react';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeedbackType } from '@/components/screens/workspace/types';

export interface FeedbackPanelProps {
  feedbackType: FeedbackType;
  onFeedbackTypeChange: (type: FeedbackType) => void;
  onGenerateFeedback: () => void;
  isGeneratingFeedback: boolean;
  feedbackError: string | null;
  displayedFeedback: any;
  currentEssayId?: string;
  profilePct?: number;
  onNavigateToOnboarding?: () => void;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedbackType,
  onFeedbackTypeChange,
  onGenerateFeedback,
  isGeneratingFeedback,
  feedbackError,
  displayedFeedback,
  currentEssayId,
  profilePct,
  onNavigateToOnboarding,
}) => {
  const showProfileWarning = profilePct !== undefined && profilePct < 100;

  return (
    <div className="p-4 space-y-4">
      {showProfileWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-700">
              Profile {profilePct}% complete · Results may be less tailored.
            </p>
          </div>
          {onNavigateToOnboarding && (
            <button
              type="button"
              onClick={onNavigateToOnboarding}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap transition-colors"
            >
              Finish →
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Select value={feedbackType} onValueChange={(value) => onFeedbackTypeChange(value as FeedbackType)}>
          <SelectTrigger className="h-9 w-40 text-xs">
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
          {isGeneratingFeedback ? 'Analyzing...' : 'Get Feedback'}
        </Button>
      </div>

      {feedbackError && <p className="text-xs text-destructive">{feedbackError}</p>}

      {!displayedFeedback && !isGeneratingFeedback && (
        <p className="text-sm italic text-muted-foreground">No feedback yet. Generate to get coaching.</p>
      )}

      {displayedFeedback && (
        <div className="space-y-3">
          {displayedFeedback.summary && (
            <p className="text-sm leading-relaxed text-foreground">{displayedFeedback.summary}</p>
          )}

          {displayedFeedback.strengths?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Strengths</p>
              <div className="space-y-1">
                {displayedFeedback.strengths.slice(0, 4).map((strength: string) => (
                  <p key={strength} className="text-xs text-muted-foreground">
                    • {strength}
                  </p>
                ))}
              </div>
            </div>
          )}

          {displayedFeedback.improvements?.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Improvements</p>
              <div className="space-y-2">
                {displayedFeedback.improvements.slice(0, 3).map((item: any) => (
                  <div key={item.issue} className="rounded-lg border border-border bg-muted/20 p-2">
                    <p className="text-xs text-foreground">{item.issue}</p>
                    {item.suggestion && (
                      <p className="mt-1 text-xs text-muted-foreground">Suggestion: {item.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayedFeedback.nextStep && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <p className="text-xs text-primary">Next step: {displayedFeedback.nextStep}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
