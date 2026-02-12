import React from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

import NodeSelector from './NodeSelector';
import LinkSelector from './LinkSelector';
import ColorSelector from './ColorSelector';

interface EditorBubbleMenuProps {
  editor: Editor;
}

const FormatButton: React.FC<{
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  label: string;
}> = ({ icon: Icon, isActive, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
    }`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const Separator = () => <div className="mx-0.5 h-5 w-px bg-border" />;

const EditorBubbleMenu: React.FC<EditorBubbleMenuProps> = ({ editor }) => {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-md">
      <NodeSelector editor={editor} />

      <Separator />

      <LinkSelector editor={editor} />

      <Separator />

      <FormatButton
        icon={Bold}
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      />
      <FormatButton
        icon={Italic}
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      />
      <FormatButton
        icon={Underline}
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      />
      <FormatButton
        icon={Strikethrough}
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Strikethrough"
      />
      <FormatButton
        icon={Code}
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="Inline Code"
      />

      <Separator />

      <ColorSelector editor={editor} />
    </div>
  );
};

export default EditorBubbleMenu;
