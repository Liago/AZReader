import { store } from "./store";
import * as actionTypes from "./actionTypes";

import { supabase } from "./rest";

import { isEmpty } from "lodash"


export const submitNotificationPost = (postInfo) => {
	return {
		type: actionTypes.SET_POST_FROM_NOTIFICATION,
		payload: postInfo
	}
}

export const openNotificationPost = (open) => {
	return {
		type: actionTypes.OPEN_POST_FROM_NOTIFICATION,
		payload: open
	}
}

export const clearNotificationPost = () => {
	return { type: actionTypes.CLEAR_POST_FROM_NOTIFICATION }
}

export const setAudioTrack = (track) => {
	return {
		type: actionTypes.LOAD_TRACK,
		payload: track
	}
}

export const onUpdateAvatar = (avatarId) => {
	return {
		type: actionTypes.UPDATE_AVATAR,
		payload: avatarId,
	}
}

export const setCurrentBook = (book) => {
	return {
		type: actionTypes.SET_CURRENT_BOOK,
		payload: book
	}
}
export const setSelectedChapter = (chapterId) => {
	return {
		type: actionTypes.SET_CURRENT_CHAPTER,
		payload: chapterId
	}
}
export const setSelectedChapterPage = (pageId) => {
	return {
		type: actionTypes.SET_CURRENT_CHAPTER_PAGE,
		payload: pageId
	}
}

export const setAppLanguage = (language) => {
	return {
		type: actionTypes.SET_LANGUAGE,
		payload: language
	}
}
export const onSetBootData = (payload) => {
	return {
		type: actionTypes.BOOT,
		payload: payload
	};
};
export const onAppStart = (payload) => {
	return {
		type: actionTypes.APP_START,
		payload: payload
	};

}

export const replyCommentStart = () => {
	return {
		type: actionTypes.REPLY_COMMENTS_START,
		loading: true
	}
}
export const replyCommentSuccess = (response) => {
	return {
		type: actionTypes.REPLY_COMMENTS_SUCCESS,
		loading: false,
		payload: response
	}
}
export const replyCommentFail = (error) => {
	return {
		type: actionTypes.REPLY_COMMENTS_FAIL,
		loading: false,
		payload: error
	}
}
export const commentUpdateStart = () => {
	return {
		type: actionTypes.COMMENT_UPDATE_START,
		loading: true,
		payload: null
	}
}
export const commentUpdateSuccess = (response, isDelete) => {
	return {
		type: actionTypes.COMMENT_UPDATE_SUCCESS,
		loading: false,
		isMessageDelete: isDelete,
		payload: response
	}
}
export const commentUpdateFail = (error) => {
	return {
		type: actionTypes.COMMENT_UPDATE_FAIL,
		payload: error
	}
}


export const setDarkMode = (dark) => {
	if (dark) {
		return {
			type: actionTypes.DARK_MODE_SET,
		};
	} else {
		return {
			type: actionTypes.NORMAL_MODE_SET,
		};
	}
};
export const setDevMode = (dark) => {
	if (dark) {
		return {
			type: actionTypes.DEV_MODE_SET,
		};
	} else {
		return {
			type: actionTypes.PROD_MODE_SET,
		};
	}
};

export const allCommentsStart = () => {
	return {
		type: actionTypes.ALL_COMMENTS_START,
	};
};
export const allCommentsFail = (error) => {
	return {
		type: actionTypes.ALL_COMMENTS_FAIL,
		payload: error,
	};
};
export const allCommentsSuccess = (response) => {
	return {
		type: actionTypes.ALL_COMMENTS_SUCCESS,
	};
};

export const onToastClear = () => {
	return {
		type: actionTypes.TOAST_CLEAR
	}
};

export const onToastSetValue = (payload) => {
	return {
		type: actionTypes.TOAST_SET_VALUE,
		payload: payload
	}
};

