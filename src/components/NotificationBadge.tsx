import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { 
  notificationsOutline, 
  notifications, 
  heart, 
  heartOutline, 
  chatbubbleOutline,
  chatbubble
} from 'ionicons/icons';
import { NotificationStats, NotificationType } from '@hooks/useNotifications';

interface NotificationBadgeProps {
  stats: NotificationStats;
  type?: 'all' | NotificationType;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showIcon?: boolean;
  showCount?: boolean;
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  stats,
  type = 'all',
  size = 'medium',
  color = 'danger',
  showIcon = true,
  showCount = true,
  animated = true,
  onClick,
  className = '',
}) => {
  // Calculate count based on type
  const getCount = (): number => {
    switch (type) {
      case 'like':
        return stats.byType.likes;
      case 'comment':
        return stats.byType.comments;
      case 'reply':
        return stats.byType.replies;
      case 'all':
      default:
        return stats.unread;
    }
  };

  // Get appropriate icon
  const getIcon = (): string => {
    const hasNotifications = getCount() > 0;
    
    switch (type) {
      case 'like':
        return hasNotifications ? heart : heartOutline;
      case 'comment':
      case 'reply':
        return hasNotifications ? chatbubble : chatbubbleOutline;
      case 'all':
      default:
        return hasNotifications ? notifications : notificationsOutline;
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-6 h-6',
      icon: 'w-4 h-4',
      badge: 'text-xs px-1 py-0.5',
      offset: '-top-1 -right-1',
    },
    medium: {
      container: 'w-8 h-8',
      icon: 'w-5 h-5',
      badge: 'text-xs px-1.5 py-0.5',
      offset: '-top-1 -right-1',
    },
    large: {
      container: 'w-10 h-10',
      icon: 'w-6 h-6',
      badge: 'text-sm px-2 py-1',
      offset: '-top-2 -right-2',
    },
  };

  const config = sizeConfig[size];
  const count = getCount();
  const icon = getIcon();

  // Format count display
  const formatCount = (count: number): string => {
    if (count === 0) return '0';
    if (count < 100) return count.toString();
    return '99+';
  };

  // Don't render if no notifications to show
  if (count === 0 && !showIcon) return null;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${config.container}
        ${onClick ? 'cursor-pointer hover:scale-110' : ''}
        ${animated && count > 0 ? 'animate-pulse' : ''}
        ${className}
        transition-all duration-200 ease-in-out
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${count} unread notifications`}
    >
      {/* Main icon */}
      {showIcon && (
        <IonIcon
          icon={icon}
          className={`
            ${config.icon}
            ${count > 0 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-blue-600'
            }
            transition-colors duration-200
          `}
        />
      )}

      {/* Notification badge */}
      {count > 0 && showCount && (
        <IonBadge
          color={color}
          className={`
            absolute ${config.offset} ${config.badge}
            rounded-full font-bold
            ${animated ? 'animate-bounce' : ''}
            min-w-[1.25rem] h-5 flex items-center justify-center
            shadow-lg border-2 border-white
          `}
        >
          {formatCount(count)}
        </IonBadge>
      )}

      {/* Pulse indicator for new notifications */}
      {count > 0 && animated && (
        <div
          className={`
            absolute ${config.offset}
            w-3 h-3 bg-red-500 rounded-full
            animate-ping opacity-75
          `}
        />
      )}
    </div>
  );
};

export default NotificationBadge;