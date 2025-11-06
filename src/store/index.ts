// Centralized exports for store-related modules
export * from './types';
export * from './actionTypes';
export * from './actions';
export * from './selectors';

// Legacy store (for backward compatibility)
export { store, persistor, history } from './store';
export type { AppDispatch, AppStore, RootState } from './store';

// New RTK store (for future migration)
export { 
	store as rtkStore, 
	persistor as rtkPersistor, 
	history as rtkHistory,
	useAppDispatch,
	useAppSelector
} from './store-rtk';
export type { 
	AppDispatch as RTKAppDispatch, 
	AppStore as RTKAppStore, 
	RootState as RTKRootState 
} from './store-rtk';

// RTK Slices exports
export type { 
	Post as RTKPost,
	PostsState
} from './slices/postsSlice';
export {
	fetchPosts,
	createPost,
	updatePost,
	deletePost,
	toggleFavourite,
	searchPosts,
	setCurrentPost,
	clearCurrentPost,
	updateFilters,
	clearFilters,
	updatePagination,
	addLocalPost,
	removeLocalPost,
	updateLocalPost,
	clearErrors,
	updateReadingProgress,
	selectPosts,
	selectCurrentPost,
	selectFavourites,
	selectPostsLoading,
	selectPostsErrors,
	selectPostsPagination,
	selectPostsFilters,
	selectFilteredPosts
} from './slices/postsSlice';
export { showSuccess, showError } from './slices/toastSlice';
export * from './hooks';

export { useTagsHandler } from './rest';