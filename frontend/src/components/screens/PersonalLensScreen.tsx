import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface IdentityHandling {
  aspect: string;
  elaboration?: string;
  handling: string;
}

interface PersonalLensScreenProps {
  onContinue: (data: { identityAspects: string[]; handlingPreferences: IdentityHandling[] }) => void;
  onBack: () => void;
  onSkip?: () => void;
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

const PersonalLensScreen: React.FC<PersonalLensScreenProps> = ({ onContinue, onBack, onSkip }) => {
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([]);
  const [handlingPreferences, setHandlingPreferences] = useState<Record<string, string>>({});
  const [elaborations, setElaborations] = useState<Record<string, string>>({});
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  const toggleIdentity = (identity: string) => {
    if (identity === 'None / I\'m not sure yet') {
      setSelectedIdentities([identity]);
      setHandlingPreferences({});
      setElaborations({});
    } else if (selectedIdentities.includes(identity)) {
      setSelectedIdentities((prev) =>
        prev.filter((i) => i !== identity && i !== 'None / I\'m not sure yet')
      );
      setHandlingPreferences((prev) => {
        const next = { ...prev };
        delete next[identity];
        return next;
      });
      setElaborations((prev) => {
        const next = { ...prev };
        delete next[identity];
        return next;
      });
    } else {
      setSelectedIdentities((prev) => [
        ...prev.filter((i) => i !== 'None / I\'m not sure yet'),
        identity,
      ]);
    }
  };

  const setHandlingForAspect = (aspect: string, handling: string) => {
    setHandlingPreferences((prev) => ({ ...prev, [aspect]: handling }));
  };

  const setElaborationForAspect = (aspect: string, text: string) => {
    setElaborations((prev) => ({ ...prev, [aspect]: text }));
  };

  const activeIdentities = selectedIdentities.filter(
    (i) => i !== 'None / I\'m not sure yet'
  );

  return (
    <ColleeLayout showProgress currentStep={5} totalSteps={8}>
      <div className="text-center mb-8">
        {/* Decorative gradient line */}
        <div className="w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-6" />
        <m.h1
          className="font-display text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Are there parts of your identity that feel important to how you tell your story?
        </m.h1>
        <m.p
          className="text-body-md text-muted-foreground max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Some students choose to center parts of their identity in their applications. Others prefer to keep things subtle or private. Both are completely valid.
        </m.p>
      </div>

      <m.div
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
              flex items-center justify-between w-full px-5 py-4 rounded-xl text-left transition-all duration-200
              ${selectedIdentities.includes(identity)
                ? 'bg-primary/10 border-2 border-primary text-foreground shadow-sm'
                : 'bg-card border-2 border-border text-foreground hover:bg-muted/50 hover:border-primary/20 hover:scale-[1.01]'}
            `}
          >
            <span className="text-body-md">{identity}</span>
            {selectedIdentities.includes(identity) && (
              <Check className="h-5 w-5 text-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </m.div>

      {/* Per-identity follow-up questions */}
      {activeIdentities.length > 0 && (
        <m.div
          className="mt-8 max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
            {activeIdentities.map((aspect) => (
              <m.div
                key={aspect}
                className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-soft-md transition-shadow"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <span className="block text-body-sm text-muted-foreground mb-3">
                  {aspect}
                </span>

                {/* Elaboration textarea */}
                <label className="block text-body-sm font-medium text-foreground mb-2">
                  Tell us more{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  className="w-full bg-muted/50 rounded-xl border-0 px-4 py-3 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background focus:shadow-sm transition-all resize-none text-body-sm mb-4"
                  rows={2}
                  placeholder="e.g. My parents immigrated from Korea, and I grew up between two cultures..."
                  value={elaborations[aspect] || ''}
                  onChange={(e) => setElaborationForAspect(aspect, e.target.value)}
                />

                <span className="block text-body-sm font-medium text-foreground mb-3" role="heading" aria-level={4}>
                  How would you like us to handle this?
                </span>
                <div className="space-y-2">
                  {HANDLING_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setHandlingForAspect(aspect, option)}
                      className={`
                        flex items-center justify-between w-full px-4 py-3 rounded-xl text-left transition-all duration-200
                        ${handlingPreferences[aspect] === option
                          ? 'bg-primary/10 border-2 border-primary text-foreground shadow-sm'
                          : 'bg-muted/50 border-2 border-transparent text-foreground hover:bg-muted/70 hover:border-primary/10 hover:scale-[1.01]'}
                      `}
                    >
                      <span className="text-body-sm">{option}</span>
                      {handlingPreferences[aspect] === option && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </m.div>
            ))}
          </div>
        </m.div>
      )}

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
            const handlingPerAspect = activeIdentities.map((aspect) => ({
              aspect,
              elaboration: elaborations[aspect] || '',
              handling: handlingPreferences[aspect] || '',
            }));
            await saveOnboardingStep({
              identityAspects: selectedIdentities,
              identityHandling: handlingPerAspect,
            });
            onContinue({
              identityAspects: selectedIdentities,
              handlingPreferences: handlingPerAspect,
            });
          }}
          className="shadow-warm"
        >
          Continue
        </Button>
      </m.div>
    </ColleeLayout>
  );
};

export default PersonalLensScreen;
