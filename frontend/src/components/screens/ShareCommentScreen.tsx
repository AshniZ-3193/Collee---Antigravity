import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  User, 
  MessageSquare, 
  Check, 
  X,
  Send,
  Trash2,
  CheckCircle,
  Quote,
  MessageCircle,
  Reply,
  Crown
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import type { Id } from '../../../convex/_generated/dataModel';
import { countRichTextWords, stripRichTextFormatting } from '@/lib/richText';

interface Comment {
  _id: Id<"shareComments">;
  authorName: string;
  authorEmail?: string;
  content: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  resolved: boolean;
  createdAt: number;
}

interface CommentReply {
  _id: Id<"shareCommentReplies">;
  authorName: string;
  isOwner: boolean;
  content: string;
  createdAt: number;
}

interface ShareCommentScreenProps {
  token: string;
  collegeName: string;
  promptText: string;
  essayContent: string;
  wordCount: number;
  authorName?: string;
}

// Component for a single comment with replies
const CommentCard: React.FC<{
  comment: Comment;
  token: string;
  commenterName: string;
  isActive: boolean;
  onSetActive: () => void;
  onResolve: () => void;
  onDelete: () => void;
  formatTime: (ts: number) => string;
}> = ({ comment, token, commenterName, isActive, onSetActive, onResolve, onDelete, formatTime }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const replyInputRef = useRef<HTMLInputElement>(null);

  const replies = useQuery(api.shares.getReplies, { commentId: comment._id }) ?? [];
  const addReplyMutation = useMutation(api.shares.addReply);
  const deleteReplyMutation = useMutation(api.shares.deleteReply);

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  const handleAddReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      await addReplyMutation({
        token,
        commentId: comment._id,
        authorName: commenterName,
        isOwner: false, // Reviewers are not owners
        content: replyContent.trim(),
      });
      setReplyContent('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleDeleteReply = async (replyId: Id<"shareCommentReplies">) => {
    try {
      await deleteReplyMutation({ token, replyId });
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-xl border bg-card transition-all ${
        isActive ? 'border-primary shadow-sm' : 'border-border'
      }`}
      onClick={onSetActive}
    >
      {/* Main comment */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-body-sm font-medium text-foreground">
              {comment.authorName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>

        {/* Quoted text */}
        <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-muted/50">
          <Quote className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            "{comment.selectedText}"
          </p>
        </div>

        {/* Comment content */}
        <p className="text-body-sm text-foreground mb-3">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReplyInput(!showReplyInput);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Check className="w-3 h-3" />
            Resolve
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="border-t border-border bg-muted/20">
          {replies.map((reply) => (
            <div key={reply._id} className="px-4 py-3 border-b border-border last:border-b-0">
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  reply.isOwner ? 'bg-secondary/20' : 'bg-primary/10'
                }`}>
                  {reply.isOwner ? (
                    <Crown className="w-3 h-3 text-secondary" />
                  ) : (
                    <span className="text-[10px] font-medium text-primary">
                      {reply.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {reply.authorName}
                    </span>
                    {reply.isOwner && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                        Author
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{reply.content}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReply(reply._id);
                  }}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={replyInputRef}
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyContent.trim()) {
                    e.preventDefault();
                    handleAddReply();
                  }
                  if (e.key === 'Escape') {
                    setShowReplyInput(false);
                    setReplyContent('');
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="collee-accent"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddReply();
                }}
                disabled={!replyContent.trim()}
                className="px-3"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ShareCommentScreen: React.FC<ShareCommentScreenProps> = ({
  token,
  collegeName,
  promptText,
  essayContent,
  wordCount,
  authorName,
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  
  const essayRef = useRef<HTMLElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const plainEssayContent = stripRichTextFormatting(essayContent);
  const computedWordCount = countRichTextWords(essayContent);

  // Fetch comments
  const comments = useQuery(api.shares.getComments, { token }) ?? [];
  const addCommentMutation = useMutation(api.shares.addComment);
  const resolveCommentMutation = useMutation(api.shares.resolveComment);
  const deleteCommentMutation = useMutation(api.shares.deleteComment);

  // Handle text selection on mouseup within essay area only
  const handleEssayMouseUp = () => {
    const essayElement = essayRef.current;
    if (!essayElement) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return; // Don't clear if no selection
    }

    const range = selection.getRangeAt(0);
    if (!essayElement.contains(range.commonAncestorContainer)) {
      return;
    }

    const rawText = selection.toString();
    const text = rawText.trim();
    if (!text || text.length < 2) {
      return;
    }

    const preRange = range.cloneRange();
    preRange.selectNodeContents(essayElement);
    preRange.setEnd(range.startContainer, range.startOffset);
    const selectionStart = preRange.toString().length;
    const trimmedOffset = rawText.indexOf(text);
    const startIndex = selectionStart + Math.max(0, trimmedOffset);
    const endIndex = startIndex + text.length;

    if (startIndex < 0 || endIndex > plainEssayContent.length) {
      return;
    }

    setSelectedText(text);
    setSelectionRange({ start: startIndex, end: endIndex });
    setIsAddingComment(true);
    
    // Clear browser selection
    selection.removeAllRanges();
  };

  // Focus comment input when adding
  useEffect(() => {
    if (isAddingComment && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  }, [isAddingComment]);

  const handleAddComment = async () => {
    if (!newCommentContent.trim() || !selectionRange || !commenterName.trim()) return;

    try {
      await addCommentMutation({
        token,
        authorName: commenterName,
        content: newCommentContent.trim(),
        selectionStart: selectionRange.start,
        selectionEnd: selectionRange.end,
        selectedText,
      });

      setNewCommentContent('');
      setIsAddingComment(false);
      setSelectedText('');
      setSelectionRange(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleCancelComment = () => {
    setIsAddingComment(false);
    setNewCommentContent('');
    setSelectedText('');
    setSelectionRange(null);
  };

  const handleResolveComment = async (commentId: Id<"shareComments">) => {
    try {
      await resolveCommentMutation({ token, commentId });
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: Id<"shareComments">) => {
    try {
      await deleteCommentMutation({ token, commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render essay with highlighted comment regions
  const renderEssayWithHighlights = () => {
    const activeComments = comments.filter(c => !c.resolved);
    
    if (activeComments.length === 0) {
      return plainEssayContent.split('\n\n').map((paragraph, index) => (
        <p key={index} className="text-foreground text-lg leading-relaxed mb-6">
          {paragraph}
        </p>
      ));
    }

    // Sort comments by position
    const sortedComments = [...activeComments].sort((a, b) => a.selectionStart - b.selectionStart);
    
    // Build highlighted content
    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    sortedComments.forEach((comment, idx) => {
      // Add text before this comment
      if (comment.selectionStart > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {plainEssayContent.slice(lastIndex, comment.selectionStart)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <span
          key={`highlight-${idx}`}
          className={`bg-amber-200/50 dark:bg-amber-500/30 cursor-pointer border-b-2 border-amber-400 transition-all hover:bg-amber-300/50 dark:hover:bg-amber-500/40 ${
            activeCommentId === comment._id ? 'bg-amber-300/70 dark:bg-amber-500/50' : ''
          }`}
          onClick={() => setActiveCommentId(activeCommentId === comment._id ? null : comment._id)}
        >
          {plainEssayContent.slice(comment.selectionStart, comment.selectionEnd)}
        </span>
      );

      lastIndex = comment.selectionEnd;
    });

    // Add remaining text
    if (lastIndex < plainEssayContent.length) {
      parts.push(
        <span key="text-end">{plainEssayContent.slice(lastIndex)}</span>
      );
    }

    // Split by paragraphs while preserving highlights
    return (
      <div className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
        {parts}
      </div>
    );
  };

  const activeComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  // Name prompt modal
  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-8"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-heading-sm text-foreground mb-2">Welcome, Reviewer!</h2>
            <p className="text-body-sm text-muted-foreground">
              Enter your name to start leaving feedback on {authorName}'s essay
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-foreground mb-2">
                Your name
              </label>
              <input
                type="text"
                value={commenterName}
                onChange={(e) => setCommenterName(e.target.value)}
                placeholder="e.g., Mom, Mr. Johnson, Sarah"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commenterName.trim()) {
                    setShowNamePrompt(false);
                  }
                }}
              />
            </div>
            <Button
              variant="collee-accent"
              size="collee"
              onClick={() => setShowNamePrompt(false)}
              disabled={!commenterName.trim()}
              className="w-full"
            >
              Start Reviewing
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.13),transparent_45%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.12),transparent_48%)]" />
      {/* Header Banner */}
      <motion.div
        className="bg-background/80 border-b border-border backdrop-blur-md sticky top-0 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-body-sm font-medium text-primary">Comment Mode</span>
                <p className="text-xs text-muted-foreground">Select text to add feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Reviewing as {commenterName}</span>
              </div>
              {authorName && (
                <div className="hidden sm:block text-body-sm text-muted-foreground">
                  {authorName}'s essay
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative z-10">
        {/* Main Content */}
        <motion.main
          className="flex-1 px-6 py-8 lg:py-10 lg:max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* College & Prompt */}
          <div className="mb-8 rounded-2xl border border-border bg-card/85 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-secondary" />
              <span className="text-body font-medium text-secondary">{collegeName}</span>
            </div>
            <p className="text-body text-muted-foreground leading-relaxed">
              {promptText}
            </p>
          </div>

          {/* Essay Content with highlights */}
          <motion.article
            ref={essayRef}
            className="select-text cursor-text rounded-2xl border border-border bg-card/90 shadow-sm p-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            onMouseUp={handleEssayMouseUp}
          >
            {renderEssayWithHighlights()}
          </motion.article>

          {/* Footer */}
          <motion.div
            className="mt-12 pt-6 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex items-center justify-between text-body-sm text-muted-foreground">
              <span>{computedWordCount || wordCount} words</span>
              <span>Created with Collee</span>
            </div>
          </motion.div>
        </motion.main>

        {/* Comments Sidebar */}
        <motion.aside
          className="w-full lg:w-96 lg:border-l border-border bg-card/70 p-4 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] overflow-y-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-sm text-foreground">Comments</h3>
              <span className="text-body-sm text-muted-foreground">
                {activeComments.length} active
              </span>
            </div>

            {/* New Comment Input - shows when text is selected */}
            <AnimatePresence>
              {isAddingComment && selectedText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl border-2 border-primary bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-body-sm font-medium text-foreground">New Comment</span>
                    <button
                      onClick={handleCancelComment}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  {/* Selected text preview */}
                  <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
                    <Quote className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                    <p className="text-xs text-amber-800 dark:text-amber-200 italic line-clamp-2">
                      "{selectedText}"
                    </p>
                  </div>

                  <textarea
                    ref={commentInputRef}
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    placeholder="Write your feedback..."
                    className="w-full min-h-[80px] p-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none mb-3"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && newCommentContent.trim()) {
                        e.preventDefault();
                        handleAddComment();
                      }
                      if (e.key === 'Escape') {
                        handleCancelComment();
                      }
                    }}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelComment}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="collee-accent"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newCommentContent.trim()}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {activeComments.length === 0 && resolvedComments.length === 0 && !isAddingComment ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-body-sm text-muted-foreground">
                  No comments yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Select text in the essay to add feedback
                </p>
              </div>
            ) : activeComments.length > 0 || resolvedComments.length > 0 ? (
              <div className="space-y-3">
                {/* Active comments with replies */}
                {activeComments.map((comment) => (
                  <CommentCard
                    key={comment._id}
                    comment={comment}
                    token={token}
                    commenterName={commenterName}
                    isActive={activeCommentId === comment._id}
                    onSetActive={() => setActiveCommentId(comment._id)}
                    onResolve={() => handleResolveComment(comment._id)}
                    onDelete={() => handleDeleteComment(comment._id)}
                    formatTime={formatTime}
                  />
                ))}

                {/* Resolved comments */}
                {resolvedComments.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">
                      Resolved ({resolvedComments.length})
                    </p>
                    {resolvedComments.map((comment) => (
                      <motion.div
                        key={comment._id}
                        layout
                        className="p-3 rounded-xl border border-border bg-muted/30 opacity-60 mb-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-body-sm text-muted-foreground">
                              {comment.authorName}
                            </span>
                          </div>
                          <button
                            onClick={() => handleResolveComment(comment._id)}
                            className="text-xs text-primary hover:underline"
                          >
                            Unresolve
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {comment.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default ShareCommentScreen;
