import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	IonButton,
	IonIcon,
	IonModal,
	IonRange,
} from "@ionic/react";
import { textOutline, chevronDown } from "ionicons/icons";
import { RootState } from "@store/reducers";
import {
	increaseFontSize,
	decreaseFontSize,
	setTheme,
	setBrightness,
	setFontFamily,
	setSpacing,
	setWidth
} from "@store/actions";
import { ScreenBrightness } from '@capacitor-community/screen-brightness';

export const FontSizeControls = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
	const fontDropdownRef = useRef<HTMLDivElement>(null);
	const dispatch = useDispatch();

	// Otteniamo tutti i valori dallo store Redux
	const {
		fontSize,
		theme,
		brightness,
		fontFamily,
		spacing,
		width
	} = useSelector((state: RootState) => state.app);

	// Lista dei font disponibili da tailwind.config.js
	const availableFonts = [
		{ name: "Gentium Book Basic", value: "gentium_book" },
		{ name: "Lato", value: "lato" },
		{ name: "Montserrat", value: "montserrat" },
		{ name: "Open Sans", value: "open_sans" },
		{ name: "Roboto Slab", value: "roboto" },
		{ name: "New York", value: "new_york" },
		{ name: "San Francisco", value: "san_francisco" }
	];

	const decreaseFontSize = () => {
		dispatch(decreaseFontSize());
	};

	const increaseFontSize = () => {
		dispatch(increaseFontSize());
	};

	const handleThemeSelect = (newTheme: string) => {
		dispatch(setTheme(newTheme));
	};

	const handleBrightnessChange = async (value: number) => {
		// Salva il valore nello store (0-100)
		dispatch(setBrightness(value));

		// Converti il valore da 0-100 a 0-1 per il plugin di Capacitor
		const normalizedBrightness = value / 100;

		// Imposta la luminosità dello schermo utilizzando il plugin Capacitor
		try {
			console.log('Tentativo di impostare la luminosità a:', normalizedBrightness);
			await ScreenBrightness.setBrightness({ brightness: normalizedBrightness });
			console.log('Luminosità impostata con successo');
		} catch (error) {
			console.error('Errore durante l\'impostazione della luminosità:', error);
			// Mostra un feedback all'utente
			alert('Impossibile modificare la luminosità: ' + JSON.stringify(error));
		}
	};

	const handleFontFamilyChange = (newFontFamily: string, displayName: string) => {
		dispatch(setFontFamily(displayName));
		setFontDropdownOpen(false);
	};

	const handleSpacingDecrease = () => {
		dispatch(setSpacing(Math.max(0.5, spacing - 0.1)));
	};

	const handleSpacingIncrease = () => {
		dispatch(setSpacing(Math.min(2, spacing + 0.1)));
	};

	const handleWidthDecrease = () => {
		dispatch(setWidth(Math.max(0.5, width - 0.1)));
	};

	const handleWidthIncrease = () => {
		dispatch(setWidth(Math.min(2, width + 0.1)));
	};

	const toggleFontDropdown = () => {
		setFontDropdownOpen(!fontDropdownOpen);
	};

	// Chiudi dropdown quando si clicca fuori
	const handleClickOutside = (e: MouseEvent) => {
		if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
			setFontDropdownOpen(false);
		}
	};

	// Aggiungi event listener quando il dropdown è aperto
	useEffect(() => {
		if (fontDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [fontDropdownOpen]);

	// Modifica l'effetto per controllare la luminosità corrente e verificare se il plugin funziona
	useEffect(() => {
		const checkBrightnessCapabilities = async () => {
			try {
				console.log('Verifica delle capacità di luminosità...');
				const { brightness: currentBrightness } = await ScreenBrightness.getBrightness();
				console.log('Luminosità attuale del dispositivo:', currentBrightness);

				// Test di modifica della luminosità
				const testValue = 0.5; // 50%
				console.log('Test: impostazione luminosità a', testValue);
				await ScreenBrightness.setBrightness({ brightness: testValue });
				console.log('Test completato con successo');

				// Ripristino alla luminosità originale dopo 1 secondo
				setTimeout(async () => {
					// Su Android, -1 non è un valore valido per setBrightness, usiamo un valore di default
					const restoreValue = currentBrightness === -1 ? 0.5 : currentBrightness;
					await ScreenBrightness.setBrightness({ brightness: restoreValue });
					console.log('Luminosità ripristinata a', restoreValue);
				}, 1000);
			} catch (error) {
				console.error('Errore durante il test della luminosità:', error);
				alert('Problema con il controllo della luminosità: ' + JSON.stringify(error));
			}
		};

		// Esegui il test solo quando il modale viene aperto per la prima volta
		if (isOpen) {
			checkBrightnessCapabilities();
		}
	}, [isOpen]); // Esegui solo quando isOpen cambia

	return (
		<>
			<IonModal
				isOpen={isOpen}
				onDidDismiss={() => setIsOpen(false)}
				initialBreakpoint={0.75}
				breakpoints={[0, 0.75, 1]}
				backdropBreakpoint={0}
				className="reading-options-modal"
			>
				<div className="px-5 pt-3 pb-6">
					<h2 className="text-xl font-semibold mb-5">Impostazioni lettura</h2>

					{/* Sezione Tema */}
					<div className="mb-5">
						<div className="flex justify-between items-center mb-2">
							<h3 className="text-lg text-gray-600">Tema</h3>
							<div className="text-right px-3 py-1 border border-gray-300 rounded-full">
								Match Sistema
							</div>
						</div>

						<div className="flex justify-between gap-2">
							<button
								className={`flex-1 py-2 rounded-lg border ${theme === 'white' ? 'border-blue-500' : 'border-gray-300'}`}
								onClick={() => handleThemeSelect('white')}
							>
								<span className="block text-center">Bianco</span>
							</button>
							<button
								className={`flex-1 py-2 rounded-lg bg-orange-50 border ${theme === 'sepia' ? 'border-blue-500' : 'border-orange-100'}`}
								onClick={() => handleThemeSelect('sepia')}
							>
								<span className="block text-center">Seppia</span>
							</button>
							<button
								className={`flex-1 py-2 rounded-lg bg-gray-100 border ${theme === 'dawn' ? 'border-blue-500' : 'border-gray-200'}`}
								onClick={() => handleThemeSelect('dawn')}
							>
								<span className="block text-center">Alba</span>
							</button>
							<button
								className={`flex-1 py-2 rounded-lg bg-gray-200 border ${theme === 'paper' ? 'border-blue-500' : 'border-gray-300'}`}
								onClick={() => handleThemeSelect('paper')}
							>
								<span className="block text-center">Carta</span>
							</button>
						</div>
					</div>

					{/* Sezione Luminosità */}
					<div className="mb-5">
						<h3 className="text-lg text-gray-600 mb-1">Luminosità Dispositivo</h3>
						<IonRange
							value={brightness}
							onIonChange={e => handleBrightnessChange(e.detail.value as number)}
							min={0}
							max={100}
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>Bassa</span>
							<span>Alta</span>
						</div>
					</div>

					{/* Sezione Font con Dropdown */}
					<div className="mb-5">
						<h3 className="text-lg text-gray-600 mb-1">Font</h3>
						<div className="relative" ref={fontDropdownRef}>
							<div
								className="border border-gray-300 rounded-lg p-2 relative cursor-pointer"
								onClick={toggleFontDropdown}
							>
								<span className="block text-center">{fontFamily}</span>
								<IonIcon
									icon={chevronDown}
									className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 transition-transform ${fontDropdownOpen ? 'rotate-180' : ''}`}
								/>
							</div>

							{fontDropdownOpen && (
								<div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
									{availableFonts.map((font) => (
										<div
											key={font.value}
											className={`p-2 cursor-pointer hover:bg-gray-100 ${fontFamily === font.name ? 'bg-blue-50 text-blue-600' : ''}`}
											onClick={() => handleFontFamilyChange(font.value, font.name)}
										>
											<span className={`font-${font.value}`}>{font.name}</span>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Sezione Dimensione Font */}
					<div className="mb-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg text-gray-600">Dimensione Font</h3>
							<div className="flex gap-2">
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={decreaseFontSize}
								>
									<span className="text-2xl">A</span>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500" />
								</button>
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={increaseFontSize}
								>
									<span className="text-2xl">A</span>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500 transform rotate-180" />
								</button>
							</div>
						</div>
					</div>

					{/* Sezione Spaziatura */}
					<div className="mb-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg text-gray-600">Spaziatura</h3>
							<div className="flex gap-2">
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={handleSpacingDecrease}
								>
									<div className="flex flex-col items-center">
										<div className="w-6 h-1 bg-gray-700 mb-1"></div>
										<div className="w-6 h-1 bg-gray-700"></div>
									</div>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500" />
								</button>
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={handleSpacingIncrease}
								>
									<div className="flex flex-col items-center">
										<div className="w-6 h-1 bg-gray-700 mb-2"></div>
										<div className="w-6 h-1 bg-gray-700"></div>
									</div>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500 transform rotate-180" />
								</button>
							</div>
						</div>
					</div>

					{/* Sezione Larghezza */}
					<div className="mb-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg text-gray-600">Larghezza</h3>
							<div className="flex gap-2">
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={handleWidthDecrease}
								>
									<div className="w-4 h-1 bg-gray-700"></div>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500" />
								</button>
								<button
									className="border border-gray-300 rounded-lg p-2 flex items-center justify-center w-14"
									onClick={handleWidthIncrease}
								>
									<div className="w-8 h-1 bg-gray-700"></div>
									<IonIcon icon={chevronDown} className="ml-1 text-gray-500 transform rotate-180" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</IonModal>

			<IonButton fill="clear" onClick={() => setIsOpen(true)}>
				<IonIcon icon={textOutline} className="w-6 h-6 text-gray-700" />
			</IonButton>
		</>
	);
};

export default FontSizeControls;
