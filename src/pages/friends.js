import { FriendsCards } from './../components/cards/friendsCards';
import { useEffect, useState } from "react";
import { IonBackButton, IonButtons, IonContent, IonHeader, IonList, IonMenuButton, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { getUsersList } from "../common/requests/users";
import { saveShareRequestToFirestore } from "../common/requests/share";

const FriendsPage = () => {
	const [userList, setUserList] = useState([]);

	useEffect(() => {
		fetchUsersList()
	}, [])

	const fetchUsersList = async () => {
		const response = await getUsersList()
		setUserList(response)
	}

	const onAskFriendship = () => {
		saveShareRequestToFirestore(
			{
				"requestBy": "andrea zampierolo"
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