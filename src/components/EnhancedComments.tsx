import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSpinner,
  IonText,
  IonAlert,
} from '@ionic/react';
import {
  send,
  flagOutline,
  trashOutline,
  shareOutline,
  warning,
  checkmarkCircle,
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import ReportModal from './ReportModal';
import ContentFilter from './ContentFilter';
import { useModeration } from '@hooks/useModeration';
import { useCustomToast } from '@hooks/useIonToast';

interface EnhancedCommentInputProps {
  onSubmit: (comment: string) => Promise<void>;
  session: Session | null;
  placeholder?: string;
  parentId?: string;
  onCancel?: () => void;
}

interface EnhancedCommentItemProps {
  comment: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles?: {
      email?: string;
      username?: string;
    };
  };
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  level?: number;
}

// Enhanced comment input with content filtering
const EnhancedCommentInput: React.FC<EnhancedCommentInputProps> = ({
  onSubmit,
  session,
  placeholder = "Write a comment...",
  parentId,
  onCancel,
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContentFilter, setShowContentFilter] = useState(false);
  const [contentApproved, setContentApproved] = useState(false);
  const [contentRejected, setContentRejected] = useState(false);

  const { checkContent } = useModeration();
  const showToast = useCustomToast();

  const handleCommentChange = (value: string) => {
    setComment(value);
    setContentApproved(false);
    setContentRejected(false);
    setShowContentFilter(value.trim().length > 10); // Show filter for substantial comments
  };

  const handleContentApproved = (approvedContent: string) => {
    setContentApproved(true);
    setContentRejected(false);
  };

  const handleContentRejected = (rejectedContent: string, reasons: string[]) => {
    setContentRejected(true);
    setContentApproved(false);
    showToast({
      message: `Content flagged: ${reasons.join(', ')}`,
      color: 'warning',
      duration: 4000,
    });
  };

  const handleSubmit = async () => {
    if (!comment.trim() || !session) return;

    // Check content before submitting
    const filterResult = await checkContent(comment);
    
    if (!filterResult.isAppropriate && filterResult.severity === 'high') {
      showToast({
        message: 'This content violates our community guidelines and cannot be posted.',
        color: 'danger',
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(comment);
      setComment('');
      setContentApproved(false);
      setContentRejected(false);
      setShowContentFilter(false);
      
      showToast({
        message: 'Comment posted successfully',
        color: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      showToast({
        message: 'Failed to post comment',
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !session || !comment.trim() || isSubmitting || (contentRejected && !contentApproved);

  return (
    <div className="space-y-4">
      {/* Content filter */}
      {showContentFilter && (
        <ContentFilter
          content={comment}
          onContentApproved={handleContentApproved}
          onContentRejected={handleContentRejected}
          showSuggestions={true}
          strictMode={false}
        />
      )}

      {/* Comment input */}
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <IonTextarea
            value={comment}
            onIonInput={(e) => handleCommentChange(e.detail.value!)}
            placeholder={placeholder}
            rows={3}
            maxlength={2000}
            className={`border rounded-lg ${
              contentRejected && !contentApproved 
                ? 'border-red-300 bg-red-50' 
                : contentApproved 
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300'
            }`}
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {comment.length}/2000 characters
            </div>
            
            {/* Content status indicators */}
            <div className="flex items-center space-x-2">
              {contentApproved && (
                <div className="flex items-center text-green-600 text-xs">
                  <IonIcon icon={checkmarkCircle} className="mr-1" />
                  Approved
                </div>
              )}
              {contentRejected && !contentApproved && (
                <div className="flex items-center text-red-600 text-xs">
                  <IonIcon icon={warning} className="mr-1" />
                  Flagged
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <IonButton
            onClick={handleSubmit}
            disabled={isDisabled}
            size="small"
            className={contentApproved ? 'bg-green-600' : ''}
          >
            {isSubmitting ? (
              <IonSpinner name="dots" />
            ) : (
              <>
                <IonIcon icon={send} slot="start" />
                Post
              </>
            )}
          </IonButton>
          
          {onCancel && (
            <IonButton
              onClick={onCancel}
              fill="outline"
              size="small"
              disabled={isSubmitting}
            >
              Cancel
            </IonButton>
          )}
        </div>
      </div>

      {/* Content guidelines reminder */}
      {comment.length > 50 && (
        <IonText color="medium">
          <p className="text-xs">
            Please keep comments respectful and follow our{' '}
            <a href="#" className="text-blue-600 underline">Community Guidelines</a>.
          </p>
        </IonText>
      )}
    </div>
  );
};

// Enhanced comment item with reporting functionality
const EnhancedCommentItem: React.FC<EnhancedCommentItemProps> = ({
  comment,
  currentUserId,
  onDelete,
  onReply,
  level = 0,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const isOwnComment = currentUserId === comment.user_id;
  const userEmail = comment.profiles?.email || 'Unknown User';

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(comment.id);
    }
    setShowDeleteAlert(false);
  };

  return (
    <>
      <div className={`${level > 0 ? 'ml-6 pl-4 border-l-2 border-gray-200' : ''} mb-4`}>
        <div className="bg-gray-50 rounded-lg p-4">
          {/* Comment header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="font-medium text-gray-800">{userEmail}</span>
              {isOwnComment && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Comment content */}
          <div className="text-gray-800 text-sm mb-3">
            {comment.content}
          </div>

          {/* Comment actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onReply && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Reply
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!isOwnComment && (
                <button
                  onClick={handleReport}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="Report comment"
                >
                  <IonIcon icon={flagOutline} className="w-4 h-4 text-gray-600" />
                </button>
              )}

              <button
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                title="Share comment"
              >
                <IonIcon icon={shareOutline} className="w-4 h-4 text-gray-600" />
              </button>

              {isOwnComment && onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="Delete comment"
                >
                  <IonIcon icon={trashOutline} className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="comment"
        contentId={comment.id}
        contentPreview={comment.content}
        reportedUserEmail={userEmail}
      />

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: confirmDelete,
          },
        ]}
      />
    </>
  );
};

// Export both components
export { EnhancedCommentInput, EnhancedCommentItem };
export default { EnhancedCommentInput, EnhancedCommentItem };