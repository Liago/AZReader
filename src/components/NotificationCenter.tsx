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
  IonPopover,
  IonTitle,
  IonToolbar,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  close,
  checkmarkDone,
  trash,
  heart,
  chatbubble,
  person,
  timeOutline,
  ellipsisVertical,
  refreshOutline,
} from 'ionicons/icons';
import useNotifications, {
  NotificationEvent,
  NotificationType,
  UseNotificationsOptions,
} from '@hooks/useNotifications';
import moment from 'moment';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  options?: UseNotificationsOptions;
  showAsModal?: boolean;
  className?: string;
}

interface NotificationItemProps {
  notification: NotificationEvent;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

// Individual notification item component
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'like': return heart;
      case 'comment': return chatbubble;
      case 'reply': return chatbubble;
      default: return person;
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'like': return 'text-red-500 bg-red-50';
      case 'comment': return 'text-blue-500 bg-blue-50';
      case 'reply': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return moment(timestamp).format('MMM DD');
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    setShowActions(false);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(notification.id);
    setShowActions(false);
  };

  return (
    <div
      className={`
        relative border-l-4 transition-all duration-200
        ${notification.read 
          ? 'border-gray-200 bg-gray-50 opacity-75' 
          : 'border-blue-500 bg-white shadow-sm'
        }
        ${compact ? 'p-3' : 'p-4'}
        hover:shadow-md
      `}
    >
      <div className="flex items-start justify-between">
        {/* Notification content */}
        <div className="flex items-start flex-1">
          {/* Icon */}
          <div 
            className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${getNotificationColor(notification.type)}
              ${compact ? 'w-8 h-8' : 'w-10 h-10'}
            `}
          >
            <IonIcon 
              icon={getNotificationIcon(notification.type)} 
              className={compact ? 'w-4 h-4' : 'w-5 h-5'} 
            />
          </div>

          {/* Message and details */}
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {notification.message}
            </p>
            
            <div className="flex items-center mt-1 space-x-2">
              <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                {formatTime(notification.timestamp)}
              </span>
              
              <IonBadge 
                color="light" 
                className={compact ? 'text-xs' : 'text-sm'}
              >
                {notification.type}
              </IonBadge>
              
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative ml-2">
          <IonButton
            fill="clear"
            size="small"
            onClick={() => setShowActions(!showActions)}
          >
            <IonIcon icon={ellipsisVertical} />
          </IonButton>

          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl z-10 border">
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <IonIcon icon={checkmarkDone} className="mr-2" />
                  Mark as read
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <IonIcon icon={trash} className="mr-2" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyNotifications: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
      <IonIcon icon={checkmarkDone} className="text-gray-400 text-3xl" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
    <p className="text-gray-600 max-w-sm">
      You have no new notifications. We'll let you know when something happens.
    </p>
  </div>
);

// Main NotificationCenter component
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  options = {},
  showAsModal = true,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const {
    notifications,
    stats,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    subscribe,
  } = useNotifications(options);

  // Filter notifications based on selected type
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  // Handle refresh
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    subscribe();
    event.detail.complete();
  };

  // Delete notification (local only - notifications are ephemeral)
  const handleDeleteNotification = (id: string) => {
    // Remove from local state - in a real app you might want to persist this
    // For now, we'll just mark as read
    markAsRead(id);
  };

  const content = (
    <IonContent className={className}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Connection status and stats */}
      <IonCard>
        <IonCardHeader>
          <div className="flex items-center justify-between">
            <IonCardTitle className="text-lg">Notifications</IonCardTitle>
            <div className="flex items-center space-x-2">
              <div className={`
                w-2 h-2 rounded-full 
                ${isConnected ? 'bg-green-500' : 'bg-red-500'}
              `} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </IonCardHeader>
        
        <IonCardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-xs text-gray-600">Unread</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.byType.likes}</div>
              <div className="text-xs text-gray-600">Likes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.byType.comments + stats.byType.replies}
              </div>
              <div className="text-xs text-gray-600">Comments</div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Filter controls */}
      <IonCard>
        <IonCardContent>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as any)}>
            <IonSegmentButton value="all">
              <IonLabel>All</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="like">
              <IonLabel>Likes</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="comment">
              <IonLabel>Comments</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="reply">
              <IonLabel>Replies</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonCardContent>
      </IonCard>

      {/* Action buttons */}
      {stats.unread > 0 && (
        <IonCard>
          <IonCardContent>
            <div className="flex space-x-2">
              <IonButton 
                size="small" 
                fill="outline" 
                onClick={markAllAsRead}
                className="flex-1"
              >
                <IonIcon icon={checkmarkDone} slot="start" />
                Mark All Read
              </IonButton>
              <IonButton 
                size="small" 
                fill="outline" 
                color="danger" 
                onClick={clearNotifications}
                className="flex-1"
              >
                <IonIcon icon={trash} slot="start" />
                Clear All
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Error state */}
      {error && (
        <IonCard>
          <IonCardContent>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton size="small" fill="outline" onClick={() => subscribe()}>
              <IonIcon icon={refreshOutline} slot="start" />
              Retry
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <IonSpinner />
        </div>
      )}

      {/* Notifications list */}
      {!isLoading && (
        <div className="space-y-1">
          {filteredNotifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={handleDeleteNotification}
              />
            ))
          )}
        </div>
      )}
    </IonContent>
  );

  if (showAsModal) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Notifications</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        {content}
      </IonModal>
    );
  }

  return content;
};

export default NotificationCenter;