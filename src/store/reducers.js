
import * as actionTypes from "./actionTypes";

const initialState = {
	app: {
		darkMode: false,
		devMode: false,
		notificationSegment: "Subscribed Users",
		tokenApp: null,
		tokenExpiration: null,
	},
	archive: [],
	user: {
		isLogged: false,
		credentials: [],
		userList: [],
		favouritePosts: []
	},
	toast: null,
	posts: {
		list: []
	}
};
const toast = (state = initialState.toast, action) => {
	switch (action.type) {
		case actionTypes.TOAST_CLEAR:
			return initialState.toast
		case actionTypes.TOAST_SET_VALUE:
			return { ...action.payload };
		default:
			return state;
	}
}
const app = (state = initialState.app, action) => {
	switch (action.type) {
		case actionTypes.LOGIN:
			return {
				...state,
				tokenApp: action.payload.accessToken,
				tokenExpiration: action.payload.stsTokenManager.expirationTime
			};
		case actionTypes.LOGOUT:
			return {
				...state,
				tokenApp: null,
				tokenExpiration: null 
			};
		case actionTypes.APP_START:
			return {
				...state,
				configuration: action.payload
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
		default:
			return state;
	}
};
const user = (state = initialState.user, action) => {
	switch (action.type) {
		case actionTypes.UPDATE_AVATAR:
			return {
				...state,
				credentials: {
					...state.credentials,
					avatar: action.payload
				}
			};
		case actionTypes.LOGIN:
			return {
				...state,
				isLogged: true,
				credentials: action.payload
			};
		case actionTypes.LOGOUT:
			return {
				...state,
				isLogged: false,
				credentials: []
			}
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
				replied: false
			};
		case actionTypes.SET_FAVOURITES:
			return {
				...state,
				favouritePosts: action.payload
			}
		default:
			return state;
	}
};
const posts = (state = initialState.posts, action) => {
	switch (action.type) {
		case actionTypes.SAVE_POST:
			return {
				...state,
				list: action.payload,
			};
		default:
			return state;
	}
}


const createRootReducer = {
	app, user, toast, posts
}

export default createRootReducer;