import React, { useCallback, useRef, useEffect, useState } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSearchbar, IonTitle, IonToolbar, IonAlert } from "@ionic/react";
import { PlatformHelper } from "@utility/platform-helper";
import { ErrorBoundary } from "react-error-boundary";
import { close, saveOutline, shareSocial, clipboard } from "ionicons/icons";
import { Clipboard } from "@capacitor/clipboard";
import Spinner from "./ui/spinner";
import Article from "./article";
import { isValidUrl } from "@utility/utils";
import { isNil } from "lodash";
import { Session } from "@supabase/supabase-js";

interface ModalParserProps {
	articleParsed: any;
	showModal: boolean;
	pageRef: React.RefObject<HTMLElement>;
	savePostHandler: () => void;
	setShowModal: (show: boolean) => void;
	searchText: string;
	setSearchText: (text: string) => void;
	savePostToServer: () => void;
	loading: boolean;
	isParsing: boolean;
	session: Session | null;
}

const noIOSPasteStyles = {
	WebkitTouchCallout: "none",
	WebkitUserSelect: "none",
	KhtmlUserSelect: "none",
	MozUserSelect: "none",
	msUserSelect: "none",
	userSelect: "none",
	touchAction: "manipulation",
	cursor: "pointer",
	pointerEvents: "auto",
} as React.CSSProperties;

const ModalParser: React.FC<ModalParserProps> = ({
	articleParsed,
	showModal,
	savePostHandler,
	setShowModal,
	searchText,
	setSearchText,
	savePostToServer,
	isParsing,
	session
}) => {
	const contentRef = useRef<HTMLIonContentElement>(null);
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(true);
	const [showClipboardAlert, setShowClipboardAlert] = useState(false);
	const [clipboardContent, setClipboardContent] = useState("");
	const [clipboardError, setClipboardError] = useState<string | null>(null);

	// Funzione per pulire l'URL dalla clipboard
	const cleanClipboardUrl = (clipboardValue: string): string => {
		try {
			// Se siamo in ambiente nativo e l'URL contiene caratteri escape
			if (PlatformHelper.isNative() && clipboardValue.includes("\\")) {
				// Rimuove gli escape backslash che iOS aggiunge
				clipboardValue = clipboardValue.replace(/\\/g, "");
			}
			// Decodifica se necessario
			if (clipboardValue.includes("%")) {
				clipboardValue = decodeURIComponent(clipboardValue);
			}
			return clipboardValue;
		} catch (e) {
			console.error("Error cleaning clipboard URL:", e);
			return clipboardValue;
		}
	};

	// Funzione per leggere dalla clipboard usando Capacitor
	const readFromClipboard = async () => {
		try {
			const { value } = await Clipboard.read();
			console.log("Raw clipboard value:", value);

			if (value) {
				const cleanedUrl = cleanClipboardUrl(value);
				console.log("Cleaned URL:", cleanedUrl);

				if (isValidUrl(cleanedUrl)) {
					console.log("URL is valid, proceeding...");
					setClipboardContent(cleanedUrl);
					setShowClipboardAlert(true);
					setClipboardError(null);
				} else {
					console.log("URL is not valid:", cleanedUrl);
					setClipboardError("Il contenuto degli appunti non è un URL valido");
				}
			}
		} catch (err) {
			console.error("Errore durante la lettura della clipboard:", err);
			setClipboardError("Non è stato possibile accedere agli appunti");
		}
	};

	// Leggi dalla clipboard all'apertura della modale
	useEffect(() => {
		if (showModal && !searchText) {
			// Delay per evitare problemi con il balloon di iOS
			const timer = setTimeout(() => {
				readFromClipboard();
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [showModal, searchText]);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		setShouldRender(false);
		setTimeout(() => {
			if (contentRef.current) {
				contentRef.current.innerHTML = "";
			}
			setShowModal(false);
			setSearchText("");
			setIsClosing(false);
			setClipboardError(null);
		}, 50);
	}, [setShowModal, setSearchText]);

	useEffect(() => {
		if (showModal) {
			setShouldRender(true);
			setIsClosing(false);
			setClipboardError(null);
		}
	}, [showModal]);

	useEffect(() => {
		return () => {
			if (contentRef.current) {
				contentRef.current.innerHTML = "";
			}
		};
	}, []);

	// Gestione del cambio URL nella searchbar
	const handleUrlChange = (value: string) => {
		if (!value) {
			setSearchText("");
			return;
		}

		if (isValidUrl(value)) {
			setSearchText(value);
		}
	};

	const renderContent = () => {
		if (isClosing || !shouldRender) return null;
		return (
			<IonContent ref={contentRef}>
				<IonPage>
					<IonHeader>
						<IonToolbar>
							<IonTitle slot="start">Post parser</IonTitle>
							<IonButtons slot="start">
								<IonButton disabled={isNil(articleParsed) || searchText === ""} color="dark" onClick={savePostHandler}>
									<IonIcon slot="icon-only" icon={saveOutline} />
								</IonButton>
								<IonButton disabled={isNil(articleParsed) || searchText === ""} color="dark" onClick={savePostToServer}>
									<IonIcon slot="icon-only" icon={shareSocial} />
								</IonButton>
							</IonButtons>
							<IonButtons slot="end">
								<IonButton onClick={handleClose}>
									<IonIcon slot="icon-only" icon={close} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent fullscreen>
						{!searchText && !showClipboardAlert && (
							<div>
								<IonSearchbar
									animated
									value={searchText}
									placeholder="Url articolo"
									debounce={1000}
									onIonChange={(e) => handleUrlChange(e?.detail?.value || "")}
								/>
								<div style={noIOSPasteStyles}>
									<div
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											readFromClipboard();
										}}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											padding: "10px",
											color: "var(--ion-color-primary)",
											gap: "8px",
										}}
									>
										<IonIcon icon={clipboard} />
										<span>Incolla dalla clipboard</span>
									</div>
								</div>
								{clipboardError && (
									<div
										style={{
											color: "var(--ion-color-danger)",
											textAlign: "center",
											padding: "10px",
											fontSize: "0.9em",
										}}
									>
										{clipboardError}
									</div>
								)}
							</div>
						)}
						{isParsing && searchText && <Spinner />}
						{articleParsed && searchText && !isParsing && (
							<Article
								articleParsed={articleParsed}
								onDismiss={() => setSearchText("")}
								displayFrom="modalPreview"
								postId={articleParsed.id || ""}
								session={session} // Aggiungi la sessione qui
							/>
						)}
					</IonContent>
				</IonPage>

				<IonAlert
					isOpen={showClipboardAlert}
					onDidDismiss={() => setShowClipboardAlert(false)}
					header="URL trovato nella clipboard"
					message={`Vuoi utilizzare questo URL?\n${clipboardContent}`}
					buttons={[
						{
							text: "No",
							role: "cancel",
						},
						{
							text: "Sì",
							handler: () => {
								handleUrlChange(clipboardContent);
								setShowClipboardAlert(false);
							},
						},
					]}
				/>
			</IonContent>
		);
	};

	return (
		<IonModal isOpen={showModal} onDidDismiss={handleClose} onWillDismiss={handleClose} className="article-modal">
			{renderContent()}
		</IonModal>
	);
};

export const ModalParserWithErrorBoundary: React.FC<ModalParserProps> = (props) => (
	<ErrorBoundary fallback={<div>Something went wrong</div>}>
		<ModalParser {...props} />
	</ErrorBoundary>
);

export default ModalParserWithErrorBoundary;
