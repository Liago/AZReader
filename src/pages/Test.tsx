import React, { useState } from "react";
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonInput,
	IonItem,
	IonLabel,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToolbar,
	IonSelect,
	IonSelectOption,
} from "@ionic/react";
import axios from "axios";
import { endpoint } from "@config/environment";

const TestParserCorretto: React.FC = () => {
	const [testUrl, setTestUrl] = useState<string>("https://www.example.com");
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// URL di esempio per test
	const urlEsempio = [
		{ label: "Example.com", url: "https://www.example.com" },
		{ label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
		{ label: "BBC News", url: "https://www.bbc.com/news" },
		{ label: "CNN", url: "https://www.cnn.com" },
		{ label: "GitHub", url: "https://github.com/about" },
	];

	// Test con header x-requested-with
	const testParser = async () => {
		setIsLoading(true);
		setResult(null);
		setError(null);

		try {
			const encodedUrl = encodeURIComponent(testUrl);
			const parserUrl = `${endpoint.parser}/parser?url=${encodedUrl}`;

			console.log("Chiamata parser a:", parserUrl);
			console.log("Con URL codificato:", encodedUrl);
			

			const response = await axios.get(parserUrl, {
				headers: {
					"x-requested-with": "XMLHttpRequest",
					Accept: "application/json",
				},
			});

			console.log("Risposta completa:", response);

			setResult({
				status: response.status,
				statusText: response.statusText,
				data: response.data,
			});
		} catch (err: any) {
			console.error("Errore nel test parser:", err);
			setError(`Errore: ${err.message}${err.response ? ` (${err.response.status}: ${err.response.statusText})` : ""}`);

			// Se c'è una risposta, mostriamola comunque
			if (err.response) {
				setResult({
					status: err.response.status,
					statusText: err.response.statusText,
					data: err.response.data,
				});
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Test Parser (Corretto)</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>URL da testare</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem>
							<IonLabel position="stacked">URL</IonLabel>
							<IonInput value={testUrl} onIonChange={(e) => setTestUrl(e.detail.value || "")} placeholder="Inserisci URL da testare" />
						</IonItem>

						<IonItem className="mt-2">
							<IonLabel>Seleziona URL di esempio:</IonLabel>
							<IonSelect interface="action-sheet" onIonChange={(e) => setTestUrl(e.detail.value)} placeholder="Seleziona...">
								{urlEsempio.map((item, index) => (
									<IonSelectOption key={index} value={item.url}>
										{item.label}
									</IonSelectOption>
								))}
							</IonSelect>
						</IonItem>

						<IonButton expand="block" onClick={testParser} disabled={isLoading} className="mt-4">
							{isLoading ? <IonSpinner name="dots" /> : "Testa Parser"}
						</IonButton>

						<div className="mt-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
							<h4 className="font-bold">Note importanti:</h4>
							<ul className="list-disc pl-5 mt-2">
								<li>Alcuni siti bloccano lo scraping con un errore 403</li>
								<li>Non possiamo impostare l'header 'origin' manualmente (viene bloccato dal browser)</li>
								<li>Usiamo solo 'x-requested-with' che è consentito</li>
							</ul>
						</div>
					</IonCardContent>
				</IonCard>

				{error && (
					<IonCard className="ion-margin-top">
						<IonCardHeader>
							<IonCardTitle color="danger">Errore</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<p>{error}</p>
						</IonCardContent>
					</IonCard>
				)}

				{result && (
					<IonCard className="ion-margin-top">
						<IonCardHeader>
							<IonCardTitle>
								Risultato - Status: {result.status} {result.statusText}
							</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
								<pre>{JSON.stringify(result.data, null, 2)}</pre>
							</div>
						</IonCardContent>
					</IonCard>
				)}
			</IonContent>
		</IonPage>
	);
};

export default TestParserCorretto;
