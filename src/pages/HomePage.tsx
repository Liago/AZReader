import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonMenuButton,
	IonTabBar,
	IonTabButton,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	IonCard,
	IonCardContent
} from '@ionic/react';
import {
	searchOutline,
	bookmarkOutline,
	notificationsOutline,
	personOutline,
	homeOutline,
	cameraOutline
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import { Auth } from '@components/form/authentication';
import { useAuth } from '@context/auth/AuthContext';
import useInfiniteArticles from '@hooks/useInfiniteArticles';
import SwipeableImageCarousel, { CarouselImage } from '@components/ui/SwipeableImageCarousel';

// Types
type TabType = 'latest' | 'world' | 'politics' | 'climate';

const HomePage: React.FC = () => {
	const { session } = useAuth();
	const history = useHistory();
	const {
		filteredArticles,
		isLoading,
		refresh
	} = useInfiniteArticles({ 
		session: session as Session | null 
	});

	// Component state
	const pageRef = useRef<HTMLElement>(null);
	const [activeTab, setActiveTab] = useState<TabType>('latest');
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Get current date for display
	const getCurrentDate = (): string => {
		const today = new Date();
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			month: 'short',
			day: '2-digit',
			year: 'numeric'
		};
		return today.toLocaleDateString('en-US', options);
	};

	// Handle pull to refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		try {
			await refresh();
		} finally {
			event.detail.complete();
		}
	};

	// Navigate to article detail page
	const handleArticleClick = (articleId: string) => {
		history.push(`/article/${articleId}`);
	};

	// Handle "Read More" click
	const handleReadMoreClick = (articleId: string) => {
		history.push(`/article/${articleId}`);
	};

	// Handle "See All" click - navigate to full articles list
	const handleSeeAllClick = () => {
		// TODO: Create articles list page or navigate to existing one
		console.log('See All clicked - will implement articles list page');
	};

	// Handle search input
	const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	// Handle search submit
	const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && searchQuery.trim()) {
			// Navigate to search page with query as route parameter
			const searchUrl = `/search/${encodeURIComponent(searchQuery.trim())}`;
			history.push(searchUrl);
			setShowSearch(false); // Close search bar after navigation
		}
	};

	// Handle search button click
	const handleSearchClick = () => {
		if (searchQuery.trim()) {
			const searchUrl = `/search/${encodeURIComponent(searchQuery.trim())}`;
			history.push(searchUrl);
			setShowSearch(false); // Close search bar after navigation
		} else {
			// Just navigate to search page
			history.push('/search');
			setShowSearch(false);
		}
	};

	// Navigation handlers for tab menu
	const handleTabNavigation = (tab: string) => {
		switch (tab) {
			case 'home':
				history.push('/home');
				break;
			case 'discover':
				history.push('/discover');
				break;
			case 'activity':
				history.push('/activity');
				break;
			case 'profile':
				history.push('/profile');
				break;
		}
	};

	// Debug logging for data flow
	if (process.env.NODE_ENV === 'development') {
		console.log('HomePage - Session:', session?.user?.id);
		console.log('HomePage - filteredArticles:', filteredArticles?.length, 'articles');
		console.log('HomePage - filteredArticles data:', filteredArticles);
		console.log('HomePage - isLoading:', isLoading);
	}

	// Get featured articles (first 4-5 articles for carousel)
	const featuredArticles = filteredArticles?.slice(0, 4) || [];
	const trendingArticles = filteredArticles?.slice(4, 7) || [];

	// Convert featured articles to carousel images format
	const featuredCarouselImages: CarouselImage[] = featuredArticles.map((article, index) => ({
		id: article.id,
		src: article.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWc8L3RleHQ+PC9zdmc+',
		alt: article.title,
		caption: article.title,
		credits: `By ${article.author || 'Unknown'}`
	}));

	// Handle carousel image change
	const handleFeaturedCarouselImageChange = (index: number, image: CarouselImage) => {
		console.log(`Featured carousel changed to image ${index + 1}:`, image.caption);
	};

	// Handle carousel image click  
	const handleFeaturedCarouselImageClick = (index: number, image: CarouselImage) => {
		const article = featuredArticles[index];
		if (article) {
			handleArticleClick(article.id);
		}
	};


	// Se l'utente non è autenticato, mostra solo la pagina di login
	if (!session || !session.user) {
		console.log('HomePage: No valid session, showing Auth', { session, user: session?.user });
		return (
			<IonPage id="auth-page" ref={pageRef}>
				<IonContent className="ion-padding">
					<div className="flex flex-col items-center justify-center min-h-full">
						<Auth />
					</div>
				</IonContent>
			</IonPage>
		);
	}

	// Se l'utente è autenticato, mostra l'interfaccia completa
	return (
		<IonPage id="home-page" ref={pageRef}>
			{/* Header */}
			<IonHeader className="ion-no-border">
				<IonToolbar className="news-header">
					<IonButtons slot="start">
						<IonMenuButton color="dark" />
					</IonButtons>
					
					<div className="header-content">
						<IonTitle className="news-title">Today's News</IonTitle>
						<p className="news-date">{getCurrentDate()}</p>
					</div>
					
					<IonButtons slot="primary">
						<IonButton fill="clear" color="dark" onClick={() => setShowSearch(!showSearch)}>
							<IonIcon slot="icon-only" icon={searchOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				
				{/* Search Bar */}
				{showSearch && (
					<div className="search-bar">
						<input 
							type="text" 
							placeholder="Search articles..." 
							className="search-input"
							value={searchQuery}
							onChange={handleSearchInput}
							onKeyDown={handleSearchSubmit}
							autoFocus
						/>
						{searchQuery && (
							<IonButton 
								size="small" 
								fill="clear" 
								onClick={handleSearchClick}
								className="search-submit-btn"
							>
								<IonIcon icon={searchOutline} />
							</IonButton>
						)}
					</div>
				)}

				{/* Category Navigation */}
				<div className="category-tabs">
					<div className="category-tab-container">
						<div 
							className={`category-tab ${activeTab === 'latest' ? 'active' : ''}`}
							onClick={() => setActiveTab('latest')}
						>
							Latest
							{activeTab === 'latest' && <div className="tab-indicator" />}
						</div>
						<div 
							className={`category-tab ${activeTab === 'world' ? 'active' : ''}`}
							onClick={() => setActiveTab('world')}
						>
							World
							{activeTab === 'world' && <div className="tab-indicator" />}
						</div>
						<div 
							className={`category-tab ${activeTab === 'politics' ? 'active' : ''}`}
							onClick={() => setActiveTab('politics')}
						>
							Politics
							{activeTab === 'politics' && <div className="tab-indicator" />}
						</div>
						<div 
							className={`category-tab ${activeTab === 'climate' ? 'active' : ''}`}
							onClick={() => setActiveTab('climate')}
						>
							Climate
							{activeTab === 'climate' && <div className="tab-indicator" />}
						</div>
					</div>
				</div>
			</IonHeader>
			
			{/* Main content */}
			<IonContent fullscreen className="news-content">
				{/* Pull to refresh */}
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent
						refreshingSpinner="circles"
						refreshingText="Refreshing articles..."
					/>
				</IonRefresher>

				{/* Featured Articles Carousel */}
				{featuredCarouselImages.length > 0 && (
					<div className="featured-section">
						<SwipeableImageCarousel
							images={featuredCarouselImages}
							height="280px"
							borderRadius="12px"
							showOverlay={true}
							autoplay={true}
							autoplayInterval={5000}
							enableHaptics={true}
							onImageChange={handleFeaturedCarouselImageChange}
							onImageClick={handleFeaturedCarouselImageClick}
							className="featured-carousel"
							showArrows={true}
							showDots={true}
						/>
					</div>
				)}

				{/* Trending Section */}
				<div className="trending-section">
					<div className="section-header">
						<h3>Trending</h3>
						<span 
							className="see-all"
							onClick={handleSeeAllClick}
							style={{ cursor: 'pointer', color: '#007bff' }}
						>
							See All
						</span>
					</div>
					
					<div className="trending-articles">
						{trendingArticles.map((article, index) => (
							<div 
								key={article.id} 
								className="trending-article"
								onClick={() => handleArticleClick(article.id)}
								style={{ cursor: 'pointer' }}
							>
								<div className="trending-image">
									<img 
										src={article.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObzwvdGV4dD48L3N2Zz4='} 
										alt={article.title}
										onError={(e) => {
											const target = e.target as HTMLImageElement;
											if (!target.src.startsWith('data:')) {
												target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObzwvdGV4dD48L3N2Zz4=';
											}
										}}
									/>
								</div>
								<div className="trending-content">
									<div className="trending-meta">
										<span className="source">BBC</span>
										<span className="category">• World</span>
									</div>
									<h4 className="trending-title">{article.title}</h4>
									<p className="trending-author">By {article.author || 'Unknown'}</p>
								</div>
								<IonButton fill="clear" size="small" className="bookmark-btn">
									<IonIcon icon={bookmarkOutline} />
								</IonButton>
							</div>
						))}
					</div>
				</div>
			</IonContent>
			
			{/* Bottom Navigation */}
			<IonTabBar slot="bottom" className="news-bottom-tabs">
				<IonTabButton 
					tab="home" 
					className="tab-selected"
					onClick={() => handleTabNavigation('home')}
				>
					<IonIcon icon={homeOutline} />
				</IonTabButton>
				
				<IonTabButton 
					tab="discover"
					onClick={() => handleTabNavigation('discover')}
				>
					<IonIcon icon={cameraOutline} />
				</IonTabButton>
				
				<IonTabButton 
					tab="activity"
					onClick={() => handleTabNavigation('activity')}
				>
					<IonIcon icon={notificationsOutline} />
				</IonTabButton>
				
				<IonTabButton 
					tab="profile"
					onClick={() => handleTabNavigation('profile')}
				>
					<IonIcon icon={personOutline} />
				</IonTabButton>
			</IonTabBar>

			{/* Styles */}
			<style>{`
				/* Header Styles */
				.news-header {
					--background: #f8f9fa;
					--border-color: #e9ecef;
					border-bottom: 1px solid var(--border-color);
				}

				.header-content {
					display: flex;
					flex-direction: column;
					align-items: center;
				}

				.news-title {
					font-size: 20px;
					font-weight: 700;
					color: #000;
					margin: 0;
				}

				.news-date {
					font-size: 13px;
					color: #6c757d;
					margin: 2px 0 0 0;
				}

				/* Category Tabs */
				.category-tabs {
					background: #000;
					padding: 0;
				}

				.category-tab-container {
					display: flex;
					justify-content: space-around;
					background: #000;
					padding: 12px 0;
				}

				.category-tab {
					color: #fff;
					font-size: 14px;
					font-weight: 500;
					padding: 8px 16px;
					position: relative;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.category-tab.active {
					color: #fff;
				}

				.tab-indicator {
					position: absolute;
					bottom: -4px;
					left: 50%;
					transform: translateX(-50%);
					width: 4px;
					height: 4px;
					background: #fff;
					border-radius: 50%;
				}

				/* Content */
				.news-content {
					--background: #f8f9fa;
				}

				/* Featured Section */
				.featured-section {
					padding: 16px;
					margin-top: 100px;
					margin-bottom: 8px;
				}

				.featured-carousel {
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
					border-radius: 12px;
					overflow: hidden;
				}

				.featured-card {
					margin: 0;
					border-radius: 12px;
					box-shadow: 0 2px 12px rgba(0,0,0,0.1);
					overflow: hidden;
				}

				.featured-image {
					height: 180px;
					overflow: hidden;
				}

				.featured-image img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.featured-content {
					padding: 16px;
				}

				.featured-title {
					font-size: 18px;
					font-weight: 600;
					color: #000;
					margin: 0 0 8px 0;
					line-height: 1.4;
				}

				.featured-author {
					font-size: 13px;
					color: #6c757d;
					margin: 0 0 8px 0;
				}

				.featured-excerpt {
					font-size: 14px;
					color: #495057;
					line-height: 1.5;
					margin: 0 0 12px 0;
				}

				.featured-actions {
					display: flex;
					justify-content: flex-end;
				}

				.read-more {
					color: #007bff;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
				}

				/* Page Indicators */
				.page-indicators {
					display: flex;
					justify-content: center;
					gap: 8px;
					margin-top: 16px;
				}

				.indicator {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: #dee2e6;
					transition: all 0.2s ease;
				}

				.indicator.active {
					background: #000;
				}

				/* Trending Section */
				.trending-section {
					background: #fff;
					padding: 20px 16px;
					margin-top: 8px;
				}


				.section-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16px;
				}

				.section-header h3 {
					font-size: 18px;
					font-weight: 600;
					color: #000;
					margin: 0;
				}

				.see-all {
					color: #007bff;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
				}

				.trending-articles {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.trending-article {
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.trending-image {
					width: 60px;
					height: 60px;
					border-radius: 8px;
					overflow: hidden;
					flex-shrink: 0;
				}

				.trending-image img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.trending-content {
					flex: 1;
				}

				.trending-meta {
					font-size: 12px;
					color: #6c757d;
					margin-bottom: 4px;
				}

				.source {
					font-weight: 500;
				}

				.trending-title {
					font-size: 14px;
					font-weight: 600;
					color: #000;
					margin: 0 0 4px 0;
					line-height: 1.4;
				}

				.trending-author {
					font-size: 12px;
					color: #6c757d;
					margin: 0;
				}

				.bookmark-btn {
					--color: #6c757d;
					margin: 0;
				}

				/* Bottom Navigation */
				.news-bottom-tabs {
					--background: #fff;
					border-top: 1px solid #e9ecef;
					height: 60px;
				}

				.news-bottom-tabs ion-tab-button {
					--color: #6c757d;
					--color-selected: #000;
				}

				.news-bottom-tabs ion-tab-button.tab-selected {
					--color: #000;
				}

				/* Search Bar */
				.search-bar {
					padding: 8px 16px;
					background: #f8f9fa;
					border-bottom: 1px solid #e9ecef;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.search-input {
					flex: 1;
					padding: 8px 12px;
					border: 1px solid #dee2e6;
					border-radius: 20px;
					background: white;
					font-size: 14px;
				}

				.search-input:focus {
					outline: none;
					border-color: #007bff;
				}

				.search-submit-btn {
					--color: #007bff;
					margin: 0;
				}

				/* Responsive */
				@media (max-width: 576px) {
					.featured-title {
						font-size: 16px;
					}
					
					.category-tab {
						font-size: 13px;
						padding: 6px 12px;
					}
					
					.trending-section {
						padding: 16px 12px;
					}
				}
			`}</style>
		</IonPage>
	);
};

export default HomePage;