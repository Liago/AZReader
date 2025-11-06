// SearchQuery interface for search history management
export interface SearchQuery {
  query: string;
  timestamp: Date;
}

const SEARCH_HISTORY_KEY = 'azreader_search_history';
const MAX_SEARCH_HISTORY = 20;

export class SearchHistoryManager {
  private static instance: SearchHistoryManager;
  private history: SearchQuery[] = [];

  private constructor() {
    this.loadHistory();
  }

  public static getInstance(): SearchHistoryManager {
    if (!SearchHistoryManager.instance) {
      SearchHistoryManager.instance = new SearchHistoryManager();
    }
    return SearchHistoryManager.instance;
  }

  /**
   * Load search history from localStorage
   */
  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.history = [];
    }
  }

  /**
   * Save search history to localStorage
   */
  private saveHistory(): void {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Add a search query to history
   */
  public addSearch(query: string): void {
    if (!query || query.trim().length === 0) {
      return;
    }

    const trimmedQuery = query.trim();
    
    // Remove existing entry if it exists
    this.history = this.history.filter(item => item.query !== trimmedQuery);
    
    // Add new entry at the beginning
    this.history.unshift({
      query: trimmedQuery,
      timestamp: new Date()
    });

    // Limit history size
    if (this.history.length > MAX_SEARCH_HISTORY) {
      this.history = this.history.slice(0, MAX_SEARCH_HISTORY);
    }

    this.saveHistory();
  }

  /**
   * Get all search history
   */
  public getHistory(): SearchQuery[] {
    return [...this.history];
  }

  /**
   * Get recent searches limited by count
   */
  public getRecentSearches(limit: number = 10): SearchQuery[] {
    return this.history.slice(0, limit);
  }

  /**
   * Search through history
   */
  public searchHistory(query: string): SearchQuery[] {
    if (!query || query.trim().length === 0) {
      return this.getHistory();
    }

    const searchTerm = query.toLowerCase().trim();
    return this.history.filter(item =>
      item.query.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Remove a specific search from history
   */
  public removeSearch(query: string): void {
    this.history = this.history.filter(item => item.query !== query);
    this.saveHistory();
  }

  /**
   * Clear all search history
   */
  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Get most frequent searches
   */
  public getFrequentSearches(limit: number = 5): Array<{ query: string; count: number }> {
    const frequency: { [key: string]: number } = {};
    
    // Count frequencies
    this.history.forEach(item => {
      const query = item.query.toLowerCase();
      frequency[query] = (frequency[query] || 0) + 1;
    });

    // Convert to array and sort by frequency
    const frequentSearches = Object.entries(frequency)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return frequentSearches;
  }

  /**
   * Get searches from a specific time range
   */
  public getSearchesByTimeRange(hoursBack: number = 24): SearchQuery[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    return this.history.filter(item => item.timestamp >= cutoffTime);
  }

  /**
   * Get statistics about search history
   */
  public getStatistics(): {
    totalSearches: number;
    uniqueSearches: number;
    averageSearchesPerDay: number;
    mostRecentSearch?: Date;
    oldestSearch?: Date;
  } {
    const totalSearches = this.history.length;
    const uniqueSearches = new Set(this.history.map(item => item.query.toLowerCase())).size;
    
    let averageSearchesPerDay = 0;
    let mostRecentSearch: Date | undefined;
    let oldestSearch: Date | undefined;

    if (this.history.length > 0) {
      mostRecentSearch = this.history[0]?.timestamp;
      oldestSearch = this.history[this.history.length - 1]?.timestamp;
      
      const daysDifference = Math.max(1, Math.ceil(
        (mostRecentSearch!.getTime() - oldestSearch!.getTime()) / (1000 * 60 * 60 * 24)
      ));
      
      averageSearchesPerDay = totalSearches / daysDifference;
    }

    return {
      totalSearches,
      uniqueSearches,
      averageSearchesPerDay,
      mostRecentSearch,
      oldestSearch
    };
  }

  /**
   * Export search history as JSON
   */
  public exportHistory(): string {
    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      searches: this.history
    }, null, 2);
  }

  /**
   * Import search history from JSON
   */
  public importHistory(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.searches || !Array.isArray(data.searches)) {
        throw new Error('Invalid search history format');
      }

      const importedHistory: SearchQuery[] = data.searches.map((item: any) => ({
        query: item.query,
        timestamp: new Date(item.timestamp)
      }));

      // Merge with existing history, avoiding duplicates
      const merged = [...importedHistory, ...this.history];
      const uniqueHistory = merged.filter((item, index, arr) => 
        arr.findIndex(other => 
          other.query === item.query && 
          other.timestamp.getTime() === item.timestamp.getTime()
        ) === index
      );

      // Sort by timestamp (most recent first) and limit
      this.history = uniqueHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_SEARCH_HISTORY);

      this.saveHistory();
      return true;
    } catch (error) {
      console.error('Failed to import search history:', error);
      return false;
    }
  }
}

// Export singleton instance
export const searchHistoryManager = SearchHistoryManager.getInstance();

// Export utility functions for common operations
export const addSearchToHistory = (query: string) => searchHistoryManager.addSearch(query);
export const getSearchHistory = () => searchHistoryManager.getHistory();
export const getRecentSearches = (limit?: number) => searchHistoryManager.getRecentSearches(limit);
export const clearSearchHistory = () => searchHistoryManager.clearHistory();
export const removeSearchFromHistory = (query: string) => searchHistoryManager.removeSearch(query);
export const searchInHistory = (query: string) => searchHistoryManager.searchHistory(query);