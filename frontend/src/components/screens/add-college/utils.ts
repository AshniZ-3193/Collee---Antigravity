import type { ApplicationType, EssayPrompt } from './types';

export const toApplicationTypeValue = (label: string) => {
  const normalized = label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'application';
};

export const toCustomCollegeId = (name: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `custom:${normalized || 'college'}`;
};

export const toGlobalCollegeId = (slug: string) => `global:${slug}`;

export const normalizeApplicationTypes = (items: Array<{ label?: string; deadline?: string; value?: string }>): ApplicationType[] => {
  const seen = new Set<string>();
  return items
    .filter((item) => item && item.label && item.deadline)
    .map((item) => ({
      value: item.value || toApplicationTypeValue(item.label as string),
      label: item.label as string,
      deadline: item.deadline as string,
    }))
    .filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
};

const majorKeywordGroups = [
  {
    canonical: 'computer science',
    keywords: [
      'computer science',
      'cs',
      'comp sci',
      'informatics',
      'software',
      'programming',
      'coding',
      'data science',
      'ai',
      'artificial intelligence',
      'machine learning',
    ],
  },
  {
    canonical: 'engineering',
    keywords: [
      'engineering',
      'mechanical',
      'electrical',
      'chemical',
      'aerospace',
      'civil',
      'robotics',
      'biomedical',
      'industrial',
      'systems',
    ],
  },
  {
    canonical: 'business administration',
    keywords: ['business', 'management', 'entrepreneurship', 'commerce', 'administration'],
  },
  { canonical: 'economics', keywords: ['economics', 'econ'] },
  { canonical: 'finance', keywords: ['finance', 'financial'] },
  { canonical: 'accounting', keywords: ['accounting', 'accountant'] },
  { canonical: 'marketing', keywords: ['marketing', 'advertising', 'branding'] },
  { canonical: 'art', keywords: ['art', 'visual art', 'fine art', 'design', 'graphic design', 'studio art'] },
  { canonical: 'music', keywords: ['music', 'composition', 'performance'] },
  { canonical: 'theater', keywords: ['theater', 'theatre', 'drama', 'acting'] },
  { canonical: 'english', keywords: ['english', 'literature', 'writing', 'creative writing'] },
  { canonical: 'history', keywords: ['history'] },
  { canonical: 'philosophy', keywords: ['philosophy', 'ethics'] },
  { canonical: 'biology', keywords: ['biology', 'bio', 'biological'] },
  { canonical: 'chemistry', keywords: ['chemistry', 'chem'] },
  { canonical: 'physics', keywords: ['physics'] },
  { canonical: 'neuroscience', keywords: ['neuroscience', 'neuro'] },
  {
    canonical: 'environmental science',
    keywords: ['environmental science', 'environmental', 'ecology', 'sustainability'],
  },
  { canonical: 'nursing', keywords: ['nursing', 'nurse'] },
  { canonical: 'public health', keywords: ['public health', 'health policy', 'epidemiology'] },
  { canonical: 'pre-med', keywords: ['pre-med', 'premed', 'medicine', 'medical'] },
  { canonical: 'health sciences', keywords: ['health sciences', 'health science', 'health'] },
  { canonical: 'mathematics', keywords: ['mathematics', 'math', 'statistics', 'stat'] },
];

const majorRelations: Record<string, string[]> = {
  'computer science': ['engineering', 'mathematics', 'physics'],
  engineering: ['computer science', 'mathematics', 'physics'],
  mathematics: ['computer science', 'physics'],
};

const normalizeMajorTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalizeMajorPhrase = (value: string) => normalizeMajorTokens(value).join(' ');

const matchesKeyword = (normalized: string, tokens: string[], keyword: string) => {
  const keywordTokens = normalizeMajorTokens(keyword);
  if (keywordTokens.length === 0) return false;
  if (keywordTokens.length === 1) {
    return tokens.includes(keywordTokens[0]);
  }
  return normalized.includes(keywordTokens.join(' '));
};

const expandMajorTags = (tags: string[]) => {
  const expanded = new Set<string>();
  tags.forEach((tag) => {
    const normalized = normalizeMajorPhrase(tag);
    if (!normalized) return;
    expanded.add(normalized);
    const tokens = normalizeMajorTokens(tag);
    majorKeywordGroups.forEach((group) => {
      if (group.keywords.some((keyword) => matchesKeyword(normalized, tokens, keyword))) {
        expanded.add(group.canonical);
      }
    });
  });

  Array.from(expanded).forEach((tag) => {
    (majorRelations[tag] || []).forEach((related) => expanded.add(related));
  });

  return expanded;
};

export const inferRelevantMajors = (prompt: EssayPrompt): string[] => {
  const combinedText = `${prompt.targetProgram || ''} ${prompt.promptText || ''}`;
  const normalized = normalizeMajorPhrase(combinedText);
  const tokens = normalizeMajorTokens(combinedText);
  const matches = new Set<string>();
  majorKeywordGroups.forEach((group) => {
    if (group.keywords.some((keyword) => matchesKeyword(normalized, tokens, keyword))) {
      matches.add(group.canonical);
    }
  });
  return Array.from(matches);
};

export const filterPromptsForUser = (
  prompts: EssayPrompt[],
  userInterests: string[],
): EssayPrompt[] => {
  if (!userInterests || userInterests.length === 0) {
    return prompts;
  }

  const normalizedInterests = expandMajorTags(userInterests);
  if (normalizedInterests.size === 0) return prompts;

  return prompts.filter((prompt) => {
    if (
      !prompt.relevantMajors ||
      prompt.relevantMajors.length === 0 ||
      prompt.relevantMajors.includes('all')
    ) {
      return true;
    }

    const normalizedMajors = expandMajorTags(prompt.relevantMajors);
    for (const major of normalizedMajors) {
      if (normalizedInterests.has(major)) return true;
    }
    return false;
  });
};

export const createEmptyPrompt = (id = '1'): EssayPrompt => ({
  id,
  promptText: '',
  promptType: '',
  limitValue: 250,
  isOptional: false,
});
