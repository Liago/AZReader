import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
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

interface AppUrlOpenListenerEvent {
	url: string;
}

interface AppStateChangeListenerEvent {
	isActive: boolean;
}

setupIonicReact();

const App: React.FC = () => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const router = useIonRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
			setCurrentUser(user);
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		// Nel useEffect di App.tsx
		const urlOpenListener = CapApp.addListener("appUrlOpen", async (event: AppUrlOpenListenerEvent) => {
			const { url } = event;
			console.log("Deep link opened:", url);

			if (url.startsWith("azreader://auth/confirm")) {
				try {
					// Converti l'URL da schema custom a http
					const customUrl = new URL(url);
					console.log("Custom URL parsed:", customUrl);

					// Estrai i parametri dall'URL originale
					const token_hash = customUrl.searchParams.get("token_hash");
					const type = customUrl.searchParams.get("type");

					console.log("Extracted params:", { token_hash, type });

					if (token_hash && type) {
						// Costruisci il nuovo URL per la navigazione interna
						const internalUrl = `/auth/confirm?token_hash=${token_hash}&type=${type}`;
						console.log("Navigating to internal URL:", internalUrl);

						// Forza la navigazione usando window.location
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
		<Provider store={store}>
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
		</Provider>
	);
};

export default App;
