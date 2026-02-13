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
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CheckCircle2, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { CollegeDeadline } from './types';

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

const DEADLINE_PATTERNS = ['MMM d, yyyy', 'MMMM d, yyyy', 'MMM d', 'MMMM d'];

const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

const parseDeadlineDate = (deadline: string): Date | null => {
  const now = startOfDay(new Date());
  const trimmedDeadline = deadline.trim();

  for (const pattern of DEADLINE_PATTERNS) {
    const parsed = parse(trimmedDeadline, pattern, now);
    if (!isValid(parsed)) continue;

    const includesYear = pattern.includes('y');
    let resolved = startOfDay(parsed);

    if (!includesYear) {
      resolved = startOfDay(new Date(now.getFullYear(), parsed.getMonth(), parsed.getDate()));
      if (resolved < now) {
        resolved = addYears(resolved, 1);
      }
    }

    return resolved;
  }

  return null;
};

const DeadlineList: React.FC<DeadlineListProps> = ({ deadlines, onOpenEssays }) => {
  const parsedDeadlines = useMemo<CalendarDeadline[]>(() => {
    return deadlines
      .map((deadline) => {
        const date = parseDeadlineDate(deadline.deadline);
        if (!date) return null;

        const { requiredCompleted, requiredTotal } = deadline.essayCounts;
        const hasEssay = Boolean(deadline.firstEssayId);
        const daysUntil = Math.ceil((date.getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...deadline,
          date,
          dateKey: toDateKey(date),
          hasEssay,
          isComplete: requiredTotal > 0 && requiredCompleted >= requiredTotal,
          progress: requiredTotal > 0 ? requiredCompleted / requiredTotal : 0,
          isApproachingResolved: daysUntil <= 14 && daysUntil >= 0,
        };
      })
      .filter((deadline): deadline is CalendarDeadline => deadline !== null)
      .sort((a, b) => {
        const timeDifference = a.date.getTime() - b.date.getTime();
        if (timeDifference !== 0) return timeDifference;
        return a.name.localeCompare(b.name);
      });
  }, [deadlines]);

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, CalendarDeadline[]>();

    parsedDeadlines.forEach((deadline) => {
      const existing = map.get(deadline.dateKey) ?? [];
      existing.push(deadline);
      map.set(deadline.dateKey, existing);
    });

    return map;
  }, [parsedDeadlines]);

  const firstDeadlineDate = parsedDeadlines[0]?.date ?? startOfDay(new Date());
  const [month, setMonth] = useState<Date>(() => startOfMonth(firstDeadlineDate));
  const [selectedDate, setSelectedDate] = useState<Date>(() => firstDeadlineDate);

  useEffect(() => {
    setMonth((currentMonth) =>
      isSameMonth(currentMonth, firstDeadlineDate) ? currentMonth : startOfMonth(firstDeadlineDate),
    );

    setSelectedDate((currentSelectedDate) => {
      if (!currentSelectedDate) return firstDeadlineDate;
      const selectedKey = toDateKey(currentSelectedDate);
      if (deadlinesByDate.has(selectedKey)) return currentSelectedDate;
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

  const selectedDayDeadlines = useMemo(() => {
    return deadlinesByDate.get(toDateKey(selectedDate)) ?? [];
  }, [deadlinesByDate, selectedDate]);

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

  if (parsedDeadlines.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-border p-8 text-center text-body-sm text-muted-foreground"
        data-tour="dashboard-deadlines"
      >
        Deadlines are available, but some date formats could not be mapped to the calendar yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5" data-tour="dashboard-deadlines">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" onClick={() => setMonth((currentMonth) => subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-display text-heading-sm text-foreground">{format(month, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="icon" onClick={() => setMonth((currentMonth) => addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-caption uppercase tracking-wide text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
          <div key={weekday} className="py-1">
            {weekday}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayKey = toDateKey(day);
          const dayDeadlines = deadlinesByDate.get(dayKey) ?? [];
          const dayIsSelected = isSameDay(day, selectedDate);
          const hasApproachingDeadline = dayDeadlines.some((deadline) => deadline.isApproachingResolved && !deadline.isComplete);

          return (
            <button
              type="button"
              key={dayKey}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'min-h-[84px] rounded-xl border p-2 text-left transition-colors',
                isSameMonth(day, month) ? 'border-border bg-background hover:bg-muted/40' : 'border-transparent bg-muted/20 text-muted-foreground/60',
                dayDeadlines.length > 0 && 'border-primary/30 bg-primary/5',
                dayIsSelected && 'ring-2 ring-primary/40',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'text-caption font-medium',
                    dayDeadlines.length > 0 ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayDeadlines.length > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {dayDeadlines.length}
                  </span>
                )}
              </div>
              {dayDeadlines.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1">
                  {hasApproachingDeadline ? <Flame className="h-3 w-3 text-amber-500" /> : null}
                  {dayDeadlines.slice(0, 2).map((deadline) => (
                    <span
                      key={deadline.collegeId}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        deadline.isComplete ? 'bg-emerald-500' : deadline.isApproachingResolved ? 'bg-amber-500' : 'bg-primary',
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-body-sm font-medium text-foreground">
          {selectedDayDeadlines.length > 0
            ? `Deadlines on ${format(selectedDate, 'MMM d, yyyy')}`
            : `No deadlines on ${format(selectedDate, 'MMM d, yyyy')}`}
        </p>

        {selectedDayDeadlines.map((deadline) => {
          const { requiredCompleted, requiredTotal } = deadline.essayCounts;

          return (
            <div
              key={deadline.collegeId}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
                  deadline.isApproachingResolved && !deadline.isComplete ? 'border-amber-200/80 bg-amber-500/5 dark:border-amber-800/40' : 'border-border bg-background',
                )}
              >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{deadline.name}</p>
                  {deadline.isApproachingResolved && !deadline.isComplete ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <Flame className="h-3 w-3" />
                      Due Soon
                    </span>
                  ) : deadline.isComplete ? (
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
                <p className="mt-0.5 text-caption text-muted-foreground">{deadline.deadline}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        deadline.isComplete ? 'bg-emerald-500' : 'bg-primary',
                      )}
                      style={{ width: `${Math.round(deadline.progress * 100)}%` }}
                    />
                  </div>
                  <span className="text-caption text-muted-foreground">
                    {requiredCompleted}/{requiredTotal}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!deadline.hasEssay}
                onClick={() => onOpenEssays(deadline.collegeId, deadline.firstEssayId)}
              >
                {deadline.hasEssay ? 'Open Essays' : 'No Essays'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeadlineList;
