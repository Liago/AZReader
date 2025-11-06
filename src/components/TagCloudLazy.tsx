import React, { useCallback, useMemo } from 'react';
import {
  IonChip,
  IonIcon,
  IonSpinner,
  IonText,
  IonButton,
  IonSkeletonText,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  pricetagOutline,
  checkmarkOutline,
  refreshOutline,
  chevronDownOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { useTagLazyLoading, useTagVirtualScrolling } from '@hooks/useTagLazyLoading';
import { TagStatistics } from '@utils/tagCache';

export interface TagCloudLazyProps {
  userId: string;
  selectedTagIds?: string[];
  onTagsChange?: (selectedTagIds: string[]) => void;
  mode?: 'cloud' | 'list' | 'virtual';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showUsageCount?: boolean;
  className?: string;
  sortBy?: 'usage_count' | 'name' | 'last_used';
  minUsage?: number;
  maxHeight?: string;
  
  // Lazy loading options
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableRefresh?: boolean;
  enableVirtualScrolling?: boolean;
  preloadPages?: number;
}

interface TagCloudItem extends TagStatistics {
  fontSize: number;
  weight: 'light' | 'normal' | 'bold';
  selected: boolean;
}

const TagCloudLazy: React.FC<TagCloudLazyProps> = ({
  userId,
  selectedTagIds = [],
  onTagsChange,
  mode = 'cloud',
  size = 'medium',
  interactive = true,
  showUsageCount = true,
  className = '',
  sortBy = 'usage_count',
  minUsage = 1,
  maxHeight = '400px',
  pageSize = 30,
  enableInfiniteScroll = true,
  enableRefresh = true,
  enableVirtualScrolling = false,
  preloadPages = 1,
}) => {
  // Use lazy loading hook
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    currentPage,
    totalItems,
    loadMore,
    refresh,
    scrollElementRef,
    isNearBottom,
  } = useTagLazyLoading(userId, {
    pageSize,
    enableInfiniteScroll,
    sortBy,
    minUsage,
    preloadPages,
  });

  // Virtual scrolling for performance with large lists
  const virtualScrolling = useTagVirtualScrolling(
    items,
    {
      containerHeight: parseInt(maxHeight.replace('px', '')) || 400,
      itemHeight: mode === 'cloud' ? 40 : 60, // Approximate item heights
      overscan: 5,
    }
  );

  // Process tags for display
  const processedTags = useMemo(() => {
    const tagsToProcess = enableVirtualScrolling && mode === 'list' 
      ? virtualScrolling.visibleItems 
      : items;

    if (!tagsToProcess.length) return [];

    // Calculate font sizes and weights for cloud mode
    const maxUsage = Math.max(...tagsToProcess.map(tag => tag.usage_count));
    const minUsageFound = Math.min(...tagsToProcess.map(tag => tag.usage_count));
    const usageRange = maxUsage - minUsageFound || 1;

    const fontSizes = {
      small: { min: 10, max: 16 },
      medium: { min: 12, max: 20 },
      large: { min: 14, max: 24 },
    };

    const sizeConfig = fontSizes[size];
    const fontRange = sizeConfig.max - sizeConfig.min;

    return tagsToProcess.map((tag, index) => {
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
        // Add virtual scrolling index for positioning
        virtualIndex: enableVirtualScrolling ? virtualScrolling.startIndex + index : index,
      } as TagCloudItem & { virtualIndex: number };
    });
  }, [items, selectedTagIds, size, enableVirtualScrolling, virtualScrolling, mode]);

  // Handle tag selection
  const handleTagClick = useCallback((tag: TagCloudItem) => {
    if (!interactive || !onTagsChange) return;

    const newSelectedIds = tag.selected
      ? selectedTagIds.filter(id => id !== tag.id)
      : [...selectedTagIds, tag.id];
    
    onTagsChange(newSelectedIds);
  }, [interactive, onTagsChange, selectedTagIds]);

  // Handle refresh
  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await refresh();
    } finally {
      event.detail.complete();
    }
  }, [refresh]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (event: CustomEvent<void>) => {
    try {
      await loadMore();
    } finally {
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  }, [loadMore]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-2 p-4">
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
  const renderTagChip = (tag: TagCloudItem & { virtualIndex?: number }) => {
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
        style={chipStyle}
        className={`
          ${interactive ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'} 
          transition-all duration-200 m-1
          ${tag.selected ? 'shadow-md ring-2 ring-primary ring-opacity-50' : ''}
        `}
      >
        <IonIcon
          icon={tag.selected ? checkmarkOutline : pricetagOutline}
          className="mr-1"
        />
        <span>
          {tag.name}
          {showUsageCount && (
            <span className="ml-1 text-xs opacity-70">
              ({tag.usage_count})
            </span>
          )}
        </span>
      </IonChip>
    );
  };

  // Render error state
  if (error && !items.length) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <IonIcon 
          icon={alertCircleOutline} 
          className="text-4xl text-red-500 mb-2" 
        />
        <IonText color="danger">
          <h3>Error Loading Tags</h3>
          <p className="text-sm">{error}</p>
        </IonText>
        <IonButton 
          fill="outline" 
          onClick={refresh} 
          className="mt-3"
          disabled={loading}
        >
          <IonIcon icon={refreshOutline} slot="start" />
          Try Again
        </IonButton>
      </div>
    );
  }

  // Render empty state
  if (!loading && !items.length) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <IonIcon 
          icon={pricetagOutline} 
          className="text-4xl text-gray-400 mb-2" 
        />
        <IonText color="medium">
          <h3>No Tags Found</h3>
          <p className="text-sm">
            {minUsage > 1 
              ? `No tags with ${minUsage}+ uses found`
              : 'Start adding tags to your articles'
            }
          </p>
        </IonText>
        {enableRefresh && (
          <IonButton 
            fill="outline" 
            onClick={refresh} 
            className="mt-3"
            disabled={loading}
          >
            <IonIcon icon={refreshOutline} slot="start" />
            Refresh
          </IonButton>
        )}
      </div>
    );
  }

  // Main render
  return (
    <div className={`tag-cloud-lazy ${className}`}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-3 px-2">
        <IonText color="medium" className="text-sm">
          Showing {items.length} of {totalItems} tags
        </IonText>
        
        {process.env.NODE_ENV === 'development' && (
          <IonText color="medium" className="text-xs">
            Page {currentPage} • {hasMore ? 'Has more' : 'End'}
            {isNearBottom && ' • Near bottom'}
          </IonText>
        )}
      </div>

      {/* Refresher */}
      {enableRefresh && (
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent 
            pullingText="Pull to refresh tags..."
            refreshingSpinner="bubbles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>
      )}

      {/* Content container */}
      <div 
        ref={scrollElementRef as React.RefObject<HTMLDivElement>}
        className="tag-cloud-container"
        style={{ 
          maxHeight,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Virtual scrolling container */}
        {enableVirtualScrolling && mode === 'list' ? (
          <div style={{ height: virtualScrolling.totalHeight, position: 'relative' }}>
            <div 
              style={{ 
                transform: `translateY(${virtualScrolling.offsetY}px)`,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              {processedTags.map(renderTagChip)}
            </div>
          </div>
        ) : (
          /* Regular rendering */
          <>
            {/* Loading skeleton for initial load */}
            {loading && !items.length && renderLoadingSkeleton()}
            
            {/* Tag content */}
            {mode === 'cloud' && (
              <div className="flex flex-wrap gap-1 p-2">
                {processedTags.map(renderTagChip)}
              </div>
            )}
            
            {mode === 'list' && (
              <div className="space-y-1 p-2">
                {processedTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border
                      ${tag.selected 
                        ? 'border-primary bg-primary bg-opacity-10' 
                        : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                      }
                      ${interactive ? 'cursor-pointer' : 'cursor-default'}
                      transition-all duration-200
                    `}
                    onClick={() => handleTagClick(tag)}
                  >
                    <div className="flex items-center">
                      <IonIcon 
                        icon={tag.selected ? checkmarkOutline : pricetagOutline} 
                        color={tag.selected ? 'primary' : 'medium'} 
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        {showUsageCount && (
                          <div className="text-sm text-gray-600">
                            {tag.usage_count} uses
                            {tag.last_used && (
                              <span className="ml-2">
                                • Last used {new Date(tag.last_used).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {tag.selected && (
                      <IonIcon icon={checkmarkOutline} color="primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center p-4">
                <IonSpinner name="dots" className="mr-2" />
                <IonText color="medium">Loading more tags...</IonText>
              </div>
            )}
            
            {/* Infinite scroll */}
            {enableInfiniteScroll && hasMore && !enableVirtualScrolling && (
              <IonInfiniteScroll
                onIonInfinite={handleInfiniteScroll}
                disabled={loadingMore}
              >
                <IonInfiniteScrollContent
                  loadingText="Loading more tags..."
                  loadingSpinner="bubbles"
                />
              </IonInfiniteScroll>
            )}
            
            {/* Manual load more button (fallback) */}
            {!enableInfiniteScroll && hasMore && (
              <div className="text-center p-4">
                <IonButton
                  fill="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <IonSpinner name="dots" slot="start" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={chevronDownOutline} slot="start" />
                      Load More ({totalItems - items.length} remaining)
                    </>
                  )}
                </IonButton>
              </div>
            )}
            
            {/* End of results indicator */}
            {!hasMore && items.length > 0 && (
              <div className="text-center p-4">
                <IonText color="medium" className="text-sm">
                  {items.length === totalItems 
                    ? `All ${totalItems} tags loaded`
                    : 'End of results'
                  }
                </IonText>
              </div>
            )}
          </>
        )}
      </div>

      {/* Performance info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div>
            Virtual: {enableVirtualScrolling.toString()} • 
            Items: {items.length}/{totalItems} • 
            Page: {currentPage} • 
            Loading: {loading.toString()} • 
            LoadingMore: {loadingMore.toString()}
          </div>
          {enableVirtualScrolling && mode === 'list' && (
            <div>
              Visible: {virtualScrolling.startIndex}-{virtualScrolling.endIndex} • 
              Total Height: {virtualScrolling.totalHeight}px
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagCloudLazy;