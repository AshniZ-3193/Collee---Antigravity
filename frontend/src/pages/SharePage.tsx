import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import ShareViewScreen from '@/components/screens/ShareViewScreen';
import ShareEditScreen from '@/components/screens/ShareEditScreen';
import ShareCommentScreen from '@/components/screens/ShareCommentScreen';
import { motion } from 'framer-motion';
import { FileX } from 'lucide-react';
import ColleeLogo from '@/components/ColleeLogo';

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const shareData = useQuery(api.shares.getByToken, token ? { token } : "skip");

  // Loading state
  if (shareData === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <ColleeLogo size="md" />
          <p className="text-muted-foreground mt-4">Loading essay...</p>
        </motion.div>
      </div>
    );
  }

  // Not found state
  if (shareData === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Essay not found</h1>
          <p className="text-muted-foreground mb-6">
            This share link may have expired or the essay may have been removed.
          </p>
          <a
            href="/"
            className="text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Go to Collee
          </a>
        </motion.div>
      </div>
    );
  }

  // Route based on permission level
  if (shareData.permission === 'edit') {
    return (
      <ShareEditScreen
        token={token!}
        collegeName={shareData.collegeName}
        promptText={shareData.promptText}
        essayContent={shareData.essayContent}
        wordCount={shareData.wordCount}
        wordLimit={shareData.wordLimit}
        authorName={shareData.authorName}
      />
    );
  }

  if (shareData.permission === 'comment') {
    return (
      <ShareCommentScreen
        token={token!}
        collegeName={shareData.collegeName}
        promptText={shareData.promptText}
        essayContent={shareData.essayContent}
        wordCount={shareData.wordCount}
        authorName={shareData.authorName}
      />
    );
  }

  // Default to view-only
  return (
    <ShareViewScreen
      collegeName={shareData.collegeName}
      promptText={shareData.promptText}
      essayContent={shareData.essayContent}
      wordCount={shareData.wordCount}
      authorName={shareData.authorName}
    />
  );
};

export default SharePage;
