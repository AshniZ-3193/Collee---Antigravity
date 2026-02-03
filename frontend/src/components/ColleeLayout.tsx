import React from 'react';
import { motion } from 'framer-motion';
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
      {/* Subtle progress bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50">
          <motion.div
            className="h-full bg-primary/60"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      <div className="absolute top-4 right-4 z-40">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          className="w-full max-w-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default ColleeLayout;
