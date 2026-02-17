import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import type { GrammarIssue, GrammarCounts } from '../grammar/types';

const EMPTY_ISSUES: GrammarIssue[] = [];
const DEFAULT_COUNTS: GrammarCounts = { spelling: 0, grammar: 0, style: 0, total: 0 };

export interface GrammarPanelProps {
  issues: GrammarIssue[];
  isAnalyzing: boolean;
  score: number;
  counts: GrammarCounts;
  onApplySuggestion: (issue: GrammarIssue, suggestion: { text: string }) => void;
  onIgnoreIssue: (issue: GrammarIssue) => void;
  onAddToDictionary?: (word: string) => void;
  editor: Editor | null;
}

const CATEGORY_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  spelling: {
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-500 border-red-400/25',
    label: 'Spelling',
  },
  grammar: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-400/10 text-amber-600 border-amber-400/25',
    label: 'Grammar',
  },
  style: {
    dot: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-500 border-blue-400/25',
    label: 'Style',
  },
};

const CATEGORY_ORDER: Array<'spelling' | 'grammar' | 'style'> = ['spelling', 'grammar', 'style'];

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/40"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={`transition-all duration-500 ${color}`}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
};

const GrammarPanel: React.FC<GrammarPanelProps> = ({
  issues = EMPTY_ISSUES,
  isAnalyzing,
  score = 100,
  counts = DEFAULT_COUNTS,
  onApplySuggestion,
  onIgnoreIssue,
  onAddToDictionary,
  editor,
}) => {
  const handleJumpToIssue = (issue: GrammarIssue) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from: issue.pmFrom, to: issue.pmTo }).run();
  };

  const groupedIssues = CATEGORY_ORDER.reduce<Record<string, GrammarIssue[]>>(
    (acc, cat) => {
      const filtered = issues.filter((i) => i.category === cat);
      if (filtered.length > 0) acc[cat] = filtered;
      return acc;
    },
    {},
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header: score + counts */}
      <div className="flex items-center gap-3">
        <ScoreRing score={score} />
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) => {
              const style = CATEGORY_STYLES[cat];
              const count = counts[cat];
              return (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {count} {style.label}
                </span>
              );
            })}
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </div>
          )}
        </div>
      </div>

      {/* Issue list grouped by category */}
      {Object.keys(groupedIssues).length === 0 && !isAnalyzing && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">No issues found</p>
          <p className="text-xs text-muted-foreground">Your writing looks great!</p>
        </div>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const catIssues = groupedIssues[cat];
        if (!catIssues) return null;
        const style = CATEGORY_STYLES[cat];

        return (
          <div key={cat} className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {style.label}
              <span className="text-muted-foreground font-normal">({catIssues.length})</span>
            </h4>

            <div className="space-y-1.5">
              {catIssues.map((issue) => (
                <div
                  key={issue.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleJumpToIssue(issue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleJumpToIssue(issue);
                    }
                  }}
                  className="w-full rounded-lg border border-border/50 bg-muted/20 p-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    &ldquo;{issue.problemText}&rdquo;
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/85">{issue.message}</p>

                  {issue.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {issue.suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion.text}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplySuggestion(issue, suggestion);
                          }}
                          className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          {suggestion.text || '(remove)'}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onIgnoreIssue(issue);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onIgnoreIssue(issue);
                        }
                      }}
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Ignore
                    </span>
                    {issue.category === 'spelling' && onAddToDictionary && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToDictionary(issue.problemText);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            onAddToDictionary(issue.problemText);
                          }
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Add to dictionary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GrammarPanel;
