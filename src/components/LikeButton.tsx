import React from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useLikes } from '@hooks/useLikes';

interface LikeButtonProps {
  articleId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  animated?: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  articleId,
  initialLikeCount = 0,
  initialIsLiked = false,
  size = 'medium',
  showCount = true,
  animated = true,
  onLikeChange,
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const { likeState, toggleLike } = useLikes({
    articleId,
    initialLikeCount,
    initialIsLiked,
    onLikeChange,
    enableOptimisticUpdates: true,
    enableToasts: true,
  });

  const { isLiked, likeCount, isLoading } = likeState;

  // Size configurations
  const sizeConfig = {
    small: {
      icon: 'w-4 h-4',
      text: 'text-xs',
      button: 'px-2 py-1',
      gap: 'gap-1',
    },
    medium: {
      icon: 'w-5 h-5',
      text: 'text-sm',
      button: 'px-3 py-2',
      gap: 'gap-2',
    },
    large: {
      icon: 'w-6 h-6',
      text: 'text-base',
      button: 'px-4 py-2',
      gap: 'gap-2',
    },
  };

  const config = sizeConfig[size];

  // Handle like/unlike action with animation
  const handleLikeToggle = async () => {
    if (isLoading) return;

    // Trigger animation
    if (animated) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    await toggleLike();
  };

  // Format like count display
  const formatLikeCount = (count: number): string => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`
        flex items-center justify-center ${config.gap} ${config.button}
        rounded-full transition-all duration-200 ease-in-out
        ${isLiked 
          ? 'bg-red-50 hover:bg-red-100 text-red-600' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-500'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${animated && isAnimating ? 'animate-bounce' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={isLiked ? 'Unlike article' : 'Like article'}
    >
      {isLoading ? (
        <IonSpinner name="dots" className={`${config.icon} text-gray-400`} />
      ) : (
        <>
          <div className={`relative ${isAnimating && animated ? 'animate-ping' : ''}`}>
            <IonIcon
              icon={isLiked ? heart : heartOutline}
              className={`
                ${config.icon} transition-colors duration-200
                ${isLiked ? 'text-red-500' : 'text-current'}
              `}
            />
            {/* Pulse animation overlay for liked state */}
            {isLiked && animated && isAnimating && (
              <IonIcon
                icon={heart}
                className={`
                  ${config.icon} absolute inset-0 text-red-500 animate-ping opacity-75
                `}
              />
            )}
          </div>
          
          {showCount && (
            <span className={`${config.text} font-medium transition-colors duration-200`}>
              {formatLikeCount(likeCount)}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default LikeButton;