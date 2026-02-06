import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, History, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { stripRichTextFormatting } from '@/lib/richText';
import type { Version } from './types';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  previewVersion: Version | null;
  versions: Version[];
  onClose: () => void;
  onPreview: (version: Version | null) => void;
  onRestore: (version: Version) => void;
}

const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  previewVersion,
  versions,
  onClose,
  onPreview,
  onRestore,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-foreground/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-lg z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-heading-sm text-foreground">Version History</h2>
                    <p className="text-body-sm text-muted-foreground">Nothing is ever lost</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {previewVersion && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-sm font-medium text-foreground">
                      Preview · {previewVersion.timestamp}
                    </span>
                    <button
                      onClick={() => onPreview(null)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto text-body-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {stripRichTextFormatting(previewVersion.content ?? '')}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => onRestore(previewVersion)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Restore this version
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {versions.length === 0 && (
                  <p className="text-body-sm text-muted-foreground text-center">No versions yet.</p>
                )}
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 rounded-xl border transition-all ${
                      version.isCurrent
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-foreground">{version.timestamp}</span>
                        {version.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-body-sm text-muted-foreground">{version.wordCount} words</span>
                    </div>
                    <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">{version.preview}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => onPreview(version)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        onClick={() => onRestore(version)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-body-sm text-center text-muted-foreground mt-6">
                Versions are automatically saved as you write
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VersionHistoryDrawer;
