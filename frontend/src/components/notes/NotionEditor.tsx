import React, { useCallback, useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { common, createLowlight } from 'lowlight';

import { normalizeRichTextForStorage, parseStoredRichTextToDoc } from '@/lib/richText';

import { CalloutExtension } from './extensions/CalloutExtension';
import { SlashCommandExtension } from './extensions/SlashCommandExtension';
import EditorBubbleMenu from './EditorBubbleMenu';

const lowlight = createLowlight(common);

interface NotionEditorProps {
  initialContent: string;
  onContentChange: (nextContent: string) => void;
  onDebouncedSave: (nextContent: string) => void;
  editable?: boolean;
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
        StarterKit.configure({
          codeBlock: false,
        }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: "Type '/' for commands..." }),
        Image.configure({ inline: false, allowBase64: true }),
        Link.configure({ openOnClick: false, autolink: true }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        CodeBlockLowlight.configure({ lowlight }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Typography,
        CalloutExtension,
        SlashCommandExtension,
      ],
      content: parseStoredRichTextToDoc(initialContent),
      editorProps: {
        attributes: {
          class:
            'min-h-[460px] w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed text-foreground focus:outline-none',
        },
        handleDrop: (view, event, _slice, moved) => {
          if (moved || !event.dataTransfer?.files?.length) return false;
          const file = event.dataTransfer.files[0];
          if (!file?.type.startsWith('image/')) return false;

          readFileAsDataUrl(file).then((src) => {
            const { schema } = view.state;
            const node = schema.nodes.image?.create({ src });
            if (!node) return;
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coordinates) {
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            }
          });
          return true;
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;

          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (!file) continue;

              readFileAsDataUrl(file).then((src) => {
                const { schema } = view.state;
                const node = schema.nodes.image?.create({ src });
                if (!node) return;
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              });
              return true;
            }
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
      },
    },
    [editable],
  );

  useEffect(() => {
    if (!editor) return;
    const currentSerialized = normalizeRichTextForStorage(JSON.stringify(editor.getJSON()));
    if (currentSerialized !== initialContent) {
      editor.commands.setContent(parseStoredRichTextToDoc(initialContent), { emitUpdate: false });
    }
  }, [editor, initialContent]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const shouldShowBubbleMenu = useCallback(
    ({ editor: e, from, to }: { editor: any; element: HTMLElement; view: any; state: any; oldState?: any; from: number; to: number }) => {
      if (!e) return false;
      if (e.isActive('codeBlock')) return false;
      return from !== to;
    },
    [],
  );

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={shouldShowBubbleMenu}
        >
          <EditorBubbleMenu editor={editor} />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default NotionEditor;
