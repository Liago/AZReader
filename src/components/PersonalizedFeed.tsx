import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonText,
  IonIcon,
  IonBadge,
  IonButton,
  IonButtons,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonActionSheet,
  IonPopover,
  RefresherEventDetail,
  InfiniteScrollCustomEvent,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  chatbubble,
  bookmark,
  bookmarkOutline,
  share,
  time,
  person,
  star,
  analytics,
  checkmark,
  ellipsisVertical,
  eye,
  eyeOff,
  settings,
  refresh as refreshIcon,
} from 'ionicons/icons';
import { usePersonalizedFeed, PersonalizedArticle, RankingWeights } from '@hooks/usePersonalizedFeed';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export interface PersonalizedFeedProps {
  onArticleClick?: (article: PersonalizedArticle) => void;
  onUserClick?: (userId: string) => void;
  showHeader?: boolean;
  showStats?: boolean;
  showRankingControls?: boolean;
  className?: string;
}

interface RankingControlsProps {
  weights: RankingWeights;
  onWeightsChange: (weights: Partial<RankingWeights>) => void;
  stats: {
    totalArticles: number;
    uniqueAuthors: number;
    averageScore: number;
    readPercentage: number;
  };
}

// Ranking controls component
const RankingControls: React.FC<RankingControlsProps> = ({ 
  weights, 
  onWeightsChange, 
  stats 
}) => {
  const [showControls, setShowControls] = useState(false);

  const resetToDefaults = () => {
    onWeightsChange({
      freshness: 0.4,
      authorInteraction: 0.3,
      contentPreference: 0.2,
      engagement: 0.1,
    });
  };

  const weightDescriptions = {
    freshness: 'How much newer articles are prioritized',
    authorInteraction: 'Based on your past interactions with authors',
    contentPreference: 'Based on your reading preferences and tags',
    engagement: 'Based on article likes and comments',
  };

  return (
    <>
      <IonButton
        fill="clear"
        size="small"
        onClick={() => setShowControls(true)}
        id="ranking-trigger"
      >
        <IonIcon icon={settings} />
      </IonButton>

      <IonPopover
        isOpen={showControls}
        onDidDismiss={() => setShowControls(false)}
        trigger="ranking-trigger"
        showBackdrop={true}
      >
        <div className="ranking-controls p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Feed Ranking</h3>
            <IonButton size="small" fill="outline" onClick={resetToDefaults}>
              Reset
            </IonButton>
          </div>

          <div className="feed-stats mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Feed Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Articles: {stats.totalArticles}</div>
              <div>Authors: {stats.uniqueAuthors}</div>
              <div>Avg Score: {stats.averageScore.toFixed(2)}</div>
              <div>Read: {stats.readPercentage.toFixed(1)}%</div>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="weight-control">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <span className="text-xs text-gray-500">{Math.round(value * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) => onWeightsChange({ [key]: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {weightDescriptions[key as keyof typeof weightDescriptions]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </IonPopover>
    </>
  );
};

// Individual article card component
const PersonalizedArticleCard: React.FC<{
  article: PersonalizedArticle;
  onArticleClick?: (article: PersonalizedArticle) => void;
  onUserClick?: (userId: string) => void;
  onMarkAsRead?: (articleId: string) => void;
}> = ({ article, onArticleClick, onUserClick, onMarkAsRead }) => {
  const [showActions, setShowActions] = useState(false);
  
  const getScoreColor = () => {
    const score = article.recommendation_score || 0;
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'primary';
    if (score >= 0.4) return 'warning';
    return 'medium';
  };

  const getAvatarUrl = () => {
    if (article.author_avatar_url) return article.author_avatar_url;
    
    const email = article.author_email || 'user';
    const initials = (article.author_name || email).substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=random&format=svg`;
  };

  const formatTimeAgo = () => {
    try {
      if (!article.created_at) return 'Recently';
      return formatDistanceToNow(new Date(article.created_at), { 
        addSuffix: true, 
        locale: it 
      });
    } catch {
      return 'Recently';
    }
  };

  const getTopRecommendationReason = () => {
    if (!article.recommendation_reasons) return null;
    
    const reasons = article.recommendation_reasons;
    const maxReason = Object.entries(reasons).reduce((max, [key, value]) => 
      value > max.value ? { key, value } : max
    , { key: '', value: 0 });

    const reasonLabels = {
      freshness_score: 'Fresh',
      author_interaction_score: 'Interaction',
      content_preference_score: 'Interest',
      engagement_score: 'Popular',
    };

    return {
      label: reasonLabels[maxReason.key as keyof typeof reasonLabels] || 'Recommended',
      score: maxReason.value,
    };
  };

  const topReason = getTopRecommendationReason();

  return (
    <IonCard 
      className={`personalized-article-card ${article.is_read ? 'read' : 'unread'}`}
      button
      onClick={() => onArticleClick?.(article)}
    >
      <IonCardHeader className="pb-2">
        <div className="flex items-start justify-between">
          {/* Author info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <IonAvatar 
              className="author-avatar"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick?.(article.user_id);
              }}
            >
              <img src={getAvatarUrl()} alt={article.author_name || 'Author'} />
            </IonAvatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 
                  className="author-name"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUserClick?.(article.user_id);
                  }}
                >
                  {article.author_name || article.author_email?.split('@')[0]}
                </h4>
                {!article.is_read && (
                  <div className="unread-indicator">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <IonIcon icon={time} className="w-3 h-3" />
                <span>{formatTimeAgo()}</span>
                {article.follow_date && (
                  <>
                    <span>•</span>
                    <span>Following since {formatDistanceToNow(new Date(article.follow_date))}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation score and actions */}
          <div className="flex items-center gap-2">
            <IonBadge color={getScoreColor()} className="recommendation-score">
              {Math.round((article.recommendation_score || 0) * 100)}
            </IonBadge>
            
            <IonButton
              fill="clear"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(true);
              }}
              id={`actions-${article.id}`}
            >
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </div>
        </div>
      </IonCardHeader>

      <IonCardContent>
        {/* Article content */}
        <div className="article-content">
          <h3 className="article-title">{article.title}</h3>
          
          {article.excerpt && (
            <p className="article-excerpt">{article.excerpt}</p>
          )}

          {/* Article meta */}
          <div className="article-meta">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <IonIcon icon={heart} className="w-4 h-4" />
                <span>{article.like_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <IonIcon icon={chatbubble} className="w-4 h-4" />
                <span>{article.comment_count || 0}</span>
              </div>
              {article.estimated_read_time && (
                <div className="flex items-center gap-1">
                  <IonIcon icon={time} className="w-4 h-4" />
                  <span>{article.estimated_read_time}m read</span>
                </div>
              )}
            </div>

            {/* Recommendation reason */}
            {topReason && (
              <IonChip color={getScoreColor()} outline>
                <IonLabel className="text-xs">
                  {topReason.label} {Math.round(topReason.score * 100)}%
                </IonLabel>
              </IonChip>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.slice(0, 3).map((tag, index) => (
                <IonChip key={index} outline>
                  <IonLabel className="text-xs">{tag}</IonLabel>
                </IonChip>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </IonCardContent>

      {/* Action sheet */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={[
          {
            text: article.is_read ? 'Mark as Unread' : 'Mark as Read',
            icon: article.is_read ? eyeOff : eye,
            handler: () => {
              onMarkAsRead?.(article.id);
            },
          },
          {
            text: 'View Author',
            icon: person,
            handler: () => {
              onUserClick?.(article.user_id);
            },
          },
          {
            text: 'Share',
            icon: share,
            handler: () => {
              // TODO: Implement sharing
            },
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ]}
      />
    </IonCard>
  );
};

// Main PersonalizedFeed component
const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({
  onArticleClick,
  onUserClick,
  showHeader = true,
  showStats = true,
  showRankingControls = true,
  className = '',
}) => {
  const {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    unreadCount,
    lastUpdated,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    updateRankingWeights,
    getFeedStats,
  } = usePersonalizedFeed({
    limit: 20,
    enableRealtime: true,
    enableCache: true,
  });

  const feedStats = getFeedStats();
  const [currentWeights] = useState({
    freshness: 0.4,
    authorInteraction: 0.3,
    contentPreference: 0.2,
    engagement: 0.1,
  });

  // Handle refresh
  const handleRefresh = useCallback(async (event?: CustomEvent<RefresherEventDetail>) => {
    await refresh();
    event?.detail.complete();
  }, [refresh]);

  // Handle infinite scroll
  const handleInfiniteScroll = useCallback(async (event: InfiniteScrollCustomEvent) => {
    await loadMore();
    event.target.complete();
  }, [loadMore]);

  // Render loading state
  if (isLoading && articles.length === 0) {
    return (
      <div className={`personalized-feed loading ${className}`}>
        {showHeader && (
          <div className="feed-header">
            <h2>Your Personalized Feed</h2>
          </div>
        )}
        <div className="loading-container">
          <IonSpinner name="bubbles" />
          <IonText color="medium">
            <p>Loading your personalized feed...</p>
          </IonText>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`personalized-feed error ${className}`}>
        {showHeader && (
          <div className="feed-header">
            <h2>Your Personalized Feed</h2>
          </div>
        )}
        <div className="error-container">
          <IonText color="danger">
            <h3>Failed to Load Feed</h3>
            <p>{error}</p>
          </IonText>
          <IonButton onClick={() => handleRefresh()} fill="outline">
            <IonIcon icon={refreshIcon} slot="start" />
            Try Again
          </IonButton>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!isLoading && articles.length === 0) {
    return (
      <div className={`personalized-feed empty ${className}`}>
        {showHeader && (
          <div className="feed-header">
            <h2>Your Personalized Feed</h2>
          </div>
        )}
        <div className="empty-container">
          <IonIcon icon={person} className="empty-icon" />
          <IonText color="medium" className="empty-text">
            <h3>No Articles Yet</h3>
            <p>Follow some users to see their articles in your personalized feed.</p>
          </IonText>
          <IonButton routerLink="/discover" fill="outline">
            Discover Users
          </IonButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`personalized-feed ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="feed-header">
          <div className="header-content">
            <div className="header-title">
              <h2>Your Personalized Feed</h2>
              {unreadCount > 0 && (
                <IonBadge color="primary" className="unread-badge">
                  {unreadCount} unread
                </IonBadge>
              )}
            </div>
            
            <div className="header-actions">
              {unreadCount > 0 && (
                <IonButton size="small" fill="outline" onClick={markAllAsRead}>
                  <IonIcon icon={checkmark} slot="start" />
                  Mark All Read
                </IonButton>
              )}
              
              {showRankingControls && (
                <RankingControls
                  weights={currentWeights}
                  onWeightsChange={updateRankingWeights}
                  stats={feedStats}
                />
              )}
            </div>
          </div>

          {lastUpdated && (
            <div className="last-updated">
              <IonText color="medium" className="text-sm">
                Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: it })}
              </IonText>
            </div>
          )}
        </div>
      )}

      {/* Feed content */}
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh your feed..."
            refreshingSpinner="bubbles"
            refreshingText="Updating your personalized feed..."
          />
        </IonRefresher>

        <IonList className="feed-list">
          {articles.map((article) => (
            <PersonalizedArticleCard
              key={article.id}
              article={article}
              onArticleClick={onArticleClick}
              onUserClick={onUserClick}
              onMarkAsRead={markAsRead}
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
            loadingText="Loading more articles..."
          />
        </IonInfiniteScroll>

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="loading-more">
            <IonSpinner name="dots" />
          </div>
        )}
      </IonContent>

      <style>{`
        .personalized-feed {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .feed-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .unread-badge {
          font-size: 12px;
          padding: 4px 8px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .last-updated {
          text-align: center;
        }

        .feed-list {
          background: transparent;
          padding: 16px;
        }

        .personalized-article-card {
          margin-bottom: 16px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background: white;
        }

        .personalized-article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .personalized-article-card.unread {
          border-left: 4px solid #3880ff;
        }

        .personalized-article-card.read {
          opacity: 0.8;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border: 2px solid #667eea;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .author-avatar:hover {
          border-color: #764ba2;
        }

        .author-name {
          font-weight: 600;
          color: #667eea;
          cursor: pointer;
          margin: 0;
          transition: color 0.2s ease;
        }

        .author-name:hover {
          color: #764ba2;
        }

        .recommendation-score {
          font-weight: 700;
          min-width: 40px;
          text-align: center;
        }

        .article-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .article-excerpt {
          color: #4a5568;
          margin: 0 0 12px 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .unread-indicator {
          display: flex;
          align-items: center;
        }

        .ranking-controls {
          min-width: 320px;
          max-height: 500px;
          overflow-y: auto;
        }

        .weight-control input[type="range"] {
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
        }

        .weight-control input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .weight-control input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .loading-container,
        .error-container,
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          min-height: 400px;
        }

        .empty-icon {
          font-size: 64px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 20px;
        }

        .empty-text h3 {
          color: white;
          margin-bottom: 8px;
        }

        .empty-text p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
        }

        .loading-more {
          display: flex;
          justify-content: center;
          padding: 16px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .feed-header {
            background: rgba(26, 32, 44, 0.95);
          }
          
          .personalized-article-card {
            background: #2d3748;
            color: white;
          }
          
          .article-title {
            color: white;
          }
          
          .article-excerpt {
            color: #a0aec0;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .feed-header {
            padding: 16px;
          }
          
          .header-content {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          
          .header-title h2 {
            font-size: 20px;
          }
          
          .feed-list {
            padding: 12px;
          }
          
          .personalized-article-card {
            margin-bottom: 12px;
          }
          
          .ranking-controls {
            min-width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default PersonalizedFeed;