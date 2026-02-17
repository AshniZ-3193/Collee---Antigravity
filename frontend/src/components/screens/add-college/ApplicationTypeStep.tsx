import React from 'react';
import { m } from 'framer-motion';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ApplicationType, SelectedCollegeConfig } from './types';

interface ApplicationTypeStepProps {
  currentConfig?: SelectedCollegeConfig;
  currentConfigIndex: number;
  collegeConfigsLength: number;
  currentAvailableAppTypes: ApplicationType[];
  isSearchingDeadlines: boolean;
  deadlineSearchError: string | null;
  noDeadlinesFound: boolean;
  qualityStatusMessage: string | null;
  canProceedToPrompts: boolean;
  onSelectApplicationType: (appTypeValue: string) => void;
  onContinue: () => void;
  nextCollegeName?: string;
}

const ApplicationTypeStep: React.FC<ApplicationTypeStepProps> = ({
  currentConfig,
  currentConfigIndex,
  collegeConfigsLength,
  currentAvailableAppTypes,
  isSearchingDeadlines,
  deadlineSearchError,
  noDeadlinesFound,
  qualityStatusMessage,
  canProceedToPrompts,
  onSelectApplicationType,
  onContinue,
  nextCollegeName,
}) => {
  return (
    <m.div
      key={`application-type-${currentConfigIndex}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {isSearchingDeadlines && (
        <p className="text-body-sm text-muted-foreground">
          Searching for application deadlines for {currentConfig?.collegeName}...
        </p>
      )}
      {deadlineSearchError && <p className="text-body-sm text-destructive">{deadlineSearchError}</p>}
      {noDeadlinesFound && !deadlineSearchError && !isSearchingDeadlines && (
        <p className="text-body-sm text-muted-foreground">No deadlines found. Showing default options.</p>
      )}
      {qualityStatusMessage && <p className="text-body-sm text-muted-foreground">{qualityStatusMessage}</p>}

      <div className="space-y-3">
        {currentAvailableAppTypes.map((appType, index) => (
          <m.button
            key={appType.value}
            onClick={() => onSelectApplicationType(appType.value)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              currentConfig?.applicationType === appType.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/30'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-body font-medium text-foreground">{appType.label}</h3>
                <p className="text-body-sm text-muted-foreground">Deadline: {appType.deadline}</p>
              </div>
              {currentConfig?.applicationType === appType.value && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </m.button>
        ))}
      </div>

      {canProceedToPrompts && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4"
        >
          <Button variant="collee-accent" size="collee" onClick={onContinue} className="w-full">
            {currentConfigIndex < collegeConfigsLength - 1
              ? `Continue to ${nextCollegeName}`
              : 'Continue to prompts'}
          </Button>
        </m.div>
      )}
    </m.div>
  );
};

export default ApplicationTypeStep;
