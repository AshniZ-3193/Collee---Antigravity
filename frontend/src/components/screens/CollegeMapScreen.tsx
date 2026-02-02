import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, ExternalLink, Calendar } from 'lucide-react';

interface College {
  id: string;
  name: string;
  applicationType?: string;
  deadline?: string;
  essaySummary: string;
  isDeadlineSoon?: boolean;
}

interface CollegeMapScreenProps {
  onAddCollege: () => void;
  onOpenEssays: (collegeId: string) => void;
  onViewPrompts?: (collegeId: string) => void;
}

const mockColleges: College[] = [
  { 
    id: '1', 
    name: 'Stanford University', 
    applicationType: 'Common App',
    deadline: 'Jan 2',
    essaySummary: '3 essays • 1 in progress',
    isDeadlineSoon: true
  },
  { 
    id: '2', 
    name: 'MIT', 
    applicationType: 'Common App',
    deadline: 'Jan 5',
    essaySummary: '2 essays • not started yet'
  },
  { 
    id: '3', 
    name: 'Yale University', 
    applicationType: 'Coalition App',
    deadline: 'Jan 2',
    essaySummary: '4 essays • 2 in progress',
    isDeadlineSoon: true
  },
  { 
    id: '4', 
    name: 'UC Berkeley', 
    applicationType: 'UC Application',
    deadline: 'Nov 30',
    essaySummary: 'All essays drafted'
  },
  { 
    id: '5', 
    name: 'Northwestern University', 
    applicationType: 'Common App',
    deadline: 'Jan 15',
    essaySummary: '2 essays • 1 in progress'
  },
];

const CollegeMapScreen: React.FC<CollegeMapScreenProps> = ({
  onAddCollege,
  onOpenEssays,
  onViewPrompts,
}) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-12 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Your College Map</h1>
            <p className="text-body text-muted-foreground">
              Here's where you are — let's keep going.
            </p>
          </motion.div>

          {/* College Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {mockColleges.map((college, index) => (
              <motion.div
                key={college.id}
                className="group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
              >
                <div className="h-full p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                  {/* College Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {college.name}
                  </h3>

                  {/* Application Type & Deadline */}
                  <div className="flex items-center gap-2 text-body-sm text-muted-foreground mb-3">
                    {college.applicationType && (
                      <span>{college.applicationType}</span>
                    )}
                    {college.applicationType && college.deadline && (
                      <span className="text-border">•</span>
                    )}
                    {college.deadline && (
                      <span className={`flex items-center gap-1.5 ${college.isDeadlineSoon ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {college.isDeadlineSoon ? (
                          <>
                            <div className="relative flex items-center justify-center">
                              <Calendar className="w-3.5 h-3.5" />
                              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            </div>
                            <span className="font-medium">Due soon · {college.deadline}</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Due {college.deadline}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Essay Summary */}
                  <p className="text-body text-muted-foreground mb-5">
                    {college.essaySummary}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="collee"
                      size="sm"
                      onClick={() => onOpenEssays(college.id)}
                      className="flex-1"
                    >
                      Open essays
                    </Button>
                    {onViewPrompts && (
                      <button
                        onClick={() => onViewPrompts(college.id)}
                        className="flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground transition-colors px-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Prompts
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add College Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <Button
              variant="collee-outline"
              size="collee"
              onClick={onAddCollege}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add a college
            </Button>
          </motion.div>

          {/* Supportive footer message */}
          <motion.p
            className="text-center text-body-sm text-muted-foreground/60 pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Take your time. You're making progress.
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default CollegeMapScreen;
