import React, { createContext, useContext, useCallback, useState } from 'react';
import { useNotifications, UseNotificationsOptions, NotificationEvent, NotificationStats } from '@hooks/useNotifications';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';

interface NotificationContextType {
  // Notification data
  notifications: NotificationEvent[];
  stats: NotificationStats;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearOldNotifications: (olderThanDays?: number) => void;
  subscribe: (options?: { articleId?: string; userId?: string }) => void;
  unsubscribe: () => void;
  
  // UI state
  showNotificationCenter: boolean;
  setShowNotificationCenter: (show: boolean) => void;
  
  // Settings
  enableToasts: boolean;
  setEnableToasts: (enable: boolean) => void;
  enableBadges: boolean;
  setEnableBadges: (enable: boolean) => void;
  toastDuration: number;
  setToastDuration: (duration: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  options?: UseNotificationsOptions;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  options = {},
}) => {
  const userState = useSelector((state: RootState) => state.user);
  const isAuthenticated = !!userState.credentials?.user;

  // UI state
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Settings state (could be persisted to localStorage)
  const [enableToasts, setEnableToasts] = useState(true);
  const [enableBadges, setEnableBadges] = useState(true);
  const [toastDuration, setToastDuration] = useState(4000);

  // Use notifications hook with global settings
  const notificationOptions: UseNotificationsOptions = {
    ...options,
    enableToasts: enableToasts && isAuthenticated,
    enableBadges: enableBadges && isAuthenticated,
    toastDuration,
    maxNotifications: 50, // Global limit
    autoMarkAsRead: false,
  };

  const {
    notifications,
    stats,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearOldNotifications,
    subscribe,
    unsubscribe,
  } = useNotifications(notificationOptions);

  // Enhanced actions with UI integration
  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsRead(notificationId);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    // Optionally close notification center after marking all as read
    // setShowNotificationCenter(false);
  }, [markAllAsRead]);

  const handleClearNotifications = useCallback(() => {
    clearNotifications();
    setShowNotificationCenter(false);
  }, [clearNotifications]);

  const contextValue: NotificationContextType = {
    // Data
    notifications,
    stats,
    isConnected,
    isLoading,
    error,
    
    // Actions
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    clearNotifications: handleClearNotifications,
    clearOldNotifications,
    subscribe,
    unsubscribe,
    
    // UI state
    showNotificationCenter,
    setShowNotificationCenter,
    
    // Settings
    enableToasts,
    setEnableToasts,
    enableBadges,
    setEnableBadges,
    toastDuration,
    setToastDuration,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook for easier component integration
export const useGlobalNotifications = () => {
  const context = useNotificationContext();
  
  // Helper function to toggle notification center
  const toggleNotificationCenter = useCallback(() => {
    context.setShowNotificationCenter(!context.showNotificationCenter);
  }, [context]);

  // Helper to show notification center
  const showNotificationCenter = useCallback(() => {
    context.setShowNotificationCenter(true);
  }, [context]);

  // Helper to hide notification center
  const hideNotificationCenter = useCallback(() => {
    context.setShowNotificationCenter(false);
  }, [context]);

  return {
    ...context,
    toggleNotificationCenter,
    showNotificationCenter: showNotificationCenter,
    hideNotificationCenter,
  };
};

export default NotificationContext;