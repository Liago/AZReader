import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';
import { Database } from '@common/database-types';

// Type definitions for notifications
export type NotificationType = 'like' | 'comment' | 'reply';

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  articleId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: {
    commentId?: string;
    parentCommentId?: string;
    likeId?: string;
    content?: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    likes: number;
    comments: number;
    replies: number;
  };
}

export interface UseNotificationsOptions {
  articleId?: string;
  userId?: string;
  enableToasts?: boolean;
  enableBadges?: boolean;
  autoMarkAsRead?: boolean;
  toastDuration?: number;
  maxNotifications?: number;
}

export interface UseNotificationsReturn {
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
}

const useNotifications = (options: UseNotificationsOptions = {}): UseNotificationsReturn => {
  const {
    articleId,
    userId: optionsUserId,
    enableToasts = true,
    enableBadges = true,
    autoMarkAsRead = false,
    toastDuration = 4000,
    maxNotifications = 100,
  } = options;

  // State
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redux state for current user
  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = optionsUserId || userState.credentials?.user?.id;

  // Refs for cleanup
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast functionality
  const showToast = useCustomToast();

  // Calculate notification stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: {
      likes: notifications.filter(n => n.type === 'like').length,
      comments: notifications.filter(n => n.type === 'comment').length,
      replies: notifications.filter(n => n.type === 'reply').length,
    },
  };

  // Helper function to get user info
  const getUserInfo = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

      return {
        userName: profile?.name || 'Anonymous User',
        userEmail: profile?.email || 'unknown@example.com',
      };
    } catch (error) {
      console.warn('Could not fetch user profile:', error);
      return {
        userName: 'Anonymous User',
        userEmail: 'unknown@example.com',
      };
    }
  }, []);

  // Show toast notification
  const showNotificationToast = useCallback((notification: NotificationEvent) => {
    if (!enableToasts) return;

    // Clear existing toast timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Show toast with appropriate styling
    const toastColor = {
      like: 'success',
      comment: 'primary',
      reply: 'secondary',
    }[notification.type];

    showToast({
      message: notification.message,
      color: toastColor,
      duration: toastDuration,
    });
  }, [enableToasts, showToast, toastDuration]);

  // Create notification object
  const createNotification = useCallback(async (
    type: NotificationType,
    payload: any,
    articleId: string
  ): Promise<NotificationEvent | null> => {
    const userId = payload.new?.user_id || payload.old?.user_id;
    
    // Don't notify about our own actions
    if (userId === currentUserId) return null;

    const userInfo = await getUserInfo(userId);
    const timestamp = new Date();
    const notificationId = `${type}_${payload.new?.id || payload.old?.id}_${timestamp.getTime()}`;

    let message = '';
    let data: any = {};

    switch (type) {
      case 'like':
        message = `${userInfo.userName} liked your article`;
        data = { likeId: payload.new?.id };
        break;
      case 'comment':
        const commentContent = payload.new?.content || '';
        const truncatedContent = commentContent.length > 50 
          ? commentContent.substring(0, 50) + '...' 
          : commentContent;
        message = `${userInfo.userName} commented: "${truncatedContent}"`;
        data = { 
          commentId: payload.new?.id,
          content: commentContent,
        };
        break;
      case 'reply':
        const replyContent = payload.new?.content || '';
        const truncatedReply = replyContent.length > 50 
          ? replyContent.substring(0, 50) + '...' 
          : replyContent;
        message = `${userInfo.userName} replied: "${truncatedReply}"`;
        data = { 
          commentId: payload.new?.id,
          parentCommentId: payload.new?.parent_id,
          content: replyContent,
        };
        break;
    }

    return {
      id: notificationId,
      type,
      articleId,
      userId,
      userEmail: userInfo.userEmail,
      userName: userInfo.userName,
      message,
      timestamp,
      read: autoMarkAsRead,
      data,
    };
  }, [currentUserId, getUserInfo, autoMarkAsRead]);

  // Handle likes subscription
  const handleLikeChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Database['public']['Tables']['likes']['Row']>
  ) => {
    if (payload.eventType !== 'INSERT') return;

    const articleId = payload.new?.article_id;
    if (!articleId) return;

    const notification = await createNotification('like', payload, articleId);
    if (notification) {
      setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
      showNotificationToast(notification);
    }
  }, [createNotification, maxNotifications, showNotificationToast]);

  // Handle comments subscription
  const handleCommentChange = useCallback(async (
    payload: RealtimePostgresChangesPayload<Database['public']['Tables']['comments']['Row']>
  ) => {
    if (payload.eventType !== 'INSERT') return;

    const articleId = payload.new?.article_id;
    const parentId = payload.new?.parent_id;
    
    if (!articleId) return;

    const type: NotificationType = parentId ? 'reply' : 'comment';
    const notification = await createNotification(type, payload, articleId);
    
    if (notification) {
      setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
      showNotificationToast(notification);
    }
  }, [createNotification, maxNotifications, showNotificationToast]);

  // Subscribe to real-time changes
  const subscribe = useCallback((subscribeOptions?: { articleId?: string; userId?: string }) => {
    const targetArticleId = subscribeOptions?.articleId || articleId;
    const targetUserId = subscribeOptions?.userId || currentUserId;

    if (!currentUserId) {
      console.warn('Cannot subscribe to notifications: user not authenticated');
      return;
    }

    // Unsubscribe from existing channels
    unsubscribe();

    setIsLoading(true);
    setError(null);

    try {
      const channels: RealtimeChannel[] = [];

      // Subscribe to likes for user's articles
      const likesChannel = supabase
        .channel('likes_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'likes',
            filter: targetArticleId ? `article_id=eq.${targetArticleId}` : undefined,
          },
          handleLikeChange
        )
        .subscribe((status) => {
          console.log('Likes subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setError('Failed to subscribe to likes notifications');
          }
        });

      channels.push(likesChannel);

      // Subscribe to comments for user's articles
      const commentsChannel = supabase
        .channel('comments_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'comments',
            filter: targetArticleId ? `article_id=eq.${targetArticleId}` : undefined,
          },
          handleCommentChange
        )
        .subscribe((status) => {
          console.log('Comments subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setError('Failed to subscribe to comments notifications');
          }
        });

      channels.push(commentsChannel);

      channelsRef.current = channels;

    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      setError('Failed to initialize notifications');
    } finally {
      setIsLoading(false);
    }
  }, [articleId, currentUserId, handleLikeChange, handleCommentChange]);

  // Unsubscribe from all channels
  const unsubscribe = useCallback(() => {
    channelsRef.current.forEach(channel => {
      channel.unsubscribe();
    });
    channelsRef.current = [];
    setIsConnected(false);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear old notifications
  const clearOldNotifications = useCallback((olderThanDays: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    setNotifications(prev =>
      prev.filter(notification => notification.timestamp > cutoffDate)
    );
  }, []);

  // Auto-subscribe when user is available
  useEffect(() => {
    if (currentUserId && (articleId || enableBadges)) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [currentUserId, articleId, enableBadges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [unsubscribe]);

  // Auto-cleanup old notifications
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      clearOldNotifications(7); // Clear notifications older than 7 days
    }, 24 * 60 * 60 * 1000); // Check daily

    return () => clearInterval(cleanupInterval);
  }, [clearOldNotifications]);

  return {
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
  };
};

export default useNotifications;