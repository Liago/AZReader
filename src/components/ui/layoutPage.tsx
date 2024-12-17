import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react"

const LayoutPage = ({ children }: { children: React.ReactNode }, props: any) => {
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