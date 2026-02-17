import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { BookPlus, EyeOff } from 'lucide-react';

import type { GrammarIssue } from './types';

interface GrammarTooltipProps {
  containerRef: React.RefObject<HTMLElement | null>;
  issues: GrammarIssue[];
  onApplySuggestion: (issue: GrammarIssue, suggestion: { text: string }) => void;
  onIgnoreIssue: (issue: GrammarIssue) => void;
  onAddToDictionary?: (word: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  spelling: 'bg-red-400/15 text-red-500 border-red-400/30',
  grammar: 'bg-amber-400/15 text-amber-600 border-amber-400/30',
  style: 'bg-blue-400/15 text-blue-500 border-blue-400/30',
};

const GrammarTooltip: React.FC<GrammarTooltipProps> = ({
  containerRef,
  issues,
  onApplySuggestion,
  onIgnoreIssue,
  onAddToDictionary,
}) => {
  const [activeIssue, setActiveIssue] = useState<GrammarIssue | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clearDismissTimer = () => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const scheduleDismiss = () => {
    clearDismissTimer();
    dismissTimerRef.current = window.setTimeout(() => {
      setActiveIssue(null);
      setPosition(null);
    }, 200);
  };

  const handleMouseEnter = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const issueEl = target.closest('[data-grammar-issue-id]') as HTMLElement | null;
      if (!issueEl) return;

      const issueId = issueEl.getAttribute('data-grammar-issue-id');
      const issue = issues.find((i) => i.id === issueId);
      if (!issue) return;

      clearDismissTimer();

      const rect = issueEl.getBoundingClientRect();
      const wrapperEl = issueEl.closest('.essay-editor-wrapper');
      if (!wrapperEl) return;
      const wrapperRect = wrapperEl.getBoundingClientRect();

      setPosition({
        top: rect.bottom - wrapperRect.top + 6,
        left: rect.left - wrapperRect.left,
      });
      setActiveIssue(issue);
    },
    [issues],
  );

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      const target = e.relatedTarget as HTMLElement | null;
      if (target?.closest('[data-grammar-issue-id]') || target?.closest('[data-grammar-tooltip]')) {
        return;
      }
      scheduleDismiss();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    let isDisposed = false;
    let dom: HTMLElement | null = null;
    let rafId: number | null = null;

    const detachListeners = () => {
      if (!dom) return;
      dom.removeEventListener('mouseenter', handleMouseEnter, true);
      dom.removeEventListener('mouseleave', handleMouseLeave, true);
      dom = null;
    };

    const attachListeners = () => {
      if (isDisposed) return;

      const wrapperDom = containerRef.current;
      if (!wrapperDom) {
        rafId = window.requestAnimationFrame(attachListeners);
        return;
      }

      dom = wrapperDom;
      dom.addEventListener('mouseenter', handleMouseEnter, true);
      dom.addEventListener('mouseleave', handleMouseLeave, true);
    };

    attachListeners();

    return () => {
      isDisposed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      detachListeners();
      clearDismissTimer();
    };
  }, [containerRef, handleMouseEnter, handleMouseLeave]);

  // Dismiss when issues array changes (e.g. after fix)
  useEffect(() => {
    if (activeIssue && !issues.find((i) => i.id === activeIssue.id)) {
      setActiveIssue(null);
      setPosition(null);
    }
  }, [issues, activeIssue]);

  return (
    <AnimatePresence>
      {activeIssue && position && (
        <m.div
          ref={tooltipRef}
          data-grammar-tooltip
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' as const }}
          style={{ top: position.top, left: position.left }}
          className="absolute z-50 w-72 rounded-xl border border-border/60 bg-card p-3 shadow-lg"
          onMouseEnter={clearDismissTimer}
          onMouseLeave={() => scheduleDismiss()}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                CATEGORY_COLORS[activeIssue.category] ?? CATEGORY_COLORS.grammar
              }`}
            >
              {activeIssue.category}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              &ldquo;{activeIssue.problemText}&rdquo;
            </span>
          </div>

          <p className="mb-2.5 text-xs leading-relaxed text-foreground/85">{activeIssue.message}</p>

          {activeIssue.suggestions.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {activeIssue.suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion.text}
                  type="button"
                  onClick={() => {
                    onApplySuggestion(activeIssue, suggestion);
                    setActiveIssue(null);
                    setPosition(null);
                  }}
                  className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {suggestion.text || '(remove)'}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border/30 pt-2">
            <button
              type="button"
              onClick={() => {
                onIgnoreIssue(activeIssue);
                setActiveIssue(null);
                setPosition(null);
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <EyeOff className="h-3 w-3" />
              Ignore
            </button>
            {activeIssue.category === 'spelling' && onAddToDictionary && (
              <button
                type="button"
                onClick={() => {
                  onAddToDictionary(activeIssue.problemText);
                  setActiveIssue(null);
                  setPosition(null);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <BookPlus className="h-3 w-3" />
                Add to dictionary
              </button>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default GrammarTooltip;
