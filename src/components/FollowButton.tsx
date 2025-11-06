import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonPopover,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
} from '@ionic/react';
import {
  personAdd,
  personRemove,
  checkmark,
  person,
  people,
  ellipsisHorizontal,
} from 'ionicons/icons';
import useFollow from '@hooks/useFollow';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'compact' | 'icon-only' | 'full-width';
  size?: 'small' | 'default' | 'large';
  showStats?: boolean;
  showMutualFollowers?: boolean;
  disabled?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

interface FollowStatsPopoverProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  trigger?: string;
}

// Popover component for showing follow stats and mutual connections
const FollowStatsPopover: React.FC<FollowStatsPopoverProps> = ({
  userId,
  isOpen,
  onClose,
  trigger,
}) => {
  const { stats, getFollowers, getFollowing, getMutualFollowers } = useFollow({
    targetUserId: userId,
  });

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'mutual'>('followers');

  const loadData = async () => {
    setLoading(true);
    try {
      const [followersData, followingData, mutualData] = await Promise.all([
        getFollowers(),
        getFollowing(),
        getMutualFollowers(userId),
      ]);
      
      setFollowers(followersData);
      setFollowing(followingData);
      setMutualFollowers(mutualData);
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'followers': return followers;
      case 'following': return following;
      case 'mutual': return mutualFollowers;
      default: return [];
    }
  };

  return (
    <IonPopover
      isOpen={isOpen}
      onDidDismiss={onClose}
      trigger={trigger}
      showBackdrop={true}
    >
      <IonContent>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">Connections</h3>
          
          {/* Tabs */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeTab === 'followers'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Followers ({stats.followersCount})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeTab === 'following'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Following ({stats.followingCount})
            </button>
            <button
              onClick={() => setActiveTab('mutual')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeTab === 'mutual'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Mutual ({mutualFollowers.length})
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-8">
              <IonSpinner />
            </div>
          ) : (
            <IonList>
              {getCurrentData().map((user) => (
                <IonItem key={user.id} button>
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <IonIcon icon={person} className="text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {user.name || user.email.split('@')[0]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.follower_count} followers
                      </div>
                    </div>
                  </div>
                </IonItem>
              ))}
              
              {getCurrentData().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No {activeTab} found
                </div>
              )}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPopover>
  );
};

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  variant = 'default',
  size = 'default',
  showStats = false,
  showMutualFollowers = false,
  disabled = false,
  className = '',
  onFollowChange,
}) => {
  const [showStatsPopover, setShowStatsPopover] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  
  const { stats, isLoading, followUser, unfollowUser } = useFollow({
    targetUserId: userId,
    enableRealtime: true,
    enableToasts: true,
  });

  // Don't show follow button for own profile
  if (currentUserId === userId) {
    return null;
  }

  const handleFollowToggle = async () => {
    setIsActionLoading(true);
    try {
      const success = stats.isFollowing
        ? await unfollowUser(userId)
        : await followUser(userId);
      
      if (success && onFollowChange) {
        onFollowChange(!stats.isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'text-xs px-3 py-1',
      icon: 'w-4 h-4',
    },
    default: {
      button: 'text-sm px-4 py-2',
      icon: 'w-5 h-5',
    },
    large: {
      button: 'text-base px-6 py-3',
      icon: 'w-6 h-6',
    },
  };

  const config = sizeConfig[size];

  // Get button content based on variant and state
  const getButtonContent = () => {
    const isCurrentlyLoading = isLoading || isActionLoading;
    
    if (isCurrentlyLoading) {
      return (
        <>
          <IonSpinner className={config.icon} />
          {variant !== 'icon-only' && <span className="ml-2">Loading...</span>}
        </>
      );
    }

    if (stats.isFollowing) {
      // Following state
      return (
        <>
          <IonIcon icon={checkmark} className={config.icon} />
          {variant !== 'icon-only' && (
            <span className="ml-2">
              {variant === 'compact' ? 'Following' : 'Following'}
            </span>
          )}
        </>
      );
    } else {
      // Not following state
      return (
        <>
          <IonIcon icon={personAdd} className={config.icon} />
          {variant !== 'icon-only' && (
            <span className="ml-2">
              {variant === 'compact' ? 'Follow' : 'Follow'}
            </span>
          )}
        </>
      );
    }
  };

  const getButtonColor = () => {
    if (stats.isFollowing) {
      return 'medium'; // Gray for following
    } else {
      return 'primary'; // Blue for follow
    }
  };

  const getButtonFill = () => {
    if (variant === 'icon-only') return 'clear';
    if (stats.isFollowing) return 'outline';
    return 'solid';
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Main follow button */}
      <IonButton
        id={`follow-button-${userId}`}
        fill={getButtonFill()}
        color={getButtonColor()}
        size={size}
        disabled={disabled || isLoading || isActionLoading}
        onClick={handleFollowToggle}
        className={`
          ${config.button}
          ${variant === 'full-width' ? 'w-full' : ''}
          ${variant === 'icon-only' ? 'rounded-full' : ''}
          transition-all duration-200 ease-in-out
          hover:scale-105 active:scale-95
        `}
      >
        {getButtonContent()}
      </IonButton>

      {/* Stats button */}
      {showStats && (stats.followersCount > 0 || stats.followingCount > 0) && (
        <IonButton
          id={`stats-button-${userId}`}
          fill="clear"
          size="small"
          onClick={() => setShowStatsPopover(true)}
          className="ml-2"
        >
          <IonIcon icon={ellipsisHorizontal} />
        </IonButton>
      )}

      {/* Mutual followers badge */}
      {showMutualFollowers && stats.isFollowedBy && (
        <IonBadge color="success" className="ml-2">
          Follows you
        </IonBadge>
      )}

      {/* Stats display for compact variant */}
      {variant === 'compact' && showStats && (
        <div className="ml-3 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <IonIcon icon={people} className="w-4 h-4 mr-1" />
            <span>{stats.followersCount}</span>
          </div>
          <div className="flex items-center">
            <IonIcon icon={person} className="w-4 h-4 mr-1" />
            <span>{stats.followingCount}</span>
          </div>
        </div>
      )}

      {/* Follow stats popover */}
      <FollowStatsPopover
        userId={userId}
        isOpen={showStatsPopover}
        onClose={() => setShowStatsPopover(false)}
        trigger={`stats-button-${userId}`}
      />
    </div>
  );
};

export default FollowButton;