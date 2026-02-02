import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Check, Clock, Circle } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface Essay {
  id: string;
  collegeName: string;
  promptPreview: string;
  wordCount: number;
  wordLimit: number;
  status: 'not-started' | 'in-progress' | 'complete';
  lastEdited?: string;
}

interface AllEssaysScreenProps {
  onBack: () => void;
  onSelectEssay: (essayId: string) => void;
}

const mockEssays: Essay[] = [
  {
    id: '1',
    collegeName: 'Stanford University',
    promptPreview: 'Describe an experience where you had to make a difficult choice...',
    wordCount: 542,
    wordLimit: 650,
    status: 'complete',
    lastEdited: '2 days ago',
  },
  {
    id: '2',
    collegeName: 'Stanford University',
    promptPreview: 'Tell us about something that has been meaningful to your identity...',
    wordCount: 280,
    wordLimit: 350,
    status: 'in-progress',
    lastEdited: '1 hour ago',
  },
  {
    id: '3',
    collegeName: 'MIT',
    promptPreview: 'Describe the world you come from...',
    wordCount: 0,
    wordLimit: 250,
    status: 'not-started',
  },
  {
    id: '4',
    collegeName: 'Yale University',
    promptPreview: 'What is it about Yale that has led you to apply?',
    wordCount: 245,
    wordLimit: 250,
    status: 'complete',
    lastEdited: '3 days ago',
  },
  {
    id: '5',
    collegeName: 'Yale University',
    promptPreview: 'Reflect on a time when you questioned or challenged a belief...',
    wordCount: 450,
    wordLimit: 650,
    status: 'in-progress',
    lastEdited: '5 hours ago',
  },
  {
    id: '6',
    collegeName: 'UC Berkeley',
    promptPreview: 'Describe how you have taken advantage of a significant educational opportunity...',
    wordCount: 350,
    wordLimit: 350,
    status: 'complete',
    lastEdited: '1 week ago',
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

const AllEssaysScreen: React.FC<AllEssaysScreenProps> = ({
  onBack,
  onSelectEssay,
}) => {
  const completedCount = mockEssays.filter(e => e.status === 'complete').length;
  const inProgressCount = mockEssays.filter(e => e.status === 'in-progress').length;

  // Group essays by status
  const groupedEssays = {
    'in-progress': mockEssays.filter(e => e.status === 'in-progress'),
    'not-started': mockEssays.filter(e => e.status === 'not-started'),
    'complete': mockEssays.filter(e => e.status === 'complete'),
  };

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

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">All essays</h1>
            <p className="text-body text-muted-foreground">
              {completedCount} complete · {inProgressCount} in progress · {mockEssays.length} total
            </p>
          </div>
        </motion.div>

        {/* In Progress Section */}
        {groupedEssays['in-progress'].length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-body-sm font-medium text-secondary mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              In progress
            </h3>
            <div className="space-y-2">
              {groupedEssays['in-progress'].map((essay) => (
                <EssayCard key={essay.id} essay={essay} onSelect={onSelectEssay} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Not Started Section */}
        {groupedEssays['not-started'].length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-body-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Circle className="w-4 h-4" />
              Not started
            </h3>
            <div className="space-y-2">
              {groupedEssays['not-started'].map((essay) => (
                <EssayCard key={essay.id} essay={essay} onSelect={onSelectEssay} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Complete Section */}
        {groupedEssays['complete'].length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-body-sm font-medium text-primary mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Complete
            </h3>
            <div className="space-y-2">
              {groupedEssays['complete'].map((essay) => (
                <EssayCard key={essay.id} essay={essay} onSelect={onSelectEssay} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </ColleeLayout>
  );
};

const EssayCard: React.FC<{ essay: Essay; onSelect: (id: string) => void }> = ({ essay, onSelect }) => (
  <button
    onClick={() => onSelect(essay.id)}
    className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
  >
    <div className="flex items-start gap-3">
      <div className="mt-1">{getStatusIcon(essay.status)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-secondary mb-1">{essay.collegeName}</p>
        <p className="text-body text-foreground line-clamp-1 mb-2">
          {essay.promptPreview}
        </p>
        <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
          <span>{essay.wordCount}/{essay.wordLimit} words</span>
          {essay.lastEdited && (
            <>
              <span>·</span>
              <span>Edited {essay.lastEdited}</span>
            </>
          )}
        </div>
      </div>
    </div>
  </button>
);

export default AllEssaysScreen;
