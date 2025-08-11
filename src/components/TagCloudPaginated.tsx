import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  IonChip,
  IonIcon,
  IonSpinner,
  IonText,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSkeletonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  pricetagOutline,
  filterOutline,
  closeOutline,
  checkmarkOutline,
  chevronDownOutline,
  refreshOutline,
  gridOutline,
  listOutline,
} from 'ionicons/icons';
import { Tag } from '@common/database-types';
import { tagPerformanceService } from '@services/tagPerformanceService';
import { TagStatistics } from '@utils/tagCache';

export interface TagCloudPaginatedProps {
  selectedTagIds?: string[];
  onTagsChange?: (selectedTagIds: string[]) => void;
  minUsage?: number;
  mode?: 'cloud' | 'list' | 'grid';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showUsageCount?: boolean;
  userId?: string;
  className?: string;
  sortBy?: 'usage_count' | 'name' | 'last_used';
  direction?: 'horizontal' | 'vertical';
  // Pagination props
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableVirtualScrolling?: boolean;
  maxHeight?: string;
  // Performance props
  enableCaching?: boolean;
  refreshInterval?: number;
}

interface TagCloudItem extends TagStatistics {
  fontSize: number;
  weight: 'light' | 'normal' | 'bold';
  selected: boolean;
}

