import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { notifications, notificationsOutline } from 'ionicons/icons';
import NotificationBadge from './NotificationBadge';
import NotificationCenter from './NotificationCenter';
import { useGlobalNotifications } from '@context/NotificationContext';

interface NotificationIntegrationProps {
  showAsPopover?: boolean;
  placement?: 'top' | 'bottom' | 'start' | 'end';
  trigger?: string; // ID of trigger element for popover
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const NotificationIntegration: React.FC<NotificationIntegrationProps> = ({
  showAsPopover = false,
  placement = 'bottom',
  trigger,
  size = 'medium',
  className = '',
}) => {
  const {
    stats,
    showNotificationCenter,
    toggleNotificationCenter,
    hideNotificationCenter,
  } = useGlobalNotifications();

  const buttonId = trigger || 'notification-button';

  return (
    <>
      {/* Notification Button with Badge */}
      <div className={`relative ${className}`}>
        <IonButton
          id={buttonId}
          fill="clear"
          onClick={toggleNotificationCenter}
          className="relative p-2"
        >
          <NotificationBadge
            stats={stats}
            size={size}
            showIcon={true}
            showCount={true}
            animated={true}
          />
        </IonButton>
      </div>

      {/* Notification Center Modal/Popover */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={hideNotificationCenter}
        showAsModal={!showAsPopover}
      />
    </>
  );
};

export default NotificationIntegration;