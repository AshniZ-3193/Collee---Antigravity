import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

import { getStatusDot } from '@/components/screens/workspace/utils';
import type { College } from '@/components/screens/workspace/types';

interface CollegeNavigatorProps {
  college: College;
  activeEssay: { collegeId: string; essayId: string } | null;
  onSelectEssay: (collegeId: string, essayId: string) => void;
  onBackToSchools: () => void;
}

const statusLabel = (status: string) => {
  if (status === 'complete') return 'Done';
  if (status === 'in-progress') return 'In progress';
  return 'Not started';
};

const statusClass = (status: string) => {
  if (status === 'complete')
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (status === 'in-progress')
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
};

const CollegeNavigator: React.FC<CollegeNavigatorProps> = ({
  college,
  activeEssay,
  onSelectEssay,
  onBackToSchools,
}) => {
  return (
    <aside className="hidden h-full w-72 flex-shrink-0 border-r border-border/60 bg-gradient-to-b from-card via-card to-background md:flex md:flex-col">
      {/* Header */}
      <div className="px-5 pb-4 pt-5">
        <button
          type="button"
          onClick={onBackToSchools}
          className="group mb-4 flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          All schools
        </button>
        <h2 className="font-display text-heading-sm text-foreground leading-tight">
          {college.name}
        </h2>
        <p className="mt-1 text-caption text-muted-foreground tracking-wide">
          {college.essays.length} essay{college.essays.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-border/80 via-border/40 to-transparent" />

      {/* Essay list */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {college.essays.map((essay) => {
          const isActive =
            activeEssay?.collegeId === college.id && activeEssay.essayId === essay.id;
          return (
            <button
              key={essay.id}
              type="button"
              onClick={() => onSelectEssay(college.id, essay.id)}
              className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                isActive
                  ? 'bg-primary/8 shadow-sm ring-1 ring-primary/15'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`line-clamp-2 text-body-sm leading-snug transition-colors ${
                    isActive ? 'font-medium text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                  }`}
                >
                  {essay.title}
                </span>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${statusClass(essay.status)}`}
                >
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${getStatusDot(essay.status)}`} />
                  {statusLabel(essay.status)}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default CollegeNavigator;
