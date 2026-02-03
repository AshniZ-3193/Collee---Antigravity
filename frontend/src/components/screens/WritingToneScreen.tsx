import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface WritingToneScreenProps {
  onContinue: (data: { tone: string }) => void;
  onBack: () => void;
}

const TONE_OPTIONS = [
  'Quiet and reflective',
  'Analytical and precise',
  'Warm and conversational',
  'Subtly humorous',
  'Direct and minimal',
  'I\'m not sure yet',
];

const WritingToneScreen: React.FC<WritingToneScreenProps> = ({ onContinue, onBack }) => {
  const [selectedTone, setSelectedTone] = useState<string>('');
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  return (
    <ColleeLayout showProgress currentStep={4} totalSteps={8}>
      <div className="text-center mb-10">
        {/* Decorative gradient line */}
        <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-6" />
        <motion.h1
          className="font-display text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          When you write honestly, your tone is usually...
        </motion.h1>
      </div>

      <motion.div
        className="space-y-3 max-w-md mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {TONE_OPTIONS.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => setSelectedTone(tone)}
            className={`
              flex items-center justify-between w-full px-5 py-4 rounded-xl text-left transition-all duration-200
              ${selectedTone === tone
                ? 'bg-primary/10 border-2 border-primary text-foreground shadow-sm'
                : 'bg-card border-2 border-border text-foreground hover:bg-muted/50 hover:border-primary/20 hover:scale-[1.01]'}
            `}
          >
            <span className="text-body-md">{tone}</span>
            {selectedTone === tone && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
          </button>
        ))}
      </motion.div>

      <motion.p
        className="text-body-sm text-muted-foreground text-center mt-6 max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        This helps us keep suggestions in your natural voice.
      </motion.p>

      {/* Actions */}
      <motion.div
        className="flex justify-between items-center mt-8 pt-4 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Button variant="collee-ghost" onClick={onBack}>
          Back
        </Button>

        <Button
          variant="collee-accent"
          size="collee-sm"
          onClick={async () => {
            await saveOnboardingStep({ writingTone: selectedTone });
            onContinue({ tone: selectedTone });
          }}
          className="shadow-warm"
        >
          Continue
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default WritingToneScreen;
