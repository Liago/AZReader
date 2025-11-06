import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { searchService, SearchFilters, PaginatedSearchResults, SearchResult, SearchSuggestion, SearchStatistics } from '@services/searchService';
import { SearchSuggestion as SearchBarSuggestion } from '@components/SearchBar';
import { searchHistoryManager } from '@utils/searchHistory';

export interface UseFullTextSearchOptions {
  userId?: string;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  debounceMs?: number;
  initialFilters?: Partial<SearchFilters>;
  autoSearch?: boolean;
  pageSize?: number;
}

export interface UseFullTextSearchReturn {
  // Search state
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchResults: PaginatedSearchResults | null;
  hasMore: boolean;
  
  // Current search
  currentQuery: string;
  currentFilters: SearchFilters;
  
  // Actions
  performSearch: (query: string, filters?: Partial<SearchFilters>) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
  retry: () => Promise<void>;
  
  // Filters
  updateFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  
  // Suggestions
  suggestions: SearchBarSuggestion[];
  getSuggestions: (queryPrefix: string) => Promise<void>;
  
  // Statistics
  statistics: SearchStatistics | null;
  refreshStatistics: () => Promise<void>;
  
  // History
  clearSearchHistory: () => Promise<void>;
  
  // Analytics
  searchAnalytics: any | null;
  refreshAnalytics: () => Promise<void>;
}

