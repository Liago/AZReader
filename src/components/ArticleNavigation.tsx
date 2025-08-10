import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonChip,
  IonSpinner
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  listOutline,
  timeOutline,
  bookmarkOutline,
  heartOutline
} from 'ionicons/icons';

interface Article {
  id: string;
  title: string;
  url?: string;
  estimatedReadingTime?: number;
  tags?: string[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  publishedAt?: string;
}

interface ArticleNavigationProps {
  // Articoli
  currentArticle?: Article;
  previousArticle?: Article | null;
  nextArticle?: Article | null;
  
  // Callbacks di navigazione
  onPrevious?: () => void;
  onNext?: () => void;
  onGoToList?: () => void;
  
  // Stato
  isLoading?: boolean;
  disabled?: boolean;
  
  // Configurazione UI
  variant?: 'floating' | 'inline' | 'compact';
  position?: 'bottom' | 'top' | 'fixed-bottom' | 'fixed-top';
  showArticleInfo?: boolean;
  showKeyboardHints?: boolean;
  className?: string;
}

const ArticleNavigation: React.FC<ArticleNavigationProps> = ({
  currentArticle,
  previousArticle,
  nextArticle,
  onPrevious,
  onNext,
  onGoToList,
  isLoading = false,
  disabled = false,
  variant = 'floating',
  position = 'fixed-bottom',
  showArticleInfo = true,
  showKeyboardHints = false,
  className = ''
}) => {

  const [showControls, setShowControls] = useState(true);

  // Auto-hide dei controlli dopo inattività (solo per variante floating)
  useEffect(() => {
    if (variant !== 'floating') return;

    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      setShowControls(true);
      timeoutId = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Eventi per rilevare attività
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [variant]);

  const formatReadingTime = (minutes?: number): string => {
    if (!minutes) return '';
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'fixed-bottom':
        return 'fixed bottom-0 left-0 right-0 z-50';
      case 'fixed-top':
        return 'fixed top-0 left-0 right-0 z-50';
      case 'bottom':
        return 'w-full';
      case 'top':
        return 'w-full';
      default:
        return '';
    }
  };

  // Variante compact - solo pulsanti
  if (variant === 'compact') {
    return (
      <div className={`article-navigation-compact flex items-center justify-center gap-2 p-3 ${getPositionClasses()} ${className}`}>
        <IonButton
          fill="outline"
          size="small"
          onClick={onPrevious}
          disabled={!previousArticle || disabled || isLoading}
        >
          <IonIcon icon={chevronBackOutline} slot="start" />
          Previous
        </IonButton>
        
        <IonButton
          fill="outline"
          size="small"
          onClick={onGoToList}
          disabled={disabled}
        >
          <IonIcon icon={listOutline} />
        </IonButton>
        
        <IonButton
          fill="outline"
          size="small"
          onClick={onNext}
          disabled={!nextArticle || disabled || isLoading}
        >
          Next
          <IonIcon icon={chevronForwardOutline} slot="end" />
        </IonButton>
        
        {showKeyboardHints && (
          <div className="ml-4 text-xs text-gray-500">
            ← → keys
          </div>
        )}
      </div>
    );
  }

  // Variante inline
  if (variant === 'inline') {
    return (
      <div className={`article-navigation-inline space-y-4 p-4 ${className}`}>
        {/* Articolo precedente */}
        {previousArticle && (
          <IonCard 
            button 
            onClick={onPrevious}
            disabled={disabled || isLoading}
            className="m-0"
          >
            <IonCardContent className="flex items-center gap-3 py-3">
              <IonIcon icon={chevronBackOutline} className="text-2xl text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">Articolo precedente</div>
                <div className="font-medium text-sm line-clamp-2">
                  {previousArticle.title}
                </div>
                {showArticleInfo && previousArticle.estimatedReadingTime && (
                  <div className="flex items-center gap-2 mt-2">
                    <IonChip color="medium" className="text-xs">
                      <IonIcon icon={timeOutline} />
                      <IonLabel>{formatReadingTime(previousArticle.estimatedReadingTime)}</IonLabel>
                    </IonChip>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Link alla lista */}
        <div className="text-center">
          <IonButton
            fill="outline"
            size="small"
            onClick={onGoToList}
            disabled={disabled}
          >
            <IonIcon icon={listOutline} slot="start" />
            Torna alla lista
          </IonButton>
        </div>

        {/* Articolo successivo */}
        {nextArticle && (
          <IonCard 
            button 
            onClick={onNext}
            disabled={disabled || isLoading}
            className="m-0"
          >
            <IonCardContent className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">Articolo successivo</div>
                <div className="font-medium text-sm line-clamp-2">
                  {nextArticle.title}
                </div>
                {showArticleInfo && nextArticle.estimatedReadingTime && (
                  <div className="flex items-center gap-2 mt-2">
                    <IonChip color="medium" className="text-xs">
                      <IonIcon icon={timeOutline} />
                      <IonLabel>{formatReadingTime(nextArticle.estimatedReadingTime)}</IonLabel>
                    </IonChip>
                  </div>
                )}
              </div>
              <IonIcon icon={chevronForwardOutline} className="text-2xl text-primary" />
            </IonCardContent>
          </IonCard>
        )}
      </div>
    );
  }

  // Variante floating (default)
  return (
    <div className={`article-navigation-floating ${getPositionClasses()} ${className}`}>
      <div 
        className={`
          transition-all duration-300 transform
          ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
        `}
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Controlli sinistra */}
            <div className="flex items-center gap-2">
              <IonButton
                fill="clear"
                size="small"
                onClick={onPrevious}
                disabled={!previousArticle || disabled || isLoading}
                className="relative"
              >
                <IonIcon icon={chevronBackOutline} />
                {showKeyboardHints && (
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    ←
                  </span>
                )}
              </IonButton>
              
              {previousArticle && showArticleInfo && (
                <div className="hidden sm:block max-w-48 truncate text-sm text-gray-600">
                  {previousArticle.title}
                </div>
              )}
            </div>

            {/* Centro - info articolo corrente */}
            <div className="flex items-center gap-3">
              <IonButton
                fill="clear"
                size="small"
                onClick={onGoToList}
                disabled={disabled}
              >
                <IonIcon icon={listOutline} />
              </IonButton>
              
              {isLoading && <IonSpinner name="dots" />}
            </div>

            {/* Controlli destra */}
            <div className="flex items-center gap-2">
              {nextArticle && showArticleInfo && (
                <div className="hidden sm:block max-w-48 truncate text-sm text-gray-600 text-right">
                  {nextArticle.title}
                </div>
              )}
              
              <IonButton
                fill="clear"
                size="small"
                onClick={onNext}
                disabled={!nextArticle || disabled || isLoading}
                className="relative"
              >
                <IonIcon icon={chevronForwardOutline} />
                {showKeyboardHints && (
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    →
                  </span>
                )}
              </IonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleNavigation;