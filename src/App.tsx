import { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@store/store-rtk";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { App as CapApp } from "@capacitor/app";
import Home from "@pages/home";
import ThemeInitializer from "./components/ui/ThemeInitializer";
import SideMenu from "./components/SideMenu";
import { useScrollPositionCleanup } from "@hooks/useScrollPositionCleanup";
import { AuthProvider } from "@context/auth/AuthContext";

import AuthConfirmPage from "@pages/AuthConfirmPage";
import VerifyEmail from "@pages/verifyEmail";
import DiscoverPage from "@pages/DiscoverPage";
import ActivityFeedPage from "@pages/ActivityFeedPage";
import PersonalizedFeedPage from "@pages/PersonalizedFeedPage";
import ProfilePage from "@pages/ProfilePage";
import InfoPage from "@pages/InfoPage";
import SearchPage from "@pages/SearchPage";
import { supabase } from "@store/rest";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "./theme/variables.css";
import "./css/main.css";
import { XCircleIcon } from "lucide-react";
import ParserHeaderTest from "@pages/Test";
import ViewMessage from "@pages/ViewMessage";
import UnderConstructionPage from './pages/UnderConstructionPage';

interface AppUrlOpenListenerEvent {
	url: string;
}

interface AppStateChangeListenerEvent {
	isActive: boolean;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	console.log("ErrorFallback rendered:", error);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
				<div className="flex items-center justify-center">
					<XCircleIcon className="h-16 w-16 text-red-500" />
				</div>

				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Qualcosa è andato storto</h1>
					<p className="text-gray-600 mb-6">Non preoccuparti, puoi riprovare o tornare alla home</p>
				</div>

				<div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-48">
					<pre className="text-sm text-gray-600 whitespace-pre-wrap break-words font-mono">{error.message}</pre>
				</div>

				<div className="flex flex-col space-y-3">
					<button
						onClick={resetErrorBoundary}
						className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
					>
						<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						<span>Riprova</span>
					</button>

					<button
						onClick={() => (window.location.href = "/")}
						className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors duration-200"
					>
						Torna alla Home
					</button>
				</div>
			</div>
		</div>
	);
}

setupIonicReact({
	mode: "ios",
	swipeBackEnabled: true,
	statusTap: true,
	animated: true,
	hardwareBackButton: true
});

const AppContent: React.FC = () => {
	const dispatch = useDispatch();

	// Initialize scroll position cleanup
	useScrollPositionCleanup({
		retentionDays: 7, // Keep positions for 7 days
		cleanupOnMount: true,
		enableAutoCleanup: true,
	});

	useEffect(() => {
		const setupAuthListener = async () => {
			console.log("Setting up auth state listener...");
			try {
				const {
					data: { subscription },
				} = supabase.auth.onAuthStateChange((event, session) => {
					console.log("Auth state changed:", event);
					if (session) {
						const expiresAt = session.expires_at ?? 0;
						console.log("Nuova sessione:", {
							expires_in: session.expires_in,
							expires_at: expiresAt ? new Date(expiresAt * 1000) : "non definito",
						});
						dispatch({ type: "SET_SESSION", payload: session });
					} else {
						dispatch({ type: "CLEAR_SESSION" });
					}
				});

				return () => {
					console.log("Cleaning up auth state listener...");
					subscription.unsubscribe();
				};
			} catch (error) {
				console.error("Error in auth state setup:", error);
			}
		};

		setupAuthListener();
	}, [dispatch]);

	useEffect(() => {
		const checkSession = async () => {
			try {
				console.log("Verifico la sessione...");
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (error) {
					console.error("Errore nel controllo della sessione:", error);
					dispatch({ type: "CLEAR_SESSION" });
					return;
				}

				if (!session) {
					console.log("Nessuna sessione attiva");
					dispatch({ type: "CLEAR_SESSION" });
					return;
				}

				const now = Date.now() / 1000;
				const expiresAt = session.expires_at ?? 0;
				const timeLeft = Math.floor(expiresAt - now);

				console.log("Stato sessione:", {
					now: new Date(),
					expires_at: expiresAt ? new Date(expiresAt * 1000) : "non definito",
					timeLeft: timeLeft > 0 ? `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : "scaduto",
				});

				if (!expiresAt || now >= expiresAt) {
					console.log("Sessione scaduta, effettuo logout");
					dispatch({ type: "CLEAR_SESSION" });
					await supabase.auth.signOut();
					return;
				}

				console.log("Sessione valida:", {
					expires_in: session.expires_in,
					expires_at: expiresAt ? new Date(expiresAt * 1000) : "non definito",
				});

				dispatch({ type: "SET_SESSION", payload: session });
			} catch (err) {
				console.error("Errore durante il controllo della sessione:", err);
				dispatch({ type: "CLEAR_SESSION" });
			}
		};

		checkSession();
		const sessionInterval = setInterval(checkSession, 60000);

		return () => {
			clearInterval(sessionInterval);
		};
	}, [dispatch]);

	useEffect(() => {
		const setupAppListeners = async () => {
			try {
				const urlOpenListener = await CapApp.addListener("appUrlOpen", async (event: AppUrlOpenListenerEvent) => {
					const { url } = event;
					console.log("Deep link opened:", url);

					if (url.startsWith("azreader://auth/confirm")) {
						try {
							const customUrl = new URL(url);
							console.log("Custom URL parsed:", customUrl);

							const token_hash = customUrl.searchParams.get("token_hash");
							const type = customUrl.searchParams.get("type");

							console.log("Extracted params:", { token_hash, type });

							if (token_hash && type) {
								const internalUrl = `/auth/confirm?token_hash=${token_hash}&type=${type}`;
								console.log("Navigating to internal URL:", internalUrl);
								window.location.href = internalUrl;
							} else {
								console.error("Missing required parameters");
							}
						} catch (error) {
							console.error("Error processing URL:", error);
						}
					}
					// Gestione dei deep link per gli articoli
					else if (url.startsWith("azreader://article/")) {
						try {
							// Estrai l'ID dell'articolo dal deep link
							const articleId = url.replace("azreader://article/", "").split("?")[0];
							console.log("Articolo condiviso con ID:", articleId);

							if (articleId) {
								// Naviga all'articolo
								window.location.href = `/article/${articleId}`;
							} else {
								console.error("ID articolo mancante nel deep link");
							}
						} catch (error) {
							console.error("Errore durante l'elaborazione del deep link dell'articolo:", error);
						}
					}
				});

				const stateChangeListener = await CapApp.addListener("appStateChange", ({ isActive }: AppStateChangeListenerEvent) => {
					if (isActive) {
						console.log("App has become active");
					}
				});

				return () => {
					urlOpenListener.remove();
					stateChangeListener.remove();
				};
			} catch (error) {
				console.error("Error setting up app listeners:", error);
			}
		};

		setupAppListeners();
	}, []);

	console.log("AppContent rendering...");
	return (
		<IonReactRouter>
			<SideMenu />
			<IonRouterOutlet id="main">
				<Route exact path="/home" component={Home} />
				<Route path="/article/:id" component={ViewMessage} />
				<Route exact path="/search" component={SearchPage} />
				<Route exact path="/search/:query" component={SearchPage} />
				<Route exact path="/discover" component={DiscoverPage} />
				<Route exact path="/activity" component={ActivityFeedPage} />
				<Route exact path="/profile" component={ProfilePage} />
				<Route exact path="/info" component={InfoPage} />
				<Route exact path="/following" component={PersonalizedFeedPage} />
				<Route exact path="/auth/confirm" component={AuthConfirmPage} />
				<Route exact path="/verify-email" component={VerifyEmail} />
				<Route exact path="/test" component={ParserHeaderTest} />
				<Route exact path="/view-message" component={ViewMessage} />

				<Route
					exact
					path="/profile"
					render={() => <UnderConstructionPage title="Profilo" />}
				/>
				<Route
					exact
					path="/info"
					render={() => <UnderConstructionPage title="Informazioni" />}
				/>

				<Route
					render={() => <UnderConstructionPage title="Pagina non trovata" />}
				/>

				<Route exact path="/">
					<Redirect to="/home" />
				</Route>
			</IonRouterOutlet>
		</IonReactRouter>
	);
};

const App: React.FC = () => {
	console.log("App component rendering...");
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error("Error caught by boundary:", error)}>
			<Provider store={store}>
				<PersistGate loading={<div>Loading...</div>} persistor={persistor}>
					<AuthProvider>
						<AppContent />
					</AuthProvider>
				</PersistGate>
			</Provider>
		</ErrorBoundary>
	);
};

export default App;
