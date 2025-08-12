import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useActivityFeed, ActivityActionType, ActivityTargetType } from '@hooks/useActivityFeed';
import { supabase } from '@common/supabase';

interface ActivityTrackingOptions {
  enableAutoTracking?: boolean;
  trackingDelay?: number; // Delay before tracking activity (to avoid spam)
  batchActivities?: boolean; // Batch similar activities together
}

interface UseActivityTrackingReturn {
  // Manual tracking methods
  trackArticleLike: (articleId: string, liked: boolean) => Promise<void>;
  trackComment: (articleId: string, commentId: string, content: string) => Promise<void>;
  trackArticleCreated: (articleId: string, title: string, content: string) => Promise<void>;
  trackArticleShared: (articleId: string, method: string) => Promise<void>;
  trackUserFollow: (userId: string, followed: boolean) => Promise<void>;
  trackProfileUpdate: (changes: Record<string, any>) => Promise<void>;
  
  // Utility methods
  createBatchedActivity: (activities: Array<{
    action_type: ActivityActionType;
    target_type: ActivityTargetType;
    target_id: string;
    metadata?: Record<string, any>;
    content_preview?: string;
  }>) => Promise<void>;
  
  // State
  isTracking: boolean;
  pendingActivities: number;
}

export const useActivityTracking = (options: ActivityTrackingOptions = {}): UseActivityTrackingReturn => {
  const {
    enableAutoTracking = true,
    trackingDelay = 500,
    batchActivities = true
  } = options;

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  
  const { createActivity } = useActivityFeed();
  
  // Refs for batching and debouncing
  const pendingActivitiesRef = useRef<Map<string, any>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isTrackingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Process pending activities
  const processPendingActivities = useCallback(async () => {
    if (pendingActivitiesRef.current.size === 0) return;

    isTrackingRef.current = true;
    const activities = Array.from(pendingActivitiesRef.current.values());
    
    try {
      // Group similar activities for batching
      const groupedActivities = new Map<string, any[]>();
      
      activities.forEach(activity => {
        const key = `${activity.action_type}_${activity.target_type}_${activity.target_id}`;
        if (!groupedActivities.has(key)) {
          groupedActivities.set(key, []);
        }
        groupedActivities.get(key)!.push(activity);
      });

      // Create activities
      for (const [key, group] of groupedActivities) {
        if (batchActivities && group.length > 1) {
          // Create a single aggregated activity
          const firstActivity = group[0];
          const count = group.length;
          
          await createActivity({
            ...firstActivity,
            metadata: {
              ...firstActivity.metadata,
              batch_count: count,
              batch_key: key
            }
          });
        } else {
          // Create individual activities
          for (const activity of group) {
            await createActivity(activity);
          }
        }
      }
      
      pendingActivitiesRef.current.clear();
      setPendingCount(0);
      
    } catch (error) {
      console.error('Error processing pending activities:', error);
    } finally {
      isTrackingRef.current = false;
    }
  }, [createActivity, batchActivities]);

  // Schedule activity processing
  const scheduleProcessing = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setPendingCount(pendingActivitiesRef.current.size);
    
    timeoutRef.current = setTimeout(() => {
      processPendingActivities();
    }, trackingDelay);
  }, [processPendingActivities, trackingDelay]);

  // Add activity to pending queue
  const queueActivity = useCallback((activity: {
    action_type: ActivityActionType;
    target_type: ActivityTargetType;
    target_id: string;
    metadata?: Record<string, any>;
    content_preview?: string;
  }) => {
    if (!currentUserId) return;

    const key = `${activity.action_type}_${activity.target_id}_${Date.now()}`;
    pendingActivitiesRef.current.set(key, {
      ...activity,
      visibility: 'public'
    });
    
    scheduleProcessing();
  }, [currentUserId, scheduleProcessing]);

  // Track article like/unlike
  const trackArticleLike = useCallback(async (articleId: string, liked: boolean) => {
    if (!enableAutoTracking || !currentUserId) return;

    // Get article info for preview
    let contentPreview = '';
    try {
      const { data: article } = await supabase
        .from('articles')
        .select('title, content')
        .eq('id', articleId)
        .single();
      
      contentPreview = article?.title || article?.content?.substring(0, 100) || '';
    } catch (error) {
      console.warn('Could not fetch article for preview:', error);
    }

    queueActivity({
      action_type: liked ? 'article_liked' : 'article_unliked',
      target_type: 'article',
      target_id: articleId,
      content_preview,
      metadata: {
        liked,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Track comment creation
  const trackComment = useCallback(async (articleId: string, commentId: string, content: string) => {
    if (!enableAutoTracking || !currentUserId) return;

    queueActivity({
      action_type: 'comment_created',
      target_type: 'article',
      target_id: articleId,
      content_preview: content.substring(0, 100),
      metadata: {
        comment_id: commentId,
        comment_length: content.length,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Track article creation
  const trackArticleCreated = useCallback(async (articleId: string, title: string, content: string) => {
    if (!enableAutoTracking || !currentUserId) return;

    queueActivity({
      action_type: 'article_created',
      target_type: 'article',
      target_id: articleId,
      content_preview: title || content.substring(0, 100),
      metadata: {
        title,
        content_length: content.length,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Track article sharing
  const trackArticleShared = useCallback(async (articleId: string, method: string) => {
    if (!enableAutoTracking || !currentUserId) return;

    // Get article info
    let contentPreview = '';
    try {
      const { data: article } = await supabase
        .from('articles')
        .select('title')
        .eq('id', articleId)
        .single();
      
      contentPreview = article?.title || '';
    } catch (error) {
      console.warn('Could not fetch article for preview:', error);
    }

    queueActivity({
      action_type: 'article_shared',
      target_type: 'article',
      target_id: articleId,
      content_preview,
      metadata: {
        share_method: method,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Track user follow/unfollow
  const trackUserFollow = useCallback(async (userId: string, followed: boolean) => {
    if (!enableAutoTracking || !currentUserId) return;

    // Get user info
    let contentPreview = '';
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      contentPreview = user?.email?.split('@')[0] || '';
    } catch (error) {
      console.warn('Could not fetch user for preview:', error);
    }

    queueActivity({
      action_type: followed ? 'user_followed' : 'user_unfollowed',
      target_type: 'user',
      target_id: userId,
      content_preview,
      metadata: {
        followed,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Track profile updates
  const trackProfileUpdate = useCallback(async (changes: Record<string, any>) => {
    if (!enableAutoTracking || !currentUserId) return;

    const changeKeys = Object.keys(changes);
    const contentPreview = `Updated ${changeKeys.join(', ')}`;

    queueActivity({
      action_type: 'profile_updated',
      target_type: 'user',
      target_id: currentUserId,
      content_preview,
      metadata: {
        changes: changeKeys,
        timestamp: new Date().toISOString()
      }
    });
  }, [enableAutoTracking, currentUserId, queueActivity]);

  // Create multiple activities at once
  const createBatchedActivity = useCallback(async (activities: Array<{
    action_type: ActivityActionType;
    target_type: ActivityTargetType;
    target_id: string;
    metadata?: Record<string, any>;
    content_preview?: string;
  }>) => {
    if (!currentUserId) return;

    activities.forEach((activity, index) => {
      const key = `batch_${Date.now()}_${index}`;
      pendingActivitiesRef.current.set(key, {
        ...activity,
        visibility: 'public'
      });
    });

    scheduleProcessing();
  }, [currentUserId, scheduleProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Process any remaining activities immediately
      processPendingActivities();
    };
  }, [processPendingActivities]);

  // Auto-track common interactions via event listeners
  useEffect(() => {
    if (!enableAutoTracking) return;

    const handleBeforeUnload = () => {
      // Process pending activities before page unload
      processPendingActivities();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableAutoTracking, processPendingActivities]);

  return {
    // Manual tracking methods
    trackArticleLike,
    trackComment,
    trackArticleCreated,
    trackArticleShared,
    trackUserFollow,
    trackProfileUpdate,
    
    // Utility methods
    createBatchedActivity,
    
    // State
    isTracking: isTrackingRef.current,
    pendingActivities: pendingCount,
  };
};