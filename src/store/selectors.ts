// Auth selectors for clean state access
import { RootState } from './reducers';

// Base auth selector
const selectAuthState = (state: RootState) => state.auth;

// Auth user selectors
export const selectUser = (state: RootState) => selectAuthState(state).user;

export const selectUserId = (state: RootState) => selectUser(state)?.id || null;
export const selectUserEmail = (state: RootState) => selectUser(state)?.email || null;
export const selectUserMetadata = (state: RootState) => selectUser(state)?.user_metadata || null;

// Auth session selectors
export const selectSession = (state: RootState) => selectAuthState(state).session;
export const selectAccessToken = (state: RootState) => selectSession(state)?.access_token || null;
export const selectRefreshToken = (state: RootState) => selectSession(state)?.refresh_token || null;
export const selectSessionExpiresAt = (state: RootState) => selectSession(state)?.expires_at || null;

// User profile selectors
export const selectUserProfile = (state: RootState) => selectAuthState(state).userProfile;
export const selectUserProfileName = (state: RootState) => selectUserProfile(state)?.name || null;
export const selectUserProfileAvatar = (state: RootState) => selectUserProfile(state)?.avatar_url || null;
export const selectUserProfileBio = (state: RootState) => selectUserProfile(state)?.bio || null;

// Auth status selectors
export const selectIsAuthenticated = (state: RootState) => !!(selectUser(state) && selectSession(state));
export const selectIsInitialLoading = (state: RootState) => selectAuthState(state).initialLoading;
export const selectIsLoading = (state: RootState) => selectAuthState(state).loading;
export const selectAuthError = (state: RootState) => selectAuthState(state).error;

// Operation loading selectors
export const selectOperationLoading = (state: RootState) => selectAuthState(state).operationLoading;
export const selectIsSigningUp = (state: RootState) => selectOperationLoading(state).signUp;
export const selectIsSigningIn = (state: RootState) => selectOperationLoading(state).signIn;
export const selectIsSigningOut = (state: RootState) => selectOperationLoading(state).signOut;
export const selectIsResettingPassword = (state: RootState) => selectOperationLoading(state).passwordReset;
export const selectIsUpdatingProfile = (state: RootState) => selectOperationLoading(state).profileUpdate;
export const selectIsRefreshingSession = (state: RootState) => selectOperationLoading(state).sessionRefresh;

// Complex selectors
export const selectUserDisplayName = (state: RootState) => {
  const user = selectUser(state);
  const profile = selectUserProfile(state);
  return profile?.name || 
         user?.user_metadata?.name || 
         user?.user_metadata?.full_name || 
         user?.email?.split('@')[0] || 
         'Anonymous User';
};

export const selectUserDisplayAvatar = (state: RootState) => {
  const user = selectUser(state);
  const profile = selectUserProfile(state);
  return profile?.avatar_url || 
         user?.user_metadata?.avatar_url || 
         null;
};

export const selectAuthProvider = (state: RootState) => {
  const user = selectUser(state);
  const profile = selectUserProfile(state);
  return profile?.auth_provider || 
         user?.app_metadata?.provider || 
         'email';
};

export const selectIsSessionValid = (state: RootState) => {
  const session = selectSession(state);
  if (!session || !session.expires_at) return false;
  
  const expiresAt = session.expires_at * 1000; // Convert to milliseconds
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return expiresAt > now + bufferTime;
};

export const selectTimeUntilExpiry = (state: RootState) => {
  const session = selectSession(state);
  if (!session || !session.expires_at) return null;
  
  const expiresAt = session.expires_at * 1000; // Convert to milliseconds
  const now = Date.now();
  
  return Math.max(0, expiresAt - now);
};

// Convenience selector for React components
export const selectAuthSummary = (state: RootState) => {
  const isAuthenticated = selectIsAuthenticated(state);
  const user = selectUser(state);
  const userProfile = selectUserProfile(state);
  const initialLoading = selectIsInitialLoading(state);
  const loading = selectIsLoading(state);
  const error = selectAuthError(state);

  return {
    isAuthenticated,
    user,
    userProfile,
    initialLoading,
    loading,
    error,
    displayName: userProfile?.name || 
                 user?.user_metadata?.name || 
                 user?.user_metadata?.full_name || 
                 user?.email?.split('@')[0] || 
                 'Anonymous User',
    displayAvatar: userProfile?.avatar_url || 
                   user?.user_metadata?.avatar_url || 
                   null,
  };
};

// Legacy selectors for backward compatibility
export const selectLegacyUser = (state: RootState) => {
  const auth = selectAuthState(state);
  return {
    isLogged: !!(auth.user && auth.session),
    credentials: auth.user || {},
    userProfile: auth.userProfile,
  };
};