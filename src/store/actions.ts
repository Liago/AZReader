import { store } from "@store/store";
import { supabase } from "@store/rest";
import * as actionTypes from "./actionTypes";
import { isEmpty } from "lodash";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { RootState, AppDispatch, Post } from "./types";
import { authHelpers, dbHelpers } from "@common/supabase";
import { User as UserProfile } from "@common/database-types";

interface CommentResponse {
	[key: string]: any;
}

interface UserResponse {
	[key: string]: any;
}

interface PaginationData {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
}

interface Track {
	[key: string]: any;
}

interface Book {
	[key: string]: any;
}

export const submitNotificationPost = (postInfo: Post) => ({
	type: actionTypes.SET_POST_FROM_NOTIFICATION as typeof actionTypes.SET_POST_FROM_NOTIFICATION,
	payload: postInfo,
});

export const openNotificationPost = (open: boolean) => ({
	type: actionTypes.OPEN_POST_FROM_NOTIFICATION as typeof actionTypes.OPEN_POST_FROM_NOTIFICATION,
	payload: open,
});

export const clearNotificationPost = () => ({
	type: actionTypes.CLEAR_POST_FROM_NOTIFICATION as typeof actionTypes.CLEAR_POST_FROM_NOTIFICATION,
});

export const setAudioTrack = (track: Track) => ({
	type: actionTypes.LOAD_TRACK as typeof actionTypes.LOAD_TRACK,
	payload: track,
});

export const onUpdateAvatar = (avatarId: string) => ({
	type: actionTypes.UPDATE_AVATAR as typeof actionTypes.UPDATE_AVATAR,
	payload: avatarId,
});

export const setCurrentBook = (book: Book) => ({
	type: actionTypes.SET_CURRENT_BOOK as typeof actionTypes.SET_CURRENT_BOOK,
	payload: book,
});

export const setSelectedChapter = (chapterId: string) => ({
	type: actionTypes.SET_CURRENT_CHAPTER as typeof actionTypes.SET_CURRENT_CHAPTER,
	payload: chapterId,
});

export const setSelectedChapterPage = (pageId: string) => ({
	type: actionTypes.SET_CURRENT_CHAPTER_PAGE as typeof actionTypes.SET_CURRENT_CHAPTER_PAGE,
	payload: pageId,
});

export const setAppLanguage = (language: string) => ({
	type: actionTypes.SET_LANGUAGE as typeof actionTypes.SET_LANGUAGE,
	payload: language,
});

export const onSetBootData = (payload: any) => ({
	type: actionTypes.BOOT as typeof actionTypes.BOOT,
	payload,
});

export const onAppStart = (payload: any) => ({
	type: actionTypes.APP_START as typeof actionTypes.APP_START,
	payload,
});

export const replyCommentStart = () => ({
	type: actionTypes.REPLY_COMMENTS_START as typeof actionTypes.REPLY_COMMENTS_START,
	loading: true,
});

export const replyCommentSuccess = (response: CommentResponse) => ({
	type: actionTypes.REPLY_COMMENTS_SUCCESS as typeof actionTypes.REPLY_COMMENTS_SUCCESS,
	loading: false,
	payload: response,
});

export const replyCommentFail = (error: Error) => ({
	type: actionTypes.REPLY_COMMENTS_FAIL as typeof actionTypes.REPLY_COMMENTS_FAIL,
	loading: false,
	payload: error,
});

export const commentUpdateStart = () => ({
	type: actionTypes.COMMENT_UPDATE_START as typeof actionTypes.COMMENT_UPDATE_START,
	loading: true,
	payload: null,
});

export const commentUpdateSuccess = (response: CommentResponse, isDelete: boolean) => ({
	type: actionTypes.COMMENT_UPDATE_SUCCESS as typeof actionTypes.COMMENT_UPDATE_SUCCESS,
	loading: false,
	isMessageDelete: isDelete,
	payload: response,
});

