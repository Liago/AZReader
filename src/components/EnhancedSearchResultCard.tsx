// Enhanced Search Result Card for Task 10.9
// Integrates with Task 10.8 multi-field search and provides advanced highlighting

import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonText,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
} from '@ionic/react';
import {
  openOutline,
  timeOutline,
  personOutline,
  globeOutline,
  bookmarkOutline,
  bookmark,
  starOutline,
  eyeOutline,
  sparklesOutline,
} from 'ionicons/icons';

import EnhancedHighlightedText, { 
  TitleHighlight, 
  ContentHighlight, 
  AuthorHighlight, 
  TagHighlight 
} from './EnhancedHighlightedText';
import { EnhancedSearchResult } from '@services/enhancedSearchService';
import { parseSearchQuery } from '@utils/enhancedHighlighting';

export interface EnhancedSearchResultCardProps {
  result: EnhancedSearchResult;
  searchQuery: string;
  onOpen?: (result: EnhancedSearchResult) => void;
  onToggleBookmark?: (result: EnhancedSearchResult) => void;
  showSnippet?: boolean;
  showTags?: boolean;
  showMetadata?: boolean;
  showRelevanceScore?: boolean;
  showMatchedFields?: boolean;
  showSearchContext?: boolean;
  enableMultipleColors?: boolean;
  enableDebugMode?: boolean;
  className?: string;
  loading?: boolean;
}

