import { useCallback, useEffect, useRef, useState } from 'react';

type ResetSyncDocument = (args: { id: string }) => Promise<unknown>;

interface UseEssaySyncParams {
  currentEssayId?: string;
  essayContent?: string;
  essayLastUpdated?: number;
  localContent: string;
  setLocalContent: (content: string) => void;
  resetSyncDocument: ResetSyncDocument;
}

export const useEssaySync = ({
  currentEssayId,
  essayContent,
  essayLastUpdated,
  localContent,
  setLocalContent,
  resetSyncDocument,
}: UseEssaySyncParams) => {
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const lastLocalEditTimeRef = useRef<number>(0);
  const lastProcessedUpdateRef = useRef<number>(0);
  const syncResetInFlightRef = useRef(false);

  useEffect(() => {
    if (!currentEssayId || essayContent === undefined) return;

    const lastUpdated = essayLastUpdated ?? 0;
    const timeSinceLocalEdit = Date.now() - lastLocalEditTimeRef.current;

    if (lastUpdated > lastProcessedUpdateRef.current) {
      lastProcessedUpdateRef.current = lastUpdated;

      if (essayContent === localContent) return;

      if (timeSinceLocalEdit > 3000 && !syncResetInFlightRef.current) {
        syncResetInFlightRef.current = true;
        const newContent = essayContent;

        resetSyncDocument({ id: currentEssayId })
          .then(() => {
            setEditorSyncKey((prev) => prev + 1);
            setLocalContent(newContent);
          })
          .catch((err) => {
            console.error('Failed to reset sync document:', err);
            setEditorSyncKey((prev) => prev + 1);
            setLocalContent(newContent);
          })
          .finally(() => {
            syncResetInFlightRef.current = false;
          });
      }
    }
  }, [
    currentEssayId,
    essayContent,
    essayLastUpdated,
    localContent,
    resetSyncDocument,
    setLocalContent,
  ]);

  const markLocalEdit = useCallback(() => {
    lastLocalEditTimeRef.current = Date.now();
  }, []);

  const markLoadedEssayVersion = useCallback((lastUpdated?: number) => {
    lastProcessedUpdateRef.current = lastUpdated ?? 0;
  }, []);

  return {
    editorSyncKey,
    markLocalEdit,
    markLoadedEssayVersion,
  };
};
