import { useCallback, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';

import type { ActiveRichTextFormats } from '@/components/editor/SyncEssayEditor';
import type { Version } from '@/components/screens/workspace/types';
import { useWriteTabState } from '@/components/screens/workspace/useWriteTabState';

const EMPTY_FORMATS: ActiveRichTextFormats = {
  bold: false,
  italic: false,
  underline: false,
  bullet: false,
  numbered: false,
};

export const useEssayEditorState = () => {
  const writeState = useWriteTabState();

  const [content, setContent] = useState('');
  const [activeFormats, setActiveFormats] = useState<ActiveRichTextFormats>(EMPTY_FORMATS);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const saveIndicatorTimerRef = useRef<number | null>(null);

  const [strategySheetOpen, setStrategySheetOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [smartReusePopoverOpen, setSmartReusePopoverOpen] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeletePromptDialog, setShowDeletePromptDialog] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);

  const [shareEmail, setShareEmail] = useState('');
  const [shareRecipientType, setShareRecipientType] = useState<'parent' | 'counselor'>('parent');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [isShareSent, setIsShareSent] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState<string | null>(null);
  const [shareLinkCopyState, setShareLinkCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [shareLinkCopyMessage, setShareLinkCopyMessage] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const openStrategySheet = useCallback(() => {
    setCommentsDrawerOpen(false);
    setStrategySheetOpen(true);
  }, []);

  const openCommentsDrawer = useCallback(() => {
    setStrategySheetOpen(false);
    setCommentsDrawerOpen(true);
  }, []);

  const closeShareDialog = useCallback(() => {
    setShowShareDialog(false);
    setShareEmail('');
    setSharePermission('view');
    setShareError(null);
    setGeneratedShareLink(null);
    setShareLinkCopyState('idle');
    setShareLinkCopyMessage('');
    setIsShareSent(false);
  }, []);

  return {
    ...writeState,
    content,
    setContent,
    activeFormats,
    setActiveFormats,
    editorInstance,
    setEditorInstance,
    isSaving,
    setIsSaving,
    lastSaved,
    setLastSaved,
    saveIndicatorTimerRef,
    strategySheetOpen,
    setStrategySheetOpen,
    feedbackDialogOpen,
    setFeedbackDialogOpen,
    smartReusePopoverOpen,
    setSmartReusePopoverOpen,
    commentsDrawerOpen,
    setCommentsDrawerOpen,
    showVersionHistory,
    setShowVersionHistory,
    showShareDialog,
    setShowShareDialog,
    showDeletePromptDialog,
    setShowDeletePromptDialog,
    previewVersion,
    setPreviewVersion,
    shareEmail,
    setShareEmail,
    shareRecipientType,
    setShareRecipientType,
    sharePermission,
    setSharePermission,
    isShareSent,
    setIsShareSent,
    generatedShareLink,
    setGeneratedShareLink,
    shareLinkCopyState,
    setShareLinkCopyState,
    shareLinkCopyMessage,
    setShareLinkCopyMessage,
    isCreatingShare,
    setIsCreatingShare,
    shareError,
    setShareError,
    openStrategySheet,
    openCommentsDrawer,
    closeShareDialog,
  };
};
