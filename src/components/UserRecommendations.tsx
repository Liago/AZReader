import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonList,
  IonSpinner,
  IonButton,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToggle,
  IonItem,
  RefresherEventDetail,
  InfiniteScrollCustomEvent,
} from '@ionic/react';
import {
  refreshOutline,
  peopleOutline,
  settingsOutline,
  analyticsOutline,
  eyeOutline,
  sparklesOutline,
} from 'ionicons/icons';

import UserRecommendationCard from './UserRecommendationCard';
import useUserRecommendations, { UserRecommendation } from '@hooks/useUserRecommendations';
import { useCustomToast } from '@hooks/useIonToast';

export interface UserRecommendationsProps {
  title?: string;
  showHeader?: boolean;
  showSettings?: boolean;
  limit?: number;
  variant?: 'default' | 'compact' | 'detailed';
  enableInfiniteScroll?: boolean;
  className?: string;
  onUserFollow?: (userId: string) => void;
  onUserView?: (userId: string) => void;
}

interface RecommendationSettingsProps {
  includeDebugInfo: boolean;
  showReasons: boolean;
  onDebugToggle: (enabled: boolean) => void;
  onReasonsToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  cacheInfo: { lastUpdated: Date | null; entriesCount: number };
}

const RecommendationSettings: React.FC<RecommendationSettingsProps> = ({
  includeDebugInfo,
  showReasons,
  onDebugToggle,
  onReasonsToggle,
  onRefresh,
  cacheInfo
}) => (
  <div className="recommendation-settings p-4 bg-gray-50 rounded-lg mb-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-medium text-sm">Recommendation Settings</h4>
      <IonButton fill="clear" size="small" onClick={onRefresh}>
        <IonIcon icon={refreshOutline} slot="start" />
        Refresh
      </IonButton>
    </div>

    <div className="space-y-3">
      <IonItem lines="none" className="--padding-start: 0">
        <IonLabel>
          <h3>Show Recommendation Reasons</h3>
          <p>Display why each user is recommended</p>
        </IonLabel>
        <IonToggle
          checked={showReasons}
          onIonChange={(e) => onReasonsToggle(e.detail.checked)}
          slot="end"
        />
      </IonItem>

      <IonItem lines="none" className="--padding-start: 0">
        <IonLabel>
          <h3>Debug Information</h3>
          <p>Show detailed scoring information</p>
        </IonLabel>
        <IonToggle
          checked={includeDebugInfo}
          onIonChange={(e) => onDebugToggle(e.detail.checked)}
          slot="end"
        />
      </IonItem>

      {cacheInfo.lastUpdated && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div>Last updated: {cacheInfo.lastUpdated.toLocaleTimeString()}</div>
          <div>Cache entries: {cacheInfo.entriesCount}</div>
        </div>
      )}
    </div>
  </div>
);

