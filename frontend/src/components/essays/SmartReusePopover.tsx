import React from 'react';
import { Copy, Lightbulb, Quote, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReusableExcerpt } from '@/components/screens/workspace/types';

interface SmartReusePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smartReuseExcerpts: ReusableExcerpt[];
  onInsertAsReference: (excerpt: ReusableExcerpt) => void;
  onDismissExcerpt: (excerptId: string) => void;
}

const SmartReusePopover: React.FC<SmartReusePopoverProps> = ({
  open,
  onOpenChange,
  smartReuseExcerpts,
  onInsertAsReference,
  onDismissExcerpt,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Smart Reuse</DialogTitle>
          <DialogDescription>Excerpts from your other essays you can adapt here.</DialogDescription>
        </DialogHeader>

        {smartReuseExcerpts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reusable excerpts yet.</p>
        ) : (
          <div className="space-y-3">
            {smartReuseExcerpts.map((excerpt) => (
              <div key={excerpt.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="border-b border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{excerpt.sourceCollegeName}</p>
                  <p className="text-xs text-muted-foreground">{excerpt.sourceEssayTitle}</p>
                </div>

                <div className="space-y-3 p-3">
                  <div className="flex items-start gap-2">
                    <Quote className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                    <p className="line-clamp-4 text-xs italic leading-relaxed text-muted-foreground">
                      "{excerpt.excerpt}"
                    </p>
                  </div>

                  <div className="rounded-lg bg-primary/10 p-2">
                    <p className="text-xs text-foreground">{excerpt.whyItWorks}</p>
                  </div>

                  {excerpt.sameSchoolWarning && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                      <div className="flex items-start gap-1.5">
                        <Lightbulb className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-600" />
                        <p className="text-xs text-amber-700">{excerpt.sameSchoolWarning}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInsertAsReference(excerpt)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Insert as reference
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissExcerpt(excerpt.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Dismiss"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SmartReusePopover;
