import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLayout from '@/components/ColleeLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ReflectionScreenProps {
  onContinue: (data: { reflection: string }) => void;
  onBack: () => void;
}

const ReflectionScreen: React.FC<ReflectionScreenProps> = ({ onContinue, onBack }) => {
  const [reflection, setReflection] = useState('');
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  return (
    <ColleeLayout showProgress currentStep={6} totalSteps={8}>
      <div className="text-center mb-8">
        {/* Decorative gradient line */}
        <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-6" />
        <m.div
          className="inline-flex items-center gap-2 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-display-sm text-foreground">
            One last question
          </h1>
          <span className="text-caption text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            optional
          </span>
        </m.div>
      </div>

      <m.div
        className="max-w-lg mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <label htmlFor="reflection-input" className="block text-body-md font-medium text-foreground mb-4">
            What's something you notice, wonder about, or keep coming back to?
          </label>
          <textarea
            id="reflection-input"
            className="w-full bg-muted/50 rounded-xl border-0 px-4 py-4 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all min-h-[140px] resize-none"
            placeholder="Maybe a small habit, a recurring thought, something you can't stop observing. A few sentences is perfect."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <p className="text-body-sm text-muted-foreground mt-3">
            This doesn't need to be profound — sometimes the smallest things reveal the most.
          </p>
        </div>
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

        <Button
          variant="collee-accent"
          size="collee-sm"
          onClick={async () => {
            await saveOnboardingStep({ reflection, onboardingComplete: true });
            onContinue({ reflection });
          }}
          className="shadow-warm"
        >
          Generate my story
        </Button>
      </m.div>
    </ColleeLayout>
  );
};

export default ReflectionScreen;
