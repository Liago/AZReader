import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { UserFollowInfo } from './useFollow';

export interface RecommendationScore {
  userId: string;
  score: number;
  reasons: {
    commonTags: number;
    mutualFollows: number;
    engagementSimilarity: number;
    contentSimilarity: number;
  };
  debugInfo?: {
    commonTagsList: string[];
    mutualFollowsList: string[];
    totalFactors: number;
  };
}

export interface UserRecommendation extends UserFollowInfo {
  recommendationScore: number;
  reasons: RecommendationScore['reasons'];
  debugInfo?: RecommendationScore['debugInfo'];
}

export interface UseUserRecommendationsOptions {
  limit?: number;
  enableCache?: boolean;
  cacheTimeMs?: number;
  includeDebugInfo?: boolean;
  minScore?: number;
  excludeUserIds?: string[];
  refreshInterval?: number;
}

export interface UseUserRecommendationsReturn {
  // Data
  recommendations: UserRecommendation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshRecommendations: () => Promise<void>;
  dismissRecommendation: (userId: string) => void;
  markAsInteracted: (userId: string, action: 'followed' | 'dismissed' | 'viewed') => void;
  
  // Cache management
  clearCache: () => void;
  getCacheInfo: () => { lastUpdated: Date | null; entriesCount: number };
  
  // Debugging
  getScoreBreakdown: (userId: string) => RecommendationScore | null;
}

interface CacheEntry {
  data: UserRecommendation[];
  timestamp: number;
  userId: string;
}

// Cache for recommendations (per user)
const recommendationCache = new Map<string, CacheEntry>();
const dismissedUsers = new Set<string>();
const interactionHistory = new Map<string, Array<{ action: string; timestamp: number }>>();

