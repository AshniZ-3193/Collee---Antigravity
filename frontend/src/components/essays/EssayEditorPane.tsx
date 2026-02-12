import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, FileText, Pencil, X } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SyncEssayEditor, { type ActiveRichTextFormats } from '@/components/editor/SyncEssayEditor';
import type { Essay } from '@/components/screens/workspace/types';

import EssayToolbar from './EssayToolbar';

interface InsertedReference {
  id: string;
  excerptId: string;
  text: string;
  sourceName: string;
}

interface EssayEditorPaneProps {
  activeFormats: ActiveRichTextFormats;
  applyFormatting: (format: keyof ActiveRichTextFormats) => void;
  onOpenStrategy: () => void;
  onOpenFeedback: () => void;
  onOpenSmartReuse: () => void;
  onOpenComments: () => void;
  commentsCount: number;
  canShowSmartReuse: boolean;
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
  wordCount: number;
  wordLimit: number;
  isOverLimit: boolean;
  isSaving: boolean;
  lastSavedLabel: string;
}

const EssayEditorPane: React.FC<EssayEditorPaneProps> = ({
  activeFormats,
  applyFormatting,
  onOpenStrategy,
  onOpenFeedback,
  onOpenSmartReuse,
  onOpenComments,
  commentsCount,
  canShowSmartReuse,
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
  wordCount,
  wordLimit,
  isOverLimit,
  isSaving,
  lastSavedLabel,
}) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <EssayToolbar
        activeFormats={activeFormats}
        applyFormatting={applyFormatting}
        onOpenStrategy={onOpenStrategy}
        onOpenFeedback={onOpenFeedback}
        onOpenSmartReuse={onOpenSmartReuse}
        onOpenComments={onOpenComments}
        commentsCount={commentsCount}
        canShowSmartReuse={canShowSmartReuse}
      />

      <div className="border-b border-border bg-card/40 px-4 py-1.5 text-xs text-muted-foreground">
        {isSaving ? <span className="animate-pulse text-primary">Saving...</span> : <span>Saved {lastSavedLabel}</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
            {!isEditingPrompt ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Prompt
                    </span>
                  </div>
                  <p className="text-body leading-relaxed text-foreground">{currentEssay?.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {currentEssay?.wordLimit} words max
                  </span>
                  <button
                    type="button"
                    onClick={onStartEditingPrompt}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit prompt"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Edit Prompt
                  </span>
                </div>
                <Textarea
                  value={editedPromptText}
                  onChange={(event) => onEditedPromptTextChange(event.target.value)}
                  className="min-h-[88px] resize-y"
                  placeholder="Enter the essay prompt"
                />
                <div className="flex items-end gap-3">
                  <div className="w-40">
                    <label className="text-xs text-muted-foreground">Word limit</label>
                    <Input
                      type="number"
                      min={50}
                      max={2000}
                      value={editedWordLimit}
                      onChange={(event) => onEditedWordLimitChange(event.target.value)}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onCancelPromptEdit} disabled={isUpdatingPrompt}>
                      Cancel
                    </Button>
                    <Button variant="collee" size="sm" onClick={onSavePromptEdit} disabled={isUpdatingPrompt}>
                      {isUpdatingPrompt ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
                {promptEditError && <p className="text-xs text-destructive">{promptEditError}</p>}
              </div>
            )}
          </div>

          <AnimatePresence>
            {insertedReferences.map((reference) => (
              <motion.div
                key={reference.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group relative mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
              >
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onRemoveReference(reference.id)}
                    className="rounded-lg bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remove reference"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="pr-8 text-xs leading-relaxed text-foreground">{reference.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">Source: {reference.sourceName}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {showStarterHelper && (
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Starter inserted</p>
                  <p className="text-xs text-muted-foreground">
                    Use this as a starting point, then revise to sound like you.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  onClick={onDismissStarterHelper}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {hasPendingExternalReset && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Incoming external updates detected. Syncing latest version shortly.
            </div>
          )}

          {currentEssayId && currentSyncDocumentId ? (
            <div>
              <SyncEssayEditor
                key={`${currentEssayId}-${editorSyncKey}`}
                syncDocumentId={currentSyncDocumentId}
                initialStoredContent={content}
                onStoredContentChange={onEditorContentChange}
                onFormatsChange={onFormatsChange}
                onEditorChange={onEditorInstanceChange}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Select an essay to begin writing.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span className={isOverLimit ? 'text-destructive' : ''}>Limit {wordLimit}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default EssayEditorPane;
