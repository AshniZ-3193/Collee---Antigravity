import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type WorkspaceMode = 'dashboard' | 'legacy';

const STORAGE_KEY = 'collee-workspace-mode';

const parseWorkspaceMode = (value: string | null): WorkspaceMode | null => {
  if (value === 'dashboard' || value === 'legacy') {
    return value;
  }
  return null;
};

const getStoredWorkspaceMode = (): WorkspaceMode => {
  if (typeof window === 'undefined') {
    return 'dashboard';
  }

  const stored = parseWorkspaceMode(window.localStorage.getItem(STORAGE_KEY));
  return stored ?? 'dashboard';
};

export const useWorkspaceMode = () => {
  const location = useLocation();
  const [storedMode, setStoredMode] = useState<WorkspaceMode>(() => getStoredWorkspaceMode());

  const queryMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return parseWorkspaceMode(params.get('mode'));
  }, [location.search]);

  const mode = queryMode ?? storedMode;

  const setMode = useCallback((nextMode: WorkspaceMode) => {
    setStoredMode(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    }
  }, []);

  return {
    mode,
    setMode,
    isLegacy: mode === 'legacy',
  };
};
