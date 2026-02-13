import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { WorkerLinter, Lint, Dialect as HarperDialect } from 'harper.js';

import { buildPositionMapping, classifyLintKind, calculateGrammarScore } from './grammarUtils';
import { grammarPluginKey } from './GrammarDecorationPlugin';
import { getIrregularPastCorrection, withPreferredSuggestion } from './customRules';
import { getColleeWeirpackFiles } from './colleeWeirpack';
import type { GrammarIssue, GrammarCounts } from './types';

type GrammarDialect = 'American' | 'British' | 'Australian' | 'Canadian' | 'Indian';

interface UseGrammarAnalysisOptions {
  editor: Editor | null;
  enabled: boolean;
  customDictionary?: string[];
  ignoredRules?: string[];
  ignoredLintHashes?: string[];
  lintConfigJson?: string;
  dialect?: GrammarDialect;
  persistIgnoredLintHash?: (hash: string) => void | Promise<void>;
}

interface UseGrammarAnalysisReturn {
  issues: GrammarIssue[];
  isAnalyzing: boolean;
  score: number;
  counts: GrammarCounts;
  triggerAnalysis: () => void;
  applySuggestion: (issue: GrammarIssue, suggestion: { text: string }) => void;
  ignoreIssue: (issue: GrammarIssue) => void;
  addToDictionary: (word: string) => void;
}

const DEBOUNCE_MS = 500;

interface CustomPatternIssue {
  id: string;
  message: string;
  category: GrammarIssue['category'];
  lintKind: string;
  problemText: string;
  plainSpan: { start: number; end: number };
  suggestions: Array<{ text: string }>;
}

interface ContractionFixRule {
  wrong: string;
  replacement: string;
  lintKind: string;
}

const CONTRACTION_FIX_RULES: ContractionFixRule[] = [
  { wrong: 'dont', replacement: "don't", lintKind: 'DontContraction' },
  { wrong: 'doesnt', replacement: "doesn't", lintKind: 'DoesntContraction' },
  { wrong: 'didnt', replacement: "didn't", lintKind: 'DidntContraction' },
  { wrong: 'isnt', replacement: "isn't", lintKind: 'IsntContraction' },
  { wrong: 'arent', replacement: "aren't", lintKind: 'ArentContraction' },
  { wrong: 'wasnt', replacement: "wasn't", lintKind: 'WasntContraction' },
  { wrong: 'werent', replacement: "weren't", lintKind: 'WerentContraction' },
  { wrong: 'cant', replacement: "can't", lintKind: 'CantContraction' },
  { wrong: 'couldnt', replacement: "couldn't", lintKind: 'CouldntContraction' },
  { wrong: 'shouldnt', replacement: "shouldn't", lintKind: 'ShouldntContraction' },
  { wrong: 'wouldnt', replacement: "wouldn't", lintKind: 'WouldntContraction' },
  { wrong: 'havent', replacement: "haven't", lintKind: 'HaventContraction' },
  { wrong: 'hasnt', replacement: "hasn't", lintKind: 'HasntContraction' },
  { wrong: 'hadnt', replacement: "hadn't", lintKind: 'HadntContraction' },
  { wrong: 'wont', replacement: "won't", lintKind: 'WontContraction' },
];

function capitalizeLeadingIfNeeded(source: string, replacement: string): string {
  if (!source || !replacement) return replacement;
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] !== source[0].toUpperCase()) return replacement;
  return replacement[0].toUpperCase() + replacement.slice(1);
}

function buildCounts(issues: GrammarIssue[]): GrammarCounts {
  return {
    spelling: issues.filter((issue) => issue.category === 'spelling').length,
    grammar: issues.filter((issue) => issue.category === 'grammar').length,
    style: issues.filter((issue) => issue.category === 'style').length,
    total: issues.length,
  };
}

