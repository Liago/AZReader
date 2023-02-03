import { Redirect, Route } from "react-router-dom";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store";


import Home from "./pages/home";
import ViewMessage from "./pages/viewMessage";
import VerifyEmail from "./pages/verifyEmail";

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
import { AuthProvider } from "./components/auth/authContext";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./common/firestore";

setupIonicReact();


const App = () => {
	const [currentUser, setCurrentUser] = useState(null)

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			setCurrentUser(user)
		})
	}, [])

	return (
		<Provider store={store}>
			<IonApp>
				<PersistGate loading={null} persistor={persistor}>
					<IonReactRouter>
						<IonRouterOutlet>
							<AuthProvider value={{ currentUser }}>
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
	)

};

export default App;
