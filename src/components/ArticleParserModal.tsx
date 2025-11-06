import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Clipboard } from '@capacitor/clipboard';
import { isValidUrl } from '@utility/utils';
import Article from './article';
import { rapidApiScraper } from '@common/scraper';

// Interfaccia per props
interface ArticleParserModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmitUrl?: (url: string) => void;
	onSave?: (article: any) => void;
	article?: any;
	isLoading?: boolean;
	session?: Session | null;
	error?: any; // Aggiungiamo una prop per l'errore
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
	session,
	error
}) => {
	// Stato per l'URL
	const [url, setUrl] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [showSuccess, setShowSuccess] = useState(false);
	const [usingFallback, setUsingFallback] = useState(false);
	const [fallbackArticle, setFallbackArticle] = useState<any>(null);
	const [fallbackLoading, setFallbackLoading] = useState(false);

	// Gestione dell'errore di parsing
	useEffect(() => {
		// Debug dell'errore che riceviamo
		if (error) {
			console.log('ArticleParserModal ricevuto errore:', error);

			// Controlliamo se l'errore è in formato stringa JSON
			if (typeof error === 'string') {
				try {
					const parsedError = JSON.parse(error);
					if (parsedError.error === true && parsedError.failed === true) {
						console.log('Errore in formato JSON string, attivo fallback');
						handleFallbackParsing();
						return;
					}
				} catch (e) {
					// Non è JSON, continua con le altre verifiche
				}
			}

			// Se l'errore è un oggetto
			if (typeof error === 'object' && error !== null) {
				console.log('Proprietà error:', Object.keys(error));

				// Caso 1: error ha il messaggio che include 403
				if (error.message && typeof error.message === 'string' && error.message.includes('403')) {
					console.log('Errore 403 rilevato nel messaggio');
					handleFallbackParsing();
					return;
				}

				// Caso 2: error ha le proprietà error=true e failed=true
				if ('error' in error && 'failed' in error && error.error === true && error.failed === true) {
					console.log('Errore con error=true e failed=true rilevato');
					handleFallbackParsing();
					return;
				}

				// Caso 3: error è un oggetto con data che contiene l'errore
				if (error.data && typeof error.data === 'object') {
					const data = error.data;
					if (data.error === true && data.failed === true) {
						console.log('Errore nel campo data');
						handleFallbackParsing();
						return;
					}
				}

				// Caso 4: error è la risposta stessa con error=true
				if (error.error === true && error.message && error.message.includes('403')) {
					console.log('Errore nella risposta principale');
					handleFallbackParsing();
					return;
				}
			}

			console.log('Nessun formato di errore riconosciuto per attivare il fallback');
		} else if (!article && !isLoading && url && isValidUrl(url) && !usingFallback && !fallbackLoading && !fallbackArticle) {
			// Se il caricamento è terminato, abbiamo un URL valido, ma nessun articolo e nessun errore esplicito
			// Aggiungiamo una verifica per URL valido e aggiungiamo un ritardo per dare tempo al primo parser
			console.log('Nessun articolo ricevuto dopo il parsing, verifico...');

			// Aggiungiamo un ritardo per assicurarci che il primo parser abbia avuto abbastanza tempo
			const delay = setTimeout(() => {
				if (!article && !isLoading && !usingFallback && !fallbackLoading && !fallbackArticle) {
					console.log('Dopo il ritardo, ancora nessun articolo. Attivo fallback.');
					handleFallbackParsing();
				}
			}, 3000); // Aumentiamo il tempo di attesa a 3 secondi prima di attivare il fallback

			return () => clearTimeout(delay); // Pulizia del timeout
		}
	}, [error, article, isLoading, url, usingFallback, fallbackLoading, fallbackArticle]);

	// Funzione per eseguire il parsing fallback con RapidAPI
	const handleFallbackParsing = async () => {
		// Se non abbiamo un URL, proviamo a prenderlo dalla clipboard
		if (!url) {
			try {
				const result = await Clipboard.read();
				if (result && result.value && result.value.trim()) {
					const clipText = result.value.trim();
					setUrl(clipText);
					if (!isValidUrl(clipText)) {
						setErrorMessage('L\'URL dalla clipboard non è valido');
						return;
					}
				} else {
					setErrorMessage('Per favore, inserisci un URL da analizzare');
					return;
				}
			} catch (err) {
				console.error('Errore lettura clipboard:', err);
				setErrorMessage('Per favore, inserisci un URL da analizzare');
				return;
			}
		}

		if (fallbackLoading) return;

		setFallbackLoading(true);
		setUsingFallback(true);
		setErrorMessage('');

		try {
			console.log('Eseguo parsing con RapidAPI per URL:', url);
			const cleanedUrl = cleanUrl(url);

			// Verifica finale validità URL
			if (!isValidUrl(cleanedUrl)) {
				setErrorMessage('URL non valido per l\'analisi alternativa');
				setFallbackLoading(false);
				return;
			}

			// Esecuzione parsing con RapidAPI
			const result = await rapidApiScraper(cleanedUrl);

			if (result) {
				console.log('Parsing RapidAPI riuscito:', result);

				// Converti 'description' in 'excerpt' per compatibilità con il database
				if (result.description && !result.excerpt) {
					result.excerpt = result.description;
					delete result.description;
				}

				// Converti 'html' in 'content' per compatibilità con il database
				if (result.html && !result.content) {
					result.content = result.html;
					delete result.html;
				}

				setFallbackArticle(result);
			} else {
				console.error('Nessun risultato da RapidAPI');
				setErrorMessage('Non è stato possibile analizzare questo articolo.');
			}
		} catch (error) {
			console.error('Errore nel parsing RapidAPI:', error);
			setErrorMessage('Tutti i tentativi di analisi hanno fallito. Prova con un altro URL.');
		} finally {
			setFallbackLoading(false);
		}
	};

	// Funzione per resettare tutti gli stati
	const resetStates = () => {
		setUrl('');
		setErrorMessage('');
		setShowSuccess(false);
		setUsingFallback(false);
		setFallbackArticle(null);
		setFallbackLoading(false);
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

			// Prima verifica se sembra un possibile URL (contiene un dominio valido)
			const hasDomainPattern = /^(https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+/i;
			if (!hasDomainPattern.test(cleaned)) {
				return cleaned; // Non modificare testo che non assomiglia a un URL
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

					// Prima verifica se sembra un possibile URL
					const hasDomainPattern = /^(https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+/i;
					if (!hasDomainPattern.test(clipText)) {
						setErrorMessage('Il testo incollato non sembra essere un URL. Incolla un indirizzo web valido.');
						return;
					}

					// Verifica validità URL
					const cleanedUrl = cleanUrl(clipText);
					if (!isValidUrl(cleanedUrl)) {
						setErrorMessage('L\'URL incollato non sembra valido. Verificalo e correggilo se necessario.');
						// Non avviare l'analisi se l'URL non è valido
						return;
					} else {
						// Se l'URL è valido, avvia automaticamente l'analisi
						console.log('URL valido trovato nella clipboard, avvio analisi automatica');
						if (onSubmitUrl) {
							onSubmitUrl(cleanedUrl);
						}
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
		// Reset degli stati di fallback quando l'URL cambia
		setUsingFallback(false);
		setFallbackArticle(null);
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
		setUsingFallback(false);
		setFallbackArticle(null);
		if (onSubmitUrl) {
			onSubmitUrl(cleanedUrl);
		}
	};

	// Funzione per salvare l'articolo
	const handleSaveArticle = () => {
		// Determina quale articolo usare (fallback o principale)
		const articleToSave = fallbackArticle || article;

		console.log('Salvataggio articolo:', articleToSave);

		if (onSave && articleToSave) {
			try {
				// Verifichiamo che l'articolo abbia tutti i campi essenziali
				if (!articleToSave.title) {
					console.error('Articolo mancante del titolo');
					return;
				}

				if (!articleToSave.url) {
					console.error('Articolo mancante dell\'URL');
					return;
				}

				// Verifichiamo che il campo domain sia disponibile
				if (!articleToSave.domain && articleToSave.url) {
					try {
						const urlObj = new URL(articleToSave.url);
						articleToSave.domain = urlObj.hostname;
					} catch (e) {
						console.error('Errore nella gestione del dominio:', e);
					}
				}

				// Assicuriamoci che date_published esista
				if (!articleToSave.date_published) {
					articleToSave.date_published = new Date().toISOString();
				}

				// Rimuovi i campi che non esistono nella tabella
				if ('date' in articleToSave) {
					delete articleToSave.date;
				}

				if ('keywords' in articleToSave) {
					delete articleToSave.keywords;
				}

				if ('length' in articleToSave) {
					delete articleToSave.length;
				}

				// Converti 'description' in 'excerpt' per compatibilità con il database
				if (articleToSave.description && !articleToSave.excerpt) {
					articleToSave.excerpt = articleToSave.description;
					delete articleToSave.description;
				}

				// Converti 'html' in 'content' per compatibilità con il database
				if (articleToSave.html && !articleToSave.content) {
					articleToSave.content = articleToSave.html;
					delete articleToSave.html;
				}

				// Log dettagliato prima del salvataggio
				console.log('Articolo pronto per il salvataggio:', {
					id: articleToSave.id,
					title: articleToSave.title,
					url: articleToSave.url,
					domain: articleToSave.domain,
					date_published: articleToSave.date_published,
					excerpt: articleToSave.excerpt,
					hasContent: !!articleToSave.content
				});

				try {
					// Passiamo l'articolo al chiamante
					onSave(articleToSave);
					console.log("Chiamata a onSave completata");
					setShowSuccess(true);

					// Chiudi la modale dopo un breve periodo
					setTimeout(() => {
						handleClose();
					}, 1500);
				} catch (saveError) {
					console.error('Errore durante il salvataggio dell\'articolo:', saveError);
				}
			} catch (error) {
				console.error('Errore durante la preparazione dell\'articolo per il salvataggio:', error);
			}
		} else {
			console.error('Impossibile salvare: nessun articolo disponibile o funzione onSave non fornita', {
				hasOnSave: !!onSave,
				hasArticle: !!articleToSave
			});
		}
	};

	// Determina il contenuto da mostrare in base allo stato
	const renderContent = () => {
		// Mostra lo spinner di caricamento sia per il parsing principale che per il fallback
		if (isLoading || fallbackLoading) {
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
					<p>
						{usingFallback
							? 'Tentativo di analisi alternativa in corso...'
							: 'Caricamento anteprima articolo...'}
					</p>
					<style>{`
						@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
					`}</style>
				</div>
			);
		}

		// Mostra l'articolo (sia principale che fallback)
		const articleToShow = fallbackArticle || article;
		if (articleToShow) {
			return (
				<div style={{ padding: '20px' }}>
					{usingFallback && (
						<div style={{
							backgroundColor: 'rgba(255, 193, 7, 0.1)',
							color: '#ff9800',
							padding: '8px 12px',
							borderRadius: '4px',
							marginBottom: '16px',
							fontSize: '14px'
						}}>
							Analisi eseguita con metodo alternativo
						</div>
					)}

					{/* Render anteprima articolo */}
					<div className="article-preview">
						<Article
							articleParsed={articleToShow}
							onDismiss={handleClose}
							displayFrom="modalPreview"
							postId={articleToShow.id || ""}
							session={session || null}
						/>
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
				<div style={{ flex: 1, overflow: 'auto' }}>
					{renderContent()}
				</div>

				{/* Footer con pulsanti - mostrato solo quando c'è un articolo da salvare */}
				{(article || fallbackArticle) && (
					<div style={{
						borderTop: '1px solid #eee',
						padding: '16px',
						display: 'flex',
						gap: '12px',
						justifyContent: 'space-between'
					}}>
						<button
							onClick={handleClose}
							style={{
								flex: 1,
								backgroundColor: 'transparent',
								color: '#6c757d',
								border: '1px solid #dee2e6',
								borderRadius: '4px',
								padding: '12px 16px',
								fontSize: '16px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px'
							}}
						>
							✕ Annulla
						</button>
						<button
							onClick={handleSaveArticle}
							style={{
								flex: 1,
								backgroundColor: '#3880ff',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								padding: '12px 16px',
								fontSize: '16px',
								fontWeight: 'bold',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px'
							}}
						>
							💾 Salva Articolo
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ArticleParserModal; 