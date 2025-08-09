import React, { useState, useCallback } from 'react';
import {
	IonCard,
	IonCardContent,
	IonIcon,
	IonChip,
	IonLabel,
	IonButton,
	IonItem,
	IonSkeletonText,
	IonActionSheet,
	IonAlert
} from '@ionic/react';
import {
	timeOutline,
	personOutline,
	calendarOutline,
	bookmarkOutline,
	bookmark,
	shareOutline,
	ellipsisVerticalOutline,
	eyeOutline,
	trashOutline,
	heartOutline,
	heart,
	chatbubbleOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import type { Post } from '@store/slices/postsSlice';
import { useCustomToast } from '@hooks/useIonToast';
import { usePostLikes } from '@hooks/usePostLikes';
import { usePostComments } from '@hooks/usePostComments';

// Types
export interface ArticleCardProps {
	article: Post;
	session: Session | null;
	variant?: 'default' | 'compact' | 'featured';
	showActions?: boolean;
	onDelete?: (articleId: string) => Promise<void>;
	onToggleFavorite?: (articleId: string) => Promise<void>;
	className?: string;
}

interface ArticleCardSkeletonProps {
	variant?: 'default' | 'compact' | 'featured';
}

// Utility functions
const formatDate = (dateString: string | null): string => {
	if (!dateString) return 'Unknown date';
	try {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	} catch {
		return 'Invalid date';
	}
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

// Skeleton loader component
export const ArticleCardSkeleton: React.FC<ArticleCardSkeletonProps> = ({ 
	variant = 'default' 
}) => {
	const isCompact = variant === 'compact';
	const isFeatured = variant === 'featured';

	return (
		<IonCard className={`article-card-skeleton ${variant}`}>
			<IonCardContent>
				{isFeatured && (
					<IonSkeletonText 
						animated 
						style={{ width: '100%', height: '200px', borderRadius: '12px', marginBottom: '16px' }} 
					/>
				)}
				
				<div className={`skeleton-content ${isCompact ? 'compact-layout' : 'default-layout'}`}>
					{!isCompact && !isFeatured && (
						<IonSkeletonText 
							animated 
							style={{ width: '80px', height: '80px', borderRadius: '12px' }} 
						/>
					)}
					
					<div className="skeleton-text">
						<IonSkeletonText animated style={{ width: '70%', height: '20px' }} />
						<IonSkeletonText animated style={{ width: '40%', height: '16px', marginTop: '8px' }} />
						{!isCompact && (
							<>
								<IonSkeletonText animated style={{ width: '100%', height: '16px', marginTop: '8px' }} />
								<IonSkeletonText animated style={{ width: '60%', height: '16px', marginTop: '4px' }} />
							</>
						)}
						<div className="skeleton-chips" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
							<IonSkeletonText animated style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
							<IonSkeletonText animated style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
						</div>
					</div>
				</div>
			</IonCardContent>
		</IonCard>
	);
};

// Main ArticleCard component
const ArticleCard: React.FC<ArticleCardProps> = ({
	article,
	session,
	variant = 'default',
	showActions = true,
	onDelete,
	onToggleFavorite,
	className = ''
}) => {
	const history = useHistory();
	const showToast = useCustomToast();
	const { likesCount, hasLiked: isLiked, toggleLike } = usePostLikes(article.id, session);
	const { commentsCount } = usePostComments(article.id, session);
	
	// Local state
	const [showActionSheet, setShowActionSheet] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Computed properties
	const isCompact = variant === 'compact';
	const isFeatured = variant === 'featured';
	const domain = getDomain(article.url || '');
	const readingTime = article.estimated_read_time || 
		Math.ceil((article.content?.length || 0) / 1000); // Rough estimate

	// Navigation to article detail
	const handleOpenArticle = useCallback(() => {
		history.push(`/article/${article.id}`);
	}, [history, article.id]);

	// Share article
	const handleShare = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			if (navigator.share) {
				await navigator.share({
					title: article.title,
					url: article.url || ''
				});
			} else {
				// Fallback to clipboard
				await navigator.clipboard.writeText(article.url || '');
				showToast({
					message: 'Article URL copied to clipboard',
					color: 'success'
				});
			}
		} catch (error) {
			console.error('Share error:', error);
		}
	}, [article, showToast]);

	// Toggle favorite
	const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onToggleFavorite) {
			try {
				await onToggleFavorite(article.id);
				showToast({
					message: article.is_favorite ? 'Removed from favorites' : 'Added to favorites',
					color: 'success'
				});
			} catch (error) {
				showToast({
					message: 'Failed to update favorite status',
					color: 'danger'
				});
			}
		}
	}, [article, onToggleFavorite, showToast]);

	// Toggle like
	const handleToggleLike = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await toggleLike();
		} catch (error) {
			showToast({
				message: 'Failed to update like status',
				color: 'danger'
			});
		}
	}, [toggleLike, showToast]);

	// Delete article
	const handleDelete = useCallback(async () => {
		if (!onDelete) return;
		
		setIsDeleting(true);
		try {
			await onDelete(article.id);
			showToast({
				message: 'Article deleted successfully',
				color: 'success'
			});
		} catch (error) {
			showToast({
				message: 'Failed to delete article',
				color: 'danger'
			});
		} finally {
			setIsDeleting(false);
			setShowDeleteAlert(false);
		}
	}, [article.id, onDelete, showToast]);

	// Action sheet buttons
	const actionButtons = [
		{
			text: article.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
			icon: article.is_favorite ? bookmark : bookmarkOutline,
			handler: () => handleToggleFavorite({} as React.MouseEvent)
		},
		{
			text: 'Share',
			icon: shareOutline,
			handler: () => handleShare({} as React.MouseEvent)
		},
		...(onDelete ? [{
			text: 'Delete',
			role: 'destructive' as const,
			icon: trashOutline,
			handler: () => setShowDeleteAlert(true)
		}] : []),
		{
			text: 'Cancel',
			role: 'cancel' as const
		}
	];

	// Render article image
	const renderImage = () => {
		const imageUrl = article.image_url;
		if (!imageUrl) return null;

		if (isFeatured) {
			return (
				<div className="featured-image-container">
					<img 
						src={imageUrl} 
						alt={article.title}
						className="featured-image"
					/>
					<div className="featured-overlay">
						<div className="featured-domain">{domain}</div>
					</div>
				</div>
			);
		}

		if (!isCompact) {
			return (
				<div className="article-image-container">
					<img 
						src={imageUrl} 
						alt={article.title}
						className="article-image"
					/>
				</div>
			);
		}

		return null;
	};

	// Render metadata chips
	const renderMetadata = () => (
		<div className="article-metadata">
			{article.author && (
				<IonChip color="medium" outline>
					<IonIcon icon={personOutline} />
					<IonLabel>{article.author}</IonLabel>
				</IonChip>
			)}
			
			<IonChip color="medium" outline>
				<IonIcon icon={calendarOutline} />
				<IonLabel>{formatDate(article.created_at || article.published_date)}</IonLabel>
			</IonChip>

			{readingTime > 0 && (
				<IonChip color="primary" outline>
					<IonIcon icon={timeOutline} />
					<IonLabel>{readingTime} min read</IonLabel>
				</IonChip>
			)}

			{domain && (
				<IonChip color="tertiary" outline>
					<IonLabel>{domain}</IonLabel>
				</IonChip>
			)}
		</div>
	);

	// Render engagement stats
	const renderEngagement = () => (
		<div className="article-engagement">
			<IonButton 
				fill="clear" 
				size="small" 
				color={isLiked ? 'danger' : 'medium'}
				onClick={handleToggleLike}
			>
				<IonIcon icon={isLiked ? heart : heartOutline} slot="start" />
				{likesCount}
			</IonButton>

			<IonButton fill="clear" size="small" color="medium">
				<IonIcon icon={chatbubbleOutline} slot="start" />
				{commentsCount}
			</IonButton>

			<IonButton 
				fill="clear" 
				size="small" 
				color={article.is_favorite ? 'warning' : 'medium'}
				onClick={handleToggleFavorite}
			>
				<IonIcon icon={article.is_favorite ? bookmark : bookmarkOutline} />
			</IonButton>

			<IonButton fill="clear" size="small" color="medium" onClick={handleShare}>
				<IonIcon icon={shareOutline} />
			</IonButton>
		</div>
	);

	// Render actions button
	const renderActions = () => {
		if (!showActions) return null;

		return (
			<IonButton 
				fill="clear" 
				size="small" 
				color="medium"
				onClick={(e) => {
					e.stopPropagation();
					setShowActionSheet(true);
				}}
			>
				<IonIcon icon={ellipsisVerticalOutline} />
			</IonButton>
		);
	};

	return (
		<>
			<IonCard 
				className={`article-card ${variant} ${className}`}
				button
				onClick={handleOpenArticle}
			>
				<IonCardContent>
					{renderImage()}
					
					<div className={`article-content ${isCompact ? 'compact' : 'default'}`}>
						<div className="article-header">
							<h3 className="article-title">
								{truncateText(article.title, isFeatured ? 100 : isCompact ? 80 : 120)}
							</h3>
							{renderActions()}
						</div>

						{!isCompact && article.excerpt && (
							<p className="article-excerpt">
								{truncateText(article.excerpt, isFeatured ? 200 : 150)}
							</p>
						)}

						{renderMetadata()}
						
						{!isCompact && renderEngagement()}
					</div>
				</IonCardContent>

				{/* Reading status indicator */}
				{article.reading_status === 'completed' && (
					<div className="read-indicator">
						<IonIcon icon={eyeOutline} />
					</div>
				)}
			</IonCard>

			{/* Action Sheet */}
			<IonActionSheet
				isOpen={showActionSheet}
				onDidDismiss={() => setShowActionSheet(false)}
				buttons={actionButtons}
				header="Article Actions"
			/>

			{/* Delete Confirmation */}
			<IonAlert
				isOpen={showDeleteAlert}
				onDidDismiss={() => setShowDeleteAlert(false)}
				header="Delete Article"
				message="Are you sure you want to delete this article? This action cannot be undone."
				buttons={[
					{
						text: 'Cancel',
						role: 'cancel'
					},
					{
						text: 'Delete',
						role: 'destructive',
						handler: handleDelete
					}
				]}
			/>

			<style>{`
				.article-card {
					margin: 8px 0;
					border-radius: 16px;
					transition: all 0.3s ease;
					position: relative;
					overflow: hidden;
				}

				.article-card:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
				}

				.article-card.featured {
					margin: 16px 0;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
				}

				.article-card.compact ion-card-content {
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
					background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
					display: flex;
					align-items: flex-end;
					padding: 16px;
				}

				.featured-domain {
					color: white;
					font-weight: 600;
					font-size: 14px;
				}

				.article-content {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.article-content.compact {
					gap: 8px;
				}

				.article-content.default {
					display: grid;
					grid-template-columns: 1fr 80px;
					gap: 16px;
				}

				.article-image-container {
					grid-row: 1 / -1;
					grid-column: 2;
				}

				.article-image {
					width: 80px;
					height: 80px;
					object-fit: cover;
					border-radius: 12px;
				}

				.article-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					gap: 12px;
				}

				.article-title {
					margin: 0;
					font-size: 18px;
					font-weight: 600;
					line-height: 1.4;
					color: var(--ion-color-dark);
					flex: 1;
				}

				.article-card.compact .article-title {
					font-size: 16px;
				}

				.article-card.featured .article-title {
					font-size: 24px;
					font-weight: 700;
				}

				.article-excerpt {
					margin: 0;
					font-size: 14px;
					line-height: 1.5;
					color: var(--ion-color-medium);
				}

				.article-metadata {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 8px 0;
				}

				.article-metadata ion-chip {
					--background: var(--ion-color-light);
					font-size: 12px;
					height: 28px;
				}

				.article-engagement {
					display: flex;
					align-items: center;
					gap: 4px;
					margin-top: 8px;
					padding-top: 8px;
					border-top: 1px solid var(--ion-color-light);
				}

				.article-engagement ion-button {
					--padding-start: 8px;
					--padding-end: 8px;
					font-size: 12px;
				}

				.read-indicator {
					position: absolute;
					top: 12px;
					right: 12px;
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background: var(--ion-color-success);
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
				}

				.article-card-skeleton {
					margin: 8px 0;
				}

				.skeleton-content.default-layout {
					display: grid;
					grid-template-columns: 1fr 80px;
					gap: 16px;
				}

				.skeleton-content.compact-layout {
					display: flex;
					flex-direction: column;
					gap: 8px;
				}

				.skeleton-text {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}

				.skeleton-chips {
					display: flex;
					gap: 8px;
					margin-top: 12px;
				}

				@media (max-width: 576px) {
					.article-content.default {
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

					.article-engagement {
						justify-content: center;
					}
				}
			`}</style>
		</>
	);
};

export default ArticleCard;