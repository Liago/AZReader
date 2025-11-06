import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonChip,
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonSkeletonText,
  IonText,
  IonTextarea,
  IonInput,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonPopover,
  RefresherEventDetail,
} from '@ionic/react';
import {
  person,
  pencil,
  checkmark,
  close,
  globe,
  calendar,
  bookmark,
  heart,
  chatbubble,
  time,
  trophy,
  flame,
  library,
  people,
  share,
  ellipsisHorizontal,
  link,
  mail,
} from 'ionicons/icons';
import useUserProfile, { UserProfile as UserProfileType, UserAchievement } from '@hooks/useUserProfile';
import useFollow from '@hooks/useFollow';
import FollowButton from '@components/FollowButton';
import ArticleCard from '@components/ArticleCard';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface UserProfileProps {
  userId: string;
  isModal?: boolean;
  onClose?: () => void;
  className?: string;
}

interface ProfileHeaderProps {
  profile: UserProfileType;
  isOwnProfile: boolean;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: (updates: Partial<UserProfileType>) => Promise<void>;
  onCancel: () => void;
}

interface ProfileStatsProps {
  stats: any;
  followStats: any;
  achievements: UserAchievement[];
  onStatsClick?: () => void;
}

interface AchievementBadgeProps {
  achievement: UserAchievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

// Achievement Badge Component
const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  showProgress = false,
}) => {
  const sizeConfig = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base',
  };

  return (
    <div 
      className={`
        relative ${sizeConfig[size]} 
        ${achievement.unlocked ? 'opacity-100' : 'opacity-40 grayscale'}
        transition-all duration-200 hover:scale-110
      `}
    >
      <div
        className={`
          w-full h-full rounded-full flex items-center justify-center
          ${achievement.unlocked 
            ? `bg-${achievement.color}-500 text-white shadow-lg` 
            : 'bg-gray-300 text-gray-600'
          }
        `}
      >
        <IonIcon icon={achievement.icon} className="text-current" />
      </div>
      
      {showProgress && achievement.maxProgress && !achievement.unlocked && (
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
          <div className="text-xs font-medium text-gray-600">
            {achievement.progress}/{achievement.maxProgress}
          </div>
        </div>
      )}
      
      {achievement.unlocked && (
        <div className="absolute -top-1 -right-1">
          <IonIcon 
            icon={checkmark} 
            className="w-4 h-4 text-green-500 bg-white rounded-full"
          />
        </div>
      )}
    </div>
  );
};

