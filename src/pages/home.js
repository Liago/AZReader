import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonList, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar, useIonModal } from "@ionic/react";
import { eyeSharp, powerOutline, pulse, umbrellaSharp } from "ionicons/icons";

import MessageListItem from "../components/messageListItem";
import ModalParser from "../components/modalParser";
import AuthenticationForm from "../components/form/auth";

import { onLogout, savePost } from "../store/actions";
import { getArticledParsed, getPostFromDb, savePostToDb } from "../store/rest";

import "./Home.css";

import { isEmpty } from "lodash";

const Home = () => {
	const dispatch = useDispatch();
	const { list } = useSelector(state => state.posts);
	const { isLogged } = useSelector(state => state.user);
	const [showModal, setShowModal] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [parseArticle, { data: articleParsed, loading }] = getArticledParsed(searchText);
	const [save, { data: postSaved, error }] = savePostToDb();
	const [getPosts, { data: postFromDb }] = getPostFromDb()

	const pageRef = useRef();

	const handleDismiss = () => dismiss();

	const [present, dismiss] = useIonModal(AuthenticationForm, {
		mode: 'SIGNIN',
		onDismiss: handleDismiss,
		breakpoints: [0.1, 0.5, 1],
		initialBreakpoint: 0.5,
	});


	const refresh = (e) => {
		setTimeout(() => {
			e.detail.complete();
		}, 3000);
	};
	useEffect(() => {
		if (searchText === '') return;

		parseArticle();
	}, [searchText])

	const savePostHandler = () => {
		dispatch(savePost(articleParsed))
	}

	const savePostToServer = () => {
		save(articleParsed)
	}

	const renderPostList = () => {
		if (isEmpty(list)) return;

		return list.map((item, i) => <MessageListItem key={i} post={item} />)
	}
	const fetchPostsFromDb = () => {
		getPosts()
	}
	const renderModalParser = () => {
		const modalProps = { articleParsed, showModal, pageRef, savePostHandler, setShowModal, searchText, setSearchText, savePostToServer }

		return <ModalParser {...modalProps} />
	}

	const renderLoginLogout = () => {
		if (isLogged)
			return (
				<IonButton
					color="dark"
					onClick={() => dispatch(onLogout())}
				>
					<IonIcon slot='icon-only' icon={powerOutline} />
				</IonButton>
			)

		return (
			<IonButton
				color="dark"
				onClick={() => present()}
			>
				<IonIcon slot='icon-only' icon={umbrellaSharp} />
			</IonButton>
		)
	}

	return (
		<IonPage id="home-page" ref={pageRef}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Articoli</IonTitle>
					<IonButtons slot="primary">
						{renderLoginLogout()}
						<IonButton
							color="dark"
							onClick={() => setShowModal(true)}
						>
							<IonIcon slot='icon-only' icon={pulse} />
						</IonButton>
						<IonButton
							color="dark"
							onClick={() => fetchPostsFromDb()}
						>
							<IonIcon slot='icon-only' icon={eyeSharp} />
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
				{renderModalParser()}
			</IonContent >
		</IonPage >
	);
};

export default Home;
