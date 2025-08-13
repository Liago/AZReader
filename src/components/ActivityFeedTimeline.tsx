import React, { useState, useCallback, useEffect } from 'react';
import {
  IonContent,
  IonList,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonIcon,
  IonItem,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonPopover,
  RefresherEventDetail,
  InfiniteScrollCustomEvent,
} from '@ionic/react';
import {
  refresh,
  filterOutline,
  timeOutline,
  peopleOutline,
  globeOutline,
  checkmark,
  settings,
} from 'ionicons/icons';
import ActivityFeedItem from './ActivityFeedItem';
import { useActivityFeed, ActivityActionType, ActivityTargetType } from '@hooks/useActivityFeed';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';

export interface ActivityFeedTimelineProps {
  feedType?: 'global' | 'following' | 'user';
  userId?: string;
  targetType?: ActivityTargetType;
  targetId?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showHeader?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
  enableRealtime?: boolean;
  onUserClick?: (userId: string) => void;
  onTargetClick?: (targetType: string, targetId: string) => void;
  onActionClick?: (action: string, targetId: string) => void;
  className?: string;
}

interface ActivityFilters {
  actionTypes: ActivityActionType[];
  timeWindow: 'all' | 'today' | 'week' | 'month';
  aggregated: boolean;
}

interface ActivityPreferences {
  showActivityTypes: Record<ActivityActionType, boolean>;
  groupSimilarActivities: boolean;
  realTimeUpdates: boolean;
}

const DEFAULT_ACTIVITY_TYPES: ActivityActionType[] = [
  'article_created',
  'article_liked', 
  'comment_created',
  'user_followed',
];

const ALL_ACTIVITY_TYPES: ActivityActionType[] = [
  'article_created',
  'article_liked',
  'article_unliked',
  'article_shared',
  'comment_created',
  'comment_liked',
  'comment_unliked',
  'user_followed',
  'user_unfollowed',
  'profile_updated',
];

