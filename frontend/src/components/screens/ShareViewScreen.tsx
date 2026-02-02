import React from 'react';
import { motion } from 'framer-motion';
import { FileText, GraduationCap, User } from 'lucide-react';

interface ShareViewScreenProps {
  collegeName: string;
  promptText: string;
  essayContent: string;
  wordCount: number;
  authorName?: string;
}

const ShareViewScreen: React.FC<ShareViewScreenProps> = ({
  collegeName,
  promptText,
  essayContent,
  wordCount,
  authorName,
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <motion.div
        className="bg-primary/5 border-b border-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-body-sm font-medium text-primary">Shared Essay</span>
            </div>
            {authorName && (
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{authorName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.main
        className="max-w-2xl mx-auto px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* College & Prompt */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-body font-medium text-secondary">{collegeName}</span>
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-10" />

        {/* Essay Content */}
        <motion.article
          className="prose prose-lg max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {essayContent.split('\n\n').map((paragraph, index) => (
            <p 
              key={index}
              className="text-foreground text-lg leading-relaxed mb-6"
            >
              {paragraph}
            </p>
          ))}
        </motion.article>

        {/* Footer */}
        <motion.div
          className="mt-12 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-between text-body-sm text-muted-foreground">
            <span>{wordCount} words</span>
            <span>Created with Collee</span>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default ShareViewScreen;
