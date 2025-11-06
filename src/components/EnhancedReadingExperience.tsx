import React, { useRef, useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import ReadingProgressBar from './ReadingProgressBar';
import ArticleNavigation from './ArticleNavigation';
import { useReadingProgress } from '@hooks/useReadingProgress';
import { useReadingKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { 
  saveScrollPosition, 
  clearScrollPosition,
  selectScrollPositionByArticleId 
} from '@store/slices/appSlice';

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
  persistScrollPosition?: boolean;
  
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
  persistScrollPosition = true,
  progressBarVariant = 'detailed',
  navigationVariant = 'floating',
  className = '',
  children
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);

  // Redux hooks
  const dispatch = useAppDispatch();
  const savedScrollPosition = useAppSelector(state => 
    selectScrollPositionByArticleId(state, article.id)
  );

  // Hook per il tracking del progresso di lettura
  const readingProgress = useReadingProgress(contentRef.current, {
    updateInterval: 1000,
    averageReadingSpeed: 200
  });

  // Save scroll position to Redux when position changes
  useEffect(() => {
    if (!persistScrollPosition || !readingProgress.isTracking) return;

    const saveInterval = setInterval(() => {
      if (readingProgress.scrollProgress > 0 || readingProgress.scrollPosition > 0) {
        dispatch(saveScrollPosition({
          articleId: article.id,
          scrollTop: readingProgress.scrollPosition,
          scrollProgress: readingProgress.scrollProgress,
          readingProgress: readingProgress.readingProgress,
          contentHeight: readingProgress.contentHeight,
        }));
      }
    }, 2000); // Save every 2 seconds

    return () => clearInterval(saveInterval);
  }, [
    dispatch,
    article.id,
    persistScrollPosition,
    readingProgress.isTracking,
    readingProgress.scrollPosition,
    readingProgress.scrollProgress,
    readingProgress.readingProgress,
    readingProgress.contentHeight,
  ]);

  // Restore scroll position when component mounts
  const restoreScrollPosition = () => {
    if (!savedScrollPosition || hasRestoredPosition || !contentRef.current) return;

    const scrollContainer = window;
    const targetScrollTop = savedScrollPosition.scrollTop;

    // Use smooth scrolling to restore position
    scrollContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });

    setHasRestoredPosition(true);
    
    // Show toast notification about restored position
    if (savedScrollPosition.scrollProgress > 5) { // Only show if meaningful progress
      showInfoToast(`Resumed reading at ${Math.round(savedScrollPosition.scrollProgress)}%`);
    }
  };

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
        
        // Restore scroll position after tracking starts
        if (persistScrollPosition && savedScrollPosition && !hasRestoredPosition) {
          setTimeout(() => {
            restoreScrollPosition();
          }, 300); // Small delay to ensure content is rendered
        }
      }, 500);
      
      return () => {
        clearTimeout(timer);
        readingProgress.stopTracking();
      };
    }
  }, [article.id, autoStartTracking, readingProgress, persistScrollPosition, savedScrollPosition, hasRestoredPosition]);

  // Reset tracking quando cambia articolo
  useEffect(() => {
    readingProgress.resetTracking();
    setHasRestoredPosition(false); // Reset position restoration flag for new article
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
          savedScrollProgress={savedScrollPosition?.scrollProgress}
          showSavedPosition={persistScrollPosition && !!savedScrollPosition}
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