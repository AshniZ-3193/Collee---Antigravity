export type Screen =
  | 'home'
  | 'auth-loading'
  | 'auth'
  | 'welcome'
  | 'resume'
  | 'academic'
  | 'diagnostics'
  | 'writing-tone'
  | 'personal-lens'
  | 'reflection'
  | 'loading'
  | 'story-card'
  | 'workspace'
  | 'add-college'
  | 'export'
  | 'share-view'
  | 'edit-story-identity';

type TransitionMap = Record<Screen, Screen[]>;

const TRANSITIONS: TransitionMap = {
  'auth-loading': ['home', 'auth', 'welcome', 'workspace'],
  home: ['auth', 'welcome', 'workspace', 'auth-loading'],
  auth: ['home', 'welcome', 'workspace', 'auth-loading'],
  welcome: ['resume', 'home', 'workspace', 'auth-loading'],
  resume: ['welcome', 'academic', 'workspace'],
  academic: ['resume', 'diagnostics', 'workspace'],
  diagnostics: ['academic', 'writing-tone', 'workspace'],
  'writing-tone': ['diagnostics', 'personal-lens', 'workspace'],
  'personal-lens': ['writing-tone', 'reflection', 'workspace'],
  reflection: ['personal-lens', 'loading', 'workspace'],
  loading: ['story-card', 'workspace'],
  'story-card': ['diagnostics', 'workspace'],
  workspace: ['add-college', 'export', 'edit-story-identity', 'home', 'auth-loading'],
  'add-college': ['workspace', 'home', 'auth-loading'],
  export: ['workspace', 'home', 'auth-loading'],
  'share-view': ['workspace', 'home'],
  'edit-story-identity': ['workspace', 'home', 'auth-loading'],
};

export interface ScreenTransitionAction {
  type: 'transition';
  to: Screen;
  force?: boolean;
}

export type ScreenNavAction = ScreenTransitionAction;

export const canTransition = (from: Screen, to: Screen): boolean => {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
};

export const screenNavigationReducer = (
  current: Screen,
  action: ScreenNavAction,
): Screen => {
  if (action.type !== 'transition') {
    return current;
  }

  if (action.force || canTransition(current, action.to)) {
    return action.to;
  }

  if (import.meta.env.DEV) {
    console.warn(`Blocked screen transition from "${current}" to "${action.to}".`);
  }
  return current;
};
