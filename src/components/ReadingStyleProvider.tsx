import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store-rtk';

/**
 * ReadingStyleProvider - Manages CSS custom properties for reading customization
 * 
 * This component listens to Redux state changes and updates CSS custom properties
 * that are used by ArticleReader and other reading components for real-time styling.
 */
const ReadingStyleProvider: React.FC = () => {
	const {
		fontSize,
		fontFamily,
		theme,
		brightness,
		spacing,
		width,
		themeMode,
	} = useSelector((state: RootState) => ({
		fontSize: state.app.fontSize,
		fontFamily: state.app.fontFamily,
		theme: state.app.theme,
		brightness: state.app.brightness,
		spacing: state.app.spacing,
		width: state.app.width,
		themeMode: state.app.themeMode,
	}));

	// Font size mapping from class to pixels
	const fontSizeToPixels = (size: string): number => {
		const mapping: Record<string, number> = {
			xs: 12,
			sm: 14,
			base: 16,
			lg: 18,
			xl: 20,
			'2xl': 24,
		};
		return mapping[size] || 16;
	};

	// Theme color mapping
	const getThemeColors = (themeId: string) => {
		const themes: Record<string, {
			background: string;
			text: string;
			secondary: string;
			accent: string;
			border: string;
			surface: string;
		}> = {
			white: {
				background: '#ffffff',
				text: '#1a1a1a',
				secondary: '#4a5568',
				accent: '#3b82f6',
				border: '#e2e8f0',
				surface: '#f8fafc',
			},
			sepia: {
				background: '#f4ecd8',
				text: '#5c4b37',
				secondary: '#8b7355',
				accent: '#92400e',
				border: '#d6cc7a',
				surface: '#f0e6d2',
			},
			paper: {
				background: '#f7f5f3',
				text: '#2c2c2c',
				secondary: '#6b6b6b',
				accent: '#2563eb',
				border: '#d1d5db',
				surface: '#f3f4f6',
			},
			dark: {
				background: '#1a1a1a',
				text: '#e5e5e5',
				secondary: '#a1a1aa',
				accent: '#60a5fa',
				border: '#374151',
				surface: '#262626',
			},
			amoled: {
				background: '#000000',
				text: '#ffffff',
				secondary: '#d4d4d8',
				accent: '#3b82f6',
				border: '#27272a',
				surface: '#0a0a0a',
			},
		};

		return themes[themeId] || themes.white;
	};

	// Update CSS custom properties
	useEffect(() => {
		const root = document.documentElement;
		const themeColors = getThemeColors(theme);
		const fontSizePixels = fontSizeToPixels(fontSize);
		
		if (!themeColors) return;

		// Reading-specific variables
		root.style.setProperty('--article-font-size', `${fontSizePixels}px`);
		root.style.setProperty('--article-font-family', fontFamily);
		root.style.setProperty('--article-line-height', spacing.toString());
		root.style.setProperty('--article-max-width', `${width}rem`);
		root.style.setProperty('--article-brightness', brightness.toString());

		// Article padding based on screen size and width
		const padding = width < 40 ? '1rem' : '1.5rem';
		root.style.setProperty('--article-padding', padding);
		root.style.setProperty('--article-padding-mobile', '1rem');
		root.style.setProperty('--article-padding-small', '0.75rem');

		// Font size variations
		root.style.setProperty('--article-font-size-mobile', `${Math.max(fontSizePixels - 1, 12)}px`);
		root.style.setProperty('--article-font-size-large', `${fontSizePixels + 2}px`);

		// Theme colors
		root.style.setProperty('--article-background', themeColors.background);
		root.style.setProperty('--article-text-color', themeColors.text);
		root.style.setProperty('--article-secondary-color', themeColors.secondary);
		root.style.setProperty('--article-accent-color', themeColors.accent);
		root.style.setProperty('--article-border-color', themeColors.border);
		root.style.setProperty('--article-surface-color', themeColors.surface);

		// Title colors (usually darker/lighter variants)
		const titleColor = theme === 'dark' || theme === 'amoled' ? '#ffffff' : '#1a1a1a';
		root.style.setProperty('--article-title-color', titleColor);

		// Heading colors
		root.style.setProperty('--article-heading-color', titleColor);

		// Meta colors (lighter than text)
		root.style.setProperty('--article-meta-color', themeColors.secondary);

		// Link colors
		root.style.setProperty('--article-link-color', themeColors.accent);
		const linkHoverColor = theme === 'dark' || theme === 'amoled' ? '#93c5fd' : '#1d4ed8';
		root.style.setProperty('--article-link-hover-color', linkHoverColor);

		// Quote and caption colors
		root.style.setProperty('--article-quote-color', themeColors.secondary);
		root.style.setProperty('--article-caption-color', themeColors.secondary);

		// Code background
		const codeBg = theme === 'dark' ? '#2d2d2d' : theme === 'amoled' ? '#1a1a1a' : '#f8fafc';
		root.style.setProperty('--article-code-bg', codeBg);
		
		const inlineCodeBg = theme === 'dark' ? '#374151' : theme === 'amoled' ? '#27272a' : '#e2e8f0';
		root.style.setProperty('--article-inline-code-bg', inlineCodeBg);

		// Table header background
		const tableHeaderBg = theme === 'dark' ? '#374151' : theme === 'amoled' ? '#18181b' : '#f8fafc';
		root.style.setProperty('--article-table-header-bg', tableHeaderBg);

		// Reading indicator color
		const readColor = theme === 'dark' || theme === 'amoled' ? '#10b981' : '#059669';
		root.style.setProperty('--article-read-color', readColor);

		// Domain chip background
		const domainBg = theme === 'dark' ? '#374151' : theme === 'amoled' ? '#27272a' : '#f3f4f6';
		root.style.setProperty('--article-domain-bg', domainBg);

		// Screen brightness (for devices that support it)
		if ('screen' in navigator && 'wakeLock' in navigator) {
			try {
				document.documentElement.style.filter = `brightness(${brightness})`;
			} catch (error) {
				// Brightness control not supported
				console.warn('Screen brightness control not supported:', error);
			}
		}
	}, [fontSize, fontFamily, theme, brightness, spacing, width]);

	// Apply system theme detection
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		
		const handleThemeChange = (e: MediaQueryListEvent) => {
			if (themeMode === 'auto') {
				// Auto theme switching could be implemented here
				// For now, we rely on the themeMode being set by user actions
			}
		};

		mediaQuery.addEventListener('change', handleThemeChange);
		return () => mediaQuery.removeEventListener('change', handleThemeChange);
	}, [themeMode]);

	// This component doesn't render anything - it's just for managing CSS variables
	return null;
};

export default ReadingStyleProvider;