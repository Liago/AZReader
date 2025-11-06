import { ExtendedParsedArticle } from '../types/article';

// Types for enhanced metadata
export interface ArticleMetadata {
	readingTime: number;
	wordCount: number;
	publishedDate: string | null;
	estimatedPublishDate: string | null;
	contentType: 'article' | 'blog' | 'news' | 'opinion' | 'tutorial' | 'unknown';
	topicTags: string[];
	imageCount: number;
	linkCount: number;
	authorConfidence: 'high' | 'medium' | 'low';
	qualityScore: number; // 1-10
}

// Common topic keywords for automatic tagging
const TOPIC_KEYWORDS = {
	technology: ['tech', 'software', 'programming', 'code', 'development', 'app', 'digital', 'ai', 'machine learning', 'blockchain', 'cryptocurrency', 'startup'],
	science: ['research', 'study', 'experiment', 'discovery', 'scientific', 'biology', 'physics', 'chemistry', 'medicine', 'health'],
	business: ['business', 'company', 'market', 'economy', 'finance', 'investment', 'revenue', 'profit', 'strategy', 'management'],
	politics: ['politics', 'government', 'election', 'policy', 'law', 'congress', 'senate', 'president', 'democracy'],
	sports: ['sport', 'game', 'team', 'player', 'championship', 'tournament', 'olympics', 'football', 'basketball', 'soccer'],
	entertainment: ['movie', 'film', 'tv', 'show', 'music', 'celebrity', 'entertainment', 'hollywood', 'netflix'],
	travel: ['travel', 'trip', 'destination', 'vacation', 'hotel', 'flight', 'tourism', 'adventure', 'guide'],
	food: ['food', 'recipe', 'cooking', 'restaurant', 'chef', 'cuisine', 'dish', 'ingredients', 'meal'],
	lifestyle: ['lifestyle', 'fashion', 'beauty', 'home', 'family', 'relationship', 'wellness', 'fitness'],
	education: ['education', 'school', 'university', 'student', 'learning', 'teacher', 'course', 'degree']
};

// Date patterns for parsing publication dates
const DATE_PATTERNS = [
	// Common date formats in articles
	/(\d{4})-(\d{2})-(\d{2})/g, // 2024-01-15
	/(\d{2})\/(\d{2})\/(\d{4})/g, // 01/15/2024
	/(\d{2})-(\d{2})-(\d{4})/g, // 01-15-2024
	/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi,
	/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/gi
];

// Author patterns for validation
const AUTHOR_PATTERNS = [
	/^[A-Za-z\s\-'\.]{2,50}$/,
	/^[A-Za-z]+\s+[A-Za-z]+/
];

/**
 * Calculate estimated reading time based on word count
 */
export const calculateReadingTime = (content: string): number => {
	const wordsPerMinute = 200; // Average reading speed
	const cleanContent = content.replace(/<[^>]*>/g, ' '); // Remove HTML tags
	const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0);
	return Math.max(1, Math.ceil(words.length / wordsPerMinute));
};

/**
 * Count words in content
 */
export const countWords = (content: string): number => {
	const cleanContent = content.replace(/<[^>]*>/g, ' '); // Remove HTML tags
	const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0);
	return words.length;
};

/**
 * Extract and validate publication date
 */
export const extractPublicationDate = (
	article: ExtendedParsedArticle,
	htmlContent?: string
): string | null => {
	// First, try the provided date fields
	if (article.date_published) {
		return normalizeDate(article.date_published);
	}

	if (article.published_date) {
		return normalizeDate(article.published_date);
	}

	// Try to extract from content or HTML
	if (htmlContent || article.content) {
		const content = htmlContent || article.content || '';
		
		for (const pattern of DATE_PATTERNS) {
			const matches = content.match(pattern);
			if (matches && matches.length > 0) {
				const dateString = matches[0];
				const normalizedDate = normalizeDate(dateString);
				if (normalizedDate && isValidDate(normalizedDate)) {
					return normalizedDate;
				}
			}
		}
	}

	return null;
};

/**
 * Normalize date to ISO string
 */
const normalizeDate = (dateInput: string | Date): string | null => {
	try {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		if (isNaN(date.getTime())) {
			return null;
		}
		return date.toISOString();
	} catch {
		return null;
	}
};

/**
 * Validate if date is reasonable for an article
 */
const isValidDate = (dateString: string): boolean => {
	const date = new Date(dateString);
	const now = new Date();
	const oldestReasonableDate = new Date('1990-01-01');
	
	return date <= now && date >= oldestReasonableDate;
};

/**
 * Determine content type based on URL and content
 */
export const detectContentType = (article: ExtendedParsedArticle): ArticleMetadata['contentType'] => {
	const url = article.url?.toLowerCase() || '';
	const title = article.title?.toLowerCase() || '';
	const content = article.content?.toLowerCase() || '';
	
	// Check URL patterns
	if (url.includes('blog') || url.includes('/post/')) return 'blog';
	if (url.includes('news') || url.includes('/article/')) return 'news';
	if (url.includes('tutorial') || url.includes('how-to')) return 'tutorial';
	if (url.includes('opinion') || url.includes('editorial')) return 'opinion';
	
	// Check title patterns
	if (title.includes('how to') || title.includes('tutorial')) return 'tutorial';
	if (title.includes('opinion') || title.includes('editorial')) return 'opinion';
	
	// Default to article
	return 'article';
};

