import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonAvatar,
  IonChip,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
} from '@ionic/react';
import {
  logOutOutline,
  createOutline,
  statsChartOutline,
  bookmarkOutline,
  timeOutline,
  trophyOutline,
  flameOutline,
  calendarOutline,
  globeOutline,
  mailOutline,
} from 'ionicons/icons';
import { useAuth } from '@context/auth/AuthContext';
import { useHistory } from 'react-router-dom';
import useUserProfile from '@hooks/useUserProfile';

type ViewMode = 'overview' | 'articles' | 'achievements';

const ProfilePage: React.FC = () => {
  const { session, signOut } = useAuth();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const user = session?.user;

  // Use the comprehensive profile hook
  const {
    profile,
    stats,
    achievements,
    articles,
    isLoading: profileLoading,
  } = useUserProfile({
    userId: user?.id,
    autoLoadArticles: true,
    autoLoadStats: true,
    articlesLimit: 12,
  });

  // Security check: redirect if not authenticated (using useEffect to avoid render loop)
  useEffect(() => {
    if (!session?.user) {
      console.log('ProfilePage: No session, redirecting to home');
      history.push('/home');
    }
  }, [session?.user, history]);

  // Show loading while redirecting
  if (!session?.user) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // Don't manually push to home - useEffect will handle redirect after session becomes null
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    // TODO: Navigate to profile edit page
    console.log('Edit profile clicked - will implement edit page');
  };

  // Format reading time
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleEditProfile} fill="clear">
              <IonIcon icon={createOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Hero Header with Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem 1rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            {/* Avatar */}
            <IonAvatar
              style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 1rem',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <img
                src={profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'}
                alt="Profile"
              />
            </IonAvatar>

            {/* Name & Email */}
            <h2 style={{ color: 'white', margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0', fontSize: '0.9rem' }}>
              <IonIcon icon={mailOutline} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
              {user?.email}
            </p>

            {/* Bio */}
            {profile?.bio && (
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: '1rem 0 0', fontSize: '0.95rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                {profile.bio}
              </p>
            )}

            {/* Website */}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', marginTop: '0.5rem' }}
              >
                <IonIcon icon={globeOutline} style={{ marginRight: '0.3rem' }} />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Joined Date */}
            {profile?.created_at && (
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                <IonIcon icon={calendarOutline} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                Joined {formatDate(profile.created_at)}
              </p>
            )}
          </div>

          {/* Stats Dashboard */}
          <IonGrid style={{ marginTop: '1.5rem', maxWidth: '600px', margin: '1.5rem auto 0' }}>
            <IonRow>
              <IonCol size="4">
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {stats?.totalArticles || 0}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    Articles
                  </div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {stats?.favoriteCount || 0}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    Favorites
                  </div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {stats?.streakDays || 0}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    Day Streak
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Segment Navigation */}
        <IonSegment
          value={viewMode}
          onIonChange={(e) => setViewMode(e.detail.value as ViewMode)}
          style={{ margin: '0 1rem 1rem' }}
        >
          <IonSegmentButton value="overview">
            <IonLabel>Overview</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="articles">
            <IonLabel>Articles</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="achievements">
            <IonLabel>Achievements</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Content based on selected view */}
        <div style={{ padding: '0 1rem 1rem' }}>
          {viewMode === 'overview' && (
            <>
              {/* Reading Stats Card */}
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <IonIcon icon={statsChartOutline} style={{ fontSize: '1.5rem', marginRight: '0.5rem', color: '#667eea' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Reading Stats</h3>
                  </div>

                  {profileLoading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <IonSpinner />
                    </div>
                  ) : (
                    <IonGrid style={{ padding: 0 }}>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ padding: '0.75rem', background: '#f7fafc', borderRadius: '8px', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <IonIcon icon={timeOutline} style={{ marginRight: '0.3rem', color: '#667eea' }} />
                              <span style={{ fontSize: '0.8rem', color: '#718096' }}>Total Time</span>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2d3748' }}>
                              {formatReadingTime(stats?.totalReadingTime || 0)}
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ padding: '0.75rem', background: '#f7fafc', borderRadius: '8px', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <IonIcon icon={bookmarkOutline} style={{ marginRight: '0.3rem', color: '#667eea' }} />
                              <span style={{ fontSize: '0.8rem', color: '#718096' }}>Avg. Time</span>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2d3748' }}>
                              {formatReadingTime(stats?.averageReadingTime || 0)}
                            </div>
                          </div>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <div style={{ padding: '0.75rem', background: '#f7fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <IonIcon icon={calendarOutline} style={{ marginRight: '0.3rem', color: '#667eea' }} />
                              <span style={{ fontSize: '0.8rem', color: '#718096' }}>This Week</span>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2d3748' }}>
                              {stats?.articlesThisWeek || 0}
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6">
                          <div style={{ padding: '0.75rem', background: '#f7fafc', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem' }}>
                              <IonIcon icon={flameOutline} style={{ marginRight: '0.3rem', color: '#f56565' }} />
                              <span style={{ fontSize: '0.8rem', color: '#718096' }}>This Month</span>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#2d3748' }}>
                              {stats?.articlesThisMonth || 0}
                            </div>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Top Categories */}
              {stats?.topCategories && stats.topCategories.length > 0 && (
                <IonCard>
                  <IonCardContent>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Top Categories</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {stats.topCategories.slice(0, 5).map((cat, index) => (
                        <IonChip key={index} color="primary">
                          <IonLabel>{cat.category}</IonLabel>
                          <IonBadge color="light">{cat.count}</IonBadge>
                        </IonChip>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}
            </>
          )}

          {viewMode === 'articles' && (
            <>
              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <IonSpinner />
                </div>
              ) : articles && articles.length > 0 ? (
                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    {articles.map((article) => (
                      <IonCol size="6" key={article.id}>
                        <IonCard
                          button
                          onClick={() => history.push(`/article/${article.id}`)}
                          style={{ margin: 0, height: '100%' }}
                        >
                          {article.image_url && (
                            <img
                              src={article.image_url}
                              alt={article.title}
                              style={{ height: '120px', objectFit: 'cover' }}
                            />
                          )}
                          <IonCardContent style={{ padding: '0.75rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 'bold', lineHeight: '1.3', height: '2.6em', overflow: 'hidden' }}>
                              {article.title}
                            </h4>
                            {article.domain && (
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>
                                {article.domain}
                              </p>
                            )}
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
                  <IonIcon icon={bookmarkOutline} style={{ fontSize: '4rem', opacity: 0.3 }} />
                  <p style={{ marginTop: '1rem' }}>No articles saved yet</p>
                </div>
              )}
            </>
          )}

          {viewMode === 'achievements' && (
            <>
              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <IonSpinner />
                </div>
              ) : achievements && achievements.length > 0 ? (
                <IonGrid style={{ padding: 0 }}>
                  <IonRow>
                    {achievements.map((achievement) => (
                      <IonCol size="6" key={achievement.id}>
                        <IonCard
                          style={{
                            margin: 0,
                            opacity: achievement.unlocked ? 1 : 0.5,
                            background: achievement.unlocked ? achievement.color : '#f7fafc',
                          }}
                        >
                          <IonCardContent style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                              {achievement.icon}
                            </div>
                            <h4 style={{ margin: '0 0 0.3rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                              {achievement.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096' }}>
                              {achievement.description}
                            </p>
                            {achievement.progress !== undefined && achievement.maxProgress && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      background: achievement.color,
                                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                                      height: '100%',
                                    }}
                                  />
                                </div>
                                <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#718096' }}>
                                  {achievement.progress} / {achievement.maxProgress}
                                </p>
                              </div>
                            )}
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                  </IonRow>
                </IonGrid>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#718096' }}>
                  <IonIcon icon={trophyOutline} style={{ fontSize: '4rem', opacity: 0.3 }} />
                  <p style={{ marginTop: '1rem' }}>No achievements unlocked yet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sign Out Button */}
        <div style={{ padding: '1rem', paddingBottom: '2rem' }}>
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <IonIcon slot="start" icon={logOutOutline} />
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