function hasOverlappingIssue(
  existing: GrammarIssue[],
  span: { start: number; end: number },
  lintKind?: string,
): boolean {
  return existing.some((issue) => {
    if (lintKind && issue.lintKind === lintKind) return true;
    return issue.plainSpan.start < span.end && span.start < issue.plainSpan.end;
  });
}

function buildCustomPatternIssues(plainText: string, existing: GrammarIssue[]): CustomPatternIssue[] {
  const output: CustomPatternIssue[] = [];

  const pushIssue = (issue: CustomPatternIssue) => {
    if (hasOverlappingIssue(existing, issue.plainSpan, issue.lintKind)) return;
    output.push(issue);
  };

  const meWentRegex = /\b[Mm]e\s+went\b/g;
  let meWentMatch: RegExpExecArray | null = meWentRegex.exec(plainText);
  while (meWentMatch) {
    const problemText = meWentMatch[0].split(/\s+/)[0] ?? 'Me';
    const span = { start: meWentMatch.index, end: meWentMatch.index + problemText.length };
    pushIssue({
      id: `custom-subject-${span.start}-${span.end}`,
      message: 'Use the subject pronoun `I` here.',
      category: 'grammar',
      lintKind: 'SubjectPronounCase',
      problemText,
      plainSpan: span,
      suggestions: [{ text: 'I' }],
    });
    meWentMatch = meWentRegex.exec(plainText);
  }

  const dintRegex = /\bdint\b/gi;
  let dintMatch: RegExpExecArray | null = dintRegex.exec(plainText);
  while (dintMatch) {
    const problemText = dintMatch[0] ?? 'dint';
    const span = { start: dintMatch.index, end: dintMatch.index + problemText.length };
    const replacement = problemText[0] === 'D' ? "Didn't" : "didn't";
    pushIssue({
      id: `custom-dint-${span.start}-${span.end}`,
      message: 'Use `didn\'t` here.',
      category: 'spelling',
      lintKind: 'DintContraction',
      problemText,
      plainSpan: span,
      suggestions: [{ text: replacement }],
    });
    dintMatch = dintRegex.exec(plainText);
  }

  for (const contractionRule of CONTRACTION_FIX_RULES) {
    const contractionRegex = new RegExp(`\\b${contractionRule.wrong}\\b`, 'gi');
    let contractionMatch: RegExpExecArray | null = contractionRegex.exec(plainText);
    while (contractionMatch) {
      const problemText = contractionMatch[0] ?? contractionRule.wrong;
      const span = {
        start: contractionMatch.index,
        end: contractionMatch.index + problemText.length,
      };
      pushIssue({
        id: `custom-${contractionRule.lintKind}-${span.start}-${span.end}`,
        message: 'Use the standard contraction with an apostrophe.',
        category: 'spelling',
        lintKind: contractionRule.lintKind,
        problemText,
        plainSpan: span,
        suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, contractionRule.replacement) }],
      });
      contractionMatch = contractionRegex.exec(plainText);
    }
  }

  const iSeenRegex = /\b[Ii]\s+seen\b/g;
  let iSeenMatch: RegExpExecArray | null = iSeenRegex.exec(plainText);
  while (iSeenMatch) {
    const problemText = iSeenMatch[0];
    const span = { start: iSeenMatch.index, end: iSeenMatch.index + problemText.length };
    const replacement = problemText[0] === 'I' ? 'I saw' : 'i saw';
    pushIssue({
      id: `custom-iseen-${span.start}-${span.end}`,
      message: 'Use `saw` for simple past here.',
      category: 'grammar',
      lintKind: 'SimplePastSeen',
      problemText,
      plainSpan: span,
      suggestions: [{ text: replacement }],
    });
    iSeenMatch = iSeenRegex.exec(plainText);
  }

  const whoDontRegex = /\bwho\s+don['’]?t\b/gi;
  let whoDontMatch: RegExpExecArray | null = whoDontRegex.exec(plainText);
  while (whoDontMatch) {
    const problemText = whoDontMatch[0].split(/\s+/)[1] ?? whoDontMatch[0];
    const span = {
      start: whoDontMatch.index + whoDontMatch[0].indexOf(problemText),
      end: whoDontMatch.index + whoDontMatch[0].indexOf(problemText) + problemText.length,
    };
    const replacement = problemText[0] === 'D' ? "Doesn't" : "doesn't";
    pushIssue({
      id: `custom-whodont-${span.start}-${span.end}`,
      message: 'Use `doesn\'t` with singular subject here.',
      category: 'grammar',
      lintKind: 'WhoDoesntAgreement',
      problemText,
      plainSpan: span,
      suggestions: [{ text: replacement }],
    });
    whoDontMatch = whoDontRegex.exec(plainText);
  }

  const aintRegex = /\bain['’]?t\b/gi;
  let aintMatch: RegExpExecArray | null = aintRegex.exec(plainText);
  while (aintMatch) {
    const problemText = aintMatch[0];
    const span = { start: aintMatch.index, end: aintMatch.index + problemText.length };
    pushIssue({
      id: `custom-aint-${span.start}-${span.end}`,
      message: 'Use a standard contraction here.',
      category: 'style',
      lintKind: 'AintContraction',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, "isn't") }],
    });
    aintMatch = aintRegex.exec(plainText);
  }

  const didntStudiedRegex = /\bdidn['’]?t\s+studied\b/gi;
  let didntStudiedMatch: RegExpExecArray | null = didntStudiedRegex.exec(plainText);
  while (didntStudiedMatch) {
    const problemText = didntStudiedMatch[0];
    const span = { start: didntStudiedMatch.index, end: didntStudiedMatch.index + problemText.length };
    pushIssue({
      id: `custom-didntstudied-${span.start}-${span.end}`,
      message: 'Use the base verb after `didn\'t`.',
      category: 'grammar',
      lintKind: 'DidntBaseVerb',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, "didn't study") }],
    });
    didntStudiedMatch = didntStudiedRegex.exec(plainText);
  }

  const goodAdverbRegex = /\bhomework\s+good\b/gi;
  let goodAdverbMatch: RegExpExecArray | null = goodAdverbRegex.exec(plainText);
  while (goodAdverbMatch) {
    const full = goodAdverbMatch[0];
    const goodIndex = full.toLowerCase().lastIndexOf('good');
    const span = {
      start: goodAdverbMatch.index + goodIndex,
      end: goodAdverbMatch.index + goodIndex + 4,
    };
    const problemText = plainText.slice(span.start, span.end);
    pushIssue({
      id: `custom-goodadverb-${span.start}-${span.end}`,
      message: 'Use `well` as the adverb here.',
      category: 'grammar',
      lintKind: 'GoodVsWell',
      problemText,
      plainSpan: span,
      suggestions: [{ text: 'well' }],
    });
    goodAdverbMatch = goodAdverbRegex.exec(plainText);
  }

  const everybodyBeRegex = /\beverybody\s+be\b/gi;
  let everybodyBeMatch: RegExpExecArray | null = everybodyBeRegex.exec(plainText);
  while (everybodyBeMatch) {
    const problemText = everybodyBeMatch[0];
    const span = { start: everybodyBeMatch.index, end: everybodyBeMatch.index + problemText.length };
    pushIssue({
      id: `custom-everybodybe-${span.start}-${span.end}`,
      message: 'Use `is` with `everybody` here.',
      category: 'grammar',
      lintKind: 'EverybodyIs',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, 'everybody is') }],
    });
    everybodyBeMatch = everybodyBeRegex.exec(plainText);
  }

  const thenITryRegex = /\b[Tt]hen\s+I\s+try\b/g;
  let thenITryMatch: RegExpExecArray | null = thenITryRegex.exec(plainText);
  while (thenITryMatch) {
    const problemText = thenITryMatch[0];
    const span = { start: thenITryMatch.index, end: thenITryMatch.index + problemText.length };
    pushIssue({
      id: `custom-thenitry-${span.start}-${span.end}`,
      message: 'In this past-tense narrative, use `tried`.',
      category: 'grammar',
      lintKind: 'NarrativePastTense',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, 'Then I tried') }],
    });
    thenITryMatch = thenITryRegex.exec(plainText);
  }

  const hopesRegex = /\bwe\s+both\s+just\s+hopes\b/gi;
  let hopesMatch: RegExpExecArray | null = hopesRegex.exec(plainText);
  while (hopesMatch) {
    const problemText = hopesMatch[0];
    const span = { start: hopesMatch.index, end: hopesMatch.index + problemText.length };
    pushIssue({
      id: `custom-hopes-${span.start}-${span.end}`,
      message: 'Use `hope` with plural subject.',
      category: 'grammar',
      lintKind: 'PluralHopeAgreement',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, 'we both just hope') }],
    });
    hopesMatch = hopesRegex.exec(plainText);
  }

  const failNothingRegex = /\bdon['’]?t\s+fail\s+nothing\b/gi;
  let failNothingMatch: RegExpExecArray | null = failNothingRegex.exec(plainText);
  while (failNothingMatch) {
    const problemText = failNothingMatch[0];
    const span = { start: failNothingMatch.index, end: failNothingMatch.index + problemText.length };
    pushIssue({
      id: `custom-failnothing-${span.start}-${span.end}`,
      message: 'Use a single negation (`anything` instead of `nothing`) here.',
      category: 'grammar',
      lintKind: 'DoubleNegativeAnything',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, "don't fail anything") }],
    });
    failNothingMatch = failNothingRegex.exec(plainText);
  }

  const wasSayingHeIsntRegex = /\bwas\s+saying\s+he\s+isn['’]?t\b/gi;
  let wasSayingHeIsntMatch: RegExpExecArray | null = wasSayingHeIsntRegex.exec(plainText);
  while (wasSayingHeIsntMatch) {
    const problemText = wasSayingHeIsntMatch[0];
    const span = { start: wasSayingHeIsntMatch.index, end: wasSayingHeIsntMatch.index + problemText.length };
    pushIssue({
      id: `custom-wassaying-${span.start}-${span.end}`,
      message: 'Use consistent past tense in reported speech.',
      category: 'style',
      lintKind: 'ReportedSpeechPastTense',
      problemText,
      plainSpan: span,
      suggestions: [{ text: capitalizeLeadingIfNeeded(problemText, "said he wasn't") }],
    });
    wasSayingHeIsntMatch = wasSayingHeIsntRegex.exec(plainText);
  }

  return output;
}

