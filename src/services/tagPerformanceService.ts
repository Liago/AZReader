import { supabase } from '@common/supabase';
import { Tag } from '@common/database-types';
import { tagCache, TagStatistics, TagSearchResult } from '@utils/tagCache';

/**
 * High-performance tag service with intelligent caching and optimized queries
 */
export class TagPerformanceService {
  
  /**
   * Get user's tags with intelligent caching
   */
  async getUserTags(userId: string, forceRefresh: boolean = false): Promise<Tag[]> {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = tagCache.getTagList(userId);
      if (cached) {
        return cached;
      }
    }

    const startTime = performance.now();
    
    try {
      // Use optimized query with proper indexing
      const { data: tags, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          color,
          usage_count,
          created_at,
          created_by
        `)
        .eq('created_by', userId)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching user tags:', error);
        throw error;
      }

      const tags_typed = (tags || []) as Tag[];
      
      // Cache the results
      tagCache.setTagList(userId, tags_typed);
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getUserTags', executionTime, { userId, tagCount: tags_typed.length });
      
      return tags_typed;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getUserTags', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Get tag statistics with caching
   */
  async getTagStatistics(
    userId: string,
    options: {
      sortBy?: 'usage_count' | 'name' | 'last_used';
      limit?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<TagStatistics[]> {
    const { sortBy = 'usage_count', limit = 50, forceRefresh = false } = options;
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = tagCache.getTagStatistics(userId, { sortBy, limit });
      if (cached) {
        return cached;
      }
    }

    const startTime = performance.now();
    
    try {
      // Use materialized view for fast statistics
      const { data: stats, error } = await supabase
        .rpc('get_user_tag_statistics' as any, {
          user_id_param: userId,
          sort_by_param: sortBy,
          limit_count: limit
        });

      if (error) {
        console.error('Error fetching tag statistics:', error);
        throw error;
      }

      const statsTyped = Array.isArray(stats) ? stats as TagStatistics[] : [];
      
      // Cache the results
      tagCache.setTagStatistics(userId, statsTyped, { sortBy, limit });
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getTagStatistics', executionTime, { 
        userId, 
        statsCount: statsTyped.length,
        sortBy,
        limit 
      });
      
      return statsTyped;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getTagStatistics', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Search tags with autocomplete and caching
   */
  async searchTags(
    userId: string,
    query: string,
    options: {
      limit?: number;
      includeUsage?: boolean;
      forceRefresh?: boolean;
    } = {}
  ): Promise<TagSearchResult[]> {
    const { limit = 20, includeUsage = true, forceRefresh = false } = options;
    
    // Don't cache very short queries
    if (!forceRefresh && query.length > 1) {
      const cached = tagCache.getTagSearchResults(userId, query, limit);
      if (cached) {
        return cached;
      }
    }

    const startTime = performance.now();
    
    try {
      // Use optimized search function
      const { data: results, error } = await supabase
        .rpc('search_tags' as any, {
          search_query: query,
          user_id_param: userId,
          limit_count: limit,
          include_usage: includeUsage
        });

      if (error) {
        console.error('Error searching tags:', error);
        throw error;
      }

      const resultsTyped = (results || []) as TagSearchResult[];
      
      // Cache results for queries longer than 1 character
      if (query.length > 1) {
        tagCache.setTagSearchResults(userId, query, resultsTyped, limit);
      }
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('searchTags', executionTime, { 
        userId, 
        query: query.substring(0, 10) + '...',
        resultCount: resultsTyped.length,
        limit 
      });
      
      return resultsTyped;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('searchTags', executionTime, { userId, query, error: true });
      throw error;
    }
  }

  /**
   * Filter articles by tags with optimized pagination and accurate counts
   */
  async filterArticlesByTags(
    userId: string,
    options: {
      tagIds: string[];
      tagOperator?: 'AND' | 'OR';
      readingStatus?: string;
      isFavorite?: boolean;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      pageSize?: number;
      includeCount?: boolean;
    }
  ): Promise<{
    articles: any[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      tagIds,
      tagOperator = 'OR',
      readingStatus,
      isFavorite,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      pageSize = 20,
      includeCount = false
    } = options;

    const startTime = performance.now();
    const offset = (page - 1) * pageSize;
    
    try {
      // Execute filtering and counting in parallel for better performance
      const promises: Promise<any>[] = [
        // Get articles
        supabase.rpc('filter_articles_by_tags' as any, {
          user_id_param: userId,
          tag_ids: tagIds.length > 0 ? tagIds : null,
          tag_operator: tagOperator,
          reading_status_param: readingStatus,
          is_favorite_param: isFavorite,
          date_from: dateFrom,
          date_to: dateTo,
          sort_by: sortBy,
          sort_order: sortOrder,
          page_limit: pageSize + 1, // Get one extra to check if there are more
          page_offset: offset
        })
      ];

      // Add count query if requested or if we need accurate pagination
      if (includeCount || page === 1) {
        promises.push(
          supabase.rpc('count_filtered_articles' as any, {
            user_id_param: userId,
            tag_ids: tagIds.length > 0 ? tagIds : null,
            tag_operator: tagOperator,
            reading_status_param: readingStatus,
            is_favorite_param: isFavorite,
            date_from: dateFrom,
            date_to: dateTo
          })
        );
      }

      const results = await Promise.all(promises);
      const { data: articles, error: articlesError } = results[0];
      const countResult = results[1];

      if (articlesError) {
        console.error('Error filtering articles by tags:', articlesError);
        throw articlesError;
      }

      if (countResult && countResult.error) {
        console.error('Error counting filtered articles:', countResult.error);
        // Don't throw, just log - we can still return articles without count
      }

      const articlesArray = articles || [];
      const hasMore = articlesArray.length > pageSize;
      const resultArticles = hasMore ? articlesArray.slice(0, pageSize) : articlesArray;
      
      // Get total count from count query or estimate
      let totalCount = 0;
      if (countResult && !countResult.error) {
        totalCount = countResult.data || 0;
      } else {
        // Estimate based on current page results
        totalCount = hasMore ? (page * pageSize) + 1 : offset + resultArticles.length;
      }
      
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('filterArticlesByTags', executionTime, {
        userId,
        tagCount: tagIds.length,
        tagOperator,
        resultCount: resultArticles.length,
        totalCount,
        page,
        pageSize,
        includeCount
      });
      
      return {
        articles: resultArticles,
        totalCount,
        hasMore,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('filterArticlesByTags', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Batch tag operations
   */
  async batchTagOperation(
    operationType: 'delete' | 'update_color' | 'merge',
    tagIds: string[],
    options: {
      userId?: string;
      newColor?: string;
      mergeTargetId?: string;
    } = {}
  ): Promise<{ affectedCount: number; operationResult: string }> {
    const { userId, newColor, mergeTargetId } = options;
    const startTime = performance.now();
    
    try {
      const { data: result, error } = await supabase
        .rpc('batch_tag_operation', {
          operation_type: operationType,
          tag_ids: tagIds,
          user_id_param: userId,
          new_color: newColor,
          merge_target_id: mergeTargetId
        });

      if (error) {
        console.error('Error in batch tag operation:', error);
        throw error;
      }

      const operationResult = result?.[0] || { affected_count: 0, operation_result: 'No result' };
      
      // Invalidate caches for affected users
      if (userId) {
        tagCache.invalidateUserTagCache(userId);
      }
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('batchTagOperation', executionTime, {
        operationType,
        tagCount: tagIds.length,
        affectedCount: operationResult.affected_count
      });
      
      return {
        affectedCount: operationResult.affected_count,
        operationResult: operationResult.operation_result
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('batchTagOperation', executionTime, { operationType, error: true });
      throw error;
    }
  }

  /**
   * Create or update tag with cache invalidation
   */
  async createOrUpdateTag(userId: string, tagData: Partial<Tag>): Promise<Tag> {
    const startTime = performance.now();
    
    try {
      const { data: tag, error } = await supabase
        .from('tags')
        .upsert({
          ...tagData,
          created_by: userId,
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating tag:', error);
        throw error;
      }

      // Invalidate user's tag caches
      tagCache.invalidateUserTagCache(userId);
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('createOrUpdateTag', executionTime, { userId });
      
      return tag as Tag;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('createOrUpdateTag', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Delete tag with cache invalidation
   */
  async deleteTag(userId: string, tagId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // First delete all article_tags associations
      const { error: associationError } = await supabase
        .from('article_tags')
        .delete()
        .eq('tag_id', tagId);

      if (associationError) {
        console.error('Error deleting tag associations:', associationError);
        throw associationError;
      }

      // Then delete the tag
      const { error: tagError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('created_by', userId);

      if (tagError) {
        console.error('Error deleting tag:', tagError);
        throw tagError;
      }

      // Invalidate caches
      tagCache.invalidateTag(userId, tagId);
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('deleteTag', executionTime, { userId, tagId });
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('deleteTag', executionTime, { userId, tagId, error: true });
      throw error;
    }
  }

  /**
   * Log query performance for monitoring
   */
  private async logQueryPerformance(
    queryType: string,
    executionTime: number,
    parameters: any = {}
  ): Promise<void> {
    // Only log in development or if execution time is significant
    if (process.env.NODE_ENV === 'development' || executionTime > 100) {
      console.log(`[TagPerformanceService] ${queryType}: ${executionTime.toFixed(2)}ms`, parameters);
    }

    // In production, you might want to send this to a monitoring service
    if (executionTime > 500) {
      try {
        await supabase.rpc('log_slow_query', {
          query_type_param: queryType,
          execution_time_param: Math.round(executionTime),
          parameters_param: parameters,
          user_id_param: parameters.userId
        });
      } catch (error) {
        // Don't throw on logging errors
        console.warn('Failed to log slow query:', error);
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStatistics() {
    return tagCache.getCacheStats();
  }

  /**
   * Get related tags based on co-occurrence patterns
   */
  async getRelatedTags(
    userId: string,
    tagId: string,
    options: {
      limit?: number;
      minCoOccurrence?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<Array<{
    related_tag_id: string;
    related_tag_name: string;
    related_tag_color: string;
    co_occurrence_count: number;
    jaccard_similarity: number;
  }>> {
    const { limit = 10, minCoOccurrence = 2, forceRefresh = false } = options;
    const startTime = performance.now();
    
    try {
      const { data: relatedTags, error } = await supabase
        .rpc('get_related_tags', {
          tag_id_param: tagId,
          user_id_param: userId,
          limit_count: limit,
          min_co_occurrence: minCoOccurrence
        });

      if (error) {
        console.error('Error fetching related tags:', error);
        throw error;
      }

      const relatedTyped = relatedTags || [];
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getRelatedTags', executionTime, { 
        userId, 
        tagId, 
        relatedCount: relatedTyped.length,
        limit,
        minCoOccurrence
      });
      
      return relatedTyped;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getRelatedTags', executionTime, { userId, tagId, error: true });
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  async getPerformanceMetrics(
    userId?: string,
    timeRange: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{
    slowQueries: Array<{
      query_type: string;
      avg_execution_time: number;
      query_count: number;
      max_execution_time: number;
    }>;
    cacheStats: any;
    totalQueries: number;
  }> {
    const startTime = performance.now();
    
    try {
      const timeInterval = timeRange === 'hour' ? '1 hour' : 
                          timeRange === 'day' ? '1 day' : '7 days';
      
      const { data: slowQueries, error } = await supabase
        .from('query_performance_log')
        .select('query_type, execution_time_ms')
        .gte('created_at', new Date(Date.now() - 
          (timeRange === 'hour' ? 60 * 60 * 1000 : 
           timeRange === 'day' ? 24 * 60 * 60 * 1000 : 
           7 * 24 * 60 * 60 * 1000)).toISOString())
        .eq(userId ? 'user_id' : 'id', userId || 'not-null');

      if (error) {
        console.warn('Error fetching performance metrics:', error);
        return {
          slowQueries: [],
          cacheStats: this.getCacheStatistics(),
          totalQueries: 0
        };
      }

      // Aggregate query statistics
      const queryStats = new Map<string, { times: number[], count: number }>();
      
      (slowQueries || []).forEach(query => {
        const key = query.query_type;
        if (!queryStats.has(key)) {
          queryStats.set(key, { times: [], count: 0 });
        }
        const stats = queryStats.get(key)!;
        stats.times.push(query.execution_time_ms);
        stats.count++;
      });

      const aggregatedQueries = Array.from(queryStats.entries()).map(([queryType, stats]) => ({
        query_type: queryType,
        avg_execution_time: Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length),
        query_count: stats.count,
        max_execution_time: Math.max(...stats.times)
      })).sort((a, b) => b.avg_execution_time - a.avg_execution_time);

      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getPerformanceMetrics', executionTime, { 
        userId,
        timeRange,
        queryCount: aggregatedQueries.length
      });

      return {
        slowQueries: aggregatedQueries,
        cacheStats: this.getCacheStatistics(),
        totalQueries: (slowQueries || []).length
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('getPerformanceMetrics', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Optimize user's tag data (cleanup, recount, etc.)
   */
  async optimizeUserTagData(userId: string): Promise<{
    cleanedTags: number;
    updatedCounts: number;
    refreshedCache: boolean;
  }> {
    const startTime = performance.now();
    
    try {
      // Refresh materialized view
      await supabase.rpc('refresh_tag_statistics' as any);
      
      // Update tag usage counts
      const { data: updateResult, error: updateError } = await supabase
        .rpc('batch_tag_operation' as any, {
          operation_type: 'update_counts',
          tag_ids: [],
          user_id_param: userId
        });

      if (updateError) {
        console.warn('Error updating tag counts:', updateError);
      }

      // Clear user's cache
      this.invalidateUserCache(userId);
      
      // Log performance
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('optimizeUserTagData', executionTime, { userId });

      return {
        cleanedTags: 0, // TODO: Implement actual cleanup
        updatedCounts: (Array.isArray(updateResult) && updateResult[0] ? updateResult[0].affected_count : 0) || 0,
        refreshedCache: true
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.logQueryPerformance('optimizeUserTagData', executionTime, { userId, error: true });
      throw error;
    }
  }

  /**
   * Clear all caches (useful for testing or manual cache refresh)
   */
  clearAllCaches(): void {
    tagCache.clearAll();
  }

  /**
   * Invalidate user's caches
   */
  invalidateUserCache(userId: string): void {
    tagCache.invalidateUserTagCache(userId);
  }
}

// Export singleton instance
export const tagPerformanceService = new TagPerformanceService();