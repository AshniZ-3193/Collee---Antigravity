import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "Finding the patterns in what you shared…",
    "Connecting your experiences…",
    "Discovering what makes you distinct…",
    "Building your story identity…",
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

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

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
            animate={{ width: "100%" }}
            transition={{ duration: 7, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
