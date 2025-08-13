import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonSpinner,
  IonList,
  IonBadge,
  IonChip,
  IonSkeletonText,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  chatbubble,
  share,
  person,
  personAdd,
  personRemove,
  document,
  time,
  people,
  chevronDown,
  refresh as refreshIcon,
} from 'ionicons/icons';
import { 
  useActivityFeed, 
  ActivityAggregate, 
  ActivityItem, 
  ActivityActionType,
  ActivityFeedOptions 
} from '@hooks/useActivityFeed';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ActivityFeedProps {
  options?: ActivityFeedOptions;
  showHeader?: boolean;
  className?: string;
  onActivityClick?: (activity: ActivityAggregate | ActivityItem) => void;
  onUserClick?: (userId: string) => void;
}

interface ActivityItemComponentProps {
  activity: ActivityAggregate | ActivityItem;
  onActivityClick?: (activity: ActivityAggregate | ActivityItem) => void;
  onUserClick?: (userId: string) => void;
}

// Activity Item Component
const ActivityItemComponent: React.FC<ActivityItemComponentProps> = ({ 
  activity, 
  onActivityClick, 
  onUserClick 
}) => {
  const isAggregate = 'count' in activity;
  const aggregate = activity as ActivityAggregate;
  const individual = activity as ActivityItem;

  const getActivityIcon = (actionType: ActivityActionType) => {
    switch (actionType) {
      case 'article_liked':
      case 'comment_liked':
        return heart;
      case 'comment_created':
        return chatbubble;
      case 'article_created':
        return document;
      case 'article_shared':
        return share;
      case 'user_followed':
        return personAdd;
      case 'user_unfollowed':
        return personRemove;
      case 'profile_updated':
        return person;
      default:
        return document;
    }
  };

  const getActivityColor = (actionType: ActivityActionType) => {
    switch (actionType) {
      case 'article_liked':
      case 'comment_liked':
        return 'danger';
      case 'comment_created':
        return 'primary';
      case 'article_created':
        return 'success';
      case 'article_shared':
        return 'secondary';
      case 'user_followed':
        return 'tertiary';
      case 'user_unfollowed':
        return 'medium';
      case 'profile_updated':
        return 'warning';
      default:
        return 'medium';
    }
  };

  const formatActivityText = () => {
    if (isAggregate) {
      const { action_type, count, actors, title } = aggregate;
      const actorNames = actors?.map(actor => actor.email.split('@')[0]).slice(0, 3) || [];
      
      let actionText = '';
      switch (action_type) {
        case 'article_liked':
          actionText = count === 1 ? 'liked' : `and ${count - 1} others liked`;
          break;
        case 'comment_liked':
          actionText = count === 1 ? 'liked a comment on' : `and ${count - 1} others liked a comment on`;
          break;
        case 'comment_created':
          actionText = count === 1 ? 'commented on' : `and ${count - 1} others commented on`;
          break;
        case 'article_created':
          actionText = 'published';
          break;
        case 'user_followed':
          actionText = count === 1 ? 'started following' : `and ${count - 1} others started following`;
          break;
        default:
          actionText = action_type.replace('_', ' ');
      }

      if (actorNames.length > 0) {
        const mainActor = actorNames[0];
        if (count > 1 && actorNames.length > 1) {
          return `${mainActor} and ${count - 1} others ${actionText} ${title}`;
        } else {
          return `${mainActor} ${actionText} ${title}`;
        }
      }
      
      return `${count} users ${actionText} ${title}`;
    } else {
      const { action_type, content_preview, actor } = individual;
      const actorName = actor?.email?.split('@')[0] || 'Someone';
      
      let actionText = '';
      switch (action_type) {
        case 'article_liked':
          actionText = 'liked an article';
          break;
        case 'comment_liked':
          actionText = 'liked a comment';
          break;
        case 'comment_created':
          actionText = 'commented';
          break;
        case 'article_created':
          actionText = 'published an article';
          break;
        case 'user_followed':
          actionText = 'started following someone';
          break;
        default:
          actionText = action_type.replace('_', ' ');
      }

      return `${actorName} ${actionText}${content_preview ? `: "${content_preview}"` : ''}`;
    }
  };

  const getTimestamp = () => {
    const timestamp = isAggregate ? aggregate.last_activity_at : individual.created_at;
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  };

  const getAvatarContent = () => {
    if (isAggregate && aggregate.actors && aggregate.actors.length > 0) {
      return aggregate.actors[0]?.avatar_url || aggregate.actors[0]?.email?.[0]?.toUpperCase() || 'U';
    } else if (!isAggregate && individual.actor) {
      return individual.actor.avatar_url || individual.actor.email?.[0]?.toUpperCase() || 'U';
    }
    return '?';
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = isAggregate ? aggregate.actor_id : individual.actor_id;
    onUserClick?.(userId);
  };

  const handleActivityClick = () => {
    onActivityClick?.(activity);
  };

  return (
    <IonItem button onClick={handleActivityClick} className="activity-item">
      <IonAvatar slot="start" onClick={handleUserClick}>
        {typeof getAvatarContent() === 'string' && getAvatarContent().startsWith('http') ? (
          <img src={getAvatarContent() as string} alt="Avatar" />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-blue-500 text-white font-semibold">
            {getAvatarContent()}
          </div>
        )}
      </IonAvatar>

      <IonLabel className="py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {formatActivityText()}
            </p>
            
            <div className="flex items-center text-xs text-gray-500">
              <IonIcon icon={time} className="mr-1" />
              <span>{getTimestamp()}</span>
              
              {isAggregate && aggregate.count > 1 && (
                <>
                  <span className="mx-2">•</span>
                  <IonBadge color="primary" className="text-xs">
                    {aggregate.count}
                  </IonBadge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center ml-4">
            <IonIcon 
              icon={getActivityIcon(activity.action_type)} 
              className={`text-lg text-${getActivityColor(activity.action_type)}`} 
            />
          </div>
        </div>

        {/* Show multiple actors for aggregated activities */}
        {isAggregate && aggregate.actors && aggregate.actors.length > 1 && (
          <div className="flex items-center mt-2 space-x-1">
            {aggregate.actors.slice(0, 4).map((actor, index) => (
              <IonAvatar key={actor.id} className="w-6 h-6" onClick={(e) => {
                e.stopPropagation();
                onUserClick?.(actor.id);
              }}>
                {actor.avatar_url ? (
                  <img src={actor.avatar_url} alt={actor.email} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-400 text-white text-xs">
                    {actor.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </IonAvatar>
            ))}
            
            {aggregate.count > 4 && (
              <IonChip className="text-xs">
                +{aggregate.count - 4} more
              </IonChip>
            )}
          </div>
        )}
      </IonLabel>
    </IonItem>
  );
};

// Skeleton loading component
const ActivitySkeleton: React.FC = () => (
  <IonItem>
    <IonAvatar slot="start">
      <IonSkeletonText animated />
    </IonAvatar>
    <IonLabel>
      <IonSkeletonText animated style={{ width: '80%' }} />
      <IonSkeletonText animated style={{ width: '60%' }} />
    </IonLabel>
  </IonItem>
);

// Main Activity Feed Component
const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  options = {}, 
  showHeader = true, 
  className = '',
  onActivityClick,
  onUserClick
}) => {
  const {
    activities,
    aggregates,
    hasMore,
    loadMore,
    refresh,
    isLoading,
    isLoadingMore,
    error,
  } = useActivityFeed({ 
    aggregated: true,
    realTime: true,
    ...options 
  });

  const [refreshing, setRefreshing] = useState(false);

  // Handle pull to refresh
  const handleRefresh = async (event: any) => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    event.detail.complete();
  };

  // Handle infinite scroll
  const handleInfiniteScroll = async (event: any) => {
    await loadMore();
    event.target.complete();
  };

  // Get feed title based on options
  const getFeedTitle = () => {
    if (options.feedType === 'user') return 'My Activity';
    if (options.feedType === 'following') return 'Following';
    if (options.targetType === 'article') return 'Article Activity';
    return 'Activity Feed';
  };

  const displayItems = options.aggregated !== false ? aggregates : activities;

  if (error) {
    return (
      <div className={`activity-feed-error text-center p-8 ${className}`}>
        <IonIcon icon={refreshIcon} className="text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Unable to load activities
        </h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <IonButton onClick={refresh} size="small">
          Try Again
        </IonButton>
      </div>
    );
  }

  return (
    <div className={`activity-feed ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {getFeedTitle()}
          </h2>
          <IonButton 
            fill="clear" 
            size="small"
            onClick={refresh}
            disabled={isLoading}
          >
            <IonIcon icon={refreshIcon} />
          </IonButton>
        </div>
      )}

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading ? (
          <IonList>
            {[...Array(5)].map((_, index) => (
              <ActivitySkeleton key={index} />
            ))}
          </IonList>
        ) : displayItems.length === 0 ? (
          <div className="text-center p-8">
            <IonIcon icon={people} className="text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No activities yet
            </h3>
            <p className="text-sm text-gray-500">
              {options.feedType === 'following' 
                ? 'Follow some users to see their activities here.'
                : 'Activities will appear here when users interact with content.'
              }
            </p>
          </div>
        ) : (
          <IonList>
            {displayItems.map((item, index) => (
              <ActivityItemComponent
                key={`${item.id}-${index}`}
                activity={item}
                onActivityClick={onActivityClick}
                onUserClick={onUserClick}
              />
            ))}
          </IonList>
        )}

        <IonInfiniteScroll
          threshold="100px"
          disabled={!hasMore || isLoading}
          onIonInfinite={handleInfiniteScroll}
        >
          <IonInfiniteScrollContent
            loadingText="Loading more activities..."
            loadingSpinner="bubbles"
          />
        </IonInfiniteScroll>

        {isLoadingMore && (
          <div className="text-center p-4">
            <IonSpinner name="dots" />
          </div>
        )}
      </IonContent>
    </div>
  );
};

export default ActivityFeed;