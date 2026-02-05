import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  GraduationCap, 
  User, 
  Pencil, 
  Check, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ShareEditScreenProps {
  token: string;
  collegeName: string;
  promptText: string;
  essayContent: string;
  wordCount: number;
  wordLimit: number;
  authorName?: string;
}

const ShareEditScreen: React.FC<ShareEditScreenProps> = ({
  token,
  collegeName,
  promptText,
  essayContent: initialContent,
  wordCount: initialWordCount,
  wordLimit,
  authorName,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateEssayMutation = useMutation(api.shares.updateEssayViaShare);

  // Calculate word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > wordLimit;

  // Auto-save with debounce
  const saveContent = useCallback(async (newContent: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateEssayMutation({
        token,
        content: newContent,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [token, updateEssayMutation]);

  // Debounced auto-save
  useEffect(() => {
    if (content === initialContent) return;
    
    const timer = setTimeout(() => {
      saveContent(content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, initialContent, saveContent]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <motion.div
        className="bg-amber-500/10 border-b border-amber-500/20 sticky top-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="text-body-sm font-medium text-amber-600">Editing Mode</span>
                <p className="text-xs text-amber-600/70">Changes are saved automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Save status */}
              <div className="flex items-center gap-2 text-body-sm">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                ) : saveError ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">{saveError}</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-muted-foreground">Saved at {formatTime(lastSaved)}</span>
                  </>
                ) : null}
              </div>
              {authorName && (
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{authorName}'s essay</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.main
        className="max-w-3xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* College & Prompt */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-body font-medium text-secondary">{collegeName}</span>
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* Word Count Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-body-sm font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {wordCount} / {wordLimit} words
            </span>
            {isOverLimit && (
              <span className="text-body-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Over limit by {wordCount - wordLimit} words
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isOverLimit ? 'bg-destructive' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((wordCount / wordLimit) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Editable Essay Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your essay..."
            className="w-full min-h-[500px] p-4 rounded-xl border border-border bg-card text-foreground text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-8 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-between text-body-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Editing as guest</span>
            </div>
            <span>Created with Collee</span>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ShareEditScreen;
