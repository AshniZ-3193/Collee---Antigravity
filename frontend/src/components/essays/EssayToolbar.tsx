import React from 'react';
import { Bold, Italic, List, ListOrdered, MessageSquare, Sparkles, Underline, Wand2 } from 'lucide-react';

import type { ActiveRichTextFormats } from '@/components/editor/SyncEssayEditor';

interface EssayToolbarProps {
  activeFormats: ActiveRichTextFormats;
  applyFormatting: (format: keyof ActiveRichTextFormats) => void;
  onOpenStrategy: () => void;
  onOpenFeedback: () => void;
  onOpenSmartReuse: () => void;
  onOpenComments: () => void;
  commentsCount: number;
  canShowSmartReuse: boolean;
}

const FormatButton: React.FC<{
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`relative rounded-md p-1.5 transition-all duration-150 ${
      active
        ? 'bg-primary/10 text-primary shadow-sm'
        : 'text-foreground/50 hover:bg-muted/80 hover:text-foreground/80'
    }`}
  >
    {children}
  </button>
);

const FeatureButton: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  variant?: 'default' | 'accent';
}> = ({ label, onClick, children, badge, disabled, variant = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
      variant === 'accent'
        ? 'bg-primary/6 text-primary hover:bg-primary/12 hover:shadow-sm'
        : 'text-foreground/60 hover:bg-muted/80 hover:text-foreground/80'
    }`}
  >
    <span className="transition-transform duration-150 group-hover:scale-110">{children}</span>
    <span>{label}</span>
    {badge !== undefined && Number(badge) > 0 && (
      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
        {badge}
      </span>
    )}
  </button>
);

const EssayToolbar: React.FC<EssayToolbarProps> = ({
  activeFormats,
  applyFormatting,
  onOpenStrategy,
  onOpenFeedback,
  onOpenSmartReuse,
  onOpenComments,
  commentsCount,
  canShowSmartReuse,
}) => {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-card/60 px-5 py-2 backdrop-blur-sm"
      data-tour="essay-toolbar"
    >
      {/* Formatting group */}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-1">
        <FormatButton active={activeFormats.bold} onClick={() => applyFormatting('bold')} title="Bold (Cmd+B)">
          <Bold className="h-3.5 w-3.5" strokeWidth={2.5} />
        </FormatButton>
        <FormatButton active={activeFormats.italic} onClick={() => applyFormatting('italic')} title="Italic (Cmd+I)">
          <Italic className="h-3.5 w-3.5" strokeWidth={2.5} />
        </FormatButton>
        <FormatButton
          active={activeFormats.underline}
          onClick={() => applyFormatting('underline')}
          title="Underline (Cmd+U)"
        >
          <Underline className="h-3.5 w-3.5" strokeWidth={2.5} />
        </FormatButton>

        <div className="mx-0.5 h-4 w-px bg-border/60" />

        <FormatButton active={activeFormats.bullet} onClick={() => applyFormatting('bullet')} title="Bullet list">
          <List className="h-3.5 w-3.5" strokeWidth={2.5} />
        </FormatButton>
        <FormatButton
          active={activeFormats.numbered}
          onClick={() => applyFormatting('numbered')}
          title="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" strokeWidth={2.5} />
        </FormatButton>
      </div>

      {/* AI features group */}
      <div className="flex items-center gap-1">
        <FeatureButton label="Strategy" onClick={onOpenStrategy} variant="accent">
          <Sparkles className="h-3.5 w-3.5" />
        </FeatureButton>
        <FeatureButton label="Feedback" onClick={onOpenFeedback} variant="accent">
          <Wand2 className="h-3.5 w-3.5" />
        </FeatureButton>
        <FeatureButton
          label="Reuse"
          onClick={onOpenSmartReuse}
          disabled={!canShowSmartReuse}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </FeatureButton>

        <div className="mx-1 h-4 w-px bg-border/40" />

        <FeatureButton label="Comments" onClick={onOpenComments} badge={commentsCount}>
          <MessageSquare className="h-3.5 w-3.5" />
        </FeatureButton>
      </div>
    </div>
  );
};

export default EssayToolbar;
