import { stripRichTextFormatting } from '@/lib/richText';

import type {
  College,
  Essay,
  ExcerptUsageRecord,
  FeedbackType,
  PersonalLensNote,
  PromptFitGuidance,
  ReusableExcerpt,
  StoryExperience,
  Version,
} from './types';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  asArray(value).filter((item): item is string => typeof item === 'string');

const normalizeEssayStatus = (value: unknown): Essay['status'] => {
  if (value === 'not-started' || value === 'in-progress' || value === 'complete') {
    return value;
  }
  return 'not-started';
};

const normalizeLensCategory = (value: unknown): PersonalLensNote['category'] => {
  if (
    value === 'moment' ||
    value === 'observation' ||
    value === 'responsibility' ||
    value === 'realization' ||
    value === 'value' ||
    value === 'shift'
  ) {
    return value;
  }
  return 'moment';
};

const themeLabels: Record<string, string> = {
  responsibility: 'responsibility',
  impact: 'meaningful impact',
  decision: 'decision-making',
  growth: 'personal growth',
  failure: 'learning from setbacks',
  resilience: 'resilience',
  leadership: 'leadership',
  challenge: 'facing challenges',
  setback: 'overcoming setbacks',
  community: 'community focus',
  contribution: 'contribution',
  purpose: 'sense of purpose',
  intellectual: 'intellectual curiosity',
  curiosity: 'curiosity',
  interdisciplinary: 'interdisciplinary thinking',
  identity: 'identity',
  culture: 'culture',
  service: 'service',
  family: 'family',
  values: 'values',
};

export const mapCollegesFromConvex = (convexCollegesResult: unknown): College[] => {
  return asArray(convexCollegesResult)
    .map((collegeValue) => {
      const college = asRecord(collegeValue);
      if (!college) return null;

      const collegeId = asString(college._id);
      const collegeName = asString(college.name);
      if (!collegeId || !collegeName) return null;

      const essays: Essay[] = asArray(college.prompts).map((promptValue, promptIndex) => {
        const prompt = asRecord(promptValue);
        const essayRecord = asRecord(prompt?.essay);
        const promptId = asString(prompt?._id, `prompt-${promptIndex}`);
        const promptText = asString(prompt?.text);

        return {
          id: asString(essayRecord?._id, promptId),
          promptId,
          title: promptText,
          prompt: promptText,
          status: normalizeEssayStatus(essayRecord?.status),
          wordCount: asNumber(essayRecord?.wordCount, 0),
          wordLimit: asNumber(prompt?.wordCountMax, 650),
          content: asString(essayRecord?.content),
          promptType: asString(prompt?.promptType) || undefined,
          lastUpdated:
            typeof essayRecord?.lastUpdated === 'number'
              ? essayRecord.lastUpdated
              : undefined,
          syncGeneration: asNumber(essayRecord?.syncGeneration, 0),
        };
      });

      return {
        id: collegeId,
        name: collegeName,
        applicationType: asString(college.applicationType) || undefined,
        deadline: asString(college.deadline) || undefined,
        essays,
      };
    })
    .filter((college): college is College => college !== null);
};

export const buildExperienceIndex = (
  storyIdentityData: unknown,
): Map<string, { name: string; tags: string[] }> => {
  const map = new Map<string, { name: string; tags: string[] }>();
  const identity = asRecord(storyIdentityData);
  for (const value of asArray(identity?.experiences)) {
    const experience = asRecord(value);
    const id = asString(experience?._id);
    if (!id) continue;
    map.set(id, {
      name: asString(experience?.name, 'Experience'),
      tags: asStringArray(experience?.tags),
    });
  }
  return map;
};

export const buildExperienceUsageMap = (experienceUsagesResult: unknown): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const value of asArray(experienceUsagesResult)) {
    const usage = asRecord(value);
    const experienceId = asString(usage?.experienceId);
    const essayId = asString(usage?.essayId);
    if (!experienceId || !essayId) continue;
    const current = map.get(experienceId) ?? [];
    current.push(essayId);
    map.set(experienceId, current);
  }
  return map;
};

export const mapPersonalLensNotesFromConvex = (convexLensNotesResult: unknown): PersonalLensNote[] => {
  return asArray(convexLensNotesResult)
    .map((noteValue) => {
      const note = asRecord(noteValue);
      if (!note) return null;
      const id = asString(note._id);
      const content = asString(note.content);
      if (!id || !content) return null;
      return {
        id,
        content,
        category: normalizeLensCategory(note.category),
        createdAt: new Date(asNumber(note._creationTime, Date.now())),
      };
    })
    .filter((note): note is PersonalLensNote => note !== null);
};

export const mapExperienceSuggestions = (
  promptStrategy: unknown,
  experienceIndex: Map<string, { name: string; tags: string[] }>,
  experienceUsageMap: Map<string, string[]>,
): (StoryExperience & { guidance: PromptFitGuidance })[] => {
  const strategy = asRecord(promptStrategy);
  const matches = asArray(strategy?.experienceMatches);
  return matches
    .map((matchValue) => {
      const match = asRecord(matchValue);
      if (!match) return null;

      const experienceId = asString(match.experienceId);
      if (!experienceId) return null;

      const experience = experienceIndex.get(experienceId);
      const usedIn = experienceUsageMap.get(experienceId) ?? [];

      return {
        id: experienceId,
        name: experience?.name || asString(match.experienceName, 'Experience'),
        tags: experience?.tags || [],
        usedIn,
        guidance: {
          matchStrength: asString(match.matchStrength) === 'strong' ? 'strong' : 'moderate',
          whyItFits: asString(match.whyItFits),
          framingTips: asStringArray(match.framingTips),
          caution: asString(match.caution) || undefined,
          startWith: asString(match.startWith) || undefined,
          focusOn: asString(match.focusOn) || undefined,
          avoidFocus: asString(match.avoidFocus) || undefined,
          starterSentences: asStringArray(match.starterSentences),
        },
      };
    })
    .filter(
      (
        suggestion,
      ): suggestion is StoryExperience & { guidance: PromptFitGuidance } => suggestion !== null,
    );
};

