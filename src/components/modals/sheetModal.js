import { IonButton, IonContent, IonModal } from "@ionic/react"
import { getCollection } from "../../common/firestore"

export const SheetModal = ({ children, showModal, setShowModal }) => {

	const test = () => {
		console.log('click')
		getCollection()
			.then(response => {
				console.log('response', response)
			})
	}

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

				{/* <div>
					<IonButton
					onClick={test}
					>click me</IonButton>
				</div> */}
			</IonContent>
		</IonModal >
	)
}