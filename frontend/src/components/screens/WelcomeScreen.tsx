import React from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLogo from '@/components/ColleeLogo';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background relative overflow-hidden">
      {/* Blurred gradient orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-primary/[0.05] blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/[0.05] blur-[100px] pointer-events-none" aria-hidden="true" />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" aria-hidden="true" />

      <m.div
        className="w-full max-w-content text-center relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo with floating animation and glow ring */}
        <m.div
          className="mb-10 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative">
            {/* Soft glow ring behind logo */}
            <div className="absolute inset-0 -m-3 rounded-full bg-primary/[0.08] blur-xl animate-pulse-gentle" aria-hidden="true" />
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ColleeLogo size="lg" showText showTagline />
            </m.div>
          </div>
        </m.div>

        {/* Headline with display font */}
        <m.h1
          className="font-display text-display text-foreground mb-6 max-w-lg mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Let's figure out <span className="text-secondary">your college application story.</span>
        </m.h1>

        {/* Subtext */}
        <m.p
          className="text-body-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Answer a few questions and we'll help you understand what makes you distinct — and how to write essays that sound like you.
        </m.p>

        {/* CTA with warm shadow */}
        <m.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            variant="collee-accent"
            size="collee"
            onClick={onStart}
            className="min-w-[200px] shadow-warm"
          >
            Find my story
          </Button>

          <p className="text-body-sm text-muted-foreground">
            Takes about 10 minutes. No essays required.
          </p>
        </m.div>
      </m.div>
    </div>
  );
};

export default WelcomeScreen;
