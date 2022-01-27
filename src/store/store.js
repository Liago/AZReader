import { persistStore, persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createBrowserHistory } from "history";
import { applyMiddleware, createStore } from "redux";
import { routerMiddleware, connectRouter } from "connected-react-router";
import logger from "redux-logger";
import thunk from "redux-thunk";

import createRootReducer from "./reducers";

const persistConfig = {
	key: 'root',
	storage: storage
};

const history = createBrowserHistory();
const persistedReducer = persistCombineReducers(persistConfig, {
	router: connectRouter(history),
	...createRootReducer
});
const store = createStore(persistedReducer, applyMiddleware(routerMiddleware(history), thunk, logger));
const persistor = persistStore(store);

export { history, store, persistor }