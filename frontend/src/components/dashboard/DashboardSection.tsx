import React, { Suspense, lazy, useMemo } from 'react';
import { m } from 'framer-motion';
import { Plus, FileText, CheckCircle2, Flame, ArrowRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

import DeadlineList from './DeadlineList';
import type { DashboardData } from './types';

const ProgressDonut = lazy(() => import('./ProgressDonut'));

interface DashboardSectionProps {
  data: DashboardData;
  onAddCollege: () => void;
  onOpenEssays: (collegeId: string, essayId?: string) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardSection: React.FC<DashboardSectionProps> = ({ data, onAddCollege, onOpenEssays }) => {
  const percentComplete = Math.round(data.progressFraction * 100);
  const dueSoonCount = data.collegeDeadlines.filter((d) => d.isApproaching).length;
  const remaining = data.totalRequiredEssays - data.completedRequiredEssays;
  const requiredEssays = useMemo(
    () =>
      data.colleges.flatMap((college) =>
        college.essays.filter((essay) => essay.isOptional !== true),
      ),
    [data.colleges],
  );
  const completedCount = requiredEssays.filter((essay) => essay.status === 'complete').length;
  const inProgressCount = requiredEssays.filter((essay) => essay.status === 'in-progress').length;
  const notStartedCount = Math.max(0, requiredEssays.length - completedCount - inProgressCount);

  const donutData = useMemo(
    () => [
      { name: 'Completed', value: completedCount, fill: '#10b981' },
      { name: 'In Progress', value: inProgressCount, fill: 'hsl(var(--primary))' },
      { name: 'Not Started', value: notStartedCount, fill: 'hsl(var(--border))' },
    ],
    [completedCount, inProgressCount, notStartedCount],
  );

  if (!data.hasColleges) {
    return (
      <section className="h-full overflow-y-auto" data-tour="dashboard-overview">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 p-8 pt-24">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-10 text-center shadow-soft"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-display-sm text-foreground">
              Start your journey
            </h1>
            <p className="mt-3 text-body text-muted-foreground">
              Add your first college to begin tracking deadlines, essays, and progress all in one place.
            </p>
            <Button variant="collee" size="lg" className="mt-8" onClick={onAddCollege}>
              <Plus className="mr-2 h-4 w-4" />
              Add Colleges
            </Button>
          </m.div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-full overflow-y-auto" data-tour="dashboard-overview">
      <m.div
        className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting Header */}
        <m.div variants={itemVariants} className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-display-sm text-foreground">
              {getGreeting()}, {data.userName}
            </h1>
            <p className="mt-1 text-body text-muted-foreground">
              {remaining > 0
                ? `${remaining} essay${remaining !== 1 ? 's' : ''} remaining across your colleges`
                : 'All essays completed — great work!'}
            </p>
          </div>
          <Button variant="collee" onClick={onAddCollege}>
            <Plus className="mr-2 h-4 w-4" />
            Add Colleges
          </Button>
        </m.div>

        {/* Stat Cards Row */}
        <m.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Essays */}
          <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{data.totalRequiredEssays}</p>
            <p className="text-body-sm text-muted-foreground">Total Essays</p>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{data.completedRequiredEssays}</p>
            <p className="text-body-sm text-muted-foreground">Completed</p>
          </div>

          {/* Due Soon */}
          <div className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{dueSoonCount}</p>
            <p className="text-body-sm text-muted-foreground">Due Soon</p>
          </div>
        </m.div>

        {/* Overall Progress Section */}
        <m.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-8 rounded-2xl border border-border bg-card p-6"
        >
          <div className="relative h-44 w-44 shrink-0" data-tour="dashboard-progress">
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-full bg-muted" />}>
              <ProgressDonut data={donutData} />
            </Suspense>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-foreground">{percentComplete}%</p>
              <p className="text-caption text-muted-foreground">complete</p>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-heading text-foreground">Overall Progress</h2>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {data.completedRequiredEssays} of {data.totalRequiredEssays} required essays completed
              {dueSoonCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}— {dueSoonCount} deadline{dueSoonCount !== 1 ? 's' : ''} approaching
                </span>
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Completed ({completedCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                In progress ({inProgressCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                Not started ({notStartedCount})
              </span>
            </div>
          </div>
        </m.div>

        {/* College Progress Cards */}
        {data.collegeDeadlines.length > 0 && (
          <m.div variants={itemVariants} className="space-y-4" data-tour="essays-section">
            <h2 className="font-display text-heading text-foreground">Your Colleges</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.collegeDeadlines.map((deadline) => {
                const { requiredCompleted, requiredTotal } = deadline.essayCounts;
                const progress = requiredTotal > 0 ? requiredCompleted / requiredTotal : 0;
                const hasEssay = Boolean(deadline.firstEssayId);

                return (
                  <div
                    key={deadline.collegeId}
                    className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-glow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-heading-sm truncate text-foreground">
                          {deadline.name}
                        </h3>
                        <p
                          className={`mt-0.5 text-body-sm ${
                            deadline.isApproaching
                              ? 'font-medium text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {deadline.deadline}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!hasEssay}
                        className="shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => onOpenEssays(deadline.collegeId, deadline.firstEssayId)}
                      >
                        Open Essays
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-caption text-muted-foreground">
                          {requiredCompleted}/{requiredTotal} essays
                        </p>
                        <p className="text-caption font-medium text-foreground">
                          {Math.round(progress * 100)}%
                        </p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        )}

        {/* Upcoming Deadlines */}
        <m.div variants={itemVariants} className="space-y-4">
          <h2 className="font-display text-heading text-foreground">Upcoming Deadlines</h2>
          <DeadlineList deadlines={data.collegeDeadlines} onOpenEssays={onOpenEssays} />
        </m.div>
      </m.div>
    </section>
  );
};

export default DashboardSection;
