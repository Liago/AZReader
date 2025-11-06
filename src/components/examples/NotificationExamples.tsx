import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonItem,
  IonLabel,
  IonToggle,
  IonRange,
  IonText,
} from '@ionic/react';
import { NotificationProvider, useGlobalNotifications } from '@context/NotificationContext';
import NotificationIntegration from '@components/NotificationIntegration';
import NotificationBadge from '@components/NotificationBadge';
import NotificationCenter from '@components/NotificationCenter';
import useNotifications from '@hooks/useNotifications';

// Example 1: Simple notification button in header
const HeaderWithNotifications: React.FC = () => {
  const { stats } = useGlobalNotifications();

  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>AZReader</IonTitle>
        <IonButtons slot="end">
          <NotificationIntegration size="medium" />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

// Example 2: Notification settings panel
const NotificationSettings: React.FC = () => {
  const {
    enableToasts,
    setEnableToasts,
    enableBadges,
    setEnableBadges,
    toastDuration,
    setToastDuration,
    stats,
    isConnected,
  } = useGlobalNotifications();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Notification Settings</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Connection status */}
        <IonItem>
          <IonLabel>
            <h3>Real-time Connection</h3>
            <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
          </IonLabel>
          <div slot="end" className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </IonItem>

        {/* Toast notifications toggle */}
        <IonItem>
          <IonLabel>
            <h3>Toast Notifications</h3>
            <p>Show popup notifications for new activity</p>
          </IonLabel>
          <IonToggle
            checked={enableToasts}
            onIonChange={(e) => setEnableToasts(e.detail.checked)}
            slot="end"
          />
        </IonItem>

        {/* Badge notifications toggle */}
        <IonItem>
          <IonLabel>
            <h3>Badge Notifications</h3>
            <p>Show notification counts on icons</p>
          </IonLabel>
          <IonToggle
            checked={enableBadges}
            onIonChange={(e) => setEnableBadges(e.detail.checked)}
            slot="end"
          />
        </IonItem>

        {/* Toast duration setting */}
        {enableToasts && (
          <IonItem>
            <IonLabel>
              <h3>Toast Duration</h3>
              <p>{(toastDuration / 1000).toFixed(1)} seconds</p>
            </IonLabel>
            <IonRange
              min={1000}
              max={10000}
              step={500}
              value={toastDuration}
              onIonInput={(e) => setToastDuration(e.detail.value as number)}
              slot="end"
              className="w-32"
            />
          </IonItem>
        )}

        {/* Stats display */}
        <IonItem>
          <IonLabel>
            <h3>Notification Stats</h3>
            <p>Total: {stats.total}, Unread: {stats.unread}</p>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );
};

// Example 3: Article page with notifications for specific article
const ArticlePageWithNotifications: React.FC<{ articleId: string }> = ({ articleId }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Article-specific notifications
  const {
    stats,
    notifications,
    isConnected,
    markAllAsRead,
  } = useNotifications({
    articleId,
    enableToasts: true,
    enableBadges: true,
    toastDuration: 3000,
  });

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Article View</IonTitle>
          <IonButtons slot="end">
            <IonButton
              fill="clear"
              onClick={() => setShowNotifications(true)}
            >
              <NotificationBadge
                stats={stats}
                size="medium"
                showIcon={true}
                showCount={true}
                animated={true}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Article Content</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>This article has {stats.total} total notifications</p>
            <p>Connection status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
            
            {stats.unread > 0 && (
              <IonButton onClick={markAllAsRead} size="small" fill="outline">
                Mark all {stats.unread} as read
              </IonButton>
            )}
          </IonCardContent>
        </IonCard>

        {/* Article content would go here */}
        <IonCard>
          <IonCardContent>
            <h2>Article Title</h2>
            <p>Article content goes here...</p>
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* Article-specific notification center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        options={{ articleId }}
      />
    </>
  );
};

// Example 4: Different badge types
const BadgeExamples: React.FC = () => {
  // Mock stats for demonstration
  const mockStats = {
    total: 15,
    unread: 8,
    byType: {
      likes: 5,
      comments: 7,
      replies: 3,
    },
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Notification Badge Examples</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="space-y-4">
          {/* All notification types */}
          <div className="flex items-center space-x-4">
            <IonLabel>All notifications:</IonLabel>
            <NotificationBadge stats={mockStats} type="all" size="small" />
            <NotificationBadge stats={mockStats} type="all" size="medium" />
            <NotificationBadge stats={mockStats} type="all" size="large" />
          </div>

          {/* Likes only */}
          <div className="flex items-center space-x-4">
            <IonLabel>Likes only:</IonLabel>
            <NotificationBadge stats={mockStats} type="like" size="small" color="danger" />
            <NotificationBadge stats={mockStats} type="like" size="medium" color="danger" />
            <NotificationBadge stats={mockStats} type="like" size="large" color="danger" />
          </div>

          {/* Comments only */}
          <div className="flex items-center space-x-4">
            <IonLabel>Comments only:</IonLabel>
            <NotificationBadge stats={mockStats} type="comment" size="small" color="primary" />
            <NotificationBadge stats={mockStats} type="comment" size="medium" color="primary" />
            <NotificationBadge stats={mockStats} type="comment" size="large" color="primary" />
          </div>

          {/* Without animation */}
          <div className="flex items-center space-x-4">
            <IonLabel>No animation:</IonLabel>
            <NotificationBadge stats={mockStats} animated={false} />
          </div>

          {/* Icon only */}
          <div className="flex items-center space-x-4">
            <IonLabel>Icon only:</IonLabel>
            <NotificationBadge stats={mockStats} showCount={false} />
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Main examples page component
const NotificationExamples: React.FC = () => {
  return (
    <NotificationProvider>
      <IonPage>
        <HeaderWithNotifications />
        
        <IonContent>
          <div className="p-4 space-y-4">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Notification System Examples</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p>
                    This page demonstrates various ways to use the notification system
                    in your AZReader application.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>

            <BadgeExamples />
            <NotificationSettings />
          </div>
        </IonContent>
      </IonPage>
    </NotificationProvider>
  );
};

export default NotificationExamples;
export {
  HeaderWithNotifications,
  NotificationSettings,
  ArticlePageWithNotifications,
  BadgeExamples,
};