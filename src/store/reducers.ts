import * as actionTypes from "./actionTypes";
import { AnyAction } from "redux";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { User as UserProfile } from "@common/database-types";
import postsSlice, { PostsState as NewPostsState, Post as NewPost } from "./slices/postsSlice";

const fontSizes = ["xs", "sm", "base", "lg", "xl", "2xl"];

// Interfaces per gli stati
interface AppState {
	darkMode: boolean;
	devMode: boolean;
	notificationSegment: string;
	tokenApp: string | null;
	tokenExpiration: string | null;
	configuration?: any;
	fontSize: string;
	theme: string;
	themeMode: string; // auto, light, dark
	brightness: number;
	fontFamily: string;
	spacing: number;
	width: number;
}
interface Credentials {
	avatar?: string;
	[key: string]: any;
}

interface UserState {
	isLogged: boolean;
	credentials: Credentials;
	userList: any[];
	favouritePosts: any[];
	loading?: boolean;
	loaded?: boolean;
	error?: any;
	message?: any;
	created?: boolean;
	deleted?: boolean;
	commentsList?: any[];
	replied?: boolean;
}

// Enhanced Auth State for Supabase integration
interface AuthState {
	user: User | null;
	session: Session | null;
	userProfile: UserProfile | null;
	loading: boolean;
	initialLoading: boolean;
	error: AuthError | string | null;
	operationLoading: {
		signUp: boolean;
		signIn: boolean;
		signOut: boolean;
		passwordReset: boolean;
		profileUpdate: boolean;
		sessionRefresh: boolean;
	};
}

interface RootState {
	app: AppState;
	archive: any[];
	user: UserState;
	auth: AuthState;
	toast: any;
	posts: NewPostsState;
	loading: boolean;
	error: null;
}

// Stato iniziale
const initialState: RootState = {
	app: {
		darkMode: false,
		devMode: false,
		notificationSegment: "Subscribed Users",
		tokenApp: null,
		tokenExpiration: null,
		fontSize: "base",
		theme: "white",
		themeMode: "auto", // Default: auto (segue impostazioni sistema)
		brightness: 50,
		fontFamily: "New York",
		spacing: 1,
		width: 1,
	},
	archive: [],
	user: {
		isLogged: false,
		credentials: {},
		userList: [],
		favouritePosts: [],
	},
	auth: {
		user: null,
		session: null,
		userProfile: null,
		loading: false,
		initialLoading: true,
		error: null,
		operationLoading: {
			signUp: false,
			signIn: false,
			signOut: false,
			passwordReset: false,
			profileUpdate: false,
			sessionRefresh: false,
		},
	},
	toast: null,
	posts: {
		items: [],
		currentPost: null,
		favourites: [],
		pagination: {
			currentPage: 1,
			itemsPerPage: 20,
			totalItems: 0,
			hasNextPage: false,
			hasPreviousPage: false,
		},
		filters: {
			tags: [],
			dateRange: {
				start: null,
				end: null,
			},
			readStatus: 'all',
			favouritesOnly: false,
			searchQuery: '',
			sortBy: 'created_at',
			sortOrder: 'desc',
		},
		loading: {
			fetchPosts: false,
			createPost: false,
			updatePost: false,
			deletePost: false,
			searchPosts: false,
		},
		errors: {
			fetch: null,
			create: null,
			update: null,
			delete: null,
			search: null,
		},
	},
	loading: false,
	error: null,
};

const toast = (state = initialState.toast, action: AnyAction) => {
	switch (action.type) {
		case actionTypes.TOAST_CLEAR:
			return initialState.toast;
		case actionTypes.TOAST_SET_VALUE:
			return { ...action.payload };
		default:
			return state;
	}
};

