import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@common/supabase';
import { RootState } from '../store-rtk';

// Types
export interface AuthState {
	// Supabase auth state
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	
	// Loading states
	loading: {
		signIn: boolean;
		signUp: boolean;
		signOut: boolean;
		refresh: boolean;
		updateProfile: boolean;
		resetPassword: boolean;
		confirmation: boolean;
	};
	
	// Error handling
	errors: {
		signIn: string | null;
		signUp: string | null;
		signOut: string | null;
		refresh: string | null;
		updateProfile: string | null;
		resetPassword: string | null;
		confirmation: string | null;
		general: string | null;
	};
	
	// Authentication metadata
	lastSignIn: string | null;
	sessionExpiry: string | null;
	rememberMe: boolean;
	
	// User preferences (from auth context)
	preferences: {
		emailNotifications: boolean;
		pushNotifications: boolean;
		newsletter: boolean;
		preferredParser: 'mercury' | 'rapidapi';
	};
	
	// OAuth providers
	availableProviders: string[];
	lastUsedProvider: string | null;
}

// Initial state
const initialState: AuthState = {
	user: null,
	session: null,
	isAuthenticated: false,
	
	loading: {
		signIn: false,
		signUp: false,
		signOut: false,
		refresh: false,
		updateProfile: false,
		resetPassword: false,
		confirmation: false,
	},
	
	errors: {
		signIn: null,
		signUp: null,
		signOut: null,
		refresh: null,
		updateProfile: null,
		resetPassword: null,
		confirmation: null,
		general: null,
	},
	
	lastSignIn: null,
	sessionExpiry: null,
	rememberMe: false,
	
	preferences: {
		emailNotifications: true,
		pushNotifications: true,
		newsletter: false,
		preferredParser: 'mercury' as const,
	},
	
	availableProviders: ['google', 'github', 'apple'],
	lastUsedProvider: null,
};

