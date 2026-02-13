import React from 'react';
import { MessageSquare, SpellCheck, Sparkles, Wand2 } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SidebarTab } from './AssistantSidebar';

interface AssistantToolRailProps {
  isSidebarOpen: boolean;
  activeTab: SidebarTab;
  onOpenStrategy: () => void;
  onOpenFeedback: () => void;
  onOpenComments: () => void;
  onOpenGrammar: () => void;
  grammarIssueCount?: number;
}

const RailButton: React.FC<{
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, title, onClick, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={title}
        onClick={onClick}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
          active
            ? 'bg-primary/12 text-primary shadow-sm ring-1 ring-primary/25'
            : 'text-foreground/55 hover:bg-muted hover:text-foreground'
        }`}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="left" sideOffset={10} className="px-2.5 py-1 text-xs font-medium">
      {title}
    </TooltipContent>
  </Tooltip>
);

const AssistantToolRail: React.FC<AssistantToolRailProps> = ({
  isSidebarOpen,
  activeTab,
  onOpenStrategy,
  onOpenFeedback,
  onOpenComments,
  onOpenGrammar,
  grammarIssueCount,
}) => {
  return (
    <TooltipProvider delayDuration={120}>
      <div
        className={`hidden rounded-2xl border border-border/70 bg-card/95 p-2 shadow-lg backdrop-blur md:flex md:flex-col md:gap-1.5 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-95'
        }`}
      >
        <RailButton active={isSidebarOpen && activeTab === 'strategy'} title="Strategy" onClick={onOpenStrategy}>
          <Sparkles className="h-4 w-4" />
        </RailButton>
        <RailButton active={isSidebarOpen && activeTab === 'feedback'} title="Feedback" onClick={onOpenFeedback}>
          <Wand2 className="h-4 w-4" />
        </RailButton>
        <RailButton active={isSidebarOpen && activeTab === 'comments'} title="Comments" onClick={onOpenComments}>
          <MessageSquare className="h-4 w-4" />
        </RailButton>
        <RailButton active={isSidebarOpen && activeTab === 'grammar'} title="Grammar" onClick={onOpenGrammar}>
          <div className="relative">
            <SpellCheck className="h-4 w-4" />
            {grammarIssueCount != null && grammarIssueCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                {grammarIssueCount > 99 ? '99+' : grammarIssueCount}
              </span>
            )}
          </div>
        </RailButton>
      </div>
    </TooltipProvider>
  );
};

export default AssistantToolRail;
