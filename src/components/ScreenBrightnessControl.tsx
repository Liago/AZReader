import React, { useState, useEffect } from 'react';
import {
  IonRange,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonToast
} from '@ionic/react';
import { sunnyOutline, sunnySharp, phonePortraitOutline } from 'ionicons/icons';
import { ScreenBrightness } from '@capacitor-community/screen-brightness';
import { Capacitor } from '@capacitor/core';

interface ScreenBrightnessControlProps {
  className?: string;
  onBrightnessChange?: (brightness: number) => void;
  autoResetOnExit?: boolean;
}

const ScreenBrightnessControl: React.FC<ScreenBrightnessControlProps> = ({ 
  className = '',
  onBrightnessChange,
  autoResetOnExit = true
}) => {
  const [currentBrightness, setCurrentBrightness] = useState(0.8);
  const [originalBrightness, setOriginalBrightness] = useState(0.8);
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Verifica supporto e permessi all'inizializzazione
  useEffect(() => {
    const initializeBrightnessControl = async () => {
      try {
        // Verifica se la piattaforma supporta il controllo luminosità
        if (!Capacitor.isNativePlatform()) {
          console.log('Screen brightness control not supported on web platform');
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        // Ottieni la luminosità corrente
        const { brightness } = await ScreenBrightness.getBrightness();
        setCurrentBrightness(brightness);
        setOriginalBrightness(brightness);
        setIsSupported(true);
        setIsPermissionGranted(true);
        
        console.log('Screen brightness initialized:', brightness);
      } catch (error) {
        console.error('Failed to initialize screen brightness:', error);
        
        setIsSupported(false);
        
        // Su Android potrebbe fallire se non ci sono permessi WRITE_SETTINGS
        // ma il plugin dovrebbe funzionare comunque per la maggior parte dei dispositivi
        if (Capacitor.getPlatform() === 'android') {
          showToastMessage('Controllo luminosità potrebbe non funzionare su tutti i dispositivi Android');
        } else {
          showToastMessage('Controllo luminosità non supportato su questa piattaforma');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeBrightnessControl();

    // Cleanup: ripristina luminosità originale all'unmount se richiesto
    if (autoResetOnExit) {
      return () => {
        if (isSupported && isPermissionGranted) {
          ScreenBrightness.setBrightness({ brightness: originalBrightness })
            .catch(error => console.error('Failed to restore original brightness:', error));
        }
      };
    }
  }, [autoResetOnExit, isSupported, isPermissionGranted, originalBrightness]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleBrightnessChange = async (value: number) => {
    if (!isSupported || !isPermissionGranted) {
      showToastMessage('Controllo luminosità non disponibile');
      return;
    }

    try {
      // Clamp value tra 0.1 e 1.0
      const clampedValue = Math.max(0.1, Math.min(1.0, value));
      
      await ScreenBrightness.setBrightness({ brightness: clampedValue });
      setCurrentBrightness(clampedValue);
      
      // Callback opzionale
      if (onBrightnessChange) {
        onBrightnessChange(clampedValue);
      }
      
      console.log('Screen brightness set to:', clampedValue);
    } catch (error) {
      console.error('Failed to set screen brightness:', error);
      showToastMessage('Errore nel cambiare la luminosità');
    }
  };

  const handleResetBrightness = async () => {
    if (!isSupported || !isPermissionGranted) {
      showToastMessage('Ripristino luminosità non disponibile');
      return;
    }

    try {
      await handleBrightnessChange(originalBrightness);
      showToastMessage('Luminosità ripristinata');
    } catch (error) {
      console.error('Failed to reset brightness:', error);
      showToastMessage('Errore nel ripristinare la luminosità');
    }
  };

  const handleRequestPermissions = async () => {
    // Il plugin Screen Brightness non richiede permessi espliciti
    // Prova semplicemente a utilizzare le funzionalità
    try {
      const { brightness } = await ScreenBrightness.getBrightness();
      setCurrentBrightness(brightness);
      setOriginalBrightness(brightness);
      setIsSupported(true);
      setIsPermissionGranted(true);
      showToastMessage('Controllo luminosità attivato!');
    } catch (error) {
      console.error('Failed to enable brightness control:', error);
      showToastMessage('Impossibile attivare il controllo luminosità. Potrebbe non essere supportato su questo dispositivo.');
    }
  };

  // Componente di loading
  if (isLoading) {
    return (
      <IonCard className={`m-0 ${className}`}>
        <IonCardContent className="text-center py-4">
          <IonIcon icon={phonePortraitOutline} className="text-2xl text-gray-400 animate-pulse" />
          <p className="text-sm text-gray-500 mt-2">Inizializzazione controllo luminosità...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  // Componente per piattaforme non supportate
  if (!isSupported) {
    return (
      <IonCard className={`m-0 ${className}`}>
        <IonCardContent className="text-center py-4">
          <IonIcon icon={phonePortraitOutline} className="text-2xl text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">
            Controllo luminosità disponibile solo su dispositivi mobili
          </p>
        </IonCardContent>
      </IonCard>
    );
  }

  // Componente per richiedere permessi
  if (!isPermissionGranted) {
    return (
      <IonCard className={`m-0 ${className}`}>
        <IonCardHeader className="pb-2">
          <IonCardTitle className="text-base flex items-center gap-2">
            <IonIcon icon={sunnyOutline} className="text-orange-500" />
            Luminosità Schermo
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3">
            Attiva il controllo della luminosità per migliorare l'esperienza di lettura
          </p>
          <IonButton 
            expand="block" 
            fill="outline" 
            size="small"
            onClick={handleRequestPermissions}
          >
            Attiva Controllo
          </IonButton>
        </IonCardContent>
      </IonCard>
    );
  }

  // Controllo principale
  return (
    <>
      <IonCard className={`m-0 ${className}`}>
        <IonCardHeader className="pb-2">
          <IonCardTitle className="text-base flex items-center gap-2">
            <IonIcon icon={sunnyOutline} className="text-orange-500" />
            Luminosità Schermo
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent className="pt-0">
          <IonItem lines="none" className="--padding-start: 0">
            <IonLabel className="ion-text-wrap">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">10% - 100%</span>
                <span className="text-sm font-medium">{Math.round(currentBrightness * 100)}%</span>
              </div>
              <IonRange
                min={0.1}
                max={1.0}
                step={0.05}
                value={currentBrightness}
                onIonChange={(e) => handleBrightnessChange(e.detail.value as number)}
                color="warning"
              >
                <IonIcon slot="start" icon={sunnyOutline} className="text-sm opacity-60" />
                <IonIcon slot="end" icon={sunnySharp} className="text-lg text-orange-500" />
              </IonRange>
            </IonLabel>
          </IonItem>
          
          <div className="flex gap-2 mt-3">
            <IonButton 
              size="small" 
              fill="outline" 
              onClick={handleResetBrightness}
              className="flex-1"
            >
              Ripristina
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
        position="bottom"
      />
    </>
  );
};

export default ScreenBrightnessControl;