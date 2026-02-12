import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ChevronDown, Type, Heading1, Heading2, Heading3, List, ListOrdered, TextQuote, Code, CheckSquare } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NodeSelectorProps {
  editor: Editor;
}

const NODE_TYPES = [
  { label: 'Text', icon: Type, command: (e: Editor) => e.chain().focus().setParagraph().run(), check: (e: Editor) => e.isActive('paragraph') && !e.isActive('bulletList') && !e.isActive('orderedList') },
  { label: 'Heading 1', icon: Heading1, command: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run(), check: (e: Editor) => e.isActive('heading', { level: 1 }) },
  { label: 'Heading 2', icon: Heading2, command: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run(), check: (e: Editor) => e.isActive('heading', { level: 2 }) },
  { label: 'Heading 3', icon: Heading3, command: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run(), check: (e: Editor) => e.isActive('heading', { level: 3 }) },
  { label: 'Bullet List', icon: List, command: (e: Editor) => e.chain().focus().toggleBulletList().run(), check: (e: Editor) => e.isActive('bulletList') },
  { label: 'Numbered List', icon: ListOrdered, command: (e: Editor) => e.chain().focus().toggleOrderedList().run(), check: (e: Editor) => e.isActive('orderedList') },
  { label: 'Quote', icon: TextQuote, command: (e: Editor) => e.chain().focus().toggleBlockquote().run(), check: (e: Editor) => e.isActive('blockquote') },
  { label: 'Code Block', icon: Code, command: (e: Editor) => e.chain().focus().toggleCodeBlock().run(), check: (e: Editor) => e.isActive('codeBlock') },
  { label: 'Checklist', icon: CheckSquare, command: (e: Editor) => e.chain().focus().toggleTaskList().run(), check: (e: Editor) => e.isActive('taskList') },
];

const NodeSelector: React.FC<NodeSelectorProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);

  const active = NODE_TYPES.find((n) => n.check(editor));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-foreground hover:bg-muted"
        >
          {active?.label ?? 'Text'}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start" sideOffset={8}>
        {NODE_TYPES.map((node) => {
          const Icon = node.icon;
          const isActive = node.check(editor);
          return (
            <button
              key={node.label}
              type="button"
              onClick={() => {
                node.command(editor);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4" />
              {node.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default NodeSelector;
