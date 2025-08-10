import React from 'react';
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
  IonToast,
  IonSpinner
} from '@ionic/react';
import { sunnyOutline, sunnySharp, phonePortraitOutline } from 'ionicons/icons';
import { useScreenBrightness } from '@hooks/useScreenBrightness';

interface SimpleScreenBrightnessControlProps {
  className?: string;
  onBrightnessChange?: (brightness: number) => void;
  autoResetOnExit?: boolean;
}

const SimpleScreenBrightnessControl: React.FC<SimpleScreenBrightnessControlProps> = ({ 
  className = '',
  onBrightnessChange,
  autoResetOnExit = true
}) => {
  const {
    brightness,
    originalBrightness,
    isSupported,
    isPermissionGranted,
    isLoading,
    error,
    setBrightness,
    resetToOriginal,
    requestPermissions
  } = useScreenBrightness({ autoRestore: autoResetOnExit });

  const handleBrightnessChange = async (value: number) => {
    try {
      await setBrightness(value);
      if (onBrightnessChange) {
        onBrightnessChange(value);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleResetBrightness = async () => {
    try {
      await resetToOriginal();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleRequestPermissions = async () => {
    await requestPermissions();
  };

  // Loading state
  if (isLoading) {
    return (
      <IonCard className={`m-0 ${className}`}>
        <IonCardContent className="text-center py-4">
          <IonSpinner name="crescent" className="mb-2" />
          <p className="text-sm text-gray-500">Inizializzazione controllo luminosità...</p>
        </IonCardContent>
      </IonCard>
    );
  }

  // Not supported
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

  // Permission required
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

  // Main control
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
                <span className="text-sm font-medium">{Math.round(brightness * 100)}%</span>
              </div>
              <IonRange
                min={0.1}
                max={1.0}
                step={0.05}
                value={brightness}
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
        isOpen={!!error}
        message={error || ''}
        duration={3000}
        color="danger"
        position="bottom"
      />
    </>
  );
};

export default SimpleScreenBrightnessControl;