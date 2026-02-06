import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle,
  Copy,
  Eye,
  FileText,
  Link2,
  Mail,
  Pencil,
  RefreshCw,
  Share2,
  Shield,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type ShareRecipientType = 'parent' | 'counselor';
type SharePermission = 'view' | 'comment' | 'edit';
type ShareLinkCopyState = 'idle' | 'copied' | 'error';

interface ShareDialogProps {
  isOpen: boolean;
  isShareSent: boolean;
  isCreatingShare: boolean;
  shareEmail: string;
  shareRecipientType: ShareRecipientType;
  sharePermission: SharePermission;
  generatedShareLink: string | null;
  shareLinkCopyState: ShareLinkCopyState;
  shareLinkCopyMessage: string;
  shareError: string | null;
  currentEssayId?: string;
  onShareEmailChange: (value: string) => void;
  onShareRecipientTypeChange: (value: ShareRecipientType) => void;
  onSharePermissionChange: (value: SharePermission) => void;
  onCopyShareLink: () => Promise<void>;
  onSubmit: () => Promise<void>;
  onDismissIfAllowed: () => void;
  onCloseAndReset: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  isShareSent,
  isCreatingShare,
  shareEmail,
  shareRecipientType,
  sharePermission,
  generatedShareLink,
  shareLinkCopyState,
  shareLinkCopyMessage,
  shareError,
  currentEssayId,
  onShareEmailChange,
  onShareRecipientTypeChange,
  onSharePermissionChange,
  onCopyShareLink,
  onSubmit,
  onDismissIfAllowed,
  onCloseAndReset,
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
            onClick={onDismissIfAllowed}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {isShareSent ? (
                <motion.div
                  className="p-8 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-heading-sm text-foreground mb-2">Share Link Created!</h3>
                  <p className="text-body-sm text-muted-foreground mb-4">
                    Share this link with {shareEmail} for{' '}
                    {sharePermission === 'view'
                      ? 'view-only'
                      : sharePermission === 'comment'
                        ? 'commenting'
                        : 'editing'}{' '}
                    access
                  </p>
                  {generatedShareLink && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                        <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-body-sm text-foreground truncate flex-1 text-left">
                          {generatedShareLink}
                        </span>
                        <button
                          onClick={() => {
                            void onCopyShareLink();
                          }}
                          className={`p-1.5 rounded-md transition-all duration-150 flex-shrink-0 active:scale-95 ${
                            shareLinkCopyState === 'copied'
                              ? 'bg-emerald-100 text-emerald-700'
                              : shareLinkCopyState === 'error'
                                ? 'bg-destructive/10 text-destructive'
                                : 'hover:bg-muted text-muted-foreground'
                          }`}
                          title="Copy link"
                        >
                          {shareLinkCopyState === 'copied' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p
                        className={`text-xs ${
                          shareLinkCopyState === 'error' ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                        aria-live="polite"
                      >
                        {shareLinkCopyMessage || 'Use the copy button to copy this link.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-heading-sm text-foreground">Share Essay</h3>
                          <p className="text-body-sm text-muted-foreground">
                            Invite someone to view or collaborate
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onCloseAndReset}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-body-sm font-medium text-foreground mb-2">
                        Recipient's email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          value={shareEmail}
                          onChange={(e) => onShareEmailChange(e.target.value)}
                          placeholder="parent@email.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-body-sm font-medium text-foreground mb-2">
                        Who is this for?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onShareRecipientTypeChange('parent')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            shareRecipientType === 'parent'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <Users
                            className={`w-4 h-4 mb-1 ${
                              shareRecipientType === 'parent' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <p
                            className={`text-body-sm font-medium ${
                              shareRecipientType === 'parent' ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            Parent
                          </p>
                        </button>
                        <button
                          onClick={() => onShareRecipientTypeChange('counselor')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            shareRecipientType === 'counselor'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <Shield
                            className={`w-4 h-4 mb-1 ${
                              shareRecipientType === 'counselor' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <p
                            className={`text-body-sm font-medium ${
                              shareRecipientType === 'counselor' ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            Counselor
                          </p>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-body-sm font-medium text-foreground mb-2">
                        Permission level
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => onSharePermissionChange('view')}
                          className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                            sharePermission === 'view'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Eye
                              className={`w-4 h-4 ${
                                sharePermission === 'view' ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                            <div>
                              <p
                                className={`text-body-sm font-medium ${
                                  sharePermission === 'view' ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                View only
                              </p>
                              <p className="text-xs text-muted-foreground">Can read but not change anything</p>
                            </div>
                          </div>
                          {sharePermission === 'view' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => onSharePermissionChange('comment')}
                          className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                            sharePermission === 'comment'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText
                              className={`w-4 h-4 ${
                                sharePermission === 'comment' ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                            <div>
                              <p
                                className={`text-body-sm font-medium ${
                                  sharePermission === 'comment' ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                Comment
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Can add inline feedback and suggestions
                              </p>
                            </div>
                          </div>
                          {sharePermission === 'comment' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                        <button
                          onClick={() => onSharePermissionChange('edit')}
                          className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                            sharePermission === 'edit'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Pencil
                              className={`w-4 h-4 ${
                                sharePermission === 'edit' ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                            <div>
                              <p
                                className={`text-body-sm font-medium ${
                                  sharePermission === 'edit' ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                Edit
                              </p>
                              <p className="text-xs text-muted-foreground">Can make changes to the essay text</p>
                            </div>
                          </div>
                          {sharePermission === 'edit' && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground text-center">
                        You remain the owner of this essay. You can revoke access anytime.
                      </p>
                    </div>
                    {shareError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive text-center">{shareError}</p>
                      </div>
                    )}
                    {!currentEssayId && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-600 text-center">
                          Please select an essay first to create a share link.
                        </p>
                      </div>
                    )}
                    <Button
                      variant="collee-accent"
                      size="collee"
                      onClick={() => {
                        void onSubmit();
                      }}
                      disabled={!shareEmail.trim() || isCreatingShare || !currentEssayId}
                      className="w-full"
                    >
                      {isCreatingShare ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating link...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Create share link
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareDialog;