export const useFullTextSearch = (options: UseFullTextSearchOptions = {}): UseFullTextSearchReturn => {
  const {
    userId,
    enableHistory = true,
    enableSuggestions = true,
    debounceMs = 300,
    initialFilters = {},
    autoSearch = false,
    pageSize = 20
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PaginatedSearchResults | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchBarSuggestion[]>([]);
  const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
  const [searchAnalytics, setSearchAnalytics] = useState<any | null>(null);

  // Filters state
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    query: '',
    includeRead: true,
    sortBy: 'relevance',
    ...initialFilters
  });

  // Refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentSearchRef = useRef<number>(0);

  // Memoized default filters
  const defaultFilters = useMemo(() => ({
    query: '',
    includeRead: true,
    sortBy: 'relevance' as const,
    ...initialFilters
  }), [initialFilters]);

  // Computed properties
  const hasMore = searchResults?.hasMore ?? false;

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string, filters: Partial<SearchFilters> = {}) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(query, filters);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Perform search
  const performSearch = useCallback(
    async (query: string, filters: Partial<SearchFilters> = {}) => {
      if (!userId || !query.trim()) {
        setSearchResults(null);
        setError(null);
        return;
      }

      const searchId = ++currentSearchRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const searchFilters: SearchFilters = {
          ...currentFilters,
          ...filters,
          query: query.trim()
        };

        const results = await searchService.searchArticles(
          userId,
          searchFilters,
          pageSize,
          0
        );

        // Check if this is still the current search
        if (searchId === currentSearchRef.current) {
          setSearchResults(results);
          setCurrentQuery(query.trim());
          setCurrentFilters(searchFilters);

          // Add to search history
          if (enableHistory && query.trim()) {
            searchHistoryManager.addSearch(query.trim());
          }
        }

      } catch (err) {
        if (searchId === currentSearchRef.current) {
          console.error('Search error:', err);
          setError(err instanceof Error ? err.message : 'Search failed');
          setSearchResults(null);
        }
      } finally {
        if (searchId === currentSearchRef.current) {
          setIsLoading(false);
        }
      }
    },
    [userId, currentFilters, pageSize, enableHistory]
  );

  // Load more results
  const loadMore = useCallback(async () => {
    if (!userId || !searchResults || !hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextOffset = searchResults.results.length;
      const moreResults = await searchService.searchArticles(
        userId,
        currentFilters,
        pageSize,
        nextOffset
      );

      setSearchResults(prev => prev ? {
        ...prev,
        results: [...prev.results, ...moreResults.results],
        hasMore: moreResults.hasMore,
        totalCount: moreResults.totalCount,
        executionTimeMs: prev.executionTimeMs + moreResults.executionTimeMs
      } : null);

    } catch (err) {
      console.error('Load more error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more results');
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, searchResults, hasMore, isLoadingMore, currentFilters, pageSize]);

  // Clear results
  const clearResults = useCallback(() => {
    setSearchResults(null);
    setCurrentQuery('');
    setError(null);
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Retry last search
  const retry = useCallback(async () => {
    if (currentQuery) {
      await performSearch(currentQuery, currentFilters);
    }
  }, [currentQuery, currentFilters, performSearch]);

  // Update filters
  const updateFilters = useCallback(
    (filters: Partial<SearchFilters>) => {
      const newFilters = { ...currentFilters, ...filters };
      setCurrentFilters(newFilters);

      // If there's an active search, re-run it with new filters
      if (currentQuery && autoSearch) {
        debouncedSearch(currentQuery, filters);
      }
    },
    [currentFilters, currentQuery, autoSearch, debouncedSearch]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setCurrentFilters(defaultFilters);

    // If there's an active search, re-run it with default filters
    if (currentQuery && autoSearch) {
      performSearch(currentQuery, defaultFilters);
    }
  }, [defaultFilters, currentQuery, autoSearch, performSearch]);

  // Get suggestions
  const getSuggestions = useCallback(
    async (queryPrefix: string) => {
      if (!userId || !enableSuggestions || queryPrefix.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        // Get suggestions from search service
        const searchSuggestions = await searchService.getSearchSuggestions(userId, queryPrefix, 5);
        
        // Get recent searches from history
        const recentSearches = enableHistory 
          ? searchHistoryManager.searchHistory(queryPrefix).slice(0, 5)
          : [];

        // Combine suggestions
        const combined: SearchBarSuggestion[] = [
          // Recent searches
          ...recentSearches.map(search => ({
            text: search.query,
            type: 'recent' as const,
            metadata: { timestamp: search.timestamp }
          })),
          // Search service suggestions
          ...searchSuggestions.map(suggestion => ({
            text: suggestion.suggestion,
            type: suggestion.suggestion_type as 'tag' | 'author',
            metadata: { 
              frequency: suggestion.frequency,
              lastUsed: suggestion.last_used
            }
          }))
        ];

        // Remove duplicates
        const unique = combined.filter(
          (suggestion, index, arr) =>
            arr.findIndex(other => 
              other.text === suggestion.text && other.type === suggestion.type
            ) === index
        );

        setSuggestions(unique.slice(0, 8));

      } catch (err) {
        console.error('Get suggestions error:', err);
        setSuggestions([]);
      }
    },
    [userId, enableSuggestions, enableHistory]
  );

  // Refresh statistics
  const refreshStatistics = useCallback(async () => {
    if (!userId) return;

    try {
      const stats = await searchService.getSearchStatistics(userId);
      setStatistics(stats);
    } catch (err) {
      console.error('Refresh statistics error:', err);
    }
  }, [userId]);

  // Clear search history
  const clearSearchHistoryCallback = useCallback(async () => {
    if (!userId) return;

    try {
      // Clear local history
      if (enableHistory) {
        searchHistoryManager.clearHistory();
      }

      // Clear server-side history
      await searchService.clearSearchHistory(userId);
      
    } catch (err) {
      console.error('Clear search history error:', err);
      throw err;
    }
  }, [userId, enableHistory]);

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    if (!userId) return;

    try {
      const analytics = await searchService.getSearchAnalytics(userId);
      setSearchAnalytics(analytics);
    } catch (err) {
      console.error('Refresh analytics error:', err);
    }
  }, [userId]);

  // Load statistics on mount
  useEffect(() => {
    if (userId) {
      refreshStatistics();
    }
  }, [userId, refreshStatistics]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Search state
    isLoading,
    isLoadingMore,
    error,
    searchResults,
    hasMore,
    
    // Current search
    currentQuery,
    currentFilters,
    
    // Actions
    performSearch,
    loadMore,
    clearResults,
    retry,
    
    // Filters
    updateFilters,
    resetFilters,
    
    // Suggestions
    suggestions,
    getSuggestions,
    
    // Statistics
    statistics,
    refreshStatistics,
    
    // History
    clearSearchHistory: clearSearchHistoryCallback,
    
    // Analytics
    searchAnalytics,
    refreshAnalytics
  };
};

export default useFullTextSearch;