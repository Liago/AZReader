import { persistStore, persistCombineReducers } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createBrowserHistory } from "history";
import { applyMiddleware, createStore, Middleware, Store, Dispatch } from "redux";
import { routerMiddleware, connectRouter, RouterState } from "connected-react-router";
import thunk, { ThunkMiddleware } from "redux-thunk";
import createRootReducer, { RootState as BaseRootState } from "./reducers";
import { AnyAction } from "redux";
import { PersistConfig } from "redux-persist/es/types";

export interface RootState extends BaseRootState {
	router: RouterState;
}

const archiveReducer = (state: any[] = [], action: AnyAction) => state;
const loadingReducer = (state: boolean = false, action: AnyAction) => state;
const errorReducer = (state: null = null, action: AnyAction) => state;

const persistConfig: PersistConfig<RootState> = {
	key: "root",
	storage,
	blacklist: ["router"],
};

const history = createBrowserHistory();

const middlewares: ThunkMiddleware<RootState>[] = [routerMiddleware(history) as ThunkMiddleware<RootState>, thunk as ThunkMiddleware<RootState>];

// Aggiungi redux-logger solo in development
if (process.env.NODE_ENV === "development") {
	const { createLogger } = require("redux-logger");
	const logger = createLogger({
		collapsed: true,
		duration: true,
		timestamp: false,
		diff: true, // Mostra le differenze tra stati
		colors: {
			title: () => "#139BFE",
			prevState: () => "#9E9E9E",
			action: () => "#149945",
			nextState: () => "#A47104",
		},
	});
	middlewares.push(logger as ThunkMiddleware<RootState>);
}

const persistedReducer = persistCombineReducers<RootState>(persistConfig, {
	...createRootReducer,
	router: connectRouter(history),
	archive: archiveReducer,
	loading: loadingReducer,
	error: errorReducer,
});

const store = createStore(persistedReducer, applyMiddleware(...middlewares)) as Store<RootState>;

const persistor = persistStore(store);

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;

export { history, store, persistor };
