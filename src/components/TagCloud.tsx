import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from '@ionic/react';
import {
  pricetagOutline,
  filterOutline,
  closeOutline,
  checkmarkOutline,
  chevronDownOutline,
} from 'ionicons/icons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchTags,
  selectFilteredTags,
  selectTagsLoading,
  TagWithStats,
} from '@store/slices/tagsSlice';
import { Tag } from '@common/database-types';
import { tagPerformanceService } from '@services/tagPerformanceService';

export interface TagCloudProps {
  selectedTagIds?: string[];
  onTagsChange?: (selectedTagIds: string[]) => void;
  maxTags?: number;
  minUsage?: number;
  mode?: 'cloud' | 'list'; // cloud = visual tag cloud, list = simple list
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showUsageCount?: boolean;
  userId?: string;
  className?: string;
  sortBy?: 'usage' | 'alphabetical' | 'recent';
  direction?: 'horizontal' | 'vertical';
  // Pagination props
  enablePagination?: boolean;
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableLazyLoading?: boolean;
  // Performance props
  virtualScrolling?: boolean;
  onLoadMore?: () => void;
}

interface TagCloudItem extends TagWithStats {
  fontSize: number;
  weight: 'light' | 'normal' | 'bold';
  selected: boolean;
}

const TagCloud: React.FC<TagCloudProps> = ({
  selectedTagIds = [],
  onTagsChange,
  maxTags = 50,
  minUsage = 1,
  mode = 'cloud',
  size = 'medium',
  interactive = true,
  showUsageCount = true,
  userId,
  className = '',
  sortBy = 'usage',
  direction = 'horizontal',
}) => {
  const dispatch = useAppDispatch();
  const availableTags = useAppSelector(selectFilteredTags);
  const loading = useAppSelector(selectTagsLoading);
  
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Get current user ID from auth state if not provided
  const currentUserId = userId || useAppSelector(state => state.auth?.user?.id);

  // Load tags on mount
  useEffect(() => {
    if (currentUserId && interactive) {
      dispatch(fetchTags({ userId: currentUserId }));
    }
  }, [currentUserId, dispatch, interactive]);

  // Process tags for display
  const processedTags = useMemo(() => {
    if (!availableTags.length) return [];

    // Filter by minimum usage
    let filtered = availableTags.filter(tag => 
      (tag.article_count || 0) >= minUsage
    );

    // Sort tags
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return bDate - aDate;
        });
        break;
      case 'usage':
      default:
        filtered.sort((a, b) => (b.article_count || 0) - (a.article_count || 0));
        break;
    }

    // Limit number of tags
    filtered = filtered.slice(0, maxTags);

    if (!filtered.length) return [];

    // Calculate font sizes and weights for cloud mode
    const maxUsage = Math.max(...filtered.map(tag => tag.article_count || 0));
    const minUsageFound = Math.min(...filtered.map(tag => tag.article_count || 0));
    const usageRange = maxUsage - minUsageFound || 1;

    const fontSizes = {
      small: { min: 10, max: 16 },
      medium: { min: 12, max: 20 },
      large: { min: 14, max: 24 },
    };

    const sizeConfig = fontSizes[size];
    const fontRange = sizeConfig.max - sizeConfig.min;

    return filtered.map(tag => {
      const usage = tag.article_count || 0;
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
  }, [availableTags, minUsage, maxTags, sortBy, size, selectedTagIds]);

  // Handle tag click/selection
  const handleTagClick = (tag: TagCloudItem) => {
    if (!interactive || !onTagsChange) return;

    const newSelectedIds = tag.selected
      ? selectedTagIds.filter(id => id !== tag.id)
      : [...selectedTagIds, tag.id];

    onTagsChange(newSelectedIds);
  };

  // Handle tag hover for interactive effects
  const handleTagHover = (tagId: string | null) => {
    if (interactive) {
      setHoveredTag(tagId);
    }
  };

  // Get tag chip style based on selection and hover state
  const getTagStyle = (tag: TagCloudItem) => {
    const baseStyle: React.CSSProperties = {
      fontSize: mode === 'cloud' ? `${tag.fontSize}px` : undefined,
      fontWeight: mode === 'cloud' ? tag.weight : 'normal',
      margin: mode === 'cloud' ? '2px' : '1px',
      cursor: interactive ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
    };

    if (tag.selected) {
      return {
        ...baseStyle,
        '--background': tag.color || '#3B82F6',
        '--color': '#ffffff',
        transform: hoveredTag === tag.id ? 'scale(1.1)' : 'scale(1.05)',
      };
    }

    if (hoveredTag === tag.id && interactive) {
      return {
        ...baseStyle,
        '--background': tag.color || '#E5E7EB',
        '--color': tag.color ? '#ffffff' : '#374151',
        transform: 'scale(1.05)',
      };
    }

    return {
      ...baseStyle,
      '--background': tag.color ? `${tag.color}20` : '#F3F4F6',
      '--color': tag.color || '#6B7280',
    };
  };

  // Render tag cloud mode
  const renderCloudMode = () => (
    <div 
      className={`tag-cloud flex flex-wrap ${
        direction === 'vertical' ? 'flex-col items-start' : 'items-center justify-start'
      } ${className}`}
      style={{ gap: '4px' }}
    >
      {processedTags.map(tag => (
        <IonChip
          key={tag.id}
          style={getTagStyle(tag)}
          onClick={() => handleTagClick(tag)}
          onMouseEnter={() => handleTagHover(tag.id)}
          onMouseLeave={() => handleTagHover(null)}
          className={`${interactive ? 'hover:shadow-md' : ''}`}
        >
          <IonIcon
            icon={tag.selected ? checkmarkOutline : pricetagOutline}
            className="mr-1"
          />
          {tag.name}
          {showUsageCount && (
            <span className="ml-1 text-xs opacity-75">
              ({tag.article_count || 0})
            </span>
          )}
        </IonChip>
      ))}
    </div>
  );

  // Render list mode
  const renderListMode = () => (
    <IonList className={`tag-cloud-list ${className}`}>
      {processedTags.map(tag => (
        <IonItem
          key={tag.id}
          button={interactive}
          onClick={() => handleTagClick(tag)}
          className={`${tag.selected ? 'selected' : ''}`}
        >
          {interactive && (
            <IonCheckbox
              slot="start"
              checked={tag.selected}
              onIonChange={() => handleTagClick(tag)}
            />
          )}
          
          <IonLabel>
            <div className="flex items-center">
              <IonChip
                style={{
                  '--background': tag.color || '#F3F4F6',
                  '--color': tag.color ? '#ffffff' : '#6B7280',
                  fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
                }}
                className="mr-2"
              >
                {tag.name}
              </IonChip>
              
              {showUsageCount && (
                <IonText color="medium" className="text-xs">
                  {tag.article_count || 0} articles
                </IonText>
              )}
            </div>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );

  // Render loading state
  if (loading.fetchTags && !processedTags.length) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <IonSpinner name="crescent" className="mr-2" />
        <IonText color="medium">Loading tags...</IonText>
      </div>
    );
  }

  // Render empty state
  if (!processedTags.length) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        <IonIcon icon={pricetagOutline} className="text-2xl mb-2 opacity-50" />
        <IonText color="medium">
          <p>No tags found</p>
          {minUsage > 1 && (
            <p className="text-xs mt-1">
              Try lowering the minimum usage filter
            </p>
          )}
        </IonText>
      </div>
    );
  }

  return (
    <div className={`tag-cloud-container ${className}`}>
      {/* Header with selection info */}
      {interactive && selectedTagIds.length > 0 && (
        <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <IonIcon icon={filterOutline} className="text-blue-600 mr-2" />
            <IonText className="text-blue-800 font-medium">
              {selectedTagIds.length} tag{selectedTagIds.length !== 1 ? 's' : ''} selected
            </IonText>
          </div>
          <IonButton
            fill="clear"
            size="small"
            color="primary"
            onClick={() => onTagsChange?.([])}
          >
            <IonIcon icon={closeOutline} />
            Clear
          </IonButton>
        </div>
      )}

      {/* Tag display */}
      {mode === 'cloud' ? renderCloudMode() : renderListMode()}

      {/* Footer with stats */}
      {processedTags.length > 0 && (
        <div className="mt-3 text-center">
          <IonText color="medium" className="text-xs">
            Showing {processedTags.length} of {availableTags.length} tags
            {minUsage > 1 && ` (min usage: ${minUsage})`}
          </IonText>
        </div>
      )}
    </div>
  );
};

export default TagCloud;