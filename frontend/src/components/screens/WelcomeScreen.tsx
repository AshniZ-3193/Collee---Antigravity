import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLogo from '@/components/ColleeLogo';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <motion.div
        className="w-full max-w-content text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo/Icon */}
        <motion.div
          className="mb-10 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ColleeLogo size="lg" showText showTagline />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-display text-foreground mb-6 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Let's figure out your college application story.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-body-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Answer a few questions and we'll help you understand what makes you distinct — and how to write essays that sound like you.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button 
            variant="collee-accent" 
            size="collee"
            onClick={onStart}
            className="min-w-[200px]"
          >
            Find my story
          </Button>
          
          <p className="text-body-sm text-muted-foreground">
            Takes about 10 minutes. No essays required.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
