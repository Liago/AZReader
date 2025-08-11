import { useState, useEffect, useCallback, useRef } from 'react';
import { tagPerformanceService } from '@services/tagPerformanceService';
import { TagStatistics } from '@utils/tagCache';

export interface LazyLoadingOptions {
  pageSize?: number;
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  debounceMs?: number; // Debounce time for scroll events
  preloadPages?: number; // Number of pages to preload ahead
  enableInfiniteScroll?: boolean;
  sortBy?: 'usage_count' | 'name' | 'last_used';
  minUsage?: number;
}

export interface LazyLoadingState {
  // Data state
  items: TagStatistics[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Pagination state
  currentPage: number;
  totalItems: number;
  totalPages: number;
  
  // Control functions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  
  // Scroll handling
  scrollElementRef: React.RefObject<HTMLElement>;
  isNearBottom: boolean;
}

/**
 * Hook for lazy loading tag data with infinite scroll and performance optimizations
 */
export const useTagLazyLoading = (
  userId: string,
  options: LazyLoadingOptions = {}
): LazyLoadingState => {
  const {
    pageSize = 20,
    threshold = 200,
    debounceMs = 100,
    preloadPages = 1,
    enableInfiniteScroll = true,
    sortBy = 'usage_count',
    minUsage = 1
  } = options;

  // State
  const [items, setItems] = useState<TagStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Refs
  const scrollElementRef = useRef<HTMLElement>(null);
  const loadingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      const tagStats = await tagPerformanceService.getTagStatistics(userId, {
        sortBy,
        limit: pageSize * (1 + preloadPages), // Load extra pages for smoother experience
        forceRefresh: false
      });

      if (!mountedRef.current) return;

      // Filter by minimum usage
      const filtered = tagStats.filter(tag => tag.usage_count >= minUsage);
      
      // Calculate pagination info
      const totalFiltered = filtered.length;
      const calculatedTotalPages = Math.ceil(totalFiltered / pageSize);
      const hasMoreItems = totalFiltered > pageSize;
      
      setItems(filtered.slice(0, pageSize));
      setTotalItems(totalFiltered);
      setTotalPages(calculatedTotalPages);
      setCurrentPage(1);
      setHasMore(hasMoreItems);

    } catch (err) {
      if (mountedRef.current) {
        console.error('Error loading initial tag data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [userId, sortBy, pageSize, preloadPages, minUsage]);

  // Load more data for pagination
  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || loadingRef.current || loadingMore) {
      return;
    }

    setLoadingMore(true);
    loadingRef.current = true;
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const startIndex = (nextPage - 1) * pageSize;
      
      // For simplicity, we'll reload all data up to the next page
      // In a production app, you might want to implement proper offset-based pagination
      const tagStats = await tagPerformanceService.getTagStatistics(userId, {
        sortBy,
        limit: pageSize * nextPage,
        forceRefresh: false
      });

      if (!mountedRef.current) return;

      const filtered = tagStats.filter(tag => tag.usage_count >= minUsage);
      const newItems = filtered.slice(0, startIndex + pageSize);
      const hasMoreItems = filtered.length > newItems.length;

      setItems(newItems);
      setCurrentPage(nextPage);
      setHasMore(hasMoreItems);
      setTotalItems(filtered.length);

    } catch (err) {
      if (mountedRef.current) {
        console.error('Error loading more tag data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load more tags');
      }
    } finally {
      if (mountedRef.current) {
        setLoadingMore(false);
        loadingRef.current = false;
      }
    }
  }, [userId, hasMore, loadingMore, currentPage, pageSize, sortBy, minUsage]);

  // Refresh data (force reload)
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setItems([]);
    setHasMore(true);
    setError(null);
    
    // Force cache refresh
    tagPerformanceService.invalidateUserCache(userId);
    await loadInitialData();
  }, [userId, loadInitialData]);

  // Reset state
  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
    setTotalItems(0);
    setTotalPages(0);
    setIsNearBottom(false);
  }, []);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(() => {
    if (!enableInfiniteScroll || !scrollElementRef.current) return;

    const element = scrollElementRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= threshold;
    
    setIsNearBottom(nearBottom);
    
    // Trigger load more when near bottom
    if (nearBottom && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [enableInfiniteScroll, threshold, hasMore, loadingMore, loading, loadMore]);

  // Debounced scroll handler
  const debouncedScrollHandler = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(handleScroll, debounceMs);
  }, [handleScroll, debounceMs]);

  // Set up scroll listener
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element || !enableInfiniteScroll) return;

    element.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', debouncedScrollHandler);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debouncedScrollHandler, enableInfiniteScroll]);

  // Load initial data on mount or when dependencies change
  useEffect(() => {
    if (userId) {
      loadInitialData();
    } else {
      reset();
    }
  }, [userId, sortBy, minUsage, loadInitialData, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data state
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    
    // Pagination state
    currentPage,
    totalItems,
    totalPages,
    
    // Control functions
    loadMore,
    refresh,
    reset,
    
    // Scroll handling
    scrollElementRef,
    isNearBottom,
  };
};

/**
 * Hook for virtual scrolling large tag lists (for performance with thousands of tags)
 */
export const useTagVirtualScrolling = (
  items: TagStatistics[],
  options: {
    containerHeight: number;
    itemHeight: number;
    overscan?: number; // Number of items to render outside visible area
  }
) => {
  const { containerHeight, itemHeight, overscan = 5 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
};

export default useTagLazyLoading;