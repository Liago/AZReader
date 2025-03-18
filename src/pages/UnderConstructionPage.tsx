import React from 'react';
import {
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonContent,
	IonButtons,
	IonBackButton,
	IonIcon,
} from '@ionic/react';
import { constructOutline } from 'ionicons/icons';

interface Props {
	title?: string;
}

const UnderConstructionPage: React.FC<Props> = ({ title = 'Pagina in costruzione' }) => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/home" />
					</IonButtons>
					<IonTitle>{title}</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
					{/* Icona animata */}
					<div className="relative w-32 h-32 mb-8">
						<div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/20 rounded-full animate-pulse"></div>
						<div className="absolute inset-0 flex items-center justify-center">
							<IonIcon
								icon={constructOutline}
								className="w-16 h-16 text-yellow-500 dark:text-yellow-400"
							/>
						</div>
					</div>

					{/* Testo principale */}
					<h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
						Pagina in costruzione
					</h2>

					<p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
						Stiamo lavorando per offrirti nuove funzionalità.
						Questa sezione sarà presto disponibile!
					</p>

					{/* Barra di progresso stilizzata */}
					<div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
						<div className="h-full bg-yellow-500 dark:bg-yellow-400 rounded-full w-3/4 animate-progress"></div>
					</div>

					<p className="text-sm text-gray-500 dark:text-gray-400">
						Torna presto per scoprire le novità!
					</p>
				</div>
			</IonContent>

			<style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-progress {
          animation: progress 2s linear infinite;
        }
      `}</style>
		</IonPage>
	);
};

export default UnderConstructionPage; 