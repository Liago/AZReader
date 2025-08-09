import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store-rtk';

// Types
export interface AppState {
	// Theme and appearance
	darkMode: boolean;
	themeMode: 'auto' | 'light' | 'dark';
	theme: string;
	
	// Reading settings
	fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
	fontFamily: string;
	brightness: number;
	spacing: number;
	width: number;
	
	// App configuration
	devMode: boolean;
	notificationSegment: string;
	
	// Authentication tokens (legacy)
	tokenApp: string | null;
	tokenExpiration: string | null;
	
	// Configuration
	configuration?: any;
	
	// UI state
	sideMenuOpen: boolean;
	readingSettingsOpen: boolean;
	
	// Network and sync
	isOnline: boolean;
	lastSync: string | null;
	syncInProgress: boolean;
	
	// Performance and analytics
	performanceMetrics: {
		appStartTime: number | null;
		lastNavigationTime: number | null;
		articlesLoaded: number;
		searchQueries: number;
	};
}

// Initial state
const initialState: AppState = {
	// Theme and appearance
	darkMode: false,
	themeMode: 'auto',
	theme: 'white',
	
	// Reading settings
	fontSize: 'base',
	fontFamily: 'system-ui',
	brightness: 1.0,
	spacing: 1.5,
	width: 42,
	
	// App configuration
	devMode: false,
	notificationSegment: 'Subscribed Users',
	
	// Authentication tokens (legacy)
	tokenApp: null,
	tokenExpiration: null,
	
	// UI state
	sideMenuOpen: false,
	readingSettingsOpen: false,
	
	// Network and sync
	isOnline: navigator.onLine,
	lastSync: null,
	syncInProgress: false,
	
	// Performance and analytics
	performanceMetrics: {
		appStartTime: Date.now(),
		lastNavigationTime: null,
		articlesLoaded: 0,
		searchQueries: 0,
	},
};

// Font sizes array for increment/decrement
const fontSizes: AppState['fontSize'][] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];

