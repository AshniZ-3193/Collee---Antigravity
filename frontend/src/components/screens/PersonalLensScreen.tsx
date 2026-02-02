import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface PersonalLensScreenProps {
  onContinue: (data: { identityAspects: string[]; handlingPreference: string }) => void;
  onBack: () => void;
}

const IDENTITY_OPTIONS = [
  'Sexual orientation or gender identity',
  'Cultural or family background',
  'Introversion or personality style',
  'Neurodiversity or learning differences',
  'Mental health journey',
  'None / I\'m not sure yet',
];

const HANDLING_OPTIONS = [
  'Help me explore it',
  'Weave it in subtly',
  'Keep it in the background',
  'Not sure yet',
];

const PersonalLensScreen: React.FC<PersonalLensScreenProps> = ({ onContinue, onBack }) => {
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([]);
  const [handlingPreference, setHandlingPreference] = useState<string>('');

  const toggleIdentity = (identity: string) => {
    if (identity === 'None / I\'m not sure yet') {
      // If selecting "None", clear other selections
      setSelectedIdentities([identity]);
      setHandlingPreference('');
    } else {
      setSelectedIdentities((prev) => {
        // Remove "None" if selecting something else
        const filtered = prev.filter((i) => i !== 'None / I\'m not sure yet');
        if (prev.includes(identity)) {
          return filtered.filter((i) => i !== identity);
        }
        return [...filtered, identity];
      });
    }
  };

  const showFollowUp = selectedIdentities.length > 0 && 
    !selectedIdentities.includes('None / I\'m not sure yet');

  return (
    <ColleeLayout showProgress currentStep={5} totalSteps={8}>
      <div className="text-center mb-8">
        <motion.h1
          className="text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Are there parts of your identity that feel important to how you tell your story?
        </motion.h1>
        <motion.p
          className="text-body-md text-muted-foreground max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Some students choose to center parts of their identity in their applications. Others prefer to keep things subtle or private. Both are completely valid.
        </motion.p>
      </div>

      <motion.div
        className="space-y-3 max-w-md mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {IDENTITY_OPTIONS.map((identity) => (
          <button
            key={identity}
            type="button"
            onClick={() => toggleIdentity(identity)}
            className={`
              flex items-center justify-between w-full px-5 py-4 rounded-xl text-left transition-all
              ${selectedIdentities.includes(identity) 
                ? 'bg-primary/10 border-2 border-primary text-foreground' 
                : 'bg-card border-2 border-border text-foreground hover:bg-muted/50'}
            `}
          >
            <span className="text-body-md">{identity}</span>
            {selectedIdentities.includes(identity) && (
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </motion.div>

      {/* Follow-up question - only shows if something other than "None" is selected */}
      {showFollowUp && (
        <motion.div
          className="mt-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            <label className="block text-body-sm font-medium text-foreground mb-4">
              How would you like us to handle this?
            </label>
            <div className="space-y-2">
              {HANDLING_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setHandlingPreference(option)}
                  className={`
                    flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all
                    ${handlingPreference === option 
                      ? 'bg-primary/10 border-2 border-primary text-foreground' 
                      : 'bg-muted/50 border-2 border-transparent text-foreground hover:bg-muted/70'}
                  `}
                >
                  <span className="text-body-sm">{option}</span>
                  {handlingPreference === option && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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
          onClick={() =>
            onContinue({
              identityAspects: selectedIdentities,
              handlingPreference,
            })
          }
        >
          Continue
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default PersonalLensScreen;
