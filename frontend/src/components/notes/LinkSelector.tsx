import React, { useCallback, useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LinkSelectorProps {
  editor: Editor;
}

const LinkSelector: React.FC<LinkSelectorProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  const isActive = editor.isActive('link');

  useEffect(() => {
    if (open) {
      const existing = editor.getAttributes('link').href as string | undefined;
      setUrl(existing ?? '');
    }
  }, [open, editor]);

  const setLink = useCallback(() => {
    if (!url.trim()) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    setOpen(false);
  }, [editor, url]);

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  }, [editor]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" sideOffset={8}>
        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setLink();
              }
            }}
            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={setLink}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Set
          </button>
          {isActive && (
            <button
              type="button"
              onClick={removeLink}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LinkSelector;
