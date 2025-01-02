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

// Components
import Home from "@pages/home";
import ViewMessage from "@pages/viewMessage";
import VerifyEmail from "@pages/verifyEmail";
import AuthConfirmPage from "@pages/AuthConfirmPage";

// Ionic CSS
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

// Theme
import "./theme/variables.css";
import "./css/main.css";

// Types
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

	// Firebase auth listener
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
			setCurrentUser(user);
		});

		return () => unsubscribe();
	}, []);

	// Capacitor deep linking and app state
	useEffect(() => {
		const urlOpenListener = CapApp.addListener("appUrlOpen", async (event: AppUrlOpenListenerEvent) => {
			const { url } = event;
			console.log("Deep link opened:", url);

			if (url.startsWith("azreader://auth/confirm")) {
				console.log("Routing to /auth/confirm");
				router.push("/auth/confirm", "root", "replace");
			} else {
				console.log("Unhandled deep link:", url);
			}
		});

		const stateChangeListener = CapApp.addListener("appStateChange", ({ isActive }: AppStateChangeListenerEvent) => {
			if (isActive) {
				console.log("App has become active");
			}
		});

		return () => {
			// Cleanup listeners
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
								<Route path="/" exact={true} component={Home} />
								<Route path="/home" exact={true} component={Home} />
								<Route path="/article/:id" component={ViewMessage} />
								<Route exact path="/verify-email" component={VerifyEmail} />
								<Route exact path="/auth/confirm" component={AuthConfirmPage} />
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
