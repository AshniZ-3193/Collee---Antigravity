import React from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROMPT_TYPES } from '@/lib/promptTypes';
import type { EssayPrompt, SelectedCollegeConfig } from './types';

interface PromptsStepProps {
  currentConfig?: SelectedCollegeConfig;
  currentConfigIndex: number;
  collegeConfigsLength: number;
  isAutoAdding: boolean;
  isSearchingPrompts: boolean;
  promptSearchError: string | null;
  noPromptsFound: boolean;
  qualityStatusMessage: string | null;
  hiddenPromptCount: number;
  showAllPrompts: boolean;
  onToggleShowAll: () => void;
  displayPrompts: EssayPrompt[];
  totalPromptCount: number;
  onRemovePrompt: (id: string) => void;
  onUpdatePrompt: (id: string, field: keyof EssayPrompt, value: string | number | boolean) => void;
  onAddPrompt: () => void;
  canAddCollege: boolean;
  onAddCollegeAndContinue: () => void;
}

const PromptsStep: React.FC<PromptsStepProps> = ({
  currentConfig,
  currentConfigIndex,
  collegeConfigsLength,
  isAutoAdding,
  isSearchingPrompts,
  promptSearchError,
  noPromptsFound,
  qualityStatusMessage,
  hiddenPromptCount,
  showAllPrompts,
  onToggleShowAll,
  displayPrompts,
  totalPromptCount,
  onRemovePrompt,
  onUpdatePrompt,
  onAddPrompt,
  canAddCollege,
  onAddCollegeAndContinue,
}) => {
  return (
    <motion.div
      key={`prompts-${currentConfigIndex}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {isAutoAdding && (
        <p className="text-body-sm text-muted-foreground">
          Adding {currentConfig?.collegeName} with auto-found prompts...
        </p>
      )}
      {isSearchingPrompts && (
        <p className="text-body-sm text-muted-foreground">
          Searching for prompts for {currentConfig?.collegeName}...
        </p>
      )}
      {promptSearchError && <p className="text-body-sm text-destructive">{promptSearchError}</p>}
      {noPromptsFound && !promptSearchError && !isSearchingPrompts && (
        <p className="text-body-sm text-muted-foreground">No prompts found. You can add them manually.</p>
      )}
      {qualityStatusMessage && <p className="text-body-sm text-muted-foreground">{qualityStatusMessage}</p>}

      {hiddenPromptCount > 0 && !isSearchingPrompts && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-body-sm text-muted-foreground">
            {hiddenPromptCount} specialized program prompt{hiddenPromptCount > 1 ? 's' : ''} hidden
          </span>
          <button
            onClick={onToggleShowAll}
            className="flex items-center gap-1.5 text-body-sm text-primary hover:text-primary/80 transition-colors"
          >
            {showAllPrompts ? (
              <>
                <EyeOff className="w-4 h-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Show all
              </>
            )}
          </button>
        </div>
      )}

      {displayPrompts.map((prompt, index) => (
        <motion.div
          key={prompt.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="p-4 rounded-xl border border-border bg-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-medium text-foreground">Essay {index + 1}</span>
              {prompt.targetProgram && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {prompt.targetProgram}
                </span>
              )}
            </div>
            {totalPromptCount > 1 && (
              <button
                onClick={() => onRemovePrompt(prompt.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prompt text</label>
            <Textarea
              placeholder="Paste or type the essay prompt here..."
              value={prompt.promptText}
              onChange={(e) => onUpdatePrompt(prompt.id, 'promptText', e.target.value)}
              className="min-h-[80px] bg-background resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Prompt type (optional)
            </label>
            <Select
              value={prompt.promptType}
              onValueChange={(value) => onUpdatePrompt(prompt.id, 'promptType', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max words</label>
            <Input
              type="number"
              placeholder="250"
              value={prompt.limitValue || ''}
              onChange={(e) => onUpdatePrompt(prompt.id, 'limitValue', parseInt(e.target.value, 10) || 0)}
              className="bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdatePrompt(prompt.id, 'isOptional', !prompt.isOptional)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                prompt.isOptional
                  ? 'bg-primary border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {prompt.isOptional && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            <span className="text-xs text-muted-foreground">This prompt is optional</span>
          </div>
        </motion.div>
      ))}

      <Button variant="outline" size="sm" onClick={onAddPrompt} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add another prompt
      </Button>

      {canAddCollege && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4"
        >
          <Button
            variant="collee-accent"
            size="collee"
            onClick={onAddCollegeAndContinue}
            className="w-full"
          >
            {currentConfigIndex < collegeConfigsLength - 1
              ? `Add ${currentConfig?.collegeName} and continue`
              : `Add ${currentConfig?.collegeName} to my list`}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PromptsStep;
