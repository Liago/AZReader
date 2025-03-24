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
		// Se il tema è automatico, usa il tema scuro quando il sistema è in modalità scura
		if (themeMode === 'auto' && prefersDark) {
			return 'dark';
		}

		// Se il tema è impostato esplicitamente su dark, usa dark o amoled
		if (themeMode === 'dark') {
			return theme === 'amoled' ? 'amoled' : 'dark';
		}

		// Altrimenti usa il tema selezionato dall'utente
		return theme;
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