export const commentUpdateFail = (error: Error) => ({
	type: actionTypes.COMMENT_UPDATE_FAIL as typeof actionTypes.COMMENT_UPDATE_FAIL,
	payload: error,
});

export const setDarkMode = (dark: boolean) => {
	if (dark) {
		return { type: actionTypes.DARK_MODE_SET as typeof actionTypes.DARK_MODE_SET };
	}
	return { type: actionTypes.NORMAL_MODE_SET as typeof actionTypes.NORMAL_MODE_SET };
};

export const setDevMode = (dark: boolean) => {
	if (dark) {
		return { type: actionTypes.DEV_MODE_SET as typeof actionTypes.DEV_MODE_SET };
	}
	return { type: actionTypes.PROD_MODE_SET as typeof actionTypes.PROD_MODE_SET };
};

export const allCommentsStart = () => ({
	type: actionTypes.ALL_COMMENTS_START as typeof actionTypes.ALL_COMMENTS_START,
});

export const allCommentsFail = (error: Error) => ({
	type: actionTypes.ALL_COMMENTS_FAIL as typeof actionTypes.ALL_COMMENTS_FAIL,
	payload: error,
});

export const allCommentsSuccess = (response: CommentResponse) => ({
	type: actionTypes.ALL_COMMENTS_SUCCESS as typeof actionTypes.ALL_COMMENTS_SUCCESS,
});

export const onToastClear = () => ({
	type: actionTypes.TOAST_CLEAR as typeof actionTypes.TOAST_CLEAR,
});

export const onToastSetValue = (payload: any) => ({
	type: actionTypes.TOAST_SET_VALUE as typeof actionTypes.TOAST_SET_VALUE,
	payload,
});

export const loadUserStart = () => ({
	type: actionTypes.LOAD_USER_START as typeof actionTypes.LOAD_USER_START,
	loading: true,
});

export const loadUserSuccess = (response: UserResponse) => ({
	type: actionTypes.LOAD_USER_SUCCESS as typeof actionTypes.LOAD_USER_SUCCESS,
	userList: response,
});

export const loadUserFail = (error: Error) => ({
	type: actionTypes.LOAD_USER_FAIL as typeof actionTypes.LOAD_USER_FAIL,
	error: error,
});

export const loadUserCommentsStart = () => ({
	type: actionTypes.LOAD_COMMENTS_START as typeof actionTypes.LOAD_COMMENTS_START,
});

export const loadUserCommentsSuccess = (response: CommentResponse) => ({
	type: actionTypes.LOAD_COMMENTS_SUCCESS as typeof actionTypes.LOAD_COMMENTS_SUCCESS,
	commentsList: response,
});

export const loadUserCommentsFail = (error: Error) => ({
	type: actionTypes.LOAD_COMMENTS_FAIL as typeof actionTypes.LOAD_COMMENTS_FAIL,
	error: error,
});

export const userRegistrationStart = () => ({
	type: actionTypes.USER_REGISTRATION_START as typeof actionTypes.USER_REGISTRATION_START,
});

export const userRegistrationFail = (error: Error) => ({
	type: actionTypes.USER_REGISTRATION_FAIL as typeof actionTypes.USER_REGISTRATION_FAIL,
	error: error,
});

export const userRegistrationSuccess = (response: UserResponse) => ({
	type: actionTypes.USER_REGISTRATION_SUCCESS as typeof actionTypes.USER_REGISTRATION_SUCCESS,
	message: response,
});

export const userDeleteStart = () => ({
	type: actionTypes.USER_DELETE_START as typeof actionTypes.USER_DELETE_START,
});

export const userDeleteFail = (error: Error) => ({
	type: actionTypes.USER_DELETE_FAIL as typeof actionTypes.USER_DELETE_FAIL,
	error: error,
});

export const userDeleteSuccess = (response: UserResponse) => ({
	type: actionTypes.USER_DELETE_SUCCESS as typeof actionTypes.USER_DELETE_SUCCESS,
	message: response,
	deleted: true,
});

