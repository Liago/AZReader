import { useState, useCallback, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
	createPost,
	selectPostsLoading,
	selectPostsErrors,
	selectPosts,
	fetchPosts
} from '@store/slices/postsSlice';
import {
	showSuccess,
	showError
} from '@store/slices/toastSlice';
import { parseArticleWithMercury } from '@common/mercury-parser';
import { ParsedArticle } from '@common/mercury-parser';
import { ArticleInsert } from '@common/database-types';
import { ExtendedParsedArticle, extendParsedArticle, toArticleInsert } from '../types/article';
import { enhanceArticleWithMetadata, generateArticleMetadata } from '@utility/articleMetadata';

export interface UseArticleParserReturn {
	// URL parsing
	parseUrl: (url: string) => Promise<void>;
	parsedArticle: ExtendedParsedArticle | null;
	isParsingUrl: boolean;
	parseError: string | null;
	
	// Article saving
	saveArticle: (
		article: ExtendedParsedArticle,
		tags?: string[],
		notes?: string
	) => Promise<void>;
	isSavingArticle: boolean;
	
	// Article management
	articles: any[];
	loadArticles: () => Promise<void>;
	isLoadingArticles: boolean;
	
	// Utility
	resetParser: () => void;
	calculateReadingTime: (content: string) => number;
}

const useArticleParser = (session: Session | null): UseArticleParserReturn => {
	const dispatch = useAppDispatch();
	
	// Redux state
	const articles = useAppSelector(selectPosts);
	const { createPost: isCreatingPost } = useAppSelector(selectPostsLoading);
	const { create: createError } = useAppSelector(selectPostsErrors);
	const preferredParser = useAppSelector((state) => state.auth.preferences?.preferredParser || 'mercury');
	
	// Local state for URL parsing
	const [parsedArticle, setParsedArticle] = useState<ExtendedParsedArticle | null>(null);
	const [isParsingUrl, setIsParsingUrl] = useState<boolean>(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isLoadingArticles, setIsLoadingArticles] = useState<boolean>(false);

	// Calculate reading time from content
	const calculateReadingTime = useCallback((content: string): number => {
		const wordsPerMinute = 200; // Average reading speed
		const cleanContent = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
		const words = cleanContent.trim().split(/\s+/).length;
		return Math.ceil(words / wordsPerMinute);
	}, []);

	// Enhanced URL validation
	const isValidUrl = useCallback((url: string): boolean => {
		try {
			const urlObj = new URL(url);
			return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
		} catch {
			return false;
		}
	}, []);

	// Extract domain from URL
	const extractDomain = useCallback((url: string): string => {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace(/^www\./, '');
		} catch {
			return '';
		}
	}, []);

	// Parse URL to extract article content
	const parseUrl = useCallback(async (url: string): Promise<void> => {
		if (!url.trim()) {
			setParseError('Please provide a valid URL');
			return;
		}

		// Clean and validate URL
		let cleanUrl = url.trim();
		if (!cleanUrl.match(/^https?:\/\//)) {
			cleanUrl = `https://${cleanUrl}`;
		}

		if (!isValidUrl(cleanUrl)) {
			setParseError('Invalid URL format. Please check and try again.');
			return;
		}

		setIsParsingUrl(true);
		setParseError(null);
		setParsedArticle(null);

		try {
			// Use the preferred parser from user settings
			const result = await parseArticleWithMercury(cleanUrl, preferredParser);
			
			if (!result.success || !result.data) {
				throw new Error(result.error?.message || 'No article content could be extracted from this URL');
			}

			// Convert to extended article and enhance with metadata
			const baseArticle = extendParsedArticle(result.data);
			const extendedArticle: ExtendedParsedArticle = {
				...baseArticle,
				url: cleanUrl,
				domain: extractDomain(cleanUrl),
				scraped_at: new Date().toISOString()
			};

			// Generate comprehensive metadata
			const enhancedArticle = enhanceArticleWithMetadata(extendedArticle);

			setParsedArticle(enhancedArticle);
			
		} catch (error) {
			console.error('Article parsing error:', error);
			const errorMessage = error instanceof Error 
				? error.message 
				: 'Failed to parse article. The URL may not contain readable content.';
			setParseError(errorMessage);
		} finally {
			setIsParsingUrl(false);
		}
	}, [isValidUrl, extractDomain, calculateReadingTime]);

	// Save parsed article to database
	const saveArticle = useCallback(async (
		article: ExtendedParsedArticle,
		tags: string[] = [],
		notes?: string
	): Promise<void> => {
		if (!session?.user) {
			dispatch(showError('You must be logged in to save articles'));
			return;
		}

		if (!article.title || !article.url) {
			dispatch(showError('Article must have a title and URL'));
			return;
		}

		try {
			// Generate metadata if not already present
			let metadata = (article as any).metadata;
			if (!metadata && article.content) {
				metadata = generateArticleMetadata(article);
			}

			// Combine user tags with auto-generated tags
			const allTags = [
				...tags,
				...(metadata?.topicTags || [])
			].slice(0, 10); // Limit to 10 tags total

			// Use the helper function to convert to database format
			const articleData = toArticleInsert(article, session.user.id, allTags.length > 0 ? allTags : undefined);

			// Add notes if provided (this would require extending the database schema)
			if (notes) {
				// For now, we could add it to content or create a separate notes field
				console.log('Notes to be handled:', notes);
			}

			// Dispatch Redux action to save article
			await dispatch(createPost(articleData)).unwrap();
			
			// Show success message
			dispatch(showSuccess('Article saved successfully!'));
			
			// Reset parser state
			resetParser();
			
		} catch (error) {
			console.error('Save article error:', error);
			const errorMessage = error instanceof Error 
				? error.message 
				: 'Failed to save article. Please try again.';
			dispatch(showError(errorMessage));
			throw error;
		}
	}, [session, dispatch, extractDomain, calculateReadingTime]);

	// Load articles from database
	const loadArticles = useCallback(async (): Promise<void> => {
		if (!session?.user) return;
		
		setIsLoadingArticles(true);
		try {
			await dispatch(fetchPosts({ 
				userId: session.user.id,
				page: 1,
				limit: 20
			})).unwrap();
		} catch (error) {
			console.error('Load articles error:', error);
			dispatch(showError('Failed to load articles'));
		} finally {
			setIsLoadingArticles(false);
		}
	}, [session, dispatch]);

	// Reset parser state
	const resetParser = useCallback(() => {
		setParsedArticle(null);
		setParseError(null);
		setIsParsingUrl(false);
	}, []);

	// Load articles on session change
	useEffect(() => {
		if (session?.user) {
			loadArticles();
		}
	}, [session, loadArticles]);

	// Handle Redux errors
	useEffect(() => {
		if (createError) {
			dispatch(showError(createError));
		}
	}, [createError, dispatch]);

	return {
		// URL parsing
		parseUrl,
		parsedArticle,
		isParsingUrl,
		parseError,
		
		// Article saving
		saveArticle,
		isSavingArticle: isCreatingPost,
		
		// Article management
		articles,
		loadArticles,
		isLoadingArticles,
		
		// Utility
		resetParser,
		calculateReadingTime
	};
};

export default useArticleParser;