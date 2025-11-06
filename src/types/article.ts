import { ParsedArticle as BaseParsedArticle } from '@common/mercury-parser';
import { Article } from '@common/database-types';

// Extended parsed article interface with additional metadata
export interface ExtendedParsedArticle extends BaseParsedArticle {
	// Additional fields for compatibility
	image?: string | null; // Alias for lead_image_url
	favicon?: string | null; // Favicon URL
	description?: string | null; // Alias for excerpt
	published_date?: string | null; // Alternative date field
	reading_time_estimate?: number; // Estimated reading time
	scraped_at?: string; // When the article was scraped
	
	// Metadata from parsing
	metadata?: {
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
	};
}

// Helper function to convert ParsedArticle to ExtendedParsedArticle
export const extendParsedArticle = (article: BaseParsedArticle): ExtendedParsedArticle => {
	return {
		...article,
		image: article.lead_image_url,
		description: article.excerpt,
		published_date: article.date_published,
		favicon: null,
		reading_time_estimate: Math.ceil(article.word_count / 200), // Basic estimation
		scraped_at: new Date().toISOString()
	};
};

// Convert extended article to database insert format
export const toArticleInsert = (
	article: ExtendedParsedArticle, 
	userId: string, 
	tags?: string[]
): Omit<Article, 'id' | 'created_at' | 'updated_at'> => {
	return {
		user_id: userId,
		url: article.url,
		title: article.title,
		content: article.content || null,
		excerpt: article.excerpt || article.description || null,
		image_url: article.image || article.lead_image_url || null,
		favicon_url: article.favicon || null,
		author: article.author || null,
		published_date: article.date_published || article.published_date || null,
		domain: article.domain,
		tags: tags || [],
		is_favorite: false,
		like_count: 0,
		comment_count: 0,
		reading_status: 'unread',
		estimated_read_time: article.reading_time_estimate || Math.ceil((article.word_count || 0) / 200),
		is_public: false,
		scraped_at: article.scraped_at || new Date().toISOString()
	};
};

export default ExtendedParsedArticle;