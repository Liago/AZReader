import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	IonItem,
	IonLabel,
	IonToggle,
	IonCard,
	IonCardContent,
	IonIcon,
	IonList,
} from '@ionic/react';
import { sunny, moon, syncOutline, informationCircleOutline } from 'ionicons/icons';
import { RootState } from '@store/reducers';
import { setThemeMode } from '@store/actions';

const ThemeSettingsPage: React.FC = () => {
	const dispatch = useDispatch();
	const { themeMode } = useSelector((state: RootState) => state.app);
	const [prefersDark, setPrefersDark] = useState(false);
	const [localThemeMode, setLocalThemeMode] = useState(themeMode || 'light');
	const [followSystem, setFollowSystem] = useState(false);

	// Monitora le preferenze del sistema
	useEffect(() => {
		// Verifica la preferenza all'avvio
		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setPrefersDark(darkModeMediaQuery.matches);

		// Listener per il cambiamento della preferenza
		const listener = (e: MediaQueryListEvent) => {
			setPrefersDark(e.matches);
			if (followSystem) {
				handleThemeModeChange(e.matches ? 'dark' : 'light');
			}
		};

		// Aggiungi il listener
		darkModeMediaQuery.addEventListener('change', listener);

		// Rimuovi il listener quando il componente viene smontato
		return () => {
			darkModeMediaQuery.removeEventListener('change', listener);
		};
	}, [followSystem]);

	// Sincronizza lo stato locale con lo stato Redux quando cambia themeMode
	useEffect(() => {
		if (themeMode) {
			setLocalThemeMode(themeMode);
		}
	}, [themeMode]);

	// Applica il tema in base alla modalità selezionata
	useEffect(() => {
		const isDarkMode = localThemeMode === 'dark';
		document.body.classList.toggle('dark', isDarkMode);
	}, [localThemeMode]);

	const handleThemeModeChange = (value: string) => {
		setLocalThemeMode(value);
		dispatch(setThemeMode(value));
	};

	const handleSystemToggle = (e: any) => {
		const isChecked = e.detail.checked;
		setFollowSystem(isChecked);
		if (isChecked) {
			// Se attivato, imposta il tema in base alle preferenze di sistema
			handleThemeModeChange(prefersDark ? 'dark' : 'light');
		}
	};

	// Determina se il tema è in modalità scura
	const isDarkModeActive = localThemeMode === 'dark';

	return (
		<div className="theme-settings-menu pb-4">
			{/* Visualizzazione dello stato attuale */}
			<IonCard className="mb-4 shadow-sm">
				<IonCardContent>
					<div className="flex items-center">
						<div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDarkModeActive ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-800'}`}>
							<IonIcon
								icon={isDarkModeActive ? moon : sunny}
								size="small"
							/>
						</div>
						<div>
							<div className="text-base font-medium">
								{isDarkModeActive ? 'Modalità scura attiva' : 'Modalità chiara attiva'}
							</div>
							<div className="text-xs text-gray-500">
								{followSystem ? 'Segue le impostazioni del sistema' : 'Impostato manualmente'}
							</div>
						</div>
					</div>
				</IonCardContent>
			</IonCard>

			{/* Selezione tema */}
			<div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm mb-4">
				<h3 className="text-base font-medium mb-2">Scegli modalità tema</h3>

				<div className="flex gap-2">
					<button
						className={`flex-1 py-2 rounded-lg border transition-all duration-200 ${followSystem
							? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 border-gray-300 text-gray-500 dark:text-gray-400'
							: !isDarkModeActive
								? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
								: 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
							}`}
						onClick={() => handleThemeModeChange('light')}
						disabled={followSystem}
					>
						<IonIcon icon={sunny} className="mr-1" />
						Chiaro
					</button>
					<button
						className={`flex-1 py-2 rounded-lg border transition-all duration-200 ${followSystem
							? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 border-gray-300 text-gray-500 dark:text-gray-400'
							: isDarkModeActive
								? 'border-blue-500 bg-blue-900 hover:bg-blue-800'
								: 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
							}`}
						onClick={() => handleThemeModeChange('dark')}
						disabled={followSystem}
					>
						<IonIcon icon={moon} className="mr-1" />
						Scuro
					</button>
				</div>

				<div className="text-xs text-gray-500 mt-2 flex items-start">
					<IonIcon icon={informationCircleOutline} className="mr-1 mt-0.5 text-blue-500 flex-shrink-0" />
					<div>
						{followSystem
							? 'L\'app seguirà le impostazioni del sistema'
							: !isDarkModeActive
								? 'L\'app utilizzerà sempre il tema chiaro'
								: 'L\'app utilizzerà sempre il tema scuro'
						}
					</div>
				</div>
			</div>

			{/* Informazioni sul tema di sistema */}
			<IonList className="rounded-lg overflow-hidden">
				<IonItem lines="none" className="bg-gray-50 dark:bg-gray-800">
					<IonIcon icon={syncOutline} slot="start" className="text-purple-500" />
					<IonLabel>
						<h2 className="text-sm font-medium">Preferenza del sistema</h2>
						<p className="text-xs text-gray-500">Il dispositivo è impostato su tema {prefersDark ? 'scuro' : 'chiaro'}</p>
					</IonLabel>
					<IonToggle
						checked={followSystem}
						onIonChange={handleSystemToggle}
						slot="end"
					></IonToggle>
				</IonItem>
			</IonList>
		</div>
	);
};

export default ThemeSettingsPage;