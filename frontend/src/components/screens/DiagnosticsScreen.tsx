import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

const DiagnosticsScreen: React.FC<DiagnosticsScreenProps> = ({ onContinue, onBack }) => {
  const [orientation, setOrientation] = useState<string[]>([]);
  const [motivation, setMotivation] = useState<string[]>([]);
  const [storyPreference, setStoryPreference] = useState<string[]>([]);
  const [socialRole, setSocialRole] = useState<string[]>([]);
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

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
        flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all
        ${isSelected 
          ? 'bg-primary/10 border-2 border-primary text-foreground' 
          : 'bg-muted/50 border-2 border-transparent text-foreground hover:bg-muted/70'}
        ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className="text-body-sm">{label}</span>
      {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
    </button>
  );

  return (
    <ColleeLayout showProgress currentStep={3} totalSteps={8}>
      <div className="text-center mb-8">
        <motion.h1
          className="text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          How you tend to think
        </motion.h1>
        <motion.p
          className="text-body-lg text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          There's no "best" choice — this just helps us understand how you approach things.
        </motion.p>
      </div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Section 1 — Orientation */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-sm font-medium text-foreground mb-2">
            Which of these feel most like you?
          </label>
          <p className="text-caption text-muted-foreground mb-4">Pick up to two.</p>
          <div className="space-y-2">
            {ORIENTATION_OPTIONS.map((option) => (
              <SelectableOption
                key={option}
                label={option}
                isSelected={orientation.includes(option)}
                onClick={() => toggleSelection(option, orientation, setOrientation)}
                disabled={orientation.length >= 2}
              />
            ))}
          </div>
        </div>

        {/* Section 2 — Motivation */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-sm font-medium text-foreground mb-2">
            When you're working on a project, what part do you enjoy most?
          </label>
          <p className="text-caption text-muted-foreground mb-4">Pick up to two.</p>
          <div className="space-y-2">
            {MOTIVATION_OPTIONS.map((option) => (
              <SelectableOption
                key={option}
                label={option}
                isSelected={motivation.includes(option)}
                onClick={() => toggleSelection(option, motivation, setMotivation)}
                disabled={motivation.length >= 2}
              />
            ))}
          </div>
        </div>

        {/* Section 3 — Story Preference */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-sm font-medium text-foreground mb-2">
            If you had to write about one of these, which would you choose?
          </label>
          <p className="text-caption text-muted-foreground mb-4">Pick up to two.</p>
          <div className="space-y-2">
            {STORY_OPTIONS.map((option) => (
              <SelectableOption
                key={option}
                label={option}
                isSelected={storyPreference.includes(option)}
                onClick={() => toggleSelection(option, storyPreference, setStoryPreference)}
                disabled={storyPreference.length >= 2}
              />
            ))}
          </div>
        </div>

        {/* Section 4 — Social Role */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-sm font-medium text-foreground mb-2">
            People usually come to me for…
          </label>
          <p className="text-caption text-muted-foreground mb-4">Pick up to two.</p>
          <div className="space-y-2">
            {SOCIAL_ROLE_OPTIONS.map((option) => (
              <SelectableOption
                key={option}
                label={option}
                isSelected={socialRole.includes(option)}
                onClick={() => toggleSelection(option, socialRole, setSocialRole)}
                disabled={socialRole.length >= 2}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex justify-between items-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button variant="collee-ghost" onClick={onBack}>
          Back
        </Button>

        <Button
          variant="collee-accent"
          size="collee-sm"
          onClick={async () => {
            await saveOnboardingStep({ orientation, motivation, storyPreference, socialRole });
            onContinue({ orientation, motivation, storyPreference, socialRole });
          }}
        >
          Continue
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default DiagnosticsScreen;
