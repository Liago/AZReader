import React, { useState, useEffect } from 'react';
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
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonDatetime,
  IonInput,
  IonChip,
  IonText,
  IonAccordionGroup,
  IonAccordion,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  closeOutline,
  filterOutline,
  calendarOutline,
  bookmarkOutline,
  layersOutline,
  globeOutline,
  refreshOutline,
  saveOutline,
  trashOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { SearchFilters } from '@services/searchService';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<SearchFilters>;
  created_at: Date;
  is_default?: boolean;
}

export interface SearchFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onApplyFilters: (filters: SearchFilters) => void;
  availableTags?: Array<{ id: string; name: string; color?: string; usage_count?: number }>;
  availableDomains?: Array<{ domain: string; count: number }>;
  availableAuthors?: Array<{ author: string; count: number }>;
  filterPresets?: FilterPreset[];
  onSavePreset?: (preset: Omit<FilterPreset, 'id' | 'created_at'>) => void;
  onDeletePreset?: (presetId: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
  showPresets?: boolean;
}

const SearchFiltersModal: React.FC<SearchFiltersModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onFiltersChange,
  onApplyFilters,
  availableTags = [],
  availableDomains = [],
  availableAuthors = [],
  filterPresets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  showPresets = true,
}) => {
  // Local state for filter editing
  const [localFilters, setLocalFilters] = useState<SearchFilters>(currentFilters);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentFilters.tagIds || []);
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string>('date');

  // Update local state when current filters change
  useEffect(() => {
    setLocalFilters(currentFilters);
    setSelectedTags(currentFilters.tagIds || []);
  }, [currentFilters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange({ [key]: value });
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const updated = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(updated);
    handleFilterChange('tagIds', updated);
  };

  // Handle date range changes
  const handleDateFromChange = (event: CustomEvent) => {
    const date = event.detail.value ? new Date(event.detail.value) : undefined;
    handleFilterChange('dateFrom', date);
  };

  const handleDateToChange = (event: CustomEvent) => {
    const date = event.detail.value ? new Date(event.detail.value) : undefined;
    handleFilterChange('dateTo', date);
  };

  // Apply filters and close modal
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  // Reset filters
  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: currentFilters.query,
      includeRead: true,
      sortBy: 'relevance',
    };
    setLocalFilters(resetFilters);
    setSelectedTags([]);
    onFiltersChange(resetFilters);
  };

  // Save preset
  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName.trim(),
        filters: { ...localFilters },
      });
      setPresetName('');
      setShowPresetSave(false);
    }
  };

  // Load preset
  const handleLoadPreset = (preset: FilterPreset) => {
    const loadedFilters = { ...localFilters, ...preset.filters };
    setLocalFilters(loadedFilters);
    setSelectedTags(loadedFilters.tagIds || []);
    onFiltersChange(loadedFilters);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedTags.length > 0) count++;
    if (!localFilters.includeRead) count++;
    if (localFilters.dateFrom || localFilters.dateTo) count++;
    if (localFilters.domainFilter) count++;
    if (localFilters.sortBy && localFilters.sortBy !== 'relevance') count++;
    return count;
  };

  // Format date for display
  const formatDateDisplay = (date?: Date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div className="flex items-center gap-2">
              <IonIcon icon={filterOutline} />
              Advanced Filters
              {getActiveFilterCount() > 0 && (
                <IonBadge color="primary">{getActiveFilterCount()}</IonBadge>
              )}
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
        {/* Filter Presets */}
        {showPresets && filterPresets.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="text-sm">
                <IonIcon icon={saveOutline} className="mr-2" />
                Saved Filters
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex flex-wrap gap-2">
                {filterPresets.map(preset => (
                  <IonChip
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="cursor-pointer"
                  >
                    {preset.name}
                    {preset.is_default && (
                      <IonIcon icon={checkmarkCircleOutline} className="ml-1" />
                    )}
                    {onDeletePreset && (
                      <IonIcon
                        icon={trashOutline}
                        className="ml-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset(preset.id);
                        }}
                      />
                    )}
                  </IonChip>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Filter Accordions */}
        <IonAccordionGroup value={activeAccordion} onIonChange={(e) => setActiveAccordion(e.detail.value)}>
          
          {/* Date Range Filter */}
          <IonAccordion value="date">
            <IonItem slot="header">
              <IonIcon icon={calendarOutline} slot="start" />
              <IonLabel>Date Range</IonLabel>
              {(localFilters.dateFrom || localFilters.dateTo) && (
                <IonBadge color="primary" slot="end">Active</IonBadge>
              )}
            </IonItem>
            <IonList slot="content">
              <IonItem>
                <IonLabel position="stacked">From Date</IonLabel>
                <IonDatetime
                  value={localFilters.dateFrom?.toISOString()}
                  onIonChange={handleDateFromChange}
                  presentation="date"
                  max={new Date().toISOString()}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">To Date</IonLabel>
                <IonDatetime
                  value={localFilters.dateTo?.toISOString()}
                  onIonChange={handleDateToChange}
                  presentation="date"
                  max={new Date().toISOString()}
                  min={localFilters.dateFrom?.toISOString()}
                />
              </IonItem>
              <IonItem>
                <IonText className="text-sm text-gray-600">
                  Current range: {formatDateDisplay(localFilters.dateFrom)} → {formatDateDisplay(localFilters.dateTo)}
                </IonText>
              </IonItem>
            </IonList>
          </IonAccordion>

          {/* Reading Status Filter */}
          <IonAccordion value="reading">
            <IonItem slot="header">
              <IonIcon icon={bookmarkOutline} slot="start" />
              <IonLabel>Reading Status</IonLabel>
              {!localFilters.includeRead && (
                <IonBadge color="primary" slot="end">Unread Only</IonBadge>
              )}
            </IonItem>
            <IonList slot="content">
              <IonRadioGroup
                value={localFilters.includeRead ? 'all' : 'unread'}
                onIonChange={(e) => handleFilterChange('includeRead', e.detail.value === 'all')}
              >
                <IonItem>
                  <IonLabel>All Articles</IonLabel>
                  <IonRadio slot="end" value="all" />
                </IonItem>
                <IonItem>
                  <IonLabel>Unread Only</IonLabel>
                  <IonRadio slot="end" value="unread" />
                </IonItem>
              </IonRadioGroup>
            </IonList>
          </IonAccordion>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <IonAccordion value="tags">
              <IonItem slot="header">
                <IonIcon icon={layersOutline} slot="start" />
                <IonLabel>Tags</IonLabel>
                {selectedTags.length > 0 && (
                  <IonBadge color="primary" slot="end">{selectedTags.length}</IonBadge>
                )}
              </IonItem>
              <IonList slot="content">
                <div className="p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {availableTags
                      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
                      .map(tag => (
                        <IonItem key={tag.id} className="tag-filter-item">
                          <IonCheckbox
                            checked={selectedTags.includes(tag.id)}
                            onIonChange={() => handleTagToggle(tag.id)}
                            slot="start"
                          />
                          <IonLabel className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color || '#e5e7eb' }}
                              />
                              <span>{tag.name}</span>
                            </div>
                            {tag.usage_count && (
                              <IonBadge color="light" className="text-xs">
                                {tag.usage_count}
                              </IonBadge>
                            )}
                          </IonLabel>
                        </IonItem>
                      ))}
                  </div>
                </div>
              </IonList>
            </IonAccordion>
          )}

          {/* Domain Filter */}
          {availableDomains.length > 0 && (
            <IonAccordion value="domain">
              <IonItem slot="header">
                <IonIcon icon={globeOutline} slot="start" />
                <IonLabel>Domain</IonLabel>
                {localFilters.domainFilter && (
                  <IonBadge color="primary" slot="end">Active</IonBadge>
                )}
              </IonItem>
              <IonList slot="content">
                <IonItem>
                  <IonLabel position="stacked">Filter by Domain</IonLabel>
                  <IonSelect
                    value={localFilters.domainFilter}
                    onIonChange={(e) => handleFilterChange('domainFilter', e.detail.value)}
                    placeholder="Select domain"
                    interface="popover"
                  >
                    <IonSelectOption value="">All Domains</IonSelectOption>
                    {availableDomains.map(({ domain, count }) => (
                      <IonSelectOption key={domain} value={domain}>
                        {domain} ({count} articles)
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonList>
            </IonAccordion>
          )}

          {/* Sort Options */}
          <IonAccordion value="sort">
            <IonItem slot="header">
              <IonIcon icon={filterOutline} slot="start" />
              <IonLabel>Sort Order</IonLabel>
              {localFilters.sortBy && localFilters.sortBy !== 'relevance' && (
                <IonBadge color="primary" slot="end">{localFilters.sortBy}</IonBadge>
              )}
            </IonItem>
            <IonList slot="content">
              <IonRadioGroup
                value={localFilters.sortBy || 'relevance'}
                onIonChange={(e) => handleFilterChange('sortBy', e.detail.value)}
              >
                <IonItem>
                  <IonLabel>
                    <h3>Relevance</h3>
                    <p>Best matches first</p>
                  </IonLabel>
                  <IonRadio slot="end" value="relevance" />
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Date Added</h3>
                    <p>Newest articles first</p>
                  </IonLabel>
                  <IonRadio slot="end" value="date" />
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Title</h3>
                    <p>Alphabetical order</p>
                  </IonLabel>
                  <IonRadio slot="end" value="title" />
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Author</h3>
                    <p>Group by author</p>
                  </IonLabel>
                  <IonRadio slot="end" value="author" />
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Popularity</h3>
                    <p>Most liked articles first</p>
                  </IonLabel>
                  <IonRadio slot="end" value="popularity" />
                </IonItem>
              </IonRadioGroup>
            </IonList>
          </IonAccordion>

        </IonAccordionGroup>

        {/* Save Preset Section */}
        {showPresets && onSavePreset && (
          <IonCard className="mt-4">
            <IonCardContent>
              {!showPresetSave ? (
                <IonButton
                  fill="outline"
                  expand="block"
                  onClick={() => setShowPresetSave(true)}
                  disabled={getActiveFilterCount() === 0}
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  Save Current Filters as Preset
                </IonButton>
              ) : (
                <div className="space-y-3">
                  <IonItem>
                    <IonLabel position="stacked">Preset Name</IonLabel>
                    <IonInput
                      value={presetName}
                      onIonInput={(e) => setPresetName(e.detail.value!)}
                      placeholder="Enter preset name"
                    />
                  </IonItem>
                  <div className="flex gap-2">
                    <IonButton
                      fill="solid"
                      expand="block"
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                    >
                      Save
                    </IonButton>
                    <IonButton
                      fill="clear"
                      expand="block"
                      onClick={() => {
                        setShowPresetSave(false);
                        setPresetName('');
                      }}
                    >
                      Cancel
                    </IonButton>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>

      {/* Footer Actions */}
      <div className="p-4 border-t">
        <div className="flex gap-3">
          <IonButton
            fill="clear"
            expand="block"
            onClick={handleReset}
            disabled={getActiveFilterCount() === 0}
          >
            <IonIcon icon={refreshOutline} slot="start" />
            Reset
          </IonButton>
          <IonButton
            fill="solid"
            expand="block"
            onClick={handleApply}
            color="primary"
          >
            Apply Filters
            {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </IonButton>
        </div>
      </div>

      <style>{`
        .tag-filter-item {
          --padding-start: 16px;
          --padding-end: 16px;
        }

        .tag-filter-item ion-checkbox {
          margin-right: 12px;
        }

        .search-filters-modal ion-accordion {
          --background: var(--ion-color-light, #f8f9fa);
        }

        .search-filters-modal ion-accordion[aria-expanded="true"] {
          --background: var(--ion-color-primary-tint, #e3f2fd);
        }

        /* Dark mode support */
        .ios.dark .search-filters-modal ion-accordion,
        .md.dark .search-filters-modal ion-accordion {
          --background: var(--ion-color-dark);
        }

        .ios.dark .search-filters-modal ion-accordion[aria-expanded="true"],
        .md.dark .search-filters-modal ion-accordion[aria-expanded="true"] {
          --background: var(--ion-color-primary-shade);
        }
      `}</style>
    </IonModal>
  );
};

export default SearchFiltersModal;