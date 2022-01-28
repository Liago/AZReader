import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, IonImg, IonList, IonModal, IonPage, IonRefresher, IonRefresherContent, IonSearchbar, IonTitle, IonToolbar, useIonViewWillEnter } from "@ionic/react";
import MessageListItem from "../components/MessageListItem";
import { close, pulse, saveOutline } from "ionicons/icons";

import { getArticledParsed } from "../store/rest";

import { getMessages } from "../data/messages";
import "./Home.css";
import { savePost } from "../store/actions";

const Home = () => {
	const dispatch = useDispatch()
	const [messages, setMessages] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);

	const pageRef = useRef();

	useEffect(() => {
		const msgs = getMessages();
		setMessages(msgs);
	}, []);

	const refresh = (e) => {
		setTimeout(() => {
			e.detail.complete();
		}, 3000);
	};
	useEffect(() => {
		if (searchText === '') return;
		console.log('searchText', searchText);

		parseArticle()
	}, [searchText])

	useEffect(() => {
		if (loading || !articleParsed) return;

		console.log('articleParsed', articleParsed);
	}, [loading])

	const renderArticle = () => {
		if (!articleParsed) return;

		const { title, content, lead_image_url } = articleParsed;

		return (
			<IonCard>
				<IonImg src={lead_image_url} />
				<IonCardHeader>
					<IonCardSubtitle>{title}</IonCardSubtitle>
					<IonCardTitle></IonCardTitle>
				</IonCardHeader>

				<IonCardContent>
					<div dangerouslySetInnerHTML={{ __html: content }}></div>
				</IonCardContent>
			</IonCard>
		)
	}

	const savePostHandler = () => {
		dispatch(savePost(articleParsed))
	}

	return (
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Inbox</IonTitle>
					<IonButtons slot="primary">
						<IonButton
							color="dark"
							onClick={() => setShowModal(true)}
						>
							<IonIcon slot='icon-only' icon={pulse} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={refresh}>
					<IonRefresherContent></IonRefresherContent>
				</IonRefresher>

				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Inbox</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonList>
					{messages.map((m) => (
						<MessageListItem key={m.id} message={m} />
					))}
				</IonList>
				<IonModal
					isOpen={showModal}
					swipeToClose={true}
					presentingElement={pageRef.current || undefined}
				>
					<IonContent>
						<IonPage>
							<IonHeader>
								<IonToolbar>
									<IonTitle>Post parser</IonTitle>
									<IonButtons slot="end">
										<IonButton
											color='dark'
											onClick={savePostHandler}
										>
											<IonIcon slot='icon-only' icon={saveOutline} />
										</IonButton>
										<IonButton onClick={() => setShowModal(false)}>
											<IonIcon slot="icon-only" icon={close} />
										</IonButton>
									</IonButtons>
								</IonToolbar>
							</IonHeader>
							<IonContent fullscreen>
								<IonSearchbar
									animated
									value={searchText}
									placeholder="Url articolo"
									debounce={1000}
									onIonChange={(e) => setSearchText(e.detail.value)}
								>
								</IonSearchbar>
								{renderArticle()}
							</IonContent>
						</IonPage>
					</IonContent>
				</IonModal>
			</IonContent >
		</IonPage >
	);
};

export default Home;
