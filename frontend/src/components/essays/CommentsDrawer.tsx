import React from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import OwnerCommentCard from '@/components/screens/workspace/OwnerCommentCard';
import type { ReviewerComment } from '@/components/screens/workspace/types';
import type { Id } from '../../../convex/_generated/dataModel';

interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerComments: ReviewerComment[];
  onResolveComment: (commentId: Id<'shareComments'>) => void;
  onAddOwnerReply: (
    commentId: Id<'shareComments'>,
    content: string,
  ) => Promise<{ replyId: Id<'shareCommentReplies'> }>;
}

const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  open,
  onOpenChange,
  reviewerComments,
  onResolveComment,
  onAddOwnerReply,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-sm">
        <div className="p-5">
          <SheetHeader>
            <SheetTitle>Reviewer Comments</SheetTitle>
            <SheetDescription>
              {reviewerComments.filter((comment) => !comment.resolved).length} unresolved comments
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsDrawer;
