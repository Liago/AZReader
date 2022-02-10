import { IonButton, IonButtons, IonContent, IonModal, IonPage, IonSearchbar, IonToolbar } from "@ionic/react"

const ModalTags = ({ showModal, setShowModal, savePostHandler }) => {

	const renderTags = () => {
		return <div>tag</div>
	}

	return (
		<IonModal
			isOpen={showModal}
			breakpoints={[0.1, 0.5, 1]}
			initialBreakpoint={0.5}
			onDidDismiss={() => setShowModal(false)}
		>
			<IonContent>
				<IonPage>
					<IonToolbar>
						<IonButtons>
							<IonButton>

							</IonButton>
						</IonButtons>
					</IonToolbar>
					<IonContent fullscreen>
						<IonSearchbar
							animated
							className="py-10"
							// value={searchText}
							placeholder="cerca un tag o inseriscine uno nuovo"
							debounce={1000}
						// onIonChange={(e) => setSearchText(e.detail.value)}
						>
						</IonSearchbar>
						{renderTags()}
					</IonContent>
				</IonPage>
			</IonContent>
		</IonModal>
	)
}
export default ModalTags;