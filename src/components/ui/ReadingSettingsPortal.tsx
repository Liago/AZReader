import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
	IonIcon,
	IonRange,
} from '@ionic/react';
import { close, sunny, contrast, text, remove, add } from 'ionicons/icons';
import { RootState } from '@store/store-rtk';
import {
	setBrightness,
	setFontFamily,
	increaseFontSize,
	decreaseFontSize,
	setSpacing,
	setTheme,
	setWidth
} from '@store/slices/appSlice';

// Variabili per la dimensione del font
const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];

interface ReadingSettingsPortalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ReadingSettingsPortal: React.FC<ReadingSettingsPortalProps> = ({ isOpen, onClose }) => {
	const dispatch = useDispatch();
	const {
		brightness,
		theme,
		fontFamily,
		fontSize,
		spacing,
		width
	} = useSelector((state: RootState) => state.app);

	// Riferimento all'elemento del portale
	const portalRef = useRef<HTMLDivElement | null>(null);

	// Creazione e pulizia dell'elemento portale
	useEffect(() => {
		// Non fare nulla se la modale non è aperta
		if (!isOpen) return;

		// Verifica se esiste già l'elemento portale
		let portalElement = document.getElementById('reading-settings-portal') as HTMLDivElement;

		// Se non esiste, crealo
		if (!portalElement) {
			console.log('Creazione nuovo elemento portale');
			portalElement = document.createElement('div');
			portalElement.id = 'reading-settings-portal';

			// Assicurati che sia sopra tutto e riceva eventi touch
			portalElement.style.position = 'fixed';
			portalElement.style.top = '0';
			portalElement.style.left = '0';
			portalElement.style.width = '100%';
			portalElement.style.height = '100%';
			portalElement.style.zIndex = '999999';
			portalElement.style.pointerEvents = 'none';

			// Aggiungi al body
			document.body.appendChild(portalElement);
		}

		portalRef.current = portalElement;

		// Blocca lo scroll del body quando la modale è aperta
		document.body.style.overflow = 'hidden';

		// Pulizia al dismount
		return () => {
			// Ripristina lo scroll quando la modale viene chiusa
			document.body.style.overflow = '';

			// Non rimuovere l'elemento dal DOM per evitare problemi di rendering
			// Verrà riutilizzato alla prossima apertura
		};
	}, [isOpen]);

	// Stati locali derivati dallo store
	const localBrightness = brightness;
	const localTheme = theme;
	const localFontFamily = fontFamily;
	const localFontSize = fontSize || 'base';
	const localSpacing = spacing;
	const localWidth = width;

	// Funzioni per gestire i cambiamenti
	const handleBrightnessChange = (value: number) => {
		console.log('Modifica luminosità:', value);
		dispatch(setBrightness(value));
	};

	const handleThemeChange = (value: string) => {
		console.log('Modifica tema:', value);
		dispatch(setTheme(value));
	};

	const handleFontFamilyChange = (value: string) => {
		console.log('Modifica font family:', value);
		dispatch(setFontFamily(value));
	};

	const handleFontSizeIncrease = () => {
		console.log('Aumento dimensione font');
		dispatch(increaseFontSize());
	};

	const handleFontSizeDecrease = () => {
		console.log('Diminuzione dimensione font');
		dispatch(decreaseFontSize());
	};

	const handleSpacingChange = (value: number) => {
		console.log('Modifica interlinea:', value);
		dispatch(setSpacing(value));
	};

	const handleWidthChange = (value: number) => {
		console.log('Modifica larghezza:', value);
		dispatch(setWidth(value));
	};

	// Font disponibili
	const availableFonts = [
		{ id: 'New York', label: 'New York', description: 'Elegante e raffinato' },
		{ id: 'San Francisco', label: 'San Francisco', description: 'Moderno e leggibile' },
		{ id: 'Gentium Book Basic', label: 'Gentium', description: 'Classico e accademico' },
		{ id: 'Lato', label: 'Lato', description: 'Pulito e professionale' },
		{ id: 'Montserrat', label: 'Montserrat', description: 'Contemporaneo' },
		{ id: 'Open Sans', label: 'Open Sans', description: 'Versatile e chiaro' },
		{ id: 'Roboto Slab', label: 'Roboto', description: 'Leggibile su schermi' }
	];