const EnhancedSearchResultCard: React.FC<EnhancedSearchResultCardProps> = ({
  result,
  searchQuery,
  onOpen,
  onToggleBookmark,
  showSnippet = true,
  showTags = true,
  showMetadata = true,
  showRelevanceScore = false,
  showMatchedFields = false,
  showSearchContext = false,
  enableMultipleColors = true,
  enableDebugMode = false,
  className = '',
  loading = false,
}) => {
  // Handle loading state
  if (loading) {
    return (
      <IonCard className={`enhanced-search-result-card ${className}`}>
        <IonCardHeader>
          <IonSkeletonText animated style={{ width: '80%' }} />
          <IonSkeletonText animated style={{ width: '60%' }} />
        </IonCardHeader>
        <IonCardContent>
          <IonSkeletonText animated style={{ width: '100%' }} />
          <IonSkeletonText animated style={{ width: '100%' }} />
          <IonSkeletonText animated style={{ width: '70%' }} />
        </IonCardContent>
      </IonCard>
    );
  }

  // Parse search query for advanced features
  const queryAnalysis = parseSearchQuery(searchQuery);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get domain favicon URL
  const getFaviconUrl = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  };

  // Handle card click
  const handleCardClick = () => {
    if (onOpen) {
      onOpen(result);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(result);
    }
  };

  // Get field match indicators
  const getMatchedFieldsDisplay = () => {
    if (!result.matched_fields || result.matched_fields.length === 0) return null;

    const fieldColors: { [key: string]: string } = {
      title: 'primary',
      content: 'secondary', 
      author: 'success',
      tags: 'warning'
    };

    return result.matched_fields.map(field => (
      <IonChip 
        key={field} 
        color={fieldColors[field] || 'medium'} 
        size="small"
        className="field-match-chip"
      >
        <IonIcon 
          icon={field === 'title' ? sparklesOutline : 
                field === 'author' ? personOutline :
                field === 'tags' ? bookmarkOutline : eyeOutline} 
          className="field-icon" 
        />
        {field}
      </IonChip>
    ));
  };

  // Get search context display
  const getSearchContextDisplay = () => {
    if (!result.search_context) return null;

    const contextColors: { [key: string]: string } = {
      simple: 'medium',
      phrase: 'primary',
      complex: 'warning'
    };

    return (
      <div className="search-context-info">
        <IonChip 
          color={contextColors[result.search_context.query_type]} 
          size="small"
        >
          {result.search_context.query_type} search
        </IonChip>
        <span className="execution-time">
          {result.search_context.execution_time_ms.toFixed(1)}ms
        </span>
      </div>
    );
  };

  return (
    <IonCard 
      className={`enhanced-search-result-card ${className} query-type-${queryAnalysis.query_type}`} 
      button={!!onOpen}
      onClick={handleCardClick}
    >
      <IonCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title with enhanced highlighting */}
            <IonCardTitle className="text-base font-semibold leading-tight">
              <TitleHighlight
                text={result.title || 'Untitled'}
                searchQuery={searchQuery}
                matchedFields={result.matched_fields}
                enableMultipleColors={enableMultipleColors}
                showPerformanceInfo={enableDebugMode}
              />
            </IonCardTitle>
            
            {/* Author and Domain with highlighting */}
            {showMetadata && (result.author || result.domain) && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                {result.author && (
                  <div className="flex items-center gap-1">
                    <IonIcon icon={personOutline} className="w-3 h-3" />
                    <AuthorHighlight
                      text={result.author}
                      searchQuery={searchQuery}
                      matchedFields={result.matched_fields}
                      enableMultipleColors={enableMultipleColors}
                      options={{ maxLength: 30 }}
                    />
                  </div>
                )}
                
                {result.domain && (
                  <div className="flex items-center gap-1">
                    <img 
                      src={getFaviconUrl(result.domain)} 
                      alt=""
                      className="w-3 h-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <IonIcon icon={globeOutline} className="w-3 h-3" />
                    <span>{result.domain}</span>
                  </div>
                )}
              </div>
            )}

            {/* Matched fields indicators */}
            {showMatchedFields && result.matched_fields && result.matched_fields.length > 0 && (
              <div className="matched-fields-container mt-2">
                <span className="matched-fields-label">Matched in:</span>
                <div className="matched-fields-chips">
                  {getMatchedFieldsDisplay()}
                </div>
              </div>
            )}
          </div>

          {/* Actions and indicators */}
          <div className="flex items-center gap-1 ml-3">
            {showRelevanceScore && result.relevance_score && (
              <IonBadge color="primary" className="text-xs">
                <IonIcon icon={starOutline} className="w-3 h-3 mr-1" />
                {result.relevance_score.toFixed(2)}
              </IonBadge>
            )}
            
            {onToggleBookmark && (
              <IonButton
                fill="clear"
                size="small"
                onClick={handleBookmarkToggle}
              >
                <IonIcon 
                  icon={result.is_favorite ? bookmark : bookmarkOutline}
                  color={result.is_favorite ? 'primary' : 'medium'}
                />
              </IonButton>
            )}
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Description/Snippet with enhanced highlighting */}
        {showSnippet && (result.snippet || result.excerpt) && (
          <div className="mb-3">
            <ContentHighlight
              text={result.snippet || result.excerpt || ''}
              searchQuery={searchQuery}
              matchedFields={result.matched_fields}
              enableMultipleColors={enableMultipleColors}
              options={{ maxLength: 200 }}
              className="text-gray-700 leading-relaxed"
              showPerformanceInfo={enableDebugMode}
            />
          </div>
        )}

        {/* Tags with enhanced highlighting */}
        {showTags && result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.tags.slice(0, 5).map((tag) => (
              <IonChip
                key={tag.id}
                style={{
                  '--background': tag.color || '#e5e7eb',
                  '--color': '#374151'
                }}
                className="text-xs tag-chip"
              >
                <TagHighlight
                  text={tag.name}
                  searchQuery={searchQuery}
                  matchedFields={result.matched_fields}
                  enableMultipleColors={enableMultipleColors}
                  options={{ maxLength: 15 }}
                />
              </IonChip>
            ))}
            {result.tags.length > 5 && (
              <IonChip color="medium" className="text-xs">
                +{result.tags.length - 5}
              </IonChip>
            )}
          </div>
        )}

        {/* Search context information */}
        {showSearchContext && (
          <div className="search-context-section mb-3">
            {getSearchContextDisplay()}
          </div>
        )}

        {/* Metadata */}
        {showMetadata && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {result.created_at && (
                <div className="flex items-center gap-1">
                  <IonIcon icon={timeOutline} className="w-3 h-3" />
                  <span>{formatDate(result.created_at)}</span>
                </div>
              )}
              
              {result.reading_status && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: result.reading_status === 'unread' 
                        ? '#9ca3af' 
                        : result.reading_status === 'completed' 
                        ? '#10b981' 
                        : '#f59e0b'
                    }}
                  />
                  <span>{result.reading_status}</span>
                </div>
              )}
            </div>

            {onOpen && (
              <IonButton
                fill="clear"
                size="small"
                className="text-xs"
              >
                <IonIcon icon={openOutline} slot="start" className="w-3 h-3" />
                Open
              </IonButton>
            )}
          </div>
        )}
      </IonCardContent>

      <style>{`
        .enhanced-search-result-card {
          --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          --border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .enhanced-search-result-card:hover {
          transform: translateY(-2px);
          --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .enhanced-search-result-card ion-card-header {
          padding-bottom: 8px;
        }

        .enhanced-search-result-card ion-card-content {
          padding-top: 8px;
        }

        /* Query type indicators */
        .enhanced-search-result-card.query-type-phrase {
          border-left: 4px solid var(--ion-color-primary, #3880ff);
        }

        .enhanced-search-result-card.query-type-complex {
          border-left: 4px solid var(--ion-color-warning, #ffc409);
        }

        /* Matched fields styling */
        .matched-fields-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .matched-fields-label {
          font-size: 0.75rem;
          color: var(--ion-color-medium, #666);
          font-weight: 500;
        }

        .matched-fields-chips {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .field-match-chip {
          font-size: 0.6rem;
          height: 20px;
          --border-radius: 10px;
        }

        .field-match-chip .field-icon {
          width: 12px;
          height: 12px;
          margin-right: 2px;
        }

        /* Search context styling */
        .search-context-section {
          padding: 0.5rem;
          background-color: var(--ion-color-light, #f8f9fa);
          border-radius: 0.5rem;
          font-size: 0.75rem;
        }

        .search-context-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .execution-time {
          color: var(--ion-color-medium, #666);
          font-family: monospace;
          background-color: var(--ion-color-light-shade, #e9ecef);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }

        /* Tag chip enhancements */
        .tag-chip {
          transition: transform 0.2s ease;
        }

        .tag-chip:hover {
          transform: scale(1.05);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .search-context-section {
            background-color: var(--ion-color-dark-shade, #1e2023);
          }

          .execution-time {
            background-color: var(--ion-color-dark-tint, #383a3e);
            color: var(--ion-color-light, #f8f9fa);
          }
        }

        .ios.dark .search-context-section,
        .md.dark .search-context-section {
          background-color: var(--ion-color-dark-shade, #1e2023);
        }

        .ios.dark .execution-time,
        .md.dark .execution-time {
          background-color: var(--ion-color-dark-tint, #383a3e);
          color: var(--ion-color-light, #f8f9fa);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .enhanced-search-result-card {
            margin-bottom: 8px;
          }

          .matched-fields-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .search-context-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }

        /* Animation for new results */
        @keyframes resultAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .enhanced-search-result-card.animate-in {
          animation: resultAppear 0.3s ease-out;
        }

        /* Focus states for accessibility */
        .enhanced-search-result-card:focus {
          outline: 2px solid var(--ion-color-primary, #3880ff);
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .enhanced-search-result-card {
            break-inside: avoid;
            margin-bottom: 1rem;
            box-shadow: none;
            border: 1px solid #ccc;
          }

          .matched-fields-container,
          .search-context-section {
            display: none;
          }
        }
      `}</style>
    </IonCard>
  );
};

export default EnhancedSearchResultCard;