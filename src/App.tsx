import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Session } from "@supabase/supabase-js";
import { App as CapApp } from "@capacitor/app";
import { AuthProvider } from "@context/auth/authContext";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@common/firestore";
import { persistor, store } from "@store/store";
import Home from "@pages/home";
import ViewMessage from "@pages/viewMessage";
import VerifyEmail from "@pages/verifyEmail";
import AuthConfirmPage from "@pages/AuthConfirmPage";

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
import { supabase } from "@store/rest";

interface AppUrlOpenListenerEvent {
	url: string;
}

interface AppStateChangeListenerEvent {
	isActive: boolean;
}

setupIonicReact();

const AppContent: React.FC = () => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const router = useIonRouter();
	const dispatch = useDispatch();

	useEffect(() => {
		const { data: { subscription }, } = supabase.auth.onAuthStateChange((event, session) => {
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

		return () => subscription.unsubscribe();
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
			clearInterval(sessionInterval);
			subscription.unsubscribe();
		};
	}, [dispatch]);

	useEffect(() => {
		const urlOpenListener = CapApp.addListener("appUrlOpen", async (event: AppUrlOpenListenerEvent) => {
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

		const stateChangeListener = CapApp.addListener("appStateChange", ({ isActive }: AppStateChangeListenerEvent) => {
			if (isActive) {
				console.log("App has become active");
			}
		});

		return () => {
			urlOpenListener.remove();
			stateChangeListener.remove();
		};
	}, [router]);

	return (
		<IonApp>
			<PersistGate loading={null} persistor={persistor}>
				<IonReactRouter>
					<IonRouterOutlet>
						<AuthProvider value={{ currentUser }}>
							<Route path="/auth/confirm" render={() => <AuthConfirmPage />} exact={true} />
							<Route path="/" exact={true} component={Home} />
							<Route path="/home" exact={true} component={Home} />
							<Route path="/article/:id" component={ViewMessage} />
							<Route exact path="/verify-email" component={VerifyEmail} />
							<Route path="/" exact={true}>
								<Redirect to="/home" />
							</Route>
						</AuthProvider>
					</IonRouterOutlet>
				</IonReactRouter>
			</PersistGate>
		</IonApp>
	);
};

const App: React.FC = () => {
	return (
		<Provider store={store}>
			<IonApp>
				<PersistGate loading={null} persistor={persistor}>
					<IonReactRouter>
						<AppContent />
					</IonReactRouter>
				</PersistGate>
			</IonApp>
		</Provider>
	);
};

export default App;
