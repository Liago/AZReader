import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonToggle,
  IonText,
  IonPopover,
  IonContent,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSpinner,
} from '@ionic/react';
import {
  globe,
  lockClosed,
  eye,
  eyeOff,
  informationCircle,
  people,
  checkmark,
  warning,
} from 'ionicons/icons';
import { usePrivacy, PrivacyLevel, ContentType } from '@hooks/usePrivacy';

interface PrivacyToggleProps {
  contentId: string;
  contentType?: ContentType;
  userId?: string;
  size?: 'small' | 'default' | 'large';
  showLabel?: boolean;
  showDetails?: boolean;
  disabled?: boolean;
  className?: string;
  onPrivacyChange?: (isPublic: boolean, level: PrivacyLevel) => void;
}

interface PrivacyInfoProps {
  level: PrivacyLevel;
  contentType: ContentType;
}

// Privacy information component
const PrivacyInfo: React.FC<PrivacyInfoProps> = ({ level, contentType }) => {
  const getPrivacyInfo = () => {
    const isArticle = contentType === 'article';
    
    switch (level) {
      case 'public':
        return {
          icon: globe,
          color: 'success',
          title: 'Public',
          description: isArticle 
            ? 'Anyone can view, like, and comment on this article. It may appear in search results and recommendations.'
            : 'Your profile is visible to everyone and discoverable in search results.',
          features: [
            'Visible to everyone',
            'Appears in search',
            'Can be shared publicly',
            isArticle ? 'Comments and likes allowed' : 'Profile info visible',
          ],
        };
      case 'private':
        return {
          icon: lockClosed,
          color: 'danger',
          title: 'Private',
          description: isArticle
            ? 'Only you can view this article. It won\'t appear in search or recommendations.'
            : 'Your profile is only visible to you.',
          features: [
            'Only visible to you',
            'Hidden from search',
            'Cannot be shared',
            isArticle ? 'No public interactions' : 'Profile info hidden',
          ],
        };
      case 'followers_only':
        return {
          icon: people,
          color: 'warning',
          title: 'Followers Only',
          description: isArticle
            ? 'Only your followers can view and interact with this article.'
            : 'Only your followers can view your profile.',
          features: [
            'Visible to followers only',
            'Limited search visibility',
            'Restricted sharing',
            'Followers can interact',
          ],
        };
      default:
        return {
          icon: informationCircle,
          color: 'medium',
          title: 'Unknown',
          description: 'Privacy level not recognized.',
          features: [],
        };
    }
  };

  const info = getPrivacyInfo();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="flex items-center text-base">
          <IonIcon icon={info.icon} className={`mr-2 text-${info.color}`} />
          {info.title}
          <IonBadge color={info.color} className="ml-2">
            {level.replace('_', ' ')}
          </IonBadge>
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <p className="text-sm text-gray-700 mb-4">
          {info.description}
        </p>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
          <ul className="space-y-2">
            {info.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-gray-600">
                <IonIcon icon={checkmark} className={`mr-2 text-${info.color}`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  contentId,
  contentType = 'article',
  userId,
  size = 'default',
  showLabel = true,
  showDetails = false,
  disabled = false,
  className = '',
  onPrivacyChange,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<PrivacyLevel>('public');

  const {
    isPublic,
    privacyLevel,
    setPrivacyLevel,
    togglePrivacy,
    isLoading,
    error,
  } = usePrivacy({ contentId, contentType, userId });

  // Handle privacy level change
  const handlePrivacyChange = async (newLevel: PrivacyLevel) => {
    if (isLoading || disabled) return;
    
    try {
      await setPrivacyLevel(newLevel);
      setSelectedLevel(newLevel);
      onPrivacyChange?.(newLevel === 'public', newLevel);
      setShowPopover(false);
    } catch (err) {
      console.error('Error changing privacy level:', err);
    }
  };

  // Handle simple toggle
  const handleToggle = async () => {
    if (isLoading || disabled) return;
    
    try {
      await togglePrivacy();
      onPrivacyChange?.(!isPublic, !isPublic ? 'public' : 'private');
    } catch (err) {
      console.error('Error toggling privacy:', err);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'text-xs px-2 py-1',
      icon: 'w-3 h-3',
      text: 'text-xs',
    },
    default: {
      button: 'text-sm px-3 py-2',
      icon: 'w-4 h-4',
      text: 'text-sm',
    },
    large: {
      button: 'text-base px-4 py-3',
      icon: 'w-5 h-5',
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // Get current privacy icon
  const getPrivacyIcon = () => {
    switch (privacyLevel) {
      case 'public': return globe;
      case 'private': return lockClosed;
      case 'followers_only': return people;
      default: return globe;
    }
  };

  // Get privacy color
  const getPrivacyColor = () => {
    switch (privacyLevel) {
      case 'public': return 'success';
      case 'private': return 'danger';
      case 'followers_only': return 'warning';
      default: return 'medium';
    }
  };

  if (error) {
    return (
      <div className={`flex items-center text-red-600 ${config.text} ${className}`}>
        <IonIcon icon={warning} className={`mr-1 ${config.icon}`} />
        <span>Privacy error</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Simple Toggle Mode */}
      {!showDetails ? (
        <IonItem lines="none" className="--padding-start: 0">
          {showLabel && (
            <IonLabel>
              <div className="flex items-center">
                <IonIcon 
                  icon={getPrivacyIcon()} 
                  className={`mr-2 ${config.icon} text-${getPrivacyColor()}`} 
                />
                <span className={config.text}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </IonLabel>
          )}
          
          <IonToggle
            checked={isPublic}
            onIonChange={handleToggle}
            disabled={disabled || isLoading}
            slot="end"
          />
          
          {isLoading && (
            <IonSpinner name="dots" className="ml-2" />
          )}
        </IonItem>
      ) : (
        // Detailed Mode with Advanced Options
        <>
          <IonButton
            id={`privacy-trigger-${contentId}`}
            fill="outline"
            size={size}
            color={getPrivacyColor()}
            disabled={disabled || isLoading}
            className={config.button}
          >
            {isLoading ? (
              <IonSpinner name="dots" />
            ) : (
              <>
                <IonIcon icon={getPrivacyIcon()} slot="start" />
                {showLabel && (
                  <span className="capitalize">
                    {privacyLevel.replace('_', ' ')}
                  </span>
                )}
              </>
            )}
          </IonButton>

          <IonPopover
            trigger={`privacy-trigger-${contentId}`}
            isOpen={showPopover}
            onDidDismiss={() => setShowPopover(false)}
            className="privacy-popover"
          >
            <IonContent>
              <div className="p-4 min-w-80">
                <h3 className="font-semibold text-lg mb-4">Privacy Settings</h3>
                
                {/* Privacy Level Options */}
                <IonList>
                  <IonItem 
                    button
                    onClick={() => handlePrivacyChange('public')}
                    className={privacyLevel === 'public' ? 'bg-green-50' : ''}
                  >
                    <IonIcon icon={globe} slot="start" className="text-green-600" />
                    <IonLabel>
                      <h3>Public</h3>
                      <p>Everyone can view and interact</p>
                    </IonLabel>
                    {privacyLevel === 'public' && (
                      <IonIcon icon={checkmark} slot="end" className="text-green-600" />
                    )}
                  </IonItem>

                  <IonItem
                    button
                    onClick={() => handlePrivacyChange('followers_only')}
                    className={privacyLevel === 'followers_only' ? 'bg-orange-50' : ''}
                  >
                    <IonIcon icon={people} slot="start" className="text-orange-600" />
                    <IonLabel>
                      <h3>Followers Only</h3>
                      <p>Only followers can view</p>
                    </IonLabel>
                    {privacyLevel === 'followers_only' && (
                      <IonIcon icon={checkmark} slot="end" className="text-orange-600" />
                    )}
                  </IonItem>

                  <IonItem
                    button
                    onClick={() => handlePrivacyChange('private')}
                    className={privacyLevel === 'private' ? 'bg-red-50' : ''}
                  >
                    <IonIcon icon={lockClosed} slot="start" className="text-red-600" />
                    <IonLabel>
                      <h3>Private</h3>
                      <p>Only you can view</p>
                    </IonLabel>
                    {privacyLevel === 'private' && (
                      <IonIcon icon={checkmark} slot="end" className="text-red-600" />
                    )}
                  </IonItem>
                </IonList>

                {/* Privacy Information */}
                <div className="mt-4">
                  <PrivacyInfo level={privacyLevel} contentType={contentType} />
                </div>

                {/* Close Button */}
                <div className="mt-4">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setShowPopover(false)}
                  >
                    Close
                  </IonButton>
                </div>
              </div>
            </IonContent>
          </IonPopover>
        </>
      )}
    </div>
  );
};

export default PrivacyToggle;