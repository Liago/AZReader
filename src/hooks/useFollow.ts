import { useState, useCallback, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean; // Mutual follow check
}

export interface UserFollowInfo {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean | null;
  follower_count: number;
  following_count: number;
  created_at: string | null;
}

export interface UseFollowOptions {
  targetUserId?: string;
  enableRealtime?: boolean;
  enableToasts?: boolean;
  autoLoadStats?: boolean;
}

export interface UseFollowReturn {
  // Follow state
  stats: FollowStats;
  isLoading: boolean;
  error: string | null;
  
  // Follow actions
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;
  toggleFollow: (userId: string) => Promise<boolean>;
  
  // Relationship queries
  isFollowing: (userId: string) => Promise<boolean>;
  isFollowedBy: (userId: string) => Promise<boolean>;
  checkMutualFollow: (userId: string) => Promise<boolean>;
  
  // Followers/Following lists
  getFollowers: (userId?: string) => Promise<UserFollowInfo[]>;
  getFollowing: (userId?: string) => Promise<UserFollowInfo[]>;
  getMutualFollowers: (userId: string) => Promise<UserFollowInfo[]>;
  
  // Stats management
  refreshStats: (userId?: string) => Promise<void>;
  
  // Real-time management
  subscribe: (userId?: string) => void;
  unsubscribe: () => void;
}

