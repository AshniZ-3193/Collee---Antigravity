import React, { useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Bold, FileText, Italic, List, ListOrdered, MessageSquare, Pencil, SpellCheck, Sparkles, Underline, Wand2, X } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { Extension } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SyncEssayEditor, { type ActiveRichTextFormats } from '@/components/editor/SyncEssayEditor';
import GrammarTooltip from './grammar/GrammarTooltip';
import type { GrammarIssue } from './grammar/types';
import type { Essay } from '@/components/screens/workspace/types';

interface InsertedReference {
  id: string;
  excerptId: string;
  text: string;
  sourceName: string;
}

interface EssayEditorPaneProps {
  isEditingPrompt: boolean;
  isUpdatingPrompt: boolean;
  editedPromptText: string;
  editedWordLimit: string;
  promptEditError: string | null;
  onStartEditingPrompt: () => void;
  onCancelPromptEdit: () => void;
  onSavePromptEdit: () => void;
  onEditedPromptTextChange: (value: string) => void;
  onEditedWordLimitChange: (value: string) => void;
  insertedReferences: InsertedReference[];
  onRemoveReference: (referenceId: string) => void;
  showStarterHelper: boolean;
  onDismissStarterHelper: () => void;
  hasPendingExternalReset: boolean;
  currentEssay?: Essay;
  currentEssayId?: string;
  currentSyncDocumentId?: string;
  editorSyncKey: number;
  content: string;
  onEditorContentChange: (content: string) => void;
  onFormatsChange: (formats: ActiveRichTextFormats) => void;
  onEditorInstanceChange: (editor: Editor | null) => void;
  onOpenStrategy: () => void;
  onOpenFeedback: () => void;
  onOpenComments: () => void;
  onOpenGrammar: () => void;
  activeFormats: ActiveRichTextFormats;
  applyFormatting: (format: keyof ActiveRichTextFormats) => void;
  wordCount: number;
  wordLimit: number;
  isOverLimit: boolean;
  additionalExtensions?: Extension[];
  grammarIssues?: GrammarIssue[];
  grammarEnabled?: boolean;
  editorInstance?: Editor | null;
  onApplyGrammarSuggestion?: (issue: GrammarIssue, suggestion: { text: string }) => void;
  onIgnoreGrammarIssue?: (issue: GrammarIssue) => void;
  onAddToDictionary?: (word: string) => void;
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

const EssayEditorPane: React.FC<EssayEditorPaneProps> = ({
  isEditingPrompt,
  isUpdatingPrompt,
  editedPromptText,
  editedWordLimit,
  promptEditError,
  onStartEditingPrompt,
  onCancelPromptEdit,
  onSavePromptEdit,
  onEditedPromptTextChange,
  onEditedWordLimitChange,
  insertedReferences,
  onRemoveReference,
  showStarterHelper,
  onDismissStarterHelper,
  hasPendingExternalReset,
  currentEssay,
  currentEssayId,
  currentSyncDocumentId,
  editorSyncKey,
  content,
  onEditorContentChange,
  onFormatsChange,
  onEditorInstanceChange,
  onOpenStrategy,
  onOpenFeedback,
  onOpenComments,
  onOpenGrammar,
  activeFormats,
  applyFormatting,
  wordCount,
  wordLimit,
  isOverLimit,
  additionalExtensions,
  grammarIssues,
  grammarEnabled,
  editorInstance,
  onApplyGrammarSuggestion,
  onIgnoreGrammarIssue,
  onAddToDictionary,
}) => {
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const handlePromptDialogOpenChange = (open: boolean) => {
    setIsPromptDialogOpen(open);
    if (!open && isEditingPrompt) {
      onCancelPromptEdit();
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-muted/20">
      <div className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-soft md:p-8">
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4"
            data-tour="essay-toolbar"
          >
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

            <button
              type="button"
              onClick={() => setIsPromptDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground/75 transition-colors hover:bg-muted/40"
            >
              <FileText className="h-3.5 w-3.5" />
              Prompt
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {wordLimit} max
              </span>
            </button>
          </div>

          <div className="mb-4 flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onOpenStrategy}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-foreground/80"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Strategy
            </button>
            <button
              type="button"
              onClick={onOpenFeedback}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-foreground/80"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Feedback
            </button>
            <button
              type="button"
              onClick={onOpenComments}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-foreground/80"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Comments
            </button>
            <button
              type="button"
              onClick={onOpenGrammar}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-foreground/80"
            >
              <SpellCheck className="h-3.5 w-3.5" />
              Grammar
            </button>
          </div>

          {/* Inserted references */}
          <AnimatePresence>
            {insertedReferences.map((reference) => (
              <m.div
                key={reference.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
                className="group relative mb-4 rounded-xl border border-primary/10 bg-primary/[0.03] p-4"
              >
                <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onRemoveReference(reference.id)}
                    className="rounded-lg bg-background/90 p-1.5 text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remove reference"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="pr-8 text-body-sm leading-relaxed text-foreground/80">{reference.text}</p>
                <p className="mt-2 text-caption text-muted-foreground">
                  From {reference.sourceName}
                </p>
              </m.div>
            ))}
          </AnimatePresence>

          {/* Starter helper */}
          {showStarterHelper && (
            <m.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-3"
            >
              <div>
                <p className="text-body-sm font-medium text-foreground">Starter inserted</p>
                <p className="text-caption text-muted-foreground">
                  Use this as a starting point, then revise to sound like you.
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                onClick={onDismissStarterHelper}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </m.div>
          )}

          {/* External reset warning */}
          {hasPendingExternalReset && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-caption text-amber-700 dark:text-amber-400">
              Incoming external updates detected. Syncing latest version shortly.
            </div>
          )}

          {/* Editor */}
          {currentEssayId && currentSyncDocumentId ? (
            <div ref={editorWrapperRef} className="essay-editor-wrapper">
              <SyncEssayEditor
                key={`${currentEssayId}-${editorSyncKey}`}
                syncDocumentId={currentSyncDocumentId}
                initialStoredContent={content}
                onStoredContentChange={onEditorContentChange}
                onFormatsChange={onFormatsChange}
                onEditorChange={onEditorInstanceChange}
                additionalExtensions={additionalExtensions}
              />
              {grammarEnabled && editorInstance && grammarIssues && onApplyGrammarSuggestion && onIgnoreGrammarIssue && (
                <GrammarTooltip
                  containerRef={editorWrapperRef}
                  issues={grammarIssues}
                  onApplySuggestion={onApplyGrammarSuggestion}
                  onIgnoreIssue={onIgnoreGrammarIssue}
                  onAddToDictionary={onAddToDictionary}
                />
              )}
            </div>
          ) : (
            <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
              <p className="text-body-sm text-muted-foreground">Select an essay to begin writing.</p>
            </div>
          )}

          {/* Word count footer */}
          <div className="mt-6 flex items-center justify-end border-t border-border/20 pt-4">
            <span className={`text-caption tabular-nums ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {wordCount} / {wordLimit} words
            </span>
          </div>
        </div>

        <Dialog open={isPromptDialogOpen} onOpenChange={handlePromptDialogOpenChange}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Essay Prompt</DialogTitle>
              <DialogDescription>
                Keep the prompt handy without taking up the writing canvas.
              </DialogDescription>
            </DialogHeader>

            {!isEditingPrompt ? (
              <div className="space-y-3">
                <p className="text-body-sm leading-relaxed text-foreground/85">{currentEssay?.prompt}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {currentEssay?.wordLimit ?? wordLimit} words max
                  </span>
                  <Button variant="ghost" size="sm" onClick={onStartEditingPrompt}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit prompt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  value={editedPromptText}
                  onChange={(event) => onEditedPromptTextChange(event.target.value)}
                  className="min-h-[110px] resize-y border-border/40 bg-background/50"
                  placeholder="Enter the essay prompt"
                />
                <div className="w-40">
                  <label htmlFor="word-limit-input" className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Word limit
                  </label>
                  <Input
                    id="word-limit-input"
                    type="number"
                    min={50}
                    max={2000}
                    value={editedWordLimit}
                    onChange={(event) => onEditedWordLimitChange(event.target.value)}
                    className="mt-1 h-8 border-border/40 bg-background/50"
                  />
                </div>
                {promptEditError && <p className="text-xs text-destructive">{promptEditError}</p>}
                <DialogFooter>
                  <Button variant="ghost" size="sm" onClick={onCancelPromptEdit} disabled={isUpdatingPrompt}>
                    Cancel
                  </Button>
                  <Button variant="collee" size="sm" onClick={onSavePromptEdit} disabled={isUpdatingPrompt}>
                    {isUpdatingPrompt ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
};

export default EssayEditorPane;
