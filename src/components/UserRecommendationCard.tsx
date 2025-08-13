import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonAvatar,
  IonButton,
  IonIcon,
  IonText,
  IonBadge,
  IonChip,
  IonSkeletonText,
  IonLabel,
} from '@ionic/react';
import {
  personAdd,
  close,
  people,
  heart,
  chatbubble,
  bookmark,
  eye,
  checkmark,
  informationCircle,
} from 'ionicons/icons';
import { UserRecommendation } from '@hooks/useUserRecommendations';
import useFollow from '@hooks/useFollow';

export interface UserRecommendationCardProps {
  recommendation: UserRecommendation;
  onFollow?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  showReasons?: boolean;
  showDebugInfo?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  loading?: boolean;
}

interface RecommendationReasonProps {
  type: 'commonTags' | 'mutualFollows' | 'engagementSimilarity' | 'contentSimilarity';
  score: number;
  debugInfo?: {
    commonTagsList?: string[];
    mutualFollowsList?: string[];
  };
}

// Component to display individual recommendation reasons
const RecommendationReason: React.FC<RecommendationReasonProps> = ({ 
  type, 
  score, 
  debugInfo 
}) => {
  const getReasonInfo = () => {
    switch (type) {
      case 'commonTags':
        return {
          icon: bookmark,
          label: 'Common Interests',
          color: 'primary',
          description: debugInfo?.commonTagsList?.length 
            ? `${debugInfo.commonTagsList.length} shared topics`
            : 'Similar reading interests'
        };
      case 'mutualFollows':
        return {
          icon: people,
          label: 'Mutual Connections',
          color: 'secondary',
          description: debugInfo?.mutualFollowsList?.length
            ? `${debugInfo.mutualFollowsList.length} mutual follows`
            : 'Common followers'
        };
      case 'engagementSimilarity':
        return {
          icon: heart,
          label: 'Similar Activity',
          color: 'success',
          description: 'Similar engagement patterns'
        };
      case 'contentSimilarity':
        return {
          icon: eye,
          label: 'Reading Habits',
          color: 'warning',
          description: 'Similar content preferences'
        };
      default:
        return {
          icon: informationCircle,
          label: 'Other',
          color: 'medium',
          description: 'Other factors'
        };
    }
  };

  const reasonInfo = getReasonInfo();
  const percentage = Math.round(score * 100);

  if (percentage < 5) return null; // Don't show very low scores

  return (
    <IonChip 
      color={reasonInfo.color} 
      outline={percentage < 30}
      className="text-xs"
    >
      <IonIcon icon={reasonInfo.icon} className="w-3 h-3 mr-1" />
      <IonLabel>{percentage}%</IonLabel>
    </IonChip>
  );
};

