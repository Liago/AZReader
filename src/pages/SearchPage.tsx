import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonActionSheet,
  IonToast,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  RefresherEventDetail,
  IonProgressBar,
  IonModal,
} from '@ionic/react';
import { useLocation, useParams, useHistory } from 'react-router-dom';
import {
  searchOutline,
  filterOutline,
  settingsOutline,
  timeOutline,
  analyticsOutline,
  downloadOutline,
  shareOutline,
  refreshOutline,
  trashOutline,
  closeOutline,
} from 'ionicons/icons';

// Components
import SearchBar from '@components/SearchBar';
import SearchResultsList from '@components/SearchResultsList';
import SearchFiltersModal from '@components/SearchFiltersModal';
import SearchHistoryModal from '@components/SearchHistoryModal';

// Hooks
import { useAppSelector } from '@store/hooks';
import { useSearchBar } from '@hooks/useSearchBar';
import { useFullTextSearch } from '@hooks/useFullTextSearch';
import { useSearchFilterPresets } from '@hooks/useSearchFilterPresets';

// Services and types
import { SearchFilters, SearchResult, searchService } from '@services/searchService';
import { FilterPreset } from '@components/SearchFiltersModal';
import { menuController } from '@ionic/core';

const SearchPage: React.FC = () => {
  console.log('🔥 SearchPage component is loading!');
  
  // Get current user and location
  const currentUser = useAppSelector((state: any) => state.auth?.user);
  const userId = currentUser?.id;
  const location = useLocation();
  const params = useParams<{ query?: string }>();
  const history = useHistory();
  
  console.log('🔥 SearchPage basic setup done');

  // Get search query from route parameter
  const searchQueryFromRoute = params.query ? decodeURIComponent(params.query) : null;

  // State
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showSearchStats, setShowSearchStats] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [availableTags, setAvailableTags] = useState<Array<{ id: string; name: string; color?: string; usage_count?: number }>>([]);
  const [availableDomains, setAvailableDomains] = useState<Array<{ domain: string; count: number }>>([]);
  const [currentSearchId, setCurrentSearchId] = useState<string>('');
  const [searchInput, setSearchInput] = useState(searchQueryFromRoute || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldReapplySearch, setShouldReapplySearch] = useState(false);

  // Debug modal state
  console.log('SearchPage render - showFiltersModal:', showFiltersModal);

  // Initialize hooks
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

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    fullTextSearch.clearResults();
  }, [fullTextSearch]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Track search with enhanced history and get performance metrics
      const startTime = performance.now();
      
      // Perform the search
      fullTextSearch.performSearch(query, fullTextSearch.currentFilters)
        .then(() => {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          const resultCount = fullTextSearch.searchResults?.totalCount || 0;
          
          // Set simple search ID for tracking
          setCurrentSearchId(`search-${Date.now()}`);
        })
        .catch((error) => {
          console.error('SearchPage: Search failed with error:', error);
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          setCurrentSearchId(`search-error-${Date.now()}`);
        });
    }
  }, [fullTextSearch, userId]);

  // Store handleSearch in ref to avoid useEffect dependency issues
  const handleSearchRef = useRef(handleSearch);
  handleSearchRef.current = handleSearch;

  // Initialize searchBar hook
  const searchBar = useSearchBar({
    onSearch: handleSearch,
    onClear: handleClearSearch,
    enableHistory: true,
    enableSuggestions: true,
    enableEnhancedSuggestions: true,
    maxRecentSearches: 10,
    userId,
  });

  // Load metadata on mount
  useEffect(() => {
    if (userId) {
      loadSearchMetadata();
      fullTextSearch.refreshStatistics();
    }
  }, [userId]);

  // Handle route parameters separately to prevent loops
  useEffect(() => {
    if (userId && searchQueryFromRoute) {
      setSearchInput(searchQueryFromRoute); // Update input field
      handleSearchRef.current(searchQueryFromRoute);
    }
  }, [userId, searchQueryFromRoute]);

  // Reapply search when filters change (triggered by shouldReapplySearch flag)
  useEffect(() => {
    if (shouldReapplySearch && searchInput.trim()) {
      console.log('Reapplying search with updated filters:', fullTextSearch.currentFilters);
      handleSearch(searchInput.trim());
      setShouldReapplySearch(false);
    }
  }, [shouldReapplySearch, searchInput, fullTextSearch.currentFilters, handleSearch]);

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
    
    // Record result interaction for enhanced search history
    if (currentSearchId) {
      // searchBar.recordResultInteraction(currentSearchId, 1);
    }
    
    // Navigate to article detail page
    history.push(`/article/${result.id}`);
  }, [currentSearchId, history]);

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

  // Force fix the aria-hidden issue that blocks all button clicks
  useEffect(() => {
    // Ensure the side menu is closed when this page loads
    menuController.close('main-menu').catch(err => console.log('Menu already closed'));
    
    const interval = setInterval(() => {
      // Remove aria-hidden from ALL elements that have it
      const elementsWithAriaHidden = document.querySelectorAll('[aria-hidden="true"]');
      if (elementsWithAriaHidden.length > 0) {
        console.log('🔥 FIXING: Removing aria-hidden from', elementsWithAriaHidden.length, 'elements');
        elementsWithAriaHidden.forEach(element => {
          element.removeAttribute('aria-hidden');
        });
      }
    }, 50); // More frequent checking

    return () => clearInterval(interval);
  }, []);

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
          <div className="search-input-container">
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="search-input w-full p-3 border rounded-lg"
              value={searchInput}
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value);
                
                // Clear existing timeout
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                
                // Set new timeout for mobile UX
                searchTimeoutRef.current = setTimeout(() => {
                  if (value.trim()) {
                    handleSearch(value.trim());
                  } else {
                    fullTextSearch.clearResults();
                  }
                }, 300);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Clear timeout and search immediately on Enter
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  const query = (e.target as HTMLInputElement).value;
                  if (query.trim()) {
                    handleSearch(query.trim());
                  }
                }
              }}
            />
          </div>
          
          {/* Search Filters - Using IonButton instead of HTML buttons */}
          <div className="flex gap-2 mt-3 overflow-x-auto">
            <IonButton 
              fill="solid"
              size="small"
              color="primary"
              onClick={() => {
                console.log('🔥 Filters button clicked!');
                setShowFiltersModal(true);
              }}
            >
              🔍 Filters
            </IonButton>
            <IonButton 
              fill="outline"
              size="small"
              color="medium"
              onClick={() => {
                console.log('🔥 Sort filter clicked, current sortBy:', fullTextSearch.currentFilters.sortBy);
                const newSort = fullTextSearch.currentFilters.sortBy === 'date' ? 'relevance' : 'date';
                console.log('🔥 Changing sort to:', newSort);
                
                const newFilters = { ...fullTextSearch.currentFilters };
                newFilters.sortBy = newSort;
                fullTextSearch.updateFilters(newFilters);
                
                // Trigger reapply search after filters are updated
                setShouldReapplySearch(true);
              }}
            >
              📅 {fullTextSearch.currentFilters.sortBy === 'date' ? 'Latest' : 'Relevance'}
            </IonButton>
            <IonButton 
              fill="outline"
              size="small"
              color="medium"
              onClick={() => {
                console.log('🔥 Read filter clicked, current includeRead:', fullTextSearch.currentFilters.includeRead);
                const newIncludeRead = !fullTextSearch.currentFilters.includeRead;
                console.log('🔥 Changing includeRead to:', newIncludeRead);
                
                const newFilters = { ...fullTextSearch.currentFilters };
                newFilters.includeRead = newIncludeRead;
                fullTextSearch.updateFilters(newFilters);
                
                // Trigger reapply search after filters are updated
                setShouldReapplySearch(true);
              }}
            >
              👁️ {fullTextSearch.currentFilters.includeRead ? 'All' : 'Unread only'}
            </IonButton>
          </div>
        </div>

        {/* Search Results - Simple version */}
        <div className="search-results p-4">
          {fullTextSearch.isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}
          
          {fullTextSearch.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Error: {fullTextSearch.error}</p>
            </div>
          )}
          
          {fullTextSearch.searchResults && (
            <div>
              <p className="text-gray-600 mb-4">
                Found {fullTextSearch.searchResults.totalCount} results for "{fullTextSearch.currentQuery}"
              </p>
              
              {fullTextSearch.searchResults.results.map((result, index) => (
                <div key={result.id || index} className="border-b border-gray-200 py-4">
                  <h3 
                    className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer"
                    onClick={() => handleResultClick(result)}
                    dangerouslySetInnerHTML={{ __html: result.title || 'Untitled' }}
                  />
                  <p className="text-gray-600 text-sm">{result.domain} • {result.author}</p>
                  {result.snippet && (
                    <p 
                      className="text-gray-700 mt-2"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!fullTextSearch.isLoading && !fullTextSearch.searchResults && !fullTextSearch.error && (
            <div className="text-center py-8 text-gray-600">
              <p>Enter a search term above to find articles</p>
            </div>
          )}
        </div>

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
          onClick={() => {
            console.log('🔥 FAB button clicked!');
            setShowFiltersModal(true);
          }}
        >
          <IonIcon icon={settingsOutline} />
        </IonFabButton>
      </IonFab>

      {/* Search Filters Modal - Custom implementation to avoid Ionic overlay issues */}
      {showFiltersModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => {
            console.log('🔥 Backdrop clicked!');
            setShowFiltersModal(false);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">Search Filters</h2>
              <button 
                className="text-white hover:text-gray-200 p-1"
                onClick={() => {
                  console.log('🔥 Modal close X clicked!');
                  setShowFiltersModal(false);
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Sort Options */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Sort by</h3>
                <div className="space-y-2">
                  {['relevance', 'date', 'title', 'author'].map(sortOption => (
                    <label key={sortOption} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        value={sortOption}
                        checked={fullTextSearch.currentFilters.sortBy === sortOption}
                        onChange={(e) => {
                          console.log('🔥 Sort option changed:', e.target.value);
                          const newFilters = { ...fullTextSearch.currentFilters };
                          newFilters.sortBy = e.target.value as any;
                          fullTextSearch.updateFilters(newFilters);
                        }}
                        className="mr-3"
                      />
                      <span className="capitalize">{sortOption}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Include Read */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fullTextSearch.currentFilters.includeRead ?? true}
                    onChange={(e) => {
                      console.log('🔥 Include read changed:', e.target.checked);
                      const newFilters = { ...fullTextSearch.currentFilters };
                      newFilters.includeRead = e.target.checked;
                      fullTextSearch.updateFilters(newFilters);
                    }}
                    className="mr-3"
                  />
                  <span>Include already read articles</span>
                </label>
              </div>

              {/* Domain Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Filter by Domain</h3>
                <input
                  type="text"
                  placeholder="e.g., medium.com, reddit.com"
                  value={fullTextSearch.currentFilters.domainFilter || ''}
                  onChange={(e) => {
                    console.log('🔥 Domain filter changed:', e.target.value);
                    const newFilters = { ...fullTextSearch.currentFilters };
                    newFilters.domainFilter = e.target.value || undefined;
                    fullTextSearch.updateFilters(newFilters);
                  }}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button 
                  className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    console.log('🔥 Apply filters clicked!', fullTextSearch.currentFilters);
                    setShowFiltersModal(false);
                    setShouldReapplySearch(true);
                  }}
                >
                  Apply Filters
                </button>
                
                <button 
                  className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    console.log('🔥 Clear filters clicked!');
                    fullTextSearch.resetFilters();
                    setShowFiltersModal(false);
                    setTimeout(() => setShouldReapplySearch(true), 200);
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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