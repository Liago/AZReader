import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonMenuButton,
} from '@ionic/react';
import {
  person,
  heart,
  notifications,
} from 'ionicons/icons';
import PersonalizedFeed from '@components/PersonalizedFeed';
import { PersonalizedArticle } from '@hooks/usePersonalizedFeed';
import { useHistory } from 'react-router-dom';

export interface PersonalizedFeedPageProps {
  className?: string;
}

const PersonalizedFeedPage: React.FC<PersonalizedFeedPageProps> = ({ 
  className = '' 
}) => {
  const history = useHistory();

  // Handle article click
  const handleArticleClick = (article: PersonalizedArticle) => {
    history.push(`/article/${article.id}`);
  };

  // Handle user click
  const handleUserClick = (userId: string) => {
    history.push(`/profile/${userId}`);
  };

  return (
    <IonPage className={`personalized-feed-page ${className}`}>
      <IonHeader>
        <IonToolbar className="personalized-toolbar">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          
          <IonTitle className="personalized-title">
            <div className="title-content">
              <IonIcon icon={heart} className="title-icon" />
              <span>Following Feed</span>
            </div>
          </IonTitle>

          <IonButtons slot="end">
            <IonButton 
              fill="clear" 
              routerLink="/activity"
              className="activity-button"
            >
              <IonIcon icon={notifications} />
            </IonButton>
            
            <IonButton 
              fill="clear" 
              routerLink="/discover"
              className="discover-button"
            >
              <IonIcon icon={person} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="personalized-content">
        <PersonalizedFeed
          onArticleClick={handleArticleClick}
          onUserClick={handleUserClick}
          showHeader={false} // We're using the page header instead
          showStats={true}
          showRankingControls={true}
        />
      </IonContent>

      <style>{`
        .personalized-feed-page {
          --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .personalized-toolbar {
          --background: rgba(255, 255, 255, 0.95);
          --color: #1a202c;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .personalized-title {
          --color: #1a202c;
          font-weight: 700;
        }

        .title-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title-icon {
          color: #667eea;
          font-size: 20px;
        }

        .activity-button,
        .discover-button {
          --color: #667eea;
        }

        .activity-button:hover,
        .discover-button:hover {
          --color: #764ba2;
        }

        .personalized-content {
          --background: transparent;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .personalized-toolbar {
            --background: rgba(26, 32, 44, 0.95);
            --color: white;
          }
          
          .personalized-title {
            --color: white;
          }
        }

        .ios.dark .personalized-toolbar,
        .md.dark .personalized-toolbar {
          --background: rgba(26, 32, 44, 0.95);
          --color: white;
        }
        
        .ios.dark .personalized-title,
        .md.dark .personalized-title {
          --color: white;
        }
      `}</style>
    </IonPage>
  );
};

export default PersonalizedFeedPage;