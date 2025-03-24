import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	IonModal,
	IonContent,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButtons,
	IonButton,
	IonIcon,
	IonRange,
	IonItem,
	IonLabel,
	IonSegment,
	IonSegmentButton
} from '@ionic/react';
import { close, sunny, contrast, text, remove, add } from 'ionicons/icons';
import { RootState } from '@store/reducers';
import {
	setBrightness,
	setFontFamily,
	increaseFontSize,
	decreaseFontSize,
	setSpacing,
	setTheme,
	setWidth
} from '@store/actions';

interface ReadingSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const ReadingSettingsModal: React.FC<ReadingSettingsModalProps> = ({ isOpen, onClose }) => {
	const dispatch = useDispatch();
	const {
		brightness,
		theme,
		fontFamily,
		fontSize,
		spacing,
		width
	} = useSelector((state: RootState) => state.app);

	// Stati locali
	const [localBrightness, setLocalBrightness] = useState(brightness);
	const [localTheme, setLocalTheme] = useState(theme);
	const [localFontFamily, setLocalFontFamily] = useState(fontFamily);
	const [localFontSize, setLocalFontSize] = useState(fontSize || 'base');
	const [localSpacing, setLocalSpacing] = useState(spacing);
	const [localWidth, setLocalWidth] = useState(width);

	// Debug per verificare se il componente riceve gli aggiornamenti dallo store
	useEffect(() => {
		console.log('ReadingSettingsModal - Props aggiornate:', {
			brightness, theme, fontFamily, fontSize, spacing, width
		});
	}, [brightness, theme, fontFamily, fontSize, spacing, width]);

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

	// Aggiorna gli stati locali quando cambiano le props
	useEffect(() => {
		console.log('ReadingSettingsModal - Aggiornamento degli stati locali');
		setLocalBrightness(brightness);
		setLocalTheme(theme);
		setLocalFontFamily(fontFamily);
		if (fontSize) setLocalFontSize(fontSize);
		setLocalSpacing(spacing);
		setLocalWidth(width);
	}, [brightness, theme, fontFamily, fontSize, spacing, width, isOpen]);

	// Funzioni per gestire i cambiamenti
	const handleBrightnessChange = (value: number) => {
		console.log('handleBrightnessChange chiamato con:', value);
		setLocalBrightness(value);
		dispatch(setBrightness(value));
	};

	const handleThemeChange = (value: string) => {
		console.log('handleThemeChange chiamato con:', value);
		setLocalTheme(value);
		dispatch(setTheme(value));
	};

	const handleFontFamilyChange = (value: string) => {
		console.log('handleFontFamilyChange chiamato con:', value);
		setLocalFontFamily(value);
		dispatch(setFontFamily(value));
	};

	const handleFontSizeIncrease = () => {
		console.log('handleFontSizeIncrease chiamato');
		const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
		const currentIndex = sizes.indexOf(localFontSize);
		if (currentIndex < sizes.length - 1) {
			const newSize = sizes[currentIndex + 1];
			setLocalFontSize(newSize as string);
			dispatch(increaseFontSize());
		}
	};

	const handleFontSizeDecrease = () => {
		console.log('handleFontSizeDecrease chiamato');
		const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
		const currentIndex = sizes.indexOf(localFontSize);
		if (currentIndex > 0) {
			const newSize = sizes[currentIndex - 1];
			setLocalFontSize(newSize as string);
			dispatch(decreaseFontSize());
		}
	};

	const handleSpacingChange = (value: number) => {
		console.log('handleSpacingChange chiamato con:', value);
		setLocalSpacing(value);
		dispatch(setSpacing(value));
	};

	const handleWidthChange = (value: number) => {
		console.log('handleWidthChange chiamato con:', value);
		setLocalWidth(value);
		dispatch(setWidth(value));
	};

