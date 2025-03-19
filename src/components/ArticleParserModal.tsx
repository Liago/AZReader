import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Clipboard } from '@capacitor/clipboard';
import { isValidUrl } from '@utility/utils';
import Article from './Article';

// Interfaccia per props
interface ArticleParserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmitUrl?: (url: string) => void;
	onSave?: () => void;
	article?: any;
	isLoading?: boolean;
	session?: Session | null;
}

/**
 * Versione HTML pura del parser di articoli
 */
const ArticleParserModal: React.FC<ArticleParserModalProps> = ({
	isOpen,
	onClose,
	onSubmitUrl,
	onSave,
	article,
	isLoading,
	session
}) => {
	// Stato per l'URL
	const [url, setUrl] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [showSuccess, setShowSuccess] = useState(false);

	// Funzione per resettare tutti gli stati
	const resetStates = () => {
		setUrl('');
		setErrorMessage('');
		setShowSuccess(false);
	};

	// Funzione per leggere dalla clipboard
	const handleClipboardPaste = async () => {
		console.log('Lettura clipboard');
		setErrorMessage('');

		try {
			const result = await Clipboard.read();
			console.log('Contenuto clipboard:', result);

			if (result && result.value) {
				const clipText = result.value.trim();

				if (clipText) {
					setUrl(clipText);

					// Verifica validità URL
					const cleanedUrl = cleanUrl(clipText);
					if (!isValidUrl(cleanedUrl)) {
						setErrorMessage('L\'URL incollato non sembra valido. Verificalo e correggilo se necessario.');
					}
				} else {
					setErrorMessage('Nessun testo trovato negli appunti');
				}
			} else {
				setErrorMessage('Clipboard vuota o non accessibile');
			}
		} catch (error) {
			console.error('Errore clipboard:', error);
			setErrorMessage('Errore durante l\'accesso alla clipboard');
		}
	};

	// Gestione del body overflow e reset degli stati quando la modale è aperta o chiusa
	useEffect(() => {
		// Pulisci gli stati sia all'apertura che alla chiusura
		resetStates();

		if (isOpen) {
			document.body.style.overflow = 'hidden';

			// Leggi automaticamente dalla clipboard all'apertura
			// Dopo aver resettato gli stati
			handleClipboardPaste();
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
			resetStates();
		};
	}, [isOpen]);

	// Se la modale non è aperta, non renderizzare nulla
	if (!isOpen) return null;

	// Funzione per la chiusura
	const handleClose = () => {
		console.log('Chiusura modale');
		resetStates();
		onClose();
	};

	// Funzione per gestire il cambio dell'URL
	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		if (errorMessage) setErrorMessage('');
	};

	// Funzione per pulire l'URL
	const cleanUrl = (inputUrl: string): string => {
		try {
			let cleaned = inputUrl.trim();

			// Rimuovi caratteri di escape
			cleaned = cleaned.replace(/\\/g, '');

			// Decodifica se necessario
			if (cleaned.includes('%')) {
				try {
					cleaned = decodeURIComponent(cleaned);
				} catch (e) {
					console.error('Errore decodifica URL:', e);
				}
			}

			// Aggiungi https se manca
			if (cleaned && !cleaned.match(/^https?:\/\//i)) {
				cleaned = 'https://' + cleaned;
			}

			return cleaned;
		} catch (e) {
			console.error('Errore pulizia URL:', e);
			return inputUrl;
		}
	};

	// Funzione per analizzare l'URL
	const handleAnalyzeUrl = () => {
		console.log('Analisi URL:', url);

		if (!url || url.trim() === '') {
			setErrorMessage('Inserisci un URL da analizzare');
			return;
		}

		const cleanedUrl = cleanUrl(url);

		if (!isValidUrl(cleanedUrl)) {
			setErrorMessage('URL non valido. Inserisci un URL completo (es. https://www.example.com)');
			return;
		}

		console.log('Invio URL per analisi:', cleanedUrl);
		if (onSubmitUrl) {
			onSubmitUrl(cleanedUrl);
		}
	};

	// Funzione per salvare l'articolo
	const handleSaveArticle = () => {
		console.log('Salvataggio articolo');
		if (onSave) {
			onSave();
			setShowSuccess(true);

			// Chiudi la modale dopo un breve periodo
			setTimeout(() => {
				handleClose();
			}, 1500);
		}
	};

	// Determina il contenuto da mostrare in base allo stato
	const renderContent = () => {
		if (isLoading) {
			return (
				<div style={{ textAlign: 'center', padding: '40px' }}>
					<div className="spinner" style={{
						border: '4px solid rgba(0, 0, 0, 0.1)',
						borderLeft: '4px solid #3880ff',
						borderRadius: '50%',
						width: '40px',
						height: '40px',
						margin: '0 auto 20px',
						animation: 'spin 1s linear infinite'
					}}></div>
					<p>Caricamento anteprima articolo...</p>
					<style>{`
						@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
					`}</style>
				</div>
			);
		}

		if (article) {
			return (
				<div style={{ padding: '20px' }}>
					{/* Render anteprima articolo */}
					<div className="article-preview">
						<Article
							articleParsed={article}
							onDismiss={handleClose}
							displayFrom="modalPreview"
							postId={article.id || ""}
							session={session || null}
						/>
					</div>

					{/* Pulsante salva */}
					<div style={{
						position: 'fixed',
						bottom: '24px',
						right: '24px',
						zIndex: 2000
					}}>
						<button
							onClick={handleSaveArticle}
							style={{
								backgroundColor: '#3880ff',
								color: 'white',
								border: 'none',
								borderRadius: '28px',
								padding: '12px 24px',
								fontSize: '16px',
								fontWeight: 'bold',
								cursor: 'pointer',
								boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
								display: 'flex',
								alignItems: 'center',
								gap: '8px'
							}}
						>
							<span>💾</span> Salva Articolo
						</button>
					</div>

					{/* Toast di successo */}
					{showSuccess && (
						<div style={{
							position: 'fixed',
							bottom: '16px',
							left: '50%',
							transform: 'translateX(-50%)',
							backgroundColor: '#2dd36f',
							color: 'white',
							padding: '12px 24px',
							borderRadius: '8px',
							boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
							zIndex: 2001
						}}>
							Articolo salvato con successo!
						</div>
					)}
				</div>
			);
		}

		// Stato predefinito - Inserimento URL
		return (
			<div style={{ padding: '20px' }}>
				<h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Inserisci l'URL di un articolo</h3>

				{/* Campo URL */}
				<div style={{ marginBottom: '20px' }}>
					<input
						type="text"
						value={url}
						onChange={handleUrlChange}
						placeholder="https://esempio.com/articolo"
						style={{
							width: '100%',
							padding: '12px 16px',
							fontSize: '16px',
							borderRadius: '8px',
							border: errorMessage ? '1px solid #eb445a' : '1px solid #ddd',
							backgroundColor: '#f8f8f8',
							boxSizing: 'border-box'
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleAnalyzeUrl();
						}}
					/>

					{/* Messaggio di errore */}
					{errorMessage && (
						<div style={{
							color: '#eb445a',
							fontSize: '14px',
							marginTop: '8px',
							padding: '8px 12px',
							backgroundColor: 'rgba(235, 68, 90, 0.1)',
							borderRadius: '4px'
						}}>
							{errorMessage}
						</div>
					)}
				</div>

				{/* Pulsanti */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
					{/* Pulsante Incolla */}
					<button
						onClick={handleClipboardPaste}
						style={{
							backgroundColor: 'transparent',
							color: '#3880ff',
							border: '1px solid #3880ff',
							borderRadius: '4px',
							padding: '12px',
							fontSize: '16px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px'
						}}
					>
						<span>📋</span> Incolla dalla clipboard
					</button>

					{/* Pulsante Analizza */}
					<button
						onClick={handleAnalyzeUrl}
						disabled={!url.trim()}
						style={{
							backgroundColor: url.trim() ? '#3880ff' : '#b4c8f0',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							padding: '12px',
							fontSize: '16px',
							fontWeight: 'bold',
							cursor: url.trim() ? 'pointer' : 'not-allowed',
							marginTop: '8px'
						}}
					>
						Analizza URL
					</button>
				</div>
			</div>
		);
	};

	return (
		<div className="modal-overlay" onClick={handleClose} style={{
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 1000
		}}>
			{/* Content box - stopPropagation per evitare chiusura quando si clicca all'interno */}
			<div
				className="modal-content"
				onClick={e => e.stopPropagation()}
				style={{
					backgroundColor: 'white',
					borderRadius: '8px',
					maxWidth: '90%',
					width: '500px',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
					display: 'flex',
					flexDirection: 'column',
					color: '#333'
				}}
			>
				{/* Header */}
				<div style={{
					padding: '16px',
					borderBottom: '1px solid #eee',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center'
				}}>
					<h2 style={{ margin: 0, fontSize: '18px' }}>
						{article ? 'Anteprima Articolo' : 'Analizza Articolo'}
					</h2>
					<button
						onClick={handleClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '24px',
							cursor: 'pointer',
							padding: '4px 8px',
							borderRadius: '4px'
						}}
					>
						✕
					</button>
				</div>

				{/* Body - contenuto dinamico in base allo stato */}
				{renderContent()}
			</div>
		</div>
	);
};

export default ArticleParserModal; 