export const loadBlogPosts = (response: Post[]) => ({
	type: actionTypes.LOAD_BLOG_POSTS as typeof actionTypes.LOAD_BLOG_POSTS,
	payload: response,
});

export const loadArchivePosts = (response: Post[]) => ({
	type: actionTypes.LOAD_ARCHIVE_POSTS as typeof actionTypes.LOAD_ARCHIVE_POSTS,
	payload: response,
});

export const updatePostLikes = (data: any) => ({
	type: actionTypes.UPDATE_POST_LIKES as typeof actionTypes.UPDATE_POST_LIKES,
	payload: data,
});

export const favouritesHandler = (post: Post, action: "ADD" | "REMOVE") => {
	const state = store.getState() as unknown as RootState;
	const { favouritePosts } = state.user;
	const { id: postId } = post;
	let newList = [...favouritePosts];

	switch (action) {
		case "ADD":
			isEmpty(favouritePosts) ? (newList = [post]) : newList.push(post);
			break;
		case "REMOVE":
			newList = favouritePosts.filter((item: Post) => item.id !== postId);
			break;
	}

	return {
		type: actionTypes.SET_FAVOURITES as typeof actionTypes.SET_FAVOURITES,
		payload: newList,
	};
};

export const savePost = (post: Post) => {
	const state = store.getState() as unknown as RootState;
	const { list } = state.posts;
	let newList = [...list];
	post["id"] = Date.now();

	isEmpty(list) ? (newList = [post]) : newList.push(post);

	return {
		type: actionTypes.SAVE_POST as typeof actionTypes.SAVE_POST,
		payload: newList,
	};
};

export const setUserToken = (payload: string) => ({
	type: actionTypes.LOGIN as typeof actionTypes.LOGIN,
	payload,
});

export const onLogout = () => ({
	type: actionTypes.LOGOUT as typeof actionTypes.LOGOUT,
});

export const setSession = (session: Session | null) => ({
	type: actionTypes.SET_SESSION as typeof actionTypes.SET_SESSION,
	payload: session,
});

export const clearSession = () => ({
	type: actionTypes.CLEAR_SESSION as typeof actionTypes.CLEAR_SESSION,
});

export const initializeSession = () => async (dispatch: AppDispatch) => {
	const {
		data: { session },
	} = await supabase.auth.getSession();
	dispatch(setSession(session));

	supabase.auth.onAuthStateChange((_event, session) => {
		dispatch(setSession(session));
	});
};

export const setPagination = (paginationData: PaginationData) => ({
	type: actionTypes.SET_PAGINATION as typeof actionTypes.SET_PAGINATION,
	payload: paginationData,
});

export const fetchPostsSuccess = (posts: Post[], totalItems: number) => ({
	type: actionTypes.FETCH_POSTS_SUCCESS as typeof actionTypes.FETCH_POSTS_SUCCESS,
	payload: { posts, totalItems },
});

export const appendPosts = (newPosts: Post[]) => ({
	type: actionTypes.APPEND_POSTS as typeof actionTypes.APPEND_POSTS,
	payload: newPosts,
});

export const resetPosts = () => ({
	type: actionTypes.RESET_POSTS as typeof actionTypes.RESET_POSTS,
});

export const increaseFontSize = () => ({
	type: actionTypes.INCREASE_FONT_SIZE as typeof actionTypes.INCREASE_FONT_SIZE,
});

export const decreaseFontSize = () => ({
	type: actionTypes.DECREASE_FONT_SIZE as typeof actionTypes.DECREASE_FONT_SIZE,
});

export const setTheme = (theme: string) => ({
	type: actionTypes.SET_THEME as typeof actionTypes.SET_THEME,
	payload: theme,
});

export const setThemeMode = (mode: string) => ({
	type: actionTypes.SET_THEME_MODE as typeof actionTypes.SET_THEME_MODE,
	payload: mode,
});

export const setBrightness = (brightness: number) => ({
	type: actionTypes.SET_BRIGHTNESS as typeof actionTypes.SET_BRIGHTNESS,
	payload: brightness,
});