export const mapVersionsForDisplay = (
  essayVersionsResult: unknown,
  currentEssayContent?: string,
): Version[] => {
  return asArray(essayVersionsResult)
    .map((versionValue) => {
      const version = asRecord(versionValue);
      if (!version) return null;
      const id = asString(version._id);
      if (!id) return null;

      const content = asString(version.content);
      const plainVersionContent = stripRichTextFormatting(content);
      const preview =
        plainVersionContent.length > 120
          ? `${plainVersionContent.substring(0, 120)}...`
          : plainVersionContent;
      const timestamp = new Date(asNumber(version.timestamp, Date.now())).toLocaleString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      );

      return {
        id,
        timestamp,
        wordCount: asNumber(version.wordCount, 0),
        preview,
        content,
        isCurrent: content === currentEssayContent,
      };
    })
    .filter((version): version is Version => version !== null);
};

export interface StoredFeedbackEntry {
  feedbackType: FeedbackType;
  feedback: string;
}

export const filterStoredFeedbackByType = (
  essayFeedbackResult: unknown,
  feedbackType: FeedbackType,
): StoredFeedbackEntry[] => {
  return asArray(essayFeedbackResult)
    .map((entryValue) => {
      const entry = asRecord(entryValue);
      if (!entry) return null;
      const entryType = asString(entry.feedbackType);
      const feedback = asString(entry.feedback);
      if (!feedback) return null;
      if (entryType !== feedbackType) return null;
      return {
        feedbackType,
        feedback,
      };
    })
    .filter((entry): entry is StoredFeedbackEntry => entry !== null);
};

interface MapSmartReuseExcerptsParams {
  reuseSuggestions: unknown;
  dismissedExcerpts: Set<string>;
  currentEssayId: string;
  currentCollegeId: string;
  excerptUsages: ExcerptUsageRecord[];
}

export const mapSmartReuseExcerpts = ({
  reuseSuggestions,
  dismissedExcerpts,
  currentEssayId,
  currentCollegeId,
  excerptUsages,
}: MapSmartReuseExcerptsParams): ReusableExcerpt[] => {
  return asArray(reuseSuggestions)
    .map((suggestionValue) => {
      const suggestion = asRecord(suggestionValue);
      if (!suggestion) return null;

      const excerptId = asString(suggestion.excerptId);
      if (!excerptId || dismissedExcerpts.has(`${excerptId}-${currentEssayId}`)) {
        return null;
      }

      const overlapThemes = asStringArray(suggestion.overlapThemes);
      const matchesSamePromptType = Boolean(suggestion.matchesSamePromptType);
      const promptType = asString(suggestion.promptType) || undefined;
      const sameSchoolReuse = excerptUsages.find(
        (usage) =>
          usage.excerptId === excerptId &&
          usage.targetCollegeId === currentCollegeId &&
          usage.targetEssayId !== currentEssayId,
      );

      let whyItWorks = "This excerpt aligns with the prompt themes you're working with.";
      if (matchesSamePromptType && promptType) {
        const promptLabel = promptType === 'why-college' ? 'Why This School' : promptType;
        whyItWorks = `This is from another "${promptLabel}" essay. The framing and insights may transfer well.`;
      } else if (overlapThemes.length > 0) {
        const descriptions = overlapThemes
          .slice(0, 2)
          .map((theme) => themeLabels[theme] || theme);
        whyItWorks =
          descriptions.length === 1
            ? `This excerpt reflects ${descriptions[0]}, which aligns with what this prompt is asking.`
            : `This excerpt reflects ${descriptions.join(' and ')}, which aligns with what this prompt is asking.`;
      }

      return {
        id: excerptId,
        sourceEssayId: asString(suggestion.sourceEssayId),
        sourceEssayTitle: asString(suggestion.sourceEssayTitle),
        sourceCollegeId: asString(suggestion.sourceCollegeId),
        sourceCollegeName: asString(suggestion.sourceCollegeName),
        excerpt: asString(suggestion.excerpt),
        themes: asStringArray(suggestion.themes),
        promptType,
        overlapThemes,
        matchesSamePromptType,
        whyItWorks,
        sameSchoolWarning: sameSchoolReuse
          ? `You've already reused a similar passage for "${sameSchoolReuse.targetEssayTitle}". Consider focusing on a different moment or insight here.`
          : undefined,
      };
    })
    .filter((excerpt): excerpt is ReusableExcerpt => excerpt !== null)
    .sort((a, b) => {
      if (a.matchesSamePromptType && !b.matchesSamePromptType) return -1;
      if (!a.matchesSamePromptType && b.matchesSamePromptType) return 1;
      if (a.sameSchoolWarning && !b.sameSchoolWarning) return 1;
      if (!a.sameSchoolWarning && b.sameSchoolWarning) return -1;
      return 0;
    });
};
