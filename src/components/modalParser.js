import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonPage, IonSearchbar, IonTitle, IonToolbar } from "@ionic/react"
import { close, saveOutline } from "ionicons/icons";
import Article from "./article";

const ModalParser = ({ articleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText }) => {

	const renderArticle = () => {
		if (!articleParsed) return;

		return <Article articleParsed={articleParsed} />
	}

	return (
		<IonModal
			isOpen={showModal}
			swipeToClose={true}
			presentingElement={pageRef.current || undefined}
		>
			<IonContent>
				<IonPage>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Post parser</IonTitle>
							<IonButtons slot="end">
								<IonButton
									color='dark'
									onClick={savePostHandler}
								>
									<IonIcon slot='icon-only' icon={saveOutline} />
								</IonButton>
								<IonButton onClick={() => setShowModal(false)}>
									<IonIcon slot="icon-only" icon={close} />
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent fullscreen>
						<IonSearchbar
							animated
							value={searchText}
							placeholder="Url articolo"
							debounce={1000}
							onIonChange={(e) => setSearchText(e.detail.value)}
						>
						</IonSearchbar>
						{renderArticle()}
					</IonContent>
				</IonPage>
			</IonContent>
		</IonModal>
	)
}
export default ModalParser;