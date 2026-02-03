import React from 'react';
import { motion } from 'framer-motion';
import ColleeLogo from '@/components/ColleeLogo';

const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          {/* Branded loading ring */}
          <div className="absolute inset-0 -m-3">
            <motion.div
              className="w-full h-full rounded-full border-2 border-primary/20 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <ColleeLogo size="sm" />
        </div>
        <p className="text-body-sm text-muted-foreground animate-pulse-gentle">
          Signing you in...
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLoadingScreen;
