import React from 'react';
import { m } from 'framer-motion';
import { ArrowLeft, FileText, GraduationCap } from 'lucide-react';

import ColleeLogo from '@/components/ColleeLogo';
import type { AddCollegeStep, SelectedCollegeConfig } from './types';

interface AddCollegeHeaderProps {
  step: AddCollegeStep;
  currentConfig?: SelectedCollegeConfig;
  currentConfigIndex: number;
  collegeConfigsLength: number;
  onBack: () => void;
}

const AddCollegeHeader: React.FC<AddCollegeHeaderProps> = ({
  step,
  currentConfig,
  currentConfigIndex,
  collegeConfigsLength,
  onBack,
}) => {
  return (
    <>
      <m.div
        className="flex justify-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ColleeLogo size="sm" />
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-body-sm">
            {step === 'prompts'
              ? 'Back'
              : step === 'application-type'
                ? currentConfigIndex > 0
                  ? 'Previous college'
                  : 'Back to colleges'
                : 'Back'}
          </span>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            {step === 'select' ? (
              <GraduationCap className="w-6 h-6 text-primary" />
            ) : (
              <FileText className="w-6 h-6 text-primary" />
            )}
          </div>
          <h1 className="text-title text-foreground mb-2">
            {step === 'select'
              ? 'Add colleges'
              : step === 'application-type'
                ? 'Select application type'
                : 'Add essay prompts'}
          </h1>
          <p className="text-body text-muted-foreground">
            {step === 'select'
              ? 'Select one or more colleges to add to your list'
              : step === 'application-type'
                ? `Choose how you're applying to ${currentConfig?.collegeName}`
                : `Add the essay prompts for ${currentConfig?.collegeName}`}
          </p>
          {step !== 'select' && collegeConfigsLength > 1 && (
            <p className="text-body-sm text-primary mt-2">
              College {currentConfigIndex + 1} of {collegeConfigsLength}
            </p>
          )}
        </div>
      </m.div>
    </>
  );
};

export default AddCollegeHeader;
