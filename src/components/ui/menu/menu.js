import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IonButton, IonContent, IonHeader, IonIcon, IonMenu, IonTitle, IonToolbar, useIonRouter } from "@ionic/react";
import { logInOutline, powerOutline } from "ionicons/icons";

import MiniCards from "../../cards/miniCards";
import ActionList from './actionList';
import AddUserMenu from './admin/addUserMenu';

import { batchEditing } from "../../../common/firestore";
import { saveUserToFirestore } from "../../../common/requests/users";
import { onLogout, onSetFeedType } from "../../../store/actions";

import moment from "moment";

import usersData from '../../../config/mockup/users.json'

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

const renderAddUserMenuItem = (user, addUsersHandler) => {
	if (user?.id !== '7815BcDJ1sc7WRqfnbIQfMr7Tmc2') return;
	
	return <AddUserMenu addUsers={addUsersHandler} />
}


const MainMenu = ({ isLogged, showModalLogin }) => {
	const dispatch = useDispatch();
	const router = useIonRouter();
	const { user } = useSelector(state => state?.user?.credentials);
	const { tokenApp, tokenExpiration } = useSelector(state => state.app);
	const lastLogin = moment(parseInt(user?.meta?.lastLoginAt)).format('DD/MM/GG HH:mm');
	const [remainingMinutes, setRemainingMinutes] = useState()


	const renderUserInfo = () => {
		if (!tokenApp) return;

		return (
			<>
				<h2 className="font-semibold text-xs">{user?.mail}</h2>
				<p className="mt-2 text-xs text-gray-500">Last login {lastLogin}</p>
			</>
		)
	}

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

	const onSetFeedHandler = (type) => dispatch(onSetFeedType(type))

	const addUsersHandler = () => {
		usersData.users.map(item => {
			saveUserToFirestore(item).then(response => {
				console.log('response :>> ', response);
			})
				.catch(err => {
					console.log('err :>> ', err);
				})
		})

	}

	const searchFriendsHandler = () => {
		router.push('/friends')
	}

	const renderActionList = () => {
		if (!isLogged) return;

		return <ActionList
			onSetFeedHandler={onSetFeedHandler}
			renderAddUserMenuItem={renderAddUserMenuItem}
			user={user}
			addUsers={addUsersHandler}
			onSearchFriends={searchFriendsHandler}
		/>
	}

	const renderLoginLogout = () => {

		if (isLogged)
			return (
				<IonButton
					color="danger"
					size="small"
					className="mt-4"
					onClick={() => dispatch(onLogout())}
				>
					<IonIcon slot='icon-only' icon={powerOutline} />
				</IonButton>
			)

		return (
			<IonButton
				color="medium"
				onClick={showModalLogin}
			>
				<IonIcon slot='icon-only' icon={logInOutline} />
			</IonButton>
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
				<div className="flex flex-col gap-3">
					<MiniCards>
						<div className="text-right">
							{renderUserInfo()}
							{renderLoginLogout()}
						</div>
					</MiniCards>
					{renderAdminMenu(user)}
				</div>
				<div className="py-3">
					{renderTokenExpiration()}
				</div>
				<div className="pt-6">
					{renderActionList()}
				</div>
			</IonContent>
		</IonMenu>
	)
}

export default MainMenu;