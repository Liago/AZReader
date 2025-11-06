import React, { useState } from 'react';
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
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonText,
  IonSpinner,
} from '@ionic/react';
import {
  personOutline,
  settingsOutline,
  statsChartOutline,
  bookmarkOutline,
  logOutOutline,
  createOutline,
  mailOutline,
  calendarOutline,
} from 'ionicons/icons';
import { useAuth } from '@context/auth/AuthContext';
import { useHistory } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { session, signOut } = useAuth();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);

  const user = session?.user;

  // Security check: redirect if not authenticated
  if (!session?.user) {
    history.push('/home');
    return null;
  }

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      history.push('/home');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    // TODO: Navigate to profile edit page
    console.log('Edit profile clicked - will implement edit page');
  };

  const handleViewBookmarks = () => {
    // TODO: Navigate to bookmarks page
    console.log('View bookmarks clicked - will implement bookmarks page');
  };

  const handleViewStats = () => {
    // TODO: Navigate to reading stats page
    console.log('View stats clicked - will implement stats page');
  };

  const handleSettings = () => {
    history.push('/settings');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
        {/* Profile Header */}
        <IonCard className="profile-header-card">
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IonAvatar style={{ width: '80px', height: '80px' }}>
                <img
                  src={user?.user_metadata?.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VPC90ZXh0Pjwvc3ZnPg=='}
                  alt="Profile"
                />
              </IonAvatar>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonIcon icon={mailOutline} color="medium" />
                  <IonText color="medium">{user?.email}</IonText>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={calendarOutline} color="medium" />
                  <IonText color="medium">
                    Member since {new Date(user?.created_at || '').toLocaleDateString()}
                  </IonText>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Stats Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard button onClick={handleViewBookmarks}>
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={bookmarkOutline} />
                    Bookmarks
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="primary">
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>--</h2>
                  </IonText>
                  <IonText color="medium">
                    <p style={{ margin: '4px 0 0 0' }}>Saved articles</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard button onClick={handleViewStats}>
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={statsChartOutline} />
                    Reading
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText color="primary">
                    <h2 style={{ margin: '0', fontSize: '2rem' }}>--</h2>
                  </IonText>
                  <IonText color="medium">
                    <p style={{ margin: '4px 0 0 0' }}>Articles read</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Menu Options */}
        <IonList>
          <IonItem button onClick={handleEditProfile}>
            <IonIcon icon={createOutline} slot="start" />
            <IonLabel>Edit Profile</IonLabel>
          </IonItem>

          <IonItem button onClick={handleViewBookmarks}>
            <IonIcon icon={bookmarkOutline} slot="start" />
            <IonLabel>My Bookmarks</IonLabel>
          </IonItem>

          <IonItem button onClick={handleViewStats}>
            <IonIcon icon={statsChartOutline} slot="start" />
            <IonLabel>Reading Stats</IonLabel>
          </IonItem>

          <IonItem button onClick={handleSettings}>
            <IonIcon icon={settingsOutline} slot="start" />
            <IonLabel>Settings</IonLabel>
          </IonItem>

          <IonItem button onClick={handleSignOut} disabled={isLoading}>
            <IonIcon icon={logOutOutline} slot="start" color="danger" />
            <IonLabel color="danger">
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonSpinner name="crescent" />
                  Signing out...
                </div>
              ) : (
                'Sign Out'
              )}
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Account Info */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>User ID</IonLabel>
              <IonText slot="end" color="medium">
                {user?.id}
              </IonText>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Authentication Provider</IonLabel>
              <IonChip color="primary">
                {user?.app_metadata?.provider || 'Email'}
              </IonChip>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Last Sign In</IonLabel>
              <IonText slot="end" color="medium">
                {new Date(user?.last_sign_in_at || '').toLocaleDateString()}
              </IonText>
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;