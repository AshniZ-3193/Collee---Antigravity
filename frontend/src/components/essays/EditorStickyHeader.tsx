import React from 'react';
import {
  Download,
  History,
  Share2,
} from 'lucide-react';

interface EditorStickyHeaderProps {
  essayTitle: string;
  collegeName: string;
  isSaving: boolean;
  lastSavedLabel: string;
  onShowVersionHistory: () => void;
  onExport: () => void;
  onShowShareDialog: () => void;
}

const EditorStickyHeader: React.FC<EditorStickyHeaderProps> = ({
  essayTitle,
  collegeName,
  isSaving,
  lastSavedLabel,
  onShowVersionHistory,
  onExport,
  onShowShareDialog,
}) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-card px-4 py-2.5">
      {/* Left: title */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0">
          <h1 className="max-w-[min(58vw,780px)] truncate text-[15px] font-semibold leading-5 text-foreground">
            {essayTitle}
          </h1>
          <p className="mt-0.5 truncate text-[12px] leading-4 text-muted-foreground">{collegeName}</p>
        </div>
      </div>

      {/* Right: save status + actions + sidebar toggle */}
      <div className="ml-3 flex shrink-0 items-center gap-2 whitespace-nowrap">
        <div className="hidden sm:flex items-center gap-1.5 text-caption text-muted-foreground whitespace-nowrap">
          {isSaving ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
              <span>Saved {lastSavedLabel}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onShowVersionHistory}
            className="rounded-lg p-2 text-foreground/40 transition-all duration-150 hover:bg-muted/60 hover:text-foreground/70"
            title="Version history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="rounded-lg p-2 text-foreground/40 transition-all duration-150 hover:bg-muted/60 hover:text-foreground/70"
            title="Export"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onShowShareDialog}
            className="rounded-lg p-2 text-foreground/40 transition-all duration-150 hover:bg-muted/60 hover:text-foreground/70"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default EditorStickyHeader;
