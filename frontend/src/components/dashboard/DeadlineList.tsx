import React from 'react';

import { Button } from '@/components/ui/button';

import type { CollegeDeadline } from './types';

interface DeadlineListProps {
  deadlines: CollegeDeadline[];
  onOpenEssays: (collegeId: string, firstEssayId?: string) => void;
}

const DeadlineList: React.FC<DeadlineListProps> = ({ deadlines, onOpenEssays }) => {
  if (deadlines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground" data-tour="dashboard-deadlines">
        No deadlines yet. Add a college to start planning.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-tour="dashboard-deadlines">
      {deadlines.map((deadline) => {
        const requiredSummary = `${deadline.essayCounts.requiredCompleted}/${deadline.essayCounts.requiredTotal} required complete`;
        return (
          <div
            key={deadline.collegeId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div>
              <p className="font-medium text-foreground">{deadline.name}</p>
              <p
                className={`text-sm ${
                  deadline.isApproaching ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                }`}
              >
                {deadline.deadline}
              </p>
              <p className="text-xs text-muted-foreground">{requiredSummary}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEssays(deadline.collegeId, deadline.firstEssayId)}
            >
              Open Essays
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default DeadlineList;
