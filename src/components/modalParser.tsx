import React, { useCallback, useRef, useEffect, useState } from "react";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSearchbar, IonTitle, IonToolbar, IonAlert } from "@ionic/react";
import { ErrorBoundary } from "react-error-boundary";
import { close, saveOutline, shareSocial, clipboard } from "ionicons/icons";
import Spinner from "./ui/spinner";
import Article from "./article";
import { isValidUrl } from "@utility/utils";
import { isNil } from "lodash";

type ModalParserProps = {
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
};

const ModalParser: React.FC<ModalParserProps> = ({
	articleParsed,
	showModal,
	pageRef,
	savePostHandler,
	setShowModal,
	searchText,
	setSearchText,
	savePostToServer,
	loading,
	isParsing,
}) => {
	const contentRef = useRef<HTMLIonContentElement>(null);
	const [isClosing, setIsClosing] = useState(false);
	const [shouldRender, setShouldRender] = useState(true);
	const [showClipboardAlert, setShowClipboardAlert] = useState(false);
	const [clipboardContent, setClipboardContent] = useState("");

	// Funzione per leggere dalla clipboard
	const readFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (isValidUrl(text)) {
				setClipboardContent(text);
				setShowClipboardAlert(true);
			}
		} catch (err) {
			console.error("Failed to read clipboard:", err);
		}
	};

	// Leggi dalla clipboard all'apertura della modale
	useEffect(() => {
		if (showModal && !searchText) {
			readFromClipboard();
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
		}, 50);
	}, [setShowModal, setSearchText]);

	useEffect(() => {
		if (showModal) {
			setShouldRender(true);
			setIsClosing(false);
		}
	}, [showModal]);

	useEffect(() => {
		return () => {
			if (contentRef.current) {
				contentRef.current.innerHTML = "";
			}
		};
	}, []);

	const renderContent = () => {
		if (isClosing || !shouldRender) return null;
		return (
			<IonContent ref={contentRef}>
				<IonPage>
					<IonHeader>
						<IonToolbar>
							<IonTitle slot="start">Post parser</IonTitle>
							<IonButtons slot="start">
								{/* <IonButton disabled={isNil(articleParsed) || searchText === ""} color="dark" onClick={savePostHandler}>
									<IonIcon slot="icon-only" icon={saveOutline} />
								</IonButton> */}
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
									onIonChange={(e) => {
										const value = e?.detail?.value || "";
										if (isValidUrl(value)) {
											setSearchText(value);
										}
									}}
								/>
								<IonButton expand="block" fill="clear" onClick={readFromClipboard}>
									<IonIcon slot="start" icon={clipboard} />
									Incolla dalla clipboard
								</IonButton>
							</div>
						)}
						{isParsing && searchText && <Spinner />}
						{articleParsed && searchText && !isParsing && (
							<Article
								articleParsed={articleParsed}
								onDismiss={() => setSearchText("")}
								displayFrom="modalPreview"
								postId={articleParsed.id || ""}
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
								setSearchText(clipboardContent);
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
