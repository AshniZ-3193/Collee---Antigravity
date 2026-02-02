import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Check, Circle, Clock } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface Essay {
  id: string;
  prompt: string;
  wordLimit: number;
  status: 'not-started' | 'in-progress' | 'complete';
  lastEdited?: string;
}

interface CollegeDetailScreenProps {
  collegeName: string;
  deadline: string;
  onBack: () => void;
  onSelectEssay: (essayId: string) => void;
}

const mockEssays: Essay[] = [
  {
    id: '1',
    prompt: 'Describe an experience where you had to make a difficult choice. What did you decide and what did you learn?',
    wordLimit: 650,
    status: 'complete',
    lastEdited: '2 days ago',
  },
  {
    id: '2',
    prompt: 'Tell us about something that has been meaningful to your identity.',
    wordLimit: 350,
    status: 'in-progress',
    lastEdited: '1 hour ago',
  },
  {
    id: '3',
    prompt: 'Why Stanford?',
    wordLimit: 250,
    status: 'not-started',
  },
];

const getStatusIcon = (status: Essay['status']) => {
  switch (status) {
    case 'complete':
      return <Check className="w-4 h-4 text-primary" />;
    case 'in-progress':
      return <Clock className="w-4 h-4 text-secondary" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusLabel = (status: Essay['status']) => {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in-progress':
      return 'In progress';
    default:
      return 'Not started';
  }
};

const CollegeDetailScreen: React.FC<CollegeDetailScreenProps> = ({
  collegeName,
  deadline,
  onBack,
  onSelectEssay,
}) => {
  const completedCount = mockEssays.filter(e => e.status === 'complete').length;

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
            <span className="text-body-sm">Back to colleges</span>
          </button>

          <div className="mb-6">
            <h1 className="text-title text-foreground mb-2">{collegeName}</h1>
            <div className="flex items-center gap-4 text-body-sm text-muted-foreground">
              <span>Deadline: {deadline}</span>
              <span>·</span>
              <span>{completedCount}/{mockEssays.length} essays complete</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / mockEssays.length) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
          </div>
        </motion.div>

        {/* Essay List */}
        <div className="space-y-3">
          {mockEssays.map((essay, index) => (
            <motion.button
              key={essay.id}
              onClick={() => onSelectEssay(essay.id)}
              className="w-full text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
            >
              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(essay.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-foreground line-clamp-2 mb-2">
                      {essay.prompt}
                    </p>
                    <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
                      <span>{essay.wordLimit} words max</span>
                      {essay.lastEdited && (
                        <>
                          <span>·</span>
                          <span>Edited {essay.lastEdited}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <span className={`text-body-sm font-medium ${
                    essay.status === 'complete' ? 'text-primary' :
                    essay.status === 'in-progress' ? 'text-secondary' :
                    'text-muted-foreground'
                  }`}>
                    {getStatusLabel(essay.status)}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </ColleeLayout>
  );
};

export default CollegeDetailScreen;
