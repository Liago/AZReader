import React, { useEffect, useCallback } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useImageCarousel } from '@hooks/useImageCarousel';
import './carousel-styles.css';

export interface CarouselImage {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
  credits?: string;
}

export interface SwipeableImageCarouselProps {
  images: CarouselImage[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  showOverlay?: boolean;
  enableHaptics?: boolean;
  onImageChange?: (index: number, image: CarouselImage) => void;
  onImageClick?: (index: number, image: CarouselImage) => void;
  className?: string;
  height?: string;
  borderRadius?: string;
}

const SwipeableImageCarousel: React.FC<SwipeableImageCarouselProps> = ({
  images,
  autoplay = false,
  autoplayInterval = 5000,
  showDots = true,
  showArrows = true,
  showOverlay = false,
  enableHaptics = true,
  onImageChange,
  onImageClick,
  className = '',
  height = '200px',
  borderRadius = '12px'
}) => {
  const {
    currentIndex,
    isTransitioning,
    hasImages,
    currentImage,
    isDragging,
    goToNext,
    goToPrevious,
    goToIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown
  } = useImageCarousel({
    images,
    autoplay,
    autoplayInterval,
    enableHaptics,
    onImageChange: (index) => {
      if (onImageChange && images[index]) {
        onImageChange(index, images[index]!);
      }
    }
  });

  // Image click handler
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't trigger click if user is dragging
    if (isDragging) {
      return;
    }
    
    if (onImageClick && currentImage) {
      onImageClick(currentIndex, currentImage);
    }
  }, [onImageClick, currentImage, currentIndex, isDragging]);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Don't render if no images
  if (!hasImages) {
    return (
      <div className={`swipeable-carousel empty ${className}`} style={{ height, borderRadius }}>
        <div className="no-images">No images available</div>
      </div>
    );
  }

  return (
    <div 
      className={`swipeable-carousel ${className}`}
      style={{ height, borderRadius }}
    >
      <div 
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
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
                className="carousel-image"
                onClick={handleImageClick}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.startsWith('data:')) {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }
                }}
                draggable={false}
                loading="lazy"
              />
              
              {/* Caption Overlay */}
              {showOverlay && image.caption && index === currentIndex && (
                <div className="image-overlay">
                  <div className="overlay-content">
                    <p className="image-caption">{image.caption}</p>
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
              size="small"
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
              size="small"
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

export default SwipeableImageCarousel;