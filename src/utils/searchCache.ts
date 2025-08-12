import { SearchFilters, PaginatedSearchResults, SearchResult } from '@services/searchService';

// Cache configuration
const SEARCH_CACHE_CONFIG = {
  SEARCH_RESULTS_TTL: 5 * 60 * 1000, // 5 minutes for search results
  POPULAR_SEARCH_TTL: 15 * 60 * 1000, // 15 minutes for popular searches
  SUGGESTION_TTL: 10 * 60 * 1000, // 10 minutes for suggestions
  MAX_CACHE_SIZE: 500, // Maximum number of cached search results
  MAX_POPULAR_CACHE_SIZE: 50, // Maximum number of popular searches to cache longer
  POPULAR_SEARCH_THRESHOLD: 3, // Minimum search count to be considered popular
};

// Cache entry interface
interface SearchCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Search statistics for caching decisions
interface SearchStats {
  queryCount: number;
  averageResultCount: number;
  averageExecutionTime: number;
  lastSearched: number;
}

/**
 * Intelligent caching system for article search operations
 * Features:
 * - TTL-based expiration with different TTLs for popular vs regular searches
 * - LRU eviction policy
 * - Search popularity tracking for cache optimization
 * - Performance metrics integration
 * - User-specific cache isolation
 */
export class SearchCache {
  private searchResultsCache = new Map<string, SearchCacheEntry<PaginatedSearchResults>>();
  private searchStatsCache = new Map<string, SearchStats>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  /**
   * Generate cache key for search operations
   */
  private getSearchCacheKey(
    userId: string,
    query: string,
    filters: Partial<SearchFilters>,
    limit: number = 20,
    offset: number = 0
  ): string {
    // Create a normalized key that includes all search parameters
    const filterKey = this.normalizeFilters(filters);
    return `${userId}:search:${query.toLowerCase().trim()}:${filterKey}:${limit}:${offset}`;
  }

  /**
   * Normalize filters to create consistent cache keys
   */
  private normalizeFilters(filters: Partial<SearchFilters>): string {
    const normalizedFilters: any = {};
    
    // Sort and normalize filter parameters for consistent keys
    if (filters.tagIds?.length) {
      normalizedFilters.tagIds = [...filters.tagIds].sort().join(',');
    }
    if (filters.includeRead !== undefined) {
      normalizedFilters.includeRead = filters.includeRead;
    }
    if (filters.dateFrom) {
      normalizedFilters.dateFrom = filters.dateFrom.toISOString();
    }
    if (filters.dateTo) {
      normalizedFilters.dateTo = filters.dateTo.toISOString();
    }
    if (filters.domainFilter) {
      normalizedFilters.domainFilter = filters.domainFilter.toLowerCase();
    }
    if (filters.sortBy) {
      normalizedFilters.sortBy = filters.sortBy;
    }

    return Object.keys(normalizedFilters)
      .sort()
      .map(key => `${key}:${normalizedFilters[key]}`)
      .join('|');
  }

