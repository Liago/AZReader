import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store-rtk';

// Types
export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number; // Duration in ms, null for persistent
	position?: 'top' | 'middle' | 'bottom';
	color?: string;
	buttons?: ToastButton[];
	icon?: string;
	timestamp: number;
	persistent?: boolean;
	dismissible?: boolean;
	action?: {
		text: string;
		handler: () => void;
	};
}

export interface ToastButton {
	text: string;
	role?: 'cancel' | 'destructive';
	handler?: () => void;
}

export interface ToastOptions {
	message: string;
	type?: Toast['type'];
	duration?: number;
	position?: Toast['position'];
	color?: string;
	buttons?: ToastButton[];
	icon?: string;
	persistent?: boolean;
	dismissible?: boolean;
	action?: Toast['action'];
}

export interface ToastState {
	toasts: Toast[];
	defaultDuration: number;
	defaultPosition: Toast['position'];
	maxToasts: number;
	queuedToasts: Toast[];
}

// Initial state
const initialState: ToastState = {
	toasts: [],
	defaultDuration: 3000, // 3 seconds
	defaultPosition: 'bottom',
	maxToasts: 5,
	queuedToasts: [],
};

// Helper function to generate unique IDs
const generateId = (): string => {
	return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to create toast from options
const createToast = (options: ToastOptions): Toast => ({
	id: generateId(),
	message: options.message,
	type: options.type || 'info',
	duration: options.duration,
	position: options.position || 'bottom',
	color: options.color,
	buttons: options.buttons,
	icon: options.icon,
	timestamp: Date.now(),
	persistent: options.persistent || false,
	dismissible: options.dismissible !== false, // Default to true
	action: options.action,
});

// Toast slice
const toastSlice = createSlice({
	name: 'toast',
	initialState,
	reducers: {
		// Add a new toast
		addToast: (state, action: PayloadAction<ToastOptions>) => {
			const toast = createToast(action.payload);
			
			// If we're at max capacity, queue the toast
			if (state.toasts.length >= state.maxToasts) {
				state.queuedToasts.push(toast);
			} else {
				state.toasts.push(toast);
			}
		},

		// Add multiple toasts at once
		addToasts: (state, action: PayloadAction<ToastOptions[]>) => {
			const toasts = action.payload.map(createToast);
			
			toasts.forEach(toast => {
				if (state.toasts.length >= state.maxToasts) {
					state.queuedToasts.push(toast);
				} else {
					state.toasts.push(toast);
				}
			});
		},

		// Remove a specific toast
		removeToast: (state, action: PayloadAction<string>) => {
			const toastId = action.payload;
			state.toasts = state.toasts.filter(toast => toast.id !== toastId);
			
			// If we have queued toasts, add the next one
			if (state.queuedToasts.length > 0) {
				const nextToast = state.queuedToasts.shift()!;
				state.toasts.push(nextToast);
			}
		},

		// Remove all toasts
		clearToasts: (state) => {
			state.toasts = [];
			state.queuedToasts = [];
		},

		// Remove toasts by type
		clearToastsByType: (state, action: PayloadAction<Toast['type']>) => {
			const type = action.payload;
			state.toasts = state.toasts.filter(toast => toast.type !== type);
			state.queuedToasts = state.queuedToasts.filter(toast => toast.type !== type);
		},

		// Update toast settings
		updateToastSettings: (state, action: PayloadAction<{
			defaultDuration?: number;
			defaultPosition?: Toast['position'];
			maxToasts?: number;
		}>) => {
			const { defaultDuration, defaultPosition, maxToasts } = action.payload;
			
			if (defaultDuration !== undefined) {
				state.defaultDuration = defaultDuration;
			}
			if (defaultPosition !== undefined) {
				state.defaultPosition = defaultPosition;
			}
			if (maxToasts !== undefined) {
				state.maxToasts = maxToasts;
				
				// If we reduced max toasts, move excess to queue
				if (state.toasts.length > maxToasts) {
					const excess = state.toasts.splice(maxToasts);
					state.queuedToasts = [...excess, ...state.queuedToasts];
				}
			}
		},

		// Convenience actions for different toast types
		showSuccess: (state, action: PayloadAction<string | Omit<ToastOptions, 'type'>>) => {
			const options = typeof action.payload === 'string' 
				? { message: action.payload, type: 'success' as const }
				: { ...action.payload, type: 'success' as const };
			
			const toast = createToast(options);
			
			if (state.toasts.length >= state.maxToasts) {
				state.queuedToasts.push(toast);
			} else {
				state.toasts.push(toast);
			}
		},

		showError: (state, action: PayloadAction<string | Omit<ToastOptions, 'type'>>) => {
			const options = typeof action.payload === 'string' 
				? { message: action.payload, type: 'error' as const }
				: { ...action.payload, type: 'error' as const };
			
			const toast = createToast(options);
			
			if (state.toasts.length >= state.maxToasts) {
				state.queuedToasts.push(toast);
			} else {
				state.toasts.push(toast);
			}
		},

		showWarning: (state, action: PayloadAction<string | Omit<ToastOptions, 'type'>>) => {
			const options = typeof action.payload === 'string' 
				? { message: action.payload, type: 'warning' as const }
				: { ...action.payload, type: 'warning' as const };
			
			const toast = createToast(options);
			
			if (state.toasts.length >= state.maxToasts) {
				state.queuedToasts.push(toast);
			} else {
				state.toasts.push(toast);
			}
		},

		showInfo: (state, action: PayloadAction<string | Omit<ToastOptions, 'type'>>) => {
			const options = typeof action.payload === 'string' 
				? { message: action.payload, type: 'info' as const }
				: { ...action.payload, type: 'info' as const };
			
			const toast = createToast(options);
			
			if (state.toasts.length >= state.maxToasts) {
				state.queuedToasts.push(toast);
			} else {
				state.toasts.push(toast);
			}
		},

		// Remove old toasts (for cleanup)
		removeExpiredToasts: (state, action: PayloadAction<number | undefined>) => {
			const maxAge = action.payload || 30000; // Default 30 seconds
			const cutoffTime = Date.now() - maxAge;
			
			state.toasts = state.toasts.filter(toast => 
				toast.persistent || toast.timestamp > cutoffTime
			);
		},

		// Update a specific toast
		updateToast: (state, action: PayloadAction<{ id: string; updates: Partial<Omit<Toast, 'id'>> }>) => {
			const { id, updates } = action.payload;
			const toastIndex = state.toasts.findIndex(toast => toast.id === id);
			
			if (toastIndex !== -1) {
				const existingToast = state.toasts[toastIndex];
				if (existingToast) {
					state.toasts[toastIndex] = { ...existingToast, ...updates };
				}
			}
		},

		// Mark toast as read/seen
		markToastAsSeen: (state, action: PayloadAction<string>) => {
			const toastId = action.payload;
			const toast = state.toasts.find(t => t.id === toastId);
			if (toast) {
				// Add a 'seen' property for tracking
				(toast as any).seen = true;
			}
		},
	},
});

// Export actions
export const {
	addToast,
	addToasts,
	removeToast,
	clearToasts,
	clearToastsByType,
	updateToastSettings,
	showSuccess,
	showError,
	showWarning,
	showInfo,
	removeExpiredToasts,
	updateToast,
	markToastAsSeen,
} = toastSlice.actions;

// Selectors
export const selectToasts = (state: RootState) => state.toast.toasts;
export const selectQueuedToasts = (state: RootState) => state.toast.queuedToasts;
export const selectToastSettings = (state: RootState) => ({
	defaultDuration: state.toast.defaultDuration,
	defaultPosition: state.toast.defaultPosition,
	maxToasts: state.toast.maxToasts,
});

// Derived selectors
export const selectToastsByType = (state: RootState, type: Toast['type']) => 
	state.toast.toasts.filter(toast => toast.type === type);

export const selectToastsByPosition = (state: RootState, position: Toast['position']) => 
	state.toast.toasts.filter(toast => toast.position === position);

export const selectPersistentToasts = (state: RootState) => 
	state.toast.toasts.filter(toast => toast.persistent);

export const selectDismissibleToasts = (state: RootState) => 
	state.toast.toasts.filter(toast => toast.dismissible);

export const selectToastCount = (state: RootState) => state.toast.toasts.length;

export const selectHasActiveToasts = (state: RootState) => state.toast.toasts.length > 0;

export const selectToastById = (state: RootState, id: string) => 
	state.toast.toasts.find(toast => toast.id === id);

// Utility selectors for UI
export const selectToastsForPosition = (position: Toast['position']) => (state: RootState) =>
	state.toast.toasts.filter(toast => 
		(toast.position || state.toast.defaultPosition) === position
	);

export default toastSlice;