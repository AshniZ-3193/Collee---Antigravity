import { Extension } from '@tiptap/core';
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
  type SuggestionOptions,
} from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance, type Props as TippyProps } from 'tippy.js';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  TextQuote,
  Minus,
  Code,
  Info,
  ImageIcon,
  AlertTriangle,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

import SlashCommandMenu, {
  type SlashCommandItem,
  type SlashCommandListRef,
} from '@/components/notes/SlashCommandMenu';

type CommandItem = SlashCommandItem & {
  aliases?: string[];
  icon?: LucideIcon;
  category?: string;
};

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    aliases: ['title', 'h1'],
    icon: Heading1,
    category: 'Text',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    aliases: ['subtitle', 'h2'],
    icon: Heading2,
    category: 'Text',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    aliases: ['h3'],
    icon: Heading3,
    category: 'Text',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    description: 'Plain body text',
    aliases: ['text', 'p'],
    icon: Type,
    category: 'Text',
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    description: 'Create a bulleted list',
    aliases: ['list', 'bullets'],
    icon: List,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Create a numbered list',
    aliases: ['ordered', 'numbers'],
    icon: ListOrdered,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Track tasks with checkboxes',
    aliases: ['todo', 'task'],
    icon: CheckSquare,
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Insert a quote block',
    aliases: ['blockquote'],
    icon: TextQuote,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Insert a horizontal rule',
    aliases: ['rule', 'hr'],
    icon: Minus,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'code',
    label: 'Code Block',
    description: 'Insert a code block',
    aliases: ['snippet'],
    icon: Code,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'callout-info',
    label: 'Callout',
    description: 'Insert an info callout',
    aliases: ['note'],
    icon: Info,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().setCallout('info').run(),
  },
  {
    id: 'callout-warning',
    label: 'Warning Callout',
    description: 'Insert a warning callout',
    aliases: ['warning', 'caution'],
    icon: AlertTriangle,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().setCallout('warning').run(),
  },
  {
    id: 'callout-tip',
    label: 'Tip Callout',
    description: 'Insert a tip callout',
    aliases: ['tip', 'hint'],
    icon: Lightbulb,
    category: 'Blocks',
    command: (editor) => editor.chain().focus().setCallout('tip').run(),
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Upload an image from your device',
    aliases: ['img', 'picture', 'photo'],
    icon: ImageIcon,
    category: 'Media',
    command: (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          editor.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
  },
];

const filterItems = (query: string) => {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return COMMAND_ITEMS;

  return COMMAND_ITEMS.filter((item) => {
    const haystack = [item.label, item.description, ...(item.aliases ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 10);
};

const suggestion: Omit<
  SuggestionOptions<CommandItem>,
  'editor'
> = {
  char: '/',
  allowSpaces: false,
  startOfLine: false,
  items: ({ query }) => filterItems(query),
  command: ({ editor, range, props }: { editor: any; range: any; props: CommandItem }) => {
    editor.chain().focus().deleteRange(range).run();
    props.command(editor);
  },
  render: () => {
    let component: ReactRenderer<SlashCommandListRef> | null = null;
    let popup: Instance<TippyProps>[] = [];

    return {
      onStart: (props: SuggestionProps<CommandItem>) => {
        component = new ReactRenderer(SlashCommandMenu, {
          props: {
            items: props.items,
            command: (item) => props.command(item),
          },
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate: (props: SuggestionProps<CommandItem>) => {
        if (!component) return;

        component.updateProps({
          items: props.items,
          command: (item) => props.command(item),
        });

        if (!props.clientRect || popup.length === 0) return;
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          popup[0]?.hide();
          return true;
        }

        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        popup[0]?.destroy();
        popup = [];
        component?.destroy();
        component = null;
      },
    };
  },
};

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...suggestion,
      }),
    ];
  },
});
