import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bold,
  Clock,
  FileText,
  Italic,
  Lightbulb,
  List,
  ListOrdered,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Quote,
  Underline,
  X,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SyncEssayEditor, { type ActiveRichTextFormats } from '@/components/editor/SyncEssayEditor';
import { getEssaySyncDocumentId } from '@/lib/prosemirrorSync';
import type { Essay } from './types';
import RightPanel from './RightPanel';

interface InsertedReference {
  id: string;
  excerptId: string;
  text: string;
  sourceName: string;
}

interface WriteWorkspaceProps {
  activeFormats: ActiveRichTextFormats;
  applyFormatting: (format: keyof ActiveRichTextFormats) => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
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
  rightPanelProps: React.ComponentProps<typeof RightPanel>;
}

const WriteWorkspace: React.FC<WriteWorkspaceProps> = ({
  activeFormats,
  applyFormatting,
  showRightPanel,
  onToggleRightPanel,
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
  rightPanelProps,
}) => {
  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => applyFormatting('bold')}
              className={`p-2 rounded-lg transition-colors ${
                activeFormats.bold ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
              title="Bold (Cmd/Ctrl + B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormatting('italic')}
              className={`p-2 rounded-lg transition-colors ${
                activeFormats.italic ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
              title="Italic (Cmd/Ctrl + I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormatting('underline')}
              className={`p-2 rounded-lg transition-colors ${
                activeFormats.underline ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
              title="Underline (Cmd/Ctrl + U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button
              onClick={() => applyFormatting('bullet')}
              className={`p-2 rounded-lg transition-colors ${
                activeFormats.bullet ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
              title="Bulleted list"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyFormatting('numbered')}
              className={`p-2 rounded-lg transition-colors ${
                activeFormats.numbered ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
              title="Numbered list"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden md:block text-xs text-muted-foreground">Select text, then format.</p>
            <button
              data-tour="show-guidance-button"
              onClick={onToggleRightPanel}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title={showRightPanel ? 'Hide guidance' : 'Show guidance'}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div data-tour="prompt-above-editor" className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
              {!isEditingPrompt ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt</span>
                    </div>
                    <p className="text-body text-foreground leading-relaxed">{currentEssay?.prompt}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {currentEssay?.wordLimit} words max
                    </span>
                    <button
                      onClick={onStartEditingPrompt}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit prompt"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Edit Prompt</span>
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
                        className="h-9 mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancelPromptEdit}
                        disabled={isUpdatingPrompt}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="collee"
                        size="sm"
                        onClick={onSavePromptEdit}
                        disabled={isUpdatingPrompt}
                      >
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
                  className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 relative group"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRemoveReference(reference.id)}
                      className="p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove reference"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3">
                    <Quote className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-foreground/80 italic leading-relaxed mb-2">"{reference.text}"</p>
                      <p className="text-xs text-muted-foreground">From: {reference.sourceName}</p>
                      <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" />
                        This is a starting point - revise or delete freely.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {showStarterHelper && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <p className="text-xs text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    This is just a starting point - revise freely or delete.
                  </p>
                  <button
                    onClick={onDismissStarterHelper}
                    className="p-1 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {hasPendingExternalReset && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>External edits were detected. Your editor will reload after you pause typing.</span>
              </div>
            )}

            {currentEssayId && (
              <div data-tour="essay-editor">
                <SyncEssayEditor
                  key={`${currentSyncDocumentId ?? currentEssayId}-${editorSyncKey}`}
                  syncDocumentId={currentSyncDocumentId ?? getEssaySyncDocumentId(currentEssayId, 0)}
                  initialStoredContent={currentEssay?.content ?? content}
                  onStoredContentChange={onEditorContentChange}
                  onFormatsChange={onFormatsChange}
                  onEditorChange={onEditorInstanceChange}
                />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-body font-medium transition-colors duration-300 ${
                isOverLimit
                  ? 'text-destructive'
                  : wordCount > wordLimit * 0.9
                    ? 'text-amber-600 dark:text-amber-400'
                    : wordCount > wordLimit * 0.5
                      ? 'text-foreground'
                      : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {wordCount}
            </span>
            <span className="text-body text-muted-foreground">/ {wordLimit} words</span>
          </div>
        </div>
      </main>

      <RightPanel {...rightPanelProps} />
    </>
  );
};

export default WriteWorkspace;
