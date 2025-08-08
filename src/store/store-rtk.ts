import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createReduxHistoryContext } from 'redux-first-history';
import { createBrowserHistory } from 'history';

// RTK Slices
import postsSlice from './slices/postsSlice';
import appSlice from './slices/appSlice';
import authSlice from './slices/authSlice';
import toastSlice from './slices/toastSlice';

// Legacy reducers (for gradual migration)
import legacyReducers from './reducers';

// Create history context
const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
	history: createBrowserHistory(),
});

// Root reducer combining RTK slices and legacy reducers
const rootReducer = combineReducers({
	// RTK slices (new)
	posts: postsSlice.reducer,
	app: appSlice.reducer,  
	auth: authSlice.reducer,
	toast: toastSlice.reducer,
	
	// Router
	router: routerReducer,
	
	// Legacy reducers (keep during transition)
	user: legacyReducers.user,
	loading: (state = false) => state,
	error: (state = null) => state,
	archive: (state = []) => state,
});

// Persist configuration
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
	key: 'root',
	storage,
	blacklist: [
		'router', // Never persist router state
		'loading', // Don't persist loading states
		'error', // Don't persist errors
		'toast', // Don't persist toast notifications
	],
	whitelist: [
		'posts', // Persist articles/posts
		'app', // Persist app settings
		'auth', // Persist auth state
		'user', // Keep legacy user state during transition
		'archive', // Persist archived items
	],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure RTK store
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					'persist/PERSIST',
					'persist/REHYDRATE',
					'persist/PAUSE',
					'persist/PURGE',
					'persist/REGISTER',
					'persist/FLUSH',
				],
			},
		})
		.concat(routerMiddleware)
		.concat(
			// Add redux-logger in development
			process.env.NODE_ENV === 'development'
				? require('redux-logger').createLogger({
					collapsed: true,
					duration: true,
					timestamp: false,
					diff: true,
					colors: {
						title: () => '#139BFE',
						prevState: () => '#9E9E9E',
						action: () => '#149945',
						nextState: () => '#A47104',
					},
				})
				: []
		),
	devTools: process.env.NODE_ENV === 'development' && {
		name: 'AZReader Redux Store',
		trace: true,
		traceLimit: 25,
		actionSanitizer: (action: any) => ({
			...action,
			// Sanitize sensitive data in development
			...(action.type.includes('auth') && action.payload?.password && {
				payload: { ...action.payload, password: '[SANITIZED]' },
			}),
		}),
	},
});

// Create persistor
export const persistor = persistStore(store);

// Create history instance
export const history = createReduxHistory(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Export hooks for components
export { useAppDispatch, useAppSelector } from './hooks';

// Re-export for compatibility
export { store as rtkStore, persistor as rtkPersistor };
export default store;