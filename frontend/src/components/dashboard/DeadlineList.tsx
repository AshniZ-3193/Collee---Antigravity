import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { CollegeDeadline } from './types';

interface DeadlineListProps {
  deadlines: CollegeDeadline[];
  onOpenEssays: (collegeId: string, firstEssayId?: string) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const DeadlineList: React.FC<DeadlineListProps> = ({ deadlines, onOpenEssays }) => {
  if (deadlines.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted-foreground"
        data-tour="dashboard-deadlines"
      >
        No deadlines yet. Add a college to start planning.
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      data-tour="dashboard-deadlines"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {deadlines.map((deadline) => {
        const { requiredCompleted, requiredTotal } = deadline.essayCounts;
        const progress = requiredTotal > 0 ? requiredCompleted / requiredTotal : 0;
        const hasEssay = Boolean(deadline.firstEssayId);
        const isComplete = requiredTotal > 0 && requiredCompleted >= requiredTotal;

        return (
          <motion.div
            key={deadline.collegeId}
            variants={itemVariants}
            className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-soft ${
              deadline.isApproaching
                ? 'border-l-4 border-l-amber-400 border-t-border border-r-border border-b-border'
                : 'border-border'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">{deadline.name}</p>
                {/* Status badge */}
                {deadline.isApproaching && !isComplete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    <Flame className="h-3 w-3" />
                    Due Soon
                  </span>
                ) : isComplete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    On Track
                  </span>
                )}
              </div>
              <p
                className={`mt-0.5 text-body-sm ${
                  deadline.isApproaching ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                }`}
              >
                {deadline.deadline}
              </p>

              {/* Progress bar */}
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {requiredCompleted}/{requiredTotal}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasEssay}
              onClick={() => onOpenEssays(deadline.collegeId, deadline.firstEssayId)}
            >
              {hasEssay ? 'Open Essays' : 'No Essays'}
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default DeadlineList;
