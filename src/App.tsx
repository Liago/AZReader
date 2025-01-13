import { useEffect } from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@store/store";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { App as CapApp } from "@capacitor/app";
import Home from "@pages/home";
import ViewMessage from "@pages/viewMessage";
import AuthConfirmPage from "@pages/AuthConfirmPage";
import VerifyEmail from "@pages/verifyEmail";
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

interface AppUrlOpenListenerEvent {
	url: string;
}

interface AppStateChangeListenerEvent {
	isActive: boolean;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	console.log("ErrorFallback rendered:", error);
	return (
		<div
			style={{
				padding: 20,
				background: "#fff",
				color: "#000",
			}}
		>
			<h1>Qualcosa è andato storto:</h1>
			<pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
			<button onClick={resetErrorBoundary}>Riprova</button>
		</div>
	);
}

setupIonicReact({
	mode: "ios",
});

const AppContent: React.FC = () => {
	const dispatch = useDispatch();

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
		<IonApp>
			<IonRouterOutlet>
				<Route path="/home" component={Home} exact />
				<Route path="/auth/confirm" component={AuthConfirmPage} exact />
				<Route path="/article/:id" component={ViewMessage} exact />
				<Route path="/verify-email" component={VerifyEmail} exact />
				<Route path="/" exact render={() => <Redirect to="/home" />} />
				<Route render={() => <Redirect to="/home" />} />
			</IonRouterOutlet>
		</IonApp>
	);
};

const App: React.FC = () => {
	console.log("App component rendering...");
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error("Error caught by boundary:", error)}>
			<Provider store={store}>
				<PersistGate loading={<div>Loading...</div>} persistor={persistor}>
					<IonReactRouter>
						<AppContent />
					</IonReactRouter>
				</PersistGate>
			</Provider>
		</ErrorBoundary>
	);
};

export default App;
