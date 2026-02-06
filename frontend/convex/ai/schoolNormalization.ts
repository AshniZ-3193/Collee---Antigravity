export const DEFAULT_PROMPT_VERSION = "v1";
export const GLOBAL_CONTENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeAlias(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugifySchoolName(input: string): string {
  return normalizeAlias(input).replace(/\s+/g, "-");
}

export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isTrustedSourceDomain(domain: string): boolean {
  if (!domain) return false;
  return (
    domain.endsWith(".edu") ||
    domain === "commonapp.org" ||
    domain.endsWith(".commonapp.org") ||
    domain === "coalitionforcollegeaccess.org" ||
    domain.endsWith(".coalitionforcollegeaccess.org")
  );
}

function normalizePromptText(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getBigrams(value: string): string[] {
  if (value.length < 2) return [value];
  const bigrams: string[] = [];
  for (let i = 0; i < value.length - 1; i++) {
    bigrams.push(value.slice(i, i + 2));
  }
  return bigrams;
}

function diceCoefficient(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  const aPairs = getBigrams(a);
  const bPairs = getBigrams(b);
  const bPairCounts = new Map<string, number>();
  for (const pair of bPairs) {
    bPairCounts.set(pair, (bPairCounts.get(pair) || 0) + 1);
  }

  let matches = 0;
  for (const pair of aPairs) {
    const count = bPairCounts.get(pair) || 0;
    if (count > 0) {
      matches += 1;
      bPairCounts.set(pair, count - 1);
    }
  }

  return (2 * matches) / (aPairs.length + bPairs.length);
}

export function scorePromptSimilarity(
  candidatePrompts: string[],
  extractedPrompts: string[]
): number {
  if (!candidatePrompts.length || !extractedPrompts.length) return 0;
  const normalizedCandidates = candidatePrompts
    .map(normalizePromptText)
    .filter(Boolean);
  const normalizedExtracted = extractedPrompts
    .map(normalizePromptText)
    .filter(Boolean);
  if (!normalizedCandidates.length || !normalizedExtracted.length) return 0;

  const bestScores = normalizedCandidates.map((candidate) => {
    let best = 0;
    for (const extracted of normalizedExtracted) {
      const score = diceCoefficient(candidate, extracted);
      if (score > best) best = score;
    }
    return best;
  });

  const total = bestScores.reduce((sum, score) => sum + score, 0);
  return total / bestScores.length;
}
