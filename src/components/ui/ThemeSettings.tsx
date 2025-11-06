import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonSegment,
	IonSegmentButton,
	IonToggle,
} from '@ionic/react';
import { RootState } from '@store/store-rtk';
import { setThemeMode } from '@store/slices/appSlice';

const ThemeSettings: React.FC = () => {
	const dispatch = useDispatch();
	const { themeMode } = useSelector((state: RootState) => state.app);
	const [prefersDark, setPrefersDark] = useState(false);
	const [localThemeMode, setLocalThemeMode] = useState(themeMode || 'auto');

	// Monitora le preferenze del sistema
	useEffect(() => {
		// Verifica la preferenza all'avvio
		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setPrefersDark(darkModeMediaQuery.matches);

		// Listener per il cambiamento della preferenza
		const listener = (e: MediaQueryListEvent) => {
			setPrefersDark(e.matches);
		};

		// Aggiungi il listener
		darkModeMediaQuery.addEventListener('change', listener);

		// Rimuovi il listener quando il componente viene smontato
		return () => {
			darkModeMediaQuery.removeEventListener('change', listener);
		};
	}, []);

	// Sincronizza lo stato locale con lo stato Redux quando cambia themeMode
	useEffect(() => {
		if (themeMode) {
			setLocalThemeMode(themeMode);
		}
	}, [themeMode]);

	// Applica il tema in base alla modalità selezionata e alla preferenza del sistema
	useEffect(() => {
		let isDarkMode = false;

		if (localThemeMode === 'auto') {
			isDarkMode = prefersDark;
		} else {
			isDarkMode = localThemeMode === 'dark';
		}

		// Applica il tema
		document.body.classList.toggle('dark', isDarkMode);
	}, [localThemeMode, prefersDark]);

	const handleThemeModeChange = (value: string) => {
		const validValue = value as 'auto' | 'light' | 'dark';
		setLocalThemeMode(validValue);
		dispatch(setThemeMode(validValue));
	};

	return (
		<div className="theme-settings p-2">
			<IonList lines="none">
				<IonListHeader>
					<h2 className="text-lg font-semibold">Impostazioni tema</h2>
				</IonListHeader>

				<IonItem>
					<IonLabel>
						<span className="text-base">Modalità tema</span>
						<p className="text-xs text-gray-500 mt-1">
							{localThemeMode === 'auto' && 'Segue le impostazioni del sistema'}
							{localThemeMode === 'light' && 'Modalità chiara sempre attiva'}
							{localThemeMode === 'dark' && 'Modalità scura sempre attiva'}
						</p>
					</IonLabel>
				</IonItem>

				{/* Pulsanti IonSegment per la selezione del tema */}
				<IonItem className="mt-1">
					<IonSegment value={localThemeMode} onIonChange={e => handleThemeModeChange(e.detail.value as string)} mode="ios">
						<IonSegmentButton value="auto">
							<IonLabel>Auto</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="light">
							<IonLabel>Chiaro</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="dark">
							<IonLabel>Scuro</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonItem>

				<IonItem className="mt-2">
					<IonLabel>
						<span className="text-base">Preferenza sistema</span>
						<p className="text-xs text-gray-500 mt-1">
							Il dispositivo è impostato su modalità {prefersDark ? 'scura' : 'chiara'}
						</p>
					</IonLabel>
					<IonToggle checked={prefersDark} disabled></IonToggle>
				</IonItem>
			</IonList>
		</div>
	);
};

export default ThemeSettings; 