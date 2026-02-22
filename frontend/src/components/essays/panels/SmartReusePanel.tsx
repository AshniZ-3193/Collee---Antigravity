import React from 'react';
import { Copy, Lightbulb, Quote, Recycle, XCircle } from 'lucide-react';

import type { ReusableExcerpt } from '@/components/screens/workspace/types';

export interface SmartReusePanelProps {
    smartReuseExcerpts: ReusableExcerpt[];
    onInsertExcerpt: (excerpt: ReusableExcerpt) => void;
    onDismissExcerpt: (excerptId: string) => void;
}

const SmartReusePanel: React.FC<SmartReusePanelProps> = ({
    smartReuseExcerpts,
    onInsertExcerpt,
    onDismissExcerpt,
}) => {
    return (
        <div className="p-4 space-y-4">
            <div className="rounded-lg bg-muted/20 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                    <Recycle className="h-4 w-4 text-primary" />
                    Reusable from Similar Prompts
                </h3>

                {smartReuseExcerpts.length === 0 ? (
                    <div className="space-y-2">
                        <p className="text-xs italic text-muted-foreground">
                            No reusable excerpts found yet.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            As you write essays for different colleges, excerpts from essays with similar prompts will appear here so you can reuse them.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                            These excerpts from your other essays match the themes of this prompt. Insert them as a starting point.
                        </p>

                        {smartReuseExcerpts.map((excerpt) => (
                            <div
                                key={excerpt.id}
                                className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30"
                            >
                                <div className="border-b border-border bg-muted/30 px-3 py-2">
                                    <p className="text-xs font-medium text-foreground">
                                        {excerpt.sourceCollegeName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {excerpt.sourceEssayTitle}
                                    </p>
                                </div>

                                <div className="space-y-3 p-3">
                                    <div className="flex items-start gap-2">
                                        <Quote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                        <p className="line-clamp-4 text-xs italic leading-relaxed text-muted-foreground">
                                            &ldquo;{excerpt.excerpt}&rdquo;
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
                                            onClick={() => onInsertExcerpt(excerpt)}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Insert into essay
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
            </div>
        </div>
    );
};

export default SmartReusePanel;
