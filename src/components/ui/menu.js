import { useSelector } from "react-redux";
import { IonContent, IonHeader, IonMenu, IonTitle, IonToolbar } from "@ionic/react";

import moment from "moment";
import MiniCards from "../cards/miniCards";

const MainMenu = () => {
	const { user } = useSelector(state => state.user.credentials);
	const { credentials } = useSelector(state => state.user);
	const lastLogin = moment(user.last_sign_in_at).format('DD/MM/YY HH:mm');



	const renderUserInfo = () => {
		const expires_at = new Date(credentials.expires_at * 1000);
		
		return (
			<>
				<h2 className="font-semibold">{credentials.user.email}</h2>
				<p className="mt-2 text-sm text-gray-500">Last login {lastLogin}</p>
				<p className="mt-2 text-sm text-gray-500">Session expires at <br />{expires_at.toLocaleString()}</p>
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
			</IonContent>
		</IonMenu>
	)
}
export default MainMenu;