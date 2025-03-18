import React, { useState, useEffect } from 'react';
import {
	IonModal,
	IonContent,
	IonButtons,
	IonButton,
	IonIcon,
	IonSpinner,
	IonSearchbar,
	IonAlert,
	IonHeader,
	IonToolbar,
	IonTitle,
} from '@ionic/react';
import { close, saveOutline, clipboard } from 'ionicons/icons';
import { Session } from '@supabase/supabase-js';
import { Clipboard } from '@capacitor/clipboard';
import { isValidUrl } from '@utility/utils';
import Article from './Article';

interface ArticlePreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
	article: any;
	isLoading: boolean;
	session: Session | null;
	onUrlSubmit: (url: string) => void;
}

const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
	isOpen,
	onClose,
	onSave,
	article,
	isLoading,
	session,
	onUrlSubmit,
}) => {
	const [searchText, setSearchText] = useState("");
	const [showClipboardAlert, setShowClipboardAlert] = useState(false);
	const [clipboardContent, setClipboardContent] = useState("");
	const [clipboardError, setClipboardError] = useState<string | null>(null);

	// Funzione per pulire l'URL dalla clipboard
	const cleanClipboardUrl = (clipboardValue: string): string => {
		try {
			if (clipboardValue.includes("\\")) {
				clipboardValue = clipboardValue.replace(/\\/g, "");
			}
			if (clipboardValue.includes("%")) {
				clipboardValue = decodeURIComponent(clipboardValue);
			}
			return clipboardValue;
		} catch (e) {
			console.error("Error cleaning clipboard URL:", e);
			return clipboardValue;
		}
	};

	// Funzione per leggere dalla clipboard
	const readFromClipboard = async () => {
		try {
			const { value } = await Clipboard.read();
			console.log("Raw clipboard value:", value);

			if (value) {
				const cleanedUrl = cleanClipboardUrl(value);
				console.log("Cleaned URL:", cleanedUrl);

				if (isValidUrl(cleanedUrl)) {
					setClipboardContent(cleanedUrl);
					setShowClipboardAlert(true);
					setClipboardError(null);
				} else {
					setClipboardError("Il contenuto degli appunti non è un URL valido");
				}
			}
		} catch (err) {
			console.error("Errore durante la lettura della clipboard:", err);
			setClipboardError("Non è stato possibile accedere agli appunti");
		}
	};

	// Leggi dalla clipboard all'apertura della modale
	useEffect(() => {
		if (isOpen && !searchText) {
			const timer = setTimeout(() => {
				readFromClipboard();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isOpen, searchText]);

	const handleUrlChange = (value: string) => {
		if (!value) {
			setSearchText("");
			return;
		}

		if (isValidUrl(value)) {
			setSearchText(value);
			onUrlSubmit(value);
		}
	};

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			breakpoints={[0, 1]}
			initialBreakpoint={1}
			className="article-preview-modal"
		>
			<IonHeader translucent>
				<IonToolbar>
					<IonTitle>Anteprima Articolo</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}>
							<IonIcon icon={close} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{!article && !isLoading && (
					<div className="p-4">
						<IonSearchbar
							animated
							value={searchText}
							placeholder="Url articolo"
							debounce={1000}
							onIonChange={(e) => handleUrlChange(e?.detail?.value || "")}
						/>
						<div className="clipboard-button" onClick={readFromClipboard}>
							<div className="flex items-center justify-center p-4 text-primary gap-2">
								<IonIcon icon={clipboard} />
								<span>Incolla dalla clipboard</span>
							</div>
						</div>
						{clipboardError && (
							<div className="text-center text-danger text-sm p-2">
								{clipboardError}
							</div>
						)}
					</div>
				)}

				{isLoading ? (
					<div className="flex flex-col items-center justify-center min-h-[50vh]">
						<IonSpinner name="circular" />
						<p className="text-sm text-gray-500 mt-4">Caricamento anteprima...</p>
					</div>
				) : article ? (
					<div className="relative">
						<Article
							articleParsed={article}
							onDismiss={onClose}
							displayFrom="modalPreview"
							postId={article.id || ""}
							session={session}
						/>
						<div className="fixed-save-button">
							<IonButton
								onClick={onSave}
								className="save-button"
								shape="round"
								size="large"
								strong={true}
							>
								<IonIcon icon={saveOutline} slot="start" />
								<span className="save-button-text">Salva Articolo</span>
							</IonButton>
						</div>
					</div>
				) : null}
			</IonContent>

			<IonAlert
				isOpen={showClipboardAlert}
				onDidDismiss={() => setShowClipboardAlert(false)}
				header="URL trovato nella clipboard"
				message={`Vuoi utilizzare questo URL?\n${clipboardContent}`}
				buttons={[
					{
						text: "No",
						role: "cancel",
					},
					{
						text: "Sì",
						handler: () => {
							handleUrlChange(clipboardContent);
							setShowClipboardAlert(false);
						},
					},
				]}
			/>

			<style>{`
				.article-preview-modal {
					--height: 100%;
					--border-radius: 16px 16px 0 0;
				}

				.fixed-save-button {
					position: fixed;
					bottom: 24px;
					right: 24px;
					z-index: 1000;
					padding: 0;
					margin: 0;
					display: flex;
					justify-content: center;
					align-items: center;
					animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
				}

				.save-button {
					--background: var(--ion-color-primary);
					--background-hover: var(--ion-color-primary-tint);
					--background-activated: var(--ion-color-primary-shade);
					--box-shadow: 0 8px 16px rgba(var(--ion-color-primary-rgb), 0.2);
					--padding-start: 1.75rem;
					--padding-end: 1.75rem;
					margin: 0;
					height: 52px;
					font-weight: 600;
					letter-spacing: 0.5px;
					text-transform: none;
					transition: all 0.3s ease;
				}

				.save-button:hover {
					transform: translateY(-2px);
					--box-shadow: 0 12px 20px rgba(var(--ion-color-primary-rgb), 0.3);
				}

				.save-button:active {
					transform: translateY(1px);
					--box-shadow: 0 5px 10px rgba(var(--ion-color-primary-rgb), 0.2);
				}

				.save-button-text {
					margin-left: 8px;
					font-size: 16px;
				}

				.clipboard-button {
					user-select: none;
					touch-action: manipulation;
					cursor: pointer;
					pointer-events: auto;
					transition: all 0.2s ease;
				}

				.clipboard-button:hover {
					opacity: 0.8;
					transform: scale(1.02);
				}

				.clipboard-button:active {
					transform: scale(0.98);
				}

				@media (prefers-color-scheme: dark) {
					.article-preview-modal {
						--background: var(--ion-background-color);
					}
					
					.save-button {
						--box-shadow: 0 8px 16px rgba(var(--ion-color-primary-rgb), 0.4);
					}
				}

				@keyframes slideIn {
					from {
						transform: translateY(100%);
					}
					to {
						transform: translateY(0);
					}
				}

				@keyframes bounceIn {
					0% {
						opacity: 0;
						transform: scale(0.3) translateY(100px);
					}
					50% {
						opacity: 0.9;
						transform: scale(1.1);
					}
					80% {
						opacity: 1;
						transform: scale(0.89);
					}
					100% {
						opacity: 1;
						transform: scale(1);
					}
				}

				.article-preview-modal.ion-overlay-enter-animation {
					animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				}
			`}</style>
		</IonModal>
	);
};

export default ArticlePreviewModal; 