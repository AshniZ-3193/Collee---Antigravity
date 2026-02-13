import type { College } from '@/components/screens/workspace/types';

export type DashboardSection = 'dashboard' | 'essays' | 'profile' | 'settings';

export interface CollegeDeadline {
  collegeId: string;
  name: string;
  deadline: string;
  isApproaching: boolean;
  essayCounts: {
    total: number;
    completed: number;
    requiredTotal: number;
    requiredCompleted: number;
  };
  firstEssayId?: string;
}

export interface DashboardData {
  userName: string;
  totalRequiredEssays: number;
  completedRequiredEssays: number;
  progressFraction: number;
  collegeDeadlines: CollegeDeadline[];
  colleges: College[];
  hasColleges: boolean;
}
