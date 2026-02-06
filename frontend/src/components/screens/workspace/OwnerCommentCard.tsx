import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { Check, Reply } from 'lucide-react';

import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ReviewerComment } from './types';

interface OwnerCommentCardProps {
  comment: ReviewerComment;
  onResolve: () => void;
  onAddReply: (content: string) => Promise<{ replyId: Id<'shareCommentReplies'> }>;
}

const OwnerCommentCard: React.FC<OwnerCommentCardProps> = ({
  comment,
  onResolve,
  onAddReply,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replies = useQuery(api.shares.getReplies, { commentId: comment._id }) ?? [];

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddReply(replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        comment.resolved
          ? 'bg-muted/30 border-border/50 opacity-60'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {comment.authorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{comment.authorName}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onResolve}
          title={comment.resolved ? 'Unresolve' : 'Resolve'}
        >
          <Check
            className={`w-3.5 h-3.5 ${comment.resolved ? 'text-green-500' : 'text-muted-foreground'}`}
          />
        </Button>
      </div>

      {comment.selectedText && (
        <div className="mb-2 p-2 rounded bg-yellow-500/10 border-l-2 border-yellow-500">
          <p className="text-xs text-muted-foreground italic line-clamp-2">"{comment.selectedText}"</p>
        </div>
      )}

      <p className="text-xs text-foreground mb-3">{comment.content}</p>

      {replies.length > 0 && (
        <div className="space-y-2 mb-3 pl-3 border-l-2 border-border">
          {replies.map((reply) => (
            <div key={reply._id} className="text-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`font-medium ${reply.isOwner ? 'text-primary' : 'text-foreground'}`}>
                  {reply.authorName}
                  {reply.isOwner && <span className="text-[10px] ml-1">(You)</span>}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-[10px]">
                  {new Date(reply.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {isReplying ? (
          <div className="space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="min-h-[60px] text-xs resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!replyContent.trim() || isSubmitting}
                onClick={handleSubmitReply}
              >
                {isSubmitting ? 'Sending...' : 'Send Reply'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setIsReplying(true)}
          >
            <Reply className="w-3 h-3" />
            Reply
          </Button>
        )}
      </div>
    </div>
  );
};

export default OwnerCommentCard;
