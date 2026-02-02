import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLayout from '@/components/ColleeLayout';

interface ReflectionScreenProps {
  onContinue: (data: { reflection: string }) => void;
  onBack: () => void;
}

const ReflectionScreen: React.FC<ReflectionScreenProps> = ({ onContinue, onBack }) => {
  const [reflection, setReflection] = useState('');

  return (
    <ColleeLayout showProgress currentStep={6} totalSteps={8}>
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center gap-2 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-display-sm text-foreground">
            One last question
          </h1>
          <span className="text-caption text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            optional
          </span>
        </motion.div>
      </div>

      <motion.div
        className="max-w-lg mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-md font-medium text-foreground mb-4">
            What's something you notice, wonder about, or keep coming back to?
          </label>
          <textarea
            className="w-full bg-muted/50 rounded-xl border-0 px-4 py-4 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[140px] resize-none"
            placeholder="Maybe a small habit, a recurring thought, something you can't stop observing. A few sentences is perfect."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
          <p className="text-body-sm text-muted-foreground mt-3">
            This doesn't need to be profound — sometimes the smallest things reveal the most.
          </p>
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
          onClick={() => onContinue({ reflection })}
        >
          Generate my story
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default ReflectionScreen;
