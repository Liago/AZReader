import { Tag } from '@common/database-types';

// Cache configuration
const CACHE_CONFIG = {
  TAG_LIST_TTL: 5 * 60 * 1000, // 5 minutes
  TAG_STATS_TTL: 10 * 60 * 1000, // 10 minutes
  TAG_SEARCH_TTL: 2 * 60 * 1000, // 2 minutes
  MAX_CACHE_SIZE: 1000,
  MAX_SEARCH_CACHE_SIZE: 100,
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Tag statistics interface
export interface TagStatistics {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  user_count: number;
  last_used: string | null;
  weekly_usage: number;
  monthly_usage: number;
  favorite_usage: number;
}

// Search result interface
export interface TagSearchResult {
  id: string;
  name: string;
  color: string;
  usage_count: number;
  user_count: number;
  last_used: string | null;
}

/**
 * Intelligent caching system for tag operations
 * Implements LRU eviction, TTL expiration, and performance optimization
 */
export class TagCache {
  private tagListCache = new Map<string, CacheEntry<Tag[]>>();
  private tagStatsCache = new Map<string, CacheEntry<TagStatistics[]>>();
  private tagSearchCache = new Map<string, CacheEntry<TagSearchResult[]>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;

  /**
   * Generate cache key for user-specific tag operations
   */
  private getCacheKey(userId: string, operation: string, params: any = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(',');
    return `${userId}:${operation}:${paramString}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(cache: Map<string, any>, maxSize: number): void {
    if (cache.size < maxSize) return;

    // Find least recently used key
    let lruKey = '';
    let lruAccess = Infinity;
    
    for (const key of cache.keys()) {
      const access = this.accessOrder.get(key) || 0;
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    }

    if (lruKey) {
      cache.delete(lruKey);
      this.accessOrder.delete(lruKey);
    }
  }

  /**
   * Get cached tag list for user
   */
  getTagList(userId: string): Tag[] | null {
    const key = this.getCacheKey(userId, 'tagList');
    const entry = this.tagListCache.get(key);

    if (entry && this.isValidEntry(entry)) {
      this.updateAccessOrder(key);
      return entry.data;
    }

    // Remove expired entry
    if (entry) {
      this.tagListCache.delete(key);
      this.accessOrder.delete(key);
    }

    return null;
  }

  /**
   * Cache tag list for user
   */
  setTagList(userId: string, tags: Tag[]): void {
    const key = this.getCacheKey(userId, 'tagList');
    
    this.evictLRU(this.tagListCache, CACHE_CONFIG.MAX_CACHE_SIZE);
    
    this.tagListCache.set(key, {
      data: tags,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.TAG_LIST_TTL,
    });
    
    this.updateAccessOrder(key);
  }

  /**
   * Get cached tag statistics
   */
  getTagStatistics(userId: string, params: { sortBy?: string; limit?: number } = {}): TagStatistics[] | null {
    const key = this.getCacheKey(userId, 'tagStats', params);
    const entry = this.tagStatsCache.get(key);

    if (entry && this.isValidEntry(entry)) {
      this.updateAccessOrder(key);
      return entry.data;
    }

    if (entry) {
      this.tagStatsCache.delete(key);
      this.accessOrder.delete(key);
    }

    return null;
  }

  /**
   * Cache tag statistics
   */
  setTagStatistics(userId: string, stats: TagStatistics[], params: { sortBy?: string; limit?: number } = {}): void {
    const key = this.getCacheKey(userId, 'tagStats', params);
    
    this.evictLRU(this.tagStatsCache, CACHE_CONFIG.MAX_CACHE_SIZE);
    
    this.tagStatsCache.set(key, {
      data: stats,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.TAG_STATS_TTL,
    });
    
    this.updateAccessOrder(key);
  }

  /**
   * Get cached tag search results
   */
  getTagSearchResults(userId: string, query: string, limit: number = 20): TagSearchResult[] | null {
    const key = this.getCacheKey(userId, 'tagSearch', { query: query.toLowerCase(), limit });
    const entry = this.tagSearchCache.get(key);

    if (entry && this.isValidEntry(entry)) {
      this.updateAccessOrder(key);
      return entry.data;
    }

    if (entry) {
      this.tagSearchCache.delete(key);
      this.accessOrder.delete(key);
    }

    return null;
  }

  /**
   * Cache tag search results
   */
  setTagSearchResults(userId: string, query: string, results: TagSearchResult[], limit: number = 20): void {
    const key = this.getCacheKey(userId, 'tagSearch', { query: query.toLowerCase(), limit });
    
    this.evictLRU(this.tagSearchCache, CACHE_CONFIG.MAX_SEARCH_CACHE_SIZE);
    
    this.tagSearchCache.set(key, {
      data: results,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.TAG_SEARCH_TTL,
    });
    
    this.updateAccessOrder(key);
  }

  /**
   * Invalidate user's tag caches (call after tag modifications)
   */
  invalidateUserTagCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    // Collect keys to delete
    for (const key of this.tagListCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of this.tagStatsCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of this.tagSearchCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete collected keys
    keysToDelete.forEach(key => {
      this.tagListCache.delete(key);
      this.tagStatsCache.delete(key);
      this.tagSearchCache.delete(key);
      this.accessOrder.delete(key);
    });
  }

  /**
   * Invalidate specific tag from all relevant caches
   */
  invalidateTag(userId: string, tagId: string): void {
    // More granular invalidation - only invalidate caches that might contain this tag
    const keysToCheck = [
      ...Array.from(this.tagListCache.keys()),
      ...Array.from(this.tagStatsCache.keys()),
      ...Array.from(this.tagSearchCache.keys()),
    ];

    keysToCheck.forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        // For now, invalidate all user caches when any tag changes
        // In the future, we could implement more sophisticated checking
        this.tagListCache.delete(key);
        this.tagStatsCache.delete(key);
        this.tagSearchCache.delete(key);
        this.accessOrder.delete(key);
      }
    });
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.tagListCache.clear();
    this.tagStatsCache.clear();
    this.tagSearchCache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    tagListSize: number;
    tagStatsSize: number;
    tagSearchSize: number;
    totalSize: number;
    hitRatio: number;
  } {
    return {
      tagListSize: this.tagListCache.size,
      tagStatsSize: this.tagStatsCache.size,
      tagSearchSize: this.tagSearchCache.size,
      totalSize: this.tagListCache.size + this.tagStatsCache.size + this.tagSearchCache.size,
      hitRatio: 0, // TODO: Implement hit/miss tracking
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    // Cleanup tag list cache
    for (const [key, entry] of this.tagListCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.tagListCache.delete(key);
        this.accessOrder.delete(key);
      }
    }
    
    // Cleanup tag stats cache
    for (const [key, entry] of this.tagStatsCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.tagStatsCache.delete(key);
        this.accessOrder.delete(key);
      }
    }
    
    // Cleanup tag search cache
    for (const [key, entry] of this.tagSearchCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.tagSearchCache.delete(key);
        this.accessOrder.delete(key);
      }
    }
  }
}

// Global cache instance
export const tagCache = new TagCache();

// Cleanup interval (run every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    tagCache.cleanup();
  }, 5 * 60 * 1000);
}