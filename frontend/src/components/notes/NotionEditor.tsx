import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

import { normalizeRichTextForStorage, parseStoredRichTextToDoc } from '@/lib/richText';

import SlashCommandMenu, { type SlashCommandItem } from './SlashCommandMenu';
import { CalloutExtension } from './extensions/CalloutExtension';

interface SlashCommandDefinition extends SlashCommandItem {
  run: (editor: Editor) => void;
}

interface NotionEditorProps {
  initialContent: string;
  onContentChange: (nextContent: string) => void;
  onDebouncedSave: (nextContent: string) => void;
  editable?: boolean;
}

const SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    description: 'Plain body text',
    run: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    description: 'Create a bulleted list',
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Create a numbered list',
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'checklist',
    label: 'Checklist',
    description: 'Track to-dos with checkboxes',
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Insert a quote block',
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Insert a horizontal divider',
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: 'callout',
    label: 'Callout',
    description: 'Insert an emphasized callout block',
    run: (editor) => editor.chain().focus().setCallout('info').run(),
  },
];

const NotionEditor: React.FC<NotionEditorProps> = ({
  initialContent,
  onContentChange,
  onDebouncedSave,
  editable = true,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuQuery, setMenuQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 160, left: 240 });
  const [menuSelectedIndex, setMenuSelectedIndex] = useState(0);
  const saveTimerRef = useRef<number | null>(null);

  const visibleCommands = useMemo(() => {
    const query = menuQuery.trim().toLowerCase();
    if (!query) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((command) => {
      const haystack = `${command.label} ${command.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [menuQuery]);

  const openSlashMenuFromEditor = (editor: Editor) => {
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 64), from, '\n', '\0');
    const match = textBefore.match(/\/([\w-]*)$/);
    if (!match) {
      setMenuOpen(false);
      setMenuQuery('');
      return;
    }

    const coords = editor.view.coordsAtPos(from);
    const maxLeft = Math.max(16, window.innerWidth - 340);
    setMenuPosition({
      top: coords.bottom + 8,
      left: Math.min(coords.left, maxLeft),
    });
    setMenuQuery(match[1] ?? '');
    setMenuOpen(true);
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      extensions: [
        StarterKit,
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: "Type '/' for commands..." }),
        CalloutExtension,
      ],
      content: parseStoredRichTextToDoc(initialContent),
      editorProps: {
        attributes: {
          class:
            'min-h-[420px] w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground leading-relaxed focus:outline-none',
        },
        handleKeyDown(view, event) {
          if (!editable) return false;

          if (menuOpen) {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setMenuSelectedIndex((prev) =>
                visibleCommands.length === 0 ? 0 : (prev + 1) % visibleCommands.length,
              );
              return true;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setMenuSelectedIndex((prev) =>
                visibleCommands.length === 0
                  ? 0
                  : (prev - 1 + visibleCommands.length) % visibleCommands.length,
              );
              return true;
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              setMenuOpen(false);
              setMenuQuery('');
              return true;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              const selected = visibleCommands[menuSelectedIndex];
              if (!selected) return true;

              const editorInstance = view && (editor as Editor | null);
              if (editorInstance) {
                const { from } = editorInstance.state.selection;
                const textBefore = editorInstance.state.doc.textBetween(
                  Math.max(0, from - 64),
                  from,
                  '\n',
                  '\0',
                );
                const match = textBefore.match(/\/([\w-]*)$/);
                if (match) {
                  const fromPos = from - match[0].length;
                  editorInstance.chain().focus().deleteRange({ from: fromPos, to: from }).run();
                }

                selected.run(editorInstance);
              }

              setMenuOpen(false);
              setMenuQuery('');
              return true;
            }

            window.setTimeout(() => {
              if (editor) {
                openSlashMenuFromEditor(editor);
              }
            }, 0);
          }

          if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
            window.setTimeout(() => {
              if (editor) {
                openSlashMenuFromEditor(editor);
              }
            }, 0);
          }

          return false;
        },
      },
      onUpdate({ editor: nextEditor }) {
        const nextContent = normalizeRichTextForStorage(JSON.stringify(nextEditor.getJSON()));
        onContentChange(nextContent);

        if (saveTimerRef.current !== null) {
          window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
          onDebouncedSave(nextContent);
        }, 1500);

        if (menuOpen) {
          openSlashMenuFromEditor(nextEditor);
        }
      },
      onBlur() {
        setMenuOpen(false);
        setMenuQuery('');
      },
    },
    [editable, menuOpen, menuSelectedIndex, visibleCommands],
  );

  useEffect(() => {
    if (!editor) return;
    const currentSerialized = normalizeRichTextForStorage(JSON.stringify(editor.getJSON()));
    if (currentSerialized !== initialContent) {
      editor.commands.setContent(parseStoredRichTextToDoc(initialContent), false);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    setMenuSelectedIndex(0);
  }, [menuQuery]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleSelectCommand = (command: SlashCommandItem) => {
    if (!editor) return;
    const fullCommand = SLASH_COMMANDS.find((item) => item.id === command.id);
    if (!fullCommand) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 64), from, '\n', '\0');
    const match = textBefore.match(/\/([\w-]*)$/);
    if (match) {
      editor.chain().focus().deleteRange({ from: from - match[0].length, to: from }).run();
    }

    fullCommand.run(editor);
    setMenuOpen(false);
    setMenuQuery('');
  };

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <SlashCommandMenu
        open={menuOpen}
        position={menuPosition}
        commands={visibleCommands}
        selectedIndex={Math.min(menuSelectedIndex, Math.max(0, visibleCommands.length - 1))}
        onSelect={handleSelectCommand}
      />
    </div>
  );
};

export default NotionEditor;
