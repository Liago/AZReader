import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import type { Post } from '@store/slices/postsSlice';

export interface PersonalizedFeedOptions {
  limit?: number;
  enableRealtime?: boolean;
  enableCache?: boolean;
  cacheTimeMs?: number;
  rankingWeights?: RankingWeights;
}

export interface RankingWeights {
  freshness: number;        // 0.4 - How recent the article is
  authorInteraction: number; // 0.3 - User's interaction history with author
  contentPreference: number; // 0.2 - Based on user's tag/topic preferences  
  engagement: number;        // 0.1 - Article's overall engagement (likes, comments)
}

export interface PersonalizedArticle extends Post {
  // Additional fields for personalized ranking
  author_name?: string;
  author_email?: string;
  author_avatar_url?: string;
  follow_date?: string;
  recommendation_score?: number;
  recommendation_reasons?: {
    freshness_score: number;
    author_interaction_score: number;
    content_preference_score: number;
    engagement_score: number;
  };
  is_read?: boolean;
  last_interaction?: string;
}

export interface UsePersonalizedFeedReturn {
  articles: PersonalizedArticle[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  unreadCount: number;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (articleId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateRankingWeights: (weights: Partial<RankingWeights>) => void;
  
  // Analytics
  getFeedStats: () => {
    totalArticles: number;
    uniqueAuthors: number;
    averageScore: number;
    readPercentage: number;
  };
}

interface CacheEntry {
  articles: PersonalizedArticle[];
  timestamp: number;
  hasMore: boolean;
  offset: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  freshness: 0.4,
  authorInteraction: 0.3,
  contentPreference: 0.2,
  engagement: 0.1,
};

const CACHE_KEY = 'personalized_feed_cache';
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export const usePersonalizedFeed = (options: PersonalizedFeedOptions = {}): UsePersonalizedFeedReturn => {
  const {
    limit = 20,
    enableRealtime = true,
    enableCache = true,
    cacheTimeMs = DEFAULT_CACHE_TIME,
    rankingWeights = DEFAULT_WEIGHTS,
  } = options;

  const [articles, setArticles] = useState<PersonalizedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [weights, setWeights] = useState<RankingWeights>(rankingWeights);

  const userState = useSelector((state: RootState) => state.user);
  const userId = userState.credentials?.user?.id;

  const subscriptionRef = useRef<any>(null);
  const cacheRef = useRef<CacheEntry | null>(null);

  // Cache management
  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY}_${userId}_${JSON.stringify(weights)}`;
  }, [userId, weights]);

  const loadFromCache = useCallback(() => {
    if (!enableCache) return null;

    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: CacheEntry = JSON.parse(cached);
        if (Date.now() - parsedCache.timestamp < cacheTimeMs) {
          cacheRef.current = parsedCache;
          return parsedCache;
        }
      }
    } catch (error) {
      console.warn('Failed to load personalized feed from cache:', error);
    }
    return null;
  }, [enableCache, getCacheKey, cacheTimeMs]);

  const saveToCache = useCallback((data: PersonalizedArticle[], hasMoreData: boolean, currentOffset: number) => {
    if (!enableCache) return;

    try {
      const cacheEntry: CacheEntry = {
        articles: data,
        timestamp: Date.now(),
        hasMore: hasMoreData,
        offset: currentOffset,
      };
      
      cacheRef.current = cacheEntry;
      localStorage.setItem(getCacheKey(), JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to save personalized feed to cache:', error);
    }
  }, [enableCache, getCacheKey]);

  // Calculate personalized ranking score
  const calculateRankingScore = useCallback((article: any, userStats: any): number => {
    const now = new Date();
    const articleDate = new Date(article.created_at);
    const daysDiff = Math.max(0, (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Freshness score (decays over time)
    const freshnessScore = Math.exp(-daysDiff / 7); // Exponential decay over 7 days
    
    // Author interaction score (based on past interactions)
    const authorInteractionScore = Math.min(1, (userStats.authorInteractions[article.user_id] || 0) / 10);
    
    // Content preference score (based on tag preferences)
    let contentPreferenceScore = 0;
    if (article.tags && userStats.tagPreferences) {
      const tagMatches = article.tags.filter((tag: string) => userStats.tagPreferences[tag] || 0);
      contentPreferenceScore = Math.min(1, tagMatches.length / 5); // Max 5 preferred tags
    }
    
    // Engagement score (likes + comments normalized)
    const engagementScore = Math.min(1, ((article.like_count || 0) + (article.comment_count || 0)) / 20);
    
    // Calculate weighted final score
    const finalScore = (
      freshnessScore * weights.freshness +
      authorInteractionScore * weights.authorInteraction +
      contentPreferenceScore * weights.contentPreference +
      engagementScore * weights.engagement
    );

    return Math.min(1, finalScore);
  }, [weights]);

  // Get user statistics for ranking
  const getUserStats = useCallback(async () => {
    if (!userId) return {};

    try {
      // Get author interaction counts
      const { data: interactions } = await supabase
        .from('articles')
        .select('user_id')
        .eq('user_id', userId); // Articles user has saved/liked

      const authorInteractions: Record<string, number> = {};
      interactions?.forEach(interaction => {
        authorInteractions[interaction.user_id] = (authorInteractions[interaction.user_id] || 0) + 1;
      });

      // Get tag preferences from user's article history
      const { data: userArticles } = await supabase
        .from('articles')
        .select('tags')
        .eq('user_id', userId);

      const tagPreferences: Record<string, number> = {};
      userArticles?.forEach(article => {
        article.tags?.forEach((tag: string) => {
          tagPreferences[tag] = (tagPreferences[tag] || 0) + 1;
        });
      });

      return { authorInteractions, tagPreferences };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }, [userId]);

  // Load personalized feed
  const loadPersonalizedFeed = useCallback(async (isLoadMore = false, useCache = true) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    // Try cache first for initial load
    if (!isLoadMore && useCache) {
      const cached = loadFromCache();
      if (cached) {
        setArticles(cached.articles);
        setHasMore(cached.hasMore);
        setOffset(cached.offset);
        setUnreadCount(cached.articles.filter(a => !a.is_read).length);
        setLastUpdated(new Date(cached.timestamp));
        return;
      }
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      // Get user stats for ranking
      const userStats = await getUserStats();
      
      // Get articles from followed users
      const { data: followedUsers } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', userId);

      if (!followedUsers || followedUsers.length === 0) {
        const emptyResult: PersonalizedArticle[] = [];
        setArticles(emptyResult);
        setHasMore(false);
        setUnreadCount(0);
        setLastUpdated(new Date());
        return;
      }

      const followedUserIds = followedUsers.map(f => f.following_id);
      const followDates = Object.fromEntries(
        followedUsers.map(f => [f.following_id, f.created_at])
      );

      // Get articles from followed users with user info
      const { data: feedArticles, error: feedError } = await supabase
        .from('articles')
        .select(`
          *,
          user:users(id, email, name, avatar_url),
          likes(id),
          comments(id)
        `)
        .in('user_id', followedUserIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (feedError) {
        throw new Error(`Failed to load personalized feed: ${feedError.message}`);
      }

      // Get read status for articles
      const articleIds = feedArticles?.map(a => a.id) || [];
      const { data: readStatus } = await supabase
        .from('reading_log')
        .select('article_id')
        .eq('user_id', userId)
        .in('article_id', articleIds);

      const readArticleIds = new Set(readStatus?.map(r => r.article_id) || []);

      // Process and rank articles
      const processedArticles: PersonalizedArticle[] = (feedArticles || []).map(article => {
        const rankingScore = calculateRankingScore(article, userStats);
        const isRead = readArticleIds.has(article.id);

        return {
          ...article,
          author_name: article.user?.name || undefined,
          author_email: article.user?.email,
          author_avatar_url: article.user?.avatar_url,
          follow_date: followDates[article.user_id],
          recommendation_score: rankingScore,
          recommendation_reasons: {
            freshness_score: Math.exp(-Math.max(0, (Date.now() - new Date(article.created_at || new Date().toISOString()).getTime()) / (1000 * 60 * 60 * 24)) / 7) * weights.freshness,
            author_interaction_score: Math.min(1, (userStats.authorInteractions?.[article.user_id] || 0) / 10) * weights.authorInteraction,
            content_preference_score: 0, // Calculate based on tags
            engagement_score: Math.min(1, ((article.like_count || 0) + (article.comment_count || 0)) / 20) * weights.engagement,
          },
          is_read: isRead,
        };
      });

      // Sort by recommendation score
      processedArticles.sort((a, b) => (b.recommendation_score || 0) - (a.recommendation_score || 0));

      const hasMoreData = processedArticles.length === limit;

      if (isLoadMore) {
        const updatedArticles = [...articles, ...processedArticles];
        setArticles(updatedArticles);
        setOffset(currentOffset + processedArticles.length);
        saveToCache(updatedArticles, hasMoreData, currentOffset + processedArticles.length);
      } else {
        setArticles(processedArticles);
        setOffset(processedArticles.length);
        saveToCache(processedArticles, hasMoreData, processedArticles.length);
      }

      setHasMore(hasMoreData);
      setUnreadCount(processedArticles.filter(a => !a.is_read).length);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading personalized feed:', error);
      setError(error instanceof Error ? error.message : 'Failed to load personalized feed');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId, limit, offset, articles, weights, loadFromCache, saveToCache, calculateRankingScore, getUserStats]);

  // Load more articles
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    await loadPersonalizedFeed(true, false);
  }, [hasMore, isLoadingMore, isLoading, loadPersonalizedFeed]);

  // Refresh feed
  const refresh = useCallback(async () => {
    setOffset(0);
    cacheRef.current = null;
    localStorage.removeItem(getCacheKey());
    await loadPersonalizedFeed(false, false);
  }, [loadPersonalizedFeed, getCacheKey]);

  // Mark article as read
  const markAsRead = useCallback(async (articleId: string) => {
    if (!userId) return;

    try {
      await supabase
        .from('reading_log')
        .upsert({
          user_id: userId,
          article_id: articleId,
          read_at: new Date().toISOString(),
          progress_percentage: 100,
        });

      // Update local state
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, is_read: true }
            : article
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking article as read:', error);
    }
  }, [userId]);

  // Mark all articles as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const unreadArticles = articles.filter(a => !a.is_read);
      
      const readingLogs = unreadArticles.map(article => ({
        user_id: userId,
        article_id: article.id,
        read_at: new Date().toISOString(),
        progress_percentage: 100,
      }));

      await supabase
        .from('reading_log')
        .upsert(readingLogs);

      // Update local state
      setArticles(prev => prev.map(article => ({ ...article, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all articles as read:', error);
    }
  }, [userId, articles]);

  // Update ranking weights
  const updateRankingWeights = useCallback((newWeights: Partial<RankingWeights>) => {
    setWeights(prev => ({ ...prev, ...newWeights }));
    // Clear cache when weights change
    cacheRef.current = null;
    localStorage.removeItem(getCacheKey());
  }, [getCacheKey]);

  // Get feed statistics
  const getFeedStats = useCallback(() => {
    const totalArticles = articles.length;
    const uniqueAuthors = new Set(articles.map(a => a.user_id)).size;
    const averageScore = articles.reduce((sum, a) => sum + (a.recommendation_score || 0), 0) / totalArticles;
    const readCount = articles.filter(a => a.is_read).length;
    const readPercentage = totalArticles > 0 ? (readCount / totalArticles) * 100 : 0;

    return {
      totalArticles,
      uniqueAuthors,
      averageScore,
      readPercentage,
    };
  }, [articles]);

  // Setup real-time subscriptions
  const setupRealtimeSubscription = useCallback(() => {
    if (!enableRealtime || !userId || subscriptionRef.current) return;

    try {
      const subscription = supabase
        .channel('personalized_feed_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'articles',
            filter: 'is_public=eq.true',
          },
          async (payload) => {
            console.log('New article published:', payload.new);
            
            // Check if article is from a followed user
            const { data: isFollowed } = await supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', userId)
              .eq('following_id', (payload.new as any).user_id)
              .single();

            if (isFollowed) {
              // Refresh feed to include new article
              refresh();
            }
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  }, [enableRealtime, userId, refresh]);

  // Cleanup subscription
  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  // Initial load and dependency changes
  useEffect(() => {
    if (userId) {
      loadPersonalizedFeed(false, true);
    }
  }, [userId, weights]);

  // Setup realtime subscription
  useEffect(() => {
    if (userId && enableRealtime) {
      setupRealtimeSubscription();
    }

    return () => {
      cleanupSubscription();
    };
  }, [userId, enableRealtime, setupRealtimeSubscription, cleanupSubscription]);

  return {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    unreadCount,
    lastUpdated,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    updateRankingWeights,
    getFeedStats,
  };
};

export default usePersonalizedFeed;