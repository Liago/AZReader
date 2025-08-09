import React, { useState, useEffect, useCallback } from 'react';
import {
	IonPage,
	IonContent,
	IonFooter,
	IonToolbar,
	IonButtons,
	IonButton,
	IonIcon,
	IonToast,
	IonSpinner,
	useIonViewWillEnter,
} from '@ionic/react';
import {
	heart,
	heartOutline,
	chatbubbleOutline,
	shareOutline,
	bookmarkOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { useSelector } from 'react-redux';

// Components
import ArticleReader from '@components/ArticleReader';
import ArticleReaderHeader from '@components/ArticleReaderHeader';
import Comments from '@components/Comments';
import ReadingStyleProvider from '@components/ReadingStyleProvider';

// Hooks and services
import { usePostLikes } from '@hooks/usePostLikes';
import { usePostComments } from '@hooks/usePostComments';
import { useCustomToast } from '@hooks/useIonToast';
import { ShareService } from '@utility/shareService';

// Store and data
import { RootState } from '@store/reducers';
import { supabase } from '@store/rest';
import type { Post } from '@store/slices/postsSlice';

interface ParamTypes {
	id: string;
}

const ArticleViewPage: React.FC = () => {
	const { id } = useParams<ParamTypes>();
	const history = useHistory();
	const showToast = useCustomToast();

	// State
	const [article, setArticle] = useState<Post | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
	const [showComments, setShowComments] = useState(false);
	const [showShareToast, setShowShareToast] = useState(false);
	const [shareToastMessage, setShareToastMessage] = useState('');
	const [readingProgress, setReadingProgress] = useState(0);
	const [readingTime, setReadingTime] = useState(0);
	const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

	// Redux selectors
	const userCredentials = useSelector((state: RootState) => state.user.credentials);

	// Hooks
	const { likesCount, hasLiked, toggleLike, isLoading: isLikeLoading } = usePostLikes(id, supabaseSession);
	const { commentsCount } = usePostComments(id, supabaseSession);

	// Initialize session
	useEffect(() => {
		const fetchSession = async () => {
			const { data } = await supabase.auth.getSession();
			setSupabaseSession(data.session);
		};

		fetchSession();

		const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
			setSupabaseSession(session);
		});

		return () => {
			authListener.subscription.unsubscribe();
		};
	}, []);

	// Fetch article data
	const fetchArticle = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('articles')
				.select('*')
				.eq('id', id)
				.single();

			if (error) throw error;

			if (data) {
				setArticle(data);
				
				// Mark as read if user is logged in
				if (supabaseSession?.user && data.reading_status !== 'completed') {
					const { error: updateError } = await supabase
						.from('articles')
						.update({
							reading_status: 'reading',
							updated_at: new Date().toISOString()
						})
						.eq('id', id);

					if (!updateError) {
						setArticle(prev => prev ? { ...prev, reading_status: 'reading' } : null);
					}
				}
			} else {
				showToast({
					message: 'Articolo non trovato',
					color: 'danger',
				});
				history.goBack();
			}
		} catch (error: any) {
			console.error('Errore nel recupero dell\'articolo:', error);
			showToast({
				message: error.message || 'Errore nel recupero dell\'articolo',
				color: 'danger',
			});
			history.goBack();
		} finally {
			setIsLoading(false);
		}
	}, [id, supabaseSession, showToast, history]);

	useIonViewWillEnter(() => {
		fetchArticle();
	});

	// Handle like action
	const handleLikeClick = useCallback(async () => {
		try {
			if (!supabaseSession) {
				showToast({
					message: 'Devi effettuare l\'accesso per mettere mi piace',
					color: 'warning',
				});
				return;
			}

			await toggleLike();
		} catch (err) {
			showToast({
				message: 'Errore durante l\'operazione',
				color: 'danger',
			});
		}
	}, [supabaseSession, toggleLike, showToast]);

	// Handle share action
	const handleShare = useCallback(async () => {
		if (!article) return;

		try {
			const canShare = await ShareService.canShare();

			if (!canShare) {
				setShareToastMessage('La condivisione non è supportata su questo dispositivo');
				setShowShareToast(true);
				return;
			}

			const shareUrl = article.url || `azreader://article/${id}`;
			const result = await ShareService.shareArticle(
				article.title, 
				shareUrl, 
				article.excerpt || undefined
			);

			if (!result) {
				setShareToastMessage('Non è stato possibile condividere l\'articolo');
				setShowShareToast(true);
			}
		} catch (error) {
			console.error('Errore durante la condivisione:', error);
			setShareToastMessage('Si è verificato un errore durante la condivisione');
			setShowShareToast(true);
		}
	}, [article, id]);

	// Handle favorite toggle
	const handleToggleFavorite = useCallback(async () => {
		if (!article || !supabaseSession) {
			showToast({
				message: 'Devi effettuare l\'accesso per gestire i preferiti',
				color: 'warning',
			});
			return;
		}

		setIsUpdatingFavorite(true);
		try {
			const { error } = await supabase
				.from('articles')
				.update({
					is_favorite: !article.is_favorite,
					updated_at: new Date().toISOString()
				})
				.eq('id', article.id);

			if (error) throw error;

			setArticle(prev => prev ? {
				...prev,
				is_favorite: !prev.is_favorite
			} : null);

			showToast({
				message: article.is_favorite ? 'Rimosso dai preferiti' : 'Aggiunto ai preferiti',
				color: 'success',
			});
		} catch (error: any) {
			console.error('Errore aggiornamento preferiti:', error);
			showToast({
				message: 'Errore durante l\'aggiornamento dei preferiti',
				color: 'danger',
			});
		} finally {
			setIsUpdatingFavorite(false);
		}
	}, [article, supabaseSession, showToast]);

	// Handle reading progress
	const handleReadingProgressChange = useCallback(async (progress: number) => {
		setReadingProgress(progress);
		
		// Mark as completed when progress reaches 90%
		if (progress >= 90 && article && supabaseSession?.user && article.reading_status !== 'completed') {
			try {
				const { error } = await supabase
					.from('articles')
					.update({
						reading_status: 'completed',
						updated_at: new Date().toISOString()
					})
					.eq('id', article.id);

				if (!error) {
					setArticle(prev => prev ? { ...prev, reading_status: 'completed' } : null);
				}
			} catch (error) {
				console.error('Errore aggiornamento stato lettura:', error);
			}
		}
	}, [article, supabaseSession]);

	// Handle reading time updates
	const handleReadingTimeUpdate = useCallback((timeSpent: number) => {
		setReadingTime(timeSpent);
	}, []);

	// Render loading state
	if (isLoading) {
		return (
			<IonPage>
				<ArticleReaderHeader
					title="Caricamento..."
					session={supabaseSession}
				/>
				<IonContent>
					<div className="loading-container">
						<IonSpinner />
						<p>Caricamento articolo...</p>
					</div>
				</IonContent>
			</IonPage>
		);
	}

	// Render article not found
	if (!article) {
		return (
			<IonPage>
				<ArticleReaderHeader
					title="Articolo non trovato"
					session={supabaseSession}
				/>
				<IonContent>
					<div className="error-container">
						<p>L'articolo richiesto non è stato trovato.</p>
						<IonButton onClick={() => history.goBack()}>
							Torna indietro
						</IonButton>
					</div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage className="article-view-page">
			{/* Reading Style Provider for CSS custom properties */}
			<ReadingStyleProvider />
			
			{/* Header */}
			<ArticleReaderHeader
				title={article.title}
				domain={article.domain || undefined}
				session={supabaseSession}
				isFavorite={article.is_favorite || false}
				readingProgress={readingProgress}
				onShare={handleShare}
				onToggleFavorite={handleToggleFavorite}
			/>

			{/* Content */}
			<IonContent scrollEvents>
				<ArticleReader
					article={article}
					session={supabaseSession}
					onReadingProgressChange={handleReadingProgressChange}
					onReadingTimeUpdate={handleReadingTimeUpdate}
					className="main-article-reader"
				/>
			</IonContent>

			{/* Footer with engagement actions */}
			<IonFooter className="article-footer">
				<IonToolbar>
					<div className="engagement-actions">
						{/* Like */}
						<IonButton
							fill="clear"
							size="small"
							onClick={handleLikeClick}
							disabled={isLikeLoading}
							className="engagement-button like-button"
						>
							<div className="button-content">
								<IonIcon 
									icon={hasLiked ? heart : heartOutline}
									color={hasLiked ? 'danger' : 'medium'}
								/>
								<span className="button-label">{likesCount}</span>
							</div>
						</IonButton>

						{/* Comments */}
						<IonButton
							fill="clear"
							size="small"
							onClick={() => setShowComments(true)}
							className="engagement-button comment-button"
						>
							<div className="button-content">
								<IonIcon icon={chatbubbleOutline} color="medium" />
								<span className="button-label">{commentsCount}</span>
							</div>
						</IonButton>

						{/* Share */}
						<IonButton
							fill="clear"
							size="small"
							onClick={handleShare}
							className="engagement-button share-button"
						>
							<div className="button-content">
								<IonIcon icon={shareOutline} color="medium" />
								<span className="button-label">Condividi</span>
							</div>
						</IonButton>

						{/* Favorite (footer version) */}
						<IonButton
							fill="clear"
							size="small"
							onClick={handleToggleFavorite}
							disabled={isUpdatingFavorite}
							className="engagement-button favorite-button"
						>
							<div className="button-content">
								<IonIcon 
									icon={bookmarkOutline}
									color={article.is_favorite ? 'warning' : 'medium'}
								/>
								<span className="button-label">Salva</span>
							</div>
						</IonButton>
					</div>
				</IonToolbar>
			</IonFooter>

			{/* Comments Modal */}
			<Comments
				isOpen={showComments}
				onClose={() => setShowComments(false)}
				postId={id}
				session={supabaseSession}
				articleTitle={article.title}
			/>

			{/* Share Toast */}
			<IonToast
				isOpen={showShareToast}
				onDidDismiss={() => setShowShareToast(false)}
				message={shareToastMessage}
				duration={3000}
				position="bottom"
				color="medium"
			/>

			{/* Component Styles */}
			<style>{`
				.article-view-page {
					--background: var(--ion-color-light);
				}

				.loading-container,
				.error-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 50vh;
					padding: 2rem;
					text-align: center;
					color: var(--ion-color-medium);
				}

				.loading-container ion-spinner {
					margin-bottom: 1rem;
				}

				.main-article-reader {
					--background: transparent;
				}

				.article-footer {
					--background: var(--ion-color-step-50, #fafafa);
					border-top: 1px solid var(--ion-color-step-150, #d3d3d3);
				}

				.engagement-actions {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 0.5rem;
					padding: 0.5rem;
					width: 100%;
				}

				.engagement-button {
					--padding-start: 8px;
					--padding-end: 8px;
					--color: var(--ion-color-medium);
					min-height: 48px;
				}

				.button-content {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 0.25rem;
				}

				.button-label {
					font-size: 0.75rem;
					font-weight: 500;
					color: inherit;
					white-space: nowrap;
				}

				.engagement-button ion-icon {
					font-size: 1.25rem;
				}

				.like-button.ios.button-has-icon-only:hover,
				.like-button.md.button-has-icon-only:hover {
					--background: rgba(var(--ion-color-danger-rgb), 0.1);
				}

				.comment-button:hover {
					--background: rgba(var(--ion-color-primary-rgb), 0.1);
				}

				.share-button:hover {
					--background: rgba(var(--ion-color-success-rgb), 0.1);
				}

				.favorite-button:hover {
					--background: rgba(var(--ion-color-warning-rgb), 0.1);
				}

				/* Dark theme */
				@media (prefers-color-scheme: dark) {
					.article-view-page {
						--background: var(--ion-color-step-100);
					}

					.article-footer {
						--background: var(--ion-color-step-100);
						border-top-color: var(--ion-color-step-200);
					}
				}

				/* Mobile optimizations */
				@media (max-width: 480px) {
					.engagement-actions {
						padding: 0.25rem;
					}

					.engagement-button {
						min-height: 44px;
					}

					.button-label {
						font-size: 0.6875rem;
					}

					.engagement-button ion-icon {
						font-size: 1.125rem;
					}
				}
			`}</style>
		</IonPage>
	);
};

export default ArticleViewPage;