import React, { useState, useEffect, useCallback } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonChip,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonToast,
  IonAccordionGroup,
  IonAccordion,
  IonToggle,
  IonRange,
  IonNote,
  IonProgressBar,
} from '@ionic/react';
import {
  closeOutline,
  timeOutline,
  analyticsOutline,
  trashOutline,
  downloadOutline,
  cloudUploadOutline,
  searchOutline,
  trendingUpOutline,
  sparklesOutline,
  filterOutline,
  refreshOutline,
} from 'ionicons/icons';

import { 
  enhancedSearchHistoryManager,
  SearchSuggestion,
  SearchAnalytics,
  EnhancedSearchQuery 
} from '@utils/enhancedSearchHistory';

export interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSelect?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  showAnalytics?: boolean;
}

const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  onSearchSelect,
  onSuggestionSelect,
  showAnalytics = true,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'history' | 'suggestions' | 'analytics'>('history');
  const [searchFilter, setSearchFilter] = useState('');
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  const [showImportToast, setShowImportToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
      loadSuggestions();
    }
  }, [isOpen]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const analyticsData = enhancedSearchHistoryManager.getAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load suggestions
  const loadSuggestions = useCallback(() => {
    const popularSuggestions = enhancedSearchHistoryManager.getSearchSuggestions('', 20);
    setSuggestions(popularSuggestions);
  }, []);

  // Handle search selection
  const handleSearchSelect = (query: string) => {
    if (onSearchSelect) {
      onSearchSelect(query);
    }
    onClose();
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else if (onSearchSelect) {
      onSearchSelect(suggestion.text);
    }
    onClose();
  };

  // Clear search history
  const handleClearHistory = () => {
    enhancedSearchHistoryManager.clearHistory();
    loadAnalytics();
    loadSuggestions();
    setShowClearAlert(false);
    setToastMessage('Search history cleared');
    setShowExportToast(true);
  };

  // Export search history
  const handleExport = () => {
    try {
      const exportData = enhancedSearchHistoryManager.exportHistory();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToastMessage('Search history exported successfully');
      setShowExportToast(true);
    } catch (error) {
      setToastMessage('Failed to export search history');
      setShowExportToast(true);
    }
  };

  // Import search history
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const success = enhancedSearchHistoryManager.importHistory(content);
            
            if (success) {
              loadAnalytics();
              loadSuggestions();
              setToastMessage('Search history imported successfully');
            } else {
              setToastMessage('Failed to import search history - invalid format');
            }
            setShowImportToast(true);
          } catch (error) {
            setToastMessage('Failed to import search history');
            setShowImportToast(true);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Get suggestion type icon and color
  const getSuggestionTypeInfo = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return { icon: timeOutline, color: 'primary' };
      case 'popular':
        return { icon: trendingUpOutline, color: 'success' };
      case 'trending':
        return { icon: trendingUpOutline, color: 'warning' };
      case 'semantic':
        return { icon: sparklesOutline, color: 'secondary' };
      case 'typo-correction':
        return { icon: refreshOutline, color: 'tertiary' };
      default:
        return { icon: searchOutline, color: 'medium' };
    }
  };

  // Format time display
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              <div className="flex items-center gap-2">
                <IonIcon icon={timeOutline} />
                Search History
              </div>
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* Loading indicator */}
          {isLoading && <IonProgressBar type="indeterminate" />}

          {/* Tab Segment */}
          <div className="p-4 pb-2">
            <IonSegment 
              value={activeTab} 
              onIonChange={(e) => setActiveTab(e.detail.value as any)}
            >
              <IonSegmentButton value="history">
                <IonLabel>Recent</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="suggestions">
                <IonLabel>Suggestions</IonLabel>
              </IonSegmentButton>
              {showAnalytics && (
                <IonSegmentButton value="analytics">
                  <IonLabel>Analytics</IonLabel>
                </IonSegmentButton>
              )}
            </IonSegment>
          </div>

          {/* Search Filter */}
          {(activeTab === 'history' || activeTab === 'suggestions') && (
            <div className="px-4 pb-4">
              <IonSearchbar
                value={searchFilter}
                onIonInput={(e) => setSearchFilter(e.detail.value!)}
                placeholder={`Filter ${activeTab}...`}
                debounce={300}
              />
            </div>
          )}

          {/* Recent History Tab */}
          {activeTab === 'history' && (
            <div className="px-4">
              {analytics && analytics.totalSearches > 0 ? (
                <>
                  <div className="mb-4">
                    <IonText className="text-sm text-gray-600">
                      {analytics.totalSearches} total searches • {analytics.uniqueQueries} unique queries
                    </IonText>
                  </div>
                  
                  {analytics.mostSearchedTerms
                    .filter(item => 
                      !searchFilter || 
                      item.query.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((item, index) => (
                      <IonCard key={index} className="mb-3">
                        <IonItem 
                          button 
                          onClick={() => handleSearchSelect(item.query)}
                          className="cursor-pointer"
                        >
                          <IonIcon icon={searchOutline} slot="start" />
                          <IonLabel>
                            <h3 className="font-medium">{item.query}</h3>
                            <p className="text-sm text-gray-600">
                              Used {item.count} time{item.count !== 1 ? 's' : ''}
                            </p>
                          </IonLabel>
                          <IonBadge color="primary" slot="end">
                            {item.count}
                          </IonBadge>
                        </IonItem>
                      </IonCard>
                    ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <IonIcon 
                    icon={timeOutline} 
                    className="text-4xl text-gray-400 mb-4" 
                  />
                  <IonText color="medium">
                    <h3>No search history yet</h3>
                    <p>Your search queries will appear here</p>
                  </IonText>
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="px-4">
              {suggestions.length > 0 ? (
                <>
                  <div className="mb-4">
                    <IonText className="text-sm text-gray-600">
                      Intelligent suggestions based on your search patterns
                    </IonText>
                  </div>
                  
                  {suggestions
                    .filter(suggestion => 
                      !searchFilter || 
                      suggestion.text.toLowerCase().includes(searchFilter.toLowerCase())
                    )
                    .map((suggestion, index) => {
                      const typeInfo = getSuggestionTypeInfo(suggestion.type);
                      return (
                        <IonCard key={index} className="mb-3">
                          <IonItem 
                            button 
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="cursor-pointer"
                          >
                            <IonIcon 
                              icon={typeInfo.icon} 
                              slot="start" 
                              color={typeInfo.color}
                            />
                            <IonLabel>
                              <h3 className="font-medium">{suggestion.text}</h3>
                              <p className="text-sm text-gray-600 capitalize">
                                {suggestion.type.replace('-', ' ')}
                                {suggestion.metadata.context && ` • ${suggestion.metadata.context}`}
                              </p>
                            </IonLabel>
                            <div className="flex flex-col items-end" slot="end">
                              <IonBadge color={typeInfo.color} className="mb-1">
                                {Math.round(suggestion.score * 100)}%
                              </IonBadge>
                              {suggestion.metadata.frequency && (
                                <IonNote className="text-xs">
                                  {suggestion.metadata.frequency}x
                                </IonNote>
                              )}
                            </div>
                          </IonItem>
                        </IonCard>
                      );
                    })}
                </>
              ) : (
                <div className="text-center py-12">
                  <IonIcon 
                    icon={sparklesOutline} 
                    className="text-4xl text-gray-400 mb-4" 
                  />
                  <IonText color="medium">
                    <h3>No suggestions available</h3>
                    <p>Start searching to get intelligent suggestions</p>
                  </IonText>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="px-4">
              <IonAccordionGroup>
                {/* Overall Statistics */}
                <IonAccordion value="overview">
                  <IonItem slot="header">
                    <IonIcon icon={analyticsOutline} slot="start" />
                    <IonLabel>Search Overview</IonLabel>
                  </IonItem>
                  <div slot="content" className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.totalSearches}
                        </div>
                        <div className="text-sm text-gray-600">Total Searches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.uniqueQueries}
                        </div>
                        <div className="text-sm text-gray-600">Unique Queries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(analytics.averageResultCount)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Results</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(analytics.searchPatterns.averageSessionLength)}m
                        </div>
                        <div className="text-sm text-gray-600">Avg Session</div>
                      </div>
                    </div>
                  </div>
                </IonAccordion>

                {/* Search Patterns */}
                <IonAccordion value="patterns">
                  <IonItem slot="header">
                    <IonIcon icon={trendingUpOutline} slot="start" />
                    <IonLabel>Search Patterns</IonLabel>
                  </IonItem>
                  <div slot="content" className="p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Peak Hours</h4>
                      <div className="flex gap-2 flex-wrap">
                        {analytics.searchPatterns.peakHours.map(hour => (
                          <IonChip key={hour} color="primary">
                            {hour}:00
                          </IonChip>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Common Filters</h4>
                      <div className="flex gap-2 flex-wrap">
                        {analytics.searchPatterns.commonFilters.map(filter => (
                          <IonChip key={filter} color="secondary">
                            {filter}
                          </IonChip>
                        ))}
                      </div>
                    </div>
                  </div>
                </IonAccordion>

                {/* Suggestion Usage */}
                <IonAccordion value="suggestions">
                  <IonItem slot="header">
                    <IonIcon icon={sparklesOutline} slot="start" />
                    <IonLabel>Suggestion Usage</IonLabel>
                  </IonItem>
                  <div slot="content" className="p-4">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Acceptance Rate</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.round(analytics.suggestionUsage.acceptanceRate * 100)}%` 
                          }}
                        />
                      </div>
                      <IonText className="text-sm">
                        {Math.round(analytics.suggestionUsage.acceptanceRate * 100)}% of suggestions are used
                      </IonText>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Most Used Types</h4>
                      <div className="flex gap-2 flex-wrap">
                        {analytics.suggestionUsage.mostUsedTypes.map(type => (
                          <IonChip key={type} color="success">
                            {type}
                          </IonChip>
                        ))}
                      </div>
                    </div>
                  </div>
                </IonAccordion>
              </IonAccordionGroup>
            </div>
          )}
        </IonContent>

        {/* Footer Actions */}
        <div className="p-4 border-t">
          <div className="flex gap-3 mb-3">
            <IonButton 
              fill="outline" 
              expand="block" 
              onClick={handleExport}
              disabled={!analytics || analytics.totalSearches === 0}
            >
              <IonIcon icon={downloadOutline} slot="start" />
              Export
            </IonButton>
            <IonButton 
              fill="outline" 
              expand="block" 
              onClick={handleImport}
            >
              <IonIcon icon={cloudUploadOutline} slot="start" />
              Import
            </IonButton>
          </div>
          
          <IonButton 
            fill="clear" 
            expand="block" 
            color="danger"
            onClick={() => setShowClearAlert(true)}
            disabled={!analytics || analytics.totalSearches === 0}
          >
            <IonIcon icon={trashOutline} slot="start" />
            Clear All History
          </IonButton>
        </div>
      </IonModal>

      {/* Clear History Alert */}
      <IonAlert
        isOpen={showClearAlert}
        onDidDismiss={() => setShowClearAlert(false)}
        header="Clear Search History"
        message="Are you sure you want to clear all search history? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Clear',
            role: 'destructive',
            handler: handleClearHistory,
          },
        ]}
      />

      {/* Toast Messages */}
      <IonToast
        isOpen={showExportToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowExportToast(false)}
      />

      <IonToast
        isOpen={showImportToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowImportToast(false)}
      />
    </>
  );
};

export default SearchHistoryModal;