import React, { useState, useCallback, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSpinner,
  IonChip,
} from '@ionic/react';
import {
  heart,
  chatbubble,
  document,
  share,
  person,
  personAdd,
  close,
  chevronDown,
  chevronUp,
  time,
} from 'ionicons/icons';
import { 
  ActivityAggregate, 
  ActivityItem, 
  ActivityActionType, 
  useActivityFeed 
} from '@hooks/useActivityFeed';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ActivityAggregatorProps {
  aggregate: ActivityAggregate;
  onUserClick?: (userId: string) => void;
  onActivityClick?: (activity: ActivityAggregate) => void;
  showDetails?: boolean;
  maxActorsShown?: number;
}

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aggregate: ActivityAggregate;
  onUserClick?: (userId: string) => void;
}

// Modal showing detailed activity breakdown
const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
  isOpen,
  onClose,
  aggregate,
  onUserClick
}) => {
  const { activities, loadActivities, isLoading } = useActivityFeed({
    targetType: aggregate.target_type,
    targetId: aggregate.target_id,
    aggregated: false,
    limit: 50
  });

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, loadActivities]);

  const getActionText = (actionType: ActivityActionType) => {
    switch (actionType) {
      case 'article_liked': return 'liked this article';
      case 'comment_liked': return 'liked this comment';
      case 'comment_created': return 'commented';
      case 'article_created': return 'published this article';
      case 'user_followed': return 'started following';
      default: return actionType.replace('_', ' ');
    }
  };

  const relevantActivities = activities.filter(
    activity => activity.action_type === aggregate.action_type
  );

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {aggregate.count} {aggregate.action_type.replace('_', ' ')}
            {aggregate.count > 1 ? 's' : ''}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4">
          {/* Summary Card */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle className="text-base">
                {aggregate.title}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex items-center justify-between">
                <IonText>
                  <p className="text-sm text-gray-600">{aggregate.description}</p>
                </IonText>
                <IonBadge color="primary" className="ml-2">
                  {aggregate.count}
                </IonBadge>
              </div>
              
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <IonIcon icon={time} className="mr-1" />
                <span>
                  {formatDistanceToNow(parseISO(aggregate.first_activity_at), { addSuffix: true })}
                  {aggregate.first_activity_at !== aggregate.last_activity_at && (
                    <>
                      {' - '}
                      {formatDistanceToNow(parseISO(aggregate.last_activity_at), { addSuffix: true })}
                    </>
                  )}
                </span>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Activity List */}
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3">All Activities</h3>
            
            {isLoading ? (
              <div className="text-center p-8">
                <IonSpinner name="dots" />
                <p className="text-sm text-gray-500 mt-2">Loading activities...</p>
              </div>
            ) : relevantActivities.length === 0 ? (
              <IonText>
                <p className="text-center text-gray-500 p-4">No activities found</p>
              </IonText>
            ) : (
              <IonList>
                {relevantActivities.map((activity) => (
                  <IonItem key={activity.id}>
                    <IonAvatar 
                      slot="start" 
                      onClick={() => activity.actor && onUserClick?.(activity.actor.id)}
                      className="cursor-pointer"
                    >
                      {activity.actor?.avatar_url ? (
                        <img src={activity.actor.avatar_url} alt={activity.actor.email} />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full bg-blue-500 text-white font-semibold">
                          {activity.actor?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </IonAvatar>
                    
                    <IonLabel>
                      <h3 className="text-sm font-medium">
                        {activity.actor?.email?.split('@')[0] || 'Unknown user'} {getActionText(activity.action_type)}
                      </h3>
                      
                      {activity.content_preview && (
                        <p className="text-xs text-gray-600 mt-1">
                          "{activity.content_preview}"
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

// Main aggregator component
const ActivityAggregator: React.FC<ActivityAggregatorProps> = ({
  aggregate,
  onUserClick,
  onActivityClick,
  showDetails = false,
  maxActorsShown = 3
}) => {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      case 'profile_updated':
        return 'warning';
      default:
        return 'medium';
    }
  };

  const formatAggregateText = () => {
    const { action_type, count, actors, title } = aggregate;
    const actorNames = actors?.map(actor => actor.email.split('@')[0]).slice(0, maxActorsShown) || [];
    
    if (actorNames.length === 0) {
      return `${count} users ${action_type.replace('_', ' ')} ${title}`;
    }

    let actionText = '';
    switch (action_type) {
      case 'article_liked':
        actionText = 'liked';
        break;
      case 'comment_liked':
        actionText = 'liked a comment on';
        break;
      case 'comment_created':
        actionText = 'commented on';
        break;
      case 'article_created':
        actionText = 'published';
        break;
      case 'user_followed':
        actionText = 'started following';
        break;
      default:
        actionText = action_type.replace('_', ' ');
    }

    if (count === 1) {
      return `${actorNames[0]} ${actionText} ${title}`;
    } else if (count === 2 && actorNames.length >= 2) {
      return `${actorNames[0]} and ${actorNames[1]} ${actionText} ${title}`;
    } else {
      const othersCount = count - 1;
      return `${actorNames[0]} and ${othersCount} other${othersCount > 1 ? 's' : ''} ${actionText} ${title}`;
    }
  };

  const handleCardClick = () => {
    onActivityClick?.(aggregate);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleActorClick = (actorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUserClick?.(actorId);
  };

  const visibleActors = aggregate.actors?.slice(0, expanded ? aggregate.actors.length : maxActorsShown) || [];
  const hasMoreActors = (aggregate.actors?.length || 0) > maxActorsShown;

  return (
    <>
      <IonCard className="activity-aggregate-card" onClick={handleCardClick}>
        <IonCardContent>
          <div className="flex items-start space-x-3">
            {/* Activity Icon */}
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-full bg-${getActivityColor(aggregate.action_type)}-100 flex items-center justify-center`}>
                <IonIcon 
                  icon={getActivityIcon(aggregate.action_type)} 
                  className={`text-lg text-${getActivityColor(aggregate.action_type)}-600`}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {formatAggregateText()}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <IonIcon icon={time} className="mr-1" />
                    <span>
                      {formatDistanceToNow(parseISO(aggregate.last_activity_at), { addSuffix: true })}
                    </span>
                    
                    {aggregate.count > 1 && (
                      <>
                        <span className="mx-2">•</span>
                        <IonBadge color="primary" className="text-xs">
                          {aggregate.count}
                        </IonBadge>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {showDetails && (
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={handleDetailsClick}
                    >
                      <IonIcon icon={chevronDown} />
                    </IonButton>
                  )}
                </div>
              </div>

              {/* Actor Avatars */}
              {visibleActors.length > 0 && (
                <div className="flex items-center mt-3 space-x-2">
                  <div className="flex -space-x-2">
                    {visibleActors.map((actor, index) => (
                      <IonAvatar 
                        key={actor.id} 
                        className="w-8 h-8 border-2 border-white cursor-pointer hover:z-10 relative"
                        onClick={(e) => handleActorClick(actor.id, e)}
                      >
                        {actor.avatar_url ? (
                          <img src={actor.avatar_url} alt={actor.email} />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gray-400 text-white text-xs">
                            {actor.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </IonAvatar>
                    ))}
                  </div>

                  {hasMoreActors && !expanded && (
                    <IonChip 
                      className="text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                      }}
                    >
                      +{(aggregate.actors?.length || 0) - maxActorsShown} more
                    </IonChip>
                  )}

                  {expanded && hasMoreActors && (
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                      }}
                    >
                      <IonIcon icon={chevronUp} />
                    </IonButton>
                  )}
                </div>
              )}

              {/* Content Preview */}
              {aggregate.description && (
                <IonText>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {aggregate.description}
                  </p>
                </IonText>
              )}
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Details Modal */}
      <ActivityDetailsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        aggregate={aggregate}
        onUserClick={onUserClick}
      />
    </>
  );
};

export default ActivityAggregator;