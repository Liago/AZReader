import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchHistoryManager, SearchQuery } from '@utils/searchHistory';
import { 
  enhancedSearchHistoryManager, 
  getSearchSuggestions,
  addEnhancedSearch,
  recordSearchResultClick,
  SearchSuggestion as EnhancedSearchSuggestion,
  SearchContext
} from '@utils/enhancedSearchHistory';
import { SearchSuggestion } from '@components/SearchBar';

export interface UseSearchBarOptions {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  maxRecentSearches?: number;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  initialQuery?: string;
  enableEnhancedSuggestions?: boolean;
  userId?: string;
}

export interface UseSearchBarReturn {
  // State
  currentQuery: string;
  isLoading: boolean;
  
  // History
  recentSearches: SearchQuery[];
  suggestions: SearchSuggestion[];
  enhancedSuggestions: EnhancedSearchSuggestion[];
  
  // Actions
  performSearch: (query: string) => void;
  clearSearch: () => void;
  updateSuggestions: (newSuggestions: SearchSuggestion[]) => void;
  setLoading: (loading: boolean) => void;
  
  // History management
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
  getSearchStatistics: () => ReturnType<typeof searchHistoryManager.getStatistics>;
  
  // Suggestion handling
  handleSuggestionSelect: (suggestion: SearchSuggestion) => void;
  handleEnhancedSuggestionSelect: (suggestion: EnhancedSearchSuggestion) => void;
  getIntelligentSuggestions: (input: string, limit?: number) => EnhancedSearchSuggestion[];
  
  // Enhanced search tracking
  recordSearchWithMetadata: (query: string, resultCount: number, executionTimeMs: number) => string;
  recordResultInteraction: (queryId: string, clickCount: number) => void;
}

export const useSearchBar = (options: UseSearchBarOptions = {}): UseSearchBarReturn => {
  const {
    onSearch,
    onClear,
    maxRecentSearches = 10,
    enableHistory = true,
    enableSuggestions = true,
    enableEnhancedSuggestions = true,
    initialQuery = '',
    userId,
  } = options;

  // State
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchQuery[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<SearchSuggestion[]>([]);
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<EnhancedSearchSuggestion[]>([]);
  const [currentSearchId, setCurrentSearchId] = useState<string>('');

  // Load recent searches on mount
  useEffect(() => {
    if (enableHistory) {
      const recent = searchHistoryManager.getRecentSearches(maxRecentSearches);
      setRecentSearches(recent);
    }
  }, [enableHistory, maxRecentSearches]);

  // Combined suggestions (history + custom)
  const suggestions = useMemo(() => {
    if (!enableSuggestions) return [];

    const combined: SearchSuggestion[] = [];

    // Add popular searches from history
    if (enableHistory) {
      const frequent = searchHistoryManager.getFrequentSearches(5);
      const popularSuggestions: SearchSuggestion[] = frequent.map(item => ({
        text: item.query,
        type: 'popular',
        metadata: { count: item.count }
      }));
      combined.push(...popularSuggestions);
    }

    // Add custom suggestions
    combined.push(...customSuggestions);

    // Remove duplicates
    const unique = combined.filter(
      (suggestion, index, arr) =>
        arr.findIndex(other => other.text === suggestion.text && other.type === suggestion.type) === index
    );

    return unique;
  }, [enableSuggestions, enableHistory, customSuggestions]);

  // Get intelligent suggestions based on input
  const getIntelligentSuggestions = useCallback((input: string, limit: number = 10): EnhancedSearchSuggestion[] => {
    if (!enableEnhancedSuggestions) return [];
    return getSearchSuggestions(input, limit);
  }, [enableEnhancedSuggestions]);

  // Update enhanced suggestions based on input
  useEffect(() => {
    if (enableEnhancedSuggestions && currentQuery) {
      const suggestions = getIntelligentSuggestions(currentQuery, 8);
      setEnhancedSuggestions(suggestions);
    } else if (!currentQuery) {
      // Show popular suggestions when no input
      const suggestions = getIntelligentSuggestions('', 5);
      setEnhancedSuggestions(suggestions);
    }
  }, [currentQuery, enableEnhancedSuggestions, getIntelligentSuggestions]);

  // Perform search
  const performSearch = useCallback(
    (query: string) => {
      if (!query || query.trim().length === 0) {
        return;
      }

      const trimmedQuery = query.trim();
      setCurrentQuery(trimmedQuery);

      // Add to basic history
      if (enableHistory) {
        searchHistoryManager.addSearch(trimmedQuery);
        const updated = searchHistoryManager.getRecentSearches(maxRecentSearches);
        setRecentSearches(updated);
      }

      // Call external search handler
      if (onSearch) {
        onSearch(trimmedQuery);
      }
    },
    [onSearch, enableHistory, maxRecentSearches]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setCurrentQuery('');
    setIsLoading(false);

    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // Add to history manually
  const addToHistory = useCallback(
    (query: string) => {
      if (enableHistory && query.trim()) {
        searchHistoryManager.addSearch(query.trim());
        const updated = searchHistoryManager.getRecentSearches(maxRecentSearches);
        setRecentSearches(updated);
      }
    },
    [enableHistory, maxRecentSearches]
  );

  // Remove from history
  const removeFromHistory = useCallback(
    (query: string) => {
      if (enableHistory) {
        searchHistoryManager.removeSearch(query);
        const updated = searchHistoryManager.getRecentSearches(maxRecentSearches);
        setRecentSearches(updated);
      }
    },
    [enableHistory, maxRecentSearches]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    if (enableHistory) {
      searchHistoryManager.clearHistory();
      setRecentSearches([]);
    }
  }, [enableHistory]);

  // Get search statistics
  const getSearchStatistics = useCallback(() => {
    return searchHistoryManager.getStatistics();
  }, []);

  // Update custom suggestions
  const updateSuggestions = useCallback((newSuggestions: SearchSuggestion[]) => {
    setCustomSuggestions(newSuggestions);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      performSearch(suggestion.text);
    },
    [performSearch]
  );

  // Handle enhanced suggestion selection
  const handleEnhancedSuggestionSelect = useCallback(
    (suggestion: EnhancedSearchSuggestion) => {
      performSearch(suggestion.text);
    },
    [performSearch]
  );

  // Record search with metadata (call this after search results are available)
  const recordSearchWithMetadata = useCallback(
    (query: string, resultCount: number, executionTimeMs: number): string => {
      if (!enableEnhancedSuggestions) return '';
      
      const searchId = addEnhancedSearch(
        query,
        resultCount,
        executionTimeMs,
        undefined, // filters - could be passed in the future
        'manual' // source
      );
      
      setCurrentSearchId(searchId);
      return searchId;
    },
    [enableEnhancedSuggestions]
  );

  // Record result interaction (call when user clicks on search results)
  const recordResultInteraction = useCallback(
    (queryId: string, clickCount: number) => {
      if (enableEnhancedSuggestions && queryId) {
        recordSearchResultClick(queryId, clickCount);
      }
    },
    [enableEnhancedSuggestions]
  );

  // Set loading state
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    // State
    currentQuery,
    isLoading,
    
    // History
    recentSearches,
    suggestions,
    enhancedSuggestions,
    
    // Actions
    performSearch,
    clearSearch,
    updateSuggestions,
    setLoading: setLoadingState,
    
    // History management
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSearchStatistics,
    
    // Suggestion handling
    handleSuggestionSelect,
    handleEnhancedSuggestionSelect,
    getIntelligentSuggestions,
    
    // Enhanced search tracking
    recordSearchWithMetadata,
    recordResultInteraction,
  };
};

export default useSearchBar;