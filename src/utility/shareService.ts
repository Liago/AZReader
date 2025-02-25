import { Share } from "@capacitor/share";
import { PlatformHelper } from "./platform-helper";

export interface ShareOptions {
	title?: string;
	text?: string;
	url?: string;
	dialogTitle?: string;
}

export class ShareService {
	/**
	 * Condivide contenuti utilizzando le API native del dispositivo quando disponibili
	 * altrimenti utilizza l'API Web Share se supportata
	 *
	 * @param options Opzioni di condivisione
	 * @returns Promise che risolve a true se la condivisione è avvenuta con successo
	 */
	static async share(options: ShareOptions): Promise<boolean> {
		try {
			// Se siamo su un dispositivo mobile, usa Capacitor Share
			if (PlatformHelper.isNative()) {
				await Share.share({
					title: options.title,
					text: options.text,
					url: options.url,
					dialogTitle: options.dialogTitle,
				});

				// In Capacitor 7, consideriamo la condivisione riuscita se non viene generato un errore
				return true;
			}
			// Altrimenti, prova a usare Web Share API se disponibile
			else if (navigator.share) {
				const shareData: any = {};
				if (options.title) shareData.title = options.title;
				if (options.text) shareData.text = options.text;
				if (options.url) shareData.url = options.url;

				await navigator.share(shareData);
				return true;
			}
			// Fallback: copia URL negli appunti o mostra un messaggio
			else {
				console.log("Web Share API non supportata in questo browser");
				return false;
			}
		} catch (error) {
			console.error("Errore durante la condivisione:", error);
			return false;
		}
	}

	/**
	 * Controlla se la funzionalità di condivisione è disponibile sulla piattaforma corrente
	 *
	 * @returns Promise che risolve a true se la condivisione è disponibile
	 */
	static async canShare(): Promise<boolean> {
		if (PlatformHelper.isNative()) {
			return true; // Capacitor Share è sempre disponibile su dispositivi nativi
		} else {
			return typeof navigator.share === "function";
		}
	}

	/**
	 * Condivide un articolo utilizzando le opzioni formattate
	 *
	 * @param title Titolo dell'articolo
	 * @param url URL dell'articolo
	 * @param excerpt Estratto o descrizione dell'articolo
	 * @returns Promise che risolve a true se la condivisione è avvenuta con successo
	 */
	static async shareArticle(title: string, url: string, excerpt?: string): Promise<boolean> {
		const text = excerpt ? `${excerpt.substring(0, 100)}${excerpt.length > 100 ? "..." : ""}` : "Ho trovato questo articolo interessante";

		return this.share({
			title: title,
			text: text,
			url: url,
			dialogTitle: "Condividi questo articolo",
		});
	}
}
