import { useState, useRef, useCallback, useEffect } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export interface UseImageCarouselOptions {
  images: Array<{ id: string; src: string; alt?: string; caption?: string; credits?: string }>;
  autoplay?: boolean;
  autoplayInterval?: number;
  enableHaptics?: boolean;
  swipeThreshold?: number;
  velocityThreshold?: number;
  onImageChange?: (index: number) => void;
}

export interface UseImageCarouselReturn {
  currentIndex: number;
  isTransitioning: boolean;
  hasImages: boolean;
  currentImage: any;
  isDragging: boolean;
  
  // Navigation functions
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  
  // Touch handlers
  handleTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  
  // Autoplay controls
  startAutoplay: () => void;
  stopAutoplay: () => void;
  
  // Keyboard handler
  handleKeyDown: (e: KeyboardEvent) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isDragging: boolean;
}

export const useImageCarousel = ({
  images,
  autoplay = false,
  autoplayInterval = 5000,
  enableHaptics = true,
  swipeThreshold = 50,
  velocityThreshold = 0.3,
  onImageChange
}: UseImageCarouselOptions): UseImageCarouselReturn => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isDragging: false
  });
  
  const autoplayTimer = useRef<NodeJS.Timeout>();
  
  // Constants
  const MAX_VERTICAL_DRIFT = 100;
  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;
  const isNative = Capacitor.isNativePlatform();

  // Haptic feedback
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
    if (!hasImages || isTransitioning || images.length <= 1) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, images, hasImages, isTransitioning, triggerHaptic, onImageChange]);

  const goToPrevious = useCallback(async () => {
    if (!hasImages || isTransitioning || images.length <= 1) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onImageChange?.(newIndex);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, images, hasImages, isTransitioning, triggerHaptic, onImageChange]);

  const goToIndex = useCallback(async (index: number) => {
    if (!hasImages || isTransitioning || index === currentIndex || index < 0 || index >= images.length) return;
    
    await triggerHaptic();
    setIsTransitioning(true);
    
    setCurrentIndex(index);
    onImageChange?.(index);
    
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

    // Stop autoplay during interaction
    stopAutoplay();
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
    if (!hasImages || images.length <= 1 || !touchState.current.isDragging) {
      if (autoplay && hasImages && images.length > 1) {
        startAutoplay();
      }
      return;
    }

    const deltaX = touchState.current.currentX - touchState.current.startX;
    const deltaY = Math.abs(touchState.current.currentY - touchState.current.startY);
    const deltaTime = Date.now() - touchState.current.startTime;
    const velocity = Math.abs(deltaX) / Math.max(deltaTime, 1); // Prevent division by zero

    // Check if it's a valid horizontal swipe
    const isHorizontalSwipe = deltaY < MAX_VERTICAL_DRIFT;
    const hasMinDistance = Math.abs(deltaX) > swipeThreshold;
    const hasMinVelocity = velocity > velocityThreshold;

    if (isHorizontalSwipe && (hasMinDistance || hasMinVelocity)) {
      if (deltaX > 0) {
        goToPrevious(); // Swipe right = previous
      } else {
        goToNext(); // Swipe left = next
      }
    } else if (autoplay && hasImages && images.length > 1) {
      // Restart autoplay if no valid swipe occurred
      startAutoplay();
    }

    // Reset touch state
    touchState.current.isDragging = false;
  }, [hasImages, images, goToNext, goToPrevious, autoplay, swipeThreshold, velocityThreshold]);

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
      case 'Escape':
        e.preventDefault();
        stopAutoplay();
        break;
    }
  }, [hasImages, images, goToPrevious, goToNext, goToIndex]);

  // Autoplay controls
  const startAutoplay = useCallback(() => {
    if (!autoplay || !hasImages || images.length <= 1) return;
    
    stopAutoplay(); // Clear existing timer
    
    autoplayTimer.current = setTimeout(() => {
      goToNext();
    }, autoplayInterval);
  }, [autoplay, hasImages, images, autoplayInterval, goToNext]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
      autoplayTimer.current = undefined;
    }
  }, []);

  // Effects
  useEffect(() => {
    if (autoplay && hasImages && images.length > 1) {
      startAutoplay();
    }
    
    return () => {
      stopAutoplay();
    };
  }, [autoplay, hasImages, images, startAutoplay, stopAutoplay]);

  // Reset index if images change
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(0);
      onImageChange?.(0);
    }
  }, [images, currentIndex, onImageChange]);

  return {
    currentIndex,
    isTransitioning,
    hasImages,
    currentImage,
    isDragging: touchState.current.isDragging,
    
    // Navigation functions
    goToNext,
    goToPrevious,
    goToIndex,
    
    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Autoplay controls
    startAutoplay,
    stopAutoplay,
    
    // Keyboard handler
    handleKeyDown
  };
};