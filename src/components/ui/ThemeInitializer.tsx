import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store-rtk';

const ThemeInitializer: React.FC = () => {
	const { themeMode } = useSelector((state: RootState) => state.app);

	// Debug del valore iniziale
	console.log('ThemeInitializer: valore themeMode dallo store:', themeMode);

	// Inizializza il tema all'avvio dell'app
	useEffect(() => {
		const applyTheme = () => {
			let isDarkMode = false;

			if (themeMode === 'auto') {
				// Rileva la preferenza del sistema
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				isDarkMode = prefersDark;
				console.log('ThemeInitializer: modalità auto, prefersDark =', prefersDark);
			} else {
				// Usa l'impostazione manuale
				isDarkMode = themeMode === 'dark';
				console.log('ThemeInitializer: modalità manuale', themeMode, 'isDarkMode =', isDarkMode);
			}

			// Applica la classe 'dark' al body se necessario
			document.body.classList.toggle('dark', isDarkMode);
			console.log('ThemeInitializer: classe "dark" applicata:', isDarkMode);

			// Configura il listener per i cambiamenti di preferenza del sistema
			if (themeMode === 'auto') {
				const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

				const handleColorSchemeChange = (e: MediaQueryListEvent) => {
					console.log('ThemeInitializer: cambio preferenza sistema:', e.matches ? 'scuro' : 'chiaro');
					document.body.classList.toggle('dark', e.matches);
				};

				// Rimuovi eventuali listener precedenti
				try {
					darkModeMediaQuery.removeEventListener('change', handleColorSchemeChange);
				} catch (e) {
					console.log('ThemeInitializer: nessun listener precedente da rimuovere');
				}

				// Aggiungi il nuovo listener
				darkModeMediaQuery.addEventListener('change', handleColorSchemeChange);
				console.log('ThemeInitializer: listener per cambio preferenza sistema aggiunto');
			}
		};

		applyTheme();
		console.log('ThemeInitializer: tema applicato dopo cambio di themeMode a', themeMode);

	}, [themeMode]);

	// Componente senza UI, solo logica
	return null;
};

export default ThemeInitializer; 