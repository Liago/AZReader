import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";

import { FriendsCards } from '../components/cards/friends/friendsCards';
import { getUsersList } from "../common/requests/users";

import { onSetRequestFromMe, onSetSharingRequests } from "../store/actions";
import { getRequestsList, saveShareRequestToFirestore, updateShareRequest } from "../common/requests/share";

import { generateUniqueId } from "../utility/utils";

import moment from "moment";
import { filter, isNil } from "lodash";

const FriendsPage = () => {
	const dispatch = useDispatch();
	const [userList, setUserList] = useState([]);
	const { user } = useSelector(state => state.user?.credentials);

	useEffect(() => fetchAllRequests(), [user])

	const fetchUsersList = async () => {
		const response = await getUsersList()
		let list = filter(response, item => item.uuid !== user.id);
		setUserList(list)
	}

	const fetchAllRequests = async () => {
		const response = await getRequestsList();
		console.log('fetchAllRequests :>> ', response);
		fetchRequestToMe(response);
		fetchRequestFromMe(response);
		fetchUsersList()
	}

	const onAskFriendship = async (askToEmail, askToUuid) => {
		await saveShareRequestToFirestore(
			{
				"requestId": generateUniqueId(),
				"requestFrom": {
					"email": user.mail,
					"uuid": user.id,
				},
				"requestTo": {
					"email": askToEmail,
					"uuid": askToUuid
				},
				"status": null,
				"sentOn": moment().unix(),
				"acceptedOn": null,
				"refusedOn": null,
			}
		)
		fetchAllRequests();
	}

	const actionsRequest = async (requestId, status) => {
		const payload = status
			? { status: status, acceptedOn: moment().unix() }
			: { status: status, refusedOn: moment().unix() }

		await updateShareRequest(requestId, payload)
		fetchAllRequests();
	}

	const fetchRequestToMe = (response) => {
		let requestToMe = filter(response, item => item.requestTo.uuid === user.id);
		isNil(requestToMe)
			? onSetSharingRequests([])
			: dispatch(onSetSharingRequests(requestToMe))
	}

	const fetchRequestFromMe = (response) => {
		let requestFromMe = filter(response, item => item.requestFrom.uuid === user.id);
		isNil(requestFromMe)
			? dispatch(onSetRequestFromMe([]))
			: dispatch(onSetRequestFromMe(requestFromMe))
	}

	const renderUserList = () => {
		if (!userList) return;

		return userList.map((user, i) => {
			return (
				<FriendsCards
					key={i}
					onAskFriendship={onAskFriendship}
					onActionRequest={actionsRequest}
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
					<IonTitle>Readers list</IonTitle>
					<IonButtons slot="start">
						<IonBackButton text="back" defaultHref="/home"></IonBackButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Readers list</IonTitle>
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