import React, { useRef, useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import ReadingProgressBar from './ReadingProgressBar';
import ArticleNavigation from './ArticleNavigation';
import { useReadingProgress } from '@hooks/useReadingProgress';
import { useReadingKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';

interface Article {
  id: string;
  title: string;
  content: string;
  url?: string;
  estimatedReadingTime?: number;
  tags?: string[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  publishedAt?: string;
}

interface EnhancedReadingExperienceProps {
  // Articolo corrente
  article: Article;
  
  // Navigazione
  previousArticle?: Article | null;
  nextArticle?: Article | null;
  
  // Callbacks
  onPrevious?: () => void;
  onNext?: () => void;
  onGoToList?: () => void;
  onToggleBookmark?: () => void;
  onToggleLike?: () => void;
  onToggleSettings?: () => void;
  onFocusSearch?: () => void;
  
  // Configurazione
  showProgressBar?: boolean;
  showNavigation?: boolean;
  enableKeyboardShortcuts?: boolean;
  autoStartTracking?: boolean;
  
  // UI
  progressBarVariant?: 'minimal' | 'detailed' | 'compact';
  navigationVariant?: 'floating' | 'inline' | 'compact';
  className?: string;
  children?: React.ReactNode;
}

const EnhancedReadingExperience: React.FC<EnhancedReadingExperienceProps> = ({
  article,
  previousArticle,
  nextArticle,
  onPrevious,
  onNext,
  onGoToList,
  onToggleBookmark,
  onToggleLike,
  onToggleSettings,
  onFocusSearch,
  showProgressBar = true,
  showNavigation = true,
  enableKeyboardShortcuts = true,
  autoStartTracking = true,
  progressBarVariant = 'detailed',
  navigationVariant = 'floating',
  className = '',
  children
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Hook per il tracking del progresso di lettura
  const readingProgress = useReadingProgress(contentRef.current, {
    updateInterval: 1000,
    averageReadingSpeed: 200
  });

  // Mostra un toast informativo
  const showInfoToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // Handler per i keyboard shortcuts
  const handlePrevious = () => {
    if (!previousArticle || isNavigating) return;
    setIsNavigating(true);
    showInfoToast('Articolo precedente...');
    onPrevious?.();
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleNext = () => {
    if (!nextArticle || isNavigating) return;
    setIsNavigating(true);
    showInfoToast('Articolo successivo...');
    onNext?.();
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleToggleBookmark = () => {
    onToggleBookmark?.();
    showInfoToast(article.isBookmarked ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti');
  };

  const handleToggleLike = () => {
    onToggleLike?.();
    showInfoToast(article.isLiked ? 'Like rimosso' : 'Like aggiunto');
  };

  const handleToggleSettings = () => {
    onToggleSettings?.();
    showInfoToast('Impostazioni lettura');
  };

  const handleGoToList = () => {
    onGoToList?.();
  };

  const handleFocusSearch = () => {
    onFocusSearch?.();
    showInfoToast('Focus search');
  };

  // Configurazione keyboard shortcuts
  useReadingKeyboardShortcuts(
    {
      onPrevious: handlePrevious,
      onNext: handleNext,
      onToggleBookmark: handleToggleBookmark,
      onToggleLike: handleToggleLike,
      onToggleSettings: handleToggleSettings,
      onGoToList: handleGoToList,
      onFocusSearch: handleFocusSearch,
    },
    {
      disabled: !enableKeyboardShortcuts
    }
  );

  // Avvia automaticamente il tracking quando il componente monta
  useEffect(() => {
    if (autoStartTracking && contentRef.current) {
      // Piccolo ritardo per permettere al contenuto di renderizzarsi
      const timer = setTimeout(() => {
        readingProgress.startTracking();
      }, 500);
      
      return () => {
        clearTimeout(timer);
        readingProgress.stopTracking();
      };
    }
  }, [article.id, autoStartTracking, readingProgress]);

  // Reset tracking quando cambia articolo
  useEffect(() => {
    readingProgress.resetTracking();
  }, [article.id, readingProgress]);

  return (
    <div className={`enhanced-reading-experience ${className}`}>
      {/* Barra di progresso */}
      {showProgressBar && readingProgress.isTracking && (
        <ReadingProgressBar
          scrollProgress={readingProgress.scrollProgress}
          readingProgress={readingProgress.readingProgress}
          timeElapsed={readingProgress.timeElapsed}
          estimatedReadingTime={readingProgress.estimatedReadingTime}
          estimatedRemainingTime={readingProgress.estimatedRemainingTime}
          wordCount={readingProgress.wordCount}
          isReading={readingProgress.isReading}
          variant={progressBarVariant}
          position="fixed-top"
          showDetails={progressBarVariant !== 'minimal'}
          showTimeInfo={progressBarVariant === 'detailed'}
          showWordCount={progressBarVariant === 'detailed'}
        />
      )}

      {/* Contenuto dell'articolo */}
      <div 
        ref={contentRef}
        className={`article-content ${showProgressBar ? 'pt-16' : ''} ${showNavigation ? 'pb-20' : ''}`}
        style={{
          // Assicura che il contenuto sia scrollabile
          minHeight: '100vh',
          paddingTop: showProgressBar && progressBarVariant !== 'minimal' ? '4rem' : showProgressBar ? '0.5rem' : '0',
          paddingBottom: showNavigation ? '5rem' : '2rem'
        }}
      >
        {children || (
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }}
            className="prose prose-lg max-w-none"
          />
        )}
      </div>

      {/* Navigazione articoli */}
      {showNavigation && (
        <ArticleNavigation
          currentArticle={article}
          previousArticle={previousArticle}
          nextArticle={nextArticle}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onGoToList={handleGoToList}
          variant={navigationVariant}
          position="fixed-bottom"
          showArticleInfo={navigationVariant !== 'compact'}
          showKeyboardHints={enableKeyboardShortcuts}
          isLoading={isNavigating}
          disabled={isNavigating}
        />
      )}

      {/* Toast per feedback */}
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        position="middle"
        onDidDismiss={() => setShowToast(false)}
        className="reading-toast"
      />
    </div>
  );
};

export default EnhancedReadingExperience;