// Create the slice
const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		// Theme actions
		setDarkMode: (state, action: PayloadAction<boolean>) => {
			state.darkMode = action.payload;
		},
		
		toggleDarkMode: (state) => {
			state.darkMode = !state.darkMode;
		},
		
		setThemeMode: (state, action: PayloadAction<AppState['themeMode']>) => {
			state.themeMode = action.payload;
			// Auto-update darkMode based on theme mode
			if (action.payload === 'dark') {
				state.darkMode = true;
			} else if (action.payload === 'light') {
				state.darkMode = false;
			}
			// For 'auto', darkMode should be set based on system preference elsewhere
		},
		
		setTheme: (state, action: PayloadAction<string>) => {
			state.theme = action.payload;
		},
		
		// Reading settings actions
		setFontSize: (state, action: PayloadAction<AppState['fontSize']>) => {
			state.fontSize = action.payload;
		},
		
		increaseFontSize: (state) => {
			const currentIndex = fontSizes.indexOf(state.fontSize);
			if (currentIndex !== -1 && currentIndex < fontSizes.length - 1) {
				state.fontSize = fontSizes[currentIndex + 1] as AppState['fontSize'];
			}
		},
		
		decreaseFontSize: (state) => {
			const currentIndex = fontSizes.indexOf(state.fontSize);
			if (currentIndex !== -1 && currentIndex > 0) {
				state.fontSize = fontSizes[currentIndex - 1] as AppState['fontSize'];
			}
		},
		
		setFontFamily: (state, action: PayloadAction<string>) => {
			state.fontFamily = action.payload;
		},
		
		setBrightness: (state, action: PayloadAction<number>) => {
			state.brightness = Math.max(0.3, Math.min(1.0, action.payload));
		},
		
		setSpacing: (state, action: PayloadAction<number>) => {
			state.spacing = Math.max(1.2, Math.min(2.0, action.payload));
		},
		
		setWidth: (state, action: PayloadAction<number>) => {
			state.width = Math.max(35, Math.min(50, action.payload));
		},
		
		// App configuration actions
		setDevMode: (state, action: PayloadAction<boolean>) => {
			state.devMode = action.payload;
		},
		
		setNotificationSegment: (state, action: PayloadAction<string>) => {
			state.notificationSegment = action.payload;
		},
		
		setConfiguration: (state, action: PayloadAction<any>) => {
			state.configuration = action.payload;
		},
		
		// Authentication actions (legacy compatibility)
		setTokens: (state, action: PayloadAction<{ token: string; expiration: string }>) => {
			state.tokenApp = action.payload.token;
			state.tokenExpiration = action.payload.expiration;
		},
		
		clearTokens: (state) => {
			state.tokenApp = null;
			state.tokenExpiration = null;
		},
		
		// UI state actions
		setSideMenuOpen: (state, action: PayloadAction<boolean>) => {
			state.sideMenuOpen = action.payload;
		},
		
		toggleSideMenu: (state) => {
			state.sideMenuOpen = !state.sideMenuOpen;
		},
		
		setReadingSettingsOpen: (state, action: PayloadAction<boolean>) => {
			state.readingSettingsOpen = action.payload;
		},
		
		toggleReadingSettings: (state) => {
			state.readingSettingsOpen = !state.readingSettingsOpen;
		},
		
		// Network and sync actions
		setOnlineStatus: (state, action: PayloadAction<boolean>) => {
			state.isOnline = action.payload;
		},
		
		updateLastSync: (state, action: PayloadAction<string>) => {
			state.lastSync = action.payload;
		},
		
		setSyncInProgress: (state, action: PayloadAction<boolean>) => {
			state.syncInProgress = action.payload;
		},
		
		// Performance and analytics actions
		recordNavigation: (state) => {
			state.performanceMetrics.lastNavigationTime = Date.now();
		},
		
		incrementArticlesLoaded: (state, action: PayloadAction<number> = { type: '', payload: 1 }) => {
			state.performanceMetrics.articlesLoaded += action.payload;
		},
		
		incrementSearchQueries: (state) => {
			state.performanceMetrics.searchQueries += 1;
		},
		
		resetPerformanceMetrics: (state) => {
			state.performanceMetrics = {
				appStartTime: Date.now(),
				lastNavigationTime: null,
				articlesLoaded: 0,
				searchQueries: 0,
			};
		},
		
		// Batch update for reading settings
		updateReadingSettings: (state, action: PayloadAction<Partial<Pick<AppState, 'fontSize' | 'fontFamily' | 'brightness' | 'spacing' | 'width'>>>) => {
			Object.assign(state, action.payload);
		},
		
		// Reset to defaults
		resetToDefaults: (state) => {
			Object.assign(state, initialState, {
				// Keep some state that shouldn't be reset
				performanceMetrics: state.performanceMetrics,
				isOnline: state.isOnline,
			});
		},
	},
});

// Export actions
export const {
	setDarkMode,
	toggleDarkMode,
	setThemeMode,
	setTheme,
	setFontSize,
	increaseFontSize,
	decreaseFontSize,
	setFontFamily,
	setBrightness,
	setSpacing,
	setWidth,
	setDevMode,
	setNotificationSegment,
	setConfiguration,
	setTokens,
	clearTokens,
	setSideMenuOpen,
	toggleSideMenu,
	setReadingSettingsOpen,
	toggleReadingSettings,
	setOnlineStatus,
	updateLastSync,
	setSyncInProgress,
	recordNavigation,
	incrementArticlesLoaded,
	incrementSearchQueries,
	resetPerformanceMetrics,
	updateReadingSettings,
	resetToDefaults,
} = appSlice.actions;

// Selectors
export const selectAppState = (state: RootState) => state.app;
export const selectDarkMode = (state: RootState) => state.app.darkMode;
export const selectThemeMode = (state: RootState) => state.app.themeMode;
export const selectTheme = (state: RootState) => state.app.theme;
export const selectReadingSettings = (state: RootState) => ({
	fontSize: state.app.fontSize,
	fontFamily: state.app.fontFamily,
	brightness: state.app.brightness,
	spacing: state.app.spacing,
	width: state.app.width,
});
export const selectUIState = (state: RootState) => ({
	sideMenuOpen: state.app.sideMenuOpen,
	readingSettingsOpen: state.app.readingSettingsOpen,
});
export const selectNetworkState = (state: RootState) => ({
	isOnline: state.app.isOnline,
	lastSync: state.app.lastSync,
	syncInProgress: state.app.syncInProgress,
});
export const selectPerformanceMetrics = (state: RootState) => state.app.performanceMetrics;

export default appSlice;