const app = (state = initialState.app, action: AnyAction): AppState => {
	console.log('Reducer app: action ricevuta =', action.type, action.payload);

	switch (action.type) {
		case actionTypes.LOGIN:
			return {
				...state,
				tokenApp: action.payload.token,
				tokenExpiration: action.payload.expiration,
			};
		case actionTypes.LOGOUT:
			return {
				...state,
				tokenApp: null,
				tokenExpiration: null,
			};
		case actionTypes.APP_START:
			return {
				...state,
				configuration: action.payload,
			};
		case actionTypes.DARK_MODE_SET:
			return {
				...state,
				darkMode: true,
			};
		case actionTypes.NORMAL_MODE_SET:
			return {
				...state,
				darkMode: false,
			};
		case actionTypes.INCREASE_FONT_SIZE:
			const currentSizeIndex = fontSizes.indexOf(state.fontSize);
			// Verifichiamo che l'indice sia valido e che esista un elemento successivo
			const nextSize =
				currentSizeIndex < fontSizes.length - 1 && currentSizeIndex !== -1
					? fontSizes[currentSizeIndex + 1] ?? state.fontSize
					: state.fontSize;

			return {
				...state,
				fontSize: nextSize,
			};
		case actionTypes.DECREASE_FONT_SIZE:
			const sizeIndex = fontSizes.indexOf(state.fontSize);
			// Verifichiamo che l'indice sia valido e che esista un elemento precedente
			const prevSize = sizeIndex > 0 && sizeIndex !== -1 ? fontSizes[sizeIndex - 1] ?? state.fontSize : state.fontSize;

			return {
				...state,
				fontSize: prevSize,
			};
		case actionTypes.SET_THEME:
			console.log('SET_THEME: cambio tema a', action.payload);
			return {
				...state,
				theme: action.payload,
			};
		case actionTypes.SET_THEME_MODE:
			console.log('SET_THEME_MODE: cambio modalità tema a', action.payload, 'darkMode =', action.payload === "dark");
			return {
				...state,
				themeMode: action.payload,
				// Se impostiamo manualmente il tema, aggiorniamo anche darkMode
				darkMode: action.payload === "dark",
			};
		case actionTypes.SET_BRIGHTNESS:
			return {
				...state,
				brightness: action.payload,
			};
		case actionTypes.SET_FONT_FAMILY:
			return {
				...state,
				fontFamily: action.payload,
			};
		case actionTypes.SET_SPACING:
			return {
				...state,
				spacing: action.payload,
			};
		case actionTypes.SET_WIDTH:
			return {
				...state,
				width: action.payload,
			};
		default:
			return state;
	}
};

const user = (state = initialState.user, action: AnyAction): UserState => {
	switch (action.type) {
		case actionTypes.SET_SESSION:
			return {
				...state,
				isLogged: !!action.payload,
				credentials: action.payload, //? action.payload.user : [],
			};
		case actionTypes.CLEAR_SESSION:
			return {
				...state,
				isLogged: false,
				credentials: [],
			};
		case actionTypes.UPDATE_AVATAR:
			return {
				...state,
				credentials: {
					...state.credentials,
					avatar: action.payload,
				},
			};
		case actionTypes.LOGIN:
			return {
				...state,
				isLogged: true,
				credentials: action.payload,
			};
		case actionTypes.LOGOUT:
			return {
				...state,
				isLogged: false,
				credentials: [],
			};
		case actionTypes.LOAD_USER_START:
			return {
				...state,
				loading: true,
			};
		case actionTypes.LOAD_USER_SUCCESS:
			console.log("action", action);
			return {
				...state,
				loading: false,
				loaded: true,
				userList: action.userList.data,
			};
		case actionTypes.LOAD_USER_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
			};
		case actionTypes.USER_REGISTRATION_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
				message: null,
			};
		case actionTypes.USER_REGISTRATION_SUCCESS:
			return {
				...state,
				loading: false,
				created: true,
				message: action.message,
			};
		case actionTypes.USER_REGISTRATION_START:
			return {
				...state,
				loading: true,
				message: null,
			};
		case actionTypes.USER_DELETE_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
				message: null,
			};
		case actionTypes.USER_DELETE_SUCCESS:
			return {
				...state,
				loading: false,
				deleted: true,
				message: action.message,
			};
		case actionTypes.USER_DELETE_START:
			return {
				...state,
				loading: true,
				message: null,
			};
		case actionTypes.LOAD_COMMENTS_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
				commentsList: [],
			};
		case actionTypes.LOAD_COMMENTS_SUCCESS:
			return {
				...state,
				loading: false,
				commentsList: action.commentsList,
			};
		case actionTypes.LOAD_COMMENTS_START:
			return {
				...state,
				loading: true,
				commentsList: [],
			};
		case actionTypes.REPLY_COMMENTS_FAIL:
			return {
				...state,
				loading: false,
				error: action.payload,
				replied: false,
			};
		case actionTypes.REPLY_COMMENTS_SUCCESS:
			return {
				...state,
				loading: false,
				replied: action.payload,
			};
		case actionTypes.REPLY_COMMENTS_START:
			return {
				...state,
				loading: true,
				replied: false,
			};
		case actionTypes.SET_FAVOURITES:
			return {
				...state,
				favouritePosts: action.payload,
			};
		default:
			return state;
	}
};

// Old posts reducer removed - now using postsSlice.reducer

