import type { Lint } from 'harper.js';

export type GrammarCategory = 'spelling' | 'grammar' | 'style';

export interface SuggestionItem {
  text: string;
}

export interface GrammarIssue {
  id: string;
  message: string;
  category: GrammarCategory;
  lintKind: string;
  problemText: string;
  plainSpan: { start: number; end: number };
  pmFrom: number;
  pmTo: number;
  suggestions: SuggestionItem[];
  rawLint?: Lint;
  lintHash?: string;
}

export interface GrammarCounts {
  spelling: number;
  grammar: number;
  style: number;
  total: number;
}
