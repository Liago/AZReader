import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonButton,
  IonSkeletonText,
  IonChip,
  IonLabel,
} from '@ionic/react';
import {
  trendingUp,
  bonfire,
  flame,
  time,
  person,
  heart,
  chatbubble,
  bookmark,
  bookmarkOutline,
  share,
  eye,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Post } from '@store/slices/postsSlice';

export interface TrendingCardProps {
  article: Post;
  rank?: number;
  variant?: 'compact' | 'featured' | 'default';
  showRank?: boolean;
  showTrendingBadge?: boolean;
  showAuthor?: boolean;
  showEngagement?: boolean;
  onClick?: (article: Post) => void;
  onLike?: (articleId: string) => void;
  onBookmark?: (articleId: string) => void;
  onShare?: (article: Post) => void;
  className?: string;
}

export interface TrendingCardSkeletonProps {
  variant?: 'compact' | 'featured' | 'default';
}

// Utility functions
const formatTrendingScore = (score: number): string => {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
};

const getTrendingColor = (rank?: number): string => {
  if (!rank) return 'primary';
  if (rank <= 3) return 'danger';
  if (rank <= 10) return 'warning';
  return 'primary';
};

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Skeleton component
export const TrendingCardSkeleton: React.FC<TrendingCardSkeletonProps> = ({
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <IonCard className={`trending-card-skeleton ${variant}`}>
      <IonCardContent>
        {isFeatured && (
          <IonSkeletonText 
            animated 
            style={{ width: '100%', height: '200px', borderRadius: '12px', marginBottom: '16px' }} 
          />
        )}
        
        <div className={`skeleton-layout ${isCompact ? 'compact' : 'default'}`}>
          {!isCompact && !isFeatured && (
            <IonSkeletonText 
              animated 
              style={{ width: '100px', height: '100px', borderRadius: '12px' }} 
            />
          )}
          
          <div className="skeleton-content">
            <div className="skeleton-header">
              <IonSkeletonText animated style={{ width: '30px', height: '20px' }} />
              <IonSkeletonText animated style={{ width: '80px', height: '20px' }} />
            </div>
            
            <IonSkeletonText animated style={{ width: '85%', height: '24px' }} />
            <IonSkeletonText animated style={{ width: '60%', height: '16px', marginTop: '8px' }} />
            
            {!isCompact && (
              <>
                <IonSkeletonText animated style={{ width: '100%', height: '16px', marginTop: '8px' }} />
                <IonSkeletonText animated style={{ width: '70%', height: '16px', marginTop: '4px' }} />
              </>
            )}
            
            <div className="skeleton-footer" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <IonSkeletonText animated style={{ width: '60px', height: '24px' }} />
              <IonSkeletonText animated style={{ width: '40px', height: '24px' }} />
              <IonSkeletonText animated style={{ width: '40px', height: '24px' }} />
            </div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// Main TrendingCard component
const TrendingCard: React.FC<TrendingCardProps> = ({
  article,
  rank,
  variant = 'default',
  showRank = true,
  showTrendingBadge = true,
  showAuthor = true,
  showEngagement = true,
  onClick,
  onLike,
  onBookmark,
  onShare,
  className = '',
}) => {
  const history = useHistory();
  const [imageError, setImageError] = useState(false);

  // Computed values
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const domain = getDomain(article.url || '');
  const readingTime = article.estimated_read_time || 
    Math.ceil((article.content?.length || 0) / 1000);
  
  // Calculate trending score (simplified)
  const trendingScore = (article.like_count || 0) * 1.5 + (article.comment_count || 0) * 2;
  const trendingColor = getTrendingColor(rank);

  // Handlers
  const handleCardClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      history.push(`/article/${article.id}`);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(article.id);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(article.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(article);
    }
  };

  // Render rank badge
  const renderRankBadge = () => {
    if (!showRank || !rank) return null;

    return (
      <div className={`rank-badge rank-${rank <= 3 ? 'top' : rank <= 10 ? 'mid' : 'low'}`}>
        <span className="rank-number">#{rank}</span>
        {rank <= 3 && <IonIcon icon={flame} className="rank-icon" />}
      </div>
    );
  };

  // Render trending badge
  const renderTrendingBadge = () => {
    if (!showTrendingBadge) return null;

    return (
      <IonBadge color={trendingColor} className="trending-badge">
        <IonIcon icon={trendingUp} className="mr-1" />
        {formatTrendingScore(trendingScore)}
      </IonBadge>
    );
  };

  // Render article image
  const renderImage = () => {
    if (!article.image_url || imageError) {
      return (
        <div className={`placeholder-image ${variant}`}>
          <IonIcon icon={bonfire} className="placeholder-icon" />
        </div>
      );
    }

    if (isFeatured) {
      return (
        <div className="featured-image-container">
          <img 
            src={article.image_url} 
            alt={article.title}
            className="featured-image"
            onError={() => setImageError(true)}
          />
          <div className="featured-overlay">
            {renderRankBadge()}
            {renderTrendingBadge()}
          </div>
        </div>
      );
    }

    if (!isCompact) {
      return (
        <div className="article-image-container">
          <img 
            src={article.image_url} 
            alt={article.title}
            className="article-image"
            onError={() => setImageError(true)}
          />
          {renderRankBadge()}
        </div>
      );
    }

    return null;
  };

  // Render metadata
  const renderMetadata = () => (
    <div className="article-metadata">
      {showAuthor && article.author && (
        <IonChip color="medium" outline className="author-chip">
          <IonIcon icon={person} />
          <IonLabel>{article.author}</IonLabel>
        </IonChip>
      )}
      
      <IonChip color="medium" outline>
        <IonIcon icon={time} />
        <IonLabel>
          {formatDistanceToNow(parseISO(article.created_at || article.published_date || ''), { addSuffix: true })}
        </IonLabel>
      </IonChip>

      {readingTime > 0 && (
        <IonChip color="primary" outline>
          <IonIcon icon={eye} />
          <IonLabel>{readingTime} min</IonLabel>
        </IonChip>
      )}

      {domain && (
        <IonChip color="tertiary" outline>
          <IonLabel>{domain}</IonLabel>
        </IonChip>
      )}
    </div>
  );

  // Render engagement buttons
  const renderEngagement = () => {
    if (!showEngagement) return null;

    return (
      <div className="engagement-buttons">
        <IonButton 
          fill="clear" 
          size="small" 
          color="danger"
          onClick={handleLike}
        >
          <IonIcon icon={heart} slot="start" />
          {article.like_count || 0}
        </IonButton>

        <IonButton 
          fill="clear" 
          size="small" 
          color="medium"
          onClick={handleShare}
        >
          <IonIcon icon={chatbubble} slot="start" />
          {article.comment_count || 0}
        </IonButton>

        <IonButton 
          fill="clear" 
          size="small" 
          color={article.is_favorite ? 'warning' : 'medium'}
          onClick={handleBookmark}
        >
          <IonIcon icon={article.is_favorite ? bookmark : bookmarkOutline} />
        </IonButton>

        <IonButton 
          fill="clear" 
          size="small" 
          color="medium"
          onClick={handleShare}
        >
          <IonIcon icon={share} />
        </IonButton>
      </div>
    );
  };

  // Render tags
  const renderTags = () => {
    if (!article.tags || article.tags.length === 0) return null;

    return (
      <div className="article-tags">
        {article.tags.slice(0, 3).map((tag) => (
          <IonChip key={tag} color="secondary" outline className="tag-chip">
            {tag}
          </IonChip>
        ))}
        {article.tags.length > 3 && (
          <IonChip color="medium" outline className="tag-chip">
            +{article.tags.length - 3}
          </IonChip>
        )}
      </div>
    );
  };

  return (
    <IonCard 
      className={`trending-card ${variant} ${className}`}
      button
      onClick={handleCardClick}
    >
      <IonCardContent>
        {renderImage()}
        
        <div className={`card-content ${variant}`}>
          {/* Header with badges for compact/default variants */}
          {!isFeatured && (
            <div className="card-header">
              {renderRankBadge()}
              {renderTrendingBadge()}
            </div>
          )}

          {/* Title and excerpt */}
          <div className="text-content">
            <h3 className="article-title">
              {truncateText(
                article.title, 
                isFeatured ? 120 : isCompact ? 60 : 80
              )}
            </h3>

            {!isCompact && article.excerpt && (
              <p className="article-excerpt">
                {truncateText(
                  article.excerpt, 
                  isFeatured ? 200 : 120
                )}
              </p>
            )}
          </div>

          {/* Tags */}
          {!isCompact && renderTags()}

          {/* Metadata */}
          {renderMetadata()}

          {/* Engagement */}
          {renderEngagement()}
        </div>
      </IonCardContent>

      <style>{`
        .trending-card {
          margin: 8px 0;
          border-radius: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
        }

        .trending-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          border-color: var(--ion-color-primary);
        }

        .trending-card.featured {
          margin: 16px 0;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, var(--ion-color-secondary-tint) 100%);
        }

        .trending-card.featured .card-content {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          margin-top: -20px;
          position: relative;
          z-index: 2;
        }

        .trending-card.compact ion-card-content {
          padding: 12px;
        }

        .featured-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          margin-bottom: 16px;
          border-radius: 12px;
          overflow: hidden;
        }

        .featured-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.7) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 16px;
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-content.compact {
          gap: 8px;
        }

        .card-content.default {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 16px;
        }

        .article-image-container {
          position: relative;
          grid-row: 1 / -1;
          grid-column: 2;
        }

        .article-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
        }

        .placeholder-image {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-secondary-tint));
          color: white;
          border-radius: 12px;
        }

        .placeholder-image.default,
        .placeholder-image.compact {
          width: 100px;
          height: 100px;
        }

        .placeholder-image.featured {
          width: 100%;
          height: 200px;
          margin-bottom: 16px;
        }

        .placeholder-icon {
          font-size: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .rank-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 12px;
          color: white;
          min-width: 36px;
          justify-content: center;
        }

        .rank-badge.rank-top {
          background: linear-gradient(135deg, #ff6b6b, #ff8e53);
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        }

        .rank-badge.rank-mid {
          background: linear-gradient(135deg, #ffa726, #ffcc02);
          box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
        }

        .rank-badge.rank-low {
          background: linear-gradient(135deg, #42a5f5, #478ed1);
          box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
        }

        .rank-number {
          font-weight: 700;
        }

        .rank-icon {
          font-size: 14px;
        }

        .trending-badge {
          --background: var(--ion-color-primary);
          --color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .text-content {
          flex: 1;
        }

        .article-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--ion-color-dark);
        }

        .trending-card.compact .article-title {
          font-size: 16px;
        }

        .trending-card.featured .article-title {
          font-size: 24px;
          font-weight: 700;
        }

        .article-excerpt {
          margin: 8px 0 0 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--ion-color-medium-shade);
        }

        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0;
        }

        .tag-chip {
          font-size: 11px;
          height: 24px;
          --background: var(--ion-color-light);
        }

        .article-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 8px 0;
        }

        .article-metadata ion-chip {
          --background: var(--ion-color-light);
          font-size: 11px;
          height: 24px;
        }

        .author-chip {
          --background: var(--ion-color-primary-tint);
          --color: var(--ion-color-primary-shade);
          font-weight: 600;
        }

        .engagement-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--ion-color-light);
        }

        .engagement-buttons ion-button {
          --padding-start: 8px;
          --padding-end: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .trending-card-skeleton {
          margin: 8px 0;
        }

        .skeleton-layout.default {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 16px;
        }

        .skeleton-layout.compact {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .skeleton-footer {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        @media (max-width: 576px) {
          .card-content.default {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .article-image-container {
            grid-row: auto;
            grid-column: 1;
            justify-self: center;
          }

          .article-metadata {
            justify-content: center;
            margin: 12px 0;
          }

          .engagement-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </IonCard>
  );
};

export default TrendingCard;