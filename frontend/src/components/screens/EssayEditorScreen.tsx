import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Clock, 
  Check,
  Settings,
  History
} from 'lucide-react';

interface EssayEditorScreenProps {
  collegeName: string;
  promptText: string;
  wordLimit: number;
  onBack: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

const EssayEditorScreen: React.FC<EssayEditorScreenProps> = ({
  collegeName,
  promptText,
  wordLimit,
  onBack,
  onOpenHistory,
  onOpenSettings,
}) => {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > wordLimit;

  // Simulated autosave
  useEffect(() => {
    if (content) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content]);

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        newSet.delete(format);
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-body-sm">Back</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenHistory}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Version history"
              >
                <History className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Editor settings"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-body-sm text-muted-foreground">{collegeName}</p>
            <p className="text-body text-foreground line-clamp-1">{promptText}</p>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleFormat('bold')}
                className={`p-2 rounded-lg transition-colors ${
                  activeFormats.has('bold') 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleFormat('italic')}
                className={`p-2 rounded-lg transition-colors ${
                  activeFormats.has('italic') 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleFormat('underline')}
                className={`p-2 rounded-lg transition-colors ${
                  activeFormats.has('underline') 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => toggleFormat('list')}
                className={`p-2 rounded-lg transition-colors ${
                  activeFormats.has('list') 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
              {isSaving ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span>Saved at {formatTime(lastSaved)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Editor Area */}
      <motion.main
        className="flex-1 px-6 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your essay..."
            className="w-full min-h-[400px] bg-transparent text-foreground text-lg leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50"
            style={{
              fontWeight: activeFormats.has('bold') ? 600 : 400,
              fontStyle: activeFormats.has('italic') ? 'italic' : 'normal',
              textDecoration: activeFormats.has('underline') ? 'underline' : 'none',
            }}
          />
        </div>
      </motion.main>

      {/* Footer - Word Count */}
      <motion.footer
        className="border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-body font-medium ${
                isOverLimit ? 'text-destructive' : 'text-foreground'
              }`}>
                {wordCount}
              </span>
              <span className="text-body text-muted-foreground">
                / {wordLimit} words
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isOverLimit ? 'bg-destructive' : 'bg-primary'
                }`}
                style={{ width: `${Math.min((wordCount / wordLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default EssayEditorScreen;
