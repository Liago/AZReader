import React, { ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/reducers';
import '@theme/reading-theme.css';

interface ReadingThemeWrapperProps {
	children: ReactNode;
	className?: string;
}

const ReadingThemeWrapper: React.FC<ReadingThemeWrapperProps> = ({ children, className = '' }) => {
	const {
		theme,
		brightness,
		fontFamily,
		fontSize,
		spacing,
		width,
		themeMode
	} = useSelector((state: RootState) => state.app);
	const [prefersDark, setPrefersDark] = useState(false);

	// Monitora le preferenze del sistema per il tema scuro
	useEffect(() => {
		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setPrefersDark(darkModeMediaQuery.matches);

		const listener = (e: MediaQueryListEvent) => {
			setPrefersDark(e.matches);
		};

		darkModeMediaQuery.addEventListener('change', listener);
		return () => {
			darkModeMediaQuery.removeEventListener('change', listener);
		};
	}, []);

	useEffect(() => {
		document.documentElement.style.setProperty('--app-brightness', `${brightness}%`);
		document.documentElement.style.setProperty('--app-spacing', spacing.toString());
		document.documentElement.style.setProperty('--app-width', width.toString());
	}, [brightness, spacing, width]);

	// Determina il tema da usare basato sulle preferenze
	const getThemeToUse = () => {
		// Per i temi di lettura ottimizzati
		if (themeMode === 'light' || (themeMode === 'auto' && !prefersDark)) {
			return 'reading-light';
		}
		
		if (themeMode === 'dark' || (themeMode === 'auto' && prefersDark)) {
			// Se l'utente ha selezionato un tema scuro specifico, usalo
			if (theme === 'amoled') return 'amoled';
			if (theme === 'dark') return 'dark';
			// Altrimenti usa il tema di lettura scuro ottimizzato
			return 'reading-dark';
		}

		// Per compatibilità, mantieni i temi esistenti per altri casi
		return theme || 'reading-light';
	};

	const themeClass = `theme-${getThemeToUse()}`;
	const fontClass = `font-${fontFamily.toLowerCase().replace(' ', '-')}`;

	return (
		<div className={`reading-content ${themeClass} ${fontClass} text-${fontSize} ${className} content-fadeIn`}>
			{children}
		</div>
	);
};

export default ReadingThemeWrapper; 