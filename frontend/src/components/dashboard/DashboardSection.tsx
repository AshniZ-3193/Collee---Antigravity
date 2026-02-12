import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import DeadlineList from './DeadlineList';
import ProgressRing from './ProgressRing';
import type { DashboardData } from './types';

interface DashboardSectionProps {
  data: DashboardData;
  onAddCollege: () => void;
  onOpenEssays: (collegeId: string, essayId?: string) => void;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ data, onAddCollege, onOpenEssays }) => {
  return (
    <section className="h-full overflow-y-auto" data-tour="dashboard-overview">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Track progress and jump back into writing.</p>
          </div>
          <Button variant="collee" onClick={onAddCollege}>
            <Plus className="mr-2 h-4 w-4" />
            Add Colleges
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Required essay progress</p>
              <p className="text-lg font-medium text-foreground">
                {Math.round(data.progressFraction * 100)}% complete
              </p>
            </div>
            <ProgressRing
              progress={data.progressFraction}
              completedCount={data.completedRequiredEssays}
              totalCount={data.totalRequiredEssays}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Upcoming deadlines</h2>
          <DeadlineList deadlines={data.collegeDeadlines} onOpenEssays={onOpenEssays} />
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
