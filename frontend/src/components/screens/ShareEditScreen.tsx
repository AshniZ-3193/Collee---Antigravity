import React, { useState, useEffect, useCallback } from 'react';
import { m } from 'framer-motion';
import {
  FileText,
  GraduationCap,
  User,
  Pencil,
  Check,
  Loader2,
  AlertTriangle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { api } from '../../../convex/_generated/api';
import {
  countRichTextWords,
  normalizeRichTextForStorage,
  parseStoredRichTextToDoc,
} from '@/lib/richText';

interface ShareEditScreenProps {
  token: string;
  collegeName: string;
  promptText: string;
  essayContent: string;
  wordCount: number;
  wordLimit: number;
  authorName?: string;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bullet: boolean;
  numbered: boolean;
}

const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  bullet: false,
  numbered: false,
};

const ShareEditScreen: React.FC<ShareEditScreenProps> = ({
  token,
  collegeName,
  promptText,
  essayContent: initialContent,
  wordLimit,
  authorName,
}) => {
  const initialNormalizedContent = normalizeRichTextForStorage(initialContent);
  const [content, setContent] = useState(initialNormalizedContent);
  const [lastSyncedContent, setLastSyncedContent] = useState(initialNormalizedContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(EMPTY_FORMATS);

  const updateEssayMutation = useMutation(api.shares.updateEssayViaShare);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [StarterKit],
      content: parseStoredRichTextToDoc(initialNormalizedContent),
      editorProps: {
        attributes: {
          class:
            'min-h-[540px] w-full bg-card p-5 text-foreground text-lg leading-relaxed focus:outline-none',
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        setContent(normalizeRichTextForStorage(JSON.stringify(currentEditor.getJSON())));
        setActiveFormats({
          bold: currentEditor.isActive('bold'),
          italic: currentEditor.isActive('italic'),
          underline: currentEditor.isActive('underline'),
          bullet: currentEditor.isActive('bulletList'),
          numbered: currentEditor.isActive('orderedList'),
        });
      },
      onSelectionUpdate: ({ editor: currentEditor }) => {
        setActiveFormats({
          bold: currentEditor.isActive('bold'),
          italic: currentEditor.isActive('italic'),
          underline: currentEditor.isActive('underline'),
          bullet: currentEditor.isActive('bulletList'),
          numbered: currentEditor.isActive('orderedList'),
        });
      },
      onCreate: ({ editor: currentEditor }) => {
        setActiveFormats({
          bold: currentEditor.isActive('bold'),
          italic: currentEditor.isActive('italic'),
          underline: currentEditor.isActive('underline'),
          bullet: currentEditor.isActive('bulletList'),
          numbered: currentEditor.isActive('orderedList'),
        });
      },
    },
    [token],
  );

  useEffect(() => {
    const normalized = normalizeRichTextForStorage(initialContent);
    setContent(normalized);
    setLastSyncedContent(normalized);
    if (editor) {
      editor.commands.setContent(parseStoredRichTextToDoc(normalized));
    }
  }, [initialContent, editor]);

  const wordCount = countRichTextWords(content);
  const isOverLimit = wordCount > wordLimit;

  const saveContent = useCallback(
    async (newContent: string) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        await updateEssayMutation({
          token,
          content: newContent,
        });
        setLastSyncedContent(newContent);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save:', error);
        setSaveError('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    },
    [token, updateEssayMutation],
  );

  useEffect(() => {
    if (content === lastSyncedContent) return;

    const timer = setTimeout(() => {
      saveContent(content);
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, lastSyncedContent, saveContent]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const applyFormatting = (format: keyof ActiveFormats) => {
    if (!editor) return;

    const chain = editor.chain().focus();
    if (format === 'bold') {
      chain.toggleBold().run();
      return;
    }
    if (format === 'italic') {
      chain.toggleItalic().run();
      return;
    }
    if (format === 'underline') {
      chain.toggleUnderline().run();
      return;
    }
    if (format === 'bullet') {
      chain.toggleBulletList().run();
      return;
    }
    chain.toggleOrderedList().run();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_top_left,hsl(var(--secondary)/0.1),transparent_40%)]" />
      <m.div
        className="bg-background/80 border-b border-border backdrop-blur-md sticky top-0 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-body-sm font-medium text-primary">Editing Mode</span>
                <p className="text-xs text-muted-foreground">Changes are saved automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
                <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{authorName}'s essay</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </m.div>

      <m.main
        className="max-w-5xl mx-auto px-6 py-10 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="mb-8 rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-body font-medium text-secondary">{collegeName}</span>
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">{promptText}</p>
        </div>

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
            <m.div
              className={`h-full rounded-full ${isOverLimit ? 'bg-destructive' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((wordCount / wordLimit) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="h-px bg-border mb-6" />

        <m.div
          className="rounded-2xl border border-border bg-card/80 shadow-sm overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="border-b border-border bg-muted/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => applyFormatting('bold')}
                className={`p-2 rounded-lg transition-colors ${activeFormats.bold ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Bold (Cmd/Ctrl + B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('italic')}
                className={`p-2 rounded-lg transition-colors ${activeFormats.italic ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Italic (Cmd/Ctrl + I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('underline')}
                className={`p-2 rounded-lg transition-colors ${activeFormats.underline ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Underline (Cmd/Ctrl + U)"
              >
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button
                onClick={() => applyFormatting('bullet')}
                className={`p-2 rounded-lg transition-colors ${activeFormats.bullet ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Bulleted list"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormatting('numbered')}
                className={`p-2 rounded-lg transition-colors ${activeFormats.numbered ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Numbered list"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Rich text editor</p>
          </div>
          <EditorContent editor={editor ?? null} />
        </m.div>

        <m.div
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
        </m.div>
      </m.main>
    </div>
  );
};

export default ShareEditScreen;