const auth = (state = initialState.auth, action: AnyAction): AuthState => {
	switch (action.type) {
		case actionTypes.AUTH_LOADING_START:
			return {
				...state,
				loading: true,
			};
		case actionTypes.AUTH_LOADING_STOP:
			return {
				...state,
				loading: false,
			};
		case actionTypes.AUTH_SET_INITIAL_LOADING:
			return {
				...state,
				initialLoading: action.payload,
			};
		case actionTypes.AUTH_SET_USER:
			return {
				...state,
				user: action.payload,
			};
		case actionTypes.AUTH_SET_SESSION:
			return {
				...state,
				session: action.payload,
			};
		case actionTypes.AUTH_SET_USER_PROFILE:
			return {
				...state,
				userProfile: action.payload,
			};
		case actionTypes.AUTH_SET_ERROR:
			return {
				...state,
				error: action.payload,
			};
		case actionTypes.AUTH_CLEAR_ERROR:
			return {
				...state,
				error: null,
			};
		// Sign Up Operations
		case actionTypes.AUTH_SIGN_UP_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signUp: true,
				},
				error: null,
			};
		case actionTypes.AUTH_SIGN_UP_SUCCESS:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signUp: false,
				},
			};
		case actionTypes.AUTH_SIGN_UP_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signUp: false,
				},
				error: action.payload,
			};
		// Sign In Operations
		case actionTypes.AUTH_SIGN_IN_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signIn: true,
				},
				error: null,
			};
		case actionTypes.AUTH_SIGN_IN_SUCCESS:
			return {
				...state,
				user: action.payload.user,
				session: action.payload.session,
				operationLoading: {
					...state.operationLoading,
					signIn: false,
				},
			};
		case actionTypes.AUTH_SIGN_IN_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signIn: false,
				},
				error: action.payload,
			};
		// Sign Out Operations
		case actionTypes.AUTH_SIGN_OUT_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signOut: true,
				},
				error: null,
			};
		case actionTypes.AUTH_SIGN_OUT_SUCCESS:
			return {
				...state,
				user: null,
				session: null,
				userProfile: null,
				operationLoading: {
					...state.operationLoading,
					signOut: false,
				},
			};
		case actionTypes.AUTH_SIGN_OUT_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					signOut: false,
				},
				error: action.payload,
			};
		// Password Reset Operations
		case actionTypes.AUTH_PASSWORD_RESET_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					passwordReset: true,
				},
				error: null,
			};
		case actionTypes.AUTH_PASSWORD_RESET_SUCCESS:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					passwordReset: false,
				},
			};
		case actionTypes.AUTH_PASSWORD_RESET_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					passwordReset: false,
				},
				error: action.payload,
			};
		// Profile Update Operations
		case actionTypes.AUTH_PROFILE_UPDATE_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					profileUpdate: true,
				},
				error: null,
			};
		case actionTypes.AUTH_PROFILE_UPDATE_SUCCESS:
			return {
				...state,
				userProfile: action.payload,
				operationLoading: {
					...state.operationLoading,
					profileUpdate: false,
				},
			};
		case actionTypes.AUTH_PROFILE_UPDATE_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					profileUpdate: false,
				},
				error: action.payload,
			};
		// Session Refresh Operations
		case actionTypes.AUTH_SESSION_REFRESH_START:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					sessionRefresh: true,
				},
				error: null,
			};
		case actionTypes.AUTH_SESSION_REFRESH_SUCCESS:
			return {
				...state,
				user: action.payload.user,
				session: action.payload.session,
				operationLoading: {
					...state.operationLoading,
					sessionRefresh: false,
				},
			};
		case actionTypes.AUTH_SESSION_REFRESH_FAIL:
			return {
				...state,
				operationLoading: {
					...state.operationLoading,
					sessionRefresh: false,
				},
				error: action.payload,
			};
		// Legacy session actions for backward compatibility
		case actionTypes.SET_SESSION:
			const session = action.payload;
			return {
				...state,
				user: session?.user || null,
				session: session,
				initialLoading: false,
			};
		case actionTypes.CLEAR_SESSION:
			return {
				...state,
				user: null,
				session: null,
				userProfile: null,
				initialLoading: false,
			};
		default:
			return state;
	}
};

const createRootReducer = {
	app,
	user,
	auth,
	toast,
	posts: postsSlice.reducer,
};

// Re-export PostsState and Post from postsSlice to avoid conflicts
export type { PostsState, Post } from "./slices/postsSlice";
export type { RootState, AppState, UserState, AuthState };
export default createRootReducer;
