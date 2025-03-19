import React, { useState, useEffect, useRef } from 'react';
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
	IonToast,
	IonBackdrop,
	IonLoading
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
	const [showSaveToast, setShowSaveToast] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const modalRef = useRef<HTMLIonModalElement>(null);

	// Stili per risolvere problemi di selezione su iOS
	const noIOSPasteStyles = {
		WebkitTouchCallout: "none",
		WebkitUserSelect: "none",
		KhtmlUserSelect: "none",
		MozUserSelect: "none",
		msUserSelect: "none",
		userSelect: "none",
		touchAction: "manipulation",
		cursor: "pointer",
		pointerEvents: "auto",
	} as React.CSSProperties;

	// Funzione per pulire l'URL dalla clipboard
	const cleanClipboardUrl = (clipboardValue: string): string => {
		try {
			// Se siamo in ambiente nativo e l'URL contiene caratteri escape
			if (clipboardValue.includes("\\")) {
				// Rimuove gli escape backslash che iOS aggiunge
				clipboardValue = clipboardValue.replace(/\\/g, "");
			}
			// Decodifica se necessario
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
	const readFromClipboard = async (event?: React.MouseEvent | React.TouchEvent) => {
		// Previeni comportamenti predefiniti
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		try {
			console.log("Tentativo di lettura della clipboard...");
			const { value } = await Clipboard.read();
			console.log("Raw clipboard value:", value);

			if (value) {
				const cleanedUrl = cleanClipboardUrl(value);
				console.log("Cleaned URL:", cleanedUrl);

				if (isValidUrl(cleanedUrl)) {
					console.log("URL valido trovato:", cleanedUrl);
					setClipboardContent(cleanedUrl);
					setShowClipboardAlert(true);
					setClipboardError(null);
				} else {
					console.log("URL non valido:", cleanedUrl);
					setClipboardError("Il contenuto degli appunti non è un URL valido");
				}
			} else {
				console.log("Nessun contenuto negli appunti");
				setClipboardError("Nessun contenuto trovato negli appunti");
			}
		} catch (err) {
			console.error("Errore durante la lettura della clipboard:", err);
			setClipboardError("Non è stato possibile accedere agli appunti");
		}
	};

	// Leggi dalla clipboard all'apertura della modale
	useEffect(() => {
		if (isOpen && !searchText) {
			// Delay per evitare problemi con il balloon di iOS
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

	const handleClose = () => {
		console.log("Chiusura modale...");
		setSearchText("");
		setClipboardContent("");
		setClipboardError(null);

		// Se la modale è aperta tramite ref, la chiudiamo con dismiss()
		if (modalRef.current) {
			modalRef.current.dismiss().then(() => {
				console.log("Modale chiusa tramite ref");
				onClose();
			}).catch(err => {
				console.error("Errore durante la chiusura della modale:", err);
				// Chiamiamo comunque onClose in caso di errore
				onClose();
			});
		} else {
			// Chiamiamo direttamente onClose
			onClose();
		}
	};

	const handleSave = async () => {
		try {
			console.log("Salvataggio articolo...");
			setIsSaving(true);

			// Se onSave è una Promise, attendiamo il completamento
			if (onSave && typeof onSave === 'function') {
				await Promise.resolve(onSave());
			}

			setShowSaveToast(true);

			// Chiudiamo la modale dopo un breve ritardo
			setTimeout(() => {
				handleClose();
				setIsSaving(false);
			}, 1000);
		} catch (error) {
			console.error("Errore durante il salvataggio:", error);
			setIsSaving(false);
			// Mostriamo comunque un feedback in caso di errore
			setShowSaveToast(true);
		}
	};

	return (
		<>
			<IonModal
				ref={modalRef}
				isOpen={isOpen}
				onDidDismiss={handleClose}
				breakpoints={[0, 1]}
				initialBreakpoint={1}
				className="article-preview-modal"
			>
				<IonHeader translucent>
					<IonToolbar>
						<IonTitle>Anteprima Articolo</IonTitle>
						<IonButtons slot="end">
							<IonButton onClick={handleClose} id="close-button">
								<IonIcon icon={close} />
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>

				<IonContent fullscreen>
					{!article && !isLoading && (
						<div className="p-4 mt-10">
							<IonSearchbar
								animated
								value={searchText}
								placeholder="Url articolo"
								debounce={1000}
								onIonInput={(e) => handleUrlChange(e.detail.value || "")}
							/>
							<div
								style={noIOSPasteStyles}
								className="clipboard-button"
								onClick={readFromClipboard}
								onTouchEnd={readFromClipboard}
							>
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
								onDismiss={handleClose}
								displayFrom="modalPreview"
								postId={article.id || ""}
								session={session}
							/>
							<div className="fixed-save-button">
								<IonButton
									onClick={handleSave}
									className="save-button"
									shape="round"
									size="large"
									strong={true}
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<IonSpinner name="dots" slot="start" />
											<span className="save-button-text">Salvataggio...</span>
										</>
									) : (
										<>
											<IonIcon icon={saveOutline} slot="start" />
											<span className="save-button-text">Salva Articolo</span>
										</>
									)}
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

				<IonToast
					isOpen={showSaveToast}
					onDidDismiss={() => setShowSaveToast(false)}
					message="Articolo salvato con successo!"
					duration={2000}
					position="bottom"
					color="success"
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
						background-color: rgba(var(--ion-color-primary-rgb), 0.1);
						border-radius: 8px;
						margin: 12px 0;
					}

					.clipboard-button:hover {
						opacity: 0.8;
						transform: scale(1.02);
						background-color: rgba(var(--ion-color-primary-rgb), 0.15);
					}

					.clipboard-button:active {
						transform: scale(0.98);
						background-color: rgba(var(--ion-color-primary-rgb), 0.2);
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

			{/* Loading di salvataggio globale */}
			<IonLoading
				isOpen={isSaving}
				message="Salvataggio articolo..."
				spinner="circular"
			/>
		</>
	);
};

export default ArticlePreviewModal;