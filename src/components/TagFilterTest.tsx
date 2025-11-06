import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonBadge,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  filterOutline,
  cloudOutline,
  listOutline,
  statsChartOutline,
  arrowUndoOutline,
  arrowRedoOutline,
} from 'ionicons/icons';
import TagCloud from './TagCloud';
import TagFilter from './TagFilter';
import useArticleFilters from '@hooks/useArticleFilters';
import { Post } from '@store/slices/postsSlice';

// Sample articles for testing
const sampleArticles: Post[] = [
  {
    id: '1',
    title: 'Introduction to React Hooks',
    excerpt: 'Learn the basics of React Hooks and how they can improve your code.',
    content: 'React Hooks are a powerful feature...',
    url: 'https://example.com/react-hooks',
    user_id: 'user1',
    tags: ['react', 'javascript', 'hooks'],
    reading_status: 'unread',
    is_favorite: true,
    estimated_read_time: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    author: 'John Doe',
    domain: 'example.com',
    like_count: 10,
    comment_count: 3,
    published_date: '2024-01-15T10:00:00Z',
    scraped_at: '2024-01-15T10:00:00Z',
    image_url: null,
    favicon_url: null,
    is_public: null,
  },
  {
    id: '2',
    title: 'TypeScript Best Practices',
    excerpt: 'Essential tips for writing maintainable TypeScript code.',
    content: 'TypeScript provides type safety...',
    url: 'https://example.com/typescript',
    user_id: 'user1',
    tags: ['typescript', 'javascript', 'best-practices'],
    reading_status: 'completed',
    is_favorite: false,
    estimated_read_time: 8,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    author: 'Jane Smith',
    domain: 'example.com',
    like_count: 15,
    comment_count: 7,
    published_date: '2024-01-20T14:30:00Z',
    scraped_at: '2024-01-20T14:30:00Z',
    image_url: null,
    favicon_url: null,
    is_public: null,
  },
  {
    id: '3',
    title: 'Advanced CSS Grid Techniques',
    excerpt: 'Master CSS Grid with these advanced layout techniques.',
    content: 'CSS Grid is a powerful layout system...',
    url: 'https://example.com/css-grid',
    user_id: 'user1',
    tags: ['css', 'web-design', 'layout'],
    reading_status: 'reading',
    is_favorite: true,
    estimated_read_time: 12,
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-01T09:15:00Z',
    author: 'Mike Johnson',
    domain: 'example.com',
    like_count: 25,
    comment_count: 12,
    published_date: '2024-02-01T09:15:00Z',
    scraped_at: '2024-02-01T09:15:00Z',
    image_url: null,
    favicon_url: null,
    is_public: null,
  },
  {
    id: '4',
    title: 'Node.js Performance Optimization',
    excerpt: 'Tips and tricks to optimize your Node.js applications.',
    content: 'Performance optimization in Node.js...',
    url: 'https://example.com/nodejs-performance',
    user_id: 'user1',
    tags: ['nodejs', 'javascript', 'performance'],
    reading_status: 'unread',
    is_favorite: false,
    estimated_read_time: 15,
    created_at: '2024-02-10T16:45:00Z',
    updated_at: '2024-02-10T16:45:00Z',
    author: 'Sarah Wilson',
    domain: 'example.com',
    like_count: 30,
    comment_count: 18,
    published_date: '2024-02-10T16:45:00Z',
    scraped_at: '2024-02-10T16:45:00Z',
    image_url: null,
    favicon_url: null,
    is_public: null,
  },
];

const TagFilterTest: React.FC = () => {
  const [viewMode, setViewMode] = useState<'cloud' | 'filter' | 'results'>('filter');
  const [selectedArticles, setSelectedArticles] = useState<Post[]>(sampleArticles);

  // Use the article filters hook
  const {
    filters,
    presets,
    activeFilterCount,
    hasActiveFilters,
    canUndo,
    canRedo,
    filtersChanged,
    updateFilters,
    clearAllFilters,
    undo,
    redo,
    saveCurrentAsPreset,
    deletePresetById,
    loadPresetById,
    applyFiltersToArticles,
    getFilterSummary,
    exportFilters,
    importFilters,
    openFilterModal,
    closeFilterModal,
  } = useArticleFilters('test-user');

  // Apply filters whenever filters change
  useEffect(() => {
    const filtered = applyFiltersToArticles(sampleArticles);
    setSelectedArticles(filtered);
  }, [filters, applyFiltersToArticles]);

  // Handle preset actions
  const handleSavePreset = () => {
    const presetName = prompt('Enter preset name:');
    if (presetName?.trim()) {
      saveCurrentAsPreset(presetName.trim());
    }
  };

  const handleLoadPreset = (presetId: string) => {
    loadPresetById(presetId);
  };

  const handleDeletePreset = (presetId: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      deletePresetById(presetId);
    }
  };

  // Render article list
  const renderArticles = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <IonText>
          <h3>Articles ({selectedArticles.length})</h3>
        </IonText>
        {hasActiveFilters && (
          <IonBadge color="primary">
            {activeFilterCount} filters active
          </IonBadge>
        )}
      </div>

      {selectedArticles.length === 0 ? (
        <IonCard>
          <IonCardContent className="text-center py-8">
            <IonText color="medium">
              <p>No articles match the current filters</p>
              <IonButton 
                size="small" 
                fill="outline" 
                onClick={clearAllFilters}
                className="mt-2"
              >
                Clear Filters
              </IonButton>
            </IonText>
          </IonCardContent>
        </IonCard>
      ) : (
        <IonList>
          {selectedArticles.map(article => (
            <IonItem key={article.id}>
              <IonLabel>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <div className="flex items-center gap-2 mt-2">
                  <IonBadge color={
                    article.reading_status === 'completed' ? 'success' :
                    article.reading_status === 'reading' ? 'warning' :
                    'medium'
                  }>
                    {article.reading_status}
                  </IonBadge>
                  {article.is_favorite && (
                    <IonBadge color="danger">Favorite</IonBadge>
                  )}
                  <IonText color="medium" className="text-xs">
                    {article.estimated_read_time}min read
                  </IonText>
                </div>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );

  // Render tag cloud view
  const renderTagCloud = () => {
    const allTags = Array.from(
      new Set(sampleArticles.flatMap(article => Array.isArray(article.tags) ? article.tags : []))
    );

    return (
      <div className="space-y-4">
        <IonText>
          <h3>Interactive Tag Cloud</h3>
          <p>Click tags to filter articles</p>
        </IonText>
        
        <TagCloud
          selectedTagIds={filters.selectedTagIds}
          onTagsChange={(tagIds) => updateFilters({ selectedTagIds: tagIds })}
          mode="cloud"
          size="medium"
          interactive={true}
          showUsageCount={true}
          userId="test-user"
          className="p-4 border rounded-lg"
        />

        {filters.selectedTagIds.length > 0 && (
          <IonCard>
            <IonCardContent>
              <IonText>
                <h4>Tag Operator</h4>
                <p className="text-sm mb-3">How should the selected tags be combined?</p>
              </IonText>
              
              <IonSegment
                value={filters.tagOperator}
                onIonChange={(e) => updateFilters({ tagOperator: e.detail.value as any })}
              >
                <IonSegmentButton value="OR">
                  <IonLabel>Any (OR)</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="AND">
                  <IonLabel>All (AND)</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              <div className="mt-3">
                <IonText color="primary" className="text-sm">
                  Show articles with {filters.tagOperator === 'AND' ? 'ALL' : 'ANY'} of the selected tags
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}
      </div>
    );
  };

  // Render filter interface
  const renderFilterInterface = () => (
    <div className="space-y-4">
      <TagFilter
        filters={filters}
        onFiltersChange={updateFilters}
        presets={presets}
        onSavePreset={saveCurrentAsPreset}
        onDeletePreset={deletePresetById}
        onLoadPreset={(preset) => loadPresetById(preset.id)}
        userId="test-user"
        mode="inline"
        showPresets={true}
        showAdvanced={true}
      />
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tag Filter & Cloud Test</IonTitle>
          <IonButtons slot="end">
            {(canUndo || canRedo) && (
              <>
                <IonButton fill="clear" onClick={undo} disabled={!canUndo}>
                  <IonIcon icon={arrowUndoOutline} />
                </IonButton>
                <IonButton fill="clear" onClick={redo} disabled={!canRedo}>
                  <IonIcon icon={arrowRedoOutline} />
                </IonButton>
              </>
            )}
            {hasActiveFilters && (
              <IonButton fill="clear" color="medium" onClick={clearAllFilters}>
                Clear All
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* View Mode Selector */}
        <IonCard>
          <IonCardContent>
            <IonSegment
              value={viewMode}
              onIonChange={(e) => setViewMode(e.detail.value as any)}
            >
              <IonSegmentButton value="cloud">
                <IonIcon icon={cloudOutline} />
                <IonLabel>Tag Cloud</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="filter">
                <IonIcon icon={filterOutline} />
                <IonLabel>Advanced Filters</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="results">
                <IonIcon icon={listOutline} />
                <IonLabel>Results</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="flex items-center">
                <IonIcon icon={statsChartOutline} className="mr-2" />
                Active Filters ({activeFilterCount})
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>{getFilterSummary()}</IonText>
              <div className="flex gap-2 mt-3">
                <IonButton size="small" fill="outline" onClick={handleSavePreset}>
                  Save as Preset
                </IonButton>
                <IonButton 
                  size="small" 
                  fill="outline" 
                  color="medium"
                  onClick={() => {
                    const exported = exportFilters();
                    navigator.clipboard?.writeText(exported);
                    alert('Filters copied to clipboard!');
                  }}
                >
                  Export
                </IonButton>
                <IonButton 
                  size="small" 
                  fill="outline" 
                  color="medium"
                  onClick={() => {
                    const imported = prompt('Paste exported filters JSON:');
                    if (imported && importFilters(imported)) {
                      alert('Filters imported successfully!');
                    } else if (imported) {
                      alert('Invalid filters format');
                    }
                  }}
                >
                  Import
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Content Based on View Mode */}
        <div className="mt-4">
          {viewMode === 'cloud' && renderTagCloud()}
          {viewMode === 'filter' && renderFilterInterface()}
          {viewMode === 'results' && renderArticles()}
        </div>

        {/* Test Instructions */}
        <IonCard className="mt-6">
          <IonCardHeader>
            <IonCardTitle>Test Instructions</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="space-y-3">
            <div>
              <IonText className="font-semibold">Tag Cloud Testing:</IonText>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>Click tags in the cloud to select/deselect them</li>
                <li>Switch between AND/OR operators</li>
                <li>Watch the results update in real-time</li>
              </ul>
            </div>

            <div>
              <IonText className="font-semibold">Advanced Filter Testing:</IonText>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>Test different date ranges and presets</li>
                <li>Filter by reading status and favorites</li>
                <li>Adjust reading time ranges</li>
                <li>Try different sorting options</li>
              </ul>
            </div>

            <div>
              <IonText className="font-semibold">Preset Testing:</IonText>
              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                <li>Save current filters as presets</li>
                <li>Load and delete presets</li>
                <li>Export/import filter configurations</li>
                <li>Test undo/redo functionality</li>
              </ul>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default TagFilterTest;