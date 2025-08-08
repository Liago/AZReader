import React, { useState, useEffect, useCallback } from 'react';
import {
	IonModal,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButton,
	IonButtons,
	IonIcon,
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardSubtitle,
	IonCardContent,
	IonChip,
	IonLabel,
	IonSpinner,
	IonText,
	IonItem,
	IonTextarea,
	IonInput,
	IonCheckbox,
	IonAlert,
	IonSkeletonText,
	IonImg,
	IonFab,
	IonFabButton,
	IonActionSheet,
	IonToast
} from '@ionic/react';
import {
	closeOutline,
	bookmarkOutline,
	timeOutline,
	personOutline,
	calendarOutline,
	linkOutline,
	pricetagOutline,
	addOutline,
	shareOutline,
	eyeOutline,
	refreshOutline
} from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import { Article } from '@common/database-types';
import { ExtendedParsedArticle } from '@types/article';
import UrlInputForm from './form/UrlInputForm';

// Types
export interface ArticlePreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (article: ExtendedParsedArticle, tags: string[], notes?: string) => Promise<void>;
	onParseUrl: (url: string) => void;
	article: ExtendedParsedArticle | null;
	isLoading: boolean;
	error: string | null;
	session: Session | null;
	initialUrl?: string;
}

interface TagInputState {
	value: string;
	suggestions: string[];
	showSuggestions: boolean;
}

// Common article tags suggestions
const SUGGESTED_TAGS = [
	'Technology', 'Science', 'Business', 'Politics', 'Health',
	'Education', 'Environment', 'Sports', 'Culture', 'Travel',
	'Food', 'Finance', 'Startup', 'AI', 'Web Development',
	'Design', 'Marketing', 'Productivity', 'News', 'Opinion'
];