const TagCloudPaginated: React.FC<TagCloudPaginatedProps> = ({
  selectedTagIds = [],
  onTagsChange,
  minUsage = 1,
  mode = 'cloud',
  size = 'medium',
  interactive = true,
  showUsageCount = true,
  userId,
  className = '',
  sortBy = 'usage_count',
  direction = 'horizontal',
  pageSize = 50,
  enableInfiniteScroll = true,
  enableVirtualScrolling = false,
  maxHeight = '400px',
  enableCaching = true,
  refreshInterval = 0,
}) => {
  // State management
  const [tags, setTags] = useState<TagStatistics[]>([]);
  const [displayedTags, setDisplayedTags] = useState<TagStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const infiniteScrollRef = useRef<HTMLIonInfiniteScrollElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial tags
  const loadTags = useCallback(async (forceRefresh: boolean = false) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const tagStats = await tagPerformanceService.getTagStatistics(userId, {
        sortBy,
        limit: pageSize * 2, // Load more initially for better UX
        forceRefresh: forceRefresh || !enableCaching
      });

      // Filter by minimum usage
      const filtered = tagStats.filter(tag => tag.usage_count >= minUsage);
      
      setTags(filtered);
      setDisplayedTags(filtered.slice(0, pageSize));
      setCurrentPage(1);
      setHasMore(filtered.length > pageSize);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [userId, sortBy, pageSize, minUsage, enableCaching]);

  // Load more tags (for pagination)
  const loadMoreTags = useCallback(async () => {
    if (!hasMore || loadingMore || !userId) return;

    setLoadingMore(true);
    
    try {
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const newTags = tags.slice(startIndex, endIndex);
      
      if (newTags.length > 0) {
        setDisplayedTags(prev => [...prev, ...newTags]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < tags.length);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more tags:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, userId, currentPage, pageSize, tags]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (event: CustomEvent<void>) => {
    await loadMoreTags();
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }, [loadMoreTags]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTags(true);
    setRefreshing(false);
  }, [loadTags]);

  // Initialize component
  useEffect(() => {
    if (userId) {
      loadTags();
    }
  }, [userId, sortBy, loadTags]);

  // Setup refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && userId) {
      refreshIntervalRef.current = setInterval(() => {
        loadTags(true);
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshInterval, userId, loadTags]);

  // Process tags for display with font sizing
  const processedTags = useMemo(() => {
    if (!displayedTags.length) return [];

    // Calculate font sizes and weights for cloud mode
    const maxUsage = Math.max(...displayedTags.map(tag => tag.usage_count));
    const minUsageFound = Math.min(...displayedTags.map(tag => tag.usage_count));
    const usageRange = maxUsage - minUsageFound || 1;

    const fontSizes = {
      small: { min: 10, max: 16 },
      medium: { min: 12, max: 20 },
      large: { min: 14, max: 24 },
    };

    const sizeConfig = fontSizes[size];
    const fontRange = sizeConfig.max - sizeConfig.min;

    return displayedTags.map(tag => {
      const usage = tag.usage_count;
      const normalizedUsage = usageRange > 0 ? (usage - minUsageFound) / usageRange : 0;
      const fontSize = Math.round(sizeConfig.min + (normalizedUsage * fontRange));
      
      let weight: 'light' | 'normal' | 'bold' = 'normal';
      if (normalizedUsage > 0.7) weight = 'bold';
      else if (normalizedUsage < 0.3) weight = 'light';

      return {
        ...tag,
        fontSize,
        weight,
        selected: selectedTagIds.includes(tag.id),
      } as TagCloudItem;
    });
  }, [displayedTags, size, selectedTagIds]);

  // Handle tag selection
  const handleTagClick = useCallback((tag: TagCloudItem) => {
    if (!interactive || !onTagsChange) return;

    const newSelectedIds = tag.selected
      ? selectedTagIds.filter(id => id !== tag.id)
      : [...selectedTagIds, tag.id];
    
    onTagsChange(newSelectedIds);
  }, [interactive, onTagsChange, selectedTagIds]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <IonSkeletonText 
          key={index}
          animated 
          style={{ 
            width: `${60 + Math.random() * 40}%`,
            height: '24px',
            borderRadius: '12px'
          }} 
        />
      ))}
    </div>
  );

  // Render tag chip
  const renderTagChip = (tag: TagCloudItem) => {
    const chipStyle = mode === 'cloud' 
      ? {
          fontSize: `${tag.fontSize}px`,
          fontWeight: tag.weight,
        }
      : {};

    return (
      <IonChip
        key={tag.id}
        color={tag.selected ? 'primary' : 'medium'}
        outline={!tag.selected}
        onClick={() => handleTagClick(tag)}
        onMouseEnter={() => setHoveredTag(tag.id)}
        onMouseLeave={() => setHoveredTag(null)}
        style={chipStyle}
        className={`
          ${interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'} 
          transition-all duration-200 m-1
          ${tag.selected ? 'shadow-md' : ''}
        `}
      >
        <IonIcon
          icon={tag.selected ? checkmarkOutline : pricetagOutline}
          className="mr-1"
        />
        <IonLabel>
          {tag.name}
          {showUsageCount && (
            <span className="ml-1 text-xs opacity-70">
              ({tag.usage_count})
            </span>
          )}
        </IonLabel>
      </IonChip>
    );
  };

  // Render cloud mode
  const renderCloudMode = () => (
    <div 
      className={`flex flex-wrap gap-1 ${className}`}
      style={{ 
        maxHeight: enableVirtualScrolling ? maxHeight : undefined,
        overflowY: enableVirtualScrolling ? 'auto' : undefined
      }}
    >
      {processedTags.map(renderTagChip)}
    </div>
  );

  // Render list mode
  const renderListMode = () => (
    <IonList className={className}>
      {processedTags.map(tag => (
        <IonItem 
          key={tag.id}
          button={interactive}
          onClick={() => handleTagClick(tag)}
          className={tag.selected ? 'ion-activated' : ''}
        >
          {interactive && (
            <IonCheckbox
              checked={tag.selected}
              slot="start"
              onIonChange={() => handleTagClick(tag)}
            />
          )}
          <IonIcon icon={pricetagOutline} slot="start" color={tag.color || 'medium'} />
          <IonLabel>
            <h3>{tag.name}</h3>
            {showUsageCount && (
              <p>
                Used {tag.usage_count} times
                {tag.user_count > 1 && ` • ${tag.user_count} users`}
                {tag.last_used && ` • Last used ${new Date(tag.last_used).toLocaleDateString()}`}
              </p>
            )}
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );

  // Render grid mode
  const renderGridMode = () => (
    <IonGrid className={className}>
      <IonRow>
        {processedTags.map(tag => (
          <IonCol key={tag.id} size="6" sizeSm="4" sizeMd="3" sizeLg="2">
            <div
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${tag.selected 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                }
              `}
              onClick={() => handleTagClick(tag)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <IonIcon 
                    icon={pricetagOutline} 
                    color={tag.selected ? 'primary' : 'medium'} 
                  />
                  <span className="ml-2 font-medium truncate">{tag.name}</span>
                </div>
                {tag.selected && <IonIcon icon={checkmarkOutline} color="primary" />}
              </div>
              {showUsageCount && (
                <div className="mt-1 text-xs text-gray-600">
                  {tag.usage_count} uses
                </div>
              )}
            </div>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );

  // Main render
  if (loading && !refreshing) {
    return (
      <div className={`p-4 ${className}`}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
        <IonButton fill="outline" onClick={() => loadTags(true)} className="mt-2">
          <IonIcon icon={refreshOutline} slot="start" />
          Retry
        </IonButton>
      </div>
    );
  }

  if (!processedTags.length && !loading) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <IonText color="medium">
          <p>No tags found</p>
        </IonText>
        <IonButton fill="outline" onClick={handleRefresh} className="mt-2">
          <IonIcon icon={refreshOutline} slot="start" />
          Refresh
        </IonButton>
      </div>
    );
  }

  return (
    <div className="tag-cloud-paginated">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <IonText>
          <h6 className="m-0">
            Tags ({displayedTags.length}{hasMore && '+'} of {tags.length})
          </h6>
        </IonText>
        
        <div className="flex items-center gap-2">
          <IonButton 
            fill="clear" 
            size="small" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <IonIcon 
              icon={refreshOutline} 
              className={refreshing ? 'animate-spin' : ''} 
            />
          </IonButton>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxHeight: enableVirtualScrolling ? maxHeight : undefined }}>
        {mode === 'cloud' && renderCloudMode()}
        {mode === 'list' && renderListMode()}
        {mode === 'grid' && renderGridMode()}

        {/* Infinite scroll */}
        {enableInfiniteScroll && hasMore && (
          <IonInfiniteScroll
            ref={infiniteScrollRef}
            onIonInfinite={handleInfiniteScroll}
            disabled={loadingMore}
          >
            <IonInfiniteScrollContent
              loadingText="Loading more tags..."
              loadingSpinner="bubbles"
            />
          </IonInfiniteScroll>
        )}

        {/* Load more button (alternative to infinite scroll) */}
        {!enableInfiniteScroll && hasMore && (
          <div className="text-center mt-4">
            <IonButton
              fill="outline"
              onClick={loadMoreTags}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <IonSpinner name="dots" className="mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <IonIcon icon={chevronDownOutline} slot="start" />
                  Load More ({tags.length - displayedTags.length} remaining)
                </>
              )}
            </IonButton>
          </div>
        )}
      </div>

      {/* Performance info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <div>Cache stats: {JSON.stringify(tagPerformanceService.getCacheStatistics())}</div>
          <div>Displayed: {displayedTags.length}, Total: {tags.length}, Has more: {hasMore.toString()}</div>
        </div>
      )}
    </div>
  );
};

export default TagCloudPaginated;