/**
 * Generate topic tags based on content analysis
 */
export const generateTopicTags = (article: ExtendedParsedArticle): string[] => {
	const content = `${article.title || ''} ${article.excerpt || ''} ${article.content || ''}`.toLowerCase();
	const tags: string[] = [];
	
	// Check for topic keywords
	for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
		const matchCount = keywords.filter(keyword => 
			content.includes(keyword.toLowerCase())
		).length;
		
			// If multiple keywords match, add the topic
		if (matchCount >= 2) {
			tags.push(topic);
		} else if (matchCount === 1 && keywords.some(keyword => 
			content.includes(keyword.toLowerCase()) && content.split(' ').includes(keyword.toLowerCase())
		)) {
			// Single exact word match
			tags.push(topic);
		}
	}
	
	// Add domain-based tags
	if (article.domain) {
		const domain = article.domain.toLowerCase();
		if (domain.includes('medium')) tags.push('blog');
		if (domain.includes('github')) tags.push('technology');
		if (domain.includes('stackoverflow')) tags.push('programming');
		if (domain.includes('reddit')) tags.push('discussion');
		if (domain.includes('youtube')) tags.push('video');
	}
	
	return [...new Set(tags)]; // Remove duplicates
};

/**
 * Count images in content
 */
export const countImages = (content: string): number => {
	const imgTags = content.match(/<img[^>]*>/gi);
	return imgTags ? imgTags.length : 0;
};

/**
 * Count links in content
 */
export const countLinks = (content: string): number => {
	const linkTags = content.match(/<a[^>]*href[^>]*>/gi);
	return linkTags ? linkTags.length : 0;
};

/**
 * Validate author name confidence
 */
export const validateAuthorConfidence = (author?: string): ArticleMetadata['authorConfidence'] => {
	if (!author || author.trim().length === 0) {
		return 'low';
	}
	
	const trimmedAuthor = author.trim();
	
	// High confidence: matches common name patterns
	if (AUTHOR_PATTERNS.some(pattern => pattern.test(trimmedAuthor))) {
		return 'high';
	}
	
	// Medium confidence: has some structure but might be incomplete
	if (trimmedAuthor.length > 3 && trimmedAuthor.includes(' ')) {
		return 'medium';
	}
	
	return 'low';
};

/**
 * Calculate article quality score (1-10)
 */
export const calculateQualityScore = (article: ExtendedParsedArticle, metadata: Partial<ArticleMetadata>): number => {
	let score = 5; // Base score
	
	// Content length bonus
	const wordCount = metadata.wordCount || 0;
	if (wordCount > 1000) score += 2;
	else if (wordCount > 500) score += 1;
	else if (wordCount < 100) score -= 2;
	
	// Title quality
	if (article.title && article.title.length > 10) score += 1;
	
	// Excerpt/description quality
	if (article.excerpt && article.excerpt.length > 50) score += 1;
	
	// Author confidence
	const authorConf = metadata.authorConfidence || 'low';
	if (authorConf === 'high') score += 1;
	else if (authorConf === 'low') score -= 1;
	
	// Publication date
	if (article.date_published || article.published_date) score += 1;
	
	// Image presence
	if (article.image || article.lead_image_url) score += 1;
	
	// Content richness (images and links)
	const imageCount = metadata.imageCount || 0;
	const linkCount = metadata.linkCount || 0;
	if (imageCount > 0) score += 0.5;
	if (linkCount > 5) score += 0.5;
	
	return Math.max(1, Math.min(10, Math.round(score)));
};

/**
 * Generate comprehensive metadata for an article
 */
export const generateArticleMetadata = (
	article: ExtendedParsedArticle,
	htmlContent?: string
): ArticleMetadata => {
	const content = article.content || '';
	
	const wordCount = countWords(content);
	const readingTime = calculateReadingTime(content);
	const publishedDate = extractPublicationDate(article, htmlContent);
	const contentType = detectContentType(article);
	const topicTags = generateTopicTags(article);
	const imageCount = countImages(content);
	const linkCount = countLinks(content);
	const authorConfidence = validateAuthorConfidence(article.author);
	
	const metadata: ArticleMetadata = {
		readingTime,
		wordCount,
		publishedDate,
		estimatedPublishDate: publishedDate || new Date().toISOString(),
		contentType,
		topicTags,
		imageCount,
		linkCount,
		authorConfidence,
		qualityScore: 5 // Will be calculated below
	};
	
	// Calculate quality score with all metadata
	metadata.qualityScore = calculateQualityScore(article, metadata);
	
	return metadata;
};

/**
 * Enhance article with metadata
 */
export const enhanceArticleWithMetadata = (
	article: ExtendedParsedArticle,
	htmlContent?: string
): ExtendedParsedArticle & { metadata: ArticleMetadata } => {
	const metadata = generateArticleMetadata(article, htmlContent);
	
	return {
		...article,
		// Update article fields with enhanced data  
		reading_time_estimate: metadata.readingTime,
		date_published: metadata.publishedDate || article.date_published,
		published_date: metadata.publishedDate || article.published_date,
		metadata
	};
};

export default {
	calculateReadingTime,
	countWords,
	extractPublicationDate,
	detectContentType,
	generateTopicTags,
	countImages,
	countLinks,
	validateAuthorConfidence,
	calculateQualityScore,
	generateArticleMetadata,
	enhanceArticleWithMetadata
};