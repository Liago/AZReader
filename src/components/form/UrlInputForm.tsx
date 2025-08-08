import React, { useState, useEffect, useCallback } from 'react';
import { 
	IonButton, 
	IonInput, 
	IonItem, 
	IonLabel, 
	IonText, 
	IonIcon,
	IonSpinner,
	IonToast
} from '@ionic/react';
import { 
	linkOutline, 
	clipboardOutline, 
	checkmarkCircleOutline,
	warningOutline
} from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';

// Types
export interface UrlInputFormProps {
	onUrlSubmit: (url: string) => void;
	isLoading?: boolean;
	error?: string | null;
	initialUrl?: string;
	disabled?: boolean;
	showClipboardButton?: boolean;
	placeholder?: string;
	autoSubmitValid?: boolean; // Auto-submit when URL becomes valid
}

interface ValidationState {
	isValid: boolean;
	isValidating: boolean;
	message: string;
	type: 'success' | 'warning' | 'error' | '';
}

// URL validation patterns
const URL_PATTERNS = {
	// Basic URL pattern
	basic: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i,
	// More strict pattern including common domains
	strict: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
	// Domain extraction
	domain: /^(https?:\/\/)?(www\.)?([^\/\s]+)/i
};

// Common news/article domains for enhanced validation
const ARTICLE_DOMAINS = [
	'medium.com', 'substack.com', 'blog', 'news', 'article', 
	'post', 'story', 'read', 'press', 'journal', 'magazine'
];

