import React from 'react';
import {
	IonPage,
	IonContent,
	IonButton,
	IonIcon,
	useIonRouter,
} from '@ionic/react';
import { home, refreshOutline } from 'ionicons/icons';

const ErrorPage: React.FC<{ message?: string }> = ({ message }) => {
	const router = useIonRouter();

	const handleBackToHome = () => {
		router.push('/home', 'root', 'replace');
	};

	return (
		<IonPage>
			<IonContent className="ion-padding">
				<div className="min-h-screen flex items-center justify-center">
					<div className="text-center px-4">
						{/* Illustrazione di errore */}
						<div className="mb-8 relative">
							<div className="w-48 h-48 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
								<div className="text-6xl font-bold text-red-500 dark:text-red-400">
									404
								</div>
							</div>
							<div className="absolute -bottom-4 w-full">
								<div className="w-24 h-2 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full blur-sm"></div>
							</div>
						</div>

						{/* Testo di errore */}
						<h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
							Oops! Qualcosa è andato storto
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-8">
							{message || 'La pagina che stai cercando non è disponibile o si è verificato un errore.'}
						</p>

						{/* Pulsanti di azione */}
						<div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
							<IonButton
								color="primary"
								className="w-full sm:w-auto"
								onClick={handleBackToHome}
							>
								<IonIcon icon={home} slot="start" />
								Torna alla Home
							</IonButton>

							<IonButton
								fill="outline"
								color="medium"
								className="w-full sm:w-auto"
								onClick={() => window.location.reload()}
							>
								<IonIcon icon={refreshOutline} slot="start" />
								Ricarica la pagina
							</IonButton>
						</div>

						{/* Suggerimento aggiuntivo */}
						<p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
							Se il problema persiste, contatta il supporto tecnico
						</p>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default ErrorPage; 