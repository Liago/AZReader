import React, { useMemo } from 'react';
import {
  IonItem,
  IonAvatar,
  IonLabel,
  IonText,
  IonIcon,
  IonBadge,
  IonButton,
  IonChip,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  chatbubble,
  bookmarkOutline,
  personAdd,
  shareOutline,
  create,
  time,
  people,
} from 'ionicons/icons';
import { ActivityItem, ActivityAggregate } from '@hooks/useActivityFeed';

export interface ActivityFeedItemProps {
  activity?: ActivityItem;
  aggregate?: ActivityAggregate;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onUserClick?: (userId: string) => void;
  onTargetClick?: (targetType: string, targetId: string) => void;
  onActionClick?: (action: string, targetId: string) => void;
  className?: string;
}

interface ActivityDisplayInfo {
  icon: string;
  color: string;
  text: string;
  description?: string;
  timestamp: string;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  aggregate,
  variant = 'default',
  showActions = false,
  onUserClick,
  onTargetClick,
  onActionClick,
  className = '',
}) => {
  // Determine which data to use (activity or aggregate)
  const isAggregate = !!aggregate && !activity;
  const data = isAggregate ? aggregate : activity;

  // Get activity display information
  const displayInfo: ActivityDisplayInfo = useMemo(() => {
    if (!data) return { icon: time, color: 'medium', text: '', timestamp: '' };

    const actionType = data.action_type;
    const timestamp = new Date(
      isAggregate ? (data as ActivityAggregate).last_activity_at : (data as ActivityItem).created_at
    ).toLocaleString();

    // Base actor info
    const actorName = isAggregate 
      ? (data as ActivityAggregate).actors?.[0]?.email?.split('@')[0] || 'Someone'
      : (data as ActivityItem).actor?.email?.split('@')[0] || 'Someone';

    switch (actionType) {
      case 'article_created':
        return {
          icon: create,
          color: 'primary',
          text: isAggregate 
            ? `${actorName} shared ${(data as ActivityAggregate).count} articles`
            : `${actorName} shared a new article`,
          description: isAggregate 
            ? (data as ActivityAggregate).title
            : (data as ActivityItem).content_preview,
          timestamp,
        };

      case 'article_liked':
        if (isAggregate) {
          const count = (data as ActivityAggregate).count;
          const otherCount = count - 1;
          return {
            icon: heart,
            color: 'danger',
            text: otherCount > 0 
              ? `${actorName} and ${otherCount} others liked this`
              : `${actorName} liked an article`,
            description: (data as ActivityAggregate).title,
            timestamp,
          };
        }
        return {
          icon: heart,
          color: 'danger',
          text: `${actorName} liked an article`,
          description: (data as ActivityItem).content_preview,
          timestamp,
        };

      case 'article_shared':
        const shareMethod = (data as ActivityItem).metadata?.share_method || 'social media';
        return {
          icon: shareOutline,
          color: 'success',
          text: `${actorName} shared an article via ${shareMethod}`,
          description: isAggregate 
            ? (data as ActivityAggregate).description
            : (data as ActivityItem).content_preview,
          timestamp,
        };

      case 'comment_created':
        return {
          icon: chatbubble,
          color: 'warning',
          text: `${actorName} commented on an article`,
          description: isAggregate 
            ? (data as ActivityAggregate).description
            : (data as ActivityItem).content_preview,
          timestamp,
        };

      case 'user_followed':
        if (isAggregate) {
          const count = (data as ActivityAggregate).count;
          return {
            icon: personAdd,
            color: 'tertiary',
            text: `${actorName} followed ${count} users`,
            timestamp,
          };
        }
        return {
          icon: personAdd,
          color: 'tertiary',
          text: `${actorName} followed a new user`,
          description: (data as ActivityItem).content_preview,
          timestamp,
        };

      case 'profile_updated':
        return {
          icon: people,
          color: 'medium',
          text: `${actorName} updated their profile`,
          description: (data as ActivityItem).content_preview,
          timestamp,
        };

      default:
        return {
          icon: time,
          color: 'medium',
          text: `${actorName} performed an action`,
          timestamp,
        };
    }
  }, [data, isAggregate]);

  if (!data) return null;

  // Handle user click
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick) {
      const userId = isAggregate 
        ? (data as ActivityAggregate).actor_id
        : (data as ActivityItem).actor_id;
      onUserClick(userId);
    }
  };

  // Handle target click (article, user, etc.)
  const handleTargetClick = () => {
    if (onTargetClick) {
      onTargetClick(data.target_type, data.target_id);
    }
  };

  // Handle action click (like, comment, etc.)
  const handleActionClick = (action: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onActionClick) {
      onActionClick(action, data.target_id);
    }
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    const actor = isAggregate 
      ? (data as ActivityAggregate).actors?.[0]
      : (data as ActivityItem).actor;
    
    if (actor?.avatar_url) return actor.avatar_url;
    
    const email = actor?.email || 'user';
    const initials = email.substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=random&format=svg`;
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <IonItem 
        className={`activity-feed-item compact ${className}`}
        button={!!onTargetClick}
        onClick={onTargetClick ? handleTargetClick : undefined}
      >
        <IonAvatar slot="start" onClick={handleUserClick}>
          <img src={getAvatarUrl()} alt="User avatar" />
        </IonAvatar>
        
        <IonLabel>
          <div className="activity-content">
            <div className="activity-main">
              <IonIcon icon={displayInfo.icon} color={displayInfo.color} className="activity-icon" />
              <span className="activity-text">{displayInfo.text}</span>
            </div>
            <IonText color="medium" className="activity-time">
              {displayInfo.timestamp}
            </IonText>
          </div>
        </IonLabel>

        {isAggregate && (data as ActivityAggregate).count > 1 && (
          <IonBadge color={displayInfo.color} slot="end">
            {(data as ActivityAggregate).count}
          </IonBadge>
        )}
      </IonItem>
    );
  }

  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <IonCard className={`activity-feed-item detailed ${className}`}>
        <IonCardContent>
          <div className="activity-header">
            <IonAvatar className="activity-avatar" onClick={handleUserClick}>
              <img src={getAvatarUrl()} alt="User avatar" />
            </IonAvatar>
            
            <div className="activity-info">
              <div className="activity-main">
                <IonIcon icon={displayInfo.icon} color={displayInfo.color} />
                <span className="activity-text">{displayInfo.text}</span>
                {isAggregate && (data as ActivityAggregate).count > 1 && (
                  <IonBadge color={displayInfo.color}>
                    {(data as ActivityAggregate).count}
                  </IonBadge>
                )}
              </div>
              <IonText color="medium" className="activity-time">
                {displayInfo.timestamp}
              </IonText>
            </div>
          </div>

          {displayInfo.description && (
            <div 
              className="activity-description"
              onClick={onTargetClick ? handleTargetClick : undefined}
            >
              <IonText>
                <p>{displayInfo.description}</p>
              </IonText>
            </div>
          )}

          {isAggregate && (data as ActivityAggregate).actors && (data as ActivityAggregate).actors!.length > 1 && (
            <div className="activity-actors">
              <IonText color="medium" className="actors-label">
                Other participants:
              </IonText>
              <div className="actors-list">
                {(data as ActivityAggregate).actors!.slice(1, 4).map((actor) => (
                  <IonChip 
                    key={actor.id} 
                    outline
                    onClick={() => onUserClick?.(actor.id)}
                  >
                    {actor.email.split('@')[0]}
                  </IonChip>
                ))}
                {(data as ActivityAggregate).actors!.length > 4 && (
                  <IonText color="medium">
                    +{(data as ActivityAggregate).actors!.length - 4} more
                  </IonText>
                )}
              </div>
            </div>
          )}

          {showActions && (
            <div className="activity-actions">
              {data.target_type === 'article' && (
                <>
                  <IonButton 
                    fill="clear" 
                    size="small"
                    onClick={handleActionClick('like')}
                  >
                    <IonIcon icon={heartOutline} slot="start" />
                    Like
                  </IonButton>
                  <IonButton 
                    fill="clear" 
                    size="small"
                    onClick={handleActionClick('comment')}
                  >
                    <IonIcon icon={chatbubble} slot="start" />
                    Comment
                  </IonButton>
                  <IonButton 
                    fill="clear" 
                    size="small"
                    onClick={handleActionClick('share')}
                  >
                    <IonIcon icon={shareOutline} slot="start" />
                    Share
                  </IonButton>
                </>
              )}
            </div>
          )}
        </IonCardContent>
      </IonCard>
    );
  }

  // Default variant
  return (
    <IonItem 
      className={`activity-feed-item default ${className}`}
      button={!!onTargetClick}
      onClick={onTargetClick ? handleTargetClick : undefined}
    >
      <IonAvatar slot="start" onClick={handleUserClick}>
        <img src={getAvatarUrl()} alt="User avatar" />
      </IonAvatar>
      
      <IonLabel>
        <div className="activity-content">
          <div className="activity-main">
            <IonIcon icon={displayInfo.icon} color={displayInfo.color} className="activity-icon" />
            <span className="activity-text">{displayInfo.text}</span>
            {isAggregate && (data as ActivityAggregate).count > 1 && (
              <IonBadge color={displayInfo.color}>
                {(data as ActivityAggregate).count}
              </IonBadge>
            )}
          </div>
          
          {displayInfo.description && (
            <IonText color="medium" className="activity-description">
              <p>{displayInfo.description}</p>
            </IonText>
          )}
          
          <IonText color="medium" className="activity-time">
            {displayInfo.timestamp}
          </IonText>
        </div>
      </IonLabel>

      {showActions && (
        <div className="activity-quick-actions" slot="end">
          {data.target_type === 'article' && (
            <IonButton 
              fill="clear" 
              size="small"
              onClick={handleActionClick('like')}
            >
              <IonIcon icon={heartOutline} slot="icon-only" />
            </IonButton>
          )}
        </div>
      )}

      <style>{`
        .activity-feed-item {
          margin-bottom: 8px;
        }

        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-main {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .activity-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .activity-text {
          flex: 1;
          font-weight: 500;
          color: var(--ion-color-dark);
        }

        .activity-description {
          margin-left: 24px;
          font-size: 14px;
          line-height: 1.4;
        }

        .activity-description p {
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .activity-time {
          margin-left: 24px;
          font-size: 12px;
        }

        .activity-quick-actions {
          display: flex;
          gap: 4px;
        }

        .activity-avatar {
          width: 40px;
          height: 40px;
          cursor: pointer;
        }

        .activity-avatar:hover {
          opacity: 0.8;
        }

        /* Compact variant */
        .activity-feed-item.compact .activity-content {
          gap: 2px;
        }

        .activity-feed-item.compact .activity-description {
          display: none;
        }

        .activity-feed-item.compact .activity-time {
          margin-left: 24px;
          font-size: 11px;
        }

        /* Detailed variant */
        .activity-feed-item.detailed {
          margin-bottom: 12px;
        }

        .activity-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .activity-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-feed-item.detailed .activity-description {
          margin-left: 0;
          margin-bottom: 12px;
          padding: 12px;
          background: var(--ion-color-light);
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .activity-feed-item.detailed .activity-description:hover {
          background: var(--ion-color-light-shade);
        }

        .activity-actors {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--ion-color-light);
        }

        .actors-label {
          display: block;
          font-size: 12px;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .actors-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }

        .activity-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--ion-color-light);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .activity-text {
            color: var(--ion-color-light);
          }
          
          .activity-feed-item.detailed .activity-description {
            background: var(--ion-color-dark-shade);
          }
          
          .activity-feed-item.detailed .activity-description:hover {
            background: var(--ion-color-dark-tint);
          }
        }

        .ios.dark .activity-text,
        .md.dark .activity-text {
          color: var(--ion-color-light);
        }
        
        .ios.dark .activity-feed-item.detailed .activity-description,
        .md.dark .activity-feed-item.detailed .activity-description {
          background: var(--ion-color-dark-shade);
        }
        
        .ios.dark .activity-feed-item.detailed .activity-description:hover,
        .md.dark .activity-feed-item.detailed .activity-description:hover {
          background: var(--ion-color-dark-tint);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .activity-main {
            flex-wrap: wrap;
          }
          
          .activity-actions {
            flex-wrap: wrap;
            gap: 6px;
          }
          
          .actors-list {
            gap: 4px;
          }
        }
      `}</style>
    </IonItem>
  );
};

export default ActivityFeedItem;