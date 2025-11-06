import React, { useState, useEffect, useCallback } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonAlert,
} from '@ionic/react';
import {
  speedometerOutline,
  refreshOutline,
  warningOutline,
  checkmarkCircleOutline,
  timeOutline,
  statsChartOutline,
  cloudOutline,
  layersOutline,
  flashOutline,
  bugOutline,
} from 'ionicons/icons';
import { tagPerformanceService } from '@services/tagPerformanceService';

interface PerformanceMetrics {
  slowQueries: Array<{
    query_type: string;
    avg_execution_time: number;
    query_count: number;
    max_execution_time: number;
  }>;
  cacheStats: {
    tagListSize: number;
    tagStatsSize: number;
    tagSearchSize: number;
    totalSize: number;
    hitRatio: number;
  };
  totalQueries: number;
}

export interface TagPerformanceMonitorProps {
  userId?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  showCacheDetails?: boolean;
  showOptimizationSuggestions?: boolean;
}

const TagPerformanceMonitor: React.FC<TagPerformanceMonitorProps> = ({
  userId,
  className = '',
  autoRefresh = false,
  refreshInterval = 30,
  showCacheDetails = true,
  showOptimizationSuggestions = true,
}) => {
  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('day');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showOptimizeAlert, setShowOptimizeAlert] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      loadMetrics();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId, timeRange]);

  // Load performance metrics
  const loadMetrics = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const metricsData = await tagPerformanceService.getPerformanceMetrics(userId, timeRange);
      setMetrics(metricsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [userId, timeRange]);

  // Handle manual refresh (button click)
  const handleRefresh = useCallback(async () => {
    await loadMetrics();
  }, [loadMetrics]);

  // Handle refresh from ion-refresher
  const handleIonRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    await loadMetrics();
    event.detail.complete();
  }, [loadMetrics]);

  // Handle cache optimization
  const handleOptimizeCache = useCallback(async () => {
    if (!userId) return;

    setOptimizing(true);
    try {
      await tagPerformanceService.optimizeUserTagData(userId);
      
      // Clear and reload metrics after optimization
      tagPerformanceService.clearAllCaches();
      await loadMetrics();
      
      setShowOptimizeAlert(false);
    } catch (err) {
      console.error('Error optimizing cache:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize cache');
    } finally {
      setOptimizing(false);
    }
  }, [userId, loadMetrics]);

  // Load metrics on mount and when dependencies change
  useEffect(() => {
    if (userId) {
      loadMetrics();
    }
  }, [userId, timeRange, loadMetrics]);

  // Get performance status color
  const getPerformanceColor = (avgTime: number): string => {
    if (avgTime < 100) return 'success';
    if (avgTime < 500) return 'warning';
    return 'danger';
  };

  // Get optimization suggestions
  const getOptimizationSuggestions = (): string[] => {
    if (!metrics) return [];

    const suggestions: string[] = [];
    
    // Check for slow queries
    const slowQueries = metrics.slowQueries.filter(q => q.avg_execution_time > 500);
    if (slowQueries.length > 0) {
      suggestions.push(`${slowQueries.length} query types are running slowly (>500ms average)`);
    }

    // Check cache efficiency
    if (metrics.cacheStats.totalSize === 0) {
      suggestions.push('Cache is empty - consider enabling caching for better performance');
    } else if (metrics.cacheStats.hitRatio < 0.5) {
      suggestions.push('Low cache hit ratio - consider increasing cache TTL or size');
    }

    // Check query volume
    if (metrics.totalQueries > 1000) {
      suggestions.push('High query volume detected - consider implementing query batching');
    }

    // Check for specific problematic query types
    const searchQueries = metrics.slowQueries.find(q => q.query_type === 'searchTags');
    if (searchQueries && searchQueries.avg_execution_time > 200) {
      suggestions.push('Tag search is slow - consider using cached autocomplete');
    }

    const filterQueries = metrics.slowQueries.find(q => q.query_type === 'filterArticlesByTags');
    if (filterQueries && filterQueries.avg_execution_time > 300) {
      suggestions.push('Article filtering is slow - check database indices');
    }

    return suggestions;
  };

  // Render loading state
  if (loading && !metrics) {
    return (
      <IonCard className={className}>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={speedometerOutline} className="mr-2" />
            Performance Monitor
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="flex items-center justify-center p-8">
            <IonSpinner name="dots" className="mr-2" />
            <IonText>Loading performance metrics...</IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  // Render error state
  if (error && !metrics) {
    return (
      <IonCard className={className}>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={speedometerOutline} className="mr-2" />
            Performance Monitor
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="text-center p-4">
            <IonIcon icon={warningOutline} className="text-4xl text-red-500 mb-2" />
            <IonText color="danger">
              <h3>Error Loading Metrics</h3>
              <p className="text-sm">{error}</p>
            </IonText>
            <IonButton fill="outline" onClick={() => loadMetrics()} className="mt-3">
              <IonIcon icon={refreshOutline} slot="start" />
              Try Again
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (!metrics) return null;

  const suggestions = getOptimizationSuggestions();
  const hasPerformanceIssues = suggestions.length > 0;

  return (
    <div className={`tag-performance-monitor ${className}`}>
      <IonRefresher slot="fixed" onIonRefresh={handleIonRefresh}>
        <IonRefresherContent 
          pullingText="Pull to refresh metrics..."
          refreshingSpinner="bubbles"
          refreshingText="Refreshing..."
        />
      </IonRefresher>

      {/* Header Card */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <IonIcon icon={speedometerOutline} className="mr-2" />
              Tag Performance Monitor
              {hasPerformanceIssues && (
                <IonIcon icon={warningOutline} color="warning" className="ml-2" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <IonButton 
                fill="clear" 
                size="small" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <IonIcon 
                  icon={refreshOutline} 
                  className={loading ? 'animate-spin' : ''} 
                />
              </IonButton>
            </div>
          </IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          {/* Time Range Selector */}
          <div className="mb-4">
            <IonSegment
              value={timeRange}
              onIonChange={(e) => setTimeRange(e.detail.value as any)}
            >
              <IonSegmentButton value="hour">
                <IonLabel>Last Hour</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="day">
                <IonLabel>Last Day</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="week">
                <IonLabel>Last Week</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-center mb-4">
              <IonText color="medium" className="text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && (
                  <span className="ml-2">
                    (auto-refresh every {refreshInterval}s)
                  </span>
                )}
              </IonText>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Performance Overview */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={flashOutline} className="mr-2" />
            Performance Overview
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="6" sizeMd="3">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.totalQueries}
                  </div>
                  <div className="text-sm text-gray-600">Total Queries</div>
                </div>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.slowQueries.length}
                  </div>
                  <div className="text-sm text-gray-600">Query Types</div>
                </div>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <div className="text-center p-3 border rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {metrics.cacheStats.totalSize}
                  </div>
                  <div className="text-sm text-gray-600">Cache Entries</div>
                </div>
              </IonCol>
              
              <IonCol size="6" sizeMd="3">
                <div className="text-center p-3 border rounded">
                  <div className={`text-2xl font-bold ${
                    hasPerformanceIssues ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {hasPerformanceIssues ? 'ISSUES' : 'GOOD'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* Slow Queries */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="flex items-center">
            <IonIcon icon={timeOutline} className="mr-2" />
            Query Performance
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {metrics.slowQueries.length === 0 ? (
            <div className="text-center p-4">
              <IonIcon icon={checkmarkCircleOutline} className="text-4xl text-green-500 mb-2" />
              <IonText color="success">
                <p>No slow queries detected!</p>
              </IonText>
            </div>
          ) : (
            <IonList>
              {metrics.slowQueries.slice(0, 10).map((query, index) => (
                <IonItem key={index}>
                  <IonLabel>
                    <h3>{query.query_type.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p>
                      Avg: {query.avg_execution_time}ms • 
                      Max: {query.max_execution_time}ms • 
                      Count: {query.query_count}
                    </p>
                    <IonProgressBar
                      value={Math.min(query.avg_execution_time / 1000, 1)}
                      color={getPerformanceColor(query.avg_execution_time)}
                      className="mt-2"
                    />
                  </IonLabel>
                  <IonBadge 
                    color={getPerformanceColor(query.avg_execution_time)}
                    slot="end"
                  >
                    {query.avg_execution_time}ms
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>

      {/* Cache Statistics */}
      {showCacheDetails && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="flex items-center">
              <IonIcon icon={cloudOutline} className="mr-2" />
              Cache Statistics
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Tag Lists</h3>
                      <p>{metrics.cacheStats.tagListSize} entries</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Tag Stats</h3>
                      <p>{metrics.cacheStats.tagStatsSize} entries</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Search Results</h3>
                      <p>{metrics.cacheStats.tagSearchSize} entries</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                
                <IonCol size="6">
                  <IonItem>
                    <IonLabel>
                      <h3>Hit Ratio</h3>
                      <p>{(metrics.cacheStats.hitRatio * 100).toFixed(1)}%</p>
                    </IonLabel>
                    <IonProgressBar
                      value={metrics.cacheStats.hitRatio}
                      color={metrics.cacheStats.hitRatio > 0.7 ? 'success' : 'warning'}
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div className="mt-4">
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => {
                  tagPerformanceService.clearAllCaches();
                  loadMetrics();
                }}
                disabled={loading}
              >
                <IonIcon icon={refreshOutline} slot="start" />
                Clear All Caches
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Optimization Suggestions */}
      {showOptimizationSuggestions && suggestions.length > 0 && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="flex items-center">
              <IonIcon icon={bugOutline} className="mr-2" />
              Optimization Suggestions
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {suggestions.map((suggestion, index) => (
                <IonItem key={index}>
                  <IonIcon icon={warningOutline} color="warning" slot="start" />
                  <IonLabel>
                    <p>{suggestion}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
            
            <div className="mt-4">
              <IonButton
                expand="block"
                color="warning"
                onClick={() => setShowOptimizeAlert(true)}
                disabled={optimizing}
              >
                <IonIcon icon={statsChartOutline} slot="start" />
                {optimizing ? 'Optimizing...' : 'Optimize Performance'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Optimization Confirmation Alert */}
      <IonAlert
        isOpen={showOptimizeAlert}
        onDidDismiss={() => setShowOptimizeAlert(false)}
        header="Optimize Performance"
        message="This will refresh tag statistics, update counts, and clear caches. Continue?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Optimize',
            handler: handleOptimizeCache,
          },
        ]}
      />

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle className="text-sm">Debug Info</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </IonCardContent>
        </IonCard>
      )}
    </div>
  );
};

export default TagPerformanceMonitor;