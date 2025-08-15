import React, { useCallback } from "react";
import { IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent, RefresherEventDetail } from "@ionic/react";
import { Session } from "@supabase/auth-js";
import ReadingThemeWrapper from "./ui/ReadingThemeWrapper";
import ArticleCard, { ArticleCardSkeleton } from "./ArticleCard";
import ArticleSortControls from "./ArticleSortControls";
import useInfiniteArticles from "@hooks/useInfiniteArticles";
import type { Post } from '@store/slices/postsSlice';

interface ArticleListProps {
	session: Session;
}

const ArticleList: React.FC<ArticleListProps> = ({ session }) => {
	// Use the new infinite articles hook
	const {
		filteredArticles,
		totalCount,
		isLoading,
		isLoadingMore,
		hasMore,
		loadMore,
		refresh,
		deleteArticle,
		toggleFavorite,
		markAsRead,
		sortOptions,
		setSortOptions,
		filterOptions,
		setFilterOptions,
		viewMode,
		setViewMode,
		availableDomains,
		availableTags
	} = useInfiniteArticles({ session });

	// Handle refresh
	const handleRefresh = useCallback(
		async (event: CustomEvent<RefresherEventDetail>) => {
			await refresh();
			event.detail.complete();
		},
		[refresh]
	);

	// Handle infinite scroll
	const handleLoadMore = useCallback(
		async (event: CustomEvent) => {
			await loadMore();
			(event.target as HTMLIonInfiniteScrollElement).complete();
		},
		[loadMore]
	);

	// Handle article navigation (mark as read when opening)
	const handleOpenArticle = useCallback(
		async (article: Post) => {
			// Mark as read when opening
			if (article.reading_status !== 'completed') {
				await markAsRead(article.id);
			}
		},
		[markAsRead]
	);

	// Render featured article (first article in featured mode)
	const renderFeaturedArticle = () => {
		if (!filteredArticles.length || viewMode !== 'featured') return null;

		const featuredArticle = filteredArticles[0];
		if (!featuredArticle) return null;
		
		return (
			<div className="featured-article-section">
				<ArticleCard
					article={featuredArticle}
					session={session}
					variant="featured"
					onDelete={deleteArticle}
					onToggleFavorite={toggleFavorite}
					className="featured-article"
				/>
			</div>
		);
	};

	// Render loading skeleton
	const renderLoadingSkeletons = () => (
		<div className="loading-skeletons">
			{Array.from({ length: 5 }).map((_, index) => (
				<ArticleCardSkeleton 
					key={`skeleton-${index}`} 
					variant={viewMode}
				/>
			))}
		</div>
	);

	// Render article grid
	const renderArticleGrid = () => {
		const articlesToShow = viewMode === 'featured' && filteredArticles.length > 0
			? filteredArticles.slice(1) // Skip first article in featured mode
			: filteredArticles;

		if (articlesToShow.length === 0 && !isLoading) {
			return (
				<div className="empty-state">
					<div className="empty-state-content">
						<div className="empty-state-icon">📚</div>
						<h3>No articles found</h3>
						<p>You haven't saved any articles yet, or they may have been filtered out.</p>
						<div className="empty-state-actions">
							<button 
								className="add-article-btn"
								onClick={() => {/* TODO: Add article functionality */}}
							>
								Add Your First Article
							</button>
							<button 
								className="clear-filters-btn"
								onClick={() => setFilterOptions({
									showRead: true,
									showUnread: true,
									showFavorites: false,
									domains: [],
									tags: []
								})}
							>
								Clear All Filters
							</button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className={`article-grid ${viewMode}`}>
				{articlesToShow.map((article) => (
					<ArticleCard
						key={article.id}
						article={article}
						session={session}
						variant={viewMode === 'featured' ? 'default' : viewMode}
						onDelete={deleteArticle}
						onToggleFavorite={toggleFavorite}
						className="article-grid-item"
					/>
				))}
			</div>
		);
	};

	return (
		<>
			<ReadingThemeWrapper>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<div className="modern-article-list">
					{/* Sort and Filter Controls */}
					<ArticleSortControls
						sortOptions={sortOptions}
						onSortChange={setSortOptions}
						filterOptions={filterOptions}
						onFilterChange={setFilterOptions}
						viewMode={viewMode}
						onViewModeChange={setViewMode}
						availableDomains={availableDomains}
						availableTags={availableTags}
						totalArticles={totalCount}
						filteredCount={filteredArticles.length}
						className="sort-controls"
					/>

					{/* Content Area */}
					<div className="content-area">
						{isLoading && filteredArticles.length === 0 ? (
							renderLoadingSkeletons()
						) : (
							<>
								{renderFeaturedArticle()}
								{renderArticleGrid()}
							</>
						)}
					</div>

					{/* Infinite Scroll */}
					<IonInfiniteScroll 
						onIonInfinite={handleLoadMore} 
						threshold="100px" 
						disabled={!hasMore || isLoading}
					>
						<IonInfiniteScrollContent 
							loadingSpinner="bubbles" 
							loadingText="Loading more articles..."
						/>
					</IonInfiniteScroll>
				</div>

				{/* Styling */}
				<style>{`
					.modern-article-list {
						min-height: 100vh;
						background: var(--ion-color-light-tint);
					}

					.sort-controls {
						position: sticky;
						top: 0;
						z-index: 10;
						background: var(--ion-background-color);
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					}

					.content-area {
						padding: 16px;
					}

					.featured-article-section {
						margin-bottom: 24px;
					}

					.featured-article {
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
					}

					.article-grid {
						display: grid;
						gap: 16px;
						margin-bottom: 20px;
					}

					.article-grid.default {
						grid-template-columns: 1fr;
					}

					.article-grid.compact {
						grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
						gap: 12px;
					}

					.article-grid.featured {
						grid-template-columns: 1fr;
					}

					.loading-skeletons {
						display: grid;
						gap: 16px;
						padding: 16px;
					}

					.empty-state {
						display: flex;
						justify-content: center;
						align-items: center;
						min-height: 400px;
						padding: 32px;
					}

					.empty-state-content {
						text-align: center;
						max-width: 400px;
						color: var(--ion-color-medium);
					}

					.empty-state-icon {
						font-size: 48px;
						margin-bottom: 16px;
						opacity: 0.7;
					}

					.empty-state-content h3 {
						font-size: 24px;
						font-weight: 600;
						margin-bottom: 12px;
						color: var(--ion-color-dark);
					}

					.empty-state-content p {
						font-size: 16px;
						line-height: 1.6;
						margin-bottom: 24px;
						color: var(--ion-color-medium);
					}

					.empty-state-actions {
						display: flex;
						flex-direction: column;
						gap: 12px;
						align-items: center;
					}

					.add-article-btn, .clear-filters-btn {
						padding: 12px 24px;
						border: none;
						border-radius: 8px;
						font-size: 16px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						min-width: 200px;
					}

					.add-article-btn {
						background: var(--ion-color-primary);
						color: var(--ion-color-primary-contrast);
					}

					.add-article-btn:hover {
						background: var(--ion-color-primary-shade);
						transform: translateY(-1px);
					}

					.clear-filters-btn {
						background: var(--ion-color-light);
						color: var(--ion-color-dark);
						border: 1px solid var(--ion-color-medium-tint);
					}

					.clear-filters-btn:hover {
						background: var(--ion-color-light-shade);
						transform: translateY(-1px);
					}

					@media (max-width: 768px) {
						.content-area {
							padding: 12px;
						}

						.article-grid.compact {
							grid-template-columns: 1fr;
						}

						.article-grid {
							gap: 12px;
						}
					}

					@media (max-width: 576px) {
						.content-area {
							padding: 8px;
						}

						.featured-article-section {
							margin-bottom: 16px;
						}
					}
				`}</style>
			</ReadingThemeWrapper>
		</>
	);
};

export default ArticleList;
