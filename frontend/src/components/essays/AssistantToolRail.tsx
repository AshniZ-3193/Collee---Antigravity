import React from 'react';
import { MessageSquare, Sparkles, Wand2 } from 'lucide-react';

import type { SidebarTab } from './AssistantSidebar';

interface AssistantToolRailProps {
  isSidebarOpen: boolean;
  activeTab: SidebarTab;
  onOpenStrategy: () => void;
  onOpenFeedback: () => void;
  onOpenComments: () => void;
}

const RailButton: React.FC<{
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, title, onClick, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
      active
        ? 'bg-primary/12 text-primary shadow-sm ring-1 ring-primary/25'
        : 'text-foreground/55 hover:bg-muted hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

const AssistantToolRail: React.FC<AssistantToolRailProps> = ({
  isSidebarOpen,
  activeTab,
  onOpenStrategy,
  onOpenFeedback,
  onOpenComments,
}) => {
  return (
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
    </div>
  );
};

export default AssistantToolRail;