const ActivityFeedTimeline: React.FC<ActivityFeedTimelineProps> = ({
  feedType = 'following',
  userId,
  targetType,
  targetId,
  variant = 'default',
  showHeader = true,
  showFilters = true,
  showActions = true,
  enableRealtime = true,
  onUserClick,
  onTargetClick,
  onActionClick,
  className = '',
}) => {
  const [filters, setFilters] = useState<ActivityFilters>({
    actionTypes: DEFAULT_ACTIVITY_TYPES,
    timeWindow: 'week',
    aggregated: true,
  });

  const [preferences, setPreferences] = useState<ActivityPreferences>({
    showActivityTypes: Object.fromEntries(
      ALL_ACTIVITY_TYPES.map(type => [type, DEFAULT_ACTIVITY_TYPES.includes(type)])
    ) as Record<ActivityActionType, boolean>,
    groupSimilarActivities: true,
    realTimeUpdates: enableRealtime,
  });

  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showPreferencesPopover, setShowPreferencesPopover] = useState(false);

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;

  // Use activity feed hook
  const {
    activities,
    aggregates,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadActivities,
    loadMore,
    refresh: refreshFeed,
  } = useActivityFeed({
    userId: userId || currentUserId,
    feedType,
    targetType,
    targetId,
    aggregated: filters.aggregated,
    limit: 20,
    realTime: preferences.realTimeUpdates,
  });

  // Get filtered activities based on current filters
  const filteredItems = React.useMemo(() => {
    const items = filters.aggregated ? aggregates : activities;
    
    let filtered = (items as any[]).filter((item: any) => {
      // Filter by action types
      if (filters.actionTypes.length > 0) {
        if (!filters.actionTypes.includes(item.action_type as ActivityActionType)) {
          return false;
        }
      }

      // Filter by time window
      const itemDate = new Date(
        filters.aggregated ? 
          (item as any).last_activity_at : 
          (item as any).created_at
      );
      const now = new Date();

      switch (filters.timeWindow) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return itemDate >= today;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });

    return filtered;
  }, [activities, aggregates, filters]);

  // Handle refresh
  const handleRefresh = useCallback(async (event?: CustomEvent<RefresherEventDetail>) => {
    await refreshFeed();
    event?.detail.complete();
  }, [refreshFeed]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (event: InfiniteScrollCustomEvent) => {
    await loadMore();
    event.target.complete();
  }, [loadMore]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle preference changes
  const handlePreferenceChange = useCallback((newPrefs: Partial<ActivityPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  // Update filters when preferences change
  useEffect(() => {
    const enabledTypes = Object.entries(preferences.showActivityTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type as ActivityActionType);
    
    handleFilterChange({ 
      actionTypes: enabledTypes,
      aggregated: preferences.groupSimilarActivities,
    });
  }, [preferences, handleFilterChange]);

  // Get feed type icon
  const getFeedTypeIcon = () => {
    switch (feedType) {
      case 'global': return globeOutline;
      case 'following': return peopleOutline;
      case 'user': return peopleOutline;
      default: return timeOutline;
    }
  };

  // Get feed title
  const getFeedTitle = () => {
    switch (feedType) {
      case 'global': return 'Global Activity';
      case 'following': return 'Following Activity';
      case 'user': return userId === currentUserId ? 'Your Activity' : 'User Activity';
      default: return 'Activity Feed';
    }
  };

  // Render loading state
  if (isLoading && filteredItems.length === 0) {
    return (
      <div className={`activity-feed-timeline loading ${className}`}>
        {showHeader && (
          <div className="timeline-header">
            <h2>{getFeedTitle()}</h2>
          </div>
        )}
        <div className="loading-container">
          <IonSpinner name="bubbles" />
          <IonText color="medium">
            <p>Loading activity feed...</p>
          </IonText>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`activity-feed-timeline error ${className}`}>
        {showHeader && (
          <div className="timeline-header">
            <h2>{getFeedTitle()}</h2>
          </div>
        )}
        <div className="error-container">
          <IonText color="danger">
            <h3>Failed to Load Activity Feed</h3>
            <p>{error}</p>
          </IonText>
          <IonButton onClick={() => handleRefresh()} fill="outline">
            <IonIcon icon={refresh} slot="start" />
            Try Again
          </IonButton>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!isLoading && filteredItems.length === 0) {
    return (
      <div className={`activity-feed-timeline empty ${className}`}>
        {showHeader && (
          <div className="timeline-header">
            <div className="header-title">
              <IonIcon icon={getFeedTypeIcon()} />
              <h2>{getFeedTitle()}</h2>
            </div>
          </div>
        )}
        <div className="empty-container">
          <IonIcon icon={timeOutline} className="empty-icon" />
          <IonText color="medium" className="empty-text">
            <h3>No Activity Yet</h3>
            <p>
              {feedType === 'following' 
                ? "Follow some users to see their activity here."
                : "No recent activity to show."
              }
            </p>
          </IonText>
          {feedType === 'following' && (
            <IonButton onClick={() => handleRefresh()} fill="outline">
              <IonIcon icon={refresh} slot="start" />
              Refresh
            </IonButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`activity-feed-timeline ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="timeline-header">
          <div className="header-title">
            <IonIcon icon={getFeedTypeIcon()} />
            <h2>{getFeedTitle()}</h2>
            <IonText color="medium" className="activity-count">
              ({filteredItems.length})
            </IonText>
          </div>
          
          <div className="header-actions">
            {showFilters && (
              <>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowFilterPopover(true)}
                  id="filter-trigger"
                >
                  <IonIcon icon={filterOutline} />
                </IonButton>
                
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setShowPreferencesPopover(true)}
                  id="preferences-trigger"
                >
                  <IonIcon icon={settings} />
                </IonButton>
              </>
            )}
            
            <IonButton
              fill="clear"
              size="small"
              onClick={() => handleRefresh()}
              disabled={isLoading}
            >
              <IonIcon icon={refresh} className={isLoading ? 'spinning' : ''} />
            </IonButton>
          </div>
        </div>
      )}

      {/* Filter segment */}
      <div className="timeline-filters">
        <IonSegment 
          value={filters.timeWindow}
          onIonChange={(e) => handleFilterChange({ timeWindow: e.detail.value as any })}
        >
          <IonSegmentButton value="today">
            <IonLabel>Today</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="week">
            <IonLabel>Week</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="month">
            <IonLabel>Month</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {/* Activity list */}
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh activities..."
            refreshingSpinner="bubbles"
            refreshingText="Refreshing feed..."
          />
        </IonRefresher>

        <IonList className="activity-list">
          {filteredItems.map((item) => (
            <ActivityFeedItem
              key={item.id}
              activity={filters.aggregated ? undefined : item as any}
              aggregate={filters.aggregated ? item as any : undefined}
              variant={variant}
              showActions={showActions}
              onUserClick={onUserClick}
              onTargetClick={onTargetClick}
              onActionClick={onActionClick}
            />
          ))}
        </IonList>

        {/* Infinite scroll */}
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more activities..."
          />
        </IonInfiniteScroll>

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="loading-more">
            <IonSpinner name="dots" />
          </div>
        )}
      </IonContent>

      {/* Filter popover */}
      <IonPopover
        isOpen={showFilterPopover}
        onDidDismiss={() => setShowFilterPopover(false)}
        trigger="filter-trigger"
        showBackdrop={true}
      >
        <div className="filter-popover-content">
          <h4>Activity Filters</h4>
          
          <div className="filter-section">
            <IonLabel>Activity Types</IonLabel>
            {ALL_ACTIVITY_TYPES.map(type => (
              <IonItem key={type}>
                <IonCheckbox
                  checked={preferences.showActivityTypes[type]}
                  onIonChange={(e) => 
                    handlePreferenceChange({
                      showActivityTypes: {
                        ...preferences.showActivityTypes,
                        [type]: e.detail.checked
                      }
                    })
                  }
                />
                <IonLabel className="ion-margin-start">
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </IonLabel>
              </IonItem>
            ))}
          </div>

          <div className="filter-actions">
            <IonButton 
              size="small"
              fill="outline"
              onClick={() => setShowFilterPopover(false)}
            >
              Done
            </IonButton>
          </div>
        </div>
      </IonPopover>

      {/* Preferences popover */}
      <IonPopover
        isOpen={showPreferencesPopover}
        onDidDismiss={() => setShowPreferencesPopover(false)}
        trigger="preferences-trigger"
        showBackdrop={true}
      >
        <div className="preferences-popover-content">
          <h4>Activity Preferences</h4>
          
          <IonItem>
            <IonCheckbox
              checked={preferences.groupSimilarActivities}
              onIonChange={(e) => 
                handlePreferenceChange({ groupSimilarActivities: e.detail.checked })
              }
            />
            <IonLabel className="ion-margin-start">
              <h3>Group Similar Activities</h3>
              <p>Combine similar actions into a single item</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonCheckbox
              checked={preferences.realTimeUpdates}
              onIonChange={(e) => 
                handlePreferenceChange({ realTimeUpdates: e.detail.checked })
              }
            />
            <IonLabel className="ion-margin-start">
              <h3>Real-time Updates</h3>
              <p>Automatically show new activities</p>
            </IonLabel>
          </IonItem>

          <div className="preferences-actions">
            <IonButton 
              size="small"
              fill="outline"
              onClick={() => setShowPreferencesPopover(false)}
            >
              Done
            </IonButton>
          </div>
        </div>
      </IonPopover>

      <style>{`
        .activity-feed-timeline {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
          border-bottom: 1px solid var(--ion-color-light);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-title h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .activity-count {
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .timeline-filters {
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid var(--ion-color-light);
        }

        .activity-list {
          background: transparent;
        }

        .loading-container,
        .error-container,
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          min-height: 300px;
        }

        .empty-icon {
          font-size: 48px;
          color: var(--ion-color-medium);
          margin-bottom: 16px;
        }

        .empty-text h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .empty-text p {
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .loading-more {
          display: flex;
          justify-content: center;
          padding: 16px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .filter-popover-content,
        .preferences-popover-content {
          padding: 16px;
          min-width: 280px;
        }

        .filter-popover-content h4,
        .preferences-popover-content h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .filter-section {
          margin-bottom: 16px;
        }

        .filter-section > ion-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--ion-color-dark);
        }

        .filter-actions,
        .preferences-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--ion-color-light);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .timeline-header,
          .timeline-filters {
            background: var(--ion-color-dark);
            border-color: var(--ion-color-dark-shade);
          }
        }

        .ios.dark .timeline-header,
        .ios.dark .timeline-filters,
        .md.dark .timeline-header,
        .md.dark .timeline-filters {
          background: var(--ion-color-dark);
          border-color: var(--ion-color-dark-shade);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .timeline-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .header-title,
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .filter-popover-content,
          .preferences-popover-content {
            min-width: 260px;
          }
        }
      `}</style>
    </div>
  );
};

export default ActivityFeedTimeline;