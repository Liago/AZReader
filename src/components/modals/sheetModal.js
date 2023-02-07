import { IonContent, IonModal } from "@ionic/react"

export const SheetModal = ({ children, showModal, setShowModal }) => {

	return (
		<IonModal
			isOpen={showModal}
			initialBreakpoint={0.5}
			breakpoints={[0.5]}
			onDidDismiss={() => setShowModal(false)}
			>
			<IonContent
				className="ion-padding bg-indigo-500"
			>
				{children}
			</IonContent>
		</IonModal>
	)
}