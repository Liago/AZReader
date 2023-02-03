import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react"

const LayoutPage = ({ children }, props) => {
	console.log('title :>> ', props);
	return (
		<IonContent>
			<IonPage>
				<IonHeader>
					<IonToolbar>
						<IonTitle>{}</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen>
					{children}
				</IonContent>
			</IonPage>
		</IonContent>
	)
} 

export default LayoutPage;