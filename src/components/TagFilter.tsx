import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonDatetime,
  IonCheckbox,
  IonRange,
} from '@ionic/react';
import {
  filterOutline,
  closeOutline,
  calendarOutline,
  bookmarkOutline,
  timeOutline,
  saveOutline,
  trashOutline,
  settingsOutline,
  checkmarkCircleOutline,
  ellipseOutline,
  bookOutline,
  pricetagOutline,
} from 'ionicons/icons';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import TagCloud from './TagCloud';
import TagInput from './TagInput';
import { Tag } from '@common/database-types';

export type FilterOperator = 'AND' | 'OR';
export type ReadingStatus = 'all' | 'unread' | 'reading' | 'completed';
export type SortOption = 'created_at' | 'updated_at' | 'title' | 'estimated_read_time';
export type SortOrder = 'asc' | 'desc';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface TagFilters {
  // Tag filtering
  selectedTagIds: string[];
  tagOperator: FilterOperator;
  
  // Date filtering
  dateRange: DateRange;
  datePreset: 'all' | 'today' | 'week' | 'month' | '3months' | '6months' | 'year' | 'custom';
  
  // Status filtering
  readingStatus: ReadingStatus;
  favouritesOnly: boolean;
  
  // Content filtering
  searchQuery: string;
  minReadTime: number;
  maxReadTime: number;
  
  // Sorting
  sortBy: SortOption;
  sortOrder: SortOrder;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TagFilters;
  createdAt: string;
  isDefault?: boolean;
}

export interface TagFilterProps {
  filters: TagFilters;
  onFiltersChange: (filters: TagFilters) => void;
  isOpen?: boolean;
  onClose?: () => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: TagFilters) => void;
  onDeletePreset?: (presetId: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  userId?: string;
  mode?: 'modal' | 'inline' | 'compact';
  showPresets?: boolean;
  showAdvanced?: boolean;
}

const defaultFilters: TagFilters = {
  selectedTagIds: [],
  tagOperator: 'OR',
  dateRange: { start: null, end: null },
  datePreset: 'all',
  readingStatus: 'all',
  favouritesOnly: false,
  searchQuery: '',
  minReadTime: 0,
  maxReadTime: 60,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const TagFilter: React.FC<TagFilterProps> = ({
  filters,
  onFiltersChange,
  isOpen = false,
  onClose,
  presets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  userId,
  mode = 'modal',
  showPresets = true,
  showAdvanced = true,
}) => {
  const [activeTab, setActiveTab] = useState<'tags' | 'date' | 'status' | 'advanced'>('tags');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // Update internal state when filters prop changes
  useEffect(() => {
    // This would typically fetch tag details from the selected IDs
    // For now, we'll keep it simple
  }, [filters.selectedTagIds]);

  // Handle tag selection changes
  const handleTagsChange = (tagIds: string[]) => {
    onFiltersChange({
      ...filters,
      selectedTagIds: tagIds,
    });
  };

  // Handle tag operator change
  const handleTagOperatorChange = (operator: FilterOperator) => {
    onFiltersChange({
      ...filters,
      tagOperator: operator,
    });
  };

  // Handle date preset change
  const handleDatePresetChange = (preset: typeof filters.datePreset) => {
    let dateRange: DateRange = { start: null, end: null };
    const now = new Date();
    
    switch (preset) {
      case 'today':
        dateRange.start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        dateRange.end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateRange.start = weekAgo.toISOString();
        dateRange.end = now.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateRange.start = monthAgo.toISOString();
        dateRange.end = now.toISOString();
        break;
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        dateRange.start = threeMonthsAgo.toISOString();
        dateRange.end = now.toISOString();
        break;
      case '6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        dateRange.start = sixMonthsAgo.toISOString();
        dateRange.end = now.toISOString();
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateRange.start = yearAgo.toISOString();
        dateRange.end = now.toISOString();
        break;
      case 'custom':
        // Keep existing custom range
        dateRange = filters.dateRange;
        break;
      default:
        // 'all' - no date filtering
        break;
    }

    onFiltersChange({
      ...filters,
      datePreset: preset,
      dateRange,
    });
  };

  // Handle custom date range change
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      ...filters.dateRange,
      [field]: value,
    };

    onFiltersChange({
      ...filters,
      dateRange: newDateRange,
      datePreset: 'custom',
    });
  };

  // Handle reading status change
  const handleReadingStatusChange = (status: ReadingStatus) => {
    onFiltersChange({
      ...filters,
      readingStatus: status,
    });
  };

  // Handle favorites toggle
  const handleFavoritesToggle = (favouritesOnly: boolean) => {
    onFiltersChange({
      ...filters,
      favouritesOnly,
    });
  };

  // Handle read time range change
  const handleReadTimeChange = (field: 'minReadTime' | 'maxReadTime', value: number) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  // Handle sorting change
  const handleSortingChange = (field: 'sortBy' | 'sortOrder', value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  // Save filter preset
  const savePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.selectedTagIds.length > 0) count++;
    if (filters.datePreset !== 'all') count++;
    if (filters.readingStatus !== 'all') count++;
    if (filters.favouritesOnly) count++;
    if (filters.searchQuery.trim()) count++;
    if (filters.minReadTime > 0 || filters.maxReadTime < 60) count++;
    return count;
  };

  // Render tag filtering section
  const renderTagFiltering = () => (
    <div className="space-y-4">
      {/* Tag Operator Selection */}
      <IonItem>
        <IonLabel>Tag Matching</IonLabel>
        <IonSegment
          value={filters.tagOperator}
          onIonChange={(e) => handleTagOperatorChange(e.detail.value as FilterOperator)}
        >
          <IonSegmentButton value="OR">
            <IonLabel>Any (OR)</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="AND">
            <IonLabel>All (AND)</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </IonItem>

      {/* Tag Selection */}
      <div className="px-4">
        <IonText color="medium">
          <h6>Select Tags:</h6>
        </IonText>
        <TagInput
          selectedTags={selectedTags}
          onTagsChange={(tags) => {
            setSelectedTags(tags);
            handleTagsChange(tags.map(t => t.id));
          }}
          placeholder="Search and select tags..."
          userId={userId}
          mode="input"
          className="mb-4"
        />
        
        {filters.selectedTagIds.length > 0 && (
          <div className="mb-4">
            <IonText color="primary">
              <p className="text-sm">
                Will show articles with {filters.tagOperator === 'AND' ? 'ALL' : 'ANY'} of the selected tags
              </p>
            </IonText>
          </div>
        )}

        <TagCloud
          selectedTagIds={filters.selectedTagIds}
          onTagsChange={handleTagsChange}
          userId={userId}
          mode="cloud"
          size="small"
          maxTags={30}
          showUsageCount={true}
          className="mt-4"
        />
      </div>
    </div>
  );

  // Render date filtering section
  const renderDateFiltering = () => (
    <div className="space-y-4">
      {/* Date Preset Selection */}
      <IonItem>
        <IonLabel>Date Range</IonLabel>
        <IonSelect
          value={filters.datePreset}
          onIonChange={(e) => handleDatePresetChange(e.detail.value)}
        >
          <IonSelectOption value="all">All Time</IonSelectOption>
          <IonSelectOption value="today">Today</IonSelectOption>
          <IonSelectOption value="week">Past Week</IonSelectOption>
          <IonSelectOption value="month">Past Month</IonSelectOption>
          <IonSelectOption value="3months">Past 3 Months</IonSelectOption>
          <IonSelectOption value="6months">Past 6 Months</IonSelectOption>
          <IonSelectOption value="year">Past Year</IonSelectOption>
          <IonSelectOption value="custom">Custom Range</IonSelectOption>
        </IonSelect>
      </IonItem>

      {/* Custom Date Range */}
      {filters.datePreset === 'custom' && (
        <div className="px-4 space-y-4">
          <IonItem>
            <IonLabel>From Date</IonLabel>
            <IonDatetime
              value={filters.dateRange.start}
              onIonChange={(e) => handleDateRangeChange('start', e.detail.value as string)}
              presentation="date"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel>To Date</IonLabel>
            <IonDatetime
              value={filters.dateRange.end}
              onIonChange={(e) => handleDateRangeChange('end', e.detail.value as string)}
              presentation="date"
            />
          </IonItem>
        </div>
      )}
    </div>
  );

  // Render status filtering section
  const renderStatusFiltering = () => (
    <div className="space-y-4">
      {/* Reading Status */}
      <IonItem>
        <IonLabel>Reading Status</IonLabel>
        <IonSelect
          value={filters.readingStatus}
          onIonChange={(e) => handleReadingStatusChange(e.detail.value)}
        >
          <IonSelectOption value="all">All Articles</IonSelectOption>
          <IonSelectOption value="unread">Unread</IonSelectOption>
          <IonSelectOption value="reading">Currently Reading</IonSelectOption>
          <IonSelectOption value="completed">Completed</IonSelectOption>
        </IonSelect>
      </IonItem>

      {/* Favorites Only */}
      <IonItem>
        <IonIcon icon={bookmarkOutline} slot="start" />
        <IonLabel>Favorites Only</IonLabel>
        <IonCheckbox
          checked={filters.favouritesOnly}
          onIonChange={(e) => handleFavoritesToggle(e.detail.checked)}
        />
      </IonItem>
    </div>
  );

  // Render advanced filtering section
  const renderAdvancedFiltering = () => (
    <div className="space-y-4">
      {/* Reading Time Range */}
      <div className="px-4">
        <IonLabel>
          <h6>Estimated Reading Time</h6>
        </IonLabel>
        <div className="mt-2 space-y-4">
          <IonItem>
            <IonLabel>Minimum (minutes)</IonLabel>
            <IonRange
              min={0}
              max={30}
              step={1}
              value={filters.minReadTime}
              onIonChange={(e) => handleReadTimeChange('minReadTime', e.detail.value as number)}
              color="primary"
            />
            <IonText slot="end">{filters.minReadTime}m</IonText>
          </IonItem>
          
          <IonItem>
            <IonLabel>Maximum (minutes)</IonLabel>
            <IonRange
              min={5}
              max={60}
              step={5}
              value={filters.maxReadTime}
              onIonChange={(e) => handleReadTimeChange('maxReadTime', e.detail.value as number)}
              color="primary"
            />
            <IonText slot="end">{filters.maxReadTime}m</IonText>
          </IonItem>
        </div>
      </div>

      {/* Sorting Options */}
      <IonItem>
        <IonLabel>Sort By</IonLabel>
        <IonSelect
          value={filters.sortBy}
          onIonChange={(e) => handleSortingChange('sortBy', e.detail.value)}
        >
          <IonSelectOption value="created_at">Date Added</IonSelectOption>
          <IonSelectOption value="updated_at">Last Modified</IonSelectOption>
          <IonSelectOption value="title">Title</IonSelectOption>
          <IonSelectOption value="estimated_read_time">Reading Time</IonSelectOption>
        </IonSelect>
      </IonItem>

      <IonItem>
        <IonLabel>Sort Order</IonLabel>
        <IonSelect
          value={filters.sortOrder}
          onIonChange={(e) => handleSortingChange('sortOrder', e.detail.value)}
        >
          <IonSelectOption value="desc">Newest First</IonSelectOption>
          <IonSelectOption value="asc">Oldest First</IonSelectOption>
        </IonSelect>
      </IonItem>
    </div>
  );

  // Render preset management
  const renderPresets = () => (
    <div className="space-y-4">
      {/* Save Current Filters */}
      <div className="px-4">
        <IonButton
          fill="outline"
          expand="block"
          onClick={() => setShowSavePreset(true)}
          disabled={getActiveFilterCount() === 0}
        >
          <IonIcon icon={saveOutline} slot="start" />
          Save Current Filters
        </IonButton>
      </div>

      {/* Preset List */}
      {presets.length > 0 && (
        <div className="px-4">
          <IonText color="medium">
            <h6>Saved Presets:</h6>
          </IonText>
          <div className="space-y-2 mt-2">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex-1">
                  <IonText className="font-medium">{preset.name}</IonText>
                  {preset.isDefault && (
                    <IonBadge color="primary" className="ml-2">Default</IonBadge>
                  )}
                </div>
                <div className="flex gap-2">
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => onLoadPreset?.(preset)}
                  >
                    Load
                  </IonButton>
                  <IonButton
                    size="small"
                    fill="clear"
                    color="danger"
                    onClick={() => onDeletePreset?.(preset.id)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render compact mode (for inline display)
  const renderCompactMode = () => (
    <div className="flex flex-wrap items-center gap-2 p-2">
      <IonButton size="small" fill="outline">
        <IonIcon icon={filterOutline} slot="start" />
        Filters
        {getActiveFilterCount() > 0 && (
          <IonBadge color="primary" className="ml-1">
            {getActiveFilterCount()}
          </IonBadge>
        )}
      </IonButton>
      
      {filters.selectedTagIds.length > 0 && (
        <IonBadge color="secondary">
          {filters.selectedTagIds.length} tags
        </IonBadge>
      )}
      
      {getActiveFilterCount() > 0 && (
        <IonButton size="small" fill="clear" color="medium" onClick={clearFilters}>
          <IonIcon icon={closeOutline} />
          Clear
        </IonButton>
      )}
    </div>
  );

  // Render main content
  const renderContent = () => (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <IonSegment
        value={activeTab}
        onIonChange={(e) => setActiveTab(e.detail.value as any)}
      >
        <IonSegmentButton value="tags">
          <IonIcon icon={pricetagOutline} />
          <IonLabel>Tags</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="date">
          <IonIcon icon={calendarOutline} />
          <IonLabel>Date</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="status">
          <IonIcon icon={bookOutline} />
          <IonLabel>Status</IonLabel>
        </IonSegmentButton>
        {showAdvanced && (
          <IonSegmentButton value="advanced">
            <IonIcon icon={settingsOutline} />
            <IonLabel>Advanced</IonLabel>
          </IonSegmentButton>
        )}
      </IonSegment>

      {/* Active Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'tags' && renderTagFiltering()}
        {activeTab === 'date' && renderDateFiltering()}
        {activeTab === 'status' && renderStatusFiltering()}
        {activeTab === 'advanced' && showAdvanced && renderAdvancedFiltering()}
      </div>

      {/* Presets Section */}
      {showPresets && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Filter Presets</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {renderPresets()}
          </IonCardContent>
        </IonCard>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 px-4">
        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          onClick={clearFilters}
          disabled={getActiveFilterCount() === 0}
        >
          Clear All Filters
        </IonButton>
      </div>
    </div>
  );

  // Compact mode render
  if (mode === 'compact') {
    return renderCompactMode();
  }

  // Inline mode render
  if (mode === 'inline') {
    return (
      <IonCard>
        <IonCardContent>
          {renderContent()}
        </IonCardContent>
      </IonCard>
    );
  }

  // Modal mode render
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Filter Articles</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          {getActiveFilterCount() > 0 && (
            <IonBadge color="primary" slot="start" className="ml-4">
              {getActiveFilterCount()} active
            </IonBadge>
          )}
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {renderContent()}
      </IonContent>
    </IonModal>
  );
};

export default TagFilter;