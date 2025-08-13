import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@common/supabase';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { useCustomToast } from '@hooks/useIonToast';
import usePublicFeedRanking from '@hooks/usePublicFeedRanking';
import type { Post } from '@store/slices/postsSlice';

export interface DiscoverFilters {
  timeWindow: 'day' | 'week' | 'month' | 'all';
  category?: string;
  sortBy: 'trending' | 'popular' | 'recent' | 'top_rated';
}

export interface DiscoverSection {
  id: string;
  title: string;
  articles: Post[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}

export interface DiscoverStats {
  totalArticles: number;
  categoriesCount: number;
  activeUsers: number;
  todayArticles: number;
}

export interface UseDiscoverTabOptions {
  initialFilters?: Partial<DiscoverFilters>;
  articlesPerPage?: number;
  enableRealtime?: boolean;
  enableCache?: boolean;
}

export interface UseDiscoverTabReturn {
  // Sections
  trendingSection: DiscoverSection;
  popularSection: DiscoverSection;
  recentSection: DiscoverSection;
  categorizedSections: DiscoverSection[];
  
  // Filters and state
  filters: DiscoverFilters;
  isLoading: boolean;
  error: string | null;
  stats: DiscoverStats | null;
  
  // Actions
  updateFilters: (newFilters: Partial<DiscoverFilters>) => void;
  loadMoreArticles: (sectionId: string) => Promise<void>;
  refreshSection: (sectionId: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Categories
  availableCategories: string[];
  loadCategories: () => Promise<void>;
  
  // Stats
  loadStats: () => Promise<void>;
}

// Cache for discover data
const discoverCache = new Map<string, any>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const useDiscoverTab = (options: UseDiscoverTabOptions = {}): UseDiscoverTabReturn => {
  const {
    initialFilters = {},
    articlesPerPage = 20,
    enableRealtime = true,
    enableCache = true,
  } = options;

  // State
  const [filters, setFilters] = useState<DiscoverFilters>({
    timeWindow: 'week',
    sortBy: 'trending',
    ...initialFilters,
  });

  const [trendingSection, setTrendingSection] = useState<DiscoverSection>({
    id: 'trending',
    title: 'Trending Now',
    articles: [],
    isLoading: false,
    hasMore: true,
  });

  const [popularSection, setPopularSection] = useState<DiscoverSection>({
    id: 'popular',
    title: 'Popular This Week',
    articles: [],
    isLoading: false,
    hasMore: true,
  });

  const [recentSection, setRecentSection] = useState<DiscoverSection>({
    id: 'recent',
    title: 'Recently Added',
    articles: [],
    isLoading: false,
    hasMore: true,
  });

  const [categorizedSections, setCategorizedSections] = useState<DiscoverSection[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DiscoverStats | null>(null);

  // Hooks
  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const showToast = useCustomToast();
  
  const { 
    getTrendingArticles, 
    getPopularArticles,
    calculateRankingScore 
  } = usePublicFeedRanking({
    enableCache: enableCache,
    timeWindow: filters.timeWindow,
  });

  // Cache helpers
  const getCacheKey = useCallback((sectionId: string, filters: DiscoverFilters, page: number = 0) => {
    return `discover_${sectionId}_${JSON.stringify(filters)}_${page}`;
  }, []);

  const setCache = useCallback((key: string, data: any) => {
    if (!enableCache) return;
    discoverCache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY,
    });
  }, [enableCache]);

  const getCache = useCallback((key: string) => {
    if (!enableCache) return null;
    const cached = discoverCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    if (cached) {
      discoverCache.delete(key);
    }
    return null;
  }, [enableCache]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DiscoverFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Load trending articles
  const loadTrendingArticles = useCallback(async (page: number = 0) => {
    const cacheKey = getCacheKey('trending', filters, page);
    const cached = getCache(cacheKey);
    
    if (cached && page === 0) {
      setTrendingSection(prev => ({
        ...prev,
        articles: cached.articles,
        isLoading: false,
      }));
      return;
    }

    setTrendingSection(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const articles = await getTrendingArticles({
        limit: articlesPerPage,
        offset: page * articlesPerPage,
        timeWindow: filters.timeWindow,
        category: filters.category,
      });

      setTrendingSection(prev => ({
        ...prev,
        articles: page === 0 ? articles : [...prev.articles, ...articles],
        isLoading: false,
        hasMore: articles.length === articlesPerPage,
      }));

      if (page === 0) {
        setCache(cacheKey, { articles });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trending articles';
      setTrendingSection(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    }
  }, [filters, articlesPerPage, getTrendingArticles, getCacheKey, getCache, setCache, showToast]);

  // Load popular articles
  const loadPopularArticles = useCallback(async (page: number = 0) => {
    const cacheKey = getCacheKey('popular', filters, page);
    const cached = getCache(cacheKey);
    
    if (cached && page === 0) {
      setPopularSection(prev => ({
        ...prev,
        articles: cached.articles,
        isLoading: false,
      }));
      return;
    }

    setPopularSection(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const articles = await getPopularArticles({
        limit: articlesPerPage,
        offset: page * articlesPerPage,
        timeWindow: filters.timeWindow,
        category: filters.category,
      });

      setPopularSection(prev => ({
        ...prev,
        articles: page === 0 ? articles : [...prev.articles, ...articles],
        isLoading: false,
        hasMore: articles.length === articlesPerPage,
      }));

      if (page === 0) {
        setCache(cacheKey, { articles });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load popular articles';
      setPopularSection(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    }
  }, [filters, articlesPerPage, getPopularArticles, getCacheKey, getCache, setCache, showToast]);

  // Load recent articles
  const loadRecentArticles = useCallback(async (page: number = 0) => {
    const cacheKey = getCacheKey('recent', filters, page);
    const cached = getCache(cacheKey);
    
    if (cached && page === 0) {
      setRecentSection(prev => ({
        ...prev,
        articles: cached.articles,
        isLoading: false,
      }));
      return;
    }

    setRecentSection(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      let query = supabase
        .from('articles')
        .select(`
          id,
          title,
          excerpt,
          url,
          domain,
          image_url,
          author,
          created_at,
          published_date,
          estimated_read_time,
          tags,
          is_favorite,
          reading_status,
          like_count,
          comment_count,
          user_id,
          users!articles_user_id_fkey(
            id,
            email,
            name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(page * articlesPerPage, (page + 1) * articlesPerPage - 1);

      // Apply time filter
      if (filters.timeWindow !== 'all') {
        const timeMap = {
          day: 1,
          week: 7,
          month: 30,
        };
        const days = timeMap[filters.timeWindow];
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      }

      // Apply category filter
      if (filters.category) {
        query = query.contains('tags', [filters.category]);
      }

      const { data: articles, error } = await query;

      if (error) throw error;

      const formattedArticles = articles?.map(article => ({
        ...article,
        users: Array.isArray(article.users) ? article.users[0] : article.users,
      })) || [];

      setRecentSection(prev => ({
        ...prev,
        articles: page === 0 ? formattedArticles : [...prev.articles, ...formattedArticles],
        isLoading: false,
        hasMore: formattedArticles.length === articlesPerPage,
      }));

      if (page === 0) {
        setCache(cacheKey, { articles: formattedArticles });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent articles';
      setRecentSection(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    }
  }, [filters, articlesPerPage, getCacheKey, getCache, setCache, showToast]);

  // Load categorized sections
  const loadCategorizedSections = useCallback(async () => {
    if (availableCategories.length === 0) return;

    try {
      const sections: DiscoverSection[] = [];

      // Load top articles for each category
      for (const category of availableCategories.slice(0, 5)) { // Limit to top 5 categories
        const { data: articles, error } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            excerpt,
            url,
            domain,
            image_url,
            author,
            created_at,
            published_date,
            estimated_read_time,
            tags,
            is_favorite,
            reading_status,
            like_count,
            comment_count,
            user_id,
            users!articles_user_id_fkey(
              id,
              email,
              name,
              avatar_url
            )
          `)
          .eq('is_public', true)
          .contains('tags', [category])
          .order('like_count', { ascending: false })
          .limit(10);

        if (error) {
          console.error(`Error loading category ${category}:`, error);
          continue;
        }

        const formattedArticles = articles?.map(article => ({
          ...article,
          users: Array.isArray(article.users) ? article.users[0] : article.users,
        })) || [];

        sections.push({
          id: `category_${category}`,
          title: category.charAt(0).toUpperCase() + category.slice(1),
          articles: formattedArticles,
          isLoading: false,
          hasMore: formattedArticles.length === 10,
        });
      }

      setCategorizedSections(sections);

    } catch (err) {
      console.error('Error loading categorized sections:', err);
    }
  }, [availableCategories]);

  // Load available categories
  const loadCategories = useCallback(async () => {
    try {
      const { data: articles, error } = await supabase
        .from('articles')
        .select('tags')
        .eq('is_public', true)
        .not('tags', 'is', null);

      if (error) throw error;

      const categoryCount = new Map<string, number>();
      
      articles?.forEach(article => {
        article.tags?.forEach((tag: string) => {
          categoryCount.set(tag, (categoryCount.get(tag) || 0) + 1);
        });
      });

      const sortedCategories = Array.from(categoryCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20) // Top 20 categories
        .map(([category]) => category);

      setAvailableCategories(sortedCategories);

    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }, []);

  // Load discover stats
  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [totalResult, categoriesResult, usersResult, todayResult] = await Promise.all([
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('is_public', true),
        supabase
          .from('articles')
          .select('tags')
          .eq('is_public', true)
          .not('tags', 'is', null),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('is_public', true),
        supabase
          .from('articles')
          .select('id', { count: 'exact', head: true })
          .eq('is_public', true)
          .gte('created_at', today)
      ]);

      const uniqueCategories = new Set<string>();
      categoriesResult.data?.forEach(article => {
        article.tags?.forEach((tag: string) => uniqueCategories.add(tag));
      });

      setStats({
        totalArticles: totalResult.count || 0,
        categoriesCount: uniqueCategories.size,
        activeUsers: usersResult.count || 0,
        todayArticles: todayResult.count || 0,
      });

    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Load more articles for a specific section
  const loadMoreArticles = useCallback(async (sectionId: string) => {
    const section = [trendingSection, popularSection, recentSection, ...categorizedSections]
      .find(s => s.id === sectionId);
    
    if (!section || !section.hasMore || section.isLoading) return;

    const currentPage = Math.floor(section.articles.length / articlesPerPage);

    switch (sectionId) {
      case 'trending':
        await loadTrendingArticles(currentPage);
        break;
      case 'popular':
        await loadPopularArticles(currentPage);
        break;
      case 'recent':
        await loadRecentArticles(currentPage);
        break;
      default:
        // Handle categorized sections if needed
        break;
    }
  }, [trendingSection, popularSection, recentSection, categorizedSections, articlesPerPage, loadTrendingArticles, loadPopularArticles, loadRecentArticles]);

  // Refresh a specific section
  const refreshSection = useCallback(async (sectionId: string) => {
    // Clear cache for this section
    const cacheKey = getCacheKey(sectionId, filters, 0);
    discoverCache.delete(cacheKey);

    switch (sectionId) {
      case 'trending':
        await loadTrendingArticles(0);
        break;
      case 'popular':
        await loadPopularArticles(0);
        break;
      case 'recent':
        await loadRecentArticles(0);
        break;
      default:
        await loadCategorizedSections();
        break;
    }
  }, [filters, getCacheKey, loadTrendingArticles, loadPopularArticles, loadRecentArticles, loadCategorizedSections]);

  // Refresh all sections
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear all cache
      discoverCache.clear();

      await Promise.all([
        loadTrendingArticles(0),
        loadPopularArticles(0),
        loadRecentArticles(0),
        loadCategories(),
        loadStats(),
      ]);

      // Load categorized sections after categories are loaded
      setTimeout(() => loadCategorizedSections(), 100);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh discover content';
      setError(errorMessage);
      
      showToast({
        message: errorMessage,
        color: 'danger',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadTrendingArticles, loadPopularArticles, loadRecentArticles, loadCategories, loadStats, loadCategorizedSections, showToast]);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [filters.timeWindow, filters.category, filters.sortBy]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('discover_articles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
          filter: 'is_public=eq.true',
        },
        (payload) => {
          console.log('Article update received:', payload);
          // Refresh sections on new articles
          if (payload.eventType === 'INSERT') {
            refreshAll();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enableRealtime, refreshAll]);

  return {
    // Sections
    trendingSection,
    popularSection,
    recentSection,
    categorizedSections,
    
    // State
    filters,
    isLoading,
    error,
    stats,
    
    // Actions
    updateFilters,
    loadMoreArticles,
    refreshSection,
    refreshAll,
    
    // Categories
    availableCategories,
    loadCategories,
    
    // Stats
    loadStats,
  };
};

export default useDiscoverTab;