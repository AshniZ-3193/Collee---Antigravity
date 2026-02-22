import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { MessageSquare, Recycle, SpellCheck, Sparkles, Wand2, X } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';

import StrategyPanel, { type StrategyPanelProps } from './panels/StrategyPanel';
import FeedbackPanel, { type FeedbackPanelProps } from './panels/FeedbackPanel';
import CommentsPanel, { type CommentsPanelProps } from './panels/CommentsPanel';
import GrammarPanel, { type GrammarPanelProps } from './panels/GrammarPanel';
import SmartReusePanel, { type SmartReusePanelProps } from './panels/SmartReusePanel';

export type SidebarTab = 'strategy' | 'feedback' | 'comments' | 'grammar' | 'smartReuse';

interface AssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SidebarTab;
  strategyProps: StrategyPanelProps;
  feedbackProps: FeedbackPanelProps;
  commentsProps: CommentsPanelProps;
  grammarProps: GrammarPanelProps;
  smartReuseProps: SmartReusePanelProps;
}

const SidebarContent: React.FC<{
  onClose: () => void;
  activeTab: SidebarTab;
  strategyProps: StrategyPanelProps;
  feedbackProps: FeedbackPanelProps;
  commentsProps: CommentsPanelProps;
  grammarProps: GrammarPanelProps;
  smartReuseProps: SmartReusePanelProps;
}> = ({ onClose, activeTab, strategyProps, feedbackProps, commentsProps, grammarProps, smartReuseProps }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        {activeTab === 'strategy' && <Sparkles className="h-4 w-4 text-primary" />}
        {activeTab === 'feedback' && <Wand2 className="h-4 w-4 text-primary" />}
        {activeTab === 'comments' && <MessageSquare className="h-4 w-4 text-primary" />}
        {activeTab === 'grammar' && <SpellCheck className="h-4 w-4 text-primary" />}
        {activeTab === 'smartReuse' && <Recycle className="h-4 w-4 text-primary" />}
        {activeTab === 'strategy' && 'Strategy'}
        {activeTab === 'feedback' && 'Feedback'}
        {activeTab === 'comments' && 'Comments'}
        {activeTab === 'grammar' && 'Grammar'}
        {activeTab === 'smartReuse' && 'Smart Reuse'}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        title="Close assistant"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <ScrollArea className="flex-1">
      {activeTab === 'strategy' && <StrategyPanel {...strategyProps} />}
      {activeTab === 'feedback' && <FeedbackPanel {...feedbackProps} />}
      {activeTab === 'comments' && <CommentsPanel {...commentsProps} />}
      {activeTab === 'grammar' && <GrammarPanel {...grammarProps} />}
      {activeTab === 'smartReuse' && <SmartReusePanel {...smartReuseProps} />}
    </ScrollArea>
  </div>
);

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  strategyProps,
  feedbackProps,
  commentsProps,
  grammarProps,
  smartReuseProps,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-[340px]">
          <SidebarContent
            onClose={onClose}
            activeTab={activeTab}
            strategyProps={strategyProps}
            feedbackProps={feedbackProps}
            commentsProps={commentsProps}
            grammarProps={grammarProps}
            smartReuseProps={smartReuseProps}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <m.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' as const }}
          className="flex-shrink-0 overflow-hidden border-l border-border/40 bg-card"
        >
          <div className="flex h-full w-[340px] flex-col">
            <SidebarContent
              onClose={onClose}
              activeTab={activeTab}
              strategyProps={strategyProps}
              feedbackProps={feedbackProps}
              commentsProps={commentsProps}
              grammarProps={grammarProps}
              smartReuseProps={smartReuseProps}
            />
          </div>
        </m.aside>
      )}
    </AnimatePresence>
  );
};


export default AssistantSidebar;
