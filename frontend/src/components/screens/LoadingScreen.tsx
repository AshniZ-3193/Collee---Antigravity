import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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
        // Still navigate forward - user can retry from workspace
        onComplete();
      });
  }, [generateStoryIdentity, onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated dots */}
        <div className="flex justify-center gap-2 mb-12">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Rotating messages */}
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              className="text-body-lg text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {messages[currentMessage]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        <motion.div
          className="mt-12 w-48 h-1 bg-border rounded-full mx-auto overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full bg-primary/60 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 15, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