const useFollow = (options: UseFollowOptions = {}): UseFollowReturn => {
  const {
    targetUserId,
    enableRealtime = true,
    enableToasts = true,
    autoLoadStats = true,
  } = options;

  // State
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    isFollowedBy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Get current user
  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Follow a user
  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUserId) {
      if (enableToasts) {
        showToast({
          message: 'Please sign in to follow users',
          color: 'warning',
          duration: 3000,
        });
      }
      return false;
    }

    if (userId === currentUserId) {
      if (enableToasts) {
        showToast({
          message: 'You cannot follow yourself',
          color: 'warning',
          duration: 2000,
        });
      }
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        if (enableToasts) {
          showToast({
            message: 'You are already following this user',
            color: 'warning',
            duration: 2000,
          });
        }
        return true;
      }

      // Create follow relationship
      const { error: insertError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId,
        });

      if (insertError) throw insertError;

      // Update local stats optimistically
      if (userId === targetUserId) {
        setStats(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1,
          isFollowing: true,
        }));
      }

      if (enableToasts) {
        showToast({
          message: 'Successfully followed user',
          color: 'success',
          duration: 2000,
        });
      }

      return true;

    } catch (err) {
      console.error('Error following user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user';
      setError(errorMessage);
      
      if (enableToasts) {
        showToast({
          message: errorMessage,
          color: 'danger',
          duration: 3000,
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, enableToasts, showToast]);

  // Unfollow a user
  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUserId) {
      if (enableToasts) {
        showToast({
          message: 'Please sign in to unfollow users',
          color: 'warning',
          duration: 3000,
        });
      }
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Delete follow relationship
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);

      if (deleteError) throw deleteError;

      // Update local stats optimistically
      if (userId === targetUserId) {
        setStats(prev => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1),
          isFollowing: false,
        }));
      }

      if (enableToasts) {
        showToast({
          message: 'Successfully unfollowed user',
          color: 'success',
          duration: 2000,
        });
      }

      return true;

    } catch (err) {
      console.error('Error unfollowing user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user';
      setError(errorMessage);
      
      if (enableToasts) {
        showToast({
          message: errorMessage,
          color: 'danger',
          duration: 3000,
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, targetUserId, enableToasts, showToast]);

  // Toggle follow status
  const toggleFollow = useCallback(async (userId: string): Promise<boolean> => {
    const currentlyFollowing = await isFollowing(userId);
    
    if (currentlyFollowing) {
      return await unfollowUser(userId);
    } else {
      return await followUser(userId);
    }
  }, [followUser, unfollowUser]);

  // Check if current user is following target user
  const isFollowing = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }, [currentUserId]);

  // Check if target user is following current user
  const isFollowedBy = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking followed by status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking followed by status:', error);
      return false;
    }
  }, [currentUserId]);

  // Check if there's a mutual follow relationship
  const checkMutualFollow = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      const [following, followedBy] = await Promise.all([
        isFollowing(userId),
        isFollowedBy(userId),
      ]);

      return following && followedBy;
    } catch (error) {
      console.error('Error checking mutual follow:', error);
      return false;
    }
  }, [currentUserId, isFollowing, isFollowedBy]);

  // Get followers list with user info
  const getFollowers = useCallback(async (userId?: string): Promise<UserFollowInfo[]> => {
    const targetId = userId || targetUserId;
    if (!targetId) return [];

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          users!user_follows_follower_id_fkey(
            id,
            email,
            name,
            avatar_url,
            bio,
            is_public,
            created_at
          )
        `)
        .eq('following_id', targetId);

      if (error) throw error;

      // Get follower/following counts for each user
      const userIds = data?.map(f => f.follower_id) || [];
      if (userIds.length === 0) return [];

      const [followerCounts, followingCounts] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .in('following_id', userIds),
        supabase
          .from('user_follows')
          .select('follower_id')
          .in('follower_id', userIds)
      ]);

      // Create count maps
      const followerCountMap = new Map();
      const followingCountMap = new Map();

      followerCounts.data?.forEach(f => {
        const count = followerCountMap.get(f.following_id) || 0;
        followerCountMap.set(f.following_id, count + 1);
      });

      followingCounts.data?.forEach(f => {
        const count = followingCountMap.get(f.follower_id) || 0;
        followingCountMap.set(f.follower_id, count + 1);
      });

      // Transform and enrich data
      return data?.map(follow => ({
        ...follow.users,
        follower_count: followerCountMap.get(follow.users.id) || 0,
        following_count: followingCountMap.get(follow.users.id) || 0,
      })) || [];

    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }, [targetUserId]);

  // Get following list with user info
  const getFollowing = useCallback(async (userId?: string): Promise<UserFollowInfo[]> => {
    const targetId = userId || targetUserId;
    if (!targetId) return [];

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          users!user_follows_following_id_fkey(
            id,
            email,
            name,
            avatar_url,
            bio,
            is_public,
            created_at
          )
        `)
        .eq('follower_id', targetId);

      if (error) throw error;

      // Get follower/following counts for each user
      const userIds = data?.map(f => f.following_id) || [];
      if (userIds.length === 0) return [];

      const [followerCounts, followingCounts] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .in('following_id', userIds),
        supabase
          .from('user_follows')
          .select('follower_id')
          .in('follower_id', userIds)
      ]);

      // Create count maps
      const followerCountMap = new Map();
      const followingCountMap = new Map();

      followerCounts.data?.forEach(f => {
        const count = followerCountMap.get(f.following_id) || 0;
        followerCountMap.set(f.following_id, count + 1);
      });

      followingCounts.data?.forEach(f => {
        const count = followingCountMap.get(f.follower_id) || 0;
        followingCountMap.set(f.follower_id, count + 1);
      });

      // Transform and enrich data
      return data?.map(follow => ({
        ...follow.users,
        follower_count: followerCountMap.get(follow.users.id) || 0,
        following_count: followingCountMap.get(follow.users.id) || 0,
      })) || [];

    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }, [targetUserId]);

  // Get mutual followers
  const getMutualFollowers = useCallback(async (userId: string): Promise<UserFollowInfo[]> => {
    if (!currentUserId) return [];

    try {
      // Get users that both current user and target user follow
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          users!user_follows_following_id_fkey(
            id,
            email,
            name,
            avatar_url,
            bio,
            is_public,
            created_at
          )
        `)
        .eq('follower_id', currentUserId)
        .in('following_id', `(
          SELECT following_id 
          FROM user_follows 
          WHERE follower_id = '${userId}'
        )`);

      if (error) throw error;

      return data?.map(follow => ({
        ...follow.users,
        follower_count: 0, // Can be loaded separately if needed
        following_count: 0,
      })) || [];

    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }, [currentUserId]);

  // Refresh follow stats for a user
  const refreshStats = useCallback(async (userId?: string) => {
    const targetId = userId || targetUserId;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get follower and following counts
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', targetId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', targetId)
      ]);

      // Check current user's relationship with target
      let following = false;
      let followedBy = false;

      if (currentUserId && currentUserId !== targetId) {
        [following, followedBy] = await Promise.all([
          isFollowing(targetId),
          isFollowedBy(targetId),
        ]);
      }

      setStats({
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        isFollowing: following,
        isFollowedBy: followedBy,
      });

    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, currentUserId, isFollowing, isFollowedBy]);

  // Subscribe to real-time updates
  const subscribe = useCallback((userId?: string) => {
    if (!enableRealtime) return;

    const targetId = userId || targetUserId;
    if (!targetId || realtimeChannel) return;

    const channel = supabase
      .channel(`follow_updates_${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `following_id=eq.${targetId}`,
        },
        (payload) => {
          console.log('Follow update received:', payload);
          // Refresh stats when follow relationships change
          refreshStats(targetId);
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
  }, [enableRealtime, targetUserId, realtimeChannel, refreshStats]);

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(() => {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      setRealtimeChannel(null);
    }
  }, [realtimeChannel]);

  // Auto-load stats and subscribe on mount
  useEffect(() => {
    if (targetUserId && autoLoadStats) {
      refreshStats(targetUserId);
    }

    if (targetUserId && enableRealtime) {
      subscribe(targetUserId);
    }

    return () => {
      unsubscribe();
    };
  }, [targetUserId, autoLoadStats, enableRealtime]);

  return {
    // State
    stats,
    isLoading,
    error,
    
    // Actions
    followUser,
    unfollowUser,
    toggleFollow,
    
    // Queries
    isFollowing,
    isFollowedBy,
    checkMutualFollow,
    
    // Lists
    getFollowers,
    getFollowing,
    getMutualFollowers,
    
    // Management
    refreshStats,
    subscribe,
    unsubscribe,
  };
};

export default useFollow;