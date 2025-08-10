import React from 'react';
import { IonProgressBar, IonIcon, IonChip, IonLabel } from '@ionic/react';
import { timeOutline, bookOutline, eyeOutline } from 'ionicons/icons';

interface ReadingProgressBarProps {
  // Dati di progresso
  scrollProgress: number;
  readingProgress: number;
  timeElapsed: number;
  estimatedReadingTime: number;
  estimatedRemainingTime: number;
  wordCount: number;
  isReading: boolean;
  
  // Configurazione UI
  position?: 'top' | 'bottom' | 'fixed-top' | 'fixed-bottom';
  showDetails?: boolean;
  showTimeInfo?: boolean;
  showWordCount?: boolean;
  variant?: 'minimal' | 'detailed' | 'compact';
  className?: string;
}

const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  scrollProgress,
  readingProgress,
  timeElapsed,
  estimatedReadingTime,
  estimatedRemainingTime,
  wordCount,
  isReading,
  position = 'fixed-top',
  showDetails = true,
  showTimeInfo = true,
  showWordCount = false,
  variant = 'detailed',
  className = ''
}) => {

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 1) return '<1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'fixed-top':
        return 'fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700';
      case 'fixed-bottom':
        return 'fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700';
      case 'top':
        return 'w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700';
      case 'bottom':
        return 'w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700';
      default:
        return '';
    }
  };

  // Variante minimal - solo la barra
  if (variant === 'minimal') {
    return (
      <div className={`reading-progress-minimal ${getPositionClasses()} ${className}`}>
        <IonProgressBar
          value={readingProgress / 100}
          color="primary"
          className="h-1"
        />
      </div>
    );
  }

  // Variante compact - barra + percentuale
  if (variant === 'compact') {
    return (
      <div className={`reading-progress-compact ${getPositionClasses()} px-4 py-2 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <IonProgressBar
              value={readingProgress / 100}
              color="primary"
              className="h-2 rounded-full"
            />
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-12">
            {Math.round(readingProgress)}%
          </div>
          {isReading && (
            <IonIcon 
              icon={eyeOutline} 
              className="text-green-500 text-sm animate-pulse" 
            />
          )}
        </div>
      </div>
    );
  }

  // Variante detailed - completa
  return (
    <div className={`reading-progress-detailed ${getPositionClasses()} ${className}`}>
      <div className="px-4 py-3">
        {/* Barra di progresso principale */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso lettura
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round(readingProgress)}%
            </span>
          </div>
          <IonProgressBar
            value={readingProgress / 100}
            color="primary"
            className="h-2 rounded-full"
          />
        </div>

        {/* Informazioni dettagliate */}
        {showDetails && (
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Tempo trascorso */}
            {showTimeInfo && (
              <IonChip color="medium" className="text-xs">
                <IonIcon icon={timeOutline} />
                <IonLabel>{formatTime(timeElapsed)}</IonLabel>
              </IonChip>
            )}

            {/* Tempo stimato rimanente */}
            {showTimeInfo && estimatedRemainingTime > 0 && (
              <IonChip color="primary" className="text-xs">
                <IonIcon icon={bookOutline} />
                <IonLabel>{formatMinutes(estimatedRemainingTime)} left</IonLabel>
              </IonChip>
            )}

            {/* Conteggio parole */}
            {showWordCount && wordCount > 0 && (
              <IonChip color="tertiary" className="text-xs">
                <IonLabel>{wordCount.toLocaleString()} words</IonLabel>
              </IonChip>
            )}

            {/* Indicatore di lettura attiva */}
            {isReading && (
              <IonChip color="success" className="text-xs">
                <IonIcon icon={eyeOutline} />
                <IonLabel>Reading</IonLabel>
              </IonChip>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingProgressBar;