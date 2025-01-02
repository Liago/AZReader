import { persistStore, persistCombineReducers } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createBrowserHistory } from "history";
import { applyMiddleware, createStore, Middleware, Store, Dispatch } from "redux";
import { routerMiddleware, connectRouter, RouterState } from "connected-react-router";
import { createLogger } from "redux-logger";
import thunk, { ThunkMiddleware } from "redux-thunk";
import createRootReducer, { RootState as BaseRootState } from "./reducers";
import { AnyAction } from "redux";
import { PersistConfig } from "redux-persist/es/types";

// Estendiamo RootState per includere il router
export interface RootState extends BaseRootState {
	router: RouterState;
}

// Definiamo i reducer mancanti
const archiveReducer = (state: any[] = [], action: AnyAction) => state;
const loadingReducer = (state: boolean = false, action: AnyAction) => state;
const errorReducer = (state: null = null, action: AnyAction) => state;

// Configurazione per redux-persist
const persistConfig: PersistConfig<RootState> = {
	key: "root",
	storage: storage,
	blacklist: ["router"],
};

// Creazione della history
const history = createBrowserHistory();

// Creazione del logger con tipizzazione corretta
const loggerMiddleware = createLogger();

// Tipizziamo i middleware individuali
const routerMw = routerMiddleware(history) as ThunkMiddleware<RootState>;
const thunkMw = thunk as ThunkMiddleware<RootState>;
const loggerMw = loggerMiddleware as ThunkMiddleware<RootState>;

// Combiniamo i middleware
const middlewares = [routerMw, thunkMw, loggerMw];

// Creazione del reducer persistente
const persistedReducer = persistCombineReducers<RootState>(persistConfig, {
	...createRootReducer,
	router: connectRouter(history),
	archive: archiveReducer,
	loading: loadingReducer,
	error: errorReducer,
});

// Creazione dello store con i middleware applicati
const store = createStore(persistedReducer, applyMiddleware(...middlewares)) as Store<RootState>;

// Creazione del persistor
const persistor = persistStore(store);

// Esportazione dei tipi per l'uso nell'applicazione
export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;

// Esportazione delle istanze
export { history, store, persistor };