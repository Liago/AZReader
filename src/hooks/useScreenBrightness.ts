import { useState, useEffect, useCallback } from 'react';
import { ScreenBrightness } from '@capacitor-community/screen-brightness';
import { Capacitor } from '@capacitor/core';

interface UseScreenBrightnessOptions {
  autoRestore?: boolean;
  initialBrightness?: number;
}

interface UseScreenBrightnessReturn {
  brightness: number;
  originalBrightness: number;
  isSupported: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  setBrightness: (value: number) => Promise<void>;
  resetToOriginal: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useScreenBrightness = (options: UseScreenBrightnessOptions = {}): UseScreenBrightnessReturn => {
  const { autoRestore = true, initialBrightness } = options;
  
  const [brightness, setBrightnessState] = useState(initialBrightness || 0.8);
  const [originalBrightness, setOriginalBrightness] = useState(initialBrightness || 0.8);
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inizializzazione
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Verifica supporto piattaforma
        if (!Capacitor.isNativePlatform()) {
          setIsSupported(false);
          setIsLoading(false);
          return;
        }

        // Ottieni luminosità corrente
        const result = await ScreenBrightness.getBrightness();
        const currentBrightness = result.brightness;
        
        setBrightnessState(currentBrightness);
        if (!initialBrightness) {
          setOriginalBrightness(currentBrightness);
        }
        setIsSupported(true);
        setIsPermissionGranted(true);
        
      } catch (err) {
        console.error('Failed to initialize screen brightness:', err);
        setError('Failed to initialize brightness control');
        
        // Su Android, semplicemente imposta come non supportato
        // L'utente può provare manualmente con il pulsante di attivazione
        setIsSupported(false);
        setIsPermissionGranted(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup: ripristina luminosità originale
    if (autoRestore) {
      return () => {
        if (isSupported && isPermissionGranted) {
          ScreenBrightness.setBrightness({ brightness: originalBrightness })
            .catch(err => console.error('Failed to restore brightness:', err));
        }
      };
    }
  }, [autoRestore, initialBrightness, isSupported, isPermissionGranted, originalBrightness]);

  // Imposta luminosità
  const setBrightness = useCallback(async (value: number) => {
    if (!isSupported || !isPermissionGranted) {
      throw new Error('Brightness control not available');
    }

    try {
      const clampedValue = Math.max(0.1, Math.min(1.0, value));
      await ScreenBrightness.setBrightness({ brightness: clampedValue });
      setBrightnessState(clampedValue);
      setError(null);
    } catch (err) {
      console.error('Failed to set brightness:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to set brightness';
      setError(errorMessage);
      throw err;
    }
  }, [isSupported, isPermissionGranted]);

  // Ripristina luminosità originale
  const resetToOriginal = useCallback(async () => {
    await setBrightness(originalBrightness);
  }, [setBrightness, originalBrightness]);

  // Attiva il controllo manualmente
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Prova a leggere la luminosità per verificare se funziona
      const brightnessResult = await ScreenBrightness.getBrightness();
      setBrightnessState(brightnessResult.brightness);
      if (!initialBrightness) {
        setOriginalBrightness(brightnessResult.brightness);
      }
      setIsSupported(true);
      setIsPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to enable brightness control:', err);
      setError('Failed to enable brightness control');
      return false;
    }
  }, [initialBrightness]);

  return {
    brightness,
    originalBrightness,
    isSupported,
    isPermissionGranted,
    isLoading,
    error,
    setBrightness,
    resetToOriginal,
    requestPermissions,
  };
};