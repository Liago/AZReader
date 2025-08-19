import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonText,
  IonChip,
  IonIcon,
  IonButton,
  IonList,
} from '@ionic/react';
import {
  informationCircleOutline,
  logoGithub,
  mailOutline,
  globeOutline,
  codeSlashOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  heartOutline,
} from 'ionicons/icons';

const InfoPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Informazioni</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* App Info Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={informationCircleOutline} color="primary" />
              AZ Reader
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                AZ Reader è un'applicazione moderna per la lettura e gestione degli articoli, 
                progettata per offrire un'esperienza di lettura ottimale su tutti i dispositivi.
              </p>
            </IonText>
            
            <div style={{ marginTop: '16px' }}>
              <IonChip color="primary">
                <IonIcon icon={phonePortraitOutline} />
                <IonLabel>Cross-platform</IonLabel>
              </IonChip>
              <IonChip color="secondary">
                <IonIcon icon={codeSlashOutline} />
                <IonLabel>React + Ionic</IonLabel>
              </IonChip>
              <IonChip color="tertiary">
                <IonIcon icon={shieldCheckmarkOutline} />
                <IonLabel>Secure</IonLabel>
              </IonChip>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Version Info */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Versione dell'App</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonLabel>
                  <h3>Versione</h3>
                  <p>1.18.1</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>Build</h3>
                  <p>2025.08.19</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>Piattaforma</h3>
                  <p>Web, iOS, Android</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Features */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Caratteristiche Principali</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={globeOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Parsing Intelligente</h3>
                  <p>Estrazione automatica del contenuto da qualsiasi URL</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={heartOutline} slot="start" color="danger" />
                <IonLabel>
                  <h3>Interfaccia Moderna</h3>
                  <p>Design pulito e user-friendly per la migliore esperienza di lettura</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={phonePortraitOutline} slot="start" color="secondary" />
                <IonLabel>
                  <h3>Cross-Platform</h3>
                  <p>Disponibile su Web, iOS e Android</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={shieldCheckmarkOutline} slot="start" color="success" />
                <IonLabel>
                  <h3>Sicurezza</h3>
                  <p>Autenticazione sicura e protezione dei dati</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Technology Stack */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Stack Tecnologico</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <IonChip color="primary">React 18</IonChip>
              <IonChip color="secondary">Ionic 8</IonChip>
              <IonChip color="tertiary">TypeScript</IonChip>
              <IonChip color="success">Capacitor</IonChip>
              <IonChip color="warning">Redux</IonChip>
              <IonChip color="danger">Supabase</IonChip>
            </div>
            <IonText color="medium">
              <p>
                Costruito con tecnologie moderne per garantire performance, 
                scalabilità e una ottima developer experience.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Contact & Support */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Contatti & Supporto</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem button>
                <IonIcon icon={mailOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Email di Supporto</h3>
                  <p>support@azreader.app</p>
                </IonLabel>
              </IonItem>
              <IonItem button>
                <IonIcon icon={logoGithub} slot="start" />
                <IonLabel>
                  <h3>Codice Sorgente</h3>
                  <p>Disponibile su GitHub</p>
                </IonLabel>
              </IonItem>
              <IonItem button>
                <IonIcon icon={globeOutline} slot="start" color="secondary" />
                <IonLabel>
                  <h3>Sito Web</h3>
                  <p>www.azreader.app</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Legal */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Informazioni Legali</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium" style={{ fontSize: '0.9rem' }}>
              <p>© 2025 AZ Reader. Tutti i diritti riservati.</p>
              <p>
                Questa applicazione è sviluppata con amore per fornire 
                la migliore esperienza di lettura possibile.
              </p>
              <p>
                L'utilizzo di questa app è soggetto ai nostri Termini di Servizio 
                e Informativa sulla Privacy.
              </p>
            </IonText>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <IonButton size="small" fill="outline">
                Termini di Servizio
              </IonButton>
              <IonButton size="small" fill="outline">
                Privacy Policy
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Made with Love */}
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: 'var(--ion-color-medium)' 
        }}>
          <IonText>
            <p style={{ margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              Made with <IonIcon icon={heartOutline} color="danger" style={{ fontSize: '16px' }} /> in Italy
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default InfoPage;