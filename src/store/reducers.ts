import * as actionTypes from "./actionTypes";
import { AnyAction } from "redux";

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

interface Post {
	id: string | number;
	[key: string]: any;
}

interface PaginationState {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
}

interface PostsState {
	list: Post[];
	pagination: PaginationState;
}

interface RootState {
	app: AppState;
	archive: any[];
	user: UserState;
	toast: any;
	posts: PostsState;
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
	},
	archive: [],
	user: {
		isLogged: false,
		credentials: {},
		userList: [],
		favouritePosts: [],
	},
	toast: null,
	posts: {
		list: [],
		pagination: {
			currentPage: 1,
			itemsPerPage: 10,
			totalItems: 0,
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

const posts = (state = initialState.posts, action: AnyAction): PostsState => {
	switch (action.type) {
		case actionTypes.FETCH_POSTS_SUCCESS:
			return {
				...state,
				list: action.payload.posts,
				pagination: {
					...state.pagination,
					totalItems: action.payload.totalItems,
				},
			};
		case actionTypes.APPEND_POSTS:
			const newPosts = action.payload.filter((newPost: Post) => !state.list.some((existingPost) => existingPost.id === newPost.id));
			return {
				...state,
				list: [...state.list, ...newPosts],
			};
		case actionTypes.SET_PAGINATION:
			return {
				...state,
				pagination: {
					...state.pagination,
					...action.payload,
				},
			};
		case actionTypes.RESET_POSTS:
			return initialState.posts;
		case actionTypes.SAVE_POST:
			return {
				...state,
				list: action.payload,
			};
		default:
			return state;
	}
};

const createRootReducer = {
	app,
	user,
	toast,
	posts,
};

export type { RootState, AppState, UserState, PostsState, Post };
export default createRootReducer;
