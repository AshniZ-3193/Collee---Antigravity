import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ColleeLogo from '@/components/ColleeLogo';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const generateStoryIdentity = useAction(api.ai.generateStoryIdentity.generate);
  const hasStarted = useRef(false);

  const messages = [
    "Finding the patterns in what you shared...",
    "Connecting your experiences...",
    "Discovering what makes you distinct...",
    "Building your story identity...",
  ];

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    generateStoryIdentity()
      .then(() => {
        onComplete();
      })
      .catch((error) => {
        console.error("Failed to generate story identity:", error);
        onComplete();
      });
  }, [generateStoryIdentity, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background relative overflow-hidden">
      {/* Subtle blurred gradient orbs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-primary/[0.04] blur-[80px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-secondary/[0.04] blur-[80px] pointer-events-none" aria-hidden="true" />

      <m.div
        className="text-center max-w-md relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Branded logo animation with float and glow ring */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            {/* Pulsing glow ring */}
            <m.div
              className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            />
            <m.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ColleeLogo size="md" />
            </m.div>
          </div>
        </div>

        {/* Rotating messages with display font */}
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <m.p
              key={currentMessage}
              className="font-display text-heading text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {messages[currentMessage]}
            </m.p>
          </AnimatePresence>
        </div>

        {/* Progress bar with gradient fill and shimmer */}
        <m.div
          className="mt-12 w-64 h-2 bg-border rounded-full mx-auto overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <m.div
            className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-primary to-secondary"
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 15, ease: "easeInOut" }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 animate-shimmer">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
          </m.div>
        </m.div>
      </m.div>
    </div>
  );
};

export default LoadingScreen;