	// Se la modale non è aperta o non abbiamo un elemento portale, non mostrare nulla
	if (!isOpen || !portalRef.current) return null;

	const handleModalClick = (e: React.MouseEvent) => {
		// Impedisci la propagazione degli eventi al documento sottostante
		e.stopPropagation();
	};

	// Modal component nativo semplificato
	const Modal = (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 z-[999999]"
			onClick={onClose}
			style={{
				touchAction: 'auto',
				WebkitOverflowScrolling: 'touch',
				pointerEvents: 'auto'
			}}
		>
			<div
				className="bg-white w-full max-w-md mx-auto rounded-t-xl"
				onClick={handleModalClick}
				style={{
					maxHeight: '90vh',
					marginTop: '10vh',
					overflow: 'auto',
					WebkitOverflowScrolling: 'touch',
					padding: '20px',
					pointerEvents: 'auto'
				}}
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium">Impostazioni Lettura</h2>
					<button
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
						style={{ cursor: 'pointer' }}
					>
						<IonIcon icon={close} className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Tema section */}
				<div className="mb-6">
					<h3 className="text-base font-medium mb-2">Tema</h3>

					<div className="grid grid-cols-3 gap-2 mb-4">
						{[
							{ value: 'white', label: 'Bianco', color: '#ffffff' },
							{ value: 'sepia', label: 'Seppia', color: '#f8f1e3' },
							{ value: 'paper', label: 'Carta', color: '#e8e8e8' },
							{ value: 'dawn', label: 'Alba', color: '#f2f2f2' },
							{ value: 'dark', label: 'Scuro', color: '#121212' },
							{ value: 'amoled', label: 'Amoled', color: '#000000' }
						].map(t => (
							<button
								key={t.value}
								className="flex flex-col items-center p-2 border rounded-lg"
								style={{
									borderColor: localTheme === t.value ? '#3182ce' : '#e2e8f0',
									cursor: 'pointer'
								}}
								onClick={() => handleThemeChange(t.value)}
							>
								<div
									className="w-full h-10 rounded mb-2"
									style={{ backgroundColor: t.color }}
								/>
								<span className="text-xs">{t.label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Font Size Controls */}
				<div className="mb-6">
					<h3 className="text-base font-medium mb-2">Dimensione Testo</h3>
					<div className="flex items-center">
						<button
							className="w-10 h-10 border rounded-full flex items-center justify-center"
							onClick={handleFontSizeDecrease}
							style={{ cursor: 'pointer' }}
						>
							<IonIcon icon={remove} />
						</button>
						<div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full">
							<div
								className="h-full bg-blue-500 rounded-full"
								style={{ width: `${(sizes.indexOf(localFontSize) * 100) / (sizes.length - 1)}%` }}
							/>
						</div>
						<button
							className="w-10 h-10 border rounded-full flex items-center justify-center"
							onClick={handleFontSizeIncrease}
							style={{ cursor: 'pointer' }}
						>
							<IonIcon icon={add} />
						</button>
					</div>
				</div>

				{/* Spacing Controls */}
				<div className="mb-6">
					<h3 className="text-base font-medium mb-2">Interlinea</h3>
					<IonRange
						min={0.5}
						max={2}
						step={0.1}
						value={localSpacing}
						onIonChange={(e) => handleSpacingChange(e.detail.value as number)}
					/>
				</div>

				{/* Apply button */}
				<button
					className="w-full py-3 rounded-lg text-white font-medium text-center"
					onClick={onClose}
					style={{
						background: 'linear-gradient(135deg, #4F7AFF 0%, #6DB2FF 100%)',
						cursor: 'pointer'
					}}
				>
					Applica impostazioni
				</button>
			</div>
		</div>
	);

	// Usa createPortal per renderizzare la modale nel portale
	return ReactDOM.createPortal(Modal, portalRef.current);
};

export default ReadingSettingsPortal; 