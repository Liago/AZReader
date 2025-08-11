import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonText,
  IonFab,
  IonFabButton,
  IonToast,
  IonActionSheet,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonProgressBar,
} from '@ionic/react';
import {
  searchOutline,
  filterOutline,
  refreshOutline,
  settingsOutline,
  analyticsOutline,
  downloadOutline,
  shareOutline,
  bookmarkOutline,
  trendingUpOutline,
  trashOutline,
} from 'ionicons/icons';

// Components
import SearchBar from '@components/SearchBar';
import SearchResultsList from '@components/SearchResultsList';
import SearchFiltersModal from '@components/SearchFiltersModal';

// Hooks
import { useSearchBar } from '@hooks/useSearchBar';
import { useFullTextSearch } from '@hooks/useFullTextSearch';
import { useSearchFilterPresets } from '@hooks/useSearchFilterPresets';
import { useAppSelector } from '@store/hooks';

// Services and Types
import { SearchFilters, SearchResult, searchService } from '@services/searchService';
import { FilterPreset } from '@components/SearchFiltersModal';

const SearchPage: React.FC = () => {
  // Get current user
  const currentUser = useAppSelector(state => state.auth?.user);
  const userId = currentUser?.id;

  // State
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showSearchStats, setShowSearchStats] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color?: string; usage_count?: number }>>([]);
  const [availableDomains, setAvailableDomains] = useState<Array<{ domain: string; count: number }>>([]);

  // Hooks
  const searchBar = useSearchBar({
    onSearch: handleSearch,
    onClear: handleClearSearch,
    enableHistory: true,
    enableSuggestions: true,
    maxRecentSearches: 10,
  });

  const fullTextSearch = useFullTextSearch({
    userId,
    enableHistory: true,
    enableSuggestions: true,
    pageSize: 20,
    autoSearch: false,
  });

  const filterPresets = useSearchFilterPresets({
    userId,
    maxPresets: 15,
  });

  // Search handlers
  function handleSearch(query: string) {
    if (query.trim()) {
      searchBar.performSearch(query);
      fullTextSearch.performSearch(query, fullTextSearch.currentFilters);
    }
  }

  function handleClearSearch() {
    fullTextSearch.clearResults();
  }

  // Load metadata on mount
  useEffect(() => {
    if (userId) {
      loadSearchMetadata();
      fullTextSearch.refreshStatistics();
    }
  }, [userId]);

  // Load search metadata (tags, domains, etc.)
  const loadSearchMetadata = useCallback(async () => {
    if (!userId) return;

    try {
      const stats = await searchService.getSearchStatistics(userId);
      if (stats) {
        // Convert stats to available options
        setAvailableTags(
          stats.most_common_tags.map((tag, index) => ({
            id: `tag-${index}`, // This would need to be actual tag IDs from the database
            name: tag.name,
            usage_count: tag.count,
          }))
        );

        setAvailableDomains(
          stats.most_common_domains.map(domain => ({
            domain: domain.domain,
            count: domain.count,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load search metadata:', error);
    }
  }, [userId]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Partial<SearchFilters>) => {
    fullTextSearch.updateFilters(filters);
  }, [fullTextSearch]);

  // Apply filters
  const handleApplyFilters = useCallback((filters: SearchFilters) => {
    fullTextSearch.updateFilters(filters);
    if (fullTextSearch.currentQuery) {
      fullTextSearch.performSearch(fullTextSearch.currentQuery, filters);
    }
    setShowFiltersModal(false);
  }, [fullTextSearch]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    // Navigate to article view
    // This would typically use React Router or Ionic navigation
    window.open(result.url, '_blank');
  }, []);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback(async (result: SearchResult) => {
    try {
      // This would call your bookmark API
      setToastMessage(`Article ${result.is_favorite ? 'removed from' : 'added to'} favorites`);
      setToastColor('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to update bookmark');
      setToastColor('danger');
      setShowToast(true);
    }
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    await fullTextSearch.loadMore();
  }, [fullTextSearch]);

  // Handle refresh
  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      if (fullTextSearch.currentQuery) {
        await fullTextSearch.performSearch(
          fullTextSearch.currentQuery, 
          fullTextSearch.currentFilters
        );
      }
      await loadSearchMetadata();
    } finally {
      event.detail.complete();
    }
  }, [fullTextSearch, loadSearchMetadata]);

  // Handle preset save
  const handleSavePreset = useCallback(async (preset: Omit<FilterPreset, 'id' | 'created_at'>) => {
    try {
      await filterPresets.savePreset(preset);
      setToastMessage('Filter preset saved successfully');
      setToastColor('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Failed to save preset');
      setToastColor('danger');
      setShowToast(true);
    }
  }, [filterPresets]);

  // Handle preset delete
  const handleDeletePreset = useCallback(async (presetId: string) => {
    try {
      await filterPresets.deletePreset(presetId);
      setToastMessage('Filter preset deleted');
      setToastColor('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to delete preset');
      setToastColor('danger');
      setShowToast(true);
    }
  }, [filterPresets]);

  // Handle preset load
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    fullTextSearch.updateFilters(preset.filters);
    if (fullTextSearch.currentQuery) {
      fullTextSearch.performSearch(fullTextSearch.currentQuery, preset.filters);
    }
  }, [fullTextSearch]);

  // Export search results
  const handleExportResults = useCallback(() => {
    if (!fullTextSearch.searchResults) return;

    const exportData = {
      query: fullTextSearch.searchResults.query,
      filters: fullTextSearch.searchResults.filters,
      totalCount: fullTextSearch.searchResults.totalCount,
      executionTime: fullTextSearch.searchResults.executionTimeMs,
      exportDate: new Date().toISOString(),
      results: fullTextSearch.searchResults.results.map(result => ({
        title: result.title,
        url: result.url,
        author: result.author,
        domain: result.domain,
        created_at: result.created_at,
        relevance_score: result.relevance_score,
        tags: result.tags?.map(tag => tag.name).join(', ') || '',
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${fullTextSearch.searchResults.query}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage('Search results exported successfully');
    setToastColor('success');
    setShowToast(true);
  }, [fullTextSearch.searchResults]);

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    const filters = fullTextSearch.currentFilters;
    if (filters.tagIds && filters.tagIds.length > 0) count++;
    if (!filters.includeRead) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.domainFilter) count++;
    if (filters.sortBy && filters.sortBy !== 'relevance') count++;
    return count;
  };

  if (!userId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Search</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="flex items-center justify-center h-full">
            <IonText color="medium" className="text-center">
              <h2>Please sign in to search your articles</h2>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="search-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Articles</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              fill="clear" 
              onClick={() => setShowFiltersModal(true)}
              disabled={!fullTextSearch.currentQuery && getActiveFilterCount() === 0}
            >
              <IonIcon icon={filterOutline} />
              {getActiveFilterCount() > 0 && (
                <span className="ml-1 text-xs">({getActiveFilterCount()})</span>
              )}
            </IonButton>
            <IonButton fill="clear" onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh search..."
            refreshingSpinner="bubbles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        {/* Progress bar for loading */}
        {fullTextSearch.isLoading && (
          <IonProgressBar type="indeterminate" />
        )}

        {/* Search Bar */}
        <div className="p-4 pb-2">
          <SearchBar
            onSearch={searchBar.performSearch}
            onClear={searchBar.clearSearch}
            loading={fullTextSearch.isLoading}
            suggestions={searchBar.suggestions}
            recentSearches={searchBar.recentSearches}
            onSuggestionSelect={searchBar.handleSuggestionSelect}
            showFilterButton={true}
            onFilterClick={() => setShowFiltersModal(true)}
          />
        </div>

        {/* Search Results */}
        <SearchResultsList
          searchResults={fullTextSearch.searchResults}
          searchTerms={fullTextSearch.currentQuery}
          loading={fullTextSearch.isLoading}
          loadingMore={fullTextSearch.isLoadingMore}
          error={fullTextSearch.error}
          onResultClick={handleResultClick}
          onToggleBookmark={handleToggleBookmark}
          onLoadMore={handleLoadMore}
          onRefresh={async () => {
            if (fullTextSearch.currentQuery) {
              await fullTextSearch.performSearch(
                fullTextSearch.currentQuery,
                fullTextSearch.currentFilters
              );
            }
          }}
          onRetry={fullTextSearch.retry}
          showMetadata={true}
          showTags={true}
          showSnippets={true}
          showRelevanceScore={false}
          enableVirtualScrolling={true}
        />

        {/* Quick Stats */}
        {fullTextSearch.statistics && showSearchStats && (
          <div className="p-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Search Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Articles:</span>
                  <span className="ml-2 font-medium">{fullTextSearch.statistics.total_articles}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Tags:</span>
                  <span className="ml-2 font-medium">{fullTextSearch.statistics.total_tags}</span>
                </div>
                <div>
                  <span className="text-gray-600">This Week:</span>
                  <span className="ml-2 font-medium">{fullTextSearch.statistics.articles_last_week}</span>
                </div>
                <div>
                  <span className="text-gray-600">Domains:</span>
                  <span className="ml-2 font-medium">{fullTextSearch.statistics.total_domains}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </IonContent>

      {/* Floating Action Button */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton
          onClick={() => setShowActionSheet(true)}
          disabled={!fullTextSearch.searchResults}
        >
          <IonIcon icon={settingsOutline} />
        </IonFabButton>
      </IonFab>

      {/* Search Filters Modal */}
      <SearchFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        currentFilters={fullTextSearch.currentFilters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        availableTags={availableTags}
        availableDomains={availableDomains}
        filterPresets={filterPresets.presets}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onLoadPreset={handleLoadPreset}
        showPresets={true}
      />

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header="Search Options"
        buttons={[
          {
            text: 'View Statistics',
            icon: analyticsOutline,
            handler: () => {
              setShowSearchStats(!showSearchStats);
              fullTextSearch.refreshStatistics();
            }
          },
          {
            text: 'Export Results',
            icon: downloadOutline,
            handler: handleExportResults,
            disabled: !fullTextSearch.searchResults
          },
          {
            text: 'Share Search',
            icon: shareOutline,
            handler: () => {
              if (navigator.share && fullTextSearch.searchResults) {
                navigator.share({
                  title: `Search: ${fullTextSearch.searchResults.query}`,
                  text: `Found ${fullTextSearch.searchResults.totalCount} articles`,
                  url: window.location.href
                });
              }
            },
            disabled: !fullTextSearch.searchResults
          },
          {
            text: 'Refresh Search',
            icon: refreshOutline,
            handler: () => {
              if (fullTextSearch.currentQuery) {
                fullTextSearch.performSearch(
                  fullTextSearch.currentQuery,
                  fullTextSearch.currentFilters
                );
              }
            }
          },
          {
            text: 'Clear Search History',
            role: 'destructive',
            icon: trashOutline,
            handler: () => {
              fullTextSearch.clearSearchHistory();
              searchBar.clearHistory();
              setToastMessage('Search history cleared');
              setToastColor('success');
              setShowToast(true);
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

      {/* Toast Messages */}
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        color={toastColor}
        onDidDismiss={() => setShowToast(false)}
      />

      <style>{`
        .search-page {
          --background: var(--ion-color-light-tint, #f8f9fa);
        }

        .search-page ion-fab-button {
          --background: var(--ion-color-primary);
          --color: white;
        }

        /* Dark mode support */
        .ios.dark .search-page,
        .md.dark .search-page {
          --background: var(--ion-color-dark);
        }
      `}</style>
    </IonPage>
  );
};

export default SearchPage;