export const loadUserStart = () => {
	return {
		type: actionTypes.LOAD_USER_START,
		loading: true
	};
};
export const loadUserSuccess = (response) => {
	return {
		type: actionTypes.LOAD_USER_SUCCESS,
		userList: response,
	};
};
export const loadUserFail = (error) => {
	return {
		type: actionTypes.LOAD_USER_FAIL,
		error: error,
	};
};
export const loadUserCommentsStart = () => {
	return {
		type: actionTypes.LOAD_COMMENTS_START,
	};
};
export const loadUserCommentsSuccess = (response) => {
	return {
		type: actionTypes.LOAD_COMMENTS_SUCCESS,
		commentsList: response,
	};
};
export const loadUserCommentsFail = (error) => {
	return {
		type: actionTypes.LOAD_COMMENTS_FAIL,
		error: error,
	};
};
export const sendNotificationStart = () => {
	return {
		type: actionTypes.SEND_NOTIFICATION_START,
	};
};
export const sendNotificationFail = (error) => {
	return {
		type: actionTypes.SEND_NOTIFICATION_FAIL,
		error: error,
	};
};
export const sendNotificationSuccess = (response) => {
	return {
		type: actionTypes.SEND_NOTIFICATION_SUCCESS,
		message: response,
	};
};
export const userRegistrationStart = () => {
	return {
		type: actionTypes.USER_REGISTRATION_START,
	};
};
export const userRegistrationFail = (error) => {
	return {
		type: actionTypes.USER_REGISTRATION_FAIL,
		error: error,
	};
};
export const userRegistrationSuccess = (response) => {
	return {
		type: actionTypes.USER_REGISTRATION_SUCCESS,
		message: response,
	};
};
export const userDeleteStart = () => {
	return {
		type: actionTypes.USER_DELETE_START,
	};
};
export const userDeleteFail = (error) => {
	return {
		type: actionTypes.USER_DELETE_FAIL,
		error: error,
	};
};
export const userDeleteSuccess = (response) => {
	return {
		type: actionTypes.USER_DELETE_SUCCESS,
		message: response,
		deleted: true,
	};
};
export const loadBlogPosts = (response) => {
	return {
		type: actionTypes.LOAD_BLOG_POSTS,
		payload: response
	}
}
export const loadArchivePosts = (response) => {
	return {
		type: actionTypes.LOAD_ARCHIVE_POSTS,
		payload: response
	}
}
export const updatePostLikes = (data) => {
	return {
		type: actionTypes.UPDATE_POST_LIKES,
		payload: data
	}
}
export const favouritesHandler = (post, action) => {
	const { favouritePosts } = store.getState()?.user;
	const { id: postId } = post;
	let newList = [...favouritePosts];

	switch (action) {
		case 'ADD':
			isEmpty(favouritePosts)
				? newList = [post]
				: newList.push(post)

			break;
		case 'REMOVE':
			var filtered = favouritePosts.filter((item) => item.id !== postId);
			newList = filtered;
			break;
		default:
			break;
	}

	return {
		type: actionTypes.SET_FAVOURITES,
		payload: newList
	}
}

export const setUserToken = (payload) => {
	return {
		type: actionTypes.LOGIN,
		payload: payload
	}
}


export const onLogout = () => {
	return {
		type: actionTypes.LOGOUT,
	}
}

export const savePost = (post) => {
	const { list } = store.getState()?.posts;
	let newList = [...list];
	post['id'] = Date.now();
	isEmpty(list)
		? newList = [post]
		: newList.push(post)

	return {
		type: actionTypes.SAVE_POST,
		payload: newList,
	};
}

export const setSession = (session) => ({
	type: actionTypes.SET_SESSION,
	payload: session
});

export const clearSession = () => ({
	type: actionTypes.CLEAR_SESSION
});

export const initializeSession = () => async (dispatch) => {
	const { data: { session } } = await supabase.auth.getSession();
	dispatch(setSession(session));

	supabase.auth.onAuthStateChange((_event, session) => {
		dispatch(setSession(session));
	});
};