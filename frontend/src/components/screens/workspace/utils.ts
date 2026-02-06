import type { Essay } from './types';

export const getEssaySnapshot = (essays: Essay[]): string => {
  const inProgress = essays.filter(e => e.status === 'in-progress').length;
  const complete = essays.filter(e => e.status === 'complete').length;
  const notStarted = essays.filter(e => e.status === 'not-started').length;
  const total = essays.length;

  if (complete === total) return 'All essays drafted';
  if (notStarted === total) return `${total} essays • not started yet`;
  if (inProgress > 0) return `${total} essays • ${inProgress} in progress`;
  return `${total} essays • ${complete} complete`;
};

export const getStatusDot = (status: Essay['status']) => {
  switch (status) {
    case 'complete':
      return 'bg-emerald-500';
    case 'in-progress':
      return 'bg-primary';
    default:
      return 'bg-muted-foreground/30';
  }
};

export const isDeadlineApproaching = (deadline?: string): boolean => {
  if (!deadline) return false;
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const parts = deadline.split(' ');
  if (parts.length !== 2) return false;

  const month = months[parts[0]];
  const day = parseInt(parts[1], 10);
  if (month === undefined || Number.isNaN(day)) return false;

  const currentYear = new Date().getFullYear();
  const deadlineDate = new Date(currentYear, month, day);
  const now = new Date();

  if (deadlineDate < now) {
    deadlineDate.setFullYear(currentYear + 1);
  }

  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 14 && daysUntil >= 0;
};
