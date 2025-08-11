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
} from '@ionic/react';
import {
  refreshOutline,
  searchOutline,
  filterOutline,
  listOutline,
  gridOutline,
  trendingUpOutline,
  timeOutline,
} from 'ionicons/icons';
import SearchResultCard from './SearchResultCard';
import { SearchResult, PaginatedSearchResults } from '@services/searchService';
import { FixedSizeList as List } from 'react-window';

export interface SearchResultsListProps {
  searchResults: PaginatedSearchResults | null;
  searchTerms: string | string[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  onResultClick?: (result: SearchResult) => void;
  onToggleBookmark?: (result: SearchResult) => void;
  onLoadMore?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onRetry?: () => Promise<void>;
  showMetadata?: boolean;
  showTags?: boolean;
  showSnippets?: boolean;
  showRelevanceScore?: boolean;
  viewMode?: 'list' | 'compact' | 'detailed';
  className?: string;
  enableVirtualScrolling?: boolean;
  itemHeight?: number;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  searchResults,
  searchTerms,
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
  viewMode = 'detailed',
  className = '',
  enableVirtualScrolling = false,
  itemHeight = 200,
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');
  const listRef = useRef<HTMLIonListElement>(null);
  const virtualListRef = useRef<List>(null);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(
    async (event: InfiniteScrollCustomEvent) => {
      if (onLoadMore && searchResults?.hasMore && !loadingMore) {
        try {
          await onLoadMore();
        } catch (error) {
          console.error('Load more failed:', error);
        }
      }
      event.target.complete();
    },
    [onLoadMore, searchResults?.hasMore, loadingMore]
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

  // Sort results
  const sortedResults = React.useMemo(() => {
    if (!searchResults?.results) return [];
    
    const results = [...searchResults.results];
    
    switch (sortBy) {
      case 'relevance':
        return results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
      case 'date':
        return results.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      default:
        return results;
    }
  }, [searchResults?.results, sortBy]);

  // Virtual list item renderer
  const VirtualListItem: React.FC<{ index: number; style: React.CSSProperties }> = ({
    index,
    style,
  }) => {
    const result = sortedResults[index];
    if (!result) return null;

    return (
      <div style={style} className="virtual-list-item">
        <SearchResultCard
          result={result}
          searchTerms={searchTerms}
          onOpen={onResultClick}
          onToggleBookmark={onToggleBookmark}
          showSnippet={showSnippets}
          showTags={showTags}
          showMetadata={showMetadata}
          showRelevanceScore={showRelevanceScore}
        />
      </div>
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <IonList>
      {Array.from({ length: 5 }, (_, index) => (
        <SearchResultCard
          key={`skeleton-${index}`}
          result={{} as SearchResult}
          searchTerms={[]}
          loading={true}
        />
      ))}
    </IonList>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <IonIcon icon={searchOutline} className="text-6xl text-gray-400 mb-4" />
      <IonText>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No results found</h2>
        <p className="text-gray-500 max-w-md">
          {searchResults?.query 
            ? `No articles match "${searchResults.query}". Try different keywords or adjust your filters.`
            : 'Start typing to search through your articles.'
          }
        </p>
      </IonText>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <IonIcon icon={refreshOutline} className="text-6xl text-red-400 mb-4" />
      <IonText>
        <h2 className="text-lg font-semibold text-red-700 mb-2">Search Failed</h2>
        <p className="text-gray-500 max-w-md mb-4">{error}</p>
      </IonText>
      {onRetry && (
        <IonButton fill="outline" onClick={onRetry}>
          <IonIcon icon={refreshOutline} slot="start" />
          Try Again
        </IonButton>
      )}
    </div>
  );

  // Main render logic
  if (loading && !searchResults) {
    return (
      <div className={`search-results-list ${className}`}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error && !searchResults) {
    return (
      <div className={`search-results-list ${className}`}>
        {renderErrorState()}
      </div>
    );
  }

  if (!searchResults || sortedResults.length === 0) {
    return (
      <div className={`search-results-list ${className}`}>
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className={`search-results-list ${className}`}>
      {/* Search Results Header */}
      <div className="search-results-header p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IonText>
              <h3 className="text-lg font-semibold">
                {searchResults.totalCount.toLocaleString()} results
              </h3>
              <p className="text-sm text-gray-500">
                for "{searchResults.query}" 
                {searchResults.executionTimeMs && (
                  <span> • {searchResults.executionTimeMs}ms</span>
                )}
              </p>
            </IonText>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Options */}
            <IonSegment
              value={sortBy}
              onIonChange={(e) => setSortBy(e.detail.value as any)}
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
          </div>
        </div>

        {/* Search Stats */}
        <div className="flex flex-wrap gap-2">
          {searchResults.filters.tagIds && searchResults.filters.tagIds.length > 0 && (
            <IonBadge color="primary">
              {searchResults.filters.tagIds.length} tag{searchResults.filters.tagIds.length !== 1 ? 's' : ''}
            </IonBadge>
          )}
          
          {!searchResults.filters.includeRead && (
            <IonBadge color="secondary">Unread only</IonBadge>
          )}
          
          {searchResults.filters.domainFilter && (
            <IonBadge color="tertiary">
              Domain: {searchResults.filters.domainFilter}
            </IonBadge>
          )}
          
          {(searchResults.filters.dateFrom || searchResults.filters.dateTo) && (
            <IonBadge color="warning">Date filtered</IonBadge>
          )}
        </div>
      </div>

      {/* Results Content */}
      <IonContent>
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent
              pullingText="Pull to refresh search results..."
              refreshingSpinner="bubbles"
              refreshingText="Refreshing..."
            />
          </IonRefresher>
        )}

        {enableVirtualScrolling && sortedResults.length > 20 ? (
          /* Virtual Scrolling for large result sets */
          <div className="virtual-list-container" style={{ height: '100%', width: '100%' }}>
            <List
              ref={virtualListRef}
              height={window.innerHeight - 200} // Adjust based on your layout
              width="100%"
              itemCount={sortedResults.length}
              itemSize={itemHeight}
              overscanCount={5}
            >
              {VirtualListItem}
            </List>
          </div>
        ) : (
          /* Regular scrolling for smaller result sets */
          <IonList>
            {sortedResults.map((result, index) => (
              <SearchResultCard
                key={`${result.id}-${index}`}
                result={result}
                searchTerms={searchTerms}
                onOpen={onResultClick}
                onToggleBookmark={onToggleBookmark}
                showSnippet={showSnippets}
                showTags={showTags}
                showMetadata={showMetadata}
                showRelevanceScore={showRelevanceScore}
              />
            ))}
          </IonList>
        )}

        {/* Infinite Scroll */}
        {onLoadMore && searchResults.hasMore && (
          <IonInfiniteScroll
            onIonInfinite={handleInfiniteScroll}
            threshold="100px"
            disabled={loadingMore}
          >
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText={`Loading more results...`}
            />
          </IonInfiniteScroll>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <IonSpinner name="dots" className="mr-2" />
            <IonText color="medium">Loading more results...</IonText>
          </div>
        )}

        {/* End of Results Indicator */}
        {!searchResults.hasMore && sortedResults.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <IonText color="medium" className="text-center">
              <p>You've reached the end of the search results.</p>
              <p className="text-sm">
                Showing {sortedResults.length} of {searchResults.totalCount} results
              </p>
            </IonText>
          </div>
        )}
      </IonContent>

      <style>{`
        .search-results-list {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .search-results-header {
          flex-shrink: 0;
          background: var(--ion-color-light, #f8f9fa);
          border-bottom: 1px solid var(--ion-color-medium-tint, #e1e5e9);
        }

        .virtual-list-container {
          flex: 1;
          overflow: hidden;
        }

        .virtual-list-item {
          padding: 0 16px;
        }

        .search-results-list ion-content {
          flex: 1;
        }

        /* Responsive header */
        @media (max-width: 768px) {
          .search-results-header {
            padding: 12px 16px;
          }
          
          .search-results-header .flex {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .search-results-header ion-segment {
            width: 100%;
            max-width: 300px;
          }
        }

        /* Dark mode support */
        .ios.dark .search-results-header,
        .md.dark .search-results-header {
          background: var(--ion-color-dark-tint);
          border-color: var(--ion-color-medium-shade);
        }
      `}</style>
    </div>
  );
};

export default SearchResultsList;