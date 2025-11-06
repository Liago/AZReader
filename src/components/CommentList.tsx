import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  chatbubbleOutline,
  chevronDown,
  chevronUp,
  ellipsisHorizontal,
  flagOutline,
  refreshOutline,
  shareOutline,
  timeOutline,
  trashOutline,
  filterOutline,
  listOutline,
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import {
  usePostCommentsWithPagination,
  CommentWithReplies,
  SortOrder,
  CommentFilter,
} from '@hooks/usePostCommentsWithPagination';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import moment from 'moment';

interface CommentListProps {
  postId: string;
  session: Session | null;
  articleTitle?: string;
  initialPageSize?: number;
  showControls?: boolean;
  showStats?: boolean;
  enableInfiniteScroll?: boolean;
  onCommentClick?: (comment: CommentWithReplies) => void;
  className?: string;
}

// Avatar component (same as in Comments.tsx)
const AVATAR_COLORS = [
  "bg-gradient-to-br from-pink-500 to-rose-500",
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-amber-400 to-orange-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-red-500 to-pink-600",
];

const getAvatarColorForEmail = (email: string | null | undefined): string => {
  if (!email) return AVATAR_COLORS[0] || '';

  let sum = 0;
  for (let i = 0; i < email.length; i++) {
    sum += email.charCodeAt(i);
  }
  const index = sum % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] || '';
};

const getAuthorInfo = (email: string | null | undefined) => {
  const safeEmail = email || "";
  let userName = "User";

  if (safeEmail.includes("@")) {
    const parts = safeEmail.split("@");
    if (parts.length > 0 && parts[0]) {
      userName = parts[0];
    }
  }

  let initials = "??";
  if (userName.length >= 2) {
    const firstChar = userName.charAt(0);
    const secondChar = userName.charAt(1);
    initials = (firstChar + secondChar).toUpperCase();
  } else if (userName.length === 1) {
    initials = userName.charAt(0).toUpperCase();
  }

  return { authorName: userName, initials };
};

const Avatar: React.FC<{
  email: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}> = ({ email, size = "md", className = "" }) => {
  const { initials } = getAuthorInfo(email);
  const bgColor = getAvatarColorForEmail(email);

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold shadow-md ${className}`}
    >
      {initials}
    </div>
  );
};

// Time formatting utility
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ora";
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} g fa`;

  return moment(date).format('DD/MM/YYYY');
};

// Individual Comment Item Component
interface CommentItemProps {
  comment: CommentWithReplies;
  level?: number;
  onReply?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  session: Session | null;
  showReplies?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  level = 0,
  onReply,
  onDelete,
  session,
  showReplies = true
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const { authorName } = getAuthorInfo(comment.profiles?.email);
  const timeAgo = getTimeAgo(comment.created_at);
  const isOwnComment = session?.user?.id === comment.user_id;

  const handleReply = () => {
    if (onReply) onReply(comment.id);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(comment.id);
    setShowOptions(false);
  };

