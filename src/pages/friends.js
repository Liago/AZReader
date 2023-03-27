import { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";

import { FriendsCards } from './../components/cards/friendsCards';
import { getUsersList } from "../common/requests/users";

import { saveShareRequestToFirestore } from "../common/requests/share";

import moment from "moment";
import { filter } from "lodash";

const FriendsPage = () => {
	const [userList, setUserList] = useState([]);
	const { user } = useSelector(state => state.user?.credentials);

	useEffect(() => fetchUsersList(), [])

	const fetchUsersList = async () => {
		const response = await getUsersList()
		let list = filter(response, item => item.uuid !== user.id);
		setUserList(list)
	}

	const onAskFriendship = (askToEmail, askToUuid) => {
		saveShareRequestToFirestore(
			{
				"requestBy": {
					"email": user.mail,
					"uuid": user.id,
				},
				"requestTo": {
					"email": askToEmail,
					"uuid": askToUuid
				},
				"status": false,
				"sentOn": moment().unix(),
				"acceptedOn": null,
				"refusedOn": null,
			}
		)
	}

	const renderUserList = () => {
		if (!userList) return;

		return userList.map((user, i) => {
			return (
				<FriendsCards
					key={i}
					onAskFriendship={onAskFriendship}
					{...user}
				/>
			)
		})
	}

	return (
		<IonPage id="view-message-page">
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonMenuButton></IonMenuButton>
					</IonButtons>
					<IonTitle>Friends list</IonTitle>
					<IonButtons slot="start">
						<IonBackButton text="back" defaultHref="/home"></IonBackButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Friends list</IonTitle>
					</IonToolbar>
				</IonHeader>
				<div className="flex flex-col gap-5">
					{renderUserList()}
				</div>
			</IonContent>
		</IonPage>
	)
}
export default FriendsPage;