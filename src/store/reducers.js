import _ from "lodash";
// import { reducer as formReducer } from 'redux-form';

import * as actionTypes from "./actionTypes";

const initialState = {
	app: {
		darkMode: false,
		devMode: false,
		notificationSegment: "Subscribed Users",

	},
	archive: [],
	user: {
		isLogged: false,
		credentials: [],
		userList: [],
		favouritePosts: []
	},
	toast: null,
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
		case actionTypes.BOOT:
			return {
				...state,
				tokenApp: action.payload
			};
		case actionTypes.APP_START:
			return {
				...state,
				configuration: action.payload
			};
		case actionTypes.SET_POST_FROM_NOTIFICATION:
			return {
				...state,
				postFromNotification: action.payload
			}
		case actionTypes.OPEN_POST_FROM_NOTIFICATION:
			return {
				...state,
				postFromNotification: {
					...state.postFromNotification,
					open: action.payload
				}
			}
		case actionTypes.CLEAR_POST_FROM_NOTIFICATION:
			return {
				...state,
				postFromNotification: {
					id: null,
					open: false
				}
			}
		case actionTypes.LOAD_TRACK:
			return {
				...state,
				track: action.payload
			}
		case actionTypes.UPDATE_POST_LIKES:
			return {
				...state,
				posts: action.payload
			};
		case actionTypes.LOAD_BLOG_POSTS:
			return {
				...state,
				posts: action.payload
			};
		case actionTypes.LOAD_ARCHIVE_POSTS:
			return {
				...state,
				archivePosts: action.payload
			};
		case actionTypes.DEV_MODE_SET:
			return {
				...state,
				devMode: true,
				notificationSegment: "TEST USERS"
			};
		case actionTypes.PROD_MODE_SET:
			return {
				...state,
				devMode: false,
				notificationSegment: "Subscribed Users"
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
		case actionTypes.SEND_NOTIFICATION_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
				notificationMessage: null,
			};
		case actionTypes.SEND_NOTIFICATION_START:
			return {
				...state,
				loading: true,
				notificationMessage: null,
			};
		case actionTypes.SEND_NOTIFICATION_SUCCESS:
			return {
				...state,
				loading: false,
				notificationMessage: action.message,
			};
		case actionTypes.ALL_COMMENTS_START:
			return {
				...state,
				loading: true,
			};
		case actionTypes.ALL_COMMENTS_FAIL:
			return {
				...state,
				loading: false,
				error: action.error,
			};
		case actionTypes.ALL_COMMENTS_SUCCESS:
			return {
				...state,
				loading: false,
				allComments: action.payload,
			};
		case actionTypes.COMMENT_UPDATE_START:
			return {
				...state,
				loading: true,
				error: false
			}
		case actionTypes.COMMENT_UPDATE_FAIL:
			return {
				...state,
				loading: false,
				error: action.payload
			}
		case actionTypes.COMMENT_UPDATE_SUCCESS:
			return {
				...state,
				loading: false,
				isMessageDelete: action.isMessageDelete,
				notificationMessage: action.payload
			}
		case actionTypes.SET_LANGUAGE:
			return {
				...state,
				language: action.payload
			}
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
				posts: action.payload
			};
		default:
			return state;
	}
}


const createRootReducer = {
	app, user, toast, posts
}

export default createRootReducer;