import React, { useState, useEffect, useMemo } from 'react';
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
	IonBackButton,
	IonSearchbar,
	IonCheckbox,
	IonSegment,
	IonSegmentButton,
	IonLabel,
	IonText,
	IonSpinner,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonActionSheet,
	IonModal,
	IonGrid,
	IonRow,
	IonCol,
	IonChip,
	IonRefresher,
	IonRefresherContent
} from '@ionic/react';
import {
	filterOutline,
	gridOutline,
	listOutline,
	trashOutline,
	ellipsisVerticalOutline,
	searchOutline,
	heartOutline,
	eyeOutline,
	add
} from 'ionicons/icons';
import { useSelector, useDispatch } from 'react-redux';

// Components
import ArticleCard from '@components/ArticleCard';
import ArticleParserModal from '@components/ArticleParserModal';
import { useCustomToast } from '@hooks/useIonToast';
import useArticleParser from '@hooks/useArticleParser';

// Store and types
import { RootState } from '@store/store-rtk';
import { fetchPosts } from '@store/slices/postsSlice';
import { supabase } from '@store/rest';

// Types for filters and sorting
interface ArticleFilters {
	searchQuery: string;
	tags: string[];
	readStatus: 'all' | 'read' | 'unread' | 'favorites';
	dateRange: {
		start: string | null;
		end: string | null;
	};
	author: string[];
	sourceDomain: string[];
}

interface SortOptions {
	field: 'created_at' | 'title' | 'likes_count' | 'estimated_read_time' | 'updated_at';
	direction: 'asc' | 'desc';
}

type ViewMode = 'grid' | 'list';

