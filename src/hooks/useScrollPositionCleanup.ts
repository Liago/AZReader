import { useEffect, useCallback } from 'react';
import { useAppDispatch } from '@store/hooks';
import { clearOldScrollPositions } from '@store/slices/appSlice';

interface UseScrollPositionCleanupOptions {
  // Giorni di ritenzione per le posizioni (default: 7)
  retentionDays?: number;
  // Se eseguire la pulizia automatica all'avvio (default: true)
  cleanupOnMount?: boolean;
  // Intervallo di pulizia automatica in millisecondi (default: 24 ore)
  cleanupInterval?: number;
  // Se abilitare la pulizia automatica (default: true)
  enableAutoCleanup?: boolean;
}

export const useScrollPositionCleanup = (options: UseScrollPositionCleanupOptions = {}) => {
  const {
    retentionDays = 7,
    cleanupOnMount = true,
    cleanupInterval = 24 * 60 * 60 * 1000, // 24 hours
    enableAutoCleanup = true,
  } = options;

  const dispatch = useAppDispatch();

  // Funzione per eseguire la pulizia manuale
  const cleanupOldPositions = useCallback((daysToKeep?: number) => {
    dispatch(clearOldScrollPositions(daysToKeep || retentionDays));
  }, [dispatch, retentionDays]);

  // Effect per pulizia all'avvio e periodica
  useEffect(() => {
    if (!enableAutoCleanup) return;

    // Pulizia iniziale
    if (cleanupOnMount) {
      cleanupOldPositions();
    }

    // Pulizia periodica
    const intervalId = setInterval(() => {
      cleanupOldPositions();
    }, cleanupInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    enableAutoCleanup,
    cleanupOnMount,
    cleanupInterval,
    cleanupOldPositions,
  ]);

  return {
    cleanupOldPositions,
  };
};

export default useScrollPositionCleanup;