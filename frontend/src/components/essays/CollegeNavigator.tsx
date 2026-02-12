import React from 'react';
import { ArrowLeft } from 'lucide-react';

import { getStatusDot } from '@/components/screens/workspace/utils';
import type { College } from '@/components/screens/workspace/types';

interface CollegeNavigatorProps {
  college: College;
  activeEssay: { collegeId: string; essayId: string } | null;
  onSelectEssay: (collegeId: string, essayId: string) => void;
  onBackToSchools: () => void;
}

const CollegeNavigator: React.FC<CollegeNavigatorProps> = ({
  college,
  activeEssay,
  onSelectEssay,
  onBackToSchools,
}) => {
  return (
    <aside className="hidden h-full w-64 flex-shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
      <div className="border-b border-border p-4">
        <button
          type="button"
          onClick={onBackToSchools}
          className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all schools
        </button>
        <h2 className="font-display text-lg font-semibold text-foreground">{college.name}</h2>
        <p className="text-xs text-muted-foreground">{college.essays.length} essay{college.essays.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {college.essays.map((essay) => {
          const isActive =
            activeEssay?.collegeId === college.id && activeEssay.essayId === essay.id;
          return (
            <button
              key={essay.id}
              type="button"
              onClick={() => onSelectEssay(college.id, essay.id)}
              className={`flex w-full items-start gap-2 rounded-lg p-2 text-left ${
                isActive
                  ? 'border border-primary/30 bg-primary/10 text-primary'
                  : 'border border-transparent hover:bg-muted/50'
              }`}
            >
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${getStatusDot(essay.status)}`} />
              <span className="line-clamp-2 text-xs text-foreground">{essay.title}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default CollegeNavigator;
