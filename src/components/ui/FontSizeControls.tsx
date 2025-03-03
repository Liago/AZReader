import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	IonButton,
	IonIcon,
	IonModal,
	IonRange,
} from "@ionic/react";
import { textOutline, chevronDown } from "ionicons/icons";
import { RootState } from "@store/reducers";

export const FontSizeControls = () => {
	const [isOpen, setIsOpen] = useState(false);
	const dispatch = useDispatch();
	const fontSize = useSelector((state: RootState) => state.app.fontSize);

	// Stato per le varie opzioni di lettura
	const [theme, setTheme] = useState("white");
	const [brightness, setBrightness] = useState(50);
	const [fontFamily, setFontFamily] = useState("New York");
	const [spacing, setSpacing] = useState(1);
	const [width, setWidth] = useState(1);

	const decreaseFontSize = () => {
		dispatch({ type: "DECREASE_FONT_SIZE" });
	};

	const increaseFontSize = () => {
		dispatch({ type: "INCREASE_FONT_SIZE" });
	};

	const handleThemeSelect = (newTheme: string) => {
		setTheme(newTheme);
		// Qui puoi aggiungere la logica per applicare il tema
	};

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
					<div className="flex justify-center mb-1">
						<div className="w-10 h-1 bg-gray-300 rounded-full"></div>
					</div>

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
							onIonChange={e => setBrightness(e.detail.value as number)}
							min={0}
							max={100}
							className="custom-range"
						/>
					</div>

					{/* Sezione Font */}
					<div className="mb-8">
						<h3 className="text-lg text-gray-600 mb-2">Font</h3>
						<div className="border border-gray-300 rounded-lg p-3 relative">
							<span className="block text-center">{fontFamily}</span>
							<IonIcon icon={chevronDown} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
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
								onClick={() => setSpacing(Math.max(0.5, spacing - 0.1))}
							>
								<div className="flex flex-col items-center">
									<div className="w-8 h-1 bg-gray-700 mb-1"></div>
									<div className="w-8 h-1 bg-gray-700"></div>
								</div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500" />
							</button>
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={() => setSpacing(Math.min(2, spacing + 0.1))}
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
								onClick={() => setWidth(Math.max(0.5, width - 0.1))}
							>
								<div className="w-5 h-1 bg-gray-700"></div>
								<IonIcon icon={chevronDown} className="ml-2 text-gray-500" />
							</button>
							<button
								className="flex-1 border border-gray-300 rounded-lg p-3 flex items-center justify-center"
								onClick={() => setWidth(Math.min(2, width + 0.1))}
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