	// Componenti di bottone con gestione esplicita degli eventi
	const ThemeButton = ({ value, label, color, isActive }: { value: string, label: string, color: string, isActive: boolean }) => {
		const onClickHandler = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('ThemeButton clicked:', value);
			handleThemeChange(value);
		};

		return (
			<div
				className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
				onClick={onClickHandler}
				style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
			>
				<div
					className="w-full h-12 rounded mb-2 shadow-sm"
					style={{ backgroundColor: color }}
				/>
				<span className="text-xs font-medium">{label}</span>
			</div>
		);
	};

	const SizeButton = ({ action, icon }: { action: () => void, icon: string }) => {
		const onClickHandler = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('SizeButton clicked');
			action();
		};

		return (
			<div
				className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center"
				onClick={onClickHandler}
				style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
			>
				<IonIcon icon={icon} className="text-gray-600" />
			</div>
		);
	};

	// Funzione per chiudere la modale con prevenzione di eventi
	const handleCloseModal = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('Close modal clicked');
		onClose();
	};

	// Aggiungi questo all'inizio della modale
	const handleStopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
		e.stopPropagation();
	};

	return (
		<IonModal
			isOpen={isOpen}
			onDidDismiss={onClose}
			initialBreakpoint={1}
			breakpoints={[0, 0.5, 0.75, 1]}
			className="reading-settings-modal"
			mode="ios"
			backdropDismiss={true}
			animated={true}
			style={{
				'--width': '100% !important',
				'--height': '100% !important',
				'--max-width': '100% !important',
				'--max-height': '100% !important',
				'--border-radius': '0',
				'--box-shadow': 'none',
				'position': 'fixed',
				'top': '0',
				'left': '0',
				'right': '0',
				'bottom': '0',
				'z-index': '99999',
			}}
			id="reading-settings-modal"
			onClick={handleStopPropagation}
			onTouchStart={handleStopPropagation}
			onTouchMove={handleStopPropagation}
		>
			<IonHeader className="ion-no-border">
				<IonToolbar className="px-4">
					<IonTitle className="text-lg font-medium">Impostazioni Lettura</IonTitle>
					<IonButtons slot="end">
						<div
							className="w-8 h-8 flex items-center justify-center"
							onClick={handleCloseModal}
							style={{ cursor: 'pointer' }}
						>
							<IonIcon icon={close} />
						</div>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent
				className="ion-padding"
				scrollEvents={true}
				onClick={handleStopPropagation}
				onTouchStart={handleStopPropagation}
				onTouchMove={handleStopPropagation}
				forceOverscroll={false}
			>
				<div className="space-y-6">
					{/* Sezione Tema */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
						<h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
							<span className="bg-gradient-to-r from-blue-400 to-indigo-500 w-8 h-8 rounded-full flex items-center justify-center mr-2 shadow-sm">
								<IonIcon icon={sunny} className="text-white text-sm" />
							</span>
							Tema
						</h3>

						<div className="grid grid-cols-3 gap-2 mb-4">
							<ThemeButton
								value="white"
								label="Bianco"
								color="#ffffff"
								isActive={localTheme === 'white'}
							/>
							<ThemeButton
								value="sepia"
								label="Seppia"
								color="#f8f1e3"
								isActive={localTheme === 'sepia'}
							/>
							<ThemeButton
								value="paper"
								label="Carta"
								color="#e8e8e8"
								isActive={localTheme === 'paper'}
							/>
							<ThemeButton
								value="dawn"
								label="Alba"
								color="#f2f2f2"
								isActive={localTheme === 'dawn'}
							/>
							<ThemeButton
								value="dark"
								label="Scuro"
								color="#121212"
								isActive={localTheme === 'dark'}
							/>
							<ThemeButton
								value="amoled"
								label="Amoled"
								color="#000000"
								isActive={localTheme === 'amoled'}
							/>
						</div>
					</div>

					{/* Sezione Luminosità */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
						<h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
							<span className="bg-gradient-to-r from-yellow-400 to-orange-500 w-8 h-8 rounded-full flex items-center justify-center mr-2 shadow-sm">
								<IonIcon icon={contrast} className="text-white text-sm" />
							</span>
							Luminosità
						</h3>

						<div className="px-2">
							<IonRange
								min={20}
								max={100}
								step={5}
								value={localBrightness}
								onIonChange={(e) => handleBrightnessChange(e.detail.value as number)}
								className="custom-range"
							>
								<IonIcon slot="start" icon={sunny} size="small" className="text-gray-400" />
								<IonIcon slot="end" icon={sunny} size="large" className="text-yellow-500" />
							</IonRange>
						</div>
					</div>

					{/* Sezione Font */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
						<h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
							<span className="bg-gradient-to-r from-green-400 to-teal-500 w-8 h-8 rounded-full flex items-center justify-center mr-2 shadow-sm">
								<IonIcon icon={text} className="text-white text-sm" />
							</span>
							Carattere
						</h3>

						<div className="space-y-4">
							{/* Font Family Selector */}
							<div className="space-y-2">
								<div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Tipo di carattere</div>
								<div className="grid grid-cols-2 gap-2">
									{availableFonts.map((font) => (
										<div
											key={font.id}
											className={`text-left px-3 py-2 rounded-lg border transition ${localFontFamily === font.id
												? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
												: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
												}`}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleFontFamilyChange(font.id);
											}}
											style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
										>
											<div className={`text-sm font-medium`} style={{ fontFamily: font.id }}>
												{font.label}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">{font.description}</div>
										</div>
									))}
								</div>
							</div>

							{/* Font Size Controls */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Dimensione testo</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{localFontSize}</div>
								</div>
								<div className="flex items-center justify-between">
									<SizeButton action={handleFontSizeDecrease} icon={remove} />

									<div className="flex-1 px-4">
										<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
											<div
												className="absolute h-full bg-blue-500 rounded-full"
												style={{ width: `${(sizes.indexOf(localFontSize) * 100) / (sizes.length - 1)}%` }}
											></div>
										</div>
									</div>

									<SizeButton action={handleFontSizeIncrease} icon={add} />
								</div>
							</div>
						</div>
					</div>

					{/* Sezione Spacing */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
						<h3 className="text-base font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center">
							<span className="bg-gradient-to-r from-purple-400 to-pink-500 w-8 h-8 rounded-full flex items-center justify-center mr-2 shadow-sm">
								<IonIcon icon={text} className="text-white text-sm" />
							</span>
							Layout
						</h3>

						<div className="space-y-4">
							{/* Line Spacing */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Interlinea</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{Math.round(localSpacing * 10) / 10}</div>
								</div>
								<IonRange
									min={0.5}
									max={2}
									step={0.1}
									value={localSpacing}
									onIonChange={(e) => handleSpacingChange(e.detail.value as number)}
								>
									<div slot="start" className="text-sm">1x</div>
									<div slot="end" className="text-sm">2x</div>
								</IonRange>
							</div>

							{/* Width */}
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Larghezza</div>
									<div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{Math.round(localWidth * 10) / 10}</div>
								</div>
								<IonRange
									min={0.5}
									max={1}
									step={0.1}
									value={localWidth}
									onIonChange={(e) => handleWidthChange(e.detail.value as number)}
								>
									<div slot="start" className="text-sm">Stretto</div>
									<div slot="end" className="text-sm">Ampio</div>
								</IonRange>
							</div>
						</div>
					</div>

					{/* Pulsante Applica */}
					<div className="mt-4 mb-8">
						<div
							className="w-full py-3 rounded-lg text-white font-medium text-center"
							onClick={handleCloseModal}
							style={{
								background: 'linear-gradient(135deg, #4F7AFF 0%, #6DB2FF 100%)',
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent'
							}}
						>
							Applica impostazioni
						</div>
					</div>
				</div>
			</IonContent>
		</IonModal>
	);
};

// Variabili per la dimensione del font
const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];

export default ReadingSettingsModal; 