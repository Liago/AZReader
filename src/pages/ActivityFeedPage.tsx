import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonToast,
} from '@ionic/react';
import {
  globeOutline,
  peopleOutline,
  personOutline,
  notifications,
  notificationsOutline,
} from 'ionicons/icons';
import ActivityFeedTimeline from '@components/ActivityFeedTimeline';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useActivityFeed } from '@hooks/useActivityFeed';
import { useHistory } from 'react-router-dom';

export interface ActivityFeedPageProps {
  className?: string;
}

const ActivityFeedPage: React.FC<ActivityFeedPageProps> = ({ className = '' }) => {
  const [activeSegment, setActiveSegment] = useState<'following' | 'global' | 'personal'>('following');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const history = useHistory();

  // Get unread activity counts for badges
  const { activities: personalActivities } = useActivityFeed({ 
    feedType: 'user', 
    userId: currentUserId,
    realTime: false,
  });

  const { activities: followingActivities } = useActivityFeed({ 
    feedType: 'following',
    realTime: false,
  });

  // Handle user navigation
  const handleUserClick = (userId: string) => {
    // Navigate to user profile
    history.push(`/profile/${userId}`);
  };

  // Handle target clicks (articles, comments, etc.)
  const handleTargetClick = (targetType: string, targetId: string) => {
    if (targetType === 'article') {
      history.push(`/article/${targetId}`);
    } else if (targetType === 'user') {
      history.push(`/profile/${targetId}`);
    }
  };

  // Handle action clicks (like, comment, share)
  const handleActionClick = (action: string, targetId: string) => {
    switch (action) {
      case 'like':
        // Navigate to article for liking
        history.push(`/article/${targetId}`);
        break;
      case 'comment':
        // Navigate to article comments section
        history.push(`/article/${targetId}#comments`);
        break;
      case 'share':
        // Show share options
        setToastMessage('Share functionality coming soon!');
        setShowToast(true);
        break;
      default:
        break;
    }
  };

  // Get unread count for badges
  const getUnreadCount = (feedType: 'following' | 'global' | 'personal'): number => {
    // This would typically come from a notification/read status system
    // For now, return a placeholder count
    switch (feedType) {
      case 'following':
        return (followingActivities?.length || 0) > 10 ? (followingActivities?.length || 0) - 10 : 0;
      case 'personal':
        return (personalActivities?.length || 0) > 5 ? (personalActivities?.length || 0) - 5 : 0;
      default:
        return 0;
    }
  };

  return (
    <IonPage className={`activity-feed-page ${className}`}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Activity Feed</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear">
              <IonIcon icon={activeSegment === 'personal' ? notifications : notificationsOutline} />
              {getUnreadCount('personal') > 0 && (
                <IonBadge color="danger" className="notification-badge">
                  {getUnreadCount('personal')}
                </IonBadge>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Feed Type Selector */}
        <div className="feed-selector">
          <IonSegment 
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value as any)}
          >
            <IonSegmentButton value="following">
              <div className="segment-content">
                <IonIcon icon={peopleOutline} />
                <IonLabel>Following</IonLabel>
                {getUnreadCount('following') > 0 && (
                  <IonBadge color="primary">
                    {getUnreadCount('following')}
                  </IonBadge>
                )}
              </div>
            </IonSegmentButton>
            
            <IonSegmentButton value="global">
              <div className="segment-content">
                <IonIcon icon={globeOutline} />
                <IonLabel>Global</IonLabel>
                {getUnreadCount('global') > 0 && (
                  <IonBadge color="primary">
                    {getUnreadCount('global')}
                  </IonBadge>
                )}
              </div>
            </IonSegmentButton>
            
            <IonSegmentButton value="personal">
              <div className="segment-content">
                <IonIcon icon={personOutline} />
                <IonLabel>Your Activity</IonLabel>
              </div>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Activity Timeline */}
        <div className="feed-content">
          {activeSegment === 'following' && (
            <ActivityFeedTimeline
              feedType="following"
              variant="default"
              showHeader={false}
              showFilters={true}
              showActions={true}
              enableRealtime={true}
              onUserClick={handleUserClick}
              onTargetClick={handleTargetClick}
              onActionClick={handleActionClick}
            />
          )}

          {activeSegment === 'global' && (
            <ActivityFeedTimeline
              feedType="global"
              variant="compact"
              showHeader={false}
              showFilters={true}
              showActions={true}
              enableRealtime={true}
              onUserClick={handleUserClick}
              onTargetClick={handleTargetClick}
              onActionClick={handleActionClick}
            />
          )}

          {activeSegment === 'personal' && (
            <ActivityFeedTimeline
              feedType="user"
              userId={currentUserId}
              variant="detailed"
              showHeader={false}
              showFilters={true}
              showActions={false}
              enableRealtime={false}
              onUserClick={handleUserClick}
              onTargetClick={handleTargetClick}
              onActionClick={handleActionClick}
            />
          )}
        </div>

        {/* Toast for user feedback */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color="medium"
        />
      </IonContent>

      <style>{`
        .activity-feed-page {
          --background: var(--ion-color-light);
        }

        .feed-selector {
          padding: 16px;
          background: white;
          border-bottom: 1px solid var(--ion-color-light);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .segment-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .segment-content ion-icon {
          font-size: 20px;
        }

        .segment-content ion-label {
          font-size: 12px;
          font-weight: 500;
        }

        .segment-content ion-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          font-size: 10px;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .feed-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--ion-color-light);
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 10px;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .activity-feed-page {
            --background: var(--ion-color-dark);
          }
          
          .feed-selector {
            background: var(--ion-color-dark);
            border-color: var(--ion-color-dark-shade);
          }
          
          .feed-content {
            background: var(--ion-color-dark);
          }
        }

        .ios.dark .activity-feed-page,
        .md.dark .activity-feed-page {
          --background: var(--ion-color-dark);
        }
        
        .ios.dark .feed-selector,
        .md.dark .feed-selector {
          background: var(--ion-color-dark);
          border-color: var(--ion-color-dark-shade);
        }
        
        .ios.dark .feed-content,
        .md.dark .feed-content {
          background: var(--ion-color-dark);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .segment-content ion-icon {
            font-size: 18px;
          }
          
          .segment-content ion-label {
            font-size: 11px;
          }
          
          .feed-selector {
            padding: 12px;
          }
        }

        /* Animation for segment transitions */
        .feed-content > * {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Loading states enhancement */
        .feed-content .activity-feed-timeline.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        /* Empty states enhancement */
        .feed-content .activity-feed-timeline.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
      `}</style>
    </IonPage>
  );
};

export default ActivityFeedPage;