const UserRecommendationCard: React.FC<UserRecommendationCardProps> = ({
  recommendation,
  onFollow,
  onDismiss,
  onViewProfile,
  showReasons = true,
  showDebugInfo = false,
  variant = 'default',
  className = '',
  loading = false
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { followUser } = useFollow({ enableRealtime: false, enableToasts: false });

  // Handle loading state
  if (loading) {
    return (
      <IonCard className={`user-recommendation-card loading ${variant} ${className}`}>
        <IonCardHeader>
          <div className="flex items-center gap-3">
            <IonSkeletonText animated style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
            <div className="flex-1">
              <IonSkeletonText animated style={{ width: '60%', height: '20px' }} />
              <IonSkeletonText animated style={{ width: '80%', height: '16px', marginTop: '4px' }} />
            </div>
          </div>
        </IonCardHeader>
        <IonCardContent>
          <IonSkeletonText animated style={{ width: '100%', height: '60px' }} />
        </IonCardContent>
      </IonCard>
    );
  }

  // Don't render if dismissed
  if (isDismissed) return null;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsFollowing(true);
      await followUser(recommendation.id);
      onFollow?.(recommendation.id);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setIsFollowing(false);
    }
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.(recommendation.id);
  };

  const handleCardClick = () => {
    onViewProfile?.(recommendation.id);
  };

  const getAvatarUrl = () => {
    if (recommendation.avatar_url) {
      return recommendation.avatar_url;
    }
    // Generate a simple avatar based on user's name or email
    const initials = recommendation.name 
      ? recommendation.name.substring(0, 2).toUpperCase()
      : recommendation.email.substring(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=random&format=svg`;
  };

  const getDisplayName = () => {
    return recommendation.name || recommendation.email.split('@')[0];
  };

  const getScoreColor = () => {
    const score = recommendation.recommendationScore;
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'primary';
    if (score >= 0.4) return 'warning';
    return 'medium';
  };

  const formatScore = () => {
    return Math.round(recommendation.recommendationScore * 100);
  };

  const hasReasons = () => {
    const reasons = recommendation.reasons;
    return Object.values(reasons).some(score => score > 0.05);
  };

  return (
    <IonCard 
      className={`user-recommendation-card ${variant} ${className}`}
      button={!!onViewProfile}
      onClick={onViewProfile ? handleCardClick : undefined}
    >
      <IonCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <IonAvatar className="recommendation-avatar">
              <img
                src={getAvatarUrl()}
                alt={getDisplayName()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 
                    `https://ui-avatars.com/api/?name=${getDisplayName()}&background=random&format=svg`;
                }}
              />
            </IonAvatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {getDisplayName()}
                </h3>
                <IonBadge color={getScoreColor()} className="text-xs">
                  {formatScore()}%
                </IonBadge>
              </div>
              
              {recommendation.bio && variant !== 'compact' && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {recommendation.bio}
                </p>
              )}

              {variant !== 'compact' && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <IonIcon icon={people} className="w-4 h-4" />
                    <span>{recommendation.follower_count || 0} followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{recommendation.following_count || 0} following</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-3">
            <IonButton
              fill="outline"
              size="small"
              color="primary"
              onClick={handleFollowClick}
              disabled={isFollowing}
              className="flex-shrink-0"
            >
              <IonIcon 
                icon={isFollowing ? checkmark : personAdd} 
                slot={variant === 'compact' ? 'icon-only' : 'start'}
              />
              {variant !== 'compact' && (isFollowing ? 'Following...' : 'Follow')}
            </IonButton>

            <IonButton
              fill="clear"
              size="small"
              color="medium"
              onClick={handleDismissClick}
              className="flex-shrink-0"
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </div>
        </div>
      </IonCardHeader>

      {variant !== 'compact' && (
        <IonCardContent>
          {/* Recommendation reasons */}
          {showReasons && hasReasons() && (
            <div className="recommendation-reasons mb-3">
              <div className="flex items-center gap-1 mb-2">
                <IonText color="medium" className="text-xs font-medium">
                  Why we recommend:
                </IonText>
              </div>
              <div className="flex flex-wrap gap-1">
                <RecommendationReason
                  type="mutualFollows"
                  score={recommendation.reasons.mutualFollows}
                  debugInfo={recommendation.debugInfo}
                />
                <RecommendationReason
                  type="commonTags"
                  score={recommendation.reasons.commonTags}
                  debugInfo={recommendation.debugInfo}
                />
                <RecommendationReason
                  type="engagementSimilarity"
                  score={recommendation.reasons.engagementSimilarity}
                />
                <RecommendationReason
                  type="contentSimilarity"
                  score={recommendation.reasons.contentSimilarity}
                />
              </div>
            </div>
          )}

          {/* Debug information */}
          {showDebugInfo && recommendation.debugInfo && (
            <div className="debug-info mt-3 p-2 bg-gray-50 rounded-lg">
              <IonText color="medium" className="text-xs font-medium block mb-1">
                Debug Info:
              </IonText>
              <div className="text-xs space-y-1">
                {recommendation.debugInfo.commonTagsList && (
                  <div>
                    <span className="font-medium">Common tags:</span> {recommendation.debugInfo.commonTagsList.join(', ')}
                  </div>
                )}
                {recommendation.debugInfo.mutualFollowsList && (
                  <div>
                    <span className="font-medium">Mutual follows:</span> {recommendation.debugInfo.mutualFollowsList.length}
                  </div>
                )}
                <div>
                  <span className="font-medium">Total score:</span> {recommendation.recommendationScore.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </IonCardContent>
      )}

      <style>{`
        .user-recommendation-card {
          margin-bottom: 12px;
          --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          --border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .user-recommendation-card.compact {
          --box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        .user-recommendation-card:hover {
          transform: translateY(-2px);
          --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .recommendation-avatar {
          width: 48px;
          height: 48px;
          border: 2px solid var(--ion-color-light);
        }

        .user-recommendation-card.compact .recommendation-avatar {
          width: 40px;
          height: 40px;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .recommendation-reasons {
          padding-top: 8px;
          border-top: 1px solid var(--ion-color-light);
        }

        .debug-info {
          font-family: monospace;
          font-size: 11px;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .debug-info {
            background-color: var(--ion-color-dark-shade, #1e2023);
          }
        }

        .ios.dark .debug-info,
        .md.dark .debug-info {
          background-color: var(--ion-color-dark-shade, #1e2023);
        }

        /* Loading state */
        .user-recommendation-card.loading {
          pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .user-recommendation-card {
            margin-bottom: 8px;
          }

          .recommendation-avatar {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </IonCard>
  );
};

export default UserRecommendationCard;