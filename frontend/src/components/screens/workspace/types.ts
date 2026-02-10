import type { Id } from '../../../../convex/_generated/dataModel';

export interface PersonalLensNote {
  id: string;
  content: string;
  category: 'moment' | 'observation' | 'responsibility' | 'realization' | 'value' | 'shift';
  createdAt: Date;
}

export interface Essay {
  id: string;
  promptId: string;
  title: string;
  prompt: string;
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
  wordLimit: number;
  content: string;
  promptType?: string;
  lastUpdated?: number;
  syncGeneration?: number;
}

export interface College {
  id: string;
  name: string;
  applicationType?: string;
  deadline?: string;
  essays: Essay[];
}

export interface Version {
  id: string;
  timestamp: string;
  wordCount: number;
  preview: string;
  content?: string;
  isCurrent?: boolean;
}

export interface ExportData {
  essayTitle: string;
  collegeName: string;
  collegeId: string;
  wordCount: number;
  essayContent: string;
  essayId: string;
}

export interface StoryExperience {
  id: string;
  name: string;
  tags: string[];
  usedIn: string[];
}

export interface PromptFitGuidance {
  matchStrength: 'strong' | 'moderate';
  whyItFits: string;
  framingTips: string[];
  caution?: string;
  startWith?: string;
  focusOn?: string;
  avoidFocus?: string;
  starterSentences?: string[];
}

export interface ReusableExcerpt {
  id: string;
  sourceEssayId: string;
  sourceEssayTitle: string;
  sourceCollegeId: string;
  sourceCollegeName: string;
  excerpt: string;
  themes: string[];
  promptType?: string;
  overlapThemes?: string[];
  matchesSamePromptType?: boolean;
  whyItWorks: string;
  sameSchoolWarning?: string;
}

export interface ExcerptUsageRecord {
  excerptId: string;
  targetCollegeId: string;
  targetCollegeName: string;
  targetEssayId: string;
  targetEssayTitle: string;
}

export type FeedbackType = 'overall' | 'opening' | 'structure' | 'voice' | 'specificity';

export interface GeneratedSuggestion {
  id: string;
  noteId: string;
  noteContent: string;
  suggestion: string;
  matchStrength: 'strong' | 'moderate';
}

export interface ReviewerComment {
  _id: Id<'shareComments'>;
  authorName: string;
  authorEmail?: string;
  content: string;
  selectedText: string;
  resolved: boolean;
  createdAt: number;
}