  return (
    <div className={`${level > 0 ? "pl-4 ml-1 relative" : ""} mb-4`}>
      {level > 0 && (
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-200 rounded-full"></div>
      )}

      <div className="rounded-xl bg-gray-100 p-4 overflow-hidden">
        {/* Comment header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Avatar email={comment.profiles?.email} size="sm" className="mr-2" />
            <span className="font-medium text-gray-800">{authorName}</span>
            {isOwnComment && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Tu
              </span>
            )}
            {level > 0 && (
              <IonBadge color="light" className="ml-2 text-xs">
                Reply
              </IonBadge>
            )}
          </div>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>

        {/* Comment content */}
        <div className="text-gray-800 text-sm mb-3">
          {comment.content}
        </div>

        {/* Comment actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Reply count */}
            {comment.replies && comment.replies.length > 0 && (
              <span className="text-xs text-gray-500 flex items-center">
                <IonIcon icon={chatbubbleOutline} className="mr-1 w-3 h-3" />
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          <div className="flex items-center">
            {/* Reply button */}
            <button
              className="text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center mr-3"
              onClick={handleReply}
            >
              <IonIcon icon={chatbubbleOutline} className="mr-1 w-4 h-4" />
              <span>Reply</span>
            </button>

            {/* Options menu */}
            <button 
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              onClick={() => setShowOptions(!showOptions)}
            >
              <IonIcon icon={ellipsisHorizontal} className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Options dropdown */}
        {showOptions && (
          <div className="absolute right-4 mt-2 w-48 bg-white rounded-xl shadow-xl z-10 py-1 overflow-hidden">
            {isOwnComment && (
              <button
                className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 flex items-center font-medium"
                onClick={handleDelete}
              >
                <IonIcon icon={trashOutline} className="mr-3 text-lg" />
                <span>Delete</span>
              </button>
            )}
            <button
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
              onClick={() => setShowOptions(false)}
            >
              <IonIcon icon={flagOutline} className="mr-3 text-lg" />
              <span>Report</span>
            </button>
            <button
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center font-medium"
              onClick={() => setShowOptions(false)}
            >
              <IonIcon icon={shareOutline} className="mr-3 text-lg" />
              <span>Share</span>
            </button>
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={level + 1}
              onReply={onReply}
              onDelete={onDelete}
              session={session}
              showReplies={showReplies}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Loading skeleton
const CommentSkeleton: React.FC = () => (
  <div className="p-4 flex items-start gap-3 animate-pulse mb-4">
    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
    <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
      <div className="flex justify-between items-center mb-3">
        <IonSkeletonText animated style={{ width: "30%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
        <IonSkeletonText animated style={{ width: "10%", height: "14px", borderRadius: "4px" }}></IonSkeletonText>
      </div>
      <IonSkeletonText animated style={{ width: "100%", height: "16px", borderRadius: "4px" }}></IonSkeletonText>
      <IonSkeletonText animated style={{ width: "90%", height: "16px", borderRadius: "4px", marginTop: "4px" }}></IonSkeletonText>
    </div>
  </div>
);

// Empty state
const EmptyComments: React.FC<{ session: Session | null }> = ({ session }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-xl my-4">
    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
      <IonIcon icon={chatbubbleOutline} className="text-gray-400 text-3xl" />
    </div>
    <h3 className="text-lg font-bold text-gray-800 mb-2">No comments yet</h3>
    <p className="text-gray-600 mb-6 max-w-xs">
      {session
        ? "Be the first to start the conversation!"
        : "Sign in to view and add comments."}
    </p>
  </div>
);

// Main CommentList Component
const CommentList: React.FC<CommentListProps> = ({
  postId,
  session,
  articleTitle,
  initialPageSize = 20,
  showControls = true,
  showStats = true,
  enableInfiniteScroll = true,
  onCommentClick,
  className = "",
}) => {
  const userState = useSelector((state: RootState) => state.user);
  
  const {
    paginatedComments,
    commentsCount,
    totalPages,
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    sortOrder,
    filter,
    pageSize,
    loadMore,
    refresh,
    setSortOrder,
    setFilter,
    setPageSize,
    goToPage,
    addNewComment,
    deleteExistingComment,
  } = usePostCommentsWithPagination(postId, session, {
    pageSize: initialPageSize,
    sortOrder: 'newest',
    filter: 'all'
  });

  // Handle infinite scroll
  const handleInfiniteScroll = async (ev: CustomEvent<void>) => {
    if (enableInfiniteScroll) {
      await loadMore();
    }
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  // Handle refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refresh();
    event.detail.complete();
  };

  // Handle comment reply
  const handleCommentReply = (commentId: string) => {
    // This would typically open a reply modal or expand an inline reply form
    console.log('Reply to comment:', commentId);
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <IonText color="danger">
          <p>Error loading comments: {error.message}</p>
          <IonButton fill="outline" size="small" onClick={() => refresh()}>
            <IonIcon icon={refreshOutline} slot="start" />
            Retry
          </IonButton>
        </IonText>
      </div>
    );
  }

  return (
    <div className={`comment-list ${className}`}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent
          pullingText="Pull to refresh comments..."
          refreshingSpinner="bubbles"
          refreshingText="Refreshing..."
        />
      </IonRefresher>

      {/* Header with article info and stats */}
      {(articleTitle || showStats) && (
        <IonCard>
          <IonCardHeader>
            {articleTitle && (
              <IonCardTitle className="text-base line-clamp-2">
                {articleTitle}
              </IonCardTitle>
            )}
          </IonCardHeader>
          {showStats && (
            <IonCardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <IonIcon icon={chatbubbleOutline} className="text-blue-500" />
                    <span className="text-sm font-medium">{commentsCount} comments</span>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <IonIcon icon={listOutline} className="text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </div>
                <IonButton fill="clear" size="small" onClick={() => refresh()}>
                  <IonIcon icon={refreshOutline} />
                </IonButton>
              </div>
            </IonCardContent>
          )}
        </IonCard>
      )}

      {/* Controls */}
      {showControls && (
        <IonCard>
          <IonCardContent>
            <div className="space-y-4">
              {/* Sort and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Sort Order */}
                <div className="flex-1">
                  <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                    Sort by
                  </IonLabel>
                  <IonSegment
                    value={sortOrder}
                    onIonChange={(e) => setSortOrder(e.detail.value as SortOrder)}
                  >
                    <IonSegmentButton value="newest">
                      <IonLabel>Newest</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="oldest">
                      <IonLabel>Oldest</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>
                </div>

                {/* Filter */}
                <div className="flex-1">
                  <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                    Show
                  </IonLabel>
                  <IonSelect
                    value={filter}
                    onIonChange={(e) => setFilter(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">All Comments</IonSelectOption>
                    <IonSelectOption value="root-only">Top Level Only</IonSelectOption>
                    <IonSelectOption value="replies-only">Replies Only</IonSelectOption>
                  </IonSelect>
                </div>

                {/* Page Size */}
                <div className="flex-1">
                  <IonLabel className="text-sm font-medium text-gray-700 mb-2 block">
                    Per page
                  </IonLabel>
                  <IonSelect
                    value={pageSize}
                    onIonChange={(e) => setPageSize(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value={10}>10</IonSelectOption>
                    <IonSelectOption value={20}>20</IonSelectOption>
                    <IonSelectOption value={50}>50</IonSelectOption>
                    <IonSelectOption value={100}>100</IonSelectOption>
                  </IonSelect>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Comments List */}
      <div className="p-4">
        {isLoading && paginatedComments.length === 0 ? (
          // Initial loading
          <div>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </div>
        ) : paginatedComments.length === 0 ? (
          // Empty state
          <EmptyComments session={session} />
        ) : (
          // Comments
          <div className="space-y-2">
            {paginatedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleCommentReply}
                onDelete={deleteExistingComment}
                session={session}
                showReplies={filter === 'all' || filter === 'root-only'}
              />
            ))}
          </div>
        )}

        {/* Load More Button (fallback for when infinite scroll is disabled) */}
        {!enableInfiniteScroll && hasMore && !isLoadingMore && (
          <div className="text-center mt-6">
            <IonButton
              fill="outline"
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              <IonIcon icon={chevronDown} slot="start" />
              Load More Comments
            </IonButton>
          </div>
        )}

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="text-center py-4">
            <IonSpinner name="dots" />
            <p className="text-sm text-gray-500 mt-2">Loading more comments...</p>
          </div>
        )}
      </div>

      {/* Infinite Scroll */}
      {enableInfiniteScroll && (
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more comments..."
          />
        </IonInfiniteScroll>
      )}

      {/* Pagination Controls */}
      {!enableInfiniteScroll && totalPages > 1 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <IonButton
              fill="outline"
              size="small"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <IonIcon icon={chevronUp} slot="start" />
              Previous
            </IonButton>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <IonButton
              fill="outline"
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
              <IonIcon icon={chevronDown} slot="end" />
            </IonButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentList;