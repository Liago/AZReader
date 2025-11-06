import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon,
} from '@ionic/react';
import {
  layersOutline,
  createOutline,
  filterOutline,
  cloudOutline,
  statsChartOutline,
  speedometerOutline,
} from 'ionicons/icons';

// Import all tag components
import TagManager from './TagManager';
import TagInput from './TagInput';
import TagFilter from './TagFilter';
import TagCloud from './TagCloud';
import TagDashboard from './TagDashboard';
import TagPerformanceMonitor from './TagPerformanceMonitor';
import TagCloudLazy from './TagCloudLazy';
import TagBatchOperations from './TagBatchOperations';

// Import hooks
import { useTagManager } from '@hooks/useTagManager';
import { useArticleFilters } from '@hooks/useArticleFilters';

/**
 * Integration demo component showcasing the complete tag system
 * This demonstrates how all tag components work together
 */
const TagSystemIntegrationDemo: React.FC = () => {
  // Demo state
  const [activeSection, setActiveSection] = useState<string>('manager');
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Use tag hooks
  const tagManager = useTagManager();
  const articleFilters = useArticleFilters('demo-user');

  // Mock user ID for demo
  const userId = 'demo-user';

  // Demo handlers
  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTagIds(tagIds);
    articleFilters.updateTags(tagIds);
  };

  const handleFiltersChange = (filters: any) => {
    articleFilters.updateFilters(filters);
  };

  // Render section based on selection
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'manager':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Tag Manager</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p className="mb-4">
                  The TagManager component allows users to create, edit, and organize their tags.
                </p>
              </IonText>
              <TagManager 
                isOpen={true}
                onClose={() => {}}
                userId={userId}
                mode="manage"
                onTagsSelected={(tags) => console.log('Tags selected:', tags)}
              />
            </IonCardContent>
          </IonCard>
        );

      case 'input':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Tag Input with Autocomplete</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p className="mb-4">
                  The TagInput component provides intelligent autocomplete for tag selection.
                </p>
              </IonText>
              <TagInput
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                userId={userId}
                placeholder="Start typing to search tags..."
                mode="input"
              />
              {selectedTags.length > 0 && (
                <div className="mt-4">
                  <IonText>
                    <h6>Selected Tags:</h6>
                  </IonText>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map(tag => (
                      <IonButton key={tag.id} size="small" fill="outline">
                        {tag.name}
                      </IonButton>
                    ))}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        );

      case 'filter':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Advanced Tag Filtering</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p className="mb-4">
                  The TagFilter component provides comprehensive filtering options.
                </p>
              </IonText>
              <TagFilter
                filters={articleFilters.filters}
                onFiltersChange={handleFiltersChange}
                userId={userId}
                mode="inline"
                showPresets={true}
                showAdvanced={true}
              />
              
              <div className="mt-4">
                <IonText>
                  <h6>Current Filter Summary:</h6>
                  <p className="text-sm">{articleFilters.getFilterSummary()}</p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        );

      case 'cloud':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Interactive Tag Cloud</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p className="mb-4">
                  The TagCloud shows tags with sizes based on usage frequency.
                </p>
              </IonText>
              <TagCloudLazy
                userId={userId}
                selectedTagIds={selectedTagIds}
                onTagsChange={handleTagsChange}
                mode="cloud"
                size="medium"
                interactive={true}
                showUsageCount={true}
                pageSize={20}
                enableInfiniteScroll={true}
                enableRefresh={true}
              />
            </IonCardContent>
          </IonCard>
        );

      case 'dashboard':
        return (
          <TagDashboard userId={userId} />
        );

      case 'performance':
        return (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Performance Monitoring</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p className="mb-4">
                  Monitor tag system performance and optimize operations.
                </p>
              </IonText>
              <TagPerformanceMonitor
                userId={userId}
                autoRefresh={true}
                refreshInterval={30}
                showCacheDetails={true}
                showOptimizationSuggestions={true}
              />
            </IonCardContent>
          </IonCard>
        );

      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tag System Integration Demo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Introduction */}
        <IonCard>
          <IonCardContent>
            <IonText>
              <h2>Complete Tag Management System</h2>
              <p>
                This demo showcases all components of the comprehensive tag management system:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>TagManager</strong>: Create and manage tags</li>
                <li><strong>TagInput</strong>: Smart autocomplete input</li>
                <li><strong>TagFilter</strong>: Advanced filtering system</li>
                <li><strong>TagCloud</strong>: Visual tag representation</li>
                <li><strong>TagDashboard</strong>: Statistics and analytics</li>
                <li><strong>Performance Monitor</strong>: System optimization</li>
              </ul>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Navigation */}
        <IonCard>
          <IonCardContent>
            <IonSegment
              value={activeSection}
              onIonChange={(e) => setActiveSection(e.detail.value as string)}
            >
              <IonSegmentButton value="manager">
                <IonIcon icon={layersOutline} />
                <IonLabel>Manager</IonLabel>
              </IonSegmentButton>
              
              <IonSegmentButton value="input">
                <IonIcon icon={createOutline} />
                <IonLabel>Input</IonLabel>
              </IonSegmentButton>
              
              <IonSegmentButton value="filter">
                <IonIcon icon={filterOutline} />
                <IonLabel>Filter</IonLabel>
              </IonSegmentButton>
              
              <IonSegmentButton value="cloud">
                <IonIcon icon={cloudOutline} />
                <IonLabel>Cloud</IonLabel>
              </IonSegmentButton>
              
              <IonSegmentButton value="dashboard">
                <IonIcon icon={statsChartOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonSegmentButton>
              
              <IonSegmentButton value="performance">
                <IonIcon icon={speedometerOutline} />
                <IonLabel>Monitor</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        {/* Active Section */}
        {renderActiveSection()}

        {/* System Status */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>System Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Active Filters:</span>
                <IonText color="primary">{articleFilters.activeFilterCount}</IonText>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Selected Tags:</span>
                <IonText color="primary">{selectedTagIds.length}</IonText>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Can Undo:</span>
                <IonText color={articleFilters.canUndo ? "success" : "medium"}>
                  {articleFilters.canUndo ? "Yes" : "No"}
                </IonText>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Can Redo:</span>
                <IonText color={articleFilters.canRedo ? "success" : "medium"}>
                  {articleFilters.canRedo ? "Yes" : "No"}
                </IonText>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Integration Notes */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Integration Features</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <h6>Performance Optimizations:</h6>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Intelligent caching with LRU eviction</li>
                <li>Virtual scrolling for large tag lists</li>
                <li>Lazy loading with infinite scroll</li>
                <li>Database query optimization</li>
                <li>Real-time performance monitoring</li>
              </ul>

              <h6 className="mt-4">User Experience Features:</h6>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Smart autocomplete with debouncing</li>
                <li>Drag-and-drop tag organization</li>
                <li>Batch operations for bulk management</li>
                <li>Filter presets and history</li>
                <li>Responsive design for all screen sizes</li>
              </ul>
            </IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default TagSystemIntegrationDemo;