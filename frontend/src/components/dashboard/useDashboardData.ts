import { useMemo } from 'react';

import type { College } from '@/components/screens/workspace/types';
import { isDeadlineApproaching } from '@/components/screens/workspace/utils';

import type { CollegeDeadline, DashboardData } from './types';

const MONTHS: Record<string, number> = {
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

const deadlineSortValue = (deadline?: string): number => {
  if (!deadline) return Number.POSITIVE_INFINITY;

  const [monthToken, dayToken] = deadline.split(' ');
  const month = MONTHS[monthToken ?? ''];
  const day = Number.parseInt(dayToken ?? '', 10);
  if (month === undefined || !Number.isFinite(day)) return Number.POSITIVE_INFINITY;

  const now = new Date();
  const due = new Date(now.getFullYear(), month, day);
  if (due < now) {
    due.setFullYear(due.getFullYear() + 1);
  }

  return due.getTime();
};

const toCollegeDeadline = (college: College): CollegeDeadline | null => {
  if (!college.deadline) return null;

  const requiredEssays = college.essays.filter((essay) => essay.isOptional !== true);
  return {
    collegeId: college.id,
    name: college.name,
    deadline: college.deadline,
    isApproaching: isDeadlineApproaching(college.deadline),
    essayCounts: {
      total: college.essays.length,
      completed: college.essays.filter((essay) => essay.status === 'complete').length,
      requiredTotal: requiredEssays.length,
      requiredCompleted: requiredEssays.filter((essay) => essay.status === 'complete').length,
    },
    firstEssayId: college.essays[0]?.id,
  };
};

export const useDashboardData = (colleges: College[], userName?: string): DashboardData => {
  return useMemo(() => {
    const requiredEssays = colleges.flatMap((college) =>
      college.essays.filter((essay) => essay.isOptional !== true),
    );
    const completedRequiredEssays = requiredEssays.filter(
      (essay) => essay.status === 'complete',
    ).length;
    const totalRequiredEssays = requiredEssays.length;

    const progressFraction =
      totalRequiredEssays > 0 ? completedRequiredEssays / totalRequiredEssays : 0;

    const collegeDeadlines = colleges
      .map(toCollegeDeadline)
      .filter((deadline): deadline is CollegeDeadline => deadline !== null)
      .sort((a, b) => deadlineSortValue(a.deadline) - deadlineSortValue(b.deadline));

    return {
      userName: userName || 'there',
      totalRequiredEssays,
      completedRequiredEssays,
      progressFraction,
      collegeDeadlines,
      colleges,
      hasColleges: colleges.length > 0,
    };
  }, [colleges, userName]);
};
