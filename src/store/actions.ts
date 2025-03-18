import { store } from "@store/store";
import { supabase } from "@store/rest";
import * as actionTypes from "./actionTypes";
import { isEmpty } from "lodash";
import { Session } from "@supabase/supabase-js";
import { RootState, AppDispatch, Post } from "./types";

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
