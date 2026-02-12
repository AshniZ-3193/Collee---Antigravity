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
    className={`rounded-lg p-2 transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
    }`}
  >
    {children}
  </button>
);

const TriggerButton: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}> = ({ label, onClick, children, badge, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
    <span>{label}</span>
    {badge !== undefined && (
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-foreground">{badge}</span>
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
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/50 px-4 py-2"
      data-tour="essay-toolbar"
    >
      <div className="flex items-center gap-1.5">
        <FormatButton active={activeFormats.bold} onClick={() => applyFormatting('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </FormatButton>
        <FormatButton active={activeFormats.italic} onClick={() => applyFormatting('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </FormatButton>
        <FormatButton
          active={activeFormats.underline}
          onClick={() => applyFormatting('underline')}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </FormatButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <FormatButton active={activeFormats.bullet} onClick={() => applyFormatting('bullet')} title="Bulleted">
          <List className="h-4 w-4" />
        </FormatButton>
        <FormatButton
          active={activeFormats.numbered}
          onClick={() => applyFormatting('numbered')}
          title="Numbered"
        >
          <ListOrdered className="h-4 w-4" />
        </FormatButton>
      </div>

      <div className="flex items-center gap-2">
        <TriggerButton label="Strategy" onClick={onOpenStrategy}>
          <Sparkles className="h-3.5 w-3.5" />
        </TriggerButton>
        <TriggerButton label="Feedback" onClick={onOpenFeedback}>
          <Wand2 className="h-3.5 w-3.5" />
        </TriggerButton>
        <TriggerButton
          label="Reuse"
          onClick={onOpenSmartReuse}
          disabled={!canShowSmartReuse}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </TriggerButton>
        <TriggerButton label="Comments" onClick={onOpenComments} badge={commentsCount}>
          <MessageSquare className="h-3.5 w-3.5" />
        </TriggerButton>
      </div>
    </div>
  );
};

export default EssayToolbar;
