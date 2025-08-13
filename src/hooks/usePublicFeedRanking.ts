import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useCustomToast } from '@hooks/useIonToast';

export interface RankingMetrics {
  likeCount: number;
  commentCount: number;
  freshness: number; // 0-1 score based on age
  engagementRate: number; // likes + comments / time since published
  authorPopularity: number; // follower count of author
  contentQuality: number; // based on reading time, completion rate
}

export interface ScoredArticle {
  id: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  domain: string | null;
  image_url: string | null;
  user_id: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string | null;
  estimated_read_time: number | null;
  tags: string[] | null;
  
  // Calculated metrics
  metrics: RankingMetrics;
  finalScore: number;
  
  // Author info
  author_info?: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    follower_count: number;
  };
}

export interface RankingWeights {
  likes: number;
  comments: number;
  freshness: number;
  engagement: number;
  authorPopularity: number;
  contentQuality: number;
}

export interface PublicFeedOptions {
  limit?: number;
  offset?: number;
  timeWindow?: 'all' | '24h' | '7d' | '30d';
  categoryTags?: string[];
  minScore?: number;
  weights?: Partial<RankingWeights>;
  excludeUserIds?: string[];
}

export interface UsePublicFeedRankingReturn {
  // Data
  articles: ScoredArticle[];
  totalCount: number;
  hasMore: boolean;
  
  // Actions
  loadFeed: (options?: PublicFeedOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateWeights: (weights: Partial<RankingWeights>) => void;
  
  // State
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  currentOptions: PublicFeedOptions;
  weights: RankingWeights;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  likes: 0.3,        // Like count impact
  comments: 0.25,    // Comment count impact  
  freshness: 0.2,    // Time-based decay
  engagement: 0.15,  // Engagement rate
  authorPopularity: 0.05, // Author follower count
  contentQuality: 0.05,   // Content quality metrics
};

const usePublicFeedRanking = (
  initialOptions: PublicFeedOptions = {}
): UsePublicFeedRankingReturn => {
  const [articles, setArticles] = useState<ScoredArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [currentOptions, setCurrentOptions] = useState<PublicFeedOptions>({
    limit: 20,
    offset: 0,
    timeWindow: '7d',
    minScore: 0,
    ...initialOptions,
  });

  const showToast = useCustomToast();

  // Calculate freshness score based on article age
  const calculateFreshness = useCallback((createdAt: string, timeWindow: string): number => {
    const now = new Date();
    const articleDate = new Date(createdAt);
    const ageInHours = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    
    let maxAge: number;
    switch (timeWindow) {
      case '24h': maxAge = 24; break;
      case '7d': maxAge = 24 * 7; break;
      case '30d': maxAge = 24 * 30; break;
      default: maxAge = 24 * 30; // Default to 30 days
    }
    
    // Exponential decay: newer articles get higher scores
    return Math.max(0, Math.exp(-ageInHours / (maxAge * 0.3)));
  }, []);

  // Calculate engagement rate
  const calculateEngagementRate = useCallback((
    likeCount: number, 
    commentCount: number, 
    createdAt: string
  ): number => {
    const now = new Date();
    const articleDate = new Date(createdAt);
    const ageInHours = Math.max(1, (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60));
    
    const totalEngagement = likeCount + (commentCount * 2); // Comments weighted higher
    return totalEngagement / ageInHours; // Engagement per hour
  }, []);

  // Calculate content quality score
  const calculateContentQuality = useCallback((
    readTime: number | null,
    excerpt: string | null,
    hasImage: boolean
  ): number => {
    let score = 0.5; // Base score
    
    // Reading time bonus (sweet spot is 3-10 minutes)
    if (readTime) {
      if (readTime >= 3 && readTime <= 10) {
        score += 0.3;
      } else if (readTime >= 1 && readTime <= 15) {
        score += 0.1;
      }
    }
    
    // Excerpt quality (longer excerpts generally indicate better content)
    if (excerpt && excerpt.length > 100) {
      score += 0.1;
    }
    
    // Image presence
    if (hasImage) {
      score += 0.1;
    }
    
    return Math.min(1, score);
  }, []);

  // Calculate final ranking score
  const calculateRankingScore = useCallback((
    metrics: RankingMetrics,
    weights: RankingWeights
  ): number => {
    // Normalize metrics to 0-1 scale for consistent weighting
    const normalizedLikes = Math.min(1, metrics.likeCount / 100); // Cap at 100 likes
    const normalizedComments = Math.min(1, metrics.commentCount / 50); // Cap at 50 comments
    const normalizedEngagement = Math.min(1, metrics.engagementRate / 10); // Cap at 10 per hour
    const normalizedAuthorPop = Math.min(1, metrics.authorPopularity / 1000); // Cap at 1000 followers
    
    return (
      normalizedLikes * weights.likes +
      normalizedComments * weights.comments +
      metrics.freshness * weights.freshness +
      normalizedEngagement * weights.engagement +
      normalizedAuthorPop * weights.authorPopularity +
      metrics.contentQuality * weights.contentQuality
    );
  }, []);

  // Build the database query with time window filter
  const buildTimeWindowFilter = useCallback((timeWindow: string) => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeWindow) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return null; // No time filter for 'all'
    }
    
