import React, { useState } from 'react';
import {
	IonHeader,
	IonToolbar,
	IonButtons,
	IonBackButton,
	IonTitle,
	IonButton,
	IonIcon,
	IonPopover,
	IonContent,
	IonList,
	IonItem,
	IonLabel,
	IonProgressBar,
} from '@ionic/react';
import {
	ellipsisHorizontal,
	bookmark,
	bookmarkOutline,
	shareOutline,
	textOutline,
	sunny,
	moon,
	contrast,
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import EnhancedReadingControls from './EnhancedReadingControls';

export interface ArticleReaderHeaderProps {
	title?: string;
	domain?: string;
	backHref?: string;
	session: Session | null;
	isFavorite?: boolean;
	readingProgress?: number; // 0-100
	onShare?: () => void;
	onToggleFavorite?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

const ArticleReaderHeader: React.FC<ArticleReaderHeaderProps> = ({
	title,
	domain,
	backHref = '/home',
	session,
	isFavorite = false,
	readingProgress = 0,
	onShare,
	onToggleFavorite,
	onMoreActions,
	className = ''
}) => {
	const [showActionsPopover, setShowActionsPopover] = useState(false);
	const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);

	const handleMoreActions = (e: React.MouseEvent) => {
		setPopoverEvent(e.nativeEvent);
		setShowActionsPopover(true);
		onMoreActions?.();
	};

	const handleShare = () => {
		setShowActionsPopover(false);
		onShare?.();
	};

	const handleToggleFavorite = () => {
		setShowActionsPopover(false);
		onToggleFavorite?.();
	};

	return (
		<>
			<IonHeader className={`article-reader-header ion-no-border ${className}`}>
				<IonToolbar>
					{/* Back Button */}
					<IonButtons slot="start">
						<IonBackButton 
							defaultHref={backHref} 
							className="article-back-button"
						/>
					</IonButtons>

					{/* Title/Domain */}
					<IonTitle size="small" className="article-header-title">
						{title ? (
							<div className="header-title-content">
								<div className="header-title" title={title}>
									{title.length > 40 ? `${title.substring(0, 40)}...` : title}
								</div>
								{domain && (
									<div className="header-domain">{domain}</div>
								)}
							</div>
						) : domain ? (
							domain
						) : (
							'Articolo'
						)}
					</IonTitle>

					{/* Action Buttons */}
					<IonButtons slot="end">
						{/* Reading Settings */}
						<EnhancedReadingControls compact={true} />

						{/* Favorite Toggle */}
						{session && (
							<IonButton
								fill="clear"
								onClick={handleToggleFavorite}
								className="favorite-button"
							>
								<IonIcon 
									icon={isFavorite ? bookmark : bookmarkOutline}
									color={isFavorite ? 'warning' : undefined}
								/>
							</IonButton>
						)}

						{/* More Actions */}
						<IonButton
							fill="clear"
							id="more-actions-trigger"
							onClick={handleMoreActions}
							className="more-actions-button"
						>
							<IonIcon icon={ellipsisHorizontal} />
						</IonButton>
					</IonButtons>
				</IonToolbar>

				{/* Reading Progress Bar */}
				{readingProgress > 0 && (
					<IonProgressBar 
						value={readingProgress / 100} 
						className="reading-progress-bar"
					/>
				)}
			</IonHeader>

			{/* Actions Popover */}
			<IonPopover
				trigger="more-actions-trigger"
				isOpen={showActionsPopover}
				onDidDismiss={() => setShowActionsPopover(false)}
				event={popoverEvent}
				showBackdrop={true}
				side="bottom"
				alignment="end"
			>
				<IonContent>
					<IonList>
						{/* Share */}
						<IonItem button onClick={handleShare}>
							<IonIcon icon={shareOutline} slot="start" />
							<IonLabel>Condividi</IonLabel>
						</IonItem>

						{/* Favorite Toggle (alternative) */}
						{session && (
							<IonItem button onClick={handleToggleFavorite}>
								<IonIcon 
									icon={isFavorite ? bookmark : bookmarkOutline} 
									slot="start"
									color={isFavorite ? 'warning' : undefined}
								/>
								<IonLabel>
									{isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
								</IonLabel>
							</IonItem>
						)}

						{/* Reading Settings (alternative access) */}
						<IonItem button onClick={() => setShowActionsPopover(false)}>
							<IonIcon icon={textOutline} slot="start" />
							<IonLabel>Impostazioni lettura</IonLabel>
						</IonItem>
					</IonList>
				</IonContent>
			</IonPopover>

			<style>{`
				.article-reader-header {
					--background: var(--ion-color-step-50, #fafafa);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
				}

				.article-reader-header ion-toolbar {
					--border-width: 0;
					--padding-start: 4px;
					--padding-end: 4px;
				}

				.article-back-button {
					--padding-start: 8px;
					--padding-end: 8px;
				}

				.article-header-title {
					text-align: center;
				}

				.header-title-content {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 2px;
				}

				.header-title {
					font-size: 14px;
					font-weight: 600;
					line-height: 1.2;
					color: var(--ion-color-dark);
					max-width: 200px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.header-domain {
					font-size: 12px;
					font-weight: 400;
					color: var(--ion-color-medium);
					opacity: 0.8;
				}

				.favorite-button,
				.more-actions-button {
					--padding-start: 8px;
					--padding-end: 8px;
				}

				.reading-progress-bar {
					--progress-background: var(--ion-color-primary);
					--background: var(--ion-color-light);
					height: 3px;
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					z-index: 10;
				}

				/* Dark theme adjustments */
				@media (prefers-color-scheme: dark) {
					.article-reader-header {
						--background: var(--ion-color-step-100, #1a1a1a);
					}

					.header-title {
						color: var(--ion-color-light);
					}
				}

				/* Mobile optimizations */
				@media (max-width: 768px) {
					.header-title {
						max-width: 150px;
						font-size: 13px;
					}

					.header-domain {
						font-size: 11px;
					}
				}

				/* Compact mode for minimal distraction */
				.article-reader-header.compact {
					transform: translateY(-100%);
					transition: transform 0.3s ease;
				}

				.article-reader-header.compact:hover,
				.article-reader-header.compact.active {
					transform: translateY(0);
				}
			`}</style>
		</>
	);
};

export default ArticleReaderHeader;