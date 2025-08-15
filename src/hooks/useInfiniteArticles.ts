import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
	fetchPosts,
	selectPosts,
	selectPostsLoading,
	selectPostsErrors,
	deletePost,
	updatePost
} from '@store/slices/postsSlice';
import { showSuccess, showError } from '@store/slices/toastSlice';
import { SortOptions, FilterOptions, ViewMode } from '@components/ArticleSortControls';
import type { Post } from '@store/slices/postsSlice';

export interface UseInfiniteArticlesOptions {
	session: Session | null;
	pageSize?: number;
	initialSortOptions?: SortOptions;
	initialFilterOptions?: FilterOptions;
	initialViewMode?: ViewMode;
}

export interface UseInfiniteArticlesReturn {
	// Article data
	articles: Post[];
	filteredArticles: Post[];
	totalCount: number;
	
	// Loading states
	isLoading: boolean;
	isLoadingMore: boolean;
	hasMore: boolean;
	
	// Actions
	loadMore: () => Promise<void>;
	refresh: () => Promise<void>;
	deleteArticle: (articleId: string) => Promise<void>;
	toggleFavorite: (articleId: string) => Promise<void>;
	markAsRead: (articleId: string) => Promise<void>;
	
	// Sort and filter
	sortOptions: SortOptions;
	setSortOptions: (options: SortOptions) => void;
	filterOptions: FilterOptions;
	setFilterOptions: (options: FilterOptions) => void;
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
	
	// Utility
	availableDomains: string[];
	availableTags: string[];
	
	// Pagination info
	currentPage: number;
	totalPages: number;
}

