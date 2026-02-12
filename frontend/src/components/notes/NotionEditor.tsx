import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

import { normalizeRichTextForStorage, parseStoredRichTextToDoc } from '@/lib/richText';

import { CalloutExtension } from './extensions/CalloutExtension';
import { SlashCommandExtension } from './extensions/SlashCommandExtension';

interface NotionEditorProps {
  initialContent: string;
  onContentChange: (nextContent: string) => void;
  onDebouncedSave: (nextContent: string) => void;
  editable?: boolean;
}

const NotionEditor: React.FC<NotionEditorProps> = ({
  initialContent,
  onContentChange,
  onDebouncedSave,
  editable = true,
}) => {
  const saveTimerRef = useRef<number | null>(null);

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
        SlashCommandExtension,
      ],
      content: parseStoredRichTextToDoc(initialContent),
      editorProps: {
        attributes: {
          class:
            'min-h-[460px] w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground focus:outline-none',
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
      },
    },
    [editable],
  );

  useEffect(() => {
    if (!editor) return;
    const currentSerialized = normalizeRichTextForStorage(JSON.stringify(editor.getJSON()));
    if (currentSerialized !== initialContent) {
      editor.commands.setContent(parseStoredRichTextToDoc(initialContent), false);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <EditorContent editor={editor} />
    </div>
  );
};

export default NotionEditor;