// Async thunks for authentication operations
export const signInWithEmail = createAsyncThunk(
	'auth/signInWithEmail',
	async ({ email, password, rememberMe = false }: { email: string; password: string; rememberMe?: boolean }, { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;

			return {
				user: data.user,
				session: data.session,
				rememberMe,
			};
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const signUpWithEmail = createAsyncThunk(
	'auth/signUpWithEmail',
	async ({ email, password, metadata = {} }: { email: string; password: string; metadata?: any }, { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: metadata,
					emailRedirectTo: `${window.location.origin}/auth/confirm`,
				},
			});

			if (error) throw error;

			return {
				user: data.user,
				session: data.session,
			};
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const signInWithProvider = createAsyncThunk(
	'auth/signInWithProvider',
	async (provider: 'google' | 'github' | 'apple', { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) throw error;

			return { provider };
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const signOut = createAsyncThunk(
	'auth/signOut',
	async (_, { rejectWithValue }) => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			return null;
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const refreshSession = createAsyncThunk(
	'auth/refreshSession',
	async (_, { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.refreshSession();
			if (error) throw error;
			
			return {
				user: data.user,
				session: data.session,
			};
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const updateUserProfile = createAsyncThunk(
	'auth/updateUserProfile',
	async (updates: { email?: string; password?: string; data?: any }, { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.updateUser(updates);
			if (error) throw error;
			
			return data.user;
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const resetPassword = createAsyncThunk(
	'auth/resetPassword',
	async (email: string, { rejectWithValue }) => {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`,
			});
			
			if (error) throw error;
			return email;
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

export const confirmEmail = createAsyncThunk(
	'auth/confirmEmail',
	async ({ token, email }: { token: string; email: string }, { rejectWithValue }) => {
		try {
			const { data, error } = await supabase.auth.verifyOtp({
				token_hash: token,
				type: 'signup',
				email,
			});

			if (error) throw error;
			
			return {
				user: data.user,
				session: data.session,
			};
		} catch (error) {
			return rejectWithValue((error as AuthError).message);
		}
	}
);

// Auth slice
const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		// Session management
		setSession: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
			const { user, session } = action.payload;
			state.user = user;
			state.session = session;
			state.isAuthenticated = !!user && !!session;
			
			if (session) {
				state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
			} else {
				state.sessionExpiry = null;
			}
		},

		clearSession: (state) => {
			state.user = null;
			state.session = null;
			state.isAuthenticated = false;
			state.sessionExpiry = null;
			state.lastSignIn = null;
		},

		// Error management
		clearErrors: (state) => {
			state.errors = initialState.errors;
		},

		clearError: (state, action: PayloadAction<keyof AuthState['errors']>) => {
			state.errors[action.payload] = null;
		},

		setError: (state, action: PayloadAction<{ type: keyof AuthState['errors']; message: string }>) => {
			const { type, message } = action.payload;
			state.errors[type] = message;
		},

		// User preferences
		updatePreferences: (state, action: PayloadAction<Partial<AuthState['preferences']>>) => {
			state.preferences = { ...state.preferences, ...action.payload };
		},

		// Remember me setting
		setRememberMe: (state, action: PayloadAction<boolean>) => {
			state.rememberMe = action.payload;
		},

		// Provider tracking
		setLastUsedProvider: (state, action: PayloadAction<string | null>) => {
			state.lastUsedProvider = action.payload;
		},

		// Initialize from stored session (on app start)
		initializeAuth: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
			const { user, session } = action.payload;
			if (user && session) {
				state.user = user;
				state.session = session;
				state.isAuthenticated = true;
				state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
			}
		},
	},

	extraReducers: (builder) => {
		// Sign in with email
		builder
			.addCase(signInWithEmail.pending, (state) => {
				state.loading.signIn = true;
				state.errors.signIn = null;
			})
			.addCase(signInWithEmail.fulfilled, (state, action) => {
				state.loading.signIn = false;
				const { user, session, rememberMe } = action.payload;
				state.user = user;
				state.session = session;
				state.isAuthenticated = !!user;
				state.lastSignIn = new Date().toISOString();
				state.rememberMe = rememberMe;
				state.lastUsedProvider = 'email';
				
				if (session) {
					state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
				}
			})
			.addCase(signInWithEmail.rejected, (state, action) => {
				state.loading.signIn = false;
				state.errors.signIn = action.payload as string;
			})

		// Sign up with email
		builder
			.addCase(signUpWithEmail.pending, (state) => {
				state.loading.signUp = true;
				state.errors.signUp = null;
			})
			.addCase(signUpWithEmail.fulfilled, (state, action) => {
				state.loading.signUp = false;
				const { user, session } = action.payload;
				// For email confirmation flow, user might be null initially
				if (user) {
					state.user = user;
					state.isAuthenticated = !!session;
				}
				if (session) {
					state.session = session;
					state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
				}
			})
			.addCase(signUpWithEmail.rejected, (state, action) => {
				state.loading.signUp = false;
				state.errors.signUp = action.payload as string;
			})

		// Sign in with OAuth provider
		builder
			.addCase(signInWithProvider.pending, (state) => {
				state.loading.signIn = true;
				state.errors.signIn = null;
			})
			.addCase(signInWithProvider.fulfilled, (state, action) => {
				state.loading.signIn = false;
				state.lastUsedProvider = action.payload.provider;
			})
			.addCase(signInWithProvider.rejected, (state, action) => {
				state.loading.signIn = false;
				state.errors.signIn = action.payload as string;
			})

		// Sign out
		builder
			.addCase(signOut.pending, (state) => {
				state.loading.signOut = true;
				state.errors.signOut = null;
			})
			.addCase(signOut.fulfilled, (state) => {
				state.loading.signOut = false;
				state.user = null;
				state.session = null;
				state.isAuthenticated = false;
				state.sessionExpiry = null;
				state.lastSignIn = null;
			})
			.addCase(signOut.rejected, (state, action) => {
				state.loading.signOut = false;
				state.errors.signOut = action.payload as string;
			})

		// Refresh session
		builder
			.addCase(refreshSession.pending, (state) => {
				state.loading.refresh = true;
				state.errors.refresh = null;
			})
			.addCase(refreshSession.fulfilled, (state, action) => {
				state.loading.refresh = false;
				const { user, session } = action.payload;
				state.user = user;
				state.session = session;
				state.isAuthenticated = !!user && !!session;
				
				if (session) {
					state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
				}
			})
			.addCase(refreshSession.rejected, (state, action) => {
				state.loading.refresh = false;
				state.errors.refresh = action.payload as string;
				// If refresh fails, clear the session
				state.user = null;
				state.session = null;
				state.isAuthenticated = false;
				state.sessionExpiry = null;
			})

		// Update user profile
		builder
			.addCase(updateUserProfile.pending, (state) => {
				state.loading.updateProfile = true;
				state.errors.updateProfile = null;
			})
			.addCase(updateUserProfile.fulfilled, (state, action) => {
				state.loading.updateProfile = false;
				state.user = action.payload;
			})
			.addCase(updateUserProfile.rejected, (state, action) => {
				state.loading.updateProfile = false;
				state.errors.updateProfile = action.payload as string;
			})

		// Reset password
		builder
			.addCase(resetPassword.pending, (state) => {
				state.loading.resetPassword = true;
				state.errors.resetPassword = null;
			})
			.addCase(resetPassword.fulfilled, (state) => {
				state.loading.resetPassword = false;
			})
			.addCase(resetPassword.rejected, (state, action) => {
				state.loading.resetPassword = false;
				state.errors.resetPassword = action.payload as string;
			})

		// Confirm email
		builder
			.addCase(confirmEmail.pending, (state) => {
				state.loading.confirmation = true;
				state.errors.confirmation = null;
			})
			.addCase(confirmEmail.fulfilled, (state, action) => {
				state.loading.confirmation = false;
				const { user, session } = action.payload;
				state.user = user;
				state.session = session;
				state.isAuthenticated = !!user && !!session;
				
				if (session) {
					state.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
				}
			})
			.addCase(confirmEmail.rejected, (state, action) => {
				state.loading.confirmation = false;
				state.errors.confirmation = action.payload as string;
			});
	},
});

// Export actions
export const {
	setSession,
	clearSession,
	clearErrors,
	clearError,
	setError,
	updatePreferences,
	setRememberMe,
	setLastUsedProvider,
	initializeAuth,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectSession = (state: RootState) => state.auth.session;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthErrors = (state: RootState) => state.auth.errors;
export const selectUserPreferences = (state: RootState) => state.auth.preferences;
export const selectSessionExpiry = (state: RootState) => state.auth.sessionExpiry;
export const selectRememberMe = (state: RootState) => state.auth.rememberMe;
export const selectLastUsedProvider = (state: RootState) => state.auth.lastUsedProvider;

// Derived selectors
export const selectIsSessionExpiring = (state: RootState) => {
	const expiry = state.auth.sessionExpiry;
	if (!expiry) return false;
	
	const expiryTime = new Date(expiry).getTime();
	const now = Date.now();
	const fiveMinutes = 5 * 60 * 1000;
	
	return expiryTime - now < fiveMinutes;
};

export const selectUserDisplayName = (state: RootState) => {
	const user = state.auth.user;
	if (!user) return null;
	
	return user.user_metadata?.display_name || 
		   user.user_metadata?.full_name || 
		   user.email?.split('@')[0] || 
		   'User';
};

export default authSlice;