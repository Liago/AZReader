import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';
import useFollow from '@hooks/useFollow';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserArticle {
  id: string;
  title: string;
  excerpt: string | null;
  domain: string | null;
  image_url: string | null;
  author: string | null;
  like_count: number | null;
  comment_count: number | null;
  created_at: string | null;
  estimated_read_time: number | null;
  tags: string[] | null;
}

export interface ReadingStats {
  totalArticles: number;
  totalReadingTime: number; // in minutes
  articlesThisWeek: number;
  articlesThisMonth: number;
  favoriteCount: number;
  averageReadingTime: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  streakDays: number;
  joinedDate: string;
}

export interface UserAchievement {
  id: string;
  type: 'reading' | 'social' | 'content' | 'time';
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface ProfileCache {
  profile: UserProfile;
  stats: ReadingStats;
  achievements: UserAchievement[];
  articles: UserArticle[];
  followStats: any;
  lastUpdated: number;
  expiry: number;
}

export interface UseUserProfileOptions {
  userId?: string;
  enableCache?: boolean;
  cacheExpiry?: number; // in milliseconds
  autoLoadArticles?: boolean;
  autoLoadStats?: boolean;
  articlesLimit?: number;
}

export interface UseUserProfileReturn {
  // Profile data
  profile: UserProfile | null;
  articles: UserArticle[];
  stats: ReadingStats | null;
  achievements: UserAchievement[];
  
  // State
  isLoading: boolean;
  isLoadingArticles: boolean;
  isLoadingStats: boolean;
  error: string | null;
  hasMoreArticles: boolean;
  
  // Actions
  loadProfile: (userId: string) => Promise<void>;
  loadArticles: (userId: string, limit?: number, offset?: number) => Promise<void>;
  loadMoreArticles: () => Promise<void>;
  loadStats: (userId: string) => Promise<void>;
  loadAchievements: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  
  // Cache management
  clearCache: (userId?: string) => void;
  getCachedProfile: (userId: string) => ProfileCache | null;
}

// Cache storage
const profileCache = new Map<string, ProfileCache>();

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Omit<UserAchievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_article',
    type: 'reading',
    title: 'First Steps',
    description: 'Saved your first article',
    icon: 'bookmark',
    color: 'success',
    maxProgress: 1,
  },
  {
    id: 'article_10',
    type: 'reading',
    title: 'Getting Started',
    description: 'Saved 10 articles',
    icon: 'library',
    color: 'primary',
    maxProgress: 10,
  },
  {
    id: 'article_100',
    type: 'reading',
    title: 'Bookworm',
    description: 'Saved 100 articles',
    icon: 'book',
    color: 'secondary',
    maxProgress: 100,
  },
  {
    id: 'article_1000',
    type: 'reading',
    title: 'Knowledge Seeker',
    description: 'Saved 1000 articles',
    icon: 'school',
    color: 'warning',
    maxProgress: 1000,
  },
  {
    id: 'first_follower',
    type: 'social',
    title: 'Making Friends',
    description: 'Got your first follower',
    icon: 'person-add',
    color: 'success',
    maxProgress: 1,
  },
  {
    id: 'follower_10',
    type: 'social',
    title: 'Popular',
    description: '10 people follow you',
    icon: 'people',
    color: 'primary',
    maxProgress: 10,
  },
  {
    id: 'follower_100',
    type: 'social',
    title: 'Influencer',
    description: '100 people follow you',
    icon: 'megaphone',
    color: 'danger',
    maxProgress: 100,
  },
  {
    id: 'streak_7',
    type: 'time',
    title: 'Week Warrior',
    description: '7-day reading streak',
    icon: 'flame',
    color: 'warning',
    maxProgress: 7,
  },
  {
    id: 'streak_30',
    type: 'time',
    title: 'Month Master',
    description: '30-day reading streak',
    icon: 'trophy',
    color: 'success',
    maxProgress: 30,
  },
  {
    id: 'public_profile',
    type: 'content',
    title: 'Going Public',
    description: 'Made your profile public',
    icon: 'globe',
    color: 'primary',
    maxProgress: 1,
  },
];

