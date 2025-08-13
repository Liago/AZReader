import { supabase } from '@common/supabase';

export interface FeedRankingConfig {
  weights: {
    likes: number;
    comments: number;
    freshness: number;
    engagement: number;
    authorPopularity: number;
    contentQuality: number;
  };
  timeWindows: {
    '24h': number;
    '7d': number; 
    '30d': number;
  };
  normalizationCaps: {
    maxLikes: number;
    maxComments: number;
    maxEngagementPerHour: number;
    maxFollowers: number;
  };
}

export const DEFAULT_RANKING_CONFIG: FeedRankingConfig = {
  weights: {
    likes: 0.3,
    comments: 0.25,
    freshness: 0.2,
    engagement: 0.15,
    authorPopularity: 0.05,
    contentQuality: 0.05,
  },
  timeWindows: {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  },
  normalizationCaps: {
    maxLikes: 100,
    maxComments: 50,
    maxEngagementPerHour: 10,
    maxFollowers: 1000,
  },
};

export class FeedRankingService {
  private config: FeedRankingConfig;

  constructor(config: FeedRankingConfig = DEFAULT_RANKING_CONFIG) {
    this.config = config;
  }

  // Update configuration
  updateConfig(partialConfig: Partial<FeedRankingConfig>): void {
    this.config = { ...this.config, ...partialConfig };
  }

  // Calculate freshness score with exponential decay
  calculateFreshness(createdAt: string, timeWindow: keyof FeedRankingConfig['timeWindows']): number {
    const now = new Date();
    const articleDate = new Date(createdAt);
    const ageInHours = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    
    const maxAge = this.config.timeWindows[timeWindow];
    
    // Exponential decay formula: e^(-age/decay_constant)
    // decay_constant is set to 30% of max age for smooth transition
    const decayConstant = maxAge * 0.3;
    return Math.max(0, Math.exp(-ageInHours / decayConstant));
  }

  // Calculate engagement rate (interactions per hour)
  calculateEngagementRate(likeCount: number, commentCount: number, createdAt: string): number {
    const now = new Date();
    const articleDate = new Date(createdAt);
    const ageInHours = Math.max(1, (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60));
    
    // Weight comments higher than likes (comments indicate deeper engagement)
    const totalEngagement = likeCount + (commentCount * 2);
    return totalEngagement / ageInHours;
  }

  // Calculate content quality based on various factors
  calculateContentQuality(
    readTime: number | null,
    excerpt: string | null,
    hasImage: boolean,
    tags: string[] | null
  ): number {
    let score = 0.4; // Base score
    
    // Reading time optimization (3-10 minutes is sweet spot)
    if (readTime) {
      if (readTime >= 3 && readTime <= 10) {
        score += 0.25; // Optimal reading length
      } else if (readTime >= 1 && readTime <= 15) {
        score += 0.15; // Acceptable reading length
      } else if (readTime < 1) {
        score -= 0.1; // Too short, likely low quality
      }
    }
    
    // Excerpt quality (indicates effort in content curation)
    if (excerpt) {
      if (excerpt.length > 200) {
        score += 0.15;
      } else if (excerpt.length > 100) {
        score += 0.1;
      }
    }
    
    // Visual content boost
    if (hasImage) {
      score += 0.1;
    }
    
    // Tag diversity (well-categorized content)
    if (tags && tags.length > 0) {
      score += Math.min(0.1, tags.length * 0.02); // Max 0.1 bonus
    }
    
    return Math.min(1, Math.max(0, score));
  }

  // Normalize metrics to 0-1 scale for consistent weighting
  normalizeMetrics(metrics: {
    likeCount: number;
    commentCount: number;
    engagementRate: number;
    authorPopularity: number;
  }): {
    normalizedLikes: number;
    normalizedComments: number;
    normalizedEngagement: number;
    normalizedAuthorPop: number;
  } {
    const { normalizationCaps } = this.config;
    
    return {
      normalizedLikes: Math.min(1, metrics.likeCount / normalizationCaps.maxLikes),
      normalizedComments: Math.min(1, metrics.commentCount / normalizationCaps.maxComments),
      normalizedEngagement: Math.min(1, metrics.engagementRate / normalizationCaps.maxEngagementPerHour),
      normalizedAuthorPop: Math.min(1, metrics.authorPopularity / normalizationCaps.maxFollowers),
    };
  }

  // Calculate final ranking score
  calculateFinalScore(
    likeCount: number,
    commentCount: number,
    freshness: number,
    engagementRate: number,
    authorPopularity: number,
    contentQuality: number
  ): number {
    const normalized = this.normalizeMetrics({
      likeCount,
      commentCount,
      engagementRate,
      authorPopularity,
    });

    const { weights } = this.config;
    
    return (
      normalized.normalizedLikes * weights.likes +
      normalized.normalizedComments * weights.comments +
      freshness * weights.freshness +
      normalized.normalizedEngagement * weights.engagement +
      normalized.normalizedAuthorPop * weights.authorPopularity +
      contentQuality * weights.contentQuality
    );
  }