export const setFontFamily = (fontFamily: string) => ({
	type: actionTypes.SET_FONT_FAMILY as typeof actionTypes.SET_FONT_FAMILY,
	payload: fontFamily,
});

export const setSpacing = (spacing: number) => ({
	type: actionTypes.SET_SPACING as typeof actionTypes.SET_SPACING,
	payload: spacing,
});

export const setWidth = (width: number) => ({
	type: actionTypes.SET_WIDTH as typeof actionTypes.SET_WIDTH,
	payload: width,
});

// Enhanced Auth Action Creators
export const authLoadingStart = () => ({
	type: actionTypes.AUTH_LOADING_START as typeof actionTypes.AUTH_LOADING_START,
});

export const authLoadingStop = () => ({
	type: actionTypes.AUTH_LOADING_STOP as typeof actionTypes.AUTH_LOADING_STOP,
});

export const authSetInitialLoading = (loading: boolean) => ({
	type: actionTypes.AUTH_SET_INITIAL_LOADING as typeof actionTypes.AUTH_SET_INITIAL_LOADING,
	payload: loading,
});

export const authSetUser = (user: User | null) => ({
	type: actionTypes.AUTH_SET_USER as typeof actionTypes.AUTH_SET_USER,
	payload: user,
});

export const authSetSession = (session: Session | null) => ({
	type: actionTypes.AUTH_SET_SESSION as typeof actionTypes.AUTH_SET_SESSION,
	payload: session,
});

export const authSetUserProfile = (userProfile: UserProfile | null) => ({
	type: actionTypes.AUTH_SET_USER_PROFILE as typeof actionTypes.AUTH_SET_USER_PROFILE,
	payload: userProfile,
});

export const authSetError = (error: AuthError | string | null) => ({
	type: actionTypes.AUTH_SET_ERROR as typeof actionTypes.AUTH_SET_ERROR,
	payload: error,
});

export const authClearError = () => ({
	type: actionTypes.AUTH_CLEAR_ERROR as typeof actionTypes.AUTH_CLEAR_ERROR,
});

// Sign Up Actions
export const authSignUpStart = () => ({
	type: actionTypes.AUTH_SIGN_UP_START as typeof actionTypes.AUTH_SIGN_UP_START,
});

export const authSignUpSuccess = () => ({
	type: actionTypes.AUTH_SIGN_UP_SUCCESS as typeof actionTypes.AUTH_SIGN_UP_SUCCESS,
});

export const authSignUpFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_SIGN_UP_FAIL as typeof actionTypes.AUTH_SIGN_UP_FAIL,
	payload: error,
});

// Sign In Actions
export const authSignInStart = () => ({
	type: actionTypes.AUTH_SIGN_IN_START as typeof actionTypes.AUTH_SIGN_IN_START,
});

export const authSignInSuccess = (user: User, session: Session) => ({
	type: actionTypes.AUTH_SIGN_IN_SUCCESS as typeof actionTypes.AUTH_SIGN_IN_SUCCESS,
	payload: { user, session },
});

export const authSignInFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_SIGN_IN_FAIL as typeof actionTypes.AUTH_SIGN_IN_FAIL,
	payload: error,
});

// Sign Out Actions
export const authSignOutStart = () => ({
	type: actionTypes.AUTH_SIGN_OUT_START as typeof actionTypes.AUTH_SIGN_OUT_START,
});

export const authSignOutSuccess = () => ({
	type: actionTypes.AUTH_SIGN_OUT_SUCCESS as typeof actionTypes.AUTH_SIGN_OUT_SUCCESS,
});

export const authSignOutFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_SIGN_OUT_FAIL as typeof actionTypes.AUTH_SIGN_OUT_FAIL,
	payload: error,
});

// Password Reset Actions
export const authPasswordResetStart = () => ({
	type: actionTypes.AUTH_PASSWORD_RESET_START as typeof actionTypes.AUTH_PASSWORD_RESET_START,
});

