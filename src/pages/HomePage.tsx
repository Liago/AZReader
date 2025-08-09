import React, { useState, useRef } from 'react';
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
	IonFab,
	IonFabButton,
	IonRefresher,
	IonRefresherContent,
	RefresherEventDetail,
	IonSegment,
	IonSegmentButton,
	IonLabel
} from '@ionic/react';
import {
	searchOutline,
	bookmarkOutline,
	notificationsOutline,
	personOutline,
	homeOutline,
	addOutline,
	refreshOutline,
	trendingUpOutline,
	gridOutline
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import ArticlePreviewModal from '@components/ArticlePreviewModal';
import ArticleList from '@components/ArticleList';
import { Auth } from '@components/form/authentication';
import useAuth from '@hooks/useAuth';
import useArticleParser from '@hooks/useArticleParser';

// Types
type TabType = 'latest' | 'saved' | 'trending' | 'categories';

const HomePage: React.FC = () => {
	const { session, signOut } = useAuth();
	const {
		parseUrl,
		parsedArticle,
		isParsingUrl,
		parseError,
		saveArticle,
		isSavingArticle,
		articles,
		loadArticles,
		isLoadingArticles,
		resetParser
	} = useArticleParser(session as Session | null);

	// Component state
	const pageRef = useRef<HTMLElement>(null);
	const [activeTab, setActiveTab] = useState<TabType>('latest');
	const [showModal, setShowModal] = useState<boolean>(false);

	// Get current date for display
	const getCurrentDate = (): string => {
		const today = new Date();
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return today.toLocaleDateString('en-US', options);
	};

	// Handle pull to refresh
	const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
		try {
			await loadArticles();
		} finally {
			event.detail.complete();
		}
	};

	// Handle URL parsing
	const handleUrlParse = async (url: string) => {
		await parseUrl(url);
	};

	// Handle article save
	const handleArticleSave = async (
		article: any,
		tags: string[],
		notes?: string
	) => {
		await saveArticle(article, tags, notes);
		setShowModal(false);
	};

	// Handle modal close
	const handleModalClose = () => {
		resetParser();
		setShowModal(false);
	};

	// Handle add article button
	const handleAddArticle = () => {
		resetParser();
		setShowModal(true);
	};

	// Render content based on authentication state
	const renderContent = (): JSX.Element => {
		if (!session) {
			return <Auth />;
		}

		return (
			<>
				{/* Pull to refresh */}
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent
						pullingIcon={refreshOutline}
						refreshingSpinner="circles"
						refreshingText="Refreshing articles..."
					/>
				</IonRefresher>

				{/* Tab content */}
				<div className="tab-content">
					{activeTab === 'latest' && (
						<ArticleList
							session={session as Session}
						/>
					)}
					
					{activeTab === 'saved' && (
						<ArticleList
							session={session as Session}
						/>
					)}

					{activeTab === 'trending' && (
						<div className="coming-soon">
							<IonIcon
								icon={trendingUpOutline}
								size="large"
								color="medium"
							/>
							<p>Trending articles coming soon!</p>
						</div>
					)}

					{activeTab === 'categories' && (
						<div className="coming-soon">
							<IonIcon
								icon={gridOutline}
								size="large"
								color="medium"
							/>
							<p>Categories coming soon!</p>
						</div>
					)}
				</div>

				{/* Floating action button */}
				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton onClick={handleAddArticle} color="primary">
						<IonIcon icon={addOutline} />
					</IonFabButton>
				</IonFab>

				{/* Article preview modal */}
				<ArticlePreviewModal
					isOpen={showModal}
					onClose={handleModalClose}
					onSave={handleArticleSave}
					onParseUrl={handleUrlParse}
					article={parsedArticle}
					isLoading={isParsingUrl}
					error={parseError}
					session={session}
				/>
			</>
		);
	};

	return (
		<IonPage id="home-page" ref={pageRef}>
			{/* Header */}
			<IonHeader className="ion-no-border bg-white">
				<IonToolbar className="bg-white">
					<IonButtons slot="start">
						<IonMenuButton autoHide={false} color="dark" />
					</IonButtons>
					
					<div className="header-content">
						<IonTitle className="text-xl font-bold text-black">
							{session ? 'My Reading List' : 'AZReader'}
						</IonTitle>
						<p className="header-date">{getCurrentDate()}</p>
					</div>
					
					<IonButtons slot="primary">
						<IonButton color="dark">
							<IonIcon slot="icon-only" icon={searchOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				
				{/* Tab Navigation */}
				{session && (
					<div className="tab-navigation">
						<IonSegment
							value={activeTab}
							onIonChange={(e) => setActiveTab(e.detail.value as TabType)}
						>
							<IonSegmentButton value="latest">
								<IonLabel>Latest</IonLabel>
							</IonSegmentButton>
							<IonSegmentButton value="saved">
								<IonLabel>Saved</IonLabel>
							</IonSegmentButton>
							<IonSegmentButton value="trending">
								<IonLabel>Trending</IonLabel>
							</IonSegmentButton>
							<IonSegmentButton value="categories">
								<IonLabel>Categories</IonLabel>
							</IonSegmentButton>
						</IonSegment>
					</div>
				)}
			</IonHeader>
			
			{/* Main content */}
			<IonContent fullscreen>
				{renderContent()}
			</IonContent>
			
			{/* Bottom tab navigation */}
			<IonTabBar slot="bottom" className="bottom-tabs">
				<IonTabButton tab="home" href="/home">
					<IonIcon icon={homeOutline} />
					<IonLabel>Home</IonLabel>
				</IonTabButton>
				
				<IonTabButton tab="saved" href="/saved">
					<IonIcon icon={bookmarkOutline} />
					<IonLabel>Saved</IonLabel>
				</IonTabButton>
				
				<IonTabButton tab="notifications" href="/notifications">
					<IonIcon icon={notificationsOutline} />
					<IonLabel>Notifications</IonLabel>
				</IonTabButton>
				
				<IonTabButton tab="profile" href="/profile">
					<IonIcon icon={personOutline} />
					<IonLabel>Profile</IonLabel>
				</IonTabButton>
			</IonTabBar>

			{/* Styles */}
			<style>{`
				.header-content {
					display: flex;
					flex-direction: column;
					align-items: center;
				}

				.header-date {
					font-size: 12px;
					color: var(--ion-color-medium);
					margin: 0;
				}

				.tab-navigation {
					padding: 8px 16px;
				}

				.tab-content {
					min-height: 100%;
				}

				.coming-soon {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 50vh;
					padding: 32px;
					text-align: center;
					color: var(--ion-color-medium);
				}

				.bottom-tabs {
					border-top: 1px solid var(--ion-color-light);
				}

				.bottom-tabs ion-tab-button {
					color: var(--ion-color-medium);
				}

				.bottom-tabs ion-tab-button.tab-selected {
					color: var(--ion-color-primary);
				}

				@media (max-width: 576px) {
					.header-content ion-title {
						font-size: 18px;
					}
					
					.tab-navigation {
						padding: 4px 8px;
					}
					
					.tab-navigation ion-segment-button {
						--padding-start: 8px;
						--padding-end: 8px;
					}
				}
			`}</style>
		</IonPage>
	);
};

export default HomePage;