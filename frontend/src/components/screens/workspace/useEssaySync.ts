import { useCallback, useEffect, useRef, useState } from 'react';

const LOCAL_EDIT_GRACE_MS = 3000;

interface UseEssaySyncParams {
  currentSyncDocumentId?: string;
  currentSyncGeneration?: number;
  essayContent?: string;
  essayLastUpdated?: number;
  localContent: string;
  setLocalContent: (content: string) => void;
  resetSyncDocument: (args: { id: string; expectedGeneration?: number }) => Promise<{
    status: 'reset' | 'stale';
    generation: number;
    syncDocumentId: string;
  }>;
}

export const useEssaySync = ({
  currentSyncDocumentId,
  currentSyncGeneration,
  essayContent,
  essayLastUpdated,
  localContent,
  setLocalContent,
  resetSyncDocument,
}: UseEssaySyncParams) => {
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [hasPendingExternalReset, setHasPendingExternalReset] = useState(false);
  const lastLocalEditTimeRef = useRef<number>(0);
  const lastProcessedUpdateRef = useRef<number>(0);
  const syncResetInFlightRef = useRef(false);
  const pendingResetTimerRef = useRef<number | null>(null);
  const pendingExternalUpdateRef = useRef<{
    content: string;
    lastUpdated: number;
    syncDocumentId: string;
    syncGeneration: number;
  } | null>(null);

  const clearPendingResetTimer = useCallback(() => {
    if (pendingResetTimerRef.current !== null) {
      window.clearTimeout(pendingResetTimerRef.current);
      pendingResetTimerRef.current = null;
    }
  }, []);

  const applyExternalReset = useCallback(async (pending: {
    content: string;
    lastUpdated: number;
    syncDocumentId: string;
    syncGeneration: number;
  }) => {
    if (syncResetInFlightRef.current) {
      return;
    }

    syncResetInFlightRef.current = true;
    setHasPendingExternalReset(false);
    clearPendingResetTimer();

    const newContent = pending.content;
    try {
      await resetSyncDocument({
        id: pending.syncDocumentId,
        expectedGeneration: pending.syncGeneration,
      });
      setEditorSyncKey((prev) => prev + 1);
      setLocalContent(newContent);
    } catch (err) {
      console.error('Failed to reset sync document:', err);
      setEditorSyncKey((prev) => prev + 1);
      setLocalContent(newContent);
    } finally {
      lastProcessedUpdateRef.current = pending.lastUpdated;
      pendingExternalUpdateRef.current = null;
      syncResetInFlightRef.current = false;
    }
  }, [clearPendingResetTimer, resetSyncDocument, setLocalContent]);

  const schedulePendingReset = useCallback(() => {
    clearPendingResetTimer();

    const pending = pendingExternalUpdateRef.current;
    if (!pending || syncResetInFlightRef.current) {
      return;
    }

    const timeSinceLocalEdit = Date.now() - lastLocalEditTimeRef.current;
    const delayMs = Math.max(0, LOCAL_EDIT_GRACE_MS - timeSinceLocalEdit);

    if (delayMs === 0) {
      void applyExternalReset(pending);
      return;
    }

    pendingResetTimerRef.current = window.setTimeout(() => {
      const latestPending = pendingExternalUpdateRef.current;
      if (latestPending) {
        void applyExternalReset(latestPending);
      }
    }, delayMs);
  }, [applyExternalReset, clearPendingResetTimer]);

  useEffect(() => {
    if (!currentSyncDocumentId || essayContent === undefined) return;

    const lastUpdated = essayLastUpdated ?? 0;

    if (lastUpdated > lastProcessedUpdateRef.current) {
      lastProcessedUpdateRef.current = lastUpdated;

      if (essayContent === localContent) {
        pendingExternalUpdateRef.current = null;
        setHasPendingExternalReset(false);
        clearPendingResetTimer();
        return;
      }

      const pendingUpdate = {
        content: essayContent,
        lastUpdated,
        syncDocumentId: currentSyncDocumentId,
        syncGeneration: currentSyncGeneration ?? 0,
      };
      pendingExternalUpdateRef.current = pendingUpdate;

      const timeSinceLocalEdit = Date.now() - lastLocalEditTimeRef.current;
      if (timeSinceLocalEdit >= LOCAL_EDIT_GRACE_MS) {
        void applyExternalReset(pendingUpdate);
      } else {
        setHasPendingExternalReset(true);
        schedulePendingReset();
      }
    }
  }, [
    applyExternalReset,
    clearPendingResetTimer,
    currentSyncDocumentId,
    currentSyncGeneration,
    essayContent,
    essayLastUpdated,
    localContent,
    schedulePendingReset,
  ]);

  const markLocalEdit = useCallback(() => {
    lastLocalEditTimeRef.current = Date.now();
    if (pendingExternalUpdateRef.current) {
      setHasPendingExternalReset(true);
      schedulePendingReset();
    }
  }, [schedulePendingReset]);

  const markLoadedEssayVersion = useCallback((lastUpdated?: number) => {
    lastProcessedUpdateRef.current = lastUpdated ?? 0;
    pendingExternalUpdateRef.current = null;
    setHasPendingExternalReset(false);
    clearPendingResetTimer();
  }, [clearPendingResetTimer]);

  useEffect(() => {
    return () => {
      clearPendingResetTimer();
    };
  }, [clearPendingResetTimer]);

  return {
    editorSyncKey,
    hasPendingExternalReset,
    markLocalEdit,
    markLoadedEssayVersion,
  };
};