export const authPasswordResetSuccess = () => ({
	type: actionTypes.AUTH_PASSWORD_RESET_SUCCESS as typeof actionTypes.AUTH_PASSWORD_RESET_SUCCESS,
});

export const authPasswordResetFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_PASSWORD_RESET_FAIL as typeof actionTypes.AUTH_PASSWORD_RESET_FAIL,
	payload: error,
});

// Profile Update Actions
export const authProfileUpdateStart = () => ({
	type: actionTypes.AUTH_PROFILE_UPDATE_START as typeof actionTypes.AUTH_PROFILE_UPDATE_START,
});

export const authProfileUpdateSuccess = (userProfile: UserProfile) => ({
	type: actionTypes.AUTH_PROFILE_UPDATE_SUCCESS as typeof actionTypes.AUTH_PROFILE_UPDATE_SUCCESS,
	payload: userProfile,
});

export const authProfileUpdateFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_PROFILE_UPDATE_FAIL as typeof actionTypes.AUTH_PROFILE_UPDATE_FAIL,
	payload: error,
});

// Session Refresh Actions
export const authSessionRefreshStart = () => ({
	type: actionTypes.AUTH_SESSION_REFRESH_START as typeof actionTypes.AUTH_SESSION_REFRESH_START,
});

export const authSessionRefreshSuccess = (user: User, session: Session) => ({
	type: actionTypes.AUTH_SESSION_REFRESH_SUCCESS as typeof actionTypes.AUTH_SESSION_REFRESH_SUCCESS,
	payload: { user, session },
});

export const authSessionRefreshFail = (error: AuthError | string) => ({
	type: actionTypes.AUTH_SESSION_REFRESH_FAIL as typeof actionTypes.AUTH_SESSION_REFRESH_FAIL,
	payload: error,
});

// Thunk Actions for Async Operations
export const authSignUp = (email: string, password: string, userData?: { name?: string }) => 
	async (dispatch: AppDispatch) => {
		dispatch(authSignUpStart());
		
		try {
			const { user, error } = await authHelpers.signUp(email, password, {
				data: userData
			});
			
			if (error) {
				dispatch(authSignUpFail(error));
				return { error };
			}
			
			dispatch(authSignUpSuccess());
			return { error: null };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Sign up failed';
			dispatch(authSignUpFail(errorMsg));
			return { error: errorMsg as any };
		}
	};

export const authSignIn = (email: string, password: string) => 
	async (dispatch: AppDispatch) => {
		dispatch(authSignInStart());
		
		try {
			const { user, session, error } = await authHelpers.signInWithPassword(email, password);
			
			if (error) {
				dispatch(authSignInFail(error));
				return { error };
			}
			
			if (user && session) {
				dispatch(authSignInSuccess(user, session));
				// Load user profile
				dispatch(authLoadUserProfile(user.id));
			}
			
			return { error: null };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
			dispatch(authSignInFail(errorMsg));
			return { error: errorMsg as any };
		}
	};

export const authSignOut = () => 
	async (dispatch: AppDispatch) => {
		dispatch(authSignOutStart());
		
		try {
			const { error } = await (authHelpers.secureSignOut || authHelpers.signOut)();
			
			if (error) {
				dispatch(authSignOutFail(error));
				return { error };
			}
			
			dispatch(authSignOutSuccess());
			return { error: null };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Sign out failed';
			dispatch(authSignOutFail(errorMsg));
			return { error: errorMsg as any };
		}
	};

export const authResetPassword = (email: string) => 
	async (dispatch: AppDispatch) => {
		dispatch(authPasswordResetStart());
		
		try {
			const { error } = await authHelpers.resetPassword(email);
			
			if (error) {
				dispatch(authPasswordResetFail(error));
				return { error };
			}
			
			dispatch(authPasswordResetSuccess());
			return { error: null };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Password reset failed';
			dispatch(authPasswordResetFail(errorMsg));
			return { error: errorMsg as any };
		}
	};

