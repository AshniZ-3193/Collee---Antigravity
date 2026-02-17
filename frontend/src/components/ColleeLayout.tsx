import React from 'react';
import { m } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

interface ColleeLayoutProps {
  children: React.ReactNode;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const ColleeLayout: React.FC<ColleeLayoutProps> = ({
  children,
  showProgress = false,
  currentStep = 1,
  totalSteps = 8,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Gradient progress bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-border z-50">
          <m.div
            className="h-full bg-gradient-to-r from-primary to-secondary relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Glow on leading edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-4 bg-primary/40 blur-md rounded-full" />
          </m.div>
        </div>
      )}

      {/* Step indicator + theme toggle */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
        {showProgress && (
          <span className="text-caption text-foreground-subtle">
            Step {currentStep} of {totalSteps}
          </span>
        )}
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="flex items-center justify-center min-h-screen px-6 py-12">
        <m.div
          className="w-full max-w-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </m.div>
      </main>
    </div>
  );
};

export default ColleeLayout;
