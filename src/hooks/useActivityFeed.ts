import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

export type ActivityActionType = 
  | 'article_created'
  | 'article_liked' 
  | 'article_unliked'
  | 'article_shared'
  | 'comment_created'
  | 'comment_liked'
  | 'comment_unliked'
  | 'user_followed'
  | 'user_unfollowed'
  | 'profile_updated';

export type ActivityTargetType = 'article' | 'comment' | 'user';

export type ActivityVisibility = 'public' | 'followers' | 'private';

export interface ActivityItem {
  id: string;
  actor_id: string;
  action_type: ActivityActionType;
  target_type: ActivityTargetType;
  target_id: string;
  metadata: Record<string, any>;
  content_preview?: string;
  visibility: ActivityVisibility;
  group_key?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  actor?: {
    id: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ActivityAggregate {
  id: string;
  group_key: string;
  actor_id: string;
  action_type: ActivityActionType;
  target_type: ActivityTargetType;
  target_id: string;
  count: number;
  sample_actors: string[];
  title: string;
  description: string;
  thumbnail_url?: string;
  first_activity_at: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  actors?: Array<{
    id: string;
    email: string;
    avatar_url?: string;
  }>;
  latest_activity?: ActivityItem;
}

export interface ActivityFeedOptions {
  userId?: string;
  feedType?: 'global' | 'following' | 'user';
  targetType?: ActivityTargetType;
  targetId?: string;
  aggregated?: boolean;
  limit?: number;
  realTime?: boolean;
}

export interface UseActivityFeedReturn {
  // Data
  activities: ActivityItem[];
  aggregates: ActivityAggregate[];
  hasMore: boolean;
  
  // Actions
  loadActivities: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createActivity: (params: CreateActivityParams) => Promise<string | null>;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  isFollowing: (userId: string) => Promise<boolean>;
  getFollowing: () => Promise<string[]>;
  getFollowers: () => Promise<string[]>;
  
  // State
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export interface CreateActivityParams {
  action_type: ActivityActionType;
  target_type: ActivityTargetType;
  target_id: string;
  metadata?: Record<string, any>;
  content_preview?: string;
  visibility?: ActivityVisibility;
}

export const useActivityFeed = (options: ActivityFeedOptions = {}): UseActivityFeedReturn => {
  const {
    userId,
    feedType = 'global',
    targetType,
    targetId,
    aggregated = true,
    limit = 20,
    realTime = false
  } = options;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [aggregates, setAggregates] = useState<ActivityAggregate[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userId || userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Load activities from database
  const loadActivities = useCallback(async (isMore = false) => {
    if (!isMore) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);

    try {
      let query;
      const currentOffset = isMore ? offset : 0;

      if (aggregated) {
        // Load aggregated activities
        query = supabase
          .from('activity_aggregates')
          .select(`
            *,
            actors:sample_actors(id, email, avatar_url)
          `)
          .order('last_activity_at', { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);

        // Filter based on feed type
        if (feedType === 'user' && currentUserId) {
          query = query.eq('actor_id', currentUserId);
        }
        
        if (targetType && targetId) {
          query = query.eq('target_type', targetType).eq('target_id', targetId);
        }

      } else {
        // Load individual activities
        query = supabase
          .from('activity_feed')
          .select(`
            *,
            actor:users!activity_feed_actor_id_fkey(id, email, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);

        // Filter based on feed type
        if (feedType === 'user' && currentUserId) {
          query = query.eq('actor_id', currentUserId);
        } else if (feedType === 'following' && currentUserId) {
          // Get activities from followed users
          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', currentUserId);
          
          if (following && following.length > 0) {
            const followingIds = following.map(f => f.following_id);
            query = query.in('actor_id', followingIds);
          } else {
            // No following, return empty
            if (aggregated) {
              setAggregates([]);
            } else {
              setActivities([]);
            }
            return;
          }
        }

        if (targetType && targetId) {
          query = query.eq('target_type', targetType).eq('target_id', targetId);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const newItems = data || [];

      if (aggregated) {
        if (isMore) {
          setAggregates(prev => [...prev, ...newItems]);
        } else {
          setAggregates(newItems);
        }
      } else {
        if (isMore) {
          setActivities(prev => [...prev, ...newItems]);
        } else {
          setActivities(newItems);
        }
      }

      setHasMore(newItems.length === limit);
      setOffset(prev => prev + newItems.length);

    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
      showToast({
        message: 'Failed to load activity feed',
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [aggregated, feedType, currentUserId, targetType, targetId, limit, offset, showToast]);

  // Load more activities
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    await loadActivities(true);
  }, [hasMore, isLoadingMore, isLoading, loadActivities]);

  // Refresh activities
  const refresh = useCallback(async () => {
    setOffset(0);
    await loadActivities(false);
  }, [loadActivities]);

  // Create a new activity
  const createActivity = useCallback(async (params: CreateActivityParams): Promise<string | null> => {
    if (!currentUserId) return null;

    try {
      const { data, error } = await supabase.rpc('create_activity', {
        p_actor_id: currentUserId,
        p_action_type: params.action_type,
        p_target_type: params.target_type,
        p_target_id: params.target_id,
        p_metadata: params.metadata || {},
        p_content_preview: params.content_preview,
        p_visibility: params.visibility || 'public'
      });

      if (error) throw error;

      // Refresh the feed to show new activity
      await refresh();

      return data;

    } catch (err) {
      console.error('Error creating activity:', err);
      setError('Failed to create activity');
      return null;
    }
  }, [currentUserId, refresh]);

  // Follow a user
  const followUser = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentUserId || currentUserId === targetUserId) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

      if (error) throw error;

      // Create follow activity
      await createActivity({
        action_type: 'user_followed',
        target_type: 'user',
        target_id: targetUserId,
        metadata: { follower_id: currentUserId },
        visibility: 'public'
      });

      showToast({
        message: 'User followed successfully',
        color: 'success',
        duration: 2000,
      });

      return true;

    } catch (err) {
      console.error('Error following user:', err);
      showToast({
        message: 'Failed to follow user',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [currentUserId, createActivity, showToast]);

  // Unfollow a user
  const unfollowUser = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Create unfollow activity
      await createActivity({
        action_type: 'user_unfollowed',
        target_type: 'user',
        target_id: targetUserId,
        metadata: { follower_id: currentUserId },
        visibility: 'private'
      });

      showToast({
        message: 'User unfollowed',
        color: 'success',
        duration: 2000,
      });

      return true;

    } catch (err) {
      console.error('Error unfollowing user:', err);
      showToast({
        message: 'Failed to unfollow user',
        color: 'danger',
        duration: 3000,
      });
      return false;
    }
  }, [currentUserId, createActivity, showToast]);

  // Check if current user is following another user
  const isFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentUserId || currentUserId === targetUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;

    } catch (err) {
      console.error('Error checking follow status:', err);
      return false;
    }
  }, [currentUserId]);

  // Get list of users current user is following
  const getFollowing = useCallback(async (): Promise<string[]> => {
    if (!currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      if (error) throw error;

      return data?.map(f => f.following_id) || [];

    } catch (err) {
      console.error('Error getting following list:', err);
      return [];
    }
  }, [currentUserId]);

  // Get list of current user's followers
  const getFollowers = useCallback(async (): Promise<string[]> => {
    if (!currentUserId) return [];

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', currentUserId);

      if (error) throw error;

      return data?.map(f => f.follower_id) || [];

    } catch (err) {
      console.error('Error getting followers list:', err);
      return [];
    }
  }, [currentUserId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!realTime || !currentUserId) return;

    const subscription = supabase
      .channel('activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        },
        (payload) => {
          // Add new activity to the feed if it matches our criteria
          const newActivity = payload.new as ActivityItem;
          
          if (feedType === 'global' || 
              (feedType === 'user' && newActivity.actor_id === currentUserId)) {
            // Refresh to get properly joined data
            refresh();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [realTime, currentUserId, feedType, refresh]);

  // Initial load
  useEffect(() => {
    loadActivities();
  }, [feedType, currentUserId, targetType, targetId, aggregated]);

  return {
    // Data
    activities,
    aggregates,
    hasMore,
    
    // Actions
    loadActivities: () => loadActivities(false),
    loadMore,
    refresh,
    createActivity,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowing,
    getFollowers,
    
    // State
    isLoading,
    isLoadingMore,
    error,
  };
};