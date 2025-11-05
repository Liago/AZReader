import { useEffect, useState } from "react";
import { Redirect, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { IonApp, IonRouterOutlet, setupIonicReact, useIonRouter } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { App as CapApp, URLOpenListenerEvent } from '@capacitor/app';
import type { User } from "firebase/auth";

import { AuthProvider } from "@context/auth/authContext";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@common/firestore";

import { persistor, store } from "@store/store";

import Home from "@pages/home";
import ViewMessage from "@pages/viewMessage";
import VerifyEmail from "@pages/verifyEmail";
import AuthConfirmPage from "@pages/AuthConfirmPage";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./css/main.css";

setupIonicReact();

const App: React.FC = () => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const router = useIonRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user)
		})
		return () => unsubscribe();
	}, [])

	useEffect(() => {
		const handleAppUrlOpen = async (event: URLOpenListenerEvent) => {
			const { url } = event;
			console.log('Deep link opened:', url);

			if (url.startsWith('azreader://auth/confirm')) {
				console.log('Routing to /auth/confirm');
				router.push('/auth/confirm', 'root', 'replace');
			} else {
				console.log('Unhandled deep link:', url);
			}
		};

		const urlListener = CapApp.addListener('appUrlOpen', handleAppUrlOpen);

		// Add this block to log when the app is ready
		const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
			if (isActive) {
				console.log('App has become active');
			}
		});

		return () => {
			// Clean up listeners when component unmounts
			urlListener.remove();
			stateListener.remove();
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
								<Route exact path="/auth/confirm" component={AuthConfirmPage}/>
								<Route path="/" exact={true}>
									<Redirect to="/home" />
								</Route>
							</AuthProvider>
						</IonRouterOutlet>
					</IonReactRouter>
				</PersistGate>
			</IonApp>
		</Provider>
	)

};

export default App;