const useUserRecommendations = (options: UseUserRecommendationsOptions = {}): UseUserRecommendationsReturn => {
  const {
    limit = 10,
    enableCache = true,
    cacheTimeMs = 15 * 60 * 1000, // 15 minutes
    includeDebugInfo = false,
    minScore = 0.1,
    excludeUserIds = [],
    refreshInterval = 30 * 60 * 1000, // 30 minutes
  } = options;

  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Map<string, RecommendationScore>>(new Map());

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;

  // Calculate common tags score
  const calculateCommonTagsScore = useCallback(async (targetUserId: string): Promise<{ score: number; commonTags: string[] }> => {
    if (!currentUserId) return { score: 0, commonTags: [] };

    try {
      // Get current user's article tags (from saved/liked articles)
      const { data: currentUserTags } = await supabase
        .from('articles')
        .select(`
          tags,
          article_tags (
            tags (
              name
            )
          )
        `)
        .eq('user_id', currentUserId);

      // Get target user's article tags
      const { data: targetUserTags } = await supabase
        .from('articles')
        .select(`
          tags,
          article_tags (
            tags (
              name
            )
          )
        `)
        .eq('user_id', targetUserId);

      if (!currentUserTags || !targetUserTags) return { score: 0, commonTags: [] };

      // Extract tag names from both users
      const currentTags = new Set<string>();
      const targetTags = new Set<string>();

      // Process current user tags
      currentUserTags.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => currentTags.add(tag.toLowerCase()));
        }
        if (article.article_tags) {
          article.article_tags.forEach((at: any) => {
            if (at.tags?.name) currentTags.add(at.tags.name.toLowerCase());
          });
        }
      });

      // Process target user tags
      targetUserTags.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => targetTags.add(tag.toLowerCase()));
        }
        if (article.article_tags) {
          article.article_tags.forEach((at: any) => {
            if (at.tags?.name) targetTags.add(at.tags.name.toLowerCase());
          });
        }
      });

      // Find common tags
      const commonTags = Array.from(currentTags).filter(tag => targetTags.has(tag));
      const totalUniqueTags = new Set([...currentTags, ...targetTags]).size;
      
      // Calculate Jaccard similarity score
      const score = totalUniqueTags > 0 ? commonTags.length / totalUniqueTags : 0;

      return { score: Math.min(score * 2, 1), commonTags }; // Boost score but cap at 1
    } catch (error) {
      console.error('Error calculating common tags score:', error);
      return { score: 0, commonTags: [] };
    }
  }, [currentUserId]);

  // Calculate mutual follows score
  const calculateMutualFollowsScore = useCallback(async (targetUserId: string): Promise<{ score: number; mutualFollows: string[] }> => {
    if (!currentUserId) return { score: 0, mutualFollows: [] };

    try {
      // Get users that both current user and target user follow
      const { data: mutualFollowsData } = await supabase
        .rpc('get_mutual_follows', {
          user1_id: currentUserId,
          user2_id: targetUserId
        });

      const mutualCount = mutualFollowsData?.length || 0;
      
      // Get total followers of target user for normalization
      const { data: targetFollowers } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', targetUserId);

      const targetFollowerCount = targetFollowers?.length || 1;
      
      // Score based on mutual follows ratio
      const score = Math.min(mutualCount / Math.max(targetFollowerCount * 0.1, 1), 1);
      const mutualFollows = mutualFollowsData?.map((f: any) => f.user_id) || [];

      return { score, mutualFollows };
    } catch (error) {
      console.error('Error calculating mutual follows score:', error);
      return { score: 0, mutualFollows: [] };
    }
  }, [currentUserId]);

  // Calculate engagement similarity score
  const calculateEngagementScore = useCallback(async (targetUserId: string): Promise<number> => {
    if (!currentUserId) return 0;

    try {
      // Get engagement patterns for both users (likes, comments, reading frequency)
      const { data: currentUserEngagement } = await supabase
        .from('likes')
        .select('created_at, article_id')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: targetUserEngagement } = await supabase
        .from('likes')
        .select('created_at, article_id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!currentUserEngagement || !targetUserEngagement) return 0;

      // Calculate engagement frequency similarity
      const currentEngagementRate = currentUserEngagement.length;
      const targetEngagementRate = targetUserEngagement.length;
      
      const maxRate = Math.max(currentEngagementRate, targetEngagementRate, 1);
      const minRate = Math.min(currentEngagementRate, targetEngagementRate);
      
      const frequencySimilarity = minRate / maxRate;

      // Check for common liked articles
      const currentLikedArticles = new Set(currentUserEngagement.map(e => e.article_id));
      const targetLikedArticles = new Set(targetUserEngagement.map(e => e.article_id));
      
      const commonLikedArticles = Array.from(currentLikedArticles).filter(id => targetLikedArticles.has(id));
      const totalUniqueArticles = new Set([...currentLikedArticles, ...targetLikedArticles]).size;
      
      const contentSimilarity = totalUniqueArticles > 0 ? commonLikedArticles.length / totalUniqueArticles : 0;
      
      // Combined engagement score
      return (frequencySimilarity * 0.3 + contentSimilarity * 0.7);
    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0;
    }
  }, [currentUserId]);

  // Calculate content similarity based on reading patterns
  const calculateContentScore = useCallback(async (targetUserId: string): Promise<number> => {
    if (!currentUserId) return 0;

    try {
      // Get reading patterns (domains, article types, reading times)
      const { data: currentReading } = await supabase
        .from('articles')
        .select('domain, tags, estimated_read_time')
        .eq('user_id', currentUserId)
        .limit(50);

      const { data: targetReading } = await supabase
        .from('articles')
        .select('domain, tags, estimated_read_time') 
        .eq('user_id', targetUserId)
        .limit(50);

      if (!currentReading || !targetReading) return 0;

      // Compare reading domains
      const currentDomains = new Set(currentReading.map(a => a.domain).filter(Boolean));
      const targetDomains = new Set(targetReading.map(a => a.domain).filter(Boolean));
      
      const commonDomains = Array.from(currentDomains).filter(domain => targetDomains.has(domain));
      const totalDomains = new Set([...currentDomains, ...targetDomains]).size;
      
      const domainSimilarity = totalDomains > 0 ? commonDomains.length / totalDomains : 0;

      // Compare reading time preferences
      const currentAvgTime = currentReading.reduce((sum, a) => sum + (a.estimated_read_time || 0), 0) / currentReading.length;
      const targetAvgTime = targetReading.reduce((sum, a) => sum + (a.estimated_read_time || 0), 0) / targetReading.length;
      
      const timeDiff = Math.abs(currentAvgTime - targetAvgTime);
      const maxTime = Math.max(currentAvgTime, targetAvgTime, 1);
      const timeSimilarity = Math.max(0, 1 - (timeDiff / maxTime));

      return domainSimilarity * 0.6 + timeSimilarity * 0.4;
    } catch (error) {
      console.error('Error calculating content score:', error);
      return 0;
    }
  }, [currentUserId]);

  // Main recommendation calculation function
  const calculateRecommendations = useCallback(async (): Promise<UserRecommendation[]> => {
    if (!currentUserId) return [];

    setError(null);

    try {
      // Get all users except current user, already following, and dismissed
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);
      const excludedIds = new Set([
        currentUserId,
        ...Array.from(followingIds),
        ...Array.from(dismissedUsers),
        ...excludeUserIds
      ]);

      // Get potential users to recommend
      const { data: users } = await supabase
        .from('users')
        .select(`
          id, email, name, avatar_url, bio, is_public,
          follower_count, following_count, created_at
        `)
        .eq('is_public', true)
        .not('id', 'in', `(${Array.from(excludedIds).join(',')})`)
        .order('follower_count', { ascending: false })
        .limit(50); // Get more candidates than needed

      if (!users || users.length === 0) return [];

      // Calculate scores for each user
      const scoredUsers: UserRecommendation[] = [];
      const calculatedScores = new Map<string, RecommendationScore>();

      for (const user of users) {
        const [
          { score: tagScore, commonTags },
          { score: mutualScore, mutualFollows },
          engagementScore,
          contentScore
        ] = await Promise.all([
          calculateCommonTagsScore(user.id),
          calculateMutualFollowsScore(user.id),
          calculateEngagementScore(user.id),
          calculateContentScore(user.id)
        ]);

        const reasons = {
          commonTags: tagScore,
          mutualFollows: mutualScore,
          engagementSimilarity: engagementScore,
          contentSimilarity: contentScore
        };

        // Weighted total score
        const totalScore = (
          tagScore * 0.3 +           // 30% - common interests
          mutualScore * 0.4 +        // 40% - social connections
          engagementScore * 0.2 +    // 20% - engagement similarity
          contentScore * 0.1         // 10% - content similarity
        );

        if (totalScore >= minScore) {
          const recommendationScore: RecommendationScore = {
            userId: user.id,
            score: totalScore,
            reasons,
            ...(includeDebugInfo && {
              debugInfo: {
                commonTagsList: commonTags,
                mutualFollowsList: mutualFollows,
                totalFactors: 4
              }
            })
          };

          calculatedScores.set(user.id, recommendationScore);

          scoredUsers.push({
            ...user,
            recommendationScore: totalScore,
            reasons,
            ...(includeDebugInfo && recommendationScore.debugInfo && {
              debugInfo: recommendationScore.debugInfo
            })
          });
        }
      }

      setScores(calculatedScores);

      // Sort by score and return top recommendations
      return scoredUsers
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Error calculating recommendations:', error);
      throw error;
    }
  }, [
    currentUserId,
    limit,
    minScore,
    excludeUserIds,
    includeDebugInfo,
    calculateCommonTagsScore,
    calculateMutualFollowsScore,
    calculateEngagementScore,
    calculateContentScore
  ]);

  // Load recommendations with caching
  const loadRecommendations = useCallback(async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (enableCache) {
        const cached = recommendationCache.get(currentUserId);
        if (cached && (Date.now() - cached.timestamp) < cacheTimeMs) {
          setRecommendations(cached.data);
          setIsLoading(false);
          return;
        }
      }

      // Calculate fresh recommendations
      const newRecommendations = await calculateRecommendations();
      
      // Update cache
      if (enableCache) {
        recommendationCache.set(currentUserId, {
          data: newRecommendations,
          timestamp: Date.now(),
          userId: currentUserId
        });
      }

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, enableCache, cacheTimeMs, calculateRecommendations]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((userId: string) => {
    dismissedUsers.add(userId);
    setRecommendations(prev => prev.filter(rec => rec.id !== userId));
    markAsInteracted(userId, 'dismissed');
  }, []);

  // Mark user interaction for learning
  const markAsInteracted = useCallback((userId: string, action: 'followed' | 'dismissed' | 'viewed') => {
    const history = interactionHistory.get(userId) || [];
    history.push({ action, timestamp: Date.now() });
    interactionHistory.set(userId, history);

    // Store interaction in local storage for persistence
    try {
      const allInteractions = Object.fromEntries(interactionHistory.entries());
      localStorage.setItem('userRecommendationInteractions', JSON.stringify(allInteractions));
    } catch (error) {
      console.error('Error storing interaction history:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    if (currentUserId) {
      recommendationCache.delete(currentUserId);
    }
  }, [currentUserId]);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    if (!currentUserId) return { lastUpdated: null, entriesCount: 0 };
    
    const cached = recommendationCache.get(currentUserId);
    return {
      lastUpdated: cached ? new Date(cached.timestamp) : null,
      entriesCount: recommendationCache.size
    };
  }, [currentUserId]);

  // Get score breakdown for debugging
  const getScoreBreakdown = useCallback((userId: string): RecommendationScore | null => {
    return scores.get(userId) || null;
  }, [scores]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    clearCache();
    await loadRecommendations();
  }, [clearCache, loadRecommendations]);

  // Load interaction history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userRecommendationInteractions');
      if (stored) {
        const interactions = JSON.parse(stored);
        Object.entries(interactions).forEach(([userId, history]) => {
          interactionHistory.set(userId, history as Array<{ action: string; timestamp: number }>);
        });
      }
    } catch (error) {
      console.error('Error loading interaction history:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUserId) {
      loadRecommendations();
    }
  }, [currentUserId, loadRecommendations]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && currentUserId) {
      const interval = setInterval(() => {
        loadRecommendations();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, currentUserId, loadRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    dismissRecommendation,
    markAsInteracted,
    clearCache,
    getCacheInfo,
    getScoreBreakdown
  };
};

export default useUserRecommendations;