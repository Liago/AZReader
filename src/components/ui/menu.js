import { useDispatch, useSelector } from "react-redux";
import { IonButton, IonContent, IonHeader, IonMenu, IonTitle, IonToolbar } from "@ionic/react";

import moment from "moment";
import MiniCards from "../cards/miniCards";
import { batchEditing } from "../../common/firestore";
import { onLogout } from "../../store/actions";
import { useEffect, useState } from "react";

const renderAdminMenu = (user) => {
	if (user?.id !== '7815BcDJ1sc7WRqfnbIQfMr7Tmc2') return;

	return (
		<MiniCards>
			<IonButton
				onClick={() => batchEditing()}
			>
				Imposta batch
			</IonButton>
		</MiniCards>
	)
}

const MainMenu = () => {
	const dispatch = useDispatch();
	const { user } = useSelector(state => state?.user?.credentials);
	const { tokenApp, tokenExpiration } = useSelector(state => state.app);
	const lastLogin = moment(parseInt(user?.meta?.lastLoginAt)).format('DD/MM/GG HH:mm');
	

	const renderUserInfo = () => {
		if (!tokenApp) return;

		return (
			<>
				<h2 className="font-semibold">{user?.mail}</h2>
				<p className="mt-2 text-sm text-gray-500">Last login {lastLogin}</p>
			</>
		)
	}
	const [remainingMinutes, setRemainingMinutes] = useState()

	const calculateToken = () => {
		const currentTime = moment().unix();
		const _remainingMinutes = moment.duration(tokenExpiration - currentTime, 'seconds').minutes();

		if (_remainingMinutes < 0)
			dispatch(onLogout())

		setRemainingMinutes(_remainingMinutes);
	}

	useEffect(() => {
		if (!tokenExpiration) return;

		const comInterval = setInterval(calculateToken, 60000);
		return () => clearInterval(comInterval)
	}, [tokenExpiration])

	const renderTokenExpiration = () => {
		if (!tokenExpiration)
			return <span>Sessione locale.</span>

		return <span className="text-xs font-[lato]">Scadenza sessione: {remainingMinutes} minuti</span>
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
				{renderAdminMenu(user)}
				<div className="py-3">
				{renderTokenExpiration()}
				</div>
			</IonContent>
		</IonMenu>
	)
}
export default MainMenu;