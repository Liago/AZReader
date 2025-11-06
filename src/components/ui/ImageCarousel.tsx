import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import './carousel-styles.css';

export interface CarouselImage {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
  credits?: string;
}

export interface ImageCarouselProps {
  images: CarouselImage[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  showOverlay?: boolean;
  enableZoom?: boolean;
  enableHaptics?: boolean;
  onImageChange?: (index: number, image: CarouselImage) => void;
  onImageClick?: (index: number, image: CarouselImage) => void;
  className?: string;
  height?: string;
  borderRadius?: string;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isDragging: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoplay = false,
  autoplayInterval = 5000,
  showDots = true,
  showArrows = true,
  showOverlay = true,
  enableZoom = false,
  enableHaptics = true,
  onImageChange,
  onImageClick,
  className = '',
  height = '200px',
  borderRadius = '12px'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isDragging: false
  });
  const autoplayTimer = useRef<NodeJS.Timeout>();
  const overlayTimer = useRef<NodeJS.Timeout>();

  // Thresholds for swipe detection
  const SWIPE_THRESHOLD = 50; // minimum distance for swipe
  const SWIPE_VELOCITY_THRESHOLD = 0.3; // minimum velocity (px/ms)
  const MAX_VERTICAL_DRIFT = 100; // max vertical movement for horizontal swipe

  // Memoized values
  const hasImages = useMemo(() => images && images.length > 0, [images]);
  const currentImage = useMemo(() => hasImages ? images[currentIndex] : null, [images, currentIndex, hasImages]);
  const isNative = useMemo(() => Capacitor.isNativePlatform(), []);

  // Haptic feedback function
  const triggerHaptic = useCallback(async () => {
    if (enableHaptics && isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    }
  }, [enableHaptics, isNative]);

  // Navigation functions
  const goToNext = useCallback(async () => {
    if (!hasImages || isTransitioning) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    const image = images[newIndex];
    if (image) {
      onImageChange?.(newIndex, image);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, images, hasImages, isTransitioning, triggerHaptic, onImageChange]);

  const goToPrevious = useCallback(async () => {
    if (!hasImages || isTransitioning) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    const image = images[newIndex];
    if (image) {
      onImageChange?.(newIndex, image);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, images, hasImages, isTransitioning, triggerHaptic, onImageChange]);

  const goToIndex = useCallback(async (index: number) => {
    if (!hasImages || isTransitioning || index === currentIndex) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    setCurrentIndex(index);
    const image = images[index];
    if (image) {
      onImageChange?.(index, image);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, images, hasImages, isTransitioning, triggerHaptic, onImageChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!hasImages || images.length <= 1) return;

    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    touchState.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      startTime: Date.now(),
      isDragging: false
    };

    // Prevent autoplay during interaction
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
    }
  }, [hasImages, images]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!hasImages || images.length <= 1) return;

    const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

    touchState.current.currentX = clientX;
    touchState.current.currentY = clientY;
    touchState.current.isDragging = true;

    // Calculate movement
    const deltaX = clientX - touchState.current.startX;
    const deltaY = Math.abs(clientY - touchState.current.startY);

    // Prevent vertical scroll if horizontal swipe is detected
    if (Math.abs(deltaX) > 10 && deltaY < MAX_VERTICAL_DRIFT) {
      e.preventDefault();
    }
  }, [hasImages, images]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!hasImages || images.length <= 1 || !touchState.current.isDragging) return;

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = Math.abs(touchState.current.currentY - touchState.current.startY);
    const deltaTime = Date.now() - touchState.current.startTime;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Check if it's a valid horizontal swipe
    const isHorizontalSwipe = deltaY < MAX_VERTICAL_DRIFT;
    const hasMinDistance = Math.abs(deltaX) > SWIPE_THRESHOLD;
    const hasMinVelocity = velocity > SWIPE_VELOCITY_THRESHOLD;

    if (isHorizontalSwipe && (hasMinDistance || hasMinVelocity)) {
      if (deltaX > 0) {
        goToPrevious(); // Swipe right = previous
      } else {
        goToNext(); // Swipe left = next
      }
    }

    // Reset touch state
    touchState.current.isDragging = false;
    
    // Restart autoplay
    if (autoplay) {
      startAutoplay();
    }
  }, [hasImages, images, goToNext, goToPrevious, autoplay]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!hasImages || images.length <= 1) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case 'Home':
        e.preventDefault();
        goToIndex(0);
        break;
      case 'End':
        e.preventDefault();
        goToIndex(images.length - 1);
        break;
    }
  }, [hasImages, images, goToPrevious, goToNext, goToIndex]);

  // Autoplay functionality
  const startAutoplay = useCallback(() => {
    if (!autoplay || !hasImages || images.length <= 1) return;
    
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
    }
    
    autoplayTimer.current = setTimeout(() => {
      goToNext();
    }, autoplayInterval);
  }, [autoplay, hasImages, images, autoplayInterval, goToNext]);

  // Image click handler
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (touchState.current.isDragging) return;
    
    if (onImageClick && currentImage) {
      onImageClick(currentIndex, currentImage);
    }
    
    if (enableZoom) {
      setIsZoomed(!isZoomed);
    }
  }, [onImageClick, currentImage, currentIndex, enableZoom, isZoomed]);

  // Overlay management
  const showOverlayTemporarily = useCallback(() => {
    if (!showOverlay || !currentImage?.caption) return;
    
    setOverlayVisible(true);
    
    if (overlayTimer.current) {
      clearTimeout(overlayTimer.current);
    }
    
    overlayTimer.current = setTimeout(() => {
      setOverlayVisible(false);
    }, 3000);
  }, [showOverlay, currentImage]);

  // Effects
  useEffect(() => {
    if (autoplay && hasImages && images.length > 1) {
      startAutoplay();
    }
    
    return () => {
      if (autoplayTimer.current) {
        clearTimeout(autoplayTimer.current);
      }
    };
  }, [autoplay, hasImages, images, startAutoplay]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (overlayTimer.current) {
      clearTimeout(overlayTimer.current);
    }
  }, []);

  // Don't render if no images
  if (!hasImages) {
    return (
      <div className={`image-carousel empty ${className}`}>
        <div className="no-images">No images available</div>
      </div>
    );
  }

  return (
    <div 
      className={`image-carousel ${className}`}
      style={{ height, borderRadius }}
    >
      <div 
        ref={carouselRef}
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={showOverlayTemporarily}
      >
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitioning ? 'transform 0.3s ease-out' : 'none'
          }}
        >
          {images.map((image, index) => (
            <div 
              key={image.id}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <img
                src={image.src}
                alt={image.alt || `Image ${index + 1}`}
                className={`carousel-image ${isZoomed ? 'zoomed' : ''}`}
                onClick={handleImageClick}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.startsWith('data:')) {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }
                }}
                draggable={false}
              />
              
              {/* Image Overlay */}
              {showOverlay && image.caption && overlayVisible && index === currentIndex && (
                <div className="image-overlay">
                  <div className="overlay-content">
                    {image.caption && <p className="image-caption">{image.caption}</p>}
                    {image.credits && <p className="image-credits">{image.credits}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && images.length > 1 && (
          <>
            <IonButton
              className="carousel-arrow prev"
              fill="clear"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={isTransitioning}
            >
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
            
            <IonButton
              className="carousel-arrow next"
              fill="clear"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={isTransitioning}
            >
              <IonIcon icon={chevronForwardOutline} />
            </IonButton>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
              disabled={isTransitioning}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default ImageCarousel;