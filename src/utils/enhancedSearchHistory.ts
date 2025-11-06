import { SearchFilters } from '@services/searchService';

// Enhanced search query with metadata
export interface EnhancedSearchQuery {
  id: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  executionTimeMs: number;
  filters?: Partial<SearchFilters>;
  clickedResults: number;
  context: SearchContext;
  success: boolean; // Whether the search yielded useful results
  frequency: number; // How many times this exact query was performed
}

export interface SearchContext {
  source: 'manual' | 'suggestion' | 'autocomplete' | 'history';
  sessionId: string;
  previousQuery?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'trending' | 'semantic' | 'typo-correction';
  score: number;
  metadata: {
    frequency?: number;
    lastUsed?: Date;
    avgResultCount?: number;
    successRate?: number;
    relatedQueries?: string[];
    context?: string;
  };
}

export interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultCount: number;
  mostSearchedTerms: Array<{ query: string; count: number }>;
  searchPatterns: {
    peakHours: number[];
    commonFilters: string[];
    averageSessionLength: number;
  };
  suggestionUsage: {
    acceptanceRate: number;
    mostUsedTypes: string[];
  };
}

const ENHANCED_SEARCH_HISTORY_KEY = 'azreader_enhanced_search_history';
const SEARCH_SESSIONS_KEY = 'azreader_search_sessions';
const MAX_ENHANCED_HISTORY = 100;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class EnhancedSearchHistoryManager {
  private static instance: EnhancedSearchHistoryManager;
  private history: EnhancedSearchQuery[] = [];
  private currentSessionId: string;
  private sessionStartTime: Date;

  private constructor() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.loadHistory();
    this.cleanupExpiredSessions();
  }

  public static getInstance(): EnhancedSearchHistoryManager {
    if (!EnhancedSearchHistoryManager.instance) {
      EnhancedSearchHistoryManager.instance = new EnhancedSearchHistoryManager();
    }
    return EnhancedSearchHistoryManager.instance;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current time of day category
   */
  private getTimeOfDay(): SearchContext['timeOfDay'] {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Load enhanced search history from localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(ENHANCED_SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load enhanced search history:', error);
      this.history = [];
    }
  }

  /**
   * Save enhanced search history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(ENHANCED_SEARCH_HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save enhanced search history:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT_MS);
    this.history = this.history.filter(item => item.timestamp > cutoffTime);
    this.saveHistory();
  }

  /**
   * Add enhanced search query to history
   */
  public addSearch(
    query: string,
    resultCount: number = 0,
    executionTimeMs: number = 0,
    filters?: Partial<SearchFilters>,
    source: SearchContext['source'] = 'manual'
  ): string {
    if (!query || query.trim().length === 0) {
      return '';
    }

    const trimmedQuery = query.trim();
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if this is a repeated query
    const existingQuery = this.history.find(item => item.query === trimmedQuery);
    const frequency = existingQuery ? existingQuery.frequency + 1 : 1;

    // Get previous query for context
    const previousQuery = this.history.length > 0 ? this.history[0]?.query : undefined;

    const enhancedQuery: EnhancedSearchQuery = {
      id: queryId,
      query: trimmedQuery,
      timestamp: new Date(),
      resultCount,
      executionTimeMs,
      filters,
      clickedResults: 0,
      frequency,
      success: resultCount > 0,
      context: {
        source,
        sessionId: this.currentSessionId,
        previousQuery,
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().toLocaleDateString('en', { weekday: 'long' })
      }
    };

    // Remove existing entry if it exists (we'll add the updated one)
    this.history = this.history.filter(item => item.query !== trimmedQuery);

    // Add new entry at the beginning
    this.history.unshift(enhancedQuery);

    // Limit history size
    if (this.history.length > MAX_ENHANCED_HISTORY) {
      this.history = this.history.slice(0, MAX_ENHANCED_HISTORY);
    }

    this.saveHistory();
    return queryId;
  }

  /**
   * Record that a user clicked on search results
   */
  public recordResultClick(queryId: string, clickCount: number = 1): void {
    const queryIndex = this.history.findIndex(item => item.id === queryId);
    if (queryIndex !== -1 && this.history[queryIndex]) {
      this.history[queryIndex]!.clickedResults += clickCount;
      this.history[queryIndex]!.success = true; // Mark as successful if user clicked
      this.saveHistory();
    }
  }

  /**
   * Get intelligent search suggestions
   */
  public getSearchSuggestions(input: string, limit: number = 10): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const inputLower = input.toLowerCase().trim();

    if (inputLower.length === 0) {
      return this.getPopularSuggestions(limit);
    }

    // Recent matching queries
    const recentMatches = this.history
      .filter(item => 
        item.query.toLowerCase().includes(inputLower) && 
        item.success && 
        item.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 3)
      .map(item => ({
        text: item.query,
        type: 'recent' as const,
        score: 0.9 - (Date.now() - item.timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000),
        metadata: {
          frequency: item.frequency,
          lastUsed: item.timestamp,
          avgResultCount: item.resultCount,
          successRate: 1.0
        }
      }));

    suggestions.push(...recentMatches);

    // Popular queries that match
    const popularMatches = this.getPopularQueries()
      .filter(item => 
        item.query.toLowerCase().includes(inputLower) &&
        !suggestions.some(s => s.text === item.query)
      )
      .slice(0, 3)
      .map(item => ({
        text: item.query,
        type: 'popular' as const,
        score: Math.min(0.8, item.count / 10),
        metadata: {
          frequency: item.count,
          successRate: this.getQuerySuccessRate(item.query)
        }
      }));

    suggestions.push(...popularMatches);

    // Typo correction suggestions
    const typoSuggestions = this.getTypoCorrectionSuggestions(inputLower, 2);
    suggestions.push(...typoSuggestions);

    // Semantic suggestions (similar queries)
    const semanticSuggestions = this.getSemanticSuggestions(inputLower, 2);
    suggestions.push(...semanticSuggestions);

    // Sort by score and return top results
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get popular suggestions when no input
   */
  private getPopularSuggestions(limit: number): SearchSuggestion[] {
    const popular = this.getPopularQueries().slice(0, limit);
    return popular.map(item => ({
      text: item.query,
      type: 'popular' as const,
      score: Math.min(0.9, item.count / 10),
      metadata: {
        frequency: item.count,
        successRate: this.getQuerySuccessRate(item.query)
      }
    }));
  }

  /**
   * Get popular queries by frequency
   */
  private getPopularQueries(): Array<{ query: string; count: number }> {
    const queryFrequency: { [key: string]: number } = {};
    
    this.history.forEach(item => {
      if (item.success) {
        queryFrequency[item.query] = (queryFrequency[item.query] || 0) + item.frequency;
      }
    });

    return Object.entries(queryFrequency)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate success rate for a query
   */
  private getQuerySuccessRate(query: string): number {
    const queryHistory = this.history.filter(item => item.query === query);
    if (queryHistory.length === 0) return 0;
    
    const successfulQueries = queryHistory.filter(item => item.success).length;
    return successfulQueries / queryHistory.length;
  }

  /**
   * Get typo correction suggestions using simple edit distance
   */
  private getTypoCorrectionSuggestions(input: string, limit: number): SearchSuggestion[] {
    if (input.length < 3) return [];

    const candidates = this.history
      .filter(item => 
        item.success && 
        Math.abs(item.query.length - input.length) <= 2 &&
        item.query.toLowerCase() !== input
      )
      .map(item => ({
        query: item.query,
        distance: this.editDistance(input, item.query.toLowerCase()),
        frequency: item.frequency
      }))
      .filter(item => item.distance <= 2 && item.distance > 0)
      .sort((a, b) => a.distance - b.distance || b.frequency - a.frequency)
      .slice(0, limit);

    return candidates.map(item => ({
      text: item.query,
      type: 'typo-correction' as const,
      score: 0.7 - (item.distance * 0.2),
      metadata: {
        frequency: item.frequency,
        context: `Did you mean "${item.query}"?`
      }
    }));
  }

  /**
   * Simple edit distance calculation
   */
  private editDistance(str1: string, str2: string): number {
    const rows = str2.length + 1;
    const cols = str1.length + 1;
    const matrix: number[][] = [];
    
    // Initialize matrix with proper dimensions
    for (let i = 0; i < rows; i++) {
      matrix[i] = new Array(cols).fill(0);
    }

    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) {
      if (matrix[0]) matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      const row = matrix[j];
      if (row) row[0] = j;
    }

    // Calculate edit distance
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        const currentRow = matrix[j];
        const previousRow = matrix[j - 1];
        
        if (currentRow && previousRow) {
          currentRow[i] = Math.min(
            (currentRow[i - 1] || 0) + 1, // deletion
            (previousRow[i] || 0) + 1, // insertion
            (previousRow[i - 1] || 0) + indicator // substitution
          );
        }
      }
    }

    const lastRow = matrix[str2.length];
    return lastRow ? (lastRow[str1.length] || 0) : 0;
  }

  /**
   * Get semantic suggestions (queries with similar words)
   */
  private getSemanticSuggestions(input: string, limit: number): SearchSuggestion[] {
    const inputWords = input.split(/\s+/).filter(word => word.length > 2);
    if (inputWords.length === 0) return [];

    const semanticMatches = this.history
      .filter(item => item.success)
      .map(item => {
        const queryWords = item.query.toLowerCase().split(/\s+/);
        const commonWords = inputWords.filter(word => 
          queryWords.some(qWord => qWord.includes(word) || word.includes(qWord))
        );
        
        const similarity = commonWords.length / Math.max(inputWords.length, queryWords.length);
        
        return {
          query: item.query,
          similarity,
          frequency: item.frequency
        };
      })
      .filter(item => 
        item.similarity > 0.3 && 
        item.query.toLowerCase() !== input &&
        !item.query.toLowerCase().includes(input)
      )
      .sort((a, b) => b.similarity - a.similarity || b.frequency - a.frequency)
      .slice(0, limit);

    return semanticMatches.map(item => ({
      text: item.query,
      type: 'semantic' as const,
      score: 0.6 * item.similarity,
      metadata: {
        frequency: item.frequency,
        context: 'Similar search'
      }
    }));
  }

  /**
   * Get search analytics
   */
  public getAnalytics(): SearchAnalytics {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentHistory = this.history.filter(item => item.timestamp > oneWeekAgo);

    // Peak hours analysis
    const hourCounts: { [hour: number]: number } = {};
    recentHistory.forEach(item => {
      const hour = item.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      totalSearches: this.history.length,
      uniqueQueries: new Set(this.history.map(item => item.query)).size,
      averageResultCount: this.history.reduce((sum, item) => sum + item.resultCount, 0) / this.history.length || 0,
      mostSearchedTerms: this.getPopularQueries().slice(0, 10),
      searchPatterns: {
        peakHours,
        commonFilters: this.getCommonFilters(),
        averageSessionLength: this.getAverageSessionLength()
      },
      suggestionUsage: {
        acceptanceRate: this.getSuggestionAcceptanceRate(),
        mostUsedTypes: this.getMostUsedSuggestionTypes()
      }
    };
  }

  /**
   * Get common filters used in searches
   */
  private getCommonFilters(): string[] {
    const filterCounts: { [key: string]: number } = {};
    
    this.history.forEach(item => {
      if (item.filters) {
        Object.keys(item.filters).forEach(filterKey => {
          filterCounts[filterKey] = (filterCounts[filterKey] || 0) + 1;
        });
      }
    });

    return Object.entries(filterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([filter]) => filter);
  }

  /**
   * Calculate average session length
   */
  private getAverageSessionLength(): number {
    const sessionGroups: { [sessionId: string]: Date[] } = {};
    
    this.history.forEach(item => {
      if (!sessionGroups[item.context.sessionId]) {
        sessionGroups[item.context.sessionId] = [];
      }
      sessionGroups[item.context.sessionId]!.push(item.timestamp);
    });

    const sessionLengths = Object.values(sessionGroups).map(timestamps => {
      if (timestamps.length < 2) return 0;
      timestamps.sort((a, b) => a.getTime() - b.getTime());
      return timestamps[timestamps.length - 1]!.getTime() - timestamps[0]!.getTime();
    });

    return sessionLengths.length > 0 
      ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length / 1000 / 60 // Convert to minutes
      : 0;
  }

  /**
   * Get suggestion acceptance rate
   */
  private getSuggestionAcceptanceRate(): number {
    const suggestionQueries = this.history.filter(item => 
      item.context.source === 'suggestion' || item.context.source === 'autocomplete'
    );
    
    if (suggestionQueries.length === 0) return 0;
    
    const successfulSuggestions = suggestionQueries.filter(item => item.success).length;
    return successfulSuggestions / suggestionQueries.length;
  }

  /**
   * Get most used suggestion types
   */
  private getMostUsedSuggestionTypes(): string[] {
    const typeCounts: { [type: string]: number } = {};
    
    this.history
      .filter(item => item.context.source === 'suggestion' || item.context.source === 'autocomplete')
      .forEach(item => {
        // This would need to be enhanced to track suggestion types
        typeCounts['recent'] = (typeCounts['recent'] || 0) + 1;
      });

    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);
  }

  /**
   * Clear search history
   */
  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Export search history for backup
   */
  public exportHistory(): string {
    return JSON.stringify({
      version: '2.0',
      exportDate: new Date().toISOString(),
      searchHistory: this.history
    }, null, 2);
  }

  /**
   * Import search history from backup
   */
  public importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.searchHistory && Array.isArray(data.searchHistory)) {
        this.history = data.searchHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.saveHistory();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import search history:', error);
      return false;
    }
  }
}

// Export singleton instance and utility functions
export const enhancedSearchHistoryManager = EnhancedSearchHistoryManager.getInstance();

export const addEnhancedSearch = (
  query: string,
  resultCount: number,
  executionTimeMs: number,
  filters?: Partial<SearchFilters>,
  source?: SearchContext['source']
) => enhancedSearchHistoryManager.addSearch(query, resultCount, executionTimeMs, filters, source);

export const getSearchSuggestions = (input: string, limit?: number) => 
  enhancedSearchHistoryManager.getSearchSuggestions(input, limit);

export const recordSearchResultClick = (queryId: string, clickCount?: number) =>
  enhancedSearchHistoryManager.recordResultClick(queryId, clickCount);

export const getSearchAnalytics = () => enhancedSearchHistoryManager.getAnalytics();