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
  IonItem,
  IonLabel,
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
} from 'ionicons/icons';
import HighlightedText from './HighlightedText';
import { SearchResult } from '@services/searchService';

export interface SearchResultCardProps {
  result: SearchResult;
  searchTerms: string | string[];
  onOpen?: (result: SearchResult) => void;
  onToggleBookmark?: (result: SearchResult) => void;
  showSnippet?: boolean;
  showTags?: boolean;
  showMetadata?: boolean;
  showRelevanceScore?: boolean;
  className?: string;
  loading?: boolean;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  searchTerms,
  onOpen,
  onToggleBookmark,
  showSnippet = true,
  showTags = true,
  showMetadata = true,
  showRelevanceScore = false,
  className = '',
  loading = false,
}) => {
  // Handle loading state
  if (loading) {
    return (
      <IonCard className={`search-result-card ${className}`}>
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

  // Extract search terms for highlighting
  const highlightTerms = Array.isArray(searchTerms) 
    ? searchTerms 
    : searchTerms.split(' ').filter(term => term.trim().length > 1);

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

  return (
    <IonCard 
      className={`search-result-card ${className}`} 
      button={!!onOpen}
      onClick={handleCardClick}
    >
      <IonCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <IonCardTitle className="text-base font-semibold leading-tight">
              <HighlightedText
                text={result.title || 'Untitled'}
                searchTerms={highlightTerms}
                maxLength={100}
              />
            </IonCardTitle>
            
            {/* Author and Domain */}
            {showMetadata && (result.author || result.domain) && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                {result.author && (
                  <div className="flex items-center gap-1">
                    <IonIcon icon={personOutline} className="w-3 h-3" />
                    <HighlightedText
                      text={result.author}
                      searchTerms={highlightTerms}
                      maxLength={30}
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
          </div>

          {/* Actions */}
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
        {/* Description/Snippet */}
        {showSnippet && (result.snippet || result.excerpt) && (
          <div className="mb-3">
            <HighlightedText
              text={result.snippet || result.excerpt || ''}
              searchTerms={highlightTerms}
              maxLength={200}
              className="text-gray-700 leading-relaxed"
            />
          </div>
        )}

        {/* Tags */}
        {showTags && result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.tags.slice(0, 5).map((tag) => (
              <IonChip
                key={tag.id}
                style={{
                  '--background': tag.color || '#e5e7eb',
                  '--color': '#374151'
                }}
                className="text-xs"
              >
                <HighlightedText
                  text={tag.name}
                  searchTerms={highlightTerms}
                  maxLength={15}
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
        .search-result-card {
          --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          --border-radius: 12px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .search-result-card:hover {
          transform: translateY(-2px);
          --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .search-result-card ion-card-header {
          padding-bottom: 8px;
        }

        .search-result-card ion-card-content {
          padding-top: 8px;
        }

        /* Highlight styles */
        .search-result-card .search-highlight {
          background-color: #fef3c7;
          color: #92400e;
          font-weight: 600;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .search-result-card .search-highlight {
            background-color: #451a03;
            color: #fbbf24;
          }
        }

        .ios.dark .search-result-card .search-highlight,
        .md.dark .search-result-card .search-highlight {
          background-color: #451a03;
          color: #fbbf24;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .search-result-card {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </IonCard>
  );
};

export default SearchResultCard;