import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AcademicScreenProps {
  onContinue: (data: { primary: string; secondary: string }) => void;
  onBack: () => void;
}

const MAJOR_OPTIONS = [
  'Anthropology',
  'Architecture',
  'Art History',
  'Biology',
  'Business Administration',
  'Chemistry',
  'Communications',
  'Computer Science',
  'Economics',
  'Education',
  'Engineering',
  'English',
  'Environmental Studies',
  'Film Studies',
  'History',
  'International Relations',
  'Journalism',
  'Mathematics',
  'Music',
  'Nursing',
  'Philosophy',
  'Physics',
  'Political Science',
  'Pre-Law',
  'Pre-Med',
  'Psychology',
  'Public Health',
  'Sociology',
  'Theater',
  'Other',
];

const AcademicScreen: React.FC<AcademicScreenProps> = ({ onContinue, onBack }) => {
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [otherMajor, setOtherMajor] = useState('');
  const [secondaryInterest, setSecondaryInterest] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  const toggleMajor = (major: string) => {
    setSelectedMajors((prev) =>
      prev.includes(major)
        ? prev.filter((m) => m !== major)
        : [...prev, major]
    );
  };

  const removeMajor = (major: string) => {
    setSelectedMajors((prev) => prev.filter((m) => m !== major));
    if (major === 'Other') {
      setOtherMajor('');
    }
  };

  const getPrimaryString = () => {
    const majors = selectedMajors.filter((m) => m !== 'Other');
    if (selectedMajors.includes('Other') && otherMajor.trim()) {
      majors.push(otherMajor.trim());
    }
    return majors.join(', ');
  };

  return (
    <ColleeLayout showProgress currentStep={2} totalSteps={8}>
      <div className="text-center mb-10">
        <motion.h1
          className="text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          What are you curious about?
        </motion.h1>
        <motion.p
          className="text-body-lg text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Think about what you want to study or explore in college.
        </motion.p>
      </div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Primary Interest */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <label className="block text-body-sm font-medium text-foreground mb-3">
            Primary Academic Interest(s)
          </label>
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full bg-muted/50 rounded-xl border-0 px-4 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span className={selectedMajors.length > 0 ? 'text-foreground' : 'text-foreground-subtle'}>
                  {selectedMajors.length > 0
                    ? `${selectedMajors.length} selected`
                    : 'Select your major(s)...'}
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border shadow-lg z-50"
              align="start"
            >
              <div className="max-h-64 overflow-y-auto p-2">
                {MAJOR_OPTIONS.map((major) => (
                  <button
                    key={major}
                    type="button"
                    onClick={() => toggleMajor(major)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-foreground">{major}</span>
                    {selectedMajors.includes(major) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Selected majors chips */}
          {selectedMajors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedMajors.map((major) => (
                <span
                  key={major}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-body-sm"
                >
                  {major}
                  <button
                    type="button"
                    onClick={() => removeMajor(major)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Other input field */}
          {selectedMajors.includes('Other') && (
            <input
              type="text"
              className="w-full bg-muted/50 rounded-xl border-0 px-4 py-4 mt-3 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Type your interest..."
              value={otherMajor}
              onChange={(e) => setOtherMajor(e.target.value)}
            />
          )}
        </div>

        {/* Secondary Interest */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <label className="text-body-sm font-medium text-foreground">
              Secondary interest
            </label>
            <span className="text-caption text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Optional
            </span>
          </div>
          <input
            type="text"
            className="w-full bg-muted/50 rounded-xl border-0 px-4 py-4 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g., Music, Philosophy, Economics..."
            value={secondaryInterest}
            onChange={(e) => setSecondaryInterest(e.target.value)}
          />
          <p className="text-body-sm text-muted-foreground mt-3">
            A minor or just something else you're drawn to.
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
        <Button 
          variant="collee-ghost" 
          onClick={onBack}
        >
          Back
        </Button>
        
        <Button 
          variant="collee-accent" 
          size="collee-sm"
          onClick={async () => {
            const primary = getPrimaryString();
            const majors = selectedMajors.filter((m) => m !== 'Other');
            if (selectedMajors.includes('Other') && otherMajor.trim()) {
              majors.push(otherMajor.trim());
            }
            await saveOnboardingStep({ primaryInterests: majors, secondaryInterest });
            onContinue({ primary, secondary: secondaryInterest });
          }}
        >
          Continue
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default AcademicScreen;