const useUserProfile = (options: UseUserProfileOptions = {}): UseUserProfileReturn => {
  const {
    userId: initialUserId,
    enableCache = true,
    cacheExpiry = 5 * 60 * 1000, // 5 minutes
    autoLoadArticles = true,
    autoLoadStats = true,
    articlesLimit = 20,
  } = options;

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [articles, setArticles] = useState<UserArticle[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialUserId || null);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);

  const userState = useSelector((state: RootState) => state.user);
  const loggedInUserId = userState.credentials?.user?.id;
  const showToast = useCustomToast();

  // Get cached profile
  const getCachedProfile = useCallback((userId: string): ProfileCache | null => {
    if (!enableCache) return null;
    
    const cached = profileCache.get(userId);
    if (cached && Date.now() < cached.expiry) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      profileCache.delete(userId);
    }
    
    return null;
  }, [enableCache]);

  // Set cached profile
  const setCachedProfile = useCallback((userId: string, data: Partial<ProfileCache>) => {
    if (!enableCache) return;
    
    const existing = profileCache.get(userId);
    const updated: ProfileCache = {
      profile: data.profile || existing?.profile || {} as UserProfile,
      stats: data.stats || existing?.stats || {} as ReadingStats,
      achievements: data.achievements || existing?.achievements || [],
      articles: data.articles || existing?.articles || [],
      followStats: data.followStats || existing?.followStats || {},
      lastUpdated: Date.now(),
      expiry: Date.now() + cacheExpiry,
    };
    
    profileCache.set(userId, updated);
  }, [enableCache, cacheExpiry]);

  // Clear cache
  const clearCache = useCallback((userId?: string) => {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  }, []);

  // Load user profile
  const loadProfile = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentUserId(userId);

    try {
      // Check cache first
      const cached = getCachedProfile(userId);
      if (cached) {
        setProfile(cached.profile);
        setStats(cached.stats);
        setAchievements(cached.achievements);
        setArticles(cached.articles);
        setIsLoading(false);
        return;
      }

      // Load profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('User not found');

      setProfile(profileData);
      
      // Cache profile data
      setCachedProfile(userId, { profile: profileData });

      // Auto-load additional data
      if (autoLoadArticles) {
        loadArticles(userId);
      }
      
      if (autoLoadStats) {
        loadStats(userId);
      }

      loadAchievements(userId);

    } catch (err) {
      console.error('Error loading profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [getCachedProfile, setCachedProfile, autoLoadArticles, autoLoadStats, showToast]);

  // Load user articles
  const loadArticles = useCallback(async (userId: string, limit = articlesLimit, offset = 0) => {
    if (offset === 0) {
      setIsLoadingArticles(true);
    }
    setError(null);

    try {
      const { data: articlesData, error: articlesError, count } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          domain,
          image_url,
          author,
          like_count,
          comment_count,
          created_at,
          estimated_read_time,
          tags
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (articlesError) throw articlesError;

      const newArticles = articlesData || [];
      
      if (offset === 0) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }

      setHasMoreArticles(newArticles.length === limit && (count || 0) > offset + limit);

      // Update cache
      setCachedProfile(userId, { articles: offset === 0 ? newArticles : articles.concat(newArticles) });

    } catch (err) {
      console.error('Error loading articles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load articles';
      setError(errorMessage);
    } finally {
      setIsLoadingArticles(false);
    }
  }, [articlesLimit, setCachedProfile, articles]);

  // Load more articles
  const loadMoreArticles = useCallback(async () => {
    if (!currentUserId || !hasMoreArticles || isLoadingArticles) return;
    
    await loadArticles(currentUserId, articlesLimit, articles.length);
  }, [currentUserId, hasMoreArticles, isLoadingArticles, loadArticles, articlesLimit, articles.length]);

  // Load reading statistics
  const loadStats = useCallback(async (userId: string) => {
    setIsLoadingStats(true);
    setError(null);

    try {
      // Get basic article stats
      const [totalResult, weekResult, monthResult, favoritesResult] = await Promise.all([
        supabase
          .from('articles')
          .select('id, estimated_read_time, created_at, tags', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('articles')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('articles')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('articles')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_favorite', true)
      ]);

      const totalArticles = totalResult.count || 0;
      const articlesThisWeek = weekResult.count || 0;
      const articlesThisMonth = monthResult.count || 0;
      const favoriteCount = favoritesResult.count || 0;

      // Calculate reading time and categories
      const articles = totalResult.data || [];
      const totalReadingTime = articles.reduce((sum, article) => {
        return sum + (article.estimated_read_time || 0);
      }, 0);

      const averageReadingTime = totalArticles > 0 ? totalReadingTime / totalArticles : 0;

      // Calculate top categories
      const categoryCount = new Map<string, number>();
      articles.forEach(article => {
        article.tags?.forEach(tag => {
          categoryCount.set(tag, (categoryCount.get(tag) || 0) + 1);
        });
      });

      const topCategories = Array.from(categoryCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      // Calculate reading streak (simplified)
      const streakDays = calculateReadingStreak(articles);

      // Get user join date
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      const readingStats: ReadingStats = {
        totalArticles,
        totalReadingTime,
        articlesThisWeek,
        articlesThisMonth,
        favoriteCount,
        averageReadingTime,
        topCategories,
        streakDays,
        joinedDate: userData?.created_at || '',
      };

      setStats(readingStats);
      
      // Update cache
      setCachedProfile(userId, { stats: readingStats });

    } catch (err) {
      console.error('Error loading stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
    } finally {
      setIsLoadingStats(false);
    }
  }, [setCachedProfile]);

  // Calculate reading streak
  const calculateReadingStreak = (articles: any[]): number => {
    if (articles.length === 0) return 0;

    const sortedDates = articles
      .map(a => new Date(a.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();
    
    for (const dateStr of sortedDates) {
      const articleDate = new Date(dateStr);
      const daysDiff = Math.floor((currentDate.getTime() - articleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  };

  // Load achievements
  const loadAchievements = useCallback(async (userId: string) => {
    try {
      // Calculate achievements based on current data
      const userAchievements: UserAchievement[] = [];

      // Get necessary data for achievement calculation
      const [articlesResult, followersResult] = await Promise.all([
        supabase
          .from('articles')
          .select('id, created_at, is_public')
          .eq('user_id', userId),
        supabase
          .from('user_follows')
          .select('id')
          .eq('following_id', userId)
      ]);

      const articleCount = articlesResult.data?.length || 0;
      const followerCount = followersResult.data?.length || 0;
      const hasPublicProfile = profile?.is_public || false;

      // Calculate achievements
      ACHIEVEMENT_DEFINITIONS.forEach(def => {
        let unlocked = false;
        let progress = 0;

        switch (def.id) {
          case 'first_article':
            progress = Math.min(articleCount, 1);
            unlocked = articleCount >= 1;
            break;
          case 'article_10':
            progress = Math.min(articleCount, 10);
            unlocked = articleCount >= 10;
            break;
          case 'article_100':
            progress = Math.min(articleCount, 100);
            unlocked = articleCount >= 100;
            break;
          case 'article_1000':
            progress = Math.min(articleCount, 1000);
            unlocked = articleCount >= 1000;
            break;
          case 'first_follower':
            progress = Math.min(followerCount, 1);
            unlocked = followerCount >= 1;
            break;
          case 'follower_10':
            progress = Math.min(followerCount, 10);
            unlocked = followerCount >= 10;
            break;
          case 'follower_100':
            progress = Math.min(followerCount, 100);
            unlocked = followerCount >= 100;
            break;
          case 'public_profile':
            progress = hasPublicProfile ? 1 : 0;
            unlocked = hasPublicProfile;
            break;
          case 'streak_7':
            progress = Math.min(stats?.streakDays || 0, 7);
            unlocked = (stats?.streakDays || 0) >= 7;
            break;
          case 'streak_30':
            progress = Math.min(stats?.streakDays || 0, 30);
            unlocked = (stats?.streakDays || 0) >= 30;
            break;
        }

        userAchievements.push({
          ...def,
          unlocked,
          progress,
          unlockedAt: unlocked ? new Date().toISOString() : undefined,
        });
      });

      setAchievements(userAchievements);
      
      // Update cache
      setCachedProfile(userId, { achievements: userAchievements });

    } catch (err) {
      console.error('Error loading achievements:', err);
    }
  }, [profile, stats, setCachedProfile]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!loggedInUserId || !currentUserId || loggedInUserId !== currentUserId) {
      showToast({
        message: 'You can only edit your own profile',
        color: 'warning',
        duration: 3000,
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUserId);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Clear cache to force refresh
      clearCache(currentUserId);

      showToast({
        message: 'Profile updated successfully',
        color: 'success',
        duration: 2000,
      });

      return true;

    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUserId, currentUserId, clearCache, showToast]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!currentUserId) return;
    
    clearCache(currentUserId);
    await loadProfile(currentUserId);
  }, [currentUserId, clearCache, loadProfile]);

  // Auto-load profile on mount
  useEffect(() => {
    if (initialUserId) {
      loadProfile(initialUserId);
    }
  }, [initialUserId]);

  return {
    // Data
    profile,
    articles,
    stats,
    achievements,
    
    // State
    isLoading,
    isLoadingArticles,
    isLoadingStats,
    error,
    hasMoreArticles,
    
    // Actions
    loadProfile,
    loadArticles,
    loadMoreArticles,
    loadStats,
    loadAchievements,
    updateProfile,
    refreshProfile,
    
    // Cache
    clearCache,
    getCachedProfile,
  };
};

export default useUserProfile;