import { supabase } from '@common/supabase';
import { Article } from '@common/database-types';
import { searchCache } from '@utils/searchCache';

export interface SearchFilters {
  query: string;
  tagIds?: string[];
  includeRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  domainFilter?: string;
  sortBy?: 'relevance' | 'date' | 'title' | 'author' | 'popularity';
}

export interface SearchResult extends Omit<Article, 'tags'> {
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  relevance_score?: number;
  snippet?: string;
}

export interface PaginatedSearchResults {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  query: string;
  filters: SearchFilters;
  executionTimeMs: number;
}

export interface SearchSuggestion {
  suggestion: string;
  suggestion_type: 'tag' | 'author' | 'domain';
  frequency: number;
  last_used: string;
}

export interface SearchStatistics {
  total_articles: number;
  total_tags: number;
  total_authors: number;
  total_domains: number;
  articles_last_week: number;
  most_common_tags: Array<{ name: string; count: number }>;
  most_common_authors: Array<{ author: string; count: number }>;
  most_common_domains: Array<{ domain: string; count: number }>;
}

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Perform full-text search across articles with intelligent caching
   */
  async searchArticles(
    userId: string,
    filters: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<PaginatedSearchResults> {
    if (!filters.query || filters.query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    // Check cache first for exact query match
    const cachedResult = searchCache.getCachedSearchResults(userId, filters.query, filters, limit, offset);
    if (cachedResult) {
      return cachedResult;
    }

    const startTime = Date.now();

    try {
      // Sanitize and prepare search parameters
      const sanitizedQuery = this.sanitizeSearchQuery(filters.query);
      const tagIds = filters.tagIds && filters.tagIds.length > 0 ? filters.tagIds : null;

      // Call the database search function
      const { data: dbSearchResults, error } = await supabase.rpc('search_articles' as any, {
        user_id_param: userId,
        search_query: sanitizedQuery,
        tag_ids: tagIds,
        include_read: filters.includeRead ?? true,
        date_from: filters.dateFrom?.toISOString() || null,
        date_to: filters.dateTo?.toISOString() || null,
        domain_filter: filters.domainFilter || null,
        sort_by: filters.sortBy || 'relevance',
        limit_count: limit,
        offset_count: offset
      });

      if (error) {
        console.error('Search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      const executionTimeMs = Date.now() - startTime;

      // Process results and generate snippets
      const resultsArray = Array.isArray(dbSearchResults) ? dbSearchResults : [];
      const processedResults = await Promise.all(
        resultsArray.map(async (result: any) => ({
          ...result,
          tags: result.tags || [],
          snippet: await this.generateSnippet(result.content, sanitizedQuery)
        }))
      );

      // Get total count for pagination (approximate for performance)
      const totalCount = processedResults.length < limit 
        ? offset + processedResults.length 
        : offset + processedResults.length + 1; // Indicate there might be more

      const hasMore = processedResults.length === limit;

      // Log search query for analytics
      try {
        await this.logSearchQuery(userId, sanitizedQuery, processedResults.length, executionTimeMs, filters);
      } catch (logError) {
        console.warn('Failed to log search query:', logError);
      }

      const searchResults = {
        results: processedResults,
        totalCount,
        hasMore,
        query: sanitizedQuery,
        filters,
        executionTimeMs
      };

      // Cache the results for future use
      try {
        searchCache.setCachedSearchResults(
          userId, 
          filters.query, 
          filters, 
          searchResults, 
          executionTimeMs, 
          limit, 
          offset
        );
      } catch (cacheError) {
        console.warn('Failed to cache search results:', cacheError);
      }

      return searchResults;

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      console.error('Search service error:', error);
      
      // Log failed search
      try {
        await this.logSearchQuery(userId, filters.query, 0, executionTimeMs, filters);
      } catch (logError) {
        console.warn('Failed to log failed search query:', logError);
      }

      throw error;
    }
  }

  /**
   * Get search suggestions based on user's content
   */
  async getSearchSuggestions(
    userId: string, 
    queryPrefix: string, 
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    if (!queryPrefix || queryPrefix.trim().length < 2) {
      return [];
    }

    try {
      const { data: suggestions, error } = await supabase.rpc('get_search_suggestions' as any, {
        user_id_param: userId,
        query_prefix: queryPrefix.trim(),
        suggestion_limit: limit
      });

      if (error) {
        console.error('Suggestions error:', error);
        return [];
      }

      return Array.isArray(suggestions) ? suggestions : [];

    } catch (error) {
      console.error('Get suggestions error:', error);
      return [];
    }
  }

  /**
   * Get search statistics for the user
   */
  async getSearchStatistics(userId: string, daysBack: number = 30): Promise<SearchStatistics | null> {
    try {
      const { data: stats, error } = await supabase.rpc('get_search_statistics' as any, {
        user_id_param: userId,
        days_back: daysBack
      });

      if (error) {
        console.error('Search statistics error:', error);
        return null;
      }

      return (Array.isArray(stats) && stats[0]) ? stats[0] : null;

    } catch (error) {
      console.error('Get search statistics error:', error);
      return null;
    }
  }

  /**
   * Get recent search queries for the user
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<Array<{
    query_text: string;
    result_count: number;
    created_at: string;
  }>> {
    try {
      const { data: searches, error } = await supabase
        .from('search_queries' as any)
        .select('query_text, result_count, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Recent searches error:', error);
        return [];
      }

      return Array.isArray(searches) ? searches as any[] : [];

    } catch (error) {
      console.error('Get recent searches error:', error);
      return [];
    }
  }

  /**
   * Sanitize search query to prevent injection and improve search quality
   */
  private sanitizeSearchQuery(query: string): string {
    if (!query) return '';

    // Remove potentially dangerous characters but keep useful ones
    let sanitized = query
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break queries
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length

    // Handle special search operators
    sanitized = sanitized
      .replace(/\bAND\b/gi, ' & ')
      .replace(/\bOR\b/gi, ' | ')
      .replace(/\bNOT\b/gi, ' !')
      .replace(/[&|!]+/g, match => match.charAt(0)); // Remove duplicate operators

    return sanitized;
  }

  /**
   * Generate search snippet with highlighting
   */
  private async generateSnippet(content: string, query: string, length: number = 200): Promise<string> {
    if (!content || !query) {
      return content ? content.substring(0, length) + (content.length > length ? '...' : '') : '';
    }

    try {
      const { data: snippet, error } = await supabase.rpc('generate_search_snippet' as any, {
        content_text: content,
        search_query: query,
        snippet_length: length,
        highlight_tag: '<mark>'
      });

      if (error || !snippet) {
        // Fallback to simple snippet generation
        return this.generateSimpleSnippet(content, query, length);
      }

      return typeof snippet === 'string' ? snippet : String(snippet || '');

    } catch (error) {
      console.warn('Failed to generate snippet, using fallback:', error);
      return this.generateSimpleSnippet(content, query, length);
    }
  }

  /**
   * Fallback snippet generation (client-side)
   */
  private generateSimpleSnippet(content: string, query: string, length: number = 200): string {
    if (!content) return '';

    const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
    if (words.length === 0) {
      return content.substring(0, length) + (content.length > length ? '...' : '');
    }

    // Find first occurrence of any search word
    const contentLower = content.toLowerCase();
    let bestStartPos = 0;
    let bestWordPos = content.length;

    for (const word of words) {
      const pos = contentLower.indexOf(word);
      if (pos !== -1 && pos < bestWordPos) {
        bestWordPos = pos;
        bestStartPos = Math.max(0, pos - 50);
      }
    }

    // Adjust start position to word boundaries
    while (bestStartPos > 0 && content.charAt(bestStartPos) !== ' ') {
      bestStartPos--;
    }

    let endPos = bestStartPos + length;
    if (endPos < content.length) {
      while (endPos > bestStartPos && content.charAt(endPos) !== ' ') {
        endPos--;
      }
    } else {
      endPos = content.length;
    }

    let snippet = content.substring(bestStartPos, endPos);
    
    // Add ellipsis
    if (bestStartPos > 0) snippet = '...' + snippet;
    if (endPos < content.length) snippet = snippet + '...';

    // Simple highlighting
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      snippet = snippet.replace(regex, '<mark>$&</mark>');
    }

    return snippet;
  }

  /**
   * Log search query for analytics
   */
  private async logSearchQuery(
    userId: string,
    query: string,
    resultCount: number,
    executionTimeMs: number,
    filters: SearchFilters
  ): Promise<void> {
    try {
      // Prepare filters for logging (remove sensitive data)
      const logFilters = {
        sortBy: filters.sortBy,
        includeRead: filters.includeRead,
        hasTagFilter: !!(filters.tagIds && filters.tagIds.length > 0),
        hasDomainFilter: !!filters.domainFilter,
        hasDateFilter: !!(filters.dateFrom || filters.dateTo)
      };

      await supabase.rpc('log_search_query' as any, {
        user_id_param: userId,
        query_text_param: query,
        result_count_param: resultCount,
        execution_time_param: executionTimeMs,
        filters_param: logFilters
      });

    } catch (error) {
      console.warn('Failed to log search query:', error);
      // Don't throw - logging is not critical
    }
  }

  /**
   * Clear search query logs (for privacy)
   */
  async clearSearchHistory(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('search_queries' as any)
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Clear search history error:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Clear search history error:', error);
      return false;
    }
  }

  /**
   * Get search performance analytics
   */
  async getSearchAnalytics(userId: string, days: number = 30): Promise<{
    totalSearches: number;
    averageResultCount: number;
    averageExecutionTime: number;
    popularQueries: Array<{ query: string; count: number }>;
    slowQueries: Array<{ query: string; avg_time: number; count: number }>;
  } | null> {
    try {
      const { data: analytics, error } = await supabase
        .from('search_queries' as any)
        .select('query_text, result_count, execution_time_ms, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (error || !analytics) {
        console.error('Search analytics error:', error);
        return null;
      }

      // Process analytics data
      const totalSearches = analytics.length;
      const averageResultCount = analytics.reduce((sum, q: any) => sum + (q.result_count || 0), 0) / totalSearches;
      const averageExecutionTime = analytics.reduce((sum, q: any) => sum + (q.execution_time_ms || 0), 0) / totalSearches;

      // Popular queries
      const queryFreq: { [key: string]: number } = {};
      analytics.forEach((q: any) => {
        queryFreq[q.query_text] = (queryFreq[q.query_text] || 0) + 1;
      });
      const popularQueries = Object.entries(queryFreq)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Slow queries
      const queryTimes: { [key: string]: number[] } = {};
      analytics.forEach((q: any) => {
        if (!queryTimes[q.query_text]) queryTimes[q.query_text] = [];
        queryTimes[q.query_text]?.push(q.execution_time_ms || 0);
      });
      const slowQueries = Object.entries(queryTimes)
        .map(([query, times]) => ({
          query,
          avg_time: times.reduce((sum, time) => sum + time, 0) / times.length,
          count: times.length
        }))
        .filter(q => q.avg_time > 500) // Only queries slower than 500ms
        .sort((a, b) => b.avg_time - a.avg_time)
        .slice(0, 10);

      return {
        totalSearches,
        averageResultCount,
        averageExecutionTime,
        popularQueries,
        slowQueries
      };

    } catch (error) {
      console.error('Get search analytics error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();

// Export utility functions
export const searchArticles = (userId: string, filters: SearchFilters, limit?: number, offset?: number) => 
  searchService.searchArticles(userId, filters, limit, offset);

export const getSearchSuggestions = (userId: string, queryPrefix: string, limit?: number) => 
  searchService.getSearchSuggestions(userId, queryPrefix, limit);

export const getSearchStatistics = (userId: string, daysBack?: number) => 
  searchService.getSearchStatistics(userId, daysBack);

export const clearSearchHistory = (userId: string) => 
  searchService.clearSearchHistory(userId);

export default searchService;