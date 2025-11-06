import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
	IonContent,
	IonIcon,
	IonButton,
	IonSpinner,
} from '@ionic/react';
import {
	timeOutline,
	personOutline,
	calendarOutline,
	eyeOutline,
} from 'ionicons/icons';
import DOMPurify from 'isomorphic-dompurify';
import { Session } from '@supabase/supabase-js';
import type { Post } from '@store/slices/postsSlice';
import FontSizeWrapper from './FontSizeWrapper';
import ReadingThemeWrapper from './ui/ReadingThemeWrapper';

// Types
export interface ArticleReaderProps {
	article: Post;
	session: Session | null;
	className?: string;
	showMetadata?: boolean;
	onReadingProgressChange?: (progress: number) => void;
	onImageLoad?: (imageUrl: string) => void;
	onReadingTimeUpdate?: (timeSpent: number) => void;
	children?: React.ReactNode; // For additional controls or content
}

interface ReadingStats {
	wordsRead: number;
	timeSpent: number; // in seconds
	progress: number; // 0-100
	estimatedTimeRemaining: number; // in minutes
}

// Utility functions
const sanitizeContent = (html: string): string => {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [
			'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
			'pre', 'code', 'span', 'div', 'article', 'section', 'aside', 'header',
			'table', 'thead', 'tbody', 'tr', 'td', 'th'
		],
		ALLOWED_ATTR: [
			'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 
			'class', 'id', 'style', 'data-src', 'loading'
		],
		KEEP_CONTENT: true,
		RETURN_DOM: false,
		RETURN_DOM_FRAGMENT: false,
	});
};

const processImages = (html: string): string => {
	// Replace data-src with src for lazy-loaded images
	let processedHtml = html.replace(/data-src=/g, 'src=');
	
	// Add loading="lazy" to images that don't have it
	processedHtml = processedHtml.replace(
		/<img(?![^>]*loading=)[^>]*>/gi,
		(match) => match.replace('<img', '<img loading="lazy"')
	);
	
	// Ensure all images have proper alt attributes
	processedHtml = processedHtml.replace(
		/<img(?![^>]*alt=)[^>]*>/gi,
		(match) => match.replace('<img', '<img alt=""')
	);
	
	return processedHtml;
};

const estimateReadingTime = (content: string): number => {
	// Remove HTML tags and count words
	const textContent = content.replace(/<[^>]*>/g, '');
	const wordCount = textContent.trim().split(/\s+/).length;
	// Average reading speed: 200-300 words per minute, using 250
	return Math.ceil(wordCount / 250);
};

const formatDate = (dateString: string | null): string => {
	if (!dateString) return 'Data sconosciuta';
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('it-IT', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	} catch {
		return 'Data non valida';
	}
};

