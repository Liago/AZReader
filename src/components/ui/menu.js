import { useSelector } from "react-redux";
import { IonButton, IonContent, IonHeader, IonMenu, IonTitle, IonToolbar } from "@ionic/react";

import moment from "moment";
import MiniCards from "../cards/miniCards";
import { batchEditing } from "../../common/firestore";

const renderAdminMenu = () => {
	return (
		<IonButton
		onClick={() => batchEditing()}
		>
			Imposta batch
		</IonButton>
	)
}

const MainMenu = () => {
	const { credentials } = useSelector(state => state.user);
	const lastLogin = moment(credentials.last_sign_in_at).format('DD/MM/YY HH:mm');

	

	const renderUserInfo = () => {
		return (
			<>
				<h2 className="font-semibold">{credentials.email}</h2>
				<p className="mt-2 text-sm text-gray-500">Last login {lastLogin}</p>
			</>
		)
	}

	return (
		<IonMenu contentId="home-page">
			<IonHeader>
				<IonToolbar>
					<IonTitle>AZ Reader</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" color="light">
				<MiniCards>{renderUserInfo()}</MiniCards>
				<MiniCards>
					{renderAdminMenu()}
				</MiniCards>
			</IonContent>
		</IonMenu>
	)
}
export default MainMenu;