const useInfiniteArticles = ({
	session,
	pageSize = 20,
	initialSortOptions = { field: 'date', order: 'desc' },
	initialFilterOptions = {
		showRead: true,
		showUnread: true,
		showFavorites: false,
		domains: [],
		tags: []
	},
	initialViewMode = 'default' as ViewMode
}: UseInfiniteArticlesOptions): UseInfiniteArticlesReturn => {
	const dispatch = useAppDispatch();
	
	// Redux state
	const articlesFromRedux = useAppSelector(selectPosts);
	const articles = articlesFromRedux || [];
	
	// Debug logging (keep for troubleshooting)
	if (process.env.NODE_ENV === 'development') {
		console.log('useInfiniteArticles - articles from Redux:', articles?.length, 'articles');
	}
	const postsLoading = useAppSelector(selectPostsLoading) || {};
	const { fetchPosts: isFetchingPosts } = postsLoading;
	const postsErrors = useAppSelector(selectPostsErrors) || {};
	const { fetch: fetchError } = postsErrors;
	
	// Local state
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [sortOptions, setSortOptions] = useState<SortOptions>(initialSortOptions);
	const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);
	const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
	const [totalCount, setTotalCount] = useState(0);

	// Sort function
	const sortArticles = useCallback((articles: Post[], options: SortOptions): Post[] => {
		return [...articles].sort((a, b) => {
			let aValue: any;
			let bValue: any;
			
			switch (options.field) {
				case 'date':
					aValue = new Date(a.created_at || a.published_date || 0);
					bValue = new Date(b.created_at || b.published_date || 0);
					break;
				case 'title':
					aValue = a.title?.toLowerCase() || '';
					bValue = b.title?.toLowerCase() || '';
					break;
				case 'reading_time':
					aValue = a.estimated_read_time || 0;
					bValue = b.estimated_read_time || 0;
					break;
				case 'author':
					aValue = a.author?.toLowerCase() || '';
					bValue = b.author?.toLowerCase() || '';
					break;
				case 'domain':
					aValue = a.domain?.toLowerCase() || '';
					bValue = b.domain?.toLowerCase() || '';
					break;
				default:
					return 0;
			}
			
			if (aValue < bValue) return options.order === 'asc' ? -1 : 1;
			if (aValue > bValue) return options.order === 'asc' ? 1 : -1;
			return 0;
		});
	}, []);

	// Filter function
	const filterArticles = useCallback((articles: Post[], options: FilterOptions): Post[] => {
		if (process.env.NODE_ENV === 'development') {
			console.log('filterArticles called with:', articles?.length, 'articles and options:', options);
		}
		
		const filtered = articles.filter(article => {
			// Reading status filter - consider null/undefined reading_status as unread
			const isRead = article.reading_status === 'completed';
			const isUnread = !isRead; // null, undefined, or any other status is considered unread
			
			if (!options.showRead && isRead) return false;
			if (!options.showUnread && isUnread) return false;
			
			// Favorites filter - only filter if showFavorites is true AND article is not favorite
			if (options.showFavorites && !article.is_favorite) return false;
			
			// Domain filter
			if (options.domains.length > 0 && !options.domains.includes(article.domain || '')) return false;
			
			// Tags filter
			if (options.tags.length > 0) {
				const articleTags = article.tags || [];
				const hasMatchingTag = options.tags.some(tag => 
					articleTags.includes(tag) ||
					article.title?.toLowerCase().includes(tag.toLowerCase()) ||
					article.excerpt?.toLowerCase().includes(tag.toLowerCase())
				);
				if (!hasMatchingTag) return false;
			}
			
			return true;
		});
		
		if (process.env.NODE_ENV === 'development') {
			console.log('filterArticles result:', filtered?.length, 'articles after filtering');
		}
		
		return filtered;
	}, []);

	// Get available domains and tags for filters
	const availableDomains = useMemo(() => {
		const domains = articles
			.map(article => article.domain)
			.filter(Boolean)
			.filter((domain, index, arr) => arr.indexOf(domain) === index) as string[];
		return domains.sort();
	}, [articles]);

	const availableTags = useMemo(() => {
		const tags: string[] = [];
		articles.forEach(article => {
			if (article.tags) {
				tags.push(...article.tags);
			}
		});
		return [...new Set(tags)].sort();
	}, [articles]);

	// Apply sorting and filtering
	const filteredArticles = useMemo(() => {
		const filtered = filterArticles(articles, filterOptions);
		const sorted = sortArticles(filtered, sortOptions);
		return sorted;
	}, [articles, sortOptions, filterOptions, sortArticles, filterArticles]);

	// Calculate pagination info
	const totalPages = useMemo(() => {
		return Math.ceil(filteredArticles.length / pageSize);
	}, [filteredArticles.length, pageSize]);

	// Load initial articles
	const loadArticles = useCallback(async (page: number = 1, append: boolean = false) => {
		if (!session?.user) {
			console.log('loadArticles: No session or user, skipping');
			return;
		}

		console.log('loadArticles called with:', { page, append, userId: session.user.id, pageSize });

		try {
			console.log('loadArticles: About to dispatch fetchPosts...');
			const response = await dispatch(fetchPosts({
				userId: session.user.id,
				page,
				limit: pageSize
			})).unwrap();
			
			console.log('loadArticles: fetchPosts response SUCCESS:', response);
			console.log('loadArticles: Posts received:', response.posts?.length, 'posts');

			// Update pagination state
			const hasMoreItems = response.posts.length === pageSize;
			setHasMore(hasMoreItems);
			setTotalCount(response.totalItems || 0);

			if (!append) {
				setCurrentPage(1);
			}
		} catch (error) {
			console.error('loadArticles: fetchPosts ERROR:', error);
			dispatch(showError('Failed to load articles'));
		}
	}, [session, dispatch, pageSize]);

	// Load more articles (infinite scroll)
	const loadMore = useCallback(async () => {
		if (!hasMore || isLoadingMore || !session?.user) return;

		setIsLoadingMore(true);
		try {
			const nextPage = currentPage + 1;
			await loadArticles(nextPage, true);
			setCurrentPage(nextPage);
		} catch (error) {
			console.error('Error loading more articles:', error);
		} finally {
			setIsLoadingMore(false);
		}
	}, [hasMore, isLoadingMore, currentPage, loadArticles, session]);

	// Refresh articles
	const refresh = useCallback(async () => {
		setCurrentPage(1);
		setHasMore(true);
		await loadArticles(1, false);
	}, [loadArticles]);

	// Delete article
	const deleteArticle = useCallback(async (articleId: string) => {
		try {
			await dispatch(deletePost(articleId)).unwrap();
			dispatch(showSuccess('Article deleted successfully'));
			setTotalCount(prev => prev - 1);
		} catch (error) {
			console.error('Error deleting article:', error);
			dispatch(showError('Failed to delete article'));
			throw error;
		}
	}, [dispatch]);

	// Toggle favorite status
	const toggleFavorite = useCallback(async (articleId: string) => {
		try {
			const article = articles.find(a => a.id === articleId);
			if (!article) return;

			await dispatch(updatePost({
				id: article.id,
				updates: {
					is_favorite: !article.is_favorite
				}
			})).unwrap();

			const message = !article.is_favorite 
				? 'Added to favorites' 
				: 'Removed from favorites';
			dispatch(showSuccess(message));
		} catch (error) {
			console.error('Error toggling favorite:', error);
			dispatch(showError('Failed to update favorite status'));
			throw error;
		}
	}, [articles, dispatch]);

	// Mark article as read
	const markAsRead = useCallback(async (articleId: string) => {
		try {
			const article = articles.find(a => a.id === articleId);
			if (!article || article.reading_status === 'completed') return;

			await dispatch(updatePost({
				id: article.id,
				updates: {
					reading_status: 'completed' as const,
					updated_at: new Date().toISOString()
				}
			})).unwrap();

			dispatch(showSuccess('Marked as read'));
		} catch (error) {
			console.error('Error marking as read:', error);
			dispatch(showError('Failed to mark as read'));
			throw error;
		}
	}, [articles, dispatch]);

	// Handle sort options change
	const handleSortChange = useCallback((newOptions: SortOptions) => {
		setSortOptions(newOptions);
		// Optionally persist to localStorage
		localStorage.setItem('articleSortOptions', JSON.stringify(newOptions));
	}, []);

	// Handle filter options change
	const handleFilterChange = useCallback((newOptions: FilterOptions) => {
		setFilterOptions(newOptions);
		// Optionally persist to localStorage
		localStorage.setItem('articleFilterOptions', JSON.stringify(newOptions));
	}, []);

	// Handle view mode change
	const handleViewModeChange = useCallback((newMode: ViewMode) => {
		setViewMode(newMode);
		// Optionally persist to localStorage
		localStorage.setItem('articleViewMode', newMode);
	}, []);

	// Load initial data
	useEffect(() => {
		console.log('useInfiniteArticles - useEffect triggered:', { 
			hasSession: !!session?.user, 
			userId: session?.user?.id 
		});
		if (session?.user) {
			console.log('useInfiniteArticles - calling loadArticles...');
			loadArticles();
		} else {
			console.log('useInfiniteArticles - no session, skipping loadArticles');
		}
	}, [session, loadArticles]);

	// Load saved preferences on mount
	useEffect(() => {
		try {
			const savedSort = localStorage.getItem('articleSortOptions');
			if (savedSort) {
				setSortOptions(JSON.parse(savedSort));
			}

			const savedFilter = localStorage.getItem('articleFilterOptions');
			if (savedFilter) {
				setFilterOptions(JSON.parse(savedFilter));
			}

			const savedViewMode = localStorage.getItem('articleViewMode');
			if (savedViewMode) {
				setViewMode(savedViewMode as ViewMode);
			}
		} catch (error) {
			console.warn('Failed to load saved preferences:', error);
		}
	}, []);

	// Handle fetch errors
	useEffect(() => {
		if (fetchError) {
			dispatch(showError(fetchError));
		}
	}, [fetchError, dispatch]);

	return {
		// Article data
		articles,
		filteredArticles,
		totalCount,
		
		// Loading states
		isLoading: isFetchingPosts,
		isLoadingMore,
		hasMore,
		
		// Actions
		loadMore,
		refresh,
		deleteArticle,
		toggleFavorite,
		markAsRead,
		
		// Sort and filter
		sortOptions,
		setSortOptions: handleSortChange,
		filterOptions,
		setFilterOptions: handleFilterChange,
		viewMode,
		setViewMode: handleViewModeChange,
		
		// Utility
		availableDomains,
		availableTags,
		
		// Pagination info
		currentPage,
		totalPages
	};
};

export default useInfiniteArticles;