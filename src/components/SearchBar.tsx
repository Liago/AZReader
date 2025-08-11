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
} from 'ionicons/icons';

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
  recentSearches?: SearchQuery[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  maxRecentSearches?: number;
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
  recentSearches = [],
  onSuggestionSelect,
  showFilterButton = true,
  onFilterClick,
  maxRecentSearches = 10,
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

  // Combine recent searches and suggestions
  const allSuggestions = React.useMemo(() => {
    const combined: SearchSuggestion[] = [];
    
    // Add recent searches
    const recentSuggestions = recentSearches
      .slice(0, maxRecentSearches)
      .map(search => ({
        text: search.query,
        type: 'recent' as const,
        metadata: { timestamp: search.timestamp }
      }));
    
    combined.push(...recentSuggestions);
    
    // Add other suggestions (filtered to avoid duplicates)
    const filteredSuggestions = suggestions.filter(
      suggestion => !recentSuggestions.some(recent => recent.text === suggestion.text)
    );
    
    combined.push(...filteredSuggestions);
    
    return combined;
  }, [recentSearches, suggestions, maxRecentSearches]);

  // Filter suggestions based on current input
  const filteredSuggestions = React.useMemo(() => {
    if (!searchValue) return allSuggestions;
    
    return allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [allSuggestions, searchValue]);

  // Get suggestion icon
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
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
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="suggestion-item"
                  >
                    <IonIcon
                      icon={getSuggestionIcon(suggestion.type)}
                      slot="start"
                      className="text-gray-500"
                    />
                    <IonLabel>
                      <div className="flex items-center justify-between">
                        <span className="suggestion-text">
                          {suggestion.text}
                        </span>
                        {suggestion.type !== 'recent' && (
                          <IonChip
                            color={
                              suggestion.type === 'popular'
                                ? 'success'
                                : suggestion.type === 'tag'
                                ? 'primary'
                                : 'medium'
                            }
                            className="suggestion-type-chip"
                          >
                            {suggestion.type}
                          </IonChip>
                        )}
                        {suggestion.type === 'recent' && suggestion.metadata?.timestamp && (
                          <IonText color="medium" className="text-xs">
                            {new Date(suggestion.metadata.timestamp).toLocaleDateString()}
                          </IonText>
                        )}
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