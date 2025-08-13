import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonAlert,
  IonToast,
  IonPopover,
  IonSpinner,
  IonBadge,
} from '@ionic/react';
import {
  share,
  shareOutline,
  copy,
  link,
  globe,
  phonePortrait,
  lockClosed,
  checkmarkCircle,
  warning,
  close,
  qrCode,
} from 'ionicons/icons';
import { ShareService } from '@utility/shareService';
import { usePrivacy } from '@hooks/usePrivacy';
import { useCustomToast } from '@hooks/useIonToast';
import { Clipboard } from '@capacitor/clipboard';
import { PlatformHelper } from '@utility/platform-helper';

interface ShareButtonProps {
  contentId: string;
  contentType?: 'article' | 'user_profile';
  title?: string;
  description?: string;
  imageUrl?: string;
  userId?: string;
  size?: 'small' | 'default' | 'large';
  fill?: 'clear' | 'outline' | 'solid';
  color?: string;
  showLabel?: boolean;
  showModal?: boolean;
  disabled?: boolean;
  className?: string;
  onShareComplete?: (method: string, success: boolean) => void;
}

interface ShareOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresAuth: boolean;
  enabled: boolean;
  action: () => Promise<void>;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  contentId,
  contentType = 'article',
  title = '',
  description = '',
  imageUrl,
  userId,
  size = 'default',
  fill = 'clear',
  color = 'primary',
  showLabel = false,
  showModal = true,
  disabled = false,
  className = '',
  onShareComplete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareAvailable, setIsShareAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {
    isPublic,
    canShare,
    generateShareUrl,
    generateDeepLink,
    isLoading: privacyLoading,
  } = usePrivacy({ contentId, contentType, userId });

  const showToast = useCustomToast();

  // Check if sharing is available
  useEffect(() => {
    const checkShareAvailability = async () => {
      const available = await ShareService.canShare();
      setIsShareAvailable(available);
    };
    checkShareAvailability();
  }, []);

  // Generate share content
  const getShareContent = () => {
    const webUrl = generateShareUrl();
    const deepLinkUrl = generateDeepLink();
    
    const shareTitle = title || `Check out this ${contentType}`;
    const shareText = description || `I found this interesting ${contentType} and wanted to share it with you.`;
    
    return {
      title: shareTitle,
      text: shareText,
      webUrl,
      deepLinkUrl,
      imageUrl: imageUrl || undefined,
    };
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (PlatformHelper.isNative()) {
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      
      showToast({
        message: `${type} copied to clipboard`,
        color: 'success',
        duration: 2000,
      });
      
      onShareComplete?.('clipboard', true);
      setIsModalOpen(false);
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToast({
        message: 'Failed to copy to clipboard',
        color: 'danger',
        duration: 3000,
      });
      
      onShareComplete?.('clipboard', false);
    }
  };

  // Native sharing
  const shareNative = async () => {
    const content = getShareContent();
    setIsLoading(true);
    
    try {
      const success = await ShareService.shareArticle(
        content.title,
        content.webUrl,
        content.text
      );
      
      if (success) {
        showToast({
          message: 'Shared successfully',
          color: 'success',
          duration: 2000,
        });
        onShareComplete?.('native', true);
        setIsModalOpen(false);
      }
      
    } catch (error) {
      console.error('Error sharing:', error);
      showToast({
        message: 'Sharing failed',
        color: 'danger',
        duration: 3000,
      });
      
      onShareComplete?.('native', false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle share button click
  const handleShare = async () => {
    if (disabled || privacyLoading) return;
    
    // Check if content can be shared
    const canShareContent = await canShare();
    if (!canShareContent) {
      setAlertMessage(
        `This ${contentType} is private and cannot be shared. Change privacy settings to public to enable sharing.`
      );
      setShowAlert(true);
      return;
    }

    // If modal is disabled, share directly
    if (!showModal) {
      await shareNative();
      return;
    }

    setIsModalOpen(true);
  };

  // Generate share options
  const getShareOptions = (): ShareOption[] => {
    const content = getShareContent();
    
    return [
      {
        id: 'native',
        label: 'Share via Apps',
        description: 'Share using your device\'s native sharing options',
        icon: share,
        color: 'primary',
        requiresAuth: false,
        enabled: isShareAvailable,
        action: shareNative,
      },
      {
        id: 'copy-web',
        label: 'Copy Web Link',
        description: 'Copy link that opens in browser',
        icon: link,
        color: 'secondary',
        requiresAuth: false,
        enabled: true,
        action: () => copyToClipboard(content.webUrl, 'Web link'),
      },
      {
        id: 'copy-deep',
        label: 'Copy App Link',
        description: 'Copy deep link that opens in AZReader app',
        icon: phonePortrait,
        color: 'tertiary',
        requiresAuth: false,
        enabled: true,
        action: () => copyToClipboard(content.deepLinkUrl, 'App link'),
      },
    ];
  };

  const shareOptions = getShareOptions();
  const content = getShareContent();

  return (
    <>
      {/* Share Button */}
      <IonButton
        size={size}
        fill={fill}
        color={color}
        disabled={disabled || privacyLoading}
        className={className}
        onClick={handleShare}
      >
        {isLoading || privacyLoading ? (
          <IonSpinner name="dots" />
        ) : (
          <>
            <IonIcon 
              icon={isPublic ? shareOutline : lockClosed} 
              slot={showLabel ? 'start' : 'icon-only'} 
            />
            {showLabel && <span>Share</span>}
          </>
        )}
      </IonButton>

      {/* Share Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Share {contentType}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent>
          <div className="p-4 space-y-4">
            {/* Content Preview */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{content.title}</span>
                  <IonBadge color={isPublic ? 'success' : 'danger'}>
                    {isPublic ? 'Public' : 'Private'}
                  </IonBadge>
                </IonCardTitle>
              </IonCardHeader>
              
              <IonCardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {content.text}
                </p>
                
                <div className="flex items-center text-xs text-gray-500">
                  <IonIcon icon={globe} className="mr-1" />
                  <span className="truncate">{content.webUrl}</span>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Privacy Warning */}
            {!isPublic && (
              <IonCard className="border-l-4 border-orange-400">
                <IonCardContent>
                  <div className="flex items-start">
                    <IonIcon icon={warning} className="text-orange-500 text-lg mr-3 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Private Content</h4>
                      <p className="text-sm text-gray-700">
                        This {contentType} is private and cannot be shared. 
                        Make it public in privacy settings to enable sharing.
                      </p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Share Options */}
            {isPublic && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Sharing Options</h3>
                
                <IonList>
                  {shareOptions.map((option) => (
                    <IonItem
                      key={option.id}
                      button
                      onClick={option.enabled ? option.action : undefined}
                      disabled={!option.enabled || isLoading}
                      className={!option.enabled ? 'opacity-50' : ''}
                    >
                      <IonIcon
                        icon={option.icon}
                        slot="start"
                        className={`text-${option.color}`}
                      />
                      <IonLabel>
                        <h3 className="font-medium">{option.label}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                        {!option.enabled && (
                          <p className="text-xs text-gray-500 mt-1">
                            Not available on this device
                          </p>
                        )}
                      </IonLabel>
                      
                      {isLoading && (
                        <IonSpinner name="dots" slot="end" />
                      )}
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}

            {/* Share URLs for Manual Copying */}
            {isPublic && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="text-base">Share URLs</IonCardTitle>
                </IonCardHeader>
                
                <IonCardContent>
                  <div className="space-y-4">
                    {/* Web URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Web Link</h4>
                        <IonButton
                          size="small"
                          fill="outline"
                          onClick={() => copyToClipboard(content.webUrl, 'Web link')}
                        >
                          <IonIcon icon={copy} slot="start" />
                          Copy
                        </IonButton>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded break-all">
                        {content.webUrl}
                      </div>
                    </div>

                    {/* Deep Link URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">App Link</h4>
                        <IonButton
                          size="small"
                          fill="outline"
                          onClick={() => copyToClipboard(content.deepLinkUrl, 'App link')}
                        >
                          <IonIcon icon={copy} slot="start" />
                          Copy
                        </IonButton>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded break-all">
                        {content.deepLinkUrl}
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Tips */}
            <IonCard>
              <IonCardContent>
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">Sharing Tips:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Web links work in any browser</li>
                    <li>App links open directly in AZReader when installed</li>
                    <li>Private content requires the recipient to have access</li>
                    <li>Public content can be viewed by anyone</li>
                  </ul>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Privacy Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Cannot Share Private Content"
        message={alertMessage}
        buttons={[
          {
            text: 'OK',
            role: 'cancel',
          },
          {
            text: 'Change Privacy',
            handler: () => {
              // This would open privacy settings
              // For now, just close the alert
              console.log('Open privacy settings');
            },
          },
        ]}
      />
    </>
  );
};

export default ShareButton;