const UrlInputForm: React.FC<UrlInputFormProps> = ({
	onUrlSubmit,
	isLoading = false,
	error = null,
	initialUrl = '',
	disabled = false,
	showClipboardButton = true,
	placeholder = 'Paste article URL here...',
	autoSubmitValid = false
}) => {
	const [url, setUrl] = useState<string>(initialUrl);
	const [validation, setValidation] = useState<ValidationState>({
		isValid: false,
		isValidating: false,
		message: '',
		type: ''
	});
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState('');

	// Validate URL with debouncing
	const validateUrl = useCallback(async (inputUrl: string) => {
		if (!inputUrl.trim()) {
			setValidation({
				isValid: false,
				isValidating: false,
				message: '',
				type: ''
			});
			return;
		}

		setValidation(prev => ({ ...prev, isValidating: true }));

		// Simulate validation delay for better UX
		await new Promise(resolve => setTimeout(resolve, 300));

		try {
			let cleanedUrl = inputUrl.trim();
			
			// Auto-add protocol if missing
			if (!cleanedUrl.match(/^https?:\/\//i)) {
				cleanedUrl = 'https://' + cleanedUrl;
			}

			// Try to create URL object for validation
			const urlObj = new URL(cleanedUrl);
			const hostname = urlObj.hostname.toLowerCase();

			// Check for common article indicators
			const isLikelyArticle = ARTICLE_DOMAINS.some(domain => 
				hostname.includes(domain) || 
				cleanedUrl.toLowerCase().includes(domain)
			);

			let validationType: ValidationState['type'] = 'success';
			let message = 'Valid URL';

			if (isLikelyArticle) {
				message = 'Article URL detected';
			} else if (hostname.length < 4) {
				validationType = 'warning';
				message = 'URL seems too short';
			} else if (!hostname.includes('.')) {
				validationType = 'error';
				message = 'Invalid domain format';
				setValidation({
					isValid: false,
					isValidating: false,
					message,
					type: validationType
				});
				return;
			}

			setValidation({
				isValid: true,
				isValidating: false,
				message,
				type: validationType
			});

			// Update URL with cleaned version
			if (cleanedUrl !== inputUrl) {
				setUrl(cleanedUrl);
			}

			// Auto-submit if enabled and URL is valid
			if (autoSubmitValid && (validationType === 'success' || validationType === 'warning')) {
				onUrlSubmit(cleanedUrl);
			}

		} catch (error) {
			setValidation({
				isValid: false,
				isValidating: false,
				message: 'Invalid URL format',
				type: 'error'
			});
		}
	}, [autoSubmitValid, onUrlSubmit]);

	// Debounced validation effect
	useEffect(() => {
		const timer = setTimeout(() => {
			validateUrl(url);
		}, 500);

		return () => clearTimeout(timer);
	}, [url, validateUrl]);

	// Handle clipboard paste
	const handleClipboardPaste = async () => {
		try {
			const result = await Clipboard.read();
			if (result?.value) {
				const clipText = result.value.trim();
				setUrl(clipText);
				setToastMessage('URL pasted from clipboard');
				setShowToast(true);
			} else {
				setToastMessage('Clipboard is empty');
				setShowToast(true);
			}
		} catch (error) {
			console.error('Clipboard error:', error);
			setToastMessage('Could not access clipboard');
			setShowToast(true);
		}
	};

	// Handle form submission
	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		
		if (!validation.isValid || !url.trim()) {
			setToastMessage('Please enter a valid URL first');
			setShowToast(true);
			return;
		}

		onUrlSubmit(url);
	};

	// Handle URL input change
	const handleUrlChange = (e: CustomEvent) => {
		const value = (e.detail.value as string) || '';
		setUrl(value);
	};

	// Get validation icon
	const getValidationIcon = () => {
		if (validation.isValidating) {
			return <IonSpinner name="dots" />;
		}
		
		switch (validation.type) {
			case 'success':
				return <IonIcon icon={checkmarkCircleOutline} color="success" />;
			case 'warning':
				return <IonIcon icon={warningOutline} color="warning" />;
			case 'error':
				return <IonIcon icon={warningOutline} color="danger" />;
			default:
				return null;
		}
	};

	// Get validation color for input
	const getValidationColor = () => {
		if (!url.trim()) return undefined;
		
		switch (validation.type) {
			case 'success':
				return 'success';
			case 'warning':
				return 'warning';
			case 'error':
				return 'danger';
			default:
				return undefined;
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<IonItem 
				lines="none" 
				className={`url-input-item ${validation.type ? `validation-${validation.type}` : ''}`}
			>
				<IonIcon 
					icon={linkOutline} 
					slot="start" 
					color={getValidationColor() || 'medium'} 
				/>
				
				<IonInput
					value={url}
					placeholder={placeholder}
					onIonInput={handleUrlChange}
					disabled={disabled || isLoading}
					clearInput
					type="url"
					enterkeyhint="go"
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							handleSubmit();
						}
					}}
					color={getValidationColor()}
					className="url-input"
				/>

				{/* Validation indicator */}
				<div slot="end" className="validation-indicator">
					{getValidationIcon()}
				</div>
			</IonItem>

			{/* Validation message */}
			{validation.message && (
				<IonItem lines="none" className="validation-message">
					<IonText color={validation.type}>
						<small>{validation.message}</small>
					</IonText>
				</IonItem>
			)}

			{/* Error message from parent */}
			{error && (
				<IonItem lines="none" className="error-message">
					<IonText color="danger">
						<small>{error}</small>
					</IonText>
				</IonItem>
			)}

			{/* Action buttons */}
			<div className="url-input-actions">
				{showClipboardButton && (
					<IonButton
						fill="outline"
						size="default"
						onClick={handleClipboardPaste}
						disabled={disabled || isLoading}
						className="clipboard-button"
					>
						<IonIcon icon={clipboardOutline} slot="start" />
						Paste
					</IonButton>
				)}

				<IonButton
					type="submit"
					expand="block"
					disabled={!validation.isValid || disabled || isLoading}
					className="submit-button"
				>
					{isLoading && <IonSpinner slot="start" />}
					{isLoading ? 'Analyzing...' : 'Analyze Article'}
				</IonButton>
			</div>

			{/* Toast for user feedback */}
			<IonToast
				isOpen={showToast}
				onDidDismiss={() => setShowToast(false)}
				message={toastMessage}
				duration={2000}
				position="bottom"
			/>

			<style>{`
				.url-input-item {
					--background: var(--ion-color-light);
					--border-radius: 12px;
					margin-bottom: 8px;
					border: 2px solid transparent;
					transition: border-color 0.3s ease;
				}

				.url-input-item.validation-success {
					border-color: var(--ion-color-success);
				}

				.url-input-item.validation-warning {
					border-color: var(--ion-color-warning);
				}

				.url-input-item.validation-error {
					border-color: var(--ion-color-danger);
				}

				.validation-indicator {
					min-width: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.validation-message,
				.error-message {
					--padding-start: 0;
					--padding-end: 0;
					--inner-padding-start: 44px;
				}

				.url-input-actions {
					display: flex;
					gap: 12px;
					margin-top: 16px;
				}

				.clipboard-button {
					flex: 0 0 auto;
				}

				.submit-button {
					flex: 1;
				}

				.url-input {
					font-size: 16px;
				}

				@media (max-width: 576px) {
					.url-input-actions {
						flex-direction: column;
					}
					
					.clipboard-button {
						order: 2;
					}
					
					.submit-button {
						order: 1;
					}
				}
			`}</style>
		</form>
	);
};

export default UrlInputForm;