const UserRecommendations: React.FC<UserRecommendationsProps> = ({
  title = 'People You May Know',
  showHeader = true,
  showSettings = false,
  limit = 10,
  variant = 'default',
  enableInfiniteScroll = false,
  className = '',
  onUserFollow,
  onUserView
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showReasons, setShowReasons] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'high-score'>('all');

  const showToast = useCustomToast();

  const {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    dismissRecommendation,
    markAsInteracted,
    clearCache,
    getCacheInfo
  } = useUserRecommendations({
    limit: enableInfiniteScroll ? limit * 3 : limit, // Load more for infinite scroll
    includeDebugInfo: showDebugInfo,
    minScore: viewMode === 'high-score' ? 0.3 : 0.1,
    enableCache: true,
    cacheTimeMs: 15 * 60 * 1000 // 15 minutes
  });

  const cacheInfo = getCacheInfo();

  // Filter recommendations based on view mode
  const filteredRecommendations = React.useMemo(() => {
    if (viewMode === 'all') return recommendations;
    return recommendations.filter(rec => rec.recommendationScore >= 0.5);
  }, [recommendations, viewMode]);

  const handleRefresh = useCallback(async (event?: CustomEvent<RefresherEventDetail>) => {
    try {
      await refreshRecommendations();
      showToast({ message: 'Recommendations updated!', color: 'success' });
    } catch (error) {
      showToast({ message: 'Failed to refresh recommendations', color: 'danger' });
    } finally {
      if (event) {
        event.detail.complete();
      }
    }
  }, [refreshRecommendations, showToast]);

  const handleUserFollow = useCallback((userId: string) => {
    markAsInteracted(userId, 'followed');
    onUserFollow?.(userId);
    showToast({ message: 'User followed successfully!', color: 'success' });
  }, [markAsInteracted, onUserFollow, showToast]);

  const handleUserDismiss = useCallback((userId: string) => {
    dismissRecommendation(userId);
    showToast({ message: 'Recommendation dismissed', color: 'medium' });
  }, [dismissRecommendation, showToast]);

  const handleUserView = useCallback((userId: string) => {
    markAsInteracted(userId, 'viewed');
    onUserView?.(userId);
  }, [markAsInteracted, onUserView]);

  const handleInfiniteScroll = useCallback(async (event: InfiniteScrollCustomEvent) => {
    // In a real implementation, you'd load more recommendations here
    // For now, just complete the scroll
    event.target.complete();
  }, []);

  // Render loading state
  if (isLoading && recommendations.length === 0) {
    return (
      <div className={`user-recommendations loading ${className}`}>
        {showHeader && (
          <div className="recommendation-header mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-12">
          <IonSpinner name="bubbles" className="mb-4" />
          <IonText color="medium">
            <p>Finding people you might know...</p>
          </IonText>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`user-recommendations error ${className}`}>
        {showHeader && (
          <div className="recommendation-header mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <IonIcon icon={peopleOutline} className="text-4xl text-gray-400 mb-4" />
          <IonText color="danger" className="text-center mb-4">
            <h3>Failed to Load Recommendations</h3>
            <p>{error}</p>
          </IonText>
          <IonButton onClick={() => handleRefresh()} fill="outline" color="primary">
            <IonIcon icon={refreshOutline} slot="start" />
            Try Again
          </IonButton>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!isLoading && filteredRecommendations.length === 0) {
    return (
      <div className={`user-recommendations empty ${className}`}>
        {showHeader && (
          <div className="recommendation-header mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              {showSettings && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setSettingsVisible(!settingsVisible)}
                >
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              )}
            </div>
          </div>
        )}

        {settingsVisible && (
          <RecommendationSettings
            includeDebugInfo={showDebugInfo}
            showReasons={showReasons}
            onDebugToggle={setShowDebugInfo}
            onReasonsToggle={setShowReasons}
            onRefresh={() => handleRefresh()}
            cacheInfo={cacheInfo}
          />
        )}

        <div className="flex flex-col items-center justify-center py-12 px-4">
          <IonIcon icon={peopleOutline} className="text-4xl text-gray-400 mb-4" />
          <IonText color="medium" className="text-center">
            <h3>No Recommendations Available</h3>
            <p>
              {viewMode === 'high-score' 
                ? 'No high-quality recommendations found. Try showing all recommendations.'
                : 'We couldn\'t find any users to recommend right now. Try following more people or adding more content.'
              }
            </p>
          </IonText>
          <div className="flex gap-2 mt-4">
            <IonButton onClick={() => handleRefresh()} fill="outline" size="small">
              <IonIcon icon={refreshOutline} slot="start" />
              Refresh
            </IonButton>
            {viewMode === 'high-score' && (
              <IonButton 
                onClick={() => setViewMode('all')} 
                fill="outline" 
                size="small"
              >
                Show All
              </IonButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`user-recommendations ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="recommendation-header mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{title}</h2>
              <IonIcon icon={sparklesOutline} className="text-primary text-lg" />
              <IonText color="medium" className="text-sm">
                ({filteredRecommendations.length})
              </IonText>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <IonSegment 
                value={viewMode} 
                onIonChange={(e) => setViewMode(e.detail.value as 'all' | 'high-score')}
                className="max-w-xs"
              >
                <IonSegmentButton value="all">
                  <IonLabel>All</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="high-score">
                  <IonLabel>Top Picks</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              {showSettings && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => setSettingsVisible(!settingsVisible)}
                  className={settingsVisible ? 'ion-color-primary' : ''}
                >
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {settingsVisible && (
        <RecommendationSettings
          includeDebugInfo={showDebugInfo}
          showReasons={showReasons}
          onDebugToggle={setShowDebugInfo}
          onReasonsToggle={setShowReasons}
          onRefresh={() => handleRefresh()}
          cacheInfo={cacheInfo}
        />
      )}

      {/* Recommendations list */}
      <div className="recommendations-container">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh recommendations..."
            refreshingSpinner="bubbles"
            refreshingText="Finding new people..."
          />
        </IonRefresher>

        <IonList className="recommendations-list">
          {filteredRecommendations.map((recommendation) => (
            <UserRecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onFollow={handleUserFollow}
              onDismiss={handleUserDismiss}
              onViewProfile={handleUserView}
              showReasons={showReasons}
              showDebugInfo={showDebugInfo}
              variant={variant}
            />
          ))}
        </IonList>

        {/* Infinite scroll */}
        {enableInfiniteScroll && (
          <IonInfiniteScroll onIonInfinite={handleInfiniteScroll} threshold="100px">
            <IonInfiniteScrollContent
              loadingSpinner="bubbles"
              loadingText="Loading more recommendations..."
            />
          </IonInfiniteScroll>
        )}

        {/* Loading more indicator */}
        {isLoading && recommendations.length > 0 && (
          <div className="flex justify-center py-4">
            <IonSpinner name="dots" />
          </div>
        )}
      </div>

      <style>{`
        .user-recommendations {
          padding: 16px;
        }

        .recommendation-header h2 {
          margin: 0;
          color: var(--ion-color-dark);
        }

        .recommendations-container {
          position: relative;
        }

        .recommendations-list {
          background: transparent;
        }

        .recommendation-settings {
          border: 1px solid var(--ion-color-light);
        }

        /* Loading states */
        .user-recommendations.loading,
        .user-recommendations.error,
        .user-recommendations.empty {
          min-height: 200px;
          display: flex;
          flex-direction: column;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .recommendation-settings {
            background-color: var(--ion-color-dark-shade, #1e2023);
            border-color: var(--ion-color-dark-tint, #383a3e);
          }
        }

        .ios.dark .recommendation-settings,
        .md.dark .recommendation-settings {
          background-color: var(--ion-color-dark-shade, #1e2023);
          border-color: var(--ion-color-dark-tint, #383a3e);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .user-recommendations {
            padding: 8px;
          }

          .recommendation-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .recommendation-header .flex {
            width: 100%;
            justify-content: space-between;
          }
        }

        /* Animation for new recommendations */
        .recommendations-list > * {
          animation: slideInUp 0.3s ease-out;
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default UserRecommendations;