// Profile Header Component with Edit Functionality
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  isEditing,
  onEditToggle,
  onSave,
  onCancel,
}) => {
  const [editForm, setEditForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    website: profile.website || '',
  });

  const handleSave = async () => {
    await onSave(editForm);
    onEditToggle();
  };

  const handleCancel = () => {
    setEditForm({
      name: profile.name || '',
      bio: profile.bio || '',
      website: profile.website || '',
    });
    onCancel();
  };

  return (
    <IonCard className="profile-header">
      <IonCardContent>
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <IonAvatar className="w-24 h-24">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name || 'User avatar'} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <IonIcon icon={person} className="text-white text-4xl" />
                </div>
              )}
            </IonAvatar>
            
            {profile.is_public && (
              <IonBadge color="success" className="absolute -bottom-2 -right-2">
                <IonIcon icon={globe} className="mr-1" />
                Public
              </IonBadge>
            )}
          </div>

          {/* Name and Bio */}
          {isEditing ? (
            <div className="w-full space-y-3">
              <IonInput
                value={editForm.name}
                placeholder="Display name"
                onIonInput={(e) => setEditForm(prev => ({ ...prev, name: e.detail.value! }))}
                className="text-center text-xl font-bold"
              />
              <IonTextarea
                value={editForm.bio}
                placeholder="Tell us about yourself..."
                rows={3}
                onIonInput={(e) => setEditForm(prev => ({ ...prev, bio: e.detail.value! }))}
                className="text-center"
              />
              <IonInput
                value={editForm.website}
                placeholder="Website URL"
                type="url"
                onIonInput={(e) => setEditForm(prev => ({ ...prev, website: e.detail.value! }))}
                className="text-center"
              />
              
              <div className="flex space-x-2 justify-center">
                <IonButton size="small" onClick={handleSave}>
                  <IonIcon icon={checkmark} slot="start" />
                  Save
                </IonButton>
                <IonButton size="small" fill="outline" onClick={handleCancel}>
                  <IonIcon icon={close} slot="start" />
                  Cancel
                </IonButton>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <h1 className="text-2xl font-bold">
                  {profile.name || profile.email.split('@')[0]}
                </h1>
                {isOwnProfile && (
                  <IonButton fill="clear" size="small" onClick={onEditToggle}>
                    <IonIcon icon={pencil} />
                  </IonButton>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-600 max-w-md">{profile.bio}</p>
              )}
              
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-700"
                >
                  <IonIcon icon={link} className="mr-1" />
                  Website
                </a>
              )}
              
              <div className="flex items-center justify-center text-sm text-gray-500">
                <IonIcon icon={calendar} className="mr-1" />
                Joined {formatDistanceToNow(parseISO(profile.created_at!), { addSuffix: true })}
              </div>
            </div>
          )}

          {/* Follow Button for non-own profiles */}
          {!isOwnProfile && !isEditing && (
            <FollowButton
              userId={profile.id}
              variant="default"
              size="default"
              showStats={false}
              showMutualFollowers={true}
            />
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Profile Stats Component
const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  followStats,
  achievements,
  onStatsClick,
}) => {
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Statistics</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Follow Stats */}
        <IonGrid>
          <IonRow>
            <IonCol size="4" className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {followStats.followersCount}
              </div>
              <div className="text-sm text-gray-600">Followers</div>
            </IonCol>
            <IonCol size="4" className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {followStats.followingCount}
              </div>
              <div className="text-sm text-gray-600">Following</div>
            </IonCol>
            <IonCol size="4" className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.totalArticles || 0}
              </div>
              <div className="text-sm text-gray-600">Articles</div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Reading Stats */}
        {stats && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reading Time</span>
              <span className="font-medium">{Math.round(stats.totalReadingTime)} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">{stats.articlesThisWeek} articles</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reading Streak</span>
              <div className="flex items-center">
                <IonIcon icon={flame} className="text-orange-500 mr-1" />
                <span className="font-medium">{stats.streakDays} days</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Favorites</span>
              <span className="font-medium">{stats.favoriteCount}</span>
            </div>
          </div>
        )}

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Achievements ({unlockedAchievements.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {unlockedAchievements.slice(0, 6).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="small"
                />
              ))}
              {unlockedAchievements.length > 6 && (
                <div className="text-xs text-gray-500 flex items-center">
                  +{unlockedAchievements.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Categories */}
        {stats?.topCategories && stats.topCategories.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Categories</h4>
            <div className="flex flex-wrap gap-1">
              {stats.topCategories.slice(0, 5).map((category: { category: string; count: number }, index: number) => (
                <IonChip key={category.category} color="secondary" className="text-xs">
                  {category.category} ({category.count})
                </IonChip>
              ))}
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// Main UserProfile Component
const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  isModal = false,
  onClose,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'achievements'>('articles');
  const [isEditing, setIsEditing] = useState(false);

  const userState = useSelector((state: RootState) => state.user);
  const currentUserId = userState.credentials?.user?.id;
  const isOwnProfile = currentUserId === userId;

  const {
    profile,
    articles,
    stats,
    achievements,
    isLoading,
    isLoadingArticles,
    error,
    hasMoreArticles,
    loadMoreArticles,
    updateProfile,
    refreshProfile,
  } = useUserProfile({
    userId,
    enableCache: true,
    autoLoadArticles: true,
    autoLoadStats: true,
  });

  const { stats: followStats } = useFollow({
    targetUserId: userId,
    enableRealtime: true,
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshProfile();
    event.detail.complete();
  };

  const handleInfiniteScroll = async (ev: CustomEvent<void>) => {
    await loadMoreArticles();
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleProfileUpdate = async (updates: Partial<UserProfileType>) => {
    await updateProfile(updates);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <IonText color="danger">
          <h2>Error loading profile</h2>
          <p>{error}</p>
        </IonText>
        <IonButton fill="outline" onClick={() => refreshProfile()}>
          Try Again
        </IonButton>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="space-y-4 p-4">
        {/* Header Skeleton */}
        <IonCard>
          <IonCardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gray-200"></div>
              <IonSkeletonText animated style={{ width: '60%', height: '20px' }}></IonSkeletonText>
              <IonSkeletonText animated style={{ width: '80%', height: '16px' }}></IonSkeletonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Stats Skeleton */}
        <IonCard>
          <IonCardContent>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <IonSkeletonText animated style={{ width: '40px', height: '24px', margin: '0 auto' }}></IonSkeletonText>
                  <IonSkeletonText animated style={{ width: '60px', height: '14px', margin: '4px auto 0' }}></IonSkeletonText>
                </div>
              ))}
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  const content = (
    <IonContent className={className}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <div className="space-y-4 p-4">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSave={handleProfileUpdate}
          onCancel={() => setIsEditing(false)}
        />

        {/* Profile Stats */}
        <ProfileStats
          stats={stats}
          followStats={followStats}
          achievements={achievements}
        />

        {/* Content Tabs */}
        <IonCard>
          <IonCardHeader>
            <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(e.detail.value as any)}>
              <IonSegmentButton value="articles">
                <IonLabel>Articles ({articles.length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="achievements">
                <IonLabel>Achievements ({achievements.filter(a => a.unlocked).length})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardHeader>

          <IonCardContent>
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {isLoadingArticles && articles.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <IonSpinner />
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <IonIcon icon={bookmark} className="text-4xl mb-2" />
                    <p>No public articles yet</p>
                  </div>
                ) : (
                  articles.map((article) => {
                    // Convert UserArticle to Post for ArticleCard compatibility
                    const postArticle = {
                      ...article,
                      user_id: '',
                      url: '',
                      content: '',
                      favicon_url: article.domain ? `https://www.google.com/s2/favicons?domain=${article.domain}` : null,
                      reading_status: 'unread' as const,
                      is_favorite: false,
                      view_count: 0,
                      updated_at: article.created_at,
                      reading_progress: 0,
                      is_public: true,
                      published_date: article.created_at,
                      scraped_at: article.created_at,
                    };
                    
                    return (
                      <ArticleCard
                        key={article.id}
                        article={postArticle}
                        session={null}
                        variant="compact"
                        showActions={false}
                      />
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                {achievements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <IonIcon icon={trophy} className="text-4xl mb-2" />
                    <p>No achievements yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="text-center space-y-2">
                        <AchievementBadge
                          achievement={achievement}
                          size="large"
                          showProgress={true}
                        />
                        <div>
                          <div className="font-medium text-sm">{achievement.title}</div>
                          <div className="text-xs text-gray-500">{achievement.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </div>

      {/* Infinite Scroll for Articles */}
      {activeTab === 'articles' && (
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasMoreArticles}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more articles..."
          />
        </IonInfiniteScroll>
      )}
    </IonContent>
  );

  if (isModal) {
    return (
      <>
        <IonHeader>
          <IonToolbar>
            <IonTitle>User Profile</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        {content}
      </>
    );
  }

  return content;
};

export default UserProfile;