export const authUpdateProfile = (updates: {
	name?: string;
	avatar_url?: string;
	bio?: string;
	website?: string;
	is_public?: boolean;
}) => async (dispatch: AppDispatch, getState: () => RootState) => {
	const { auth } = getState();
	
	if (!auth.user) {
		const error = 'No user logged in';
		dispatch(authProfileUpdateFail(error));
		return { error };
	}

	dispatch(authProfileUpdateStart());
	
	try {
		const { data, error } = await dbHelpers.updateUserProfile(auth.user.id, updates);
		
		if (error) {
			dispatch(authProfileUpdateFail(error.message || 'Profile update failed'));
			return { error };
		}
		
		if (data) {
			dispatch(authProfileUpdateSuccess(data));
		}
		
		return { error: null };
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : 'Profile update failed';
		dispatch(authProfileUpdateFail(errorMsg));
		return { error: errorMsg as any };
	}
};

export const authRefreshSession = () => 
	async (dispatch: AppDispatch) => {
		dispatch(authSessionRefreshStart());
		
		try {
			const { user, session, error } = await authHelpers.refreshSession();
			
			if (error) {
				dispatch(authSessionRefreshFail(error));
				return { error };
			}
			
			if (user && session) {
				dispatch(authSessionRefreshSuccess(user, session));
				// Load user profile
				dispatch(authLoadUserProfile(user.id));
			}
			
			return { error: null };
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Session refresh failed';
			dispatch(authSessionRefreshFail(errorMsg));
			return { error: errorMsg as any };
		}
	};

export const authLoadUserProfile = (userId: string) => 
	async (dispatch: AppDispatch) => {
		try {
			const { data, error } = await dbHelpers.getUserProfile(userId);
			if (error) {
				console.error('Error loading user profile:', error);
				return;
			}
			dispatch(authSetUserProfile(data));
		} catch (err) {
			console.error('Error loading user profile:', err);
		}
	};

export const authSyncUserProfile = (user: User) => 
	async (dispatch: AppDispatch) => {
		try {
			const { data, error } = await dbHelpers.upsertUserProfile({
				id: user.id,
				email: user.email || '',
				name: user.user_metadata?.name || user.user_metadata?.full_name || null,
				avatar_url: user.user_metadata?.avatar_url || null,
				auth_provider: user.app_metadata?.provider || 'email',
				is_public: false
			});
			
			if (error) {
				console.error('Error syncing user profile:', error);
				return;
			}
			
			dispatch(authSetUserProfile(data));
		} catch (err) {
			console.error('Error syncing user profile:', err);
		}
	};

// Enhanced session initialization with Redux integration
export const initializeAuthSession = () => async (dispatch: AppDispatch) => {
	dispatch(authSetInitialLoading(true));
	
	try {
		const { user, session, error } = await authHelpers.getCurrentSession();
		
		if (error) {
			console.error('Error getting initial session:', error);
			dispatch(authSetError(error));
		} else if (user && session) {
			dispatch(authSetUser(user));
			dispatch(authSetSession(session));
			dispatch(authLoadUserProfile(user.id));
		}
	} catch (err) {
		console.error('Error getting initial session:', err);
		const errorMsg = err instanceof Error ? err.message : 'Failed to get session';
		dispatch(authSetError(errorMsg));
	} finally {
		dispatch(authSetInitialLoading(false));
	}

	// Set up auth state listener
	authHelpers.onAuthStateChange(async (event, session) => {
		console.log('Auth state changed:', event, session?.user?.id);
		
		if (session?.user) {
			dispatch(authSetUser(session.user));
			dispatch(authSetSession(session));
			dispatch(authSyncUserProfile(session.user));
		} else {
			dispatch(authSetUser(null));
			dispatch(authSetSession(null));
			dispatch(authSetUserProfile(null));
		}
		
		// Clear loading states on auth events
		dispatch(authLoadingStop());
		dispatch(authSetInitialLoading(false));
	});
};
