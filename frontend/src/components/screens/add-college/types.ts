export interface AddCollegeScreenProps {
  onBack: () => void;
  onAddCollege: (collegeId: string) => void;
  onComplete: () => void;
}

export type AddCollegeStep = 'select' | 'application-type' | 'prompts';

export interface EssayPrompt {
  id: string;
  promptText: string;
  promptType: string;
  limitValue: number;
  isOptional: boolean;
  targetProgram?: string;
  relevantMajors?: string[];
}

export interface ApplicationType {
  value: string;
  label: string;
  deadline: string;
}

export interface CollegeData {
  id: string;
  name: string;
  location: string;
  applicationTypes: ApplicationType[];
  schoolSlug?: string;
  qualityStatus?: 'unverified' | 'verified' | 'needs_review';
  qualityScore?: number;
}

export interface SelectedCollegeConfig {
  collegeId: string;
  collegeName: string;
  applicationType: string;
  deadline: string;
  schoolSlug?: string;
  sourceQualityStatus?: 'unverified' | 'verified' | 'needs_review';
  sourceQualityScore?: number;
  sourceVerifiedAt?: number;
}

export interface EnsureSchoolContentResponse {
  status: 'ready' | 'enriching';
  schoolSlug: string;
  canonicalName: string;
  qualityStatus: 'unverified' | 'verified' | 'needs_review';
  qualityScore: number;
  verificationNotes?: string;
  prompts: Array<{
    text: string;
    wordCountMax: number;
    isOptional: boolean;
    promptType?: string;
    targetProgram?: string;
    relevantMajors?: string[];
  }>;
  applicationTypes: Array<{
    label: string;
    deadline: string;
    value?: string;
  }>;
  sourceUrls: string[];
  cachedAt: number;
  expiresAt: number;
}

export interface GlobalSchoolMatch {
  canonicalName: string;
  slug: string;
  status: string;
  qualityStatus: 'unverified' | 'verified' | 'needs_review';
  qualityScore: number;
}