    return cutoffDate.toISOString();
  }, []);

  // Load articles from database and calculate scores
  const loadFeed = useCallback(async (options: PublicFeedOptions = {}) => {
    const opts = { ...currentOptions, ...options };
    setCurrentOptions(opts);
    
    if (opts.offset === 0) {
      setIsLoading(true);
      setArticles([]);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      // Build base query for public articles
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          author,
          domain,
          image_url,
          user_id,
          like_count,
          comment_count,
          created_at,
          updated_at,
          estimated_read_time,
          tags
        `)
        .eq('is_public', true)
        .not('user_id', 'in', `(${opts.excludeUserIds?.join(',') || ''})`);

      // Apply time window filter
      if (opts.timeWindow && opts.timeWindow !== 'all') {
        const cutoffDate = buildTimeWindowFilter(opts.timeWindow);
        if (cutoffDate) {
          query = query.gte('created_at', cutoffDate);
        }
      }

      // Apply category filter
      if (opts.categoryTags && opts.categoryTags.length > 0) {
        query = query.overlaps('tags', opts.categoryTags);
      }

      // Apply pagination
      query = query
        .range(opts.offset || 0, (opts.offset || 0) + (opts.limit || 20) - 1)
        .order('created_at', { ascending: false }); // Initial sort by recency

      const { data: articlesData, error: articlesError, count } = await query;

      if (articlesError) throw articlesError;

      if (!articlesData) {
        setTotalCount(0);
        return;
      }

      // Get author information for follower counts
      const userIds = [...new Set(articlesData.map(a => a.user_id))];
      const { data: authorsData } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          avatar_url
        `)
        .in('id', userIds);

      // Get follower counts for authors
      const { data: followerCounts } = await supabase
        .from('user_follows')
        .select('following_id')
        .in('following_id', userIds);

      // Create author info map with follower counts
      const authorInfoMap = new Map();
      authorsData?.forEach(author => {
        const followerCount = followerCounts?.filter(f => f.following_id === author.id).length || 0;
        authorInfoMap.set(author.id, {
          ...author,
          follower_count: followerCount,
        });
      });

      // Calculate metrics and scores for each article
      const scoredArticles: ScoredArticle[] = articlesData.map(article => {
        const authorInfo = authorInfoMap.get(article.user_id);
        
        const metrics: RankingMetrics = {
          likeCount: article.like_count || 0,
          commentCount: article.comment_count || 0,
          freshness: calculateFreshness(article.created_at, opts.timeWindow || '7d'),
          engagementRate: calculateEngagementRate(
            article.like_count || 0,
            article.comment_count || 0,
            article.created_at
          ),
          authorPopularity: authorInfo?.follower_count || 0,
          contentQuality: calculateContentQuality(
            article.estimated_read_time,
            article.excerpt,
            !!article.image_url
          ),
        };

        const finalScore = calculateRankingScore(metrics, weights);

        return {
          ...article,
          metrics,
          finalScore,
          author_info: authorInfo,
        };
      });

      // Filter by minimum score and sort by final score
      const filteredAndSorted = scoredArticles
        .filter(article => article.finalScore >= (opts.minScore || 0))
        .sort((a, b) => b.finalScore - a.finalScore);

      if (opts.offset === 0) {
        setArticles(filteredAndSorted);
      } else {
        setArticles(prev => [...prev, ...filteredAndSorted]);
      }

      setTotalCount(count || 0);

    } catch (err) {
      console.error('Error loading public feed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load public feed';
      setError(errorMessage);
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [
    currentOptions,
    weights,
    calculateFreshness,
    calculateEngagementRate,
    calculateContentQuality,
    calculateRankingScore,
    buildTimeWindowFilter,
    showToast
  ]);

  // Load more articles (next page)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !articles.length) return;
    
    const nextOffset = (currentOptions.offset || 0) + (currentOptions.limit || 20);
    await loadFeed({ ...currentOptions, offset: nextOffset });
  }, [isLoadingMore, articles.length, currentOptions, loadFeed]);

  // Refresh feed (reload from beginning)
  const refresh = useCallback(async () => {
    await loadFeed({ ...currentOptions, offset: 0 });
  }, [currentOptions, loadFeed]);

  // Update ranking weights
  const updateWeights = useCallback((newWeights: Partial<RankingWeights>) => {
    setWeights(prev => ({ ...prev, ...newWeights }));
  }, []);

  // Calculate if there are more articles to load
  const hasMore = articles.length < totalCount;

  // Load initial feed
  useEffect(() => {
    loadFeed();
  }, [weights]); // Reload when weights change

  return {
    // Data
    articles,
    totalCount,
    hasMore,
    
    // Actions
    loadFeed,
    loadMore,
    refresh,
    updateWeights,
    
    // State
    isLoading,
    isLoadingMore,
    error,
    currentOptions,
    weights,
  };
};

export default usePublicFeedRanking;