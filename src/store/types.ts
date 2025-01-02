// types.ts
import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";

export interface Post {
	id: string | number;
	[key: string]: any;
}

export interface RootState {
	app: {
		darkMode: boolean;
		devMode: boolean;
		notificationSegment: string;
		tokenApp: null;
		tokenExpiration: null;
	};
	archive: any[];
	user: {
		isLogged: boolean;
		credentials: any[];
		userList: any[];
		favouritePosts: Post[];
	};
	toast: null;
	posts: {
		list: Post[];
		pagination: {
			currentPage: number;
			itemsPerPage: number;
			totalItems: number;
		};
	};
	loading: boolean;
	error: null;
}

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;