const SeeAllArticlesPage: React.FC = () => {
	const history = useHistory();
	const dispatch = useDispatch();
	const showToast = useCustomToast();
	
	// Redux state
	const { items: articles, loading } = useSelector((state: RootState) => state.posts);
	const session = useSelector((state: RootState) => state.auth?.session);
	
	// Article parser hook (must be called before any early returns)
	const {
		parseUrl,
		parsedArticle,
		isParsingUrl,
		parseError,
		saveArticle,
		isSavingArticle,
		resetParser
	} = useArticleParser(session);
	
	// Local state
	const [filters, setFilters] = useState<ArticleFilters>({
		searchQuery: '',
		tags: [],
		readStatus: 'all',
		dateRange: { start: null, end: null },
		author: [],
		sourceDomain: []
	});
	
	const [sortOptions, setSortOptions] = useState<SortOptions>({
		field: 'created_at',
		direction: 'desc'
	});
	
	const [viewMode, setViewMode] = useState<ViewMode>('grid');
	const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
	const [showBulkActions, setShowBulkActions] = useState(false);
	const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
	const [showSingleActionSheet, setShowSingleActionSheet] = useState(false);
	const [selectedSingleArticle, setSelectedSingleArticle] = useState<string | null>(null);
	const [showArticleParserModal, setShowArticleParserModal] = useState(false);
	
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const [hasMorePages, setHasMorePages] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	
	// Load preferences from localStorage on mount
	useEffect(() => {
		const savedPreferences = localStorage.getItem('seeAllArticles_preferences');
		if (savedPreferences) {
			try {
				const prefs = JSON.parse(savedPreferences);
				setViewMode(prefs.viewMode || 'grid');
				setItemsPerPage(prefs.itemsPerPage || 25);
				setSortOptions(prefs.sortOptions || { field: 'created_at', direction: 'desc' });
			} catch (error) {
				console.error('Error loading preferences:', error);
			}
		}
	}, []);
	
	// Save preferences to localStorage when they change
	useEffect(() => {
		const preferences = {
			viewMode,
			itemsPerPage,
			sortOptions
		};
		localStorage.setItem('seeAllArticles_preferences', JSON.stringify(preferences));
	}, [viewMode, itemsPerPage, sortOptions]);
	
	
	// Load more data for infinite scroll
	const loadMoreData = async () => {
		if (isLoadingMore || !hasMorePages) return;
		
		setIsLoadingMore(true);
		try {
			const nextPage = currentPage + 1;
			const result = await dispatch(fetchPosts({ 
				page: nextPage, 
				limit: itemsPerPage,
				searchQuery: filters.searchQuery || undefined,
				tags: filters.tags.length > 0 ? filters.tags : undefined,
				userId: session?.user?.id
			}));
			setCurrentPage(nextPage);
			// Check if we have more pages
			if (fetchPosts.fulfilled.match(result)) {
				setHasMorePages(result.payload.posts.length === itemsPerPage);
			}
		} catch (error) {
			console.error('Error loading more data:', error);
			showToast({ 
				message: 'Errore nel caricamento di altri articoli', 
				color: 'danger' 
			});
		} finally {
			setIsLoadingMore(false);
		}
	};
	
	// Effect to load initial data and reload when filters change
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const result = await dispatch(fetchPosts({ 
					page: 1, 
					limit: itemsPerPage,
					searchQuery: filters.searchQuery || undefined,
					tags: filters.tags.length > 0 ? filters.tags : undefined,
					userId: session?.user?.id
				}));
				setCurrentPage(1);
				// Check if we have more pages by looking at the result
				if (fetchPosts.fulfilled.match(result)) {
					setHasMorePages(result.payload.posts.length === itemsPerPage);
				}
			} catch (error) {
				console.error('Error loading initial data:', error);
				// Note: showToast removed to avoid infinite loop
			}
		};
		
		setCurrentPage(1);
		loadInitialData();
	}, [dispatch, itemsPerPage, filters.searchQuery, filters.tags, session?.user?.id, sortOptions.field, sortOptions.direction]);
	
	// Filter and sort articles
	const filteredAndSortedArticles = useMemo(() => {
		let filtered = articles.filter(article => {
			// Search query filter
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase();
				const matchesTitle = article.title.toLowerCase().includes(query);
				const matchesContent = article.content?.toLowerCase().includes(query) || false;
				const matchesAuthor = article.author?.toLowerCase().includes(query) || false;
				if (!matchesTitle && !matchesContent && !matchesAuthor) {
					return false;
				}
			}
			
			// Tags filter
			if (filters.tags.length > 0) {
				const articleTags = article.tags || [];
				const hasMatchingTag = filters.tags.some(filterTag => 
					articleTags.includes(filterTag)
				);
				if (!hasMatchingTag) return false;
			}
			
			// Read status filter
			if (filters.readStatus !== 'all') {
				switch (filters.readStatus) {
					case 'read':
						// Articoli letti: reading_status è 'completed'
						if (article.reading_status !== 'completed') return false;
						break;
					case 'unread':
						// Articoli non letti: reading_status è 'unread', 'reading' o null
						if (article.reading_status === 'completed') return false;
						break;
					case 'favorites':
						if (!article.is_favorite) return false;
						break;
				}
			}
			
			// Date range filter
			if (filters.dateRange.start || filters.dateRange.end) {
				const articleDate = new Date(article.created_at || '');
				if (filters.dateRange.start && articleDate < new Date(filters.dateRange.start)) {
					return false;
				}
				if (filters.dateRange.end && articleDate > new Date(filters.dateRange.end)) {
					return false;
				}
			}
			
			// Author filter
			if (filters.author.length > 0 && article.author) {
				if (!filters.author.includes(article.author)) return false;
			}
			
			// Source domain filter
			if (filters.sourceDomain.length > 0 && article.url) {
				try {
					const domain = new URL(article.url).hostname;
					if (!filters.sourceDomain.includes(domain)) return false;
				} catch {
					return false;
				}
			}
			
			return true;
		});
		
		// Sort articles
		filtered.sort((a, b) => {
			let aVal: any, bVal: any;
			
			switch (sortOptions.field) {
				case 'created_at':
					aVal = new Date(a.created_at || '').getTime();
					bVal = new Date(b.created_at || '').getTime();
					break;
				case 'title':
					aVal = a.title.toLowerCase();
					bVal = b.title.toLowerCase();
					break;
				case 'likes_count':
					aVal = a.like_count || 0;
					bVal = b.like_count || 0;
					break;
				case 'estimated_read_time':
					aVal = a.estimated_read_time || 0;
					bVal = b.estimated_read_time || 0;
					break;
				case 'updated_at':
					aVal = new Date(a.updated_at || '').getTime();
					bVal = new Date(b.updated_at || '').getTime();
					break;
				default:
					return 0;
			}
			
			const multiplier = sortOptions.direction === 'asc' ? 1 : -1;
			if (aVal < bVal) return -1 * multiplier;
			if (aVal > bVal) return 1 * multiplier;
			return 0;
		});
		
		return filtered;
	}, [articles, filters, sortOptions]);
	
	// For infinite scroll, we show all loaded and filtered articles
	const displayedArticles = filteredAndSortedArticles;
	
	// Handle infinite scroll
	const loadMoreArticles = async (event: CustomEvent<void>) => {
		if (hasMorePages) {
			await loadMoreData();
		}
		(event.target as HTMLIonInfiniteScrollElement).complete();
	};
	
	// Handle article selection for bulk actions
	const toggleArticleSelection = (articleId: string) => {
		setSelectedArticles(prev => {
			if (prev.includes(articleId)) {
				return prev.filter(id => id !== articleId);
			} else {
				return [...prev, articleId];
			}
		});
	};
	
	// Select all visible articles
	const selectAllVisible = () => {
		const visibleIds = displayedArticles.map(article => article.id);
		setSelectedArticles(visibleIds);
	};
	
	// Clear selection
	const clearSelection = () => {
		setSelectedArticles([]);
	};
	
	// Handle bulk actions
	const handleBulkAction = (action: string) => {
		// TODO: Implement bulk actions
		console.log(`Bulk action: ${action} for articles:`, selectedArticles);
		showToast({ 
			message: `Azione "${action}" applicata a ${selectedArticles.length} articoli`,
			color: 'success' 
		});
		clearSelection();
		setShowBulkActions(false);
	};

	// Handle single article actions
	const handleSingleAction = (articleId: string, event: React.MouseEvent) => {
		event.stopPropagation(); // Prevent navigation to article
		console.log('Single action clicked for article:', articleId);
		console.log('Current session:', session);
		console.log('Current session user ID:', session?.user?.id);
		
		const article = displayedArticles.find(a => a.id === articleId);
		console.log('Found article:', article);
		console.log('Article user_id:', article?.user_id);
		console.log('Is owner?', article && session?.user && article.user_id === session.user.id);
		
		setSelectedSingleArticle(articleId);
		setShowSingleActionSheet(true);
		console.log('Action sheet should be open now');
	};

	// Handle single article deletion
	const handleSingleArticleDelete = async () => {
		if (!selectedSingleArticle || !session?.user) {
			showToast({
				message: 'Devi effettuare l\'accesso per eliminare articoli',
				color: 'warning',
			});
			return;
		}

		try {
			const articleToDelete = displayedArticles.find(a => a.id === selectedSingleArticle);
			if (!articleToDelete) return;

			// Only allow users to delete their own articles
			if (articleToDelete.user_id !== session.user.id) {
				showToast({
					message: 'Puoi eliminare solo i tuoi articoli',
					color: 'warning',
				});
				setShowSingleActionSheet(false);
				setSelectedSingleArticle(null);
				return;
			}

			// Delete from Supabase
			const { error } = await supabase
				.from('articles')
				.delete()
				.eq('id', selectedSingleArticle);

			if (error) throw error;

			showToast({
				message: 'Articolo eliminato con successo',
				color: 'success',
			});

			// Refresh the list
			setCurrentPage(1);
			await dispatch(fetchPosts({ 
				page: 1, 
				limit: itemsPerPage,
				searchQuery: filters.searchQuery || undefined,
				tags: filters.tags.length > 0 ? filters.tags : undefined,
				userId: session?.user?.id
			}));

		} catch (error: any) {
			console.error('Errore eliminazione articolo:', error);
			showToast({
				message: 'Errore durante l\'eliminazione dell\'articolo',
				color: 'danger',
			});
		} finally {
			setShowSingleActionSheet(false);
			setSelectedSingleArticle(null);
		}
	};
	
	// Handle refresh
	const handleRefresh = async (event: CustomEvent) => {
		// TODO: Refresh articles from API
		setTimeout(() => {
			event.detail.complete();
			showToast({ 
				message: 'Articoli aggiornati',
				color: 'success' 
			});
		}, 1000);
	};
	
	// Clear all filters
	const clearAllFilters = () => {
		setFilters({
			searchQuery: '',
			tags: [],
			readStatus: 'all',
			dateRange: { start: null, end: null },
			author: [],
			sourceDomain: []
		});
		setCurrentPage(1);
	};
	
	// Article parser functions
	const handleOpenParser = () => {
		setShowArticleParserModal(true);
	};

	const handleCloseParser = () => {
		setShowArticleParserModal(false);
		resetParser();
	};

	const handleSubmitUrl = async (url: string) => {
		await parseUrl(url);
	};

	const handleSaveArticle = async (article: any) => {
		try {
			await saveArticle(article);
			showToast({
				message: 'Articolo salvato con successo!',
				color: 'success'
			});
			// Reload articles to show the new one
			await loadMoreData();
		} catch (error) {
			console.error('Error saving article:', error);
			showToast({
				message: 'Errore durante il salvataggio dell\'articolo',
				color: 'danger'
			});
		}
	};
	
	// Get unique values for filter options
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const getFilterOptions = useMemo(() => {
		const allTags = new Set<string>();
		const allAuthors = new Set<string>();
		const allDomains = new Set<string>();
		
		articles.forEach(article => {
			// Collect tags
			if (article.tags) {
				article.tags.forEach(tag => allTags.add(tag));
			}
			
			// Collect authors
			if (article.author) {
				allAuthors.add(article.author);
			}
			
			// Collect domains
			if (article.url) {
				try {
					const domain = new URL(article.url).hostname;
					allDomains.add(domain);
				} catch {
					// Invalid URL, skip
				}
			}
		});
		
		return {
			tags: Array.from(allTags).sort(),
			authors: Array.from(allAuthors).sort(),
			domains: Array.from(allDomains).sort()
		};
	}, [articles]);
	
	// Security check: redirect if not authenticated
	if (!session?.user?.id) {
		return (
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonButtons slot="start">
							<IonBackButton defaultHref="/home" />
						</IonButtons>
						<IonTitle>Accesso Richiesto</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<div className="flex flex-col items-center justify-center h-full text-center">
						<h2>Accesso Richiesto</h2>
						<p>Devi essere autenticato per visualizzare gli articoli.</p>
						<IonButton routerLink="/home" fill="solid">
							Torna alla Home
						</IonButton>
					</div>
				</IonContent>
			</IonPage>
		);
	}
	
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/home" />
					</IonButtons>
					<IonTitle>Tutti gli Articoli</IonTitle>
					<IonButtons slot="end">
						{selectedArticles.length > 0 && (
							<IonButton 
								fill="clear" 
								onClick={() => setShowBulkActions(true)}
							>
								<IonIcon icon={ellipsisVerticalOutline} />
							</IonButton>
						)}
						<IonButton 
							fill="clear" 
							onClick={handleOpenParser}
						>
							<IonIcon icon={add} />
						</IonButton>
						<IonButton 
							fill="clear" 
							onClick={() => setIsFilterModalOpen(true)}
						>
							<IonIcon icon={filterOutline} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			
			<IonContent>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>
				
				{/* Header Stats and Controls */}
				<div className="articles-header" style={{ padding: '16px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
						<div>
							<IonText>
								<h2 style={{ margin: 0 }}>
									{filteredAndSortedArticles.length} articoli
									{filters.searchQuery && ` per "${filters.searchQuery}"`}
								</h2>
							</IonText>
							{filters.tags.length > 0 && (
								<div style={{ marginTop: '8px' }}>
									{filters.tags.map(tag => (
										<IonChip key={tag} color="primary">
											<IonLabel>{tag}</IonLabel>
										</IonChip>
									))}
								</div>
							)}
						</div>
						
						{/* View Mode Toggle */}
						<IonSegment 
							value={viewMode} 
							onIonChange={e => setViewMode(e.detail.value as ViewMode)}
						>
							<IonSegmentButton value="grid">
								<IonIcon icon={gridOutline} />
							</IonSegmentButton>
							<IonSegmentButton value="list">
								<IonIcon icon={listOutline} />
							</IonSegmentButton>
						</IonSegment>
					</div>
					
					{/* Search Bar */}
					<IonSearchbar
						value={filters.searchQuery}
						onIonInput={e => {
							setFilters(prev => ({ ...prev, searchQuery: e.detail.value! }));
							setCurrentPage(1);
						}}
						placeholder="Cerca per titolo, contenuto o autore..."
						showClearButton="focus"
					/>
					
					{/* Quick Filters */}
					<div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
						<IonChip 
							color={filters.readStatus === 'read' ? 'primary' : 'medium'}
							onClick={() => {
								setFilters(prev => ({ 
									...prev, 
									readStatus: prev.readStatus === 'read' ? 'all' : 'read' 
								}));
								setCurrentPage(1);
							}}
						>
							<IonLabel>Letti</IonLabel>
						</IonChip>
						<IonChip 
							color={filters.readStatus === 'unread' ? 'primary' : 'medium'}
							onClick={() => {
								setFilters(prev => ({ 
									...prev, 
									readStatus: prev.readStatus === 'unread' ? 'all' : 'unread' 
								}));
								setCurrentPage(1);
							}}
						>
							<IonLabel>Non letti</IonLabel>
						</IonChip>
						<IonChip 
							color={filters.readStatus === 'favorites' ? 'primary' : 'medium'}
							onClick={() => {
								setFilters(prev => ({ 
									...prev, 
									readStatus: prev.readStatus === 'favorites' ? 'all' : 'favorites' 
								}));
								setCurrentPage(1);
							}}
						>
							<IonIcon icon={heartOutline} />
							<IonLabel>Preferiti</IonLabel>
						</IonChip>
						{(filters.searchQuery || filters.tags.length > 0 || filters.readStatus !== 'all') && (
							<IonChip 
								color="danger" 
								onClick={clearAllFilters}
							>
								<IonLabel>Cancella filtri</IonLabel>
							</IonChip>
						)}
					</div>
				</div>
				
				{/* Articles Grid/List */}
				{loading.fetchPosts ? (
					<div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
						<IonSpinner name="circular" />
					</div>
				) : displayedArticles.length === 0 ? (
					<div style={{ textAlign: 'center', padding: '40px' }}>
						<IonIcon 
							icon={searchOutline} 
							style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }} 
						/>
						<IonText>
							<h3>Nessun articolo trovato</h3>
							<p>Prova a modificare i filtri di ricerca</p>
						</IonText>
					</div>
				) : (
					<div className={viewMode === 'grid' ? 'articles-grid' : 'articles-list'}>
						{viewMode === 'grid' ? (
							<IonGrid>
								<IonRow>
									{displayedArticles.map(article => (
										<IonCol 
											key={article.id} 
											size="12" 
											sizeSm="6" 
											sizeMd="4" 
											sizeLg="3"
										>
											<div style={{ position: 'relative' }}>
												{selectedArticles.length > 0 && (
													<IonCheckbox
														checked={selectedArticles.includes(article.id)}
														onIonChange={() => toggleArticleSelection(article.id)}
														style={{
															position: 'absolute',
															top: '8px',
															right: '8px',
															zIndex: 10,
															background: 'rgba(255,255,255,0.9)',
															borderRadius: '4px'
														}}
													/>
												)}
												<ArticleCard
													article={article}
													session={session}
																									/>
											</div>
										</IonCol>
									))}
								</IonRow>
							</IonGrid>
						) : (
							<div style={{ padding: '0' }}>
								{displayedArticles.map(article => (
									<div 
										key={article.id}
										onClick={() => history.push(`/article/${article.id}`)}
										style={{
											border: '1px solid #e5e7eb',
											borderRadius: '12px',
											margin: '8px 16px',
											padding: '16px',
											background: 'var(--ion-color-light, #ffffff)',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
											position: 'relative',
											boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
										}}
										className="ion-activatable"
									>
										{/* Selection Checkbox */}
										{selectedArticles.length > 0 && (
											<IonCheckbox
												checked={selectedArticles.includes(article.id)}
												onIonChange={(e) => {
													e.stopPropagation();
													toggleArticleSelection(article.id);
												}}
												style={{
													position: 'absolute',
													top: '12px',
													left: '12px',
													zIndex: 10
												}}
											/>
										)}

										{/* Ellipsis Button */}
										{session?.user && selectedArticles.length === 0 && (
											<IonButton
												fill="clear"
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													console.log('Ellipsis clicked for article:', article.id);
													handleSingleAction(article.id, e);
												}}
												style={{
													position: 'absolute',
													top: '8px',
													right: '8px',
													zIndex: 100
												}}
											>
												<IonIcon icon={ellipsisVerticalOutline} />
											</IonButton>
										)}
										
										{/* Main Content Container */}
										<div style={{ display: 'flex', gap: '12px' }}>
											{/* Article Image */}
											{article.image_url && (
												<div style={{ 
													flexShrink: 0,
													width: '80px',
													height: '80px',
													borderRadius: '8px',
													overflow: 'hidden',
													backgroundColor: 'var(--ion-color-light-shade, #f5f5f5)'
												}}>
													<img 
														src={article.image_url} 
														alt={article.title}
														style={{
															width: '100%',
															height: '100%',
															objectFit: 'cover'
														}}
														onError={(e) => {
															e.currentTarget.style.display = 'none';
														}}
													/>
												</div>
											)}
											
											{/* Article Content */}
											<div style={{ flex: 1 }}>
												{/* Tags */}
												{article.tags && article.tags.length > 0 && (
													<div style={{ marginBottom: '8px' }}>
														{article.tags.slice(0, 2).map(tag => (
															<IonChip 
																key={tag} 
																color="primary"
																style={{
																	height: '24px',
																	fontSize: '12px',
																	marginRight: '6px',
																	marginBottom: '0'
																}}
															>
																<IonLabel>{tag}</IonLabel>
															</IonChip>
														))}
													</div>
												)}
												
												{/* Title */}
												<h3 style={{ 
													margin: '0 0 12px 0', 
													fontSize: '18px',
													fontWeight: 'bold',
													lineHeight: '1.4',
													color: 'var(--ion-color-dark, #000000)'
												}}>
													{article.title}
												</h3>
											</div>
										</div>
										
										{/* Metadata */}
										<div style={{ 
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginTop: 'auto'
										}}>
											<div style={{ 
												color: 'var(--ion-color-medium, #666)', 
												fontSize: '14px' 
											}}>
												{article.author && `${article.author} • `}
												{new Date(article.created_at || '').toLocaleDateString('it-IT')} • 
												{article.estimated_read_time ? `${article.estimated_read_time} min` : '5 min'}
											</div>
											
											{/* View Count */}
											<div style={{ 
												display: 'flex', 
												alignItems: 'center',
												color: 'var(--ion-color-medium, #666)',
												fontSize: '14px'
											}}>
												<IonIcon 
													icon={eyeOutline} 
													style={{ marginRight: '4px', fontSize: '16px' }}
												/>
												{article.like_count || Math.floor(Math.random() * 2000 + 100)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
				
				{/* Infinite Scroll */}
				<IonInfiniteScroll
					onIonInfinite={loadMoreArticles}
					threshold="100px"
					disabled={!hasMorePages}
				>
					<IonInfiniteScrollContent
						loadingSpinner="bubbles"
						loadingText="Caricamento articoli..."
					>
					</IonInfiniteScrollContent>
				</IonInfiniteScroll>
				
				{/* Selection Info Bar */}
				{selectedArticles.length > 0 && (
					<div style={{
						position: 'sticky',
						bottom: 0,
						background: '#007bff',
						color: 'white',
						padding: '12px 16px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}>
						<span>{selectedArticles.length} articoli selezionati</span>
						<div>
							<IonButton fill="clear" color="light" onClick={selectAllVisible}>
								Seleziona tutti
							</IonButton>
							<IonButton fill="clear" color="light" onClick={clearSelection}>
								Deseleziona
							</IonButton>
						</div>
					</div>
				)}
			</IonContent>
			
			{/* Action Sheet for Bulk Actions */}
			<IonActionSheet
				isOpen={showBulkActions}
				onDidDismiss={() => setShowBulkActions(false)}
				cssClass="my-custom-class"
				buttons={[
					{
						text: 'Segna come letto',
						icon: eyeOutline,
						handler: () => handleBulkAction('mark-read')
					},
					{
						text: 'Segna come non letto',
						icon: eyeOutline,
						handler: () => handleBulkAction('mark-unread')
					},
					{
						text: 'Aggiungi ai preferiti',
						icon: heartOutline,
						handler: () => handleBulkAction('add-favorites')
					},
					{
						text: 'Rimuovi dai preferiti',
						icon: heartOutline,
						handler: () => handleBulkAction('remove-favorites')
					},
					{
						text: 'Elimina',
						role: 'destructive',
						icon: trashOutline,
						handler: () => handleBulkAction('delete')
					},
					{
						text: 'Annulla',
						role: 'cancel'
					}
				]}
			/>

			{/* Action Sheet for Single Article Actions */}
			<IonActionSheet
				isOpen={showSingleActionSheet}
				onDidDismiss={() => {
					setShowSingleActionSheet(false);
					setSelectedSingleArticle(null);
				}}
				cssClass="single-article-action-sheet"
				header="Azioni articolo"
				buttons={(() => {
					const selectedArticle = selectedSingleArticle 
						? displayedArticles.find(a => a.id === selectedSingleArticle)
						: null;
					const isOwner = !!(selectedArticle && session?.user && selectedArticle.user_id === session.user.id);

					console.log('Action sheet buttons generation:');
					console.log('- selectedSingleArticle:', selectedSingleArticle);
					console.log('- selectedArticle:', selectedArticle);
					console.log('- session?.user?.id:', session?.user?.id);
					console.log('- selectedArticle?.user_id:', selectedArticle?.user_id);
					console.log('- isOwner:', isOwner);

					const buttons: any[] = [
						{
							text: 'Segna come letto',
							icon: eyeOutline,
							handler: () => {
								console.log('Mark as read:', selectedSingleArticle);
								setShowSingleActionSheet(false);
								setSelectedSingleArticle(null);
							}
						},
						{
							text: 'Aggiungi ai preferiti',
							icon: heartOutline,
							handler: () => {
								console.log('Add to favorites:', selectedSingleArticle);
								setShowSingleActionSheet(false);
								setSelectedSingleArticle(null);
							}
						},
						// Always show delete for testing
						{
							text: 'Elimina (TEST)',
							role: 'destructive',
							icon: trashOutline,
							handler: () => {
								console.log('Delete clicked (test)');
								handleSingleArticleDelete();
							}
						}
					];

					// Add delete button only if user owns the article
					if (isOwner) {
						console.log('Adding delete button because user owns article');
						buttons.push({
							text: 'Elimina',
							role: 'destructive',
							icon: trashOutline,
							handler: () => handleSingleArticleDelete()
						});
					} else {
						console.log('NOT adding delete button - user does not own article');
					}

					buttons.push({
						text: 'Annulla',
						role: 'cancel'
					});

					console.log('Final buttons array:', buttons.map(b => b.text));
					return buttons;
				})()}
			/>
			
			{/* Filters Modal - TODO: Implement detailed filters */}
			<IonModal isOpen={isFilterModalOpen} onDidDismiss={() => setIsFilterModalOpen(false)}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>Filtri Avanzati</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={() => setIsFilterModalOpen(false)}>Chiudi</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				<IonContent>
					<div style={{ padding: '16px' }}>
						<IonText>
							<h3>Filtri avanzati in arrivo...</h3>
							<p>Questa funzionalità verrà implementata nella prossima iterazione.</p>
						</IonText>
					</div>
				</IonContent>
			</IonModal>
			
			{/* Article Parser Modal */}
			<ArticleParserModal
				isOpen={showArticleParserModal}
				onClose={handleCloseParser}
				onSubmitUrl={handleSubmitUrl}
				onSave={handleSaveArticle}
				article={parsedArticle}
				isLoading={isParsingUrl || isSavingArticle}
				session={session}
				error={parseError}
			/>
		</IonPage>
	);
};

export default SeeAllArticlesPage;