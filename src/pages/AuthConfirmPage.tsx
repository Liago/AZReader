import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { IonContent, IonPage, useIonRouter } from "@ionic/react";

import { supabase } from "@store/rest";

const AuthConfirmPage: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useIonRouter();
	const location = useLocation();

	useEffect(() => {
		const verifyToken = async () => {
			const searchParams = new URLSearchParams(location.search);
			const token = searchParams.get("token_hash");

			if (!token) {
				setError("Token mancante nell'URL");
				setIsLoading(false);
				return;
			}

			try {
				const { error } = await supabase.auth.verifyOtp({
					token_hash: token,
					type: "email",
				});

				if (error) throw error;

				// Autenticazione riuscita
				setIsLoading(false);
				// Reindirizza l'utente alla homepage o al dashboard
				router.push("/", "root", "replace");
			} catch (err) {
				setError(err instanceof Error ? err.message : "Si è verificato un errore durante la verifica");
				setIsLoading(false);
			}
		};

		verifyToken();
	}, [location, router]);

	return (
		<IonPage>
			<IonContent className="ion-padding">
				<div className="flex flex-col justify-center items-center h-full">
					{isLoading && <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>}

					{error && (
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
							<strong className="font-bold">Errore di Autenticazione</strong>
							<span className="block sm:inline"> {error}</span>
						</div>
					)}

					{!isLoading && !error && (
						<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
							<strong className="font-bold">Autenticazione Completata</strong>
							<span className="block sm:inline"> Stai per essere reindirizzato...</span>
						</div>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
};

export default AuthConfirmPage;