  /**
   * Check if cache entry is valid based on TTL
   */
  private isValidEntry<T>(entry: SearchCacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Determine if a search query is popular based on access patterns
   */
  private isPopularSearch(query: string, userId: string): boolean {
    const statsKey = `${userId}:stats:${query.toLowerCase().trim()}`;
    const stats = this.searchStatsCache.get(statsKey);
    
    if (!stats) return false;
    
    // Consider popular if searched frequently or recently
    const recentlySearched = Date.now() - stats.lastSearched < 60 * 60 * 1000; // 1 hour
    return stats.queryCount >= SEARCH_CACHE_CONFIG.POPULAR_SEARCH_THRESHOLD || 
           (stats.queryCount >= 2 && recentlySearched);
  }

  /**
   * Update search statistics for popularity tracking
   */
  private updateSearchStats(query: string, userId: string, resultCount: number, executionTime: number): void {
    const statsKey = `${userId}:stats:${query.toLowerCase().trim()}`;
    const existing = this.searchStatsCache.get(statsKey);
    
    if (existing) {
      // Update existing stats with rolling average
      const totalSearches = existing.queryCount + 1;
      existing.queryCount = totalSearches;
      existing.averageResultCount = (existing.averageResultCount * (totalSearches - 1) + resultCount) / totalSearches;
      existing.averageExecutionTime = (existing.averageExecutionTime * (totalSearches - 1) + executionTime) / totalSearches;
      existing.lastSearched = Date.now();
    } else {
      // Create new stats entry
      this.searchStatsCache.set(statsKey, {
        queryCount: 1,
        averageResultCount: resultCount,
        averageExecutionTime: executionTime,
        lastSearched: Date.now(),
      });
    }
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(maxSize: number): void {
    if (this.searchResultsCache.size < maxSize) return;

    // Find least recently used key
    let lruKey = '';
    let lruAccess = Infinity;
    
    Array.from(this.searchResultsCache.keys()).forEach(key => {
      const access = this.accessOrder.get(key) || 0;
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.searchResultsCache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }

  /**
   * Get cached search results
   */
  getCachedSearchResults(
    userId: string,
    query: string,
    filters: Partial<SearchFilters>,
    limit: number = 20,
    offset: number = 0
  ): PaginatedSearchResults | null {
    const key = this.getSearchCacheKey(userId, query, filters, limit, offset);
    const entry = this.searchResultsCache.get(key);

    if (entry && this.isValidEntry(entry)) {
      // Update access tracking
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.updateAccessOrder(key);
      
      return entry.data;
    }

    // Remove expired entry
    if (entry) {
      this.searchResultsCache.delete(key);
      this.accessOrder.delete(key);
    }

    return null;
  }

  /**
   * Cache search results with intelligent TTL based on popularity
   */
  setCachedSearchResults(
    userId: string,
    query: string,
    filters: Partial<SearchFilters>,
    results: PaginatedSearchResults,
    executionTime: number = 0,
    limit: number = 20,
    offset: number = 0
  ): void {
    const key = this.getSearchCacheKey(userId, query, filters, limit, offset);
    
    // Update search statistics
    this.updateSearchStats(query, userId, results.totalCount, executionTime);
    
    // Determine TTL based on search popularity and result characteristics
    const isPopular = this.isPopularSearch(query, userId);
    const hasGoodResults = results.totalCount > 0;
    
    let ttl = SEARCH_CACHE_CONFIG.SEARCH_RESULTS_TTL;
    if (isPopular && hasGoodResults) {
      ttl = SEARCH_CACHE_CONFIG.POPULAR_SEARCH_TTL; // Cache popular searches longer
    }

    // Evict if necessary
    this.evictLRU(SEARCH_CACHE_CONFIG.MAX_CACHE_SIZE);
    
    this.searchResultsCache.set(key, {
      data: results,
      timestamp: Date.now(),
      ttl: ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    });
    
    this.updateAccessOrder(key);
  }

  /**
   * Invalidate search caches for a specific user (call after content changes)
   */
  invalidateUserSearchCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    // Collect all search cache keys for the user
    Array.from(this.searchResultsCache.keys()).forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    });
    
    // Delete collected keys
    keysToDelete.forEach(key => {
      this.searchResultsCache.delete(key);
      this.accessOrder.delete(key);
    });

    // Also clear search stats for this user
    const statsKeysToDelete: string[] = [];
    Array.from(this.searchStatsCache.keys()).forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        statsKeysToDelete.push(key);
      }
    });
    
    statsKeysToDelete.forEach(key => {
      this.searchStatsCache.delete(key);
    });
  }

  /**
   * Invalidate caches that might be affected by specific content changes
   */
  invalidateRelatedSearches(userId: string, affectedTerms: string[] = []): void {
    if (affectedTerms.length === 0) {
      // If no specific terms provided, invalidate all user caches
      this.invalidateUserSearchCache(userId);
      return;
    }

    const keysToDelete: string[] = [];
    
    Array.from(this.searchResultsCache.keys()).forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        // Check if any affected terms appear in the cache key query
        const keyLower = key.toLowerCase();
        if (affectedTerms.some(term => keyLower.includes(term.toLowerCase()))) {
          keysToDelete.push(key);
        }
      }
    });
    
    keysToDelete.forEach(key => {
      this.searchResultsCache.delete(key);
      this.accessOrder.delete(key);
    });
  }

  /**
   * Get popular search queries for a user
   */
  getPopularSearchQueries(userId: string, limit: number = 10): Array<{ query: string; count: number; avgResults: number }> {
    const userStatsEntries = Array.from(this.searchStatsCache.entries())
      .filter(([key]) => key.startsWith(`${userId}:stats:`))
      .map(([key, stats]) => ({
        query: key.replace(`${userId}:stats:`, ''),
        count: stats.queryCount,
        avgResults: Math.round(stats.averageResultCount),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return userStatsEntries;
  }

  /**
   * Preload popular searches (can be called periodically)
   */
  async preloadPopularSearches(
    userId: string,
    searchFunction: (query: string, filters: Partial<SearchFilters>) => Promise<PaginatedSearchResults>
  ): Promise<void> {
    const popularQueries = this.getPopularSearchQueries(userId, 5);
    
    // Preload popular searches with basic filters
    const preloadPromises = popularQueries.map(async ({ query }) => {
      const basicFilters: Partial<SearchFilters> = { query, sortBy: 'relevance' };
      const cacheKey = this.getSearchCacheKey(userId, query, basicFilters);
      
      // Only preload if not already cached
      if (!this.searchResultsCache.has(cacheKey)) {
        try {
          const startTime = Date.now();
          const results = await searchFunction(query, basicFilters);
          const executionTime = Date.now() - startTime;
          
          this.setCachedSearchResults(userId, query, basicFilters, results, executionTime);
        } catch (error) {
          console.warn('Failed to preload search results for:', query, error);
        }
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.searchResultsCache.clear();
    this.searchStatsCache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  getCacheStats(): {
    totalCachedSearches: number;
    popularSearches: number;
    cacheHitData: Array<{ key: string; hits: number; lastAccessed: Date }>;
    memoryUsage: number;
    averageTTL: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.searchResultsCache.entries());
    
    const popularCount = entries.filter(([, entry]) => 
      entry.ttl === SEARCH_CACHE_CONFIG.POPULAR_SEARCH_TTL
    ).length;

    const cacheHitData = entries
      .map(([key, entry]) => ({
        key: key.split(':').slice(2).join(':'), // Remove userId and 'search' from key for display
        hits: entry.accessCount,
        lastAccessed: new Date(entry.lastAccessed),
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10); // Top 10 most accessed

    const averageTTL = entries.length > 0 
      ? entries.reduce((sum, [, entry]) => sum + entry.ttl, 0) / entries.length / 1000 / 60 // Convert to minutes
      : 0;

    return {
      totalCachedSearches: this.searchResultsCache.size,
      popularSearches: popularCount,
      cacheHitData,
      memoryUsage: this.estimateMemoryUsage(),
      averageTTL: Math.round(averageTTL * 10) / 10, // Round to 1 decimal place
    };
  }

  /**
   * Estimate memory usage of cache (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    Array.from(this.searchResultsCache.entries()).forEach(([key, entry]) => {
      // Rough estimation: key size + result data size
      totalSize += key.length * 2; // Unicode chars are 2 bytes
      totalSize += JSON.stringify(entry.data).length * 2; // Approximate result data size
      totalSize += 100; // Metadata overhead
    });
    
    return Math.round(totalSize / 1024); // Return size in KB
  }

  /**
   * Cleanup expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // Find expired search results
    Array.from(this.searchResultsCache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp >= entry.ttl) {
        expiredKeys.push(key);
      }
    });
    
    // Remove expired entries
    expiredKeys.forEach(key => {
      this.searchResultsCache.delete(key);
      this.accessOrder.delete(key);
    });

    // Cleanup old search stats (keep stats for 7 days)
    const statsExpiredKeys: string[] = [];
    Array.from(this.searchStatsCache.entries()).forEach(([key, stats]) => {
      if (now - stats.lastSearched > 7 * 24 * 60 * 60 * 1000) { // 7 days
        statsExpiredKeys.push(key);
      }
    });
    
    statsExpiredKeys.forEach(key => {
      this.searchStatsCache.delete(key);
    });
  }
}

// Global search cache instance
export const searchCache = new SearchCache();

// Cleanup interval (run every 2 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    searchCache.cleanup();
  }, 2 * 60 * 1000);
}

// Export utility functions
export const getCachedSearchResults = (
  userId: string,
  query: string,
  filters: Partial<SearchFilters>,
  limit?: number,
  offset?: number
) => searchCache.getCachedSearchResults(userId, query, filters, limit, offset);

export const setCachedSearchResults = (
  userId: string,
  query: string,
  filters: Partial<SearchFilters>,
  results: PaginatedSearchResults,
  executionTime?: number,
  limit?: number,
  offset?: number
) => searchCache.setCachedSearchResults(userId, query, filters, results, executionTime, limit, offset);

export const invalidateUserSearchCache = (userId: string) => searchCache.invalidateUserSearchCache(userId);

export default searchCache;