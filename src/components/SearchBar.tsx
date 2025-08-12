import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonSearchbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonText,
  IonChip,
} from '@ionic/react';
import {
  searchOutline,
  closeOutline,
  timeOutline,
  trendingUpOutline,
  filterOutline,
  sparklesOutline,
  refreshOutline,
} from 'ionicons/icons';
import { SearchSuggestion as EnhancedSearchSuggestion } from '@utils/enhancedSearchHistory';

export interface SearchQuery {
  query: string;
  timestamp: Date;
}

export interface SearchSuggestion {
  text: string;
  type: 'recent' | 'popular' | 'tag' | 'author';
  metadata?: any;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  suggestions?: SearchSuggestion[];
  enhancedSuggestions?: EnhancedSearchSuggestion[];
  recentSearches?: SearchQuery[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onEnhancedSuggestionSelect?: (suggestion: EnhancedSearchSuggestion) => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  maxRecentSearches?: number;
  prioritizeEnhancedSuggestions?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = "Search articles, tags, authors...",
  debounceMs = 300,
  loading = false,
  className = '',
  disabled = false,
  showSuggestions = true,
  suggestions = [],
  enhancedSuggestions = [],
  recentSearches = [],
  onSuggestionSelect,
  onEnhancedSuggestionSelect,
  showFilterButton = true,
  onFilterClick,
  maxRecentSearches = 10,
  prioritizeEnhancedSuggestions = true,
}) => {
  // State
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestionsPopover, setShowSuggestionsPopover] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchbarRef = useRef<HTMLIonSearchbarElement>(null);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        if (query.trim()) {
          onSearch(query.trim());
        }
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Handle input change
  const handleInput = (event: CustomEvent) => {
    const query = event.detail.value;
    setSearchValue(query);

    if (query && query.length > 0) {
      debouncedSearch(query);
      if (showSuggestions) {
        setShowSuggestionsPopover(true);
      }
    } else {
      setShowSuggestionsPopover(false);
      if (onClear) {
        onClear();
      }
    }
  };

  // Handle clear
  const handleClear = () => {
    setSearchValue('');
    setShowSuggestionsPopover(false);
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (onClear) {
      onClear();
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (searchValue && showSuggestions) {
      setShowSuggestionsPopover(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestionsPopover(false);
    }, 200);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchValue(suggestion.text);
    setShowSuggestionsPopover(false);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    // Trigger search immediately for suggestions
    onSearch(suggestion.text);
  };

  // Handle enhanced suggestion selection
  const handleEnhancedSuggestionSelect = (suggestion: EnhancedSearchSuggestion) => {
    setSearchValue(suggestion.text);
    setShowSuggestionsPopover(false);
    
    if (onEnhancedSuggestionSelect) {
      onEnhancedSuggestionSelect(suggestion);
    }
    
    // Trigger search immediately for suggestions
    onSearch(suggestion.text);
  };

  // Handle Enter key
  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter' && searchValue.trim()) {
      // Clear debounce and search immediately
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      onSearch(searchValue.trim());
      setShowSuggestionsPopover(false);
      
      // Blur the search bar
      if (searchbarRef.current) {
        (searchbarRef.current as any).setFocus(false);
      }
    } else if (event.key === 'Escape') {
      setShowSuggestionsPopover(false);
      if (searchbarRef.current) {
        (searchbarRef.current as any).setFocus(false);
      }
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Combine all suggestions
  const allSuggestions = React.useMemo(() => {
    interface CombinedSuggestion {
      text: string;
      type: string;
      metadata?: any;
      score?: number;
      isEnhanced?: boolean;
      originalSuggestion?: SearchSuggestion | EnhancedSearchSuggestion;
    }
    
    const combined: CombinedSuggestion[] = [];
    
    if (prioritizeEnhancedSuggestions && enhancedSuggestions.length > 0) {
      // Add enhanced suggestions first (they already include recency and popularity)
      const enhancedMapped = enhancedSuggestions.map(suggestion => ({
        text: suggestion.text,
        type: suggestion.type,
        metadata: suggestion.metadata,
        score: suggestion.score,
        isEnhanced: true,
        originalSuggestion: suggestion
      }));
      combined.push(...enhancedMapped);
    } else {
      // Add recent searches
      const recentSuggestions = recentSearches
        .slice(0, maxRecentSearches)
        .map(search => ({
          text: search.query,
          type: 'recent',
          metadata: { timestamp: search.timestamp },
          isEnhanced: false,
          originalSuggestion: {
            text: search.query,
            type: 'recent' as const,
            metadata: { timestamp: search.timestamp }
          } as SearchSuggestion
        }));
      
      combined.push(...recentSuggestions);
      
      // Add other suggestions (filtered to avoid duplicates)
      const filteredSuggestions = suggestions.filter(
        suggestion => !recentSuggestions.some(recent => recent.text === suggestion.text)
      );
      
      const basicMapped = filteredSuggestions.map(suggestion => ({
        text: suggestion.text,
        type: suggestion.type,
        metadata: suggestion.metadata,
        isEnhanced: false,
        originalSuggestion: suggestion
      }));
      
      combined.push(...basicMapped);
    }
    
    return combined;
  }, [recentSearches, suggestions, enhancedSuggestions, maxRecentSearches, prioritizeEnhancedSuggestions]);

  // Filter suggestions based on current input
  const filteredSuggestions = React.useMemo(() => {
    if (!searchValue) return allSuggestions;
    
    return allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [allSuggestions, searchValue]);

  // Get suggestion icon
  const getSuggestionIcon = (type: string, isEnhanced: boolean = false) => {
    if (isEnhanced) {
      switch (type) {
        case 'recent':
          return timeOutline;
        case 'popular':
          return trendingUpOutline;
        case 'trending':
          return trendingUpOutline;
        case 'semantic':
          return sparklesOutline;
        case 'typo-correction':
          return refreshOutline;
        default:
          return searchOutline;
      }
    }
    
    // Basic suggestions
    switch (type) {
      case 'recent':
        return timeOutline;
      case 'popular':
        return trendingUpOutline;
      case 'tag':
        return '#';
      case 'author':
        return '@';
      default:
        return searchOutline;
    }
  };

  // Get suggestion color
  const getSuggestionColor = (type: string, isEnhanced: boolean = false) => {
    if (isEnhanced) {
      switch (type) {
        case 'recent':
          return 'primary';
        case 'popular':
          return 'success';
        case 'trending':
          return 'warning';
        case 'semantic':
          return 'secondary';
        case 'typo-correction':
          return 'tertiary';
        default:
          return 'medium';
      }
    }

    switch (type) {
      case 'recent':
        return 'medium';
      case 'popular':
        return 'success';
      case 'tag':
        return 'primary';
      case 'author':
        return 'secondary';
      default:
        return 'medium';
    }
  };

  return (
    <div className={`search-bar-container relative ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <IonSearchbar
            ref={searchbarRef}
            value={searchValue}
            placeholder={placeholder}
            debounce={0} // We handle debouncing manually
            showClearButton="focus"
            disabled={disabled}
            onIonInput={handleInput}
            onIonClear={handleClear}
            onIonFocus={handleFocus}
            onIonBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${isFocused ? 'focused' : ''}`}
            id="main-searchbar"
          />

          {/* Loading spinner overlay */}
          {loading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2 z-10">
              <IonSpinner name="lines-small" />
            </div>
          )}

          {/* Suggestions Popover */}
          {showSuggestions && (
            <IonPopover
              ref={popoverRef}
              trigger="main-searchbar"
              isOpen={showSuggestionsPopover && filteredSuggestions.length > 0}
              onDidDismiss={() => setShowSuggestionsPopover(false)}
              dismissOnSelect={true}
              showBackdrop={false}
              side="bottom"
              alignment="start"
              className="search-suggestions-popover"
            >
              <IonList>
                {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                  <IonItem
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    button
                    onClick={() => {
                      if (suggestion.isEnhanced && suggestion.originalSuggestion) {
                        handleEnhancedSuggestionSelect(suggestion.originalSuggestion as EnhancedSearchSuggestion);
                      } else if (suggestion.originalSuggestion) {
                        handleSuggestionSelect(suggestion.originalSuggestion as SearchSuggestion);
                      }
                    }}
                    className="suggestion-item"
                  >
                    <IonIcon
                      icon={getSuggestionIcon(suggestion.type, suggestion.isEnhanced)}
                      slot="start"
                      color={getSuggestionColor(suggestion.type, suggestion.isEnhanced)}
                    />
                    <IonLabel>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="suggestion-text">
                            {suggestion.text}
                          </span>
                          {suggestion.isEnhanced && suggestion.metadata?.context && (
                            <IonText color="medium" className="text-xs">
                              {suggestion.metadata.context}
                            </IonText>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {suggestion.isEnhanced && typeof suggestion.score === 'number' && (
                            <IonText color="medium" className="text-xs font-medium">
                              {Math.round(suggestion.score * 100)}%
                            </IonText>
                          )}
                          <IonChip
                            color={getSuggestionColor(suggestion.type, suggestion.isEnhanced)}
                            className="suggestion-type-chip"
                          >
                            {suggestion.type.replace('-', ' ')}
                          </IonChip>
                        </div>
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}

                {filteredSuggestions.length === 0 && searchValue && (
                  <IonItem>
                    <IonLabel>
                      <IonText color="medium">No suggestions found</IonText>
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonPopover>
          )}
        </div>

        {/* Filter button */}
        {showFilterButton && (
          <IonButton
            fill="outline"
            size="default"
            onClick={onFilterClick}
            disabled={disabled}
            className="filter-button"
          >
            <IonIcon icon={filterOutline} />
          </IonButton>
        )}
      </div>

      <style>{`
        .search-bar-container .focused {
          --border-color: var(--ion-color-primary);
        }
        
        .search-suggestions-popover {
          --width: calc(100% - 2rem);
          --max-height: 300px;
        }
        
        .suggestion-item {
          --padding-start: 12px;
          --padding-end: 12px;
          --min-height: 48px;
        }
        
        .suggestion-text {
          font-weight: 500;
        }
        
        .suggestion-type-chip {
          font-size: 10px;
          height: 20px;
        }
        
        .filter-button {
          --border-radius: 8px;
          min-width: 48px;
        }
        
        @media (max-width: 768px) {
          .search-bar-container {
            width: 100%;
          }
          
          .filter-button {
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;