const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
	isOpen,
	onClose,
	onSave,
	onParseUrl,
	article,
	isLoading,
	error,
	session,
	initialUrl = ''
}) => {
	// State management
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState<TagInputState>({
		value: '',
		suggestions: [],
		showSuggestions: false
	});
	const [notes, setNotes] = useState<string>('');
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
	const [showActionSheet, setShowActionSheet] = useState<boolean>(false);
	const [showToast, setShowToast] = useState<boolean>(false);
	const [toastMessage, setToastMessage] = useState<string>('');
	const [estimatedReadTime, setEstimatedReadTime] = useState<number>(0);

	// Calculate estimated reading time
	const calculateReadingTime = useCallback((content: string): number => {
		const wordsPerMinute = 200; // Average reading speed
		const words = content.trim().split(/\s+/).length;
		return Math.ceil(words / wordsPerMinute);
	}, []);

	// Update reading time when article changes
	useEffect(() => {
		if (article?.content) {
			const readTime = calculateReadingTime(article.content);
			setEstimatedReadTime(readTime);
		}
	}, [article?.content, calculateReadingTime]);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setSelectedTags([]);
			setNotes('');
			setTagInput({ value: '', suggestions: [], showSuggestions: false });
		}
	}, [isOpen]);

	// Handle tag input change
	const handleTagInputChange = (value: string) => {
		const suggestions = value.trim()
			? SUGGESTED_TAGS.filter(tag => 
				tag.toLowerCase().includes(value.toLowerCase()) &&
				!selectedTags.includes(tag)
			  )
			: [];

		setTagInput({
			value,
			suggestions,
			showSuggestions: value.trim().length > 0 && suggestions.length > 0
		});
	};

	// Add tag
	const addTag = (tagName: string) => {
		if (tagName.trim() && !selectedTags.includes(tagName.trim())) {
			setSelectedTags([...selectedTags, tagName.trim()]);
			setTagInput({ value: '', suggestions: [], showSuggestions: false });
		}
	};

	// Remove tag
	const removeTag = (tagToRemove: string) => {
		setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
	};

	// Handle article save
	const handleSave = async () => {
		if (!article) return;

		setIsSaving(true);
		try {
			await onSave(article, selectedTags, notes.trim() || undefined);
			setToastMessage('Article saved successfully!');
			setShowToast(true);
			// Modal will be closed by parent component
		} catch (error) {
			console.error('Save error:', error);
			setToastMessage('Failed to save article. Please try again.');
			setShowToast(true);
		} finally {
			setIsSaving(false);
		}
	};

	// Handle retry parsing
	const handleRetry = () => {
		if (article?.url) {
			onParseUrl(article.url);
		}
	};

	// Get domain from URL
	const getDomain = (url: string): string => {
		try {
			return new URL(url).hostname.replace('www.', '');
		} catch {
			return '';
		}
	};

	// Format date
	const formatDate = (dateString: string | null): string => {
		if (!dateString) return 'Unknown date';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return 'Invalid date';
		}
	};

	// Render loading skeleton
	const renderLoadingSkeleton = () => (
		<IonContent className="ion-padding">
			<div className="loading-skeleton">
				<IonSkeletonText animated style={{ width: '60%', height: '28px' }} />
				<IonSkeletonText animated style={{ width: '40%', height: '16px', marginTop: '8px' }} />
				<IonSkeletonText animated style={{ width: '100%', height: '200px', marginTop: '16px' }} />
				<IonSkeletonText animated style={{ width: '100%', height: '16px', marginTop: '16px' }} />
				<IonSkeletonText animated style={{ width: '80%', height: '16px', marginTop: '8px' }} />
			</div>
		</IonContent>
	);

	// Render error state
	const renderError = () => (
		<IonContent className="ion-padding">
			<div className="error-state ion-text-center">
				<IonIcon
					icon={linkOutline}
					size="large"
					color="medium"
					style={{ fontSize: '64px', marginBottom: '16px' }}
				/>
				<IonText color="danger">
					<h2>Failed to Parse Article</h2>
					<p>{error || 'Unable to extract article content. Please check the URL and try again.'}</p>
				</IonText>
				<IonButton onClick={handleRetry} disabled={isLoading}>
					<IonIcon icon={refreshOutline} slot="start" />
					Retry
				</IonButton>
			</div>
		</IonContent>
	);

	// Render URL input (when no article)
	const renderUrlInput = () => (
		<IonContent className="ion-padding">
			<div className="url-input-container">
				<div className="ion-text-center ion-margin-bottom">
					<IonIcon
						icon={bookmarkOutline}
						size="large"
						color="primary"
						style={{ fontSize: '64px', marginBottom: '16px' }}
					/>
					<IonText>
						<h2>Save an Article</h2>
						<p>Enter the URL of an article you'd like to save and read later.</p>
					</IonText>
				</div>

				<UrlInputForm
					onUrlSubmit={onParseUrl}
					isLoading={isLoading}
					error={error}
					initialUrl={initialUrl}
					placeholder="https://example.com/article"
					autoSubmitValid={false}
					showClipboardButton={true}
				/>
			</div>
		</IonContent>
	);

	// Render article preview
	const renderArticlePreview = () => {
		if (!article) return null;

		return (
			<IonContent>
				{/* Article header */}
				<div className="article-header">
					{(article.image || article.lead_image_url) && (
						<IonImg
							src={article.image || article.lead_image_url}
							alt={article.title}
							className="article-image"
						/>
					)}
					
					<div className="article-meta ion-padding">
						<IonText>
							<h1 className="article-title">{article.title}</h1>
						</IonText>

						{article.excerpt && (
							<IonText color="medium">
								<p className="article-excerpt">{article.excerpt}</p>
							</IonText>
						)}

						{/* Metadata chips */}
						<div className="metadata-chips">
							{article.author && (
								<IonChip color="medium" outline>
									<IonIcon icon={personOutline} />
									<IonLabel>{article.author}</IonLabel>
								</IonChip>
							)}

							{article.date_published && (
								<IonChip color="medium" outline>
									<IonIcon icon={calendarOutline} />
									<IonLabel>{formatDate(article.date_published)}</IonLabel>
								</IonChip>
							)}

							{estimatedReadTime > 0 && (
								<IonChip color="primary" outline>
									<IonIcon icon={timeOutline} />
									<IonLabel>{estimatedReadTime} min read</IonLabel>
								</IonChip>
							)}

							{article.url && (
								<IonChip color="tertiary" outline>
									<IonIcon icon={linkOutline} />
									<IonLabel>{getDomain(article.url)}</IonLabel>
								</IonChip>
							)}
						</div>
					</div>
				</div>

				{/* Article content preview */}
				{article.content && (
					<div className="article-content ion-padding">
						<IonCard>
							<IonCardContent>
								<div 
									className="content-preview"
									dangerouslySetInnerHTML={{ 
										__html: article.content.substring(0, 1000) + '...' 
									}}
								/>
								<IonButton fill="clear" size="small" color="primary">
									<IonIcon icon={eyeOutline} slot="start" />
									Preview content
								</IonButton>
							</IonCardContent>
						</IonCard>
					</div>
				)}

				{/* Tags section */}
				<div className="tags-section ion-padding">
					<IonItem lines="none">
						<IonIcon icon={pricetagOutline} slot="start" />
						<IonLabel>
							<h3>Tags</h3>
							<p>Organize your article with tags</p>
						</IonLabel>
					</IonItem>

					{/* Selected tags */}
					{selectedTags.length > 0 && (
						<div className="selected-tags">
							{selectedTags.map((tag, index) => (
								<IonChip key={index} color="primary">
									<IonLabel>{tag}</IonLabel>
									<IonIcon
										icon={closeOutline}
										onClick={() => removeTag(tag)}
									/>
								</IonChip>
							))}
						</div>
					)}

					{/* Tag input */}
					<IonItem>
						<IonInput
							value={tagInput.value}
							placeholder="Add a tag..."
							onIonInput={(e) => handleTagInputChange(e.detail.value!)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && tagInput.value.trim()) {
									addTag(tagInput.value);
								}
							}}
						/>
						<IonButton
							slot="end"
							size="small"
							fill="clear"
							onClick={() => addTag(tagInput.value)}
							disabled={!tagInput.value.trim()}
						>
							<IonIcon icon={addOutline} />
						</IonButton>
					</IonItem>

					{/* Tag suggestions */}
					{tagInput.showSuggestions && (
						<div className="tag-suggestions">
							{tagInput.suggestions.map((suggestion) => (
								<IonChip
									key={suggestion}
									outline
									onClick={() => addTag(suggestion)}
								>
									<IonLabel>{suggestion}</IonLabel>
								</IonChip>
							))}
						</div>
					)}
				</div>

				{/* Notes section */}
				<div className="notes-section ion-padding">
					<IonItem lines="none">
						<IonLabel>
							<h3>Personal Notes</h3>
							<p>Add your thoughts about this article</p>
						</IonLabel>
					</IonItem>
					<IonTextarea
						value={notes}
						placeholder="Add personal notes..."
						rows={4}
						onIonInput={(e) => setNotes(e.detail.value!)}
					/>
				</div>

				{/* Save button */}
				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton
						onClick={handleSave}
						disabled={isSaving}
						color="primary"
					>
						{isSaving ? <IonSpinner /> : <IonIcon icon={bookmarkOutline} />}
					</IonFabButton>
				</IonFab>
			</IonContent>
		);
	};

	// Main render
	const renderContent = () => {
		if (isLoading) {
			return renderLoadingSkeleton();
		}

		if (error && !article) {
			return renderError();
		}

		if (!article) {
			return renderUrlInput();
		}

		return renderArticlePreview();
	};

	return (
		<>
			<IonModal isOpen={isOpen} onDidDismiss={onClose}>
				<IonHeader>
					<IonToolbar>
						<IonTitle>
							{article ? 'Preview Article' : 'Save Article'}
						</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={onClose} fill="clear">
								<IonIcon icon={closeOutline} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				{renderContent()}
			</IonModal>

			{/* Toast for feedback */}
			<IonToast
				isOpen={showToast}
				onDidDismiss={() => setShowToast(false)}
				message={toastMessage}
				duration={3000}
				position="bottom"
			/>

			{/* Styling */}
			<style>{`
				.loading-skeleton {
					padding: 16px;
				}

				.error-state {
					padding: 32px 16px;
				}

				.url-input-container {
					max-width: 500px;
					margin: 0 auto;
					padding: 32px 0;
				}

				.article-header {
					position: relative;
				}

				.article-image {
					width: 100%;
					max-height: 200px;
					object-fit: cover;
				}

				.article-title {
					font-size: 24px;
					font-weight: bold;
					line-height: 1.3;
					margin: 16px 0 8px 0;
				}

				.article-excerpt {
					font-size: 16px;
					line-height: 1.5;
					margin: 8px 0 16px 0;
				}

				.metadata-chips {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 16px 0;
				}

				.content-preview {
					font-size: 14px;
					line-height: 1.6;
					color: var(--ion-color-medium);
				}

				.content-preview h1,
				.content-preview h2,
				.content-preview h3 {
					color: var(--ion-color-dark);
				}

				.selected-tags {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 8px 0;
				}

				.tag-suggestions {
					display: flex;
					flex-wrap: wrap;
					gap: 8px;
					margin: 8px 0;
				}

				.notes-section textarea {
					border: 1px solid var(--ion-color-light);
					border-radius: 8px;
					padding: 12px;
				}

				@media (max-width: 576px) {
					.article-title {
						font-size: 20px;
					}
					
					.metadata-chips {
						justify-content: center;
					}
				}
			`}</style>
		</>
	);
};

export default ArticlePreviewModal;