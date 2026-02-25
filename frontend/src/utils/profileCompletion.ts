export interface ProfileCompletionResult {
  pct: number;
  completedSteps: string[];
  missingSteps: string[];
}

interface UserProfile {
  activitiesText?: string;
  primaryInterests?: string[];
  orientation?: string[];
  motivation?: string[];
  storyPreference?: string[];
  socialRole?: string[];
  writingTone?: string;
  identityAspects?: string[];
  reflection?: string;
}

const STEPS: { label: string; weight: number; check: (p: UserProfile, hasStoryIdentity: boolean) => boolean }[] = [
  {
    label: 'Activities',
    weight: 14,
    check: (p) => Boolean(p.activitiesText?.trim()),
  },
  {
    label: 'Academic interests',
    weight: 14,
    check: (p) => Boolean(p.primaryInterests && p.primaryInterests.length > 0),
  },
  {
    label: 'Personality diagnostics',
    weight: 14,
    check: (p) =>
      Boolean(p.orientation?.length) &&
      Boolean(p.motivation?.length) &&
      Boolean(p.storyPreference?.length) &&
      Boolean(p.socialRole?.length),
  },
  {
    label: 'Writing tone',
    weight: 14,
    check: (p) => Boolean(p.writingTone?.trim()),
  },
  {
    label: 'Personal lens',
    weight: 14,
    check: (p) => Boolean(p.identityAspects && p.identityAspects.length > 0),
  },
  {
    label: 'Reflection',
    weight: 15,
    check: (p) => Boolean(p.reflection?.trim()),
  },
  {
    label: 'Story generated',
    weight: 15,
    check: (_p, hasStoryIdentity) => hasStoryIdentity,
  },
];

export function calculateProfileCompletion(
  profile: UserProfile | null,
  hasStoryIdentity: boolean,
): ProfileCompletionResult {
  if (!profile) {
    return {
      pct: 0,
      completedSteps: [],
      missingSteps: STEPS.map((s) => s.label),
    };
  }

  const completedSteps: string[] = [];
  const missingSteps: string[] = [];
  let earned = 0;

  for (const step of STEPS) {
    if (step.check(profile, hasStoryIdentity)) {
      completedSteps.push(step.label);
      earned += step.weight;
    } else {
      missingSteps.push(step.label);
    }
  }

  return {
    pct: Math.min(100, earned),
    completedSteps,
    missingSteps,
  };
}
