import { useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { App as CapApp, URLOpenListenerEvent } from '@capacitor/app';

/**
 * Component to handle Capacitor deep link listeners
 * Must be inside IonReactRouter to access useIonRouter
 */
const AppUrlListener: React.FC = () => {
	const router = useIonRouter();

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

		let urlListener: Awaited<ReturnType<typeof CapApp.addListener>>;
		let stateListener: Awaited<ReturnType<typeof CapApp.addListener>>;

		const setupListeners = async () => {
			urlListener = await CapApp.addListener('appUrlOpen', handleAppUrlOpen);

			// Log when the app becomes active
			stateListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
				if (isActive) {
					console.log('App has become active');
				}
			});
		};

		setupListeners();

		return () => {
			// Clean up listeners when component unmounts
			urlListener?.remove();
			stateListener?.remove();
		};
	}, [router]);

	return null; // This component doesn't render anything
};

export default AppUrlListener;
