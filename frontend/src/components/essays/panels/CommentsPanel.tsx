import React from 'react';

import OwnerCommentCard from '@/components/screens/workspace/OwnerCommentCard';
import type { ReviewerComment } from '@/components/screens/workspace/types';
import type { Id } from '../../../../convex/_generated/dataModel';

export interface CommentsPanelProps {
  reviewerComments: ReviewerComment[];
  onResolveComment: (commentId: Id<'shareComments'>) => void;
  onAddOwnerReply: (
    commentId: Id<'shareComments'>,
    content: string,
  ) => Promise<{ replyId: Id<'shareCommentReplies'> }>;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  reviewerComments,
  onResolveComment,
  onAddOwnerReply,
}) => {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        {reviewerComments.filter((comment) => !comment.resolved).length} unresolved comments
      </p>

      {reviewerComments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        reviewerComments.map((comment) => (
          <OwnerCommentCard
            key={comment._id}
            comment={comment}
            onResolve={() => onResolveComment(comment._id)}
            onAddReply={(content) => onAddOwnerReply(comment._id, content)}
          />
        ))
      )}
    </div>
  );
};

export default CommentsPanel;
