// Enhanced Search Service for Multi-Field Full-Text Search
// Task 10.8: Multi-field search logic implementation

import { supabase } from '@common/supabase';
import { Article } from '@common/database-types';

// Enhanced interfaces for multi-field search
export interface EnhancedSearchFilters {
  query: string;
  tagIds?: string[];
  includeRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  domainFilter?: string;
  sortBy?: 'relevance' | 'date' | 'title' | 'author';
  searchMode?: 'simple' | 'phrase' | 'advanced';
}

export interface EnhancedSearchResult extends Omit<Article, 'tags'> {
  tags?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  relevance_score?: number;
  snippet?: string;
  matched_fields?: string[]; // New: shows which fields matched
  search_context?: {
    query_type: 'simple' | 'phrase' | 'complex';
    normalized_query: string;
    execution_time_ms: number;
  };
}

export interface EnhancedPaginatedSearchResults {
  results: EnhancedSearchResult[];
  totalCount: number;
  hasMore: boolean;
  query: string;
  filters: EnhancedSearchFilters;
  executionTimeMs: number;
  searchStats: {
    field_matches: {
      title: number;
      content: number;
      author: number;
      tags: number;
    };
    query_complexity: 'simple' | 'phrase' | 'complex';
    performance_score: number;
  };
}

export interface SearchQueryAnalysis {
  original_query: string;
  normalized_query: string;
  query_type: 'simple' | 'phrase' | 'complex';
  detected_operators: string[];
  phrase_parts: string[];
  word_count: number;
  estimated_complexity: number;
}

export class EnhancedSearchService {
  private static instance: EnhancedSearchService;

  private constructor() {}

  public static getInstance(): EnhancedSearchService {
    if (!EnhancedSearchService.instance) {
      EnhancedSearchService.instance = new EnhancedSearchService();
    }
    return EnhancedSearchService.instance;
  }

  /**
   * Analyze search query to understand its structure and complexity
   */
  analyzeSearchQuery(query: string): SearchQueryAnalysis {
    const trimmedQuery = query.trim();
    
    // Detect phrases (quoted text)
    const phraseMatches = trimmedQuery.match(/"[^"]+"|'[^']+'/g) || [];
    const phrases = phraseMatches.map(p => p.slice(1, -1)); // Remove quotes
    
    // Detect operators
    const operatorMatches = trimmedQuery.match(/\b(AND|OR|NOT)\b|\&|\||\!/gi) || [];
    const operators = [...new Set(operatorMatches.map(op => op.toUpperCase()))];
    
    // Determine query type
    let queryType: 'simple' | 'phrase' | 'complex' = 'simple';
    if (phrases.length > 0) {
      queryType = 'phrase';
    } else if (operators.length > 0) {
      queryType = 'complex';
    }
    
    // Normalize query for database
    let normalizedQuery = trimmedQuery;
    
    // Replace operators
    normalizedQuery = normalizedQuery
      .replace(/\bAND\b/gi, ' & ')
      .replace(/\bOR\b/gi, ' | ')
      .replace(/\bNOT\b/gi, ' !');
    
    // Word count (excluding operators)
    const words = trimmedQuery
      .replace(/["']/g, '')
      .replace(/\b(AND|OR|NOT)\b|\&|\||\!/gi, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // Estimate complexity based on various factors
    const estimatedComplexity = Math.min(10, 
      words.length * 0.5 + 
      phrases.length * 2 + 
      operators.length * 1.5
    );

    return {
      original_query: trimmedQuery,
      normalized_query: normalizedQuery,
      query_type: queryType,
      detected_operators: operators,
      phrase_parts: phrases,
      word_count: words.length,
      estimated_complexity: estimatedComplexity
    };
  }

  /**
   * Enhanced sanitization for multi-field search queries
   */
  private sanitizeSearchQuery(query: string): string {
    if (!query) return '';

    // Remove potentially dangerous characters but preserve search operators and quotes
    let sanitized = query
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length

    // Handle search operators (preserve functionality)
    sanitized = sanitized
      .replace(/\bAND\b/gi, ' & ')
      .replace(/\bOR\b/gi, ' | ')
      .replace(/\bNOT\b/gi, ' !')
      .replace(/[&|!]+/g, match => match.charAt(0)); // Remove duplicate operators

    return sanitized;
  }

  /**
   * Enhanced multi-field search with weighted results
   */
  async searchArticles(
    userId: string,
    filters: EnhancedSearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<EnhancedPaginatedSearchResults> {
    if (!filters.query || filters.query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const startTime = Date.now();

    try {
      // Analyze the query first
      const queryAnalysis = this.analyzeSearchQuery(filters.query);
      
      // Sanitize and prepare search parameters
      const sanitizedQuery = this.sanitizeSearchQuery(filters.query);
      const tagIds = filters.tagIds && filters.tagIds.length > 0 ? filters.tagIds : null;

      // Call the enhanced database search function
      const { data: searchResults, error } = await supabase.rpc('search_articles', {
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
        console.error('Enhanced search error:', error);
        throw new Error(`Enhanced search failed: ${error.message}`);
      }

      const executionTimeMs = Date.now() - startTime;

      // Process results with enhanced information
      const processedResults = await Promise.all(
        (searchResults || []).map(async (result: any) => ({
          ...result,
          tags: result.tags || [],
          snippet: await this.generateEnhancedSnippet(result.content, sanitizedQuery, queryAnalysis),
          matched_fields: result.matched_fields || [],
          search_context: {
            query_type: queryAnalysis.query_type,
            normalized_query: queryAnalysis.normalized_query,
            execution_time_ms: executionTimeMs
          }
        }))
      );

      // Calculate field match statistics
      const fieldMatches = {
        title: 0,
        content: 0,
        author: 0,
        tags: 0
      };

      processedResults.forEach(result => {
        if (result.matched_fields) {
          result.matched_fields.forEach(field => {
            if (field in fieldMatches) {
              fieldMatches[field as keyof typeof fieldMatches]++;
            }
          });
        }
      });

      // Calculate performance score (0-100)
      const performanceScore = Math.min(100, 
        Math.max(0, 100 - (executionTimeMs / 10)) // 1000ms = 0 score, 0ms = 100 score
      );

      // Get total count for pagination
      const totalCount = processedResults.length < limit 
        ? offset + processedResults.length 
        : offset + processedResults.length + 1;

      const hasMore = processedResults.length === limit;

      // Log search query for analytics with enhanced data
      try {
        await this.logEnhancedSearchQuery(
          userId, 
          sanitizedQuery, 
          processedResults.length, 
          executionTimeMs, 
          filters,
          queryAnalysis
        );
      } catch (logError) {
        console.warn('Failed to log enhanced search query:', logError);
      }

      return {
        results: processedResults,
        totalCount,
        hasMore,
        query: sanitizedQuery,
        filters,
        executionTimeMs,
        searchStats: {
          field_matches: fieldMatches,
          query_complexity: queryAnalysis.query_type,
          performance_score: performanceScore
        }
      };

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      console.error('Enhanced search service error:', error);
      
      // Log failed search with analysis
      try {
        const queryAnalysis = this.analyzeSearchQuery(filters.query);
        await this.logEnhancedSearchQuery(
          userId, 
          filters.query, 
          0, 
          executionTimeMs, 
          filters,
          queryAnalysis
        );
      } catch (logError) {
        console.warn('Failed to log failed enhanced search query:', logError);
      }

      throw error;
    }
  }

  /**
   * Generate enhanced snippet with multi-field context
   */
  private async generateEnhancedSnippet(
    content: string, 
    query: string, 
    queryAnalysis: SearchQueryAnalysis,
    length: number = 200
  ): Promise<string> {
    if (!content || !query) {
      return content ? content.substring(0, length) + (content.length > length ? '...' : '') : '';
    }

    try {
      // Use the enhanced database snippet function
      const { data: snippet, error } = await supabase.rpc('generate_search_snippet', {
        content_text: content,
        search_query: queryAnalysis.normalized_query,
        snippet_length: length,
        highlight_tag: '<mark>'
      });

      if (error || !snippet) {
        // Fallback to enhanced client-side snippet generation
        return this.generateClientSideSnippet(content, query, queryAnalysis, length);
      }

      return snippet;

    } catch (error) {
      console.warn('Failed to generate enhanced snippet, using fallback:', error);
      return this.generateClientSideSnippet(content, query, queryAnalysis, length);
    }
  }

  /**
   * Enhanced client-side snippet generation with phrase and operator support
   */
  private generateClientSideSnippet(
    content: string, 
    query: string, 
    queryAnalysis: SearchQueryAnalysis,
    length: number = 200
  ): string {
    if (!content) return '';

    let searchTerms: string[] = [];
    
    if (queryAnalysis.query_type === 'phrase' && queryAnalysis.phrase_parts.length > 0) {
      // For phrase search, look for exact phrases
      searchTerms = queryAnalysis.phrase_parts;
    } else {
      // For simple/complex search, extract individual words
      searchTerms = query.toLowerCase()
        .replace(/[&|!]/g, ' ')
        .split(' ')
        .filter(word => word.length > 2 && !['and', 'or', 'not'].includes(word));
    }

    if (searchTerms.length === 0) {
      return content.substring(0, length) + (content.length > length ? '...' : '');
    }

    // Find best position for snippet
    const contentLower = content.toLowerCase();
    let bestStartPos = 0;
    let bestScore = 0;

    for (const term of searchTerms) {
      const pos = contentLower.indexOf(term.toLowerCase());
      if (pos !== -1) {
        // Score based on position and term importance
        const score = (contentLower.length - pos) / contentLower.length;
        if (score > bestScore) {
          bestScore = score;
          bestStartPos = Math.max(0, pos - 50);
        }
      }
    }

    // Adjust to word boundaries
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

    // Highlight search terms
    for (const term of searchTerms) {
      const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
      snippet = snippet.replace(regex, '<mark>$&</mark>');
    }

    return snippet;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Log enhanced search query with analysis data
   */
  private async logEnhancedSearchQuery(
    userId: string,
    query: string,
    resultCount: number,
    executionTimeMs: number,
    filters: EnhancedSearchFilters,
    queryAnalysis: SearchQueryAnalysis
  ): Promise<void> {
    try {
      // Prepare enhanced filters for logging
      const enhancedLogFilters = {
        sortBy: filters.sortBy,
        includeRead: filters.includeRead,
        searchMode: filters.searchMode,
        hasTagFilter: !!(filters.tagIds && filters.tagIds.length > 0),
        hasDomainFilter: !!filters.domainFilter,
        hasDateFilter: !!(filters.dateFrom || filters.dateTo),
        queryAnalysis: {
          type: queryAnalysis.query_type,
          complexity: queryAnalysis.estimated_complexity,
          operators: queryAnalysis.detected_operators,
          phrases: queryAnalysis.phrase_parts.length,
          words: queryAnalysis.word_count
        }
      };

      await supabase.rpc('log_search_query', {
        user_id_param: userId,
        query_text_param: query,
        result_count_param: resultCount,
        execution_time_param: executionTimeMs,
        filters_param: enhancedLogFilters
      });

    } catch (error) {
      console.warn('Failed to log enhanced search query:', error);
      // Don't throw - logging is not critical
    }
  }

  /**
   * Get search suggestions with enhanced context
   */
  async getEnhancedSearchSuggestions(
    userId: string, 
    queryPrefix: string, 
    limit: number = 10
  ): Promise<Array<{
    suggestion: string;
    suggestion_type: 'tag' | 'author' | 'domain';
    frequency: number;
    last_used: string;
    context?: string;
    relevance_score?: number;
  }>> {
    if (!queryPrefix || queryPrefix.trim().length < 2) {
      return [];
    }

    try {
      const { data: suggestions, error } = await supabase.rpc('get_search_suggestions', {
        user_id_param: userId,
        query_prefix: queryPrefix.trim(),
        suggestion_limit: limit
      });

      if (error) {
        console.error('Enhanced suggestions error:', error);
        return [];
      }

      // Enhance suggestions with context and scoring
      return (suggestions || []).map(suggestion => ({
        ...suggestion,
        context: this.generateSuggestionContext(suggestion),
        relevance_score: this.calculateSuggestionRelevance(suggestion, queryPrefix)
      }));

    } catch (error) {
      console.error('Get enhanced suggestions error:', error);
      return [];
    }
  }

  /**
   * Generate context for search suggestions
   */
  private generateSuggestionContext(suggestion: any): string {
    switch (suggestion.suggestion_type) {
      case 'tag':
        return `Tag used ${suggestion.frequency} times`;
      case 'author':
        return `Author with ${suggestion.frequency} articles`;
      case 'domain':
        return `${suggestion.frequency} articles from this domain`;
      default:
        return '';
    }
  }

  /**
   * Calculate relevance score for suggestions
   */
  private calculateSuggestionRelevance(suggestion: any, queryPrefix: string): number {
    const text = suggestion.suggestion.toLowerCase();
    const prefix = queryPrefix.toLowerCase();
    
    // Exact prefix match gets highest score
    if (text.startsWith(prefix)) {
      return 1.0;
    }
    
    // Contains prefix gets medium score
    if (text.includes(prefix)) {
      return 0.7;
    }
    
    // Frequency-based scoring for others
    return Math.min(0.5, (suggestion.frequency || 0) / 100);
  }
}

// Export singleton instance
export const enhancedSearchService = EnhancedSearchService.getInstance();

// Export utility functions
export const searchArticlesEnhanced = (
  userId: string, 
  filters: EnhancedSearchFilters, 
  limit?: number, 
  offset?: number
) => enhancedSearchService.searchArticles(userId, filters, limit, offset);

export const getEnhancedSearchSuggestions = (
  userId: string, 
  queryPrefix: string, 
  limit?: number
) => enhancedSearchService.getEnhancedSearchSuggestions(userId, queryPrefix, limit);

export const analyzeQuery = (query: string) => 
  enhancedSearchService.analyzeSearchQuery(query);

export default enhancedSearchService;