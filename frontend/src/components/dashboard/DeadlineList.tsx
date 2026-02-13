import React, { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Flame, ArrowRight, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { CollegeDeadline } from './types';

/* ─── Types ────────────────────────────────────────────────── */

interface DeadlineListProps {
  deadlines: CollegeDeadline[];
  onOpenEssays: (collegeId: string, firstEssayId?: string) => void;
}

interface CalendarDeadline extends CollegeDeadline {
  date: Date;
  dateKey: string;
  isComplete: boolean;
  progress: number;
  hasEssay: boolean;
  isApproachingResolved: boolean;
}

/* ─── Constants ────────────────────────────────────────────── */

const DEADLINE_PATTERNS = ['MMM d, yyyy', 'MMMM d, yyyy', 'MMM d', 'MMMM d'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/* ─── Helpers ──────────────────────────────────────────────── */

const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const parseDeadlineDate = (deadline: string): Date | null => {
  const now = startOfDay(new Date());
  const trimmed = deadline.trim();

  for (const pattern of DEADLINE_PATTERNS) {
    const parsed = parse(trimmed, pattern, now);
    if (!isValid(parsed)) continue;

    let resolved = startOfDay(parsed);
    if (!pattern.includes('y')) {
      resolved = startOfDay(new Date(now.getFullYear(), parsed.getMonth(), parsed.getDate()));
      if (resolved < now) resolved = addYears(resolved, 1);
    }
    return resolved;
  }
  return null;
};

/* ─── Component ────────────────────────────────────────────── */

const DeadlineList: React.FC<DeadlineListProps> = ({ deadlines, onOpenEssays }) => {
  /* ── Data processing ── */
  const parsedDeadlines = useMemo<CalendarDeadline[]>(() => {
    return deadlines
      .map((dl) => {
        const date = parseDeadlineDate(dl.deadline);
        if (!date) return null;
        const { requiredCompleted, requiredTotal } = dl.essayCounts;
        const daysUntil = Math.ceil(
          (date.getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          ...dl,
          date,
          dateKey: toDateKey(date),
          hasEssay: Boolean(dl.firstEssayId),
          isComplete: requiredTotal > 0 && requiredCompleted >= requiredTotal,
          progress: requiredTotal > 0 ? requiredCompleted / requiredTotal : 0,
          isApproachingResolved: daysUntil <= 14 && daysUntil >= 0,
        };
      })
      .filter((d): d is CalendarDeadline => d !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime() || a.name.localeCompare(b.name));
  }, [deadlines]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, CalendarDeadline[]>();
    parsedDeadlines.forEach((dl) => {
      const existing = map.get(dl.dateKey) ?? [];
      existing.push(dl);
      map.set(dl.dateKey, existing);
    });
    return map;
  }, [parsedDeadlines]);

  const firstDeadlineDate = parsedDeadlines[0]?.date ?? startOfDay(new Date());
  const [month, setMonth] = useState<Date>(() => startOfMonth(firstDeadlineDate));
  const [selectedDate, setSelectedDate] = useState<Date>(() => firstDeadlineDate);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setMonth((cur) =>
      isSameMonth(cur, firstDeadlineDate) ? cur : startOfMonth(firstDeadlineDate),
    );
    setSelectedDate((cur) => {
      if (!cur) return firstDeadlineDate;
      if (deadlinesByDate.has(toDateKey(cur))) return cur;
      return firstDeadlineDate;
    });
  }, [deadlinesByDate, firstDeadlineDate]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const selectedDayDeadlines = useMemo(
    () => deadlinesByDate.get(toDateKey(selectedDate)) ?? [],
    [deadlinesByDate, selectedDate],
  );

  /* ── Navigation ── */
  const goToPrevMonth = () => {
    setDirection(-1);
    setMonth((cur) => subMonths(cur, 1));
  };
  const goToNextMonth = () => {
    setDirection(1);
    setMonth((cur) => addMonths(cur, 1));
  };
  const goToToday = () => {
    const today = startOfMonth(new Date());
    setDirection(today > month ? 1 : today < month ? -1 : 0);
    setMonth(today);
  };

  /* ── Empty states ── */
  if (deadlines.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-14 text-center"
        data-tour="dashboard-deadlines"
      >
        <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/25" />
        <p className="font-display text-heading-sm text-muted-foreground/40">No deadlines yet</p>
        <p className="mt-1.5 text-caption text-muted-foreground/35">
          Add a college to start planning
        </p>
      </div>
    );
  }

  if (parsedDeadlines.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-14 text-center"
        data-tour="dashboard-deadlines"
      >
        <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/25" />
        <p className="font-display text-heading-sm text-muted-foreground/40">
          Calendar unavailable
        </p>
        <p className="mt-1.5 text-caption text-muted-foreground/35">
          Some deadline formats couldn&apos;t be mapped
        </p>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-soft"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 40% at 50% 0%, hsl(265 65% 52% / 0.025), transparent)',
      }}
      data-tour="dashboard-deadlines"
    >
      {/* ── Month Navigation ── */}
      <div className="flex items-center justify-between px-4 pb-1 pt-4 md:px-6 md:pt-5">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-heading-sm tracking-tight text-foreground">
            {format(month, 'MMMM')}
          </h3>
          <span className="text-body-sm text-muted-foreground/60">{format(month, 'yyyy')}</span>
          {!isSameMonth(month, new Date()) && (
            <button
              type="button"
              onClick={goToToday}
              className="ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary"
            >
              Today
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={goToNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Weekday Labels ── */}
      <div className="grid grid-cols-7 px-3 md:px-5">
        {WEEKDAYS.map((label, i) => (
          <div
            key={i}
            className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={format(month, 'yyyy-MM')}
          initial={{ opacity: 0, x: direction * 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -20 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] as const }}
          className="grid grid-cols-7 gap-1 px-3 pb-4 md:px-5 md:pb-5"
        >
          {calendarDays.map((day) => {
            const dayKey = toDateKey(day);
            const dayDeadlines = deadlinesByDate.get(dayKey) ?? [];
            const inCurrentMonth = isSameMonth(day, month);
            const dayIsSelected = isSameDay(day, selectedDate);
            const dayIsToday = isToday(day);
            const hasDeadlines = dayDeadlines.length > 0;
            const hasApproaching = dayDeadlines.some(
              (d) => d.isApproachingResolved && !d.isComplete,
            );

            return (
              <button
                type="button"
                key={dayKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'group relative flex min-h-[72px] flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-2.5 transition-all duration-200',
                  inCurrentMonth
                    ? 'text-foreground hover:bg-muted/30'
                    : 'text-muted-foreground/30 hover:bg-muted/15',
                  hasDeadlines && inCurrentMonth && !hasApproaching && 'bg-primary/[0.03]',
                  hasApproaching && inCurrentMonth && 'bg-amber-500/[0.04]',
                  dayIsSelected && 'bg-primary/[0.06] hover:bg-primary/[0.08]',
                )}
              >
                {/* Day Number */}
                <span
                  className={cn(
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium transition-all duration-200 md:h-8 md:w-8 md:text-sm',
                    dayIsSelected &&
                      'bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_hsl(265_65%_52%/0.4)]',
                    dayIsToday &&
                      !dayIsSelected &&
                      'bg-primary/[0.06] font-semibold text-primary ring-[1.5px] ring-primary/30',
                    !dayIsSelected &&
                      !dayIsToday &&
                      inCurrentMonth &&
                      hasDeadlines &&
                      'font-semibold text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>

                {/* Deadline Indicators */}
                {hasDeadlines && inCurrentMonth && (
                  <div className="flex items-center gap-[3px]">
                    {dayDeadlines.slice(0, 3).map((dl) => (
                      <span
                        key={dl.collegeId}
                        className={cn(
                          'h-[5px] w-[5px] rounded-full transition-colors',
                          dl.isComplete
                            ? 'bg-emerald-500'
                            : dl.isApproachingResolved
                              ? 'bg-amber-500 animate-pulse-gentle'
                              : 'bg-primary/60',
                        )}
                      />
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="text-[9px] font-semibold text-muted-foreground/50">
                        +{dayDeadlines.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* ── Separator ── */}
      <div className="mx-8 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent md:mx-10" />

      {/* ── Selected Date Detail Panel ── */}
      <div className="px-4 pb-4 pt-4 md:px-6 md:pb-5">
        <p className="mb-3 text-body-sm font-medium text-foreground">
          {format(selectedDate, 'EEEE, MMM d')}
        </p>

        <AnimatePresence mode="wait">
          {selectedDayDeadlines.length > 0 ? (
            <motion.div
              key={toDateKey(selectedDate) + '-deadlines'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className="space-y-2.5"
            >
              {selectedDayDeadlines.map((dl) => {
                const { requiredCompleted, requiredTotal } = dl.essayCounts;
                const isUrgent = dl.isApproachingResolved && !dl.isComplete;
                const accentGradient = dl.isComplete
                  ? 'from-emerald-500 to-emerald-400/40'
                  : isUrgent
                    ? 'from-amber-500 to-amber-400/40'
                    : 'from-primary to-primary/40';
                const barColor = dl.isComplete
                  ? 'bg-emerald-500'
                  : isUrgent
                    ? 'bg-amber-500'
                    : 'bg-primary';

                return (
                  <div
                    key={dl.collegeId}
                    className={cn(
                      'group/card relative overflow-hidden rounded-xl border p-3.5 pl-5 transition-all duration-200 hover:shadow-soft',
                      isUrgent
                        ? 'border-amber-200/60 bg-amber-500/[0.02] dark:border-amber-800/30'
                        : 'border-border/50 bg-background/60 hover:border-primary/20',
                    )}
                  >
                    {/* Left accent stripe */}
                    <div
                      className={cn(
                        'absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-gradient-to-b',
                        accentGradient,
                      )}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-display text-[15px] font-semibold leading-tight text-foreground">
                            {dl.name}
                          </p>
                          {isUrgent ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                              <Flame className="h-2.5 w-2.5" />
                              Due Soon
                            </span>
                          ) : dl.isComplete ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Done
                            </span>
                          ) : null}
                        </div>

                        {/* Progress */}
                        <div className="mt-2.5 flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                            <motion.div
                              className={cn('h-full rounded-full', barColor)}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round(dl.progress * 100)}%` }}
                              transition={{
                                duration: 0.6,
                                ease: [0.4, 0, 0.2, 1] as const,
                                delay: 0.1,
                              }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                            {requiredCompleted}/{requiredTotal}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!dl.hasEssay}
                        className="shrink-0 gap-1 text-[12px] text-primary/70 opacity-0 transition-all group-hover/card:opacity-100"
                        onClick={() => onOpenEssays(dl.collegeId, dl.firstEssayId)}
                      >
                        Essays
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key={toDateKey(selectedDate) + '-empty'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-6"
            >
              <p className="text-caption text-muted-foreground/40">No deadlines on this date</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeadlineList;
