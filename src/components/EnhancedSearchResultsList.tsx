// Enhanced Search Results List for Task 10.9
// Integrates with Task 10.8 multi-field search and enhanced highlighting

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonButton,
  IonIcon,
  IonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  InfiniteScrollCustomEvent,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonChip,
  IonToggle,
  IonRange,
  IonCheckbox,
} from '@ionic/react';
import {
  refreshOutline,
  searchOutline,
  filterOutline,
  listOutline,
  gridOutline,
  trendingUpOutline,
  timeOutline,
  analyticsOutline,
  colorPaletteOutline,
  eyeOutline,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';

// Enhanced components from Task 10.9
import EnhancedSearchResultCard from './EnhancedSearchResultCard';
import SearchResultCard from './SearchResultCard';

// Enhanced services from Task 10.8
import { EnhancedSearchResult, EnhancedPaginatedSearchResults } from '@services/enhancedSearchService';

// Legacy support
import { SearchResult, PaginatedSearchResults } from '@services/searchService';

import { FixedSizeList as List } from 'react-window';

export interface EnhancedSearchResultsListProps {
  // Enhanced search results from Task 10.8
  enhancedSearchResults?: EnhancedPaginatedSearchResults | null;
  
  // Legacy search results for backward compatibility
  searchResults?: PaginatedSearchResults | null;
  
  searchQuery: string;
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  
  // Event handlers
  onResultClick?: (result: EnhancedSearchResult | SearchResult) => void;
  onToggleBookmark?: (result: EnhancedSearchResult | SearchResult) => void;
  onLoadMore?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  
  // Display options
  showMetadata?: boolean;
  showTags?: boolean;
  showSnippets?: boolean;
  showRelevanceScore?: boolean;
  showMatchedFields?: boolean;
  showSearchContext?: boolean;
  
  // Enhanced highlighting options
  enableEnhancedHighlighting?: boolean;
  enableMultipleColors?: boolean;
  enableDebugMode?: boolean;
  
  // View options
  viewMode?: 'list' | 'compact' | 'detailed';
  className?: string;
  enableVirtualScrolling?: boolean;
  itemHeight?: number;
}

const EnhancedSearchResultsList: React.FC<EnhancedSearchResultsListProps> = ({
  enhancedSearchResults,
  searchResults,
  searchQuery,
  loading = false,
  loadingMore = false,
  error = null,
  onResultClick,
  onToggleBookmark,
  onLoadMore,
  onRefresh,
  onRetry,
  showMetadata = true,
  showTags = true,
  showSnippets = true,
  showRelevanceScore = false,
  showMatchedFields = false,
  showSearchContext = false,
  enableEnhancedHighlighting = true,
  enableMultipleColors = true,
  enableDebugMode = false,
  viewMode = 'detailed',
  className = '',
  enableVirtualScrolling = false,
  itemHeight = 220, // Slightly taller for enhanced features
}) => {
  // State for view options
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [localEnableMultipleColors, setLocalEnableMultipleColors] = useState(enableMultipleColors);
  const [localShowMatchedFields, setLocalShowMatchedFields] = useState(showMatchedFields);
  const [localShowSearchContext, setLocalShowSearchContext] = useState(showSearchContext);
  const [localEnableDebugMode, setLocalEnableDebugMode] = useState(enableDebugMode);

  // Refs
  const listRef = useRef<HTMLIonListElement>(null);
  const virtualListRef = useRef<List>(null);

  // Determine which search results to use
  const currentResults = enhancedSearchResults || searchResults;
  const isEnhanced = !!enhancedSearchResults;
  const results = currentResults?.results || [];

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(
    async (event: InfiniteScrollCustomEvent) => {
      if (onLoadMore && currentResults?.hasMore && !loadingMore) {
        try {
          await onLoadMore();
        } catch (error) {
          console.error('Load more failed:', error);
        }
      }
      event.target.complete();
    },
    [onLoadMore, currentResults?.hasMore, loadingMore]
  );

  // Handle refresh
  const handleRefresh = useCallback(
    async (event: CustomEvent<RefresherEventDetail>) => {
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        }
      }
      event.detail.complete();
    },
    [onRefresh]
  );

  // Sort results if needed
  const sortedResults = React.useMemo(() => {
    if (!results.length) return [];
    
    if (sortBy === 'date') {
      return [...results].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }
    
    // Default relevance sorting (already sorted by search service)
    return results;
  }, [results, sortBy]);

  // Virtual list item renderer
  const renderVirtualItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const result = sortedResults[index];
    if (!result) return null;

    return (
      <div style={style}>
        {isEnhanced && enableEnhancedHighlighting ? (
          <EnhancedSearchResultCard
            result={result as EnhancedSearchResult}
            searchQuery={searchQuery}
            onOpen={onResultClick}
            onToggleBookmark={onToggleBookmark}
            showSnippet={showSnippets}
            showTags={showTags}
            showMetadata={showMetadata}
            showRelevanceScore={showRelevanceScore}
            showMatchedFields={localShowMatchedFields}
            showSearchContext={localShowSearchContext}
            enableMultipleColors={localEnableMultipleColors}
            enableDebugMode={localEnableDebugMode}
            className="mb-3"
          />
        ) : (
          <SearchResultCard
            result={result as SearchResult}
            searchTerms={searchQuery}
            onOpen={onResultClick}
            onToggleBookmark={onToggleBookmark}
            showSnippet={showSnippets}
            showTags={showTags}
            showMetadata={showMetadata}
            showRelevanceScore={showRelevanceScore}
            className="mb-3"
          />
        )}
      </div>
    );
  }, [
    sortedResults, 
    isEnhanced, 
    enableEnhancedHighlighting, 
    searchQuery, 
    onResultClick, 
    onToggleBookmark,
    showSnippets,
    showTags,
    showMetadata,
    showRelevanceScore,
    localShowMatchedFields,
    localShowSearchContext,
    localEnableMultipleColors,
    localEnableDebugMode
  ]);

  // Render loading state
  if (loading && !results.length) {
    return (
      <div className={`enhanced-search-results-list loading ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <IonSpinner name="bubbles" className="mb-4" />
          <IonText color="medium">
            <p>Searching articles...</p>
          </IonText>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`enhanced-search-results-list error ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <IonIcon icon={searchOutline} className="text-4xl text-gray-400 mb-4" />
          <IonText color="danger" className="text-center mb-4">
            <h3>Search Failed</h3>
            <p>{error}</p>
          </IonText>
          {onRetry && (
            <IonButton onClick={onRetry} fill="outline" color="primary">
              <IonIcon icon={refreshOutline} slot="start" />
              Try Again
            </IonButton>
          )}
        </div>
      </div>
    );
  }

  // Render empty state
  if (!loading && (!currentResults || results.length === 0)) {
    return (
      <div className={`enhanced-search-results-list empty ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <IonIcon icon={searchOutline} className="text-4xl text-gray-400 mb-4" />
          <IonText color="medium" className="text-center">
            <h3>No Results Found</h3>
            <p>Try adjusting your search terms or filters</p>
          </IonText>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-search-results-list ${className}`}>
      {/* Search Statistics and Options */}
      {currentResults && (
        <div className="search-stats-header p-4 bg-white border-b">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IonText color="medium">
                <span className="text-sm">
                  {currentResults.totalCount.toLocaleString()} results
                  {currentResults.executionTimeMs && (
                    <span className="ml-2">
                      ({currentResults.executionTimeMs.toFixed(0)}ms)
                    </span>
                  )}
                </span>
              </IonText>
              
              {/* Enhanced Search Indicators */}
              {isEnhanced && enhancedSearchResults?.searchStats && (
                <div className="flex gap-1">
                  <IonChip color="primary" className="text-xs">
                    <IonIcon icon={sparklesOutline} className="w-3 h-3 mr-1" />
                    Enhanced
                  </IonChip>
                  <IonChip color="secondary" className="text-xs">
                    {enhancedSearchResults.searchStats.query_complexity}
                  </IonChip>
                </div>
              )}
            </div>

            <IonButton
              fill="clear"
              size="small"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <IonSegment 
              value={sortBy} 
              onIonChange={(e) => setSortBy(e.detail.value as 'relevance' | 'date')}
              className="max-w-xs"
            >
              <IonSegmentButton value="relevance">
                <IonIcon icon={trendingUpOutline} />
                <IonLabel>Relevance</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="date">
                <IonIcon icon={timeOutline} />
                <IonLabel>Date</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Field Matches Summary */}
            {isEnhanced && enhancedSearchResults?.searchStats && (
              <div className="flex gap-1">
                {Object.entries(enhancedSearchResults.searchStats.field_matches).map(([field, count]) => (
                  count > 0 && (
                    <IonBadge key={field} color="medium" className="text-xs">
                      {field}: {count}
                    </IonBadge>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && isEnhanced && enableEnhancedHighlighting && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3 text-sm">Enhanced Highlighting Options</h4>
              
              <div className="space-y-3">
                <IonItem lines="none" className="--padding-start: 0">
                  <IonCheckbox
                    checked={localEnableMultipleColors}
                    onIonChange={(e) => setLocalEnableMultipleColors(e.detail.checked)}
                    slot="start"
                  />
                  <IonLabel className="ml-3">
                    <h3>Multiple Colors</h3>
                    <p>Use different colors for each search term</p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none" className="--padding-start: 0">
                  <IonCheckbox
                    checked={localShowMatchedFields}
                    onIonChange={(e) => setLocalShowMatchedFields(e.detail.checked)}
                    slot="start"
                  />
                  <IonLabel className="ml-3">
                    <h3>Show Matched Fields</h3>
                    <p>Display which fields contain matches</p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none" className="--padding-start: 0">
                  <IonCheckbox
                    checked={localShowSearchContext}
                    onIonChange={(e) => setLocalShowSearchContext(e.detail.checked)}
                    slot="start"
                  />
                  <IonLabel className="ml-3">
                    <h3>Search Context</h3>
                    <p>Show query type and performance info</p>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none" className="--padding-start: 0">
                  <IonCheckbox
                    checked={localEnableDebugMode}
                    onIonChange={(e) => setLocalEnableDebugMode(e.detail.checked)}
                    slot="start"
                  />
                  <IonLabel className="ml-3">
                    <h3>Debug Mode</h3>
                    <p>Show performance metrics</p>
                  </IonLabel>
                </IonItem>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      <div className="results-container">
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent
              pullingText="Pull to refresh results..."
              refreshingSpinner="bubbles"
              refreshingText="Refreshing..."
            />
          </IonRefresher>
        )}

        {enableVirtualScrolling && sortedResults.length > 10 ? (
          // Virtual scrolling for large result sets
          <div className="virtual-scroll-container" style={{ height: '70vh' }}>
            <List
              ref={virtualListRef}
              height={window.innerHeight * 0.7}
              width="100%"
              itemCount={sortedResults.length}
              itemSize={itemHeight}
              itemData={sortedResults}
            >
              {renderVirtualItem}
            </List>
          </div>
        ) : (
          // Standard list for smaller result sets
          <IonList ref={listRef} className="results-list">
            {sortedResults.map((result, index) => (
              <div key={`${result.id}-${index}`} className="result-item">
                {isEnhanced && enableEnhancedHighlighting ? (
                  <EnhancedSearchResultCard
                    result={result as EnhancedSearchResult}
                    searchQuery={searchQuery}
                    onOpen={onResultClick}
                    onToggleBookmark={onToggleBookmark}
                    showSnippet={showSnippets}
                    showTags={showTags}
                    showMetadata={showMetadata}
                    showRelevanceScore={showRelevanceScore}
                    showMatchedFields={localShowMatchedFields}
                    showSearchContext={localShowSearchContext}
                    enableMultipleColors={localEnableMultipleColors}
                    enableDebugMode={localEnableDebugMode}
                  />
                ) : (
                  <SearchResultCard
                    result={result as SearchResult}
                    searchTerms={searchQuery}
                    onOpen={onResultClick}
                    onToggleBookmark={onToggleBookmark}
                    showSnippet={showSnippets}
                    showTags={showTags}
                    showMetadata={showMetadata}
                    showRelevanceScore={showRelevanceScore}
                  />
                )}
              </div>
            ))}
          </IonList>
        )}

        {/* Infinite Scroll */}
        {currentResults?.hasMore && onLoadMore && (
          <IonInfiniteScroll onIonInfinite={handleInfiniteScroll} threshold="100px">
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText={loadingMore ? "Loading more results..." : "Loading..."}
            />
          </IonInfiniteScroll>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <IonSpinner name="dots" />
          </div>
        )}
      </div>

      <style>{`
        .enhanced-search-results-list {
          height: 100%;
        }

        .search-stats-header {
          border-color: var(--ion-color-light-shade, #e9ecef);
        }

        .results-container {
          flex: 1;
          overflow-y: auto;
        }

        .results-list {
          background: transparent;
        }

        .result-item {
          margin-bottom: 0;
        }

        .virtual-scroll-container {
          padding: 0 16px;
        }

        /* Enhanced features styling */
        .enhanced-search-results-list.loading,
        .enhanced-search-results-list.error,
        .enhanced-search-results-list.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .search-stats-header {
            background-color: var(--ion-color-dark-shade, #1e2023);
            border-color: var(--ion-color-dark-tint, #383a3e);
          }
        }

        .ios.dark .search-stats-header,
        .md.dark .search-stats-header {
          background-color: var(--ion-color-dark-shade, #1e2023);
          border-color: var(--ion-color-dark-tint, #383a3e);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .search-stats-header {
            padding: 12px 16px;
          }
          
          .search-stats-header .flex {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .virtual-scroll-container {
            padding: 0 8px;
          }
        }

        /* Animation for result items */
        .result-item {
          animation: resultSlideIn 0.3s ease-out;
        }

        @keyframes resultSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Performance optimizations */
        .results-list {
          contain: layout;
        }

        .result-item {
          contain: layout style;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default EnhancedSearchResultsList;