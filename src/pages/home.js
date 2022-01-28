import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from "@ionic/react";
import { pulse } from "ionicons/icons";

import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";

import { savePost } from "../store/actions";
import { getArticledParsed } from "../store/rest";

import "./Home.css";

import { isEmpty } from "lodash";

const Home = () => {
	const dispatch = useDispatch();
	const { list } = useSelector(state => state.posts);
	const [messages, setMessages] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);

	const pageRef = useRef();

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

	const savePostHandler = () => {
		dispatch(savePost(articleParsed))
	}
	const renderPostList = () => {
		if (isEmpty(list)) return;

		return (
			list.map((item, i) => (
				<MessageListItem key={i} post={item} />
			))
		)
	}

	return (
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Articoli</IonTitle>
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
						<IonTitle size="large">Articoli</IonTitle>
					</IonToolbar>
				</IonHeader>

				<IonList>
					{renderPostList()}
				</IonList>
				<ModalParser  {...{ articleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText }} />
			</IonContent >
		</IonPage >
	);
};

export default Home;
