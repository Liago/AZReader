import React, { useEffect, useState } from "react";
import { IonContent, IonPage, useIonRouter } from "@ionic/react";
import { supabase } from "@store/rest";

const AuthConfirmPage: React.FC = () => {
	console.log("AuthConfirmPage renderizzato");
	console.log("URL corrente:", window.location.href);

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useIonRouter();

	useEffect(() => {
		const handleAuth = async () => {
			try {
				console.log("handleAuth eseguito");
				const searchParams = new URLSearchParams(window.location.search);
				const token_hash = searchParams.get("token_hash");
				const typeParam = searchParams.get("type");

				console.log("Params trovati:", { token_hash, type: typeParam });

				if (!token_hash || !typeParam) {
					console.log("Parametri mancanti");
					setError("Parametri di autenticazione mancanti");
					setIsLoading(false);
					return;
				}

				// Convertiamo il tipo in un valore valido per Supabase
				const type = typeParam === "magiclink" ? "email" : typeParam;

				console.log("Tentativo di verifica OTP con Supabase");
				const { data, error: verifyError } = await supabase.auth.verifyOtp({
					token_hash,
					type: type as "email", // Forziamo il tipo a 'email' per magic link
				});

				if (verifyError) {
					console.error("Errore Supabase:", verifyError);
					throw verifyError;
				}

				console.log("Verifica completata con successo:", data);
				setIsLoading(false);
				router.push("/", "root", "replace");
			} catch (err) {
				console.error("Errore durante l'autenticazione:", err);
				setError(err instanceof Error ? err.message : "Errore durante l'autenticazione");
				setIsLoading(false);
			}
		};

		handleAuth();
	}, [router]);

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
