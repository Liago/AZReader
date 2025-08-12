import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonText,
} from '@ionic/react';
import { close, flag, warning, shield } from 'ionicons/icons';
import { useModeration, ReportReason } from '@hooks/useModeration';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'comment' | 'article' | 'user';
  contentId: string;
  contentPreview?: string;
  reportedUserEmail?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentPreview,
  reportedUserEmail,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('inappropriate_content');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { reportContent } = useModeration();

  // Report reasons with descriptions
  const reportReasons: { value: ReportReason; label: string; description: string }[] = [
    {
      value: 'spam',
      label: 'Spam or Unwanted Content',
      description: 'Repetitive, promotional, or irrelevant content',
    },
    {
      value: 'harassment',
      label: 'Harassment or Bullying',
      description: 'Content targeting or intimidating specific individuals',
    },
    {
      value: 'hate_speech',
      label: 'Hate Speech',
      description: 'Content promoting hatred based on identity or beliefs',
    },
    {
      value: 'violence',
      label: 'Violence or Threats',
      description: 'Content promoting or threatening violence',
    },
    {
      value: 'inappropriate_content',
      label: 'Inappropriate Content',
      description: 'Content not suitable for our community',
    },
    {
      value: 'misinformation',
      label: 'Misinformation',
      description: 'False or misleading information',
    },
    {
      value: 'copyright',
      label: 'Copyright Violation',
      description: 'Unauthorized use of copyrighted material',
    },
    {
      value: 'other',
      label: 'Other',
      description: 'A different reason not listed above',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    
    try {
      await reportContent(contentType, contentId, selectedReason, description.trim() || undefined);
      
      // Reset form and close modal
      setSelectedReason('inappropriate_content');
      setDescription('');
      onClose();
      
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReason('inappropriate_content');
    setDescription('');
    onClose();
  };

  const getContentTypeLabel = (): string => {
    switch (contentType) {
      case 'comment': return 'Comment';
      case 'article': return 'Article';
      case 'user': return 'User';
      default: return 'Content';
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Report {getContentTypeLabel()}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isSubmitting}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4 space-y-6">
          {/* Warning notice */}
          <IonCard className="border-l-4 border-orange-400">
            <IonCardContent>
              <div className="flex items-start">
                <IonIcon icon={warning} className="text-orange-500 text-xl mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Before you report</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Reports help keep our community safe. Please only report content that violates our community guidelines.
                  </p>
                  <p className="text-xs text-gray-600">
                    False reports may result in action against your account.
                  </p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Content preview */}
          {contentPreview && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="text-base">Reported Content</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 line-clamp-3">
                    {contentPreview}
                  </p>
                  {reportedUserEmail && (
                    <p className="text-xs text-gray-600 mt-2">
                      By: {reportedUserEmail}
                    </p>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Report reasons */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="text-base">Reason for Report</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonRadioGroup
                value={selectedReason}
                onIonChange={(e) => setSelectedReason(e.detail.value)}
              >
                <div className="space-y-3">
                  {reportReasons.map((reason) => (
                    <div key={reason.value} className="border rounded-lg p-3 hover:bg-gray-50">
                      <IonItem lines="none" className="--padding-start: 0">
                        <IonRadio
                          slot="start"
                          value={reason.value}
                          className="mr-3"
                        />
                        <IonLabel>
                          <h3 className="font-medium text-gray-900">{reason.label}</h3>
                          <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                        </IonLabel>
                      </IonItem>
                    </div>
                  ))}
                </div>
              </IonRadioGroup>
            </IonCardContent>
          </IonCard>

          {/* Additional details */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="text-base">
                Additional Details
                <span className="text-sm font-normal text-gray-600 ml-2">(Optional)</span>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonTextarea
                value={description}
                onIonInput={(e) => setDescription(e.detail.value!)}
                placeholder="Please provide any additional context that would help our moderation team understand the issue..."
                rows={4}
                maxlength={500}
                className="border rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2 text-right">
                {description.length}/500 characters
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <IonIcon icon={shield} className="text-blue-500 text-lg mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Our moderation team will review your report within 24 hours</li>
                      <li>We'll take appropriate action if the content violates our guidelines</li>
                      <li>You'll receive a notification about the outcome</li>
                      <li>Your report helps keep the community safe for everyone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Action buttons */}
          <div className="space-y-3 pb-4">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="font-medium"
            >
              <IonIcon icon={flag} slot="start" />
              {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </IonButton>
          </div>

          {/* Community guidelines link */}
          <div className="text-center pb-4">
            <IonText color="medium">
              <p className="text-xs">
                By submitting a report, you agree to our{' '}
                <a href="#" className="text-blue-600 underline">Community Guidelines</a>
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ReportModal;