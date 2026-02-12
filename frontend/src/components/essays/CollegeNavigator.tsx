import React from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getStatusDot } from '@/components/screens/workspace/utils';
import type { College } from '@/components/screens/workspace/types';

interface CollegeNavigatorProps {
  colleges: College[];
  activeEssay: { collegeId: string; essayId: string } | null;
  expandedColleges: Set<string>;
  onToggleCollege: (collegeId: string) => void;
  onSelectEssay: (collegeId: string, essayId: string) => void;
  onAddCollege: () => void;
}

const CollegeNavigator: React.FC<CollegeNavigatorProps> = ({
  colleges,
  activeEssay,
  expandedColleges,
  onToggleCollege,
  onSelectEssay,
  onAddCollege,
}) => {
  return (
    <aside className="hidden h-full w-64 flex-shrink-0 border-r border-border bg-card/50 md:flex md:flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Essays</h2>
        <p className="text-xs text-muted-foreground">Select a prompt to write.</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {colleges.map((college) => {
          const isExpanded = expandedColleges.has(college.id);
          return (
            <div key={college.id} className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => onToggleCollege(college.id)}
                className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{college.name}</p>
                  <p className="text-xs text-muted-foreground">{college.essays.length} essays</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="space-y-1 border-t border-border px-2 py-2">
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
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <Button size="sm" variant="outline" className="w-full" onClick={onAddCollege}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add College
        </Button>
      </div>
    </aside>
  );
};

export default CollegeNavigator;
