import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface DiagnosticsScreenProps {
  onContinue: (data: {
    orientation: string[];
    motivation: string[];
    storyPreference: string[];
    socialRole: string[];
  }) => void;
  onBack: () => void;
  onSkip?: () => void;
}

const ORIENTATION_OPTIONS = [
  'Building or fixing things',
  'Investigating how things work',
  'Leading people or groups',
  'Helping others directly',
  'Creating something expressive',
];

const MOTIVATION_OPTIONS = [
  'Solving the technical challenge',
  'Understanding the bigger system',
  'Seeing real-world impact',
  'Explaining things to others',
  'Improving something over time',
];

const STORY_OPTIONS = [
  'A small win most people didn\'t notice',
  'A failure that changed how you think',
  'A long-term commitment',
  'A moment of curiosity',
  'A leadership experience',
];

const SOCIAL_ROLE_OPTIONS = [
  'Advice',
  'Problem-solving',
  'Organization',
  'Emotional support',
  'Technical help',
];

const SECTIONS = [
  { key: 'orientation', label: 'Which of these feel most like you?', options: ORIENTATION_OPTIONS },
  { key: 'motivation', label: 'When you\'re working on a project, what part do you enjoy most?', options: MOTIVATION_OPTIONS },
  { key: 'storyPreference', label: 'If you had to write about one of these, which would you choose?', options: STORY_OPTIONS },
  { key: 'socialRole', label: 'People usually come to me for\u2026', options: SOCIAL_ROLE_OPTIONS },
] as const;

const SelectableOption = ({
  label,
  isSelected,
  onClick,
  disabled,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled && !isSelected}
    className={`
      flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all duration-200
      ${isSelected
        ? 'bg-primary/10 border-2 border-primary text-foreground shadow-sm'
        : 'bg-muted/50 border-2 border-transparent text-foreground hover:bg-muted/70 hover:border-primary/10 hover:scale-[1.01]'}
      ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span className="text-body-sm">{label}</span>
    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
  </button>
);

const DiagnosticsScreen: React.FC<DiagnosticsScreenProps> = ({ onContinue, onBack, onSkip }) => {
  const [orientation, setOrientation] = useState<string[]>([]);
  const [motivation, setMotivation] = useState<string[]>([]);
  const [storyPreference, setStoryPreference] = useState<string[]>([]);
  const [socialRole, setSocialRole] = useState<string[]>([]);
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  const stateMap: Record<string, { value: string[]; setter: React.Dispatch<React.SetStateAction<string[]>> }> = {
    orientation: { value: orientation, setter: setOrientation },
    motivation: { value: motivation, setter: setMotivation },
    storyPreference: { value: storyPreference, setter: setStoryPreference },
    socialRole: { value: socialRole, setter: setSocialRole },
  };

  const toggleSelection = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    max: number = 2
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else if (current.length < max) {
      setter([...current, value]);
    }
  };

  return (
    <ColleeLayout showProgress currentStep={3} totalSteps={8}>
      <div className="text-center mb-8">
        {/* Decorative gradient line */}
        <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-6" />
        <m.h1
          className="font-display text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          How you tend to think
        </m.h1>
        <m.p
          className="text-body-lg text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          There's no "best" choice — this just helps us understand how you approach things.
        </m.p>
      </div>

      <m.div
        className="space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {SECTIONS.map((section, sectionIndex) => {
          const { value, setter } = stateMap[section.key];
          return (
            <div key={section.key} className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-soft-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-body-sm font-medium text-foreground">
                  {section.label}
                </label>
                {/* Section progress */}
                <span className="text-caption text-muted-foreground">
                  {sectionIndex + 1}/{SECTIONS.length}
                </span>
              </div>
              <p className="text-caption text-muted-foreground mb-4">Pick up to two.</p>
              <div className="space-y-2">
                {section.options.map((option) => (
                  <SelectableOption
                    key={option}
                    label={option}
                    isSelected={value.includes(option)}
                    onClick={() => toggleSelection(option, value, setter)}
                    disabled={value.length >= 2}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </m.div>

      {/* Actions */}
      <m.div
        className="flex justify-between items-center mt-8 pt-4 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button variant="collee-ghost" onClick={onBack}>
          Back
        </Button>

        {onSkip && (
          <button
            onClick={onSkip}
            className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        )}

        <Button
          variant="collee-accent"
          size="collee-sm"
          onClick={async () => {
            await saveOnboardingStep({ orientation, motivation, storyPreference, socialRole });
            onContinue({ orientation, motivation, storyPreference, socialRole });
          }}
          className="shadow-warm"
        >
          Continue
        </Button>
      </m.div>
    </ColleeLayout>
  );
};

export default DiagnosticsScreen;
