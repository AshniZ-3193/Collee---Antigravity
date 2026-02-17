import React from 'react';
import { m } from 'framer-motion';
import { FileText, GraduationCap, User } from 'lucide-react';
import { countRichTextWords, renderRichTextToHtml } from '@/lib/richText';

interface ShareViewScreenProps {
  collegeName: string;
  promptText: string;
  essayContent: string;
  wordCount: number;
  authorName?: string;
}

const ShareViewScreen: React.FC<ShareViewScreenProps> = ({
  collegeName,
  promptText,
  essayContent,
  wordCount,
  authorName,
}) => {
  const computedWordCount = countRichTextWords(essayContent);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.13),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.12),transparent_48%)]" />
      {/* Header Banner */}
      <m.div
        className="bg-background/80 border-b border-border backdrop-blur-md relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-body-sm font-medium text-primary">Shared Essay</span>
            </div>
            {authorName && (
              <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{authorName}</span>
              </div>
            )}
          </div>
        </div>
      </m.div>

      {/* Content */}
      <m.main
        className="max-w-4xl mx-auto px-6 py-10 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* College & Prompt */}
        <div className="mb-8 rounded-2xl border border-border bg-card/85 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-secondary" />
            <span className="text-body font-medium text-secondary">{collegeName}</span>
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* Divider */}
        {/* Essay Content */}
        <m.article
          className="rounded-2xl border border-border bg-card/90 shadow-sm p-7 text-foreground text-lg leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          dangerouslySetInnerHTML={{ __html: renderRichTextToHtml(essayContent) }}
        />

        {/* Footer */}
        <m.div
          className="mt-12 pt-6 border-t border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex items-center justify-between text-body-sm text-muted-foreground">
            <span>{computedWordCount || wordCount} words</span>
            <span>Created with Collee</span>
          </div>
        </m.div>
      </m.main>
    </div>
  );
};

export default ShareViewScreen;
