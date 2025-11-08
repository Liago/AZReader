import { Redirect, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";

import { AuthProvider } from "./context";
import AppUrlListener from "@components/AppUrlListener";

import { persistor, store } from "@store/store";

import Home from "@pages/home";
import ViewMessage from "@pages/ViewMessage";
import AuthConfirmPage from "@pages/AuthConfirmPage";
import SeeAllArticlesPage from "@pages/SeeAllArticlesPage";

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
import ProfilePage from "@pages/ProfilePage";

setupIonicReact();

const App: React.FC = () => {
	useEffect(() => {
		// Hide splash screen when app is ready
		const hideSplash = async () => {
			try {
				// Wait a bit for the app to render
				await new Promise(resolve => setTimeout(resolve, 1000));
				await SplashScreen.hide();
			} catch (error) {
				// SplashScreen might not be available in web context
				console.debug('SplashScreen hide error (expected in browser):', error);
			}
		};

		hideSplash();
	}, []);

	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<AuthProvider>
					<IonApp>
						<IonReactRouter>
							<AppUrlListener />
							<IonRouterOutlet>
								<Route path="/" exact={true} component={Home} />
								<Route path="/home" exact={true} component={Home} />
								<Route path="/articles" exact={true} component={SeeAllArticlesPage} />
								<Route path="/article/:id" component={ViewMessage} />
								<Route exact path="/auth/confirm" component={AuthConfirmPage} />
								<Route path="/profile" component={ProfilePage} />
								<Route path="/" exact={true}>
									<Redirect to="/home" />
								</Route>
							</IonRouterOutlet>
						</IonReactRouter>
					</IonApp>
				</AuthProvider>
			</PersistGate>
		</Provider>
	);
};

export default App;
