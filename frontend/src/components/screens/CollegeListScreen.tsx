import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap, FileText, Calendar } from 'lucide-react';

interface College {
  id: string;
  name: string;
  deadline?: string;
  essaySummary: string;
  isDeadlineSoon?: boolean;
}

interface CollegeListScreenProps {
  onAddCollege: () => void;
  onSelectCollege: (collegeId: string) => void;
  onViewAllEssays: () => void;
}

const mockColleges: College[] = [
  { id: '1', name: 'Stanford University', deadline: 'Jan 2', essaySummary: '3 essays • 1 in progress', isDeadlineSoon: true },
  { id: '2', name: 'MIT', deadline: 'Jan 5', essaySummary: '2 essays • not started yet' },
  { id: '3', name: 'Yale University', deadline: 'Jan 2', essaySummary: '4 essays • 2 in progress', isDeadlineSoon: true },
  { id: '4', name: 'UC Berkeley', deadline: 'Nov 30', essaySummary: 'All essays complete' },
  { id: '5', name: 'Northwestern University', deadline: 'Jan 15', essaySummary: '2 essays • 1 in progress' },
];

const CollegeListScreen: React.FC<CollegeListScreenProps> = ({
  onAddCollege,
  onSelectCollege,
  onViewAllEssays,
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
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Your Colleges</h1>
            <p className="text-body text-muted-foreground">
              Here's where you are. Let's keep going.
            </p>
          </motion.div>

          {/* View All Essays Link */}
          <motion.button
            onClick={onViewAllEssays}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-secondary/10 hover:bg-secondary/15 transition-colors mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-secondary" />
              <span className="text-body font-medium text-foreground">View all essays</span>
            </div>
            <span className="text-body-sm text-muted-foreground">→</span>
          </motion.button>

          {/* College Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {mockColleges.map((college, index) => (
              <motion.div
                key={college.id}
                className="group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05, duration: 0.5 }}
              >
                <div className="h-full p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
                  {/* College Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {college.name}
                  </h3>

                  {/* Deadline */}
                  {college.deadline && (
                    <div className={`flex items-center gap-2 mb-3 ${college.isDeadlineSoon ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                      {college.isDeadlineSoon ? (
                        <>
                          <div className="relative flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                          </div>
                          <span className="text-body-sm font-medium">
                            Due soon · {college.deadline}
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 text-muted-foreground/60" />
                          <span className="text-body-sm">
                            Due {college.deadline}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Essay Summary */}
                  <p className="text-body text-muted-foreground mb-5">
                    {college.essaySummary}
                  </p>

                  {/* Action Button */}
                  <Button
                    variant="collee"
                    size="sm"
                    onClick={() => onSelectCollege(college.id)}
                    className="w-full"
                  >
                    Open essays
                  </Button>
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
        </div>
      </main>
    </div>
  );
};

export default CollegeListScreen;