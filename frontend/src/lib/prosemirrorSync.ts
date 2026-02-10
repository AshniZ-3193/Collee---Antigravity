export const DEFAULT_SYNC_GENERATION = 0;

export const getEssaySyncDocumentId = (
  essayId: string,
  syncGeneration?: number,
): string => {
  const generation = Number.isInteger(syncGeneration)
    ? Math.max(syncGeneration as number, DEFAULT_SYNC_GENERATION)
    : DEFAULT_SYNC_GENERATION;
  return `${essayId}:${generation}`;
};
