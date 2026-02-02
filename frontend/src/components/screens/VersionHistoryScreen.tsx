import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, RotateCcw, Eye } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface Version {
  id: string;
  timestamp: string;
  wordCount: number;
  preview: string;
  isCurrent?: boolean;
}

interface VersionHistoryScreenProps {
  essayTitle: string;
  onBack: () => void;
  onRestoreVersion: (versionId: string) => void;
  onPreviewVersion: (versionId: string) => void;
}

const mockVersions: Version[] = [
  {
    id: '1',
    timestamp: 'Today, 3:42 PM',
    wordCount: 542,
    preview: 'The moment I realized I wanted to pursue computer science was not in a classroom - it was in my grandmother\'s kitchen...',
    isCurrent: true,
  },
  {
    id: '2',
    timestamp: 'Today, 2:15 PM',
    wordCount: 487,
    preview: 'The moment I realized I wanted to pursue computer science was not in a classroom. It was somewhere much more unexpected...',
  },
  {
    id: '3',
    timestamp: 'Today, 11:30 AM',
    wordCount: 320,
    preview: 'I never expected to find my passion for technology in my grandmother\'s kitchen, but life has a way of surprising us...',
  },
  {
    id: '4',
    timestamp: 'Yesterday, 8:45 PM',
    wordCount: 156,
    preview: 'Growing up, I always thought technology was cold and impersonal. But then something changed...',
  },
  {
    id: '5',
    timestamp: 'Yesterday, 4:20 PM',
    wordCount: 45,
    preview: 'When I think about what shaped my interests, I keep coming back to one particular moment...',
  },
];

const VersionHistoryScreen: React.FC<VersionHistoryScreenProps> = ({
  essayTitle,
  onBack,
  onRestoreVersion,
  onPreviewVersion,
}) => {
  return (
    <ColleeLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-body-sm">Back to editor</span>
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Version history</h1>
            <p className="text-body text-muted-foreground">
              {essayTitle}
            </p>
          </div>
        </motion.div>

        {/* Version List */}
        <div className="space-y-3">
          {mockVersions.map((version, index) => (
            <motion.div
              key={version.id}
              className={`p-4 rounded-xl border transition-all ${
                version.isCurrent
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-foreground">
                    {version.timestamp}
                  </span>
                  {version.isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-body-sm text-muted-foreground">
                  {version.wordCount} words
                </span>
              </div>
              
              <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
                {version.preview}
              </p>
              
              {!version.isCurrent && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreviewVersion(version.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestoreVersion(version.id)}
                    className="text-secondary hover:text-secondary-hover"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Restore
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Info Note */}
        <motion.p
          className="text-body-sm text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Versions are automatically saved as you write
        </motion.p>
      </div>
    </ColleeLayout>
  );
};

export default VersionHistoryScreen;