  // Get optimized database query for public feed
  async getPublicFeedQuery({
    limit = 20,
    offset = 0,
    timeWindow = '7d',
    categoryTags,
    excludeUserIds,
    includeAuthorInfo = true,
  }: {
    limit?: number;
    offset?: number;
    timeWindow?: '24h' | '7d' | '30d' | 'all';
    categoryTags?: string[];
    excludeUserIds?: string[];
    includeAuthorInfo?: boolean;
  } = {}) {
    // Build base query
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
      .eq('is_public', true);

    // Exclude specific users
    if (excludeUserIds && excludeUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
    }

    // Apply time window filter
    if (timeWindow !== 'all') {
      const hoursBack = this.config.timeWindows[timeWindow];
      const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    // Apply category filter
    if (categoryTags && categoryTags.length > 0) {
      query = query.overlaps('tags', categoryTags);
    }

    // Apply pagination and initial ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: articles, error, count } = await query;

    if (error) throw error;
    if (!articles) return { articles: [], authorInfo: [], count: 0 };

    let authorInfo: any[] = [];
    if (includeAuthorInfo) {
      // Get author information
      const userIds = [...new Set(articles.map(a => a.user_id))];
      const [authorsResult, followersResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, email, name, avatar_url')
          .in('id', userIds),
        supabase
          .from('user_follows')
          .select('following_id')
          .in('following_id', userIds)
      ]);

      // Create author info with follower counts
      const followerCountMap = new Map();
      followersResult.data?.forEach(follow => {
        const count = followerCountMap.get(follow.following_id) || 0;
        followerCountMap.set(follow.following_id, count + 1);
      });

      authorInfo = authorsResult.data?.map(author => ({
        ...author,
        follower_count: followerCountMap.get(author.id) || 0,
      })) || [];
    }

    return {
      articles,
      authorInfo,
      count: count || 0,
    };
  }

  // Calculate scores for a batch of articles
  scoreArticles(
    articles: any[],
    authorInfoMap: Map<string, any>,
    timeWindow: '24h' | '7d' | '30d' = '7d'
  ) {
    return articles.map(article => {
      const authorInfo = authorInfoMap.get(article.user_id);
      
      // Calculate individual metrics
      const freshness = this.calculateFreshness(article.created_at, timeWindow);
      const engagementRate = this.calculateEngagementRate(
        article.like_count || 0,
        article.comment_count || 0,
        article.created_at
      );
      const contentQuality = this.calculateContentQuality(
        article.estimated_read_time,
        article.excerpt,
        !!article.image_url,
        article.tags
      );

      // Calculate final score
      const finalScore = this.calculateFinalScore(
        article.like_count || 0,
        article.comment_count || 0,
        freshness,
        engagementRate,
        authorInfo?.follower_count || 0,
        contentQuality
      );

      return {
        ...article,
        metrics: {
          likeCount: article.like_count || 0,
          commentCount: article.comment_count || 0,
          freshness,
          engagementRate,
          authorPopularity: authorInfo?.follower_count || 0,
          contentQuality,
        },
        finalScore,
        author_info: authorInfo,
      };
    });
  }

  // Get trending articles with caching
  async getTrendingArticles({
    timeWindow = '24h',
    limit = 10,
    categoryTags,
    minScore = 0.3,
  }: {
    timeWindow?: '24h' | '7d' | '30d';
    limit?: number;
    categoryTags?: string[];
    minScore?: number;
  } = {}) {
    const { articles, authorInfo } = await this.getPublicFeedQuery({
      limit: limit * 2, // Get more articles to filter by score
      timeWindow,
      categoryTags,
    });

    // Create author info map
    const authorInfoMap = new Map();
    authorInfo.forEach(author => {
      authorInfoMap.set(author.id, author);
    });

    // Score and filter articles
    const scoredArticles = this.scoreArticles(articles, authorInfoMap, timeWindow);
    
    return scoredArticles
      .filter(article => article.finalScore >= minScore)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);
  }

  // Get performance analytics for the ranking algorithm
  async getRankingAnalytics(timeWindow: '24h' | '7d' | '30d' = '7d') {
    const { articles, authorInfo } = await this.getPublicFeedQuery({
      limit: 100,
      timeWindow,
    });

    const authorInfoMap = new Map();
    authorInfo.forEach(author => {
      authorInfoMap.set(author.id, author);
    });

    const scoredArticles = this.scoreArticles(articles, authorInfoMap, timeWindow);

    // Calculate analytics
    const scores = scoredArticles.map(a => a.finalScore);
    const likes = scoredArticles.map(a => a.metrics.likeCount);
    const comments = scoredArticles.map(a => a.metrics.commentCount);

    return {
      totalArticles: scoredArticles.length,
      scoreDistribution: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        median: scores.sort()[Math.floor(scores.length / 2)],
      },
      engagementStats: {
        avgLikes: likes.reduce((a, b) => a + b, 0) / likes.length,
        avgComments: comments.reduce((a, b) => a + b, 0) / comments.length,
        totalEngagement: likes.reduce((a, b) => a + b, 0) + comments.reduce((a, b) => a + b, 0),
      },
      topPerformers: scoredArticles
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          title: a.title,
          score: a.finalScore,
          metrics: a.metrics,
        })),
    };
  }
}

// Export singleton instance
export const feedRankingService = new FeedRankingService();
export default FeedRankingService;