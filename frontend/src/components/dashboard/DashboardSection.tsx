import React, { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getEssaySnapshot, isDeadlineApproaching } from '@/components/screens/workspace/utils';

import DeadlineList from './DeadlineList';
import ProgressRing from './ProgressRing';
import type { DashboardData } from './types';

interface DashboardSectionProps {
  data: DashboardData;
  onAddCollege: () => void;
  onOpenEssays: (collegeId: string, essayId?: string) => void;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ data, onAddCollege, onOpenEssays }) => {
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');

  const calendarDeadlines = useMemo(
    () =>
      data.colleges
        .filter((college) => college.deadline)
        .map((college) => {
          const match = college.deadline?.match(/\d+/);
          return {
            college,
            day: match ? Number.parseInt(match[0], 10) : null,
          };
        }),
    [data.colleges],
  );

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

        {data.hasColleges && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Your colleges</h2>
              <div className="flex items-center rounded-lg bg-muted p-0.5">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`rounded-md p-1.5 ${
                    viewMode === 'cards'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Cards"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`rounded-md p-1.5 ${
                    viewMode === 'calendar'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Calendar"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {viewMode === 'cards' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.colleges.map((college) => {
                  const deadlineApproaching = isDeadlineApproaching(college.deadline);
                  const [essayCount, essayStatus] = getEssaySnapshot(college.essays).split(' • ');
                  return (
                    <div key={college.id} className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="text-lg font-semibold text-foreground">{college.name}</h3>
                      {college.deadline && (
                        <p
                          className={`mt-1 flex items-center gap-2 text-sm ${
                            deadlineApproaching
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          {deadlineApproaching ? `Due soon · ${college.deadline}` : `Due ${college.deadline}`}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {essayCount} • {essayStatus}
                      </p>
                      <Button
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={() => onOpenEssays(college.id, college.essays[0]?.id)}
                      >
                        Open Essays
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, idx) => {
                    const day = idx - 3;
                    const isValidDay = day >= 1 && day <= 31;
                    const onDay = calendarDeadlines.filter((item) => item.day === day);
                    return (
                      <div
                        key={idx}
                        className={`min-h-[72px] rounded-lg border p-1.5 text-xs ${
                          isValidDay
                            ? onDay.length > 0
                              ? 'border-primary/30 bg-primary/5'
                              : 'border-border bg-background'
                            : 'border-transparent'
                        }`}
                      >
                        {isValidDay && (
                          <>
                            <p className="font-medium text-muted-foreground">{day}</p>
                            <div className="mt-1 space-y-1">
                              {onDay.slice(0, 2).map((item) => (
                                <button
                                  key={item.college.id}
                                  onClick={() => onOpenEssays(item.college.id, item.college.essays[0]?.id)}
                                  className="block w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] text-primary"
                                  title={item.college.name}
                                >
                                  {item.college.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardSection;