const ArticleReader: React.FC<ArticleReaderProps> = ({
	article,
	session,
	className = '',
	showMetadata = true,
	onReadingProgressChange,
	onImageLoad,
	onReadingTimeUpdate,
	children
}) => {
	// State
	const [isLoading, setIsLoading] = useState(true);
	const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({});
	const [readingStats, setReadingStats] = useState<ReadingStats>({
		wordsRead: 0,
		timeSpent: 0,
		progress: 0,
		estimatedTimeRemaining: 0
	});
	const [isReading, setIsReading] = useState(false);
	const [startTime, setStartTime] = useState<number | null>(null);

	// Refs
	const contentRef = useRef<HTMLDivElement>(null);
	const readingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

	// Memoized values
	const sanitizedContent = useMemo(() => {
		const content = article.content || '';
		if (!content) return '';
		
		const cleaned = sanitizeContent(content);
		return processImages(cleaned);
	}, [article.content]);

	const estimatedReadTime = useMemo(() => {
		return estimateReadingTime(sanitizedContent);
	}, [sanitizedContent]);

	const domain = useMemo(() => {
		if (article.domain) return article.domain;
		if (!article.url) return '';
		try {
			return new URL(article.url).hostname.replace('www.', '');
		} catch {
			return '';
		}
	}, [article.domain, article.url]);

	// Effects
	useEffect(() => {
		// Setup reading time tracking
		if (isReading && !readingTimerRef.current) {
			readingTimerRef.current = setInterval(() => {
				setReadingStats(prev => {
					const newTimeSpent = prev.timeSpent + 1;
					onReadingTimeUpdate?.(newTimeSpent);
					return {
						...prev,
						timeSpent: newTimeSpent
					};
				});
			}, 1000);
		} else if (!isReading && readingTimerRef.current) {
			clearInterval(readingTimerRef.current);
			readingTimerRef.current = null;
		}

		return () => {
			if (readingTimerRef.current) {
				clearInterval(readingTimerRef.current);
				readingTimerRef.current = null;
			}
		};
	}, [isReading, onReadingTimeUpdate]);

	useEffect(() => {
		// Setup intersection observer for reading progress
		if (!contentRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const progress = Math.round(
							(entry.intersectionRect.bottom / entry.rootBounds!.height) * 100
						);
						setReadingStats(prev => ({ ...prev, progress }));
						onReadingProgressChange?.(progress);
					}
				});
			},
			{
				threshold: [0, 0.25, 0.5, 0.75, 1],
				rootMargin: '0px 0px -50% 0px'
			}
		);

		observer.observe(contentRef.current);
		intersectionObserverRef.current = observer;

		return () => {
			observer.disconnect();
		};
	}, [onReadingProgressChange]);

	useEffect(() => {
		// Setup image load tracking
		const handleImageLoad = (event: Event) => {
			const img = event.target as HTMLImageElement;
			if (img.src) {
				setImagesLoaded(prev => ({
					...prev,
					[img.src]: true
				}));
				onImageLoad?.(img.src);
				img.classList.add('article-image-loaded');
			}
		};

		const handleImageError = (event: Event) => {
			const img = event.target as HTMLImageElement;
			img.style.display = 'none';
			console.warn('Failed to load image:', img.src);
		};

		// Find all images in the article content
		setTimeout(() => {
			if (contentRef.current) {
				const images = contentRef.current.querySelectorAll('img');
				images.forEach(img => {
					img.classList.add('article-image-loading');
					img.addEventListener('load', handleImageLoad);
					img.addEventListener('error', handleImageError);
				});
				setIsLoading(false);
			}
		}, 100);

		return () => {
			if (contentRef.current) {
				const images = contentRef.current.querySelectorAll('img');
				images.forEach(img => {
					img.removeEventListener('load', handleImageLoad);
					img.removeEventListener('error', handleImageError);
				});
			}
		};
	}, [sanitizedContent, onImageLoad]);

	useEffect(() => {
		// Track reading session
		const handleVisibilityChange = () => {
			if (document.hidden) {
				setIsReading(false);
			} else if (document.visibilityState === 'visible') {
				setIsReading(true);
				setStartTime(Date.now());
			}
		};

		const handleFocus = () => {
			setIsReading(true);
			setStartTime(Date.now());
		};

		const handleBlur = () => {
			setIsReading(false);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);
		window.addEventListener('blur', handleBlur);

		// Start tracking immediately if document is visible
		if (document.visibilityState === 'visible') {
			setIsReading(true);
			setStartTime(Date.now());
		}

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('blur', handleBlur);
		};
	}, []);

	// Render functions
	const renderMetadata = () => {
		if (!showMetadata) return null;

		return (
			<div className="article-metadata">
				{/* Author */}
				{article.author && (
					<div className="metadata-item">
						<IonIcon icon={personOutline} />
						<span>{article.author}</span>
					</div>
				)}
				
				{/* Publication date */}
				<div className="metadata-item">
					<IonIcon icon={calendarOutline} />
					<span>{formatDate(article.created_at || article.published_date)}</span>
				</div>

				{/* Reading time */}
				{estimatedReadTime > 0 && (
					<div className="metadata-item">
						<IonIcon icon={timeOutline} />
						<span>{estimatedReadTime} min di lettura</span>
					</div>
				)}

				{/* Domain */}
				{domain && (
					<div className="metadata-item domain">
						<span>{domain}</span>
					</div>
				)}

				{/* Reading status indicator */}
				{article.reading_status === 'completed' && (
					<div className="metadata-item read-status">
						<IonIcon icon={eyeOutline} />
						<span>Già letto</span>
					</div>
				)}
			</div>
		);
	};

	const renderLeadImage = () => {
		if (!article.image_url) return null;

		return (
			<div className="article-lead-image">
				<img
					src={article.image_url}
					alt={article.title}
					className="lead-image"
					loading="eager"
					onError={(e) => {
						const target = e.target as HTMLImageElement;
						target.style.display = 'none';
					}}
				/>
			</div>
		);
	};

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="article-loading">
					<IonSpinner />
					<p>Caricamento articolo...</p>
				</div>
			);
		}

		if (!sanitizedContent) {
			return (
				<div className="article-empty">
					<p>Nessun contenuto disponibile per questo articolo.</p>
				</div>
			);
		}

		return (
			<div 
				className="article-content-wrapper"
				ref={contentRef}
			>
				<FontSizeWrapper>
					<div 
						className="article-content"
						dangerouslySetInnerHTML={{ __html: sanitizedContent }}
					/>
				</FontSizeWrapper>
			</div>
		);
	};

	return (
		<div className={`article-reader ${className}`}>
			<ReadingThemeWrapper>
				<div className="article-reader-container">
					{/* Article Header */}
					<header className="article-header">
						{renderLeadImage()}
						
						<div className="article-title-section">
							<h1 className="article-title">{article.title}</h1>
							
							{article.excerpt && (
								<div className="article-excerpt">
									{article.excerpt}
								</div>
							)}
							
							{renderMetadata()}
						</div>
					</header>

					{/* Article Content */}
					<main className="article-main">
						{renderContent()}
					</main>

					{/* Additional content (controls, etc.) */}
					{children && (
						<aside className="article-aside">
							{children}
						</aside>
					)}
				</div>
			</ReadingThemeWrapper>

			{/* Article Reader Styles */}
			<style>{`
				.article-reader {
					width: 100%;
					height: 100%;
					overflow: hidden;
				}

				.article-reader-container {
					max-width: var(--article-max-width, 42rem);
					margin: 0 auto;
					padding: var(--article-padding, 1rem);
					line-height: var(--article-line-height, 1.7);
				}

				.article-header {
					margin-bottom: 2rem;
				}

				.article-lead-image {
					margin-bottom: 1.5rem;
				}

				.lead-image {
					width: 100%;
					max-height: 400px;
					object-fit: cover;
					border-radius: 12px;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
					transition: opacity 0.3s ease;
				}

				.article-title-section {
					padding: 0 0.5rem;
				}

				.article-title {
					font-size: clamp(1.75rem, 4vw, 2.5rem);
					font-weight: 700;
					line-height: 1.2;
					margin: 0 0 1rem 0;
					color: var(--article-title-color, #1a1a1a);
				}

				.article-excerpt {
					font-size: 1.125rem;
					line-height: 1.6;
					color: var(--article-excerpt-color, #4a5568);
					margin-bottom: 1.5rem;
					font-weight: 400;
				}

				.article-metadata {
					display: flex;
					flex-wrap: wrap;
					gap: 1rem;
					padding: 1rem 0;
					border-top: 1px solid var(--article-border-color, #e2e8f0);
					border-bottom: 1px solid var(--article-border-color, #e2e8f0);
					margin-bottom: 1.5rem;
				}

				.metadata-item {
					display: flex;
					align-items: center;
					gap: 0.375rem;
					font-size: 0.875rem;
					color: var(--article-meta-color, #6b7280);
				}

				.metadata-item ion-icon {
					font-size: 1rem;
				}

				.metadata-item.domain {
					background: var(--article-domain-bg, #f3f4f6);
					padding: 0.25rem 0.5rem;
					border-radius: 0.375rem;
					font-weight: 500;
				}

				.metadata-item.read-status {
					color: var(--article-read-color, #059669);
					font-weight: 500;
				}

				.article-main {
					margin-bottom: 3rem;
				}

				.article-content-wrapper {
					position: relative;
				}

				.article-content {
					font-family: var(--article-font-family, system-ui, -apple-system, sans-serif);
					font-size: var(--article-font-size, 1rem);
					line-height: var(--article-line-height, 1.7);
					color: var(--app-text-color, #374151) !important;
					background-color: var(--app-bg-color, #ffffff) !important;
					word-spacing: 0.05em;
					hyphens: auto;
					overflow-wrap: break-word;
				}

				/* Forza tutti i testi ad usare i colori del tema */
				.article-content p,
				.article-content div,
				.article-content span,
				.article-content li,
				.article-content td,
				.article-content th {
					color: inherit !important;
				}

				/* Content Typography */
				.article-content p {
					margin-bottom: 1.5rem;
					text-align: justify;
				}

				.article-content h1,
				.article-content h2,
				.article-content h3,
				.article-content h4,
				.article-content h5,
				.article-content h6 {
					font-weight: 600;
					line-height: 1.4;
					margin: 2rem 0 1rem 0;
					color: var(--app-text-color, #1a1a1a) !important;
				}

				.article-content h1 { font-size: 1.875rem; }
				.article-content h2 { font-size: 1.5rem; }
				.article-content h3 { font-size: 1.25rem; }
				.article-content h4 { font-size: 1.125rem; }
				.article-content h5 { font-size: 1rem; }
				.article-content h6 { font-size: 0.875rem; }

				.article-content blockquote {
					border-left: 4px solid var(--app-blockquote-color, #3b82f6);
					padding-left: 1rem;
					margin: 1.5rem 0;
					font-style: italic;
					color: var(--app-text-color, #6b7280) !important;
				}

				.article-content ul,
				.article-content ol {
					margin-bottom: 1.5rem;
					padding-left: 1.5rem;
				}

				.article-content li {
					margin-bottom: 0.5rem;
				}

				.article-content a {
					color: var(--app-link-color, #3b82f6) !important;
					text-decoration: underline;
					transition: color 0.2s ease;
				}

				.article-content a:hover {
					opacity: 0.8;
					transition: opacity 0.2s ease;
				}

				/* Images */
				.article-content img {
					max-width: 100%;
					height: auto;
					border-radius: 8px;
					margin: 1.5rem 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					transition: opacity 0.3s ease;
				}

				.article-content img.article-image-loading {
					opacity: 0.7;
				}

				.article-content img.article-image-loaded {
					opacity: 1;
				}

				.article-content figure {
					margin: 1.5rem 0;
					text-align: center;
				}

				.article-content figcaption {
					font-size: 0.875rem;
					color: var(--app-caption-color, #6b7280) !important;
					margin-top: 0.5rem;
					font-style: italic;
				}

				/* Code */
				.article-content pre {
					background: var(--article-code-bg, #f8fafc);
					border-radius: 6px;
					padding: 1rem;
					overflow-x: auto;
					font-size: 0.875rem;
					margin: 1.5rem 0;
				}

				.article-content code {
					background: var(--article-inline-code-bg, #e2e8f0);
					padding: 0.125rem 0.25rem;
					border-radius: 3px;
					font-size: 0.875em;
				}

				.article-content pre code {
					background: none;
					padding: 0;
				}

				/* Tables */
				.article-content table {
					width: 100%;
					border-collapse: collapse;
					margin: 1.5rem 0;
				}

				.article-content th,
				.article-content td {
					border: 1px solid var(--article-border-color, #e2e8f0);
					padding: 0.75rem;
					text-align: left;
				}

				.article-content th {
					background: var(--article-table-header-bg, #f8fafc);
					font-weight: 600;
				}

				/* Loading and Empty States */
				.article-loading,
				.article-empty {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 3rem 1rem;
					text-align: center;
					color: var(--article-meta-color, #6b7280);
				}

				.article-loading ion-spinner {
					margin-bottom: 1rem;
				}

				.article-aside {
					margin-top: 2rem;
					padding-top: 2rem;
					border-top: 1px solid var(--article-border-color, #e2e8f0);
				}

				/* Responsive Design */
				@media (max-width: 768px) {
					.article-reader-container {
						padding: var(--article-padding-mobile, 1rem);
					}

					.article-title {
						font-size: clamp(1.5rem, 6vw, 2rem);
					}

					.article-excerpt {
						font-size: 1rem;
					}

					.article-metadata {
						flex-direction: column;
						gap: 0.5rem;
					}

					.article-content {
						font-size: var(--article-font-size-mobile, 1rem);
					}

					.article-content p {
						text-align: left;
					}
				}

				@media (max-width: 480px) {
					.article-reader-container {
						padding: var(--article-padding-small, 0.75rem);
					}

					.lead-image {
						max-height: 250px;
					}

					.article-content h1 { font-size: 1.5rem; }
					.article-content h2 { font-size: 1.25rem; }
					.article-content h3 { font-size: 1.125rem; }
				}

				/* Print Styles */
				@media print {
					.article-reader-container {
						max-width: none;
						padding: 0;
					}

					.article-title {
						font-size: 1.5rem;
						color: #000;
					}

					.article-content {
						color: #000;
						font-size: 12pt;
						line-height: 1.5;
					}

					.article-content a {
						color: #000;
						text-decoration: none;
					}

					.lead-image,
					.article-content img {
						max-height: 300px;
						box-shadow: none;
					}
				}
			`}</style>
		</div>
	);
};

export default ArticleReader;