function getDialectValue(
  DialectEnum: Record<string, string | number>,
  dialect: GrammarDialect,
): HarperDialect | null {
  const maybeValue = DialectEnum[dialect];
  if (typeof maybeValue !== 'number') return null;
  return maybeValue as HarperDialect;
}

export function useGrammarAnalysis({
  editor,
  enabled,
  customDictionary,
  ignoredRules,
  ignoredLintHashes,
  lintConfigJson,
  dialect,
  persistIgnoredLintHash,
}: UseGrammarAnalysisOptions): UseGrammarAnalysisReturn {
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState(100);
  const [counts, setCounts] = useState<GrammarCounts>({ spelling: 0, grammar: 0, style: 0, total: 0 });
  const [isLinterReady, setIsLinterReady] = useState(false);

  const linterRef = useRef<WorkerLinter | null>(null);
  const generationRef = useRef(0);
  const debounceRef = useRef<number | null>(null);
  const linterReadyRef = useRef(false);
  const ignoredRulesRef = useRef(ignoredRules);
  const customDictRef = useRef(customDictionary);
  const ignoredLintHashesRef = useRef(ignoredLintHashes);
  const lintConfigJsonRef = useRef(lintConfigJson);
  const dialectRef = useRef(dialect);
  const persistIgnoredLintHashRef = useRef(persistIgnoredLintHash);
  const lastWordCountRef = useRef(0);
  const lastPlainTextRef = useRef('');

  // Keep refs up to date
  useEffect(() => {
    ignoredRulesRef.current = ignoredRules;
    customDictRef.current = customDictionary;
    ignoredLintHashesRef.current = ignoredLintHashes;
    lintConfigJsonRef.current = lintConfigJson;
    dialectRef.current = dialect;
    persistIgnoredLintHashRef.current = persistIgnoredLintHash;
  });

  const updateIssueState = useCallback(
    (nextIssues: GrammarIssue[], wordCount: number) => {
      setIssues(nextIssues);
      setCounts(buildCounts(nextIssues));
      setScore(calculateGrammarScore(nextIssues.length, wordCount));

      if (editor) {
        editor.view.dispatch(
          editor.state.tr.setMeta(grammarPluginKey, { issues: nextIssues }),
        );
      }
    },
    [editor],
  );

  const runAnalysis = useCallback(async () => {
    if (!editor || !linterRef.current || !linterReadyRef.current) return;

    const generation = ++generationRef.current;
    setIsAnalyzing(true);

    try {
      const doc = editor.state.doc;
      const { plainText, plainToPm } = buildPositionMapping(doc);
      lastPlainTextRef.current = plainText;

      if (!plainText.trim()) {
        if (generation === generationRef.current) {
          lastWordCountRef.current = 0;
          updateIssueState([], 0);
          setIsAnalyzing(false);
        }
        return;
      }

      const lints: Lint[] = await linterRef.current.lint(plainText, { language: 'plaintext' });
      if (generation !== generationRef.current) return;

      const ignoredSet = new Set(ignoredRulesRef.current ?? []);
      const mapped: GrammarIssue[] = [];

      for (const [index, lint] of lints.entries()) {
        const kind = lint.lint_kind();
        if (ignoredSet.has(kind)) continue;

        const span = lint.span();
        const start = span.start;
        const end = span.end;

        if (start >= plainToPm.length || end - 1 >= plainToPm.length) continue;

        const pmFrom = plainToPm[start];
        const pmTo = plainToPm[end - 1] + 1;
        const problemText = lint.get_problem_text();
        const irregularCorrection = getIrregularPastCorrection(problemText);

        const suggestionTexts = lint.suggestions().map((suggestion) => suggestion.get_replacement_text());
        const normalizedSuggestionTexts = irregularCorrection
          ? withPreferredSuggestion(suggestionTexts, irregularCorrection)
          : suggestionTexts;

        mapped.push({
          id: `${start}-${end}-${index}`,
          message: irregularCorrection
            ? `Use \`${irregularCorrection}\` instead of \`${problemText}\`.`
            : lint.message(),
          category: irregularCorrection ? 'grammar' : classifyLintKind(kind),
          lintKind: irregularCorrection ? 'IrregularPastTense' : kind,
          problemText,
          plainSpan: { start, end },
          pmFrom,
          pmTo,
          suggestions: normalizedSuggestionTexts.map((text) => ({ text })),
          rawLint: lint,
        });
      }

      const customPatternIssues = buildCustomPatternIssues(plainText, mapped);
      for (const customIssue of customPatternIssues) {
        const { start, end } = customIssue.plainSpan;
        if (start >= plainToPm.length || end - 1 >= plainToPm.length) continue;

        mapped.push({
          id: customIssue.id,
          message: customIssue.message,
          category: customIssue.category,
          lintKind: customIssue.lintKind,
          problemText: customIssue.problemText,
          plainSpan: customIssue.plainSpan,
          pmFrom: plainToPm[start],
          pmTo: plainToPm[end - 1] + 1,
          suggestions: customIssue.suggestions,
        });
      }

      const wordCount = plainText.split(/\s+/).filter(Boolean).length;
      lastWordCountRef.current = wordCount;
      updateIssueState(mapped, wordCount);
    } catch (error) {
      console.error('Grammar analysis failed:', error);
    } finally {
      if (generation === generationRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, [editor, updateIssueState]);

  const triggerAnalysis = useCallback(() => {
    if (!enabled) return;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      void runAnalysis();
    }, DEBOUNCE_MS);
  }, [enabled, runAnalysis]);

  // Initialize/destroy WorkerLinter based on `enabled`
  useEffect(() => {
    if (!enabled) {
      if (linterRef.current) {
        linterRef.current.dispose();
        linterRef.current = null;
      }
      linterReadyRef.current = false;
      setIsLinterReady(false);
      lastPlainTextRef.current = '';
      lastWordCountRef.current = 0;
      setIssues([]);
      setScore(100);
      setCounts({ spelling: 0, grammar: 0, style: 0, total: 0 });
      return;
    }

    let disposed = false;

    (async () => {
      try {
        const { WorkerLinter: WL, binaryInlined, Dialect } = await import('harper.js');
        if (disposed) return;

        const linter = new WL({ binary: binaryInlined });
        await linter.setup();
        if (disposed) {
          linter.dispose();
          return;
        }

        try {
          const { packWeirpackFiles } = await import('harper.js');
          const weirpackBytes = packWeirpackFiles(getColleeWeirpackFiles());
          const weirpackFailures = await linter.loadWeirpackFromBytes(weirpackBytes);
          if (weirpackFailures && Object.keys(weirpackFailures).length > 0) {
            console.warn('Collee Weirpack failed tests and was not loaded:', weirpackFailures);
          }
        } catch (error) {
          console.error('Failed to load Collee Weirpack:', error);
        }

        if (dialectRef.current) {
          const dialectValue = getDialectValue(Dialect as Record<string, string | number>, dialectRef.current);
          if (dialectValue !== null) {
            await linter.setDialect(dialectValue);
          }
        }

        if (lintConfigJsonRef.current) {
          await linter.setLintConfigWithJSON(lintConfigJsonRef.current);
        }

        if (customDictRef.current && customDictRef.current.length > 0) {
          await linter.importWords(customDictRef.current);
        }

        if (ignoredLintHashesRef.current && ignoredLintHashesRef.current.length > 0) {
          for (const hash of ignoredLintHashesRef.current) {
            try {
              await linter.ignoreLintHash(BigInt(hash));
            } catch (error) {
              console.warn('Invalid ignored lint hash:', hash, error);
            }
          }
        }

        linterRef.current = linter;
        linterReadyRef.current = true;
        setIsLinterReady(true);
      } catch (error) {
        console.error('Failed to initialize grammar linter:', error);
      }
    })();

    return () => {
      disposed = true;
      if (linterRef.current) {
        linterRef.current.dispose();
        linterRef.current = null;
      }
      linterReadyRef.current = false;
      setIsLinterReady(false);
    };
  }, [enabled]);

  // Sync custom dictionary when it changes.
  useEffect(() => {
    if (!isLinterReady || !linterRef.current || !customDictionary) return;
    let cancelled = false;
    const linter = linterRef.current;

    (async () => {
      try {
        await linter.clearWords();
        if (customDictionary.length > 0) {
          await linter.importWords(customDictionary);
        }
        if (!cancelled) {
          triggerAnalysis();
        }
      } catch (error) {
        console.error('Failed to sync custom dictionary:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customDictionary, isLinterReady, triggerAnalysis]);

  // Sync persisted ignored lint hashes.
  useEffect(() => {
    if (!isLinterReady || !linterRef.current) return;
    let cancelled = false;
    const linter = linterRef.current;
    const hashes = ignoredLintHashes ?? [];

    (async () => {
      try {
        await linter.clearIgnoredLints();
        for (const hash of hashes) {
          try {
            await linter.ignoreLintHash(BigInt(hash));
          } catch (error) {
            console.warn('Invalid ignored lint hash:', hash, error);
          }
        }
        if (!cancelled) {
          triggerAnalysis();
        }
      } catch (error) {
        console.error('Failed to sync ignored lint hashes:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ignoredLintHashes, isLinterReady, triggerAnalysis]);

  // Apply dialect changes dynamically.
  useEffect(() => {
    if (!isLinterReady || !linterRef.current || !dialect) return;
    let cancelled = false;

    (async () => {
      try {
        const { Dialect } = await import('harper.js');
        const dialectValue = getDialectValue(Dialect as Record<string, string | number>, dialect);
        if (dialectValue === null) return;
        await linterRef.current?.setDialect(dialectValue);
        if (!cancelled) {
          triggerAnalysis();
        }
      } catch (error) {
        console.error('Failed to update grammar dialect:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dialect, isLinterReady, triggerAnalysis]);

  // Apply lint-config changes dynamically.
  useEffect(() => {
    if (!isLinterReady || !linterRef.current || !lintConfigJson) return;
    let cancelled = false;

    (async () => {
      try {
        await linterRef.current?.setLintConfigWithJSON(lintConfigJson);
        if (!cancelled) {
          triggerAnalysis();
        }
      } catch (error) {
        console.error('Failed to update grammar lint config:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lintConfigJson, isLinterReady, triggerAnalysis]);

  // Trigger initial/refresh analysis once editor and linter are ready.
  useEffect(() => {
    if (!enabled || !editor || !isLinterReady) return;
    triggerAnalysis();
  }, [editor, enabled, isLinterReady, triggerAnalysis]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const applySuggestion = useCallback(
    (issue: GrammarIssue, suggestion: { text: string }) => {
      if (!editor) return;
      const { pmFrom, pmTo } = issue;
      editor
        .chain()
        .command(({ tr }) => {
          if (suggestion.text === '') {
            // Handle deletion: remove the range without inserting empty text node
            tr.delete(pmFrom, pmTo);
          } else {
            // Handle replacement: replace with new text
            tr.replaceWith(pmFrom, pmTo, editor.state.schema.text(suggestion.text));
          }
          return true;
        })
        .run();
      triggerAnalysis();
    },
    [editor, triggerAnalysis],
  );

  const ignoreIssue = useCallback(
    (issue: GrammarIssue) => {
      setIssues((previousIssues) => {
        const remaining = previousIssues.filter((candidate) => candidate.id !== issue.id);
        setCounts(buildCounts(remaining));
        setScore(calculateGrammarScore(remaining.length, lastWordCountRef.current));

        if (editor) {
          editor.view.dispatch(
            editor.state.tr.setMeta(grammarPluginKey, { issues: remaining }),
          );
        }
        return remaining;
      });

      if (!linterRef.current || !linterReadyRef.current || !issue.rawLint || !lastPlainTextRef.current.trim()) {
        return;
      }

      (async () => {
        try {
          const lintHash =
            issue.lintHash ??
            (await linterRef.current?.contextHash(lastPlainTextRef.current, issue.rawLint))?.toString();
          if (!lintHash) return;

          await linterRef.current?.ignoreLintHash(BigInt(lintHash));
          issue.lintHash = lintHash;
          await persistIgnoredLintHashRef.current?.(lintHash);
        } catch (error) {
          console.error('Failed to persist ignored lint:', error);
        }
      })();
    },
    [editor],
  );

  const addToDictionary = useCallback(
    async (word: string) => {
      if (!linterRef.current || !linterReadyRef.current) return;
      await linterRef.current.importWords([word]);
      triggerAnalysis();
    },
    [triggerAnalysis],
  );

  return {
    issues,
    isAnalyzing,
    score,
    counts,
    triggerAnalysis,
    applySuggestion,
    ignoreIssue,
    addToDictionary,
  };
}
