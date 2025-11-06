import React, { ReactNode, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store-rtk';
import { setBrightness } from '@store/slices/appSlice';
import '@theme/reading-theme.css';

interface ReadingThemeWrapperProps {
	children: ReactNode;
	className?: string;
}

const ReadingThemeWrapper: React.FC<ReadingThemeWrapperProps> = ({ children, className = '' }) => {
	const dispatch = useDispatch();
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
		let brightnessValue = brightness;
		
		// Fix for legacy brightness values
		if (brightness < 10) {
			// Old decimal values (0.5 -> 50%)
			brightnessValue = brightness * 100;
			console.log('🔥 Converting decimal brightness:', brightness, '-> ', brightnessValue + '%');
		} else if (brightness === 50) {
			// Reset old 50% default to 100%
			brightnessValue = 100;
			console.log('🔥 Resetting 50% brightness to default 100%');
		}
		
		console.log('🔥 Setting brightness to:', `${brightnessValue}%`, 'from original:', brightness);
		
		// If we had to change the value, update the store permanently
		if (brightness !== brightnessValue) {
			console.log('🔥 Updating Redux store with corrected brightness value:', brightnessValue);
			dispatch(setBrightness(brightnessValue));
		}
		
		document.documentElement.style.setProperty('--app-brightness', `${brightnessValue}%`);
		document.documentElement.style.setProperty('--app-spacing', spacing.toString());
		document.documentElement.style.setProperty('--app-width', width.toString());
	}, [brightness, spacing, width, dispatch]);

	// Determina il tema da usare basato sulle preferenze
	const getThemeToUse = () => {
		console.log('🎨 ReadingThemeWrapper - theme:', theme, 'themeMode:', themeMode, 'prefersDark:', prefersDark);
		
		// Se l'utente ha selezionato un tema specifico, usalo sempre
		if (theme && ['white', 'sepia', 'paper', 'dawn', 'dark', 'amoled'].includes(theme)) {
			console.log('🎨 Using specific theme:', theme);
			return theme;
		}
		
		// Altrimenti usa la logica automatica basata su themeMode
		if (themeMode === 'light' || (themeMode === 'auto' && !prefersDark)) {
			console.log('🎨 Using light mode theme: reading-light');
			return 'reading-light';
		}
		
		if (themeMode === 'dark' || (themeMode === 'auto' && prefersDark)) {
			console.log('🎨 Using dark mode theme: reading-dark');
			return 'reading-dark';
		}

		// Fallback di default
		const fallbackTheme = theme || 'reading-light';
		console.log('🎨 Using fallback theme:', fallbackTheme);
		return fallbackTheme;
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