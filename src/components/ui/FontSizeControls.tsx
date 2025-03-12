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

	const handleBrightnessChange = (value: number) => {
		dispatch(setBrightness(value));
		// La luminosità verrà applicata tramite CSS nel ReadingThemeWrapper
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
				<div className="px-5 pt-4 pb-8">
					<h2 className="text-xl font-semibold mb-8">Impostazioni lettura</h2>

					{/* Sezione Tema */}
					<div className="mb-8">
						<div className="flex justify-between items-center mb-3">
							<h3 className="text-lg text-gray-600">Tema</h3>
							<div className="text-right px-3 py-1 border border-gray-300 rounded-full">
								Match Sistema
							</div>
						</div>

						<div className="flex justify-between gap-3">
							<button
								className={`flex-1 py-3 rounded-lg border ${theme === 'white' ? 'border-blue-500' : 'border-gray-300'}`}
								onClick={() => handleThemeSelect('white')}
							>
								<span className="block text-center">Bianco</span>
							</button>
							<button
								className={`flex-1 py-3 rounded-lg bg-orange-50 border ${theme === 'sepia' ? 'border-blue-500' : 'border-orange-100'}`}
								onClick={() => handleThemeSelect('sepia')}
							>
								<span className="block text-center">Seppia</span>
							</button>
							<button
								className={`flex-1 py-3 rounded-lg bg-gray-100 border ${theme === 'dawn' ? 'border-blue-500' : 'border-gray-200'}`}
								onClick={() => handleThemeSelect('dawn')}
							>
								<span className="block text-center">Alba</span>
							</button>
							<button
								className={`flex-1 py-3 rounded-lg bg-gray-200 border ${theme === 'paper' ? 'border-blue-500' : 'border-gray-300'}`}
								onClick={() => handleThemeSelect('paper')}
							>
								<span className="block text-center">Carta</span>
							</button>
						</div>
					</div>

					{/* Sezione Luminosità */}
					<div className="mb-8">
						<h3 className="text-lg text-gray-600 mb-2">Luminosità</h3>
						<IonRange
							value={brightness}
							onIonChange={e => handleBrightnessChange(e.detail.value as number)}
							min={0}
							max={100}
							className="custom-range"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>Bassa</span>
							<span>Alta</span>
						</div>
					</div>

					{/* Sezione Font con Dropdown */}
					<div className="mb-8">
						<h3 className="text-lg text-gray-600 mb-2">Font</h3>
						<div className="relative" ref={fontDropdownRef}>
							<div
								className="border border-gray-300 rounded-lg p-3 relative cursor-pointer"
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
											className={`p-3 cursor-pointer hover:bg-gray-100 ${fontFamily === font.name ? 'bg-blue-50 text-blue-600' : ''}`}
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
					<div className="mb-8">
						<h3 className="text-lg text-gray-600 mb-2">Dimensione Font</h3>
						<div className="flex gap-3">
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={decreaseFontSize}
							>
								<span className="text-2xl">A</span>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500" />
							</button>
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={increaseFontSize}
							>
								<span className="text-2xl">A</span>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500 transform rotate-180" />
							</button>
						</div>
					</div>

					{/* Sezione Spaziatura */}
					<div className="mb-8">
						<h3 className="text-lg text-gray-600 mb-2">Spaziatura</h3>
						<div className="flex gap-3">
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={handleSpacingDecrease}
							>
								<div className="flex flex-col items-center">
									<div className="w-8 h-1 bg-gray-700 mb-1"></div>
									<div className="w-8 h-1 bg-gray-700"></div>
								</div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500" />
							</button>
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={handleSpacingIncrease}
							>
								<div className="flex flex-col items-center">
									<div className="w-8 h-1 bg-gray-700 mb-2"></div>
									<div className="w-8 h-1 bg-gray-700"></div>
								</div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500 transform rotate-180" />
							</button>
						</div>
					</div>

					{/* Sezione Larghezza */}
					<div className="mb-4">
						<h3 className="text-lg text-gray-600 mb-2">Larghezza</h3>
						<div className="flex gap-3">
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={handleWidthDecrease}
							>
								<div className="w-5 h-1 bg-gray-700"></div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500" />
							</button>
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={handleWidthIncrease}
							>
								<div className="w-10 h-1 bg-gray-700"></div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500 transform rotate-180" />
							</button>
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
