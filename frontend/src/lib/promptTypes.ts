export const PROMPT_TYPES = [
  { value: 'contribution', label: 'Contribution' },
  { value: 'why-major', label: 'Why Major' },
  { value: 'why-college', label: 'Why This College' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'identity', label: 'Identity' },
  { value: 'challenge', label: 'Challenge/Setback' },
  { value: 'other', label: 'Other' },
] as const;

type PromptTypeValue = (typeof PROMPT_TYPES)[number]['value'];
