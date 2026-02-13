import React, { useEffect, useMemo, useRef, useCallback } from "react";
import type { SyncApi } from "@convex-dev/prosemirror-sync";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { useConvexAuth } from "convex/react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { api } from "../../../convex/_generated/api";
import { normalizeRichTextForStorage, parseStoredRichTextToDoc } from "@/lib/richText";

export interface ActiveRichTextFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bullet: boolean;
  numbered: boolean;
}

interface SyncEssayEditorProps {
  syncDocumentId: string;
  initialStoredContent: string;
  onStoredContentChange: (nextContent: string) => void;
  onFormatsChange: (formats: ActiveRichTextFormats) => void;
  onEditorChange: (editor: Editor | null) => void;
  additionalExtensions?: Extension[];
}

const EMPTY_FORMATS: ActiveRichTextFormats = {
  bold: false,
  italic: false,
  underline: false,
  bullet: false,
  numbered: false,
};

const getFormats = (editor: Editor): ActiveRichTextFormats => ({
  bold: editor.isActive("bold"),
  italic: editor.isActive("italic"),
  underline: editor.isActive("underline"),
  bullet: editor.isActive("bulletList"),
  numbered: editor.isActive("orderedList"),
});

const isSnapshotConflictError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("already exists with different content");
};

const prosemirrorSyncApi: SyncApi = {
  getSnapshot: api.prosemirror.getSnapshot,
  submitSnapshot: api.prosemirror.submitSnapshot,
  latestVersion: api.prosemirror.latestVersion,
  getSteps: api.prosemirror.getSteps,
  submitSteps: api.prosemirror.submitSteps,
};

const SyncEssayEditorInner: React.FC<SyncEssayEditorProps> = ({
  syncDocumentId,
  initialStoredContent,
  onStoredContentChange,
  onFormatsChange,
  onEditorChange,
  additionalExtensions,
}) => {
  const sync = useTiptapSync(prosemirrorSyncApi, syncDocumentId, {
    onSyncError: (error) => {
      console.error("ProseMirror sync error:", error);
    },
  });

  const hasRequestedCreateRef = useRef(false);
  
  // Store callbacks in refs to avoid dependency issues
  const onEditorChangeRef = useRef(onEditorChange);
  const onFormatsChangeRef = useRef(onFormatsChange);
  const onStoredContentChangeRef = useRef(onStoredContentChange);
  
  // Keep refs up to date
  useEffect(() => {
    onEditorChangeRef.current = onEditorChange;
    onFormatsChangeRef.current = onFormatsChange;
    onStoredContentChangeRef.current = onStoredContentChange;
  });

  useEffect(() => {
    hasRequestedCreateRef.current = false;
  }, [syncDocumentId]);

  // Extract stable primitive values from sync object
  const syncIsLoading = sync.isLoading;
  const syncInitialContent = sync.initialContent;
  const syncExtension = sync.extension;
  const syncCreate = sync.create;

  useEffect(() => {
    if (syncIsLoading) return;
    if (syncInitialContent !== null) return;
    if (!syncCreate || hasRequestedCreateRef.current) return;

    hasRequestedCreateRef.current = true;
    const initialDoc = parseStoredRichTextToDoc(initialStoredContent);

    syncCreate(initialDoc).catch((error) => {
      if (isSnapshotConflictError(error)) {
        console.warn(
          "ProseMirror snapshot creation conflicted; waiting for server state refresh.",
          error,
        );
        return;
      }

      hasRequestedCreateRef.current = false;
      console.error("Failed to create synced ProseMirror doc:", error);
    });
  }, [syncIsLoading, syncInitialContent, syncCreate, initialStoredContent]);

  // Memoize extensions using stable primitive values
  const extensions = useMemo(() => {
    const base = [StarterKit, ...(additionalExtensions ?? [])];
    if (!syncIsLoading && syncInitialContent !== null && syncExtension) {
      return [...base, syncExtension];
    }
    return base;
  }, [syncIsLoading, syncInitialContent, syncExtension, additionalExtensions]);

  // Stable callbacks for editor events
  const handleUpdate = useCallback(({ editor: nextEditor }: { editor: Editor }) => {
    onStoredContentChangeRef.current(normalizeRichTextForStorage(JSON.stringify(nextEditor.getJSON())));
    onFormatsChangeRef.current(getFormats(nextEditor));
  }, []);

  const handleSelectionUpdate = useCallback(({ editor: nextEditor }: { editor: Editor }) => {
    onFormatsChangeRef.current(getFormats(nextEditor));
  }, []);

  const handleCreate = useCallback(({ editor: nextEditor }: { editor: Editor }) => {
    onFormatsChangeRef.current(getFormats(nextEditor));
  }, []);

  // Handle all transactions including format toggles (Cmd+B, Cmd+I, Cmd+U)
  const handleTransaction = useCallback(({ editor: nextEditor }: { editor: Editor }) => {
    onFormatsChangeRef.current(getFormats(nextEditor));
  }, []);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: !syncIsLoading && syncInitialContent !== null,
      extensions,
      content:
        !syncIsLoading && syncInitialContent !== null
          ? syncInitialContent
          : parseStoredRichTextToDoc(initialStoredContent),
      editorProps: {
        attributes: {
          class:
            "essay-editor min-h-[420px] w-full text-[1.0625rem] leading-[1.75] tracking-[-0.005em] text-foreground/90 focus:outline-none placeholder:text-muted-foreground/40",
        },
      },
      onUpdate: handleUpdate,
      onSelectionUpdate: handleSelectionUpdate,
      onCreate: handleCreate,
      onTransaction: handleTransaction,
    },
    [syncDocumentId, extensions, syncIsLoading, syncInitialContent],
  );

  // Notify parent of editor changes without causing re-render loops
  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    if (editorRef.current !== editor) {
      editorRef.current = editor ?? null;
      onEditorChangeRef.current(editor ?? null);
    }
  }, [editor]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      onEditorChangeRef.current(null);
      onFormatsChangeRef.current(EMPTY_FORMATS);
    };
  }, []);

  return (
    <div className="w-full min-h-[380px]">
      <EditorContent editor={editor ?? null} />
      {editor === null && (
        <div className="py-4">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-3/4 rounded-full bg-muted/60" />
            <div className="h-4 w-full rounded-full bg-muted/60" />
            <div className="h-4 w-5/6 rounded-full bg-muted/60" />
            <div className="h-4 w-2/3 rounded-full bg-muted/60" />
            <div className="h-4 w-4/5 rounded-full bg-muted/60" />
          </div>
        </div>
      )}
    </div>
  );
};

const SyncEssayEditor: React.FC<SyncEssayEditorProps> = (props) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { onEditorChange, onFormatsChange } = props;

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    onEditorChange(null);
    onFormatsChange(EMPTY_FORMATS);
  }, [isAuthenticated, isLoading, onEditorChange, onFormatsChange]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="w-full min-h-[420px]">
        <div className="py-4">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-3/4 rounded-full bg-muted/60" />
            <div className="h-4 w-full rounded-full bg-muted/60" />
            <div className="h-4 w-5/6 rounded-full bg-muted/60" />
            <div className="h-4 w-2/3 rounded-full bg-muted/60" />
            <div className="h-4 w-4/5 rounded-full bg-muted/60" />
          </div>
        </div>
      </div>
    );
  }

  return <SyncEssayEditorInner {...props} />;
};

export default SyncEssayEditor;
