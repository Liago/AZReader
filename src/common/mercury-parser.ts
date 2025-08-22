import axios, { AxiosResponse, AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { CheerioAPI } from 'cheerio';
import { endpoint } from '@config/environment';
import { isValidUrl, getScraperParmas, manipulateDateFromString } from '../utility/utils';
import moment from 'moment';

// Types for parser responses
export interface ParsedArticle {
	title: string;
	author: string;
	content: string;
	excerpt: string;
	lead_image_url: string | null;
	url: string;
	domain: string;
	date_published: string;
	word_count: number;
	direction: string;
	total_pages: number;
	rendered_pages: number;
	next_page_url: string | null;
	dek?: string | null;
}

export interface ParserError {
	code: string;
	message: string;
	details?: any;
	url?: string;
}

export interface ParserResult {
	success: boolean;
	data?: ParsedArticle;
	error?: ParserError;
	source: 'mercury' | 'rapidapi' | 'personal' | 'none';
	retryAttempts?: number;
}

// ScraperConfig interface for domain-specific parsing
interface ScraperConfig {
	url: string;
	container?: string;
	isHTML?: boolean;
	parser: 'personal' | 'rapidapi' | 'mercury';
	items?: {
		title?: string;
		author?: string;
		content?: string;
		data_published?: string;
		excerpt?: string;
		lead_image?: string;
	};
}

// Configuration for retry logic
interface RetryConfig {
	maxAttempts: number;
	delayMs: number;
	backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxAttempts: 3,
	delayMs: 1000,
	backoffFactor: 2,
};

// Mercury Parser API response type
interface MercuryResponse {
	title: string;
	author?: string;
	content: string;
	excerpt?: string;
	lead_image_url?: string;
	url: string;
	domain: string;
	date_published?: string;
	word_count: number;
	direction?: string;
	total_pages?: number;
	rendered_pages?: number;
	next_page_url?: string;
	dek?: string;
}

// RapidAPI response type - direct response format
interface RapidApiResponse {
	url?: string;
	title?: string;
	author?: string;
	html?: string;
	text?: string;
	content?: string;
	excerpt?: string;
	image?: string;
	publish_date?: string;
	domain?: string;
	[key: string]: any;
}

class MercuryParserService {
	private retryConfig: RetryConfig;

	constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
		this.retryConfig = retryConfig;
	}

	/**
	 * Main parsing function with fallback strategy
	 */
	async parseArticle(url: string, preferredParser: 'mercury' | 'rapidapi' = 'mercury'): Promise<ParserResult> {
		// Validate URL first
		if (!this.isValidUrl(url)) {
			return {
				success: false,
				error: {
					code: 'INVALID_URL',
					message: 'The provided URL is not valid',
					url,
				},
				source: 'none',
			};
		}

		const cleanUrl = this.sanitizeUrl(url);

		// Try preferred parser first, then fallback
		const parsers = preferredParser === 'mercury' 
			? [
				{ name: 'Mercury Parser', fn: () => this.tryMercuryParser(cleanUrl) },
				{ name: 'RapidAPI (fallback)', fn: () => this.tryRapidApiParser(cleanUrl) }
			]
			: [
				{ name: 'RapidAPI', fn: () => this.tryRapidApiParser(cleanUrl) },
				{ name: 'Mercury Parser (fallback)', fn: () => this.tryMercuryParser(cleanUrl) }
			];

		for (const parser of parsers) {
			try {
				console.log(`Attempting to parse with ${parser.name}:`, cleanUrl);
				const result = await parser.fn();
				console.log(`${parser.name} result:`, result);
				if (result.success) {
					return result;
				}
			} catch (error) {
				console.warn(`${parser.name} failed:`, error);
			}
		}

		// If all parsers fail, return error
		return {
			success: false,
			error: {
				code: 'ALL_PARSERS_FAILED',
				message: 'All parsing methods failed for this URL',
				url: cleanUrl,
			},
			source: 'none',
		};
	}

	/**
	 * Try Mercury Parser using CORS proxy since the API doesn't allow localhost
	 */
	private async tryMercuryParser(url: string): Promise<ParserResult> {
		return this.withRetry(async () => {
			// Since Mercury API doesn't allow CORS from localhost, we need to use the CORS proxy
			const corsProxy = 'https://parser-373014.uc.r.appspot.com';
			const preparedUrl = this.prepareUrl(url);
			const mercuryApiUrl = `${endpoint.parser}/parser?url=${preparedUrl}`;
			const proxiedUrl = `${corsProxy}/${mercuryApiUrl}`;
			
			console.log('Mercury Parser request for URL:', url, 'via proxy:', proxiedUrl);
			
			const response: AxiosResponse<MercuryResponse> = await axios.get(proxiedUrl, {
				timeout: 15000,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});

			console.log('Mercury Parser response:', response.status, response.data);

			if (!response.data || !response.data.content) {
				console.error('Mercury Parser invalid response structure:', response.data);
				throw new Error('Invalid response from Mercury Parser - missing content');
			}

			const processedData = this.processMercuryResponse(response.data, url);
			
			return {
				success: true,
				data: processedData,
				source: 'mercury' as const,
			};
		}, 'mercury');
	}

	/**
	 * Prepare URL like in rest.ts
	 */
	private prepareUrl(inputUrl: string): string {
		try {
			// Decodifica solo se l'URL contiene caratteri codificati
			if (inputUrl.includes("%")) {
				return encodeURIComponent(decodeURIComponent(inputUrl));
			}
			return encodeURIComponent(inputUrl);
		} catch (e) {
			console.warn("Error processing URL:", e);
			return encodeURIComponent(inputUrl);
		}
	}

	/**
	 * Try Personal Scraper using domain-specific configuration
	 */
	private async tryPersonalScraper(url: string, config: ScraperConfig): Promise<ParserResult> {
		return this.withRetry(async () => {
			// Use the same CORS proxy as Mercury Parser
			const corsProxy = 'https://parser-373014.uc.r.appspot.com';
			const proxiedUrl = `${corsProxy}/${url}`;
			
			console.log('Personal Scraper request for URL:', url, 'via proxy:', proxiedUrl);
			
			const response: AxiosResponse<string> = await axios.get(proxiedUrl, {
				timeout: 15000,
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
				},
			});

			console.log('Personal Scraper response status:', response.status);

			if (!response.data) {
				throw new Error('No HTML content received from Personal Scraper');
			}

			const processedData = this.processPersonalScraperResponse(response.data, url, config);
			
			return {
				success: true,
				data: processedData,
				source: 'personal' as const,
			};
		}, 'personal');
	}

	/**
	 * Try RapidAPI with retry logic
	 */
	private async tryRapidApiParser(url: string): Promise<ParserResult> {
		return this.withRetry(async () => {
			const options = {
				method: 'POST',
				url: 'https://news-article-data-extract-and-summarization1.p.rapidapi.com/extract/',
				headers: {
					'content-type': 'application/json',
					'X-RapidAPI-Key': endpoint.RAPID_API_KEY,
					'X-RapidAPI-Host': 'news-article-data-extract-and-summarization1.p.rapidapi.com',
				},
				data: JSON.stringify({ url }),
				timeout: 15000,
			};

			const response: AxiosResponse<RapidApiResponse> = await axios.request(options);
			console.log('RapidAPI response:', response.status, response.data);

			if (!response.data || (!response.data.html && !response.data.text && !response.data.content)) {
				console.error('RapidAPI invalid response structure:', response.data);
				throw new Error('Invalid response from RapidAPI - missing content');
			}

			const processedData = this.processRapidApiResponse(response.data, url);
			
			return {
				success: true,
				data: processedData,
				source: 'rapidapi' as const,
			};
		}, 'rapidapi');
	}

	/**
	 * Generic retry wrapper with exponential backoff
	 */
	private async withRetry<T>(
		operation: () => Promise<T>,
		source: string
	): Promise<T & { retryAttempts?: number }> {
		let lastError: any;
		
		for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
			try {
				const result = await operation();
				return { ...result, retryAttempts: attempt };
			} catch (error) {
				lastError = error;
				console.warn(`${source} parser attempt ${attempt} failed:`, error);

				if (attempt < this.retryConfig.maxAttempts) {
					const delay = this.retryConfig.delayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
					await this.sleep(delay);
				}
			}
		}

		throw lastError;
	}

	/**
	 * Process Mercury Parser response
	 */
	private processMercuryResponse(data: MercuryResponse, originalUrl: string): ParsedArticle {
		const domain = this.extractDomain(originalUrl);
		
		return {
			title: data.title || 'Untitled',
			author: data.author || '',
			content: this.sanitizeContent(data.content),
			excerpt: data.excerpt || this.generateExcerpt(data.content),
			lead_image_url: this.sanitizeImageUrl(data.lead_image_url),
			url: originalUrl,
			domain,
			date_published: data.date_published || new Date().toISOString(),
			word_count: data.word_count || this.countWords(data.content),
			direction: data.direction || 'ltr',
			total_pages: data.total_pages || 1,
			rendered_pages: data.rendered_pages || 1,
			next_page_url: data.next_page_url || null,
			dek: data.dek || null,
		};
	}

	/**
	 * Process RapidAPI response
	 */
	private processRapidApiResponse(data: RapidApiResponse, originalUrl: string): ParsedArticle {
		const domain = this.extractDomain(originalUrl);
		// Use html or text content, preferring html
		const content = data.html || data.text || data.content || '';
		
		return {
			title: data.title || 'Untitled',
			author: data.author || '',
			content: this.sanitizeContent(content),
			excerpt: data.excerpt || this.generateExcerpt(content),
			lead_image_url: this.sanitizeImageUrl(data.image),
			url: originalUrl,
			domain,
			date_published: data.publish_date || new Date().toISOString(),
			word_count: this.countWords(content),
			direction: 'ltr',
			total_pages: 1,
			rendered_pages: 1,
			next_page_url: null,
		};
	}

	/**
	 * Sanitize and enhance HTML content
	 */
	private sanitizeContent(html: string): string {
		if (!html) return '';

		const $ = cheerio.load(html);

		// Remove unwanted elements
		$('script, style, noscript, iframe[src*="ads"], .advertisement, .ad-container').remove();
		
		// Process images - handle data-src attributes
		$('img').each((i, elem) => {
			const $img = $(elem);
			const dataSrc = $img.attr('data-src');
			const lazySrc = $img.attr('data-lazy-src');
			const src = $img.attr('src');

			// Prioritize data-src over src for lazy-loaded images
			if (dataSrc && dataSrc.startsWith('http')) {
				$img.attr('src', dataSrc);
				$img.removeAttr('data-src');
			} else if (lazySrc && lazySrc.startsWith('http')) {
				$img.attr('src', lazySrc);
				$img.removeAttr('data-lazy-src');
			}

			// Add loading attribute for performance
			$img.attr('loading', 'lazy');
			
			// Add alt text if missing
			if (!$img.attr('alt')) {
				$img.attr('alt', 'Article image');
			}
		});

		// Process links - ensure they open in new tab
		$('a').each((i, elem) => {
			const $link = $(elem);
			const href = $link.attr('href');
			if (href && href.startsWith('http')) {
				$link.attr('target', '_blank');
				$link.attr('rel', 'noopener noreferrer');
			}
		});

		// Clean up empty paragraphs and divs
		$('p:empty, div:empty').remove();

		return $.html();
	}

	/**
	 * Sanitize image URL
	 */
	private sanitizeImageUrl(url?: string): string | null {
		if (!url) return null;
		
		// Remove common tracking parameters
		try {
			const urlObj = new URL(url);
			urlObj.searchParams.delete('utm_source');
			urlObj.searchParams.delete('utm_medium');
			urlObj.searchParams.delete('utm_campaign');
			return urlObj.toString();
		} catch {
			return url.startsWith('http') ? url : null;
		}
	}

	/**
	 * Generate excerpt from content
	 */
	private generateExcerpt(content: string, maxLength = 160): string {
		if (!content) return '';

		// Strip HTML tags
		const textContent = content.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		if (textContent.length <= maxLength) {
			return textContent;
		}

		// Find the last complete word within the limit
		const truncated = textContent.substr(0, maxLength);
		const lastSpace = truncated.lastIndexOf(' ');
		
		if (lastSpace > 0) {
			return truncated.substr(0, lastSpace) + '...';
		}

		return truncated + '...';
	}

	/**
	 * Count words in content
	 */
	private countWords(content: string): number {
		if (!content) return 0;
		
		// Strip HTML and count words
		const textContent = content.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		
		return textContent ? textContent.split(' ').length : 0;
	}

	/**
	 * Extract domain from URL
	 */
	private extractDomain(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch {
			return '';
		}
	}

	/**
	 * Validate URL
	 */
	private isValidUrl(url: string): boolean {
		return isValidUrl(url);
	}

	/**
	 * Sanitize URL
	 */
	private sanitizeUrl(url: string): string {
		const trimmedUrl = url.trim();
		
		// Add protocol if missing
		if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
			return `https://${trimmedUrl}`;
		}
		
		return trimmedUrl;
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// Create singleton instance
const mercuryParser = new MercuryParserService();

// Export the main parsing function
export const parseArticleWithMercury = (url: string, preferredParser: 'mercury' | 'rapidapi' = 'mercury'): Promise<ParserResult> => {
	return mercuryParser.parseArticle(url, preferredParser);
};

// Export service class for advanced usage
export { MercuryParserService };

// Legacy compatibility exports
export const mercuryScraper = parseArticleWithMercury;
export default mercuryParser;