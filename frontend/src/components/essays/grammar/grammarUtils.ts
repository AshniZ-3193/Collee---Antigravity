import type { Node as PmNode } from '@tiptap/pm/model';
import type { GrammarCategory } from './types';

/**
 * Walk ProseMirror doc via `doc.descendants()`, building a `plainToPm` mapping
 * from plain-text char offsets to ProseMirror positions. Inserts `\n` at block boundaries.
 */
export function buildPositionMapping(doc: PmNode): {
  plainText: string;
  plainToPm: number[];
} {
  const chars: string[] = [];
  const plainToPm: number[] = [];
  let isFirstBlock = true;

  doc.descendants((node, pos) => {
    if (node.isBlock && !node.isTextblock) return true;

    if (node.isTextblock) {
      if (!isFirstBlock) {
        chars.push('\n');
        // Map the newline to the position right before this block
        plainToPm.push(pos);
      }
      isFirstBlock = false;
      return true;
    }

    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        chars.push(node.text[i]);
        plainToPm.push(pos + i);
      }
    }

    return false;
  });

  return {
    plainText: chars.join(''),
    plainToPm,
  };
}

const SPELLING_KINDS = new Set([
  'SpellCheck',
  'Spelling',
]);

const STYLE_KINDS = new Set([
  'LongSentences',
  'BoringWords',
  'WrongQuotes',
  'Wordiness',
  'Hedging',
  'AvoidCurses',
]);

/**
 * Classify a Harper lint kind string into one of our three categories.
 */
export function classifyLintKind(kind: string): GrammarCategory {
  if (SPELLING_KINDS.has(kind)) return 'spelling';
  if (STYLE_KINDS.has(kind)) return 'style';
  return 'grammar';
}

/**
 * Derive a 0-100 grammar score. Deducts ~3 pts per issue per 100 words, floored at 0.
 */
export function calculateGrammarScore(issueCount: number, wordCount: number): number {
  if (wordCount === 0) return 100;
  if (issueCount === 0) return 100;
  const issuesPer100 = (issueCount / wordCount) * 100;
  const deduction = issuesPer100 * 3;
  const rawScore = Math.max(0, Math.round(100 - deduction));
  // If there are issues, never present a perfect score.
  return Math.min(99, rawScore);
}
